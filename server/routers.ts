import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { invokeLLM, listLLMModels } from "./_core/llm";
import { storagePut } from "./storage";
import { addAuditLog, createConversation, createProject, createAdminSession, deleteConversation, deleteProject, getAdminUsage, getAllUsers, getConversation, getDb, getUsage, getUsersPage, getUserByUsername, listActiveSessions, listAdminSessions, listAuditLogs, listConversations, listConversationsForUser, listProjects, listUsageForUser, listUserSessionsForAdmin, recordUsage, revokeAdminSession, revokeUserSession, saveAttachment, saveConversation, updateUserAccess, updateUserProfile } from "./db";
import { hashPassword, verifyPassword } from "./localAuth";
import { conversations } from "../drizzle/schema";
import { and, desc, eq } from "drizzle-orm";
import { revokeSessionByKind } from "./sessionRevocation";

const allowedAttachmentMimeTypes = new Set([
  "application/pdf", "application/json", "application/xml", "application/zip", "application/x-7z-compressed", "application/x-rar-compressed", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "text/plain", "text/markdown", "text/csv", "text/html", "text/css", "text/javascript", "application/javascript", "image/png", "image/jpeg", "image/webp", "image/gif", "audio/mpeg", "audio/wav", "audio/mp4", "video/mp4", "video/webm"
]);

export function isSupportedAttachmentMimeType(mimeType: string) { return allowedAttachmentMimeTypes.has(mimeType); }

const configuredModels = [
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", capability: "General reasoning" },
  { id: "claude-sonnet-4-6", name: "Claude Sonnet", provider: "Anthropic", capability: "Long context" },
  { id: "gemini-2.5-pro", name: "Gemini Pro", provider: "Google", capability: "Multimodal" },
  { id: "gpt-5", name: "GPT-5", provider: "OpenAI", capability: "Advanced reasoning" },
];

const approvedProcedure = protectedProcedure.use(({ ctx, next }) => {
  const user = ctx.user;
  if (user.role !== "admin" && (user.approvalStatus !== "approved" || !user.accessEnabled)) {
    const reason = user.permissionMessage || (user.approvalStatus === "pending" ? "Your account is waiting for administrator approval." : user.approvalStatus === "blocked" ? "Your account is blocked. Contact an administrator." : "Your account access was declined by an administrator.");
    throw new TRPCError({ code: "FORBIDDEN", message: reason });
  }
  return next();
});

const onlyAdminProcedure = adminProcedure;

export function withAttachmentContext(messages: Array<{ role: "system" | "user" | "assistant"; content: string }>, attachments: string[]) {
  if (!attachments.length) return messages;
  const suffix = `\n\n[Attached files]\n${attachments.map((url) => `- ${url}`).join("\n")}`;
  const lastUserIndex = [...messages].map((message) => message.role).lastIndexOf("user");
  if (lastUserIndex < 0) return messages;
  return messages.map((message, index) => index === lastUserIndex ? { ...message, content: `${message.content}${suffix}` } : message);
}

