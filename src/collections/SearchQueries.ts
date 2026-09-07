import type { CollectionConfig } from "payload";

export const SearchQueries: CollectionConfig = {
  slug: "search-queries",
  admin: {
    useAsTitle: "query",
    defaultColumns: ["query", "resultCount", "createdAt"],
  },
  fields: [
    {
      name: "query",
      type: "text",
      required: true,
    },
    {
      name: "normalized",
      type: "text",
      required: true,
      index: true,
    },
    {
      name: "resultCount",
      type: "number",
      defaultValue: 0,
    },
  ],
};
