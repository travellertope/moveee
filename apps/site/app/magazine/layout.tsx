import type { ReactNode } from "react";

// Paints a solid white layer above the sitewide body grain/colour-wash
// texture (see globals.css `body::before`/`background-image`) so every
// page under /magazine — archive, single article, category/series/tag/
// country/industry archives, issues — reads as plain white rather than
// picking up that texture. Scoped to this route tree only; the rest of
// the site keeps the grain.
export default function MagazineLayout({ children }: { children: ReactNode }) {
  return <div className="mg-page-white">{children}</div>;
}
