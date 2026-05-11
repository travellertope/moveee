/**
 * GET /api/games/crossword/daily
 *
 * Returns the same mini-crossword puzzle for every player on a given UTC day.
 * Selects one of N pre-built puzzles deterministically using date as seed.
 *
 * Response: { date, puzzle: CrosswordPuzzle }
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";

export interface CrosswordCell {
  letter:  string;  // correct letter
  number?: number;  // clue number if this is the start of a word
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
  size:   number;
  cells:  CrosswordCell[][];
  clues:  CrosswordClue[];
  title:  string;
}

// ── Seeded PRNG ───────────────────────────────────────────────────────────────
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

// ── Pre-built puzzle bank (African & diaspora culture) ────────────────────────
// Each puzzle is a 7×7 grid. '.' = black cell, letters = solution.
// Words & clues are defined per puzzle.
const PUZZLES: { grid: string[]; clues: Omit<CrosswordClue, "number" | "row" | "col" | "length">[]; title: string }[] = [
  {
    title: "Roots & Rhythms",
    grid: [
      "FELA...",
      "U.KENTE",
      "J.....U",
      "I.GRIOT",
      ".LAGOS.",
      "..B....",
      "..ORISА",   // Orisa
    ],
    // Clues matched by (direction, answer)
    clues: [
      { direction: "across", answer: "FELA",  clue: "Pioneer of Afrobeat, ___ Kuti" },
      { direction: "across", answer: "KENTE", clue: "Colourful Ghanaian woven cloth" },
      { direction: "across", answer: "GRIOT", clue: "West African storyteller and oral historian" },
      { direction: "across", answer: "LAGOS", clue: "Nigeria's largest city and cultural capital" },
      { direction: "across", answer: "ORISA", clue: "Yoruba deity or spirit (also Orisha)" },
      { direction: "down",   answer: "FUJI",  clue: "Nigerian music genre pioneered by Sikiru Ayinde Barrister" },
      { direction: "down",   answer: "UBUNTU",clue: '"I am because we are" — African philosophy' },
      { direction: "down",   answer: "EGO",   clue: "___béatrice (Ivorian author) or self" },
    ],
  },
  {
    title: "Pan-African Pulse",
    grid: [
      "ACCRA..",
      "F.CAIRO",
      "R.....B",
      "O.NAIJA",
      ".SHEA..",
      "..L....",
      "..ADIRE",
    ],
    clues: [
      { direction: "across", answer: "ACCRA",  clue: "Capital city of Ghana" },
      { direction: "across", answer: "CAIRO",  clue: "Capital of Egypt, home of Al-Azhar" },
      { direction: "across", answer: "NAIJA",  clue: "Affectionate slang for Nigeria" },
      { direction: "across", answer: "SHEA",   clue: "___ butter — skin staple from West Africa" },
      { direction: "across", answer: "ADIRE",  clue: "Yoruba indigo tie-dye textile tradition" },
      { direction: "down",   answer: "AFRO",   clue: "Natural hair style and cultural statement" },
      { direction: "down",   answer: "NAIROBI",clue: "Capital of Kenya" },
      { direction: "down",   answer: "JOLLOF", clue: "The rice dish that unites West Africa" },
    ],
  },
  {
    title: "Diaspora Voices",
    grid: [
      "GHANA..",
      "R.BATIK",
      "I.....O",
      "O.BONGO",
      "T.NILE.",
      "..D....",
      "..TUNIS",
    ],
    clues: [
      { direction: "across", answer: "GHANA",  clue: "First sub-Saharan country to gain independence (1957)" },
      { direction: "across", answer: "BATIK",  clue: "Wax-resist fabric dyeing technique widespread in Africa" },
      { direction: "across", answer: "BONGO",  clue: "Paired hand drums originating in Cuba, with African roots" },
      { direction: "across", answer: "NILE",   clue: "World's longest river, flowing through East Africa" },
      { direction: "across", answer: "TUNIS",  clue: "Capital of Tunisia on the North African coast" },
      { direction: "down",   answer: "GRIOT",  clue: "West African keeper of oral history and music" },
      { direction: "down",   answer: "ABIDJAN",clue: "Economic capital of Côte d'Ivoire" },
      { direction: "down",   answer: "KOLA",   clue: "___ nut — ceremonial seed used in West African tradition" },
    ],
  },
  {
    title: "Culture & Craft",
    grid: [
      "BEADS..",
      "I.DAKAR",
      "N.....A",
      "T.AFROБ",
      "A.OGUN.",
      "..T....",
      "..HEROE",   // HEROES shortened as HEROE for grid
    ],
    clues: [
      { direction: "across", answer: "BEADS",  clue: "Used in waist-beading, a body adornment tradition across Africa" },
      { direction: "across", answer: "DAKAR",  clue: "Capital of Senegal, hub of West African art" },
      { direction: "across", answer: "AFRO",   clue: "Natural hair silhouette reclaimed as cultural pride" },
      { direction: "across", answer: "OGUN",   clue: "Yoruba orisha of iron, warfare, and labour" },
      { direction: "down",   answer: "BINTA",  clue: "Common Fula/Wolof woman's name meaning 'daughter'" },
      { direction: "down",   answer: "DREAD",  clue: "_locks — hair style worn from Rastafari tradition outward" },
      { direction: "down",   answer: "KARATE", clue: "Martial art with roots partly traced to African wrestling systems" },
    ],
  },
  {
    title: "Sounds & Stories",
    grid: [
      "LAGOS..",
      "I.AMARA",
      "T.....N",
      "E.ZULU.",
      "R.ADIRE",
      "..E....",
      "..BEATS",
    ],
    clues: [
      { direction: "across", answer: "LAGOS",  clue: "Nigeria's city that never sleeps" },
      { direction: "across", answer: "AMARA",  clue: "Swahili/Amharic name meaning 'grace' or 'eternal'" },
      { direction: "across", answer: "ZULU",   clue: "Largest ethnic group in South Africa" },
      { direction: "across", answer: "ADIRE",  clue: "Yoruba resist-dye cloth in indigo" },
      { direction: "across", answer: "BEATS",  clue: "Afro___: genre fusing African rhythms with global sounds" },
      { direction: "down",   answer: "LITERE", clue: "Root of 'literature' — the craft of African writers like Achebe" },
      { direction: "down",   answer: "IBEJI",  clue: "Yoruba word for twins, also sacred wooden figurines" },
      { direction: "down",   answer: "DANCE",  clue: "Azonto, Gwara Gwara, and Zanku are all ___ crazes" },
    ],
  },
  {
    title: "Sacred & Civil",
    grid: [
      "KENYA..",
      "O.SPHINX",
      "L.....I",
      "A.KENTE",
      ".CAIRO.",
      "..L....",
      "..AFRO.",
    ],
    clues: [
      { direction: "across", answer: "KENYA",  clue: "Home of the Great Rift Valley and Maasai culture" },
      { direction: "across", answer: "SPHINX", clue: "Ancient limestone monument on the Giza Plateau" },
      { direction: "across", answer: "KENTE",  clue: "Royal Ghanaian woven cloth of the Asante" },
      { direction: "across", answer: "CAIRO",  clue: "City built near ancient Memphis on the Nile" },
      { direction: "across", answer: "AFRO",   clue: "Hair style synonymous with Black pride movement" },
      { direction: "down",   answer: "KOLA",   clue: "Sacred nut central to Igbo hospitality rituals" },
      { direction: "down",   answer: "NAIROBI",clue: "Capital of Kenya, meaning 'cool waters'" },
      { direction: "down",   answer: "AFRIK",  clue: "Root word believed to originate the continent's name" },
    ],
  },
  {
    title: "Word & World",
    grid: [
      "UBUNTU.",
      "B.....A",
      "I.GHANA",
      "."+"JOLLOF",
      ".BEADS.",
      "..I....",
      "..DRUMS",
    ],
    clues: [
      { direction: "across", answer: "UBUNTU",  clue: '"I am because we are" — Southern African philosophy' },
      { direction: "across", answer: "GHANA",   clue: "First Black African nation to gain independence" },
      { direction: "across", answer: "JOLLOF",  clue: "Contested but beloved West African rice dish" },
      { direction: "across", answer: "BEADS",   clue: "Waist and neck adornment central to African femininity" },
      { direction: "across", answer: "DRUMS",   clue: "Talking ___ — used for long-distance communication in West Africa" },
      { direction: "down",   answer: "UBANGI",  clue: "River forming the border between DRC and CAR" },
      { direction: "down",   answer: "BOLD",    clue: "Ankara prints are known for their ___ patterns" },
      { direction: "down",   answer: "NAIJA",   clue: "Colloquial name for Nigeria" },
    ],
  },
];

// ── Build cell grid from string grid ─────────────────────────────────────────
function buildCells(gridLines: string[]): CrosswordCell[][] {
  const size = gridLines.length;
  return gridLines.map(row =>
    row.split("").map(ch => ({
      letter: ch === "." ? "" : ch,
      black:  ch === ".",
    }))
  );
}

// ── Number cells and build clue list ─────────────────────────────────────────
function numberAndClues(
  cells: CrosswordCell[][],
  rawClues: Omit<CrosswordClue, "number" | "row" | "col" | "length">[],
  size: number
): CrosswordClue[] {
  let n = 1;
  const clues: CrosswordClue[] = [];
  const numbered: { row: number; col: number; n: number }[] = [];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (cells[r][c].black) continue;
      const startsAcross = (c === 0 || cells[r][c-1].black) && c + 1 < size && !cells[r][c+1].black;
      const startsDown   = (r === 0 || cells[r-1][c].black) && r + 1 < size && !cells[r+1][c].black;
      if (startsAcross || startsDown) {
        cells[r][c].number = n;
        numbered.push({ row: r, col: c, n });
        n++;
      }
    }
  }

  // Match raw clues to numbered positions by scanning the grid for the answer
  for (const raw of rawClues) {
    const word = raw.answer;
    for (const pos of numbered) {
      if (raw.direction === "across") {
        let match = true;
        for (let i = 0; i < word.length; i++) {
          if (pos.col + i >= size || cells[pos.row][pos.col+i].letter !== word[i]) { match = false; break; }
        }
        if (match) {
          clues.push({ ...raw, number: pos.n, row: pos.row, col: pos.col, length: word.length });
          break;
        }
      } else {
        let match = true;
        for (let i = 0; i < word.length; i++) {
          if (pos.row + i >= size || cells[pos.row+i][pos.col].letter !== word[i]) { match = false; break; }
        }
        if (match) {
          clues.push({ ...raw, number: pos.n, row: pos.row, col: pos.col, length: word.length });
          break;
        }
      }
    }
  }

  return clues.sort((a, b) => a.number - b.number || (a.direction === "across" ? -1 : 1));
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET() {
  const date = new Date().toISOString().slice(0, 10);
  const rng  = makeRng(dateToSeed(date));
  const idx  = Math.floor(rng() * PUZZLES.length);
  const raw  = PUZZLES[idx];
  const size = raw.grid.length;

  const cells = buildCells(raw.grid);
  const clues = numberAndClues(cells, raw.clues, size);

  const puzzle: CrosswordPuzzle = { size, cells, clues, title: raw.title };
  return NextResponse.json({ date, puzzle });
}
