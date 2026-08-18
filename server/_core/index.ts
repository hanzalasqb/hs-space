import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { sdk } from "./sdk";
import { streamLLM } from "./llm";
import { createAdminRouteToken, getAdminTokenExpiry, hashAdminRouteToken, validateAdminRouteCredentials } from "../adminAuth";
import { addAuditLog, consumePasswordResetToken, createAdminSession, createLocalUser, createPasswordResetToken, createUserSession, getUserByEmail, getUserByUsername, revokeAdminSession, revokeUserSession, updateUserProfile } from "../db";
import { createLocalSessionToken, hashPassword, localSessionExpiry, verifyPassword } from "../localAuth";
import { createHash, randomBytes } from "node:crypto";
import { sendMockPasswordResetEmail } from "../mockEmail";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.post("/api/auth/signup", async (req, res) => {
    const { username, password, name, email } = req.body || {};
    const normalizedUsername = typeof username === "string" ? username.trim().toLowerCase() : "";
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (normalizedUsername.length < 3 || typeof password !== "string" || password.length < 8 || !normalizedEmail.includes("@")) return res.status(400).json({ error: "Enter a valid email, a username with at least 3 characters, and a password with at least 8 characters." });
    if (await getUserByEmail(normalizedEmail)) return res.status(409).json({ error: "An account with this email already exists. Use Login or Forgot password." });
    try { const userId = await createLocalUser({ username: normalizedUsername, passwordHash: hashPassword(password), name: typeof name === "string" ? name.trim() : undefined, email: normalizedEmail }); await addAuditLog({ targetUserId: userId, action: "signup_requested", metadata: { loginMethod: "local" } }); return res.status(201).json({ success: true, approvalStatus: "pending" }); } catch { return res.status(409).json({ error: "That username is already registered." }); }
  });
  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body || {};
    const user = typeof username === "string" ? await getUserByUsername(username.trim().toLowerCase()) : undefined;
    if (!user || !user.passwordHash || !verifyPassword(String(password || ""), user.passwordHash)) { await addAuditLog({ targetUserId: user?.id ?? null, action: "login_failed", metadata: { reason: "invalid_credentials" } }); return res.status(401).json({ error: "Invalid username or password." }); }
    if (user.approvalStatus !== "approved" || !user.accessEnabled) { await addAuditLog({ targetUserId: user.id, action: "login_denied", metadata: { approvalStatus: user.approvalStatus } }); return res.status(403).json({ error: user.permissionMessage || (user.approvalStatus === "pending" ? "Your account is waiting for admin approval." : user.approvalStatus === "blocked" ? "Your account is blocked. Contact an administrator." : "Your account access was declined by an administrator."), approvalStatus: user.approvalStatus }); }
    const token = createLocalSessionToken();
    await createUserSession(createHash("sha256").update(token).digest("hex"), user.id, localSessionExpiry());
    await addAuditLog({ targetUserId: user.id, action: "login_success", metadata: { loginMethod: "local" } });
    res.setHeader("Set-Cookie", `hs_user_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${localSessionExpiry() - Math.floor(Date.now() / 1000)}`);
    return res.json({ success: true });
  });
  app.post("/api/auth/forgot-password", async (req, res) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    if (!email.includes("@")) return res.status(400).json({ error: "Enter the email used for your account." });
    const account = await getUserByEmail(email);
    await addAuditLog({ targetUserId: account?.id ?? null, action: "password_reset_requested", metadata: { accountFound: Boolean(account) } });
    if (!account || !account.passwordHash) return res.json({ success: true, message: "If an account exists for this email, recovery instructions will be provided." });
    const rawToken = randomBytes(32).toString("hex");
    const expiresAt = Math.floor(Date.now() / 1000) + 15 * 60;
    await createPasswordResetToken(createHash("sha256").update(rawToken).digest("hex"), account.id, expiresAt);
    const resetUrl = `${req.protocol}://${req.get("host")}/reset-password?token=${rawToken}`;
    const emailResult = sendMockPasswordResetEmail(email, resetUrl);
    return res.json({ success: true, message: "A mock recovery email was generated. The preview link expires in 15 minutes.", previewUrl: emailResult.previewUrl });
  });
  app.post("/api/auth/reset-password", async (req, res) => {
    const token = typeof req.body?.token === "string" ? req.body.token : "";
    const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";
    if (!/^[a-f0-9]{64}$/.test(token) || newPassword.length < 8) return res.status(400).json({ error: "Use a valid reset link and a password with at least 8 characters." });
    const reset = await consumePasswordResetToken(createHash("sha256").update(token).digest("hex"));
    if (!reset) return res.status(400).json({ error: "This reset link is invalid, expired, or already used." });
    await updateUserProfile(reset.userId, { passwordHash: hashPassword(newPassword) });
    await addAuditLog({ targetUserId: reset.userId, action: "password_reset_completed", metadata: { method: "mock_email" } });
    return res.json({ success: true });
  });
  app.post("/api/auth/logout", async (req, res) => {
    const token = req.headers.cookie?.split(";").map((part) => part.trim()).find((part) => part.startsWith("hs_user_session="))?.split("=")[1];
    if (token) await revokeUserSession(createHash("sha256").update(token).digest("hex"));
    res.setHeader("Set-Cookie", "hs_user_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0");
    return res.json({ success: true });
  });
  app.post("/api/private-admin-login", async (req, res) => {
    const { username, password } = req.body || {};
    if (!validateAdminRouteCredentials(String(username || ""), String(password || ""))) return res.status(401).json({ error: "Invalid credentials" });
    const token = createAdminRouteToken();
    await createAdminSession(hashAdminRouteToken(token), getAdminTokenExpiry());
    await addAuditLog({ actorUserId: 0, action: "admin_login_success", metadata: { route: "/admin12-34" } });
    res.setHeader("Set-Cookie", `hs_admin_route=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600`);
    return res.json({ success: true });
  });
  app.post("/api/private-admin-logout", async (req, res) => {
    const token = req.headers.cookie?.split(";").map((part) => part.trim()).find((part) => part.startsWith("hs_admin_route="))?.split("=")[1];
    if (token) { await revokeAdminSession(hashAdminRouteToken(token)); await addAuditLog({ actorUserId: 0, action: "admin_logout", metadata: { route: "/admin12-34" } }); }
    res.setHeader("Set-Cookie", "hs_admin_route=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0");
    return res.json({ success: true });
  });
  app.post("/api/ai/stream", async (req, res) => {
    try {
      const { user } = await createContext({ req, res } as any);
      if (!user || (user.role !== "admin" && (user.approvalStatus !== "approved" || !user.accessEnabled))) return res.status(403).json({ error: "Account approval required" });
      const upstream = await streamLLM({ model: req.body.model, messages: req.body.messages });
      if (!upstream.ok || !upstream.body) return res.status(upstream.status).send(await upstream.text());
      res.status(200).set({ "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
      const reader = upstream.body.getReader();
      req.on("close", () => void reader.cancel());
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    } catch (error) {
      if (!res.headersSent) res.status(500).json({ error: error instanceof Error ? error.message : "Streaming failed" });
      else res.end();
    }
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
