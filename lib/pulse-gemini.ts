import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? "" });

// Keep in sync with lib/gemini.ts TEXT_MODELS.
// gemini-2.0-flash has quota limit:0 on paid plans.
// gemini-2.5-flash-8b is the lightest confirmed 2.5 model, useful as a last resort.
const TEXT_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite-preview-06-17",
  "gemini-2.5-flash-8b",
];

function isRateLimitError(err: any): boolean {
  const msg: string = err?.message ?? "";
  return (
    msg.includes("429") ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("Quota exceeded")
  );
}

// Parse "Please retry in 43.5s" from error messages; cap at 90s.
function parseRetryDelay(err: any): number {
  const match = /retry in ([\d.]+)s/i.exec(err?.message ?? "");
  if (!match) return 0;
  return Math.min(parseFloat(match[1]) * 1000, 50_000);
}

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
- "body": 2–3 paragraphs for the story page. Each paragraph is 2–4 sentences. Total 120–200 words. Use \\n\\n to separate paragraphs. Editorial, not journalistic. Same warm, specific voice — go deeper on context, cultural significance, and what makes this moment matter.
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
    // Attempt each model up to 2 times — waiting if a retry delay is suggested.
    for (let attempt = 0; attempt < 2; attempt++) {
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

        if (!raw) break;

        const jsonStr = extractJsonArray(raw);
        const parsed: unknown[] = JSON.parse(jsonStr);

        if (!Array.isArray(parsed)) break;

        const stories = parsed.filter(isValidStory);
        if (stories.length === 0) break;

        return stories;
      } catch (err: any) {
        lastError = err;
        console.warn(`[pulse-gemini] Model ${modelId} attempt ${attempt + 1} failed:`, err?.message?.slice(0, 120));

        if (isRateLimitError(err) && attempt === 0) {
          const delay = parseRetryDelay(err);
          // Use the suggested delay, or a 6s default to let per-minute quota recover.
          const wait = delay > 0 ? delay : 6_000;
          console.log(`[pulse-gemini] Rate limited on ${modelId} — waiting ${Math.round(wait / 1000)}s…`);
          await new Promise((r) => setTimeout(r, wait));
        } else {
          // Non-rate-limit error or second attempt — move on to next model.
          break;
        }
      }
    }
  }

  const lastMsg: string = (lastError as any)?.message ?? "Unknown";
  const isBilling = lastMsg.includes("billing") || lastMsg.includes("plan") || lastMsg.includes("RESOURCE_EXHAUSTED");
  throw new Error(
    isBilling
      ? "Gemini quota exhausted — your API key has hit its rate or billing limit. Check usage at https://ai.dev/rate-limit and ensure billing is enabled on your Google Cloud project."
      : `All Gemini models failed. Last error: ${lastMsg.slice(0, 300)}`
  );
}
