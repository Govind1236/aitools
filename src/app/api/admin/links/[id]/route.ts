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
    const existing = await db.redirectLink.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    if (body.destination) {
      const urlValidation = validateUrl(body.destination);
      if (!urlValidation.valid) {
        return NextResponse.json(
          { error: urlValidation.error },
          { status: 400 }
        );
      }
    }

    const link = await db.redirectLink.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.destination && { destination: body.destination }),
        ...(body.campaignId !== undefined && { campaignId: body.campaignId }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });

    return NextResponse.json({ link });
  } catch (error) {
    console.error("Update link error:", error);
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
    const link = await db.redirectLink.findUnique({ where: { id } });

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    // Delete associated data
    await db.clickEvent.deleteMany({ where: { linkId: id } });
    await db.geoRoute.deleteMany({ where: { linkId: id } });
    await db.redirectLink.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete link error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
