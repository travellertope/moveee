import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// Google AI Studio client — used for all text generation.
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

/**
 * Lazily create a Vertex AI client for Imagen 3 image generation.
 * Requires VERTEX_PROJECT, VERTEX_CLIENT_EMAIL, and VERTEX_PRIVATE_KEY env vars.
 * Returns null when any required variable is absent so image generation
 * degrades gracefully rather than crashing at startup.
 */
function createVertexClient(): any | null {
  return null; // Disabled: incompatible with new SDK. Use Gemini or Pollinations fallback.
}

// Model priority order — highest free-tier RPM first.
// 15 RPM: gemini-2.5-flash-lite, gemini-3.1-flash-lite
// 10 RPM: gemini-3-flash-preview
//  5 RPM: gemini-2.0-flash, gemini-2.0-flash-lite
const TEXT_MODELS = [
  "gemini-2.5-flash-lite",        // 15 RPM free
  "gemini-3.1-flash-lite",        // 15 RPM free
  "gemini-3-flash-preview",       // 10 RPM free (confirmed ID)
  "gemini-2.0-flash",             //  5 RPM free
  "gemini-2.0-flash-lite",        //  5 RPM free
  "gemini-1.5-flash",             // legacy fallback
  "gemini-1.5-flash-8b",          // legacy fallback
];

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function isRateLimitErr(msg: string): boolean {
  return msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("Quota exceeded");
}

/**
 * Try every model in TEXT_MODELS. If all are rate-limited, wait 60 s and retry
 * — up to 3 extra attempts. Stops retrying immediately if any failure is NOT
 * a rate-limit error (e.g. bad prompt, JSON parse failure).
 *
 * The callback receives the modelId and should return a non-null value on
 * success, or null/undefined to silently skip to the next model.
 */
async function loopWithRetry<T>(
  label: string,
  attempt: (modelId: string) => Promise<T | null | undefined>
): Promise<T> {
  let lastErr: any;

  for (let pass = 0; pass < 4; pass++) {
    if (pass > 0) {
      const wait = 60_000 * pass; // 60 s, 120 s, 180 s
      console.warn(`[gemini:${label}] All models quota-limited — waiting ${wait / 1000}s (retry ${pass}/3)…`);
      await sleep(wait);
    }

    let rateLimitedCount = 0;

    for (const modelId of TEXT_MODELS) {
      try {
        const result = await attempt(modelId);
        if (result !== null && result !== undefined) return result as T;
      } catch (err: any) {
        lastErr = err;
        const msg: string = err?.message ?? "";
        if (isRateLimitErr(msg)) {
          rateLimitedCount++;
          console.warn(`[gemini:${label}] ${modelId} rate-limited`);
        } else {
          console.warn(`[gemini:${label}] ${modelId} failed: ${msg.slice(0, 120)}`);
        }
      }
    }

    // Not all failures were rate-limit errors — retrying won't help
    if (rateLimitedCount < TEXT_MODELS.length) break;
  }

  throw lastErr ?? new Error(`[gemini:${label}] All models failed`);
}

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
  "tv-series",
] as const;

export type EntryType = (typeof ENTRY_TYPE_SLUGS)[number];

export interface DirectoryInfobox {
  // person
  born?: string; died?: string; nationality?: string; occupation?: string;
  knownFor?: string; originCity?: string; activeYears?: string; awards?: string;
  labels?: string; education?: string;
  // place
  country?: string; region?: string; population?: string; officialLanguage?: string;
  currency?: string; founded?: string; area?: string;
  // movement
  founders?: string; originCountry?: string; activePeriod?: string; ideology?: string;
  keyFigures?: string; relatedMovements?: string;
  // genre
  originDecade?: string; instruments?: string; tempoBpm?: string; keyArtists?: string;
  relatedGenres?: string; subgenres?: string;
  // concept
  keyThinkers?: string; period?: string; relatedConcepts?: string;
  // film
  director?: string; year?: string; starring?: string; cinematographer?: string;
  language?: string; distributor?: string; runtime?: string; productionCompany?: string;
  // book
  author?: string; yearPublished?: string; genre?: string; publisher?: string;
  pages?: string; isbn?: string;
  // artwork
  artist?: string; medium?: string; dimensions?: string; currentLocation?: string;
  artCollection?: string; style?: string;
  // food
  foodType?: string; mainIngredients?: string; alsoKnownAs?: string; culturalContext?: string;
  // fashion
  origin?: string; era?: string; keyDesigners?: string; materials?: string;
  culturalSignificance?: string;
  // tv-series
  creator?: string; network?: string; seasons?: string; years?: string;
}

