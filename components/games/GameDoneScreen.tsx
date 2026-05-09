"use client";

import { useState } from "react";
import Link from "next/link";

interface Props {
  game:  "wsi" | "trivia";
  score: number;
  total: number;
  date:  string;
}

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

function getResult(score: number, total: number) {
  const pct = score / total;
  if (pct === 1)   return { emoji: "🏆", title: "Perfect Score!" };
  if (pct >= 0.8)  return { emoji: "🔥", title: "Culture Expert" };
  if (pct >= 0.6)  return { emoji: "🧠", title: "Well Versed" };
  if (pct >= 0.4)  return { emoji: "📖", title: "Keep Exploring" };
  return           { emoji: "🌱", title: "Just the Beginning" };
}

export default function GameDoneScreen({ game, score, total, date }: Props) {
  const [email,    setEmail]    = useState("");
  const [subState, setSubState] = useState<"idle" | "loading" | "done" | "error">("idle");

  const { emoji, title } = getResult(score, total);
  const pct       = Math.round((score / total) * 100);
  const otherGame = game === "wsi"
    ? { href: "/games/trivia",     label: "Culture Trivia" }
    : { href: "/games/who-said-it", label: "Who Said It?" };

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubState("loading");
    try {
      const res = await fetch(`${WP_URL}/wp-json/culture/v1/newsletter-subscribe`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email }),
      });
      setSubState(res.ok ? "done" : "error");
    } catch {
      setSubState("error");
    }
  }

  return (
    <div className="game-done">
      <div className="game-done__card">
        <p className="game-done__already">Today's game complete</p>

        <div className="game-done__emoji">{emoji}</div>
        <h2 className="game-done__title">{title}</h2>
        <p className="game-done__date">{date}</p>

        <div className="game-done__score">
          <span className="game-done__score-num">{score}</span>
          <span className="game-done__score-den">/ {total}</span>
        </div>
        <p className="game-done__pct">{pct}% correct</p>

        <div className="game-done__subscribe">
          <p className="game-done__sub-label">
            Get notified when tomorrow's questions drop
          </p>
          {subState === "done" ? (
            <p className="game-done__sub-success">✓ You're in — see you tomorrow</p>
          ) : (
            <form className="game-done__sub-form" onSubmit={handleSubscribe}>
              <input
                type="email"
                className="game-done__sub-input"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button
                type="submit"
                className="game-done__sub-btn"
                disabled={subState === "loading"}
              >
                {subState === "loading" ? "…" : "Notify me"}
              </button>
            </form>
          )}
          {subState === "error" && (
            <p className="game-done__sub-error">Something went wrong — try again.</p>
          )}
        </div>

        <div className="game-done__actions">
          <Link href={otherGame.href} className="game-result__btn game-result__btn--primary">
            Try {otherGame.label} →
          </Link>
          <Link href="/games" className="game-result__btn game-result__btn--secondary">
            All Games
          </Link>
        </div>
      </div>
    </div>
  );
}
