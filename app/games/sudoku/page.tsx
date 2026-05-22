import type { Metadata } from "next";
import Link from "next/link";
import SudokuGame from "@/components/games/SudokuGame";
import "@/app/games.css";

export const metadata: Metadata = {
  title: "Daily Sudoku — The Moveee Games",
  description: "A new Sudoku grid every day — one puzzle, same for every player worldwide. Part of The Moveee's daily culture games.",
};

export default function SudokuPage() {
  return (
    <div className="game-page">
      <nav className="game-page__nav">
        <div className="container-custom game-page__nav-inner">
          <Link href="/games" className="game-page__back">← Games</Link>
          <span className="game-page__nav-sep">/</span>
          <span className="game-page__nav-title">Daily Sudoku</span>
        </div>
      </nav>
      <SudokuGame />
    </div>
  );
}
