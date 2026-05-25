/**
 * Safe integer extraction from unknown query/param values.
 */
export function toInt(val: unknown, def: number): number {
  const n = parseInt(String(val ?? ""), 10);
  return isNaN(n) ? def : n;
}

/**
 * Safe string extraction from unknown query/param values (Express 5 compat).
 */
export function toStr(val: unknown): string | undefined {
  if (typeof val === "string") return val;
  if (Array.isArray(val)) return String(val[0] ?? "");
  return undefined;
}

/**
 * Force a string from Express 5 params (which can be string | string[]).
 */
export function paramStr(val: unknown, fallback = ""): string {
  if (typeof val === "string") return val;
  if (Array.isArray(val)) return String(val[0] ?? fallback);
  return fallback;
}

/**
 * Parse pagination query params. Returns skip/take for Prisma and page/limit for the response.
 */
export function parsePagination(query: { page?: string; limit?: string }): {
  skip: number;
  take: number;
  page: number;
  limit: number;
} {
  const page = Math.max(1, toInt(query.page, 1));
  const limit = Math.min(100, Math.max(1, toInt(query.limit, 20)));
  return {
    skip: (page - 1) * limit,
    take: limit,
    page,
    limit,
  };
}
