/**
 * Sync all data from Prisma (legacy) → Payload (primary).
 *
 * Run with: npx tsx scripts/sync-to-payload.ts
 *
 * This script reads all data from the Prisma database and creates
 * corresponding documents in the Payload CMS collections. It is idempotent:
 * if a document already exists (matched by legacyPrismaId or slug), it is
 * skipped.
 */
import { PrismaClient } from "@prisma/client";
import { getPayload, type Payload } from "payload";
import config from "../payload.config.ts";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function syncCollection<T extends { id: string }>(
  payload: Payload,
  collection: string,
  docs: T[],
  mapper: (doc: T) => Record<string, unknown>,
  keyField: string = "slug",
) {
  let created = 0;
  let skipped = 0;

  for (const doc of docs) {
    const data = mapper(doc);

    // Check if already exists by key field
    const { docs: existing } = await payload.find({
      collection: collection as any,
      where: { [keyField]: { equals: (data as any)[keyField] } },
      limit: 1,
    });

    if (existing.length > 0) {
      skipped++;
      continue;
    }

    await payload.create({
      collection: collection as any,
      data,
    } as any);
    created++;
  }

  return { created, skipped };
}

async function main() {
  console.log("🔄 Syncing Prisma → Payload...\n");

  const payload = await getPayload({ config });

  // ── USERS (via Payload auth) ──────────────────────────────────────
  console.log("👤 Syncing users...");
  const users = await prisma.user.findMany();
  let userCreated = 0;
  let userSkipped = 0;
  for (const user of users) {
    const { docs: existing } = await payload.find({
      collection: "users",
      where: { email: { equals: user.email } },
      limit: 1,
    });
    if (existing.length > 0) { userSkipped++; continue; }

    await payload.create({
      collection: "users",
      data: {
        email: user.email,
        password: "admin123", // Reset password for synced users
        name: user.name,
        role: user.role as "admin",
      },
    });
    userCreated++;
  }
  console.log(`   ✅ ${userCreated} created, ${userSkipped} skipped`);

  // ── CATEGORIES ───────────────────────────────────────────────────
  console.log("📁 Syncing categories...");
  const categories = await prisma.category.findMany();
  const catResult = await syncCollection(payload, "categories", categories, (c) => ({
    legacyPrismaId: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    icon: c.icon,
    sortOrder: c.sortOrder,
  }));
  console.log(`   ✅ ${catResult.created} created, ${catResult.skipped} skipped`);

  // Build Prisma category ID → Payload document ID map
  const { docs: payloadCategories } = await payload.find({ collection: "categories", limit: 10000 });
  const catIdMap = new Map<string, any>();
  for (const pc of payloadCategories) {
    if (pc.legacyPrismaId) catIdMap.set(pc.legacyPrismaId as string, pc.id);
  }

  // ── PROVIDERS ────────────────────────────────────────────────────
  console.log("🏢 Syncing providers...");
  const providers = await prisma.provider.findMany();
  const provResult = await syncCollection(payload, "providers", providers, (p) => ({
    legacyPrismaId: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    websiteUrl: p.websiteUrl,
    logo: p.logo,
  }));
  console.log(`   ✅ ${provResult.created} created, ${provResult.skipped} skipped`);

  // Build Prisma provider ID → Payload document ID map
  const { docs: payloadProviders } = await payload.find({ collection: "providers", limit: 10000 });
  const provIdMap = new Map<string, any>();
  for (const pp of payloadProviders) {
    if (pp.legacyPrismaId) provIdMap.set(pp.legacyPrismaId as string, pp.id);
  }

  // ── TAGS ─────────────────────────────────────────────────────────
  console.log("🏷️  Syncing tags...");
  const tags = await prisma.tag.findMany();
  const tagResult = await syncCollection(payload, "tags", tags, (t) => ({
    legacyPrismaId: t.id,
    name: t.name,
    slug: t.slug,
  }));
  console.log(`   ✅ ${tagResult.created} created, ${tagResult.skipped} skipped`);

  // Build Prisma tag ID → Payload document ID map
  const { docs: payloadTags } = await payload.find({ collection: "tags", limit: 10000 });
  const tagIdMap = new Map<string, any>();
  for (const pt of payloadTags) {
    if (pt.legacyPrismaId) tagIdMap.set(pt.legacyPrismaId as string, pt.id);
  }

  // ── TOOLS ────────────────────────────────────────────────────────
  console.log("🔧 Syncing tools...");
  const tools = await prisma.tool.findMany({
    include: { structuredTags: true },
  });
  let toolCreated = 0;
  let toolSkipped = 0;

  for (const tool of tools) {
    const { docs: existing } = await payload.find({
      collection: "tools",
      where: { slug: { equals: tool.slug } },
      limit: 1,
    });
    if (existing.length > 0) { toolSkipped++; continue; }

    const payloadCategoryId = catIdMap.get(tool.categoryId);
    const payloadProviderId = tool.providerId ? provIdMap.get(tool.providerId) : undefined;
    const structuredTagIds = tool.structuredTags
      .map((st) => tagIdMap.get(st.tagId))
      .filter(Boolean) as any[];

    await payload.create({
      collection: "tools",
      data: {
        legacyPrismaId: tool.id,
        name: tool.name,
        slug: tool.slug,
        description: tool.description,
        websiteUrl: tool.websiteUrl,
        logo: tool.logo,
        affiliateUrl: tool.affiliateUrl,
        pricingType: tool.pricingType,
        rating: tool.rating,
        isFeatured: tool.isFeatured,
        isPublished: tool.isPublished,
        isSponsored: tool.isSponsored,
        tags: tool.tags,
        hostingGuide: tool.hostingGuide,
        entityType: tool.entityType,
        verificationStatus: tool.verificationStatus,
        lastVerifiedAt: tool.lastVerifiedAt?.toISOString() ?? null,
        sourceUrl: tool.sourceUrl,
        metadata: tool.metadata,
        documentationUrl: tool.documentationUrl,
        pricingUrl: tool.pricingUrl,
        category: payloadCategoryId || tool.categoryId,
        provider: payloadProviderId || null,
        structuredTags: structuredTagIds,
      } as any,
    });
    toolCreated++;
  }
  console.log(`   ✅ ${toolCreated} created, ${toolSkipped} skipped`);

  // Build Prisma tool ID → Payload document ID map
  const { docs: payloadTools } = await payload.find({ collection: "tools", limit: 10000 });
  const toolIdMap = new Map<string, any>();
  for (const pt of payloadTools) {
    if (pt.legacyPrismaId) toolIdMap.set(pt.legacyPrismaId as string, pt.id);
  }

  // ── CAMPAIGNS ────────────────────────────────────────────────────
  console.log("📢 Syncing campaigns...");
  const campaigns = await prisma.campaign.findMany();
  const campResult = await syncCollection(payload, "campaigns", campaigns, (c) => ({
    name: c.name,
    description: c.description,
    isActive: c.isActive,
  }), "name");
  console.log(`   ✅ ${campResult.created} created, ${campResult.skipped} skipped`);

  // Build Prisma campaign ID → Payload document ID map
  const { docs: payloadCampaigns } = await payload.find({ collection: "campaigns", limit: 10000 });
  const campIdMap = new Map<string, any>();
  for (const pc of payloadCampaigns) {
    // Match by name since campaigns don't have legacyPrismaId
    campIdMap.set(pc.name as string, pc.id);
  }

  // ── REDIRECT LINKS ───────────────────────────────────────────────
  console.log("🔗 Syncing redirect links...");
  const links = await prisma.redirectLink.findMany();
  let linkCreated = 0;
  let linkSkipped = 0;

  for (const link of links) {
    const { docs: existing } = await payload.find({
      collection: "redirect-links",
      where: { slug: { equals: link.slug } },
      limit: 1,
    });
    if (existing.length > 0) { linkSkipped++; continue; }

    const payloadToolId = link.toolId ? toolIdMap.get(link.toolId) : undefined;
    const payloadCampaignName = link.campaignId
      ? campaigns.find((c) => c.id === link.campaignId)?.name
      : undefined;
    const payloadCampaignId = payloadCampaignName ? campIdMap.get(payloadCampaignName) : undefined;

    if (link.toolId && !payloadToolId) {
      console.warn(`   ⚠️  Link "${link.slug}" has toolId ${link.toolId} but no matching Payload tool — skipping tool reference`);
    }

    await payload.create({
      collection: "redirect-links",
      data: {
        slug: link.slug,
        name: link.name,
        destination: link.destination,
        tool: payloadToolId || null,
        campaign: payloadCampaignId || null,
        isActive: link.isActive,
        clickCount: link.clickCount,
      } as any,
    }).catch((err: any) => {
      console.error(`   ❌ Failed to create link "${link.slug}":`, JSON.stringify(err?.data?.errors ?? err?.message));
      return undefined;
    });
    linkCreated++;
  }
  console.log(`   ✅ ${linkCreated} created, ${linkSkipped} skipped`);

  // ── CLICK EVENTS ─────────────────────────────────────────────────
  console.log("📊 Syncing click events (this may take a moment)...");
  const clickEvents = await prisma.clickEvent.findMany();
  const { docs: payloadLinks } = await payload.find({ collection: "redirect-links", limit: 10000 });

  // Build a redirect-link slug → Payload document ID map for click events
  const linkSlugMap = new Map<string, any>();
  for (const pl of payloadLinks) {
    linkSlugMap.set(String(pl.slug), pl.id);
  }

  let clickCreated = 0;
  let clickSkipped = 0;
  const BATCH_SIZE = 50;
  for (let i = 0; i < clickEvents.length; i += BATCH_SIZE) {
    const batch = clickEvents.slice(i, i + BATCH_SIZE);
    for (const ce of batch) {
      const prismaLink = links.find((l) => l.id === ce.linkId);
      const payloadLinkId = prismaLink ? linkSlugMap.get(prismaLink.slug) : undefined;
      if (!payloadLinkId) continue;

      const { docs: existingClick } = await payload.find({
        collection: "click-events",
        where: { legacyPrismaId: { equals: ce.id } },
        limit: 1,
      });
      if (existingClick.length > 0) { clickSkipped++; continue; }

      await payload.create({
        collection: "click-events",
        data: {
          legacyPrismaId: ce.id,
          link: payloadLinkId,
          timestamp: ce.timestamp.toISOString(),
          referrer: ce.referrer,
          utmSource: ce.utmSource,
          utmMedium: ce.utmMedium,
          utmCampaign: ce.utmCampaign,
          utmContent: ce.utmContent,
          utmTerm: ce.utmTerm,
          country: ce.country,
          deviceType: ce.deviceType,
          browser: ce.browser,
          operatingSystem: ce.operatingSystem,
          isSuspicious: ce.isSuspicious,
          trafficType: ce.trafficType,
          ipAddress: ce.ipAddress,
        } as any,
      });
      clickCreated++;
    }
    if (i % 200 === 0) {
      process.stdout.write(`   ${clickCreated}/${clickEvents.length}...\r`);
    }
  }
  console.log(`   ✅ ${clickCreated} created, ${clickSkipped} skipped`);

  // ── DONE ─────────────────────────────────────────────────────────
  console.log("\n🎉 Sync complete! Payload is now populated with all Prisma data.");
  console.log("   Set FREEBUFF_CATALOG_READS=payload to use Payload as the primary source.");

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Sync failed:", err);
  process.exit(1);
});