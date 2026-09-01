import { PrismaClient } from "@prisma/client";

/** Compare the original (backup) DB against the current DB to prove no destructive change. */

async function dump(path: string) {
  const prisma = new PrismaClient({
    datasources: { db: { url: `file:${path}` } },
  });

  const tools = await prisma.tool.findMany({
    orderBy: { slug: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      logo: true,
      websiteUrl: true,
      affiliateUrl: true,
      pricingType: true,
      categoryId: true,
      rating: true,
      isFeatured: true,
      isPublished: true,
      isSponsored: true,
      tags: true,
      hostingGuide: true,
      entityType: true,
      verificationStatus: true,
      lastVerifiedAt: true,
      sourceUrl: true,
      metadata: true,
    },
  });
  const categories = await prisma.category.findMany({
    orderBy: { slug: "asc" },
  });
  const users = await prisma.user.count();
  const campaigns = await prisma.campaign.count();
  const links = await prisma.redirectLink.count();
  const clicks = await prisma.clickEvent.count();

  await prisma.$disconnect();
  return { tools, categories, users, campaigns, links, clicks };
}

async function main() {
  const backupPath = "D:/AITOOL/prisma/dev.db.bak.20260901";
  const currentPath = "D:/AITOOL/prisma/dev.db";

  console.log("Reading backup (original) DB...");
  const before = await dump(backupPath);
  console.log("Reading current DB...");
  const after = await dump(currentPath);

  console.log("\n=== INTEGRITY COMPARISON ===\n");

  const cmp = (name: string, a: number, b: number) => {
    const ok = a === b;
    console.log(`${ok ? "✅" : "❌"} ${name}: ${a} → ${b}`);
    return ok;
  };

  let allOk = true;
  allOk = cmp("Tools", before.tools.length, after.tools.length) && allOk;
  allOk = cmp("Categories", before.categories.length, after.categories.length) && allOk;
  allOk = cmp("Users", before.users, after.users) && allOk;
  allOk = cmp("Campaigns", before.campaigns, after.campaigns) && allOk;
  allOk = cmp("RedirectLinks", before.links, after.links) && allOk;
  allOk = cmp("ClickEvents", before.clicks, after.clicks) && allOk;

  // Per-field comparison of tools (joined by slug)
  console.log("\n--- Per-tool field comparison (by slug) ---");
  const beforeBySlug = new Map(before.tools.map((t) => [t.slug, t]));
  const afterBySlug = new Map(after.tools.map((t) => [t.slug, t]));

  let mismatches = 0;
  let publishedBefore = 0;
  let publishedAfter = 0;

  for (const [slug, beforeTool] of beforeBySlug) {
    const afterTool = afterBySlug.get(slug);
    if (!afterTool) {
      console.log(`❌ Tool missing after migration: ${slug}`);
      mismatches++;
      continue;
    }
    if (beforeTool.isPublished) publishedBefore++;
    if (afterTool.isPublished) publishedAfter++;

    const fieldsToCompare: [string, unknown, unknown][] = [
      ["name", beforeTool.name, afterTool.name],
      ["description", beforeTool.description, afterTool.description],
      ["logo", beforeTool.logo, afterTool.logo],
      ["websiteUrl", beforeTool.websiteUrl, afterTool.websiteUrl],
      ["affiliateUrl", beforeTool.affiliateUrl, afterTool.affiliateUrl],
      ["pricingType", beforeTool.pricingType, afterTool.pricingType],
      ["categoryId", beforeTool.categoryId, afterTool.categoryId],
      ["rating", beforeTool.rating, afterTool.rating],
      ["isFeatured", beforeTool.isFeatured, afterTool.isFeatured],
      ["isPublished", beforeTool.isPublished, afterTool.isPublished],
      ["isSponsored", beforeTool.isSponsored, afterTool.isSponsored],
      ["tags", beforeTool.tags, afterTool.tags],
      ["hostingGuide", beforeTool.hostingGuide, afterTool.hostingGuide],
      ["entityType", beforeTool.entityType, afterTool.entityType],
      ["verificationStatus", beforeTool.verificationStatus, afterTool.verificationStatus],
      ["sourceUrl", beforeTool.sourceUrl, afterTool.sourceUrl],
      ["metadata", beforeTool.metadata, afterTool.metadata],
    ];

    for (const [field, b, a] of fieldsToCompare) {
      if (b !== a) {
        console.log(`❌ [${slug}] ${field} differs: ${JSON.stringify(b)} → ${JSON.stringify(a)}`);
        mismatches++;
      }
    }
  }

  // Check for tools added in column values (nulldriven)
  for (const [slug, afterTool] of afterBySlug) {
    const beforeTool = beforeBySlug.get(slug);
    if (!beforeTool) {
      console.log(`❌ Tool appeared after migration: ${slug}`);
      mismatches++;
    }
  }

  allOk = cmp("Published tools", publishedBefore, publishedAfter) && allOk;

  console.log("\n--- Category comparison (by slug) ---");
  const beforeCatBySlug = new Map(before.categories.map((c) => [c.slug, c]));
  const afterCatBySlug = new Map(after.categories.map((c) => [c.slug, c]));

  for (const [slug, beforeCat] of beforeCatBySlug) {
    const afterCat = afterCatBySlug.get(slug);
    if (!afterCat) {
      console.log(`❌ Category missing after migration: ${slug}`);
      mismatches++;
      continue;
    }
    if (JSON.stringify(beforeCat) !== JSON.stringify(afterCat)) {
      console.log(`❌ Category differs: ${slug}`);
      mismatches++;
    }
  }

  console.log("\n--- New V2 tables ---");
  const prisma = new PrismaClient({
    datasources: { db: { url: `file:${currentPath}` } },
  });
  const providers = await prisma.provider.count();
  const tags = await prisma.tag.count();
  const toolTags = await prisma.toolTag.count();
  const toolsWithProvider = await prisma.tool.count({ where: { providerId: { not: null } } });
  const toolsWithTags = await prisma.toolTag.groupBy({ by: ["toolId"] });
  const distinctTagSlugs = await prisma.tag.findMany({ select: { slug: true } });
  const uniqueSlugs = new Set(distinctTagSlugs.map((t) => t.slug));
  console.log(`Providers: ${providers}`);
  console.log(`Tags: ${tags} (unique slugs: ${uniqueSlugs.size})`);
  console.log(`ToolTag relationships: ${toolTags}`);
  console.log(`Tools with provider: ${toolsWithProvider}`);
  console.log(`Tools with >=1 structured tag: ${toolsWithTags.length}`);
  console.log(`Duplicate tag slugs: ${tags - uniqueSlugs.size}`);
  await prisma.$disconnect();

  console.log(`\n${mismatches === 0 ? "✅ ALL FIELD VALUES UNCHANGED" : `❌ ${mismatches} MISMATCH(ES) FOUND`}`);
  process.exit(mismatches === 0 && allOk ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});