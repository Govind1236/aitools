import { getPayload } from "payload";
import config from "D:/AITOOL/payload.config.ts";

async function main() {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "redirect-links",
    where: { slug: { equals: "together-ai" } },
    depth: 1,
    limit: 1,
  });
  console.log("payload redirect:", JSON.stringify(docs[0], null, 2));
  const { docs: count } = await payload.find({ collection: "redirect-links", limit: 0, pagination: false });
  console.log("payload redirect-links count:", count.length);
  const { docs: tl } = await payload.find({ collection: "tools", where: { slug: { equals: "together-ai" } }, depth: 1, limit: 1 });
  console.log("payload tool:", JSON.stringify(tl[0], null, 2));
  await payload.destroy();
}
main();