export interface DirectoryStub {
  title: string;
  excerpt: string;
  content: string;
  entryType: EntryType;
  interests: string[];
  suggestedLinks: string[];
  infobox: DirectoryInfobox;
}

export interface ImageResult {
  data: string;        // base64-encoded image
  title: string;       // visual descriptive title for the media library
  description: string; // visual description of what is in the image
  altText: string;     // concise alt text describing the visual
}

/**
 * Derive descriptive visual metadata from the image template type.
 * Describes what is VISIBLE in the illustration — not the cultural topic —
 * so the Visuals directory is searchable by visual keywords.
 */
function buildImageMetadata(entryType: string): { title: string; description: string; altText: string } {
  const template = classifyTemplateType(entryType);
  const typeLabel = entryType.toLowerCase();
  const palette =
    "Restricted palette: deep ink, burnt ochre, gold brass, cream paper, moss green, indigo. " +
    "Matte finish, generous negative space, no photorealism.";

  if (template === "portrait") {
    return {
      title: `Flat geometric portrait illustration — ${typeLabel}`,
      altText:
        "Flat geometric editorial portrait. Simplified face as an architectural form with sharp shadow shapes. " +
        "Geometric clothing in flat colour masses. Ochre, ink and gold editorial palette.",
      description:
        "Flat geometric editorial portrait illustration in The Moveee's signature visual style. " +
        "Face rendered as a simplified architectural form — 2–3 iconic lines for eyes and mouth. " +
        "Sharp geometric shadow shapes define volume. Stylised hair as a single dark geometric mass. " +
        "Geometric clothing depicted as flat colour blocks. " + palette,
    };
  }

  if (template === "object") {
    return {
      title: `Flat geometric ${typeLabel} illustration — editorial icon style`,
      altText:
        `Flat geometric editorial illustration of a ${typeLabel} as a clean geometric icon. ` +
        "Crosshatch and stipple textures. Ochre, ink and gold editorial palette.",
      description:
        `Flat graphic editorial illustration of a ${typeLabel} in The Moveee's signature visual style. ` +
        "Subject rendered as a clean geometric icon with sharp high-contrast shadow shapes suggesting volume. " +
        "Crosshatching or stippling texture for surface detail. Dramatic side or bird's-eye lighting. " + palette,
    };
  }

  // Scene: place, movement, genre, concept, film, book
  return {
    title: `Abstract geometric scene illustration — ${typeLabel}, editorial wide format`,
    altText:
      "Wide abstract geometric editorial scene with minimal silhouette figures. " +
      "Large colour blocks and sharp diagonal shapes in ochre, ink and gold palette.",
    description:
      "Abstract geometric scene illustration in The Moveee's signature editorial style. " +
      "Wide format composition featuring minimal human silhouettes in the middle ground. " +
      "Environment built from large colour blocks and sharp geometric shapes — circles, triangles, diagonal lines. " +
      "Dramatic lighting via sharp shadow planes. Fine stippling and ink-bleed effects for depth. " + palette,
  };
}

