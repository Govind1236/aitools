import { getPayloadClient } from "@/lib/payload/db";

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyDoc = Record<string, any>;

// ────────────────────────────────────────────────────────────────────
// REDIRECT (go/[slug])
// ────────────────────────────────────────────────────────────────────

export async function getRedirectLink(slug: string) {
  const payload = await getPayloadClient();

  const { docs } = await payload.find({
    collection: "redirect-links",
    depth: 2,
    where: { slug: { equals: slug } },
    limit: 1,
  });

  const link = docs[0];
  if (!link) return null;

  // Get geo routes
  const linkId = String(link.id);
  const { docs: geoRoutes } = await payload.find({
    collection: "geo-routes",
    depth: 0,
    where: {
      and: [
        { link: { equals: linkId } },
        { isActive: { equals: true } },
      ],
    },
  });

  return {
    id: linkId,
    slug: String(link.slug),
    destination: String(link.destination),
    isActive: Boolean(link.isActive),
    geoRoutes: geoRoutes.map((gr: AnyDoc) => ({
      id: String(gr.id),
      country: String(gr.country),
      destination: String(gr.destination),
      isActive: Boolean(gr.isActive),
    })),
  };
}
