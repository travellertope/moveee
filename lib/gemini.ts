import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";

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

// Model priority order for text generation.
// gemini-2.0-flash and gemini-2.0-flash-lite have limit:0 on Pro-subscription
// AI Studio keys — only 2.5-series and newer models have active quota.
const TEXT_MODELS = [
  "gemini-2.5-flash",      // Primary — confirmed working
  "gemini-2.5-flash-lite", // Lighter fallback
  "gemini-3-flash-preview", // Newer fallback
];

// Safety Settings: Relaxed to ensure cultural/historical topics are not blocked.
const SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

export const ENTRY_TYPE_SLUGS = [
  "person",
  "place",
  "movement",
  "genre",
  "concept",
  "artwork",
  "film",
  "book",
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
  "entryType": "exactly one of the following — choose the most specific match:\n  person   = an individual human being (musician, writer, artist, activist, filmmaker, philosopher, etc.)\n  place    = a geographic location (city, neighbourhood, landmark, region, market)\n  movement = a cultural, political, or artistic movement or era (Pan-Africanism, Harlem Renaissance)\n  genre    = a musical or artistic genre or style (Afrobeats, Highlife, Amapiano, Nollywood as a film industry)\n  concept  = an idea, philosophy, practice, or tradition (Ubuntu, Sankofa, Griot tradition, Adinkra symbols)\n  film     = a specific film or documentary (feature film, short film, documentary — NOT a genre or industry)\n  book     = a specific published book (novel, essay collection, poetry collection, memoir)\n  artwork  = a specific visual artwork, sculpture, installation, or album/music recording\n  food     = a specific dish, ingredient, or food tradition\n  fashion  = a specific garment, textile, fabric, or fashion tradition",
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

/**
 * Shared style modifiers included in every image prompt regardless of subject.
 * Palette hex values are provided so the model has the exact target colours.
 */
/**
 * Shared style modifiers included in every image prompt.
 * Focuses on 'vibe' and technical execution (texture, shading) 
 * while maintaining a strict premium palette.
 */
const STYLE_MODIFIERS =
  "strictly restricted palette: deep ink (#14110d), burnt ochre (#c5491f), " +
  "dark ochre (#8a2d10), gold brass (#b38238), moss green (#3d4a2a), " +
  "cream paper (#f3ece0), indigo (#1e2b42) — no saturated blues/purples, no white. " +
  "Premium editorial magazine illustration style. Flat geometric shapes with " +
  "intentional textures: dry-brush paper grain, coarse stippling, or fine ink bleeds. " +
  "Shading via sharp geometric shadow blocks, no soft gradients. " +
  "No photorealism, no 3D rendering, matte finish with generous negative space.";

/**
 * Classify any entry-type slug (including admin-defined ones from WordPress)
 * into one of the three illustration templates.
 *
 * portrait  — individual human subjects, biographical entries
 * object    — tangible items: food, fashion, craft, instruments, artefacts
 * scene     — everything else: places, movements, genres, concepts, events
 */
function classifyTemplateType(
  entryType: string
): "portrait" | "object" | "scene" {
  const t = entryType.toLowerCase().replace(/[-_\s]+/g, " ").trim();

  // Portrait: individual people and biographical figures
  if (
    /\b(person|people|figure|artist|musician|singer|rapper|writer|author|poet|novelist|activist|filmmaker|director|actor|actress|politician|philosopher|leader|thinker|sculptor|painter|photographer|dancer|athlete|architect|designer|chef|scholar|academic|intellectual|icon|legend|pioneer)\b/.test(t)
  ) {
    return "portrait";
  }

  // Film: cinematic works → scene template (a visual moment from the work)
  if (/\b(film|documentary|movie|cinema|short film)\b/.test(t)) {
    return "scene";
  }

  // Object/product: tangible items, material culture, and literary/music works
  if (
    /\b(food|dish|cuisine|drink|beverage|meal|snack|recipe|ingredient|fashion|clothing|garment|textile|fabric|cloth|print|pattern|weave|embroidery|craft|jewellery|jewelry|accessory|artefact|artifact|instrument|tool|object|product|sculpture|painting|installation|novel|book|album|song|artwork|piece|collection|ceramic|pottery|bead|wax print|kente|gele|headwrap|adire)\b/.test(t)
  ) {
    return "object";
  }

  // Scene: places, movements, genres, concepts, traditions, events, etc.
  return "scene";
}

/**
 * Build a context-aware Imagen 3 prompt based on the entry type.
 * Randomizes compositions and backgrounds to ensure a diverse directory.
 */
function buildImagePrompt(
  title: string,
  entryType: string,
  excerpt: string
): string {
  const context = excerpt.slice(0, 180);
  const template = classifyTemplateType(entryType);

  // Background varieties for randomization
  const bgVarieties = [
    "minimalist textured paper background",
    "abstract architectural geometry in ochre and ink",
    "moody indigo-black void with a geometric spotlight",
    "split-background using dynamic diagonal color blocks",
    "background featuring stylized silhouettes of cityscapes or palms",
  ];
  const bg = bgVarieties[Math.floor(Math.random() * bgVarieties.length)];

  // Composition varieties
  const portraitComps = ["heroic low-angle shot", "side-profile silhouette", "minimalist centered portrait"];
  const objectComps = ["dynamic bird's-eye view", "dramatic side-lighting", "heroic 3/4 view"];

  if (template === "portrait") {
    const comp = portraitComps[Math.floor(Math.random() * portraitComps.length)];
    return (
      `Flat geometric editorial portrait of ${title} (${entryType}). ` +
      `${comp} against a ${bg}. ` +
      `Face as a simplified architectural form with sharp shadow shapes. ` +
      `Minimal facial features (2-3 iconic lines for eyes and mouth). ` +
      `Stylized hair as a single dark shape with coarse texture. ` +
      `Geometric clothing as flat color masses. ` +
      `Context: ${context}. ` +
      STYLE_MODIFIERS
    );
  }

  if (template === "object") {
    const comp = objectComps[Math.floor(Math.random() * objectComps.length)];
    return (
      `Flat graphic editorial illustration of ${title} (${entryType}). ` +
      `${comp} shown against a ${bg}. ` +
      `The subject is rendered as a clean geometric icon. ` +
      `Use sharp, high-contrast shadow shapes to suggest volume. ` +
      `Stylized textures (crosshatching or dots) for surface details. ` +
      `Context: ${context}. ` +
      STYLE_MODIFIERS
    );
  }

  // Default: scene (place, movement, genre, etc.)
  return (
    `Abstract geometric scene illustration representing ${title} (${entryType}). ` +
    `Wide editorial composition against a ${bg}. ` +
    `Human figures as minimal silhouettes in the middle ground. ` +
    `Environment suggested through large blocks of color and sharp geometric shapes (circles, triangles, lines). ` +
    `Dramatic lighting through sharp diagonal shadow-planes. ` +
    `Fine stippling and ink-bleed effects for depth. ` +
    `Context: ${context}. ` +
    STYLE_MODIFIERS
  );
}

/**
 * Generate a styled editorial illustration for a directory entry.
 *
 * Two-tier approach:
 *   1. Imagen 3 via Vertex AI  — best quality, uses VERTEX_* credentials.
 *      Falls back automatically on quota exhaustion (429 / RESOURCE_EXHAUSTED).
 *   2. Gemini 2.0 Flash        — fallback, uses GEMINI_API_KEY, generous quota.
 *
 * Returns null only when neither backend is configured.
 * Throws on unexpected failures so callers can surface the real error.
 *
 * Must only be called from server-side code.
 */
export async function generateDirectoryImage(
  title: string,
  entryType: string,
  excerpt: string
): Promise<string | null> {
  const prompt = buildImagePrompt(title, entryType, excerpt);

  // ── Tier 1: Imagen 3 via Vertex AI ────────────────────────────────────────
  const vertexClient = createVertexClient();
  if (vertexClient) {
    try {
      const result = await (vertexClient.models as any).generateImages({
        model: "imagen-3.0-generate-002",
        prompt,
        config: { numberOfImages: 1, aspectRatio: "4:3" },
      });

      const imageData = result?.generatedImages?.[0]?.image?.imageBytes;
      if (imageData) {
        if (typeof imageData === "string") return imageData;
        const bytes =
          imageData instanceof Uint8Array ? imageData : new Uint8Array(imageData);
        let binary = "";
        for (let i = 0; i < bytes.length; i++)
          binary += String.fromCharCode(bytes[i]);
        return btoa(binary);
      }
    } catch (err: any) {
      const msg: string = err?.message ?? "";
      const isFallbackError =
        msg.includes("429") ||
        msg.includes("403") ||
        msg.includes("RESOURCE_EXHAUSTED") ||
        msg.includes("BILLING_DISABLED") ||
        msg.includes("PERMISSION_DENIED") ||
        msg.includes("Quota exceeded") ||
        msg.includes("billing");

      if (!isFallbackError) throw err;
      console.warn("Imagen 3 unavailable — falling back to Gemini Flash.", msg.slice(0, 120));
    }
  }

  // ── Tier 2: Gemini native image generation ───────────────────────────────
  // Requires TEXT + IMAGE modalities — IMAGE alone causes empty responses.
  // Only the experimental/preview variants support image output.
  if (!process.env.GEMINI_API_KEY) return null;

  const IMAGE_MODELS = [
    "gemini-2.5-flash-image",        // Confirmed available on this key
    "gemini-3.1-flash-image-preview", // Newer fallback
    "gemini-3-pro-image-preview",     // Pro fallback
  ];

  const imageErrors: string[] = [];

  for (const imageModel of IMAGE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: imageModel,
        contents: prompt,
        config: {
          responseModalities: ["TEXT", "IMAGE"],
          safetySettings: SAFETY_SETTINGS,
        } as any,
      });

      const parts: any[] =
        (response as any).candidates?.[0]?.content?.parts ?? [];

      for (const part of parts) {
        if (part.inlineData?.data) return part.inlineData.data as string;
      }
      imageErrors.push(`${imageModel}: responded but returned no image parts`);
    } catch (err: any) {
      imageErrors.push(`${imageModel}: ${err?.message ?? "unknown error"}`);
    }
  }

  // ── Tier 3: Pollinations.ai — free, no API key required ──────────────────
  // Uses FLUX models. Falls back here when both Vertex AI and Gemini are
  // unavailable due to billing restrictions.
  try {
    // Pollinations works best with a concise prompt — strip the long style
    // modifiers down to the first ~300 chars to stay within URL limits.
    const shortPrompt = prompt.slice(0, 300);
    const url =
      `https://image.pollinations.ai/prompt/${encodeURIComponent(shortPrompt)}` +
      `?width=1024&height=768&model=flux&nologo=true&seed=${Date.now() % 99999}`;

    const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const buffer = await res.arrayBuffer();
    if (buffer.byteLength < 1000) throw new Error("Response too small — likely an error page");

    return Buffer.from(buffer).toString("base64");
  } catch (err: any) {
    imageErrors.push(`pollinations.ai: ${err?.message ?? "unknown error"}`);
  }

  throw new Error(`All image generation tiers failed. ${imageErrors.join(" | ")}`);
}

