import type { Metadata } from "next";
import Link from "next/link";
import GameCard from "@/components/games/GameCard";
import "@/app/games.css";
import "@/app/pulse-layout.css";

export const metadata: Metadata = {
  title: { absolute: "Culture Games — The Moveee" },
  description:
    "Test your knowledge of culture through trivia, quotes, and daily challenges.",
};

const GAMES = [
  {
    href:        "/games/who-said-it",
    name:        "Who Said It?",
    tagline:
      "A quote appears — you guess who said it. 10 rounds drawn live from our verified quote archive.",
    icon:        "💬",
    badge:       "Quotes",
    accentColor: "#c5491f",
    badgeBg:     "rgba(197,73,31,.12)",
    badgeColor:  "#c5491f",
    difficulty:  "Mixed difficulty",
    rounds:      "10 rounds",
  },
  {
    href:        "/games/trivia",
    name:        "Culture Trivia",
    tagline:
      "10 daily questions spanning music, film, literature, history, and art. Fresh questions every day.",
    icon:        "🧠",
    badge:       "Daily",
    accentColor: "#3d4a2a",
    badgeBg:     "rgba(61,74,42,.12)",
    badgeColor:  "#3d4a2a",
    difficulty:  "Easy to Hard",
    rounds:      "10 questions",
  },
  {
    href:        "/games/sudoku",
    name:        "Daily Sudoku",
    tagline:
      "One 9×9 grid a day — same puzzle for every player. No luck, pure logic.",
    icon:        "🔢",
    badge:       "Puzzle",
    accentColor: "#1a3a5c",
    badgeBg:     "rgba(26,58,92,.12)",
    badgeColor:  "#1a3a5c",
    difficulty:  "Medium",
    rounds:      "1 daily grid",
  },
  {
    href:        "/games/crossword",
    name:        "Daily Crossword",
    tagline:
      "A new culture mini-crossword every day. Test your knowledge of people, places, and traditions.",
    icon:        "✏️",
    badge:       "Culture",
    accentColor: "#5c3a1a",
    badgeBg:     "rgba(92,58,26,.12)",
    badgeColor:  "#5c3a1a",
    difficulty:  "Mixed",
    rounds:      "1 daily puzzle",
  },
];

export default function GamesHub() {
  return (
    <div className="pulse-layout pulse-layout--feed">
      <main className="pulse-timeline">
        <div className="games-hub">
          <header className="games-hub__header">
            <div className="container-custom">
              <p className="games-hub__eyebrow">Culture Games</p>
              <h1 className="games-hub__title">Play. Learn.&nbsp;Connect.</h1>
              <p className="games-hub__subtitle">
                Test your knowledge of culture — music, film,
                literature, history, and everything in between.
              </p>
            </div>
          </header>

          <div className="games-hub__grid">
            {GAMES.map((game) => (
              <GameCard key={game.href} {...game} />
            ))}
          </div>
        </div>
      </main>

      <aside className="pulse-sidebar-right">
        <div style={{ padding: "1.25rem 1rem" }}>
          <div style={{ background: "#fff", border: "1px solid #e8e2d8", padding: "0.85rem" }}>
            <p style={{
              color: "#7a6f5c", fontSize: "0.6rem", fontWeight: 700,
              letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.45rem",
            }}>
              About Moveee
            </p>
            <p style={{ color: "#3a342b", fontSize: "0.78rem", lineHeight: 1.55, margin: "0 0 0.85rem" }}>
              Village square for culture loving creatives, entrepreneurs, professionals.
            </p>
            <Link href="/feed" style={{
              display: "block", background: "#c93c2a", color: "#fff",
              textAlign: "center", padding: "0.45rem 0.75rem",
              fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", textDecoration: "none",
            }}>
              Back to Feed →
            </Link>
          </div>

          {/* apps/connect has no site-wide footer — every page with a
              right rail carries this copyright block instead. */}
          <p style={{ margin: "1rem 0 0", fontSize: "0.68rem", color: "#7a6f5c", lineHeight: 1.7 }}>
            © {new Date().getFullYear()} The Moveee. All Rights Reserved.
            <br />
            <Link href="/terms" style={{ color: "#7a6f5c" }}>Terms</Link>
            {" · "}
            <Link href="/privacy" style={{ color: "#7a6f5c" }}>Privacy</Link>
            {" · "}
            <Link href="/contact" style={{ color: "#7a6f5c" }}>Contact</Link>
          </p>
        </div>
      </aside>
    </div>
  );
}
