/**
 * GET/POST /api/quotes/auto-populate
 *
 * Background job that seeds the Moveee Quote Database.
 * Curates a selection of high-impact, culturally relevant quotes.
 *
 * GET  — invoked by Vercel cron (Authorization: Bearer {CRON_SECRET}).
 * POST — invoked manually; accepts { offset } in request body.
 *
 * Auth: requires Authorization: Bearer {CRON_SECRET} header.
 *
 * Optional body params (POST only):
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

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

function isAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET ?? "";
  return !!cronSecret && req.headers.get("Authorization") === `Bearer ${cronSecret}`;
}

async function runSeed(startOffset: number): Promise<NextResponse> {
  const secret = process.env.CULTURE_API_SECRET ?? "";
  const results: Array<{ title: string; success: boolean; error?: string }> = [];

  let createdCount = 0;
  let skippedCount = 0;
  const TARGET_BATCH_SIZE = 15;
  let nextOffset = startOffset;

  try {
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
        nextOffset = (idx + 1) % total;
      } else if (
        res.status === 409 ||
        res.status === 400 ||
        data.message?.includes("already exists")
      ) {
        skippedCount++;
        nextOffset = (idx + 1) % total;
      } else {
        results.push({ title: quote.author, success: false, error: data.message || `HTTP ${res.status}` });
      }

      await new Promise((r) => setTimeout(r, 200));
    }

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
  const body = await req.json().catch(() => ({}));
  const rawOffset = parseInt(String(body.offset ?? "0"), 10);
  const startOffset = isNaN(rawOffset) ? 0 : Math.max(0, Math.min(rawOffset, SEED_QUOTES.length - 1));
  return runSeed(startOffset);
}
