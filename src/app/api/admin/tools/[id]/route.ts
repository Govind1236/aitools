import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { validateUrl } from "@/lib/validation";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const existing = await db.tool.findUnique({ where: { id }, include: { redirectLink: true } });

    if (!existing) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 });
    }

    // Validate website URL if changed
    if (body.websiteUrl) {
      const urlValidation = validateUrl(body.websiteUrl);
      if (!urlValidation.valid) {
        return NextResponse.json(
          { error: urlValidation.error },
          { status: 400 }
        );
      }
    }

    // Update tool
    const tool = await db.tool.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.description && { description: body.description }),
        ...(body.logo !== undefined && { logo: body.logo }),
        ...(body.websiteUrl && { websiteUrl: body.websiteUrl }),
        ...(body.affiliateUrl !== undefined && { affiliateUrl: body.affiliateUrl }),
        ...(body.pricingType && { pricingType: body.pricingType }),
        ...(body.categoryId && { categoryId: body.categoryId }),
        ...(body.rating !== undefined && { rating: body.rating }),
        ...(body.isFeatured !== undefined && { isFeatured: body.isFeatured }),
        ...(body.isPublished !== undefined && { isPublished: body.isPublished }),
        ...(body.isSponsored !== undefined && { isSponsored: body.isSponsored }),
        ...(body.tags !== undefined && {
          tags: Array.isArray(body.tags) ? body.tags.join(",") : body.tags,
        }),
        // Modernization fields
        ...(body.entityType !== undefined && { entityType: body.entityType }),
        ...(body.verificationStatus !== undefined && { verificationStatus: body.verificationStatus }),
        ...(body.lastVerifiedAt !== undefined && { lastVerifiedAt: body.lastVerifiedAt ? new Date(body.lastVerifiedAt) : null }),
        ...(body.sourceUrl !== undefined && { sourceUrl: body.sourceUrl }),
        ...(body.metadata !== undefined && { metadata: body.metadata }),
      },
    });

    // Update corresponding redirect link if destination changed
    if (body.websiteUrl && existing.redirectLink) {
      await db.redirectLink.update({
        where: { id: existing.redirectLink.id },
        data: { destination: body.websiteUrl },
      });
    }

    return NextResponse.json({ tool });
  } catch (error) {
    console.error("Update tool error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const tool = await db.tool.findUnique({ where: { id } });

    if (!tool) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 });
    }

    // Delete redirect link first
    await db.redirectLink.deleteMany({ where: { toolId: id } });

    // Delete tool
    await db.tool.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete tool error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
