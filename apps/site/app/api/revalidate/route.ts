/**
 * POST /api/revalidate
 *
 * On-demand ISR revalidation for pages that cache WordPress data.
 * Call this after any WordPress content change or when pages appear stale.
 *
 * Auth: Authorization: Bearer {CRON_SECRET}
 *
 * Body (optional):
 *   { "paths": ["/directory", "/visuals"] }
 *   — defaults to all content pages if omitted.
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

export const runtime = "nodejs";

const CONTENT_PATHS = [
  "/directory",
  "/visuals",
  "/quotes",
  "/magazine",
  "/newsletters",
  "/shop",
];

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET ?? "";
  const authHeader = req.headers.get("Authorization") ?? "";

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  let paths: string[] = CONTENT_PATHS;
  let tags: string[] = [];
  try {
    const body = await req.json();
    if (Array.isArray(body.paths) && body.paths.length > 0) paths = body.paths;
    if (Array.isArray(body.tags) && body.tags.length > 0) tags = body.tags;
  } catch {
    // No body or invalid JSON — use defaults.
  }

  // Tag-based invalidation (data layer unstable_cache entries)
  const VALID_TAGS = ["stories", "events", "directory", "quotes", "pulse", "community", "newsletters", "wp-content"];
  const revalidatedTags: string[] = [];
  for (const tag of tags) {
    if (VALID_TAGS.includes(tag)) {
      revalidateTag(tag, {});
      revalidatedTags.push(tag);
    }
  }

  const revalidated: string[] = [];
  const failed: { path: string; error: string }[] = [];

  for (const path of paths) {
    try {
      revalidatePath(path);
      revalidated.push(path);
    } catch (err: any) {
      failed.push({ path, error: err?.message ?? "unknown" });
    }
  }

  return NextResponse.json({ revalidated, revalidatedTags, failed });
}
