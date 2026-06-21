# Phase 3 — Directory as Central Knowledge Graph

## Goal

Transform the Culture Directory from an editorial/AI-seeded reference wiki into
a **living knowledge graph** where every community post can attach to a
directory entry. Directory entries become nodes that accumulate community
reviews, commentary, debates, and creative showcases — making the directory
the central hub for indexed local cultural knowledge.

---

## 1. Data Model Changes

### 1.1 New Post Meta on `culture_post`

| Meta key | Type | Description |
|----------|------|-------------|
| `_template_type` | string | Post template used (see Phase 4). Default: `post` |
| `_linked_directory_id` | int | ID of linked `culture_directory` post (0 = none) |
| `_star_rating` | int | 1–5 star rating (Hidden Gem / Food Review templates) |
| `_location_name` | string | Display name of location (Hidden Gem) |
| `_location_lat` | float | Latitude (Hidden Gem / Itinerary) |
| `_location_lng` | float | Longitude (Hidden Gem / Itinerary) |

### 1.2 New Post Meta on `culture_directory`

| Meta key | Type | Description |
|----------|------|-------------|
| `_community_review_count` | int | Cached count of linked community posts |
| `_average_rating` | float | Cached average star rating from linked posts |
| `_is_partner` | bool | Whether this entry participates in Credits redemption |
| `_partner_status` | string | `active`, `paused`, `pending` |
| `_partner_perk_template` | string | Default perk description (Phase 6) |
| `_partner_cpa_rate` | float | Commission percentage (Phase 6) |

### 1.3 Partner Flag on Vendor Profiles

**File: `culture-community/includes/api/class-culture-rest-api.php`**
→ vendor-related endpoints

Add user meta for vendors who opt into the partner programme:

| Meta key | Type | Description |
|----------|------|-------------|
| `_vendor_is_partner` | bool | Vendor is also a partner |
| `_vendor_partner_perk` | string | Default perk for credit redemption |
| `_vendor_linked_directory_id` | int | Link to their directory entry (if any) |

A vendor can be a partner independently of having a directory entry. If both
exist, they're linked via `_vendor_linked_directory_id` so the partner flag
syncs.

---

## 2. Directory Entry Linking System

### 2.1 How Posts Link to Directory Entries

When creating a community post with certain templates (Hidden Gem, Cultural
Take, Food Review — defined in Phase 4), the composer presents a directory
search field:

1. **Search existing entries**: Autocomplete against `culture_directory` posts
   by title. Uses existing search endpoint or a new lightweight one.
2. **Create new entry inline**: If no match, user can create a stub entry
   with just a name, type, and optional location. The stub is created as a
   `culture_directory` post with `status: publish` and minimal content
   (the community post itself serves as the initial content).
3. **No link**: User can skip linking (the post stands alone).

The selected/created directory ID is stored as `_linked_directory_id` on the
community post.

### 2.2 Directory Search API

**New endpoint: `GET /culture/v1/directory/search`**

```
GET /culture/v1/directory/search?q=jollof&type=food
```

Returns: `[{ id: 123, title: "Jollof Rice", type: "food", thumbnail: "..." }]`

Lightweight, title-only search with optional type filter. Used by the post
composer autocomplete.

### 2.3 Inline Directory Stub Creation

**New endpoint: `POST /culture/v1/directory/quick-create`**

```json
{
  "title": "Nok by Alara",
  "entry_type": "place",
  "location_name": "Lagos, Nigeria",
  "location_lat": 6.4281,
  "location_lng": 3.4219
}
```

Creates a minimal `culture_directory` post. Returns the new post ID so the
community post can link to it immediately.

Authentication: Must be logged in. Created entries are attributed to the user.
Points: +15 reputation, +2 credits (from Phase 2 earning rules).

---

## 3. Directory Entry Page: Community Section

### 3.1 Aggregated Reviews / Posts

**File: `app/directory/[slug]/page.tsx`**

Below the existing wiki-style content, add a "Community" section:

