import { getPayloadClient } from "@/lib/payload/db";
import { createSlug, validateSlug, validateUrl } from "@/lib/validation";
import type { Payload } from "payload";

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyDoc = Record<string, any>;

// ────────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────────

function slugify(name: string): string {
  return createSlug(name);
}

async function findOrCreateTag(payload: Payload, sel: { id?: string; name: string }): Promise<string> {
  if (sel.id && !sel.id.startsWith("temp-")) {
    const { docs } = await payload.find({
      collection: "tags",
      where: { id: { equals: sel.id } },
      limit: 1,
    });
    if (docs[0]) return String(docs[0].id);
  }

  const slug = slugify(sel.name);
  const { docs: existing } = await payload.find({
    collection: "tags",
    where: { slug: { equals: slug } },
    limit: 1,
  });
  if (existing[0]) return String(existing[0].id);

  const created = await payload.create({
    collection: "tags",
    data: { name: sel.name, slug },
    draft: false,
  } as any);
  return String(created.id);
}

// ────────────────────────────────────────────────────────────────────
// TOOLS ADMIN
// ────────────────────────────────────────────────────────────────────

function normalizeToolDoc(doc: AnyDoc): Record<string, unknown> {
  const cat = doc.category;
  const provider = doc.provider;
  const tags = doc.structuredTags;

  return {
    id: String(doc.id),
    name: String(doc.name),
    slug: String(doc.slug),
    description: String(doc.description),
    logo: doc.logo ?? null,
    websiteUrl: String(doc.websiteUrl),
    pricingType: String(doc.pricingType),
    isPublished: Boolean(doc.isPublished),
    isFeatured: Boolean(doc.isFeatured),
    rating: Number(doc.rating ?? 0),
    tags: String(doc.tags ?? ""),
    providerId: provider
      ? String(typeof provider === "object" ? (provider.legacyPrismaId ?? provider.id) : provider)
      : null,
    provider: provider && typeof provider === "object"
      ? { id: String(provider.id), name: String(provider.name) }
      : null,
    structuredTags: Array.isArray(tags)
      ? tags.map((st: any) => {
          const tagDoc = typeof st === "object" && st !== null ? st : null;
          return tagDoc
            ? { id: String(tagDoc.id), name: String(tagDoc.name), slug: String(tagDoc.slug) }
            : null;
        }).filter(Boolean)
      : [],
    documentationUrl: doc.documentationUrl ?? null,
    pricingUrl: doc.pricingUrl ?? null,
    category: cat && typeof cat === "object"
      ? { id: String(cat.id), name: String(cat.name), slug: String(cat.slug) }
      : { id: String(doc.category), name: "", slug: "" },
    redirectLink: null as Record<string, unknown> | null,
    entityType: String(doc.entityType ?? "TOOL"),
    verificationStatus: String(doc.verificationStatus ?? "UNVERIFIED"),
    lastVerifiedAt: doc.lastVerifiedAt ? new Date(doc.lastVerifiedAt).toISOString() : null,
    sourceUrl: doc.sourceUrl ?? null,
    metadata: doc.metadata ?? null,
  };
}

export async function getAdminTools() {
  const payload = await getPayloadClient();

  const { docs: toolDocs } = await payload.find({
    collection: "tools",
    depth: 1,
    limit: 10000,
    sort: ["-createdAt"],
  });

  const tools = toolDocs.map(normalizeToolDoc);

  // Attach redirect link data
  const { docs: redirectDocs } = await payload.find({
    collection: "redirect-links",
    depth: 0,
    limit: 10000,
  });
  const redirectMap = new Map<string, AnyDoc>();
  for (const r of redirectDocs) {
    const toolId = r.tool ? String(typeof r.tool === "object" ? r.tool.id : r.tool) : null;
    if (toolId) redirectMap.set(toolId, r);
  }

  for (const tool of tools) {
    const link = redirectMap.get(String(tool.id));
    if (link) {
      tool.redirectLink = {
        id: String(link.id),
        slug: String(link.slug),
        clickCount: Number(link.clickCount ?? 0),
      };
    }
  }

  const { docs: providers } = await payload.find({
    collection: "providers",
    depth: 0,
    limit: 10000,
    sort: ["name"],
  });
  const providerList = providers.map((p: AnyDoc) => ({
    id: String(p.id),
    name: String(p.name),
    slug: String(p.slug),
  }));

  const { docs: tagDocs } = await payload.find({
    collection: "tags",
    depth: 0,
    limit: 10000,
    sort: ["name"],
  });
  const tagList = tagDocs.map((t: AnyDoc) => ({
    id: String(t.id),
    name: String(t.name),
    slug: String(t.slug),
  }));

  return { tools, providers: providerList, tags: tagList };
}

