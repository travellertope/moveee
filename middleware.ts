import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const WP_REST = `${process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com"}/wp-json/culture/v1/redirects`;

let cachedRedirects: Array<{ from: string; to: string; permanent: boolean }> = [];
let cacheUntil = 0;

async function getRedirects() {
  if (Date.now() < cacheUntil) return cachedRedirects;
  try {
    const res = await fetch(WP_REST, { next: { revalidate: 120 } });
    if (res.ok) {
      cachedRedirects = await res.json();
      cacheUntil = Date.now() + 120_000;
    }
  } catch {
    // silently keep stale cache on network failure
  }
  return cachedRedirects;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const redirects = await getRedirects();
  const match = redirects.find((r) => r.from === pathname);

  if (match) {
    const status = match.permanent ? 308 : 307;
    if (match.to.startsWith("http")) {
      return NextResponse.redirect(match.to, { status });
    }
    const url = request.nextUrl.clone();
    url.pathname = match.to;
    return NextResponse.redirect(url, { status });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|api/).*)"],
};
