# Moveee SEO Implementation Plan

Generated: June 2026  
Status: Pre-implementation — complete this document before writing any code.

---

## Brand & Messaging Baseline

| Surface | Brand name | Domain | Tagline |
|---|---|---|---|
| `apps/site` | **Moveee Magazine** | `themoveee.com` | Connect to Culture |
| `apps/connect` | **Moveee** | `web.themoveee.com` | Connect to Culture |

**Description framing (universal — use this in all metadata):**  
*"An independent magazine and community for people who live for culture — music, film, art, food, travel, and ideas."*

Do NOT describe the brand as specifically African or Nigerian in metadata or SEO copy.  
The content and community speak for themselves.

---

## Part 1 — Moveee Magazine (`apps/site` / `themoveee.com`)

### What this site is

Editorial-first, no auth. Magazine articles, shop, newsletters, journeys, events listings (read-only), games (read-only). Fully cacheable — ISR strategy in place (300–3600s revalidation).

### 1.1 Metadata fixes

#### Root layout (`apps/site/app/layout.tsx`)

**Current issues:**
- `title.default` says "Best in African Culture" → update
- `description` says "celebrating the best of African and diaspora culture" → update
- `alternates.canonical` is relative `"/"` → must be absolute `"https://themoveee.com/"`
- Twitter card missing `site` and `creator` handles
- OG `alt` says "Best in African Culture" → update

**Target state:**
```ts
metadataBase: new URL("https://themoveee.com"),
title: {
  default: "Moveee Magazine — Connect to Culture",
  template: "%s | Moveee Magazine",
},
description: "An independent magazine for people who live for culture — music, film, art, food, travel, and ideas.",
alternates: { canonical: "https://themoveee.com/" },
openGraph: {
  siteName: "Moveee Magazine",
  images: [{ url: "/og-fallback.png", width: 1200, height: 630, alt: "Moveee Magazine" }],
},
twitter: {
  card: "summary_large_image",
  site: "@themoveee",
  creator: "@themoveee",
},
```

#### Homepage (`apps/site/app/page.tsx`)

- Update title from "Best in African Culture" → "Moveee Magazine — Connect to Culture"
- Update all description strings to universal framing
- Ensure canonical is `"https://themoveee.com/"`

#### Magazine filter pages (missing canonicals — HIGH priority)

Pages: `/magazine`, `/magazine/category/[slug]`, `/magazine/tag/[slug]`, `/magazine/country/[slug]`, `/magazine/industry/[slug]`, `/magazine/series/[slug]`

- Each accepts multiple query params (`?category=X&country=Y`) with no canonical set
- Risk: `/magazine?category=film` and `/magazine/category/film` treated as duplicates
- Fix: add `alternates.canonical` to the clean URL (e.g. `/magazine/category/film`)
- Add `openGraph.url` and `openGraph.images` (currently missing on filter pages)

#### Article pages (`/magazine/[slug]`)

- Already uses featured image for OG ✅
- Missing: `openGraph.type: "article"`, `openGraph.publishedTime`, `openGraph.authors`
- Missing: `alternates.canonical` (absolute URL)
- Twitter `site` + `creator` missing

#### Shop product pages (`/shop/[slug]`) — CRITICAL

- No `generateMetadata()` at all
- Add: title (`{product.name} | Moveee Magazine`), description, OG image from product image, canonical, `openGraph.type: "website"` (or use `product` type)

#### Pages that must be noindexed

Add `robots: { index: false, follow: false }` to:
- `/register`, `/register/complete`
- `/forgot-password`, `/reset-password`
- `/newsletter/unsubscribe`
- `/[edition]` (already done ✅)
- `/pulse/admin`, `/events/admin`
- `/directory/submit`, `/events/submit`

---

### 1.2 Structured data (JSON-LD) — currently zero

#### Organization schema — root layout

