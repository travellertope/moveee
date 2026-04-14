import { GoogleGenAI } from "@google/genai";

// Google AI Studio client — used for all text generation.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? "" });

/**
 * Lazily create a Vertex AI client for Imagen 3 image generation.
 * Requires VERTEX_PROJECT, VERTEX_CLIENT_EMAIL, and VERTEX_PRIVATE_KEY env vars.
 * Returns null when any required variable is absent so image generation
 * degrades gracefully rather than crashing at startup.
 */
function createVertexClient(): GoogleGenAI | null {
  const project     = process.env.VERTEX_PROJECT;
  const location    = process.env.VERTEX_LOCATION ?? "us-central1";
  const clientEmail = process.env.VERTEX_CLIENT_EMAIL;
  // Vercel stores the private key with literal \n — normalise to real newlines.
  const privateKey  = process.env.VERTEX_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!project || !clientEmail || !privateKey) return null;

  return new GoogleGenAI({
    vertexai: true,
    project,
    location,
    googleAuthOptions: {
      credentials: { client_email: clientEmail, private_key: privateKey },
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    },
  } as any);
}

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
 * Extract the first complete JSON value (object or array) from a string.
 * Handles cases where the model prefixes/suffixes text around the JSON.
 */
function extractJson(raw: string): string {
  const objStart = raw.indexOf("{");
  const arrStart = raw.indexOf("[");

  // Prefer whichever opener appears first.
  if (arrStart !== -1 && (objStart === -1 || arrStart < objStart)) {
    const end = raw.lastIndexOf("]");
    if (end > arrStart) return raw.slice(arrStart, end + 1);
  }

  if (objStart !== -1) {
    const end = raw.lastIndexOf("}");
    if (end > objStart) return raw.slice(objStart, end + 1);
  }

  throw new Error("No JSON value found in model response");
}

// ── Image generation ────────────────────────────────────────────────────────

const IMAGE_STYLE_PROMPT =
  "Flat geometric portraiture and scene illustration using a restricted " +
  "earth-tone palette (ochre, terracotta, deep umber, sand, forest green), " +
  "rendered with simplified bold forms and no photorealism. Strong editorial " +
  "print-magazine sensibility — closer to Malika Favre or Emiliano Ponzi than " +
  "to anything photographic or AI-default. No text, no borders.";

/**
 * Generate a styled editorial illustration for a directory entry via Imagen 3
 * on Vertex AI.
 *
 * Returns a base64-encoded JPEG string, or null when Vertex AI credentials are
 * absent (VERTEX_PROJECT / VERTEX_CLIENT_EMAIL / VERTEX_PRIVATE_KEY).
 * Throws on all other failures so callers can surface the real error message.
 *
 * Must only be called from server-side code.
 */
export async function generateDirectoryImage(
  title: string,
  entryType: string,
  excerpt: string
): Promise<string | null> {
  const vertexClient = createVertexClient();
  if (!vertexClient) return null;

  const subject = `${title} — a ${entryType} in African and diaspora culture`;
  const prompt = `${IMAGE_STYLE_PROMPT} Subject: ${subject}. Context: ${excerpt.slice(0, 200)}.`;

  const result = await (vertexClient.models as any).generateImages({
    model: "imagen-3.0-generate-002",
    prompt,
    config: {
      numberOfImages: 1,
      aspectRatio: "4:3",
    },
  });

  const imageData = result?.generatedImages?.[0]?.image?.imageBytes;
  if (!imageData) {
    throw new Error("Imagen 3 returned no image bytes");
  }

  // SDK may return a base64 string or a Uint8Array depending on version.
  if (typeof imageData === "string") return imageData;

  // Convert Uint8Array / Buffer → base64 string.
  const bytes = imageData instanceof Uint8Array ? imageData : new Uint8Array(imageData);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
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

/**
 * Ask Gemini to suggest new Culture Directory topics that align with
 * The Moveee's focus, excluding topics already in the directory.
 *
 * Returns up to 20 topic name strings, deduplicated against existingTitles.
 */
export async function generateTopicSuggestions(
  existingTitles: string[]
): Promise<string[]> {
  const sample = existingTitles.slice(0, 80).join(", ");

  const prompt = `You are a curator for The Moveee's Culture Directory — a growing wiki celebrating African and diaspora culture globally.

The directory already has entries for: ${sample}${existingTitles.length > 80 ? ` … and ${existingTitles.length - 80} more` : ""}.

Suggest 20 NEW topics not yet covered. Prioritise:
- Influential people: musicians, writers, visual artists, filmmakers, activists, philosophers
- Places with strong cultural significance: neighbourhoods, cities, markets, landmarks
- Cultural movements, art forms, and musical genres
- Foods, textiles, crafts, and fashion traditions
- Films, novels, or artworks of lasting cultural importance

Aim for geographic diversity across West Africa, East Africa, Southern Africa, the Caribbean, Black Britain, the US, Brazil, and the wider diaspora. The Moveee audience is culturally curious, internationally minded, and broadly aged 25-40.

Return ONLY a JSON array of strings — topic names only, no descriptions, no numbering. Example format:
["Zanele Muholi", "Kuduro", "Brixton Market", "Afrocomix"]`;

  const response = await ai.models.generateContent({
    model: MODEL_ID,
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });

  const raw = (response.text ?? "").trim();
  if (!raw) throw new Error("Empty response from Gemini");

  const jsonStr = extractJson(raw);
  const topics: unknown = JSON.parse(jsonStr);

  if (!Array.isArray(topics)) throw new Error("Gemini did not return a JSON array");

  // Deduplicate against existing titles.
  const existingLower = new Set(existingTitles.map((t) => t.toLowerCase().trim()));
  return (topics as unknown[])
    .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
    .filter((t) => !existingLower.has(t.toLowerCase().trim()))
    .slice(0, 20);
}
