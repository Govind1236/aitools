/**
 * Exact parity validation: Prisma (authoritative) vs Payload (mirror)
 * for the Category, Provider, Tag, and Tool catalogs, plus ToolTag
 * relationship recreation and RedirectLink safety.
 *
 * No normalization is applied to case / whitespace / punctuation / null
 * values. Timestamps are compared at millisecond precision via
 * `.toISOString()` (both stores use UTC ISO-8601 text). Booleans and
 * numbers are compared with strict type checks so `true !== "true"` and
 * `1 !== true` are never hidden by coercion.
 *
 * READ-ONLY: never writes to Prisma or Payload.
 *
 * Exits non-zero if ANY check fails.
 *
 * Usage (from repo root):
 *   npx tsx src/scripts/validate-catalog-parity.ts
 */
import "./env-compat";
import { db } from "../lib/db";
import { getPayload } from "payload";
import config from "../../payload.config.ts";

type FieldKind =
  | "scalar"
  | "timestamp"
  | "timestampOrNull"
  | "number"
  | "boolean";

type FieldSpec = {
  name: string;
  /** Source field name on the Prisma model; defaults to `name`. */
  sourceField?: string;
  kind: FieldKind;
};

function toIso(value: string | Date): string {
  if (value instanceof Date) return value.toISOString();
  return new Date(String(value)).toISOString();
}

function scalar(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  return String(v);
}

function relationId(
  rel:
    | { id: number | string }
    | number
    | string
    | null
    | undefined,
): number | string | null {
  if (rel === null || rel === undefined) return null;
  if (typeof rel === "object" && "id" in rel) return rel.id;
  return rel as number | string;
}

type Relatable = { id: number | string } | number | string;

async function findPayloadRows(
  payload: Awaited<ReturnType<typeof getPayload>>,
  collection: string,
  depth?: number,
): Promise<Record<string, unknown>[]> {
  const result = await payload.find({
    collection: collection as "categories",
    limit: 0,
    pagination: false,
    depth,
  });
  return result.docs as unknown as Record<string, unknown>[];
}

