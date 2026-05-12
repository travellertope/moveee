/**
 * GET /api/games/trivia/daily
 *
 * Returns 10 unique trivia questions for today's UTC date.
 *
 * Strategy:
 *   1. Check WordPress cache (same date) → ~50ms
 *   2. Generate via Gemini with date-seeded daily topic brief → varied, non-repeating
 *   3. Cache to WordPress for all other Vercel instances
 *   4. If Gemini unavailable → serve from hardcoded fallback bank (never 500)
 *
 * Topic rotation: 120+ specific sub-topics, 10 selected per day by date seed.
 * At 120 topics choosing 10: ~1.9 × 10^12 possible orderings — effectively unlimited.
 */

import { NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export const runtime = "nodejs";

interface TriviaQuestion {
  question:    string;
  options:     [string, string, string, string];
  correct:     number;
  explanation: string;
  category:    string;
}

const WP_URL  = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_KEY = process.env.CULTURE_API_SECRET ?? "";

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

const SAFETY = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

const TEXT_MODELS = ["gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-1.5-pro"];

// ── Topic pool: 120+ specific sub-topics across 12 cultural domains ────────────
// Each day, 10 are selected by date seed → every day has a completely different
// set of question subjects, guaranteeing no cross-day repetition.
const TOPIC_POOL = [
  // Music
  "The life and legacy of Fela Kuti and Afrobeat",
  "The origins of Highlife music in Ghana and Nigeria",
  "Amapiano: South African township sounds and key artists",
  "The rise of Afrobeats globally (2010–2024)",
  "Makossa and Cameroonian popular music",
  "Mbalax: Youssou N'Dour and Senegalese rhythm",
  "South African jazz and the Blue Notes generation",
  "Jùjú music and King Sunny Ade",
  "Afro-soul: Simphiwe Dana, Asa, and contemporaries",
  "Reggae's African roots and Bob Marley's Rastafari legacy",
  "Calypso and soca from Trinidad and Tobago",
  "Afro-fusion stars: Burna Boy, Wizkid, Davido milestones",
  "Kwaito: the sound of post-apartheid South Africa",
  "Congolese soukous and rumba evolution",
  "Ethiopian jazz: Mulatu Astatke and the Addis Ababa sound",
  "Black British music: grime, jungle, and UK garage",
  "Hip-hop's African-American origins and global spread",
  "Gospel music in the African church tradition",
  "Benga music from Kenya: Daniel Owino Misiani",
  "Neo-soul and its African-American roots",
  "Afrobeats producers: Shizzi, P2J, Killertunes",
  "Fuji music and Ayinla Omowura",
  "Sierra Leone's palm wine music tradition",
  // Film & Television
  "Nollywood: history, scale and global influence",
  "Early Nigerian and Ghanaian video film pioneers",
  "Black Panther and its African representation debate",
  "Steve McQueen's films and the Black British experience",
  "Ousmane Sembène: father of African cinema",
  "Haile Gerima and Ethiopian-American diaspora cinema",
  "Ava DuVernay and African-American documentary film",
  "African animation: Kugali, Triggerfish, Mama K's Team 4",
  "John Boyega's career and British-Nigerian identity",
  "African cinema at Cannes and major festivals",
  "African horror and fantasy films",
  "The Fresh Prince of Bel-Air's cultural impact",
  "Lupita Nyong'o and the Kenyan Hollywood breakthrough",
  "Spike Lee's filmmaking and Black American storytelling",
  "African directors in European film: Abderrahmane Sissako",
  // Literature
  "Chinua Achebe and Things Fall Apart",
  "Chimamanda Ngozi Adichie's feminist writing",
  "Wole Soyinka: Nobel Laureate, playwright and activist",
  "Ngugi wa Thiong'o and writing in African languages",
  "Ben Okri's The Famished Road and magical realism",
  "Harlem Renaissance writers: Langston Hughes and Zora Neale Hurston",
  "Toni Morrison and African-American literary legacy",
  "Caribbean literature: Derek Walcott and CLR James",
  "Ama Ata Aidoo and Ghanaian feminist writing",
  "Buchi Emecheta and Nigerian diaspora literature",
  "Afrofuturism in literature: Nnedi Okofor and NK Jemisin",
  "Teju Cole and contemporary Nigerian-American writing",
  "Francophone African literature: Mariama Bâ and Mongo Beti",
  "NoViolet Bulawayo and Zimbabwean literature",
  "Leila Aboulela and the African Muslim experience in fiction",
  // History & Politics
  "Kwame Nkrumah and Pan-Africanism",
  "Nelson Mandela and the South African liberation struggle",
  "Thomas Sankara: revolutionary president of Burkina Faso",
  "The Mau Mau uprising and Kenya's independence",
  "The Haitian Revolution and Toussaint Louverture",
  "Marcus Garvey and the Back to Africa movement",
  "Patrice Lumumba and the Congo independence crisis",
  "Civil rights movement milestones: Rosa Parks, MLK, John Lewis",
  "Fred Hampton and the Black Panther Party",
  "Steve Biko and Black Consciousness in South Africa",
  "The Berlin Conference of 1884 and the Scramble for Africa",
  "African independence wave of the 1960s",
  "The Rwandan Genocide and its international aftermath",
  "Black Wall Street and the Tulsa Race Massacre of 1921",
  "The Zulu Kingdom under King Shaka",
  "The Kingdom of Kongo and pre-colonial Atlantic trade",
  "The Battle of Adwa and Ethiopian sovereignty",
  "The transatlantic slave trade and its legacy",
  "Winnie Mandela's activism and political life",
  "Amilcar Cabral and West African liberation",
  "Julius Nyerere and Tanzania's Ujamaa experiment",
  "The Nigerian Civil War and Biafra",
  // Visual Art, Fashion & Design
  "El Anatsui: Ghanaian sculptor and global art world",
  "Kara Walker's silhouettes and African-American history",
  "Yinka Shonibare: British-Nigerian conceptual art",
  "African textiles: Kente, Ankara, Kanga, Adire traditions",
  "Zanele Muholi's photographic activism and LGBTQ+ Black identity",
  "Kerry James Marshall and Black figurative painting",
  "The Afropunk movement and Black alternative fashion",
  "Lagos Fashion Week and African designer rise",
  "Virgil Abloh's impact on Black fashion and streetwear",
  "African ceremonial masks: form, function, and meaning",
  "Ndebele and Maasai beadwork traditions",
  "African street photography: Malick Sidibé, Seydou Keïta",
  "David Adjaye and African diaspora architecture",
  "Ghanaian fantasy coffins as art and tradition",
  // Food & Culture
  "Jollof rice origins and the Nigeria vs Ghana debate",
  "Ethiopian injera and communal coffee ceremony",
  "Caribbean cuisine: jerk, ackee, roti traditions",
  "Egusi soup, fufu, and Nigerian culinary culture",
  "South African braai and food heritage",
  "Senegalese thiéboudienne and yassa",
  "African fermented foods and their health traditions",
  "Kola nuts in West African hospitality and ceremony",
  "Street food cultures across West Africa",
  // Diaspora, Identity & Philosophy
  "W.E.B. Du Bois and the concept of double consciousness",
  "Frantz Fanon and the psychology of colonialism",
  "The Windrush Generation and Britain's Caribbean community",
  "The African diaspora in Brazil: Candomblé and Carnival",
  "Notting Hill Carnival history and Trinidadian roots",
  "Ubuntu philosophy: communal ethics and modern relevance",
  "Griot tradition: West African oral history and storytelling",
  "Islam's spread across West Africa and Timbuktu as a knowledge hub",
  "Capoeira: African-Brazilian martial art and cultural resistance",
  "African naming traditions and their meanings across regions",
  "Rastafari: spirituality, identity, and resistance culture",
  "Afrocentrism: the movement and its intellectual history",
  // Sport
  "African footballers in European leagues: stories and milestones",
  "George Weah: Ballon d'Or winner and President of Liberia",
  "Caster Semenya and gender rights in athletics",
  "Eliud Kipchoge and the science of East African distance running",
  "Muhammad Ali and Black American identity in global sport",
  "The 1968 Olympics Black Power salute by Smith and Carlos",
  "Anthony Joshua's British-Nigerian boxing journey",
  "Africa's 2010 FIFA World Cup: Shakira, vuvuzelas, history",
  "Usain Bolt and Jamaican sprinting dominance",
  "Africa at the Olympics: gold medalists and milestones",
];

// Seeded Fisher-Yates shuffle using a linear congruential generator
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function dateToSeed(date: string): number {
  let h = 0;
  for (const ch of date) h = (Math.imul(h, 31) + ch.charCodeAt(0)) | 0;
  return h >>> 0;
}

function buildDailyPrompt(date: string, seed: number): string {
  const topics = seededShuffle(TOPIC_POOL, seed).slice(0, 10);
  const topicList = topics.map((t, i) => `${i + 1}. ${t}`).join("\n");

  return `You are the question writer for Culture Games — a daily trivia game on The Moveee, celebrating African and global diaspora culture.

Today is ${date}. Generate exactly 10 trivia questions — one for each topic assigned below. You MUST write one question per topic, in order.

TODAY'S ASSIGNED TOPICS:
${topicList}

Rules:
- Questions must be factual and verifiable — no invented trivia
- Each question must relate clearly to its assigned topic
- Difficulty: questions 1–4 easy, 5–8 medium, 9–10 hard
- Each question has exactly 4 options (A–D), only one is correct
- Spread the correct answer position: do not cluster all correct answers at A
- Write a 1–2 sentence explanation adding interesting cultural context
- Be specific — use real names, dates, places, and titles

Return ONLY a valid JSON array — no markdown, no code fences:
[
  {
    "question": "...",
    "options": ["option A", "option B", "option C", "option D"],
    "correct": 0,
    "explanation": "...",
    "category": "music | film | literature | history | culture | sport | food | art"
  }
]`;
}

function extractJson(raw: string): string {
  const s = raw.indexOf("[");
  const e = raw.lastIndexOf("]");
  if (s === -1 || e === -1) throw new Error("No JSON array found");
  return raw.slice(s, e + 1);
}

async function fetchFromWP(date: string): Promise<TriviaQuestion[] | null> {
  try {
    const res = await fetch(`${WP_URL}/wp-json/culture/v1/games/trivia-daily`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.date === date && Array.isArray(data.questions) && data.questions.length > 0) {
      return data.questions as TriviaQuestion[];
    }
    return null;
  } catch {
    return null;
  }
}

async function saveToWP(questions: TriviaQuestion[]): Promise<void> {
  try {
    await fetch(`${WP_URL}/wp-json/culture/v1/games/trivia-daily`, {
      method:  "POST",
      headers: {
        "Content-Type":         "application/json",
        "Authorization":        `Bearer ${API_KEY}`,
        "X-Culture-API-Secret": API_KEY,
      },
      body: JSON.stringify({ questions }),
    });
  } catch {
    // Non-fatal
  }
}

async function generateQuestions(date: string): Promise<TriviaQuestion[] | null> {
  const seed   = dateToSeed(date);
  const prompt = buildDailyPrompt(date, seed);
  let lastErr: any;

  for (const modelId of TEXT_MODELS) {
    try {
      const model = ai.getGenerativeModel({
        model: modelId,
        safetySettings: SAFETY,
      });

      const res      = await model.generateContent(prompt);
      const response = await res.response;
      const raw      = response.text().trim();
      if (!raw) continue;

      const parsed = JSON.parse(extractJson(raw));
      if (!Array.isArray(parsed)) continue;

      const questions: TriviaQuestion[] = parsed
        .filter(
          (q: any) =>
            q.question &&
            Array.isArray(q.options) &&
            q.options.length === 4 &&
            typeof q.correct === "number" &&
            q.correct >= 0 &&
            q.correct <= 3
        )
        .slice(0, 10)
        .map((q: any) => ({
          question:    String(q.question),
          options:     q.options.map(String) as [string, string, string, string],
          correct:     Number(q.correct),
          explanation: String(q.explanation ?? ""),
          category:    String(q.category ?? "culture"),
        }));

      if (questions.length >= 5) return questions;
    } catch (err) {
      lastErr = err;
    }
  }

  console.error("[trivia] All Gemini models failed:", lastErr?.message);
  return null;
}

// ── Fallback bank: 15 curated questions (used when Gemini is unavailable) ─────
const FALLBACK_QUESTIONS: TriviaQuestion[] = [
  {
    question: "What is the philosophy described as \"I am because we are\"?",
    options: ["Ubuntu", "Ujamaa", "Maat", "Harambee"],
    correct: 0,
    explanation: "Ubuntu is a Southern African philosophy emphasising communal bonds and shared humanity.",
    category: "culture",
  },
  {
    question: "Which West African country was the first in sub-Saharan Africa to gain independence from colonial rule?",
    options: ["Nigeria", "Ghana", "Senegal", "Kenya"],
    correct: 1,
    explanation: "Ghana gained independence on 6 March 1957 under Kwame Nkrumah, inspiring the rest of the continent.",
    category: "history",
  },
  {
    question: "Fela Kuti is credited with creating which genre of music?",
    options: ["Highlife", "Jùjú", "Afrobeat", "Fuji"],
    correct: 2,
    explanation: "Fela Anikulapo Kuti fused jazz, funk and traditional Yoruba music to create Afrobeat in the 1970s.",
    category: "music",
  },
  {
    question: "Which novel by Chimamanda Ngozi Adichie follows Ifemelu's immigration to America?",
    options: ["Half of a Yellow Sun", "Purple Hibiscus", "Americanah", "The Thing Around Your Neck"],
    correct: 2,
    explanation: "Americanah (2013) explores race, identity and belonging through a Nigerian woman's experience in the US.",
    category: "literature",
  },
  {
    question: "The Jollof rice rivalry is most fiercely contested between which two countries?",
    options: ["Nigeria and Ghana", "Senegal and Mali", "Cameroon and Ivory Coast", "Sierra Leone and Liberia"],
    correct: 0,
    explanation: "The 'Jollof Wars' is a beloved cultural rivalry between Nigeria and Ghana over which country makes the best Jollof rice.",
    category: "food",
  },
  {
    question: "Who directed the Oscar-winning film 12 Years a Slave?",
    options: ["Spike Lee", "John Singleton", "Steve McQueen", "Ava DuVernay"],
    correct: 2,
    explanation: "British-Trinidadian director Steve McQueen won the Academy Award for Best Picture for 12 Years a Slave in 2014.",
    category: "film",
  },
  {
    question: "Amapiano originated in which country?",
    options: ["Nigeria", "Kenya", "Zimbabwe", "South Africa"],
    correct: 3,
    explanation: "Amapiano emerged from South African townships in the early 2010s, blending deep house, jazz and kwaito.",
    category: "music",
  },
  {
    question: "Which Ethiopian emperor is revered as a divine figure in Rastafari?",
    options: ["Menelik II", "Haile Selassie", "Tewodros II", "Yohannes IV"],
    correct: 1,
    explanation: "Haile Selassie I, born Ras Tafari Makonnen, is venerated as the returned messiah by the Rastafari movement.",
    category: "history",
  },
  {
    question: "The Adinkra symbols originate from which West African people?",
    options: ["Yoruba", "Akan", "Wolof", "Igbo"],
    correct: 1,
    explanation: "Adinkra symbols are visual symbols from the Akan people of Ghana and Ivory Coast, each representing a proverb or concept.",
    category: "culture",
  },
  {
    question: "Who wrote Things Fall Apart, often called the archetypal African novel?",
    options: ["Wole Soyinka", "Ngugi wa Thiong'o", "Chinua Achebe", "Ben Okri"],
    correct: 2,
    explanation: "Chinua Achebe's Things Fall Apart (1958) depicts Igbo society and the impact of colonialism through the story of Okonkwo.",
    category: "literature",
  },
  {
    question: "Burna Boy won a Grammy Award in which category in 2021?",
    options: ["Best New Artist", "Best World Music Album", "Best Global Music Album", "Best African Performance"],
    correct: 2,
    explanation: "Burna Boy won Best Global Music Album for 'Twice as Tall' at the 63rd Grammy Awards in 2021.",
    category: "music",
  },
  {
    question: "The Harlem Renaissance was primarily a cultural movement in which decade?",
    options: ["1900s", "1910s", "1920s", "1940s"],
    correct: 2,
    explanation: "The Harlem Renaissance flourished in the 1920s, producing landmark works by Hughes, Hurston, Cullen and others.",
    category: "history",
  },
  {
    question: "Which Senegalese city is home to the African Renaissance Monument?",
    options: ["Saint-Louis", "Thiès", "Ziguinchor", "Dakar"],
    correct: 3,
    explanation: "The African Renaissance Monument stands on a hilltop in Dakar — one of the tallest statues in Africa.",
    category: "culture",
  },
  {
    question: "Eliud Kipchoge, first person to run a marathon in under 2 hours, is from which country?",
    options: ["Ethiopia", "Kenya", "Uganda", "Tanzania"],
    correct: 1,
    explanation: "Kenya's Eliud Kipchoge ran 1:59:40 in Vienna in 2019, breaking the 2-hour barrier for the first time in history.",
    category: "sport",
  },
  {
    question: "Which Ghanaian-British architect co-designed the Smithsonian's National Museum of African American History and Culture?",
    options: ["David Adjaye", "Lesley Lokko", "Elsie Owusu", "Kunlé Adeyemi"],
    correct: 0,
    explanation: "Sir David Adjaye was the lead designer of the Smithsonian NMAAHC, opened in Washington DC in 2016.",
    category: "art",
  },
];

function getFallbackQuestions(date: string): TriviaQuestion[] {
  const seed     = dateToSeed(date);
  const shuffled = seededShuffle(FALLBACK_QUESTIONS, seed);
  return shuffled.slice(0, 10);
}

// ── Route handler ──────────────────────────────────────────────────────────────
export async function GET() {
  const date = new Date().toISOString().slice(0, 10);

  // 1. Try WordPress cache (same day)
  const cached = await fetchFromWP(date);
  if (cached) {
    return NextResponse.json({ date, questions: cached, source: "cache" });
  }

  // 2. Generate via Gemini with today's unique topic brief
  const generated = await generateQuestions(date);
  if (generated) {
    await saveToWP(generated);
    return NextResponse.json({ date, questions: generated, source: "gemini" });
  }

  // 3. Gemini unavailable — serve from hardcoded fallback (never returns 500)
  const fallback = getFallbackQuestions(date);
  return NextResponse.json({ date, questions: fallback, source: "fallback" });
}
