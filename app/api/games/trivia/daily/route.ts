/**
 * GET /api/games/trivia/daily
 *
 * Returns the same 10 trivia questions for every player on a given UTC day.
 *
 * Strategy:
 *   1. Check WordPress option (culture_games_trivia_<date>) — serves in ~50ms.
 *   2. On cache miss, generate 10 questions via Gemini.
 *   3. Store in WordPress so all subsequent requests (any Vercel instance) hit cache.
 *
 * Response: { date, questions: TriviaQuestion[] }
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

const WP_URL  = process.env.NEXT_PUBLIC_WP_URL    ?? "https://cms.themoveee.com";
const API_KEY = process.env.CULTURE_API_SECRET    ?? "";

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

const SAFETY = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

const TEXT_MODELS = ["gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-1.5-pro"];

const PROMPT = `You are the question writer for Culture Games — a trivia game on The Moveee, a platform celebrating African and diaspora culture globally.

Generate exactly 10 trivia questions. Cover a diverse mix of categories:
- Afrobeats, Afropop, Highlife, Amapiano, Afro-soul, African jazz (2 questions)
- Nollywood, African cinema, Black British/American film and TV (2 questions)
- African literature, Caribbean literature, Harlem Renaissance, diaspora fiction (2 questions)
- African history, politics, independence movements, civil rights (2 questions)
- African visual art, fashion, food, and traditions (2 questions)

Rules:
- All questions must be factual and verifiable — no invented trivia
- Difficulty: 4 easy, 4 medium, 2 hard
- Each question has exactly 4 options, only one correct
- Distribute the correct answer position across A/B/C/D roughly evenly
- Write a brief 1–2 sentence explanation for each answer that adds cultural context

Return ONLY a valid JSON array — no markdown, no code fences:
[
  {
    "question": "...",
    "options": ["option A", "option B", "option C", "option D"],
    "correct": 0,
    "explanation": "...",
    "category": "music | film | literature | history | culture"
  }
]`;

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
    // Non-fatal — questions already generated, just won't persist across instances
  }
}

async function generateQuestions(): Promise<TriviaQuestion[] | null> {
  let lastErr: any;
  for (const modelId of TEXT_MODELS) {
    try {
      const model = ai.getGenerativeModel({
        model: modelId,
        safetySettings: SAFETY,
      });

      const res = await model.generateContent(PROMPT);
      const response = await res.response;
      const raw = response.text().trim();
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
  // All Gemini models failed — return null so caller uses fallback bank
  console.error("[trivia] All Gemini models failed:", lastErr?.message);
  return null;
}

// ── Fallback question bank (always works, no API needed) ─────────────────────
function dateToSeed(date: string): number {
  let h = 0;
  for (const ch of date) h = (Math.imul(h, 31) + ch.charCodeAt(0)) | 0;
  return h >>> 0;
}

const FALLBACK_QUESTIONS: TriviaQuestion[] = [
  {
    question: "What is the philosophy described as \"I am because we are\"?",
    options: ["Ubuntu", "Ujamaa", "Maat", "Harambee"],
    correct: 0,
    explanation: "Ubuntu is a Southern African philosophy meaning 'I am because we are' — emphasising communal bonds.",
    category: "culture"
  },
  {
    question: "Which West African country was the first in sub-Saharan Africa to gain independence from colonial rule?",
    options: ["Nigeria", "Ghana", "Senegal", "Kenya"],
    correct: 1,
    explanation: "Ghana gained independence on 6 March 1957 under Kwame Nkrumah, inspiring the rest of the continent.",
    category: "history"
  },
  {
    question: "Fela Kuti is credited with creating which genre of music?",
    options: ["Highlife", "Jùjú", "Afrobeat", "Fuji"],
    correct: 2,
    explanation: "Fela Anikulapo Kuti fused jazz, funk and traditional Yoruba music to create Afrobeat in the 1970s.",
    category: "music"
  },
  {
    question: "Which novel by Chimamanda Ngozi Adichie follows Ifemelu's immigration to America?",
    options: ["Half of a Yellow Sun", "Purple Hibiscus", "Americanah", "The Thing Around Your Neck"],
    correct: 2,
    explanation: "Americanah (2013) explores race, identity and belonging through a Nigerian woman's experiences in the US.",
    category: "literature"
  },
  {
    question: "What is Jollof rice contested between as the best version?",
    options: ["Nigeria and Ghana", "Senegal and Mali", "Cameroon and Ivory Coast", "Sierra Leone and Liberia"],
    correct: 0,
    explanation: "The \"Jollof Wars\" is a long-running friendly rivalry between Nigeria and Ghana over whose Jollof rice is superior.",
    category: "culture"
  },
  {
    question: "Who directed the Oscar-winning film 12 Years a Slave?",
    options: ["Spike Lee", "John Singleton", "Steve McQueen", "Ava DuVernay"],
    correct: 2,
    explanation: "British-Trinidadian director Steve McQueen won the Academy Award for Best Picture for 12 Years a Slave in 2014.",
    category: "film"
  },
  {
    question: "Amapiano originated in which country?",
    options: ["Nigeria", "Kenya", "Zimbabwe", "South Africa"],
    correct: 3,
    explanation: "Amapiano emerged from South African townships in the early 2010s, blending deep house, jazz and kwaito.",
    category: "music"
  },
  {
    question: "Which Ethiopian emperor is revered as a divine figure in Rastafari?",
    options: ["Menelik II", "Haile Selassie", "Tewodros II", "Yohannes IV"],
    correct: 1,
    explanation: "Haile Selassie I, born Ras Tafari Makonnen, is venerated as the returned messiah by the Rastafari movement.",
    category: "history"
  },
  {
    question: "Which Nollywood film was the first to gross over $1 million at the Nigerian box office?",
    options: ["The Wedding Party", "Oloture", "October 1", "30 Days in Atlanta"],
    correct: 3,
    explanation: "30 Days in Atlanta (2014) was the first Nollywood film to gross over ₦100 million (~$1 million) at the cinema.",
    category: "film"
  },
  {
    question: "The Adinkra symbols originate from which West African people?",
    options: ["Yoruba", "Akan", "Wolof", "Igbo"],
    correct: 1,
    explanation: "Adinkra symbols are visual symbols created by the Akan people of Ghana and Ivory Coast, each representing a concept or proverb.",
    category: "culture"
  },
  {
    question: "Who wrote Things Fall Apart, often called the archetypal African novel?",
    options: ["Wole Soyinka", "Ngugi wa Thiong'o", "Chinua Achebe", "Ben Okri"],
    correct: 2,
    explanation: "Chinua Achebe's Things Fall Apart (1958) depicts the life of Okonkwo and the impact of colonialism on Igbo society.",
    category: "literature"
  },
  {
    question: "Which Ghanaian-British architect designed the National Cathedral of Ghana?",
    options: ["David Adjaye", "Lesley Lokko", "Elsie Owusu", "Kéré Architecture"],
    correct: 0,
    explanation: "Sir David Adjaye, born in Tanzania of Ghanaian descent, is the lead architect for Ghana's National Cathedral.",
    category: "culture"
  },
  {
    question: "Burna Boy won a Grammy Award in which category in 2021?",
    options: ["Best New Artist", "Best World Music Album", "Best Global Music Album", "Best African Music Performance"],
    correct: 2,
    explanation: "Burna Boy won Best Global Music Album for 'Twice as Tall' at the 63rd Grammy Awards in 2021.",
    category: "music"
  },
  {
    question: "The Harlem Renaissance was primarily a cultural movement centred in which decade?",
    options: ["1900s", "1910s", "1920s", "1940s"],
    correct: 2,
    explanation: "The Harlem Renaissance flourished in the 1920s, producing landmark works by Hughes, Hurston, Cullen and others.",
    category: "history"
  },
  {
    question: "Which Senegalese city is home to the African Renaissance Monument?",
    options: ["Saint-Louis", "Thiès", "Ziguinchor", "Dakar"],
    correct: 3,
    explanation: "The African Renaissance Monument stands on a hilltop in Dakar, Senegal, and is one of the tallest statues in Africa.",
    category: "culture"
  },
];

function getFallbackQuestions(date: string): TriviaQuestion[] {
  // Use date as seed so the same 10 questions appear all day, rotating daily
  const seed = dateToSeed(date);
  const shuffled = [...FALLBACK_QUESTIONS];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = ((seed * (i + 1)) >>> 0) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, 10);
}

export async function GET() {
  const date = new Date().toISOString().slice(0, 10);

  // 1. Try WordPress cache first
  const cached = await fetchFromWP(date);
  if (cached) {
    return NextResponse.json({ date, questions: cached, source: "cache" });
  }

  // 2. Try Gemini
  const generated = await generateQuestions();
  if (generated) {
    // 3. Persist to WordPress for all other instances (non-fatal)
    await saveToWP(generated);
    return NextResponse.json({ date, questions: generated, source: "gemini" });
  }

  // 4. Gemini unavailable — serve from the hardcoded fallback bank
  const fallback = getFallbackQuestions(date);
  return NextResponse.json({ date, questions: fallback, source: "fallback" });
}
