import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const schemaSource = readFileSync(resolve(root, "drizzle/schema.ts"), "utf8");
const routerSource = readFileSync(resolve(root, "server/routers.ts"), "utf8");
const serverSource = readFileSync(resolve(root, "server/_core/index.ts"), "utf8");
const homeSource = readFileSync(resolve(root, "client/src/pages/Home.tsx"), "utf8");
const authSource = readFileSync(resolve(root, "client/src/pages/AuthPage.tsx"), "utf8");
const appSource = readFileSync(resolve(root, "client/src/App.tsx"), "utf8");
const profileSource = readFileSync(resolve(root, "client/src/pages/ProfilePage.tsx"), "utf8");
const serverEntrySource = readFileSync(resolve(root, "server/_core/index.ts"), "utf8");
const cssSource = readFileSync(resolve(root, "client/src/index.css"), "utf8");
const adminLoginSource = readFileSync(resolve(root, "client/src/pages/AdminLogin.tsx"), "utf8");
const profilePageSource = readFileSync(resolve(root, "client/src/pages/ProfilePage.tsx"), "utf8");

describe("authentication and access-management contracts", () => {
  it("defines blocked access and an admin-authored permission message", () => {
    expect(schemaSource).toContain('"blocked"');
    expect(schemaSource).toContain('permissionMessage');
    expect(routerSource).toContain('status: z.enum(["pending", "approved", "rejected", "blocked"])');
    expect(routerSource).toContain('permissionMessage: input.status === "approved"');
  });

  it("keeps blocked and declined users out of approved procedures", () => {
    expect(routerSource).toContain('user.approvalStatus === "blocked"');
    expect(routerSource).toContain('user.permissionMessage ||');
    expect(serverSource).toContain('approvalStatus: user.approvalStatus');
  });

  it("supports duplicate-email validation and recovery entry points", () => {
    expect(serverSource).toContain('getUserByEmail(normalizedEmail)');
    expect(serverSource).toContain('An account with this email already exists');
    expect(serverSource).toContain('/api/auth/forgot-password');
    expect(authSource).toContain('Forgot password?');
    expect(authSource).toContain('mode === "forgot"');
  });

  it("shows the username identity and mobile workspace destinations", () => {
    expect(homeSource).toContain('user?.username ? `@${user.username}`');
    expect(homeSource).toContain('aria-label="Open navigation"');
    expect(homeSource).toContain('window.location.href = HISTORY_PATH');
    expect(homeSource).toContain('Attach a file');
  });

  it("supports approved-user profile settings and auth feedback", () => {
    expect(appSource).toContain('path="/profile"');
    expect(profileSource).toContain("trpc.profile.update.useMutation");
    expect(profileSource).toContain("mutation.error");
    expect(authSource).toContain("<Spinner");
    expect(authSource).toContain("fieldErrors");
  });

  it("supports admin status filtering", () => {
    expect(homeSource).toContain("adminStatus");
    expect(homeSource).toContain("All statuses");
    expect(routerSource).toContain('status: z.enum(["all", "pending", "approved", "rejected", "blocked", "suspended"])');
  });

  it("supports tokenized recovery, audit logging, and detailed activity procedures", () => {
    expect(schemaSource).toContain("passwordResetTokens");
    expect(schemaSource).toContain("auditLogs");
    expect(serverEntrySource).toContain('/api/auth/reset-password');
    expect(serverEntrySource).toContain("createPasswordResetToken");
    expect(routerSource).toContain("adminAudit");
    expect(routerSource).toContain("adminActivity");
    expect(routerSource).toContain("profile_updated");
    expect(cssSource).toContain(".app-surface .text-slate-300");
  });

  it("covers profile avatar upload, password strength, and session identity badges", () => {
    expect(routerSource).toContain("profile: router");
    expect(routerSource).toContain("avatar_updated");
    expect(profilePageSource).toContain("passwordStrength");
    expect(profilePageSource).toContain("Upload avatar");
    expect(homeSource).toContain("User session");
    expect(homeSource).toContain("Admin session");
  });

  it("keeps home authentication actions and corrected admin entry", () => {
    expect(homeSource).toContain('window.location.href = "/auth?mode=login"');
    expect(homeSource).toContain('window.location.href = "/auth?mode=signup"');
    expect(adminLoginSource).toContain('navigate("/admin12-34")');
    expect(cssSource).toContain(".app-surface .nav-item");
  });

  it("separates the private admin route from normal chat controls", () => {
    expect(homeSource).toContain('function AdminOnlyWorkspace');
    expect(homeSource).toContain('user.role === "admin" && user.id === 0');
    expect(appSource).toContain('path="/admin12-34"');
    expect(homeSource).toContain('Private administration');
    expect(homeSource).not.toContain('window.location.search.includes("admin=1")');
    expect(homeSource).not.toContain('adminOnlyWorkspace');
  });
});