Add once in `layout.tsx` (applies to every page):
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Moveee Magazine",
  "url": "https://themoveee.com",
  "logo": "https://themoveee.com/logo.png",
  "sameAs": ["https://twitter.com/themoveee", "https://instagram.com/themoveee"]
}
```

#### Article schema — `/magazine/[slug]`

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "{post.title}",
  "description": "{post.excerpt}",
  "image": "{post.featuredImage.url}",
  "datePublished": "{post.date}",
  "dateModified": "{post.modified}",
  "author": { "@type": "Person", "name": "{post.author.name}" },
  "publisher": { "@type": "Organization", "name": "Moveee Magazine", "logo": "..." }
}
```

#### BreadcrumbList schema — `/magazine/[slug]`

Breadcrumbs are already visible in the UI (lines 193–197 of page.tsx) — add schema:
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://themoveee.com" },
    { "@type": "ListItem", "position": 2, "name": "Magazine", "item": "https://themoveee.com/magazine" },
    { "@type": "ListItem", "position": 3, "name": "{category}", "item": "https://themoveee.com/magazine/category/{slug}" },
    { "@type": "ListItem", "position": 4, "name": "{post.title}" }
  ]
}
```

#### Product schema — `/shop/[slug]`

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "{product.name}",
  "description": "{product.description}",
  "image": "{product.image}",
  "offers": {
    "@type": "Offer",
    "price": "{product.price}",
    "priceCurrency": "GBP",
    "availability": "https://schema.org/InStock",
    "url": "https://themoveee.com/shop/{product.slug}"
  }
}
```

#### WebSite schema — root layout (enables sitelinks searchbox)

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Moveee Magazine",
  "url": "https://themoveee.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://themoveee.com/magazine?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

---

### 1.3 Sitemap (`apps/site/app/sitemap.ts`) — MAJOR GAP

**Current state:** Only returns 6 static pages + pulse/community slugs.

**Missing entirely:**
- All `/magazine/[slug]` article URLs
- All `/shop/[slug]` product URLs
- All `/events/[slug]` event URLs
- All `/makers/[slug]` URLs
- All `/journeys/[slug]` URLs
- All `/newsletter/[slug]` newsletter issue URLs
- Category/tag archive pages

**Target sitemap structure:**
```
Static pages:          / , /magazine, /shop, /events, /journeys, /newsletter, /games
Magazine articles:     /magazine/{slug}  (all published posts, changefreq: weekly)
Shop products:         /shop/{slug}       (changefreq: weekly)
Events:                /events/{slug}     (changefreq: daily — time-sensitive)
Makers:                /makers/{slug}     (changefreq: monthly)
Journeys:              /journeys/{slug}   (changefreq: monthly)
Newsletter issues:     /newsletter/{slug} (changefreq: yearly — evergreen)
Category archives:     /magazine/category/{slug}
Tag archives:          /magazine/tag/{slug}
```

**Implementation:** Fetch slugs from WPGraphQL for each CPT, paginate if >100 items. Use `lastModified` from post `modified` date where available.

---

### 1.4 Robots (`apps/site/public/robots.txt` → `apps/site/app/robots.ts`)

**Current static file:**
```
User-agent: *
Allow: /pulse/
Disallow: /api/
Disallow: /pulse/admin
Sitemap: https://themoveee.com/sitemap.xml
```

**Target `app/robots.ts`:**
```ts
export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/register",
        "/register/complete",
        "/forgot-password",
        "/reset-password",
        "/newsletter/unsubscribe",
        "/events/admin",
        "/events/submit",
        "/directory/submit",
        "/pulse/admin",
      ],
    },
    sitemap: "https://themoveee.com/sitemap.xml",
  }
}
```

Delete `public/robots.txt` once `app/robots.ts` is live.

---

### 1.5 Redirect audit (`apps/site/next.config.mjs`)

| Current | Target | Fix |
|---|---|---|
| `/services/amplify → /services` (temporary 307) | Should be permanent 301 | Change `permanent: false` → `true` |
| `/services/presskit → /services` (temporary 307) | Should be permanent 301 | Change `permanent: false` → `true` |
| `/services/book-publishers → /services` (temporary 307) | Should be permanent 301 | Change `permanent: false` → `true` |

---

