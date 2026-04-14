import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? "" });

// Gemini 3 Flash Preview — Pro-level reasoning at Flash speed/cost.
// If a stable GA variant becomes available (e.g. "gemini-3-flash"), swap here.
const MODEL_ID = "gemini-3-flash-preview";

export const ENTRY_TYPE_SLUGS = [
  "person",
  "place",
  "movement",
  "genre",
  "concept",
  "artwork",
  "food",
  "fashion",
] as const;

export type EntryType = (typeof ENTRY_TYPE_SLUGS)[number];

export interface DirectoryStub {
  title: string;
  excerpt: string;
  content: string;
  entryType: EntryType;
  interests: string[];
  suggestedLinks: string[];
}

const SYSTEM_PROMPT = `You are a knowledgeable curator for The Moveee's Culture Directory — a wiki-like reference celebrating African and diaspora culture.

Given a topic name, generate a concise, encyclopedia-style entry stub. Return ONLY valid JSON — no markdown, no code fences, no explanation.

The JSON must match this exact structure:
{
  "title": "The canonical name of the entry",
  "excerpt": "One or two sentences summarising this entry (plain text, no HTML tags)",
  "content": "Full HTML body using ONLY <p>, <h2>, <ul>, <li> tags. Must include: an overview paragraph, a Cultural Significance section, and a Legacy or Related Works section. Minimum 4 paragraphs total.",
  "entryType": "exactly one of: person, place, movement, genre, concept, artwork, food, fashion",
  "interests": ["2-5 relevant interest slugs, lowercase, hyphenated. Choose from: music, visual-art, food-drink, fashion, literature, film, history, politics, spirituality, dance, theatre, sport, architecture, photography"],
  "suggestedLinks": ["2-4 names of related topics that would make good linked entries in the same directory"]
}

Focus on African, Caribbean, and global diaspora contexts. Be factual, culturally respectful, and celebratory in tone. Use approximate language (e.g. "in the late 1970s") rather than fabricating specific dates you are unsure of.`;

/**
 * Extract the first complete JSON object from a string.
 * Handles cases where the model prefixes/suffixes text around the JSON.
 */
function extractJson(raw: string): string {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("No JSON object found in model response");
  }
  return raw.slice(start, end + 1);
}

// ── Image generation ────────────────────────────────────────────────────────

const IMAGE_STYLE_PROMPT =
  "Flat geometric portraiture and scene illustration using a restricted " +
  "earth-tone palette (ochre, terracotta, deep umber, sand, forest green), " +
  "rendered with simplified bold forms and no photorealism. Strong editorial " +
  "print-magazine sensibility — closer to Malika Favre or Emiliano Ponzi than " +
  "to anything photographic or AI-default. No text, no borders.";

/**
 * Generate a styled editorial illustration for a directory entry via Imagen.
 * Returns a base64-encoded JPEG string, or null if image generation is
 * unavailable (API key missing, quota exceeded, model error).
 *
 * Must only be called from server-side code.
 */
export async function generateDirectoryImage(
  title: string,
  entryType: string,
  excerpt: string
): Promise<string | null> {
  if (!process.env.GEMINI_API_KEY) return null;

  const subject = `${title} — a ${entryType} in African and diaspora culture`;
  const prompt = `${IMAGE_STYLE_PROMPT} Subject: ${subject}. Context: ${excerpt.slice(0, 200)}.`;

  try {
    const result = await (ai.models as any).generateImages({
      model: "imagen-3.0-generate-002",
      prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: "4:3",
        outputMimeType: "image/jpeg",
      },
    });

    const imageBytes: string | undefined =
      result?.generatedImages?.[0]?.image?.imageBytes;
    return imageBytes ?? null;
  } catch {
    // Image generation is best-effort; never fail the main submission flow.
    return null;
  }
}

/**
 * Generate a Culture Directory stub via Gemini 3 Flash.
 * Must only be called from server-side code (API routes, server components).
 */
export async function generateDirectoryStub(
  topic: string
): Promise<DirectoryStub> {
  const response = await ai.models.generateContent({
    model: MODEL_ID,
    contents: `Generate a Culture Directory entry for: "${topic}"`,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
    },
  });

  const raw = (response.text ?? "").trim();
  if (!raw) {
    throw new Error("Empty response from Gemini");
  }

  const jsonStr = extractJson(raw);
  const parsed = JSON.parse(jsonStr) as DirectoryStub;

  // Normalise entry type to a known slug.
  if (!ENTRY_TYPE_SLUGS.includes(parsed.entryType as EntryType)) {
    parsed.entryType = "concept";
  }

  // Ensure arrays are arrays.
  if (!Array.isArray(parsed.interests)) parsed.interests = [];
  if (!Array.isArray(parsed.suggestedLinks)) parsed.suggestedLinks = [];

  return parsed;
}
