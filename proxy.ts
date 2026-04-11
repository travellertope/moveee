import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Moveee SEO Redirect Middleware
 * Handles legacy WordPress permalinks and site-wide redirects.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Redirect legacy /category/slug to /magazine?category=slug
  if (pathname.startsWith('/category/')) {
    const slug = pathname.replace('/category/', '')
    return NextResponse.redirect(new URL(`/magazine?category=${slug}`, request.url))
  }

  // Handle common legacy single post patterns if they don't exist in Next.js
  // Note: Actual 1:1 mapping often requires a lookup, but we can handle standard structural shifts.
  // Example: /2023/10/12/post-slug/ -> /magazine/post-slug
  const legacyPostPattern = /^\/\d{4}\/\d{2}\/\d{2}\/([^\/]+)\/$/
  const match = pathname.match(legacyPostPattern)
  if (match) {
    const slug = match[1]
    return NextResponse.redirect(new URL(`/magazine/${slug}`, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
