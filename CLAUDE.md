# Moveee — Agent Instructions

This file is read automatically by Claude Code at the start of every session.
It captures project conventions, architecture decisions, and step-by-step
processes for recurring tasks so they can be completed correctly without
re-discovering context.

## Instructions for Claude

**After completing any task, update this file if the work reveals anything
worth capturing** — a new process, a gotcha, a changed convention, a new
file that matters, a decision that would otherwise need re-explaining. The
bar is: "would a future agent need to rediscover this?" If yes, write it
down here before closing the session.

Specifically update this file when you:
- Add a new feature with its own recurring setup process (like newsletters)
- Change a naming convention or architectural decision
- Discover a non-obvious constraint or dependency in the codebase
- Add a new important file, component, or API route
- Fix a bug caused by a subtle gotcha that could recur

Keep entries concise and actionable — this is a working reference, not a
changelog. Update in place (edit existing sections) rather than appending
stale history.

---

## Project overview

Next.js 15 (App Router) frontend + WordPress headless CMS backend.
WordPress runs the `culture-community` plugin (custom CPTs, REST API, email
queue, analytics). The frontend fetches via GraphQL (WPGraphQL) with a REST
fallback. Members have two tiers: **Connect Citizen** (free, `citizen` in DB)
and **Connect Pro** (paid, `patron` in DB — the DB value is `patron` but all
user-visible copy says "Connect Pro" or "Pro").

Key paths:
- `app/` — Next.js pages and route handlers
- `components/` — shared React components
- `lib/wp.ts` — all GraphQL queries, REST mappers, and data-fetch helpers
- `culture-community/` — WordPress plugin (PHP)
  - `includes/core/` — CPT registration, queue, analytics, gamification
  - `includes/admin/` — all WP Admin screens
  - `includes/api/` — REST API handlers (`class-culture-rest-api.php`)
  - `templates/` — WP template overrides
  - `assets/` — plugin CSS and JS

---

## Naming conventions (important)

| Internal DB value | User-visible label |
|---|---|
| `patron` | Connect Pro / Pro |
| `citizen` | Connect Citizen / Citizen |
| `getmelit` | GetMeLit |
| `culture-drop` | Culture Drop |

Never change the internal DB/PHP values (`patron`, `citizen`, `getmelit`,
`culture-drop`). Only change user-visible copy.

---

## Newsletter system architecture

### Subscriber storage
Stored as a single WordPress option: `culture_newsletter_subscribers` — an
array of objects:
```php
[
  'email'   => 'user@example.com',
  'name'    => 'Display Name',
  'date'    => '2026-01-01 00:00:00',  // MySQL datetime
  'lists'   => ['culture-drop'],        // which newsletters they're on
  'segment' => 'uk',                    // regional segment (optional)
]
```
Legacy plain-string entries (pre-multi-list) are treated as GetMeLit-only
throughout the codebase. The `maybe_migrate()` method in
`class-culture-subscribers.php` upgrades them on load.

### Sending
Each `culture_newsletter` post has two pieces of post meta:
- `_culture_nl_list` — which newsletter (`getmelit` or `culture-drop`)
- `_culture_nl_segment` — regional target (`us`, `uk`, `ng`, `gh`, `ca`,
  `au`) or empty for all

The send queue (`class-culture-newsletter-queue.php`) filters subscribers
by these meta values at send time. Batches of 50, 60s intervals via WP-Cron.

### Email template
Plain white background, no header block. Content flows directly from the
newsletter body. Footer has unsubscribe link only. The newsletter name
(GetMeLit / Culture Drop) is derived from `_culture_nl_list` post meta and
used in the footer "You are receiving this because you subscribed to X" line.

### Archive / frontend
`lib/wp.ts` → `getNewslettersWithFallback()` fetches all issues.
`nlList` field on each issue comes from `_culture_nl_list` post meta
(registered with `show_in_rest: true` on the CPT).
The `/newsletter` archive page filters by `?list=` query param and shows
colour-coded badges: indigo = Culture Drop, green = GetMeLit.

### Analytics
`class-culture-nl-analytics.php` — open/click tracking via HMAC tokens.
`wp_culture_nl_opens` and `wp_culture_nl_clicks` DB tables.
List and segment labels defined as class constants `LIST_LABELS` and
`SEGMENT_LABELS`.

---

## Process: adding a new newsletter

Follow every step in order. Each step lists the exact file and what to change.

### Step 1 — Choose the newsletter ID
Pick a short kebab-case ID, e.g. `vendor-letter`.
This ID is used everywhere as the canonical identifier.

### Step 2 — Register the ID in PHP constants / configs

