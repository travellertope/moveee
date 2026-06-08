# Phase 4 — Structured Post Templates & Unified Composer

## Goal

Replace the current simple post/quote composer and standalone submit pages
with a unified creation surface that supports 7 structured templates. Each
template enforces quality constraints (required fields, media, ratings) to
maintain a high-quality timeline suitable for premium ad placements. Events
merge into the composer, and the standalone `/events/submit` and
`/directory/submit` pages are retired.

---

## 1. Template Definitions

### 1.1 Post (Default)

The existing community post format, preserved as-is.

| Field | Required | Type |
|-------|----------|------|
| Text content | Yes | String (280 char cap) |
| Tag | No | One of TAGS array |
| Image | No | Single image upload |
| Source URL | No | URL with OG preview |
| Hashtags | No | Auto-detected from text |

**Directory link:** Optional (can link to any entry type).
**Template slug:** `post`

### 1.2 Quote

The existing quote submission, preserved.

| Field | Required | Type |
|-------|----------|------|
| Quote text | Yes | String |
| Author name | Yes | String |
| Source | No | String (book, speech, interview) |

**Creates:** `culture_quote` CPT (not `culture_post`).
**Template slug:** `quote`

### 1.3 Hidden Gem (Micro-Review)

For reviewing physical places — restaurants, cafes, galleries, shops, venues.

| Field | Required | Type |
|-------|----------|------|
| Review text | Yes | String (500 char cap) |
| Location | Yes | Google Places autocomplete → name, lat, lng |
| Star rating | Yes | 1–5 stars |
| Photo(s) | Yes (min 1) | Image upload (max 4) |
| Directory link | Auto | Search existing or create new directory entry |
| Tag | No | One of TAGS array |

**Directory integration:**
- On location selection, search `culture_directory` for matching entries.
- If found, auto-populate `_linked_directory_id`.
- If not found, offer "Add [Name] to the Culture Directory" — triggers
  inline stub creation (Phase 3 quick-create).
- Entry type auto-suggested: `place`, `restaurant`, `event-venue`.

**Template slug:** `hidden-gem`

### 1.4 Cultural Take

For opinions, commentary, and reviews of non-physical things — books, albums,
artists, films, movements, concepts, food items.

| Field | Required | Type |
|-------|----------|------|
| Take text | Yes | String (1000 char cap — longer form) |
| Directory link | Yes | Search or create a directory entry |
| Image | No | Optional supporting image |
| Tag | No | One of TAGS array |

