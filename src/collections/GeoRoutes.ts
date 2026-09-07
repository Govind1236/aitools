import type { CollectionConfig } from "payload";

export const GeoRoutes: CollectionConfig = {
  slug: "geo-routes",
  admin: {
    useAsTitle: "country",
    defaultColumns: ["country", "link", "destination", "isActive"],
  },
  fields: [
    {
      name: "link",
      type: "relationship",
      relationTo: "redirect-links",
      required: true,
      index: true,
    },
    {
      name: "country",
      type: "text",
      required: true,
    },
    {
      name: "destination",
      type: "text",
      required: true,
    },
    {
      name: "isActive",
      type: "checkbox",
      defaultValue: true,
    },
  ],
};
