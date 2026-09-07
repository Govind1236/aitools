import { db } from "@/lib/db";
import { getPayload } from "payload";
import config from "@payload-config";

// ------------------------------------------------------------------
// PROVIDER REPOSITORY (Payload PoC)
// ------------------------------------------------------------------
// Small abstraction proving that a Payload-backed read path can coexist
// with the existing Prisma-backed read path. Prisma is the default.
// Nothing in the existing catalog/frontend was rewired to use this yet.
// ------------------------------------------------------------------

export type ProviderRecord = {
  /** Primary identifier used by the source implementation. */
  id: string;
  /** Original Prisma Provider id — populated for Payload-sourced reads. */
  legacyPrismaId?: string | null;
  name: string;
  slug: string;
  description: string | null;
  websiteUrl: string | null;
  logo: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ProviderSource = "prisma" | "payload";

/** Read a Provider from Prisma (authoritative source). */
export async function getProviderFromPrisma(
  slug: string,
): Promise<ProviderRecord | null> {
  const row = await db.provider.findFirst({ where: { slug } });
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    websiteUrl: row.websiteUrl,
    logo: row.logo,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** Read a Provider from Payload (secondary read-only mirror). */
export async function getProviderFromPayload(
  slug: string,
): Promise<ProviderRecord | null> {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "providers",
    where: { slug: { equals: slug } },
    limit: 1,
  });
  const doc = docs[0] as unknown as
    | (Record<string, unknown> & {
        id: number | string;
        createdAt: string;
        updatedAt: string;
      })
    | undefined;
  if (!doc) return null;
  return {
    id: String(doc.id),
    legacyPrismaId: doc.legacyPrismaId ? String(doc.legacyPrismaId) : null,
    name: String(doc.name),
    slug: String(doc.slug),
    description: doc.description ? String(doc.description) : null,
    websiteUrl: doc.websiteUrl ? String(doc.websiteUrl) : null,
    logo: doc.logo ? String(doc.logo) : null,
    createdAt: new Date(doc.createdAt),
    updatedAt: new Date(doc.updatedAt),
  };
}

/** Repository factory. Defaults to Prisma. */
export function providerRepository(source: ProviderSource = "payload") {
  return {
    getBySlug: (slug: string) =>
      source === "payload"
        ? getProviderFromPayload(slug)
        : getProviderFromPrisma(slug),
  };
}