import type { CollectionConfig } from "payload";

/**
 * Tool (Payload mirror)
 *
 * A secondary mirror of the existing Prisma `Tool` model. The Prisma
 * database remains the authoritative source of truth during this migration
 * phase. Every Payload document maps 1:1 to a Prisma row via `legacyPrismaId`.
 *
 * Category, Provider, and Tag relationships reference Payload documents
 * (resolved through legacyPrismaId mapping). No cross-database FKs exist.
 */
export const Tools: CollectionConfig = {
  slug: "tools",
  admin: {
    description:
      "Mirror of the Prisma Tool catalog. Prisma remains authoritative.",
    useAsTitle: "name",
    defaultColumns: [
      "legacyPrismaId",
      "name",
      "slug",
      "category",
      "provider",
      "isPublished",
      "updatedAt",
    ],
  },
  fields: [
    // ── Identity ──────────────────────────────────────────────
    {
      name: "legacyPrismaId",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: {
        description: "Original Prisma Tool.id (cuid).",
        readOnly: true,
      },
    },
    // ── Required content ──────────────────────────────────────
    {
      name: "name",
      type: "text",
      required: true,
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
      required: true,
    },
    {
      name: "websiteUrl",
      type: "text",
      required: true,
    },
    // ── Optional content ──────────────────────────────────────
    {
      name: "logo",
      type: "text",
    },
    {
      name: "affiliateUrl",
      type: "text",
    },
    {
      name: "pricingType",
      type: "text",
      defaultValue: "freemium",
      admin: {
        description:
          "Prisma enum: free, freemium, paid, contact.",
      },
    },
    {
      name: "rating",
      type: "number",
      defaultValue: 0,
      admin: {
        description: "Matches Prisma Tool.rating (Float, default 0).",
      },
    },
    {
      name: "isFeatured",
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "isPublished",
      type: "checkbox",
      defaultValue: true,
    },
    {
      name: "isSponsored",
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "tags",
      type: "text",
      defaultValue: "",
      admin: {
        description:
          "Legacy comma-separated tag string. Preserved for backward compatibility.",
      },
    },
    {
      name: "hostingGuide",
      type: "textarea",
    },
    // ── Modernization fields ──────────────────────────────────
    {
      name: "entityType",
      type: "text",
      defaultValue: "TOOL",
      admin: {
        description:
          "Application-level enum: TOOL, MODEL, AGENT, API, RESOURCE.",
      },
    },
    {
      name: "verificationStatus",
      type: "text",
      defaultValue: "UNVERIFIED",
      admin: {
        description:
          "VERIFIED, NEEDS_REVIEW, UNVERIFIED, INACTIVE.",
      },
    },
    {
      name: "lastVerifiedAt",
      type: "text",
    },
    {
      name: "sourceUrl",
      type: "text",
    },
    {
      name: "metadata",
      type: "textarea",
    },
    // ── V2: Provider + documentation/pricing URLs ─────────────
    {
      name: "documentationUrl",
      type: "text",
    },
    {
      name: "pricingUrl",
      type: "text",
    },
    // ── Relationships ─────────────────────────────────────────
    {
      name: "category",
      type: "relationship",
      relationTo: "categories",
      required: true,
      index: true,
      admin: {
        description:
          "Resolves through Category.legacyPrismaId (no cross-database FK).",
      },
    },
    {
      name: "provider",
      type: "relationship",
      relationTo: "providers",
      index: true,
      admin: {
        description:
          "Resolves through Provider.legacyPrismaId. Null if tool has no provider.",
      },
    },
    {
      name: "structuredTags",
      type: "relationship",
      relationTo: "tags",
      hasMany: true,
      admin: {
        description:
          "Recreates Prisma ToolTag join table. Resolves through Tag.legacyPrismaId.",
      },
    },
  ],
};
