import type { CollectionConfig } from "payload";

// Mirrors WP media/featured-image usage: sourceUrl + altText everywhere in
// packages/shared/lib/wp.ts's STORY_FIELDS_FRAGMENT / NEWSLETTER_FIELDS_FRAGMENT.
// Payload's own upload adapter handles storage — point it at R2 (same bucket
// class-culture-r2.php already uses) via @payloadcms/storage-s3 rather than
// re-inventing image hosting.
export const Media: CollectionConfig = {
  slug: "media",
  upload: {
    staticDir: "media",
    imageSizes: [
      { name: "thumbnail", width: 400, height: 300, position: "centre" },
      { name: "card", width: 900, height: 600, position: "centre" },
      { name: "hero", width: 1920, height: 1080, position: "centre" },
    ],
    adminThumbnail: "thumbnail",
    mimeTypes: ["image/*"],
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
      admin: { description: "Maps to WP's altText" },
    },
    { name: "credit", type: "text" },
  ],
};
