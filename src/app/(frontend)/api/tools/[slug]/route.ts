import { NextRequest, NextResponse } from "next/server";
import { getToolBySlug } from "@/lib/queries/tools";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const tool = await getToolBySlug(slug);

  if (!tool) {
    return NextResponse.json({ error: "Tool not found" }, { status: 404 });
  }

  return NextResponse.json(tool);
}