/**
 * Generate a Culture Directory stub via Gemini 3 Flash.
 * Must only be called from server-side code (API routes, server components).
 */
export async function generateDirectoryStub(
  topic: string
): Promise<DirectoryStub> {
  let lastError: any = null;

  for (const modelId of TEXT_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: modelId,
        contents: `Generate a Culture Directory entry for: "${topic}"`,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          safetySettings: SAFETY_SETTINGS,
        },
      });
      console.log(`[gemini] ${modelId} response for "${topic}":`, JSON.stringify(response).slice(0, 200));

      // response.text can be null in SDK v1.x when responseMimeType is set —
      // fall back to the raw candidates structure as the image code does.
      const raw = (
        response.text ??
        (response as any).candidates?.[0]?.content?.parts?.[0]?.text ??
        ""
      ).trim();
      if (!raw) continue; // Try next model

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
    } catch (err: any) {
      console.warn(`Model ${modelId} failed for "${topic}":`, err?.message);
      lastError = err;
      continue; // Try next model
    }
  }

  throw new Error(`All models failed for "${topic}". Last error: ${lastError?.message || "Unknown error"}`);
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

  let lastError: any = null;

  for (const modelId of TEXT_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: modelId,
        contents: prompt,
        config: { safetySettings: SAFETY_SETTINGS },
      });

      const raw = (
        response.text ??
        (response as any).candidates?.[0]?.content?.parts?.[0]?.text ??
        ""
      ).trim();
      if (!raw) continue;

      const jsonStr = extractJson(raw);
      const topics: unknown = JSON.parse(jsonStr);

      if (!Array.isArray(topics)) continue;

      // Deduplicate against existing titles.
      const existingLower = new Set(existingTitles.map((t) => t.toLowerCase().trim()));
      return (topics as unknown[])
        .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
        .filter((t) => !existingLower.has(t.toLowerCase().trim()))
        .slice(0, 20);
    } catch (err: any) {
      console.warn(`Model ${modelId} failed for topics suggestion:`, err?.message);
      lastError = err;
      continue;
    }
  }

  throw new Error(`Failed to generate topic suggestions: ${lastError?.message || "Unknown error"}`);
}

