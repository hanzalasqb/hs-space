import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  username: varchar("username", { length: 80 }).unique(),
  passwordHash: text("passwordHash"),
  name: text("name"),
  avatarUrl: varchar("avatarUrl", { length: 700 }),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  approvalStatus: mysqlEnum("approvalStatus", ["pending", "approved", "rejected", "blocked", "suspended"]).default("pending").notNull(),
  permissionMessage: text("permissionMessage"),
  accessEnabled: boolean("accessEnabled").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId"),
  title: varchar("title", { length: 200 }).notNull(),
  model: varchar("model", { length: 120 }).notNull().default("gpt-4o"),
  messages: text("messages").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const attachments = mysqlTable("attachments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  conversationId: int("conversationId"),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 120 }).notNull(),
  sizeBytes: int("sizeBytes").notNull(),
  storageKey: varchar("storageKey", { length: 500 }).notNull(),
  storageUrl: varchar("storageUrl", { length: 700 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const userSessions = mysqlTable("userSessions", {
  tokenHash: varchar("tokenHash", { length: 128 }).primaryKey(),
  userId: int("userId").notNull(),
  expiresAt: int("expiresAt").notNull(),
  revokedAt: int("revokedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const passwordResetTokens = mysqlTable("passwordResetTokens", {
  tokenHash: varchar("tokenHash", { length: 128 }).primaryKey(),
  userId: int("userId").notNull(),
  expiresAt: int("expiresAt").notNull(),
  usedAt: int("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  actorUserId: int("actorUserId"),
  targetUserId: int("targetUserId"),
  action: varchar("action", { length: 120 }).notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const adminSessions = mysqlTable("adminSessions", {
  tokenHash: varchar("tokenHash", { length: 128 }).primaryKey(),
  expiresAt: int("expiresAt").notNull(),
  revokedAt: int("revokedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const usageEvents = mysqlTable("usageEvents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  conversationId: int("conversationId"),
  model: varchar("model", { length: 120 }).notNull(),
  messageCount: int("messageCount").notNull().default(1),
  inputTokens: int("inputTokens").notNull().default(0),
  outputTokens: int("outputTokens").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Attachment = typeof attachments.$inferSelect;
export type UsageEvent = typeof usageEvents.$inferSelect;
export type AdminSession = typeof adminSessions.$inferSelect;
export type UserSession = typeof userSessions.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