function runParity({
  label,
  prismaRows,
  payloadRows,
  fields,
}: {
  label: string;
  prismaRows: Record<string, unknown>[];
  payloadRows: Record<string, unknown>[];
  fields: FieldSpec[];
}): boolean {
  console.log(`\n========== ${label} ==========`);
  let ok = true;
  const fail = (msg: string) => {
    ok = false;
    console.log(`  FAIL: ${msg}`);
  };

  console.log(`Prisma count: ${prismaRows.length}`);
  console.log(`Payload count: ${payloadRows.length}`);
  if (prismaRows.length !== payloadRows.length) {
    fail(
      `count mismatch (Prisma ${prismaRows.length} vs Payload ${payloadRows.length})`,
    );
  }

  const prismaByLegacyId = new Map<string, Record<string, unknown>>();
  const prismaSlugs = new Map<string, Record<string, unknown>>();
  for (const row of prismaRows) {
    const lm = String(row["id"]);
    if (prismaByLegacyId.has(lm)) {
      fail(`duplicate Prisma legacy id: ${lm}`);
    }
    prismaByLegacyId.set(lm, row);
    if (prismaSlugs.has(String(row["slug"]))) {
      fail(`duplicate Prisma slug: ${row["slug"]}`);
    }
    prismaSlugs.set(String(row["slug"]), row);
  }

  const payloadByLegacyId = new Map<string, Record<string, unknown>>();
  const payloadSlugs = new Map<string, Record<string, unknown>>();
  for (const row of payloadRows) {
    const lm = String(row["legacyPrismaId"]);
    if (payloadByLegacyId.has(lm)) {
      fail(`duplicate Payload legacyPrismaId: ${lm}`);
    }
    payloadByLegacyId.set(lm, row);
    if (payloadSlugs.has(String(row["slug"]))) {
      fail(`duplicate Payload slug: ${row["slug"]}`);
    }
    payloadSlugs.set(String(row["slug"]), row);
  }

  const missing = prismaRows.filter(
    (row) => !payloadByLegacyId.has(String(row["id"])),
  );
  if (missing.length > 0) {
    fail(
      `missing records (Prisma ids absent in Payload): ${missing.map((m) => m["id"]).join(", ")}`,
    );
  }
  const extra = payloadRows.filter(
    (row) => !prismaByLegacyId.has(String(row["legacyPrismaId"])),
  );
  if (extra.length > 0) {
    fail(
      `extra records (Payload legacyPrismaId not in Prisma): ${extra.map((e) => e["legacyPrismaId"]).join(", ")}`,
    );
  }

  for (const [lm, prismaRow] of prismaByLegacyId) {
    const payloadRow = payloadByLegacyId.get(lm);
    if (!payloadRow) continue;

    for (const field of fields) {
      const sourceField = field.sourceField ?? field.name;
      const prismaValue = prismaRow[sourceField];
      const payloadValue: unknown = payloadRow[field.name];
      if (field.kind === "timestamp") {
        if (prismaValue === undefined || prismaValue === null) {
          fail(`${lm}: Prisma ${field.name} is null/undefined`);
          continue;
        }
        if (payloadValue === undefined || payloadValue === null) {
          fail(
            `${lm}: Payload ${field.name} is null/undefined (Prisma ${scalar(prismaValue)})`,
          );
          continue;
        }
        const a = toIso(prismaValue as string | Date);
        const b = toIso(payloadValue as string | Date);
        if (a !== b) {
          fail(`${lm}: ${field.name} parity (Prisma ${a} vs Payload ${b})`);
        }
        continue;
      }

      if (field.kind === "timestampOrNull") {
        const aNull = prismaValue === undefined || prismaValue === null;
        const bNull = payloadValue === undefined || payloadValue === null;
        if (aNull && bNull) continue;
        if (aNull !== bNull) {
          fail(
            `${lm}: ${field.name} null parity (Prisma ${scalar(prismaValue)} vs Payload ${scalar(payloadValue)})`,
          );
          continue;
        }
        const a = toIso(prismaValue as string | Date);
        const b = toIso(payloadValue as string | Date);
        if (a !== b) {
          fail(`${lm}: ${field.name} parity (Prisma ${a} vs Payload ${b})`);
        }
        continue;
      }

      if (field.kind === "boolean") {
        if (typeof prismaValue !== "boolean" || typeof payloadValue !== "boolean") {
          fail(
            `${lm}: ${field.name} boolean type parity (Prisma ${JSON.stringify(prismaValue)} type=${typeof prismaValue} vs Payload ${JSON.stringify(payloadValue)} type=${typeof payloadValue})`,
          );
          continue;
        }
        if (prismaValue !== payloadValue) {
          fail(
            `${lm}: ${field.name} parity (Prisma ${prismaValue} vs Payload ${payloadValue})`,
          );
        }
        continue;
      }

      if (field.kind === "number") {
        if (typeof prismaValue !== "number" || typeof payloadValue !== "number") {
          fail(
            `${lm}: ${field.name} number type parity (Prisma ${JSON.stringify(prismaValue)} type=${typeof prismaValue} vs Payload ${JSON.stringify(payloadValue)} type=${typeof payloadValue})`,
          );
          continue;
        }
        if (prismaValue !== payloadValue) {
          fail(
            `${lm}: ${field.name} parity (Prisma ${prismaValue} vs Payload ${payloadValue})`,
          );
        }
        continue;
      }

      const a = scalar(prismaValue);
      const b = scalar(payloadValue);
      if (a !== b) {
        fail(
          `${lm}: ${field.name} parity (Prisma ${JSON.stringify(a)} vs Payload ${JSON.stringify(b)})`,
        );
      }
    }
  }

  for (const slug of prismaSlugs.keys()) {
    const payloadRow = payloadSlugs.get(slug);
    if (!payloadRow) {
      fail(`slug missing in Payload: ${slug}`);
    }
  }

  console.log(`${label} parity: ${ok ? "PASS" : "FAIL"}`);
  return ok;
}

