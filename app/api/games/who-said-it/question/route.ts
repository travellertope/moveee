/**
 * GET /api/games/who-said-it/question
 *
 * Returns a random published quote from the WordPress database plus
 * 4 shuffled author options (1 correct + 3 distractors drawn from the
 * same quote pool).
 *
 * Query params:
 *   exclude  Comma-separated quote databaseIds to skip (already seen this session)
 *
 * Response:
 *   { id, quote, source, correct_author, options: string[] }
 */

import { NextRequest, NextResponse } from "next/server";
import { getWPQuotes } from "@/lib/wp";

export const runtime = "nodejs";

interface QuoteNode {
  databaseId: number;
  content:    string;
  quoteSource?: string;
  quoteAuthors?: { nodes: Array<{ name: string }> };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function GET(req: NextRequest) {
  const excludeParam = req.nextUrl.searchParams.get("exclude") ?? "";
  const excludeIds   = new Set(
    excludeParam.split(",").map(Number).filter(Boolean)
  );

  let data: any;
  try {
    data = await getWPQuotes({ first: 200 });
  } catch {
    return NextResponse.json({ error: "Could not load quotes." }, { status: 502 });
  }

  const all: QuoteNode[] = (data?.cultureQuotes?.nodes ?? []).filter(
    (q: QuoteNode) =>
      q.databaseId &&
      q.content?.trim() &&
      q.quoteAuthors?.nodes?.[0]?.name
  );

  if (all.length < 4) {
    return NextResponse.json(
      { error: "Not enough quotes in the database yet." },
      { status: 404 }
    );
  }

  // Available pool: exclude already-seen ids.
  const pool = all.filter((q) => !excludeIds.has(q.databaseId));

  // If every quote has been seen, reset (wrap around).
  const source = pool.length >= 1 ? pool : all;

  const quote = source[Math.floor(Math.random() * source.length)];
  const correctAuthor = quote.quoteAuthors!.nodes[0].name;

  // Collect distinct author names for distractors.
  const otherAuthors = [
    ...new Set(
      all
        .map((q) => q.quoteAuthors?.nodes[0]?.name ?? "")
        .filter((n) => n && n !== correctAuthor)
    ),
  ];

  // Pick 3 random distractors.
  const distractors = shuffle(otherAuthors).slice(0, 3);

  const options = shuffle([correctAuthor, ...distractors]);

  // Strip HTML tags from quote text for display.
  const cleanText = quote.content
    .replace(/<[^>]*>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#8220;|&ldquo;/g, "“")
    .replace(/&#8221;|&rdquo;/g, "”")
    .replace(/&amp;/g, "&")
    .trim();

  return NextResponse.json({
    id:             quote.databaseId,
    quote:          cleanText,
    source:         quote.quoteSource ?? "",
    correct_author: correctAuthor,
    options,
  });
}
