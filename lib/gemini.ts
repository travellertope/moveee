import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

export const geminiFlash = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: {
    responseMimeType: "application/json",
  },
});

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

/**
 * Generate a Culture Directory stub via Gemini 2.0 Flash.
 * Must only be called from server-side code (API routes, server components).
 */
export async function generateDirectoryStub(
  topic: string
): Promise<DirectoryStub> {
  const result = await geminiFlash.generateContent([
    SYSTEM_PROMPT,
    `Generate a Culture Directory entry for: "${topic}"`,
  ]);

  const raw = result.response.text().trim();
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
