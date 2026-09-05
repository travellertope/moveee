import type { CollectionConfig } from "payload";

// Mirrors NEWSLETTER_FIELDS_FRAGMENT (wp.ts ~L1448) and the two post-meta
// keys `_culture_nl_list` / `_culture_nl_segment` described in CLAUDE.md's
// "Newsletter system architecture" section.
export const Newsletters: CollectionConfig = {
  slug: "newsletters",
  admin: { useAsTitle: "title", defaultColumns: ["title", "nlList", "date"] },
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

    // Which newsletter (getmelit | culture-drop | announcements | ...) —
    // kept a free-text select-with-custom-values equivalent since the list
    // of valid IDs grows over time (see CLAUDE.md "Process: adding a new
    // newsletter") rather than a fixed enum requiring a schema migration
    // every time a new list is added.
    { name: "nlList", type: "text", required: true, defaultValue: "culture-drop", index: true },
    {
      name: "nlSegment",
      type: "select",
      options: ["", "us", "uk", "ng", "gh", "ca", "au"],
      defaultValue: "",
      admin: { description: "Empty = sent to all regions" },
    },
    { name: "nlIssueNum", type: "number" },

    { name: "cultureInterests", type: "relationship", relationTo: "industries", hasMany: true },
    // cultureAccesses (tier-gating taxonomy) — kept as plain text tags
    // rather than a new taxonomy collection until a real second value shows up.
    { name: "cultureAccesses", type: "text", hasMany: true },
  ],
};
