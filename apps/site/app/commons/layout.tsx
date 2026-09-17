import type { Metadata } from "next";
import { Newsreader, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import CommonsMasthead from "@/components/CommonsMasthead";
import CommonsFooter from "@/components/CommonsFooter";

// Fonts scoped to this route tree only, same "nested layout, not the root
// one" pattern as app/literary/layout.tsx — deliberately distinct from
// Literary's Bodoni Moda/Cormorant Garamond/EB Garamond and Lifestyle's
// Bricolage Grotesque, so this vertical reads as its own public-journal
// register rather than either sibling's.
const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-comm-display",
  display: "swap",
});
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-comm-sans",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-comm-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Moveee Commons — Opinion, Reports & Research",
  description:
    "The Moveee Commons publishes opinion, reports and research on politics, environment, academia and the systems that govern us.",
  openGraph: {
    siteName: "Moveee Magazine",
    type: "website",
    title: "The Moveee Commons",
    description: "Opinion, reports and research on the systems that govern us.",
  },
};

export default function CommonsLayout({ children }: { children: React.ReactNode }) {
  // .comm-page paints the vertical's own paper background above the
  // sitewide body-grain texture (globals.css body::before, z-index: 100) —
  // same trick .lit-page/.mg-page-white use. CommonsMasthead/CommonsFooter
  // replace the sitewide Header/Footer for this entire route tree (see
  // Header.tsx's isCommonsPage early-return and ConditionalFooter.tsx's
  // isCommonsPath check) — The Moveee Commons is a standalone mini-site
  // with its own chrome, not a themed sub-section.
  return (
    <div className={`comm-page ${newsreader.variable} ${plexSans.variable} ${plexMono.variable}`}>
      <CommonsMasthead />
      {children}
      <CommonsFooter />
    </div>
  );
}
