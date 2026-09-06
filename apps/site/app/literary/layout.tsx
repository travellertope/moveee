import type { Metadata } from "next";
import { Bodoni_Moda, Cormorant_Garamond, EB_Garamond, Inter } from "next/font/google";

// Fonts scoped to this route tree only (per docs/the-moveee-literary-brand-guide.pdf
// §09 Typography) — loaded from a nested layout rather than the root one so
// the rest of Site A's bundle isn't affected. next/font's `variable` output
// works the same way nested as it does at the root: the className just
// needs to be present on some ancestor of anything reading the CSS var.
const bodoniModa = Bodoni_Moda({
  subsets: ["latin"],
  variable: "--font-lit-display",
  display: "swap",
});
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["italic"],
  variable: "--font-lit-italic",
  display: "swap",
});
const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-lit-body",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-lit-meta",
  display: "swap",
});

// "The Moveee Literary" is a named vertical (same pattern as "The Lane" /
// "The Edit" / "The Free Critics" — a proper section title, not a stand-in
// for the platform's own name, which stays plain "Moveee"/"Moveee
// Magazine" per CLAUDE.md's brand table).
export const metadata: Metadata = {
  title: "The Moveee Literary — Writing That Shapes The World",
  description:
    "The Moveee Literary is an international publication for fiction, poetry, essays, conversations and translated literature — writing that illuminates lives, challenges assumptions and stays with readers long after the final sentence.",
  openGraph: {
    siteName: "Moveee Magazine",
    type: "website",
    title: "The Moveee Literary",
    description: "Writing that shapes the world.",
  },
};

export default function LiteraryLayout({ children }: { children: React.ReactNode }) {
  // .lit-page paints the brand's Ivory background above the sitewide
  // body-grain texture (globals.css body::before, z-index: 100), the same
  // trick .mg-page-white uses for /magazine — but with the Literary
  // palette instead of plain white, since this section deliberately does
  // not share the rest of Site A's paper/ink tokens.
  return (
    <div className={`lit-page ${bodoniModa.variable} ${cormorant.variable} ${ebGaramond.variable} ${inter.variable}`}>
      {children}
    </div>
  );
}
