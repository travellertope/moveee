/**
 * POST /api/directory/auto-populate
 *
 * Background job that seeds the Culture Directory. Each run:
 *   1. Pulls SEED_TOPICS (hardcoded) + extra topics stored in WordPress.
 *   2. Filters out titles already published in the directory.
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
];

// ── Helpers ────────────────────────────────────────────────────────────────

/** Titles of all published directory entries (lowercased). */
async function getExistingTitles(): Promise<Set<string>> {
  const query = `
    query GetAllDirectoryTitles {
      cultureDirectories(first: 500, where: { status: PUBLISH }) {
        nodes { title }
      }
    }
  `;
  try {
    const res = await fetch(WP_GRAPHQL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
      cache: "no-store",
    });
    const json = await res.json();
    const nodes: any[] = json.data?.cultureDirectories?.nodes ?? [];
    return new Set(nodes.map((n: any) => n.title.toLowerCase().trim()));
  } catch {
    return new Set();
  }
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
      const imageBase64 = await generateDirectoryImage(
        stub.title,
        stub.entryType,
        stub.excerpt
      );
      if (imageBase64) {
        const filename = `${stub.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60)}.jpg`;
        await fetch(`${WP_URL}/wp-json/culture/v1/directory/attach-image`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${secret}`,
          },
          body: JSON.stringify({ post_id: postId, image_base64: imageBase64, filename }),
          cache: "no-store",
        });
      }
    } catch {
      // Image failure is best-effort; never blocks the entry.
    }
  }

  return { success: true, postId, title: stub.title };
}

// ── Route handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET ?? "";
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured." }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const batchSize: number = Math.min(Number(body.batchSize) || 5, 20);
  const generateImages: boolean = body.generateImages !== false;

  // Build the full topic list: hardcoded seeds + WP-stored extras.
  const [existing, extraTopics] = await Promise.all([
    getExistingTitles(),
    getExtraTopics(),
  ]);

  const allTopics = [...SEED_TOPICS, ...extraTopics];
  let pending = allTopics.filter((t) => !existing.has(t.toLowerCase().trim()));

  // When every known topic is covered, ask Gemini to generate new ones.
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
    pending = newTopics.filter((t) => !existing.has(t.toLowerCase().trim()));
    aiGeneratedNewTopics = true;
  }

  // Shuffle for variety, take up to batchSize.
  const batch = [...pending].sort(() => Math.random() - 0.5).slice(0, batchSize);

  const results: Array<{ title: string; success: boolean; postId?: number }> = [];

  for (const topic of batch) {
    try {
      const stub = await generateDirectoryStub(topic);
      const result = await submitEntry(stub, generateImages);
      results.push(result);
    } catch (err: any) {
      results.push({ 
        title: topic, 
        success: false,
        error: err?.message || "Unknown error during generation"
      } as any);
    }
    // Increased delay to 2.5s to reduce pressure on API quotas and ensure DB sync
    await new Promise((r) => setTimeout(r, 2500));
  }

  const created = results.filter((r) => r.success).length;
  return NextResponse.json({
    created,
    remaining: pending.length - created,
    aiGeneratedNewTopics,
    results,
  });
}
