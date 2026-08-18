import { describe, expect, it } from "vitest";
import { createAdminRouteToken, getAdminTokenExpiry, hashAdminRouteToken, validateAdminRouteCredentials } from "./adminAuth";

describe("admin route credentials and session tokens", () => {
  it("accepts the configured secret and rejects invalid credentials", () => {
    expect(validateAdminRouteCredentials(process.env.ADMIN_ROUTE_USERNAME || "", process.env.ADMIN_ROUTE_PASSWORD || "")).toBe(true);
    expect(validateAdminRouteCredentials("invalid", "invalid")).toBe(false);
  });

  it("creates random opaque tokens with stable hashes and an expiry", () => {
    const first = createAdminRouteToken();
    const second = createAdminRouteToken();
    expect(first).not.toBe(second);
    expect(hashAdminRouteToken(first)).toHaveLength(64);
    expect(getAdminTokenExpiry(1_700_000_000)).toBe(1_700_003_600);
  });
});