const SYSTEM_PROMPT = `You are a knowledgeable curator for The Moveee's Culture Directory — a wiki-like reference celebrating African and diaspora culture.

Given a topic name, generate a concise, encyclopedia-style entry stub. Return ONLY valid JSON — no markdown, no code fences, no explanation.

The JSON must match this exact structure:
{
  "title": "The canonical name of the entry",
  "excerpt": "One or two sentences summarising this entry (plain text, no HTML tags)",
  "content": "Full HTML body using ONLY <p>, <h2>, <ul>, <li> tags. Must include: an overview paragraph, a Cultural Significance section, and a Legacy or Related Works section. Minimum 4 paragraphs total.",
  "entryType": "exactly one of the following — choose the most specific match:\n  person    = an individual human being (musician, writer, artist, activist, filmmaker, philosopher, etc.)\n  place     = a geographic location (city, neighbourhood, landmark, region, market)\n  movement  = a cultural, political, or artistic movement or era (Pan-Africanism, Harlem Renaissance)\n  genre     = a musical or artistic genre or style (Afrobeats, Highlife, Amapiano, Nollywood as a film industry)\n  concept   = an idea, philosophy, practice, or tradition (Ubuntu, Sankofa, Griot tradition, Adinkra symbols)\n  film      = a specific film or documentary (feature film, short film, documentary — NOT a series)\n  book      = a specific published book (novel, essay collection, poetry collection, memoir)\n  artwork   = a specific visual artwork, sculpture, installation, or album/music recording\n  food      = a specific dish, ingredient, or food tradition\n  fashion   = a specific garment, textile, fabric, or fashion tradition\n  tv-series = a television or streaming series, web series, or miniseries",
  "interests": ["2-5 relevant interest slugs, lowercase, hyphenated. Choose from: music, visual-art, food-drink, fashion, literature, film, history, politics, spirituality, dance, theatre, sport, architecture, photography"],
  "suggestedLinks": ["2-4 names of related topics that would make good linked entries in the same directory"],
  "infobox": {
    // MANDATORY: Fill as many fields as possible for the given entryType. 
    // High-density metadata is a priority. Omit a field ONLY if the information is impossible to find or estimate.
    // All values must be strings.
    //
    // person:    born, died, nationality, occupation, knownFor, originCity, activeYears, awards, labels, education
    // place:     country, region, population, officialLanguage, currency, founded, area
    // movement:  founded, founders, originCountry, activePeriod, ideology, keyFigures, relatedMovements
    // genre:     originCountry, originDecade, instruments, tempoBpm, keyArtists, relatedGenres, subgenres
    // concept:   originCountry, keyThinkers, period, knownFor, relatedConcepts
    // film:      director, year, starring, cinematographer, country, language, distributor, runtime, productionCompany
    // book:      author, yearPublished, genre, publisher, language, pages, isbn
    // artwork:   artist, year, medium, dimensions, currentLocation, artCollection, style
    // food:      originCountry, foodType, mainIngredients, alsoKnownAs, culturalContext
    // fashion:   origin, era, keyDesigners, materials, style, culturalSignificance
    // tv-series: creator, network, seasons, years, starring, country, language, genre
  }
}

Focus on African, Caribbean, and global diaspora contexts. Be factual, culturally respectful, and celebratory in tone. For infobox data, use approximate values (e.g. "c. 1920" or "late 90s") if exact data is unavailable, as this is better than an empty field.`;

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

const IMAGE_PROMPT_BRIEF_INSTRUCTION = `You are a visual art director briefing an illustrator for a premium editorial magazine called Moveee, which celebrates African and Black diasporan culture.

Given a directory entry, write a single illustration brief (2–4 sentences) describing WHAT TO DRAW. Be highly specific to this exact subject — extract concrete visual elements from the content: specific objects, garments, architecture, instruments, landscapes, gestures, cultural symbols, time period, geography. No generic descriptions.

The illustration must always use: flat geometric shapes, dry-brush paper grain, coarse stippling, ink bleeds, sharp geometric shadow blocks, matte finish, generous negative space. Palette locked to: deep ink (#14110d), burnt ochre (#c5491f), dark ochre (#8a2d10), gold brass (#b38238), moss green (#3d4a2a), cream paper (#f3ece0), indigo (#1e2b42). No photorealism, no gradients, no white.

For PORTRAIT entries: describe the figure's specific pose, their distinctive clothing or signature look, a meaningful object they're associated with, and a background that references their world (not generic).
For OBJECT entries: describe the object's specific form, texture, cultural markings or details, and a setting or arrangement that places it in cultural context.
For SCENE entries: describe the specific environment, what human figures (if any) are doing, what architectural or natural features dominate, and what geometric shapes carry the composition.

Return ONLY the brief — no labels, no preamble.`;

