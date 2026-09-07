import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCatalogWriteRepository } from "@/lib/catalog/write";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const write = getCatalogWriteRepository();

  try {
    const body = await request.json();
    const result = await write.updateTool(id, body);
    if (!result.ok) {
      const message = result.error.message;
      const status = message.includes("not found") ? 404 : message.includes("slug") ? 400 : 500;
      return NextResponse.json({ error: message }, { status });
    }
    return NextResponse.json({ tool: result.data });
  } catch (error) {
    console.error("Update tool error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.includes("not found") ? 404 : message.includes("slug") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
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
  const write = getCatalogWriteRepository();

  try {
    const result = await write.deleteTool(id);
    if (!result.ok) {
      const message = result.error.message;
      const status = message.includes("not found") ? 404 : 500;
      return NextResponse.json({ error: message }, { status });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete tool error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
