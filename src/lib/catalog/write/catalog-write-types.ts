// ------------------------------------------------------------------
// CATALOG WRITE REPOSITORY — TYPES
// ------------------------------------------------------------------
// Input DTOs for the explicit, domain-oriented catalog write operations.
// These mirror the fields the existing admin UI already sends so we do
// not change any public API request/response shapes.
// ------------------------------------------------------------------

interface CategoryRef {
  /** Payload category id (or Prisma category id depending on mode). */
  id: string;
}

interface ProviderRef {
  /** Payload provider id (or Prisma provider id depending on mode). */
  id: string;
}

export type { CategoryRef, ProviderRef };
export type { CategoryRef as CategoryRelationship, ProviderRef as ProviderRelationship };

export interface TagSelection {
  /** Undefined for newly-typed tags (temp ids); the tag will be created. */
  id?: string;
  name: string;
}

export interface CreateToolInput {
  name: string;
  slug?: string;
  description: string;
  logo?: string | null;
  websiteUrl: string;
  affiliateUrl?: string | null;
  pricingType?: string;
  categoryId: string;
  rating?: number;
  isFeatured?: boolean;
  isPublished?: boolean;
  isSponsored?: boolean;
  tags?: string | string[];
  providerId?: string | null;
  documentationUrl?: string | null;
  pricingUrl?: string | null;
  hostingGuide?: string | null;
  tagIds?: string[];
  tagSelections?: TagSelection[];
  entityType?: string;
  verificationStatus?: string;
  lastVerifiedAt?: string | null;
  sourceUrl?: string | null;
  metadata?: string | null;
}

export type UpdateToolInput = Partial<CreateToolInput>;

/** The identity produced by a create/update catalog write. */
export interface ToolWriteResult {
  /** Payload tool id when authoritative write target is Payload. */
  payloadId: string | null;
  /** Prisma Tool.id when the tool has a Prisma compatibility row. */
  prismaToolId: string | null;
  /** Legacy Prisma id bridge (equals prismaToolId for existing rows). */
  legacyPrismaId: string | null;
  slug: string;
  name: string;
}

/** Shape of a successful catalog write result. */
export interface WriteResult<T = unknown> {
  ok: true;
  /** The authoritative store's document (Payload doc or Prisma row). */
  data: T;
  /** Identity/bridge details for compatibility bookkeeping. */
  identity: ToolWriteResult;
}

/** Shape of a failed catalog write result. */
export interface WriteFailure {
  ok: false;
  error: Error;
}

export type WriteResponse<T = unknown> =
  | WriteResult<T>
  | WriteFailure;

/** Category content used by createCategory / updateCategory. */
export interface CategoryWriteInput {
  name: string;
  slug?: string;
  description?: string | null;
  icon?: string | null;
  sortOrder?: number;
}

/** Provider content used by createProvider / updateProvider. */
export interface ProviderWriteInput {
  name: string;
  slug?: string;
  description?: string | null;
  websiteUrl?: string | null;
  logo?: string | null;
}

/** Tag content used by createTag / updateTag. */
export interface TagWriteInput {
  name: string;
  slug?: string;
}
