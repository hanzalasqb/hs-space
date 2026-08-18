export const ADMIN_PAGE_SIZE = 10;

export function normalizeAdminUserListInput(input?: { search?: string; status?: string; page?: number; pageSize?: number }) {
  return {
    search: input?.search?.trim() ?? "",
    status: input?.status && input.status !== "all" ? input.status : "all",
    page: Math.max(1, input?.page ?? 1),
    pageSize: Math.min(50, Math.max(5, input?.pageSize ?? ADMIN_PAGE_SIZE)),
  };
}

export function adminPageCount(total: number, pageSize = ADMIN_PAGE_SIZE) {
  return Math.max(1, Math.ceil(Math.max(0, total) / pageSize));
}
