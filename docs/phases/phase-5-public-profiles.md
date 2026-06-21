# Phase 5 — Public Profiles & Creative Portfolio

## Goal

Give every Moveee member a public profile page at
`/connect/[username]` with two tabs: a historical feed of their community
contributions and a curated creative portfolio. This transforms the platform
into a professional tool — users share their Moveee profile as a living
creative resume on LinkedIn, Twitter, etc.

---

## 1. Public Profile Page

### 1.1 Route

**New: `app/connect/[username]/page.tsx`**

Public, no auth required. SEO-optimised with OpenGraph and Twitter meta
tags for social sharing.

URL structure: `themoveee.com/connect/[username]`

### 1.2 Profile Header

```
┌──────────────────────────────────────────────────────┐
│  [Avatar]                                             │
│  Display Name                                         │
│  @username · London, UK · Fashion & Music             │
│  [Taste Maker badge] [Connect Pro badge]              │
│                                                       │
│  Bio text (from user profile)                         │
│                                                       │
│  Reputation: 1,250 · Posts: 87 · Joined: Jan 2026    │
│                                                       │
│  [Share Profile] [Follow — future]                    │
│                                                       │
│  ┌──────────┐ ┌──────────┐                           │
│  │ Community │ │Portfolio │                            │
│  │  (active) │ │         │                            │
│  └──────────┘ └──────────┘                           │
└──────────────────────────────────────────────────────┘
```

### 1.3 Data Source

**Endpoint: `GET /culture/v1/member/{username}`** (new public variant)

Returns:
```json
{
  "id": 123,
  "username": "adetola",
  "display_name": "Adetola Ogundimu",
  "avatar_url": "https://...",
  "bio": "Fashion designer & culture writer based in London.",
  "city": "London",
  "country": "United Kingdom",
  "tier": "patron",
  "reputation": 1250,
  "reputation_tier": "taste-maker",
  "interests": ["fashion-streetwear", "live-music", "art-architecture"],
  "badges": ["culture-vulture", "wordsmith", "century-club"],
  "post_count": 87,
  "joined": "2026-01-15",
  "portfolio_items": [ ... ],
  "pinned_posts": [ ... ]
}
```

Privacy: Only public data exposed. No email, phone, DOB, or credit balance.
Points/reputation visible. Tier visible.

---

## 2. Tab A — Community Feed

### 2.1 Content

Chronological feed of all the user's public community posts, displayed using
the same `FeedCard` component variants from Phase 4.

### 2.2 Filtering

- Template type filter: All, Hidden Gems, Takes, Showcases, Polls, Events
- Shows total counts per type

### 2.3 Data Fetching

Uses existing `GET /culture/v1/community/posts` endpoint with
`author_id` filter parameter (already supported). Frontend proxy:

**New: `app/api/connect/[username]/posts/route.ts`**

Resolves username → user ID, then fetches posts.

---

## 3. Tab B — Creative Portfolio

### 3.1 Concept

A curated gallery of the user's best work. Unlike Tab A (automatic, all
posts), Tab B is manually curated — users choose which items to pin here.

### 3.2 Portfolio Items

Two sources:

1. **Pinned community posts**: Any `creative-showcase`, `hidden-gem`, or
   `cultural-take` post can be "pinned" to the portfolio. Stored as user
   meta `_portfolio_pinned_posts` (JSON array of post IDs).

2. **Standalone portfolio entries**: For work that doesn't originate as a
   community post — external links, longer-form writing, lookbooks.

### 3.3 Standalone Portfolio Entry Schema

| Meta key | Type | Description |
|----------|------|-------------|
| `_portfolio_items` | JSON array | Standalone portfolio entries |

Each item:
```json
{
  "id": "uuid-v4",
  "title": "Spring/Summer 2026 Lookbook",
  "type": "lookbook",
  "description": "Markdown-formatted description text",
  "media": [
    { "type": "image", "url": "https://..." },
    { "type": "video", "url": "https://youtube.com/..." }
  ],
  "external_url": "https://linkedin.com/...",
  "tags": ["Fashion", "Design"],
  "created_at": "2026-03-15"
}
```

Portfolio entry types:
- `lookbook` — image gallery
- `writing` — long-form text (Markdown rendered)
- `video` — video reel or embed
- `audio` — audio link (SoundCloud, Spotify embed)
- `design` — design work gallery
- `link` — external project link with preview

### 3.4 Portfolio Rendering

```
┌──────────────────────────────────────────────┐
│  [Grid/Masonry layout]                        │
│                                               │
│  ┌────────┐ ┌────────┐ ┌────────┐           │
│  │        │ │        │ │        │            │
│  │ Image  │ │ Video  │ │ Image  │            │
│  │        │ │ thumb  │ │        │            │
│  ├────────┤ ├────────┤ ├────────┤           │
│  │ Title  │ │ Title  │ │ Title  │            │
│  │ Type   │ │ Type   │ │ Type   │            │
│  └────────┘ └────────┘ └────────┘           │
│                                               │
│  Clicking opens a detail modal / lightbox     │
└──────────────────────────────────────────────┘
```

