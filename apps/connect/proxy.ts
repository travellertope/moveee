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

  // Note: the bare /connect path used to redirect to /feed (back-compat for
  // when the feed itself briefly lived there) — that redirect is gone now
  // that /connect is a real page (the Literati Connect landing page, see
  // app/connect/page.tsx). /connect/people, /connect/membership,
  // /connect/perks, /connect/[username] are unaffected either way.

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
