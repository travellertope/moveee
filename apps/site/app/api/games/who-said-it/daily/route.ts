/**
 * GET /api/games/who-said-it/daily
 *
 * Returns the same 10 Who Said It questions for every player on a given UTC day.
 * Questions are chosen deterministically using the date as a seed so the
 * selection is identical across all Vercel instances with no shared storage.
 *
 * Each question: { id, quote, source, correct_author, options: string[4] }
 * options is shuffled (correct answer position varies per question).
 *
 * Response: { date, questions: WsiQuestion[] }
 */

import { NextResponse } from "next/server";
import { getWPQuotes } from "@/lib/wp";

export const runtime = "nodejs";

export interface WsiQuestion {
  id:             number;
  quote:          string;
  source:         string;
  correct_author: string;
  options:        string[];
}

// ── Seeded PRNG (Mulberry32) ──────────────────────────────────────────────────
function dateToSeed(date: string): number {
  let h = 0;
  for (const ch of date) h = (Math.imul(h, 31) + ch.charCodeAt(0)) | 0;
  return h >>> 0;
}

function makeRng(seed: number): () => number {
  let s = seed;
  return () => {
    s += 0x6d2b79f5;
    let z = s;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 0xffffffff;
  };
}

function seededShuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── HTML entity decoder ───────────────────────────────────────────────────────
function decodeEntities(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&#8216;|&lsquo;/g, "‘")
    .replace(/&#8217;|&rsquo;/g, "’")
    .replace(/&#8220;|&ldquo;/g, "“")
    .replace(/&#8221;|&rdquo;/g, "”")
    .replace(/&#8211;|&ndash;/g, "–")
    .replace(/&#8212;|&mdash;/g, "—")
    .replace(/&#8230;|&hellip;/g, "…")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slot = Math.min(5, Math.max(1, parseInt(searchParams.get("slot") ?? "1") || 1));
  const date = new Date().toISOString().slice(0, 10);
  // Unique seed per day+slot ensures no cross-slot or cross-day repetition
  const seedKey = `${date}-slot-${slot}`;

  let data: any;
  try {
    data = await getWPQuotes({ first: 200 });
  } catch {
    return NextResponse.json({ error: "Could not load quotes." }, { status: 502 });
  }

  const all = ((data?.cultureQuotes?.nodes ?? []) as any[]).filter(
    (q) => q.databaseId && q.content?.trim() && q.quoteAuthors?.nodes?.[0]?.name
  );

  if (all.length < 10) {
    return NextResponse.json({ error: "Not enough quotes in the database yet." }, { status: 404 });
  }

  const rng         = makeRng(dateToSeed(seedKey));
  const shuffled    = seededShuffle(all, rng);
  const todaySet    = shuffled.slice(0, 10);
  const authorPool  = [...new Set(all.map((q: any) => q.quoteAuthors.nodes[0].name as string))];

  const questions: WsiQuestion[] = todaySet.map((quote: any) => {
    const correct     = quote.quoteAuthors.nodes[0].name as string;
    const distractors = seededShuffle(
      authorPool.filter((a) => a !== correct),
      rng
    ).slice(0, 3);
    const options = seededShuffle([correct, ...distractors], rng);

    return {
      id:             quote.databaseId,
      quote:          decodeEntities(quote.content),
      source:         quote.quoteSource ?? "",
      correct_author: correct,
      options,
    };
  });

  return NextResponse.json({ date, slot, questions });
}
