import { NextRequest, NextResponse } from "next/server";
import { buildToolWhere } from "@/lib/tool-query";
import { getToolsDirectory, getToolsDirectoryCount } from "@/lib/queries/tools";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") || "";
  const category = url.searchParams.get("category") || "";
  const pricing = url.searchParams.get("pricing") || "";
  const entityType = url.searchParams.get("entityType") || "";
  const attributes = url.searchParams.getAll("attributes");
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
  const skip = (page - 1) * limit;

  const where = await buildToolWhere({
    q,
    categorySlug: category,
    pricing,
    entityType,
    attributes,
  });

  const [tools, total] = await Promise.all([
    getToolsDirectory(where, { skip, take: limit }),
    getToolsDirectoryCount(where),
  ]);

  return NextResponse.json({
    tools,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
