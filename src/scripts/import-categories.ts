/**
 * Non-destructive Category import: Prisma (authoritative) -> Payload (mirror).
 *
 * - Reads EVERY Category row from Prisma (read-only; no writes to Prisma).
 * - Writes Payload Category documents keyed by the Prisma id as
 *   legacyPrismaId. Skips ids already present in Payload (idempotent).
 * - Preserves name, slug, description, icon, sortOrder and timestamps exactly
 *   (null vs empty-string is preserved; no normalization is applied).
 * - Prints parity checks at the end.
 *
 * Usage (from repo root, .env must be loaded for PAYLOAD_* vars):
 *   npx tsx src/scripts/import-categories.ts
 */
import "./env-compat";
import { db } from "../lib/db";
import { getPayload } from "payload";
import config from "../../payload.config.ts";
import type { RequiredDataFromCollectionSlug } from "payload";

type CategoryCreateData = RequiredDataFromCollectionSlug<"categories">;

type PayloadCategoryDoc = {
  id: number | string;
  legacyPrismaId: string;
  name: string;
  slug: string;
  sortOrder?: number | null;
};

async function main() {
  console.log("=== Payload Category import (Prisma -> Payload) ===");

  // 1. Read-only Prisma read of all Categories.
  const prismaCategories = await db.category.findMany({
    orderBy: { slug: "asc" },
  });
  console.log(`Prisma Categories found: ${prismaCategories.length}`);

  // 2. Load Payload (its own sqlite db at payload/payload.db).
  const payload = await getPayload({ config });

  // 3. Snapshot existing Payload documents by legacyPrismaId.
  const existing = await payload.find({
    collection: "categories",
    limit: 0,
    pagination: false,
  });
  const existingByLegacyId = new Map<string, number | string>();
  for (const doc of existing.docs as unknown as PayloadCategoryDoc[]) {
    existingByLegacyId.set(doc.legacyPrismaId, doc.id);
  }
  console.log(
    `Payload Categories before import: ${existingByLegacyId.size}`,
  );

  // 4. Insert only rows that are not yet mirrored.
  let created = 0;
  let skipped = 0;
  for (const c of prismaCategories) {
    if (existingByLegacyId.has(c.id)) {
      skipped += 1;
      continue;
    }
    const data: CategoryCreateData = {
      legacyPrismaId: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description ?? null,
      icon: c.icon ?? null,
      sortOrder: c.sortOrder,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    };
    await payload.create({ collection: "categories", data });
    created += 1;
  }
  console.log(
    `Created: ${created}, Already mirrored (skipped): ${skipped}`,
  );

  // 5. Verify parity.
  const after = await payload.find({
    collection: "categories",
    limit: 0,
    pagination: false,
  });
  const payloadDocs = after.docs as unknown as PayloadCategoryDoc[];

  const prismaSlugs = new Set(prismaCategories.map((c) => c.slug));
  const payloadSlugs = new Set(payloadDocs.map((d) => d.slug));
  const prismaIds = new Set(prismaCategories.map((c) => c.id));
  const payloadLegacyIds = new Set(payloadDocs.map((d) => d.legacyPrismaId));

  const countParity = prismaCategories.length === payloadDocs.length;
  const slugParity =
    prismaSlugs.size === payloadSlugs.size &&
    [...prismaSlugs].every((s) => payloadSlugs.has(s));
  const idParity =
    [...prismaIds].every((id) => payloadLegacyIds.has(id)) &&
    [...payloadLegacyIds].every((id) => prismaIds.has(id));

  console.log(`\n=== Parity ===`);
  console.log(`Prisma Categories: ${prismaCategories.length}`);
  console.log(`Payload Categories: ${payloadDocs.length}`);
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