async function buildImagePromptWithAI(
  title: string,
  entryType: string,
  excerpt: string
): Promise<string> {
  const template = classifyTemplateType(entryType);
  const contents =
    IMAGE_PROMPT_BRIEF_INSTRUCTION +
    `\n\nEntry: "${title}" (type: ${entryType}, template: ${template})\n` +
    `Description: ${excerpt.slice(0, 400) || "(no description provided)"}`;

  try {
    return await loopWithRetry("image-prompt", async (modelId) => {
      const model = ai.getGenerativeModel({
        model: modelId,
        safetySettings: SAFETY_SETTINGS,
        generationConfig: { temperature: 0.9, maxOutputTokens: 200 },
      });
      const brief = (await (await model.generateContent(contents)).response).text().trim();
      if (brief.length <= 30) return null;
      const fullPrompt =
        brief + " " +
        "Strictly restricted palette: deep ink (#14110d), burnt ochre (#c5491f), dark ochre (#8a2d10), " +
        "gold brass (#b38238), moss green (#3d4a2a), cream paper (#f3ece0), indigo (#1e2b42) — no saturated blues/purples, no white. " +
        "Premium editorial magazine illustration. Flat geometric shapes with dry-brush paper grain, coarse stippling, ink bleeds. " +
        "Shading via sharp geometric shadow blocks, no soft gradients. No photorealism, no 3D rendering, matte finish, generous negative space.";
      console.log(`[image-prompt] AI brief for "${title}": ${brief.slice(0, 120)}...`);
      return fullPrompt;
    });
  } catch {
    console.warn(`[image-prompt] All models failed for "${title}" — using fallback template`);
    return buildImagePromptFallback(title, entryType, excerpt);
  }
}

function buildImagePromptFallback(title: string, entryType: string, excerpt: string): string {
  const context = excerpt.slice(0, 180);
  const template = classifyTemplateType(entryType);

  if (template === "portrait") {
    return (
      `Flat geometric editorial portrait of ${title} (${entryType}). ` +
      `Heroic low-angle silhouette with sharp shadow shapes for facial features. ` +
      `Stylized hair as a single dark shape with coarse texture. Geometric clothing as flat color masses. ` +
      `Context: ${context}. ` + STYLE_MODIFIERS
    );
  }
  if (template === "object") {
    return (
      `Flat graphic editorial illustration of ${title} (${entryType}). ` +
      `The subject rendered as a clean geometric icon with stylized crosshatch textures. ` +
      `Sharp high-contrast shadow shapes suggest volume. ` +
      `Context: ${context}. ` + STYLE_MODIFIERS
    );
  }
  return (
    `Abstract geometric scene illustration representing ${title} (${entryType}). ` +
    `Wide editorial composition. Human figures as minimal silhouettes. ` +
    `Environment suggested through large color blocks and sharp geometric shapes. ` +
    `Context: ${context}. ` + STYLE_MODIFIERS
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
): Promise<ImageResult> {
  const prompt = await buildImagePromptWithAI(title, entryType, excerpt);
  const meta = buildImageMetadata(entryType);
  const imageErrors: string[] = [];

  const wrap = (data: string): ImageResult => ({ data, ...meta });

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
        if (typeof imageData === "string") return wrap(imageData);
        const bytes =
          imageData instanceof Uint8Array ? imageData : new Uint8Array(imageData);
        let binary = "";
        for (let i = 0; i < bytes.length; i++)
          binary += String.fromCharCode(bytes[i]);
        return wrap(btoa(binary));
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
      console.warn("Imagen 3 unavailable — falling back.", msg.slice(0, 120));
    }
  }

  // ── Tier 2: Gemini native image generation ───────────────────────────────
  if (process.env.GEMINI_API_KEY) {
    const IMAGE_MODELS = [
      "gemini-2.5-flash-image",
      "gemini-3.1-flash-image-preview",
      "gemini-3-pro-image-preview",
    ];

    for (const imageModel of IMAGE_MODELS) {
      try {
        const model = ai.getGenerativeModel({
          model: imageModel,
          safetySettings: SAFETY_SETTINGS,
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
          } as any,
        });
        const result = await model.generateContent(prompt);
        const response = await result.response;

        const parts: any[] =
          (response as any).candidates?.[0]?.content?.parts ?? [];

        for (const part of parts) {
          if (part.inlineData?.data) return wrap(part.inlineData.data as string);
        }
        imageErrors.push(`${imageModel}: responded but returned no image parts`);
      } catch (err: any) {
        imageErrors.push(`${imageModel}: ${err?.message ?? "unknown error"}`);
      }
    }
  }

  // ── Tier 3: Pollinations.ai — free, no API key required ──────────────────
  try {
    const shortPrompt = prompt.slice(0, 300);
    const url =
      `https://image.pollinations.ai/prompt/${encodeURIComponent(shortPrompt)}` +
      `?width=1024&height=768&model=flux&nologo=true&seed=${Date.now() % 99999}`;

    const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const buffer = await res.arrayBuffer();
    if (buffer.byteLength < 1000) throw new Error("Response too small — likely an error page");

    return wrap(Buffer.from(buffer).toString("base64"));
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
  return loopWithRetry("generateDirectoryStub", async (modelId) => {
    const model = ai.getGenerativeModel({
      model: modelId,
      systemInstruction: SYSTEM_PROMPT,
      safetySettings: SAFETY_SETTINGS,
    });
    const raw = (await (await model.generateContent(`Generate a Culture Directory entry for: "${topic}"`)).response).text().trim();
    if (!raw) return null;

    const parsed = JSON.parse(extractJson(raw)) as DirectoryStub;
    if (!ENTRY_TYPE_SLUGS.includes(parsed.entryType as EntryType)) parsed.entryType = "concept";
    if (!Array.isArray(parsed.interests)) parsed.interests = [];
    if (!Array.isArray(parsed.suggestedLinks)) parsed.suggestedLinks = [];
    if (!parsed.infobox || typeof parsed.infobox !== "object" || Array.isArray(parsed.infobox)) {
      parsed.infobox = {};
    } else {
      const clean: DirectoryInfobox = {};
      for (const [k, v] of Object.entries(parsed.infobox)) {
        if (typeof v === "string" && v.trim()) (clean as any)[k] = v.trim();
      }
      parsed.infobox = clean;
    }
    return parsed;
  });
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

  const existingLower = new Set(existingTitles.map((t) => t.toLowerCase().trim()));

  return loopWithRetry("generateTopicSuggestions", async (modelId) => {
    const model = ai.getGenerativeModel({ model: modelId, safetySettings: SAFETY_SETTINGS });
    const raw = (await (await model.generateContent(prompt)).response).text().trim();
    if (!raw) return null;
    const topics: unknown = JSON.parse(extractJson(raw));
    if (!Array.isArray(topics)) return null;
    return (topics as unknown[])
      .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
      .filter((t) => !existingLower.has(t.toLowerCase().trim()))
      .slice(0, 20);
  });
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

  return loopWithRetry("generateSeedQuotes", async (modelId) => {
    const model = ai.getGenerativeModel({ model: modelId, safetySettings: SAFETY_SETTINGS });
    const raw = (await (await model.generateContent(prompt)).response).text().trim();
    if (!raw) return null;
    const quotes: any = JSON.parse(extractJson(raw));
    if (!Array.isArray(quotes)) return null;
    const filtered = quotes
      .filter((q: any) => q.text && q.author)
      .map((q: any) => ({ text: String(q.text), author: String(q.author), source: String(q.source || "") }))
      .slice(0, count);
    return filtered.length ? filtered : null;
  });
}

