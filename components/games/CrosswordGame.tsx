"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import GameDoneScreen from "./GameDoneScreen";
import type { CrosswordPuzzle, CrosswordClue } from "@/app/api/games/crossword/daily/route";

type Phase = "loading" | "playing" | "complete" | "error";
const STORAGE_KEY = (d: string) => `moveee_crossword_${d}`;

export default function CrosswordGame() {
  const [phase,       setPhase]       = useState<Phase>("loading");
  const [puzzle,      setPuzzle]      = useState<CrosswordPuzzle | null>(null);
  const [board,       setBoard]       = useState<string[][]>([]);       // user input
  const [revealed,    setRevealed]    = useState<boolean[][]>([]);      // correct cells
  const [selectedR,   setSelectedR]   = useState(0);
  const [selectedC,   setSelectedC]   = useState(0);
  const [direction,   setDirection]   = useState<"across" | "down">("across");
  const [activeClue,  setActiveClue]  = useState<CrosswordClue | null>(null);
  const [date,        setDate]        = useState("");
  const [errorMsg,    setErrorMsg]    = useState("");
  const [alreadyDone, setAlreadyDone] = useState(false);
  const { data: session } = useSession();
  const isPatron = session?.user?.tier === "patron";
  const gridRef = useRef<HTMLDivElement>(null);

  const [isGenerating, setIsGenerating] = useState(false);

  async function loadPuzzle(random = false) {
    if (random) {
      setPhase("loading");
      setIsGenerating(true);
    }
    
    try {
      const resp = await fetch(`/api/games/crossword/daily${random ? "?random=true" : ""}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const p: CrosswordPuzzle = data.puzzle;
      
      setPuzzle(p);
      setBoard(p.cells.map(row => row.map(c => c.black ? "#" : "")));
      setRevealed(p.cells.map(row => row.map(() => false)));
      
      // Select first non-black cell
      outer: for (let r = 0; r < p.size; r++)
        for (let c = 0; c < p.size; c++)
          if (!p.cells[r][c].black) { setSelectedR(r); setSelectedC(c); break outer; }
      
      setPhase("playing");
    } catch (err: any) {
      setErrorMsg(err.message);
      setPhase("error");
    } finally {
      setIsGenerating(false);
    }
  }

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setDate(today);
    try {
      const stored = localStorage.getItem(STORAGE_KEY(today));
      if (stored) { setAlreadyDone(true); setPhase("complete"); return; }
    } catch {}

    loadPuzzle();
  }, []);

  // Derive active clue whenever selection/direction changes
  useEffect(() => {
    if (!puzzle) return;
    const clue = findClueFor(puzzle.clues, selectedR, selectedC, direction, puzzle.cells);
    setActiveClue(clue ?? null);
  }, [selectedR, selectedC, direction, puzzle]);

  function findClueFor(
    clues: CrosswordClue[], r: number, c: number,
    dir: "across" | "down", cells: CrosswordPuzzle["cells"]
  ): CrosswordClue | undefined {
    return clues.find(cl => {
      if (cl.direction !== dir) return false;
      if (dir === "across") return cl.row === r && c >= cl.col && c < cl.col + cl.length;
      return cl.col === c && r >= cl.row && r < cl.row + cl.length;
    });
  }

  function cellInActiveClue(r: number, c: number): boolean {
    if (!activeClue) return false;
    if (activeClue.direction === "across")
      return r === activeClue.row && c >= activeClue.col && c < activeClue.col + activeClue.length;
    return c === activeClue.col && r >= activeClue.row && r < activeClue.row + activeClue.length;
  }

  function selectCell(r: number, c: number) {
    if (!puzzle || puzzle.cells[r][c].black) return;
    if (r === selectedR && c === selectedC) {
      setDirection(d => d === "across" ? "down" : "across");
    } else {
      setSelectedR(r);
      setSelectedC(c);
    }
    gridRef.current?.focus();
  }

  function advance() {
    if (!puzzle) return;
    if (direction === "across") {
      for (let c = selectedC + 1; c < puzzle.size; c++)
        if (!puzzle.cells[selectedR][c].black) { setSelectedC(c); return; }
    } else {
      for (let r = selectedR + 1; r < puzzle.size; r++)
        if (!puzzle.cells[r][selectedC].black) { setSelectedR(r); return; }
    }
  }

  function retreat() {
    if (!puzzle) return;
    if (direction === "across") {
      for (let c = selectedC - 1; c >= 0; c--)
        if (!puzzle.cells[selectedR][c].black) { setSelectedC(c); return; }
    } else {
      for (let r = selectedR - 1; r >= 0; r--)
        if (!puzzle.cells[r][selectedC].black) { setSelectedR(r); return; }
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (phase !== "playing" || !puzzle) return;
    const key = e.key.toUpperCase();

    if (key.length === 1 && key >= "A" && key <= "Z") {
      e.preventDefault();
      const next = board.map(row => [...row]);
      next[selectedR][selectedC] = key;
      setBoard(next);
      advance();
      checkComplete(next);
      return;
    }
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = board.map(row => [...row]);
      if (next[selectedR][selectedC] !== "") {
        next[selectedR][selectedC] = "";
      } else {
        retreat();
      }
      setBoard(next);
      return;
    }
    if (e.key === "ArrowRight") { e.preventDefault(); if (direction === "across") advance(); else setDirection("across"); }
    if (e.key === "ArrowLeft")  { e.preventDefault(); if (direction === "across") retreat(); else setDirection("across"); }
    if (e.key === "ArrowDown")  { e.preventDefault(); if (direction === "down")   advance(); else setDirection("down"); }
    if (e.key === "ArrowUp")    { e.preventDefault(); if (direction === "down")   retreat(); else setDirection("down"); }
  }

  function checkComplete(b: string[][]) {
    if (!puzzle) return;
    const done = puzzle.cells.every((row, r) =>
      row.every((cell, c) => cell.black || b[r][c] === cell.letter)
    );
    if (done) {
      try { localStorage.setItem(STORAGE_KEY(date), JSON.stringify({ completed: true })); } catch {}
      setPhase("complete");
    }
  }

  function clickClue(clue: CrosswordClue) {
    setDirection(clue.direction);
    setSelectedR(clue.row);
    setSelectedC(clue.col);
    gridRef.current?.focus();
  }

  if (phase === "complete") return <GameDoneScreen game="crossword" score={0} total={0} date={date} alreadyDone={alreadyDone} />;
  if (phase === "loading")  return <div className="game-loading"><div className="game-loading__spinner" /><p>Loading today's crossword…</p></div>;
  if (phase === "error")    return <div className="game-error"><p>{errorMsg || "Could not load today's crossword."}</p><button onClick={() => window.location.reload()}>Try Again</button></div>;
  if (!puzzle) return null;

  const acrossClues = puzzle.clues.filter(c => c.direction === "across");
  const downClues   = puzzle.clues.filter(c => c.direction === "down");

  return (
    <div className="crossword-game">
      <div className="crossword-header">
        <div className="crossword-meta">
          <span className="crossword-label">Daily Crossword</span>
          <span className="crossword-title">{puzzle.title}</span>
          <span className="crossword-date">{date}</span>
        </div>
        <div className="crossword-actions">
          {isPatron && (
            <button 
              className="cw-btn cw-btn--secondary" 
              onClick={() => loadPuzzle(true)}
              disabled={isGenerating}
            >
              {isGenerating ? "Generating..." : "Generate Random"}
            </button>
          )}
        </div>
      </div>

      <div className="crossword-layout">
        {/* Grid */}
        <div
          className="crossword-grid-wrap"
          ref={gridRef}
          tabIndex={0}
          onKeyDown={handleKey}
          style={{ "--cw-size": puzzle.size } as React.CSSProperties}
        >
          <div className="crossword-grid" style={{ gridTemplateColumns: `repeat(${puzzle.size}, 1fr)` }}>
            {puzzle.cells.map((row, r) =>
              row.map((cell, c) => {
                if (cell.black) return <div key={`${r}-${c}`} className="cw-cell cw-cell--black" />;
                const isSelected  = r === selectedR && c === selectedC;
                const inClue      = cellInActiveClue(r, c);
                const userVal     = board[r]?.[c] ?? "";
                const isCorrect   = revealed[r]?.[c] || userVal === cell.letter;
                const isWrong     = userVal !== "" && userVal !== cell.letter;

                let cls = "cw-cell";
                if (isSelected) cls += " cw-cell--selected";
                else if (inClue) cls += " cw-cell--highlight";
                if (isWrong)   cls += " cw-cell--error";
                if (isCorrect && userVal) cls += " cw-cell--correct";

                return (
                  <div key={`${r}-${c}`} className={cls} onClick={() => selectCell(r, c)}>
                    {cell.number && <span className="cw-cell-num">{cell.number}</span>}
                    <span className="cw-cell-letter">{userVal}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Clues */}
        <div className="crossword-clues">
          {activeClue && (
            <div className="cw-active-clue">
              <span className="cw-active-clue-label">{activeClue.number} {activeClue.direction.toUpperCase()}</span>
              <span className="cw-active-clue-text">{activeClue.clue}</span>
            </div>
          )}
          <div className="cw-clue-cols">
            <div className="cw-clue-col">
              <h3 className="cw-clue-heading">Across</h3>
              {acrossClues.map(cl => (
                <div
                  key={`a${cl.number}`}
                  className={`cw-clue${activeClue?.number === cl.number && activeClue.direction === "across" ? " cw-clue--active" : ""}`}
                  onClick={() => clickClue(cl)}
                >
                  <span className="cw-clue-num">{cl.number}</span>
                  <span className="cw-clue-text">{cl.clue}</span>
                </div>
              ))}
            </div>
            <div className="cw-clue-col">
              <h3 className="cw-clue-heading">Down</h3>
              {downClues.map(cl => (
                <div
                  key={`d${cl.number}`}
                  className={`cw-clue${activeClue?.number === cl.number && activeClue.direction === "down" ? " cw-clue--active" : ""}`}
                  onClick={() => clickClue(cl)}
                >
                  <span className="cw-clue-num">{cl.number}</span>
                  <span className="cw-clue-text">{cl.clue}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