```
┌──────────────────────────────────────────┐
│  [Wiki content — existing]               │
├──────────────────────────────────────────┤
│  Community Reviews & Takes               │
│  ★★★★☆ 4.2 average (17 reviews)         │
│                                          │
│  [Filter: All | Hidden Gems | Takes |    │
│   Food Reviews | Showcases]              │
│                                          │
│  ┌─ Review Card ──────────────────────┐  │
│  │ @username · ★★★★★ · 3 days ago    │  │
│  │ "Best jollof I've had outside      │  │
│  │  Lagos. The suya is incredible."   │  │
│  │ [image] [reactions: 12🔥 8👏]      │  │
│  └────────────────────────────────────┘  │
│  ┌─ Take Card ────────────────────────┐  │
│  │ @username · 1 week ago             │  │
│  │ "This place represents exactly     │  │
│  │  what the Shoreditch food scene    │  │
│  │  needs more of..."                 │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

### 3.2 Data Fetching

**New endpoint: `GET /culture/v1/directory/{id}/posts`**

```json
{
  "posts": [
    {
      "id": 456,
      "template_type": "hidden-gem",
      "content": "Best jollof...",
      "star_rating": 5,
      "author": { "name": "username", "avatar": "...", "tier": "patron" },
      "reactions": { "love": 3, "fire": 12, "clap": 8 },
      "created_at": "2026-06-01T12:00:00Z"
    }
  ],
  "summary": {
    "total_posts": 17,
    "average_rating": 4.2,
    "by_template": {
      "hidden-gem": 8,
      "cultural-take": 6,
      "food-review": 3
    }
  }
}
```

### 3.3 Cached Aggregates

When a post is created/updated/deleted with a `_linked_directory_id`:
- Recompute `_community_review_count` and `_average_rating` on the directory
  entry.
- Use a `save_post` hook on `culture_post` to trigger the recomputation.

---

## 4. Directory Types Expansion

The existing `culture_dir_type` taxonomy supports:
`person, place, movement, genre, concept, artwork, food, fashion, tv-series`

For the knowledge graph to cover the PRD's vision, consider adding:

| New type | Use case |
|----------|----------|
| `book` | Book reviews via Cultural Take posts |
| `album` | Music album reviews |
| `restaurant` | Distinct from `place` — specifically food venues |
| `event-venue` | Concert halls, galleries, clubs |
| `recipe` | Community food knowledge |

These are registered as new terms in `culture_dir_type`. The existing directory
seeder (`lib/gemini.ts`) and UI (`DirectoryGrid.tsx`) already handle arbitrary
types via the taxonomy — they'll work automatically.

---

## 5. Partner Designation

### 5.1 Admin Interface

**File: `culture-community/includes/admin/` (directory post edit screen)**

Add a "Partner Programme" meta box on the `culture_directory` edit screen:

- **Is Partner**: checkbox
- **Partner Status**: active / paused / pending
- **Default Perk**: text field (e.g., "£5 off a £20 spend")
- **CPA Rate (%)**: number field (10-20%)

This is admin-only for now. Phase 6 adds self-service partner onboarding.

### 5.2 Vendor-Partner Link

On the vendor profile page (`app/vendor/` dashboard), add an opt-in:
"Join the Partner Programme — let Moveee members redeem credits at
your shop."

This sets `_vendor_is_partner = true` and optionally links to a directory
entry via `_vendor_linked_directory_id`.

### 5.3 Partner Badge in Directory

Directory entries with `_is_partner: true` get a "Partner" badge in the
grid and on their detail page. The badge signals to users that they can
spend credits here (once Phase 6 ships).

---

## 6. Retiring Standalone Submit Pages

### 6.1 Current State

- `/events/submit` — standalone event submission form
- `/directory/submit` — standalone directory submission form
- Both are linked from the community feed area

### 6.2 Migration Plan

These pages are **not deleted yet** in Phase 3. Instead:

1. Directory submission becomes possible inline via the post composer (when
   creating a Hidden Gem or Cultural Take and no matching directory entry
   exists — quick-create flow).
2. Event submission will merge into the post composer in Phase 4.
3. Once Phase 4 ships, redirect `/events/submit` and `/directory/submit` to
   the community composer with the appropriate template pre-selected.
4. Remove the "Submit" dropdown in the navigation that currently links to
   these standalone pages.

---

## 7. Files Changed (Summary)

| File | Change |
|------|--------|
| `culture-community/includes/core/class-culture-post-types.php` | Register new meta fields on `culture_post` and `culture_directory` |
| `culture-community/includes/api/class-culture-rest-api.php` | Add `directory/search`, `directory/quick-create`, `directory/{id}/posts` endpoints |
| `culture-community/includes/core/class-culture-directory.php` | Add aggregate recomputation hook on linked post changes |
| `app/directory/[slug]/page.tsx` | Add Community Reviews section |
| `lib/wp.ts` | Add `getDirectoryPosts()` fetcher |
| `components/DirectoryGrid.tsx` | Show partner badge on partner entries |
| `app/api/directory/search/route.ts` | **New** — proxy to WP directory search |
| `app/api/directory/quick-create/route.ts` | **New** — proxy to WP quick-create |

---

## 8. Dependencies

- **Phase 2** (Credits/Reputation) should ship first so that creating
  directory entries and linked posts earn the correct credits/reputation.
- **Phase 4** (Post Templates) builds on the `_template_type` and
  `_linked_directory_id` meta introduced here.
- **Phase 6** (Partner Perks) builds on the `_is_partner` flag and partner
  fields introduced here.

---

## 9. Acceptance Criteria

- [ ] Community posts can store `_template_type` and `_linked_directory_id`
- [ ] Directory search autocomplete works in post composer
- [ ] Inline directory stub creation works (quick-create)
- [ ] Directory entry pages show "Community Reviews & Takes" section
- [ ] Average star rating computed and displayed on directory entries
- [ ] Partner flag manageable in WP Admin on directory entries
- [ ] Vendor profiles can opt into partner programme
- [ ] Partner badge visible on directory grid and detail pages
- [ ] New directory types (`book`, `album`, `restaurant`, etc.) registered
- [ ] Aggregate counts recompute when linked posts change