/**
 * Extract verified quotes from Serper search results.
 *
 * Gemini is an EXTRACTOR here, not a generator. It may only return quotes
 * whose exact text appears verbatim in the supplied search snippets.
 * It must not recall quotes from training data, paraphrase, or invent.
 *
 * @param results  Raw Serper organic results for this author.
 * @param author   Name of the person whose quotes we are extracting.
 * @param maxQuotes Maximum quotes to return (default 4).
 */
export async function searchAndExtractQuotes(
  results: Array<{ title: string; link: string; snippet: string }>,
  author: string,
  maxQuotes: number = 4
): Promise<Array<{ text: string; author: string; source: string; source_url: string }>> {
  if (!results.length) return [];

  const resultsJson = JSON.stringify(
    results.map((r, i) => ({ id: i, title: r.title, url: r.link, snippet: r.snippet }))
  );

  const prompt = `You are a quote verification assistant for The Moveee — an African and diaspora culture platform.

You have been given ${results.length} web search results that may contain real quotes by ${author}.

STRICT RULES — follow exactly:
1. Extract ONLY quotes whose EXACT text appears verbatim in one of the snippets below.
2. DO NOT use your training data to recall or reconstruct quotes. If you know a quote but cannot see it in the snippets, skip it.
3. DO NOT complete partial quotes. If a snippet shows the start of a quote but cuts off, skip it.
4. DO NOT paraphrase. The "text" field must be the exact wording from the snippet.
5. Prefer results from wikiquote.org, goodreads.com, published books, or recorded speeches.
6. Minimum quote length: 10 words. Skip sentence fragments.
7. It is better to return 1 verified quote than 4 uncertain ones. Return [] if nothing is verifiable.

Return a JSON array. Each object must have exactly these fields:
{
  "text": "Exact verbatim quote as found in the snippet",
  "author": "${author}",
  "source": "Book title, speech name, film, or interview — from the snippet or URL. Empty string if unknown.",
  "source_url": "URL of the search result where the quote was found"
}

Return ONLY the JSON array, no commentary. If nothing is verifiable, return [].

Search results:
${resultsJson}`;

  try {
    return await loopWithRetry("searchAndExtractQuotes", async (modelId) => {
      const model = ai.getGenerativeModel({ model: modelId, safetySettings: SAFETY_SETTINGS });
      const raw = (await (await model.generateContent(prompt)).response).text().trim();
      if (!raw) return null;
      const quotes: unknown = JSON.parse(extractJson(raw));
      if (!Array.isArray(quotes)) return null;
      return (quotes as any[])
        .filter((q) => q.text && String(q.text).trim().split(/\s+/).length >= 10)
        .map((q) => ({
          text:       String(q.text).trim(),
          author:     String(q.author  || author),
          source:     String(q.source  || ""),
          source_url: String(q.source_url || ""),
        }))
        .slice(0, maxQuotes);
    });
  } catch (err: any) {
    console.error("[searchAndExtractQuotes] All models failed:", err?.message);
    return [];
  }
}

