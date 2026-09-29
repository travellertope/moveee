import type { Metadata } from "next";
import { Syne } from "next/font/google";
import StoopMasthead from "@/components/StoopMasthead";
import StoopFooter from "@/components/StoopFooter";
import "./stoop.css";

// Only Syne (display, 700/800) needs a fresh load — DM Sans (body) reuses
// the root layout's existing --font-dm-sans instance instead of loading a
// second one: the root call has no explicit weight/style, and a second
// next/font/google call for the same family with a *different* config
// (weight/style array) is safe (Turbopack only collides on byte-identical
// configs — see lib/lifestyle-font.ts's own docblock for that gotcha), but
// there's no need to risk it when the one italic use on this page
// (.stp-week-note) is fine falling back to the browser's own synthesized
// italic, same as any other web page.
const syne = Syne({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-stp-display",
  display: "swap",
});

// This is the Stoop feature's own marketing/explainer page on Site A
// (themoveee.com/stoop) — the real interactive browse/join/host flow lives
// on Site B (web.themoveee.com/connect/stoop, /cluster/create). Bare
// "Moveee" per the brand table's "platform/cross-surface page" rule (this
// mirrors Events/Directory, not editorial Magazine content).
export const metadata: Metadata = {
  title: "Stoop | Moveee",
  description:
    "The Stoop is a small group of people who live in the same area and meet in person every week to connect and engage with culture. Free to join, open to all Moveee members.",
  openGraph: {
    siteName: "Moveee",
    type: "website",
    title: "Stoop",
    description: "A small group of people near you, meeting every week.",
  },
};

// StoopMasthead/StoopFooter replace the sitewide Header/Footer for this one
// route (see Header.tsx's isStoopLandingPage early-return and
// ConditionalFooter.tsx's isStoopPath check) — same standalone-mini-site
// shape as Literary/Commons/Lifestyle, just for a single page rather than a
// whole vertical.
export default function StoopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`stp-page ${syne.variable}`}>
      <StoopMasthead />
      {children}
      <StoopFooter />
    </div>
  );
}
