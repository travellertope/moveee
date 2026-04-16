/**
 * POST /api/quotes/auto-populate
 *
 * Background job that seeds the Moveee Quote Database.
 * Curates a selection of high-impact, culturally relevant quotes.
 *
 * Auth: requires Authorization: Bearer {CRON_SECRET} header.
 *
 * Optional body params:
 *   offset  – index in SEED_QUOTES to start scanning from (default 0).
 *             Clients should persist the returned `nextOffset` and send
 *             it on the next call to avoid re-scanning already-imported
 *             quotes from the beginning every run.
 */

import { NextRequest, NextResponse } from "next/server";
import { generateSeedQuotes } from "@/lib/gemini";
import { SEED_QUOTES } from "./data";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET() {
  return NextResponse.json({ status: "Quote Seeder API is active.", method: "POST required for seeding." });
}

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET ?? "";
  const authHeader = req.headers.get("Authorization") ?? "";

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const secret = process.env.CULTURE_API_SECRET ?? "";
  const results: Array<{ title: string; success: boolean; error?: string }> = [];

  // Accept an optional offset so we don't re-scan from index 0 every run.
  const body = await req.json().catch(() => ({}));
  const rawOffset = parseInt(String(body.offset ?? "0"), 10);
  const startOffset = isNaN(rawOffset) ? 0 : Math.max(0, Math.min(rawOffset, SEED_QUOTES.length - 1));

  let createdCount = 0;
  let skippedCount = 0;
  const TARGET_BATCH_SIZE = 15;

  // nextOffset tracks where the next run should start.
  let nextOffset = startOffset;

  try {
    // Scan at most SEED_QUOTES.length entries (one full pass), starting from offset.
    // Wraps around so runs near the end of the list roll over to the beginning.
    const total = SEED_QUOTES.length;

    for (let scanned = 0; scanned < total && createdCount < TARGET_BATCH_SIZE; scanned++) {
      const idx = (startOffset + scanned) % total;
      const quote = SEED_QUOTES[idx];

      const res = await fetch(`${WP_URL}/wp-json/culture/v1/quotes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${secret}`,
          "X-Culture-API-Secret": secret,
        },
        body: JSON.stringify({
          text: quote.text,
          author: quote.author,
          source: quote.source,
          user_id: 0,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        results.push({ title: `${quote.author}: ${quote.text.slice(0, 30)}...`, success: true });
        createdCount++;
        // Advance the cursor past this newly-created quote.
        nextOffset = (idx + 1) % total;
      } else if (
        res.status === 409 ||
        res.status === 400 ||
        data.message?.includes("already exists")
      ) {
        // Silently skip confirmed duplicates and advance the cursor.
        skippedCount++;
        nextOffset = (idx + 1) % total;
      } else {
        // Unexpected error — log it but keep scanning.
        results.push({ title: quote.author, success: false, error: data.message || `HTTP ${res.status}` });
      }

      // Throttle to be kind to the WP API.
      await new Promise((r) => setTimeout(r, 200));
    }

    // Fallback to AI when the entire curated list has already been imported.
    if (createdCount === 0) {
      console.log("No new quotes added from curated list. Fetching AI suggestions...");
      const aiQuotes = await generateSeedQuotes(10);
      if (aiQuotes && aiQuotes.length > 0) {
        for (const quote of aiQuotes) {
          const res = await fetch(`${WP_URL}/wp-json/culture/v1/quotes`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${secret}`,
              "X-Culture-API-Secret": secret,
            },
            body: JSON.stringify({
              text: quote.text,
              author: quote.author,
              source: quote.source,
              user_id: 0,
            }),
          });
          if (res.ok) {
            results.push({ title: `AI: ${quote.author}`, success: true });
            createdCount++;
          }
          await new Promise((r) => setTimeout(r, 300));
        }
        return NextResponse.json({
          created: createdCount,
          skipped: skippedCount,
          results,
          nextOffset,
          mode: "ai-generated",
        });
      }
    }

    return NextResponse.json({
      created: createdCount,
      skipped: skippedCount,
      results,
      nextOffset,
      mode: createdCount > 0 ? "curated" : "exhausted",
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
