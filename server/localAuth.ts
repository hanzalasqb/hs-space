import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export const LOCAL_SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, expected] = stored.split(":");
  if (!salt || !expected) return false;
  const actual = scryptSync(password, salt, 64).toString("hex");
  const actualBuffer = Buffer.from(actual, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export function createLocalSessionToken() { return randomBytes(32).toString("base64url"); }
export function localSessionExpiry(now = Math.floor(Date.now() / 1000)) { return now + LOCAL_SESSION_TTL_SECONDS; }
