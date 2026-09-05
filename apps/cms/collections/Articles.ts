import type { CollectionConfig } from "payload";

// Editorial articles — the WP `post` type STORY_FIELDS_FRAGMENT reads from.
// Field names below intentionally mirror the GraphQL fragment 1:1
// (packages/shared/lib/wp.ts ~L711) so the eventual Next.js data-layer swap
// is a fetch-shape change, not a field-remap.
export const Articles: CollectionConfig = {
  slug: "articles",
  admin: { useAsTitle: "title", defaultColumns: ["title", "status", "date"] },
  versions: { drafts: true },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "slug", type: "text", required: true, unique: true, index: true },
    {
      name: "status",
      type: "select",
      defaultValue: "draft",
      options: ["draft", "published"],
      index: true,
    },
    { name: "date", type: "date", admin: { position: "sidebar" } },
    { name: "excerpt", type: "textarea" },
    { name: "content", type: "richText" },
    { name: "featuredImage", type: "upload", relationTo: "media" },

    // Moveee-specific extras already in the live fragment
    { name: "asToldTo", type: "text" },
    { name: "seoTitle", type: "text", admin: { position: "sidebar" } },
    { name: "seoDescription", type: "textarea", admin: { position: "sidebar" } },

    { name: "author", type: "relationship", relationTo: "authors" },
    { name: "categories", type: "relationship", relationTo: "categories", hasMany: true },
    { name: "industries", type: "relationship", relationTo: "industries", hasMany: true },
    { name: "series", type: "relationship", relationTo: "series", hasMany: true },
    { name: "countries", type: "relationship", relationTo: "countries", hasMany: true },

    // "Event specific fields (expected from ACF/JetEngine)" in the current
    // fragment — kept as a group so plain articles don't carry empty event
    // columns; only populated when this article doubles as an editorial event.
    {
      name: "eventDetails",
      type: "group",
      admin: { condition: (data) => Boolean(data?.isFeaturedEvent) },
      fields: [
        { name: "location", type: "text" },
        { name: "eventStatus", type: "text" },
        { name: "admission", type: "text" },
      ],
    },
    { name: "isFeaturedEvent", type: "checkbox", defaultValue: false },
    { name: "isFeatured", type: "checkbox", defaultValue: false },

    // ACF "Moveee Product Details" (moveee-graphql-bridge.php) equivalents —
    // only relevant when this article is also a Shop-product write-up.
    { name: "makerStory", type: "richText" },
    { name: "careInstructions", type: "richText" },
    { name: "deliveryInfo", type: "richText" },
  ],
};
