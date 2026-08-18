import { describe, expect, it } from "vitest";
import { revokeSessionByKind } from "./sessionRevocation";

describe("session revocation dispatch", () => {
  it("revokes admin sessions through the admin handler", async () => {
    const calls: string[] = [];
    await revokeSessionByKind("admin", "a".repeat(64), { admin: async (hash) => { calls.push(`admin:${hash}`); }, user: async (hash) => { calls.push(`user:${hash}`); } });
    expect(calls[0]).toMatch(/^admin:/);
  });

  it("revokes user sessions through the user handler", async () => {
    const calls: string[] = [];
    await revokeSessionByKind("user", "b".repeat(64), { admin: async (hash) => { calls.push(`admin:${hash}`); }, user: async (hash) => { calls.push(`user:${hash}`); } });
    expect(calls[0]).toMatch(/^user:/);
  });
});
