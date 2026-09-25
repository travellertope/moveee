import { Bricolage_Grotesque } from "next/font/google";

// The Moveee Lifestyle identity's display face — shared between
// app/lifestyle/layout.tsx and app/makers/layout.tsx (both mount the same
// ShopHeader/ShopFooter chrome, see either layout's own comment for why).
//
// This MUST be a single, shared module-scope call, not duplicated in each
// layout file. Turbopack (Next.js 16) generates the internal font asset by
// hashing the call's config, and two separate call sites with byte-identical
// args collide on that hash — only one of them resolves at build time, and
// the other fails with "next/font/google queries have exactly one entry" /
// "Module not found: Can't resolve '.../internal/font/google/font'". This
// bit in production (both layouts had their own identical `Bricolage_Grotesque(...)`
// call before this fix) — if you ever need this font in a third route, import
// it from here rather than adding a third duplicate call.
export const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  variable: "--font-lfs-display",
  display: "swap",
});
