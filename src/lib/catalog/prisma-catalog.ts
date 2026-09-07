import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import type {
  CatalogRepository,
  CategoryRecord,
  ToolsListOptions,
} from "./catalog-repository";
import type { CategoryWithCount, ToolWithRelations } from "./catalog-types";

// ------------------------------------------------------------------
// PRISMA CATALOG REPOSITORY
// ------------------------------------------------------------------
// Implements CatalogRepository by delegating to the existing Prisma
// queries. This is the original, proven read path.
// ------------------------------------------------------------------

const TOOL_WITH_CATEGORY = {
  include: {
    category: true,
    provider: true,
    structuredTags: { include: { tag: true } },
  },
} satisfies Prisma.ToolFindManyArgs;

export const prismaCatalog: CatalogRepository = {
  // ── Tools ──────────────────────────────────────────────────────

  async getPublishedToolCount(): Promise<number> {
    return db.tool.count({ where: { isPublished: true } });
  },

  async getVerifiedToolCount(): Promise<number> {
    return db.tool.count({
      where: { isPublished: true, verificationStatus: "VERIFIED" },
    });
  },

  async getFeaturedTools(limit = 4): Promise<ToolWithRelations[]> {
    return db.tool.findMany({
      ...TOOL_WITH_CATEGORY,
      where: { isPublished: true, isFeatured: true },
      orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
      take: limit,
    });
  },

  async getRecentTools(limit = 3): Promise<ToolWithRelations[]> {
    return db.tool.findMany({
      ...TOOL_WITH_CATEGORY,
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },

  async getFreeTools(limit = 3): Promise<ToolWithRelations[]> {
    return db.tool.findMany({
      ...TOOL_WITH_CATEGORY,
      where: { isPublished: true, pricingType: "free" },
      orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
      take: limit,
    });
  },

  async getToolBySlug(slug: string): Promise<ToolWithRelations | null> {
    return db.tool.findUnique({
      where: { slug },
      include: {
        category: true,
        provider: true,
        structuredTags: { include: { tag: true } },
      },
    });
  },

  async getToolAlternatives(
    categoryId: string,
    excludeId: string,
    limit = 4,
  ): Promise<ToolWithRelations[]> {
    return db.tool.findMany({
      ...TOOL_WITH_CATEGORY,
      where: { categoryId, id: { not: excludeId }, isPublished: true },
      orderBy: [{ rating: "desc" }],
      take: limit,
    });
  },

  async getToolsDirectory(
    where: Prisma.ToolWhereInput,
    options?: ToolsListOptions,
  ): Promise<ToolWithRelations[]> {
    const { skip = 0, take = 100 } = options ?? {};
    return db.tool.findMany({
      ...TOOL_WITH_CATEGORY,
      where,
      orderBy: [
        { isFeatured: "desc" },
        { rating: "desc" },
        { createdAt: "desc" },
      ],
      skip,
      take,
    });
  },

  // ── Counts ──────────────────────────────────────────────────────

  async getToolsDirectoryCount(where: Prisma.ToolWhereInput): Promise<number> {
    return db.tool.count({ where });
  },

  // ── Sitemap ─────────────────────────────────────────────────────

  async getToolSitemapEntries() {
    return db.tool.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    });
  },

  async getActiveCategorySitemapEntries() {
    return db.category.findMany({
      where: { tools: { some: { isPublished: true } } },
      select: { slug: true, updatedAt: true },
    });
  },

  // ── Categories ─────────────────────────────────────────────────

  async findCategoryBySlug(slug: string): Promise<CategoryRecord | null> {
    return db.category.findUnique({ where: { slug } });
  },

  async getAllCategories(): Promise<CategoryWithCount[]> {
    return db.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { tools: { where: { isPublished: true } } },
        },
      },
    });
  },
};
