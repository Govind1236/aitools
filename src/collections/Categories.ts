import type { CollectionConfig } from "payload";

/**
 * Category (Payload mirror)
 *
 * A secondary mirror of the existing Prisma `Category` model. The Prisma
 * database remains the authoritative source of truth during this migration
 * phase. Every Payload document maps 1:1 to a Prisma row via `legacyPrismaId`.
 *
 * Presentation metadata (icons, colors, badges) stays in
 * `src/lib/category-config.ts` and is NOT part of this collection yet.
 */
export const Categories: CollectionConfig = {
  slug: "categories",
  admin: {
    description:
      "Mirror of the Prisma Category catalog. Prisma remains authoritative.",
    useAsTitle: "name",
    defaultColumns: ["legacyPrismaId", "name", "slug", "sortOrder", "updatedAt"],
  },
  fields: [
    {
      name: "legacyPrismaId",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: {
        description: "Original Prisma Category.id (cuid).",
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
    {
      name: "description",
      type: "textarea",
    },
    {
      name: "icon",
      type: "text",
    },
    {
      name: "sortOrder",
      type: "number",
      defaultValue: 0,
      admin: {
        description: "Matches Prisma Category.sortOrder (Int, default 0).",
      },
    },
  ],
};