**Directory integration:**
- Composer opens with directory search as the first field ("What are you
  writing about?").
- Entry type auto-suggested based on user's choice.
- If creating new: `person`, `book`, `album`, `artwork`, `film`, `tv-series`,
  `movement`, `genre`, `concept`, `food`.

**Template slug:** `cultural-take`

### 1.5 Food Review

Specialised variant for specific dishes or food experiences. Separate from
Hidden Gem because it's about a specific item, not a venue overall.

| Field | Required | Type |
|-------|----------|------|
| Dish / item name | Yes | String |
| Review text | Yes | String (500 char cap) |
| Photo | Yes (min 1) | Image upload (max 4) |
| Restaurant / venue | Yes | Directory search (place / restaurant type) |
| Ratings | Yes | Taste (1–5), Value (1–5), Vibe (1–5) |
| Tag | Auto | Set to "Food" |

**Directory integration:**
- Links to the restaurant's directory entry.
- If the specific dish doesn't have an entry, optionally creates a `food`
  type directory entry (e.g., "Jollof Rice at Nok by Alara").

**Template slug:** `food-review`

### 1.6 Creative Showcase

For sharing creative work — photography, design, fashion, art, video.

| Field | Required | Type |
|-------|----------|------|
| Caption | No | String (500 char cap) |
| Images | Yes (min 1) | Multi-image upload (max 10), renders as carousel |
| Video URL | No | YouTube, Vimeo, or direct MP4 embed |
| Tag | No | One of TAGS array |
| Directory link | No | Optional (e.g., link to a person or artwork entry) |

**Feed rendering:** FeedCard shows a swipeable image carousel or embedded
video player. Distinct visual treatment from text posts.

**Portfolio integration (Phase 5):** Creative Showcase posts can be "pinned"
to the user's portfolio tab on their public profile.

**Template slug:** `creative-showcase`

### 1.7 Poll / Debate

For structured community engagement — questions, hot takes, cultural debates.

| Field | Required | Type |
|-------|----------|------|
| Question / prompt | Yes | String (280 char cap) |
| Options | Yes | 2–4 text options |
| Duration | Yes | 1 day, 3 days, 7 days |
| Tag | No | One of TAGS array |
| Directory link | No | Optional (e.g., debate about a person or movement) |

**Post meta for poll data:**

| Meta key | Type |
|----------|------|
| `_poll_options` | JSON array of `{ text: string, votes: int }` |
| `_poll_expires_at` | datetime |
| `_poll_voters` | JSON array of user IDs (prevents double-voting) |

**Feed rendering:** Inline poll UI with progress bars, vote count, expiry
countdown. After voting or expiry, shows results.

**Template slug:** `poll`

### 1.8 Event

Merges the existing `/events/submit` flow into the composer. Creates a
`culture_event` CPT.

| Field | Required | Type |
|-------|----------|------|
| Event name | Yes | String |
| Description | Yes | String (1000 char cap) |
| Date & time | Yes | Date picker + time |
| End date & time | No | Date picker + time |
| Location | Yes | Google Places autocomplete or "Online" toggle |
| Cover image | Yes | Image upload |
| Admission | No | Free / Paid + price |
| Capacity | No | Number |
| Ticket URL | No | External ticketing link |
| Tag | No | One of TAGS array |

**Creates:** `culture_event` CPT (not `culture_post`).
**Directory link:** Auto-links to venue's directory entry if one exists.

**Template slug:** `event`

### 1.9 Weekend Itinerary

Multi-stop layout for shareable urban routes.

| Field | Required | Type |
|-------|----------|------|
| Itinerary title | Yes | String |
| Stops | Yes (min 2, max 5) | Array of: name, location (Places), note, image |
| Tag | No | One of TAGS array |

**Post meta:**

| Meta key | Type |
|----------|------|
| `_itinerary_stops` | JSON array of `{ name, lat, lng, note, image_url }` |

**Directory integration:** Each stop can link to a directory entry. When
rendering, check if each location has a directory match and show the link.

**Feed rendering:** Numbered stop cards with optional map view.

**Template slug:** `itinerary`

---

## 2. Composer UI Redesign

### 2.1 Template Selector

**File: `components/pulse/SubmitPost.tsx`** (major refactor)

Replace the current two-tab (Post / Quote) layout with a template selector:

```
┌─────────────────────────────────────────────────┐
│  Create                                          │
│                                                  │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      │
│  │ 📝  │ │ 💎  │ │ 🍽  │ │ 🎨  │ │ 📊  │ ... │
│  │Post │ │ Gem │ │Food │ │Show │ │Poll │      │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘      │
│                                                  │
│  [Template-specific form fields below]           │
│                                                  │
└─────────────────────────────────────────────────┘
```

- Icons as horizontal scrollable pills at the top of the composer.
- Default selection: "Post" (existing behaviour).
- On template switch, form fields below update to the selected template.
- Quote and Event move from standalone pages into this unified surface.

### 2.2 Shared Components

Several templates share common sub-components:

- **LocationPicker**: Google Places autocomplete → `{ name, lat, lng }`.
  Used by Hidden Gem, Food Review, Event, Itinerary.
- **StarRating**: Interactive 1–5 star selector. Used by Hidden Gem.
- **MultiRating**: Multiple named 1–5 scales. Used by Food Review.
- **DirectorySearch**: Autocomplete against `culture_directory` with
  inline create option. Used by Hidden Gem, Cultural Take, Food Review.
- **MultiImageUpload**: Drag-and-drop multi-image with preview + reorder.
  Used by Hidden Gem, Food Review, Creative Showcase, Itinerary.
- **PollBuilder**: Add/remove options (2–4), duration selector.
  Used by Poll.
- **ItineraryBuilder**: Add/remove/reorder stops with location + note.
  Used by Itinerary.

These are new files in `components/composer/`.

### 2.3 Submission Flow

All templates submit via the existing `POST /api/community/submit` route,
which proxies to `POST /culture/v1/community/submit`.

The submit endpoint receives a `template_type` field and saves it as post
meta. Template-specific fields are saved as additional post meta.

**Exception:** Quote and Event templates create different CPTs
(`culture_quote` and `culture_event`). The submit endpoint routes based on
`template_type`:
- `quote` → `culture_quote` CPT creation
- `event` → `culture_event` CPT creation
- Everything else → `culture_post` CPT

---

## 3. Feed Rendering by Template

### 3.1 FeedCard Variants

**File: `components/pulse/FeedCard.tsx`**

The FeedCard component reads `template_type` from the post data and renders
a variant layout:

| Template | Feed card rendering |
|----------|---------------------|
| `post` | Existing text + single image layout |
| `quote` | Styled quote block with author attribution |
| `hidden-gem` | Location badge + star rating + image + mini-review |
| `cultural-take` | Directory entry link header + longer text |
| `food-review` | Dish photo + triple rating bars + venue link |
| `creative-showcase` | Full-width image carousel or video player |
| `poll` | Inline poll with vote buttons / results |
| `event` | Date badge + location + cover image + RSVP button |
| `itinerary` | Numbered stop list with location pins |

### 3.2 Detail Modals

**File: `components/pulse/CommunityDetailModal.tsx`**

Expanded view of each template with full content, all images, map embeds
(for location-based templates), and the full comment thread.

---

## 4. Backend Changes

### 4.1 Submit Endpoint

**File: `culture-community/includes/api/class-culture-rest-api.php`**
→ `handle_community_submit()`

Add support for new fields:

```php
$template = sanitize_text_field( $body['template_type'] ?? 'post' );
$allowed_templates = ['post', 'hidden-gem', 'cultural-take', 'food-review',
                      'creative-showcase', 'poll', 'itinerary'];

// Route to different CPT creation for quote and event
if ( $template === 'quote' ) {
    return $this->handle_quote_submit( $body, $user_id );
}
if ( $template === 'event' ) {
    return $this->handle_event_submit_from_composer( $body, $user_id );
}

// Standard culture_post creation with template meta
update_post_meta( $post_id, '_template_type', $template );

// Template-specific meta
if ( $template === 'hidden-gem' || $template === 'food-review' ) {
    update_post_meta( $post_id, '_star_rating', intval( $body['star_rating'] ) );
    update_post_meta( $post_id, '_location_name', sanitize_text_field( $body['location_name'] ) );
    update_post_meta( $post_id, '_location_lat', floatval( $body['location_lat'] ) );
    update_post_meta( $post_id, '_location_lng', floatval( $body['location_lng'] ) );
}
if ( ! empty( $body['linked_directory_id'] ) ) {
    update_post_meta( $post_id, '_linked_directory_id', intval( $body['linked_directory_id'] ) );
}
if ( $template === 'poll' ) {
    update_post_meta( $post_id, '_poll_options', wp_json_encode( $body['poll_options'] ) );
    update_post_meta( $post_id, '_poll_expires_at', sanitize_text_field( $body['poll_expires_at'] ) );
    update_post_meta( $post_id, '_poll_voters', wp_json_encode( array() ) );
}
if ( $template === 'itinerary' ) {
    update_post_meta( $post_id, '_itinerary_stops', wp_json_encode( $body['itinerary_stops'] ) );
}
if ( $template === 'creative-showcase' ) {
    update_post_meta( $post_id, '_gallery_images', wp_json_encode( $body['gallery_images'] ) );
    if ( ! empty( $body['video_url'] ) ) {
        update_post_meta( $post_id, '_video_url', esc_url( $body['video_url'] ) );
    }
}
```

### 4.2 Feed / Posts Endpoints

**Files: `class-culture-rest-api.php`, `class-culture-mobile-api.php`**

Include template meta in the post response:

```php
'template_type'      => get_post_meta( $post_id, '_template_type', true ) ?: 'post',
'linked_directory_id'=> (int) get_post_meta( $post_id, '_linked_directory_id', true ),
'star_rating'        => (int) get_post_meta( $post_id, '_star_rating', true ),
'location_name'      => get_post_meta( $post_id, '_location_name', true ),
'location_lat'       => (float) get_post_meta( $post_id, '_location_lat', true ),
'location_lng'       => (float) get_post_meta( $post_id, '_location_lng', true ),
'poll_options'       => json_decode( get_post_meta( $post_id, '_poll_options', true ) ?: '[]' ),
'poll_expires_at'    => get_post_meta( $post_id, '_poll_expires_at', true ),
'itinerary_stops'    => json_decode( get_post_meta( $post_id, '_itinerary_stops', true ) ?: '[]' ),
'gallery_images'     => json_decode( get_post_meta( $post_id, '_gallery_images', true ) ?: '[]' ),
'video_url'          => get_post_meta( $post_id, '_video_url', true ),
```

### 4.3 Poll Vote Endpoint

**New: `POST /culture/v1/community/poll-vote`**

```json
{
  "post_id": 456,
  "option_index": 2
}
```

- Validates poll hasn't expired.
- Checks `_poll_voters` to prevent double-voting.
- Increments vote count on selected option.
- Adds user ID to voters array.
- Awards reputation (+2) for participation.

### 4.4 Multi-Image Upload

Extend the existing `POST /culture/v1/community/upload-image` endpoint to
accept multiple files (or call it multiple times from the frontend). Return
an array of image URLs.

---

## 5. Retiring Standalone Submit Pages

### 5.1 Redirects

**Phase 4 launch:**
- `/events/submit` → redirect to `/connect` with `?compose=event` query param
  (opens composer with Event template pre-selected).
- `/directory/submit` → redirect to `/connect` with `?compose=hidden-gem`
  (opens composer with Hidden Gem template pre-selected).

### 5.2 Navigation Cleanup

Remove the "Submit" dropdown from the header navigation that currently links
to standalone submit pages. The composer is now the single entry point for
all content creation, accessible from the Pulse Feed section.

---

## 6. Character Limits & Quality Enforcement

| Template | Min chars | Max chars | Required media |
|----------|-----------|-----------|----------------|
| Post | 1 | 280 | None |
| Quote | 10 | 500 | None |
| Hidden Gem | 50 | 500 | 1+ images |
| Cultural Take | 100 | 1000 | None |
| Food Review | 50 | 500 | 1+ images |
| Creative Showcase | 0 | 500 | 1+ images or video |
| Poll | 10 | 280 | None |
| Event | 50 | 1000 | 1 cover image |
| Itinerary | 0 | 300 (per stop) | None (optional per stop) |

These constraints are enforced both client-side (disable submit button) and
server-side (return 400 with specific error message).

---

## 7. Credit Earning by Template

From Phase 2's validation threshold system, different templates may warrant
different credit amounts since they require more effort:

| Template | Credits on validation | Reputation on validation |
|----------|----------------------|--------------------------|
| Post | +10 | +5 |
| Hidden Gem | +15 | +10 |
| Cultural Take | +12 | +8 |
| Food Review | +15 | +10 |
| Creative Showcase | +12 | +8 |
| Poll | +8 | +5 |
| Event | +20 | +15 |
| Itinerary | +20 | +15 |

Higher-effort templates earn more, incentivising structured contributions
over plain text posts.

---

## 8. Files Changed (Summary)

| File | Change |
|------|--------|
| `components/pulse/SubmitPost.tsx` | Major refactor — template selector + per-template forms |
| `components/composer/LocationPicker.tsx` | **New** — Google Places autocomplete |
| `components/composer/StarRating.tsx` | **New** — interactive star rating |
| `components/composer/MultiRating.tsx` | **New** — multi-criteria rating |
| `components/composer/DirectorySearch.tsx` | **New** — directory autocomplete + inline create |
| `components/composer/MultiImageUpload.tsx` | **New** — drag-and-drop multi-image |
| `components/composer/PollBuilder.tsx` | **New** — poll options builder |
| `components/composer/ItineraryBuilder.tsx` | **New** — multi-stop builder |
| `components/pulse/FeedCard.tsx` | Template-aware rendering variants |
| `components/pulse/CommunityDetailModal.tsx` | Template-aware expanded view |
| `culture-community/includes/api/class-culture-rest-api.php` | Template routing, new meta fields, poll-vote endpoint |
| `app/api/community/submit/route.ts` | Pass template_type and template-specific fields |
| `app/api/community/poll-vote/route.ts` | **New** — proxy to WP poll-vote |
| `app/events/submit/page.tsx` | Redirect to composer |
| `app/directory/submit/page.tsx` | Redirect to composer |
| `lib/unified-feed.ts` | Parse template meta from community posts |

---

## 9. Dependencies

- **Phase 3** (Directory Knowledge Graph) must ship first — the directory
  linking, search, and quick-create infrastructure is used by Hidden Gem,
  Cultural Take, and Food Review templates.
- **Phase 2** (Credits/Reputation) should ship first for per-template credit
  amounts, but the composer works without it (just no credit earning).

---

## 10. Acceptance Criteria

- [ ] Template selector shows all 7 community templates + Quote + Event
- [ ] Each template enforces its required fields and character limits
- [ ] Hidden Gem: location picker, star rating, and image required
- [ ] Cultural Take: directory search required before writing
- [ ] Food Review: multi-criteria rating + venue link working
- [ ] Creative Showcase: multi-image carousel renders in feed
- [ ] Poll: vote buttons work, results display, expiry enforced
- [ ] Event: creates `culture_event` CPT, appears in events listing
- [ ] Itinerary: multi-stop builder with location pins
- [ ] All templates save `_template_type` and `_linked_directory_id` meta
- [ ] FeedCard renders correct variant per template type
- [ ] `/events/submit` and `/directory/submit` redirect to composer
- [ ] Submit dropdown removed from navigation
- [ ] Existing posts (no template_type) continue to render as default "post"
