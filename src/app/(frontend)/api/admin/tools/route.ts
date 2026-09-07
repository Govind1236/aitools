import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAdminTools, createTool } from "@/lib/payload/admin";

export async function GET(request: NextRequest) {
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

  try {
    const body = await request.json();
    const tool = await createTool(body);
    return NextResponse.json({ tool }, { status: 201 });
  } catch (error) {
    console.error("Create tool error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.includes("required") || message.includes("already exists") || message.includes("slug") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}