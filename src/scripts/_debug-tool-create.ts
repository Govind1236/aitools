import "./env-compat";
import { getPayload } from "payload";
import config from "../../payload.config.ts";
import { getCatalogWriteRepository } from "@/lib/catalog/write";

async function main() {
  const payload = await getPayload({ config });
  const write = getCatalogWriteRepository();

  const { docs: cats } = await payload.find({ collection: "categories", where: { legacyPrismaId: { exists: true } }, depth: 0, limit: 50 });
  const category = cats.find((d: any) => !!d.legacyPrismaId);
  const { docs: provs } = await payload.find({ collection: "providers", where: { legacyPrismaId: { exists: true } }, depth: 0, limit: 50 });
  const provider = provs.find((d: any) => !!d.legacyPrismaId);
  const { docs: tags } = await payload.find({ collection: "tags", where: { legacyPrismaId: { exists: true } }, depth: 0, limit: 50 });
  const tagA = tags.find((d: any) => !!d.legacyPrismaId);

  console.log("CAT", JSON.stringify({ id: category?.id, legacy: category?.legacyPrismaId, name: category?.name }));
  console.log("PROV", JSON.stringify({ id: provider?.id, legacy: provider?.legacyPrismaId, name: provider?.name }));
  console.log("TAG", JSON.stringify({ id: tagA?.id, legacy: tagA?.legacyPrismaId, name: tagA?.name }));

  const ts = Date.now().toString(36);
  try {
    const res = await write.createTool({
      name: `Debug Tool ${ts}`,
      slug: `debug-tool-${ts}`,
      description: "debug",
      websiteUrl: `https://example.com/${ts}`,
      pricingType: "free",
      categoryId: String(category?.id),
      providerId: provider ? String(provider.id) : null,
      isPublished: false,
      tagSelections: [{ id: `temp-${ts}`, name: `Debug Temp Tag ${ts}` }],
      entityType: "TOOL",
    } as any);
    console.log("RESULT", JSON.stringify(res, null, 2));
  } catch (err: any) {
    console.log("ERR", JSON.stringify(err?.data ?? err, null, 2));
  }
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });