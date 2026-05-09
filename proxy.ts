import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Moveee SEO Redirect Proxy
 *
 * Handles legacy WordPress permalinks (/%postname%/) and taxonomy
 * archives so old links from Google, social media, and backlinks
 * redirect to the correct Next.js routes with 301 permanent redirects.
 *
 * Also applies runtime redirects managed via WP Admin → Culture Community → Redirects.
 * Those take priority over the catch-all slug→magazine redirect below.
 */

// ── WP Admin redirect cache ───────────────────────────────────
const WP_REDIRECTS_URL = 'https://cms.themoveee.com/wp-json/culture/v1/redirects'

let _wpRedirects: Array<{ from: string; to: string; permanent: boolean }> = []
let _wpCacheUntil = 0

async function getWPRedirects() {
  if (Date.now() < _wpCacheUntil) return _wpRedirects
  try {
    const res = await fetch(WP_REDIRECTS_URL)
    if (res.ok) {
      _wpRedirects = await res.json()
      _wpCacheUntil = Date.now() + 120_000
    }
  } catch {
    // keep stale cache on network errors
  }
  return _wpRedirects
}

// Routes that exist (or will exist) in the Next.js app.
// Add to this set as you create new pages.
const APP_ROUTES = new Set([
  'magazine',
  'events',
  'journeys',
  'lifestyle',
  'about',
  'contact',
  'newsletter',
  'account',
  'membership',
  'privacy',
  'terms',
  'search',
  'community',
  'podcast',
  'gallery',
  'faq',
  'careers',
  'partners',
  'press',
  'advertise',
  'donate',
  // Auth + member routes
  'login',
  'register',
  'member',
  'reset-password',
  'forgot-password',
  'connect',
  // Community features
  'quotes',
  'directory',
  // Additional app pages
  'chapters',
  'author',
  'api',
  'ai-use',
  'cookie-policy',
  'shop',
  'visuals',
  'makers',
  'pulse',
  'games',
])

// Alias redirects — old or alternative slugs that should map
// to their canonical Next.js route.
const ROUTE_ALIASES: Record<string, string> = {
  'tours': '/journeys',
  'lifestyle': '/shop',
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── WP Admin redirect manager (checked first, highest priority) ──
  const wpRedirects = await getWPRedirects()
  const wpMatch = wpRedirects.find((r) => r.from === pathname)
  if (wpMatch) {
    const status = wpMatch.permanent ? 308 : 307
    if (wpMatch.to.startsWith('http')) {
      return NextResponse.redirect(wpMatch.to, { status })
    }
    return NextResponse.redirect(new URL(wpMatch.to, request.url), { status })
  }

  // ── WordPress taxonomy archives ──────────────────────────────
  // /category/slug → /magazine?category=slug
  if (pathname.startsWith('/category/')) {
    const slug = pathname.replace('/category/', '').replace(/\/$/, '')
    return NextResponse.redirect(
      new URL(`/magazine?category=${slug}`, request.url),
      301
    )
  }

  // /tag/slug → /magazine
  if (pathname.startsWith('/tag/')) {
    return NextResponse.redirect(new URL('/magazine', request.url), 301)
  }


  // /series/slug → /magazine (JetEngine taxonomy)
  if (pathname.startsWith('/series/')) {
    return NextResponse.redirect(new URL('/magazine', request.url), 301)
  }

  // /country/slug → /magazine (JetEngine taxonomy)
  if (pathname.startsWith('/country/')) {
    return NextResponse.redirect(new URL('/magazine', request.url), 301)
  }

  // /industry/slug → /magazine (JetEngine taxonomy)
  if (pathname.startsWith('/industry/')) {
    return NextResponse.redirect(new URL('/magazine', request.url), 301)
  }

  // ── WordPress date archives ──────────────────────────────────
  // /2023/10/12/post-slug → /magazine/post-slug
  const datePostPattern = /^\/\d{4}\/\d{2}\/\d{2}\/([^/]+)\/?$/
  const datePostMatch = pathname.match(datePostPattern)
  if (datePostMatch) {
    return NextResponse.redirect(
      new URL(`/magazine/${datePostMatch[1]}`, request.url),
      301
    )
  }

  // /2023/10/post-slug → /magazine/post-slug
  const monthPostPattern = /^\/\d{4}\/\d{2}\/([^/]+)\/?$/
  const monthPostMatch = pathname.match(monthPostPattern)
  if (monthPostMatch && !/^\d+$/.test(monthPostMatch[1])) {
    return NextResponse.redirect(
      new URL(`/magazine/${monthPostMatch[1]}`, request.url),
      301
    )
  }

  // /2023/10 → /magazine (date archive)
  const monthArchivePattern = /^\/\d{4}\/\d{2}\/?$/
  if (monthArchivePattern.test(pathname)) {
    return NextResponse.redirect(new URL('/magazine', request.url), 301)
  }

  // ── WordPress pagination ─────────────────────────────────────
  // /page/2 → /magazine
  if (pathname.startsWith('/page/')) {
    return NextResponse.redirect(new URL('/magazine', request.url), 301)
  }

  // ── WordPress admin → CMS subdomain ──────────────────────────
  if (pathname.startsWith('/wp-admin')) {
    return NextResponse.redirect(
      new URL(pathname, 'https://cms.themoveee.com'),
      302
    )
  }
  if (pathname === '/wp-login.php') {
    return NextResponse.redirect(
      new URL('/wp-login.php', 'https://cms.themoveee.com'),
      302
    )
  }

  // ── WordPress feed → magazine ────────────────────────────────
  if (pathname === '/feed' || pathname.startsWith('/feed/')) {
    return NextResponse.redirect(new URL('/magazine', request.url), 301)
  }

  // ── Route aliases (e.g. /tours → /origins, /shop → /lifestyle) ──
  const cleanPath = pathname.replace(/^\/|\/$/g, '')
  const aliasTarget = ROUTE_ALIASES[cleanPath.toLowerCase()]
  if (aliasTarget) {
    return NextResponse.redirect(new URL(aliasTarget, request.url), 301)
  }

  // ── Root-level post slugs (/%postname%/) ─────────────────────
  // This is the old WordPress permalink structure.
  // Only redirect single-segment paths that don't match known app routes.
  if (cleanPath && !cleanPath.includes('/') && !APP_ROUTES.has(cleanPath.toLowerCase())) {
    return NextResponse.redirect(
      new URL(`/magazine/${cleanPath}`, request.url),
      301
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
