/**
 * POST /api/directory/auto-populate
 *
 * Background job that seeds the Culture Directory. Each run:
 *   1. Pulls SEED_TOPICS (hardcoded) + extra topics stored in WordPress.
 *   2. Filters out topics already published (by title) AND topics previously
 *      submitted (by original seed string — survives Gemini title changes).
 *   3. If pending topics remain, generates up to `batchSize` stubs via Gemini.
 *   4. If ALL topics are exhausted, asks Gemini to suggest 20 new ones,
 *      saves them to WordPress, and runs the first batch immediately.
 *
 * Auth: requires Authorization: Bearer {CRON_SECRET} header.
 * Configured in vercel.json to run every Monday at 03:00 UTC.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  generateDirectoryStub,
  generateDirectoryImage,
  generateTopicSuggestions,
} from "@/lib/gemini";
import { uploadToR2 } from "@/lib/r2";

export const runtime = "nodejs";
export const maxDuration = 300;

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const WP_GRAPHQL = `${WP_URL}/graphql`;

// ── Hardcoded seed list ────────────────────────────────────────────────────
const SEED_TOPICS = [
  // People
  "Fela Kuti", "Miriam Makeba", "Chinua Achebe", "Wole Soyinka",
  "Chimamanda Ngozi Adichie", "Toni Morrison", "Langston Hughes",
  "Jean-Michel Basquiat", "Kwame Nkrumah", "Steve Biko",
  "Nina Simone", "James Baldwin", "Frantz Fanon", "Octavia Butler",
  "Wizkid", "Burna Boy", "Angélique Kidjo", "Hugh Masekela",
  "Aimé Césaire", "Édouard Glissant", "El Anatsui", "Malick Sidibé",
  "Yinka Shonibare", "Njideka Akunyili Crosby", "Kehinde Wiley",
  // Places
  "Lagos", "Accra", "Nairobi", "Dakar", "Harlem", "Brixton",
  "Johannesburg", "Kingston (Jamaica)", "Port-of-Spain",
  "Marrakech", "Cape Town", "Abidjan",
  // Movements & Genres
  "Afrobeats", "Highlife", "Afrobeat", "Jùjú music", "Afrofuturism",
  "Pan-Africanism", "Negritude", "Black Arts Movement",
  "Harlem Renaissance", "Nollywood", "New African Cinema",
  "Afropunk", "Amapiano",
  // Concepts & Practices
  "Ubuntu (philosophy)", "Sankofa", "Diaspora aesthetics",
  "African wax print", "Ankara fabric", "Kente cloth",
  "Adinkra symbols", "Djembe", "Griot tradition",
  // Food & Fashion
  "Jollof Rice", "Egusi soup", "Suya", "Thieboudienne",
  "Piri Piri", "Akara", "Sadza",
  // Artworks / Landmarks
  "Black Panther (film)", "I Am Not Your Negro (film)",
  "Things Fall Apart (novel)", "Song of Solomon (novel)",
  "Beloved (novel)", "Purple Hibiscus (novel)",
  "Sankofa (film)", "Beasts of No Nation (film)",
  // Film & TV — Nigerian Web Series (YouTube / Digital-First)
  "Skinny Girl in Transit (web series)", "The Men's Club (web series)",
  "Visa on Arrival (web series)", "Gidi Up (web series)",
  "Rumour Has It (web series)", "Little Black Book (web series)",
  "Bottom Line (web series)", "MTV Shuga Naija (TV series)",
  "Best Friends in the World (web series)", "Papa Benji (web series)",
  "This Thing Called Love (web series)", "The Olive (web series)",
  "Ajoche (TV series)", "Under the Influence (web series)",
  "Halita (TV series)",
  // Film & TV — South African Series
  "Blood & Water (TV series)", "Kings of Jo'Burg (TV series)",
  "Savage Beauty (TV series)", "Shaka iLembe (TV series)",
  "How to Ruin Love (TV series)", "Lioness (South African TV series)",
  "The River (South African TV series)", "Unseen (South African TV series)",
  // Film & TV — East African Series
  "Single Kiasi (TV series)", "Pepeta (Kenyan TV series)",
  "Igiza (TV series)", "Mpakani (TV series)", "Lazizi (TV series)",
  // Film & TV — Other African & Diaspora
  "An African City (web series)", "Iyanu: Child of Wonder (animated series)",
  "What's Left of Us (web series)",
  // Film & TV — Korean (K-Dramas)
  "Squid Game (TV series)", "All of Us Are Dead (TV series)",
  "The Glory (TV series)", "Extraordinary Attorney Woo (TV series)",
  // Film & TV — Indian
  "Sacred Games (TV series)", "Mirzapur (TV series)",
  "Panchayat (TV series)", "Kota Factory (TV series)",
  // Film & TV — Latin American
  "La Casa de Papel (TV series)", "Elite (Spanish TV series)",
  "Dark Desire (TV series)",
  // Film & TV — US / UK Streaming Era
  "Stranger Things (TV series)", "Breaking Bad (TV series)",
  "The Wire (TV series)", "Game of Thrones (TV series)",
  "Black Mirror (TV series)", "Insecure (TV series)",
  // Film & TV — Other Global
  "Dark (German TV series)", "Lupin (French TV series)",
];

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Titles of all published directory entries (lowercased).
 * Paginates through WPGraphQL 100 nodes at a time to bypass the default
 * connection limit — without this, any entry beyond #100 is invisible to
 * the duplicate check and gets re-seeded on every run.
 */
