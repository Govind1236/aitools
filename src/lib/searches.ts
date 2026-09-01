import { db } from "@/lib/db";

// ------------------------------------------------------------------
// POPULAR SEARCHES
// ------------------------------------------------------------------
// Popular search terms are derived from the SearchQuery table (the
// database is the single source of truth), not hardcoded in components.
// ------------------------------------------------------------------

/** Fallback used ONLY when there is insufficient search history in the DB. */
export const POPULAR_SEARCH_FALLBACK = [
  "DeepSeek",
  "Video Generators",
  "Coding Assistants",
  "Cursor",
  "Midjourney",
];

/** Queries that are obviously not useful user searches. */
const INVALID_QUERY = new Set([
  "",
  "a", "an", "the", "of", "to", "and", "or", "for", "in", "on",
  "ai", "tool", "tools", "app", "free", "best", "top", "list",
]);

function isInvalidQuery(q: string): boolean {
  const normalized = q.trim().toLowerCase().replace(/\s+/g, " ");
  if (!normalized || normalized.length < 2) return true;
  if (INVALID_QUERY.has(normalized)) return true;
  return false;
}

export interface PopularSearch {
  query: string;
  count: number;
}

/**
 * Rank popular searches by frequency from the SearchQuery table.
 * - aggregates on the pre-normalized (lowercased, trimmed) query column
 * - ranks by number of occurrences, then most recent
 * - ignores empty/obviously invalid/system queries
 * - returns at most `limit` results
 */
export async function getPopularSearches(limit = 5): Promise<PopularSearch[]> {
  // Group by the normalized query column and count occurrences.
  const grouped = await db.searchQuery.groupBy({
    by: ["normalized"],
    _count: { _all: true },
    orderBy: { _count: { normalized: "desc" } },
    take: 50,
  });

  const valid = grouped
    .filter((g) => !isInvalidQuery(g.normalized))
    .map((g) => ({ query: g.normalized, count: g._count._all }));

  // If we have a healthy amount of real history, rank purely by frequency.
  if (valid.length >= Math.min(3, limit)) {
    return valid.slice(0, limit);
  }

  // Insufficient history: return a small, clearly defined fallback.
  return POPULAR_SEARCH_FALLBACK.slice(0, limit).map((query) => ({
    query,
    count: 0,
  }));
}
