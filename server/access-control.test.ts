import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

defineTestContext;
function defineTestContext() {
  return (user: NonNullable<TrpcContext["user"]>): TrpcContext => ({
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  });
}

const base = { id: 9, openId: "test", name: "Test", email: "test@example.com", loginMethod: "manus", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(), role: "user" as const, approvalStatus: "pending" as const, accessEnabled: true };

describe("HS Space access control", () => {
  it("blocks pending users from AI procedures", async () => {
    const caller = appRouter.createCaller(defineTestContext()(base));
    await expect(caller.ai.chat({ model: "gpt-4o", messages: [{ role: "user", content: "hello" }] })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("blocks regular users from admin procedures", async () => {
    const caller = appRouter.createCaller(defineTestContext()({ ...base, approvalStatus: "approved" }));
    await expect(caller.users.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows approved admins to pass admin authorization", async () => {
    const caller = appRouter.createCaller(defineTestContext()({ ...base, role: "admin", approvalStatus: "approved" }));
    await expect(caller.users.list()).resolves.toBeDefined();
  });
});
