import type { CollectionConfig } from "payload";

/**
 * Tag (Payload mirror)
 *
 * A secondary mirror of the existing Prisma `Tag` model. The Prisma database
 * remains the authoritative source of truth during this migration phase.
 * Every Payload document maps 1:1 to a Prisma row via `legacyPrismaId`.
 *
 * Tool <-> Tag links stay Prisma-owned (see `prisma/schema.prisma` ToolTag).
 * No Payload relationship is activated until the Tool migration phase.
 */
export const Tags: CollectionConfig = {
  slug: "tags",
  admin: {
    description:
      "Mirror of the Prisma Tag catalog. Prisma remains authoritative.",
    useAsTitle: "name",
    defaultColumns: ["legacyPrismaId", "name", "slug", "updatedAt"],
  },
  fields: [
    {
      name: "legacyPrismaId",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: {
        description: "Original Prisma Tag.id (cuid).",
        readOnly: true,
      },
    },
    {
      name: "name",
      type: "text",
      required: true,
      unique: true,
      index: true,
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
    },
  ],
};