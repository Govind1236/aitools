/**
 * Non-destructive Tool import: Prisma (authoritative) -> Payload (mirror).
 *
 * - Reads EVERY Tool row + ToolTag row from Prisma (read-only; no writes to Prisma).
 * - Writes Payload Tool documents keyed by the Prisma id as legacyPrismaId.
 *   Skips ids already present in Payload (idempotent).
 * - Resolves Category, Provider, and Tag relationships through Payload
 *   legacyPrismaId mapping (no cross-database FK).
 * - Preserves all field values exactly (null vs empty-string is preserved;
 *   no normalization is applied).
 * - Prints parity checks at the end.
 *
 * Usage (from repo root, .env must be loaded for PAYLOAD_* vars):
 *   npx tsx src/scripts/import-tools.ts
 */
import "./env-compat";
import { db } from "../lib/db";
import { getPayload } from "payload";
import config from "../../payload.config.ts";
import type { RequiredDataFromCollectionSlug } from "payload";

type ToolCreateData = RequiredDataFromCollectionSlug<"tools">;

type PayloadToolDoc = {
  id: number | string;
  legacyPrismaId: string;
  name: string;
  slug: string;
  description?: string | null;
  logo?: string | null;
  websiteUrl?: string | null;
  affiliateUrl?: string | null;
  pricingType?: string | null;
  rating?: number | null;
  isFeatured?: boolean | null;
  isPublished?: boolean | null;
  isSponsored?: boolean | null;
  tags?: string | null;
  hostingGuide?: string | null;
  entityType?: string | null;
  verificationStatus?: string | null;
  lastVerifiedAt?: string | null;
  sourceUrl?: string | null;
  metadata?: string | null;
  documentationUrl?: string | null;
  pricingUrl?: string | null;
  category?: { id: number | string } | number | string | null;
  provider?: { id: number | string } | number | string | null;
  structuredTags?:
    | Array<{ id: number | string } | number | string>
    | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};

type PrismaToolRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo: string | null;
  websiteUrl: string;
  affiliateUrl: string | null;
  pricingType: string;
  categoryId: string;
  rating: number;
  isFeatured: boolean;
  isPublished: boolean;
  isSponsored: boolean;
  tags: string;
  hostingGuide: string | null;
  entityType: string;
  verificationStatus: string;
  lastVerifiedAt: Date | null;
  sourceUrl: string | null;
  metadata: string | null;
  providerId: string | null;
  documentationUrl: string | null;
  pricingUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function normScalar(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  return String(v);
}

function relationIdOf(
  rel: { id: number | string } | number | string | null | undefined,
): number | string | null {
  if (rel === null || rel === undefined) return null;
  if (typeof rel === "object" && rel !== null && "id" in rel) return rel.id;
  return rel;
}

