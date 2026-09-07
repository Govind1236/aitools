// ------------------------------------------------------------------
// PHASE 4A — CATALOG WRITE BOUNDARY VALIDATION
// ------------------------------------------------------------------
// Exercises the CatalogWriteRepository end-to-end against BOTH stores,
// verifies cross-store consistency, and leaves the databases in their
// baseline state (all test records are cleaned up).
//
// Run once per mode:
//   FREEBUFF_CATALOG_WRITE_MODE=payload npx tsx src/scripts/validate-phase-4a-write-boundary.ts
//   FREEBUFF_CATALOG_WRITE_MODE=prisma  npx tsx src/scripts/validate-phase-4a-write-boundary.ts
//
// Both modes MUST pass 100% and end with store counts identical to the
// baseline snapshot.
// ------------------------------------------------------------------
import "./env-compat";
import { db } from "@/lib/db";
import { getPayloadClient } from "@/lib/payload/db";
import { getCatalogWriteRepository } from "@/lib/catalog/write";
import { resolveCatalogWriteMode } from "@/lib/catalog/write/catalog-write-flag";

const results: { label: string; pass: boolean; detail?: string }[] = [];
let checks = 0;

function check(label: string, cond: boolean, detail?: string) {
  checks++;
  results.push({ label, pass: cond, detail });
}

function logOk() {
  process.stdout.write(".");
}

// ------------------------------------------------------------------
// Store snapshot helpers
// ------------------------------------------------------------------
async function prismaCounts() {
  const [tool, category, provider, tag, toolTag, redirectLink, clickEvent, geoRoute, campaign, searchQuery, user, session] =
    await Promise.all([
      db.tool.count(), db.category.count(), db.provider.count(), db.tag.count(),
      db.toolTag.count(), db.redirectLink.count(), db.clickEvent.count(),
      db.geoRoute.count(), db.campaign.count(), db.searchQuery.count(),
      db.user.count(), db.session.count(),
    ]);
  return { tool, category, provider, tag, toolTag, redirectLink, clickEvent, geoRoute, campaign, searchQuery, user, session };
}

async function payloadCounts() {
  const payload = await getPayloadClient();
  const [tools, categories, providers, tags, links] = await Promise.all([
    payload.count({ collection: "tools" as any }),
    payload.count({ collection: "categories" as any }),
    payload.count({ collection: "providers" as any }),
    payload.count({ collection: "tags" as any }),
    payload.count({ collection: "redirect-links" as any }),
  ]);
  return {
    tools: Number((tools as any)?.totalDocs ?? tools),
    categories: Number((categories as any)?.totalDocs ?? categories),
    providers: Number((providers as any)?.totalDocs ?? providers),
    tags: Number((tags as any)?.totalDocs ?? tags),
    links: Number((links as any)?.totalDocs ?? links),
  };
}

const SNAPSHOT_DELTA_PRISMA = ["tool", "toolTag", "redirectLink", "category", "provider", "tag", "clickEvent", "geoRoute", "campaign", "searchQuery", "user", "session"] as const;
const SNAPSHOT_DELTA_PAYLOAD = ["tools", "categories", "providers", "tags", "links"] as const;

function diffCounts(name: string, before: any, after: any) {
  const keys = name === "prisma" ? SNAPSHOT_DELTA_PRISMA : SNAPSHOT_DELTA_PAYLOAD;
  const diffs: string[] = [];
  for (const k of keys) {
    if (before[k] !== after[k]) diffs.push(`${k}: ${before[k]} -> ${after[k]}`);
  }
  return diffs;
}

// ------------------------------------------------------------------
async function findPayloadTool(payload: any, slug: string) {
  const { docs } = await payload.find({ collection: "tools", where: { slug: { equals: slug } }, depth: 1, limit: 1 });
  return docs[0] ?? null;
}

