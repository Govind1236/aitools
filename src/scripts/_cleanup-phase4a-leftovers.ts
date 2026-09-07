import "./env-compat";
import { getPayload } from "payload";
import config from "../../payload.config.ts";
import { db } from "@/lib/db";

async function main() {
  const payload = await getPayload({ config });

  const redirects = await db.redirectLink.findMany({ where: { slug: { startsWith: "debug-tool-" } } });
  for (const l of redirects) {
    await db.redirectLink.delete({ where: { id: l.id } });
    console.log("deleted prisma RedirectLink", l.slug);
  }

  const tools = await db.tool.findMany({ where: { slug: { startsWith: "debug-tool-" } } });
  for (const t of tools) {
    await db.toolTag.deleteMany({ where: { toolId: t.id } });
    await db.tool.delete({ where: { id: t.id } });
    console.log("deleted prisma Tool", t.slug);
  }

  const pRedirects = await payload.find({
    collection: "redirect-links",
    where: { slug: { like: "debug-tool-%" } },
    depth: 0,
    limit: 20,
  } as any);
  for (const doc of pRedirects.docs as any[]) {
    await payload.delete({ collection: "redirect-links", where: { slug: { equals: doc.slug } } } as any);
    console.log("deleted payload RedirectLink", doc.slug);
  }

  const pTools = await payload.find({
    collection: "tools",
    where: { slug: { like: "debug-tool-%" } },
    depth: 0,
    limit: 20,
  } as any);
  for (const doc of pTools.docs as any[]) {
    await payload.delete({ collection: "tools", id: String(doc.id) });
    console.log("deleted payload Tool", doc.id, doc.slug);
  }

  const pTags = await payload.find({
    collection: "tags",
    where: { slug: { like: "debug-temp-tag-%" } },
    depth: 0,
    limit: 50,
  } as any);
  for (const t of pTags.docs as any[]) {
    await payload.delete({ collection: "tags", id: String(t.id) });
    console.log("deleted payload Tag", t.id, t.slug);
  }
  await db.tag.deleteMany({ where: { slug: { startsWith: "debug-temp-tag-" } } });
  await db.tag.deleteMany({ where: { slug: { startsWith: "phase4a-temp-tag-" } } });

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});