function recordsMatch(
  tool: PrismaToolRow,
  existing: PayloadToolDoc,
  target: {
    categoryId: number;
    providerId: number | null;
    tagIds: number[];
  },
): boolean {
  if (existing.name !== tool.name) return false;
  if (existing.slug !== tool.slug) return false;
  if (normScalar(existing.description) !== normScalar(tool.description ?? null))
    return false;
  if (normScalar(existing.logo) !== normScalar(tool.logo)) return false;
  if (normScalar(existing.websiteUrl) !== normScalar(tool.websiteUrl ?? null))
    return false;
  if (normScalar(existing.affiliateUrl) !== normScalar(tool.affiliateUrl))
    return false;
  if (normScalar(existing.pricingType) !== normScalar(tool.pricingType ?? null))
    return false;
  if (existing.rating === null || existing.rating === undefined) {
    if (tool.rating !== 0) return false;
  } else if (Number(existing.rating) !== tool.rating) {
    return false;
  }
  if (Boolean(existing.isFeatured) !== Boolean(tool.isFeatured)) return false;
  if (Boolean(existing.isPublished) !== Boolean(tool.isPublished)) return false;
  if (Boolean(existing.isSponsored) !== Boolean(tool.isSponsored)) return false;
  if (normScalar(existing.tags) !== normScalar(tool.tags ?? null)) return false;
  if (normScalar(existing.hostingGuide) !== normScalar(tool.hostingGuide))
    return false;
  if (normScalar(existing.entityType) !== normScalar(tool.entityType ?? null))
    return false;
  if (
    normScalar(existing.verificationStatus) !==
    normScalar(tool.verificationStatus ?? null)
  ) {
    return false;
  }
  if (normScalar(existing.lastVerifiedAt) !== normScalar(tool.lastVerifiedAt))
    return false;
  if (normScalar(existing.sourceUrl) !== normScalar(tool.sourceUrl))
    return false;
  if (normScalar(existing.metadata) !== normScalar(tool.metadata)) return false;
  if (
    normScalar(existing.documentationUrl) !==
    normScalar(tool.documentationUrl)
  ) {
    return false;
  }
  if (normScalar(existing.pricingUrl) !== normScalar(tool.pricingUrl))
    return false;

  const existingCategoryId = relationIdOf(existing.category);
  if (existingCategoryId !== target.categoryId) return false;

  const existingProviderId = relationIdOf(existing.provider);
  if (existingProviderId !== target.providerId) return false;

  const existingTagIds = (Array.isArray(existing.structuredTags)
    ? existing.structuredTags.map((t) => relationIdOf(t as never))
    : []
  ).filter((t): t is number | string => t !== null);
  const sortedExisting = [...existingTagIds].sort((a, b) =>
    String(a).localeCompare(String(b)),
  );
  const sortedTarget = [...target.tagIds].sort((a, b) =>
    String(a).localeCompare(String(b)),
  );
  if (sortedExisting.length !== sortedTarget.length) return false;
  for (let i = 0; i < sortedExisting.length; i++) {
    if (sortedExisting[i] !== sortedTarget[i]) return false;
  }

  const createdDiff = Math.abs(
    new Date(String(existing.createdAt)).getTime() -
      tool.createdAt.getTime(),
  );
  const updatedDiff = Math.abs(
    new Date(String(existing.updatedAt)).getTime() -
      tool.updatedAt.getTime(),
  );
  if (createdDiff > 2 || updatedDiff > 2) return false;

  return true;
}

