import { NextRequest, NextResponse } from "next/server";

const EDITION_PATHS = /^\/(us|uk|africa)(\/.*)?$/;

// Crawler user-agent patterns to rate-limit on edition pages
const CRAWLER_RE = /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|linkedinbot|discordbot/i;

// In-memory store for crawler rate limiting (resets on cold start — acceptable for edge)
const crawlerHits = new Map<string, { count: number; resetAt: number }>();
const CRAWLER_LIMIT = 10;       // max requests per window per IP
const CRAWLER_WINDOW_MS = 60_000; // 1 minute

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!EDITION_PATHS.test(pathname)) return NextResponse.next();

  const ua = request.headers.get("user-agent") ?? "";

  if (CRAWLER_RE.test(ua)) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const key = `${ip}:${pathname}`;
    const now = Date.now();
    const slot = crawlerHits.get(key);

    if (!slot || now > slot.resetAt) {
      crawlerHits.set(key, { count: 1, resetAt: now + CRAWLER_WINDOW_MS });
    } else {
      slot.count++;
      if (slot.count > CRAWLER_LIMIT) {
        return new NextResponse("Too Many Requests", {
          status: 429,
          headers: { "Retry-After": "60" },
        });
      }
    }
  }

  const response = NextResponse.next();

  // Tell Vercel's CDN and downstream caches to serve stale while revalidating.
  // s-maxage=300 matches the revalidate=300 in the page.
  // stale-while-revalidate=600 means the CDN serves the cached copy for up to
  // 10 minutes while Next.js regenerates in the background — eliminates stampedes.
  response.headers.set(
    "Cache-Control",
    "public, s-maxage=300, stale-while-revalidate=600"
  );

  return response;
}

export const config = {
  matcher: ["/us/:path*", "/uk/:path*", "/africa/:path*"],
};
