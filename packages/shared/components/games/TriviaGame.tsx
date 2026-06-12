"use client";

import { useState, useEffect } from "react";
import GameDoneScreen from "./GameDoneScreen";

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

const STORAGE_KEY = (date: string) => `moveee_trivia_${date}`;

export default function TriviaGame() {
  const [phase,     setPhase]     = useState<Phase>("loading");
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [current,   setCurrent]   = useState(0);
  const [selected,  setSelected]  = useState<number | null>(null);
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

    // Load today's questions
    fetch("/api/games/trivia/daily")
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
        setErrorMsg(err.message ?? "Could not load today's trivia.");
        setPhase("error");
      });
  }, []);

  function handleAnswer(idx: number) {
    if (phase !== "playing") return;
    setSelected(idx);
    if (idx === questions[current].correct) setScore((s) => s + 1);
    setPhase("answered");
  }

  function handleNext() {
    const next = current + 1;
    if (next >= questions.length) {
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
        game="trivia"
        score={alreadyPlayed.score}
        total={alreadyPlayed.total}
        date={date}
      />
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className="trivia-game">
        <div className="game-loading">
          <div className="game-loading__spinner" />
          <p className="game-loading__text">Loading today's trivia…</p>
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
          <button
            className="trivia-next-btn"
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

  return (
    <div className="trivia-game">
      {/* Header */}
      <div className="trivia-header">
        <p className="trivia-header__eyebrow">Culture Trivia</p>
        <p className="trivia-header__title">
          {date ? `Today's quiz · ${date}` : "Daily quiz"}
        </p>
      </div>

      {/* Progress pips — one per question, no repeats */}
      <div className="trivia-progress">
        {questions.map((_, i) => (
          <div
            key={i}
            className={[
              "trivia-progress__pip",
              i < current    ? "trivia-progress__pip--done"   : "",
              i === current  ? "trivia-progress__pip--active" : "",
            ].join(" ")}
          />
        ))}
      </div>

      {/* Category + number */}
      <p className="trivia-question-num">
        Question {current + 1} of {total}
        {q.category && ` · ${CATEGORY_LABELS[q.category] ?? q.category}`}
      </p>

      {/* Question */}
      <p className="trivia-question-text">{q.question}</p>

      {/* Options */}
      <div className="trivia-options">
        {q.options.map((opt, idx) => {
          let cls = "trivia-option";
          if (isAnswered) {
            if (idx === q.correct)    cls += " trivia-option--correct";
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
