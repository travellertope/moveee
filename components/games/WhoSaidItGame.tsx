"use client";

import { useState, useEffect, useCallback } from "react";

interface Question {
  id:             number;
  quote:          string;
  source:         string;
  correct_author: string;
  options:        string[];
}

type Phase = "loading" | "question" | "answered" | "complete" | "error";

const TOTAL_ROUNDS = 10;

function ResultEmoji(score: number): string {
  const pct = score / TOTAL_ROUNDS;
  if (pct === 1)    return "🏆";
  if (pct >= 0.8)   return "🔥";
  if (pct >= 0.6)   return "👏";
  if (pct >= 0.4)   return "📚";
  return "🌱";
}

function ResultTitle(score: number): string {
  const pct = score / TOTAL_ROUNDS;
  if (pct === 1)   return "Perfect Score!";
  if (pct >= 0.8)  return "Culture Scholar";
  if (pct >= 0.6)  return "Well Versed";
  if (pct >= 0.4)  return "Keep Reading";
  return "Just Getting Started";
}

export default function WhoSaidItGame() {
  const [phase,       setPhase]   = useState<Phase>("loading");
  const [question,    setQuestion] = useState<Question | null>(null);
  const [selected,    setSelected] = useState<string | null>(null);
  const [score,       setScore]   = useState(0);
  const [round,       setRound]   = useState(0);
  const [seenIds,     setSeenIds] = useState<number[]>([]);
  const [errorMsg,    setErrorMsg] = useState("");

  const loadQuestion = useCallback(async (seen: number[]) => {
    setPhase("loading");
    try {
      const exclude = seen.join(",");
      const res = await fetch(
        `/api/games/who-said-it/question${exclude ? `?exclude=${exclude}` : ""}`
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? `HTTP ${res.status}`);
      }
      const data: Question = await res.json();
      setQuestion(data);
      setSelected(null);
      setPhase("question");
    } catch (err: any) {
      setErrorMsg(err.message ?? "Could not load question.");
      setPhase("error");
    }
  }, []);

  // Load first question on mount.
  useEffect(() => { loadQuestion([]); }, [loadQuestion]);

  function handleAnswer(author: string) {
    if (phase !== "question" || !question) return;
    setSelected(author);
    if (author === question.correct_author) setScore((s) => s + 1);
    setPhase("answered");
  }

  function handleNext() {
    const newRound = round + 1;
    if (newRound >= TOTAL_ROUNDS) {
      setRound(newRound);
      setPhase("complete");
      return;
    }
    const newSeen = [...seenIds, question!.id];
    setSeenIds(newSeen);
    setRound(newRound);
    loadQuestion(newSeen);
  }

  function handleRestart() {
    setScore(0);
    setRound(0);
    setSeenIds([]);
    setErrorMsg("");
    loadQuestion([]);
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className="wsi-game">
        <div className="game-loading">
          <div className="game-loading__spinner" />
          <p className="game-loading__text">Finding a quote…</p>
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
          <button className="wsi-next-btn" onClick={handleRestart}>
            Try Again →
          </button>
        </div>
      </div>
    );
  }

  // ── Results ───────────────────────────────────────────────────────────────
  if (phase === "complete") {
    const wrong = TOTAL_ROUNDS - score;
    return (
      <div className="game-page">
        <div className="game-result">
          <div className="game-result__emoji">{ResultEmoji(score)}</div>
          <h2 className="game-result__title">{ResultTitle(score)}</h2>
          <p className="game-result__subtitle">You completed Who Said It</p>

          <div className="game-result__score">
            <span className="game-result__score-num">{score}</span>
            <span className="game-result__score-total">/ {TOTAL_ROUNDS}</span>
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
            <button className="game-result__btn game-result__btn--primary" onClick={handleRestart}>
              Play Again →
            </button>
            <a href="/games/trivia" className="game-result__btn game-result__btn--secondary">
              Try Culture Trivia
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── Question / Answered ───────────────────────────────────────────────────
  if (!question) return null;

  const isAnswered    = phase === "answered";
  const isCorrect     = selected === question.correct_author;
  const progress      = (round / TOTAL_ROUNDS) * 100;

  return (
    <div className="wsi-game">
      {/* Progress */}
      <div className="wsi-progress">
        <div className="wsi-progress__bar">
          <div className="wsi-progress__fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="wsi-progress__label">{round + 1} / {TOTAL_ROUNDS}</span>
        <span className="wsi-score-badge">{score} pts</span>
      </div>

      {/* Quote */}
      <div className="wsi-quote-card">
        <p className="wsi-quote-text">{question.quote}</p>
        {question.source && (
          <span className="wsi-quote-source">— {question.source}</span>
        )}
      </div>

      {/* Prompt */}
      <p className="wsi-prompt">Who said this?</p>

      {/* Options */}
      <div className="wsi-options">
        {question.options.map((author) => {
          let cls = "wsi-option";
          if (isAnswered) {
            if (author === question.correct_author) {
              cls += selected === author ? " wsi-option--correct" : " wsi-option--reveal";
            } else if (author === selected) {
              cls += " wsi-option--wrong";
            }
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
              {isCorrect ? "Correct" : `Missed — it was ${question.correct_author}`}
            </p>
            {!isCorrect && (
              <p className="wsi-feedback__text">
                This quote is by <strong>{question.correct_author}</strong>.
                {question.source ? ` Source: ${question.source}.` : ""}
              </p>
            )}
          </div>
          <button className="wsi-next-btn" onClick={handleNext}>
            {round + 1 >= TOTAL_ROUNDS ? "See Results" : "Next Quote"} →
          </button>
        </>
      )}
    </div>
  );
}
