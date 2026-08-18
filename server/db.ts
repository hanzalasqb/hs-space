import { and, count, desc, eq, isNull, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { ENV } from "./_core/env";
import { adminSessions, attachments, auditLogs, conversations, InsertUser, passwordResetTokens, projects, usageEvents, userSessions, users } from "../drizzle/schema";
import { normalizeAdminUserListInput } from "./adminPagination";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const isOwner = user.openId === ENV.ownerOpenId;
  const values: InsertUser = {
    openId: user.openId,
    name: user.name ?? null,
    email: user.email ?? null,
    loginMethod: user.loginMethod ?? null,
    lastSignedIn: user.lastSignedIn ?? new Date(),
    role: isOwner ? "admin" : (user.role ?? "user"),
    approvalStatus: isOwner ? "approved" : (user.approvalStatus ?? "pending"),
    accessEnabled: user.accessEnabled ?? true,
  };
  const updateSet: Record<string, unknown> = {
    name: values.name,
    email: values.email,
    loginMethod: values.loginMethod,
    lastSignedIn: values.lastSignedIn,
  };
  if (isOwner) {
    updateSet.role = "admin";
    updateSet.approvalStatus = "approved";
    updateSet.accessEnabled = true;
  }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getUserByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}

export async function updateUserProfile(id: number, patch: { username?: string; passwordHash?: string; avatarUrl?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(users).set(patch).where(eq(users.id, id));
}

export async function createPasswordResetToken(tokenHash: string, userId: number, expiresAt: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(passwordResetTokens).values({ tokenHash, userId, expiresAt });
}

export async function consumePasswordResetToken(tokenHash: string, now = Math.floor(Date.now() / 1000)) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(passwordResetTokens).where(and(eq(passwordResetTokens.tokenHash, tokenHash), isNull(passwordResetTokens.usedAt))).limit(1);
  const token = result[0];
  if (!token || token.expiresAt <= now) return undefined;
  await db.update(passwordResetTokens).set({ usedAt: now }).where(eq(passwordResetTokens.tokenHash, tokenHash));
  return token;
}

export async function addAuditLog(entry: { actorUserId?: number | null; targetUserId?: number | null; action: string; metadata?: Record<string, unknown> }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLogs).values({ actorUserId: entry.actorUserId ?? null, targetUserId: entry.targetUserId ?? null, action: entry.action, metadata: entry.metadata ? JSON.stringify(entry.metadata) : null });
}

export async function listAuditLogs(limit = 100) {
  const db = await getDb();
  return db ? db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(Math.min(200, Math.max(1, limit))) : [];
}

export async function listUserSessionsForAdmin(userId: number) {
  const db = await getDb();
  return db ? db.select().from(userSessions).where(eq(userSessions.userId, userId)).orderBy(desc(userSessions.createdAt)).limit(100) : [];
}

export async function listUsageForUser(userId: number) {
  const db = await getDb();
  return db ? db.select().from(usageEvents).where(eq(usageEvents.userId, userId)).orderBy(desc(usageEvents.createdAt)).limit(100) : [];
}

export async function createLocalUser(values: { username: string; passwordHash: string; name?: string; email?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(users).values({ openId: `local:${values.username}`, username: values.username, passwordHash: values.passwordHash, name: values.name ?? values.username, email: values.email ?? null, loginMethod: "local", role: "user", approvalStatus: "pending", accessEnabled: true });
  return Number(result[0].insertId);
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getAllUsers() {
  const db = await getDb();
  return db ? db.select().from(users).orderBy(desc(users.createdAt)) : [];
}

export async function getUsersPage(input: { search?: string; status?: string; page?: number; pageSize?: number }) {
  const { search, status, page, pageSize } = normalizeAdminUserListInput(input);
  const db = await getDb();
  if (!db) return { items: [], total: 0, page, pageSize };
  const term = search;
  const searchPredicate = term ? or(like(users.name, `%${term}%`), like(users.username, `%${term}%`), like(users.email, `%${term}%`), like(users.openId, `%${term}%`)) : undefined;
  const statusPredicate = status !== "all" ? eq(users.approvalStatus, status as "pending" | "approved" | "rejected" | "blocked" | "suspended") : undefined;
  const predicate = searchPredicate && statusPredicate ? and(searchPredicate, statusPredicate) : searchPredicate || statusPredicate;
  const [items, totalRows] = await Promise.all([
    db.select().from(users).where(predicate).orderBy(desc(users.createdAt)).limit(pageSize).offset((page - 1) * pageSize),
    db.select({ total: count() }).from(users).where(predicate),
  ]);
  return { items, total: Number(totalRows[0]?.total ?? 0), page, pageSize };
}

export async function updateUserAccess(id: number, patch: Partial<{ role: "admin" | "user"; approvalStatus: "pending" | "approved" | "rejected" | "blocked" | "suspended"; permissionMessage: string | null; accessEnabled: boolean }>) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(patch).where(eq(users.id, id));
}

export async function listConversations(userId: number) {
  const db = await getDb();
  return db ? db.select().from(conversations).where(eq(conversations.userId, userId)).orderBy(desc(conversations.updatedAt)) : [];
}

export async function listConversationsForUser(userId: number) {
  const db = await getDb();
  return db ? db.select().from(conversations).where(eq(conversations.userId, userId)).orderBy(desc(conversations.updatedAt)) : [];
}

export async function getConversation(userId: number, id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(conversations).where(and(eq(conversations.id, id), eq(conversations.userId, userId))).limit(1);
  return result[0];
}

export async function createConversation(userId: number, title: string, model: string, projectId?: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(conversations).values({ userId, title, model, projectId, messages: "[]" });
  return Number(result[0].insertId);
}

export async function saveConversation(userId: number, id: number, values: Partial<{ title: string; model: string; messages: string; projectId: number | null }>) {
  const db = await getDb();
  if (!db) return;
  await db.update(conversations).set(values).where(and(eq(conversations.id, id), eq(conversations.userId, userId)));
}

export async function deleteConversation(userId: number, id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(conversations).where(and(eq(conversations.id, id), eq(conversations.userId, userId)));
}

export async function listProjects(userId: number) {
  const db = await getDb();
  return db ? db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.updatedAt)) : [];
}

