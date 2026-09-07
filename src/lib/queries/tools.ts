import { Prisma } from "@prisma/client";
import { getCatalogRepository } from "@/lib/catalog";

// ------------------------------------------------------------------
// REUSABLE TOOL QUERIES (server-side)
// ------------------------------------------------------------------
// All catalogue queries route through the CatalogRepository abstraction
// which delegates to either Payload or Prisma based on the feature flag.
// ------------------------------------------------------------------

/** Total number of published products. */
export async function getPublishedToolCount(): Promise<number> {
  return getCatalogRepository().getPublishedToolCount();
}

/** Count of published products whose verification status is VERIFIED. */
export async function getVerifiedToolCount(): Promise<number> {
  return getCatalogRepository().getVerifiedToolCount();
}

/** Featured (promoted) products, used as the basis for "Trending". */
export async function getFeaturedTools(limit = 4) {
  return getCatalogRepository().getFeaturedTools(limit);
}

/** Products we can derive a real trending signal for from analytics */
export async function getTrendingTools(limit = 4) {
  return getFeaturedTools(limit);
}

/** Most recently added published products. */
export async function getRecentTools(limit = 3) {
  return getCatalogRepository().getRecentTools(limit);
}

/** Published products that are completely free to use. */
export async function getFreeTools(limit = 3) {
  return getCatalogRepository().getFreeTools(limit);
}

/** A single catalogue product with its category. */
export async function getToolBySlug(slug: string) {
  return getCatalogRepository().getToolBySlug(slug);
}

/** Alternative/recommended products sharing the same category. */
export async function getToolAlternatives(categoryId: string, excludeId: string, limit = 4) {
  return getCatalogRepository().getToolAlternatives(categoryId, excludeId, limit);
}

/** Tools directory: paginated list of tools matching a Prisma where clause. */
export async function getToolsDirectory(
  where: Prisma.ToolWhereInput,
  options?: { skip?: number; take?: number }
) {
  return getCatalogRepository().getToolsDirectory(where, options);
}

/** Count tools in directory matching a Prisma where clause. */
export async function getToolsDirectoryCount(where: Prisma.ToolWhereInput): Promise<number> {
  return getCatalogRepository().getToolsDirectoryCount(where);
}
