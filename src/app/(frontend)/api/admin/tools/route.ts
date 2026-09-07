import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAdminTools } from "@/lib/payload/admin";
import { getCatalogWriteRepository } from "@/lib/catalog/write";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await getAdminTools();
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const write = getCatalogWriteRepository();

  try {
    const body = await request.json();
    const result = await write.createTool(body);
    if (!result.ok) {
      // Preserve error mapping / status codes from the existing route.
      const message = result.error.message;
      const status =
        message.includes("required") ||
        message.includes("already exists") ||
        message.includes("slug")
          ? 400
          : 500;
      return NextResponse.json({ error: message }, { status });
    }
    return NextResponse.json({ tool: result.data }, { status: 201 });
  } catch (error) {
    console.error("Create tool error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const status =
      message.includes("required") ||
      message.includes("already exists") ||
      message.includes("slug")
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
