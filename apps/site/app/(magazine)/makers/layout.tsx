import ShopHeader from "@/components/ShopHeader";
import ShopFooter from "@/components/ShopFooter";
import { bricolage } from "@/lib/lifestyle-font";
import "../lifestyle/shop-chrome.css";

// /makers now shares the exact same standalone chrome as /lifestyle — the
// user asked for the Moveee Lifestyle design convention to extend to Maker
// pages "from header to footer", and the maker archive/profile pages are
// really just another surface of the same shop identity (every maker's
// products live under /lifestyle/brand/[slug]). Scoped to the whole
// /makers route tree (archive + [slug]), same "nested layout, not the root
// one" pattern as app/lifestyle/layout.tsx/app/literary/layout.tsx. This is
// the ONLY place /makers' header/footer are mounted — the sitewide
// Header.tsx returns null on every /makers path and ConditionalFooter.tsx
// excludes /makers entirely, so nothing from the rest of the site's chrome
// ever renders here. Bricolage Grotesque is imported from lib/lifestyle-font.ts
// (fixed September 2026 — it used to call `Bricolage_Grotesque(...)` again
// here, byte-identical to app/lifestyle/layout.tsx's own call; Turbopack
// hashes a next/font/google call's config to generate its internal font
// asset, so two identical calls in different files collide and one of them
// fails the production build with "next/font/google queries have exactly
// one entry" — a single shared call, imported by both layouts, is the fix).

export default function MakersLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={bricolage.variable}>
      <ShopHeader />
      {children}
      <ShopFooter />
    </div>
  );
}
