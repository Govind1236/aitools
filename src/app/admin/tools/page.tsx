import { db } from "@/lib/db";
import { AdminToolsClient } from "./admin-tools-client";

export const dynamic = "force-dynamic";

export default async function AdminToolsPage() {
  const rawTools = await db.tool.findMany({
    include: {
      category: true,
      redirectLink: true,
      provider: true,
      structuredTags: { include: { tag: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const providers = await db.provider.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  const tags = await db.tag.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
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
    providerId: t.providerId,
    provider: t.provider ? { id: t.provider.id, name: t.provider.name } : null,
    structuredTags: t.structuredTags.map((st) => ({
      id: st.tag.id,
      name: st.tag.name,
      slug: st.tag.slug,
    })),
    documentationUrl: t.documentationUrl,
    pricingUrl: t.pricingUrl,
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

  return <AdminToolsClient tools={tools} providers={providers} tags={tags} />;
}
