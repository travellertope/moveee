import Link from "next/link";
import type { GamePlayState } from "@/lib/games-played";

interface GameCardProps {
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
  /** Score-based games (trivia, who-said-it) show a result; puzzle games
   *  (sudoku, crossword) only ever have `played: true` with no score.
   *  Omit entirely on pages with no client-side played-state check. */
  playState?:  GamePlayState;
  doneLabel?:  string; // "Played today" / "Solved today"
  doneCta?:    string; // "View result" / "Review grid"
}

export default function GameCard({
  href, name, tagline, icon, badge,
  accentColor, badgeBg, badgeColor,
  difficulty, rounds, playState,
  doneLabel = "Played today", doneCta = "View result",
}: GameCardProps) {
  const done = playState?.played ?? false;
  const hasScore = done && typeof playState?.score === "number" && typeof playState?.total === "number";

  return (
    <Link href={href} className={`game-card${done ? " game-card--done" : ""}`}>
      <div className="game-card__accent" style={{ background: accentColor }} />
      <div className="game-card__top">
        <span className="game-card__icon" style={done ? { opacity: 0.55 } : undefined}>{icon}</span>
        {done ? (
          <span className="game-card__done-tag">✓ {doneLabel}</span>
        ) : (
          <span
            className="game-card__badge"
            style={{ background: badgeBg, color: badgeColor, borderColor: badgeColor }}
          >
            {badge}
          </span>
        )}
      </div>
      <h2 className="game-card__name">{name}</h2>
      {hasScore ? (
        <>
          <div className="game-card__result">
            <span className="game-card__result-score">{playState!.score}</span>
            <span className="game-card__result-total">/ {playState!.total} correct</span>
          </div>
          <p className="game-card__result-label">Come back tomorrow for a new round.</p>
        </>
      ) : (
        <p className="game-card__tagline">{tagline}</p>
      )}
      <div className="game-card__footer">
        <div className="game-card__meta">
          <span className="game-card__meta-item">{difficulty}</span>
          <span className="game-card__meta-item">·</span>
          <span className="game-card__meta-item">{rounds}</span>
        </div>
        <span className="game-card__cta">
          {done ? doneCta : "Play now"}
          <span className="game-card__cta-arrow">→</span>
        </span>
      </div>
    </Link>
  );
}
