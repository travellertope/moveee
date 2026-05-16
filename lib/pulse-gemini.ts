/**
 * pulse-gemini.ts
 *
 * Uses Gemini (no Google Search grounding, works on free tier) to select
 * and editorially rewrite real articles fetched from 25+ RSS feeds.
 *
 * Flow:
 *   1. fetchAllFeeds()  — pulls from 40+ RSS feeds in parallel
 *   2. Gemini           — selects the most culturally relevant stories,
 *                         rewrites them in Moveee editorial voice,
 *                         preserving the real source URLs
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { fetchAllFeeds, type FeedItem } from "./pulse-rss";

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

// Models in preference order — newer first, fallback to 1.5-series.
const TEXT_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
];

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

export interface PulseStoryRaw {
  title:      string;
  summary:    string;
  body:       string;
  arm:        "lifestyle" | "origins" | "happenings" | "magazine";
  region:     "Africa" | "Caribbean" | "Diaspora UK" | "Diaspora US" | "Diaspora Europe" | "Global";
  category:   "music" | "film" | "fashion" | "art" | "literature" | "food" | "activism" | "sports" | "business" | "tech";
  source:     string;
  source_url: string;
}

const VALID_ARMS       = new Set(["lifestyle", "origins", "happenings", "magazine"]);
const VALID_REGIONS    = new Set(["Africa", "Caribbean", "Diaspora UK", "Diaspora US", "Diaspora Europe", "Global"]);
const VALID_CATEGORIES = new Set(["music", "film", "fashion", "art", "literature", "food", "activism", "sports", "business", "tech"]);

function isValidStory(s: any): s is PulseStoryRaw {
  return (
    typeof s.title      === "string" && s.title.trim().length > 0 &&
    typeof s.summary    === "string" && s.summary.trim().length > 0 &&
    typeof s.source_url === "string" &&
    VALID_ARMS.has(s.arm) &&
    VALID_REGIONS.has(s.region)
  );
}

function normaliseCategory(raw: any): PulseStoryRaw["category"] {
  return VALID_CATEGORIES.has(raw) ? raw : "art";
}

function extractJsonArray(raw: string): string {
  const start = raw.indexOf("[");
  const end   = raw.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) throw new Error("No JSON array in response");
  return raw.slice(start, end + 1);
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

// ─── Build prompt from RSS items ──────────────────────────────────────────────
function buildPrompt(items: FeedItem[]): string {
  const list = items
    .map((item, i) =>
      `[${i + 1}] SOURCE: ${item.source}\nURL: ${item.link}\nTITLE: ${item.title}\nSUMMARY: ${item.description}`
    )
    .join("\n\n");

  return `You are the editorial AI for Moveee Pulse — a cultural intelligence platform covering African and Black diasporan culture.

Below are ${items.length} real news items fetched from African and diaspora media. Your job:

1. SELECT the 8–12 items most relevant to African/Black diaspora culture — music, film, fashion, art, literature, food, activism, travel, lifestyle, or business. Ignore pure politics, sport results, or crime unless they have strong cultural significance.

2. REWRITE each selected item in the Moveee editorial voice — smart, warm, specific, culturally attuned.

3. PRESERVE the exact URL from each item you select — copy it as "source_url". Do NOT alter, guess, or construct URLs.

Return ONLY a raw JSON array — no markdown, no backticks, no explanation.

Each object must have:
- "title": sharp editorial headline, max 12 words, sentence case
- "summary": exactly 2 sentences in Moveee voice. Max 50 words. Specific — name the real artist, designer, event, or place.
- "body": 4–5 paragraphs, 400–600 words total, separated by \\n\\n. Structure: (1) story overview, (2) cultural/historical context, (3) significance for African and diaspora community, (4) broader implications or reactions, (5) what's next. Warm, authoritative, specific.
- "arm": exactly one of: "lifestyle" | "origins" | "happenings" | "magazine"
- "region": one of: "Africa" | "Caribbean" | "Diaspora UK" | "Diaspora US" | "Diaspora Europe" | "Global"
- "source": the publication name (e.g. OkayAfrica, BellaNaija, The Root)
- "source_url": the EXACT URL from the item — copy it verbatim
- "category": exactly one of: "music" | "film" | "fashion" | "art" | "literature" | "food" | "activism" | "sports" | "business" | "tech"

Spread selections across at least 3 different arms and 3 different regions. Prefer recent, specific, culturally rich stories.

NEWS ITEMS:
${list}`;
}

// ─── Try all models until one succeeds ───────────────────────────────────────
async function tryModels(prompt: string): Promise<PulseStoryRaw[] | null> {
  const errors: string[] = [];

  for (let i = 0; i < TEXT_MODELS.length; i++) {
    const modelId = TEXT_MODELS[i];
    try {
      const timeoutMs = modelId.includes("pro") ? 60_000 : 45_000;
      const model = ai.getGenerativeModel({
        model: modelId,
        safetySettings: SAFETY_SETTINGS,
        generationConfig: {
          temperature: 0.3,
        },
      });

      const result = await withTimeout(
        model.generateContent(prompt),
        timeoutMs,
        modelId
      );

      const response = await result.response;
      const raw = response.text().trim();

      if (!raw) { errors.push(`${modelId}: empty response`); continue; }

      const jsonStr = extractJsonArray(raw);
      const parsed: unknown[] = JSON.parse(jsonStr);
      if (!Array.isArray(parsed)) { errors.push(`${modelId}: response was not an array`); continue; }

      const stories = parsed
        .filter(isValidStory)
        .map(s => ({ ...s, category: normaliseCategory(s.category) }));

      if (stories.length === 0) { errors.push(`${modelId}: 0 valid stories after filtering`); continue; }

      console.log(`[pulse-gemini] ${modelId} selected ${stories.length} stories from RSS feed`);
      return stories;
    } catch (err: any) {
      const msg = err?.message?.slice(0, 200) ?? "unknown error";
      errors.push(`${modelId}: ${msg}`);
      console.warn(`[pulse-gemini] ${modelId} failed:`, msg);
      if (i < TEXT_MODELS.length - 1) await sleep(2_000);
    }
  }

  console.error("[pulse-gemini] All models failed:\n" + errors.map((e, i) => `  ${i + 1}. ${e}`).join("\n"));
  return null;
}

// ─── Main export ──────────────────────────────────────────────────────────────
export async function fetchGeminiPulseStories(): Promise<PulseStoryRaw[]> {
  // Step 1: Pull fresh articles from all RSS feeds in parallel
  console.log("[pulse-gemini] Fetching RSS feeds…");
  const feedItems = await fetchAllFeeds();
  console.log(`[pulse-gemini] ${feedItems.length} items fetched across all feeds`);

  if (feedItems.length < 5) {
    throw new Error("Not enough RSS items fetched — check feed connectivity.");
  }

  // Step 2: Ask Gemini to select and editorially rewrite the best stories
  const prompt  = buildPrompt(feedItems);
  const stories = await tryModels(prompt);

  if (!stories) {
    throw new Error(
      "All Gemini models failed to rewrite RSS stories. Check GEMINI_API_KEY and quota. See server logs for per-model errors."
    );
  }

  return stories;
}
