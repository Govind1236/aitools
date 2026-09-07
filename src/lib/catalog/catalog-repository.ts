import { Prisma } from "@prisma/client";
import type {
  CategoryWithCount,
  ToolWithRelations,
} from "./catalog-types";

/** Full Prisma Category row (same as `db.category.findUnique` returns). */
export type CategoryRecord = Prisma.CategoryGetPayload<{}>;

// ------------------------------------------------------------------
// CATALOG REPOSITORY (interface)
// ------------------------------------------------------------------
// Read-only catalog abstraction. It models exactly the catalog reads the
// application currently performs (see PHASE 2 §3). It deliberately has
// NO generic create/update/delete methods.
//
// Every method returns the same shape the existing Prisma-backed queries
// returned, so callers (pages, API routes, server components, sitemap,
// search, admin) continue receiving compatible data without redesign.
// ------------------------------------------------------------------

export interface ToolsListOptions {
  skip?: number;
  take?: number;
}

export interface CatalogRepository {
  // ── Tools ──────────────────────────────────────────────────────
  getPublishedToolCount(): Promise<number>;
  getVerifiedToolCount(): Promise<number>;
  getFeaturedTools(limit?: number): Promise<ToolWithRelations[]>;
  getRecentTools(limit?: number): Promise<ToolWithRelations[]>;
  getFreeTools(limit?: number): Promise<ToolWithRelations[]>;
  getToolBySlug(slug: string): Promise<ToolWithRelations | null>;
  getToolAlternatives(
    categoryId: string,
    excludeId: string,
    limit?: number,
  ): Promise<ToolWithRelations[]>;
  getToolsDirectory(
    where: Prisma.ToolWhereInput,
    options?: ToolsListOptions,
  ): Promise<ToolWithRelations[]>;

  // ── Counts ──────────────────────────────────────────────────────
  getToolsDirectoryCount(where: Prisma.ToolWhereInput): Promise<number>;

  // ── Sitemap ─────────────────────────────────────────────────────
  getToolSitemapEntries(): Promise<{ slug: string; updatedAt: Date }[]>;
  getActiveCategorySitemapEntries(): Promise<{ slug: string; updatedAt: Date }[]>;

  // ── Categories ─────────────────────────────────────────────────
  findCategoryBySlug(slug: string): Promise<CategoryRecord | null>;
  getAllCategories(): Promise<CategoryWithCount[]>;
}
