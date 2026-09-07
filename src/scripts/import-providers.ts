/**
 * Non-destructive Provider import: Prisma (authoritative) -> Payload (mirror).
 *
 * - Reads EVERY Provider row from Prisma (read-only; no writes to Prisma).
 * - Writes Payload Provider documents keyed by the Prisma id as
 *   legacyPrismaId. Skips ids already present in Payload (idempotent).
 * - Prints parity checks (count, slugs, legacy ids) at the end.
 *
 * Usage (from repo root, .env must be loaded for PAYLOAD_* vars):
 *   npx tsx src/scripts/import-providers.ts
 */
import { db } from "../lib/db";
import { getPayload } from "payload";
import config from "../../payload.config.ts";
import type { RequiredDataFromCollectionSlug } from "payload";

type ProviderCreateData = RequiredDataFromCollectionSlug<"providers">;

type PayloadProviderDoc = {
  id: number | string;
  legacyPrismaId: string;
  name: string;
  slug: string;
};

async function main() {
  console.log("=== Payload Provider import (Prisma -> Payload) ===");

  // 1. Read-only Prisma read of all Providers.
  const prismaProviders = await db.provider.findMany({
    orderBy: { slug: "asc" },
  });
  console.log(`Prisma Providers found: ${prismaProviders.length}`);

  // 2. Load Payload (its own sqlite db at payload/payload.db).
  const payload = await getPayload({ config });

  // 3. Snapshot existing Payload documents by legacyPrismaId.
  const existing = await payload.find({
    collection: "providers",
    limit: 0,
    pagination: false,
  });
  const existingByLegacyId = new Map<string, number | string>();
  for (const doc of existing.docs as unknown as PayloadProviderDoc[]) {
    existingByLegacyId.set(doc.legacyPrismaId, doc.id);
  }
  console.log(
    `Payload Providers before import: ${existingByLegacyId.size}`,
  );

  // 4. Insert only rows that are not yet mirrored.
  let created = 0;
  let skipped = 0;
  for (const p of prismaProviders) {
    if (existingByLegacyId.has(p.id)) {
      skipped += 1;
      continue;
    }
    const base = {
      legacyPrismaId: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description ?? undefined,
      websiteUrl: p.websiteUrl ?? undefined,
      logo: p.logo ?? undefined,
    };
    const data: ProviderCreateData = {
      ...base,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
    try {
      await payload.create({ collection: "providers", data });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(
        `  re-creating ${p.name} (${p.slug}) without timestamps (${message})`,
      );
      await payload.create({
        collection: "providers",
        data: base as ProviderCreateData,
      });
    }
    created += 1;
  }
  console.log(`Created: ${created}, Already mirrored (skipped): ${skipped}`);

  // 5. Verify parity.
  const after = await payload.find({
    collection: "providers",
    limit: 0,
    pagination: false,
  });
  const payloadDocs = after.docs as unknown as PayloadProviderDoc[];

  const prismaSlugs = new Set(prismaProviders.map((p) => p.slug));
  const payloadSlugs = new Set(payloadDocs.map((d) => d.slug));
  const prismaIds = new Set(prismaProviders.map((p) => p.id));
  const payloadLegacyIds = new Set(payloadDocs.map((d) => d.legacyPrismaId));

  const countParity = prismaProviders.length === payloadDocs.length;
  const slugParity =
    prismaSlugs.size === payloadSlugs.size &&
    [...prismaSlugs].every((s) => payloadSlugs.has(s));
  const idParity =
    [...prismaIds].every((id) => payloadLegacyIds.has(id)) &&
    [...payloadLegacyIds].every((id) => prismaIds.has(id));

  console.log(`\n=== Parity ===`);
  console.log(`Prisma Providers: ${prismaProviders.length}`);
  console.log(`Payload Providers: ${payloadDocs.length}`);
  console.log(`Count parity: ${countParity ? "PASS" : "FAIL"}`);
  console.log(`Slug parity: ${slugParity ? "PASS" : "FAIL"}`);
  console.log(`Legacy ID parity: ${idParity ? "PASS" : "FAIL"}`);

  // Field parity (name/slug/description/websiteUrl/logo hold for mirrored rows).
  const prismaByName = new Map(prismaProviders.map((p) => [p.slug, p] as const));
  const mismatches: string[] = [];
  for (const doc of payloadDocs) {
    const prismaRow = prismaByName.get(doc.slug);
    if (!prismaRow) {
      mismatches.push(`no Prisma row for slug ${doc.slug}`);
      continue;
    }
    for (const field of ["name", "slug"] as const) {
      if (doc[field] !== prismaRow[field]) {
        mismatches.push(`field ${field} mismatch for ${doc.slug}`);
      }
    }
    const docAll = doc as unknown as Record<string, unknown>;
    for (const field of ["description", "websiteUrl", "logo"] as const) {
      const a = documentToNullableString(docAll[field]);
      const b = prismaRow[field] ?? null;
      if ((a ?? null) !== (b ?? null)) {
        mismatches.push(`field ${field} mismatch for ${doc.slug}`);
      }
    }
  }
  console.log(`Field parity: ${mismatches.length === 0 ? "PASS" : `FAIL (${mismatches.join(", ")})`}`);

  await payload.destroy();
  console.log("\nImport complete. Prisma untouched.");
}

function documentToNullableString(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const text = String(value);
  return text.length === 0 ? null : text;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});