// ── Quote authenticity verification ──────────────────────────────────────────

export type AuditVerdict = "verified" | "suspicious" | "likely-fabricated" | "unverifiable";

export interface AuditResult {
  verdict: AuditVerdict;
  reason: string;
}

/**
 * Ask Gemini to assess whether an existing database quote is authentic.
 *
 * Gemini acts as a FACT-CHECKER, not a generator. It must base its verdict
 * ONLY on what appears in the supplied search results. If no results mention
 * the quote, "unverifiable" is the correct answer — NOT "likely-fabricated".
 *
 * Verdicts:
 *   verified          — exact (or near-verbatim) text found in a reliable source
 *   suspicious        — found but wording differs, source is dubious, or attribution conflicts
 *   likely-fabricated — strong evidence the quote is misattributed or invented
 *   unverifiable      — no search results confirm or deny (neutral — not a condemnation)
 */
export async function verifyExistingQuote(
  quoteText: string,
  author: string,
  source: string,
  searchResults: Array<{ title: string; link: string; snippet: string }>
): Promise<AuditResult> {
  const resultsJson = searchResults.length
    ? JSON.stringify(
        searchResults.map((r, i) => ({ id: i, title: r.title, url: r.link, snippet: r.snippet }))
      )
    : "[]";

  const prompt = `You are a quote fact-checker for The Moveee — an African and diaspora culture platform. Your job is to assess whether a quote in our database is authentic.

Quote to verify:
  Text:   "${quoteText}"
  Author: "${author}"
  Source: "${source || "(unknown)"}"

You have been given ${searchResults.length} web search results that may help you judge authenticity.

VERDICT RULES — choose exactly one:
• "verified"          — The exact (or very close to verbatim) text is found attributed to this author in at least one of the snippets, AND the source is credible (Wikiquote, published book, recorded speech, reputable journalism).
• "suspicious"        — The quote appears in results BUT the wording differs noticeably, attribution conflicts with another person, or the only sources are low-quality sites.
• "likely-fabricated" — A snippet explicitly says the quote is misattributed, debunked, or not from this person. OR the quote appears attributed to a completely different person in the results.
• "unverifiable"      — The search results contain no useful signal either way. This is NOT a negative verdict; it simply means more research is needed.

IMPORTANT: Do NOT use your training data memory to recall or verify quotes. Base your verdict ONLY on what is visible in the snippets below. If the snippets are empty or irrelevant, verdict must be "unverifiable".

Return ONLY valid JSON — no commentary:
{
  "verdict": "verified" | "suspicious" | "likely-fabricated" | "unverifiable",
  "reason": "One or two sentences explaining the verdict, citing specific snippets where possible."
}

Search results:
${resultsJson}`;

  const validVerdicts: AuditVerdict[] = ["verified", "suspicious", "likely-fabricated", "unverifiable"];
  try {
    return await loopWithRetry("verifyExistingQuote", async (modelId) => {
      const model = ai.getGenerativeModel({ model: modelId, safetySettings: SAFETY_SETTINGS });
      const raw = (await (await model.generateContent(prompt)).response).text().trim();
      if (!raw) return null;
      const parsed: any = JSON.parse(extractJson(raw));
      const verdict: AuditVerdict = validVerdicts.includes(parsed.verdict) ? parsed.verdict : "unverifiable";
      const reason: string = String(parsed.reason ?? "No reason provided.").slice(0, 400);
      return { verdict, reason };
    });
  } catch (err: any) {
    console.error("[verifyExistingQuote] All models failed:", err?.message);
    return { verdict: "unverifiable", reason: "Verification service unavailable." };
  }
}

