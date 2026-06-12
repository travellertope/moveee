"use client";

import { useState, useEffect } from "react";
import GameDoneScreen from "./GameDoneScreen";

interface WsiQuestion {
  id:             number;
  quote:          string;
  source:         string;
  correct_author: string;
  options:        string[];
}

type Phase = "loading" | "playing" | "answered" | "complete" | "error";

const STORAGE_KEY = (date: string) => `moveee_wsi_${date}`;

function ResultEmoji(score: number, total: number): string {
  const pct = score / total;
  if (pct === 1)   return "🏆";
  if (pct >= 0.8)  return "🔥";
  if (pct >= 0.6)  return "👏";
  if (pct >= 0.4)  return "📚";
  return "🌱";
}

function ResultTitle(score: number, total: number): string {
  const pct = score / total;
  if (pct === 1)   return "Perfect Score!";
  if (pct >= 0.8)  return "Culture Scholar";
  if (pct >= 0.6)  return "Well Versed";
  if (pct >= 0.4)  return "Keep Reading";
  return "Just Getting Started";
}

export default function WhoSaidItGame() {
  const [phase,     setPhase]     = useState<Phase>("loading");
  const [questions, setQuestions] = useState<WsiQuestion[]>([]);
  const [current,   setCurrent]   = useState(0);
  const [selected,  setSelected]  = useState<string | null>(null);
  const [score,     setScore]     = useState(0);
  const [date,      setDate]      = useState("");
  const [errorMsg,  setErrorMsg]  = useState("");
  const [alreadyPlayed, setAlreadyPlayed] = useState<{ score: number; total: number } | null>(null);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setDate(today);

    // Check if already played today
    try {
      const stored = localStorage.getItem(STORAGE_KEY(today));
      if (stored) {
        const parsed = JSON.parse(stored);
        setAlreadyPlayed(parsed);
        setPhase("complete");
        return;
      }
    } catch {}

    // Load today's question set
    fetch("/api/games/who-said-it/daily")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (!Array.isArray(data.questions) || data.questions.length === 0)
          throw new Error("No questions returned.");
        setQuestions(data.questions);
        setPhase("playing");
      })
      .catch((err) => {
        setErrorMsg(err.message ?? "Could not load today's game.");
        setPhase("error");
      });
  }, []);

  function handleAnswer(author: string) {
    if (phase !== "playing" || !questions[current]) return;
    setSelected(author);
    if (author === questions[current].correct_author) setScore((s) => s + 1);
    setPhase("answered");
  }

  function handleNext() {
    const next = current + 1;
    if (next >= questions.length) {
      const finalScore = score + (selected === questions[current].correct_author ? 0 : 0);
      // Save to localStorage
      try {
        localStorage.setItem(
          STORAGE_KEY(date),
          JSON.stringify({ score, total: questions.length })
        );
      } catch {}
      setAlreadyPlayed({ score, total: questions.length });
      setPhase("complete");
      return;
    }
    setCurrent(next);
    setSelected(null);
    setPhase("playing");
  }

  // ── Already played today ──────────────────────────────────────────────────
  if (phase === "complete" && alreadyPlayed) {
    return (
      <GameDoneScreen
        game="wsi"
        score={alreadyPlayed.score}
        total={alreadyPlayed.total}
        date={date}
      />
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className="wsi-game">
        <div className="game-loading">
          <div className="game-loading__spinner" />
          <p className="game-loading__text">Loading today's quotes…</p>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (phase === "error") {
    return (
      <div className="wsi-game">
        <div className="game-loading">
          <p className="game-loading__text">{errorMsg}</p>
          <button
            className="wsi-next-btn"
            style={{ marginTop: 24 }}
            onClick={() => window.location.reload()}
          >
            Try Again →
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) return null;

  const q          = questions[current];
  const total      = questions.length;
  const isAnswered = phase === "answered";
  const isCorrect  = selected === q.correct_author;
  const progress   = (current / total) * 100;

  return (
    <div className="wsi-game">
      {/* Progress */}
      <div className="wsi-progress">
        <div className="wsi-progress__bar">
          <div className="wsi-progress__fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="wsi-progress__label">{current + 1} / {total}</span>
        <span className="wsi-score-badge">{score} pts</span>
      </div>

      {/* Quote */}
      <div className="wsi-quote-card">
        <p className="wsi-quote-text">{q.quote}</p>
        {q.source && <span className="wsi-quote-source">— {q.source}</span>}
      </div>

      {/* Prompt */}
      <p className="wsi-prompt">Who said this?</p>

      {/* Options */}
      <div className="wsi-options">
        {q.options.map((author) => {
          let cls = "wsi-option";
          if (isAnswered) {
            if (author === q.correct_author)
              cls += selected === author ? " wsi-option--correct" : " wsi-option--reveal";
            else if (author === selected)
              cls += " wsi-option--wrong";
          }
          return (
            <button
              key={author}
              className={cls}
              onClick={() => handleAnswer(author)}
              disabled={isAnswered}
            >
              {author}
            </button>
          );
        })}
      </div>

      {/* Feedback + next */}
      {isAnswered && (
        <>
          <div className={`wsi-feedback wsi-feedback--${isCorrect ? "correct" : "wrong"}`}>
            <p className="wsi-feedback__label">
              {isCorrect ? "Correct!" : `Missed — it was ${q.correct_author}`}
            </p>
            {!isCorrect && (
              <p className="wsi-feedback__text">
                This quote is by <strong>{q.correct_author}</strong>.
                {q.source ? ` Source: ${q.source}.` : ""}
              </p>
            )}
          </div>
          <button className="wsi-next-btn" onClick={handleNext}>
            {current + 1 >= total ? "See Results" : "Next Quote"} →
          </button>
        </>
      )}
    </div>
  );
}