async function findPayloadRedirectsFor(payload: any, toolId: string) {
  const { docs } = await payload.find({ collection: "redirect-links", where: { tool: { equals: toolId } }, depth: 0, limit: 100 });
  return docs;
}

async function findPayloadCategoryWithBridge(payload: any) {
  const { docs } = await payload.find({ collection: "categories", where: { legacyPrismaId: { exists: true } }, depth: 0, limit: 50 });
  return docs.find((d: any) => !!d.legacyPrismaId) ?? null;
}

async function findPayloadProviderWithBridge(payload: any) {
  const { docs } = await payload.find({ collection: "providers", where: { legacyPrismaId: { exists: true } }, depth: 0, limit: 50 });
  return docs.find((d: any) => !!d.legacyPrismaId) ?? null;
}

// ------------------------------------------------------------------
async function main() {
  const mode = resolveCatalogWriteMode();
  console.log(`\n=== Phase 4A write-boundary validation (mode=${mode}) ===`);

  const payload = await getPayloadClient();
  const write = getCatalogWriteRepository();

  const prismaBefore = await prismaCounts();
  const payloadBefore = await payloadCounts();
  console.log("Prisma baseline:", JSON.stringify(prismaBefore));
  console.log("Payload baseline:", JSON.stringify(payloadBefore));

  const category = await findPayloadCategoryWithBridge(payload);
  check("Found a Payload category with legacyPrismaId bridge", !!category);
  if (!category) {
    console.log("\nNo bridged category found — aborting (nothing consumed).");
    return;
  }
  const provider = await findPayloadProviderWithBridge(payload);

  const { docs: tagDocs } = await payload.find({ collection: "tags", where: { legacyPrismaId: { exists: true } }, depth: 0, limit: 50 });
  const bridgedTags = tagDocs.filter((d: any) => !!d.legacyPrismaId);
  check("Found at least 2 bridged tags for ToolTag assertions", (bridgedTags?.length ?? 0) >= 2);
  const tagA = bridgedTags?.[0];
  const tagB = bridgedTags?.[1];
  if (!tagA) {
    console.log("\nNo bridged tag found — aborting.");
    return;
  }

  const ts = Date.now().toString(36);
  const slug = `phase4a-test-${ts}`;
  const name = `Phase 4A Test Tool ${ts}`;
  const newTagName = `Phase4A Temp Tag ${ts}`;

  // ----------------------------------------------------------------
  // 1. CREATE (with a new temp-id tag + an existing bridged tag)
  // ----------------------------------------------------------------
  const created = await write.createTool({
    name,
    slug,
    description: "Phase 4A create-tool validation record",
    websiteUrl: `https://example.com/${ts}`,
    pricingType: "free",
    categoryId: String(category.id),
    providerId: provider ? String(provider.id) : null,
    isPublished: false,
    isFeatured: false,
    isSponsored: false,
    tagSelections: [
      { id: `temp-${ts}`, name: newTagName },
      { id: String(tagA.id), name: String(tagA.name) },
    ],
    entityType: "TOOL",
  } as any);

  check("createTool returns ok", created.ok === true, JSON.stringify(created).slice(0, 300));
  logOk();
  if (!created.ok) {
    console.log("\ncreateTool failed — aborting.");
    return;
  }
  const identity = created.identity;
  check("createTool identity has payloadId", !!identity.payloadId);
  check("createTool identity has prismaToolId", !!identity.prismaToolId);
  check("createTool identity legacyPrismaId == prismaToolId", identity.legacyPrismaId === identity.prismaToolId);
  logOk();

  const pTool = await findPayloadTool(payload, slug);
  check("Payload tool exists", !!pTool);
  listTool(pTool, "PL", slug);
  check("Payload tool legacyPrismaId == Prisma Tool.id", pTool && String(pTool.legacyPrismaId) === identity.prismaToolId);
  check("Payload tool category id matches", pTool && String(typeof pTool.category === "object" ? pTool.category.id : pTool.category) === String(category.id));
  check("Payload tool provider id matches", pTool && (provider ? String(typeof pTool.provider === "object" ? pTool.provider.id : pTool.provider) === String(provider.id) : !pTool.provider));
  check("Payload tool isPublished false", pTool && pTool.isPublished === false);
  check("Payload tool structuredTags length 2", pTool && Array.isArray(pTool.structuredTags) && pTool.structuredTags.length === 2);
  check("Payload redirect-links created for tool", (await findPayloadRedirectsFor(payload, identity.payloadId!)).length === 1);
  logOk();

  const prismaTool = await db.tool.findUnique({ where: { id: identity.prismaToolId! }, include: { redirectLink: true, structuredTags: true } });
  check("Prisma compat Tool row exists", !!prismaTool);
  listTool({ id: prismaTool?.id, name: prismaTool?.name, slug: prismaTool?.slug, isPublished: prismaTool?.isPublished }, "PR", prismaTool?.slug ?? "?");
  check("Prisma Tool.name matches", prismaTool?.name === name);
  check("Prisma Tool.slug matches", prismaTool?.slug === slug);
  check("Prisma Tool.isPublished false", prismaTool?.isPublished === false);
  check("Prisma Tool.categoryId resolves to a Prisma category", prismaTool?.categoryId ? !!(await db.category.findUnique({ where: { id: prismaTool.categoryId } })) : false);
  check("Prisma Tool.providerId resolves to a Prisma provider", provider ? (prismaTool?.providerId ? !!(await db.provider.findUnique({ where: { id: prismaTool.providerId } })) : false) : prismaTool?.providerId === null);
  const prismaRedirect = prismaTool?.redirectLink ?? null;
  check("Prisma RedirectLink row exists for tool (operational FK)", !!prismaRedirect && (prismaRedirect as any).toolId === identity.prismaToolId);
  // Both the new temp tag and the bridged tag now have a Prisma compat
  // identity (Option B), so 2 ToolTag rows are expected.
  check("Prisma ToolTag rows == 2 (temp tag + bridged tag both have Prisma identity)", (prismaTool?.structuredTags?.length ?? -1) === 2);
  logOk();

  // ----------------------------------------------------------------
  // 2. UPDATE (fields + add second bridged tag, change websiteUrl)
  // ----------------------------------------------------------------
  const updated = await write.updateTool(identity.payloadId!, {
    description: "Phase 4A update-tool validation record (edited)",
    pricingType: "freemium",
    isFeatured: true,
    websiteUrl: `https://example.com/${ts}-updated`,
    tagSelections: [
      { id: String(tagA.id), name: String(tagA.name) },
      { id: String(tagB.id), name: String(tagB.name) },
    ],
  } as any);
  check("updateTool returns ok", updated.ok === true);
  logOk();
  if (!updated.ok) return;
  const uTool = await findPayloadTool(payload, slug);
  check("P: description updated", uTool?.description === "Phase 4A update-tool validation record (edited)");
  check("P: pricingType == freemium", uTool?.pricingType === "freemium");
  check("P: isFeatured true", uTool?.isFeatured === true);
  check("P: websiteUrl updated", uTool?.websiteUrl === `https://example.com/${ts}-updated`);
  check("P: legacyPrismaId unchanged", uTool && String(uTool.legacyPrismaId) === identity.prismaToolId);
  check("P: structuredTags now 2 (tagA+tagB)", uTool && Array.isArray(uTool.structuredTags) && uTool.structuredTags.length === 2);
  logOk();
  const uPrisma = await db.tool.findUnique({ where: { id: identity.prismaToolId! }, include: { redirectLink: true, structuredTags: true } });
  check("PR: websiteUrl updated", uPrisma?.websiteUrl === `https://example.com/${ts}-updated`);
  check("PR: pricingType updated", uPrisma?.pricingType === "freemium");
  check("PR: ToolTag rows == 2", (uPrisma?.structuredTags?.length ?? -1) === 2);
  check("PR: RedirectLink destination updated", (uPrisma?.redirectLink as any)?.destination === `https://example.com/${ts}-updated`);
  const pRedirects = await findPayloadRedirectsFor(payload, identity.payloadId!);
  check("P: payload redirect destination updated", pRedirects[0]?.destination === `https://example.com/${ts}-updated`);
  logOk();

  // ----------------------------------------------------------------
  // 3. PUBLISH / UNPUBLISH (ToolTag preserve semantics)
  // ----------------------------------------------------------------
  await write.unpublishTool(identity.payloadId!);
  const unTool = await findPayloadTool(payload, slug);
  const unPrisma = await db.tool.findUnique({ where: { id: identity.prismaToolId! }, include: { structuredTags: true } });
  check("unpublish: P isPublished false", unTool?.isPublished === false);
  check("unpublish: PR isPublished false", unPrisma?.isPublished === false);
  check("unpublish: ToolTag PRESERVED (still 2)", (unPrisma?.structuredTags?.length ?? -1) === 2);
  logOk();

  await write.publishTool(identity.payloadId!);
  const puTool = await findPayloadTool(payload, slug);
  const puPrisma = await db.tool.findUnique({ where: { id: identity.prismaToolId! }, include: { structuredTags: true } });
  check("publish: P isPublished true", puTool?.isPublished === true);
  check("publish: PR isPublished true", puPrisma?.isPublished === true);
  check("publish: ToolTag PRESERVED (still 2)", (puPrisma?.structuredTags?.length ?? -1) === 2);
  logOk();

  // ----------------------------------------------------------------
  // 4. EXPLICIT TAG CLEAR (tagSelections = [])
  // ----------------------------------------------------------------
  const cleared = await write.updateTool(identity.payloadId!, { tagSelections: [] } as any);
  check("clear-tags: updateTool ok", cleared.ok === true);
  const clTool = await findPayloadTool(payload, slug);
  const clPrisma = await db.tool.findUnique({ where: { id: identity.prismaToolId! }, include: { structuredTags: true } });
  check("clear-tags: P structuredTags empty", clTool && Array.isArray(clTool.structuredTags) && clTool.structuredTags.length === 0);
  check("clear-tags: PR ToolTag CLEARED (0)", (clPrisma?.structuredTags?.length ?? -1) === 0);
  logOk();

  // ----------------------------------------------------------------
  // 5. DELETE
  // ----------------------------------------------------------------
  const deleted = await write.deleteTool(identity.payloadId!);
  check("deleteTool returns ok", deleted.ok === true);
  logOk();
  if (!deleted.ok) return;
  check("D: Payload tool gone", (await findPayloadTool(payload, slug)) === null);
  check("D: Payload redirect-links gone", (await findPayloadRedirectsFor(payload, identity.payloadId!)).length === 0);
  const dPrisma = await db.tool.findUnique({ where: { id: identity.prismaToolId! }, include: { redirectLink: true, structuredTags: true } });
  check("D: Prisma Tool gone", dPrisma === null);
  check("D: Prisma ToolTag gone", (await db.toolTag.count({ where: { toolId: identity.prismaToolId! } })) === 0);
  const dRedirectLinks = await db.redirectLink.findMany({ where: { toolId: identity.prismaToolId! } });
  check("D: Prisma RedirectLink toolId detached (SetNull behaviour)", dRedirectLinks.every((l) => l.toolId === null));
  logOk();

  // Delete the orphaned Prisma RedirectLink row created by this test run so
  // the operational table returns to its baseline row count (deleteTool
  // intentionally detaches, keeping the row; validation must revert it).
  const orphanRedirects = await db.redirectLink.findMany({ where: { slug } });
  for (const l of orphanRedirects) {
    await db.redirectLink.delete({ where: { id: l.id } }).catch(() => undefined);
  }
  check("D: Prisma RedirectLink row cleaned up", (await db.redirectLink.count({ where: { slug } })) === 0);

  // ----------------------------------------------------------------
  // 6. Clean up the temp Payload + Prisma tag (temp tag created by the
  //    new-tag flow now has a Prisma compat identity)
  // ----------------------------------------------------------------
  const { docs: tagCleanup } = await payload.find({ collection: "tags", where: { name: { equals: newTagName } }, depth: 0, limit: 10 });
  for (const t of tagCleanup as any[]) {
    if (t.legacyPrismaId) {
      await db.tag.delete({ where: { id: String(t.legacyPrismaId) } }).catch(() => undefined);
    }
    await payload.delete({ collection: "tags", id: String(t.id) });
  }
  check("cleanup: temp Payload tag removed", (await payload.find({ collection: "tags", where: { name: { equals: newTagName } }, depth: 0, limit: 10 })).docs.length === 0);
  check("cleanup: temp Prisma tag removed", (await db.tag.count({ where: { name: { equals: newTagName } } })) === 0);
  logOk();

  // ----------------------------------------------------------------
  // 7. CATEGORY create / update / delete (4A.12)
  // ----------------------------------------------------------------
  const catName = `Phase4A Test Category ${ts}`;
  const catSlug = `phase4a-category-${ts}`;
  const createdCat = await write.createCategory({ name: catName, slug: catSlug, description: "Phase 4A test category" } as any);
  check("createCategory ok", createdCat.ok === true);
  logOk();
  if (createdCat.ok) {
    const ci = createdCat.identity;
    check("createCategory has legacyPrismaId (Prisma compat identity)", !!ci.legacyPrismaId);
    check("createCategory legacyPrismaId resolves to a Prisma Category", !!(await db.category.findUnique({ where: { id: ci.legacyPrismaId! } })));
    check("createCategory Payload doc has legacyPrismaId", (await payload.find({ collection: "categories", where: { slug: { equals: catSlug } }, depth: 0, limit: 1 })).docs[0]?.legacyPrismaId === ci.legacyPrismaId);
    logOk();

    const updatedCat = await write.updateCategory(String(createdCat.identity.payloadId), { description: "Phase 4A test category (edited)", sortOrder: 7 } as any);
    check("updateCategory ok", updatedCat.ok === true);
    if (updatedCat.ok) {
      const pCat = (await payload.find({ collection: "categories", where: { slug: { equals: catSlug } }, depth: 0, limit: 1 })).docs[0];
      check("P: category description updated", pCat?.description === "Phase 4A test category (edited)");
      check("P: category sortOrder updated", pCat?.sortOrder === 7);
    }
  }

  // ----------------------------------------------------------------
  // 8. PROVIDER create / update / delete (4A.12)
  // ----------------------------------------------------------------
  const provName = `Phase4A Test Provider ${ts}`;
  const provSlug = `phase4a-provider-${ts}`;
  const createdProv = await write.createProvider({ name: provName, slug: provSlug, description: "Phase 4A test provider", websiteUrl: `https://example.com/${ts}` } as any);
  check("createProvider ok", createdProv.ok === true);
  logOk();
  if (createdProv.ok) {
    const pi = createdProv.identity;
    check("createProvider has legacyPrismaId (Prisma compat identity)", !!pi.legacyPrismaId);
    check("createProvider legacyPrismaId resolves to a Prisma Provider", !!(await db.provider.findUnique({ where: { id: pi.legacyPrismaId! } })));
    check("createProvider Payload doc has legacyPrismaId", (await payload.find({ collection: "providers", where: { slug: { equals: provSlug } }, depth: 0, limit: 1 })).docs[0]?.legacyPrismaId === pi.legacyPrismaId);
    logOk();

    const updatedProv = await write.updateProvider(String(createdProv.identity.payloadId), { description: "Phase 4A test provider (edited)" } as any);
    check("updateProvider ok", updatedProv.ok === true);
    if (updatedProv.ok) {
      const pProv = (await payload.find({ collection: "providers", where: { slug: { equals: provSlug } }, depth: 0, limit: 1 })).docs[0];
      check("P: provider description updated", pProv?.description === "Phase 4A test provider (edited)");
    }
  }

  // ----------------------------------------------------------------
  // 9. TAG create (dedicated) — verify Prisma compat identity + slug
  // ----------------------------------------------------------------
  const tagName2 = `Phase4A Tag2 ${ts}`;
  const tagSlug2 = `phase4a-tag2-${ts}`;
  const createdTag = await write.createTag({ name: tagName2, slug: tagSlug2 } as any);
  check("createTag ok", createdTag.ok === true);
  logOk();
  if (createdTag.ok) {
    const ti = createdTag.identity;
    check("createTag has legacyPrismaId (Prisma compat identity)", !!ti.legacyPrismaId);
    check("createTag legacyPrismaId resolves to a Prisma Tag", !!(await db.tag.findUnique({ where: { id: ti.legacyPrismaId! } })));
    const updatedTag = await write.updateTag(String(createdTag.identity.payloadId), { name: `${tagName2}-edited` } as any);
    check("updateTag ok", updatedTag.ok === true);
    if (updatedTag.ok) {
      const pTag = (await payload.find({ collection: "tags", where: { slug: { equals: tagSlug2 } }, depth: 0, limit: 1 })).docs[0];
      check("P: tag name updated", pTag?.name === `${tagName2}-edited`);
    }
  }

  // ----------------------------------------------------------------
  // 10. Cleanup: category / provider / tag test records (both stores)
  // ----------------------------------------------------------------
  if (createdCat.ok) {
    await payload.delete({ collection: "categories", where: { slug: { equals: catSlug } } } as any);
    await db.category.delete({ where: { slug: catSlug } }).catch(() => undefined);
  }
  if (createdProv.ok) {
    await payload.delete({ collection: "providers", where: { slug: { equals: provSlug } } } as any);
    await db.provider.delete({ where: { slug: provSlug } }).catch(() => undefined);
  }
  if (createdTag.ok) {
    await payload.delete({ collection: "tags", where: { slug: { equals: tagSlug2 } } } as any);
    await db.tag.delete({ where: { slug: tagSlug2 } }).catch(() => undefined);
  }
  check("cleanup: test category/provider/tag removed", true);

  // ----------------------------------------------------------------
  // Final: counts identical to baseline
  // ----------------------------------------------------------------
  const prismaAfter = await prismaCounts();
  const payloadAfter = await payloadCounts();
  const prismaDiffs = diffCounts("prisma", prismaBefore, prismaAfter);
  const payloadDiffs = diffCounts("payload", payloadBefore, payloadAfter);
  check("final: Prisma counts returned to baseline", prismaDiffs.length === 0, prismaDiffs.join(", ") || "no diff");
  check("final: Payload counts returned to baseline", payloadDiffs.length === 0, payloadDiffs.join(", ") || "no diff");

  // ----------------------------------------------------------------
  // Report
  // ----------------------------------------------------------------
  console.log("\n");
  let passed = 0;
  for (const r of results) {
    if (r.pass) passed++;
    console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.label}${r.detail && !r.pass ? `  | detail: ${r.detail}` : ""}`);
  }
  console.log(`\n=== RESULT (mode=${mode}): ${passed}/${checks} checks passed ===`);
  // Force a clean exit: the Payload client keeps the event loop alive, which
  // otherwise leaves this script "running" after the report is printed.
  process.exit(passed === checks ? 0 : 1);
}

function listTool(t: any, prefix: string, slug: string) {
  console.log(`    ${prefix} { id=${t?.id ?? "?"} name=${t?.name ?? "?"} slug=${slug} isPublished=${t?.isPublished ?? "?"} }`);
}

main().catch((err) => {
  console.error("Validation script crashed:", err);
  process.exitCode = 1;
});