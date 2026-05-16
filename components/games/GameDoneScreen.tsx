"use client";

import { useState } from "react";
import Link from "next/link";

interface Props {
  game:        "wsi" | "trivia" | "sudoku" | "crossword";
  score:       number;
  total:       number;
  date:        string;
  alreadyDone?: boolean;
}

const GAME_META: Record<Props["game"], { label: string; icon: string }> = {
  trivia:    { label: "Culture Trivia",   icon: "🧠" },
  wsi:       { label: "Who Said It?",     icon: "💬" },
  sudoku:    { label: "Daily Sudoku",     icon: "🔢" },
  crossword: { label: "Daily Crossword",  icon: "✏️"  },
};

const OTHER_GAME: Record<Props["game"], { href: string; label: string }> = {
  wsi:       { href: "/games/trivia",     label: "Culture Trivia" },
  trivia:    { href: "/games/who-said-it", label: "Who Said It?" },
  sudoku:    { href: "/games/crossword",  label: "Daily Crossword" },
  crossword: { href: "/games/sudoku",     label: "Daily Sudoku" },
};

function getResult(game: Props["game"], score: number, total: number) {
  if (game === "sudoku" || game === "crossword") {
    return { emoji: "🏅", badge: "COMPLETE", tagline: "Puzzle solved." };
  }
  const pct = score / total;
  if (pct === 1)   return { emoji: "🏆", badge: "PERFECT",  tagline: "Flawless. Every answer right." };
  if (pct >= 0.8)  return { emoji: "🔥", badge: "SHARP",    tagline: "Culture is in your blood." };
  if (pct >= 0.6)  return { emoji: "🧠", badge: "VERSED",   tagline: "Well versed. Keep going." };
  if (pct >= 0.4)  return { emoji: "📖", badge: "LEARNING", tagline: "The archive awaits you." };
  return           { emoji: "🌱", badge: "STARTER",          tagline: "Every great knows starts here." };
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
}

export default function GameDoneScreen({ game, score, total, date, alreadyDone }: Props) {
  const [email,    setEmail]    = useState("");
  const [subState, setSubState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [shared,   setShared]   = useState(false);

  const { emoji, badge, tagline } = getResult(game, score, total);
  const meta       = GAME_META[game];
  const otherGame  = OTHER_GAME[game];
  const isPuzzle   = game === "sudoku" || game === "crossword";
  const pct        = isPuzzle ? null : Math.round((score / total) * 100);

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubState("loading");
    try {
      const res = await fetch("/api/games/subscribe", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email }),
      });
      setSubState(res.ok ? "done" : "error");
    } catch {
      setSubState("error");
    }
  }

  async function handleShare() {
    const scoreText = isPuzzle
      ? `I solved today's ${meta.label} on Moveee! 🎯`
      : `I scored ${score}/${total} (${pct}%) on today's ${meta.label} on Moveee! ${emoji}`;
    const shareData = {
      title: `Moveee Games — ${meta.label}`,
      text: `${scoreText}\n\nPlay at themoveee.com/games`,
      url: "https://themoveee.com/games",
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${scoreText}\n\nthemoveee.com/games`);
        setShared(true);
        setTimeout(() => setShared(false), 3000);
      }
    } catch {}
  }

  return (
    <div className="gds-wrap">
      <div className="gds-card">

        {/* Header bar */}
        <div className="gds-header">
          <span className="gds-logo">THE MOVEEE</span>
          <span className="gds-game-tag">{meta.icon} {meta.label}</span>
        </div>

        {/* Score / result zone */}
        <div className="gds-result">
          <div className="gds-badge">{badge}</div>
          <div className="gds-emoji">{emoji}</div>
          {!isPuzzle && (
            <div className="gds-score-block">
              <span className="gds-score-num">{score}</span>
              <span className="gds-score-sep">/</span>
              <span className="gds-score-total">{total}</span>
            </div>
          )}
          {!isPuzzle && pct !== null && (
            <div className="gds-pct">{pct}% correct</div>
          )}
          <p className="gds-tagline">{tagline}</p>
        </div>

        {/* Date + status */}
        <div className="gds-meta-row">
          <span className="gds-date">{formatDate(date)}</span>
          {alreadyDone && <span className="gds-already">Already played today</span>}
        </div>

        {/* Share button */}
        <button className="gds-share-btn" onClick={handleShare}>
          {shared ? "✓ Copied to clipboard" : "Share your score →"}
        </button>

        {/* Games notify subscription */}
        <div className="gds-sub-zone">
          {subState === "done" ? (
            <p className="gds-sub-success">✓ You're on the list — we'll ping you daily.</p>
          ) : (
            <>
              <p className="gds-sub-label">Get daily game reminders</p>
              <form className="gds-sub-form" onSubmit={handleSubscribe}>
                <input
                  type="email"
                  className="gds-sub-input"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button type="submit" className="gds-sub-btn" disabled={subState === "loading"}>
                  {subState === "loading" ? "…" : "Notify me"}
                </button>
              </form>
              {subState === "error" && <p className="gds-sub-error">Try again in a moment.</p>}
            </>
          )}
        </div>

        {/* Nav actions */}
        <div className="gds-actions">
          <Link href={otherGame.href} className="gds-btn gds-btn--primary">
            Try {otherGame.label} →
          </Link>
          <Link href="/games" className="gds-btn gds-btn--ghost">
            All Games
          </Link>
        </div>

      </div>
    </div>
  );
}
