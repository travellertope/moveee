import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { editionFromCountry, isValidRegionalSlug } from "./lib/editions";

const COOKIE = "moveee-edition";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // When a user visits a regional path manually, lock their cookie to that edition
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0 && isValidRegionalSlug(segments[0])) {
    const edition = segments[0];
    const saved = request.cookies.get(COOKIE)?.value;
    if (saved !== edition) {
      const res = NextResponse.next();
      res.cookies.set(COOKIE, edition, { path: "/", maxAge: COOKIE_MAX_AGE });
      return res;
    }
    return NextResponse.next();
  }

  // Only geo-redirect on the exact homepage
  if (pathname !== "/") return NextResponse.next();

  // If user already has a saved edition preference, redirect to it
  const saved = request.cookies.get(COOKIE)?.value;
  if (saved && isValidRegionalSlug(saved)) {
    return NextResponse.redirect(new URL(`/${saved}`, request.url));
  }

  // Geo-detect via Vercel header (populated automatically on Vercel Edge)
  const country = request.headers.get("x-vercel-ip-country") ?? "";
  const edition = editionFromCountry(country);

  if (edition !== "global") {
    const res = NextResponse.redirect(new URL(`/${edition}`, request.url));
    res.cookies.set(COOKIE, edition, { path: "/", maxAge: COOKIE_MAX_AGE });
    return res;
  }

  return NextResponse.next();
}

export const config = {
  // Run on homepage and all regional edition paths; skip static/api
  matcher: ["/", "/uk/:path*", "/us/:path*", "/africa/:path*"],
};
