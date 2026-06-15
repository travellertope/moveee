/**
 * GET /api/games/crossword/daily
 *
 * Returns the same mini-crossword puzzle for every player on a given UTC day.
 * Selects one of N pre-built puzzles deterministically using date as seed.
 *
 * Response: { date, puzzle: CrosswordPuzzle }
 */

import { NextResponse, NextRequest } from "next/server";
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
  {
    title: "Diaspora Dreams",
    grid: [
      "BURNA..",
      "I.NAIJA",
      "G.....O",
      ".TEMS..",
      ".O.AFR.",
      "...I...",
      "...SUYA",
    ],
    clues: [
      { direction: "across", answer: "BURNA",  clue: "___ Boy — Grammy-winning Nigerian Afrobeats artist" },
      { direction: "across", answer: "NAIJA",  clue: "Affectionate nickname for Nigeria" },
      { direction: "across", answer: "TEMS",   clue: "Nigerian singer who won a Grammy in 2023" },
      { direction: "across", answer: "SUYA",   clue: "Spiced Nigerian grilled meat skewers" },
      { direction: "down",   answer: "BIGT",   clue: "Abbreviation for 'Big Brother Nigeria' winner title" },
      { direction: "down",   answer: "AFRO",   clue: "Natural hair style celebrating Black identity" },
      { direction: "down",   answer: "NAIROBI",clue: "East African capital city, meaning 'cool waters'" },
    ],
  },
  {
    title: "Taste of Africa",
    grid: [
      "EGUSI..",
      "G.SHITO",
      "U.....O",
      "S.INJERA",
      "I.FUFU.",
      "..N....",
      "..JERK.",
    ],
    clues: [
      { direction: "across", answer: "EGUSI",  clue: "Ground melon seeds used in a rich West African soup" },
      { direction: "across", answer: "SHITO",  clue: "Ghanaian black pepper sauce made with dried fish" },
      { direction: "across", answer: "FUFU",   clue: "Pounded West African staple eaten with soup" },
      { direction: "across", answer: "JERK",   clue: "___ chicken: Jamaican spiced dish with West African roots" },
      { direction: "down",   answer: "EGUSI",  clue: "Melon seed staple of West African cooking" },
      { direction: "down",   answer: "SUFU",   clue: "Fermented locust bean condiment (also dawadawa)" },
      { direction: "down",   answer: "INJERA", clue: "Ethiopian spongy teff flatbread" },
    ],
  },
  {
    title: "African Icons",
    grid: [
      "ACHEBE.",
      "M.SANKARA",
      "P.....A",
      "I.FELA.",
      "..KUTI.",
      "..T....",
      "..AFRO.",
    ],
    clues: [
      { direction: "across", answer: "ACHEBE", clue: "Chinua ___ — author of Things Fall Apart" },
      { direction: "across", answer: "FELA",   clue: "___ Kuti, pioneer of Afrobeat" },
      { direction: "across", answer: "KUTI",   clue: "Fela ___ — surname of Nigeria's Afrobeat legend" },
      { direction: "across", answer: "AFRO",   clue: "Natural hair style reclaimed as cultural pride" },
      { direction: "down",   answer: "AMPI",   clue: "Short for Amapiano, South Africa's global dance genre" },
      { direction: "down",   answer: "SANKARA",clue: "Thomas ___ — revolutionary President of Burkina Faso" },
      { direction: "down",   answer: "AFRITA", clue: "Arabic word for a mischievous spirit in folklore" },
    ],
  },
  {
    title: "Rhythm Nation",
    grid: [
      "WIZKID.",
      "I.....A",
      "Z.AMAPA",
      ".PIANO.",
      ".I.DUB.",
      "...O...",
      "...AFRO",
    ],
    clues: [
      { direction: "across", answer: "WIZKID", clue: "Nigerian Grammy-winning Afrobeats superstar" },
      { direction: "across", answer: "AMAPA",  clue: "Start of 'Amapiano' — the South African global genre" },
      { direction: "across", answer: "PIANO",  clue: "Keys instrument at the heart of the Amapiano sound" },
      { direction: "across", answer: "DUB",    clue: "___ music: Jamaican genre pioneered by Lee 'Scratch' Perry" },
      { direction: "across", answer: "AFRO",   clue: "___beats: genre fusing African rhythms with global sounds" },
      { direction: "down",   answer: "WIZI",   clue: "Slang for 'wizard' or clever person (Swahili-influenced)" },
      { direction: "down",   answer: "PIANO",  clue: "88-key instrument central to Amapiano's sound" },
    ],
  },
  {
    title: "Afrofuture",
    grid: [
      "WAKANDA",
      "O.....N",
      "L.TEMS.",
      "O.....E",
      ".SOYINKA",
      "..F....",
      "..AFRI.",
    ],
    clues: [
      { direction: "across", answer: "WAKANDA", clue: "Fictional African nation from the Black Panther universe" },
      { direction: "across", answer: "TEMS",    clue: "Grammy-winning Nigerian singer born Temilade Openiyi" },
      { direction: "across", answer: "AFRI",    clue: "Root of the word 'Africa', ancient name for the continent" },
      { direction: "down",   answer: "WOLE",    clue: "___ Soyinka: first African Nobel laureate in Literature" },
      { direction: "down",   answer: "SOYINKA", clue: "Wole ___: Nigerian playwright and Nobel Prize winner" },
      { direction: "down",   answer: "DANTE",   clue: "Italian poet whose Inferno inspired African literary allegory" },
    ],
  },
  {
    title: "Style and Soul",
    grid: [
      "ANKARA.",
      "N.KENTE",
      "K.....I",
      "A.ADIRE",
      "R.GELE.",
      "..L....",
      "..ABAYA",
    ],
    clues: [
      { direction: "across", answer: "ANKARA", clue: "Wax-print fabric deeply associated with African fashion" },
      { direction: "across", answer: "KENTE",  clue: "Colourful woven cloth of the Asante people of Ghana" },
      { direction: "across", answer: "ADIRE",  clue: "Yoruba indigo tie-dye textile tradition" },
      { direction: "across", answer: "GELE",   clue: "Yoruba head-wrap worn at formal occasions" },
      { direction: "across", answer: "ABAYA",  clue: "Full-length robe worn by Muslim women across Africa and the Middle East" },
      { direction: "down",   answer: "ANKARA", clue: "Bold wax-print cloth worn across the African diaspora" },
      { direction: "down",   answer: "NIGERIA",clue: "West African nation where Ankara fashion is particularly celebrated" },
    ],
  },
  {
    title: "Words and Wisdom",
    grid: [
      "ACHEBE.",
      "D.OKRI.",
      "I.....B",
      "C.SARO.",
      "H.NNEDI",
      "..E....",
      "..ADICH",
    ],
    clues: [
      { direction: "across", answer: "ACHEBE", clue: "Author of Things Fall Apart" },
      { direction: "across", answer: "OKRI",   clue: "Ben ___ — Booker Prize-winning Nigerian author" },
      { direction: "across", answer: "SARO",   clue: "___ Wiwa: Nigerian activist and writer Ken ___-Wiwa" },
      { direction: "across", answer: "NNEDI",  clue: "___ Okofor — Africanfuturism author" },
      { direction: "across", answer: "ADICH",  clue: "Start of Chimamanda Ngozi Adichie's surname" },
      { direction: "down",   answer: "ADICHE", clue: "Chimamanda Ngozi ___: author of Americanah" },
      { direction: "down",   answer: "OBIBI",  clue: "Igbo concept of communal gathering and storytelling" },
    ],
  },
  {
    title: "Sporting Greats",
    grid: [
      "DROGBA.",
      "I.....M",
      "D.KIPCH",
      "I.....O",
      "E.SERENA",
      "..R....",
      "..AHMED",
    ],
    clues: [
      { direction: "across", answer: "DROGBA",  clue: "Didier ___ — Ivory Coast and Chelsea football legend" },
      { direction: "across", answer: "KIPCH",   clue: "Eliud ___ — Kenyan who ran the first sub-2-hour marathon" },
      { direction: "across", answer: "AHMED",   clue: "Mo ___: British-Somali long-distance running champion" },
      { direction: "down",   answer: "DIDIER",  clue: "First name of Ivory Coast's greatest footballer" },
      { direction: "down",   answer: "SERENA",  clue: "___ Williams: 23-time Grand Slam tennis champion" },
      { direction: "down",   answer: "MORHAMED",clue: "Full first name of distance runner Mo Farah" },
    ],
  },
  {
    title: "Pan-African Pioneers",
    grid: [
      "GARVEY.",
      "A.....K",
      "N.NKRUMA",
      ".LUMUMBA",
      ".U.....H",
      "...N...",
      "...KAUN",
    ],
    clues: [
      { direction: "across", answer: "GARVEY",  clue: "Marcus ___ — Pan-African activist and UNIA founder" },
      { direction: "across", answer: "NKRUMA",  clue: "Kwame ___ — first leader of independent Ghana" },
      { direction: "across", answer: "LUMUMBA", clue: "Patrice ___ — Congo's first elected Prime Minister" },
      { direction: "across", answer: "KAUN",    clue: "Kenneth ___ — Zambia's first President and Pan-Africanist" },
      { direction: "down",   answer: "GAUN",    clue: "Scots word for 'going', also initials of Ghana-Africa-Union-Nigeria" },
      { direction: "down",   answer: "ANGOLA",  clue: "Southern African country independent since 1975" },
      { direction: "down",   answer: "NKRUMAH", clue: "Full surname of Ghana's founding father" },
    ],
  },
  {
    title: "Sacred Traditions",
    grid: [
      "OGUN...",
      "R.SHANGO",
      "I......O",
      "S.OCHUN.",
      "A.ORISA.",
      "..N....",
      "..GELEDE",
    ],
    clues: [
      { direction: "across", answer: "OGUN",   clue: "Yoruba orisha of iron and warfare" },
      { direction: "across", answer: "SHANGO", clue: "Yoruba orisha of thunder and lightning" },
      { direction: "across", answer: "OCHUN",  clue: "Yoruba orisha of rivers, love and fertility (also Oshun)" },
      { direction: "across", answer: "ORISA",  clue: "Yoruba divine spirit or deity (also Orisha)" },
      { direction: "across", answer: "GELEDE", clue: "Yoruba masquerade tradition honouring the power of elder women" },
      { direction: "down",   answer: "ORISHA", clue: "Deity in Yoruba and diaspora religious traditions" },
      { direction: "down",   answer: "SANGON", clue: "Alternative spelling root for the thunder orisha" },
    ],
  },
  {
    title: "City Lights",
    grid: [
      "LAGOS..",
      "A.NAIROBI",
      "G.....I",
      "O.ACCRA.",
      "S.DAKAR.",
      "..A....",
      "..ABUJA.",
    ],
    clues: [
      { direction: "across", answer: "LAGOS",   clue: "Nigeria's largest city and commercial capital" },
      { direction: "across", answer: "ACCRA",   clue: "Capital city of Ghana on the Gulf of Guinea" },
      { direction: "across", answer: "DAKAR",   clue: "Capital of Senegal and hub of West African culture" },
      { direction: "across", answer: "ABUJA",   clue: "Nigeria's federal capital territory since 1991" },
      { direction: "down",   answer: "LAGOS",   clue: "Megacity on the Bight of Benin" },
      { direction: "down",   answer: "NAIROBI", clue: "Kenya's capital, meaning 'cool waters' in Maasai" },
      { direction: "down",   answer: "ABIDJAN", clue: "Economic capital of Côte d'Ivoire" },
    ],
  },
  {
    title: "Sounds of the Continent",
    grid: [
      "HIGHLIFE",
      "I......E",
      "G.KWAITO",
      "H.......H",
      "L.MBALAX",
      "I.F.....",
      "F.JUJU..",
    ],
    clues: [
      { direction: "across", answer: "HIGHLIFE", clue: "Ghanaian and Nigerian genre blending jazz and traditional rhythms" },
      { direction: "across", answer: "KWAITO",   clue: "South African genre mixing house music and township culture" },
      { direction: "across", answer: "MBALAX",   clue: "Senegalese genre popularised by Youssou N'Dour" },
      { direction: "across", answer: "JUJU",     clue: "Yoruba guitar-driven genre popularised by King Sunny Ade" },
      { direction: "down",   answer: "HIGH",     clue: "Prefix of Ghana's most famous exported music genre" },
      { direction: "down",   answer: "IGBO",     clue: "Nigerian ethnic group whose music inspired many Highlife sounds" },
      { direction: "down",   answer: "LIFE",     clue: "Suffix completing High___ — Ghana and Nigeria's jazz-rooted genre" },
    ],
  },
  {
    title: "Screen and Stage",
    grid: [
      "LUPITA.",
      "U.....D",
      "P.SELMA.",
      "I.....A",
      "T.NOLLYW",
      "A.....O",
      "..MOVIE.",
    ],
    clues: [
      { direction: "across", answer: "LUPITA",  clue: "___ Nyong'o — Oscar-winning Kenyan actress" },
      { direction: "across", answer: "SELMA",   clue: "Ava DuVernay's film about the 1965 voting rights marches" },
      { direction: "across", answer: "NOLLYW",  clue: "Start of 'Nollywood' — Nigeria's prolific film industry" },
      { direction: "across", answer: "MOVIE",   clue: "Another word for film" },
      { direction: "down",   answer: "LUPITA",  clue: "First name of the Kenyan-Mexican Oscar winner" },
      { direction: "down",   answer: "UPTOWN",  clue: "Direction of ambition in Jay-Z's NYC origin story" },
      { direction: "down",   answer: "NOLLYWOOD",clue: "Nigerian film industry, third largest in the world" },
    ],
  },
  {
    title: "Literary Legacy",
    grid: [
      "NGUGI..",
      "G.SOYINKA",
      "U.......A",
      "G.ADICHIE",
      "I......E",
      "..COETZEE",
      "..E......",
    ],
    clues: [
      { direction: "across", answer: "NGUGI",   clue: "___ wa Thiong'o — Kenyan novelist who writes in Gikuyu" },
      { direction: "across", answer: "ADICHIE",  clue: "Chimamanda Ngozi ___: author of Americanah" },
      { direction: "across", answer: "COETZEE",  clue: "J.M. ___: South African Nobel laureate in Literature" },
      { direction: "down",   answer: "NGUGI",   clue: "Kenyan literary giant who reclaimed his mother tongue" },
      { direction: "down",   answer: "SOYINKA",  clue: "Wole ___: first African Nobel Prize in Literature winner" },
      { direction: "down",   answer: "GRACE",    clue: "___ Ogot: pioneering Kenyan short-story writer" },
    ],
  },
  {
    title: "Heritage and Home",
    grid: [
      "MASAI..",
      "A.ZULU.",
      "S.....L",
      "A.ASHANTI",
      "I.....N",
      "..HAUSA.",
      "..IGBO..",
    ],
    clues: [
      { direction: "across", answer: "MASAI",   clue: "___ Mara: Kenyan savanna famed for the wildebeest migration" },
      { direction: "across", answer: "ZULU",    clue: "Largest South African ethnic group, of the Nguni people" },
      { direction: "across", answer: "ASHANTI",  clue: "Akan people of Ghana renowned for Kente cloth and gold" },
      { direction: "across", answer: "HAUSA",   clue: "West African ethnic group predominant in northern Nigeria" },
      { direction: "across", answer: "IGBO",    clue: "Nigerian ethnic group whose culture Chinua Achebe depicted" },
      { direction: "down",   answer: "MASAI",   clue: "Semi-nomadic warrior people of Kenya and Tanzania" },
      { direction: "down",   answer: "ZANDLA",  clue: "Zulu word meaning 'hands' — also a name meaning 'creator'" },
    ],
  },
  {
    title: "Global Beats",
    grid: [
      "AFROBEATS",
      "F.......A",
      "R.DANCEH.",
      "O.......L",
      ".REGGAE.",
      "..G.....",
      "..AZONTO",
    ],
    clues: [
      { direction: "across", answer: "AFROBEATS", clue: "Contemporary West African pop and dance genre" },
      { direction: "across", answer: "DANCEH",    clue: "___ all (dancehall): Jamaican pop genre rooted in reggae" },
      { direction: "across", answer: "REGGAE",    clue: "Jamaican genre popularised by Bob Marley" },
      { direction: "across", answer: "AZONTO",    clue: "Ghanaian mime-movement dance that went viral in 2011" },
      { direction: "down",   answer: "AFRO",      clue: "Prefix of 'Afrobeats' and 'Afrofuturism'" },
      { direction: "down",   answer: "REGGAE",    clue: "Bob Marley's genre, with roots in African rhythms" },
      { direction: "down",   answer: "DANCE",     clue: "___ hall: Jamaican genre beloved across the diaspora" },
    ],
  },
  {
    title: "Architecture and Art",
    grid: [
      "ADJAYE.",
      "D.....O",
      "I.GREAT.",
      "N.....B",
      "K.BENIN.",
      "..R....",
      "..AFROA",
    ],
    clues: [
      { direction: "across", answer: "ADJAYE",  clue: "Sir David ___: Ghanaian-British architect of the NMAAHC" },
      { direction: "across", answer: "GREAT",   clue: "___ Zimbabwe: ancient stone city and UNESCO World Heritage Site" },
      { direction: "across", answer: "BENIN",   clue: "___ Bronzes: looted West African artworks now being repatriated" },
      { direction: "across", answer: "AFROA",   clue: "Start of 'Afrocentric' or 'Afrofuturism'" },
      { direction: "down",   answer: "ADINKRA", clue: "Akan visual symbols each encoding a proverb or concept" },
      { direction: "down",   answer: "JYOTI",   clue: "Indian-origin word meaning 'light' — also seen in diaspora art names" },
      { direction: "down",   answer: "BRONZE",  clue: "Metal used in the famous Benin royal court sculptures" },
    ],
  },
  {
    title: "Island Vibes",
    grid: [
      "MARLEY.",
      "A.CALYPSO",
      "R.......A",
      "L.RIHANNA",
      "E.......H",
      "Y.REGGAE.",
      "..SOCA..",
    ],
    clues: [
      { direction: "across", answer: "MARLEY",   clue: "Bob ___: reggae legend and global symbol of African roots" },
      { direction: "across", answer: "CALYPSO",  clue: "Trinidadian music genre rooted in West African tradition" },
      { direction: "across", answer: "RIHANNA",  clue: "Barbadian singer and global pop and fashion icon" },
      { direction: "across", answer: "REGGAE",   clue: "Jamaican genre with deep African spiritual roots" },
      { direction: "across", answer: "SOCA",     clue: "Energetic Caribbean carnival music genre" },
      { direction: "down",   answer: "MARLEY",   clue: "Bob ___: the face of reggae music worldwide" },
      { direction: "down",   answer: "CARIB",    clue: "Root of 'Caribbean' — the indigenous people of the islands" },
    ],
  },
  {
    title: "African Rivers",
    grid: [
      "NIGER..",
      "I.....L",
      "L.VOLTA",
      "E.....K",
      ".CONGO.",
      "..N....",
      "..NILE.",
    ],
    clues: [
      { direction: "across", answer: "NIGER", clue: "West African river sharing its name with two countries" },
      { direction: "across", answer: "VOLTA", clue: "River dammed to form Lake Volta in Ghana" },
      { direction: "across", answer: "CONGO", clue: "Deepest river in the world, flowing through Central Africa" },
      { direction: "across", answer: "NILE", clue: "Longest river in Africa, flowing northward to the Mediterranean" },
      { direction: "down", answer: "NILE", clue: "River that sustained ancient Egyptian civilization" },
      { direction: "down", answer: "LAKE", clue: "Body of water, like Victoria or Tanganyika" },
    ],
  },
  {
    title: "African Landscapes",
    grid: [
      "SAHARA.",
      "..N.U..",
      "..DELTA",
      "..E.A..",
      "..S....",
      ".SAHEL.",
      ".......",
    ],
    clues: [
      { direction: "across", answer: "SAHARA", clue: "World's largest hot desert spanning North Africa" },
      { direction: "across", answer: "DELTA", clue: "Fan-shaped river mouth, like the Niger's or Nile's" },
      { direction: "across", answer: "SAHEL", clue: "Semi-arid belt south of the Sahara" },
      { direction: "down", answer: "ANDES", clue: "South American mountain range (not African but a geographic feature)" },
      { direction: "down", answer: "RURAL", clue: "Countryside areas, opposite of urban" },
    ],
  },
  {
    title: "Afro-Latin Rhythms",
    grid: [
      "SAMBA..",
      "A....R.",
      "L.RUMBA",
      "S....M.",
      "A.BATA.",
      ".......",
      ".CONGA.",
    ],
    clues: [
      { direction: "across", answer: "SAMBA", clue: "Brazilian dance rooted in African rhythms" },
      { direction: "across", answer: "RUMBA", clue: "Cuban dance with African origins" },
      { direction: "across", answer: "BATA", clue: "Sacred Yoruba double-headed drum used in Cuba" },
      { direction: "across", answer: "CONGA", clue: "Tall drum of Afro-Cuban origin, also a line dance" },
      { direction: "down", answer: "SALSA", clue: "Latin dance genre born in New York's Caribbean community" },
      { direction: "down", answer: "DRUM", clue: "Percussion instrument central to African music" },
    ],
  },
  {
    title: "Afro-Latin Heritage",
    grid: [
      ".BEMBE.",
      "..A....",
      "..T..O.",
      "..A..R.",
      "GUIRO..",
      "..K..S.",
      "..EGUN.",
    ],
    clues: [
      { direction: "across", answer: "BEMBE", clue: "Afro-Cuban drum ceremony honoring the orishas" },
      { direction: "across", answer: "GUIRO", clue: "Gourd scraper percussion instrument used in salsa" },
      { direction: "across", answer: "EGUN", clue: "Yoruba term for ancestral spirits" },
      { direction: "down", answer: "BATUKE", clue: "Cape Verdean music and dance genre" },
      { direction: "down", answer: "ORISHA", clue: "Yoruba deity worshipped across the diaspora" },
    ],
  },
  {
    title: "African Fashion Icons",
    grid: [
      "OZWALD.",
      ".......",
      "ADIRE..",
      ".U.....",
      ".ROBES.",
      ".O.....",
      ".KENTE.",
    ],
    clues: [
      { direction: "across", answer: "OZWALD", clue: "Boateng, Ghanaian-British Savile Row tailor" },
      { direction: "across", answer: "ADIRE", clue: "Yoruba resist-dyed indigo textile" },
      { direction: "across", answer: "ROBES", clue: "Flowing garments worn across West Africa" },
      { direction: "across", answer: "KENTE", clue: "Iconic Ghanaian woven cloth of royalty" },
      { direction: "down", answer: "DURO", clue: "Olowu, Nigerian-British fashion designer known for bold prints" },
    ],
  },
  {
    title: "African Textiles",
    grid: [
      "ANKARA.",
      ".......",
      ".MUDCL.",
      "..U....",
      "..LACE.",
      "..A....",
      "..SILK.",
    ],
    clues: [
      { direction: "across", answer: "ANKARA", clue: "Wax-print fabric popular across West Africa" },
      { direction: "across", answer: "LACE", clue: "Fabric favoured at Nigerian celebrations and owambe parties" },
      { direction: "across", answer: "SILK", clue: "Luxurious fabric used in aso-oke weaving" },
      { direction: "down", answer: "KULAS", clue: "Somali traditional shawls" },
    ],
  },
  {
    title: "Hip-Hop Kings",
    grid: [
      ".TUPAC.",
      "..A....",
      "..PNAS.",
      "..E....",
      "BEATS..",
      ".......",
      ".RHYME.",
    ],
    clues: [
      { direction: "across", answer: "TUPAC", clue: "Shakur, rapper and poet who died in 1996" },
      { direction: "across", answer: "NAS", clue: "Queensbridge MC who dropped Illmatic in 1994" },
      { direction: "across", answer: "BEATS", clue: "Instrumental tracks a rapper flows over" },
      { direction: "across", answer: "RHYME", clue: "Matching sounds at the end of bars" },
      { direction: "down", answer: "TAPE", clue: "Mixtape format, short for cassette" },
    ],
  },
  {
    title: "Hip-Hop Culture",
    grid: [
      "LAURYN.",
      "....E..",
      "BARS...",
      "....C..",
      "..FLOW.",
      "..L..R.",
      "..ACID.",
    ],
    clues: [
      { direction: "across", answer: "LAURYN", clue: "Hill, Fugees singer who made The Miseducation" },
      { direction: "across", answer: "BARS", clue: "Lines of rap lyrics, as in 'spitting ___'" },
      { direction: "across", answer: "FLOW", clue: "A rapper's rhythmic delivery over a beat" },
      { direction: "across", answer: "ACID", clue: "___ Rap, Chance the Rapper's breakout mixtape" },
      { direction: "down", answer: "RECORD", clue: "Vinyl disc, or to lay down a track" },
      { direction: "down", answer: "FLAIR", clue: "Stylistic distinctiveness in delivery" },
    ],
  },
  {
    title: "African Myths",
    grid: [
      "ANANSI.",
      ".......",
      ".ESHU..",
      ".....G.",
      ".OGUN..",
      ".....N.",
      "..LORE.",
    ],
    clues: [
      { direction: "across", answer: "ANANSI", clue: "Akan spider trickster of West African folklore" },
      { direction: "across", answer: "ESHU", clue: "Yoruba orisha of crossroads and messages" },
      { direction: "across", answer: "OGUN", clue: "Yoruba god of iron and warfare" },
      { direction: "across", answer: "LORE", clue: "Traditional stories passed down through generations" },
      { direction: "down", answer: "OGN", clue: "Abbreviation seen in Yoruba deity names" },
    ],
  },
  {
    title: "African Spirits",
    grid: [
      "SHANGO.",
      ".....R.",
      ".MAMI..",
      ".....S.",
      "..WATA.",
      ".......",
      ".DEITY.",
    ],
    clues: [
      { direction: "across", answer: "SHANGO", clue: "Yoruba god of thunder and lightning" },
      { direction: "across", answer: "MAMI", clue: "___ Wata, water spirit venerated across West Africa" },
      { direction: "across", answer: "WATA", clue: "Second part of the water spirit's name" },
      { direction: "across", answer: "DEITY", clue: "A god or goddess in a belief system" },
      { direction: "down", answer: "ORISA", clue: "Yoruba spelling of divine being" },
    ],
  },
  {
    title: "Soul Legends",
    grid: [
      "ARETHA.",
      ".......",
      ".SOUL..",
      "..T....",
      "..IVAN.",
      "..S....",
      "MOTOWN.",
    ],
    clues: [
      { direction: "across", answer: "ARETHA", clue: "Franklin, the Queen of Soul" },
      { direction: "across", answer: "SOUL", clue: "Genre born from gospel and rhythm & blues" },
      { direction: "across", answer: "IVAN", clue: "Lins, Brazilian soul and MPB singer" },
      { direction: "across", answer: "MOTOWN", clue: "Detroit record label founded by Berry Gordy" },
      { direction: "down", answer: "OTIS", clue: "Redding, soul singer of Sitting on the Dock of the Bay" },
    ],
  },
  {
    title: "R&B Royalty",
    grid: [
      "PRINCE.",
      ".......",
      ".STEVIE",
      ".......",
      "VOCAL..",
      ".......",
      ".ALBUM.",
    ],
    clues: [
      { direction: "across", answer: "PRINCE", clue: "Purple Rain artist from Minneapolis" },
      { direction: "across", answer: "STEVIE", clue: "Wonder, blind musical genius signed to Motown at 11" },
      { direction: "across", answer: "VOCAL", clue: "Relating to singing or the voice" },
      { direction: "across", answer: "ALBUM", clue: "Full-length music release, like Purple Rain or Songs in the Key of Life" },
    ],
  },
  {
    title: "African Safari",
    grid: [
      ".RHINO.",
      "..H....",
      "..IVORY",
      "..N....",
      "..OKAPI",
      ".......",
      "ZEBRA..",
    ],
    clues: [
      { direction: "across", answer: "RHINO", clue: "Horned mammal critically endangered by poaching" },
      { direction: "across", answer: "IVORY", clue: "Elephant tusk material once heavily traded" },
      { direction: "across", answer: "OKAPI", clue: "Striped-legged Congolese relative of the giraffe" },
      { direction: "across", answer: "ZEBRA", clue: "Black-and-white striped equine of the savanna" },
      { direction: "down", answer: "RHINO", clue: "One of Africa's Big Five, with a horn" },
    ],
  },
  {
    title: "African Nature",
    grid: [
      "LION...",
      "E.....B",
      "OKAVNG.",
      "P.....O",
      "A.HYENA",
      "R.....B",
      "D.EAGLE",
    ],
    clues: [
      { direction: "across", answer: "LION", clue: "King of the jungle, symbol of African strength" },
      { direction: "across", answer: "HYENA", clue: "Laughing predator of the African plains" },
      { direction: "across", answer: "EAGLE", clue: "Raptor appearing on many African flags" },
      { direction: "down", answer: "LEOPARD", clue: "Spotted big cat, stealthiest of Africa's predators" },
      { direction: "down", answer: "BAOBAB", clue: "Iconic African tree known as the tree of life" },
    ],
  },
  {
    title: "Black Innovators",
    grid: [
      "CARVER.",
      ".......",
      ".LATIM.",
      ".......",
      "..MAE..",
      "..A....",
      "..DREW.",
    ],
    clues: [
      { direction: "across", answer: "CARVER", clue: "George Washington ___, peanut research pioneer" },
      { direction: "across", answer: "LATIM", clue: "Lewis ___ er, inventor who improved the light bulb" },
      { direction: "across", answer: "MAE", clue: "___ Jemison, first Black woman in space" },
      { direction: "across", answer: "DREW", clue: "Charles ___, pioneer of blood banks" },
      { direction: "down", answer: "MAD", clue: "Extremely enthusiastic, as in 'mad scientist'" },
    ],
  },
  {
    title: "Black Scientists",
    grid: [
      ".NASAR.",
      ".......",
      "PLASMA.",
      ".......",
      ".TYSON.",
      ".......",
      "..STEM.",
    ],
    clues: [
      { direction: "across", answer: "PLASMA", clue: "Blood component; Charles Drew's research focus" },
      { direction: "across", answer: "TYSON", clue: "Neil deGrasse ___, astrophysicist and science communicator" },
      { direction: "across", answer: "STEM", clue: "Science, Technology, Engineering, and Mathematics" },
    ],
  },
  {
    title: "Carnival Spirit",
    grid: [
      ".MASQUE",
      "..O....",
      "..CALX.",
      "..A....",
      "FETE...",
      ".......",
      ".STEEL.",
    ],
    clues: [
      { direction: "across", answer: "MASQUE", clue: "Elaborate costume mask worn at carnival" },
      { direction: "across", answer: "FETE", clue: "Caribbean party or celebration, especially before carnival" },
      { direction: "across", answer: "STEEL", clue: "___ pan, Trinidad's national instrument" },
      { direction: "down", answer: "SOCA", clue: "Energetic Trinidadian carnival music genre" },
    ],
  },
  {
    title: "Carnival Cities",
    grid: [
      "TRINI..",
      ".......",
      ".FLOAT.",
      ".......",
      "..CROP.",
      ".......",
      "WINING.",
    ],
    clues: [
      { direction: "across", answer: "TRINI", clue: "Informal name for someone from Trinidad" },
      { direction: "across", answer: "FLOAT", clue: "Decorated vehicle in a carnival parade" },
      { direction: "across", answer: "CROP", clue: "___ Over, Barbados harvest festival turned carnival" },
      { direction: "across", answer: "WINING", clue: "Rotating hip dance movement at Caribbean carnivals" },
    ],
  },
  {
    title: "African Languages",
    grid: [
      "YORUBA.",
      ".....M.",
      ".HAUSA.",
      ".....A.",
      "..TWI..",
      "..W..I.",
      "..IGBO.",
    ],
    clues: [
      { direction: "across", answer: "YORUBA", clue: "Language spoken in southwestern Nigeria and Benin" },
      { direction: "across", answer: "HAUSA", clue: "Widely spoken trade language of West Africa" },
      { direction: "across", answer: "TWI", clue: "Akan language spoken in Ghana" },
      { direction: "across", answer: "IGBO", clue: "Language of southeastern Nigeria" },
      { direction: "down", answer: "AMHARI", clue: "Ethiopia's official language (shortened)" },
    ],
  },
  {
    title: "Languages of Africa",
    grid: [
      "SWAHILI",
      ".......",
      ".ZULU..",
      ".......",
      "..WOLOF",
      ".......",
      "BANTU..",
    ],
    clues: [
      { direction: "across", answer: "SWAHILI", clue: "East African lingua franca, also called Kiswahili" },
      { direction: "across", answer: "ZULU", clue: "South African language with click consonants" },
      { direction: "across", answer: "WOLOF", clue: "Language widely spoken in Senegal and Gambia" },
      { direction: "across", answer: "BANTU", clue: "Language family spanning most of sub-Saharan Africa" },
    ],
  },
  {
    title: "Diaspora Hubs",
    grid: [
      "HARLEM.",
      "A....O.",
      "V.BRIX.",
      "A....T.",
      "N.PECK.",
      "A....H.",
      "..SOUL.",
    ],
    clues: [
      { direction: "across", answer: "HARLEM", clue: "New York neighbourhood of the Black Renaissance" },
      { direction: "across", answer: "SOUL", clue: "Music genre, or Northern ___ in 1960s England" },
      { direction: "down", answer: "HAVANA", clue: "Cuban capital with deep African cultural roots" },
      { direction: "down", answer: "MOTH", clue: "Storytelling organisation in NYC (not diaspora-specific)" },
    ],
  },
  {
    title: "Global Black Culture",
    grid: [
      "BRIXTON",
      ".......",
      ".ACCRA.",
      ".......",
      "..LAGOS",
      ".......",
      "LONDON.",
    ],
    clues: [
      { direction: "across", answer: "BRIXTON", clue: "South London neighbourhood, heart of the Caribbean community" },
      { direction: "across", answer: "ACCRA", clue: "Ghana's capital, gateway for the diaspora's return" },
      { direction: "across", answer: "LAGOS", clue: "Nigeria's megacity and Afrobeats capital" },
      { direction: "across", answer: "LONDON", clue: "City hosting Notting Hill Carnival each August" },
    ],
  },
  {
    title: "African Brews",
    grid: [
      ".BEANS.",
      ".......",
      "ARABICA",
      ".......",
      ".CHAI..",
      "..A....",
      "..BREW.",
    ],
    clues: [
      { direction: "across", answer: "BEANS", clue: "Coffee seeds roasted for brewing" },
      { direction: "across", answer: "ARABICA", clue: "Coffee species originating in Ethiopian highlands" },
      { direction: "across", answer: "CHAI", clue: "Spiced tea popular in East Africa" },
      { direction: "across", answer: "BREW", clue: "To prepare coffee or tea by steeping" },
      { direction: "down", answer: "BAB", clue: "Short for baobab, tree whose leaves make tea" },
    ],
  },
  {
    title: "Tea Traditions",
    grid: [
      "ROOIBOS",
      ".......",
      ".KENYA.",
      ".......",
      "..HERBS",
      ".......",
      ".STEEP.",
    ],
    clues: [
      { direction: "across", answer: "ROOIBOS", clue: "South African red bush herbal tea" },
      { direction: "across", answer: "KENYA", clue: "East African nation and major tea exporter" },
      { direction: "across", answer: "HERBS", clue: "Plants used for flavouring teas and remedies" },
      { direction: "across", answer: "STEEP", clue: "To soak tea leaves in hot water" },
    ],
  },
  {
    title: "African Champions",
    grid: [
      "DROGBA.",
      ".......",
      ".WEAH..",
      ".......",
      "..HAILE",
      ".......",
      "GOALS..",
    ],
    clues: [
      { direction: "across", answer: "DROGBA", clue: "Didier ___, Ivorian Chelsea legend" },
      { direction: "across", answer: "WEAH", clue: "George ___, Liberian Ballon d'Or winner turned president" },
      { direction: "across", answer: "HAILE", clue: "Gebrselassie, Ethiopian distance running legend" },
      { direction: "across", answer: "GOALS", clue: "What strikers score in football" },
    ],
  },
  {
    title: "Track and Field",
    grid: [
      ".RELAY.",
      ".......",
      "SPRINT.",
      ".......",
      ".KIPCH.",
      ".......",
      "..GOLD.",
    ],
    clues: [
      { direction: "across", answer: "RELAY", clue: "Team race where runners pass a baton" },
      { direction: "across", answer: "SPRINT", clue: "Short-distance race at maximum speed" },
      { direction: "across", answer: "GOLD", clue: "Colour of an Olympic first-place medal" },
      { direction: "down", answer: "RIG", clue: "To set up equipment, or racing slang" },
    ],
  },
  {
    title: "Jazz Masters",
    grid: [
      "MILES..",
      "O....L.",
      "N.ELLA.",
      "K....A.",
      "..BOPS.",
      ".......",
      ".SWING.",
    ],
    clues: [
      { direction: "across", answer: "MILES", clue: "Davis, trumpeter who made Kind of Blue" },
      { direction: "across", answer: "ELLA", clue: "Fitzgerald, First Lady of Song" },
      { direction: "across", answer: "BOPS", clue: "Short jazz improvisations, or be-___" },
      { direction: "across", answer: "SWING", clue: "Jazz era of the 1930s-40s with big bands" },
      { direction: "down", answer: "MONK", clue: "Thelonious ___, pianist known for angular melodies" },
      { direction: "down", answer: "ELLA", clue: "Jazz vocalist famous for scat singing" },
    ],
  },
  {
    title: "Jazz Heritage",
    grid: [
      ".DIZZY.",
      "..M....",
      "..PIANO",
      "..R....",
      "..OVER.",
      "..V....",
      "HORNS..",
    ],
    clues: [
      { direction: "across", answer: "DIZZY", clue: "Gillespie, bebop trumpeter with the bent horn" },
      { direction: "across", answer: "PIANO", clue: "Instrument of Monk, Ellington, and Hancock" },
      { direction: "across", answer: "HORNS", clue: "Brass instruments in a jazz ensemble" },
      { direction: "down", answer: "IMPROV", clue: "Spontaneous musical creation, jazz's essence" },
    ],
  },
  {
    title: "Market Day",
    grid: [
      "SPICE..",
      ".......",
      ".TRADE.",
      ".......",
      "..GOLD.",
      "..O....",
      "..SILK.",
    ],
    clues: [
      { direction: "across", answer: "SPICE", clue: "Aromatic goods traded along East African routes" },
      { direction: "across", answer: "TRADE", clue: "Exchange of goods, the lifeblood of ancient African empires" },
      { direction: "across", answer: "GOLD", clue: "Precious metal that fuelled Ghana and Mali empires" },
      { direction: "across", answer: "SILK", clue: "Luxury fabric on trans-Saharan trade routes" },
      { direction: "down", answer: "GOS", clue: "Plural of 'go' in market haggling" },
    ],
  },
  {
    title: "Trade Routes",
    grid: [
      "MAKOLA.",
      ".......",
      ".IVORY.",
      ".......",
      "..SALT.",
      ".......",
      "BARTER.",
    ],
    clues: [
      { direction: "across", answer: "MAKOLA", clue: "Famous market in Accra, Ghana" },
      { direction: "across", answer: "IVORY", clue: "Traded tusk material, gave a West African nation its name" },
      { direction: "across", answer: "SALT", clue: "Mineral traded pound-for-pound with gold in ancient Mali" },
      { direction: "across", answer: "BARTER", clue: "Trading goods without money" },
    ],
  },
  {
    title: "Ancient Empires",
    grid: [
      ".MALI..",
      "..K....",
      "..SONGX",
      "..U....",
      "..MANSA",
      ".......",
      "AKSUM..",
    ],
    clues: [
      { direction: "across", answer: "MALI", clue: "Empire of Mansa Musa, richest man in history" },
      { direction: "across", answer: "MANSA", clue: "Title meaning 'king of kings' in the Mali Empire" },
      { direction: "across", answer: "AKSUM", clue: "Ancient Ethiopian trading empire with giant stelae" },
      { direction: "down", answer: "AKSUM", clue: "Kingdom that minted its own coins in ancient Africa" },
    ],
  },
  {
    title: "African Kingdoms",
    grid: [
      "BENIN..",
      ".......",
      ".ZULU..",
      ".......",
      "..KUSH.",
      ".......",
      "ASHANTI",
    ],
    clues: [
      { direction: "across", answer: "BENIN", clue: "Kingdom famed for its bronze sculptures" },
      { direction: "across", answer: "ZULU", clue: "Southern African kingdom united by Shaka" },
      { direction: "across", answer: "KUSH", clue: "Nubian kingdom that rivalled ancient Egypt" },
      { direction: "across", answer: "ASHANTI", clue: "Akan empire centred on Kumasi, Ghana" },
    ],
  },
  {
    title: "Afrobeats Stars I",
    grid: [
      "REMA..W",
      "......I",
      "ASAKE.Z",
      "......K",
      "BURNA.I",
      "......D",
      "TEMS...",
    ],
    clues: [
      { direction: "across", answer: "BURNA", clue: "___ Boy, Grammy-winning Nigerian star" },
      { direction: "across", answer: "TEMS", clue: "Singer on Wizkid's 'Essence'" },
      { direction: "across", answer: "ASAKE", clue: "YBNL star of 'Sungba'" },
      { direction: "down", answer: "WIZKID", clue: "Star Boy behind 'Essence'" },
      { direction: "across", answer: "REMA", clue: "'Calm Down' singer" },
    ],
  },
  {
    title: "Afrobeats Stars II",
    grid: [
      "TIWA..O",
      "......M",
      "RUGER.A",
      "......H",
      "DAVIDO.",
      ".......",
      "CKAY...",
    ],
    clues: [
      { direction: "across", answer: "RUGER", clue: "'Bounce' Afrobeats artist" },
      { direction: "down", answer: "OMAH", clue: "___ Lay, 'Soso' artist" },
      { direction: "across", answer: "CKAY", clue: "'Love Nwantiti' singer" },
      { direction: "across", answer: "DAVIDO", clue: "DMW boss, 'Fall' singer" },
      { direction: "across", answer: "TIWA", clue: "___ Savage, queen of Afrobeats" },
    ],
  },
  {
    title: "Nigerian Cuisine I",
    grid: [
      "...OKRO",
      "EBA....",
      ".......",
      "S.EGUSI",
      "U......",
      "Y.FUFU.",
      "A......",
    ],
    clues: [
      { direction: "across", answer: "EBA", clue: "Swallow made from garri" },
      { direction: "down", answer: "SUYA", clue: "Spiced grilled meat skewer" },
      { direction: "across", answer: "FUFU", clue: "Pounded starchy swallow" },
      { direction: "across", answer: "EGUSI", clue: "Soup made with melon seeds" },
      { direction: "across", answer: "OKRO", clue: "Slimy green soup vegetable" },
    ],
  },
  {
    title: "Nigerian Cuisine II",
    grid: [
      "DODO..E",
      "......F",
      "AKARA.O",
      ".......",
      "GARRI..",
      ".......",
      "MOIN...",
    ],
    clues: [
      { direction: "down", answer: "EFO", clue: "___ riro, Yoruba vegetable soup" },
      { direction: "across", answer: "GARRI", clue: "Granulated cassava staple" },
      { direction: "across", answer: "MOIN", clue: "___-moin, steamed bean pudding" },
      { direction: "across", answer: "AKARA", clue: "Fried bean cake" },
      { direction: "across", answer: "DODO", clue: "Fried sweet plantain" },
    ],
  },
  {
    title: "East African Culture I",
    grid: [
      "S.J.U.S",
      "I.A.G.A",
      "M.M.A.F",
      "B.B.L.A",
      "A.O.I.R",
      "......I",
      "DHOW...",
    ],
    clues: [
      { direction: "down", answer: "UGALI", clue: "East African maize staple" },
      { direction: "across", answer: "DHOW", clue: "Traditional sailing vessel of the coast" },
      { direction: "down", answer: "SAFARI", clue: "Swahili word for journey, now a wildlife tour" },
      { direction: "down", answer: "JAMBO", clue: "Swahili greeting for hello" },
      { direction: "down", answer: "SIMBA", clue: "Swahili word for lion" },
    ],
  },
  {
    title: "East African Culture II",
    grid: [
      "P.N.K.S",
      "I.Y.A.I",
      "L.A.N.M",
      "A.M.G.B",
      "U.A.A.A",
      ".......",
      "JAMBO..",
    ],
    clues: [
      { direction: "down", answer: "PILAU", clue: "Spiced rice dish of the Swahili coast" },
      { direction: "down", answer: "SIMBA", clue: "Swahili for lion" },
      { direction: "down", answer: "NYAMA", clue: "___ choma, grilled meat" },
      { direction: "across", answer: "JAMBO", clue: "Swahili greeting" },
      { direction: "down", answer: "KANGA", clue: "Printed cotton wrap with proverbs" },
    ],
  },
  {
    title: "South African Music I",
    grid: [
      "LOG...G",
      "......Q",
      "HOUSE.O",
      "......M",
      "KWAITO.",
      ".......",
      "VOCAL..",
    ],
    clues: [
      { direction: "across", answer: "KWAITO", clue: "1990s Johannesburg dance genre" },
      { direction: "across", answer: "VOCAL", clue: "___ amapiano, sung subgenre" },
      { direction: "down", answer: "GQOM", clue: "Raw Durban electronic sound" },
      { direction: "across", answer: "HOUSE", clue: "Electronic dance genre huge in SA" },
      { direction: "across", answer: "LOG", clue: "___ drum, amapiano signature" },
    ],
  },
  {
    title: "South African Music II",
    grid: [
      "DRUM..M",
      "....P.A",
      "K.Z.I.R",
      "W.U.A.A",
      "E.L.N.B",
      "L.U.O.I",
      "A......",
    ],
    clues: [
      { direction: "across", answer: "DRUM", clue: "Percussion core to SA music" },
      { direction: "down", answer: "PIANO", clue: "Ama___, the genre name's root" },
      { direction: "down", answer: "KWELA", clue: "Pennywhistle street music" },
      { direction: "down", answer: "MARABI", clue: "Early SA jazz-influenced style" },
      { direction: "down", answer: "ZULU", clue: "Largest ethnic group in South Africa" },
    ],
  },
  {
    title: "Ghanaian Culture I",
    grid: [
      "CEDI..T",
      "......W",
      "GHANA.I",
      ".......",
      "ASHANTI",
      ".......",
      "ACCRA..",
    ],
    clues: [
      { direction: "across", answer: "GHANA", clue: "Country whose capital is Accra" },
      { direction: "across", answer: "ASHANTI", clue: "Powerful Akan kingdom" },
      { direction: "across", answer: "ACCRA", clue: "Capital of Ghana" },
      { direction: "down", answer: "TWI", clue: "Widely spoken Akan language" },
      { direction: "across", answer: "CEDI", clue: "Currency of Ghana" },
    ],
  },
  {
    title: "Ghanaian Culture II",
    grid: [
      "SHITO.B",
      "......A",
      "PALM..N",
      "......K",
      "FUFU..U",
      ".......",
      "ADINKRA",
    ],
    clues: [
      { direction: "across", answer: "ADINKRA", clue: "Akan symbolic cloth and signs" },
      { direction: "across", answer: "PALM", clue: "___ wine, tapped tree drink" },
      { direction: "across", answer: "SHITO", clue: "Ghanaian black pepper sauce" },
      { direction: "down", answer: "BANKU", clue: "Fermented corn and cassava swallow" },
      { direction: "across", answer: "FUFU", clue: "Pounded cassava and plantain" },
    ],
  },
  {
    title: "Caribbean Food I",
    grid: [
      "ACKEE.M",
      "......A",
      "CURRY.N",
      "......G",
      "PATTY.O",
      ".......",
      "JERK...",
    ],
    clues: [
      { direction: "across", answer: "JERK", clue: "Spicy Jamaican grilling style" },
      { direction: "across", answer: "PATTY", clue: "Flaky Jamaican meat pastry" },
      { direction: "down", answer: "MANGO", clue: "Beloved Caribbean tropical fruit" },
      { direction: "across", answer: "ACKEE", clue: "Jamaican national fruit dish" },
      { direction: "across", answer: "CURRY", clue: "___ goat, Caribbean classic" },
    ],
  },
  {
    title: "Caribbean Food II",
    grid: [
      "GUAVA.B",
      "......A",
      "PONE..K",
      "......E",
      "RICE...",
      ".......",
      "OXTAIL.",
    ],
    clues: [
      { direction: "across", answer: "GUAVA", clue: "Tropical fruit used in jams" },
      { direction: "down", answer: "BAKE", clue: "___ and shark, Trini sandwich" },
      { direction: "across", answer: "OXTAIL", clue: "Braised Jamaican beef cut" },
      { direction: "across", answer: "PONE", clue: "Caribbean cassava pudding" },
      { direction: "across", answer: "RICE", clue: "___ and peas, Jamaican staple" },
    ],
  },
  {
    title: "Pan-African Leaders I",
    grid: [
      "M.M.N.O",
      "A.O.K.B",
      "N.I.R.A",
      "D...U..",
      "E.A.M..",
      "L.N.A..",
      "A.C.H..",
    ],
    clues: [
      { direction: "down", answer: "NKRUMAH", clue: "First president of Ghana" },
      { direction: "down", answer: "MANDELA", clue: "First Black president of South Africa" },
      { direction: "down", answer: "MOI", clue: "Long-serving Kenyan president Daniel" },
      { direction: "down", answer: "ANC", clue: "Mandela's political party, in brief" },
      { direction: "down", answer: "OBA", clue: "Yoruba title for a king" },
    ],
  },
  {
    title: "Pan-African Leaders II",
    grid: [
      "NYERERE",
      ".......",
      "GARVEY.",
      "......B",
      "TUTU..I",
      "......K",
      "TOURE.O",
    ],
    clues: [
      { direction: "across", answer: "NYERERE", clue: "Tanzania's founding father" },
      { direction: "across", answer: "GARVEY", clue: "Pan-African UNIA founder" },
      { direction: "down", answer: "BIKO", clue: "Black Consciousness leader" },
      { direction: "across", answer: "TUTU", clue: "Desmond ___, anti-apartheid archbishop" },
      { direction: "across", answer: "TOURE", clue: "S\u00e9kou ___, Guinean leader" },
    ],
  },
  {
    title: "African Mythology I",
    grid: [
      "E.O.M.A",
      "S.G.A.N",
      "H.U.M.A",
      "U.N.I.N",
      "......S",
      "ADO...I",
      "...OYA.",
    ],
    clues: [
      { direction: "down", answer: "ESHU", clue: "Yoruba messenger trickster orisha" },
      { direction: "down", answer: "MAMI", clue: "___ Wata, water spirit" },
      { direction: "across", answer: "ADO", clue: "Mythic Yoruba town of origins" },
      { direction: "down", answer: "ANANSI", clue: "Akan spider trickster" },
      { direction: "down", answer: "OGUN", clue: "Yoruba god of iron" },
      { direction: "across", answer: "OYA", clue: "Yoruba orisha of storms" },
    ],
  },
  {
    title: "African Mythology II",
    grid: [
      "E.O.I.Y",
      "S.Y.F.E",
      "U.A.A.M",
      "......O",
      "OSUN..J",
      "......A",
      "SANGO..",
    ],
    clues: [
      { direction: "down", answer: "IFA", clue: "Yoruba divination system" },
      { direction: "down", answer: "ESU", clue: "Trickster orisha of crossroads" },
      { direction: "across", answer: "OSUN", clue: "Yoruba river goddess" },
      { direction: "across", answer: "SANGO", clue: "Alternate spelling of the thunder orisha" },
      { direction: "down", answer: "OYA", clue: "Orisha of wind and storms" },
      { direction: "down", answer: "YEMOJA", clue: "Yoruba mother of waters" },
    ],
  },
  {
    title: "Reggae Icons I",
    grid: [
      "CLIFF.S",
      "......P",
      "BUNNY.E",
      "......A",
      "TOSH..R",
      ".......",
      "STEEL..",
    ],
    clues: [
      { direction: "across", answer: "BUNNY", clue: "___ Wailer, Wailers co-founder" },
      { direction: "across", answer: "STEEL", clue: "Burning Spear's ___ Pulse band" },
      { direction: "down", answer: "SPEAR", clue: "Burning ___, roots reggae great" },
      { direction: "across", answer: "TOSH", clue: "Peter ___, Wailers co-founder" },
      { direction: "across", answer: "CLIFF", clue: "Jimmy ___, 'The Harder They Come'" },
    ],
  },
  {
    title: "Reggae Icons II",
    grid: [
      "DUB...D",
      "......E",
      "ROOTS.K",
      "......K",
      "RASTA.E",
      "......R",
      "SKA....",
    ],
    clues: [
      { direction: "across", answer: "DUB", clue: "Stripped-down reggae remix style" },
      { direction: "across", answer: "ROOTS", clue: "___ reggae, conscious style" },
      { direction: "across", answer: "SKA", clue: "Reggae's upbeat predecessor" },
      { direction: "down", answer: "DEKKER", clue: "Desmond ___, 'Israelites' singer" },
      { direction: "across", answer: "RASTA", clue: "Reggae's spiritual movement" },
    ],
  },
  {
    title: "Black British Culture I",
    grid: [
      "BBK...S",
      "......K",
      "GRIME.E",
      "......P",
      "DAVE..T",
      "......A",
      "GRADE..",
    ],
    clues: [
      { direction: "across", answer: "GRIME", clue: "East London electronic rap genre" },
      { direction: "across", answer: "DAVE", clue: "'Psychodrama' British rapper" },
      { direction: "down", answer: "SKEPTA", clue: "Boy Better Know grime MC" },
      { direction: "across", answer: "BBK", clue: "Boy Better Know, abbreviated" },
      { direction: "across", answer: "GRADE", clue: "Wiley's '___ Eskimo' nickname era" },
    ],
  },
  {
    title: "Black British Culture II",
    grid: [
      "W.G.D.B",
      "I.I.R.R",
      "L.G.I.I",
      "E.G.L.X",
      "Y.S.L.T",
      "......O",
      "SOCA..N",
    ],
    clues: [
      { direction: "down", answer: "DRILL", clue: "Dark UK rap subgenre" },
      { direction: "across", answer: "SOCA", clue: "Caribbean carnival sound in Notting Hill" },
      { direction: "down", answer: "BRIXTON", clue: "South London Caribbean heartland" },
      { direction: "down", answer: "GIGGS", clue: "Peckham rap pioneer" },
      { direction: "down", answer: "WILEY", clue: "Godfather of grime" },
    ],
  },
  {
    title: "African Textiles I",
    grid: [
      "KENTE.W",
      "......A",
      "ADIRE.X",
      ".......",
      "KITENGE",
      ".......",
      "BOGOLAN",
    ],
    clues: [
      { direction: "across", answer: "KITENGE", clue: "East African printed wrap" },
      { direction: "across", answer: "KENTE", clue: "Ashanti woven royal cloth" },
      { direction: "down", answer: "WAX", clue: "___ print, vibrant African fabric" },
      { direction: "across", answer: "BOGOLAN", clue: "Malian mud cloth" },
      { direction: "across", answer: "ADIRE", clue: "Yoruba indigo resist-dyed cloth" },
    ],
  },
  {
    title: "African Textiles II",
    grid: [
      "INDIGO.",
      "......A",
      "W.W.B.S",
      "A.E.A.O",
      "X.A.T.O",
      "..V.I.K",
      "..E.K.E",
    ],
    clues: [
      { direction: "across", answer: "INDIGO", clue: "Deep blue traditional dye" },
      { direction: "down", answer: "WEAVE", clue: "To make cloth on a loom" },
      { direction: "down", answer: "BATIK", clue: "Wax-resist dyeing technique" },
      { direction: "down", answer: "ASOOKE", clue: "Yoruba hand-woven ceremonial cloth" },
      { direction: "down", answer: "WAX", clue: "___ print, popular African fabric" },
    ],
  },
  {
    title: "Soul and R&B I",
    grid: [
      "M.P.A.A",
      "A.R.L.R",
      "R.I...E",
      "V.N...T",
      "I.C...H",
      "N.E...A",
      "...SAM.",
    ],
    clues: [
      { direction: "down", answer: "PRINCE", clue: "'Purple Rain' icon" },
      { direction: "down", answer: "ARETHA", clue: "Franklin, Queen of Soul" },
      { direction: "down", answer: "MARVIN", clue: "___ Gaye, 'What's Going On'" },
      { direction: "across", answer: "SAM", clue: "___ Cooke, soul pioneer" },
      { direction: "down", answer: "AL", clue: "___ Green, 'Let's Stay Together'" },
    ],
  },
  {
    title: "Soul and R&B II",
    grid: [
      "C...S.S",
      "U...A.T",
      "R...M.A",
      "T.....X",
      "I.OTIS.",
      "S......",
      ".SOUL..",
    ],
    clues: [
      { direction: "down", answer: "SAM", clue: "___ Cooke, 'A Change Is Gonna Come'" },
      { direction: "down", answer: "CURTIS", clue: "___ Mayfield, 'Superfly'" },
      { direction: "across", answer: "OTIS", clue: "___ Redding, soul great" },
      { direction: "down", answer: "STAX", clue: "Memphis soul label" },
      { direction: "across", answer: "SOUL", clue: "African American music genre" },
    ],
  },
  {
    title: "Ancient Civilizations I",
    grid: [
      "M.N.A.K",
      "A.U.X.U",
      "L.B.U.S",
      "I.I.M.H",
      "..A....",
      "...NOK.",
      "GAO....",
    ],
    clues: [
      { direction: "down", answer: "NUBIA", clue: "Ancient land along the upper Nile" },
      { direction: "down", answer: "KUSH", clue: "Nubian kingdom south of Egypt" },
      { direction: "across", answer: "NOK", clue: "Ancient Nigerian terracotta culture" },
      { direction: "down", answer: "MALI", clue: "Empire of Mansa Musa" },
      { direction: "down", answer: "AXUM", clue: "Ancient Ethiopian kingdom" },
      { direction: "across", answer: "GAO", clue: "Songhai Empire capital city" },
    ],
  },
  {
    title: "Ancient Civilizations II",
    grid: [
      "N.E.N.M",
      "O.G.I.E",
      "K.Y.L.R",
      "..P.E.O",
      "..T...E",
      ".......",
      "GHANA..",
    ],
    clues: [
      { direction: "down", answer: "EGYPT", clue: "Civilization of the pyramids" },
      { direction: "across", answer: "GHANA", clue: "Medieval West African gold empire" },
      { direction: "down", answer: "MEROE", clue: "Kushite capital with pyramids" },
      { direction: "down", answer: "NILE", clue: "River cradle of civilizations" },
      { direction: "down", answer: "NOK", clue: "Ancient Nigerian terracotta culture" },
    ],
  },
  {
    title: "African Wildlife I",
    grid: [
      "CHEETAH",
      ".......",
      "GORILLA",
      ".......",
      "...LION",
      "GNU....",
      "...APE.",
    ],
    clues: [
      { direction: "across", answer: "GORILLA", clue: "Great ape of central Africa" },
      { direction: "across", answer: "GNU", clue: "Another name for the wildebeest" },
      { direction: "across", answer: "CHEETAH", clue: "Fastest land animal" },
      { direction: "across", answer: "LION", clue: "King of the savanna" },
      { direction: "across", answer: "APE", clue: "Gorilla, for one" },
    ],
  },
  {
    title: "African Wildlife II",
    grid: [
      "RHINO..",
      ".......",
      "GIRAFFE",
      ".......",
      "HYENA..",
      ".......",
      "ASS.GNU",
    ],
    clues: [
      { direction: "across", answer: "ASS", clue: "Wild African equine relative" },
      { direction: "across", answer: "GIRAFFE", clue: "Tallest land animal" },
      { direction: "across", answer: "GNU", clue: "Wildebeest, by another name" },
      { direction: "across", answer: "HYENA", clue: "Laughing scavenger" },
      { direction: "across", answer: "RHINO", clue: "Horned grazing giant" },
    ],
  },
  {
    title: "Hip-Hop Legends I",
    grid: [
      "T.RAKIM",
      "U......",
      "P.NAS.J",
      "A.....A",
      "C.DRE.Y",
      "......Z",
      "BIGGIE.",
    ],
    clues: [
      { direction: "down", answer: "TUPAC", clue: "Shakur, West Coast icon" },
      { direction: "across", answer: "DRE", clue: "Dr. ___, West Coast producer" },
      { direction: "across", answer: "RAKIM", clue: "Eric B. and ___ lyricist" },
      { direction: "across", answer: "BIGGIE", clue: "The Notorious B.I.G." },
      { direction: "across", answer: "NAS", clue: "'Illmatic' Queensbridge MC" },
      { direction: "down", answer: "JAYZ", clue: "Brooklyn mogul, 'Blueprint' rapper" },
    ],
  },
  {
    title: "Hip-Hop Legends II",
    grid: [
      "M.K.R.E",
      "O.R.A.V",
      "S.S.K.E",
      "D.O.I..",
      "E.N.M..",
      "F.E....",
      "...RUN.",
    ],
    clues: [
      { direction: "down", answer: "KRSONE", clue: "Boogie Down Productions MC" },
      { direction: "down", answer: "MOSDEF", clue: "Brooklyn MC, Black Star half" },
      { direction: "down", answer: "RAKIM", clue: "Eric B. and ___, lyrical pioneer" },
      { direction: "down", answer: "EVE", clue: "'Let Me Blow Ya Mind' rapper" },
      { direction: "across", answer: "RUN", clue: "___-DMC, hip-hop trailblazers" },
    ],
  },
  {
    title: "Black Inventors I",
    grid: [
      "CARVER.",
      "......M",
      "M.D.B.O",
      "A.R.A.R",
      "E.E.T.G",
      "..W.H.A",
      "......N",
    ],
    clues: [
      { direction: "across", answer: "CARVER", clue: "George Washington ___, peanut scientist" },
      { direction: "down", answer: "DREW", clue: "Charles ___, blood bank pioneer" },
      { direction: "down", answer: "MORGAN", clue: "Garrett ___, traffic signal inventor" },
      { direction: "down", answer: "MAE", clue: "___ Jemison, astronaut" },
      { direction: "down", answer: "BATH", clue: "Patricia ___, laser eye surgeon" },
    ],
  },
  {
    title: "Black Inventors II",
    grid: [
      "WOODS.B",
      "......A",
      "DREW..T",
      "......H",
      "WALKER.",
      ".......",
      "BOYKIN.",
    ],
    clues: [
      { direction: "across", answer: "DREW", clue: "Charles ___, blood bank pioneer" },
      { direction: "across", answer: "WOODS", clue: "Granville ___, railway telegraph inventor" },
      { direction: "down", answer: "BATH", clue: "Patricia ___, laser cataract surgeon" },
      { direction: "across", answer: "WALKER", clue: "Madam C.J. ___, hair care magnate" },
      { direction: "across", answer: "BOYKIN", clue: "Otis ___, electronics inventor" },
    ],
  },
  {
    title: "African Hairstyles I",
    grid: [
      "FADE..B",
      "....A.A",
      "T.P.F.N",
      "W.U.R.T",
      "I.F.O.U",
      "S.F....",
      "T..LOCS",
    ],
    clues: [
      { direction: "across", answer: "FADE", clue: "Tapered haircut" },
      { direction: "down", answer: "AFRO", clue: "Rounded natural hairstyle" },
      { direction: "down", answer: "BANTU", clue: "___ knots, coiled buns" },
      { direction: "down", answer: "PUFF", clue: "Gathered natural hair style" },
      { direction: "down", answer: "TWIST", clue: "Two-strand styled hair" },
      { direction: "across", answer: "LOCS", clue: "Rope-like matted strands" },
    ],
  },
  {
    title: "African Hairstyles II",
    grid: [
      "KNOTS.G",
      "......H",
      "......E",
      "BANTU.R",
      "......I",
      "FRO....",
      "...PUFF",
    ],
    clues: [
      { direction: "across", answer: "KNOTS", clue: "Bantu ___, coiled buns" },
      { direction: "across", answer: "BANTU", clue: "___ knots, coiled hair buns" },
      { direction: "down", answer: "GHERI", clue: "Variant spelling of the curl style" },
      { direction: "across", answer: "FRO", clue: "Short for afro" },
      { direction: "across", answer: "PUFF", clue: "Gathered natural hair style" },
    ],
  },
  {
    title: "Diaspora Cities I",
    grid: [
      ".M.H.B.",
      ".I.A.A.",
      ".A.R.H.",
      ".M.L.I.",
      ".I.E.A.",
      "...M...",
      "NYC.RIO",
    ],
    clues: [
      { direction: "down", answer: "HARLEM", clue: "NYC neighborhood of the Renaissance" },
      { direction: "across", answer: "NYC", clue: "Harlem's metropolis, in brief" },
      { direction: "down", answer: "MIAMI", clue: "City of 'Moonlight'" },
      { direction: "across", answer: "RIO", clue: "Brazilian city of Afro-Carnival" },
      { direction: "down", answer: "BAHIA", clue: "Brazilian state of Salvador" },
    ],
  },
  {
    title: "Diaspora Cities II",
    grid: [
      "P.A.L.A",
      "A.C.A.T",
      "R.C.G.L",
      "I.R.O.A",
      "S.A.S.N",
      "......T",
      "DAKAR.A",
    ],
    clues: [
      { direction: "across", answer: "DAKAR", clue: "Senegal's capital" },
      { direction: "down", answer: "ACCRA", clue: "Year of Return host capital" },
      { direction: "down", answer: "ATLANTA", clue: "US Black cultural hub, hip-hop city" },
      { direction: "down", answer: "LAGOS", clue: "Nigeria's megacity" },
      { direction: "down", answer: "PARIS", clue: "City of Baldwin's exile" },
    ],
  },
  {
    title: "African Coffee and Tea I",
    grid: [
      "B.BEAN.",
      "U......",
      "N.KOLA.",
      "A......",
      ".CHAI..",
      ".......",
      "ROOIBOS",
    ],
    clues: [
      { direction: "down", answer: "BUNA", clue: "Ethiopian word for coffee" },
      { direction: "across", answer: "KOLA", clue: "Caffeine-rich West African nut" },
      { direction: "across", answer: "ROOIBOS", clue: "South African red bush tea" },
      { direction: "across", answer: "BEAN", clue: "Roasted coffee unit" },
      { direction: "across", answer: "CHAI", clue: "Spiced masala tea" },
    ],
  },
  {
    title: "African Coffee and Tea II",
    grid: [
      "BEAN..Z",
      "......O",
      "MINT..B",
      "......O",
      "JEBENA.",
      ".......",
      "MASALA.",
    ],
    clues: [
      { direction: "across", answer: "MINT", clue: "Maghrebi ___ tea herb" },
      { direction: "across", answer: "BEAN", clue: "Roasted coffee unit" },
      { direction: "across", answer: "JEBENA", clue: "Ethiopian coffee pot" },
      { direction: "across", answer: "MASALA", clue: "___ chai spice blend" },
      { direction: "down", answer: "ZOBO", clue: "Nigerian hibiscus drink" },
    ],
  },
  {
    title: "African Sports Legends I",
    grid: [
      "O.K.E.S",
      "K.A.T.E",
      "O.N.O.M",
      "C.U.O.E",
      "H.....N",
      "A.....Y",
      ".WEAH.A",
    ],
    clues: [
      { direction: "down", answer: "OKOCHA", clue: "Jay-Jay ___, skillful midfielder" },
      { direction: "down", answer: "KANU", clue: "Nwankwo ___, Nigerian striker" },
      { direction: "down", answer: "ETOO", clue: "Samuel ___, Cameroon striker" },
      { direction: "down", answer: "SEMENYA", clue: "Caster ___, 800m champion" },
      { direction: "across", answer: "WEAH", clue: "George ___, Ballon d'Or and president" },
    ],
  },
  {
    title: "African Sports Legends II",
    grid: [
      "GEBRE.S",
      "......A",
      "MANE..L",
      "......A",
      "MILLA.H",
      ".......",
      "BOLT...",
    ],
    clues: [
      { direction: "across", answer: "MILLA", clue: "Roger ___, Cameroon icon" },
      { direction: "down", answer: "SALAH", clue: "Egyptian Liverpool forward" },
      { direction: "across", answer: "GEBRE", clue: "Haile ___selassie, distance runner" },
      { direction: "across", answer: "MANE", clue: "Sadio ___, Senegalese star" },
      { direction: "across", answer: "BOLT", clue: "Jamaican sprint king" },
    ],
  },
  {
    title: "Jazz Greats I",
    grid: [
      "N.MONK.",
      "I......",
      "N.BIRD.",
      "A.....D",
      ".ELLA.U",
      "......K",
      "BASIE.E",
    ],
    clues: [
      { direction: "down", answer: "NINA", clue: "___ Simone, 'Feeling Good'" },
      { direction: "across", answer: "BASIE", clue: "Count ___, swing bandleader" },
      { direction: "across", answer: "BIRD", clue: "Charlie Parker's nickname" },
      { direction: "across", answer: "MONK", clue: "Thelonious ___, pianist" },
      { direction: "across", answer: "ELLA", clue: "___ Fitzgerald, scat queen" },
      { direction: "down", answer: "DUKE", clue: "___ Ellington, bandleader" },
    ],
  },
  {
    title: "Jazz Greats II",
    grid: [
      "BASIE.E",
      "......L",
      "BEBOP.L",
      "......A",
      "MINGUS.",
      ".......",
      "BILLIE.",
    ],
    clues: [
      { direction: "across", answer: "MINGUS", clue: "Charles ___, bassist composer" },
      { direction: "across", answer: "BEBOP", clue: "Fast 1940s jazz style" },
      { direction: "across", answer: "BILLIE", clue: "___ Holiday, 'Strange Fruit'" },
      { direction: "across", answer: "BASIE", clue: "Count ___, swing bandleader" },
      { direction: "down", answer: "ELLA", clue: "___ Fitzgerald, scat queen" },
    ],
  },
  {
    title: "African Languages I",
    grid: [
      "T.H.W.S",
      "W.A.O.W",
      "I.U.L.A",
      "..S.O.H",
      "..A.F.I",
      "......L",
      "ZULU..I",
    ],
    clues: [
      { direction: "down", answer: "HAUSA", clue: "Widely spoken in northern Nigeria" },
      { direction: "down", answer: "SWAHILI", clue: "East African lingua franca" },
      { direction: "down", answer: "TWI", clue: "Akan language of Ghana" },
      { direction: "down", answer: "WOLOF", clue: "Major language of Senegal" },
      { direction: "across", answer: "ZULU", clue: "Nguni language of South Africa" },
    ],
  },
  {
    title: "African Languages II",
    grid: [
      "OROMO.A",
      "......M",
      "XHOSA.H",
      "......A",
      "WOLOF.R",
      "......I",
      "TWI...C",
    ],
    clues: [
      { direction: "down", answer: "AMHARIC", clue: "Official language of Ethiopia" },
      { direction: "across", answer: "WOLOF", clue: "Major language of Senegal" },
      { direction: "across", answer: "XHOSA", clue: "Click-using South African language" },
      { direction: "across", answer: "OROMO", clue: "Widely spoken Ethiopian language" },
      { direction: "across", answer: "TWI", clue: "Akan language of Ghana" },
    ],
  },
  {
    title: "Black Women in Music I",
    grid: [
      "S.S.J.K",
      "Z.A.I.E",
      "A.D.L.L",
      "..E.L.I",
      "......S",
      "LAURYN.",
      ".......",
    ],
    clues: [
      { direction: "down", answer: "KELIS", clue: "'Milkshake' R&B singer" },
      { direction: "down", answer: "SADE", clue: "'Smooth Operator' singer" },
      { direction: "down", answer: "JILL", clue: "___ Scott, neo-soul singer" },
      { direction: "across", answer: "LAURYN", clue: "___ Hill, 'Miseducation'" },
      { direction: "down", answer: "SZA", clue: "'SOS' R&B star" },
    ],
  },
  {
    title: "Black Women in Music II",
    grid: [
      "TINA.A.",
      ".....R.",
      "SZA..I.",
      ".......",
      "JANET..",
      ".......",
      "WHITNEY",
    ],
    clues: [
      { direction: "down", answer: "ARI", clue: "___ Lennox, R&B singer" },
      { direction: "across", answer: "SZA", clue: "'SOS' R&B star" },
      { direction: "across", answer: "WHITNEY", clue: "___ Houston, 'I Will Always Love You'" },
      { direction: "across", answer: "JANET", clue: "___ Jackson, 'Rhythm Nation'" },
      { direction: "across", answer: "TINA", clue: "___ Turner, rock and soul queen" },
    ],
  },
  {
    title: "African Dance I",
    grid: [
      "ETIGHI.",
      "......A",
      "SHAKU.D",
      "......O",
      "ZANKU.W",
      "......A",
      "AZONTO.",
    ],
    clues: [
      { direction: "across", answer: "ZANKU", clue: "Nigerian leg-work dance" },
      { direction: "across", answer: "ETIGHI", clue: "Nigerian Akwa Ibom dance" },
      { direction: "down", answer: "ADOWA", clue: "Ashanti graceful dance" },
      { direction: "across", answer: "AZONTO", clue: "Ghanaian dance craze" },
      { direction: "across", answer: "SHAKU", clue: "___ shaku, Nigerian dance" },
    ],
  },
  {
    title: "African Dance II",
    grid: [
      "SHAKU.S",
      "......O",
      "P.S.Z.U",
      "A.B.A.K",
      "T.W.N.O",
      "A.L.K.U",
      "....U.S",
    ],
    clues: [
      { direction: "across", answer: "SHAKU", clue: "___ shaku, Nigerian dance move" },
      { direction: "down", answer: "ZANKU", clue: "Nigerian leg-work dance" },
      { direction: "down", answer: "SOUKOUS", clue: "Congolese dance music" },
      { direction: "down", answer: "PATA", clue: "___ pata, Miriam Makeba dance hit" },
      { direction: "down", answer: "SBWL", clue: "SA amapiano slang shout" },
    ],
  },
  {
    title: "Caribbean Music I",
    grid: [
      "K.S.M.D",
      "O.O.E.U",
      "M.C.N.B",
      "P.A.T..",
      "A...O.S",
      "......K",
      "ZOUK..A",
    ],
    clues: [
      { direction: "down", answer: "DUB", clue: "Stripped-down reggae remix style" },
      { direction: "down", answer: "MENTO", clue: "Rural Jamaican folk style" },
      { direction: "across", answer: "ZOUK", clue: "French Antilles dance genre" },
      { direction: "down", answer: "SOCA", clue: "Energetic carnival party genre" },
      { direction: "down", answer: "KOMPA", clue: "Haitian dance music" },
      { direction: "down", answer: "SKA", clue: "Upbeat Jamaican forerunner of reggae" },
    ],
  },
  {
    title: "Caribbean Music II",
    grid: [
      "S.R.M.B",
      "O.U.E.A",
      "C.M.N.C",
      "A.B.T.H",
      "..A.O.A",
      "......T",
      "SALSA.A",
    ],
    clues: [
      { direction: "down", answer: "MENTO", clue: "Rural Jamaican folk style" },
      { direction: "down", answer: "BACHATA", clue: "Dominican guitar genre" },
      { direction: "across", answer: "SALSA", clue: "Latin dance music" },
      { direction: "down", answer: "RUMBA", clue: "Afro-Cuban rhythm" },
      { direction: "down", answer: "SOCA", clue: "Carnival party music" },
    ],
  },
  {
    title: "Kingdom Treasures I",
    grid: [
      "GOLD..B",
      "......E",
      "MASK..A",
      "......D",
      "IVORY.S",
      ".......",
      "BRONZE.",
    ],
    clues: [
      { direction: "across", answer: "MASK", clue: "Carved ceremonial face piece" },
      { direction: "across", answer: "IVORY", clue: "Carved tusk material of old courts" },
      { direction: "down", answer: "BEADS", clue: "Maasai colorful neck adornment" },
      { direction: "across", answer: "BRONZE", clue: "Benin ___, famous African plaques" },
      { direction: "across", answer: "GOLD", clue: "Ashanti ___ weights" },
    ],
  },
  {
    title: "Kingdom Treasures II",
    grid: [
      "MASK..A",
      "......K",
      "CROWN.U",
      "......A",
      "BRASS.B",
      "......A",
      "COWRIE.",
    ],
    clues: [
      { direction: "across", answer: "BRASS", clue: "Alloy of many Benin castings" },
      { direction: "across", answer: "MASK", clue: "Carved ceremonial face piece" },
      { direction: "down", answer: "AKUABA", clue: "Akan fertility doll" },
      { direction: "across", answer: "COWRIE", clue: "Shell once used as currency" },
      { direction: "across", answer: "CROWN", clue: "Yoruba beaded royal headpiece" },
    ],
  },
  {
    title: "Black Cinema I",
    grid: [
      "W..S.G.",
      "I..E.L.",
      "Z..L.O.",
      "...M.R.",
      "...A.Y.",
      "US.....",
      "..ROOTS",
    ],
    clues: [
      { direction: "down", answer: "SELMA", clue: "DuVernay's MLK march film" },
      { direction: "down", answer: "GLORY", clue: "Civil War film with Denzel" },
      { direction: "down", answer: "WIZ", clue: "The ___, Black 'Wizard of Oz'" },
      { direction: "across", answer: "US", clue: "Jordan Peele horror film" },
      { direction: "across", answer: "ROOTS", clue: "Alex Haley landmark miniseries" },
    ],
  },
  {
    title: "Black Cinema II",
    grid: [
      "ROOTS.F",
      "......E",
      "C.S.G.N",
      "O.H.L.C",
      "L.A.O.E",
      "O.F.R.S",
      "R.T.Y..",
    ],
    clues: [
      { direction: "across", answer: "ROOTS", clue: "Landmark Alex Haley miniseries" },
      { direction: "down", answer: "COLOR", clue: "The ___ Purple, Spielberg film" },
      { direction: "down", answer: "FENCES", clue: "Denzel Washington August Wilson film" },
      { direction: "down", answer: "SHAFT", clue: "1971 blaxploitation classic" },
      { direction: "down", answer: "GLORY", clue: "Civil War film with Denzel" },
    ],
  },
  {
    title: "African Markets I",
    grid: [
      "S.S.W.M",
      "T.O.A.A",
      "A.U.R.R",
      "L.K.E.K",
      "L...S.E",
      "......T",
      "MAKOLA.",
    ],
    clues: [
      { direction: "down", answer: "MARKET", clue: "Place to trade goods" },
      { direction: "across", answer: "MAKOLA", clue: "Bustling Accra market" },
      { direction: "down", answer: "STALL", clue: "Vendor's market stand" },
      { direction: "down", answer: "WARES", clue: "Goods sold at a stall" },
      { direction: "down", answer: "SOUK", clue: "North African covered market" },
    ],
  },
  {
    title: "African Markets II",
    grid: [
      "B.TRADE",
      "A......",
      "Z.STALL",
      "A......",
      "A.WARES",
      "R......",
      ".HAGGLE",
    ],
    clues: [
      { direction: "down", answer: "BAZAAR", clue: "Middle Eastern style market" },
      { direction: "across", answer: "HAGGLE", clue: "Bargain over a market price" },
      { direction: "across", answer: "TRADE", clue: "Commerce at a market" },
      { direction: "across", answer: "STALL", clue: "Vendor's market stand" },
      { direction: "across", answer: "WARES", clue: "Goods sold at a stall" },
    ],
  },
];

