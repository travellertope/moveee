import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Top-level path segments that are real app routes.
 * Any single-segment path NOT in this list is treated as a magazine
 * article slug and redirected to /magazine/:slug.
 */
const APP_ROUTES = new Set([
  "login",
  "register",
  "member",
  "newsletter",
  "magazine",
  "author",
  "api",
  "events",
  "origins",
  "shop",
  "connect",
  "reset-password",
  "ai-use",
  "contact",
  "cookie-policy",
  "privacy",
  "terms",
  "_next",
]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only act on single-segment paths: /some-slug
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length !== 1) return NextResponse.next();

  const slug = segments[0];

  // Skip known app routes and anything with a file extension
  if (APP_ROUTES.has(slug) || slug.includes(".")) return NextResponse.next();

  // Redirect bare slugs to /magazine/:slug
  const url = request.nextUrl.clone();
  url.pathname = `/magazine/${slug}`;
  return NextResponse.redirect(url, { status: 307 });
}

export const config = {
  // Run on all paths except static files and images
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};