**`culture-community/includes/admin/class-culture-newsletter-send.php`**
- Add to `$lists_config` array: `'vendor-letter' => 'The Vendor Letter'`
- Add to `save_list_meta()` `$allowed_lists` array: `'vendor-letter'`

**`culture-community/includes/admin/class-culture-newsletter-send.php`**
(subscriber count map already handles arbitrary keys — no change needed there)

**`culture-community/includes/admin/class-culture-subscribers.php`**
- Add to `LIST_OPTIONS` constant: `'vendor-letter' => 'The Vendor Letter'`

**`culture-community/includes/core/class-culture-newsletter-queue.php`**
- Add to `$nl_labels` array inside `build_email()`:
  `'vendor-letter' => 'The Vendor Letter'`

**`culture-community/includes/core/class-culture-nl-analytics.php`**
- Add to `LIST_LABELS` constant:
  `'vendor-letter' => 'The Vendor Letter'`

**`culture-community/includes/api/class-culture-rest-api.php`**
- In `handle_newsletter_subscribe()`, add `'vendor-letter'` to the
  `$allowed_lists` validation array.
- In `handle_get_newsletter_preferences()` and
  `handle_update_newsletter_preferences()`, add `'vendor-letter'` to the
  `$allowed_lists` array.

### Step 3 — Register the default and meta

**`culture-community/includes/core/class-culture-post-types.php`**
- The `_culture_nl_list` meta is already registered with `show_in_rest: true`.
  No change needed — the new ID will work automatically.

### Step 4 — Frontend: newsletter preferences

**`app/member/settings/NewsletterPreferences.tsx`**
- Add to `NEWSLETTERS` array:
  ```ts
  {
    id: "vendor-letter",
    name: "The Vendor Letter",
    desc: "Monthly — for makers and creators in the Moveee ecosystem.",
  }
  ```
- Add `"vendor-letter": true` to both fallback `setSubscribed` calls.

### Step 5 — Frontend: newsletter page

**`app/newsletter/page.tsx`**
- Add to `NL_LABELS`:
  `"vendor-letter": "The Vendor Letter"`
- Add a subscribe card in the `nl-cards-section` (copy the structure of an
  existing card, use `nl-card--vendor-letter` class modifier).
- Optionally add a feature section (copy `.nl-culturedrop-feature` structure).
- The archive filter tabs automatically pick up the new ID from `nlList` on
  each post — the count variables and filtered list just need the new label
  in `NL_LABELS`.
- Add a new filter tab link:
  ```tsx
  <Link href="?list=vendor-letter#archive" className={...}>
    The Vendor Letter <span className="nl-archive-tab-count">{vlCount}</span>
  </Link>
  ```
  And compute `vlCount` the same way `cdCount` and `gmlCount` are computed.

### Step 6 — Frontend: subscribe components

**`components/GmlCTAForm.tsx`** and **`components/NewsletterSubscribeWidget.tsx`**
already accept a `list` prop — pass `list="vendor-letter"` wherever you embed
the subscribe form for this newsletter. No code change to these components.

### Step 7 — Frontend: data layer

**`lib/wp.ts`**
- No change needed. `nlList` is already read from `_culture_nl_list` meta
  in both `mapRestNewsletterToFrontendShape` (REST path) and
  `NEWSLETTER_FIELDS_FRAGMENT` (GraphQL path). New values work automatically.

### Step 8 — CSS badge

**`app/newsletter.css`**
- Add a badge variant at the end of the file:
  ```css
  .nl-list-badge--vendor-letter {
    background: #fef3c7;
    color: #92400e;
  }
  ```
  Use a distinct colour pair that doesn't clash with existing badges
  (indigo for Culture Drop, green for GetMeLit).

### Step 9 — Archive filter tab CSS (if needed)
The `.nl-archive-tab--active` style is generic — no change needed.

### Step 10 — Membership / perks pages
If the newsletter is available to all tiers (like GetMeLit and Culture Drop),
add it to the perks lists in:
- `app/connect/membership/page.tsx` — Citizen and Pro tier perks lists
- `app/register/page.tsx` — tier card perks array
- `app/member/page.tsx` — upgrade perks (if Pro-only)
- `culture-community/includes/admin/class-culture-settings.php` — tier
  comparison table
- `culture-community/includes/frontend/class-culture-registration.php` —
  registration tier cards
- `culture-community/includes/admin/class-culture-email-templates.php` —
  welcome email bullet points

### Step 11 — Test
1. In WP Admin → create a `culture_newsletter` post.
2. In the Send Newsletter sidebar, the new list should appear in the dropdown.
3. Subscribe a test email address via the frontend form with `list="vendor-letter"`.
4. In WP Admin → Subscribers, edit that subscriber — the new list should
   appear as a checkbox and be checked.
5. Send a test email — footer should say "You are receiving this because you
   subscribed to The Vendor Letter."