// ── Events discovery ─────────────────────────────────────────────────────────

export interface SerperResult {
  title: string;
  link: string;
  snippet: string;
  date?: string;
}

export interface EventStub {
  title: string;
  tagline: string;
  excerpt: string;
  content: string;
  event_date: string;      // ISO 8601: YYYY-MM-DDTHH:mm
  end_date: string;
  location: string;        // Venue name + address
  city: string;
  admission: string;       // "Free" | "£15" | "From $20" etc.
  ticketing_url: string;
  attribution: string;     // Source URL
  interests: string[];     // culture_interest taxonomy slugs
  relevant: boolean;
}

const INTEREST_SLUGS = [
  "music", "visual-arts", "film", "literature", "fashion",
  "food", "architecture", "dance", "theatre", "photography",
  "design", "craft", "performance", "community", "heritage",
  "sports", "wellness", "technology", "education",
];

/**
 * Pass raw Serper search results to Gemini.
 * Gemini filters for community relevance, extracts structured fields,
 * and returns up to maxEvents EventStub objects.
 */
/**
 * Use Gemini with Google Search grounding to research an event and return
 * a richer 3–4 paragraph content block for the event's detail page.
 * Falls back to the original excerpt if all models fail.
 */
export async function enrichEventContent(
  title: string,
  city: string,
  eventDate: string,
  originalExcerpt: string
): Promise<string> {
  const prompt = `You are the editorial writer for The Moveee — a cultural platform for the African and global diaspora. Use Google Search to research this event and write a rich editorial description for its detail page.

Event: "${title}"
City: ${city}
Date: ${eventDate}

Write 3–4 paragraphs (total ~250–350 words) covering:
1. What the event is and who's involved (be specific — name artists, curators, speakers, or organisations)
2. Cultural or historical context — why this event matters to the African/diaspora community
3. What to expect: programme highlights, atmosphere, format
4. Practical note: location/neighbourhood character, any ticketing detail found, and why this is worth attending

Use an editorial voice — warm, knowledgeable, specific. No marketing clichés. Return ONLY the plain text (no JSON, no markdown, no headings). Separate paragraphs with a blank line.`;

  try {
    return await loopWithRetry("enrichEventContent", async (modelId) => {
      const model = ai.getGenerativeModel({
        model: modelId,
        safetySettings: SAFETY_SETTINGS,
        generationConfig: { temperature: 0.3 },
        tools: [{ googleSearch: {} }] as any,
      });
      const text = (await (await model.generateContent(prompt)).response).text().trim();
      return text && text.length > 100 ? text : null;
    });
  } catch {
    return originalExcerpt;
  }
}

