import { describe, expect, it } from "vitest";
import { createLocalSessionToken, hashPassword, localSessionExpiry, verifyPassword } from "./localAuth";

describe("local authentication", () => {
  it("hashes and verifies passwords without storing plaintext", () => {
    const password = "correct horse battery staple";
    const stored = hashPassword(password);
    expect(stored).not.toContain(password);
    expect(verifyPassword(password, stored)).toBe(true);
    expect(verifyPassword("wrong password", stored)).toBe(false);
  });

  it("creates opaque sessions with a 30-day expiry", () => {
    expect(createLocalSessionToken()).not.toBe(createLocalSessionToken());
    expect(localSessionExpiry(1_700_000_000)).toBe(1_702_592_000);
  });
});
