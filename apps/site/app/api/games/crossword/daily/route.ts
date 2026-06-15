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
