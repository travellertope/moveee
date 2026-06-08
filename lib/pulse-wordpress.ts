import type { PulseStoryRaw } from "./pulse-gemini";
import { scrapeOgTags } from "./og-scraper";

// WordPress REST API base URL — derived from the existing WP URL env var.
const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const BASE = `${WP_URL}/wp-json`;

// Application Password credentials for write operations.
const AUTH = Buffer.from(
  `${process.env.WP_USERNAME ?? ""}:${process.env.WP_APP_PASSWORD ?? ""}`
).toString("base64");

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .slice(0, 80);
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface WpPulseStory {
  id: number;
  slug: string;
  date: string;
  modified: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  comment_status: string;
  comment_count: number;
  meta: {
    pulse_source?: string;
    pulse_region_label?: string;
    pulse_arm_label?: string;
    pulse_external_url?: string;
    pulse_image_url?: string;
    pulse_gemini_refreshed_at?: string;
    pulse_og_title?: string;
    pulse_og_description?: string;
    pulse_og_image?: string;
    pulse_click_count?: number;
  };
  _embedded?: {
    "wp:featuredmedia"?: Array<{ source_url: string; alt_text?: string }>;
    "wp:term"?: Array<Array<{ id: number; name: string; slug: string; taxonomy: string }>>;
    replies?: Array<Array<{ count?: number | string }>>;
  };
}

export interface WpComment {
  id: number;
  post: number;
  author_name: string;
  date: string;
  content: { rendered: string };
  status: string;
  parent: number;
}

// ── Types ─────────────────────────────────────────────────────────────────

export type SaveResult =
  | { status: "saved"; post: WpPulseStory }
  | { status: "duplicate" }
  | { status: "error"; message: string };

// ── Write helpers ──────────────────────────────────────────────────────────

/** Find or create a taxonomy term; returns its ID or null on failure. */
async function resolveTermId(restBase: string, termName: string, customSlug?: string): Promise<number | null> {
  const termSlug = customSlug || slugify(termName);

  const findRes = await fetch(`${BASE}/wp/v2/${restBase}?slug=${termSlug}`, {
    headers: { Authorization: `Basic ${AUTH}` },
    cache: "no-store",
  });
  const found: any[] = await findRes.json().catch(() => []);
  if (Array.isArray(found) && found.length > 0) return found[0].id;

  const createRes = await fetch(`${BASE}/wp/v2/${restBase}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${AUTH}` },
    body: JSON.stringify({ name: termName, slug: termSlug }),
    cache: "no-store",
  });
  if (!createRes.ok) {
    console.warn(`[pulse-wp] Failed to create term "${termName}" in ${restBase}:`, createRes.status);
    return null;
  }
  const created = await createRes.json();
  return created.id ?? null;
}

/**
 * Save a Pulse story to WordPress. Skips exact slug duplicates and
 * stories with identical titles saved in the last 7 days.
 * Returns a typed SaveResult so callers can distinguish duplicates from errors.
 */