async function main() {
  console.log("=== Payload Tool import (Prisma -> Payload) ===");

  // ── 1. Pre-import snapshot (Prisma READ ONLY) ───────────────
  const prismaTools = await db.tool.findMany({
    orderBy: { slug: "asc" },
  });
  const prismaToolTagCount = await db.toolTag.count();
  const prismaRedirectLinkCount = await db.redirectLink.count();
  console.log(`Prisma Tools found: ${prismaTools.length}`);
  console.log(`Prisma ToolTag count: ${prismaToolTagCount}`);
  console.log(`Prisma RedirectLink count: ${prismaRedirectLinkCount}`);

  // ── 2. Load Payload ────────────────────────────────────────
  const payload = await getPayload({ config });

  // ── 3. Pre-import: verify existing mapping collections ──────
  const payloadCategories = await payload.find({
    collection: "categories",
    limit: 0,
    pagination: false,
  });
  const payloadProviders = await payload.find({
    collection: "providers",
    limit: 0,
    pagination: false,
  });
  const payloadTags = await payload.find({
    collection: "tags",
    limit: 0,
    pagination: false,
  });

  const categoryByLegacyId = new Map<string, number>();
  for (const doc of payloadCategories.docs) {
    const legacyId = (doc as unknown as { legacyPrismaId: string })
      .legacyPrismaId;
    categoryByLegacyId.set(legacyId, doc.id as number);
  }
  const providerByLegacyId = new Map<string, number>();
  for (const doc of payloadProviders.docs) {
    const legacyId = (doc as unknown as { legacyPrismaId: string })
      .legacyPrismaId;
    providerByLegacyId.set(legacyId, doc.id as number);
  }
  const tagByLegacyId = new Map<string, number>();
  for (const doc of payloadTags.docs) {
    const legacyId = (doc as unknown as { legacyPrismaId: string })
      .legacyPrismaId;
    tagByLegacyId.set(legacyId, doc.id as number);
  }

  console.log(`\nPre-import mapping check:`);
  console.log(
    `  Categories: ${payloadCategories.totalDocs} (need ${prismaTools.length} unique)`,
  );
  console.log(
    `  Providers:  ${payloadProviders.totalDocs}`,
  );
  console.log(
    `  Tags:       ${payloadTags.totalDocs}`,
  );

  // ── 4. Validate all relationships can resolve ───────────────
  const missingCategories: string[] = [];
  const missingProviders: string[] = [];
  const missingTags: string[] = [];

  for (const tool of prismaTools) {
    if (!categoryByLegacyId.has(tool.categoryId)) {
      missingCategories.push(
        `Tool ${tool.slug}: categoryId ${tool.categoryId} not found`,
      );
    }
    if (
      tool.providerId !== null &&
      tool.providerId !== undefined &&
      !providerByLegacyId.has(tool.providerId)
    ) {
      missingProviders.push(
        `Tool ${tool.slug}: providerId ${tool.providerId} not found`,
      );
    }
  }

  // Check all ToolTag tag references
  const prismaToolTags = await db.toolTag.findMany();
  const allTagIds = new Set(prismaToolTags.map((tt) => tt.tagId));
  for (const tagId of allTagIds) {
    if (!tagByLegacyId.has(tagId)) {
      missingTags.push(`Tag ${tagId} not found in Payload`);
    }
  }

  if (
    missingCategories.length > 0 ||
    missingProviders.length > 0 ||
    missingTags.length > 0
  ) {
    console.error("\nPRE-IMPORT VALIDATION FAILED:");
    for (const msg of missingCategories) console.error(`  ${msg}`);
    for (const msg of missingProviders) console.error(`  ${msg}`);
    for (const msg of missingTags) console.error(`  ${msg}`);
    await payload.destroy();
    await db.$disconnect();
    process.exit(1);
  }
  console.log(`  All relationship mappings: OK`);

  // ── 5. Snapshot existing Payload Tools (with relationships) ─
  const existingTools = await payload.find({
    collection: "tools",
    limit: 0,
    pagination: false,
    depth: 2,
  });
  const existingByLegacyId = new Map<string, PayloadToolDoc>();
  for (const doc of existingTools.docs) {
    const cast = doc as unknown as PayloadToolDoc;
    existingByLegacyId.set(cast.legacyPrismaId, cast);
  }
  console.log(`\nPayload Tools before import: ${existingByLegacyId.size}`);

  // ── 6. Build ToolTag lookup: toolPrismaId -> tagPrismaId[] ──
  const toolTagsByToolId = new Map<string, string[]>();
  for (const tt of prismaToolTags) {
    const existing = toolTagsByToolId.get(tt.toolId) ?? [];
    existing.push(tt.tagId);
    toolTagsByToolId.set(tt.toolId, existing);
  }

  // ── 7. Upsert Tools ────────────────────────────────────────
  let created = 0;
  let updated = 0;
  let unchanged = 0;
  let failed = 0;

  for (const tool of prismaTools) {
    const payloadCategoryId = categoryByLegacyId.get(tool.categoryId);
    if (!payloadCategoryId) {
      console.error(
        `  FATAL: category mapping missing for ${tool.slug} (categoryId=${tool.categoryId})`,
      );
      failed += 1;
      continue;
    }

    let payloadProviderId: number | null = null;
    if (tool.providerId !== null && tool.providerId !== undefined) {
      payloadProviderId = providerByLegacyId.get(tool.providerId) ?? null;
      if (!payloadProviderId) {
        console.error(
          `  FATAL: provider mapping missing for ${tool.slug} (providerId=${tool.providerId})`,
        );
        failed += 1;
        continue;
      }
    }

    // Resolve tag Payload IDs
    const toolTagPrismaIds = toolTagsByToolId.get(tool.id) ?? [];
    const payloadTagIds: number[] = [];
    for (const tagPrismaId of toolTagPrismaIds) {
      const payloadTagId = tagByLegacyId.get(tagPrismaId);
      if (!payloadTagId) {
        console.error(
          `  FATAL: tag mapping missing for tool ${tool.slug}, tagId=${tagPrismaId}`,
        );
        failed += 1;
        continue;
      }
      payloadTagIds.push(payloadTagId);
    }

    const baseData: ToolCreateData = {
      legacyPrismaId: tool.id,
      name: tool.name,
      slug: tool.slug,
      description: tool.description ?? "",
      logo: tool.logo ?? undefined,
      websiteUrl: tool.websiteUrl ?? "",
      affiliateUrl: tool.affiliateUrl ?? undefined,
      pricingType: tool.pricingType ?? "freemium",
      rating: tool.rating ?? 0,
      isFeatured: tool.isFeatured ?? false,
      isPublished: tool.isPublished ?? true,
      isSponsored: tool.isSponsored ?? false,
      tags: tool.tags ?? "",
      hostingGuide: tool.hostingGuide ?? undefined,
      entityType: tool.entityType ?? "TOOL",
      verificationStatus: tool.verificationStatus ?? "UNVERIFIED",
      lastVerifiedAt: tool.lastVerifiedAt
        ? tool.lastVerifiedAt.toISOString()
        : undefined,
      sourceUrl: tool.sourceUrl ?? undefined,
      metadata: tool.metadata ?? undefined,
      documentationUrl: tool.documentationUrl ?? undefined,
      pricingUrl: tool.pricingUrl ?? undefined,
      category: payloadCategoryId,
      provider: payloadProviderId ?? undefined,
      structuredTags: payloadTagIds.length > 0 ? payloadTagIds : [],
    };

    const existing = existingByLegacyId.get(tool.id);

    if (existing) {
      // Compare existing Payload record to what we would write. If fully
      // identical, skip (no Payload write) to avoid Payload overwriting
      // updatedAt with the current time (idempotency / no timestamp drift).
      if (
        recordsMatch(tool, existing, {
          categoryId: payloadCategoryId,
          providerId: payloadProviderId,
          tagIds: payloadTagIds,
        })
      ) {
        unchanged += 1;
        continue;
      }
      // Otherwise update existing record — re-set relationships.
      try {
        await payload.update({
          collection: "tools",
          id: existing.id,
          data: {
            ...baseData,
            createdAt: tool.createdAt.toISOString(),
            updatedAt: tool.updatedAt.toISOString(),
          },
        });
        updated += 1;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(
          `  update ${tool.slug} without timestamps (${message})`,
        );
        try {
          await payload.update({
            collection: "tools",
            id: existing.id,
            data: baseData,
          });
          updated += 1;
        } catch (err2) {
          console.error(`  FAILED update ${tool.slug}: ${err2}`);
          failed += 1;
        }
      }
    } else {
      // Create new record
      try {
        await payload.create({
          collection: "tools",
          data: {
            ...baseData,
            createdAt: tool.createdAt.toISOString(),
            updatedAt: tool.updatedAt.toISOString(),
          },
        });
        created += 1;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(
          `  re-creating ${tool.slug} without timestamps (${message})`,
        );
        try {
          await payload.create({
            collection: "tools",
            data: baseData,
          });
          created += 1;
        } catch (err2) {
          console.error(`  FAILED create ${tool.slug}: ${err2}`);
          failed += 1;
        }
      }
    }
  }

  console.log(
    `\nImport results: created=${created}, updated=${updated}, unchanged=${unchanged}, failed=${failed}`,
  );

  // ── 8. Quick parity check ──────────────────────────────────
  const after = await payload.find({
    collection: "tools",
    limit: 0,
    pagination: false,
  });
  const payloadDocs = after.docs as unknown as PayloadToolDoc[];

  const prismaIds = new Set(prismaTools.map((t) => t.id));
  const payloadLegacyIds = new Set(payloadDocs.map((d) => d.legacyPrismaId));
  const prismaSlugs = new Set(prismaTools.map((t) => t.slug));
  const payloadSlugs = new Set(payloadDocs.map((d) => d.slug));

  const countParity = prismaTools.length === payloadDocs.length;
  const slugParity =
    prismaSlugs.size === payloadSlugs.size &&
    [...prismaSlugs].every((s) => payloadSlugs.has(s));
  const idParity =
    [...prismaIds].every((id) => payloadLegacyIds.has(id)) &&
    [...payloadLegacyIds].every((id) => prismaIds.has(id));

  console.log(`\n=== Quick Parity ===`);
  console.log(`Prisma Tools: ${prismaTools.length}`);
  console.log(`Payload Tools: ${payloadDocs.length}`);
  console.log(`Count parity: ${countParity ? "PASS" : "FAIL"}`);
  console.log(`Slug parity: ${slugParity ? "PASS" : "FAIL"}`);
  console.log(`Legacy ID parity: ${idParity ? "PASS" : "FAIL"}`);

  // ── 9. Cleanup ─────────────────────────────────────────────
  await payload.destroy();
  await db.$disconnect();
  console.log("\nImport complete. Prisma untouched.");
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
