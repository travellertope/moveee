import { Bricolage_Grotesque } from "next/font/google";
import ShopHeader from "@/components/ShopHeader";
import ShopFooter from "@/components/ShopFooter";
import "./shop-chrome.css";

// Scoped to the whole /shop route tree (archive, category/tag/brand
// archives, product detail, checkout, edit) — same "nested layout, not the
// root one" pattern as apps/site/app/literary/layout.tsx. The Moveee
// Lifestyle is a fully standalone mini-site, same shape as The Moveee
// Literary: this layout is the ONLY place its header/footer are mounted —
// the sitewide Header.tsx returns null on every /shop path and
// ConditionalFooter.tsx excludes /shop entirely, so nothing from the rest
// of the site's chrome ever renders here. Bricolage Grotesque is the
// identity's display face (see the approved mockup this was built from),
// used by both the archive page's `.lfs-*` classes and the header/footer
// chrome in shop-chrome.css.
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  variable: "--font-lfs-display",
  display: "swap",
});

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={bricolage.variable}>
      <ShopHeader />
      {children}
      <ShopFooter />
    </div>
  );
}
