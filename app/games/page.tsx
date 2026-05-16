import type { Metadata } from "next";
import GameCard from "@/components/games/GameCard";
import "@/app/games.css";

export const metadata: Metadata = {
  title: "Culture Games — The Moveee",
  description:
    "Test your knowledge of African and diaspora culture through trivia, quotes, and daily challenges.",
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
      "10 daily questions spanning Afrobeats, Nollywood, literature, history, and African art. Fresh questions every day.",
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
      "One 9×9 grid a day — same puzzle for every player worldwide. No luck, pure logic.",
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
      "A new African culture mini-crossword every day. Test your knowledge of people, places, and traditions.",
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
    <div className="games-hub">
      <header className="games-hub__header">
        <div className="container-custom">
          <p className="games-hub__eyebrow">Culture Games</p>
          <h1 className="games-hub__title">Play. Learn.&nbsp;Connect.</h1>
          <p className="games-hub__subtitle">
            Test your knowledge of African and diaspora culture — music, film,
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
  );
}
