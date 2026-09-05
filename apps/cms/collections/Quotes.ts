import type { CollectionConfig } from "payload";

// Mirrors QUOTE_FIELDS_FRAGMENT (wp.ts ~L2010) — `title` here holds the
// quote text itself (WP's CultureQuote CPT uses the post title as the quote,
// `content` as an optional expanded body).
export const Quotes: CollectionConfig = {
  slug: "quotes",
  admin: { useAsTitle: "title", defaultColumns: ["title", "quoteType", "date"] },
  versions: { drafts: true },
  fields: [
    { name: "title", type: "textarea", required: true, admin: { description: "The quote text" } },
    { name: "slug", type: "text", required: true, unique: true, index: true },
    {
      name: "status",
      type: "select",
      defaultValue: "draft",
      options: ["draft", "published"],
      index: true,
    },
    { name: "date", type: "date", admin: { position: "sidebar" } },
    { name: "content", type: "richText" },
    { name: "quoteSource", type: "text" },
    { name: "quoteLikes", type: "number", defaultValue: 0, admin: { readOnly: true } },
    { name: "quoteSharingReason", type: "textarea" },
    {
      name: "quoteType",
      type: "select",
      options: ["person", "book", "film", "speech", "song"],
    },
    // WP's `quoteAuthor` is its own taxonomy (not `authors`, the editorial
    // byline collection) — kept as a plain text array here since quote
    // "authors" are frequently one-off names (public figures) that don't
    // need a full Author profile record.
    { name: "quoteAuthors", type: "text", hasMany: true },
  ],
};
