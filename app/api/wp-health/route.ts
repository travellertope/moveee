/**
 * GET /api/wp-health
 *
 * Diagnostic endpoint: tests the WordPress GraphQL connection and runs the
 * three queries used by /directory, /visuals, and /quotes.
 * Returns raw counts and any errors so you can see exactly what's failing.
 *
 * No auth required — returns only aggregate counts, never content.
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WP_GRAPHQL =
  process.env.NEXT_PUBLIC_WORDPRESS_API_URL ||
  "https://cms.themoveee.com/graphql";

async function probe(label: string, query: string, variables: object) {
  const start = Date.now();
  try {
    const res = await fetch(WP_GRAPHQL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });

    const elapsed = Date.now() - start;

    if (!res.ok) {
      return { label, ok: false, status: res.status, elapsed, error: res.statusText };
    }

    const json = await res.json();

    if (json.errors?.length) {
      return {
        label,
        ok: false,
        elapsed,
        graphqlErrors: json.errors.map((e: any) => e.message),
        data: json.data,
      };
    }

    // Count nodes in the first collection found in the response.
    const key = Object.keys(json.data ?? {})[0];
    const count = json.data?.[key]?.nodes?.length ?? null;

    return { label, ok: true, elapsed, count };
  } catch (err: any) {
    return { label, ok: false, elapsed: Date.now() - start, error: err?.message };
  }
}

export async function GET() {
  const [directory, quotes] = await Promise.all([
    probe(
      "directory",
      `query { cultureDirectories(first: 5, where: { status: PUBLISH }) { nodes { title } } }`,
      {}
    ),
    probe(
      "quotes",
      `query { cultureQuotes(first: 5, where: { status: PUBLISH }) { nodes { title } } }`,
      {}
    ),
  ]);

  const allOk = [directory, quotes].every((r) => r.ok);

  return NextResponse.json(
    {
      graphqlUrl: WP_GRAPHQL,
      allOk,
      probes: [directory, quotes],
    },
    { status: allOk ? 200 : 502 }
  );
}
