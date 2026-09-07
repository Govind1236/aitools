import { getPayload } from "payload";
import config from "@payload-config";
import { Prisma } from "@prisma/client";
import type {
  CatalogRepository,
  CategoryRecord,
  ToolsListOptions,
} from "./catalog-repository";
import type { CategoryWithCount, ToolWithRelations } from "./catalog-types";
import { prismaWhereToPayload } from "./payload-where";
import { prismaCatalog } from "./prisma-catalog";

// ------------------------------------------------------------------
// PAYLOAD CATALOG REPOSITORY
// ------------------------------------------------------------------
// Implements CatalogRepository by querying Payload CMS, then
// normalizing the response to the exact same shape as Prisma types.
//
// Every method includes try/catch with fallback to PrismaCatalogRepository
// so the application remains functional if Payload is unavailable.
// ------------------------------------------------------------------

// Payload CMS document shape (depth: 1 returns nested relationships)
/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyDoc = Record<string, any>;

/**
 * Payload does not export its `Where` type, so we carry the converted where
 * clause through an `any` bridge. Runtime shape is unchanged.
 * @internal
 */
function toPayloadWhere(where: unknown): any {
  return where;
}

/** Slug selection for sitemap entries. */
const SLUG_DATE_SELECT = { slug: true, updatedAt: true } as const;

// ------------------------------------------------------------------
// Normalizers — map Payload docs → exact Prisma types
// ------------------------------------------------------------------

function normalizeTool(doc: AnyDoc): ToolWithRelations {
  const cat = doc.category;
  const provider = doc.provider;
  const tags = doc.structuredTags;

  return {
    id: String(doc.id),
    legacyPrismaId: doc.legacyPrismaId ?? null,
    name: String(doc.name),
    slug: String(doc.slug),
    description: String(doc.description),
    websiteUrl: String(doc.websiteUrl),
    logo: doc.logo ?? null,
    affiliateUrl: doc.affiliateUrl ?? null,
    pricingType: String(doc.pricingType),
    rating: Number(doc.rating ?? 0),
    isFeatured: Boolean(doc.isFeatured),
    isPublished: Boolean(doc.isPublished),
    isSponsored: Boolean(doc.isSponsored),
    tags: String(doc.tags ?? ""),
    hostingGuide: doc.hostingGuide ?? null,
    entityType: String(doc.entityType ?? "TOOL"),
    verificationStatus: String(doc.verificationStatus ?? "UNVERIFIED"),
    lastVerifiedAt: doc.lastVerifiedAt ?? null,
    sourceUrl: doc.sourceUrl ?? null,
    metadata: doc.metadata ?? null,
    documentationUrl: doc.documentationUrl ?? null,
    pricingUrl: doc.pricingUrl ?? null,
    categoryId: cat
      ? String((typeof cat === "object" ? cat.legacyPrismaId : null) ?? (typeof cat === "object" ? cat.id : cat))
      : String(doc.category),
    providerId:
      provider && typeof provider === "object"
        ? String(provider.legacyPrismaId ?? provider.id)
        : doc.providerId ?? null,
    createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
    category: cat && typeof cat === "object"
      ? {
          id: String(cat.legacyPrismaId ?? cat.id),
          legacyPrismaId: cat.legacyPrismaId ?? null,
          name: String(cat.name),
          slug: String(cat.slug),
          description: cat.description ?? null,
          icon: cat.icon ?? null,
          sortOrder: Number(cat.sortOrder ?? 0),
          createdAt: cat.createdAt ? new Date(cat.createdAt) : new Date(),
          updatedAt: cat.updatedAt ? new Date(cat.updatedAt) : new Date(),
        }
      : ({ id: String(doc.categoryId), name: "", slug: "", description: null, icon: null, sortOrder: 0, createdAt: new Date(), updatedAt: new Date(), legacyPrismaId: null } as AnyDoc),
    provider: provider && typeof provider === "object"
      ? {
          id: String(provider.legacyPrismaId ?? provider.id),
          legacyPrismaId: provider.legacyPrismaId ?? null,
          name: String(provider.name),
          slug: String(provider.slug),
          description: provider.description ?? null,
          websiteUrl: provider.websiteUrl ?? null,
          logo: provider.logo ?? null,
          createdAt: provider.createdAt ? new Date(provider.createdAt) : new Date(),
          updatedAt: provider.updatedAt ? new Date(provider.updatedAt) : new Date(),
        }
      : null,
    structuredTags: Array.isArray(tags)
      ? tags.map((t: AnyDoc) => {
          const joined = typeof t === "object" ? t : null;
          const tagLegacyId = joined?.legacyPrismaId ?? null;
          const tagId = String(tagLegacyId ?? (joined ? joined.id : t));
          return {
            toolId: String(doc.id),
            tagId,
            createdAt: joined?.createdAt ? new Date(joined.createdAt) : new Date(),
            tag: joined
              ? {
                  id: tagId,
                  legacyPrismaId: tagLegacyId,
                  name: String(joined.name),
                  slug: String(joined.slug),
                  createdAt: joined.createdAt ? new Date(joined.createdAt) : new Date(),
                  updatedAt: joined.updatedAt ? new Date(joined.updatedAt) : new Date(),
                }
              : ({ id: String(t), name: "", slug: "", legacyPrismaId: null, createdAt: new Date(), updatedAt: new Date() } as AnyDoc),
          };
        })
      : [],
  } as unknown as ToolWithRelations;
}

