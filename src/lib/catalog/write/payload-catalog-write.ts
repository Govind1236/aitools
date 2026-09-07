// ------------------------------------------------------------------
// PAYLOAD CATALOG WRITE REPOSITORY
// ------------------------------------------------------------------
// Implements CatalogWriteRepository with Payload CMS's LOCAL API (no HTTP
// calls to /cms). Payload is the authoritative catalog CONTENT store in
// this mode.
//
// After each authoritative Payload write, the narrowly-scoped Prisma
// COMPATIBILITY synchronizer keeps the operational dependency
// `RedirectLink.toolId -> Prisma Tool.id` in step (see prisma-compat-sync).
// ------------------------------------------------------------------

import { getPayloadClient } from "@/lib/payload/db";
import { createSlug, validateSlug, validateUrl } from "@/lib/validation";
import type { Payload } from "payload";
import type { WriteResponse } from "./catalog-write-types";
import {
  deletePrismaToolCompat,
  findPrismaToolIdBySlug,
  resolvePrismaCategoryIdByPayloadId,
  resolvePrismaProviderIdByPayloadId,
  resolvePrismaTagIdsByPayloadIds,
  upsertPrismaCategoryCompat,
  upsertPrismaProviderCompat,
  upsertPrismaTagCompat,
  upsertPrismaToolCompat,
  updatePrismaCategoryCompat,
  updatePrismaProviderCompat,
  updatePrismaTagCompat,
} from "./prisma-compat-sync";

/* eslint-disable @typescript-eslint/no-explicit-any */

function slugify(name: string): string {
  return createSlug(name);
}

/**
 * Payload SQLite stores relationship references against integer document id
 * columns (see `tools_rels.parent_id`/`tags_id`). Passing a string id (e.g.
 * "11") makes the adapter misinterpret it as "<id> <order>", so relationship
 * values must be converted to numeric ids before writing.
 */
