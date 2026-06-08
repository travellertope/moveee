# Phase 1 — Interest Tagging & Feed Personalisation

## Goal

Add a mandatory interest-selection step to the registration flow so every user
has structured zero-party data from day one. Use those interests to personalise
the Pulse Feed default view and provide advertiser-grade audience segmentation.

---

## 1. Data Model

### 1.1 User Meta (WordPress)

| Meta key | Type | Example |
|----------|------|---------|
| `_culture_interests` | JSON array of slugs | `["music","food-drink","fashion-streetwear"]` |

Stored via `update_user_meta()`. Minimum 3, no upper cap.

### 1.2 Interest Taxonomy Alignment

The `culture_interest` taxonomy already exists on events, newsletters, and
directory entries. We unify user interests with the same taxonomy so the slugs
match across the system.

**Launch interest set** (mapped to existing + new `culture_interest` terms):

| User-visible label | Slug | Existing? |
|--------------------|------|-----------|
| Fashion & Streetwear | `fashion-streetwear` | New (merge with existing `fashion`) |
| Specialty Coffee & Fine Dining | `food-drink` | New (merge with existing `food`) |
| Live Music | `live-music` | New |
| Independent Film | `independent-film` | New (merge with existing `film`) |
| Art & Architecture | `art-architecture` | New (merge with existing `art`) |
| Literature & Poetry | `literature` | Exists |
| Design & Creative Tech | `design-tech` | New (merge with existing `design` + `tech`) |
| Sport & Wellness | `sport-wellness` | New (merge with existing `sport`) |
| Travel & Exploration | `travel` | Exists |
| Ideas & Culture Theory | `ideas` | Exists |
| Music Production & DJing | `music-production` | New |
| Photography & Visual Art | `photography` | New |

> **Migration note**: existing taxonomy terms (`fashion`, `food`, `art`, `film`,
> `design`, `tech`, `sport`) remain in the DB. We create the new compound slugs
> and set up aliases/mappings in the feed filtering logic. Existing tagged content
> continues to work — a post tagged `fashion` matches users interested in
> `fashion-streetwear`.

### 1.3 Session / Auth Token

Add `interests: string[]` to the `CultureUser` interface in `lib/auth.ts`.
Thread it through the NextAuth JWT callbacks so it's available client-side
without an extra fetch.

---

## 2. Registration Flow Changes

### 2.1 New Step: "Your Interests" (between About You and Membership)

**File: `app/register/complete/page.tsx`**

Current steps: `verify → about → membership → done`
New steps: `verify → about → interests → membership → done`

**UI spec:**
- Header: "What moves you?"
- Subtitle: "Pick at least 3 interests. This shapes your feed and unlocks
  relevant perks."
- Grid of interest cards (icon + label), toggle selection with visual feedback.
- Counter: "3 of 3 minimum selected" — proceed button disabled until ≥ 3.
- Interests submitted as part of the `POST /api/complete-profile` payload.

### 2.2 Backend: Complete Profile Endpoint

**File: `culture-community/includes/api/class-culture-rest-api.php`**
→ `handle_complete_profile()`

Add to accepted fields:
```php
$interests = isset( $body['interests'] ) ? array_map( 'sanitize_text_field', $body['interests'] ) : array();
if ( ! empty( $interests ) ) {
    update_user_meta( $user_id, '_culture_interests', wp_json_encode( $interests ) );
}
```

### 2.3 Validation

- Minimum 3 interests enforced server-side (return 400 if fewer).
- Slugs validated against a hardcoded allow-list (same list as the UI).
- If user skips (edge case: direct API call), interests default to empty and
  the feed shows an "onboarding nudge" banner until they set interests.

---

## 3. Feed Personalisation

### 3.1 PulseFeed Component

**File: `components/pulse/PulseFeed.tsx`**

**Current state:** Type filter tabs (All, News, Community, Editorial, etc.)

**New behaviour for logged-in users with interests:**
- Add a secondary "interest filter" row below the type filters.
- Auto-populated from the user's `interests` array.
- Default view: "For You" — shows items whose category/tag/interest matches
  any of the user's interests, sorted by recency.
