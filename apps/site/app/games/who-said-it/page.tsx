import type { Metadata } from "next";
import Link from "next/link";
import WhoSaidItGame from "@/components/games/WhoSaidItGame";
import "@/app/games.css";

export const metadata: Metadata = {
  title: { absolute: "Who Said It? — Culture Games · The Moveee" },
  description:
    "Read a quote and guess the global figure who said it. 10 rounds, live from our verified quote archive.",
};

export default function WhoSaidItPage() {
  return (
    <div className="game-page">
      {/* Slim nav bar */}
      <nav className="game-page__nav">
        <div className="container-custom game-page__nav-inner">
          <Link href="/games" className="game-page__back">
            ← Games
          </Link>
          <span className="game-page__nav-sep">/</span>
          <span className="game-page__nav-title">Who Said It?</span>
        </div>
      </nav>

      <WhoSaidItGame />
    </div>
  );
}
