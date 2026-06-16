import { NextRequest, NextResponse } from "next/server";

const SECRET = process.env.WP_REVALIDATE_SECRET;

export async function POST(req: NextRequest) {
  // Verify secret to prevent unauthorised cache flushes
  const auth = req.headers.get("x-revalidate-secret");
  if (!SECRET || auth !== SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return NextResponse.json({ message: "KV not configured, nothing to flush" });
  }

  try {
    const { kv } = await import("@vercel/kv");

    // Always reset the circuit breaker first so CMS requests can flow immediately
    await kv.del("cb:cms");

    // Flush all wp: keys — fired when any post is published/updated in WP Admin
    const keys: string[] = [];
    let cursor = 0;
    do {
      const [nextCursor, batch] = await kv.scan(cursor, { match: "wp:*", count: 100 });
      keys.push(...batch);
      cursor = Number(nextCursor);
    } while (cursor !== 0);

    if (keys.length > 0) {
      await kv.del(...keys);
    }

    console.log(`[kv-revalidate] Reset circuit breaker + flushed ${keys.length} cached WP queries`);
    return NextResponse.json({ flushed: keys.length, circuit_breaker: "reset" });
  } catch (err: any) {
    console.error("[kv-revalidate] Error:", err.message);
    return NextResponse.json({ error: "Flush failed" }, { status: 500 });
  }
}
