import { Prisma } from "@prisma/client";

// ------------------------------------------------------------------
// CATALOG REPOSITORY TYPES
// ------------------------------------------------------------------
// Shared types for the read-only Catalog Repository abstraction.
//
// The repository interface preserves the EXACT return shapes the
// application already consumes (Prisma types), so existing pages, API
// routes, server components, sitemap, search and admin code keep
// receiving compatible data (see PHASE 2 §4).
//
// The normalized `CatalogOurValue` types below are used ONLY for the
// Payload shadow-read comparison. They are NOT application DTOs and
// are never returned to callers.
// ------------------------------------------------------------------

/** The include set used by every tool read in the app. */
export const toolWithRelationsInclude = {
  category: true,
  provider: true,
  structuredTags: { include: { tag: true } },
} satisfies Prisma.ToolInclude;

/** Shape returned by tool list / by-slug / directory reads. */
export type ToolWithRelations = Prisma.ToolGetPayload<{
  include: typeof toolWithRelationsInclude;
}>;

/** Shape returned by the category list read (published tool count). */
export type CategoryWithCount = Prisma.CategoryGetPayload<{
  include: {
    _count: {
      select: { tools: { where: { isPublished: boolean } } };
    };
  };
}>;

// ------------------------------------------------------------------
// NORMALIZED VALUES (shadow comparison only — never served to callers)
// ------------------------------------------------------------------

export type CatalogEntityKind = "tool" | "category" | "provider" | "tag";

export interface CatalogToolValue {
  legacyPrismaId: string;
  slug: string;
  name: string;
  description: string;
  websiteUrl: string;
  logo: string | null;
  affiliateUrl: string | null;
  pricingType: string;
  rating: number;
  isFeatured: boolean;
  isPublished: boolean;
  isSponsored: boolean;
  tags: string;
  hostingGuide: string | null;
  entityType: string;
  verificationStatus: string;
  lastVerifiedAt: string | null;
  sourceUrl: string | null;
  metadata: string | null;
  documentationUrl: string | null;
  pricingUrl: string | null;
  categoryLegacyId: string | null;
  providerLegacyId: string | null;
  tagLegacyIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CatalogCategoryValue {
  legacyPrismaId: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogProviderValue {
  legacyPrismaId: string;
  name: string;
  slug: string;
  description: string | null;
  websiteUrl: string | null;
  logo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogTagValue {
  legacyPrismaId: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}