async function getExistingTitles(): Promise<Set<string>> {
  const titles = new Set<string>();
  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const query = `
      query GetDirectoryTitles($after: String) {
        cultureDirectories(first: 100, after: $after, where: { status: PUBLISH }) {
          pageInfo { hasNextPage endCursor }
          nodes { title }
        }
      }
    `;
    try {
      const res: Response = await fetch(WP_GRAPHQL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables: { after: cursor } }),
        cache: "no-store",
      });
      const json: any = await res.json();
      const conn = json.data?.cultureDirectories;
      if (!conn) break;

      for (const node of (conn.nodes ?? []) as { title: string }[]) {
        titles.add(node.title.toLowerCase().trim());
      }

      hasNextPage = conn.pageInfo?.hasNextPage ?? false;
      cursor = conn.pageInfo?.endCursor ?? null;
    } catch {
      break;
    }
  }

  return titles;
}

/** Extra / AI-generated topics stored in WordPress. */
async function getExtraTopics(): Promise<string[]> {
  const secret = process.env.CULTURE_API_SECRET ?? "";
  try {
    const res = await fetch(`${WP_URL}/wp-json/culture/v1/directory/extra-topics`, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.topics) ? json.topics : [];
  } catch {
    return [];
  }
}

/** Persist newly AI-generated topics back to WordPress. */
async function saveExtraTopics(topics: string[]): Promise<void> {
  const secret = process.env.CULTURE_API_SECRET ?? "";
  try {
    await fetch(`${WP_URL}/wp-json/culture/v1/directory/extra-topics`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ topics }),
      cache: "no-store",
    });
  } catch {
    // Non-fatal — the run continues even if the save fails.
  }
}

/**
 * Original seed topic strings already successfully submitted.
 * This is the primary duplicate guard: Gemini often changes the title
 * (e.g., "Fela Kuti" → "Fela Anikulapo-Kuti"), so a title-only check
 * would never match and the topic would be re-seeded every run.
 */
async function getProcessedTopics(): Promise<Set<string>> {
  const secret = process.env.CULTURE_API_SECRET ?? "";
  try {
    const res = await fetch(`${WP_URL}/wp-json/culture/v1/directory/processed-topics`, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
    });
    if (!res.ok) return new Set();
    const json = await res.json();
    return new Set(
      (json.topics ?? []).map((t: string) => t.toLowerCase().trim())
    );
  } catch {
    return new Set();
  }
}

/** Record the original seed topic strings that were successfully submitted. */
async function saveProcessedTopics(topics: string[]): Promise<void> {
  const secret = process.env.CULTURE_API_SECRET ?? "";
  try {
    await fetch(`${WP_URL}/wp-json/culture/v1/directory/processed-topics`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ topics }),
      cache: "no-store",
    });
  } catch {
    // Non-fatal.
  }
}

