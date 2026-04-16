/**
 * POST /api/quotes/auto-populate
 *
 * Background job that seeds the Moveee Quote Database. 
 * Curates a selection of high-impact, culturally relevant quotes.
 *
 * Auth: requires Authorization: Bearer {CRON_SECRET} header.
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
  const results: Array<{ title: string; success: boolean; error?: string; skipped?: boolean }> = [];
  
  let createdCount = 0;
  const TARGET_BATCH_SIZE = 15; // Aim to add 15 fresh quotes per run
  const MAX_ATTEMPTS = 60;     // Don't scan more than 60 in one go to keep it fast

  try {
    // 1. Prioritize curated list
    for (let i = 0; i < SEED_QUOTES.length && createdCount < TARGET_BATCH_SIZE && i < MAX_ATTEMPTS; i++) {
        const quote = SEED_QUOTES[i];
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
        } else if (data.message?.includes("already exists") || res.status === 400) {
            // Quietly skip duplicates from the results list or mark as skipped
            // We don't add to results to keep the UI clean
        } else {
            results.push({ title: quote.author, success: false, error: data.message || "Failed" });
        }
        
        // Throttling to be kind to the WP API
        await new Promise((r) => setTimeout(r, 200));
    }

    // 2. Fallback to AI if we didn't add anything (meaning curated list might be exhausted or already fully imported)
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
        return NextResponse.json({ created: createdCount, results, mode: "ai-generated" });
      }
    }

    return NextResponse.json({
      created: createdCount,
      results,
      mode: createdCount > 0 ? "curated" : "exhausted"
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * Helper to POST a batch of quotes to WordPress
 */
async function seedBatch(quotes: any[], secret: string) {
  const results: Array<{ title: string; success: boolean; error?: string }> = [];

  for (const quote of quotes) {
    try {
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
          user_id: 0, // System user
        }),
      });

      const data = await res.json();
      if (res.ok) {
        results.push({ title: `${quote.author}: ${quote.text.slice(0, 30)}...`, success: true });
      } else {
        results.push({ 
          title: quote.author, 
          success: false, 
          error: data.message || "Failed to create quote" 
        });
      }
    } catch (err: any) {
      results.push({ title: quote.author, success: false, error: err.message });
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  return results;
}