// ---------------------------------------------------------------------------
// Tool relationship + ToolTag + RedirectLink checks
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== Catalog parity validation (Prisma vs Payload) ===");

  // 1. Read-only Prisma reads.
  const prismaCategories = await db.category.findMany();
  const prismaProviders = await db.provider.findMany();
  const prismaTags = await db.tag.findMany();
  const prismaTools = await db.tool.findMany();
  const prismaToolTags = await db.toolTag.findMany();
  const prismaRedirectLinks = await db.redirectLink.findMany();
  console.log(
    `Prisma: ${prismaCategories.length} categories, ${prismaProviders.length} providers, ${prismaTags.length} tags, ${prismaTools.length} tools, ${prismaToolTags.length} toolTags, ${prismaRedirectLinks.length} redirectLinks`,
  );

  // 2. Pre-import sanity on Prisma-side integrity.
  let ok = true;
  const fail = (msg: string) => {
    ok = false;
    console.log(`  FAIL: ${msg}`);
  };

  const prismaToolIds = new Set(prismaTools.map((t) => t.id));
  const prismaTagIds = new Set(prismaTags.map((t) => t.id));
  const prismaCategoryIds = new Set(prismaCategories.map((c) => c.id));
  const prismaProviderIds = new Set(prismaProviders.map((p) => p.id));

  const toolTagPairCount = new Map<
    string,
    { tool: string; tag: string; count: number }
  >();
  for (const tt of prismaToolTags) {
    if (!prismaToolIds.has(tt.toolId)) {
      fail(`ToolTag orphan tool id: ${tt.toolId}`);
    }
    if (!prismaTagIds.has(tt.tagId)) {
      fail(`ToolTag orphan tag id: ${tt.tagId}`);
    }
    const key = `${tt.toolId}|${tt.tagId}`;
    const cur = toolTagPairCount.get(key);
    if (cur) cur.count += 1;
    else toolTagPairCount.set(key, { tool: tt.toolId, tag: tt.tagId, count: 1 });
  }
  const duplicatePairs = [...toolTagPairCount.values()].filter((p) => p.count > 1);
  if (duplicatePairs.length > 0) {
    fail(
      `ToolTag duplicate pairs: ${duplicatePairs.map((p) => `(${p.tool},${p.tag})x${p.count}`).join(", ")}`,
    );
  }

  for (const tool of prismaTools) {
    if (!prismaCategoryIds.has(tool.categoryId)) {
      fail(`Tool orphan categoryId: ${tool.slug} -> ${tool.categoryId}`);
    }
    if (
      tool.providerId != null &&
      !prismaProviderIds.has(tool.providerId)
    ) {
      fail(`Tool orphan providerId: ${tool.slug} -> ${tool.providerId}`);
    }
  }

  // 3. Load Payload.
  const payload = await getPayload({ config });

  const payloadCategories = await findPayloadRows(payload, "categories");
  const payloadProviders = await findPayloadRows(payload, "providers");
  const payloadTags = await findPayloadRows(payload, "tags");
  const payloadTools = await findPayloadRows(payload, "tools", 2);
  console.log(
    `Payload: ${payloadCategories.length} categories, ${payloadProviders.length} providers, ${payloadTags.length} tags, ${payloadTools.length} tools`,
  );

  // 4. Field parity per collection.
  const categoryFields: FieldSpec[] = [
    { name: "legacyPrismaId", sourceField: "id", kind: "scalar" },
    { name: "name", kind: "scalar" },
    { name: "slug", kind: "scalar" },
    { name: "description", kind: "scalar" },
    { name: "icon", kind: "scalar" },
    { name: "sortOrder", kind: "number" },
    { name: "createdAt", kind: "timestamp" },
    { name: "updatedAt", kind: "timestamp" },
  ];
  const providerFields: FieldSpec[] = [
    { name: "legacyPrismaId", sourceField: "id", kind: "scalar" },
    { name: "name", kind: "scalar" },
    { name: "slug", kind: "scalar" },
    { name: "description", kind: "scalar" },
    { name: "websiteUrl", kind: "scalar" },
    { name: "logo", kind: "scalar" },
    { name: "createdAt", kind: "timestamp" },
    { name: "updatedAt", kind: "timestamp" },
  ];
  const tagFields: FieldSpec[] = [
    { name: "legacyPrismaId", sourceField: "id", kind: "scalar" },
    { name: "name", kind: "scalar" },
    { name: "slug", kind: "scalar" },
    { name: "createdAt", kind: "timestamp" },
    { name: "updatedAt", kind: "timestamp" },
  ];
  const toolFields: FieldSpec[] = [
    { name: "legacyPrismaId", sourceField: "id", kind: "scalar" },
    { name: "name", kind: "scalar" },
    { name: "slug", kind: "scalar" },
    { name: "description", kind: "scalar" },
    { name: "logo", kind: "scalar" },
    { name: "websiteUrl", kind: "scalar" },
    { name: "affiliateUrl", kind: "scalar" },
    { name: "pricingType", kind: "scalar" },
    { name: "rating", kind: "number" },
    { name: "isFeatured", kind: "boolean" },
    { name: "isPublished", kind: "boolean" },
    { name: "isSponsored", kind: "boolean" },
    { name: "tags", kind: "scalar" },
    { name: "hostingGuide", kind: "scalar" },
    { name: "entityType", kind: "scalar" },
    { name: "verificationStatus", kind: "scalar" },
    { name: "lastVerifiedAt", kind: "timestampOrNull" },
    { name: "sourceUrl", kind: "scalar" },
    { name: "metadata", kind: "scalar" },
    { name: "documentationUrl", kind: "scalar" },
    { name: "pricingUrl", kind: "scalar" },
    { name: "createdAt", kind: "timestamp" },
    { name: "updatedAt", kind: "timestamp" },
  ];

  const categoryOk = runParity({
    label: "CATEGORY",
    prismaRows: prismaCategories as unknown as Record<string, unknown>[],
    payloadRows: payloadCategories,
    fields: categoryFields,
  });
  const providerOk = runParity({
    label: "PROVIDER",
    prismaRows: prismaProviders as unknown as Record<string, unknown>[],
    payloadRows: payloadProviders,
    fields: providerFields,
  });
  const tagOk = runParity({
    label: "TAG",
    prismaRows: prismaTags as unknown as Record<string, unknown>[],
    payloadRows: payloadTags,
    fields: tagFields,
  });
  const toolOk = runParity({
    label: "TOOL",
    prismaRows: prismaTools as unknown as Record<string, unknown>[],
    payloadRows: payloadTools,
    fields: toolFields,
  });

  if (!categoryOk) ok = false;
  if (!providerOk) ok = false;
  if (!tagOk) ok = false;
  if (!toolOk) ok = false;

  // 5. Metadata JSON sanity (semantic check on top of exact string parity).
  console.log(`\n========== TOOL METADATA JSON ==========`);
  let metadataJsonOk = true;
  for (const tool of prismaTools) {
    const lm = tool.slug;
    const payloadTool = payloadTools.find(
      (d) => String(d["legacyPrismaId"]) === String(tool.id),
    );
    const prismaMeta = tool.metadata;
    const payloadMeta = payloadTool?.["metadata"];
    const normalize = (v: unknown) =>
      v === undefined || v === null || v === "" ? null : v;
    const a = normalize(prismaMeta);
    const b = normalize(payloadMeta);
    if (a !== null && b !== null) {
      const parseA = safeJson(a as string);
      const parseB = safeJson(b as string);
      if (
        parseA === "invalid" ||
        parseB === "invalid" ||
        (parseA !== null && parseB !== null && JSON.stringify(parseA) !== JSON.stringify(parseB))
      ) {
        metadataJsonOk = false;
        console.log(
          `  FAIL: ${lm} metadata semantic mismatch (Prisma ${a} vs Payload ${b})`,
        );
      }
    } else if (a !== b) {
      metadataJsonOk = false;
      console.log(
        `  FAIL: ${lm} metadata null mismatch (Prisma ${a} vs Payload ${b})`,
      );
    }
  }
  console.log(
    `Metadata JSON semantic parity: ${metadataJsonOk ? "PASS" : "FAIL"}`,
  );
  if (!metadataJsonOk) ok = false;

  // 6. Category relationship parity.
  console.log(`\n========== TOOL CATEGORY RELATIONSHIP ==========`);
  const payloadCategoryById = new Map(
    payloadCategories.map((d) => [d["id"], d] as const),
  );
  let categoryRelOk = true;
  for (const tool of prismaTools) {
    const lt = String(tool.id);
    const payloadTool = payloadTools.find(
      (d) => String(d["legacyPrismaId"]) === lt,
    );
    if (!payloadTool) continue;
    const relId = relationId(payloadTool["category"] as Relatable | null | undefined);
    const payloadCategory =
      relId === null ? null : payloadCategoryById.get(relId);
    const payloadLegacy =
      payloadCategory?.["legacyPrismaId"] ?? null;
    const prismaCategoryId = tool.categoryId;
    if (payloadLegacy !== prismaCategoryId) {
      categoryRelOk = false;
      console.log(
        `  FAIL: ${tool.slug} category (Prisma ${prismaCategoryId} vs Payload legacy ${payloadLegacy})`,
      );
    }
  }
  console.log(
    `Category relationship parity: ${categoryRelOk ? "PASS" : "FAIL"} (${prismaTools.length} tools)`,
  );
  if (!categoryRelOk) ok = false;

  // 7. Provider relationship parity (null-aware).
  console.log(`\n========== TOOL PROVIDER RELATIONSHIP ==========`);
  const payloadProviderById = new Map(
    payloadProviders.map((d) => [d["id"], d] as const),
  );
  let providerRelOk = true;
  let providerNonNull = 0;
  let providerNull = 0;
  for (const tool of prismaTools) {
    const lt = String(tool.id);
    const payloadTool = payloadTools.find(
      (d) => String(d["legacyPrismaId"]) === lt,
    );
    if (!payloadTool) continue;
    const relId = relationId(payloadTool["provider"] as Relatable | null | undefined);
    const payloadProvider =
      relId === null ? null : payloadProviderById.get(relId);
    const payloadLegacy = payloadProvider?.["legacyPrismaId"] ?? null;
    const prismaProviderId = tool.providerId ?? null;
    if (prismaProviderId === null) {
      providerNull += 1;
      if (payloadLegacy !== null) {
        providerRelOk = false;
        console.log(
          `  FAIL: ${tool.slug} provider should be null but Payload has ${payloadLegacy}`,
        );
      }
    } else {
      providerNonNull += 1;
      if (payloadLegacy !== prismaProviderId) {
        providerRelOk = false;
        console.log(
          `  FAIL: ${tool.slug} provider (Prisma ${prismaProviderId} vs Payload legacy ${payloadLegacy})`,
        );
      }
    }
  }
  console.log(
    `Provider relationship parity: ${providerRelOk ? "PASS" : "FAIL"} (${providerNonNull} mapped, ${providerNull} null preserved)`,
  );
  if (!providerRelOk) ok = false;

  // 8. ToolTag relationship parity (normalized pairs).
  console.log(`\n========== TOOLTAG RELATIONSHIP ==========`);
  const prismaPairs = new Set(prismaToolTags.map((tt) => `${tt.toolId}|${tt.tagId}`));
  console.log(`Prisma ToolTag relationships: ${prismaPairs.size}`);

  const payloadPairs = new Set<string>();
  let payloadPairCount = 0;
  let orphanPayloadTool = 0;
  let orphanPayloadTag = 0;
  for (const payloadTool of payloadTools) {
    const legacyToolId = String(payloadTool["legacyPrismaId"]);
    if (!prismaToolIds.has(legacyToolId)) orphanPayloadTool += 1;
    const tags = payloadTool["structuredTags"];
    const tagArray = Array.isArray(tags)
      ? (tags as Array<Relatable | Record<string, unknown>>)
      : [];
    for (const tagRef of tagArray) {
      payloadPairCount += 1;
      const tagId = relationId(tagRef as Relatable);
      const tagDoc =
        tagId === null
          ? null
          : payloadTags.find((t) => t["id"] === tagId);
      const tagLegacy =
        (tagDoc?.["legacyPrismaId"] as string | undefined) ?? null;
      if (tagLegacy === null || !prismaTagIds.has(tagLegacy)) {
        orphanPayloadTag += 1;
      }
      if (tagLegacy !== null) {
        const pair = `${legacyToolId}|${tagLegacy}`;
        if (payloadPairs.has(pair)) {
          // duplicate normalized pair
          console.log(
            `  FAIL: duplicate Payload relationship pair ${pair} (${legacyToolId}, ${tagLegacy})`,
          );
          ok = false;
        }
        payloadPairs.add(pair);
      }
    }
  }

  const missingPairs = [...prismaPairs].filter((p) => !payloadPairs.has(p));
  const extraPairs = [...payloadPairs].filter((p) => !prismaPairs.has(p));
  console.log(`Payload ToolTag relationships: ${payloadPairs.size}`);
  console.log(`Missing relationships: ${missingPairs.length}`);
  console.log(`Extra relationships: ${extraPairs.length}`);
  console.log(`Duplicate relationships: ${prismaPairs.size !== prismaToolTags.length ? "prisma dup" : "0"}`);
  console.log(`Orphan payload tool refs: ${orphanPayloadTool}`);
  console.log(`Orphan payload tag refs: ${orphanPayloadTag}`);

  if (missingPairs.length > 0) {
    ok = false;
    console.log(`  FAIL: missing pairs: ${missingPairs.join(", ")}`);
  }
  if (extraPairs.length > 0) {
    ok = false;
    console.log(`  FAIL: extra pairs: ${extraPairs.join(", ")}`);
  }
  if (orphanPayloadTool > 0 || orphanPayloadTag > 0) {
    ok = false;
  }
  const toolTagOk =
    prismaPairs.size === payloadPairs.size &&
    missingPairs.length === 0 &&
    extraPairs.length === 0 &&
    orphanPayloadTool === 0 &&
    orphanPayloadTag === 0;
  console.log(`ToolTag parity: ${toolTagOk ? "PASS" : "FAIL"}`);
  if (!toolTagOk) ok = false;

  // 9. RedirectLink safety (read-only verification).
  console.log(`\n========== REDIRECTLINK SAFETY ==========`);
  let redirectOk = true;
  const redirectLinkCount = prismaRedirectLinks.length;
  if (redirectLinkCount !== 54) {
    redirectOk = false;
    console.log(
      `  FAIL: RedirectLink count ${redirectLinkCount} (expected 54)`,
    );
  }
  for (const rl of prismaRedirectLinks) {
    if (rl.toolId === null || !prismaToolIds.has(rl.toolId)) {
      redirectOk = false;
      console.log(`  FAIL: RedirectLink ${rl.slug} toolId ${rl.toolId} invalid`);
    }
  }
  const redirectSlugs = new Set(prismaRedirectLinks.map((rl) => rl.slug));
  if (redirectSlugs.size !== redirectLinkCount) {
    redirectOk = false;
    console.log(`  FAIL: duplicate redirect slugs detected`);
  }
  console.log(
    `RedirectLink count: ${redirectLinkCount}; valid toolId refs: ${redirectLinkCount === 54 && redirectOk ? "54/54" : "FAIL"};`,
  );
  console.log(`RedirectLink safety: ${redirectOk ? "PASS" : "FAIL"}`);
  if (!redirectOk) ok = false;

  await payload.destroy();
  await db.$disconnect();

  console.log(`\n=== RESULT ===`);
  console.log(`Category parity: ${categoryOk ? "PASS" : "FAIL"}`);
  console.log(`Provider parity: ${providerOk ? "PASS" : "FAIL"}`);
  console.log(`Tag parity: ${tagOk ? "PASS" : "FAIL"}`);
  console.log(`Tool parity: ${toolOk ? "PASS" : "FAIL"}`);
  console.log(`ToolTag parity: ${toolTagOk ? "PASS" : "FAIL"}`);
  console.log(
    `Overall: ${ok ? "100% PARITY" : "PARITY FAILED"}`,
  );

  if (!ok) {
    process.exitCode = 1;
  }
  process.exit(process.exitCode || 0);
}

function safeJson(s: string): unknown | "invalid" | null {
  try {
    const parsed = JSON.parse(s);
    return parsed;
  } catch {
    return "invalid";
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});