/**
 * Ask Gemini to suggest high-impact, culturally relevant quotes from 
 * African and Diaspora thinkers, artists, and leaders.
 *
 * Returns an array of { text, author, source }.
 */
export async function generateSeedQuotes(
  count: number = 10
): Promise<Array<{ text: string; author: string; source: string }>> {
  const prompt = `You are a curator for The Moveee's Quote Archive — a place for wisdom, creativity, and cultural reflection.

Generate ${count} unique, high-impact quotes from notable African, Caribbean, or Diaspora figures (writers, musicians, leaders, artists, activists). 

Focus on themes of:
- Heritage and Identity
- Creativity and Expression
- Resilience and Freedom
- Future-facing optimism

Return ONLY a JSON array of objects. Each object must have:
- "text": The full quote text (no descriptions, just the quote)
- "author": The name of the person who said/wrote it
- "source": The book, film, song, or event where it originated

Example format:
[
  { "text": "...", "author": "...", "source": "..." }
]`;

  let lastError: any = null;

  for (const modelId of TEXT_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: modelId,
        contents: prompt,
        config: { safetySettings: SAFETY_SETTINGS },
      });

      const raw = (
        response.text ??
        (response as any).candidates?.[0]?.content?.parts?.[0]?.text ??
        ""
      ).trim();
      if (!raw) continue;

      const jsonStr = extractJson(raw);
      const quotes: any = JSON.parse(jsonStr);

      if (!Array.isArray(quotes)) continue;

      return quotes
        .filter((q: any) => q.text && q.author)
        .map((q: any) => ({
          text: String(q.text),
          author: String(q.author),
          source: String(q.source || ""),
        }))
        .slice(0, count);
    } catch (err: any) {
      console.warn(`Model ${modelId} failed for quotes generation:`, err?.message);
      lastError = err;
      continue;
    }
  }

  throw new Error(`Failed to generate seed quotes: ${lastError?.message || "Unknown error"}`);
}
