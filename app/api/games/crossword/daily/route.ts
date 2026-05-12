/**
 * GET /api/games/crossword/daily
 *
 * Returns the same mini-crossword puzzle for every player on a given UTC day.
 * Selects one of N pre-built puzzles deterministically using date as seed.
 *
 * Response: { date, puzzle: CrosswordPuzzle }
 */

import { NextResponse, NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import { generateCrosswordWithGemini } from "@/lib/crossword-gemini";

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
      "..ORISA",
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
      "T.AFROB",
      "A.OGUN.",
      "..T....",
      "..HEROE",
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
      "SPHINX.",
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
  const clues: CrosswordClue[] = [];
  let nextNumber = 1;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (cells[r][c].black) continue;

      const startsAcross = (c === 0 || cells[r][c - 1].black) && c + 1 < size && !cells[r][c + 1].black;
      const startsDown = (r === 0 || cells[r - 1][c].black) && r + 1 < size && !cells[r + 1][c].black;

      if (!startsAcross && !startsDown) continue;

      let usedAcross = false;
      let usedDown = false;

      if (startsAcross) {
        let word = "";
        for (let i = c; i < size && !cells[r][i].black; i++) word += cells[r][i].letter;
        const matchingClue = rawClues.find(cl => cl.direction === "across" && cl.answer === word);
        if (matchingClue) {
          usedAcross = true;
          clues.push({ ...matchingClue, number: nextNumber, row: r, col: c, length: word.length });
        }
      }

      if (startsDown) {
        let word = "";
        for (let i = r; i < size && !cells[i][c].black; i++) word += cells[i][c].letter;
        const matchingClue = rawClues.find(cl => cl.direction === "down" && cl.answer === word);
        if (matchingClue) {
          usedDown = true;
          clues.push({ ...matchingClue, number: nextNumber, row: r, col: c, length: word.length });
        }
      }

      if (usedAcross || usedDown) {
        cells[r][c].number = nextNumber;
        nextNumber++;
      }
    }
  }

  return clues.sort((a, b) => a.number - b.number || (a.direction === "across" ? -1 : 1));
}


// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const isRandom = searchParams.get("random") === "true";
  const date = new Date().toISOString().slice(0, 10);
  
  let raw: { title: string; grid: string[]; clues: Omit<CrosswordClue, "number" | "row" | "col" | "length">[] } | null = null;

  // Try Gemini first if it's random OR if we don't have a cached one for today
  if (process.env.GEMINI_API_KEY) {
    const cacheDir = path.join(process.cwd(), "scratch", "crossword-cache");
    const cacheFile = path.join(cacheDir, `puzzle-${date}.json`);

    if (!isRandom && fs.existsSync(cacheFile)) {
      try {
        raw = JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
      } catch (e) {
        console.error("Cache read error:", e);
      }
    }

    if (!raw) {
      const geminiPuzzle = await generateCrosswordWithGemini();
      if (geminiPuzzle) {
        raw = {
          title: geminiPuzzle.title,
          grid: geminiPuzzle.grid,
          clues: geminiPuzzle.clues.map(c => ({ direction: c.direction, answer: c.answer.toUpperCase(), clue: c.clue }))
        };

        // Cache it if it's for today (and not a random request)
        if (!isRandom) {
          try {
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
            fs.writeFileSync(cacheFile, JSON.stringify(raw), "utf-8");
          } catch (e) {
            console.error("Cache write error:", e);
          }
        }
      }
    }
  }

  // Fallback to pre-built bank if Gemini failed or no API key
  if (!raw) {
    const rng = makeRng(dateToSeed(date));
    const idx = Math.floor(rng() * PUZZLES.length);
    raw = PUZZLES[idx];
  }

  const size = raw.grid.length;
  const cells = buildCells(raw.grid);
  const clues = numberAndClues(cells, raw.clues, size);

  const puzzle: CrosswordPuzzle = { size, cells, clues, title: raw.title };
  return NextResponse.json({ date, puzzle });
}