export async function evaluateAndExtractEvents(
  results: SerperResult[],
  city: string,
  currentDate: string,
  maxEvents: number = 8
): Promise<EventStub[]> {
  if (!results.length) return [];

  const resultsJson = JSON.stringify(
    results.map((r, i) => ({ id: i, title: r.title, url: r.link, snippet: r.snippet, article_published: r.date ?? "" }))
  );

  const prompt = `You are the events curator for The Moveee — an independent cultural platform for the African and global diaspora community. Today's date is ${currentDate}.

You have been given ${results.length} web search results about events in ${city}. Your job is to:

1. FILTER: Only include events that are:
   - Genuinely upcoming (start date is after ${currentDate}) — skip past events
   - Actually a discrete event (not a listicle, news article, venue homepage, or general "things to do" guide)
   - Culturally interesting: music, art exhibitions, film screenings, literature, fashion, food, theatre, dance, cultural festivals, community gatherings. Especially relevant if connected to African, Caribbean, diaspora, or global South culture — but excellent events of any kind are welcome.

2. EXTRACT DATES — this is the most critical step:
   The \`article_published\` field is when the web page was crawled by Google — it is NEVER the event date. Ignore it for date purposes.

   To find the real event date, scan the snippet for these signals (in order of reliability):
   a) Explicit date text: "Saturday 14 June", "June 14", "14/06/2025", "Jun 14, 2025", "2025-06-14"
   b) Weekday + relative week: "this Saturday", "next Friday" — resolve against today (${currentDate})
   c) Month-range text for exhibitions: "runs until 30 August", "on view through September 12", "open until..."
      → set event_date to the exhibition OPENING date if mentioned, else the earliest date in the snippet
      → set end_date to the closing date
   d) Ticketing URL patterns: Eventbrite URLs sometimes embed dates (e.g. /e/event-name-12345678)
   e) Structured date fragments in the snippet like "When: ...", "Date: ...", "Doors: ..."

   If after careful scanning you still cannot identify a specific event date, set event_date to "" — the event will be skipped.
   Never guess or invent a date. Never use the article_published date as the event date.

3. EXTRACT END DATES: For exhibitions, runs, and festivals that span multiple days or weeks:
   - Always try to extract end_date from phrases like "until", "through", "closes", "runs to", "ending"
   - Format: YYYY-MM-DDTHH:mm or YYYY-MM-DD
   - A single-night event's end_date can be left empty

4. COMPOSE: Write a short, editorial tagline (1 sentence, present tense, evocative — not a press release) and a longer excerpt (2-3 sentences with cultural context).

Available interest slugs (use only these): ${INTEREST_SLUGS.join(", ")}

Return a JSON array. Each object must have exactly these fields:
{
  "title": "Full event title",
  "tagline": "One evocative sentence about the event",
  "excerpt": "2-3 sentence editorial description with cultural context",
  "content": "Same as excerpt — expand if more detail is available in the snippet",
  "event_date": "YYYY-MM-DDTHH:mm or YYYY-MM-DD — the actual event/opening start date, NOT article_published",
  "end_date": "YYYY-MM-DDTHH:mm or YYYY-MM-DD for multi-day events — empty string for single-night events",
  "location": "Venue name and address if available",
  "city": "${city}",
  "admission": "Free / price / empty string if unknown",
  "ticketing_url": "Direct ticket/event URL from the search result",
  "attribution": "Source URL from the search result",
  "interests": ["slug1", "slug2"],
  "relevant": true
}

If a result is NOT relevant, skip it entirely — do not include it with relevant: false.
If you cannot determine the actual event date from the snippet text, set event_date to "" and it will be skipped.
Return at most ${maxEvents} events. Return ONLY the JSON array, no commentary.

Search results:
${resultsJson}`;

  return loopWithRetry("evaluateAndExtractEvents", async (modelId) => {
    const model = ai.getGenerativeModel({ model: modelId, safetySettings: SAFETY_SETTINGS });
    const raw = (await (await model.generateContent(prompt)).response).text().trim();
    if (!raw) return null;
    const parsed: unknown = JSON.parse(extractJson(raw));
    if (!Array.isArray(parsed)) return null;
    return (parsed as any[])
      .filter((e) => e.title && e.event_date && e.relevant !== false)
      .map((e) => ({
        title:         String(e.title || "").trim(),
        tagline:       String(e.tagline || "").trim(),
        excerpt:       String(e.excerpt || "").trim(),
        content:       String(e.content || e.excerpt || "").trim(),
        event_date:    String(e.event_date || "").trim(),
        end_date:      String(e.end_date || "").trim(),
        location:      String(e.location || "").trim(),
        city:          String(e.city || city).trim(),
        admission:     String(e.admission || "").trim(),
        ticketing_url: String(e.ticketing_url || "").trim(),
        attribution:   String(e.attribution || "").trim(),
        interests:     Array.isArray(e.interests) ? e.interests.filter((s: any) => INTEREST_SLUGS.includes(s)) : [],
        relevant:      true,
      }))
      .slice(0, maxEvents);
  });
}
