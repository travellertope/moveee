import type { CollectionConfig } from "payload";

/**
 * WP taxonomy equivalents: categories, culture_interest (→ industries),
 * series, country. All four are queried in wp.ts as `{ nodes: { name slug
 * [description] } }` — same flat shape, so one factory covers all of them
 * rather than four near-identical collection configs.
 */
function makeTaxonomy(slug: string, withDescription = false): CollectionConfig {
  return {
    slug,
    admin: { useAsTitle: "name" },
    fields: [
      { name: "name", type: "text", required: true },
      { name: "slug", type: "text", required: true, unique: true, index: true },
      ...(withDescription
        ? [{ name: "description", type: "textarea" as const }]
        : []),
    ],
  };
}

// Editorial categories (News, Viewpoints, ...)
export const Categories = makeTaxonomy("categories");

// culture_interest taxonomy → `industries` field in STORY_FIELDS_FRAGMENT
export const Industries = makeTaxonomy("industries");

// The Lane / The Free Critics / etc. — carries a description (shown in UI)
export const Series = makeTaxonomy("series", true);

// The `country` taxonomy (see "Edition story-scoping migrated to country
// taxonomy" in CLAUDE.md) — dedupe cleanly here since Payload enforces a
// unique slug at the schema level, unlike WP's JetEngine taxonomy which
// needed a runtime dedup pass (Culture_Country_Cleanup).
export const Countries = makeTaxonomy("countries");
