import { Bricolage_Grotesque } from "next/font/google";
import ShopHeader from "@/components/ShopHeader";
import ShopFooter from "@/components/ShopFooter";
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
// ever renders here. Bricolage Grotesque is loaded again here (rather than
// reused from the lifestyle layout) since Next.js font loaders are scoped
// per call site, not shared across layouts.
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  variable: "--font-lfs-display",
  display: "swap",
});

export default function MakersLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={bricolage.variable}>
      <ShopHeader />
      {children}
      <ShopFooter />
    </div>
  );
}
