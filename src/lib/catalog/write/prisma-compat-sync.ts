// ------------------------------------------------------------------
// PRISMA COMPATIBILITY SYNCHRONIZER
// ------------------------------------------------------------------
// ⚠️ TRANSITIONAL COMPATIBILITY CODE — NOT a second catalog authority.
//
// The operational data model depends on the Prisma foreign key
// `RedirectLink.toolId -> Prisma Tool.id`. It is NOT a cross-database
// foreign key; there is no FK from Payload into Prisma. When a catalog
// record is created/updated through Payload (the authoritative catalog
// content store in Phase 4A), this module keeps a NARROWLY-SCOPED Prisma
// Tool row and its RedirectLink identity in step so that:
//
//   * existing operational tables that reference Prisma Tool.id keep
//     working (RedirectLink.toolId),
//   * rolling back to Prisma authority (FREEBUFF_CATALOG_WRITE_MODE=prisma)
//     does not require re-seeding.
//
// Only the fields actually required by operational compatibility are
// synchronized. We deliberately do NOT mirror every Payload field here.
// The authoritative catalog content lives in Payload.
// ------------------------------------------------------------------

import { db } from "@/lib/db";

// ------------------------------------------------------------------
// MINIMUM Prisma Tool fields required for operational compatibility.
// Anything not listed here is NOT synchronized by this module — that
// content lives authoritatively in Payload.
// ------------------------------------------------------------------
export interface PrismaToolCompat {
  name: string;
  slug: string;
  websiteUrl: string;
  isPublished: boolean;
  /** Prisma Category.id (NOT Payload category id). Null if unresolved. */
  categoryId: string | null;
  /** Prisma Provider.id (NOT Payload provider id). Null if unresolved. */
  providerId: string | null;
  /** Prisma Tag.ids to attach as ToolTag rows. Undefined = PRESERVE existing ToolTags. */
  tagPrismaIds?: string[];
  pricingType?: string;
  entityType?: string;
}

// ------------------------------------------------------------------
// Resolvers (legacy/bridge id lookups)
// ------------------------------------------------------------------

/**
 * Find an existing Prisma Tool.id by slug. Returns null when no Prisma
 * Tool compatibility row exists yet.
 */
export async function findPrismaToolIdBySlug(slug: string): Promise<string | null> {
  const row = await db.tool.findUnique({ where: { slug }, select: { id: true } });
  return row ? row.id : null;
}

/**
 * Resolve the Payload category id to its Prisma Category.id via the
 * `legacyPrismaId` bridge. Returns null when the category is unknown or
 * has no Prisma counterpart.
 */
export async function resolvePrismaCategoryIdByPayloadId(
  payloadCategoryId: string | null | undefined,
): Promise<string | null> {
  if (!payloadCategoryId) return null;
  const payload = await getPayloadPassthrough();
  const { docs } = await payload.find({
    collection: "categories",
    where: { id: { equals: payloadCategoryId } },
    depth: 0,
    limit: 1,
  });
  const legacy = docs[0]?.legacyPrismaId;
  return legacy ? String(legacy) : null;
}

/**
 * Resolve the Payload provider id to its Prisma Provider.id via the
 * `legacyPrismaId` bridge. Returns null when unknown or absent.
 */
export async function resolvePrismaProviderIdByPayloadId(
  payloadProviderId: string | null | undefined,
): Promise<string | null> {
  if (!payloadProviderId) return null;
  const payload = await getPayloadPassthrough();
  const { docs } = await payload.find({
    collection: "providers",
    where: { id: { equals: payloadProviderId } },
    depth: 0,
    limit: 1,
  });
  const legacy = docs[0]?.legacyPrismaId;
  return legacy ? String(legacy) : null;
}

/**
 * Resolve the Payload tag ids to their Prisma Tag.ids via the
 * `legacyPrismaId` bridge. Unknown tags are skipped.
 */
export async function resolvePrismaTagIdsByPayloadIds(
  payloadTagIds: string[] | undefined,
): Promise<string[]> {
  if (!payloadTagIds || payloadTagIds.length === 0) return [];
  const payload = await getPayloadPassthrough();
  const { docs } = await payload.find({
    collection: "tags",
    where: { id: { in: payloadTagIds } },
    depth: 0,
    limit: 10000,
  });
  const map = new Map<string, string>();
  for (const doc of docs) {
    const legacy = doc.legacyPrismaId;
    if (legacy) map.set(String(doc.id), String(legacy));
  }
  return payloadTagIds
    .map((id) => map.get(id))
    .filter((v): v is string => Boolean(v));
}

// ------------------------------------------------------------------
// Core synchronizer: Prisma Tool + ToolTag + RedirectLink
// ------------------------------------------------------------------

/**
 * Create or update the narrow Prisma Tool compatibility row and keep its
 * ToolTag and RedirectLink identity in step. Idempotent by slug.
 *
 * Returns `{ id, created }` where `id` is the Prisma Tool.id and
 * `created` indicates whether a new row was inserted.
 *
 * This NEVER throws to report a success as a failure state: if the
 * compatibility row cannot be written it rejects loudly so callers can
 * surface a clear catalog-write failure (no silent success).
 */