export async function savePulseStory(story: PulseStoryRaw): Promise<SaveResult> {
  const slug = slugify(story.title);

  // Check for an existing post with this slug.
  const checkRes = await fetch(`${BASE}/wp/v2/pulse-stories?slug=${slug}`, { cache: "no-store" });
  if (checkRes.ok) {
    const existing: any[] = await checkRes.json().catch(() => []);
    if (Array.isArray(existing) && existing.length > 0) return { status: "duplicate" };
  }

  // Also check for a story with the same title in the last 7 days.
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const recentRes = await fetch(
    `${BASE}/wp/v2/pulse-stories?search=${encodeURIComponent(story.title)}&after=${sevenDaysAgo}&per_page=1`,
    { cache: "no-store" }
  );
  if (recentRes.ok) {
    const recent: any[] = await recentRes.json().catch(() => []);
    if (Array.isArray(recent) && recent.length > 0) return { status: "duplicate" };
  }

  // Resolve taxonomy term IDs before creating the post so they can be
  // included in the initial create request rather than a separate update.
  // Region and Arm mapping for clean slugs
  const regionMap: Record<string, string> = {
    "Africa": "africa",
    "Caribbean": "caribbean",
    "Diaspora UK": "uk",
    "Diaspora US": "us",
    "Diaspora Europe": "europe",
    "Global": "global"
  };

  const [armId, regionId, categoryId, ogData] = await Promise.all([
    story.arm      ? resolveTermId("pulse-arms",       story.arm)      : Promise.resolve(null),
    story.region   ? resolveTermId("pulse-regions",    story.region,   regionMap[story.region]) : Promise.resolve(null),
    story.category ? resolveTermId("pulse-categories", story.category) : Promise.resolve(null),
    story.source_url ? scrapeOgTags(story.source_url) : Promise.resolve({ title: "", description: "", image: "" }),
  ]);

  const body: Record<string, any> = {
    title: story.title,
    excerpt: story.summary,
    content: `<p>${(story.body || story.summary).replace(/\n/g, "</p><p>")}</p>`,
    slug,
    status: "publish",
    comment_status: "open",
    meta: {
      pulse_source: story.source ?? "",
      pulse_region_label: story.region ?? "",
      pulse_arm_label: story.arm ?? "",
      pulse_external_url: story.source_url ?? "",
      pulse_image_url: story.image_url ?? "",
      pulse_gemini_refreshed_at: new Date().toISOString(),
      pulse_og_title: ogData.title,
      pulse_og_description: ogData.description,
      pulse_og_image: ogData.image,
    },
  };

  if (armId)      body.pulse_arm      = [armId];
  if (regionId)   body.pulse_region   = [regionId];
  if (categoryId) body.pulse_category = [categoryId];

  const createRes = await fetch(`${BASE}/wp/v2/pulse-stories`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${AUTH}` },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    const message = (err as any).message || `HTTP ${createRes.status}`;
    console.error("[pulse-wp] Failed to create story:", err);
    return { status: "error", message };
  }

  const post: WpPulseStory = await createRes.json();
  return { status: "saved", post };
}

// ── Read helpers ───────────────────────────────────────────────────────────

/**
 * Fetch Pulse stories with optional arm/region filtering.
 * Uses ISR cache (5 minute revalidation) for read performance.
 */
export async function getPulseStories({
  arm,
  region,
  category,
  page = 1,
  perPage = 12,
}: {
  arm?: string;
  region?: string;
  category?: string;
  page?: number;
  perPage?: number;
} = {}): Promise<WpPulseStory[]> {
  let url =
    `${BASE}/wp/v2/pulse-stories` +
    `?per_page=${perPage}&page=${page}&orderby=date&order=desc&_embed=1`;

  if (arm)      url += `&pulse_arm=${encodeURIComponent(arm)}`;
  if (region)   url += `&pulse_region=${encodeURIComponent(region)}`;
  if (category) url += `&pulse_category=${encodeURIComponent(category)}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

/** Fetch a single story by its slug. */
export async function getPulseStoryBySlug(slug: string): Promise<WpPulseStory | null> {
  const res = await fetch(
    `${BASE}/wp/v2/pulse-stories?slug=${encodeURIComponent(slug)}&_embed=1`,
    { next: { revalidate: 300 } }
  );
  if (!res.ok) return null;
  const posts: WpPulseStory[] = await res.json();
  return posts[0] ?? null;
}

/** Fetch all published slugs — used for generateStaticParams. */
export async function getAllPulseSlugs(): Promise<string[]> {
  const res = await fetch(
    `${BASE}/wp/v2/pulse-stories?per_page=100&_fields=slug&status=publish`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) return [];
  const posts: Array<{ slug: string }> = await res.json();
  return posts.map((p) => p.slug);
}

/** Fetch approved comments for a story post. */
export async function getPulseComments(postId: number): Promise<WpComment[]> {
  const res = await fetch(
    `${BASE}/wp/v2/comments?post=${postId}&per_page=50&orderby=date&order=asc&status=approve`,
    { cache: "no-store" }
  );
  if (!res.ok) return [];
  return res.json();
}

/** Post a new comment on a story. */
export async function postPulseComment({
  postId,
  authorName,
  authorEmail,
  content,
}: {
  postId: number;
  authorName: string;
  authorEmail: string;
  content: string;
}): Promise<WpComment> {
  const res = await fetch(`${BASE}/wp/v2/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${AUTH}`,
    },
    body: JSON.stringify({
      post: postId,
      author_name: authorName,
      author_email: authorEmail,
      content,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).message || "Failed to post comment");
  }

  return res.json();
}

/** Fetch a term ID by its slug for a given taxonomy. */
export async function getTermIdBySlug(taxonomy: string, slug: string): Promise<number | null> {
  // Map taxonomy name to REST base (WordPress standard is often plural with hyphens)
  const restBase = taxonomy.replace(/_/g, "-") + (taxonomy.endsWith("s") ? "" : "s"); 
  try {
    const res = await fetch(`${BASE}/wp/v2/${restBase}?slug=${slug}`, { cache: "no-store" });
    if (!res.ok) return null;
    const terms: any[] = await res.json();
    return terms[0]?.id ?? null;
  } catch {
    return null;
  }
}