6. On the `/newsletter` archive page, the filter tab for The Vendor Letter
   should appear with the correct count.

---

## CSS custom properties (from globals)

```css
var(--ink)        /* #14110d — primary dark text / dark backgrounds */
var(--paper)      /* #f3ece0 — primary light background */
var(--paper-deep) /* slightly deeper paper, for card backgrounds */
var(--ochre)      /* #b38238 — accent gold/amber */
var(--rule)       /* border colour, subtle */
var(--mute)       /* muted text */
var(--ink-soft)   /* softer body text */
```

The `/newsletter` page and all newsletter-related pages must use paper
backgrounds only. No `var(--ink)` background on any section of the list page.
Dark backgrounds are only acceptable for: buttons, hover states, and
single-issue page components (`.gml-issue-hero`, `.digest-sidebar-card.dark`).

---

## Key conventions

- Internal tier value is `patron` — never rename it in PHP or the DB.
  All user-facing copy uses "Connect Pro" / "Pro".
- "Cultural Digest" / "The Cultural Digest" is the old name — do not use it.
  Use "GetMeLit" and "Culture Drop" specifically, or "Moveee newsletters"
  generically.
- Newsletter post meta `_culture_nl_list` defaults to `culture-drop` (the
  flagship). Always set it explicitly on new posts.
- The subscriber count in the Send Newsletter meta box updates live when the
  list or segment dropdown changes (JS reads `data-counts` on the box div).
- Segment codes: `us` `uk` `ng` `gh` `ca` `au` — empty string = all segments.

---

## Git branch

Active development branch: `claude/cool-heisenberg-0MOYA`
Always commit and push to this branch.

---

## VIP Club Upgrade — Phase Status

Phases 1-4 are implemented. Phase docs live in `docs/phases/`.

| Phase | Status | Key files |
|-------|--------|-----------|
| 1. Interest Tagging | Done | `lib/interest-mappings.ts`, `components/InterestEditor.tsx`, registration complete page |
| 2. Credits & Reputation | Done | `class-culture-gamification.php` (credit_ledger table, award_credits/reputation, check_post_threshold), `lib/auth.ts` |
| 3. Directory Knowledge Graph | Done | `class-culture-directory.php` (search, quick-create, directory posts, aggregates), `DirectoryGrid.tsx` (partner badge), `app/directory/[slug]/page.tsx` (community section) |
| 4. Post Templates & Composer | Done | `components/pulse/SubmitPost.tsx` (unified composer), `components/composer/` (StarRating, MultiRating, DirectorySearch, PollBuilder, ItineraryBuilder), `FeedCard.tsx` (template variants), poll-vote endpoint |
| 5. Public Profiles | Done | `app/connect/[username]/page.tsx`, `ProfileTabs`, `CommunityTab`, `PortfolioTab`, `app/member/portfolio/`, PHP: public member + community posts + portfolio endpoints |
| 6. Partner Perks | Done | `class-culture-perks.php` (redeem, QR verify, cashout, fee tiers), `culture_partner_perks` + `culture_redemptions` tables, 13 REST endpoints, `app/connect/perks/` (browse+redeem), `app/member/wallet/` (balance+cashout), `app/member/coupons/` (QR display) |
| 7. Passkeys | Done | `culture-community/includes/core/class-culture-webauthn.php`, `app/api/auth/passkey/`, `components/PasskeyPrompt.tsx`, `components/PasskeyBanner.tsx`, `app/member/settings/PasskeyManager.tsx` |

### Phase 7 — Passkey architecture notes

- **`class-culture-webauthn.php`** — self-contained WebAuthn handler (no external libs)
  - ES256 (P-256 ECDSA) + RS256 (RSA) via PHP OpenSSL
  - Custom minimal CBOR decoder — handles maps/arrays/byte strings/ints
  - Challenges stored in WP transients (`culture_wn_` prefix), 5-min TTL
  - Registration stores PEM (base64-encoded) + alg in `culture_passkeys` table
  - Login issues one-time `passkey_token` (2-min transient) for NextAuth exchange
  - Step-up issues `step_up_token` (5-min transient, single-use) for gating sensitive actions
  - Credit escrow: `_culture_credits_escrowed` user meta; released on first passkey registration
  - `MAX_ACCOUNTS_PER_AAGUID = 2` — soft limit per physical device model

- **NextAuth integration**: `lib/auth.ts` credentials provider accepts `{ passkeyToken }` in addition to username/password. Exchange calls `/wp-json/culture/v1/passkey/exchange-token`.

- **Step-up flow**: `PerksClient.tsx` calls `doStepUp()` before redeem; `WalletClient.tsx` calls it before cashout. Both are hard gates (no fallback).

