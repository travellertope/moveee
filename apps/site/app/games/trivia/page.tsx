import type { Metadata } from "next";
import Link from "next/link";
import TriviaGame from "@/components/games/TriviaGame";
import "@/app/games.css";

export const metadata: Metadata = {
  title: { absolute: "Culture Trivia — Culture Games · The Moveee" },
  description:
    "10 daily trivia questions spanning Afrobeats, Nollywood, world literature, history, and visual art.",
};

export default function TriviaPage() {
  return (
    <div className="game-page">
      {/* Slim nav bar */}
      <nav className="game-page__nav">
        <div className="container-custom game-page__nav-inner">
          <Link href="/games" className="game-page__back">
            ← Games
          </Link>
          <span className="game-page__nav-sep">/</span>
          <span className="game-page__nav-title">Culture Trivia</span>
        </div>
      </nav>

      <TriviaGame />
    </div>
  );
}
