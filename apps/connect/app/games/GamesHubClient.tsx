"use client";

import { useEffect, useState } from "react";
import GameCard from "@/components/games/GameCard";
import { getAllGamePlayStates, type GameKey, type GamePlayState } from "@/lib/games-played";

interface GameDef {
  key:         GameKey;
  href:        string;
  name:        string;
  tagline:     string;
  icon:        string;
  badge:       string;
  accentColor: string;
  badgeBg:     string;
  badgeColor:  string;
  difficulty:  string;
  rounds:      string;
  doneLabel:   string;
  doneCta:     string;
}

const GAMES: GameDef[] = [
  {
    key:         "wsi",
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
    doneLabel:   "Played today",
    doneCta:     "View result",
  },
  {
    key:         "trivia",
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
    doneLabel:   "Played today",
    doneCta:     "View result",
  },
  {
    key:         "sudoku",
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
    doneLabel:   "Solved today",
    doneCta:     "Review grid",
  },
  {
    key:         "crossword",
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
    doneLabel:   "Solved today",
    doneCta:     "Review grid",
  },
];

const EMPTY_STATES: Record<GameKey, GamePlayState> = {
  trivia: { played: false },
  wsi: { played: false },
  sudoku: { played: false },
  crossword: { played: false },
};

export default function GamesHubClient() {
  const [playStates, setPlayStates] = useState<Record<GameKey, GamePlayState>>(EMPTY_STATES);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPlayStates(getAllGamePlayStates());
    setHydrated(true);
  }, []);

  const playedCount = hydrated ? Object.values(playStates).filter((s) => s.played).length : 0;
  const progressPercent = (playedCount / GAMES.length) * 100;

  return (
    <div className="games-hub">
      <header className="games-hub__header">
        <h1 className="games-hub__title">Culture Games</h1>
        <p className="games-hub__subtitle">
          Test your knowledge of culture — music, film, literature, history,
          and everything in between.
        </p>
      </header>

      <div className="games-hub__progress">
        <span className="games-hub__progress-icon">🎮</span>
        <div className="games-hub__progress-body">
          <div className="games-hub__progress-label">
            Today's games — <b>{playedCount} of {GAMES.length}</b> played
          </div>
          <div className="games-hub__progress-track">
            <div className="games-hub__progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
        <div className="games-hub__progress-count">
          {playedCount}<span>/{GAMES.length}</span>
        </div>
      </div>

      <div className="games-hub__grid">
        {GAMES.map((game) => (
          <GameCard
            key={game.href}
            href={game.href}
            name={game.name}
            tagline={game.tagline}
            icon={game.icon}
            badge={game.badge}
            accentColor={game.accentColor}
            badgeBg={game.badgeBg}
            badgeColor={game.badgeColor}
            difficulty={game.difficulty}
            rounds={game.rounds}
            playState={playStates[game.key]}
            doneLabel={game.doneLabel}
            doneCta={game.doneCta}
          />
        ))}
      </div>

      <div className="games-hub__info-band">
        <span className="games-hub__info-icon">💡</span>
        <p className="games-hub__info-text">
          <strong>New puzzles drop daily at midnight.</strong> Everyone gets
          the same Sudoku grid and Crossword — Trivia and Who Said It? pull
          fresh questions from the archive each day.
        </p>
      </div>
    </div>
  );
}