interface CreateToolInput {
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
  tagIds?: string[];
  tagSelections?: { id?: string; name: string }[];
  entityType?: string;
  verificationStatus?: string;
  lastVerifiedAt?: string | null;
  sourceUrl?: string | null;
  metadata?: string | null;
}

export async function createTool(body: CreateToolInput) {
  const payload = await getPayloadClient();

  const {
    name, slug: inputSlug, description, logo, websiteUrl, affiliateUrl,
    pricingType, categoryId, rating, isFeatured, isPublished, isSponsored,
    tags, providerId, documentationUrl, pricingUrl, tagIds, tagSelections,
    entityType, verificationStatus, lastVerifiedAt, sourceUrl, metadata,
  } = body;

  if (!name || !description || !websiteUrl || !categoryId) {
    throw new Error("Name, description, website URL, and category are required");
  }

  const slug = inputSlug || slugify(name);
  const slugValidation = validateSlug(slug);
  if (!slugValidation.valid) throw new Error(slugValidation.error);

  const urlValidation = validateUrl(websiteUrl);
  if (!urlValidation.valid) throw new Error(urlValidation.error);

  if (documentationUrl) {
    const dv = validateUrl(documentationUrl);
    if (!dv.valid) throw new Error(`Documentation URL: ${dv.error}`);
  }
  if (pricingUrl) {
    const pv = validateUrl(pricingUrl);
    if (!pv.valid) throw new Error(`Pricing URL: ${pv.error}`);
  }

  // Check slug uniqueness
  const { docs: existing } = await payload.find({
    collection: "tools",
    where: { slug: { equals: slug } },
    limit: 1,
  });
  if (existing[0]) throw new Error("A tool with this slug already exists");

  // Resolve tags
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
    for (const name of tagNames) {
      const tagId = await findOrCreateTag(payload, { name });
      resolvedTagIds.push(tagId);
    }
  }

  // Find the Payload category by its id
  const tool = (await payload.create({
    collection: "tools",
    data: {
      name,
      slug,
      description,
      logo: logo || null,
      websiteUrl,
      affiliateUrl: affiliateUrl || null,
      pricingType: pricingType || "freemium",
      category: categoryId as any,
      rating: rating || 0,
      isFeatured: isFeatured || false,
      isPublished: isPublished !== false,
      isSponsored: isSponsored || false,
      tags: Array.isArray(tags) ? tags.join(",") : tags || "",
      provider: (providerId || null) as any,
      documentationUrl: documentationUrl || null,
      pricingUrl: pricingUrl || null,
      structuredTags: resolvedTagIds as any,
      entityType: entityType || "TOOL",
      verificationStatus: verificationStatus || "UNVERIFIED",
      lastVerifiedAt: lastVerifiedAt || null,
      sourceUrl: sourceUrl || null,
      metadata: metadata || null,
    },
  } as any)) as any;

  // Create corresponding redirect link
  await payload.create({
    collection: "redirect-links",
    data: {
      slug: String(tool.slug),
      name: String(tool.name),
      destination: String(tool.websiteUrl),
      tool: String(tool.id) as any,
      isActive: true,
    },
  } as any);

  return tool;
}

interface UpdateToolInput extends Partial<CreateToolInput> {}

