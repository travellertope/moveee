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

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET() {
  return NextResponse.json({ status: "Quote Seeder API is active.", method: "POST required for seeding." });
}

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const DEFAULT_SEED_QUOTES = [
  {
    text: "History is not the past. It is the present. We carry our history with us. We are our history.",
    author: "James Baldwin",
    source: "The Cross of Redemption",
  },
  {
    text: "The single story creates stereotypes, and the problem with stereotypes is not that they are untrue, but that they are incomplete.",
    author: "Chimamanda Ngozi Adichie",
    source: "The Danger of a Single Story",
  },
  {
    text: "Freeing yourself was one thing, claiming ownership of that freed self was another.",
    author: "Toni Morrison",
    source: "Beloved",
  },
  {
    text: "Until the lions have their own historians, the history of the hunt will always glorify the hunter.",
    author: "Chinua Achebe",
    source: "Anthills of the Savannah",
  },
  {
    text: "All that you touch You Change. All that you Change Changes you. The only lasting truth Is Change.",
    author: "Octavia Butler",
    source: "Parable of the Sower",
  },
  {
    text: "Each generation must discover its mission, fulfill it or betray it, in relative opacity.",
    author: "Frantz Fanon",
    source: "The Wretched of the Earth",
  },
  {
    text: "I'll tell you what freedom is to me: no fear. I mean really, no fear!",
    author: "Nina Simone",
    source: "Interview with Peter Rodis",
  },
  {
    text: "The greatest threat to freedom is the absence of criticism.",
    author: "Wole Soyinka",
    source: "The Man Died",
  },
  {
    text: "You can't use up creativity. The more you use, the more you have.",
    author: "Maya Angelou",
    source: "Conversations with Maya Angelou",
  },
  {
    text: "I am a visual activist. I use my work to document the lives of those who are often silenced.",
    author: "Zanele Muholi",
    source: "Somnyama Ngonyama",
  },
];

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET ?? "";
  const authHeader = req.headers.get("Authorization") ?? "";
  
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const results: Array<{ title: string; success: boolean; error?: string }> = [];
  const secret = process.env.CULTURE_API_SECRET ?? "";

  // 1. Initial attempt: Try to seed the 10 high-impact defaults
  let quotesToSeed = [...DEFAULT_SEED_QUOTES];

  try {
    const batchResults = await seedBatch(quotesToSeed, secret);
    
    // If most of them failed with "already exists", try to get AI suggestions instead
    const existingCount = batchResults.filter(r => r.error?.includes("already exists")).length;
    
    if (existingCount >= 8) {
      console.log("Most seed quotes already exist. Fetching AI suggestions...");
      const aiQuotes = await generateSeedQuotes(10);
      if (aiQuotes && aiQuotes.length > 0) {
        const aiResults = await seedBatch(aiQuotes, secret);
        return NextResponse.json({
          created: aiResults.filter(r => r.success).length,
          results: [...batchResults, ...aiResults],
          mode: "ai-generated"
        });
      }
    }

    return NextResponse.json({
      created: batchResults.filter(r => r.success).length,
      results: batchResults,
      mode: "default-curated"
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
