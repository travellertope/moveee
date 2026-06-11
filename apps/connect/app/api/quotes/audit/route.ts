/**
 * POST /api/quotes/audit
 *
 * Fetches a batch of unaudited quotes from the WordPress database,
 * runs Serper searches against each, and asks Gemini to return a
 * verdict: verified / suspicious / likely-fabricated / unverifiable.
 *
 * Verdicts and reasoning are written back to WordPress post meta:
 *   _quote_audit_status  — one of the four verdict strings
 *   _quote_audit_note    — Gemini's one-sentence reason
 *   _quote_audit_date    — ISO timestamp of the audit run
 *
 * With quarantine=true, quotes marked "likely-fabricated" or "suspicious"
 * are also moved to draft so they stop appearing publicly until reviewed.
 *
 * Authorization: Bearer {CRON_SECRET}
 *
 * Body:
 *   batch_size  integer  (default 10, max 20)  — quotes per run
 *   quarantine  boolean  (default false)        — draft flagged quotes
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyExistingQuote } from "@/lib/gemini";
import { searchSerper } from "@/lib/quotes-seeder";

export const runtime  = "nodejs";
export const maxDuration = 300;

const WP_URL  = process.env.NEXT_PUBLIC_WP_URL   ?? "https://cms.themoveee.com";
const API_KEY = process.env.CULTURE_API_SECRET    ?? "";

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET ?? "";
  return !!secret && req.headers.get("Authorization") === `Bearer ${secret}`;
}

interface WpQuote {
  id:     number;
  text:   string;
  author: string;
  source: string;
}

async function fetchAuditBatch(size: number): Promise<WpQuote[]> {
  const res = await fetch(
    `${WP_URL}/wp-json/culture/v1/quotes/audit-batch?size=${size}`,
    {
      headers: {
        "Authorization":        `Bearer ${API_KEY}`,
        "X-Culture-API-Secret": API_KEY,
      },
      cache: "no-store",
    }
  );
  if (!res.ok) throw new Error(`audit-batch fetch failed: HTTP ${res.status}`);
  const data = await res.json();
  return (data.quotes ?? []) as WpQuote[];
}

async function writeAuditResult(
  postId:     number,
  verdict:    string,
  note:       string,
  quarantine: boolean
): Promise<void> {
  await fetch(`${WP_URL}/wp-json/culture/v1/quotes/audit-update`, {
    method: "POST",
    headers: {
      "Content-Type":         "application/json",
      "Authorization":        `Bearer ${API_KEY}`,
      "X-Culture-API-Secret": API_KEY,
    },
    body: JSON.stringify({
      post_id:      postId,
      audit_status: verdict,
      audit_note:   note,
      quarantine,
    }),
  });
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body       = await req.json().catch(() => ({}));
  const batchSize  = Math.min(parseInt(String(body.batch_size ?? "5"), 10) || 5, 20);
  const quarantine = body.quarantine === true;

  let quotes: WpQuote[];
  try {
    quotes = await fetchAuditBatch(batchSize);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }

  if (quotes.length === 0) {
    return NextResponse.json({ message: "All quotes have been audited.", audited: 0 });
  }

  const results: Array<{
    id:           number;
    author:       string;
    text_preview: string;
    verdict:      string;
    reason:       string;
    quarantined:  boolean;
  }> = [];

  for (const quote of quotes) {
    try {
      // Two targeted searches: exact phrase + author page on Wikiquote.
      const [phraseResults, wikiquoteResults] = await Promise.all([
        searchSerper(`"${quote.text.slice(0, 80)}" "${quote.author}"`),
        searchSerper(`"${quote.author}" quotes site:wikiquote.org`),
      ]);

      const allResults = [...phraseResults, ...wikiquoteResults];

      const { verdict, reason } = await verifyExistingQuote(
        quote.text,
        quote.author,
        quote.source,
        allResults
      );

      const shouldQuarantine =
        quarantine && (verdict === "likely-fabricated" || verdict === "suspicious");

      await writeAuditResult(quote.id, verdict, reason, shouldQuarantine);

      results.push({
        id:           quote.id,
        author:       quote.author,
        text_preview: quote.text.slice(0, 60) + "…",
        verdict,
        reason,
        quarantined:  shouldQuarantine,
      });
    } catch (err: any) {
      // Mark unverifiable so the quote isn't re-queued endlessly on error.
      const fallbackReason = `Audit error: ${err.message}`;
      await writeAuditResult(quote.id, "unverifiable", fallbackReason, false).catch(() => {});
      results.push({
        id:           quote.id,
        author:       quote.author,
        text_preview: quote.text.slice(0, 60) + "…",
        verdict:      "unverifiable",
        reason:       fallbackReason,
        quarantined:  false,
      });
    }

    // Gentle rate-limiting between quotes.
    await new Promise((r) => setTimeout(r, 800));
  }

  const summary = {
    verified:          results.filter((r) => r.verdict === "verified").length,
    suspicious:        results.filter((r) => r.verdict === "suspicious").length,
    likely_fabricated: results.filter((r) => r.verdict === "likely-fabricated").length,
    unverifiable:      results.filter((r) => r.verdict === "unverifiable").length,
    quarantined:       results.filter((r) => r.quarantined).length,
  };

  return NextResponse.json({ audited: results.length, summary, results });
}
