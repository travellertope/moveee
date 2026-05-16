/**
 * GET/POST /api/quotes/auto-populate
 *
 * Seeds the Moveee Quote Archive in two phases:
 *
 * Phase 1 — Curated list (data.ts):
 *   Scans SEED_QUOTES in offset order, submitting up to TARGET_BATCH_SIZE
 *   new quotes per run. All entries in data.ts are hand-verified real quotes.
 *
 * Phase 2 — Serper-backed discovery (when curated list is exhausted):
 *   Rotates through QUOTE_AUTHORS, runs targeted Google searches against
 *   Wikiquote and Goodreads, and asks Gemini to extract only verbatim quotes
 *   it can see in the search results. Gemini acts as an extractor, not a
 *   generator — it may not invent or recall quotes from training data.
 *
 * GET  — invoked by WordPress cron (Authorization: Bearer {CRON_SECRET}).
 * POST — invoked manually; accepts { offset } in request body.
 */

import { NextRequest, NextResponse } from "next/server";
import { SEED_QUOTES } from "./data";
import { runVerifiedQuotesBatch } from "@/lib/quotes-seeder";

export const runtime = "nodejs";
export const maxDuration = 300;

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

function isAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET ?? "";
  return !!cronSecret && req.headers.get("Authorization") === `Bearer ${cronSecret}`;
}

async function submitQuote(
  secret: string,
  quote: { text: string; author: string; source: string }
): Promise<{ ok: boolean; duplicate: boolean }> {
  const res = await fetch(`${WP_URL}/wp-json/culture/v1/quotes`, {
    method: "POST",
    headers: {
      "Content-Type":       "application/json",
      "Authorization":      `Bearer ${secret}`,
      "X-Culture-API-Secret": secret,
    },
    body: JSON.stringify({
      text:    quote.text,
      author:  quote.author,
      source:  quote.source,
      user_id: 0,
    }),
  });

  if (res.ok) return { ok: true, duplicate: false };

  const data = await res.json().catch(() => ({}));
  const isDuplicate =
    res.status === 409 ||
    res.status === 400 ||
    String(data.message ?? "").includes("already exists");

  return { ok: false, duplicate: isDuplicate };
}

async function runSeed(startOffset: number): Promise<NextResponse> {
  const secret  = process.env.CULTURE_API_SECRET ?? "";
  const results: Array<{ title: string; success: boolean; error?: string }> = [];

  let createdCount = 0;
  let skippedCount = 0;
  const TARGET_BATCH_SIZE = 15;
  let nextOffset = startOffset;

  try {
    // ── Phase 1: curated hand-verified quotes ──────────────────────────────
    const total = SEED_QUOTES.length;

    for (let scanned = 0; scanned < total && createdCount < TARGET_BATCH_SIZE; scanned++) {
      const idx   = (startOffset + scanned) % total;
      const quote = SEED_QUOTES[idx];

      const { ok, duplicate } = await submitQuote(secret, quote);

      if (ok) {
        results.push({ title: `${quote.author}: ${quote.text.slice(0, 40)}…`, success: true });
        createdCount++;
        nextOffset = (idx + 1) % total;
      } else if (duplicate) {
        skippedCount++;
        nextOffset = (idx + 1) % total;
      } else {
        results.push({ title: quote.author, success: false });
      }

      await new Promise((r) => setTimeout(r, 200));
    }

    if (createdCount > 0) {
      return NextResponse.json({
        created: createdCount,
        skipped: skippedCount,
        results,
        nextOffset,
        mode: "curated",
      });
    }

    // ── Phase 2: Serper-backed verified discovery ──────────────────────────
    // Only reached when the entire curated list has been imported.
    // Rotates through QUOTE_AUTHORS by day-of-year so all figures are
    // covered over time without needing persistent state.
    if (!process.env.SERPER_API_KEY) {
      return NextResponse.json({
        created: 0,
        skipped: skippedCount,
        results,
        nextOffset,
        mode: "exhausted",
        note: "Curated list exhausted. Add SERPER_API_KEY to enable verified quote discovery.",
      });
    }

    console.log("[quotes] Curated list exhausted — running Serper-backed discovery.");
    const verifiedQuotes = await runVerifiedQuotesBatch(3, 4);

    if (verifiedQuotes.length === 0) {
      return NextResponse.json({
        created: 0,
        skipped: skippedCount,
        results,
        nextOffset,
        mode: "exhausted",
        note: "Serper search returned no verifiable quotes this run.",
      });
    }

    for (const quote of verifiedQuotes) {
      const { ok, duplicate } = await submitQuote(secret, quote);
      if (ok) {
        results.push({ title: `${quote.author}: ${quote.text.slice(0, 40)}…`, success: true });
        createdCount++;
      } else if (duplicate) {
        skippedCount++;
      } else {
        results.push({ title: quote.author, success: false });
      }
      await new Promise((r) => setTimeout(r, 300));
    }

    return NextResponse.json({
      created: createdCount,
      skipped: skippedCount,
      results,
      nextOffset,
      mode: "serper-verified",
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  return runSeed(0);
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  const body        = await req.json().catch(() => ({}));
  const rawOffset   = parseInt(String(body.offset ?? "0"), 10);
  const startOffset = isNaN(rawOffset)
    ? 0
    : Math.max(0, Math.min(rawOffset, SEED_QUOTES.length - 1));
  return runSeed(startOffset);
}
