/**
 * GET /api/games/sudoku/daily
 *
 * Returns the same Sudoku puzzle for every player on a given UTC day.
 * Grid is generated deterministically from the date seed — no shared storage needed.
 *
 * Response: { date, puzzle: number[81], solution: number[81] }
 * puzzle: 0 = empty cell, 1-9 = given digit
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";

// ── Seeded PRNG (Mulberry32) ─────────────────────────────────────────────────
function dateToSeed(date: string): number {
  let h = 0;
  for (const ch of date) h = (Math.imul(h, 31) + ch.charCodeAt(0)) | 0;
  return h >>> 0;
}

function makeRng(seed: number): () => number {
  let s = seed;
  return () => {
    s += 0x6d2b79f5;
    let z = s;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 0xffffffff;
  };
}

function rngInt(rng: () => number, n: number) {
  return Math.floor(rng() * n);
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rngInt(rng, i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Base valid solved grid ────────────────────────────────────────────────────
// This is a valid 9x9 Sudoku solution.
const BASE: number[][] = [
  [1,2,3,4,5,6,7,8,9],
  [4,5,6,7,8,9,1,2,3],
  [7,8,9,1,2,3,4,5,6],
  [2,3,4,5,6,7,8,9,1],
  [5,6,7,8,9,1,2,3,4],
  [8,9,1,2,3,4,5,6,7],
  [3,4,5,6,7,8,9,1,2],
  [6,7,8,9,1,2,3,4,5],
  [9,1,2,3,4,5,6,7,8],
];

// ── Generate solved grid via validity-preserving transformations ──────────────
function generateSolution(rng: () => number): number[][] {
  let g = BASE.map(r => [...r]);

  // 1. Relabel digits
  const digits = shuffle([1,2,3,4,5,6,7,8,9], rng);
  g = g.map(row => row.map(v => digits[v - 1]));

  // 2. Shuffle rows within each band (0-2, 3-5, 6-8)
  for (let band = 0; band < 3; band++) {
    const rows = shuffle([0, 1, 2], rng);
    const base = band * 3;
    const tmp = [g[base], g[base+1], g[base+2]];
    g[base]   = tmp[rows[0]];
    g[base+1] = tmp[rows[1]];
    g[base+2] = tmp[rows[2]];
  }

  // 3. Shuffle cols within each stack (0-2, 3-5, 6-8)
  for (let stack = 0; stack < 3; stack++) {
    const cols = shuffle([0, 1, 2], rng);
    const base = stack * 3;
    for (let r = 0; r < 9; r++) {
      const tmp = [g[r][base], g[r][base+1], g[r][base+2]];
      g[r][base]   = tmp[cols[0]];
      g[r][base+1] = tmp[cols[1]];
      g[r][base+2] = tmp[cols[2]];
    }
  }

  // 4. Shuffle bands
  const bandOrder = shuffle([0, 1, 2], rng);
  const newG = bandOrder.flatMap(b => [g[b*3], g[b*3+1], g[b*3+2]]);

  // 5. Shuffle stacks
  const stackOrder = shuffle([0, 1, 2], rng);
  return newG.map(row => {
    const newRow: number[] = [];
    for (const s of stackOrder) newRow.push(row[s*3], row[s*3+1], row[s*3+2]);
    return newRow;
  });
}

// ── Sudoku solver (backtracking) — used to verify unique solution ─────────────
function solve(board: number[], limit = 2): number[][] {
  const solutions: number[][] = [];
  function bt(b: number[]): boolean {
    const empty = b.indexOf(0);
    if (empty === -1) { solutions.push([...b]); return solutions.length >= limit; }
    const row = Math.floor(empty / 9), col = empty % 9;
    for (let d = 1; d <= 9; d++) {
      if (canPlace(b, row, col, d)) {
        b[empty] = d;
        if (bt(b)) return true;
        b[empty] = 0;
      }
    }
    return false;
  }
  bt([...board]);
  return solutions;
}

function canPlace(b: number[], r: number, c: number, d: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (b[r*9+i] === d || b[i*9+c] === d) return false;
  }
  const br = Math.floor(r/3)*3, bc = Math.floor(c/3)*3;
  for (let dr = 0; dr < 3; dr++)
    for (let dc = 0; dc < 3; dc++)
      if (b[(br+dr)*9+(bc+dc)] === d) return false;
  return true;
}

// ── Carve holes to make puzzle — ensures unique solution ─────────────────────
function createPuzzle(solution: number[][], rng: () => number, clues = 36): number[] {
  const flat = solution.flat();
  const puzzle = [...flat];
  const indices = shuffle([...Array(81).keys()], rng);
  let removed = 0;
  const target = 81 - clues;

  for (const idx of indices) {
    if (removed >= target) break;
    const saved = puzzle[idx];
    puzzle[idx] = 0;
    if (solve(puzzle).length === 1) {
      removed++;
    } else {
      puzzle[idx] = saved;
    }
  }
  return puzzle;
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET() {
  const date = new Date().toISOString().slice(0, 10);
  const rng  = makeRng(dateToSeed(date));

  const solutionGrid = generateSolution(rng);
  const solution     = solutionGrid.flat();
  const puzzle       = createPuzzle(solutionGrid, rng, 36); // 36 givens = medium

  return NextResponse.json({ date, puzzle, solution });
}
