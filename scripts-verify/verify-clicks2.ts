import "./env-compat";
import { db } from "../src/lib/db";
import { getPayload } from "payload";
import config from "@payload-config";

async function main() {
  console.log("prisma clickEvent count:", await db.clickEvent.count());
  const payload = await getPayload({ config });
  const { totalDocs } = await payload.count({ collection: "click-events" });
  console.log("payload click-events count:", totalDocs);
  process.exit(0);
}
main();
