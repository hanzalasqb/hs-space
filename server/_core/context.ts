import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { getActiveUserSession, hasActiveAdminSession } from "../db";
import { hashAdminRouteToken } from "../adminAuth";
import { createHash } from "node:crypto";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  const cookieHeader = opts.req.headers.cookie || "";
  const cookies = Object.fromEntries(cookieHeader.split(";").map((part) => part.trim().split("=")));
  const adminToken = cookies.hs_admin_route;
  if (adminToken && await hasActiveAdminSession(hashAdminRouteToken(adminToken))) {
    user = { id: 0, openId: "admin-route", username: null, passwordHash: null, name: "HS Space Admin", avatarUrl: null, email: null, loginMethod: "private-admin-route", role: "admin", approvalStatus: "approved", permissionMessage: null, accessEnabled: true, createdAt: new Date(0), updatedAt: new Date(), lastSignedIn: new Date() };
  } else {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch (error) {
      user = null;
    }
    if (!user && cookies.hs_user_session) {
      user = await getActiveUserSession(createHash("sha256").update(cookies.hs_user_session).digest("hex")) ?? null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