### 1.6 ISR strategy (document — no code change needed)

| Page type | Revalidate | Rationale |
|---|---|---|
| Homepage | 300s | High traffic, changes daily |
| Magazine archive | 300s | New articles added frequently |
| Article pages | 600s | Content rarely changes post-publish |
| Shop pages | 300s | Inventory/price changes |
| Events | 300s | Time-sensitive |
| Makers/journeys | 3600s | Rarely updated |
| Newsletter issues | 3600s | Evergreen |

---

## Part 2 — Moveee (`apps/connect` / `web.themoveee.com`)

### What this site is

Community + auth platform. Public pages: events, directory, games, quotes, pulse stories, community posts, public member profiles, membership info. Private pages: `/member/*` (dashboard, wallet, settings, analytics).

**SEO philosophy for web.themoveee.com:** Index public discovery pages aggressively. Strictly noindex everything behind `/member/`. The community content (events, directory entries, quotes, public profiles) is the SEO value here — these are long-tail discovery pages.

---

### 2.1 Root layout (`apps/connect/app/layout.tsx`)

**Current:** Title + description only. No OG, no Twitter, no canonical, no robots.

**Target state:**
```ts
metadataBase: new URL("https://web.themoveee.com"),
title: {
  default: "Moveee — Connect to Culture",
  template: "%s | Moveee",
},
description: "The Moveee community — discover events, creative people, and cultural experiences near you.",
openGraph: {
  siteName: "Moveee",
  images: [{ url: "https://themoveee.com/og-fallback.png", width: 1200, height: 630, alt: "Moveee" }],
},
twitter: {
  card: "summary_large_image",
  site: "@themoveee",
  creator: "@themoveee",
},
```

Note: OG fallback image should reference `themoveee.com` (absolute) since `apps/connect` has no `/public` folder.

---

### 2.2 Page-level metadata gaps

#### Hub pages — missing OG + Twitter + canonical

All these pages have title + description but no OG/Twitter tags:

| Page | Fix needed |
|---|---|
| `/connect` (pulse feed) | Add OG + Twitter + canonical |
| `/events` | Add OG + Twitter + canonical |
| `/games` | Add OG + Twitter + canonical |
| `/directory` | Add OG + Twitter + canonical |
| `/quotes` | Add OG + Twitter + canonical |
| `/connect/people` | Add OG + Twitter + canonical |
| `/connect/membership` | Add OG + Twitter + canonical |
| `/connect/perks` | Add OG + Twitter + canonical |

#### Dynamic pages — missing canonical

| Page | Fix needed |
|---|---|
| `/events/[slug]` | Add `alternates.canonical` |
| `/directory/[slug]` | Add `alternates.canonical` + Twitter card |
| `/quotes/[slug]` | Add `alternates.canonical` |
| `/quotes/author/[slug]` | Add OG + Twitter + canonical |
| `/connect/[username]` | Add `alternates.canonical` |
| `/community/[slug]` | Already has canonical ✅ |
| `/pulse/[slug]` | Already has canonical ✅ |

#### Auth pages — no metadata, should be noindexed

`/login`, `/register`, `/forgot-password`, `/reset-password` are client-only components — add `export const metadata` with `robots: { index: false }` to each, or handle via `robots.ts`.

---

### 2.3 Member pages — CRITICAL noindex gap

Every page under `/member/` must be noindexed. Private session-dependent content should never appear in Google.

**Approach:** Add to `/app/member/layout.tsx` (if it exists) or to each page:
```ts
export const metadata = {
  robots: { index: false, follow: false },
}
```

Pages affected:
- `/member` (dashboard)
- `/member/wallet`
- `/member/collection`
- `/member/portfolio`
- `/member/coupons`
- `/member/analytics`
- `/member/notifications`
- `/member/settings` and all sub-routes

---

### 2.4 Structured data

#### Already implemented ✅
- `/pulse/[slug]` — NewsArticle schema
- `/community/[slug]` — SocialMediaPosting schema
- `/quotes/[slug]` — Quotation schema

#### Missing — add these

