export async function revokeSessionByKind(kind: "admin" | "user", tokenHash: string, handlers: { admin: (tokenHash: string) => Promise<void>; user: (tokenHash: string) => Promise<void> }) {
  if (kind === "admin") return handlers.admin(tokenHash);
  return handlers.user(tokenHash);
}
