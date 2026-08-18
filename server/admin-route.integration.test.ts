import { describe, expect, it } from "vitest";

describe("private admin route endpoints", () => {
  it("accepts valid credentials and rejects invalid credentials", async () => {
    const baseUrl = "http://localhost:3000";
    const valid = await fetch(`${baseUrl}/api/private-admin-login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username: process.env.ADMIN_ROUTE_USERNAME, password: process.env.ADMIN_ROUTE_PASSWORD }) });
    expect(valid.status).toBe(200);
    const cookie = valid.headers.get("set-cookie");
    expect(cookie).toContain("hs_admin_route=");
    const invalid = await fetch(`${baseUrl}/api/private-admin-login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username: "invalid", password: "invalid" }) });
    expect(invalid.status).toBe(401);
  });

  it("resolves an authenticated private session as the admin control-center identity", async () => {
    const login = await fetch("http://localhost:3000/api/private-admin-login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username: process.env.ADMIN_ROUTE_USERNAME, password: process.env.ADMIN_ROUTE_PASSWORD }) });
    const cookie = login.headers.get("set-cookie")?.split(";")[0] || "";
    const me = await fetch("http://localhost:3000/api/trpc/auth.me", { headers: { cookie } });
    expect(me.status).toBe(200);
    const payload = await me.json();
    expect(JSON.stringify(payload)).toContain('"id":0');
    expect(JSON.stringify(payload)).toContain('"role":"admin"');
  });

  it("clears the cookie and invalidates the active session during logout", async () => {
    const login = await fetch("http://localhost:3000/api/private-admin-login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username: process.env.ADMIN_ROUTE_USERNAME, password: process.env.ADMIN_ROUTE_PASSWORD }) });
    const cookie = login.headers.get("set-cookie")?.split(";")[0] || "";
    const response = await fetch("http://localhost:3000/api/private-admin-logout", { method: "POST", headers: { cookie } });
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    const protectedResponse = await fetch("http://localhost:3000/api/ai/stream", { method: "POST", headers: { cookie, "content-type": "application/json" }, body: JSON.stringify({ model: "gpt-4o", messages: [{ role: "user", content: "test" }] }) });
    expect(protectedResponse.status).toBe(403);
  });
});
