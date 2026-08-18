import { describe, expect, it } from "vitest";
import { adminPageCount, normalizeAdminUserListInput } from "./adminPagination";
import { HISTORY_PATH } from "../shared/navigation";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("admin user navigation", () => {
  it("normalizes search and clamps pagination inputs", () => {
    expect(normalizeAdminUserListInput({ search: "  hanzala  ", page: 0, pageSize: 100 })).toEqual({ search: "hanzala", status: "all", page: 1, pageSize: 50 });
    expect(normalizeAdminUserListInput({ status: "blocked" }).status).toBe("blocked");
  });

  it("calculates stable page counts", () => {
    expect(adminPageCount(0)).toBe(1);
    expect(adminPageCount(21, 10)).toBe(3);
  });

  it("keeps the dedicated history route stable", () => {
    expect(HISTORY_PATH).toBe("/history");
  });

  it("includes pending loading feedback for admin search and pagination", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");
    expect(source).toContain("adminUsersFetching");
    expect(source).toContain("animate-spin");
    expect(source).toContain("adminPage <= 1 || adminUsersFetching");
  });
});
