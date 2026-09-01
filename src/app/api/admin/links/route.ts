import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { validateSlug, validateUrl } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const links = await db.redirectLink.findMany({
    include: { tool: true, campaign: true, _count: { select: { clicks: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ links });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { slug, name, destination, toolId, campaignId, isActive } = body;

    if (!slug || !name || !destination) {
      return NextResponse.json(
        { error: "Slug, name, and destination are required" },
        { status: 400 }
      );
    }

    const slugValidation = validateSlug(slug);
    if (!slugValidation.valid) {
      return NextResponse.json(
        { error: slugValidation.error },
        { status: 400 }
      );
    }

    const urlValidation = validateUrl(destination);
    if (!urlValidation.valid) {
      return NextResponse.json(
        { error: urlValidation.error },
        { status: 400 }
      );
    }

    const existing = await db.redirectLink.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "A link with this slug already exists" },
        { status: 409 }
      );
    }

    const link = await db.redirectLink.create({
      data: {
        slug,
        name,
        destination,
        toolId: toolId || null,
        campaignId: campaignId || null,
        isActive: isActive !== false,
      },
    });

    return NextResponse.json({ link }, { status: 201 });
  } catch (error) {
    console.error("Create link error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