export async function updateTool(id: string, body: UpdateToolInput) {
  const payload = await getPayloadClient();

  const { docs: existingArr } = await payload.find({
    collection: "tools",
    where: { id: { equals: id } },
    limit: 1,
  });
  const existing = existingArr[0];
  if (!existing) throw new Error("Tool not found");

  // Validate URLs if changed
  if (body.websiteUrl) {
    const uv = validateUrl(body.websiteUrl);
    if (!uv.valid) throw new Error(uv.error);
  }
  if (body.documentationUrl) {
    const dv = validateUrl(body.documentationUrl);
    if (!dv.valid) throw new Error(`Documentation URL: ${dv.error}`);
  }
  if (body.pricingUrl) {
    const pv = validateUrl(body.pricingUrl);
    if (!pv.valid) throw new Error(`Pricing URL: ${pv.error}`);
  }

  // Resolve tags
  let tagUpdateData: string[] | undefined = undefined;
  if (body.tagSelections && Array.isArray(body.tagSelections)) {
    tagUpdateData = [];
    for (const sel of body.tagSelections) {
      const tagId = await findOrCreateTag(payload, sel);
      tagUpdateData.push(tagId);
    }
  } else if (body.tagIds && Array.isArray(body.tagIds)) {
    tagUpdateData = body.tagIds.filter((id) => !id.startsWith("temp-"));
  }

  const updateData: Record<string, unknown> = {};
  if (body.name) updateData.name = body.name;
  if (body.description) updateData.description = body.description;
  if (body.logo !== undefined) updateData.logo = body.logo || null;
  if (body.websiteUrl) updateData.websiteUrl = body.websiteUrl;
  if (body.affiliateUrl !== undefined) updateData.affiliateUrl = body.affiliateUrl || null;
  if (body.pricingType) updateData.pricingType = body.pricingType;
  if (body.categoryId) updateData.category = body.categoryId as any;
  if (body.rating !== undefined) updateData.rating = body.rating;
  if (body.isFeatured !== undefined) updateData.isFeatured = body.isFeatured;
  if (body.isPublished !== undefined) updateData.isPublished = body.isPublished;
  if (body.isSponsored !== undefined) updateData.isSponsored = body.isSponsored;
  if (body.tags !== undefined) updateData.tags = Array.isArray(body.tags) ? body.tags.join(",") : body.tags;
  if (body.providerId !== undefined) updateData.provider = (body.providerId || null) as any;
  if (body.documentationUrl !== undefined) updateData.documentationUrl = body.documentationUrl || null;
  if (body.pricingUrl !== undefined) updateData.pricingUrl = body.pricingUrl || null;
  if (body.entityType !== undefined) updateData.entityType = body.entityType;
  if (body.verificationStatus !== undefined) updateData.verificationStatus = body.verificationStatus;
  if (body.lastVerifiedAt !== undefined) updateData.lastVerifiedAt = body.lastVerifiedAt || null;
  if (body.sourceUrl !== undefined) updateData.sourceUrl = body.sourceUrl || null;
  if (body.metadata !== undefined) updateData.metadata = body.metadata || null;
  if (tagUpdateData !== undefined) updateData.structuredTags = tagUpdateData as any;

  const tool = await payload.update({
    collection: "tools",
    id,
    data: updateData,
  } as any);

  // Update redirect link if destination changed
  if (body.websiteUrl) {
    const { docs: redirectDocs } = await payload.find({
      collection: "redirect-links",
      where: { tool: { equals: id } },
      limit: 1,
    });
    const link = redirectDocs[0];
    if (link) {
      await payload.update({
        collection: "redirect-links",
        id: String(link.id),
        data: { destination: body.websiteUrl },
      } as any);
    }
  }

  return tool;
}

export async function deleteTool(id: string) {
  const payload = await getPayloadClient();

  const { docs } = await payload.find({
    collection: "tools",
    where: { id: { equals: id } },
    limit: 1,
  });
  if (!docs[0]) throw new Error("Tool not found");

  // Delete redirect link first
  await payload.delete({
    collection: "redirect-links",
    where: { tool: { equals: id } },
  } as any);

  await payload.delete({
    collection: "tools",
    id,
  });
}

// ────────────────────────────────────────────────────────────────────
// LINKS ADMIN
// ────────────────────────────────────────────────────────────────────

function normalizeLinkDoc(doc: AnyDoc): Record<string, unknown> {
  const tool = doc.tool;
  const campaign = doc.campaign;
  return {
    id: String(doc.id),
    slug: String(doc.slug),
    name: String(doc.name),
    destination: String(doc.destination),
    isActive: Boolean(doc.isActive),
    clickCount: Number(doc.clickCount ?? 0),
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
    tool: tool && typeof tool === "object"
      ? { id: String(tool.id), name: String(tool.name) }
      : null,
    campaign: campaign && typeof campaign === "object"
      ? { id: String(campaign.id), name: String(campaign.name) }
      : null,
    _count: { clicks: Number(doc.clickCount ?? 0) },
  };
}

