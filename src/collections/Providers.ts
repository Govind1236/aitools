import type { CollectionConfig } from "payload";

/**
 * Provider (Payload PoC)
 *
 * A secondary, read-only-by-convention mirror of the existing Prisma
 * `Provider` model. The Prisma database remains the authoritative source
 * during this proof of concept. Payload generates its own document `id`;
 * the original Prisma Provider `id` is preserved as `legacyPrismaId` so
 * every Payload document maps 1:1 to a Prisma row.
 */
export const Providers: CollectionConfig = {
  slug: "providers",
  admin: {
    description:
      "Read-only mirror of the Prisma Provider catalog (Payload PoC). Prisma remains authoritative.",
    useAsTitle: "name",
    defaultColumns: ["legacyPrismaId", "name", "slug", "websiteUrl"],
  },
  fields: [
    {
      name: "legacyPrismaId",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: {
        description: "Original Prisma Provider.id (cuid).",
        readOnly: true,
      },
    },
    {
      name: "name",
      type: "text",
      required: true,
      unique: true,
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
    },
    {
      name: "description",
      type: "textarea",
    },
    {
      name: "websiteUrl",
      type: "text",
    },
    {
      name: "logo",
      type: "text",
    },
  ],
};