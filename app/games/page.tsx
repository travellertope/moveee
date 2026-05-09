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
