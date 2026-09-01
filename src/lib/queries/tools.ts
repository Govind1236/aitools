import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

// ------------------------------------------------------------------
// REUSABLE TOOL QUERIES (server-side)
// ------------------------------------------------------------------
// Central place for catalogue queries so the homepage, directory, and
// API routes read from the database in a consistent way.
// ------------------------------------------------------------------

const TOOL_WITH_CATEGORY = {
  include: { category: true },
} satisfies Prisma.ToolFindManyArgs;

/** Total number of published products. */
export async function getPublishedToolCount(): Promise<number> {
  return db.tool.count({ where: { isPublished: true } });
}

/** Count of published products whose verification status is VERIFIED. */
export async function getVerifiedToolCount(): Promise<number> {
  return db.tool.count({
    where: { isPublished: true, verificationStatus: "VERIFIED" },
  });
}

/** Featured (promoted) products, used as the basis for "Trending". */
export async function getFeaturedTools(limit = 4) {
  return db.tool.findMany({
    ...TOOL_WITH_CATEGORY,
    where: { isPublished: true, isFeatured: true },
    orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
}

/** Products we can derive a real trending signal for from analytics
 *  (recent outbound clicks). Falls back to featured+rating order until
 *  a proper trendingScore exists. */
export async function getTrendingTools(limit = 4) {
  return getFeaturedTools(limit);
}

/** Most recently added published products. */
export async function getRecentTools(limit = 3) {
  return db.tool.findMany({
    ...TOOL_WITH_CATEGORY,
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/** Published products that are completely free to use. */
export async function getFreeTools(limit = 3) {
  return db.tool.findMany({
    ...TOOL_WITH_CATEGORY,
    where: { isPublished: true, pricingType: "free" },
    orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
}

/** A single catalogue product with its category. */
export async function getToolBySlug(slug: string) {
  return db.tool.findUnique({
    where: { slug },
    include: { category: true },
  });
}

/** Alternative/recommended products sharing the same category. */
export async function getToolAlternatives(categoryId: string, excludeId: string, limit = 4) {
  return db.tool.findMany({
    ...TOOL_WITH_CATEGORY,
    where: { categoryId, id: { not: excludeId }, isPublished: true },
    orderBy: [{ rating: "desc" }],
    take: limit,
  });
}