| Page | Schema type |
|---|---|
| Root layout | Organization |
| `/events/[slug]` | Event |
| `/directory/[slug]` | LocalBusiness or Person (based on entry type) |
| `/connect/[username]` | Person |
| `/events` | CollectionPage + ItemList |
| `/directory` | CollectionPage |
| `/quotes` | CollectionPage |

**Event schema example:**
```json
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "{event.title}",
  "startDate": "{event.startDate}",
  "endDate": "{event.endDate}",
  "location": { "@type": "Place", "name": "{event.venue}", "address": "{event.city}" },
  "organizer": { "@type": "Organization", "name": "{event.organiser}" },
  "image": "{event.featuredImage}",
  "url": "https://web.themoveee.com/events/{event.slug}"
}
```

**LocalBusiness/Person schema for directory:**
```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "{entry.name}",
  "description": "{entry.excerpt}",
  "image": "{entry.featuredImage}",
  "address": { "@type": "PostalAddress", "addressLocality": "{entry.city}" },
  "url": "https://web.themoveee.com/directory/{entry.slug}"
}
```

---

### 2.5 Sitemap (`apps/connect/app/sitemap.ts`) — DOES NOT EXIST

**Create from scratch.** Include only public, indexable pages.

**Target sitemap structure:**
```
Static pages:      /connect, /events, /games, /directory, /quotes, /connect/people, /connect/membership
Event pages:       /events/{slug}        (all published events, changefreq: daily)
Directory entries: /directory/{slug}     (all entries, changefreq: weekly)
Quote pages:       /quotes/{slug}        (changefreq: yearly)
Quote authors:     /quotes/author/{slug} (changefreq: monthly)
Public profiles:   /connect/{username}   (changefreq: weekly)
Pulse stories:     /pulse/{slug}         (changefreq: weekly)
Community posts:   /community/{slug}     (public only, changefreq: weekly)
```

**DO NOT include in sitemap:**
- `/member/*` (private)
- `/login`, `/register`, `/forgot-password`, `/reset-password`
- `/connect/perks` (session-gated content)

---

### 2.6 Robots (`apps/connect/app/robots.ts`) — DOES NOT EXIST

No `robots.ts` and no `public/robots.txt`. Search engines have zero crawl directives.

**Create `app/robots.ts`:**
```ts
export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/connect", "/events", "/directory", "/games", "/quotes", "/connect/people", "/connect/membership"],
        disallow: [
          "/member/",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
          "/api/",
          "/connect/perks",
          "/vendor/",
        ],
      },
    ],
    sitemap: "https://web.themoveee.com/sitemap.xml",
  }
}
```

Also create `/apps/connect/public/` directory and copy or symlink `og-fallback.png` from `apps/site/public/`. This fixes the broken 404 on social share previews for fallback OG images.

---

## Part 3 — Shared / Cross-cutting

### 3.1 Twitter handles

Add `twitter.site: "@themoveee"` and `twitter.creator: "@themoveee"` to:
- `apps/site/app/layout.tsx` root metadata (propagates to all pages as fallback)
- `apps/connect/app/layout.tsx` root metadata
- Individual page overrides where author twitter handle is known (article pages: use author handle if available)

### 3.2 OG image strategy

**Decision: no dynamic `/api/og` route** (too complex for limited gain at this stage).

Instead ensure every indexable page uses the most specific image available:
- Article → `post.featuredImage.url` (already done ✅)
- Product → `product.imageUrl`
- Event → `event.featuredImage`
- Directory entry → `entry.featuredImage`
- Quote → author image or branded static
- Hub pages → `og-fallback.png`
- Member profiles → `user.avatarUrl` or `og-fallback.png`

### 3.3 Cross-site linking

Google treats `themoveee.com` and `web.themoveee.com` as separate domains for authority purposes. Internal links between them should use full absolute URLs and `rel="noopener"` (not internal `<Link>` components). Both sites should have a clear canonical home — Moveee Magazine at `themoveee.com` should be the authority domain.

---

## Implementation order

Work through these phases in order. Each phase is a self-contained PR.

