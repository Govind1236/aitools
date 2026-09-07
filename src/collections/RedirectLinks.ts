import type { CollectionConfig } from "payload";

export const RedirectLinks: CollectionConfig = {
  slug: "redirect-links",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["slug", "name", "destination", "tool", "isActive", "clickCount"],
  },
  fields: [
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
    },
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "destination",
      type: "text",
      required: true,
    },
    {
      name: "tool",
      type: "relationship",
      relationTo: "tools",
      unique: true,
    },
    {
      name: "campaign",
      type: "relationship",
      relationTo: "campaigns",
      index: true,
    },
    {
      name: "isActive",
      type: "checkbox",
      defaultValue: true,
    },
    {
      name: "clickCount",
      type: "number",
      defaultValue: 0,
    },
  ],
};
