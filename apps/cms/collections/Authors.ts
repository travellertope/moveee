import type { CollectionConfig } from "payload";

// Mirrors STORY_FIELDS_FRAGMENT's `author.node { name slug databaseId description avatar { url } }`
export const Authors: CollectionConfig = {
  slug: "authors",
  admin: { useAsTitle: "name" },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "slug", type: "text", required: true, unique: true, index: true },
    { name: "description", type: "textarea" },
    { name: "avatar", type: "upload", relationTo: "media" },
  ],
};
