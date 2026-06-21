import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
