import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { validateSlug, validateUrl, createSlug } from "@/lib/validation";

interface TagSelection {
  id?: string;
  name: string;
}

async function resolveTagSelections(
  selections: TagSelection[] | undefined
): Promise<string[]> {
  const tagIds: string[] = [];
  if (!selections || selections.length === 0) return tagIds;
  for (const sel of selections) {
    if (!sel || !sel.name) continue;
    let tag = null;
    if (sel.id && !String(sel.id).startsWith("temp-")) {
      tag = await db.tag.findUnique({ where: { id: sel.id } });
    }
    if (!tag) {
      const slug = createSlug(sel.name);
      tag = await db.tag.upsert({
        where: { slug },
        update: {},
        create: { name: sel.name, slug },
      });
    }
    tagIds.push(tag.id);
  }
  return tagIds;
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tools = await db.tool.findMany({
    include: {
      category: true,
      redirectLink: true,
      provider: true,
      structuredTags: { include: { tag: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Also return providers and tags for the admin form
  const providers = await db.provider.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  const tags = await db.tag.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  return NextResponse.json({ tools, providers, tags });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      name,
      slug: inputSlug,
      description,
      logo,
      websiteUrl,
      affiliateUrl,
      pricingType,
      categoryId,
      rating,
      isFeatured,
      isPublished,
      isSponsored,
      tags,
      providerId,
      documentationUrl,
      pricingUrl,
      tagIds,
      tagSelections,
      // Modernization fields
      entityType,
      verificationStatus,
      lastVerifiedAt,
      sourceUrl,
      metadata,
    } = body;

    // Validation
    if (!name || !description || !websiteUrl || !categoryId) {
      return NextResponse.json(
        { error: "Name, description, website URL, and category are required" },
        { status: 400 }
      );
    }

    const slug = inputSlug || createSlug(name);
    const slugValidation = validateSlug(slug);
    if (!slugValidation.valid) {
      return NextResponse.json(
        { error: slugValidation.error },
        { status: 400 }
      );
    }

    const urlValidation = validateUrl(websiteUrl);
    if (!urlValidation.valid) {
      return NextResponse.json(
        { error: urlValidation.error },
        { status: 400 }
      );
    }

    // Validate documentationUrl and pricingUrl if provided
    if (documentationUrl) {
      const docUrlValidation = validateUrl(documentationUrl);
      if (!docUrlValidation.valid) {
        return NextResponse.json(
          { error: `Documentation URL: ${docUrlValidation.error}` },
          { status: 400 }
        );
      }
    }
    if (pricingUrl) {
      const priceUrlValidation = validateUrl(pricingUrl);
      if (!priceUrlValidation.valid) {
        return NextResponse.json(
          { error: `Pricing URL: ${priceUrlValidation.error}` },
          { status: 400 }
        );
      }
    }

    // Check slug uniqueness
    const existing = await db.tool.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "A tool with this slug already exists" },
        { status: 409 }
      );
    }

    // Resolve tag ids from structured tag selections (or legacy tags array)
    let resolvedTagIds: string[] = [];
    if (tagSelections && Array.isArray(tagSelections)) {
      resolvedTagIds = await resolveTagSelections(tagSelections as TagSelection[]);
    } else if (tagIds && Array.isArray(tagIds)) {
      resolvedTagIds = tagIds;
    } else if (tags) {
      const tagNames = Array.isArray(tags)
        ? tags
        : tags.split(",").map((t: string) => t.trim()).filter(Boolean);
      resolvedTagIds = await resolveTagSelections(
        tagNames.map((name: string) => ({ name }))
      );
    }

    // Create tool
    const tool = await db.tool.create({
      data: {
        name,
        slug,
        description,
        logo: logo || null,
        websiteUrl,
        affiliateUrl: affiliateUrl || null,
        pricingType: pricingType || "freemium",
        categoryId,
        rating: rating || 0,
        isFeatured: isFeatured || false,
        isPublished: isPublished !== false,
        isSponsored: isSponsored || false,
        tags: Array.isArray(tags) ? tags.join(",") : tags || "",
        providerId: providerId || null,
        documentationUrl: documentationUrl || null,
        pricingUrl: pricingUrl || null,
        structuredTags: resolvedTagIds.length
          ? { create: resolvedTagIds.map((tagId: string) => ({ tagId })) }
          : undefined,
        // Modernization fields
        entityType: entityType || "TOOL",
        verificationStatus: verificationStatus || "UNVERIFIED",
        lastVerifiedAt: lastVerifiedAt ? new Date(lastVerifiedAt) : null,
        sourceUrl: sourceUrl || null,
        metadata: metadata || null,
      },
    });

    // Create corresponding redirect link
    await db.redirectLink.create({
      data: {
        slug: tool.slug,
        name: tool.name,
        destination: tool.websiteUrl,
        toolId: tool.id,
        isActive: true,
      },
    });

    return NextResponse.json({ tool }, { status: 201 });
  } catch (error) {
    console.error("Create tool error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