function normalizeCategory(doc: AnyDoc, publishedToolCount: number): CategoryWithCount {
  return {
    id: String(doc.id),
    legacyPrismaId: doc.legacyPrismaId ?? null,
    name: String(doc.name),
    slug: String(doc.slug),
    description: doc.description ?? null,
    icon: doc.icon ?? null,
    sortOrder: Number(doc.sortOrder ?? 0),
    createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
    _count: { tools: publishedToolCount },
  } as unknown as CategoryWithCount;
}

function normalizeCategoryRecord(doc: AnyDoc): CategoryRecord {
  return {
    id: String(doc.id),
    legacyPrismaId: doc.legacyPrismaId ?? null,
    name: String(doc.name),
    slug: String(doc.slug),
    description: doc.description ?? null,
    icon: doc.icon ?? null,
    sortOrder: Number(doc.sortOrder ?? 0),
    createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
  } as unknown as CategoryRecord;
}

// ------------------------------------------------------------------
// PAYLOAD CATALOG REPOSITORY (with Prisma fallback)
// ------------------------------------------------------------------

export const payloadCatalog: CatalogRepository = {
  // ── Tools ──────────────────────────────────────────────────────

  async getPublishedToolCount(): Promise<number> {
    try {
      const payload = await getPayload({ config });
      return (await payload.count({ collection: "tools", where: { isPublished: { equals: true } } })).totalDocs;
    } catch (err) {
      console.error("[payload-catalog] getPublishedToolCount failed, falling back to Prisma:", err);
      return prismaCatalog.getPublishedToolCount();
    }
  },

  async getVerifiedToolCount(): Promise<number> {
    try {
      const payload = await getPayload({ config });
      return (
        await payload.count({
          collection: "tools",
          where: { and: [{ isPublished: { equals: true } }, { verificationStatus: { equals: "VERIFIED" } }] },
        })
      ).totalDocs;
    } catch (err) {
      console.error("[payload-catalog] getVerifiedToolCount failed, falling back to Prisma:", err);
      return prismaCatalog.getVerifiedToolCount();
    }
  },

  async getFeaturedTools(limit = 4): Promise<ToolWithRelations[]> {
    try {
      const payload = await getPayload({ config });
      const { docs } = await payload.find({
        collection: "tools",
        depth: 1,
        where: { and: [{ isPublished: { equals: true } }, { isFeatured: { equals: true } }] },
        limit,
        sort: ["-rating", "-createdAt"],
      });
      return docs.map(normalizeTool);
    } catch (err) {
      console.error("[payload-catalog] getFeaturedTools failed, falling back to Prisma:", err);
      return prismaCatalog.getFeaturedTools(limit);
    }
  },

  async getRecentTools(limit = 3): Promise<ToolWithRelations[]> {
    try {
      const payload = await getPayload({ config });
      const { docs } = await payload.find({
        collection: "tools",
        depth: 1,
        where: { isPublished: { equals: true } },
        limit,
        sort: ["-createdAt"],
      });
      return docs.map(normalizeTool);
    } catch (err) {
      console.error("[payload-catalog] getRecentTools failed, falling back to Prisma:", err);
      return prismaCatalog.getRecentTools(limit);
    }
  },

  async getFreeTools(limit = 3): Promise<ToolWithRelations[]> {
    try {
      const payload = await getPayload({ config });
      const { docs } = await payload.find({
        collection: "tools",
        depth: 1,
        where: { and: [{ isPublished: { equals: true } }, { pricingType: { equals: "free" } }] },
        limit,
        sort: ["-rating", "-createdAt"],
      });
      return docs.map(normalizeTool);
    } catch (err) {
      console.error("[payload-catalog] getFreeTools failed, falling back to Prisma:", err);
      return prismaCatalog.getFreeTools(limit);
    }
  },

  async getToolBySlug(slug: string): Promise<ToolWithRelations | null> {
    try {
      const payload = await getPayload({ config });
      const { docs } = await payload.find({
        collection: "tools",
        depth: 1,
        where: { slug: { equals: slug } },
        limit: 1,
      });
      if (!docs[0]) return null;
      return normalizeTool(docs[0]);
    } catch (err) {
      console.error("[payload-catalog] getToolBySlug failed, falling back to Prisma:", err);
      return prismaCatalog.getToolBySlug(slug);
    }
  },

  async getToolAlternatives(
    categoryId: string,
    excludeId: string,
    limit = 4,
  ): Promise<ToolWithRelations[]> {
    try {
      const payload = await getPayload({ config });
      const { docs } = await payload.find({
        collection: "tools",
        depth: 1,
        where: {
          and: [
            { "category.legacyPrismaId": { equals: categoryId } },
            { id: { not_equals: excludeId } },
            { isPublished: { equals: true } },
          ],
        },
        limit,
        sort: ["-rating"],
      });
      return docs.map(normalizeTool);
    } catch (err) {
      console.error("[payload-catalog] getToolAlternatives failed, falling back to Prisma:", err);
      return prismaCatalog.getToolAlternatives(categoryId, excludeId, limit);
    }
  },

  async getToolsDirectory(
    where: Prisma.ToolWhereInput,
    options?: ToolsListOptions,
  ): Promise<ToolWithRelations[]> {
    try {
      const { skip = 0, take = 100 } = options ?? {};
      const payload = await getPayload({ config });
      const payloadWhere = toPayloadWhere(prismaWhereToPayload(where));
      const { docs } = await payload.find({
        collection: "tools",
        depth: 1,
        where: payloadWhere,
        limit: take,
        page: skip > 0 ? Math.floor(skip / take) + 1 : 1,
        sort: ["-isFeatured", "-rating", "-createdAt"],
      });
      return docs.map(normalizeTool);
    } catch (err) {
      console.error("[payload-catalog] getToolsDirectory failed, falling back to Prisma:", err);
      return prismaCatalog.getToolsDirectory(where, options);
    }
  },

  // ── Counts ──────────────────────────────────────────────────────

  async getToolsDirectoryCount(where: Prisma.ToolWhereInput): Promise<number> {
    try {
      const payload = await getPayload({ config });
      const payloadWhere = toPayloadWhere(prismaWhereToPayload(where));
      return (await payload.count({ collection: "tools", where: payloadWhere })).totalDocs;
    } catch (err) {
      console.error("[payload-catalog] getToolsDirectoryCount failed, falling back to Prisma:", err);
      return prismaCatalog.getToolsDirectoryCount(where);
    }
  },

  // ── Sitemap ─────────────────────────────────────────────────────

  async getToolSitemapEntries() {
    try {
      const payload = await getPayload({ config });
      const { docs } = await payload.find({
        collection: "tools",
        depth: 0,
        where: { isPublished: { equals: true } },
        limit: 10000,
        select: { slug: true, updatedAt: true },
      });
      return docs.map((d: AnyDoc) => ({
        slug: String(d.slug),
        updatedAt: new Date(d.updatedAt),
      }));
    } catch (err) {
      console.error("[payload-catalog] getToolSitemapEntries failed, falling back to Prisma:", err);
      return prismaCatalog.getToolSitemapEntries();
    }
  },

  async getActiveCategorySitemapEntries() {
    try {
      const payload = await getPayload({ config });
      // Fetch all categories, then keep only those referenced by published tools
      const { docs: categories } = await payload.find({
        collection: "categories",
        depth: 0,
        limit: 10000,
        sort: ["sortOrder"],
      });
      const { docs: publishedTools } = await payload.find({
        collection: "tools",
        depth: 0,
        where: { isPublished: { equals: true } },
        limit: 10000,
        select: { category: true },
      });
      const activeCategoryIds = new Set(
        publishedTools.map((t: AnyDoc) => String(typeof t.category === "object" ? t.category.id : t.category)),
      );
      return categories
        .filter((c: AnyDoc) => activeCategoryIds.has(String(c.id)))
        .map((c: AnyDoc) => ({
          slug: String(c.slug),
          updatedAt: new Date(c.updatedAt),
        }));
    } catch (err) {
      console.error("[payload-catalog] getActiveCategorySitemapEntries failed, falling back to Prisma:", err);
      return prismaCatalog.getActiveCategorySitemapEntries();
    }
  },

  // ── Categories ─────────────────────────────────────────────────

  async findCategoryBySlug(slug: string): Promise<CategoryRecord | null> {
    try {
      const payload = await getPayload({ config });
      const { docs } = await payload.find({
        collection: "categories",
        depth: 0,
        where: { slug: { equals: slug } },
        limit: 1,
      });
      if (!docs[0]) return null;
      return normalizeCategoryRecord(docs[0]);
    } catch (err) {
      console.error("[payload-catalog] findCategoryBySlug failed, falling back to Prisma:", err);
      return prismaCatalog.findCategoryBySlug(slug);
    }
  },

  async getAllCategories(): Promise<CategoryWithCount[]> {
    try {
      const payload = await getPayload({ config });
      // Fetch all categories
      const { docs: categories } = await payload.find({
        collection: "categories",
        depth: 0,
        limit: 10000,
        sort: ["sortOrder"],
      });

      // Fetch all published tools to count per category
      const { docs: publishedTools } = await payload.find({
        collection: "tools",
        depth: 0,
        where: { isPublished: { equals: true } },
        limit: 10000,
        select: { category: true },
      });

      // Build a count map: category.id → number of published tools
      const countMap = new Map<string, number>();
      for (const t of publishedTools) {
        const catId = String(typeof t.category === "object" ? t.category.id : t.category);
        countMap.set(catId, (countMap.get(catId) ?? 0) + 1);
      }

      return categories.map((c: AnyDoc) =>
        normalizeCategory(c, countMap.get(String(c.id)) ?? 0),
      );
    } catch (err) {
      console.error("[payload-catalog] getAllCategories failed, falling back to Prisma:", err);
      return prismaCatalog.getAllCategories();
    }
  },
};
