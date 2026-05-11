import type { Metadata } from "next";
import Link from "next/link";
import CrosswordGame from "@/components/games/CrosswordGame";
import "@/app/games.css";

export const metadata: Metadata = {
  title: "Daily Crossword — The Moveee Games",
  description: "A new African culture crossword every day. Same puzzle for every player.",
};

export default function CrosswordPage() {
  return (
    <div className="game-page">
      <nav className="game-page__nav">
        <div className="container-custom game-page__nav-inner">
          <Link href="/games" className="game-page__back">← Games</Link>
          <span className="game-page__nav-sep">/</span>
          <span className="game-page__nav-title">Daily Crossword</span>
        </div>
      </nav>
      <CrosswordGame />
    </div>
  );
}
