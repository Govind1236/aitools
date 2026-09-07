import "./env-compat";
import { db } from "@/lib/db";
import { getPayload } from "payload";
import config from "../../payload.config.ts";

async function main() {
  const payload = await getPayload({ config });
  const prismaTools = await db.tool.findMany({ where: { slug: { startsWith: "phase4a-test-" } }, select: { id: true, slug: true, name: true } });
  const prismaRedirects = await db.redirectLink.findMany({ where: { slug: { startsWith: "phase4a-test-" } }, select: { id: true, slug: true, toolId: true } });
  const prismaTags = await db.toolTag.findMany({ where: { tool: { slug: { startsWith: "phase4a-test-" } } }, select: { toolId: true, tagId: true } });
  const pToolDocs = (await payload.find({ collection: "tools", where: { slug: { equals: "phase4a-test-" } }, depth: 0, limit: 1 })).docs;
  const pLinks = (await payload.find({ collection: "redirect-links", where: { slug: { contains: "phase4a-test-" } }, depth: 0, limit: 100 })).docs;
  const pTags = (await payload.find({ collection: "tags", where: { name: { contains: "Phase4A Temp Tag" } }, depth: 0, limit: 100 })).docs;
  console.log("prisma tools:", JSON.stringify(prismaTools));
  console.log("prisma redirects:", JSON.stringify(prismaRedirects));
  console.log("prisma toolTags:", JSON.stringify(prismaTags));
  console.log("payload tools (slug=phase4a-test-):", JSON.stringify(pToolDocs.map((d: any) => ({ id: d.id, slug: d.slug }))));
  console.log("payload links (contains phase4a-test-):", JSON.stringify(pLinks.map((d: any) => ({ id: d.id, slug: d.slug, tool: typeof d.tool === "object" ? d.tool?.id : d.tool }))));
  console.log("payload temp tags:", JSON.stringify(pTags.map((d: any) => ({ id: d.id, name: d.name }))));
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exitCode = 1; });