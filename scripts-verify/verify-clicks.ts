import "./env-compat";
import { getPayload } from "payload";
import config from "@payload-config";

async function main() {
  const payload = await getPayload({ config });
  const { totalDocs } = await payload.count({ collection: "click-events" });
  console.log("payload click-events count:", totalDocs);
  const { docs: recent } = await payload.find({ collection: "click-events", limit: 5, sort: "-createdAt", depth: 1 });
  for (const c of recent.slice(0, 3)) {
    console.log("click:", JSON.stringify({ id: c.id, link: c.link, timestamp: c.timestamp, trafficType: c.trafficType, deviceType: c.deviceType, createdAt: c.createdAt }));
  }
  process.exit(0);
}
main();