- **`culture_passkeys` table**: credential_id, public_key (base64 PEM), alg, sign_count, device_name, aaguid, transports, created_at, last_used_at.

- **Frontend components**:
  - `components/PasskeyPrompt.tsx` — reusable register/step-up modal using `@simplewebauthn/browser`
  - `components/PasskeyBanner.tsx` — dashboard banner for users without passkeys
  - `app/member/settings/PasskeyManager.tsx` — list/add/delete passkeys in settings

- **DB version**: bump `CULTURE_VERSION` in plugin main file after activating (runs `dbDelta` for new table).

### Interest taxonomy (16 canonical slugs)

Stored in `lib/interest-mappings.ts`. PHP allowlists in `class-culture-rest-api.php`
(both `handle_complete_profile` and `handle_update_user_profile`). WP taxonomy
terms seeded by `Culture_Activator::seed_interests()`.

### Post template types

`post`, `hidden-gem`, `cultural-take`, `food-review`, `creative-showcase`, `poll`,
`itinerary` — stored as `_template_type` meta on `culture_post`. Quote and Event
templates create `culture_quote` and `culture_event` CPTs respectively.

Per-template credit/reputation amounts in `check_post_threshold()` in
`class-culture-gamification.php`.

---

## Registration flow (redesigned)

New flow: 3-field quick signup → email verification → 2 post-verification steps.

**Step 1 — `/register`:** Email, Username, Password only. On submit:
- Account created with `_culture_email_verified = 0`
- Verification token (24h expiry) stored as `_culture_email_verify_token` (hashed)
- Verification email sent via `Culture_Emails::send_verification_email()`
- Returns `{ requires_verification: true }` — frontend shows "Check your inbox"

**Step 2 & 3 — `/register/complete?uid=xxx&token=xxx&next=/article`:**
- Page load calls `POST /api/verify-email` → `POST /culture/v1/verify-email` to validate token
- Step 2: DOB, Country, City, Occupation
- Step 3: Membership tier (Citizen / Connect Pro)
- On submit calls `POST /api/complete-profile` → `POST /culture/v1/complete-profile`
  - Saves KYC fields, marks email verified, clears token, sends welcome email
  - Returns `checkout_url` for patron; otherwise redirects to `/login?registered=1&callbackUrl=<next>`

**`?next=` redirect:** Any "Register" CTA on an article should link to `/register?next=/article-slug`. The param is carried through the entire flow and used as `callbackUrl` on the final login redirect.

**Upgrade flow:** `?upgrade=patron` on either `/register` or `/register/complete` — skips verification, goes straight to membership step for logged-in members.

**Key files:**
- `app/register/page.tsx` — Step 1 + check-email screen
- `app/register/complete/page.tsx` — Steps 2 & 3
- `app/api/verify-email/route.ts` — proxy to WP
- `app/api/complete-profile/route.ts` — proxy to WP
- PHP handlers in `class-culture-rest-api.php`: `handle_verify_email`, `handle_complete_profile`
- `class-culture-emails.php`: `send_verification_email($user_id, $token, $next_url)`

---

## Community feed spam protection

All checks run server-side in `lib/spam-protection.ts` before posts reach WordPress.

**Checks applied to posts (`app/api/community/submit/route.ts`):**
1. URL/link blocking — Citizens cannot post links; Connect Pro members can
2. Rate limit — 5 posts per 10 minutes per user (HTTP 429)
3. Duplicate detection — same text rejected within 30 minutes (HTTP 409)
4. Keyword blocklist — default phrases + admin-configured custom phrases (HTTP 400)
5. New-member queue — accounts newer than N days get `status: "pending"` instead of `"publish"`

**Checks applied to comments (`app/api/community/comment/route.ts`):**
1. URL/link blocking (same as posts)
2. Rate limit — 10 comments per 10 minutes (HTTP 429)
3. Keyword blocklist

**Report button (`components/pulse/FeedCard.tsx`):**
- ⚑ icon in community card footer → expands to spam/harassment/inappropriate options
- `app/api/community/report/route.ts` records reporter ID in post meta
- After 3 unique reports: post auto-moved to `pending`, removed from public feed
- Meta fields: `community_reporter_ids`, `community_report_count`, `community_report_reason`
  (registered in `class-culture-community.php`)

**Admin configuration (WP Admin → Culture Community → Moderation tab):**
- Custom blocked phrases — one per line, added on top of hardcoded defaults
- New-member review period in days (0 = disabled)
- Settings cached in Next.js for 5 minutes via `GET /culture/v1/community-blocklist`

**User account age for moderation queue:**
- WP `user_registered` now included as `registered_at` (Unix timestamp) in `user_profile()`
- Threaded into NextAuth session as `registeredAt` via `lib/auth.ts`
