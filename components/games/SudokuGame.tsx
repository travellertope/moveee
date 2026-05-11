"use client";

import { useState, useEffect, useCallback } from "react";
import GameDoneScreen from "./GameDoneScreen";

type Phase = "loading" | "playing" | "complete" | "error";
const STORAGE_KEY = (d: string) => `moveee_sudoku_${d}`;

function useTimer(running: boolean) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSecs(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function isBoardComplete(board: number[], solution: number[]) {
  return board.every((v, i) => v === solution[i]);
}

export default function SudokuGame() {
  const [phase,        setPhase]        = useState<Phase>("loading");
  const [puzzle,       setPuzzle]       = useState<number[]>([]);
  const [solution,     setSolution]     = useState<number[]>([]);
  const [board,        setBoard]        = useState<number[]>([]);
  const [given,        setGiven]        = useState<boolean[]>([]);
  const [selected,     setSelected]     = useState<number | null>(null);
  const [errors,       setErrors]       = useState<Set<number>>(new Set());
  const [highlights,   setHighlights]   = useState<Set<number>>(new Set());
  const [date,         setDate]         = useState("");
  const [errorMsg,     setErrorMsg]     = useState("");
  const [alreadyDone,  setAlreadyDone]  = useState(false);
  const [mistakes,     setMistakes]     = useState(0);
  const timer = useTimer(phase === "playing");

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setDate(today);
    try {
      const stored = localStorage.getItem(STORAGE_KEY(today));
      if (stored) { setAlreadyDone(true); setPhase("complete"); return; }
    } catch {}

    fetch("/api/games/sudoku/daily")
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(data => {
        const p: number[] = data.puzzle;
        const s: number[] = data.solution;
        setPuzzle(p);
        setSolution(s);
        setBoard([...p]);
        setGiven(p.map(v => v !== 0));
        setPhase("playing");
      })
      .catch(err => { setErrorMsg(err.message); setPhase("error"); });
  }, []);

  const getHighlights = useCallback((idx: number, b: number[]) => {
    const set = new Set<number>();
    const row = Math.floor(idx / 9), col = idx % 9;
    const br  = Math.floor(row / 3) * 3, bc = Math.floor(col / 3) * 3;
    for (let i = 0; i < 9; i++) { set.add(row * 9 + i); set.add(i * 9 + col); }
    for (let dr = 0; dr < 3; dr++) for (let dc = 0; dc < 3; dc++) set.add((br+dr)*9+(bc+dc));
    if (b[idx] !== 0) {
      b.forEach((v, i) => { if (v === b[idx]) set.add(i); });
    }
    return set;
  }, []);

  function selectCell(idx: number) {
    setSelected(idx);
    setHighlights(getHighlights(idx, board));
  }

  function inputDigit(d: number) {
    if (selected === null || given[selected] || phase !== "playing") return;
    const next = [...board];
    next[selected] = d;
    const newErrors = new Set(errors);

    if (d !== 0 && d !== solution[selected]) {
      newErrors.add(selected);
      setMistakes(m => m + 1);
    } else {
      newErrors.delete(selected);
    }

    setBoard(next);
    setErrors(newErrors);
    setHighlights(getHighlights(selected, next));

    if (d !== 0 && isBoardComplete(next, solution)) {
      try { localStorage.setItem(STORAGE_KEY(date), JSON.stringify({ completed: true })); } catch {}
      setPhase("complete");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (phase !== "playing" || selected === null) return;
    if (e.key >= "1" && e.key <= "9") { inputDigit(Number(e.key)); return; }
    if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") { inputDigit(0); return; }
    const row = Math.floor(selected / 9), col = selected % 9;
    if (e.key === "ArrowUp"    && row > 0) { selectCell(selected - 9); e.preventDefault(); }
    if (e.key === "ArrowDown"  && row < 8) { selectCell(selected + 9); e.preventDefault(); }
    if (e.key === "ArrowLeft"  && col > 0) { selectCell(selected - 1); e.preventDefault(); }
    if (e.key === "ArrowRight" && col < 8) { selectCell(selected + 1); e.preventDefault(); }
  }

  if (phase === "complete") {
    return <GameDoneScreen game="sudoku" score={0} total={0} date={date} alreadyDone={alreadyDone} />;
  }
  if (phase === "loading") return <div className="game-loading"><div className="game-loading__spinner" /><p>Loading today's puzzle…</p></div>;
  if (phase === "error")   return <div className="game-error"><p>{errorMsg || "Could not load today's puzzle."}</p><button onClick={() => window.location.reload()}>Try Again</button></div>;

  const selectedVal = selected !== null ? board[selected] : 0;

  return (
    <div className="sudoku-game" onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="sudoku-header">
        <div className="sudoku-meta">
          <span className="sudoku-label">Daily Sudoku</span>
          <span className="sudoku-date">{date}</span>
        </div>
        <div className="sudoku-stats">
          <span className="sudoku-stat"><span className="sudoku-stat-icon">⏱</span>{timer}</span>
          <span className="sudoku-stat"><span className="sudoku-stat-icon">✕</span>{mistakes}</span>
        </div>
      </div>

      {/* 9×9 Grid */}
      <div className="sudoku-grid">
        {board.map((val, idx) => {
          const row = Math.floor(idx / 9), col = idx % 9;
          const isSelected   = idx === selected;
          const isHighlit    = highlights.has(idx);
          const isGiven      = given[idx];
          const isError      = errors.has(idx);
          const isSameDigit  = !isSelected && val !== 0 && val === selectedVal;
          const borderRight  = (col + 1) % 3 === 0 && col < 8 ? " sudoku-cell--box-right"  : "";
          const borderBottom = (row + 1) % 3 === 0 && row < 8 ? " sudoku-cell--box-bottom" : "";

          let cls = "sudoku-cell";
          if (isSelected)  cls += " sudoku-cell--selected";
          else if (isSameDigit) cls += " sudoku-cell--same-digit";
          else if (isHighlit)   cls += " sudoku-cell--highlight";
          if (isGiven)     cls += " sudoku-cell--given";
          if (isError)     cls += " sudoku-cell--error";
          cls += borderRight + borderBottom;

          return (
            <div key={idx} className={cls} onClick={() => selectCell(idx)}>
              {val !== 0 ? val : ""}
            </div>
          );
        })}
      </div>

      {/* Number pad */}
      <div className="sudoku-numpad">
        {[1,2,3,4,5,6,7,8,9].map(d => (
          <button key={d} className="sudoku-numpad-btn" onClick={() => inputDigit(d)}>{d}</button>
        ))}
        <button className="sudoku-numpad-btn sudoku-numpad-btn--erase" onClick={() => inputDigit(0)}>✕</button>
      </div>
    </div>
  );
}