export async function createProject(userId: number, name: string, description?: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(projects).values({ userId, name, description });
  return Number(result[0].insertId);
}

export async function deleteProject(userId: number, id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(projects).where(and(eq(projects.id, id), eq(projects.userId, userId)));
}

export async function saveAttachment(values: typeof attachments.$inferInsert) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(attachments).values(values);
  return Number(result[0].insertId);
}

export async function recordUsage(values: typeof usageEvents.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(usageEvents).values(values);
}

export async function getUsage(userId?: number) {
  const db = await getDb();
  if (!db) return { messages: 0, tokens: 0, byModel: [] };
  const where = userId ? eq(usageEvents.userId, userId) : undefined;
  const totals = await db.select({ messages: sql<number>`coalesce(sum(${usageEvents.messageCount}), 0)`, inputTokens: sql<number>`coalesce(sum(${usageEvents.inputTokens}), 0)`, outputTokens: sql<number>`coalesce(sum(${usageEvents.outputTokens}), 0)` }).from(usageEvents).where(where);
  const byModel = await db.select({ model: usageEvents.model, messages: sql<number>`coalesce(sum(${usageEvents.messageCount}), 0)`, tokens: sql<number>`coalesce(sum(${usageEvents.inputTokens} + ${usageEvents.outputTokens}), 0)` }).from(usageEvents).where(where).groupBy(usageEvents.model);
  const row = totals[0] ?? { messages: 0, inputTokens: 0, outputTokens: 0 };
  return { messages: Number(row.messages), tokens: Number(row.inputTokens) + Number(row.outputTokens), byModel };
}

export async function createUserSession(tokenHash: string, userId: number, expiresAt: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(userSessions).values({ tokenHash, userId, expiresAt });
}

export async function getActiveUserSession(tokenHash: string, now = Math.floor(Date.now() / 1000)) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(userSessions).where(eq(userSessions.tokenHash, tokenHash)).limit(1);
  const session = result[0];
  return session && !session.revokedAt && session.expiresAt > now ? getUserById(session.userId) : undefined;
}

export async function revokeUserSession(tokenHash: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(userSessions).set({ revokedAt: Math.floor(Date.now() / 1000) }).where(eq(userSessions.tokenHash, tokenHash));
}

export async function createAdminSession(tokenHash: string, expiresAt: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(adminSessions).values({ tokenHash, expiresAt });
}

export async function hasActiveAdminSession(tokenHash: string, now = Math.floor(Date.now() / 1000)) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(adminSessions).where(eq(adminSessions.tokenHash, tokenHash)).limit(1);
  const session = result[0];
  return Boolean(session && !session.revokedAt && session.expiresAt > now);
}

export async function listActiveSessions(now = Math.floor(Date.now() / 1000)) {
  const db = await getDb();
  if (!db) return [];
  const admin = await db.select({ tokenHash: adminSessions.tokenHash, createdAt: adminSessions.createdAt, expiresAt: adminSessions.expiresAt, revokedAt: adminSessions.revokedAt }).from(adminSessions).where(and(isNull(adminSessions.revokedAt), sql`${adminSessions.expiresAt} > ${now}`)).orderBy(desc(adminSessions.createdAt));
  const user = await db.select({ tokenHash: userSessions.tokenHash, createdAt: userSessions.createdAt, expiresAt: userSessions.expiresAt, revokedAt: userSessions.revokedAt, owner: users.username, ownerName: users.name }).from(userSessions).leftJoin(users, eq(userSessions.userId, users.id)).where(and(isNull(userSessions.revokedAt), sql`${userSessions.expiresAt} > ${now}`)).orderBy(desc(userSessions.createdAt));
  return [...admin.map((session) => ({ ...session, owner: "Private admin route", ownerName: "HS Space Admin", kind: "admin" as const })), ...user.map((session) => ({ ...session, owner: session.owner || "local account", ownerName: session.ownerName || "Workspace user", kind: "user" as const }))];
}

export async function listAdminSessions(now = Math.floor(Date.now() / 1000)) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ tokenHash: adminSessions.tokenHash, createdAt: adminSessions.createdAt, expiresAt: adminSessions.expiresAt, revokedAt: adminSessions.revokedAt }).from(adminSessions).where(and(isNull(adminSessions.revokedAt), sql`${adminSessions.expiresAt} > ${now}`)).orderBy(desc(adminSessions.createdAt));
}

export async function revokeAdminSession(tokenHash: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(adminSessions).set({ revokedAt: Math.floor(Date.now() / 1000) }).where(eq(adminSessions.tokenHash, tokenHash));
}

export async function getAdminUsage() {
  const db = await getDb();
  if (!db) return { total: { messages: 0, tokens: 0 }, byModel: [], byUser: [] };
  const total = await getUsage();
  const byUser = await db.select({ userId: usageEvents.userId, messages: sql<number>`coalesce(sum(${usageEvents.messageCount}), 0)`, tokens: sql<number>`coalesce(sum(${usageEvents.inputTokens} + ${usageEvents.outputTokens}), 0)` }).from(usageEvents).groupBy(usageEvents.userId).orderBy(desc(sql`messages`));
  return { total: { messages: total.messages, tokens: total.tokens }, byModel: total.byModel, byUser };
}