export async function upsertPrismaToolCompat(
  compat: PrismaToolCompat,
): Promise<{ id: string; created: boolean }> {
  const categoryId = compat.categoryId;
  if (!categoryId) {
    throw new Error(
      "Prisma compatibility sync requires a resolved Prisma categoryId (legacyPrismaId).",
    );
  }

  const existing = await db.tool.findUnique({ where: { slug: compat.slug } });

  if (existing) {
    const updated = await db.tool.update({
      where: { id: existing.id },
      data: {
        name: compat.name,
        websiteUrl: compat.websiteUrl,
        isPublished: compat.isPublished,
        categoryId,
        providerId: compat.providerId,
        pricingType: compat.pricingType ?? existing.pricingType,
        entityType: compat.entityType ?? existing.entityType,
      },
    });
    await syncPrismaToolTags(updated.id, compat.tagPrismaIds);
    await ensurePrismaRedirectLink(updated.id, compat.slug, compat.name, compat.websiteUrl);
    return { id: existing.id, created: false };
  }

  const created = await db.tool.create({
    data: {
      name: compat.name,
      slug: compat.slug,
      description: "",
      websiteUrl: compat.websiteUrl,
      isPublished: compat.isPublished,
      categoryId,
      providerId: compat.providerId,
      pricingType: compat.pricingType ?? "freemium",
      entityType: compat.entityType ?? "TOOL",
      tags: "",
    },
  });
  await syncPrismaToolTags(created.id, compat.tagPrismaIds);
  await ensurePrismaRedirectLink(created.id, compat.slug, compat.name, compat.websiteUrl);
  return { id: created.id, created: true };
}

/**
 * Reconcile the Prisma ToolTag junction for a tool to exactly match the
 * provided set of Prisma Tag ids (create missing, delete removed).
 * ToolTag is Prisma-owned compatibility data; the source of truth for
 * the relationship is the Payload `structuredTags` relationship.
 *
 * When `prismaTagIds` is `undefined` the existing ToolTag rows are
 * PRESERVED untouched (the caller did not change the tag set). An empty
 * array `[]` explicitly clears the set.
 */
export async function syncPrismaToolTags(
  prismaToolId: string,
  prismaTagIds: string[] | undefined,
): Promise<void> {
  if (prismaTagIds === undefined) return;
  const existing = await db.toolTag.findMany({
    where: { toolId: prismaToolId },
    select: { tagId: true },
  });
  const existingSet = new Set(existing.map((e) => e.tagId));
  const targetSet = new Set(prismaTagIds);

  for (const tagId of targetSet) {
    if (!existingSet.has(tagId)) {
      await db.toolTag.create({ data: { toolId: prismaToolId, tagId } });
    }
  }
  for (const tagId of existingSet) {
    if (!targetSet.has(tagId)) {
      await db.toolTag.delete({
        where: { toolId_tagId: { toolId: prismaToolId, tagId } },
      });
    }
  }
}

/**
 * Ensure a Prisma RedirectLink row exists pointing at the Prisma Tool.id,
 * preserving the operational `RedirectLink.toolId -> Tool.id` invariant.
 * RedirectLink is Prisma-owned operational data; it is NOT part of the
 * catalog write boundary.
 */
export async function ensurePrismaRedirectLink(
  prismaToolId: string,
  slug: string,
  name: string,
  destination: string,
): Promise<void> {
  const existing = await db.redirectLink.findFirst({ where: { toolId: prismaToolId } });
  if (existing) {
    await db.redirectLink.update({
      where: { id: existing.id },
      data: { slug, name, destination, isActive: true },
    });
    return;
  }

  // The slug must be globally unique in RedirectLink; if some other link
  // already owns the slug, leave that row and don't clobber it.
  const slugOwner = await db.redirectLink.findUnique({ where: { slug } });
  if (slugOwner) return;

  await db.redirectLink.create({
    data: {
      slug,
      name,
      destination,
      toolId: prismaToolId,
      isActive: true,
      clickCount: 0,
    },
  });
}

/**
 * Soft-remove the Prisma RedirectLink association for a tool that has been
 * unpublished (or genuinely deleted). Keeps the row but clears toolId so
 * the operational FK does not dangle. Prisma-owned operational row.
 */
export async function detachPrismaRedirectLink(prismaToolId: string): Promise<void> {
  await db.redirectLink.updateMany({
    where: { toolId: prismaToolId },
    data: { toolId: null },
  });
}

// ------------------------------------------------------------------
// Category / Provider / Tag COMPATIBILITY IDENTITY
// ------------------------------------------------------------------
// New Payload-authoritative catalog records still require a 
// `legacyPrismaId` (the schema keeps it NOT NULL) and the runtime read
// path resolves category by Prisma id (buildToolWhere -> category.legacyPrismaId).
// So when the write boundary creates a genuinely NEW category/provider/tag,
// it first establishes a narrowly-scoped Prisma compat row and uses that id
// as the Payload `legacyPrismaId` bridge. This mirrors the existing tool
// creation order (4A.7) and keeps the operational boundary in step without a
// fragile DB schema change.
// ------------------------------------------------------------------

