import "./env-compat";
import { db } from "../src/lib/db";
import { getPayload } from "payload";
import config from "@payload-config";

async function main() {
  const payload = await getPayload({ config });
  const { totalDocs } = await payload.count({ collection: "click-events" });
  const recent = await payload.find({ collection: "click-events", sort: "-createdAt", limit: 30, depth: 1 });
  console.log("payload click-events total:", totalDocs);
  console.log("recent 5 (by createdAt):");
  for (const c of recent.docs.slice(0, 5) as any[]) {
    console.log("  id=" + c.id, "slug=" + (c.link && typeof c.link === "object" ? c.link.slug : c.link), "createdAt=" + c.createdAt, "trafficType=" + c.trafficType);
  }
  console.log("prisma clickEvents total:", await db.clickEvent.count());
  const pRecent = await db.clickEvent.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { link: true } });
  for (const c of pRecent) {
    console.log("  id=" + c.id, "slug=" + c.link?.slug, "createdAt=" + c.createdAt.toISOString());
  }
  process.exit(0);
}
main();