export async function getAdminLinks() {
  const payload = await getPayloadClient();

  const { docs } = await payload.find({
    collection: "redirect-links",
    depth: 1,
    limit: 10000,
    sort: ["-createdAt"],
  });

  const links = docs.map(normalizeLinkDoc);
  return { links };
}

interface CreateLinkInput {
  slug: string;
  name: string;
  destination: string;
  toolId?: string | null;
  campaignId?: string | null;
  isActive?: boolean;
}

export async function createLink(body: CreateLinkInput) {
  const payload = await getPayloadClient();

  const { slug, name, destination, toolId, campaignId, isActive } = body;

  if (!slug || !name || !destination) {
    throw new Error("Slug, name, and destination are required");
  }

  const slugValidation = validateSlug(slug);
  if (!slugValidation.valid) throw new Error(slugValidation.error);

  const urlValidation = validateUrl(destination);
  if (!urlValidation.valid) throw new Error(urlValidation.error);

  const { docs: existing } = await payload.find({
    collection: "redirect-links",
    where: { slug: { equals: slug } },
    limit: 1,
  });
  if (existing[0]) throw new Error("A link with this slug already exists");

  const link = await payload.create({
    collection: "redirect-links",
    data: {
      slug,
      name,
      destination,
      tool: (toolId || null) as any,
      campaign: (campaignId || null) as any,
      isActive: isActive !== false,
    },
  } as any);

  return link;
}

interface UpdateLinkInput {
  name?: string;
  destination?: string;
  campaignId?: string | null;
  isActive?: boolean;
}

export async function updateLink(id: string, body: UpdateLinkInput) {
  const payload = await getPayloadClient();

  const { docs } = await payload.find({
    collection: "redirect-links",
    where: { id: { equals: id } },
    limit: 1,
  });
  if (!docs[0]) throw new Error("Link not found");

  if (body.destination) {
    const uv = validateUrl(body.destination);
    if (!uv.valid) throw new Error(uv.error);
  }

  const link = await payload.update({
    collection: "redirect-links",
    id,
    data: {
      ...(body.name && { name: body.name }),
      ...(body.destination && { destination: body.destination }),
      ...(body.campaignId !== undefined && { campaign: (body.campaignId || null) as any }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
  } as any);

  return link;
}

export async function deleteLink(id: string) {
  const payload = await getPayloadClient();

  const { docs } = await payload.find({
    collection: "redirect-links",
    where: { id: { equals: id } },
    limit: 1,
  });
  if (!docs[0]) throw new Error("Link not found");

  // Delete associated data
  await payload.delete({
    collection: "click-events",
    where: { link: { equals: id } },
  } as any);
  await payload.delete({
    collection: "geo-routes",
    where: { link: { equals: id } },
  } as any);
  await payload.delete({
    collection: "redirect-links",
    id,
  });
}

// ────────────────────────────────────────────────────────────────────
// REDIRECT (go/[slug])
// ────────────────────────────────────────────────────────────────────

export async function getRedirectLink(slug: string) {
  const payload = await getPayloadClient();

  const { docs } = await payload.find({
    collection: "redirect-links",
    depth: 2,
    where: { slug: { equals: slug } },
    limit: 1,
  });

  const link = docs[0];
  if (!link) return null;

  // Get geo routes
  const linkId = String(link.id);
  const { docs: geoRoutes } = await payload.find({
    collection: "geo-routes",
    depth: 0,
    where: {
      and: [
        { link: { equals: linkId } },
        { isActive: { equals: true } },
      ],
    },
  });

  return {
    id: linkId,
    slug: String(link.slug),
    destination: String(link.destination),
    isActive: Boolean(link.isActive),
    geoRoutes: geoRoutes.map((gr: AnyDoc) => ({
      id: String(gr.id),
      country: String(gr.country),
      destination: String(gr.destination),
      isActive: Boolean(gr.isActive),
    })),
  };
}