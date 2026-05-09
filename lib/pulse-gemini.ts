import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? "" });

// Confirmed GA-stable models with Google Search grounding support (May 2026).
// gemini-2.5-flash and gemini-2.5-flash-lite share the same RPM/TPM quota bucket.
// gemini-2.5-pro is the high-quality fallback on the same Tier quota.
// All three support { googleSearch: {} } grounding.
const TEXT_MODELS = [
  "gemini-2.5-flash",      // Primary — 2,000 RPM (Tier 2), fastest
  "gemini-2.5-flash-lite", // Fallback — same quota, lower cost/latency
  "gemini-2.5-pro",        // Heavy fallback — 1,000 RPM (Tier 2), highest quality
];

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

const SYSTEM_PROMPT = `You are the editorial AI for Moveee Pulse — a live cultural intelligence platform for African and Black diasporan culture.

Use Google Search to find real, current news stories and cultural moments from the past 30 days.

Return ONLY a raw JSON array — no markdown, no backticks, no explanation.

Each object must have:
- "title": sharp editorial headline, max 12 words, sentence case, must name a real person/place/event/brand
- "summary": exactly 2 sentences in Moveee editorial voice — smart, warm, specific. Max 50 words. Name the actual artist, designer, event, or place.
- "body": 4–5 substantial paragraphs for the full story page. Each paragraph is 3–5 sentences. Total 400–600 words. Use \\n\\n to separate paragraphs. Structure: (1) overview of the story, (2) cultural/historical context, (3) significance for the African and diaspora community, (4) broader implications or reactions, (5) what's next or a closing perspective. Editorial voice — warm, specific, authoritative. Name real people, places, events. Avoid generic filler.
- "arm": exactly one of: "lifestyle" | "origins" | "happenings" | "magazine"
- "region": one of: "Africa" | "Caribbean" | "Diaspora UK" | "Diaspora US" | "Diaspora Europe" | "Global"
- "source": real publication name (e.g. OkayAfrica, The Guardian, Billboard, Vogue Africa, BBC Africa, Afropunk, The FADER, Pitchfork)
- "source_url": URL of the source article found via search, or empty string

Spread stories across at least 3 different arms and 3 different regions. Use only real, verifiable stories found via Google Search. Be specific — generic descriptions are not acceptable. Aim for 8–12 stories per run.`;

export interface PulseStoryRaw {
  title: string;
  summary: string;
  body: string;
  arm: "lifestyle" | "origins" | "happenings" | "magazine";
  region: "Africa" | "Caribbean" | "Diaspora UK" | "Diaspora US" | "Diaspora Europe" | "Global";
  source: string;
  source_url: string;
}

function extractJsonArray(raw: string): string {
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON array found in Gemini response");
  }
  return raw.slice(start, end + 1);
}

const VALID_ARMS = new Set(["lifestyle", "origins", "happenings", "magazine"]);
const VALID_REGIONS = new Set(["Africa", "Caribbean", "Diaspora UK", "Diaspora US", "Diaspora Europe", "Global"]);

function isValidStory(s: any): s is PulseStoryRaw {
  return (
    typeof s.title === "string" && s.title.trim().length > 0 &&
    typeof s.summary === "string" && s.summary.trim().length > 0 &&
    VALID_ARMS.has(s.arm) &&
    VALID_REGIONS.has(s.region)
  );
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

function isQuotaError(err: any): boolean {
  const msg = (err?.message ?? "").toLowerCase();
  return (
    msg.includes("429") ||
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("resource_exhausted") ||
    err?.status === 429
  );
}

async function tryModels(prompt: string, withSearch: boolean): Promise<PulseStoryRaw[] | null> {
  for (let i = 0; i < TEXT_MODELS.length; i++) {
    const modelId = TEXT_MODELS[i];
    try {
      const config: any = {
        safetySettings: SAFETY_SETTINGS,
        temperature: 0.2,
      };
      if (withSearch) config.tools = [{ googleSearch: {} }];

      // Pro model needs more time for grounded research.
      const timeoutMs = modelId.includes("pro") ? 45_000 : 30_000;

      const response = await withTimeout(
        ai.models.generateContent({
          model: modelId,
          contents: prompt,
          config,
        }),
        timeoutMs,
        modelId
      );

      const raw = (
        response.text ??
        (response as any).candidates?.[0]?.content?.parts
          ?.filter((p: any) => p.text)
          ?.map((p: any) => p.text)
          ?.join("") ??
        ""
      ).trim();

      if (!raw) continue;

      const jsonStr = extractJsonArray(raw);
      const parsed: unknown[] = JSON.parse(jsonStr);
      if (!Array.isArray(parsed)) continue;

      const stories = parsed.filter(isValidStory);
      if (stories.length === 0) continue;

      console.log(`[pulse-gemini] ${modelId} (search=${withSearch}) returned ${stories.length} stories`);
      return stories;
    } catch (err: any) {
      const isQuota = isQuotaError(err);
      console.warn(
        `[pulse-gemini] ${modelId} (search=${withSearch}) failed [${isQuota ? "QUOTA" : "ERROR"}]:`,
        err?.message?.slice(0, 120)
      );
      // Wait before trying next model: longer pause for quota errors.
      if (i < TEXT_MODELS.length - 1) {
        await sleep(isQuota ? 6_000 : 2_000);
      }
    }
  }

  return null; // All models failed for this config
}

export async function fetchGeminiPulseStories(
  topic = "African and Black diaspora culture news"
): Promise<PulseStoryRaw[]> {
  const monthYear = new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const prompt = `${SYSTEM_PROMPT}\n\nTopic: "${topic} — ${monthYear}"`;

  // Pass 1: try all models with Google Search grounding.
  const withSearch = await tryModels(prompt, true);
  if (withSearch) return withSearch;

  // Pass 2: grounding quota exhausted — fall back without search tool.
  // Models will draw on training knowledge; stories may be less current but still valid.
  console.warn("[pulse-gemini] All grounded models failed — retrying without search tool");
  const withoutSearch = await tryModels(prompt, false);
  if (withoutSearch) return withoutSearch;

  throw new Error(
    "All Gemini models failed for Pulse refresh. Check your API key quota at https://ai.dev/rate-limit and ensure billing is enabled on your Google Cloud project."
  );
}