function toRelId(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Resolve/upsert a tag by selection (id or name/slug). Mirrors the
 * behaviour the existing admin UI relies on (find by id, then by slug,
 * then create). Returns the Payload tag id.
 *
 * For a genuinely new tag (no Prisma counterpart) the Prisma compat
 * identity is established FIRST and its id is used as the Payload
 * `legacyPrismaId` bridge, so the NOT NULL schema constraint and the
 * operational boundary stay intact (see prisma-compat-sync.ts).
 */
async function findOrCreateTag(payload: Payload, sel: { id?: string; name: string }): Promise<string> {
  if (sel.id && !sel.id.startsWith("temp-")) {
    const { docs } = await payload.find({
      collection: "tags",
      where: { id: { equals: sel.id } },
      depth: 0,
      limit: 1,
    });
    if (docs[0]) return String(docs[0].id);
  }

  const slug = slugify(sel.name);
  const { docs: existing } = await payload.find({
    collection: "tags",
    where: { slug: { equals: slug } },
    depth: 0,
    limit: 1,
  });
  if (existing[0]) return String(existing[0].id);

  // Establish the Prisma compat identity first so the Payload record can
  // carry a `legacyPrismaId`. Fails loudly on any partial failure.
  const compat = await upsertPrismaTagCompat({ name: sel.name, slug });

  const created = await payload.create({
    collection: "tags",
    data: { name: sel.name, slug, legacyPrismaId: compat.id },
    draft: false,
  } as any);
  return String(created.id);
}

export const payloadCatalogWrite: CatalogWriteRepositoryLike = {
  async createTool(input) {
    const payload = await getPayloadClient();
    const {
      name, slug: inputSlug, description, logo, websiteUrl, affiliateUrl,
      pricingType, categoryId, rating, isFeatured, isPublished, isSponsored,
      tags, providerId, documentationUrl, pricingUrl, hostingGuide, tagIds,
      tagSelections, entityType, verificationStatus, lastVerifiedAt, sourceUrl,
      metadata,
    } = input;

    if (!name || !description || !websiteUrl || !categoryId) {
      return fail("Name, description, website URL, and category are required");
    }

    const slug = inputSlug || slugify(name);
    const slugValidation = validateSlug(slug);
    if (!slugValidation.valid) return fail(slugValidation.error || "Invalid slug");

    const urlValidation = validateUrl(websiteUrl);
    if (!urlValidation.valid) return fail(urlValidation.error || "Invalid URL");
    if (documentationUrl) {
      const dv = validateUrl(documentationUrl);
      if (!dv.valid) return fail(`Documentation URL: ${dv.error}`);
    }
    if (pricingUrl) {
      const pv = validateUrl(pricingUrl);
      if (!pv.valid) return fail(`Pricing URL: ${pv.error}`);
    }

    // Slug uniqueness against Payload tools.
    const { docs: existing } = await payload.find({
      collection: "tools",
      where: { slug: { equals: slug } },
      depth: 0,
      limit: 1,
    });
    if (existing[0]) return fail("A tool with this slug already exists");

    // Resolve tag ids.
    let resolvedTagIds: string[] = [];
    if (tagSelections && Array.isArray(tagSelections)) {
      for (const sel of tagSelections) {
        const tagId = await findOrCreateTag(payload, sel);
        resolvedTagIds.push(tagId);
      }
    } else if (tagIds && Array.isArray(tagIds)) {
      resolvedTagIds = tagIds.filter((id) => !id.startsWith("temp-"));
    } else if (tags) {
      const tagNames = Array.isArray(tags) ? tags : tags.split(",").map((t) => t.trim()).filter(Boolean);
      for (const tagName of tagNames) {
        const tagId = await findOrCreateTag(payload, { name: tagName });
        resolvedTagIds.push(tagId);
      }
    }

    // ─────────────────────────────────────────────────────────────
    // SAFE CREATION ORDER (Phase 4A § NEW TOOL CREATION)
    //
    // 1. Resolve Prisma identity for category/provider/tags.
    // 2. Create the Prisma COMPATIBILITY identity row FIRST, obtaining
    //    the Prisma Tool.id.
    // 3. Create the Payload Tool with `legacyPrismaId = Prisma Tool.id`.
    // 4. Create the Payload redirect-link (existing app behaviour).
    // 5. The Prisma RedirectLink (toolId = Prisma Tool.id) and ToolTag
    //    rows are established by the compatibility synchronizer.
    //
    // If the compatibility identity cannot be established the whole
    // create FAILS LOUDLY and NO partially-linked tool is created.
    // ─────────────────────────────────────────────────────────────
    const prismaIdentity = await createPrismaIdentityForNewTool(
      payload,
      {
        name,
        slug,
        websiteUrl,
        isPublished: isPublished !== false,
        pricingType: pricingType || "freemium",
        entityType: entityType || "TOOL",
        payloadCategoryId: categoryId,
        payloadProviderId: providerId || null,
        payloadTagIds: resolvedTagIds,
      },
    );

    // Authoritative Payload create, wiring the Prisma Tool.id as the
    // identity bridge. If ANYTHING after the compatibility identity is
    // created fails, we reconcile by removing the dangling Prisma compat
    // row so no partially-linked tool ever persists (see Phase 4A §
    // NEW TOOL CREATION — failure handling).
    let payloadDoc: any = null;
    let payloadLinkId: string | null = null;
    try {
      payloadDoc = (await payload.create({
        collection: "tools",
        data: {
          name,
          slug,
          description,
          logo: logo || null,
          websiteUrl,
          affiliateUrl: affiliateUrl || null,
          pricingType: pricingType || "freemium",
          category: toRelId(categoryId),
          rating: rating || 0,
          isFeatured: isFeatured || false,
          isPublished: isPublished !== false,
          isSponsored: isSponsored || false,
          tags: Array.isArray(tags) ? tags.join(",") : tags || "",
          provider: toRelId(providerId),
          documentationUrl: documentationUrl || null,
          pricingUrl: pricingUrl || null,
          hostingGuide: hostingGuide || null,
          structuredTags: resolvedTagIds.map((t) => toRelId(t)).filter((v): v is number => v !== null),
          entityType: entityType || "TOOL",
          verificationStatus: verificationStatus || "UNVERIFIED",
          lastVerifiedAt: lastVerifiedAt || null,
          sourceUrl: sourceUrl || null,
          metadata: metadata || null,
          legacyPrismaId: prismaIdentity.source, // Prisma Tool.id
        },
      } as any)) as any;

      // Preserve the application's existing redirect behaviour: the admin
      // Tool page creates a redirect on tool creation. This is the
      // Payload redirect the /go route reads.
      const createdLink = (await payload.create({
        collection: "redirect-links",
        data: {
          slug: String(payloadDoc.slug),
          name: String(payloadDoc.name),
          destination: String(payloadDoc.websiteUrl),
          tool: payloadDoc.id as any,
          isActive: true,
        },
      } as any)) as any;
      payloadLinkId = createdLink?.id ? String(createdLink.id) : null;
    } catch (err) {
      // Reconciliation: remove any partial artifacts. Never report a
      // success when only part of the operation succeeded.
      await reconcileFailedToolCreate(prismaIdentity.source, payloadDoc, payloadLinkId);
      throw err;
    }

    const tool = payloadDoc;
    return {
      ok: true,
      data: tool,
      identity: {
        payloadId: String(tool.id),
        prismaToolId: prismaIdentity.source,
        legacyPrismaId: prismaIdentity.source,
        slug: String(tool.slug),
        name: String(tool.name),
      },
    };
  },

  async updateTool(id, input) {
    const payload = await getPayloadClient();

    const { docs: existingArr } = await payload.find({
      collection: "tools",
      where: { id: { equals: id } },
      depth: 1,
      limit: 1,
    });
    const existing = existingArr[0];
    if (!existing) return fail("Tool not found");

    if (input.websiteUrl) {
      const uv = validateUrl(input.websiteUrl);
      if (!uv.valid) return fail(uv.error || "Invalid URL");
    }
    if (input.documentationUrl) {
      const dv = validateUrl(input.documentationUrl);
      if (!dv.valid) return fail(`Documentation URL: ${dv.error}`);
    }
    if (input.pricingUrl) {
      const pv = validateUrl(input.pricingUrl);
      if (!pv.valid) return fail(`Pricing URL: ${pv.error}`);
    }

    let tagUpdateData: string[] | undefined = undefined;
    if (input.tagSelections && Array.isArray(input.tagSelections)) {
      tagUpdateData = [];
      for (const sel of input.tagSelections) {
        const tagId = await findOrCreateTag(payload, sel);
        tagUpdateData.push(tagId);
      }
    } else if (input.tagIds && Array.isArray(input.tagIds)) {
      tagUpdateData = input.tagIds.filter((id) => !id.startsWith("temp-"));
    }

    const updateData: Record<string, unknown> = {};
    if (input.name) updateData.name = input.name;
    if (input.description) updateData.description = input.description;
    if (input.logo !== undefined) updateData.logo = input.logo || null;
    if (input.websiteUrl) updateData.websiteUrl = input.websiteUrl;
    if (input.affiliateUrl !== undefined) updateData.affiliateUrl = input.affiliateUrl || null;
    if (input.pricingType) updateData.pricingType = input.pricingType;
    if (input.categoryId) updateData.category = input.categoryId ? toRelId(input.categoryId) : undefined;
    if (input.rating !== undefined) updateData.rating = input.rating;
    if (input.isFeatured !== undefined) updateData.isFeatured = input.isFeatured;
    if (input.isPublished !== undefined) updateData.isPublished = input.isPublished;
    if (input.isSponsored !== undefined) updateData.isSponsored = input.isSponsored;
    if (input.tags !== undefined) updateData.tags = Array.isArray(input.tags) ? input.tags.join(",") : input.tags;
    if (input.providerId !== undefined) updateData.provider = input.providerId ? toRelId(input.providerId) : null;
    if (input.documentationUrl !== undefined) updateData.documentationUrl = input.documentationUrl || null;
    if (input.pricingUrl !== undefined) updateData.pricingUrl = input.pricingUrl || null;
    if (input.hostingGuide !== undefined) updateData.hostingGuide = input.hostingGuide || null;
    if (input.entityType !== undefined) updateData.entityType = input.entityType;
    if (input.verificationStatus !== undefined) updateData.verificationStatus = input.verificationStatus;
    if (input.lastVerifiedAt !== undefined) updateData.lastVerifiedAt = input.lastVerifiedAt || null;
    if (input.sourceUrl !== undefined) updateData.sourceUrl = input.sourceUrl || null;
    if (input.metadata !== undefined) updateData.metadata = input.metadata || null;
    if (tagUpdateData !== undefined) updateData.structuredTags = tagUpdateData.map((t) => toRelId(t)).filter((v): v is number => v !== null);

    const tool: any = await payload.update({
      collection: "tools",
      id,
      data: updateData,
    } as any);

    // Update the Payload redirect link if the destination changed.
    if (input.websiteUrl) {
      const { docs: redirectDocs } = await payload.find({
        collection: "redirect-links",
        where: { tool: { equals: toRelId(id) } },
        depth: 0,
        limit: 1,
      });
      const link = redirectDocs[0];
      if (link) {
        await payload.update({
          collection: "redirect-links",
          id: String(link.id),
          data: { destination: input.websiteUrl },
        } as any);
      }
    }

    // Prisma compatibility sync (transitional).
    const prismaRow = await syncPrismaCompatForTool(payload, {
      name: String(input.name ?? existing.name),
      slug: String(existing.slug),
      websiteUrl: String(input.websiteUrl ?? existing.websiteUrl),
      isPublished:
        input.isPublished !== undefined
          ? Boolean(input.isPublished)
          : Boolean(existing.isPublished),
      pricingType: String(input.pricingType ?? existing.pricingType),
      entityType: String(input.entityType ?? existing.entityType),
      payloadCategoryId: String(
        input.categoryId ?? (typeof existing.category === "object" ? existing.category.id : existing.category),
      ),
      payloadProviderId:
        input.providerId !== undefined
          ? input.providerId
          : existing.provider
            ? String(typeof existing.provider === "object" ? existing.provider.id : existing.provider)
            : null,
      payloadTagIds: tagUpdateData,
    });

    return {
      ok: true,
      data: tool,
      identity: {
        payloadId: String(tool.id),
        prismaToolId: prismaRow?.id ?? null,
        legacyPrismaId: prismaRow?.id ?? null,
        slug: String(existing.slug),
        name: String(input.name ?? existing.name),
      },
    };
  },

  async publishTool(id) {
    const payload = await getPayloadClient();
    const { docs } = await payload.find({
      collection: "tools",
      where: { id: { equals: id } },
      depth: 1,
      limit: 1,
    });
    const existing = docs[0];
    if (!existing) return fail("Tool not found");

    const tool: any = await payload.update({ collection: "tools", id, data: { isPublished: true } } as any);
    await syncPrismaCompatForTool(payload, {
      name: String(existing.name),
      slug: String(existing.slug),
      websiteUrl: String(existing.websiteUrl),
      isPublished: true,
      pricingType: String(existing.pricingType),
      entityType: String(existing.entityType),
      payloadCategoryId: String(typeof existing.category === "object" ? existing.category.id : existing.category),
      payloadProviderId: existing.provider
        ? String(typeof existing.provider === "object" ? existing.provider.id : existing.provider)
        : null,
      payloadTagIds: undefined,
    });
    return {
      ok: true,
      data: tool,
      identity: { payloadId: String(tool.id), prismaToolId: null, legacyPrismaId: null, slug: String(existing.slug), name: String(existing.name) },
    };
  },

  async unpublishTool(id) {
    const payload = await getPayloadClient();
    const { docs } = await payload.find({
      collection: "tools",
      where: { id: { equals: id } },
      depth: 1,
      limit: 1,
    });
    const existing = docs[0];
    if (!existing) return fail("Tool not found");

    const tool: any = await payload.update({ collection: "tools", id, data: { isPublished: false } } as any);
    await syncPrismaCompatForTool(payload, {
      name: String(existing.name),
      slug: String(existing.slug),
      websiteUrl: String(existing.websiteUrl),
      isPublished: false,
      pricingType: String(existing.pricingType),
      entityType: String(existing.entityType),
      payloadCategoryId: String(typeof existing.category === "object" ? existing.category.id : existing.category),
      payloadProviderId: existing.provider
        ? String(typeof existing.provider === "object" ? existing.provider.id : existing.provider)
        : null,
      payloadTagIds: undefined,
    });
    return {
      ok: true,
      data: tool,
      identity: { payloadId: String(tool.id), prismaToolId: null, legacyPrismaId: null, slug: String(existing.slug), name: String(existing.name) },
    };
  },

  async deleteTool(id) {
    const payload = await getPayloadClient();

    const { docs } = await payload.find({
      collection: "tools",
      where: { id: { equals: id } },
      depth: 1,
      limit: 1,
    });
    if (!docs[0]) return fail("Tool not found");
    const existing = docs[0];

    // Delete the Payload redirect link first (existing app behaviour).
    await payload.delete({
      collection: "redirect-links",
      where: { tool: { equals: toRelId(id) } },
    } as any);

    // Capture the Prisma Tool.id BEFORE removing the Payload tool so we can
    // clean up the Prisma compatibility rows.
    const prismaToolId = existing.legacyPrismaId
      ? String(existing.legacyPrismaId)
      : await findPrismaToolIdBySlug(String(existing.slug));

    await payload.delete({ collection: "tools", id });

    if (prismaToolId) {
      await deletePrismaToolCompat(prismaToolId);
    }

    return {
      ok: true,
      data: { success: true },
      identity: { payloadId: id, prismaToolId, legacyPrismaId: prismaToolId, slug: String(existing.slug), name: String(existing.name) },
    };
  },

  async createCategory(input) {
    const payload = await getPayloadClient();
    const slug = input.slug || slugify(input.name);
    const { docs: existing } = await payload.find({
      collection: "categories",
      where: { slug: { equals: slug } },
      depth: 0,
      limit: 1,
    });
    if (existing[0]) return fail("A category with this slug already exists");

    // Establish the Prisma compat identity first so the Payload record can
    // carry a legacyPrismaId (NOT NULL schema + runtime category filter).
    const compat = await upsertPrismaCategoryCompat({
      name: input.name,
      slug,
      description: input.description || null,
      icon: input.icon || null,
      sortOrder: input.sortOrder ?? 0,
    });

    const doc: any = await payload.create({
      collection: "categories",
      data: {
        name: input.name,
        slug,
        description: input.description || null,
        icon: input.icon || null,
        sortOrder: input.sortOrder || 0,
        legacyPrismaId: compat.id,
      },
    } as any);
    return {
      ok: true,
      data: doc,
      identity: { payloadId: String(doc.id), prismaToolId: null, legacyPrismaId: compat.id, slug, name: input.name },
    };
  },

  async updateCategory(id, input) {
    const payload = await getPayloadClient();
    const { docs } = await payload.find({
      collection: "categories",
      where: { id: { equals: id } },
      depth: 0,
      limit: 1,
    });
    if (!docs[0]) return fail("Category not found");
    const data: Record<string, unknown> = {};
    if (input.name) data.name = input.name;
    if (input.slug) data.slug = input.slug;
    if (input.description !== undefined) data.description = input.description || null;
    if (input.icon !== undefined) data.icon = input.icon || null;
    if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;
    const doc: any = await payload.update({ collection: "categories", id, data } as any);
    await syncCategoryProviderTagCompat("category", doc, input);
    return {
      ok: true,
      data: doc,
      identity: { payloadId: String(doc.id), prismaToolId: null, legacyPrismaId: doc.legacyPrismaId ? String(doc.legacyPrismaId) : null, slug: String(doc.slug), name: String(doc.name) },
    };
  },

  async createProvider(input) {
    const payload = await getPayloadClient();
    const slug = input.slug || slugify(input.name);
    const { docs: existing } = await payload.find({
      collection: "providers",
      where: { slug: { equals: slug } },
      depth: 0,
      limit: 1,
    });
    if (existing[0]) return fail("A provider with this slug already exists");

    // Establish the Prisma compat identity first so the Payload record can
    // carry a legacyPrismaId (NOT NULL schema + provider-repository reads).
    const compat = await upsertPrismaProviderCompat({
      name: input.name,
      slug,
      description: input.description || null,
      websiteUrl: input.websiteUrl || null,
      logo: input.logo || null,
    });

    const doc: any = await payload.create({
      collection: "providers",
      data: {
        name: input.name,
        slug,
        description: input.description || null,
        websiteUrl: input.websiteUrl || null,
        logo: input.logo || null,
        legacyPrismaId: compat.id,
      },
    } as any);
    return {
      ok: true,
      data: doc,
      identity: { payloadId: String(doc.id), prismaToolId: null, legacyPrismaId: compat.id, slug, name: input.name },
    };
  },

  async updateProvider(id, input) {
    const payload = await getPayloadClient();
    const { docs } = await payload.find({
      collection: "providers",
      where: { id: { equals: id } },
      depth: 0,
      limit: 1,
    });
    if (!docs[0]) return fail("Provider not found");
    const data: Record<string, unknown> = {};
    if (input.name) data.name = input.name;
    if (input.slug) data.slug = input.slug;
    if (input.description !== undefined) data.description = input.description || null;
    if (input.websiteUrl !== undefined) data.websiteUrl = input.websiteUrl || null;
    if (input.logo !== undefined) data.logo = input.logo || null;
    const doc: any = await payload.update({ collection: "providers", id, data } as any);
    await syncCategoryProviderTagCompat("provider", doc, input);
    return {
      ok: true,
      data: doc,
      identity: { payloadId: String(doc.id), prismaToolId: null, legacyPrismaId: doc.legacyPrismaId ? String(doc.legacyPrismaId) : null, slug: String(doc.slug), name: String(doc.name) },
    };
  },

  async createTag(input) {
    const payload = await getPayloadClient();
    const slug = input.slug || slugify(input.name);
    const { docs: existing } = await payload.find({
      collection: "tags",
      where: { slug: { equals: slug } },
      depth: 0,
      limit: 1,
    });
    if (existing[0]) return fail("A tag with this slug already exists");

    // Establish the Prisma compat identity first so the Payload record can
    // carry a legacyPrismaId (NOT NULL schema + ToolTag junction).
    const compat = await upsertPrismaTagCompat({ name: input.name, slug });

    const doc: any = await payload.create({
      collection: "tags",
      data: { name: input.name, slug, legacyPrismaId: compat.id },
      draft: false,
    } as any);
    return {
      ok: true,
      data: doc,
      identity: { payloadId: String(doc.id), prismaToolId: null, legacyPrismaId: compat.id, slug, name: input.name },
    };
  },

  async updateTag(id, input) {
    const payload = await getPayloadClient();
    const { docs } = await payload.find({
      collection: "tags",
      where: { id: { equals: id } },
      depth: 0,
      limit: 1,
    });
    if (!docs[0]) return fail("Tag not found");
    const data: Record<string, unknown> = {};
    if (input.name) data.name = input.name;
    if (input.slug) data.slug = input.slug;
    const doc: any = await payload.update({ collection: "tags", id, data, draft: false } as any);
    await syncCategoryProviderTagCompat("tag", doc, input);
    return {
      ok: true,
      data: doc,
      identity: { payloadId: String(doc.id), prismaToolId: null, legacyPrismaId: doc.legacyPrismaId ? String(doc.legacyPrismaId) : null, slug: String(doc.slug), name: String(doc.name) },
    };
  },
};

function fail(error: string): WriteResponse {
  return { ok: false, error: new Error(error) };
}

// ------------------------------------------------------------------
// Shared helper: sync a Category/Provider/Tag's Prisma compat row from the
// authoritative Payload doc after an update. Best-effort: if the record has
// no legacyPrismaId yet it is left untouched.
// ------------------------------------------------------------------
async function syncCategoryProviderTagCompat(
  kind: "category" | "provider" | "tag",
  doc: any,
  input: {
    name?: string;
    slug?: string;
    description?: string | null;
    icon?: string | null;
    sortOrder?: number;
    websiteUrl?: string | null;
    logo?: string | null;
  },
): Promise<void> {
  const legacy = doc?.legacyPrismaId ? String(doc.legacyPrismaId) : null;
  if (!legacy) return;

  if (kind === "category") {
    await updatePrismaCategoryCompat(legacy, {
      name: input.name,
      slug: input.slug,
      description: input.description,
      icon: input.icon,
      sortOrder: input.sortOrder,
    });
  } else if (kind === "provider") {
    await updatePrismaProviderCompat(legacy, {
      name: input.name,
      slug: input.slug,
      description: input.description,
      websiteUrl: input.websiteUrl,
      logo: input.logo,
    });
  } else {
    await updatePrismaTagCompat(legacy, { name: input.name, slug: input.slug });
  }
}

// ------------------------------------------------------------------
// Shared helper: run the Prisma compatibility synchronizer for a tool.
// Resolves Payload ids -> Prisma ids via legacyPrismaId and keeps the
// Prisma Tool row, ToolTag junction, and RedirectLink identity in step.
// ------------------------------------------------------------------
async function syncPrismaCompatForTool(
  payload: Payload,
  input: {
    name: string;
    slug: string;
    websiteUrl: string;
    isPublished: boolean;
    pricingType: string;
    entityType: string;
    payloadCategoryId: string;
    payloadProviderId: string | null;
    payloadTagIds?: string[];
  },
) {
  const prismaCategoryId = await resolvePrismaCategoryIdByPayloadId(input.payloadCategoryId);
  const prismaProviderId = await resolvePrismaProviderIdByPayloadId(input.payloadProviderId);
  const prismaTagIds =
    input.payloadTagIds === undefined
      ? undefined
      : input.payloadTagIds.length > 0
        ? await resolvePrismaTagIdsByPayloadIds(input.payloadTagIds)
        : [];

  const row = await upsertPrismaToolCompat({
    name: input.name,
    slug: input.slug,
    websiteUrl: input.websiteUrl,
    isPublished: input.isPublished,
    categoryId: prismaCategoryId,
    providerId: prismaProviderId,
    tagPrismaIds: prismaTagIds,
    pricingType: input.pricingType,
    entityType: input.entityType,
  });
  return row;
}

/**
 * Establishment helper for NEW tool creation (Phase 4A § NEW TOOL CREATION).
 *
 * Creates the Prisma COMPATIBILITY identity row FIRST so its Prisma Tool.id
 * can be wired into the Payload Tool as `legacyPrismaId`. Returns
 * `{ source }` where `source` is the Prisma Tool.id.
 *
 * Fails loudly (throws) when the identity cannot be established — callers
 * must NOT create a partially-linked tool in that case.
 */
async function createPrismaIdentityForNewTool(
  payload: Payload,
  input: {
    name: string;
    slug: string;
    websiteUrl: string;
    isPublished: boolean;
    pricingType: string;
    entityType: string;
    payloadCategoryId: string;
    payloadProviderId: string | null;
    payloadTagIds?: string[];
  },
): Promise<{ source: string }> {
  const prismaCategoryId = await resolvePrismaCategoryIdByPayloadId(input.payloadCategoryId);
  if (!prismaCategoryId) {
    throw new Error(
      "Cannot create tool: the selected category has no Prisma compatibility identity (legacyPrismaId). " +
      "No tool was created.",
    );
  }
  const prismaProviderId = await resolvePrismaProviderIdByPayloadId(input.payloadProviderId);
  const prismaTagIds =
    input.payloadTagIds === undefined
      ? undefined
      : input.payloadTagIds.length > 0
        ? await resolvePrismaTagIdsByPayloadIds(input.payloadTagIds)
        : [];

  const row = await upsertPrismaToolCompat({
    name: input.name,
    slug: input.slug,
    websiteUrl: input.websiteUrl,
    isPublished: input.isPublished,
    categoryId: prismaCategoryId,
    providerId: prismaProviderId,
    tagPrismaIds: prismaTagIds,
    pricingType: input.pricingType,
    entityType: input.entityType,
  });
  return { source: row.id };
}

// ------------------------------------------------------------------
// Type alias (imported interface is used for structural conformance)
// ------------------------------------------------------------------
import type { CatalogWriteRepository } from "./catalog-write-repository";
type CatalogWriteRepositoryLike = CatalogWriteRepository;

/**
 * Reconciliation for a failed tool CREATE (Phase 4A § failure handling).
 * Removes any partial artifacts so no partially-linked tool persists:
 *  - the Payload redirect-link (if created)
 *  - the Payload tool (if created)
 *  - the Prisma compatibility row (ToolTag + RedirectLink + Tool)
 * Order matters: Payload link/tool first (they reference Prisma ids only
 * through the bridge, but cleanup order avoids FK issues in both stores).
 * Logged loudly — this is an abnormal, partially-failed creation.
 */
async function reconcileFailedToolCreate(
  prismaToolId: string | null,
  payloadDoc: any,
  payloadLinkId: string | null,
): Promise<void> {
  const payload = await getPayloadClient();

  if (payloadLinkId) {
    try {
      await payload.delete({ collection: "redirect-links", where: { id: { equals: payloadLinkId } } } as any);
    } catch (err) {
      console.error("[catalog-write] reconcile: failed to delete Payload redirect-link", payloadLinkId, err);
    }
  }
  if (payloadDoc?.id) {
    try {
      await payload.delete({ collection: "tools", id: String(payloadDoc.id) });
    } catch (err) {
      console.error("[catalog-write] reconcile: failed to delete Payload tool", payloadDoc.id, err);
    }
  }
  if (prismaToolId) {
    try {
      await deletePrismaToolCompat(prismaToolId);
    } catch (err) {
      console.error("[catalog-write] reconcile: failed to delete Prisma compat rows", prismaToolId, err);
    }
  }
}
