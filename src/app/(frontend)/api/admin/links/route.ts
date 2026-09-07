import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAdminLinks, createLink } from "@/lib/payload/admin";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await getAdminLinks();
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const link = await createLink(body);
    return NextResponse.json({ link }, { status: 201 });
  } catch (error) {
    console.error("Create link error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.includes("required") || message.includes("already exists") || message.includes("slug") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}