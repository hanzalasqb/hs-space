import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function context(): TrpcContext {
  return {
    user: { id: 7, openId: "approved-user", name: "Approved", email: "approved@example.com", loginMethod: "manus", role: "user", approvalStatus: "approved", accessEnabled: true, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("conversation procedures", () => {
  it("accepts create input for an approved user", async () => {
    const caller = appRouter.createCaller(context());
    await expect(caller.conversations.create({ title: "Launch notes", model: "gpt-4o" })).resolves.toBeTypeOf("number");
  });

  it("accepts rename/update input for an approved user", async () => {
    const caller = appRouter.createCaller(context());
    await expect(caller.conversations.update({ id: 123, title: "Renamed notes" })).resolves.toEqual({ success: true });
  });

  it("accepts delete input for an approved user", async () => {
    const caller = appRouter.createCaller(context());
    await expect(caller.conversations.delete({ id: 123 })).resolves.toEqual({ success: true });
  });
});
