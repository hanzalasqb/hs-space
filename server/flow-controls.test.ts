import { describe, expect, it, vi } from "vitest";

vi.mock("./_core/llm", () => ({ invokeLLM: vi.fn(async ({ messages }) => ({ choices: [{ message: { content: messages.at(-1)?.content || "" } }] })), listLLMModels: vi.fn(async () => ({ data: [] })) }));
import { appRouter, isSupportedAttachmentMimeType, withAttachmentContext } from "./routers";
import type { TrpcContext } from "./_core/context";

const ctx = (role: "admin" | "user" = "admin"): TrpcContext => ({
  user: { id: 1, openId: "flow-user", name: "Flow User", email: "flow@example.com", loginMethod: "manus", role, approvalStatus: role === "admin" ? "approved" : "pending", accessEnabled: true, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: { clearCookie: () => undefined } as TrpcContext["res"],
});

describe("authenticated HS Space flows", () => {
  it("allows an admin to approve, reject, toggle access, and change roles", async () => {
    const caller = appRouter.createCaller(ctx());
    await expect(caller.users.setStatus({ id: 4, status: "approved" })).resolves.toEqual({ success: true });
    await expect(caller.users.setStatus({ id: 4, status: "rejected" })).resolves.toEqual({ success: true });
    await expect(caller.users.setAccess({ id: 4, enabled: false })).resolves.toEqual({ success: true });
    await expect(caller.users.setRole({ id: 4, role: "user" })).resolves.toEqual({ success: true });
  });

  it("accepts a project assignment update for an approved member", async () => {
    const caller = appRouter.createCaller(ctx());
    await expect(caller.conversations.update({ id: 12, projectId: 8 })).resolves.toEqual({ success: true });
  });

  it("runs attachment-backed chat for an approved user and preserves the file reference", async () => {
    const caller = appRouter.createCaller(ctx());
    const result = await caller.ai.chat({ model: "gpt-4o", attachments: ["/manus-storage/brief.pdf"], messages: [{ role: "user", content: "Summarize this" }] });
    expect(result.messages.at(-1)?.content).toContain("/manus-storage/brief.pdf");
  });

  it("forbids attachment-backed chat for a pending user", async () => {
    const caller = appRouter.createCaller(ctx("user"));
    await expect(caller.ai.chat({ model: "gpt-4o", attachments: ["/manus-storage/brief.pdf"], messages: [{ role: "user", content: "Summarize this" }] })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("accepts common readable file categories and rejects executable uploads", () => {
    expect(isSupportedAttachmentMimeType("application/pdf")).toBe(true);
    expect(isSupportedAttachmentMimeType("image/png")).toBe(true);
    expect(isSupportedAttachmentMimeType("audio/mpeg")).toBe(true);
    expect(isSupportedAttachmentMimeType("video/mp4")).toBe(true);
    expect(isSupportedAttachmentMimeType("application/zip")).toBe(true);
    expect(isSupportedAttachmentMimeType("application/x-msdownload")).toBe(false);
  });

  it("incorporates uploaded file references into the last user prompt", () => {
    const messages = withAttachmentContext([{ role: "user", content: "Summarize this" }], ["/manus-storage/brief.pdf"]);
    expect(messages[0]?.content).toContain("/manus-storage/brief.pdf");
  });

  it("keeps pending members out of the project workspace", async () => {
    const caller = appRouter.createCaller(ctx("user"));
    await expect(caller.projects.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