- User can switch to "All" to see the unfiltered feed (existing behaviour).
- Interest tabs show as pill buttons: e.g., `Fashion` `Music` `Food & Drink`
  derived from the user's interest slugs.

**Filtering logic:**
- Community posts: match `community_tag` against interest slug mappings.
- Editorial/Magazine: match WordPress category slugs against mappings.
- Events: match `culture_interest` taxonomy terms.
- Directory entries: match `culture_interest` taxonomy terms.
- Pulse stories: match `pulse_category` against mappings.
- Quotes: no interest filtering (always shown).

### 3.2 Interest-to-Tag Mapping

**File: `lib/interest-mappings.ts`** (new)

```ts
export const INTEREST_TO_TAGS: Record<string, string[]> = {
  "fashion-streetwear": ["Fashion", "fashion"],
  "food-drink":         ["Food", "food"],
  "live-music":         ["Music", "music"],
  "independent-film":   ["Film", "film"],
  "art-architecture":   ["Art", "art"],
  "literature":         ["Literature", "literature"],
  "design-tech":        ["Design", "Tech", "design", "tech"],
  "sport-wellness":     ["Sport", "sport"],
  "travel":             ["Travel", "travel"],
  "ideas":              ["Ideas", "ideas"],
  "music-production":   ["Music", "music"],
  "photography":        ["Art", "art", "design"],
};
```

This maps user interest slugs to the various tag/category formats used across
content types. Feed filtering uses this to build the "For You" view.

---

## 4. Settings: Edit Interests

**File: `app/member/settings/page.tsx`**

Add an "Interests" section to account settings (below profile, above newsletter
preferences). Same grid UI as registration. Changes saved via
`POST /api/user/profile` → proxied to `POST /culture/v1/user/update`.

Backend: `handle_user_update()` in `class-culture-rest-api.php` already
exists — add `_culture_interests` to the accepted fields.

---

## 5. Onboarding Nudge (Existing Users)

Existing users won't have interests set. Two approaches:

1. **Banner in PulseFeed**: "Personalise your feed — pick your interests"
   linking to `/member/settings#interests`. Shows until interests are set.
2. **Interstitial on first login after launch**: Full-screen interest picker
   (same as registration step) shown once. Dismissible but persistent until
   completed.

Recommendation: Option 1 (banner) — lower friction, non-blocking.

---

## 6. Advertiser / Analytics Value

Once interests are stored per user:
- Admin analytics dashboard can show audience breakdown by interest.
- Ad targeting: interest segments available for ad placement decisions.
- Newsletter segmentation: interests can inform which newsletter a user is
  auto-subscribed to or recommended.

This is read-only reporting on the existing data — no code needed in Phase 1
beyond ensuring the interest data is queryable via the admin analytics API.

---

## 7. Files Changed (Summary)

| File | Change |
|------|--------|
| `app/register/complete/page.tsx` | Add "interests" step |
| `lib/auth.ts` | Add `interests` to CultureUser, thread through JWT |
| `lib/interest-mappings.ts` | **New** — interest-to-tag mapping |
| `components/pulse/PulseFeed.tsx` | Add interest filter row + "For You" logic |
| `app/member/settings/page.tsx` | Add interests editor section |
| `culture-community/includes/api/class-culture-rest-api.php` | Accept interests in complete-profile and user-update |
| `culture-community/includes/core/class-culture-post-types.php` | Register new `culture_interest` terms if needed |

---

## 8. Dependencies

- None. This phase is self-contained and can ship independently.
- Phase 2 (Credits/Reputation) benefits from interests being set, since
  interest-based engagement can influence credit earning rates, but is not
  blocked by it.

---

## 9. Acceptance Criteria

- [ ] New users cannot proceed past registration without selecting ≥ 3 interests
- [ ] Interests stored as `_culture_interests` user meta
- [ ] Interests appear in NextAuth session object
- [ ] PulseFeed shows "For You" default view filtered by user interests
- [ ] Interest filter pills visible and toggleable
- [ ] Existing users see a nudge banner to set interests
- [ ] Member settings page allows editing interests
- [ ] Interest data queryable in admin analytics
