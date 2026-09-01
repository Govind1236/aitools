import { db } from "@/lib/db";
import { AdminToolsClient } from "./admin-tools-client";

export const dynamic = "force-dynamic";

export default async function AdminToolsPage() {
  const rawTools = await db.tool.findMany({
    include: { category: true, redirectLink: true },
    orderBy: { createdAt: "desc" },
  });

  const tools = rawTools.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    description: t.description,
    logo: t.logo,
    websiteUrl: t.websiteUrl,
    pricingType: t.pricingType,
    isPublished: t.isPublished,
    isFeatured: t.isFeatured,
    rating: t.rating,
    tags: t.tags,
    category: {
      id: t.category.id,
      name: t.category.name,
      slug: t.category.slug,
    },
    redirectLink: t.redirectLink
      ? {
          id: t.redirectLink.id,
          slug: t.redirectLink.slug,
          clickCount: t.redirectLink.clickCount,
        }
      : null,
    entityType: t.entityType,
    verificationStatus: t.verificationStatus,
    lastVerifiedAt: t.lastVerifiedAt?.toISOString() ?? null,
    sourceUrl: t.sourceUrl,
    metadata: t.metadata,
  }));

  return <AdminToolsClient tools={tools} />;
}
