import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const TOKEN_TTL_SECONDS = 60 * 60;

export function validateAdminRouteCredentials(username: string, password: string) {
  const configuredUsername = process.env.ADMIN_ROUTE_USERNAME;
  const configuredPassword = process.env.ADMIN_ROUTE_PASSWORD;
  return Boolean(configuredUsername && configuredPassword && username === configuredUsername && password === configuredPassword);
}

export function createAdminRouteToken() {
  return randomBytes(32).toString("base64url");
}

export function hashAdminRouteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getAdminTokenExpiry(now = Math.floor(Date.now() / 1000)) {
  return now + TOKEN_TTL_SECONDS;
}

export function compareAdminTokenHash(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}