async function submitEntry(
  stub: any,
  generateImage: boolean
): Promise<{ success: boolean; postId?: number; title: string }> {
  const secret = process.env.CULTURE_API_SECRET ?? "";

  const res = await fetch(`${WP_URL}/wp-json/culture/v1/directory/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({
      user_id:      0,
      title:        stub.title,
      excerpt:      stub.excerpt,
      content:      stub.content,
      entry_type:   stub.entryType,
      interests:    stub.interests,
      infobox:      stub.infobox ?? {},
      ai_generated: true,
      auto_publish: true,
    }),
    cache: "no-store",
  });

  if (!res.ok) return { success: false, title: stub.title };
  const data = await res.json();
  const postId: number = data.post_id;

  if (generateImage && postId) {
    try {
      const image = await generateDirectoryImage(
        stub.title,
        stub.entryType,
        stub.excerpt
      );
      const slug = stub.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60);
      const key = `directory/${slug}-${postId}.jpg`;
      const imageBuffer = Buffer.from(image.data, "base64");
      const imageUrl = await uploadToR2(key, imageBuffer, "image/jpeg");

      // Save the R2 URL as post meta on the directory entry
      await fetch(`${WP_URL}/wp-json/culture/v1/directory/attach-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify({
          post_id: postId,
          image_url: imageUrl,
          image_title: image.title,
          image_description: image.description,
          image_alt: image.altText,
        }),
        cache: "no-store",
      });
    } catch {
      // Image failure is best-effort; never blocks the entry.
    }
  }

  return { success: true, postId, title: stub.title };
}

// ── Route handler ──────────────────────────────────────────────────────────

function isAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET ?? "";
  return !!cronSecret && req.headers.get("Authorization") === `Bearer ${cronSecret}`;
}

async function runPopulate(batchSize: number, generateImages: boolean): Promise<NextResponse> {
  const [existing, extraTopics, processed] = await Promise.all([
    getExistingTitles(),
    getExtraTopics(),
    getProcessedTopics(),
  ]);

  const allTopics = [...SEED_TOPICS, ...extraTopics];

  let pending = allTopics.filter((t) => {
    const key = t.toLowerCase().trim();
    return !existing.has(key) && !processed.has(key);
  });

  let aiGeneratedNewTopics = false;
  if (pending.length === 0) {
    let newTopics: string[] = [];
    try {
      newTopics = await generateTopicSuggestions([...existing]);
    } catch (err: any) {
      return NextResponse.json(
        { error: `All topics seeded. Topic generation failed: ${err?.message}` },
        { status: 500 }
      );
    }

    if (newTopics.length === 0) {
      return NextResponse.json({
        message: "All topics seeded and Gemini returned no new suggestions.",
        created: 0,
      });
    }

    await saveExtraTopics(newTopics);
    pending = newTopics.filter((t) => {
      const key = t.toLowerCase().trim();
      return !existing.has(key) && !processed.has(key);
    });
    aiGeneratedNewTopics = true;
  }

  const batch = [...pending].sort(() => Math.random() - 0.5).slice(0, batchSize);

  const results: Array<{ title: string; success: boolean; postId?: number }> = [];
  const successfulTopics: string[] = [];

  for (const topic of batch) {
    try {
      const stub = await generateDirectoryStub(topic);
      const result = await submitEntry(stub, generateImages);
      results.push(result);
      if (result.success) successfulTopics.push(topic);
    } catch (err: any) {
      results.push({
        title: topic,
        success: false,
        error: err?.message || "Unknown error during generation",
      } as any);
    }
    await new Promise((r) => setTimeout(r, 3500));
  }

  if (successfulTopics.length > 0) {
    await saveProcessedTopics(successfulTopics);
  }

  const created = results.filter((r) => r.success).length;
  return NextResponse.json({
    created,
    remaining: pending.length - created,
    aiGeneratedNewTopics,
    results,
  });
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured." }, { status: 503 });
  }
  return runPopulate(5, true);
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured." }, { status: 503 });
  }
  const body = await req.json().catch(() => ({}));
  const batchSize: number = Math.min(Number(body.batchSize) || 5, 20);
  const generateImages: boolean = body.generateImages !== false;
  return runPopulate(batchSize, generateImages);
}