### Phase 1 — Stop the bleeding (1 PR)
- `apps/site`: robots.ts (replace static robots.txt), noindex auth/form pages
- `apps/connect`: robots.ts (new), noindex all `/member/*` pages, fix broken og-fallback.png

**Why first:** Prevents private pages from being indexed and fixes crawl directive gap.

### Phase 2 — Brand + description update (1 PR)
- `apps/site`: Update root layout + homepage metadata to new brand framing
- `apps/connect`: Update root layout metadata, add OG + Twitter fallbacks
- Both: Add `twitter.site` + `twitter.creator` everywhere

**Why second:** Establishes correct brand signals before we build out richer metadata.

### Phase 3 — Metadata completeness (1 PR)
- `apps/site`: Add `generateMetadata()` to `/shop/[slug]`, fix canonical on all filter/archive pages, add OG to category/tag pages
- `apps/connect`: Add OG + Twitter + canonical to all hub pages and missing dynamic pages, add canonical to events/directory/quotes/profiles

### Phase 4 — Structured data (1 PR)
- `apps/site`: Organization + WebSite schema in root layout, Article + BreadcrumbList in `/magazine/[slug]`, Product in `/shop/[slug]`
- `apps/connect`: Organization in root layout, Event in `/events/[slug]`, LocalBusiness/Person in `/directory/[slug]`, Person in `/connect/[username]`

### Phase 5 — Sitemaps (1 PR)
- `apps/site`: Expand sitemap to include all article/product/event/maker/journey/newsletter URLs
- `apps/connect`: Create sitemap from scratch covering all public indexable routes
- Both: Submit updated sitemaps to Google Search Console after deploy

### Phase 6 — Redirect cleanup (1 PR, low risk)
- `apps/site/next.config.mjs`: Change `/services/*` redirects from temporary (307) to permanent (301)

---

## Files to create / modify

### `apps/site`
| Action | File |
|---|---|
| Modify | `app/layout.tsx` |
| Modify | `app/page.tsx` |
| Modify | `app/magazine/page.tsx` |
| Modify | `app/magazine/[slug]/page.tsx` |
| Modify | `app/magazine/category/[slug]/page.tsx` |
| Modify | `app/magazine/tag/[slug]/page.tsx` |
| Modify | `app/magazine/country/[slug]/page.tsx` |
| Modify | `app/magazine/industry/[slug]/page.tsx` |
| Modify | `app/magazine/series/[slug]/page.tsx` |
| Modify | `app/shop/[slug]/page.tsx` (add generateMetadata) |
| Modify | `app/sitemap.ts` |
| Modify | `next.config.mjs` |
| Create | `app/robots.ts` |
| Delete | `public/robots.txt` |
| Create | `components/JsonLd.tsx` (reusable JSON-LD component) |

### `apps/connect`
| Action | File |
|---|---|
| Modify | `app/layout.tsx` |
| Modify | `app/connect/page.tsx` |
| Modify | `app/events/page.tsx` |
| Modify | `app/events/[slug]/page.tsx` |
| Modify | `app/games/page.tsx` |
| Modify | `app/directory/page.tsx` |
| Modify | `app/directory/[slug]/page.tsx` |
| Modify | `app/quotes/page.tsx` |
| Modify | `app/quotes/[slug]/page.tsx` |
| Modify | `app/quotes/author/[slug]/page.tsx` |
| Modify | `app/connect/people/page.tsx` |
| Modify | `app/connect/membership/page.tsx` |
| Modify | `app/connect/perks/page.tsx` |
| Modify | `app/connect/[username]/page.tsx` |
| Modify | `app/member/layout.tsx` (add noindex) |
| Modify | `app/login/page.tsx` (add noindex) |
| Modify | `app/register/page.tsx` (add noindex) |
| Modify | `app/forgot-password/page.tsx` (add noindex) |
| Modify | `app/reset-password/page.tsx` (add noindex) |
| Create | `app/sitemap.ts` |
| Create | `app/robots.ts` |
| Create | `public/og-fallback.png` (copy from apps/site/public) |
