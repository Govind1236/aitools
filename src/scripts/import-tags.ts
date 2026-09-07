/**
 * Non-destructive Tag import: Prisma (authoritative) -> Payload (mirror).
 *
 * - Reads EVERY Tag row from Prisma (read-only; no writes to Prisma).
 * - Writes Payload Tag documents keyed by the Prisma id as legacyPrismaId.
 *   Skips ids already present in Payload (idempotent).
 * - Preserves name, slug and timestamps exactly (no normalization).
 * - Prints parity checks at the end.
 *
 * NOTE: Tool <-> Tag links (Prisma `ToolTag`) are intentionally NOT imported
 * here. Tool stays Prisma-authoritative until the separate Tool migration.
 *
 * Usage (from repo root, .env must be loaded for PAYLOAD_* vars):
 *   npx tsx src/scripts/import-tags.ts
 */
import "./env-compat";
import { db } from "../lib/db";
import { getPayload } from "payload";
import config from "../../payload.config.ts";
import type { RequiredDataFromCollectionSlug } from "payload";

type TagCreateData = RequiredDataFromCollectionSlug<"tags">;

type PayloadTagDoc = {
  id: number | string;
  legacyPrismaId: string;
  name: string;
  slug: string;
};

async function main() {
  console.log("=== Payload Tag import (Prisma -> Payload) ===");

  // 1. Read-only Prisma read of all Tags.
  const prismaTags = await db.tag.findMany({ orderBy: { slug: "asc" } });
  console.log(`Prisma Tags found: ${prismaTags.length}`);

  // 2. Load Payload (its own sqlite db at payload/payload.db).
  const payload = await getPayload({ config });

  // 3. Snapshot existing Payload documents by legacyPrismaId.
  const existing = await payload.find({
    collection: "tags",
    limit: 0,
    pagination: false,
  });
  const existingByLegacyId = new Map<string, number | string>();
  for (const doc of existing.docs as unknown as PayloadTagDoc[]) {
    existingByLegacyId.set(doc.legacyPrismaId, doc.id);
  }
  console.log(`Payload Tags before import: ${existingByLegacyId.size}`);

  // 4. Insert only rows that are not yet mirrored.
  let created = 0;
  let skipped = 0;
  for (const t of prismaTags) {
    if (existingByLegacyId.has(t.id)) {
      skipped += 1;
      continue;
    }
    const data: TagCreateData = {
      legacyPrismaId: t.id,
      name: t.name,
      slug: t.slug,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    };
    await payload.create({ collection: "tags", data });
    created += 1;
  }
  console.log(`Created: ${created}, Already mirrored (skipped): ${skipped}`);

  // 5. Verify parity.
  const after = await payload.find({
    collection: "tags",
    limit: 0,
    pagination: false,
  });
  const payloadDocs = after.docs as unknown as PayloadTagDoc[];

  const prismaSlugs = new Set(prismaTags.map((t) => t.slug));
  const payloadSlugs = new Set(payloadDocs.map((d) => d.slug));
  const prismaIds = new Set(prismaTags.map((t) => t.id));
  const payloadLegacyIds = new Set(payloadDocs.map((d) => d.legacyPrismaId));

  const countParity = prismaTags.length === payloadDocs.length;
  const slugParity =
    prismaSlugs.size === payloadSlugs.size &&
    [...prismaSlugs].every((s) => payloadSlugs.has(s));
  const idParity =
    [...prismaIds].every((id) => payloadLegacyIds.has(id)) &&
    [...payloadLegacyIds].every((id) => prismaIds.has(id));

  console.log(`\n=== Parity ===`);
  console.log(`Prisma Tags: ${prismaTags.length}`);
  console.log(`Payload Tags: ${payloadDocs.length}`);
  console.log(`Count parity: ${countParity ? "PASS" : "FAIL"}`);
  console.log(`Slug parity: ${slugParity ? "PASS" : "FAIL"}`);
  console.log(`Legacy ID parity: ${idParity ? "PASS" : "FAIL"}`);

  await payload.destroy();
  await db.$disconnect();
  console.log("\nImport complete. Prisma untouched.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});