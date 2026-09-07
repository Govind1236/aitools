import type { CollectionConfig } from "payload";

export const ClickEvents: CollectionConfig = {
  slug: "click-events",
  admin: {
    useAsTitle: "id",
    defaultColumns: ["link", "timestamp", "country", "trafficType", "deviceType"],
  },
  fields: [
    {
      name: "legacyPrismaId",
      type: "text",
      unique: true,
      index: true,
      admin: {
        position: "sidebar",
        description: "Original primary key from the legacy Prisma database.",
      },
    },
    {
      name: "link",
      type: "relationship",
      relationTo: "redirect-links",
      required: true,
      index: true,
    },
    {
      name: "timestamp",
      type: "date",
      required: true,
      index: true,
    },
    {
      name: "referrer",
      type: "text",
    },
    {
      name: "utmSource",
      type: "text",
      index: true,
    },
    {
      name: "utmMedium",
      type: "text",
    },
    {
      name: "utmCampaign",
      type: "text",
    },
    {
      name: "utmContent",
      type: "text",
    },
    {
      name: "utmTerm",
      type: "text",
    },
    {
      name: "country",
      type: "text",
      index: true,
    },
    {
      name: "deviceType",
      type: "text",
    },
    {
      name: "browser",
      type: "text",
    },
    {
      name: "operatingSystem",
      type: "text",
    },
    {
      name: "isSuspicious",
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "trafficType",
      type: "select",
      defaultValue: "human",
      options: [
        { label: "Human", value: "human" },
        { label: "Suspicious", value: "suspicious" },
        { label: "Bot", value: "bot" },
      ],
    },
    {
      name: "ipAddress",
      type: "text",
    },
  ],
};
