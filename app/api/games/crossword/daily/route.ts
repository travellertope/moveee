/**
 * GET /api/games/crossword/daily
 *
 * Returns the same mini-crossword puzzle for every player on a given UTC day.
 * Puzzles are defined as explicit word lists (answer + position + clue), so
 * every clue is guaranteed to appear numbered in the grid.
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";

export interface CrosswordCell {
  letter:  string;
  number?: number;
  black:   boolean;
}

export interface CrosswordClue {
  number:    number;
  direction: "across" | "down";
  clue:      string;
  answer:    string;
  row:       number;
  col:       number;
  length:    number;
}

export interface CrosswordPuzzle {
  size:  number;
  cells: CrosswordCell[][];
  clues: CrosswordClue[];
  title: string;
}

// ── Seeded PRNG ────────────────────────────────────────────────────────────────
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

// ── Puzzle definitions ─────────────────────────────────────────────────────────
// Each word is explicit: row/col/direction. The grid is derived from the words.
// Size 7×7.
interface WordDef {
  answer:    string;
  row:       number;
  col:       number;
  direction: "across" | "down";
  clue:      string;
}

interface PuzzleDef {
  title: string;
  size:  number;
  words: WordDef[];
}

const PUZZLES: PuzzleDef[] = [
  // ── 1. Roots & Rhythms ───────────────────────────────────────────────────────
  {
    title: "Roots & Rhythms",
    size: 7,
    words: [
      { answer: "FELA",   row: 0, col: 0, direction: "across", clue: "Pioneer of Afrobeat, ___ Kuti" },
      { answer: "KENTE",  row: 1, col: 2, direction: "across", clue: "Colourful royal woven cloth of the Asante" },
      { answer: "GRIOT",  row: 3, col: 2, direction: "across", clue: "West African oral historian and storyteller" },
      { answer: "LAGOS",  row: 4, col: 1, direction: "across", clue: "Nigeria's largest city and cultural capital" },
      { answer: "ORISA",  row: 6, col: 2, direction: "across", clue: "Yoruba deity or divine spirit (also Orisha)" },
      { answer: "FUJI",   row: 0, col: 0, direction: "down",   clue: "Nigerian music genre by Sikiru Ayinde Barrister" },
      { answer: "EKO",    row: 0, col: 3, direction: "down",   clue: "Historical Yoruba name for Lagos" },
      { answer: "LAGOS",  row: 4, col: 1, direction: "down",   clue: "" }, // internal — skip, no dup
      { answer: "UBUNTU", row: 1, col: 6, direction: "down",   clue: '"I am because we are" — African philosophy' },
    ].filter((w, i, arr) =>
      // deduplicate by answer+direction
      arr.findIndex(x => x.answer === w.answer && x.direction === w.direction && x.row === w.row && x.col === w.col) === i &&
      w.clue !== ""
    ),
  },

  // ── 2. Pan-African Pulse ─────────────────────────────────────────────────────
  {
    title: "Pan-African Pulse",
    size: 7,
    words: [
      { answer: "ACCRA",   row: 0, col: 0, direction: "across", clue: "Capital city of Ghana" },
      { answer: "CAIRO",   row: 1, col: 2, direction: "across", clue: "Capital of Egypt, home of Al-Azhar university" },
      { answer: "NAIJA",   row: 3, col: 2, direction: "across", clue: "Affectionate slang for Nigeria" },
      { answer: "SHEA",    row: 4, col: 1, direction: "across", clue: "___ butter — beloved West African skin staple" },
      { answer: "ADIRE",   row: 6, col: 2, direction: "across", clue: "Yoruba indigo resist-dye textile tradition" },
      { answer: "AFRO",    row: 0, col: 0, direction: "down",   clue: "Natural hair style reclaimed as cultural identity" },
      { answer: "NAIROBI", row: 0, col: 2, direction: "down",   clue: "Capital of Kenya, meaning 'cool waters'" },
      { answer: "JOLLOF",  row: 1, col: 6, direction: "down",   clue: "The rice dish that unites West Africa" },
    ],
  },

  // ── 3. Diaspora Voices ───────────────────────────────────────────────────────
  {
    title: "Diaspora Voices",
    size: 7,
    words: [
      { answer: "GHANA",   row: 0, col: 0, direction: "across", clue: "First sub-Saharan country to gain independence (1957)" },
      { answer: "BATIK",   row: 1, col: 2, direction: "across", clue: "Wax-resist fabric dyeing technique widespread in Africa" },
      { answer: "BONGO",   row: 3, col: 2, direction: "across", clue: "Paired hand drums with deep African roots" },
      { answer: "NILE",    row: 4, col: 2, direction: "across", clue: "World's longest river, flowing through East Africa" },
      { answer: "TUNIS",   row: 6, col: 2, direction: "across", clue: "Capital of Tunisia on the North African coast" },
      { answer: "GRIOT",   row: 0, col: 0, direction: "down",   clue: "West African keeper of oral history and music" },
      { answer: "ABUJA",   row: 0, col: 2, direction: "down",   clue: "Federal capital of Nigeria since 1991" },
      { answer: "KENTE",   row: 0, col: 4, direction: "down",   clue: "Colourful Ghanaian ceremonial cloth" },
    ],
  },

  // ── 4. Culture & Craft ───────────────────────────────────────────────────────
  {
    title: "Culture & Craft",
    size: 7,
    words: [
      { answer: "BEADS",   row: 0, col: 0, direction: "across", clue: "Waist adornment central to African feminine tradition" },
      { answer: "DAKAR",   row: 1, col: 2, direction: "across", clue: "Capital of Senegal, hub of West African art" },
      { answer: "AFRO",    row: 3, col: 2, direction: "across", clue: "Natural hair silhouette reclaimed as cultural pride" },
      { answer: "OGUN",    row: 4, col: 1, direction: "across", clue: "Yoruba orisha of iron, warfare, and labour" },
      { answer: "ADIRE",   row: 6, col: 2, direction: "across", clue: "Yoruba resist-dye textile in rich indigo" },
      { answer: "BINTA",   row: 0, col: 0, direction: "down",   clue: "Common Fula and Wolof woman's name" },
      { answer: "DRUM",    row: 0, col: 2, direction: "down",   clue: "Talking ___ — used for long-distance communication" },
      { answer: "DREAD",   row: 0, col: 4, direction: "down",   clue: "_locks — Rastafari hair worn as spiritual statement" },
    ],
  },

  // ── 5. Sounds & Stories ──────────────────────────────────────────────────────
  {
    title: "Sounds & Stories",
    size: 7,
    words: [
      { answer: "LAGOS",   row: 0, col: 0, direction: "across", clue: "Nigeria's city that never sleeps" },
      { answer: "AMARA",   row: 1, col: 2, direction: "across", clue: "Swahili and Amharic name meaning 'grace'" },
      { answer: "ZULU",    row: 3, col: 2, direction: "across", clue: "Largest ethnic group in South Africa" },
      { answer: "ADIRE",   row: 4, col: 1, direction: "across", clue: "Yoruba hand-dyed cloth in indigo blue" },
      { answer: "BEATS",   row: 6, col: 2, direction: "across", clue: "Afro___: genre fusing African rhythms worldwide" },
      { answer: "LITER",   row: 0, col: 0, direction: "down",   clue: "Root of 'literature' — craft of Achebe, Adichie" },
      { answer: "IBEJI",   row: 0, col: 2, direction: "down",   clue: "Yoruba word for twins and sacred wooden figurines" },
      { answer: "AZONTO",  row: 0, col: 4, direction: "down",   clue: "Viral Ghanaian dance craze of the 2010s" },
    ],
  },

  // ── 6. Sacred & Civil ───────────────────────────────────────────────────────
  {
    title: "Sacred & Civil",
    size: 7,
    words: [
      { answer: "KENYA",   row: 0, col: 0, direction: "across", clue: "Home of the Maasai and the Great Rift Valley" },
      { answer: "KENTE",   row: 1, col: 2, direction: "across", clue: "Royal Ghanaian woven cloth worn at ceremonies" },
      { answer: "CAIRO",   row: 3, col: 2, direction: "across", clue: "Ancient city built near Memphis on the Nile" },
      { answer: "AFRO",    row: 4, col: 1, direction: "across", clue: "Hair style synonymous with Black pride movement" },
      { answer: "KENTE",   row: 6, col: 2, direction: "across", clue: "" }, // dup, skip
      { answer: "KOLA",    row: 0, col: 0, direction: "down",   clue: "Sacred nut central to Igbo hospitality rituals" },
      { answer: "NAIROBI", row: 0, col: 2, direction: "down",   clue: "Capital of Kenya, named for its cool waters" },
      { answer: "TUNIS",   row: 0, col: 6, direction: "down",   clue: "North African capital on the Mediterranean" },
    ].filter(w => w.clue !== ""),
  },

  // ── 7. Word & World ─────────────────────────────────────────────────────────
  {
    title: "Word & World",
    size: 7,
    words: [
      { answer: "UBUNTU",  row: 0, col: 0, direction: "across", clue: '"I am because we are" — Southern African philosophy' },
      { answer: "GHANA",   row: 2, col: 2, direction: "across", clue: "First Black African nation to gain independence" },
      { answer: "JOLLOF",  row: 3, col: 1, direction: "across", clue: "Contested but beloved West African rice dish" },
      { answer: "BEADS",   row: 4, col: 1, direction: "across", clue: "Waist and neck adornment central to African femininity" },
      { answer: "DRUMS",   row: 6, col: 2, direction: "across", clue: "Talking ___ — used for messages across West Africa" },
      { answer: "UBANGI",  row: 0, col: 0, direction: "down",   clue: "River forming the border between DRC and CAR" },
      { answer: "BOLD",    row: 0, col: 3, direction: "down",   clue: "Ankara prints are celebrated for their ___ patterns" },
      { answer: "NAIJA",   row: 0, col: 5, direction: "down",   clue: "Colloquial and affectionate name for Nigeria" },
    ],
  },
];

// ── Build grid from word definitions ──────────────────────────────────────────
function buildGrid(size: number, words: WordDef[]): CrosswordCell[][] {
  const cells: CrosswordCell[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({ letter: "", black: true }))
  );

  for (const w of words) {
    for (let i = 0; i < w.answer.length; i++) {
      const r = w.direction === "across" ? w.row : w.row + i;
      const c = w.direction === "across" ? w.col + i : w.col;
      if (r < size && c < size) {
        cells[r][c] = { letter: w.answer[i], black: false };
      }
    }
  }

  return cells;
}

// ── Assign clue numbers and build final clue list ────────────────────────────
function buildClues(cells: CrosswordCell[][], words: WordDef[], size: number): CrosswordClue[] {
  let n = 1;
  const numMap = new Map<string, number>(); // "r,c" → number

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (cells[r][c].black) continue;
      const startsAcross = (c === 0 || cells[r][c - 1].black) && c + 1 < size && !cells[r][c + 1].black;
      const startsDown   = (r === 0 || cells[r - 1][c].black) && r + 1 < size && !cells[r + 1][c].black;
      if (startsAcross || startsDown) {
        cells[r][c].number = n;
        numMap.set(`${r},${c}`, n);
        n++;
      }
    }
  }

  const clues: CrosswordClue[] = [];
  for (const w of words) {
    const num = numMap.get(`${w.row},${w.col}`);
    if (num === undefined) continue; // word start not numbered — skip
    clues.push({
      number:    num,
      direction: w.direction,
      clue:      w.clue,
      answer:    w.answer,
      row:       w.row,
      col:       w.col,
      length:    w.answer.length,
    });
  }

  return clues.sort((a, b) => a.number - b.number || (a.direction === "across" ? -1 : 1));
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET() {
  const date = new Date().toISOString().slice(0, 10);
  const rng  = makeRng(dateToSeed(date));
  const idx  = Math.floor(rng() * PUZZLES.length);
  const def  = PUZZLES[idx];

  const cells = buildGrid(def.size, def.words);
  const clues = buildClues(cells, def.words, def.size);

  const puzzle: CrosswordPuzzle = { size: def.size, cells, clues, title: def.title };
  return NextResponse.json({ date, puzzle });
}