---

## 4. Portfolio Management (Member Settings)

### 4.1 New Settings Section

**File: `app/member/settings/page.tsx`** (or new sub-page
`app/member/portfolio/page.tsx`)

**Pin/unpin posts:**
- Shows a list of eligible community posts (creative-showcase, hidden-gem,
  cultural-take templates).
- Toggle pin status. Reorder via drag-and-drop.

**Add standalone entries:**
- Form: title, type selector, description (Markdown), media upload,
  external URL, tags.
- Edit/delete existing entries.
- Reorder via drag-and-drop.

### 4.2 API Endpoints

**`POST /culture/v1/user/portfolio`** — save portfolio configuration
```json
{
  "pinned_posts": [456, 789, 123],
  "items": [ { ... standalone entry ... } ]
}
```

**`GET /culture/v1/user/portfolio`** — get portfolio for current user (auth)
or by username (public)

---

## 5. Public URL & Social Sharing

### 5.1 Clean URL

`themoveee.com/connect/adetola` — resolves to the public profile.

### 5.2 OpenGraph Meta

```html
<meta property="og:title" content="Adetola Ogundimu | Moveee" />
<meta property="og:description" content="Fashion designer & culture writer. Taste Maker on Moveee." />
<meta property="og:image" content="[avatar or generated OG image]" />
<meta property="og:url" content="https://themoveee.com/connect/adetola" />
```

### 5.3 Share Button

Profile header includes a "Share Profile" button:
- Copy link to clipboard
- Native share sheet on mobile (Web Share API)

---

## 6. Integration with Member Directory

### 6.1 Current State

`/connect/people` shows a searchable grid of opted-in members with basic
info (discipline, location, bio). Each card currently has no link — it's
just a list.

### 6.2 New Behaviour

Each member card in the directory links to `/connect/[username]`. The
directory becomes a gateway to full public profiles.

**File: `components/connect/MemberDirectory.tsx`**

Add `<Link href={`/connect/${member.username}`}>` wrapper on each member
card.

---

## 7. Profile Customisation (Reputation-Gated)

From Phase 2, reputation tiers unlock customisation:

| Reputation tier | Unlocked customisation |
|----------------|------------------------|
| Member (0–99) | Default profile |
| Culture Contributor (100–499) | Custom bio, profile colour accent |
| Taste Maker (500–1499) | Portfolio tab, custom header image |
| Culture Authority (1500+) | Featured badge, priority in directory |

The Portfolio tab is accessible to all users but displayed as "Coming soon —
earn Taste Maker status to unlock" for users below 500 reputation. They can
still manage their portfolio in settings, but it won't render publicly until
they reach the threshold.

---

## 8. Files Changed (Summary)

| File | Change |
|------|--------|
| `app/connect/[username]/page.tsx` | **New** — public profile page |
| `app/connect/[username]/ProfileTabs.tsx` | **New** — client component for tab switching |
| `app/connect/[username]/CommunityTab.tsx` | **New** — user's post history |
| `app/connect/[username]/PortfolioTab.tsx` | **New** — curated portfolio grid |
| `app/api/connect/[username]/posts/route.ts` | **New** — user posts proxy |
| `app/api/connect/[username]/portfolio/route.ts` | **New** — portfolio data proxy |
| `app/member/portfolio/page.tsx` | **New** — portfolio management page |
| `components/connect/MemberDirectory.tsx` | Link cards to public profiles |
| `culture-community/includes/api/class-culture-rest-api.php` | Public member endpoint, portfolio CRUD |
| `lib/auth.ts` | No change — profile data fetched via API, not session |

---

## 9. Dependencies

- **Phase 4** (Post Templates) should ship first — Creative Showcase posts
  are the primary content type for the portfolio tab.
- **Phase 2** (Credits/Reputation) should ship first — reputation tiers
  gate portfolio visibility.
- **Phase 1** (Interests) — interests displayed on profile header.

---

## 10. Acceptance Criteria

- [ ] `/connect/[username]` renders a public profile for any member
- [ ] Profile header shows avatar, name, location, tier, reputation, badges
- [ ] Tab A: Community feed with all user's posts, filterable by template
- [ ] Tab B: Creative portfolio with pinned posts and standalone entries
- [ ] Portfolio management in member settings (pin/unpin, add/edit/delete)
- [ ] Member directory cards link to public profiles
- [ ] OpenGraph meta renders correctly for social sharing
- [ ] Share button copies profile URL
- [ ] Portfolio tab gated behind Taste Maker reputation tier
- [ ] Profile page is SEO-indexable (server-rendered)