function getTextContent(content: unknown) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map((part) => (typeof part === "object" && part && "text" in part ? String(part.text) : "")).join("");
  return "";
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  profile: router({
    avatar: approvedProcedure.input(z.object({ fileName: z.string().min(1).max(160), mimeType: z.string().regex(/^image\/(png|jpeg|jpg|webp|gif)$/), sizeBytes: z.number().int().positive().max(5 * 1024 * 1024), base64: z.string().min(1) })).mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.base64, "base64");
      const stored = await storagePut(`${ctx.user.id}-avatars/${Date.now()}-${input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-")}`, buffer, input.mimeType);
      await updateUserProfile(ctx.user.id, { avatarUrl: stored.url });
      await addAuditLog({ actorUserId: ctx.user.id, targetUserId: ctx.user.id, action: "avatar_updated", metadata: { mimeType: input.mimeType, sizeBytes: input.sizeBytes } });
      return { url: stored.url };
    }),
    update: approvedProcedure.input(z.object({ username: z.string().trim().min(3).max(80).regex(/^[a-zA-Z0-9_.-]+$/).optional(), currentPassword: z.string().min(1).optional(), newPassword: z.string().min(8).max(200).optional() })).mutation(async ({ ctx, input }) => {
      if (!input.username && !input.newPassword) throw new TRPCError({ code: "BAD_REQUEST", message: "Enter a new username or password." });
      if (input.username && input.username.toLowerCase() !== (ctx.user.username || "").toLowerCase()) {
        const existing = await getUserByUsername(input.username.toLowerCase());
        if (existing && existing.id !== ctx.user.id) throw new TRPCError({ code: "CONFLICT", message: "That username is already in use." });
      }
      if (input.newPassword) {
        if (!input.currentPassword || !ctx.user.passwordHash || !verifyPassword(input.currentPassword, ctx.user.passwordHash)) throw new TRPCError({ code: "UNAUTHORIZED", message: "Current password is incorrect." });
      }
      await updateUserProfile(ctx.user.id, { ...(input.username ? { username: input.username.toLowerCase() } : {}), ...(input.newPassword ? { passwordHash: hashPassword(input.newPassword) } : {}) });
      await addAuditLog({ actorUserId: ctx.user.id, targetUserId: ctx.user.id, action: "profile_updated", metadata: { usernameChanged: Boolean(input.username), passwordChanged: Boolean(input.newPassword) } });
      return { success: true };
    }),
  }),
  adminSessions: router({
    list: onlyAdminProcedure.query(() => listActiveSessions()),
    revoke: onlyAdminProcedure.input(z.object({ tokenHash: z.string().length(64), kind: z.enum(["admin", "user"]) })).mutation(async ({ ctx, input }) => { await revokeSessionByKind(input.kind, input.tokenHash, { admin: revokeAdminSession, user: revokeUserSession }); await addAuditLog({ actorUserId: ctx.user.id, action: "session_revoked", metadata: { kind: input.kind } }); return { success: true }; }),
  }),
  adminHistory: router({
    byUser: onlyAdminProcedure.input(z.object({ userId: z.number() })).query(({ input }) => listConversationsForUser(input.userId)),
  }),
  adminAudit: router({
    list: onlyAdminProcedure.query(() => listAuditLogs(150)),
  }),
  adminActivity: router({
    byUser: onlyAdminProcedure.input(z.object({ userId: z.number() })).query(async ({ input }) => {
      const [sessions, usage, conversations] = await Promise.all([listUserSessionsForAdmin(input.userId), listUsageForUser(input.userId), listConversationsForUser(input.userId)]);
      return { sessions, usage, conversations };
    }),
  }),
  users: router({
    list: onlyAdminProcedure.input(z.object({ search: z.string().default(""), status: z.enum(["all", "pending", "approved", "rejected", "blocked", "suspended"]).default("all"), page: z.number().int().min(1).default(1), pageSize: z.number().int().min(5).max(50).default(10) }).default(() => ({ search: "", status: "all" as const, page: 1, pageSize: 10 }))).query(({ input }) => getUsersPage(input)),
    setStatus: onlyAdminProcedure.input(z.object({ id: z.number(), status: z.enum(["pending", "approved", "rejected", "blocked"]), message: z.string().max(500).optional() })).mutation(async ({ ctx, input }) => {
      await updateUserAccess(input.id, { approvalStatus: input.status, accessEnabled: input.status === "approved", permissionMessage: input.status === "approved" ? null : (input.message?.trim() || null) });
      await addAuditLog({ actorUserId: ctx.user.id, targetUserId: input.id, action: "permission_updated", metadata: { status: input.status, hasMessage: Boolean(input.message?.trim()) } });
      return { success: true };
    }),
    setAccess: onlyAdminProcedure.input(z.object({ id: z.number(), enabled: z.boolean() })).mutation(async ({ ctx, input }) => {
      await updateUserAccess(input.id, { accessEnabled: input.enabled, approvalStatus: input.enabled ? "approved" : "suspended" });
      await addAuditLog({ actorUserId: ctx.user.id, targetUserId: input.id, action: "access_toggled", metadata: { enabled: input.enabled } });
      return { success: true };
    }),
    setRole: onlyAdminProcedure.input(z.object({ id: z.number(), role: z.enum(["admin", "user"]) })).mutation(async ({ ctx, input }) => {
      await updateUserAccess(input.id, { role: input.role });
      await addAuditLog({ actorUserId: ctx.user.id, targetUserId: input.id, action: "role_updated", metadata: { role: input.role } });
      return { success: true };
    }),
  }),
  models: router({
    list: approvedProcedure.query(async () => {
      try {
        const response = await listLLMModels();
        return response.data.length ? response.data.map((model) => ({ ...model, label: model.id })) : configuredModels;
      } catch {
        return configuredModels;
      }
    }),
  }),
  conversations: router({
    list: approvedProcedure.query(({ ctx }) => listConversations(ctx.user.id)),
    get: approvedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      const row = await getConversation(ctx.user.id, input.id);
      return row ? { ...row, messages: JSON.parse(row.messages) } : null;
    }),
    create: approvedProcedure.input(z.object({ title: z.string().min(1).max(200), model: z.string(), projectId: z.number().optional() })).mutation(({ ctx, input }) => createConversation(ctx.user.id, input.title, input.model, input.projectId)),
    update: approvedProcedure.input(z.object({ id: z.number(), title: z.string().optional(), model: z.string().optional(), messages: z.array(z.object({ role: z.enum(["system", "user", "assistant"]), content: z.string() })).optional(), projectId: z.number().nullable().optional() })).mutation(async ({ ctx, input }) => {
      const { id, messages, ...rest } = input;
      await saveConversation(ctx.user.id, id, { ...rest, messages: messages ? JSON.stringify(messages) : undefined });
      return { success: true };
    }),
    delete: approvedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await deleteConversation(ctx.user.id, input.id);
      return { success: true };
    }),
  }),
  projects: router({
    list: approvedProcedure.query(({ ctx }) => listProjects(ctx.user.id)),
    create: approvedProcedure.input(z.object({ name: z.string().min(1).max(160), description: z.string().optional() })).mutation(({ ctx, input }) => createProject(ctx.user.id, input.name, input.description)),
    delete: approvedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await deleteProject(ctx.user.id, input.id);
      return { success: true };
    }),
  }),
  ai: router({
    chat: approvedProcedure.input(z.object({ conversationId: z.number().optional(), projectId: z.number().optional(), attachments: z.array(z.string()).optional(), model: z.string(), messages: z.array(z.object({ role: z.enum(["system", "user", "assistant"]), content: z.string() })) })).mutation(async ({ ctx, input }) => {
      const promptMessages = withAttachmentContext(input.messages, input.attachments || []);
      const response = await invokeLLM({ model: input.model, messages: promptMessages });
      const content = getTextContent(response.choices?.[0]?.message?.content);
      const nextMessages = [...promptMessages, { role: "assistant" as const, content }];
      let conversationId = input.conversationId;
      if (conversationId) await saveConversation(ctx.user.id, conversationId, { messages: JSON.stringify(nextMessages), model: input.model });
      else conversationId = await createConversation(ctx.user.id, input.messages.find((item) => item.role === "user")?.content.slice(0, 70) || "New conversation", input.model, input.projectId);
      await recordUsage({ userId: ctx.user.id, conversationId, model: input.model, messageCount: 1, inputTokens: Math.ceil(JSON.stringify(promptMessages).length / 4), outputTokens: Math.ceil(content.length / 4) });
      return { conversationId, content, messages: nextMessages };
    }),
  }),
  files: router({
    upload: approvedProcedure.input(z.object({ fileName: z.string().min(1).max(255), mimeType: z.string().min(1), sizeBytes: z.number().int().positive().max(50 * 1024 * 1024), base64: z.string().min(1), conversationId: z.number().optional() })).mutation(async ({ ctx, input }) => {
      if (!isSupportedAttachmentMimeType(input.mimeType)) throw new TRPCError({ code: "BAD_REQUEST", message: "This file type is not supported yet." });
      const buffer = Buffer.from(input.base64, "base64");
      const stored = await storagePut(`${ctx.user.id}-files/${Date.now()}-${input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-")}`, buffer, input.mimeType);
      const id = await saveAttachment({ userId: ctx.user.id, conversationId: input.conversationId, fileName: input.fileName, mimeType: input.mimeType, sizeBytes: input.sizeBytes, storageKey: stored.key, storageUrl: stored.url });
      return { id, ...stored, fileName: input.fileName, mimeType: input.mimeType };
    }),
  }),
  usage: router({
    mine: approvedProcedure.query(({ ctx }) => getUsage(ctx.user.id)),
    admin: onlyAdminProcedure.query(() => getAdminUsage()),
  }),
});

export type AppRouter = typeof appRouter;
