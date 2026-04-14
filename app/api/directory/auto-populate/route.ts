/**
 * POST /api/directory/auto-populate
 *
 * Background job that seeds the Culture Directory with well-known entries
 * from African and diaspora culture. Designed to be called by:
 *   - Vercel Cron (configured in vercel.json)
 *   - Manual trigger via curl/Postman during setup
 *
 * Auth: requires Authorization: Bearer {CRON_SECRET} header.
 *
 * Each run picks up to `batchSize` topics from the seed list that don't
 * already have a published entry, generates a stub via Gemini, optionally
 * generates a featured image via Imagen, and submits the entry to WordPress
 * in "publish" status (skipping the usual pending/review queue).
 */

import { NextRequest, NextResponse } from "next/server";
import { generateDirectoryStub, generateDirectoryImage } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 300; // Vercel Pro: up to 5 min for batch runs

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const WP_GRAPHQL = `${WP_URL}/graphql`;

// ── Seed list ──────────────────────────────────────────────────────────────
// Authoritative, notable entries spanning people, places, movements, etc.
// Add freely — already-existing slugs are skipped automatically each run.
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

async function getExistingSlugs(): Promise<Set<string>> {
  const query = `
    query GetAllDirectorySlugs {
      cultureDirectories(first: 500, where: { status: PUBLISH }) {
        nodes { slug title }
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

async function submitEntry(stub: any, generateImage: boolean): Promise<{ success: boolean; postId?: number; title: string }> {
  const secret = process.env.CULTURE_API_SECRET ?? "";

  const res = await fetch(`${WP_URL}/wp-json/culture/v1/directory/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({
      user_id: 0,            // system submission, no user
      title: stub.title,
      excerpt: stub.excerpt,
      content: stub.content,
      entry_type: stub.entryType,
      interests: stub.interests,
      ai_generated: true,
      auto_publish: true,    // PHP checks this flag to publish directly
    }),
    cache: "no-store",
  });

  if (!res.ok) return { success: false, title: stub.title };
  const data = await res.json();
  const postId: number = data.post_id;

  // Generate + attach featured image (best-effort, never blocks)
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
      // Image failure never fails the entry
    }
  }

  return { success: true, postId, title: stub.title };
}

// ── Route handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Auth: CRON_SECRET set in env (same value configured in vercel.json cron headers)
  const cronSecret = process.env.CRON_SECRET ?? "";
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY not configured." },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const batchSize: number = Math.min(Number(body.batchSize) || 5, 20);
  const generateImages: boolean = body.generateImages !== false;

  // Find topics not yet in the directory
  const existing = await getExistingSlugs();
  const pending = SEED_TOPICS.filter(t => !existing.has(t.toLowerCase().trim()));

  if (pending.length === 0) {
    return NextResponse.json({ message: "All seed topics already exist.", created: 0 });
  }

  // Shuffle so each run picks a varied batch
  const shuffled = [...pending].sort(() => Math.random() - 0.5);
  const batch = shuffled.slice(0, batchSize);

  const results: Array<{ title: string; success: boolean; postId?: number }> = [];

  for (const topic of batch) {
    try {
      const stub = await generateDirectoryStub(topic);
      const result = await submitEntry(stub, generateImages);
      results.push(result);
    } catch (err: any) {
      results.push({ title: topic, success: false });
    }
    // Brief pause between entries to respect API rate limits
    await new Promise(r => setTimeout(r, 1500));
  }

  const created = results.filter(r => r.success).length;
  return NextResponse.json({
    created,
    remaining: pending.length - created,
    results,
  });
}
