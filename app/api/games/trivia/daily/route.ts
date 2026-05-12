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

async function generateQuestions(): Promise<TriviaQuestion[]> {
  let lastErr: any;
  for (const modelId of TEXT_MODELS) {
    try {
      const model = ai.getGenerativeModel({
        model: modelId,
        safetySettings: SAFETY,
        generationConfig: { responseMimeType: "application/json" },
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
  throw new Error(`Trivia generation failed: ${lastErr?.message}`);
}

export async function GET() {
  const date = new Date().toISOString().slice(0, 10);

  // 1. Try WordPress cache first
  const cached = await fetchFromWP(date);
  if (cached) {
    return NextResponse.json({ date, questions: cached });
  }

  // 2. Generate fresh via Gemini
  try {
    const questions = await generateQuestions();
    // 3. Persist to WordPress for all other instances
    await saveToWP(questions);
    return NextResponse.json({ date, questions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
