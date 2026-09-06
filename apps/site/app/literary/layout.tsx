import type { Metadata } from "next";

// "The Moveee Literary" is a named vertical (same pattern as "The Lane" /
// "The Edit" / "The Free Critics" — a proper section title, not a stand-in
// for the platform's own name, which stays plain "Moveee"/"Moveee
// Magazine" per CLAUDE.md's brand table).
export const metadata: Metadata = {
  title: "The Moveee Literary — Poetry, Fiction, Nonfiction & Translation | Moveee Magazine",
  description:
    "The Moveee Literary is a quarterly home for new poetry, fiction, nonfiction, and translation — published alongside every print edition.",
  openGraph: {
    siteName: "Moveee Magazine",
    type: "website",
    title: "The Moveee Literary",
    description:
      "A quarterly home for new poetry, fiction, nonfiction, and translation.",
  },
};

export default function LiteraryLayout({ children }: { children: React.ReactNode }) {
  // .mg-page-white (magazine.css) is reused as-is here rather than
  // duplicated — it just paints solid white above the sitewide body-grain
  // texture (globals.css body::before, z-index: 100), which every
  // non-magazine editorial route wants identically.
  return <div className="mg-page-white">{children}</div>;
}