// ── WordPress cache and rotation tracking ────────────────────────────────────
const WP_URL  = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_KEY = process.env.CULTURE_API_SECRET ?? "";

async function fetchCrosswordFromWP(date: string): Promise<typeof PUZZLES[0] | null> {
  try {
    const res = await fetch(`${WP_URL}/wp-json/culture/v1/games/crossword-daily?date=${date}`, {
      headers: { "x-api-key": API_KEY },
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.puzzle ?? null;
  } catch { return null; }
}

async function saveCrosswordToWP(puzzle: typeof PUZZLES[0], date: string): Promise<void> {
  try {
    await fetch(`${WP_URL}/wp-json/culture/v1/games/crossword-daily`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
      body: JSON.stringify({ date, puzzle }),
    });
  } catch { /* non-fatal */ }
}

// ── Build cell grid from string grid ─────────────────────────────────────────
function buildCells(gridLines: string[]): CrosswordCell[][] {
  const size = gridLines.length;
  return gridLines.map(row =>
    row.split("").map(ch => ({
      letter: ch === "." ? "" : ch.toUpperCase(), // always uppercase — user input is always uppercase
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
        // Case-insensitive match — clue answers from Gemini may be mixed case
        const matchingClue = rawClues.find(cl => cl.direction === "across" && cl.answer.toUpperCase() === word.toUpperCase());
        if (matchingClue) {
          usedAcross = true;
          clues.push({ ...matchingClue, number: nextNumber, row: r, col: c, length: word.length });
        }
      }

      if (startsDown) {
        let word = "";
        for (let i = r; i < size && !cells[i][c].black; i++) word += cells[i][c].letter;
        // Case-insensitive match
        const matchingClue = rawClues.find(cl => cl.direction === "down" && cl.answer.toUpperCase() === word.toUpperCase());
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


// ── Rotation tracking — no puzzle repeats until all have been shown ──────────
async function getUsedPuzzleIndices(): Promise<number[]> {
  try {
    const res = await fetch(`${WP_URL}/wp-json/culture/v1/games/crossword-rotation`, {
      headers: { "x-api-key": API_KEY },
      next: { revalidate: 0 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.used) ? data.used : [];
  } catch { return []; }
}

async function markPuzzleUsed(idx: number, totalPuzzles: number): Promise<void> {
  try {
    await fetch(`${WP_URL}/wp-json/culture/v1/games/crossword-rotation`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
      body: JSON.stringify({ index: idx, total: totalPuzzles }),
    });
  } catch { /* non-fatal */ }
}

async function pickRotatedPuzzleIndex(seedKey: string): Promise<number> {
  const used = await getUsedPuzzleIndices();
  const total = PUZZLES.length;
  const rng = makeRng(dateToSeed(seedKey));

  // Build pool of unused indices
  let available = Array.from({ length: total }, (_, i) => i).filter(i => !used.includes(i));
  // If all puzzles have been shown, reset rotation
  if (available.length === 0) {
    available = Array.from({ length: total }, (_, i) => i);
  }

  // Deterministic pick from available pool
  const pick = Math.floor(rng() * available.length);
  const idx = available[pick];

  // Record this puzzle as used (fire and forget)
  markPuzzleUsed(idx, total);

  return idx;
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const isRandom = searchParams.get("random") === "true";
  const slot = Math.min(5, Math.max(1, parseInt(searchParams.get("slot") ?? "1") || 1));
  const date = new Date().toISOString().slice(0, 10);
  // Unique seed per day+slot prevents any puzzle repeating across slots or days
  const seedKey = isRandom ? `random-${Date.now()}` : `${date}-slot-${slot}`;

  let raw: { title: string; grid: string[]; clues: Omit<CrosswordClue, "number" | "row" | "col" | "length">[] } | null = null;

  // Try WordPress cache first (slot 1 only — the shared daily game)
  if (!isRandom && slot === 1) {
    raw = await fetchCrosswordFromWP(date);
  }

  // Try Gemini if not cached (slot 1) or for Pro slots 2-5
  if (!raw && process.env.GEMINI_API_KEY) {
    const geminiPuzzle = await generateCrosswordWithGemini();
    if (geminiPuzzle) {
      raw = {
        title: geminiPuzzle.title,
        grid: geminiPuzzle.grid,
        clues: geminiPuzzle.clues.map(c => ({ direction: c.direction, answer: c.answer.toUpperCase(), clue: c.clue }))
      };

      // Only cache slot 1 to WordPress (shared daily game)
      if (!isRandom && slot === 1) {
        await saveCrosswordToWP(raw, date);
      }
    }
  }

  // Fallback to pre-built bank with rotation tracking
  if (!raw) {
    let idx: number;
    if (isRandom) {
      idx = Math.floor(Math.random() * PUZZLES.length);
    } else {
      idx = await pickRotatedPuzzleIndex(seedKey);
    }
    raw = PUZZLES[idx];
  }

  const size = raw.grid.length;
  const cells = buildCells(raw.grid);
  const clues = numberAndClues(cells, raw.clues, size);

  const puzzle: CrosswordPuzzle = { size, cells, clues, title: raw.title };
  return NextResponse.json({ date, slot, puzzle });
}
