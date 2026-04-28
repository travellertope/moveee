import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? "" });

// Use the same model priority order established in lib/gemini.ts
const TEXT_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
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
- "body": 3–4 sentence expanded summary for the story page. Max 90 words. Editorial, not journalistic. Same warm, specific voice.
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

export async function fetchGeminiPulseStories(
  topic = "African and Black diaspora culture news"
): Promise<PulseStoryRaw[]> {
  const monthYear = new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const prompt = `${SYSTEM_PROMPT}\n\nTopic: "${topic} — ${monthYear}"`;

  let lastError: unknown = null;

  for (const modelId of TEXT_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: modelId,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          temperature: 0.2,
          safetySettings: SAFETY_SETTINGS,
        } as any,
      });

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

      return stories;
    } catch (err: any) {
      console.warn(`[pulse-gemini] Model ${modelId} failed:`, err?.message?.slice(0, 120));
      lastError = err;
    }
  }

  throw new Error(
    `All Gemini models failed for Pulse refresh. Last error: ${(lastError as any)?.message ?? "Unknown"}`
  );
}
