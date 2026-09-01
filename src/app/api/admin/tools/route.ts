import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { validateSlug, validateUrl, createSlug } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tools = await db.tool.findMany({
    include: { category: true, redirectLink: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ tools });
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

    // Check slug uniqueness
    const existing = await db.tool.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "A tool with this slug already exists" },
        { status: 409 }
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
