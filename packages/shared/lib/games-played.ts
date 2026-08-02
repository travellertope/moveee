/**
 * Reads each daily game's "played today" state from localStorage — the same
 * keys/shapes each game already writes on completion (see STORAGE_KEY in
 * TriviaGame.tsx / WhoSaidItGame.tsx / SudokuGame.tsx / CrosswordGame.tsx).
 * Score-based games (trivia, who-said-it) store {score, total}; puzzle games
 * (sudoku, crossword) store {completed: true} only. Client-only — call from
 * inside a useEffect, never during SSR (localStorage doesn't exist there).
 */

export type GameKey = "trivia" | "wsi" | "sudoku" | "crossword";

export interface GamePlayState {
  played: boolean;
  score?: number;
  total?: number;
}

const STORAGE_PREFIX: Record<GameKey, string> = {
  trivia: "moveee_trivia_",
  wsi: "moveee_wsi_",
  sudoku: "moveee_sudoku_",
  crossword: "moveee_crossword_",
};

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getGamePlayState(key: GameKey, date: string = todayUTC()): GamePlayState {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX[key]}${date}`);
    if (!raw) return { played: false };
    const parsed = JSON.parse(raw);
    if (typeof parsed?.score === "number" && typeof parsed?.total === "number") {
      return { played: true, score: parsed.score, total: parsed.total };
    }
    if (parsed?.completed) return { played: true };
    return { played: false };
  } catch {
    return { played: false };
  }
}

export function getAllGamePlayStates(): Record<GameKey, GamePlayState> {
  const date = todayUTC();
  return {
    trivia: getGamePlayState("trivia", date),
    wsi: getGamePlayState("wsi", date),
    sudoku: getGamePlayState("sudoku", date),
    crossword: getGamePlayState("crossword", date),
  };
}