/** Create (or return existing) a Prisma Category compat row. Idempotent by slug. */
export async function upsertPrismaCategoryCompat(input: {
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  sortOrder?: number;
}): Promise<{ id: string }> {
  const existing = await db.category.findUnique({ where: { slug: input.slug } });
  if (existing) return { id: existing.id };
  const created = await db.category.create({
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      icon: input.icon ?? null,
      sortOrder: input.sortOrder ?? 0,
    },
  });
  return { id: created.id };
}

/** Create (or return existing) a Prisma Provider compat row. Idempotent by slug. */
export async function upsertPrismaProviderCompat(input: {
  name: string;
  slug: string;
  description?: string | null;
  websiteUrl?: string | null;
  logo?: string | null;
}): Promise<{ id: string }> {
  const existing = await db.provider.findUnique({ where: { slug: input.slug } });
  if (existing) return { id: existing.id };
  const created = await db.provider.create({
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      websiteUrl: input.websiteUrl ?? null,
      logo: input.logo ?? null,
    },
  });
  return { id: created.id };
}

/** Create (or return existing) a Prisma Tag compat row. Idempotent by slug. */
export async function upsertPrismaTagCompat(input: {
  name: string;
  slug: string;
}): Promise<{ id: string }> {
  const existing = await db.tag.findUnique({ where: { slug: input.slug } });
  if (existing) return { id: existing.id };
  const created = await db.tag.create({
    data: { name: input.name, slug: input.slug },
  });
  return { id: created.id };
}

/**
 * Synchronize an existing Prisma Category compat row with the authoritative
 * Payload values. Keys provided in `input` are written; undefined keys are
 * left untouched. Only runs when the Payload doc carries a legacyPrismaId.
 */
export async function updatePrismaCategoryCompat(
  legacyPrismaId: string,
  input: { name?: string; slug?: string; description?: string | null; icon?: string | null; sortOrder?: number },
): Promise<void> {
  const data: Record<string, unknown> = {};
  if (input.name != null) data.name = input.name;
  if (input.slug != null) data.slug = input.slug;
  if (input.description !== undefined) data.description = input.description;
  if (input.icon !== undefined) data.icon = input.icon;
  if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;
  if (Object.keys(data).length === 0) return;
  await db.category.update({ where: { id: legacyPrismaId }, data }).catch((err) => {
    if (!/not found|does not exist|NotFound/i.test(String(err?.message ?? err))) throw err;
  });
}

/** Synchronize an existing Prisma Provider compat row with Payload values. */
export async function updatePrismaProviderCompat(
  legacyPrismaId: string,
  input: { name?: string; slug?: string; description?: string | null; websiteUrl?: string | null; logo?: string | null },
): Promise<void> {
  const data: Record<string, unknown> = {};
  if (input.name != null) data.name = input.name;
  if (input.slug != null) data.slug = input.slug;
  if (input.description !== undefined) data.description = input.description;
  if (input.websiteUrl !== undefined) data.websiteUrl = input.websiteUrl;
  if (input.logo !== undefined) data.logo = input.logo;
  if (Object.keys(data).length === 0) return;
  await db.provider.update({ where: { id: legacyPrismaId }, data }).catch((err) => {
    if (!/not found|does not exist|NotFound/i.test(String(err?.message ?? err))) throw err;
  });
}

/** Synchronize an existing Prisma Tag compat row with Payload values. */
export async function updatePrismaTagCompat(
  legacyPrismaId: string,
  input: { name?: string; slug?: string },
): Promise<void> {
  const data: Record<string, unknown> = {};
  if (input.name != null) data.name = input.name;
  if (input.slug != null) data.slug = input.slug;
  if (Object.keys(data).length === 0) return;
  await db.tag.update({ where: { id: legacyPrismaId }, data }).catch((err) => {
    if (!/not found|does not exist|NotFound/i.test(String(err?.message ?? err))) throw err;
  });
}

/**
 * Remove the Prisma compatibility rows for a genuinely-deleted tool:
 * RedirectLink (toolId SetNull'd), ToolTag (cascade), and the Tool row.
 * Keeps Prisma ops clean and consistent with the Payload store after a
 * real admin delete.
 */
export async function deletePrismaToolCompat(prismaToolId: string): Promise<void> {
  await db.redirectLink.updateMany({
    where: { toolId: prismaToolId },
    data: { toolId: null },
  });
  await db.toolTag.deleteMany({ where: { toolId: prismaToolId } });
  await db.tool.delete({ where: { id: prismaToolId } }).catch((err) => {
    // Tool may already be gone (idempotency). Swallow only "not found".
    if (!/not found|does not exist|NotFound/i.test(String(err?.message ?? err))) {
      throw err;
    }
  });
}

// ------------------------------------------------------------------
// Payload passthrough (lazy import to avoid circularity)
// ------------------------------------------------------------------
async function getPayloadPassthrough() {
  const { getPayload } = await import("payload");
  const config = (await import("@payload-config")).default;
  return getPayload({ config });
}
