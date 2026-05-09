"use client";

import { useState, useEffect } from "react";

interface TriviaQuestion {
  question:    string;
  options:     [string, string, string, string];
  correct:     number;
  explanation: string;
  category:    string;
}

type Phase = "loading" | "playing" | "answered" | "complete" | "error";

const LETTERS = ["A", "B", "C", "D"] as const;

const CATEGORY_LABELS: Record<string, string> = {
  music:      "Music",
  film:       "Film & TV",
  literature: "Literature",
  history:    "History",
  culture:    "Culture",
};

function ResultEmoji(score: number, total: number): string {
  const pct = score / total;
  if (pct === 1)   return "🏆";
  if (pct >= 0.8)  return "🔥";
  if (pct >= 0.6)  return "🧠";
  if (pct >= 0.4)  return "📖";
  return "🌱";
}

function ResultTitle(score: number, total: number): string {
  const pct = score / total;
  if (pct === 1)   return "Flawless!";
  if (pct >= 0.8)  return "Culture Expert";
  if (pct >= 0.6)  return "Strong Knowledge";
  if (pct >= 0.4)  return "Keep Exploring";
  return "Just the Beginning";
}

export default function TriviaGame() {
  const [phase,      setPhase]    = useState<Phase>("loading");
  const [questions,  setQuestions] = useState<TriviaQuestion[]>([]);
  const [current,    setCurrent]  = useState(0);
  const [selected,   setSelected] = useState<number | null>(null);
  const [score,      setScore]    = useState(0);
  const [errorMsg,   setErrorMsg] = useState("");
  const [date,       setDate]     = useState("");

  async function loadQuestions() {
    setPhase("loading");
    try {
      const res = await fetch("/api/games/trivia/daily");
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (!Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error("No questions returned.");
      }
      setQuestions(data.questions);
      setDate(data.date ?? "");
      setCurrent(0);
      setSelected(null);
      setScore(0);
      setPhase("playing");
    } catch (err: any) {
      setErrorMsg(err.message ?? "Could not load trivia.");
      setPhase("error");
    }
  }

  useEffect(() => { loadQuestions(); }, []);

  function handleAnswer(idx: number) {
    if (phase !== "playing") return;
    setSelected(idx);
    if (idx === questions[current].correct) setScore((s) => s + 1);
    setPhase("answered");
  }

  function handleNext() {
    const next = current + 1;
    if (next >= questions.length) {
      setPhase("complete");
      return;
    }
    setCurrent(next);
    setSelected(null);
    setPhase("playing");
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className="trivia-game">
        <div className="game-loading">
          <div className="game-loading__spinner" />
          <p className="game-loading__text">Generating today's questions…</p>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (phase === "error") {
    return (
      <div className="trivia-game">
        <div className="game-loading">
          <p className="game-loading__text">{errorMsg}</p>
          <button className="trivia-next-btn" style={{ marginTop: 24 }} onClick={loadQuestions}>
            Try Again →
          </button>
        </div>
      </div>
    );
  }

  // ── Results ───────────────────────────────────────────────────────────────
  if (phase === "complete") {
    const total = questions.length;
    const wrong = total - score;
    const pct   = Math.round((score / total) * 100);
    return (
      <div className="game-page">
        <div className="game-result">
          <div className="game-result__emoji">{ResultEmoji(score, total)}</div>
          <h2 className="game-result__title">{ResultTitle(score, total)}</h2>
          <p className="game-result__subtitle">{pct}% correct — Culture Trivia {date}</p>

          <div className="game-result__score">
            <span className="game-result__score-num">{score}</span>
            <span className="game-result__score-total">/ {total}</span>
          </div>

          <div className="game-result__breakdown">
            <div className="game-result__stat">
              <span className="game-result__stat-num" style={{ color: "var(--moss)" }}>
                {score}
              </span>
              <span className="game-result__stat-label">Correct</span>
            </div>
            <div className="game-result__stat">
              <span className="game-result__stat-num" style={{ color: "var(--ochre)" }}>
                {wrong}
              </span>
              <span className="game-result__stat-label">Missed</span>
            </div>
          </div>

          <div className="game-result__actions">
            <button className="game-result__btn game-result__btn--primary" onClick={loadQuestions}>
              Play Again →
            </button>
            <a href="/games/who-said-it" className="game-result__btn game-result__btn--secondary">
              Try Who Said It
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── Question ──────────────────────────────────────────────────────────────
  if (questions.length === 0) return null;
  const q          = questions[current];
  const isAnswered = phase === "answered";
  const total      = questions.length;

  return (
    <div className="trivia-game">
      {/* Header */}
      <div className="trivia-header">
        <p className="trivia-header__eyebrow">Culture Trivia</p>
        <p className="trivia-header__title">
          {date ? `Today's quiz · ${date}` : "Daily quiz"}
        </p>
      </div>

      {/* Progress pips */}
      <div className="trivia-progress">
        {questions.map((_, i) => (
          <div
            key={i}
            className={[
              "trivia-progress__pip",
              i < current   ? "trivia-progress__pip--done"   : "",
              i === current ? "trivia-progress__pip--active"  : "",
            ].join(" ")}
          />
        ))}
      </div>

      {/* Category + number */}
      <p className="trivia-question-num">
        Question {current + 1} of {total}
        {q.category && ` · ${CATEGORY_LABELS[q.category] ?? q.category}`}
      </p>

      {/* Question text */}
      <p className="trivia-question-text">{q.question}</p>

      {/* Options */}
      <div className="trivia-options">
        {q.options.map((opt, idx) => {
          let cls = "trivia-option";
          if (isAnswered) {
            if (idx === q.correct)   cls += " trivia-option--correct";
            else if (idx === selected) cls += " trivia-option--wrong";
          }
          return (
            <button
              key={idx}
              className={cls}
              onClick={() => handleAnswer(idx)}
              disabled={isAnswered}
            >
              <span className="trivia-option__letter">{LETTERS[idx]}</span>
              {opt}
            </button>
          );
        })}
      </div>

      {/* Explanation + next */}
      {isAnswered && (
        <>
          {q.explanation && (
            <div className="trivia-explanation">
              <p className="trivia-explanation__label">Did you know?</p>
              <p>{q.explanation}</p>
            </div>
          )}
          <button className="trivia-next-btn" onClick={handleNext}>
            {current + 1 >= total ? "See Results" : "Next Question"} →
          </button>
        </>
      )}
    </div>
  );
}
