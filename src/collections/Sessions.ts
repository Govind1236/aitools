import type { CollectionConfig } from "payload";

export const Sessions: CollectionConfig = {
  slug: "sessions",
  admin: {
    useAsTitle: "token",
    defaultColumns: ["user", "token", "expiresAt", "createdAt"],
  },
  fields: [
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      required: true,
      index: true,
    },
    {
      name: "token",
      type: "text",
      required: true,
      unique: true,
      index: true,
    },
    {
      name: "expiresAt",
      type: "date",
      required: true,
    },
  ],
};
