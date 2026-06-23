import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Site A (themoveee.com)-only paths. Site B has no route for these — shared
// components (e.g. Footer.tsx) and vendor pages link to them with relative
// hrefs, which resolve to web.themoveee.com and 404 without this redirect.
const SITE_A_PREFIXES = ['/shop', '/makers']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Redirect root to /feed
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/feed', request.url))
  }

  // Back-compat: old bare /connect feed URL → /feed.
  // /connect/people, /connect/membership, /connect/perks, /connect/[username]
  // are unaffected — only the feed itself moved.
  if (pathname === '/connect') {
    return NextResponse.redirect(new URL('/feed', request.url))
  }

  if (SITE_A_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.redirect(`https://themoveee.com${pathname}`, 308)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
