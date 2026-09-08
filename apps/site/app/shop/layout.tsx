import { Bricolage_Grotesque } from "next/font/google";

// Scoped to the whole /shop route tree (archive, category/tag/brand
// archives, product detail, checkout) — same "nested layout, not the root
// one" pattern as apps/site/app/literary/layout.tsx, so the rest of Site A's
// bundle isn't affected. Bricolage Grotesque is the display face for "The
// Moveee Lifestyle" identity (see the approved mockup this page was built
// from) — used only on new archive-page classes (`.lfs-*` in
// shop-lifestyle.css); the product detail page's existing Fraunces headings
// are untouched, since they never reference this variable.
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  variable: "--font-lfs-display",
  display: "swap",
});

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <div className={bricolage.variable}>{children}</div>;
}
