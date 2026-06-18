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

## Brand naming convention (canonical — do not deviate)

| Surface | Brand name | Domain |
|---|---|---|
| `apps/site` | **Moveee Magazine** | `themoveee.com` |
| `apps/connect` | **Moveee** | `connect.themoveee.com` |
| `apps/mobile` | **Moveee** | iOS / Android |

- `apps/site` is always called **Moveee Magazine** in user-facing copy, metadata, and JSON-LD.
- `apps/connect` and `apps/mobile` are both just **Moveee** — no sub-brand qualifier.
- Never use "Moveee Connect" as a product name.
- Site tagline (Moveee Magazine): **"Best in Culture"**
- App tagline (Moveee): **"Connect to Culture"**
- Brand description framing: universal/global — do not describe the brand as specifically
  African or Nigerian in metadata or SEO copy. The content and community speak for themselves.
  Use language like: *"an independent magazine and community for people who live for culture."*

---

## Project overview

Next.js 15 (App Router) frontend + WordPress headless CMS backend.
WordPress runs the `culture-community` plugin (custom CPTs, REST API, email
queue, analytics). The frontend fetches via GraphQL (WPGraphQL) with a REST
fallback. Members have two tiers: **Connect Citizen** (free, `citizen` in DB)
and **Connect Pro** (paid, `patron` in DB — the DB value is `patron` but all
user-visible copy says "Connect Pro" or "Pro").

This is a **Turborepo monorepo** (as of June 2026).

Key paths:
- `apps/site/` — Site A: Moveee Magazine at themoveee.com (Editorial + Shop, no auth)
  - `app/` — pages and route handlers
  - `components/` — Site A-only components (Header, CartDrawer, HomepageContent…)
  - `lib/fetchHomepageData.ts` — Site A-only homepage fetch
  - `proxy.ts` — edge routing (Next.js 16 replacement for middleware.ts)
- `apps/connect/` — Site B: Moveee at connect.themoveee.com (Community + Auth)
  - `app/` — auth, member, community, events, games, directory pages
  - No local lib/ or components/ — all resolved from packages/shared
- `apps/mobile/` — React Native app (Expo) for iOS + Android
  - `src/` — screens, components, api client, auth store, navigation
  - Self-contained; does NOT import from packages/shared (RN vs DOM)
- `packages/shared/` — Single source of truth for shared code
  - `lib/` — wp.ts, auth.ts, editions.ts, access.ts + 15 more
  - `components/` — pulse/*, games/*, composer/*, connect/*, Footer, SessionProvider…
  - `context/` — CurrencyContext, LanguageContext
  - `types/` — next-auth.d.ts
- `culture-community/` — WordPress plugin (PHP)
  - `includes/core/` — CPT registration, queue, analytics, gamification
  - `includes/admin/` — all WP Admin screens
  - `includes/api/` — REST API handlers (`class-culture-rest-api.php`)
  - `templates/` — WP template overrides
  - `assets/` — plugin CSS and JS

**Vercel setup:**
- Site A project: Root Directory = `apps/site` → deploys to themoveee.com
- Site B project: Root Directory = `apps/connect` → deploys to connect.themoveee.com
- Both share the same GitHub repo (travellertope/moveee)

**Shared code resolution:** Both Next.js apps resolve `@/*` via tsconfig paths array:
`["../../packages/shared/*", "./*"]` — packages/shared is checked first, then the
app-local directory. This means zero import changes: `@/lib/wp` just works in both apps,
resolving to `packages/shared/lib/wp`. App-specific files stay local as the fallback.

**When editing shared files:** Change only `packages/shared/`. Do NOT edit copies in
apps/site or apps/connect (they don't exist anymore). The mobile app (`apps/mobile`) 
duplicates some shared TypeScript logic (feed-recommendations, interest-mappings) because 
React Native can't use the DOM-dependent shared package — edit both when those change.

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

**`app/member/settings/newsletters/page.tsx`** (now a sub-route under settings)
- The `NewsletterPreferences` component is rendered here.
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

## Raw SQL REST endpoints

Several REST handlers bypass `WP_Query` / `get_user_meta` / `get_option` and
query the database directly via `$wpdb`. Do this for any endpoint that is
purely a read with no WP hook/filter logic.

### Pattern
```php
// Multiple user meta keys — single query, then build a map
$rows = $wpdb->get_results( $wpdb->prepare(
    "SELECT meta_key, meta_value FROM {$wpdb->usermeta}
     WHERE user_id = %d AND meta_key IN ('key1','key2')",
    $user_id
), ARRAY_A );
$map = array_column( $rows, 'meta_value', 'meta_key' );

// Multiple wp_options — single query
$rows = $wpdb->get_results(
    "SELECT option_name, option_value FROM {$wpdb->options}
     WHERE option_name IN ('opt1','opt2')",
    ARRAY_A
);
$opts = array_column( $rows, 'option_value', 'option_name' );
```

### Endpoints already using raw SQL
| Endpoint | Handler | What it reads |
|----------|---------|---------------|
| `GET /culture/v1/user/interactions` | `handle_get_interactions()` | 4 usermeta keys (likes/bookmarks) — single query |
| `GET /culture/v1/community-blocklist` | `handle_get_community_blocklist()` | 2 wp_options rows — single query |
| `GET /culture/v1/user/directory` | `handle_get_directory_profile()` | 6 usermeta keys + user exists check — single query |
| `GET /culture/v1/user/portfolio` | `handle_get_portfolio()` | 2 JSON usermeta keys + user exists check — single query |
| `GET /culture/v1/notifications` | `handle_get_notifications()` | custom `wp_culture_notifications` table |
| `GET /culture/v1/notifications/count` | `handle_notification_count()` | COUNT on custom table |
| `GET /culture/v1/wallet/history` | `handle_wallet_history()` | `wp_culture_credit_ledger` table |
| `GET /culture/v1/member/analytics` | `handle_member_analytics()` | ledger + posts tables via `$wpdb` |

### Why WPGraphQL is a separate concern
WPGraphQL is a **parallel query layer** — it has its own resolver pipeline that
also calls WordPress internals. Raw SQL optimisations only apply to the custom
REST endpoints above. WPGraphQL resolvers (used by `getWPData()` in `lib/wp.ts`
for content — articles, newsletters, quotes) are **not affected** and should not
be replaced with raw SQL because they depend on WP's permission/filter system
and the `show_in_rest`/`show_in_graphql` field registration.

Rule of thumb:
- **Content reads** (posts, taxonomies, media) → WPGraphQL via `getWPData()`
- **User-specific reads** (profile meta, interactions, wallet, notifications) → custom REST + raw SQL
- **Mutations** (submit post, redeem perk, mark read) → custom REST, WP logic required

### Do NOT raw-SQL these
Endpoints that depend on WP logic and must stay on `WP_Query`/`get_user_meta`:
- `handle_get_user_profile()` — gamification ledger calculations
- `handle_wallet_balance()` — `Culture_Gamification` computed state
- `handle_get_public_profile()` — gamification + badges
- Any mutation endpoint (insert/update) — use `$wpdb->insert/update` if needed,
  but still fire the relevant `do_action()` hooks for notifications/credits

### Gotcha: `meta_query` OR-branches with NOT EXISTS / DATE casts are slow
`WP_Query`'s `meta_query` builds one `LEFT JOIN` against `wp_postmeta` per
branch — `wp_postmeta.meta_value` has no index, so a query with 3+ OR
branches (especially mixing `NOT EXISTS` with `'type' => 'DATE'` casts) can
hang for 20s+ in production and cascade into client timeouts. This bit the
`culture_event` REST endpoint via `exclude_expired_events()` in
`class-culture-post-types.php` (`rest_culture_event_query` filter) — fixed by
replacing the meta_query with a single raw-SQL lookup (2 LEFT JOINs) that
resolves matching IDs and sets `$args['post__in']` instead. If you see a REST
endpoint backed by a CPT with a `rest_<post_type>_query` filter timing out,
check for this pattern first. Reminder: an **empty** `post__in` array is
ignored by `WP_Query` (returns everything) — use `array(0)` to force zero
results.

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

Active development branch: `claude/sweet-ritchie-xr21c3` (merged to main 2026-06-15)
New work: create a fresh branch from main or use whatever branch is specified at session start.

---

## @mentions system (June 2026)

Hashtags removed entirely. @mentions implemented end-to-end.

### Mobile composer
- `components/composer/MentionInput.tsx` — drop-in TextInput replacement; detects `@word` at cursor, debounced search (300ms) to `GET /culture/v1/mobile/members?search=...`, shows suggestion dropdown above input, inserts `@username ` on select
- All 10 post template main text areas use `MentionInput` (not plain `TextInput`)
- `components/composer/UserSearch.tsx` — also uses `/mobile/members` (NOT `/culture/v1/members` which is API-key-only)
- **Critical**: `/culture/v1/members` requires API key (server-side). Mobile must use `/culture/v1/mobile/members` (JWT Bearer). Wrong endpoint → 401 → auto-logout

### Mobile display
- `components/community/HashtagText.tsx` — repurposed to parse `@username` tokens (not `#hashtag`). Renders in `colors.gold + fonts.sansBold`. Prop: `onMentionPress?: (username) => void` (was `onHashtagPress`)
- `FeedItemCard.tsx` + `PostDetailSheet.tsx` — pass `onMentionPress` → `nav.navigate("MemberProfile", { username })`

### Web display
- `packages/shared/components/pulse/HashtagText.tsx` — same repurpose. Prop: `onMentionClick?: (username) => void`
- `FeedCard.tsx`, `CommunityDetailModal.tsx` — navigate to `/${username}` on mention tap

### PHP notifications
- `class-culture-notifications.php` — added `'mention' => 'You were mentioned'` to TYPES
- `class-culture-mobile-api.php` `handle_submit_post()` — extracts `@username` via `preg_match_all`, calls `Culture_Notifications::add()` for each mentioned user (skips self-mentions)
- `class-culture-rest-api.php` — same mention extraction on web post submit

### Removed (hashtags)
- Deleted: `apps/site/app/pulse/hashtag/`, `apps/connect/app/pulse/hashtag/`, `packages/shared/components/pulse/HashtagFeed.tsx`, `packages/utils/hashtags.ts`
- Removed `HashtagPreview` from `SubmitPost.tsx`
- Removed `#` toolbar button from `NewPostScreen.tsx`

---

## Site architecture — split complete

Two Vercel projects, one monorepo:

- **Site A (`themoveee.com`)** — Editorial + Shop. No auth. Fully cacheable.
  - `/magazine`, `/newsletter`, `/journeys`, `/shop`, `/`, `/makers`, `/visuals`
  - proxy.ts 308-redirects all auth/community/vendor paths → connect.themoveee.com
- **Site B (`connect.themoveee.com`)** — Community + Auth + Vendor.
  - `/login`, `/register`, `/forgot-password`, `/reset-password`
  - `/vendor/*` — vendor dashboard (moved from Site A)
  - `/member/*`, `/connect`, `/events`, `/community`, `/directory`, `/games`, `/pulse`, `/quotes`
  - `apps/connect/components/Header.tsx` — Site B header (logo + Connect badge + nav + user menu)
  - NextAuth cookie should use `domain: .themoveee.com` for cross-subdomain sharing

Both share `cms.themoveee.com` (WordPress) as the backend.

## Connect App build phases

| Phase | Status | Scope |
|-------|--------|-------|
| 1. Auth + Vendor | In progress | Login, register, forgot/reset password, vendor dashboard |
| 2. Member | Pending | Dashboard, wallet, notifications, settings, analytics |
| 3. Community | Pending | Feed, directory, events, games, quotes, pulse |

### Homepage queries (Site A) — current state
`lib/fetchHomepageData.ts` now fetches only 5 queries (down from 10):
stories, products, latest issue, interviews, series batch.
Events, directory, quotes, pulse, origins removed from homepage.

### Server stability fixes applied (June 10 2026)
On `cms.themoveee.com` (AWS Lightsail 2GB, London):
- `/opt/bitnami/php/etc/memory.conf` — `pm.max_children=5`, `memory_limit=128M`
  - **This file overrides www.conf** — always edit memory.conf, not www.conf
- `pm=ondemand`, `pm.process_idle_timeout=10s`, `pm.max_requests=50`
- `DISABLE_WP_CRON=true` in wp-config.php (line 108) — real cron via crontab every 5 min
- Varnish on port 80, Apache on 8080 — Varnish caches static assets 7 days, pages 300s
- Redis Object Cache plugin active
- Vercel KV (Upstash, EU London region) — caches GraphQL responses with `wp:` key prefix
  - KV flush endpoint: `POST /api/revalidate-kv` (secret: `WP_REVALIDATE_SECRET` env var)
  - WordPress fires flush on every post publish via `class-culture-community.php`
- Circuit breaker in `lib/wp.ts`: 3 failures → 60s cooldown — **now KV-backed** (`cb:cms` key in Vercel KV) so it trips across all serverless function instances, not just in-process

### WordPress newsletter sends via WP-CLI (recommended)
For large newsletter sends, use WP-CLI rather than the web UI to avoid PHP-FPM timeout:
```bash
wp eval 'Culture_Newsletter_Queue::dispatch_batch( $post_id );' --path=/opt/bitnami/wordpress
```
The queue processor runs in 50-post batches every 60s via WP-Cron (real cron at `/opt/bitnami/cron`).

### Scaling pm.max_children
Current value is `5` — safe for 2GB RAM. To increase: edit `/opt/bitnami/php/etc/memory.conf`
(NOT www.conf — memory.conf overrides it). Each PHP-FPM worker uses ~90–120MB. Formula:
`pm.max_children = floor((available_RAM_MB - 512) / 110)`. For 4GB: safe to set to ~30.

---

## Next.js middleware — use proxy.ts, never middleware.ts

This project uses Next.js 16 which replaces `middleware.ts` with `proxy.ts`.

**NEVER create a `middleware.ts` file.** It will conflict with `proxy.ts` and
cause a build failure:
```
Error: Both middleware file "./middleware.ts" and proxy file "./proxy.ts" are detected.
Please use "./proxy.ts" only.
```

All edge logic (redirects, cache headers, cookie setting, rate limiting) must
go into **`proxy.ts`** at the project root. The exported function is named
`proxy` (not `middleware`) and uses the same `NextRequest`/`NextResponse` API.

---

## VIP Club Upgrade — Phase Status

All phases implemented. Phase docs live in `docs/phases/`.

| Phase | Status | Key files |
|-------|--------|-----------|
| 1. Interest Tagging | Done | `lib/interest-mappings.ts`, `components/InterestEditor.tsx`, registration complete page |
| 2. Credits & Reputation | Done | `class-culture-gamification.php` (credit_ledger table, award_credits/reputation, check_post_threshold), `lib/auth.ts` |
| 3. Directory Knowledge Graph | Done | `class-culture-directory.php` (search, quick-create, directory posts, aggregates), `DirectoryGrid.tsx` (partner badge), `app/directory/[slug]/page.tsx` (community section) |
| 4. Post Templates & Composer | Done | `components/pulse/SubmitPost.tsx` (unified composer), `components/composer/` (StarRating, MultiRating, DirectorySearch, PollBuilder, ItineraryBuilder), `FeedCard.tsx` (template variants), poll-vote endpoint |
| 5. Public Profiles | Done | `app/connect/[username]/page.tsx`, `ProfileTabs`, `CommunityTab`, `PortfolioTab`, `app/member/portfolio/`, PHP: public member + community posts + portfolio endpoints |
| 6. Partner Perks | Done | `class-culture-perks.php` (redeem, QR verify, cashout, fee tiers), `culture_partner_perks` + `culture_redemptions` tables, 13 REST endpoints, `app/connect/perks/` (browse+redeem), `app/member/wallet/` (balance+cashout), `app/member/coupons/` (QR display) |
| 7. Passkeys | Done | `culture-community/includes/core/class-culture-webauthn.php`, `app/api/auth/passkey/`, `components/PasskeyPrompt.tsx`, `components/PasskeyBanner.tsx`, `app/member/settings/PasskeyManager.tsx` |
| 8a. Notifications | Done | `class-culture-notifications.php`, `wp_culture_notifications` table, `app/api/notifications/`, `components/NotificationBell.tsx`, `app/member/notifications/` |
| 8b. Feed Recommendations | Done | `lib/feed-recommendations.ts` (score/rank/trending), `components/pulse/PulseFeed.tsx` (For You ranking + trending sidebar), `components/pulse/FeedCard.tsx` (For You badge) |
| 8c. Analytics | Done | `GET /culture/v1/member/analytics`, `app/api/member/analytics/route.ts`, `app/member/analytics/` (SVG bar+line charts, top posts) |

---

## Phase 8a — Notifications architecture

### Database table: `wp_culture_notifications`
```
id, user_id, type, title, body, action_url, meta (JSON), read_at, created_at
```
Indexes: `(user_id, read_at)` for unread count, `(user_id, created_at)` for listing.

### Notification types
`credit_earned`, `badge_unlocked`, `perk_expiring`, `perk_redeemed`, `cashout_approved`, `cashout_rejected`, `escrow_released`, `comment_received`, `post_validated`, `system`

### PHP class: `class-culture-notifications.php`
Auto-fires on WP action hooks:
- `culture_credits_awarded` → `on_credits_awarded` (only fires for > 0 awards with sources other than `cashout`)
- `culture_badge_awarded` → `on_badge_awarded`
- `wp_insert_comment` → `on_new_comment` (only for `culture_post` CPT comments; notifies post author)
- `culture_cashout_approved` / `_rejected` → `on_cashout_approved/rejected`
- `culture_escrow_released` → `on_escrow_released`
- `culture_post_validated` → `on_post_validated`
- WP-Cron `culture_check_perk_expiry` (hourly) → fires `perk_expiring` when QR expires within 48h

Key static methods: `add()`, `get_for_user()`, `count_unread()`, `mark_read()`, `mark_all_read()`, `prune_old()` (keeps last 50)

### REST endpoints
| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/culture/v1/notifications` | GET | API key | List (limit/offset params) |
| `/culture/v1/notifications/count` | GET | API key | `{ unread: N }` |
| `/culture/v1/notifications/read` | POST | API key | Mark one or all read (`notification_id` optional) |

### Next.js routes
- `GET /api/notifications` — proxy with `user_id` from session
- `POST /api/notifications` — mark read (body `{ notification_id? }`)
- `GET /api/notifications/count` — `{ unread: N }` (polled every 30s by `NotificationBell`)

### Frontend
- `components/NotificationBell.tsx` — bell icon in site header; polls count every 30s; dropdown panel on click; renders emoji + title + body + time-ago
- `app/member/notifications/page.tsx` — full-page list, SSR, with `NotificationsClient` for mark-read
- `CULTURE_VERSION` bumped to `2.0.0` — triggers `dbDelta` to create the table on next plugin activation/update

---

## Phase 8b — Feed recommendations

### Library: `lib/feed-recommendations.ts`
Pure TypeScript, no server dependency. Four exports:
- `scoreItem(item, interestTagSet)` → 0–100+ score: 50 pts interest match (25 for partial), 30 pts recency
  (3-day half-life), 20 pts engagement (log scale) — **plus two boosts not part of the base 100**:
  a location boost (city match +25, region match +15, via `detectRegion()` / `COUNTRY_TO_REGION`) and a
  reputation boost (+10 when `authorRepTier` is taste-maker/culture-authority/culture-icon). The mobile
  port in `apps/mobile/src/features/community/useFeedRecommendations.ts` must stay in sync with all of
  this, not just the base three-factor score.
- `rankFeed(items, interestTagSet)` → sorted by score descending; tiebreak: most recent
- `getTrending(items, limit=5)` → highest engagement in last 7 days
- `matchesInterests(item, interestTagSet)` → boolean (checks `category`, `communityTag`, `entryType`, `arm`)

### PulseFeed integration (`components/pulse/PulseFeed.tsx`)
- "For You" toggle button in feed header (desktop: sidebar link; mobile: pill chip)
- When `forYou=true`: calls `rankFeed(filtered, interestTagSet)` to re-sort
- When `forYou=false`: newest-first (default)
- `interestTagSet` built from `session.user.interests` (array → Set of lowercase slugs)
- Trending items displayed in sidebar (desktop) and at top of For You feed
- `hasInterests = interestTagSet.size > 0` — if no interests, For You falls back to recency sort

### FeedCard "For You" badge
When `forYou=true` and `matchesInterests(item, interestTagSet)`: renders `✦ For You` badge on community cards (ochre background, 9px mono uppercase).

---

## Phase 8c — Member analytics

### REST endpoint
`GET /culture/v1/member/analytics?user_id=X` (API key auth)

Returns:
```json
{
  "credit_days": [{ "day": "2026-06-01", "earned": 20, "spent": 5 }],
  "balance": 450,
  "reputation": 280,
  "posts_published": 12,
  "posts_pending": 1,
  "badge_count": 4,
  "top_posts": [{ "ID": 123, "post_title": "...", "reactions": 18, "comment_count": 5 }],
  "rep_months": [{ "month": "2026-05", "reputation": 45 }]
}
```

### Frontend (`app/member/analytics/`)
- `GET /api/member/analytics/route.ts` — proxy (API key added server-side)
- `AnalyticsClient.tsx` — full SVG chart suite:
  - **Bar chart** (`BarChart`): credits earned/spent per day (last 30 days), multi-bar (ochre = earned, rust = spent)
  - **Line chart** (`LineChart`): reputation earned per month
  - **Top posts table**: ranked by `reactions + comment_count`, last 90 days
  - **Summary stats**: balance, reputation, posts published, badge count
- Chart components are plain SVG (`viewBox="0 0 600 H"`) — no external charting library

---

## Feed card offcanvas detail modals

All three are right-side slide-in drawer panels (`position: fixed, zIndex: 8000, width: min(520px, 100vw)`). Click outside or press Escape to close.

| Component | Trigger | Content |
|-----------|---------|---------|
| `components/pulse/HappeningDetailModal.tsx` | Click Happening card body | Event details: name, full dates (start + end), location + city, venue address, admission, organiser (linked to directory), description paragraphs, HTML body, "Get tickets / Find out more" button |
| `components/pulse/DirectoryDetailModal.tsx` | Click Directory card body | Entry name, type badge, excerpt, full body, "View full entry →" link |
| `components/pulse/QuoteDetailModal.tsx` | Click Quote card body | Large quote text, author, source, `ReactionBar` |

FeedCard lazy-loads all three modals via `dynamic(() => import(...), { ssr: false })`.

### RN unified comment system — `CommentSection.tsx` (June 2026)

All comment UI in `apps/mobile` must use the shared `components/community/CommentSection.tsx`.
Do not reimplement comment lists/composers per-screen — every surface (community posts, pulse
items, quotes, magazine articles) previously had its own copy-pasted comment block with
inconsistent avatar sizes, accent colors (`c.ochre` vs `c.gold`), empty-state copy, and composer
styling. These have all been migrated onto the one component.

**Two modes:**
- **`postId` mode** (self-fetching) — pass `postId` and the component calls `useComments(postId)`
  itself (custom `community/comments` + `community/comment` REST API). Used by
  `PostDetailSheet.tsx`, `PulseDetailSheet.tsx`, `QuoteDetailModal.tsx`, `PostDetailScreen.tsx`,
  `PulseDetailScreen.tsx`.
- **Controlled mode** (`comments`/`loading`/`submitting`/`onSubmit` props, no `postId`) — for
  screens with their own data source. Used by `ArticleScreen.tsx`'s `ArticleCommentsSection`,
  which fetches WordPress-native `/wp-json/wp/v2/comments` directly (different shape, requires
  HTML stripping) and does optimistic local insertion; it maps its `WpComment` shape into the
  shared `NormalizedComment` shape before rendering.

`useComments(postId, enabled = true)` (`src/features/community/useComments.ts`) takes an
`enabled` flag so `CommentSection` doesn't fire a wasted fetch when used in controlled mode —
always pass `!isControlled` as the second arg when calling it from inside a shared component.

Standardized styling baked into `CommentSection`: `fonts.sansBold` heading, 32px avatars
(`c.paperDeep` background), gap-based spacing (no per-row dividers), `truncateAt=3` default
with a "View all N comments" expander, always-visible "Commenting as {name}" line, `radius.xl`
pill composer (`c.paperWarm` bg, `borderWidth 1` / `c.ruleDark`), placeholder `"Add a comment…"`,
`c.gold` accent color throughout, and empty-state copy `"No comments yet — be the first to
comment."` (controlled-mode screens may override `emptyText`/`heading`/`signInPrompt`).

### RN FeedItemCard card designs (FeedItemCard.tsx)
- **PulseCard**: full-bleed hero image (200px, tappable → ImageLightbox), serif bold title, arm/category/region eyebrow row with region pill, OG link preview (LinkPreview) only when no hero image, source attribution below hero if named. Upgraded from plain inline ImgPlaceholder.
- **EditorialCard**: badge row, serif XL title, excerpt, then `InternalLinkCard` snippet (border pill, 90px feature image from `item.image`, gold "MOVEEE MAGAZINE" label, title, excerpt) — matches site's InternalLinkCard exactly. Opens `EditorialSheet` on tap.
- `item.image` on editorial items comes from WP featured image (`post.featuredImage?.node?.sourceUrl` in `unified-feed.ts`)
- `item.image` on pulse items comes from `story._embedded?.["wp:featuredmedia"]?.[0]?.source_url`
- OG fields on pulse: `item.ogImage`, `item.ogTitle`, `item.ogDescription`, `item.sourceUrl` — populated from `pulse_og_*` post meta

---

## Profile cover photo

`_culture_cover_photo_url` usermeta mirrors `_culture_avatar_url` exactly.
- Upload: `POST /mobile/me/cover-photo` (multipart, field `file`) →
  `handle_upload_cover_photo()` in `class-culture-mobile-api.php`, same
  `media_handle_upload()` pattern as `handle_upload_avatar()`.
- Exposed as `coverPhotoUrl` (camelCase) in both `public_profile()` and the
  own-user-profile builder in `class-culture-mobile-api.php`, and as
  `cover_photo_url` (snake_case) in `handle_get_public_profile()` in
  `class-culture-rest-api.php` — **any new profile field must be added to
  all three of these** to be visible everywhere (mobile member view, mobile
  own profile/auth store, web public profile).
- Mobile: `MemberSettingsScreen.tsx` ProfileTab has the upload control
  (`handleCoverPhotoPick`, 16:9 crop) above the avatar section; uses
  `api.upload(url, uri, "file")`. `MemberProfileScreen.tsx` swaps its
  hardcoded gradient hero for an `Image` when `profile.coverPhotoUrl` is set.
- Web: `app/connect/[username]/page.tsx` renders a `.prf-cover` banner above
  `.prf-header-inner` when `cover_photo_url` is present — there was
  previously no cover banner on web at all, only on mobile (gradient).
- `coverPhotoUrl: string` added to both `User` and `Member` in
  `apps/mobile/src/types/index.ts` (required field, not optional).

---

## Follow system (June 2026)

### Database table: `wp_culture_follows`
```
id, follower_id, followed_id, notify_posts, created_at
```
`UNIQUE KEY (follower_id, followed_id)` — re-following just updates the
`notify_posts` flag rather than inserting a duplicate row.

### PHP class: `class-culture-follows.php` (`Culture_Follows`)
Single source of truth for both REST surfaces. Key methods: `follow()`,
`unfollow()`, `set_notify()`, `is_following()`, `followers_count()`,
`following_count()`, `get_following_usernames()` (joined against `wp_users`,
used by the feed-ranking boost since `FeedItem` carries usernames not numeric
author IDs), `get_post_notify_follower_ids()`, `notify_followers_of_post()`
(called from `handle_submit_post()` in `class-culture-mobile-api.php` after
a community post is created — notifies only followers who opted into
`notify_posts`). Fires `do_action('culture_new_follower', $followed_id,
$follower_id)` only on a genuine new follow (not on notify-flag-only
updates), wired in `Culture_Notifications::on_new_follower()`.

### Notification types added
`new_follower` ("X started following you") and `new_follower_post`
("X just posted") in `Culture_Notifications::TYPES`.

### REST endpoints (both surfaces, same shape)
| Mobile (JWT) | Web (API key) | Purpose |
|---|---|---|
| `POST /mobile/follow` | `POST /follow` | Follow (`user_id`/`target_id`, optional `notify_posts`) |
| `POST /mobile/unfollow` | `POST /unfollow` | Unfollow |
| `POST /mobile/follow/notify` | `POST /follow/notify` | Update `notify_posts` for an existing follow |
| `GET /mobile/follow/status` | `GET /follow/status` | `{ isFollowing, followersCount, followingCount }` |
| `GET /mobile/follow/following` | `GET /follow/following` | `{ usernames: string[] }` — used by feed ranking |

`handle_get_member()` (mobile) and `handle_get_public_profile()` (web) both
now include `followersCount`/`followers_count` and `followingCount`/
`following_count`; mobile also includes viewer-relative `isFollowing`.

### Frontend — mobile
- `MemberProfileScreen.tsx` — Follow/Following button + followers count
  below the tier chip, plus a "Notify me when they post" checkbox row shown
  only while following. Hidden entirely when viewing your own profile
  (`isSelf` check against `useAuthStore`).
- `PostDetailSheet.tsx`'s `AuthorRow` — same Follow/Following toggle inline
  next to the author name, status fetched via `/mobile/follow/status` on
  mount, hidden for your own posts.

### Frontend — web
- `app/connect/[username]/FollowButton.tsx` — client component, mirrors the
  mobile profile screen (Follow toggle, followers count, notify checkbox).
  Proxies through `app/api/connect/[username]/follow/route.ts` (GET status,
  POST follow/unfollow, PATCH notify) which resolves the username → numeric
  ID via the public member endpoint, then calls the API-key REST surface.
- `packages/shared/components/pulse/CommunityDetailModal.tsx` —
  `AuthorFollowToggle` inline component in the post author row (community
  feed item detail modal), using the same `/api/connect/[username]/follow`
  proxy route.

### Feed-ranking boost
Followed authors get a +15 score boost, added as a 5th optional parameter
(`followedUsernames?: Set<string>`) to `scoreItem()`/`rankFeed()` in both
`packages/utils/feed-recommendations.ts` (web) and
`apps/mobile/src/features/community/useFeedRecommendations.ts` (mobile) —
matched against `item.communityAuthorUsername` (lowercased) since neither
FeedItem shape carries a numeric author ID. Web fetches the set via
`/api/connect/follow/following` in `PulseFeed.tsx`; mobile fetches via
`${MOBILE_API}/follow/following` in `ConnectFeedScreen.tsx`. As with the
other feed-recommendation changes, **keep both files in sync**.

### Global notification preferences page (June 2026)
Built on top of `Culture_Notifications` (`class-culture-notifications.php`).

- `_culture_notification_prefs` usermeta — JSON-encoded `type => bool` map.
  `Culture_Notifications::get_prefs( $user_id )` merges stored prefs over a
  defaults map freshly derived from `TYPES` keys every call, so any new type
  added to `TYPES` in the future is enabled by default with no migration.
  `set_prefs( $user_id, $prefs )` writes it back; `is_enabled( $user_id,
  $type )` is checked at the top of `add()` — a muted type silently no-ops
  (`add()` returns `0`, no row inserted).
- `ALWAYS_ON_TYPES = ['system']` — the `system` type can't be muted; both
  `is_enabled()` and `set_prefs()` enforce this (the latter just ignores
  attempts to change it), and it's deliberately excluded from both frontend
  preference lists below.
- REST endpoints (same shape as the Follow system): `GET`/`POST
  /mobile/notifications/preferences` (JWT, `handle_get/set_notification_prefs`
  in `class-culture-mobile-api.php`, no `user_id` param — taken from
  `get_current_user_id()`) and `GET`/`POST /notifications/preferences` (API
  key, explicit `user_id` param, same handler names in
  `class-culture-rest-api.php`). `POST` body is `{ prefs: { type: bool, ... } }`.
- Mobile: new "Notifications" tab in `MemberSettingsScreen.tsx` (between
  Newsletters and Security) — `NotificationsTab()` component, toggle row per
  type from a local `NOTIFICATION_TYPES` label array that mirrors
  `Culture_Notifications::TYPES` (minus `system`) — **keep this array in
  sync with the PHP const**, there's no shared source of truth across the
  PHP/TS boundary here.
- Web: new `/member/settings/notifications` sub-route, added to
  `SettingsTabs.tsx`. `NotificationPreferences.tsx` (same toggle-row pattern
  as `NewsletterPreferences.tsx`, reuses `mem-field-list`/`mem-toggle` CSS
  classes) proxied through `app/api/notifications/preferences/route.ts`.
- The per-follow "notify me when they post" toggle (`notify_posts` on
  `wp_culture_follows`) is a separate, more granular control — it still
  governs whether a given *followed user's* posts trigger `new_follower_post`
  at all per-relationship; the new global toggle governs whether the
  `new_follower_post` *type* is delivered at all, independent of which
  follows have notify enabled. Both checks apply (notify_posts AND
  is_enabled) for that type to actually fire.

### Notification touchpoint audit (June 2026) — dead hooks fixed
A full-codebase audit confirmed every notification type ever created is
already in `TYPES` (no missing registrations), but found two types that
were fully wired into `Culture_Notifications` and the preference UIs yet
**never actually fired** because nothing called their trigger:
- `cashout_approved` / `cashout_rejected` — `Culture_Perks::approve_cashout()`
  / `reject_cashout()` (`class-culture-perks.php`) updated the redemption row
  but never called `do_action('culture_cashout_approved'/'_rejected', ...)`.
  Fixed: both now fire the action (`$user_id`, `$redemption_id`) right after
  the status update succeeds (and after the credit refund, for rejection).
- `perk_redeemed` — `Culture_Perks::redeem_perk()` had no notification call
  at all. Fixed: calls `Culture_Notifications::add()` directly (no
  intermediate hook — this is a direct mutation flow, not an event pattern)
  right after incrementing `redeemed_count`, linking to `/member/coupons`.

Also found: the notification icon/emoji maps in
`packages/shared/components/NotificationBell.tsx`,
`apps/connect/app/member/notifications/NotificationsClient.tsx`, and
`apps/mobile/src/screens/member/NotificationsScreen.tsx` were each missing
entries for `referral_received`, `mention`, `new_follower`, and
`new_follower_post` (silently fell back to a default icon). Filled in on
all three — **if a new type is ever added to `Culture_Notifications::TYPES`,
add an icon entry to all three of these files**, there is no shared
source of truth for icons across the PHP/TS boundary.

---

## Event system enhancements

### Organiser field
Community event posts (`_template_type = 'event'`) now support an organiser directory link:
- Meta key: `_culture_event_organiser_id` (int, directory entry ID)
- Saved by `SubmitPost.tsx` → `POST /culture/v1/community/submit` with `organiser_directory_id`
- PHP handler `handle_community_submit()` reads `organiser_directory_id` and calls `update_post_meta`
- FeedItem fields: `organiserName`, `organiserSlug` (populated from directory entry in `unified-feed.ts`)
- Shown in `HappeningDetailModal` as a clickable link to `/directory/{slug}`

### New FeedItem fields for Happening cards
`endDate`, `openingHours`, `venueAddress`, `admission`, `eventCategory`, `organiserName`, `organiserSlug`, `city` — all optional strings. Used in `HappeningDetailModal` and the Happening card in `FeedCard.tsx`.

### Event composer (SubmitPost.tsx)
- Category field now present (maps to `culture_event_categories` taxonomy)
- Organiser field: `DirectorySearch` component, typeFilter="person"
- Image upload via WP Media API (not URL input)

---

## Community event RSVP (free, capacity-limited — June 2026)

Targets community-organiser events: `culture_post` CPT, `_template_type = 'event'`.
**Deliberately separate** from the pre-existing, unrelated `Culture_Event_RSVP` system
(editorial `culture_event` CPT, table `wp_culture_event_rsvp`, public RSVP, admin-only
attendee list) — the two systems must never share a table or be merged. This is RSVP
only (free signups + capacity + attendee list + check-in tracking), not paid ticketing.

### Database table: `wp_culture_community_rsvp`
```
id, post_id, user_id, status ('confirmed'|'cancelled'), created_at
UNIQUE KEY (post_id, user_id) — re-RSVPing after cancel just flips status back
KEY (post_id, status)
```
Created via `Culture_Community_RSVP::create_table()`, called from
`Culture_Activator::create_tables()`, gated by `CULTURE_VERSION` bump to `2.4.0`.

### PHP class: `class-culture-community-rsvp.php` (`Culture_Community_RSVP`)
Single source of truth for both REST surfaces. Key methods: `is_pro()` (admin override
OR `_culture_membership_tier === 'patron'`), `is_rsvp_enabled()`, `get_capacity()`,
`get_count()`, `is_organiser()`, `get_status()` (returns `{enabled, rsvped, count,
capacity, spotsLeft, isFull, isOrganiser}`), `rsvp()` (validates event type, RSVP
enabled, not own event, capacity not exceeded; fires `Culture_Notifications::add()`
directly to the organiser, type `event_rsvp`, no intermediate hook), `cancel()`,
`get_attendees()` (joined against `wp_users`), `get_organiser_events()` (all of a
user's organised events with live RSVP counts).

### Post meta keys
`_culture_rsvp_enabled` (bool), `_culture_rsvp_capacity` (int, 0 = unlimited).

### Pro-gating (hard requirement)
**Both RSVP creation (enabling the toggle when posting an event) and RSVP management
(attendee list/export) are restricted to Connect Pro (`patron`) members only** —
enforced server-side via `Culture_Community_RSVP::is_pro()`, not just hidden in the UI:
- Creation: `handle_submit_post()` Event branch in `class-culture-mobile-api.php` —
  if `rsvp_enabled` is passed but the poster isn't Pro, the toggle is **silently
  ignored** (post still succeeds, just without RSVP) rather than failing the submit.
- Management: `handle_community_event_attendees()` / `handle_community_my_events()` in
  both `class-culture-mobile-api.php` and `class-culture-rest-api.php` return 403
  `patron_required` if the requester isn't Pro, and `handle_community_event_attendees()`
  additionally 403s `forbidden` if the requester isn't the post's organiser.

### REST endpoints (mirrored, mobile JWT + web API-key)
| Mobile (`/mobile/community/...`, JWT, `get_current_user_id()`) | Web (`/community/...`, API key, explicit `user_id` param) | Purpose |
|---|---|---|
| `POST event/rsvp` | `POST event/rsvp` | RSVP to an event |
| `POST event/rsvp-cancel` | `POST event/rsvp-cancel` | Cancel RSVP |
| `GET event/rsvp-status` | `GET event/rsvp-status` | `get_status()` for the current/given user |
| `GET event/attendees` | `GET event/attendees` | Attendee list — Pro + organiser only |
| `GET my-events` | `GET my-events` | Organiser's events with RSVP counts — Pro only |

Handlers live in `class-culture-mobile-api.php` and `class-culture-rest-api.php`
respectively; both just call into `Culture_Community_RSVP` static methods.

### Notification type
`event_rsvp` added to `Culture_Notifications::TYPES` — fires when someone RSVPs,
notifying the organiser. Icon (`🎫`) added to the 3 frontend icon maps (see the
"Notification touchpoint audit" section above for why there's no shared source of
truth for these).

### FeedItem RSVP fields
`rsvpEnabled`, `rsvpCapacity`, `rsvpCount`, `rsvpAvailable` added to `FeedItem` in
`apps/mobile/src/types/index.ts`, populated in the mobile community-feed mapper in
`class-culture-mobile-api.php`.

**Web gap closed (June 2026).** The web `FeedItem` type in
`packages/shared/lib/unified-feed.ts` now also carries `ticketUrl`, `rsvpEnabled`,
`rsvpCapacity`, `rsvpCount` (event date/venue/admission/category/organiser reuse the
pre-existing happening-specific fields: `eventDate`, `endDate`, `location`,
`venueAddress`, `city`, `admission`, `eventCategory`, `organiserName`,
`organiserSlug`). `getCommunityPosts()` requests the raw `_event_*` postmeta keys plus
a new resolved `community_event_meta` REST field (registered in
`class-culture-post-types.php`, mirroring the pre-existing `culture_event_meta`
pattern for editorial events) that resolves the organiser directory entry's
name/slug and a live RSVP count server-side, avoiding a second request per event.

`FeedCard.tsx` and `CommunityDetailModal.tsx` both render an `event` template badge,
an event-details block (date, venue/city, admission, organiser link, ticket link),
and — when `rsvpEnabled` — a self-contained `RsvpDisplay` component (same pattern as
`PollDisplay`: own `useState`/`useEffect`, fetches live status on mount, posts to the
proxy routes below on toggle). Both files duplicate this component exactly like they
already duplicate `PollDisplay` — there's no shared component module between the
feed-card and detail-modal renderers in this codebase, so **keep both in sync** for
any future template feature.

Three new Next.js proxy routes (same auth/secret pattern as
`app/api/community/poll-vote/route.ts`):
- `POST /api/community/event-rsvp` → `POST /community/event/rsvp`
- `POST /api/community/event-rsvp-cancel` → `POST /community/event/rsvp-cancel`
- `GET /api/community/event-rsvp-status?post_id=X` → `GET /community/event/rsvp-status`

**Web composer reroute (June 2026 — closes the gap above).** `SubmitPost.tsx`'s Event
template used to submit to `/api/events/member-submit` (the separate, excluded
editorial `culture_event` RSVP system), so there was no way to create an RSVP-enabled
community event from the web UI. **Fixed**: it now submits through the same generic
`/api/community/submit` path as every other template (`template_type: "event"`),
matching the mobile reroute below. `apps/connect/app/api/community/submit/route.ts`
accepts `event_title`, `event_date`, `event_end_date`, `event_venue`, `event_address`
(web only has one combined venue/address input — both meta keys get the same value),
`event_city`, `event_admission`, `ticket_url`, `event_category`,
`organiser_directory_id`, `rsvp_enabled`, `rsvp_capacity`. **Critical: this route calls
native WP REST (`wp/v2/community-posts`) directly via HTTP Basic Auth — it does NOT go
through the custom PHP `culture/v1/community/submit` endpoint that `handle_submit_post()`
handles for mobile.** That means none of the PHP-side gating in `handle_submit_post()`
(rep/Pro floors, RSVP Pro-only) applies to web; it had to be reimplemented directly in
this Next.js route using `session.user.reputation` / `session.user.tier`. Event
creation requires `patron` tier OR 500+ reputation (403 otherwise, same floor as
mobile); RSVP enabling is silently dropped (post still succeeds) for non-Pro posters.
The event image uses the generic `/api/community/upload-image` (R2, returns a plain
URL) since community posts store images via the `community_image_url` meta field, not
a WP attachment ID — no need for the editorial flow's upload-image endpoint. The RSVP
toggle + capacity input in the composer JSX is gated on `session.user.tier === "patron"`.

### Mobile composer reroute (important — June 2026)
The mobile Event template in `NewPostScreen.tsx` used to submit to
`${PROXY}/events/member-submit` (creating an editorial `culture_event` post via the
*pre-existing, excluded* RSVP system) — which made this whole feature unreachable
from the UI. **Fixed**: the Event template now submits through the same generic
`${MOBILE_API}/community/submit` path as every other template, creating a `culture_post`
with `_template_type = 'event'`. Body fields added: `event_date`, `event_end_date`,
`event_venue`, `event_city`, `event_address`, `event_admission`, `ticket_url`,
`event_category`, `organiser_directory_id`, `rsvp_enabled`, `rsvp_capacity`. Since this
path derives `post_title` from `wp_trim_words(content, 10)` (no separate title field
server-side), `content` for the event template is built as
`eventTitle + "\n\n" + description` rather than just the description text. Image
upload now goes through the shared `uploadImages()` → `/mobile/community/upload-image`
flow (the old `/events/upload-image` endpoint is no longer called from this screen).
**Reputation floor restored**: the old editorial event endpoint enforced a minimum
reputation (Culture Contributor, 500 rep) to create an event. The reroute initially
dropped this floor; it's since been restored in `handle_submit_post()` —
`template_type === 'event'` now requires `patron` tier OR 500+ reputation (returns
`rep_required` 403 otherwise), same gate as poll/itinerary (2,500 rep) right above
it in the same function. Mobile-only check since web has no community-post event
creation path yet.

### RSVP UI
- **Mobile composer**: `EVENT_CATEGORIES`-style toggle row + capacity input in
  `renderEvent()` in `NewPostScreen.tsx`, gated by `user?.tier === "patron"` — tapping
  while not Pro shows an `Alert` rather than enabling the toggle.
- **Mobile post detail**: `EventRsvpButton` component in `PostDetailSheet.tsx`'s
  `TemplateEvent`, self-contained (own `useState`/`useEffect`, calls
  `event/rsvp-status` on mount, then `event/rsvp` / `event/rsvp-cancel` on toggle).
- **Mobile organiser management**: `MyEventsScreen.tsx` (`screens/member/`), registered
  in both `ConnectStack` and `MemberStack` as `"MyEvents"`, linked from
  `MemberDashboardScreen.tsx`'s `QUICK_LINKS`. Non-Pro users see a lock card with an
  upgrade CTA instead of the event list (`isPro` check against `useAuthStore()`).
- **Web organiser management**: `/member/events` (`app/member/events/page.tsx` +
  `EventsClient.tsx`), proxied through `app/api/member/events/route.ts` (list) and
  `app/api/member/events/[postId]/attendees/route.ts` (attendee list). Non-Pro users
  get a server-rendered upgrade prompt instead of the page content (checked via
  `session.user.tier` before any data fetch — the page never calls the Pro-gated WP
  endpoints for non-Pro members). CSV export is client-side (`Blob` + anchor download,
  no server round-trip). Linked from `/member` quick links only when `isPatron`.

---

## NewPostScreen composer — template field reference (v2, June 2026)

Source of truth: `apps/mobile/src/screens/community/NewPostScreen.tsx`
Template picker: FAB → `TemplatePickerSheet` → `NewPost` route with `template` param

### Inline photos pattern (post, hidden-gem, food-review, itinerary, event)
Photos are embedded in the scroll body (NOT a floating strip). Pattern: dashed 80×80 add tile + 80×80 thumbs with white ✕, "Up to 4 photos" hint. MAX_IMAGES = 4.

### Per-template field layout

**Standard Post** — section tag chips (top) → emoji guide chips → textarea → char counter → inline photos

**Hidden Gem** — place name input → location input (📍) → DirectorySearch ("Link this place") → divider → "Tell us about it" textarea → star rating (optional) → price range chips (₦/₦₦/₦₦₦/₦₦₦₦) → opening hours input (🕐) → divider → inline photos

**Cultural Take** — "Your take" serif bold 20px textarea → divider → "Explain your take" body textarea → section tags at bottom. No image. DirectorySearch optional at bottom.

**Food Review** — dish/item input → DirectorySearch (restaurant) → divider → MultiRating (Taste/Value/Vibe) → "Your review" textarea → cuisine chips (Nigerian/Pan-African/West African/Continental/Fusion/Seafood) → price range chips → divider → inline photos

**Book Review** — book search input (🔍, fetches from `${MOBILE_API}/books/search?q=X`) + dropdown with book cover/title/author/year + "Add new book" → book card (selected, 48×64 cover) → status chips (Finished/Reading/Want to Read) → overall StarRating → breakdown MultiRating (Writing/Story/Characters/Pacing) → review textarea → favourite quote (ochre left border, italic) → recommend chips (Yes green / No) → genre chips (multi-select). No images.

Submits to `${MOBILE_API}/community/submit` with extra fields: `book_title`, `book_author`, `book_status`, `book_overall_rating`, `book_rating_writing/story/characters/pacing`, `book_fav_quote?`, `book_recommend`, `book_genres?`

**Creative Showcase** — title input → medium chips (Photography/Film/Digital Art/Illustration/Music/Writing, single-select) → "About this work" textarea → collaborator input (@-prefixed) → divider → 120px dashed upload zone. MAX_IMAGES = 4.

**Poll** — question textarea (80px, bordered) → PollBuilder options → divider → poll duration segmented control (1d/3d/7d) → description textarea (optional)

**Itinerary** — trip title input → city/region input (📍) → ItineraryBuilder stops → duration input (⏱, optional) → budget chips (£/££/£££/££££, optional) → best time input (☀️, optional) → divider → inline photos

**Event** — event name input (17px bold) → 2-col date grid (start date | start time / end date | end time) → venue name (🏛) + full address (📍) + city inputs → divider → admission (£ prefix) + ticket link (🔗) → category chips → organiser DirectorySearch pill → inline photos (hint: "Event flyer, venue photos…")

**Quote** — paper-warm bordered box with decorative `"` glyph, italic serif textarea → author input → source input → divider → "Why sharing?" textarea (optional) → quote type chips (Person/Book/Film/Speech/Song)

### State variables (key additions in v2)
```ts
// Hidden Gem
hiddenGemPlaceName, hiddenGemLocation, hiddenGemPriceRange, hiddenGemOpeningHours

// Cultural Take
culturalTakeHeadline

// Food Review
cuisineTag, foodPriceRange

// Creative Showcase
showcaseTitle, showcaseMedium, showcaseCollaborator

// Book Review
bookEntry, bookSearch, bookSearchResults, bookSearchOpen
bookStatus, bookOverallRating, bookRatings ({writing, story, characters, pacing})
bookFavQuote, bookRecommend, bookGenres

// Itinerary
itineraryTitle, itineraryBudget, itineraryDuration, itineraryBestTime

// Event
eventAddress (new — separate from eventVenue)

// Poll
pollDescription

// Quote
quoteSharingReason, quoteType
```

---

## Reputation tier thresholds

Defined in `Culture_Gamification::REPUTATION_TIERS` (Option A+B+C redesign):
```php
25000 => 'culture-icon',        // invite/nomination only — requires _culture_icon_nominated usermeta
10000 => 'culture-authority',
2500  => 'taste-maker',
500   => 'culture-contributor',
0     => 'member',
```

`culture-icon` is a nomination-only tier. Even with 25,000+ rep, the user must have
`_culture_icon_nominated = 1` set by an admin. `get_reputation_tier($rep, $user_id)` enforces this.

**Reputation is earned only from quality signals (Option B).** Passive actions
(`magazine_read`, `magazine_share`, `game_completed`, `poll_vote`, `newsletter_reaction`,
`community_like`, `quote_like`) give 0 reputation — they still earn credits.
Quality signals: event check-in, referral, community post/comment, directory entry,
quote submission, newsletter comment, profile completed, email verified.

Daily credit cap: `DAILY_CREDIT_CAP = 50` credits per user per day.

### Reputation-gated privileges (implemented)

| Privilege | Minimum tier | Where enforced |
|---|---|---|
| Feed boost (+10 score) | Taste Maker | `useFeedRecommendations.ts` scoreItem() — reads `authorRepTier` on FeedItem |
| Skip new-member review queue | Taste Maker (2,500 rep) | `class-culture-mobile-api.php` handle_submit_post |
| Poll + Itinerary templates | Taste Maker (2,500 rep) | PHP (403), mobile UI (🔒 chip + Alert) |
| Gated partner perks | Configurable per perk | `class-culture-perks.php` redeem_perk() checks `min_rep_tier` column |
| Nominate for Culture Icon | Culture Authority (10,000 rep) | `POST /culture/v1/nominate-icon` |

**Feed boost implementation:**
- `community_author_rep_tier` saved as post meta on every submit (mobile API)
- Registered in `class-culture-community.php` register_meta()
- Returned as `authorRepTier` field in mobile feed response
- `FeedItem.authorRepTier` added to `src/types/index.ts`

**Perk tier gating:**
- `culture_partner_perks` table has `min_rep_tier VARCHAR(30) DEFAULT 'member'` column
- `dbDelta` in `class-culture-activator.php` adds it (ALTER on existing tables happens automatically)
- Admin perk create/update API (`_sanitize_perk_data`) accepts `min_rep_tier` param
- Tier order: member(0) < culture-contributor(1) < taste-maker(2) < culture-authority(3) < culture-icon(4)

**Nomination power:**
- `POST /culture/v1/nominate-icon` — API key auth
- Body: `{ nominator_id, nominee_id }`
- Sets `_culture_icon_nominated`, `_culture_icon_nominated_by`, `_culture_icon_nominated_at` usermeta
- Rate-limited: one nomination per nominator per day (WP transient)
- Nominations are additive — any Culture Authority can nominate, admin still controls the final flag

---

## Public profiles (`app/connect/[username]/`)

Full public profile page. Fetches from `GET /culture/v1/member/{username}`.

### Components
- `page.tsx` — server component; renders hero (avatar, name, tier, occupation, city, joined date)
- `BadgeShelf.tsx` — horizontal scroll of earned badges (emoji + name chips)
- `ProfileTabs.tsx` — tab switcher: Community | Portfolio
- `CommunityTab.tsx` — paginated community posts by this user; calls `GET /api/connect/{username}/posts`
- `PortfolioTab.tsx` — portfolio items; calls `GET /api/connect/{username}/portfolio`
- `ShareButton.tsx` — navigator.share / clipboard copy

### API routes
- `GET /api/connect/[username]/posts` → proxies `GET /culture/v1/community/posts?author_username=X`
- `GET /api/connect/[username]/portfolio` → proxies `GET /culture/v1/user/portfolio`

---

## Community post full page (`app/community/[slug]/`)

Static-ish page for sharing individual community posts. URL: `/community/{slug}`.
`CommunityPostClient.tsx` renders the full post with:
- All template fields (poll with live voting, gallery, itinerary, ratings)
- `PollDisplay` sub-component (self-contained — handles voting state)
- `ReactionBar`, `HashtagText`, `SourcePreviewCard`
- Comment thread with `WpComment` type
- Back link to Connect Feed (`/connect`)

---

## Interest taxonomy (canonical slugs)

Stored in `lib/interest-mappings.ts`. PHP allowlists in `class-culture-rest-api.php`. Seeded by `Culture_Activator::seed_interests()`.

18 slugs (expanded from 16 — added 2 event-specific):
`fashion-streetwear`, `food-drink`, `street-food`, `nightlife`, `live-music`, `music-production`, `independent-film`, `visual-art`, `architecture`, `photography`, `literature`, `visual-design`, `tech-culture`, `sport-wellness`, `travel`, `ideas`, `event-performance`, `event-community`

The last two (`event-performance`, `event-community`) are only used as event categories — not shown in the user interest picker.

### Directory entry city field

`culture_directory` posts have an `_entry_city` meta field (string, `show_in_rest: true`)
for disambiguation when similar names exist (e.g. "The Jazz Cafe, London" vs "The Jazz Cafe, Lagos").
- PHP: registered in `class-culture-post-types.php` → `$directory_meta`; WP Admin meta box in same file
- Search results include `city` in the JSON response (`class-culture-directory.php` → `handle_search`)
- Quick-create accepts and saves `city` param (`handle_quick_create`)
- Next.js: `app/api/directory/quick-create/route.ts` forwards `city` to WordPress
- React: `DirectorySearch.tsx` shows city below title in results; two-step create UX (enter name → optionally add city → create)

### NextAuth session shape (`lib/auth.ts`)

The session `user` object includes these fields beyond the basics:
```ts
{
  id, name, email, username, displayName, tier,     // core
  avatarUrl, phone, whatsapp, gender,               // profile
  dateOfBirth, nationality, city, occupation,       // KYC
  credits, reputation, reputationTier, badges,      // gamification
  dailyCreditsRemaining, registeredAt,              // gamification + moderation
  hasPasskey, passkeyCount, creditsEscrowed,        // Phase 7
}
```
All fields available as `session.user.X` in server components after `getServerSession(authOptions)`.

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

---

## moveee-connect React Native app — current state

The app lives in `apps/mobile/` using Expo + React Navigation + Zustand + MMKV.

### ⚠️ Production build checklist — items removed for preview builds

These were stripped to unblock preview APK builds and **must be restored before production**:

| Item | Where | Why removed | How to restore |
|------|-------|-------------|----------------|
| `react-native-iap` | `apps/mobile/package.json` dependencies | Has Amazon/Play store flavors — Gradle can't resolve without the store flavor plugin | Add back: `"react-native-iap": "^12.15.4"` |
| `./plugins/withAndroidIapStoreFlavor` | `apps/mobile/app.json` plugins array | Required by react-native-iap to select Play vs Amazon flavor | Add back to plugins array |

Before production build, also run `npm install` after restoring `react-native-iap`.

### Architecture
- `src/api/client.ts` — `api.get/post/put/delete/upload()` with Bearer token injection
- `src/auth/authStore.ts` — Zustand store, JWT in SecureStore, MMKV hydration
- `src/store/storage.ts` — MMKV-backed cache with TTL constants
- `src/navigation/index.tsx` — 5-tab bottom navigator + auth stack
- `src/features/community/useUnifiedFeed.ts` — paged fetch, MMKV cache
- `src/types/index.ts` — all TypeScript interfaces (User, FeedItem, Perk, Redemption, Passkey, etc.)

### What is complete
| Area | Key files |
|------|-----------|
| Auth flow (Login/Register/VerifyEmail) | `screens/auth/` |
| Auth store | `src/auth/authStore.ts` (Zustand + SecureStore + MMKV, incl. `updateUser`) |
| API client | `src/api/client.ts` (get/post/put/delete/upload, Bearer token) |
| Theme tokens | `src/theme.ts` (colors, fonts, fontSize, space, radius) |
| Types | `src/types/index.ts` (User w/ Phase 6/7 fields, FeedItem, Perk, Redemption, Passkey, Notification) |
| Custom fonts | App.tsx loads Fraunces + DM Sans + JetBrains Mono via useFonts() |
| 5-tab navigation + new routes | `src/navigation/index.tsx` (MemberDirectory, Wallet, Coupons, Perks, MemberDashboard, MemberSettings) |
| ConnectFeedScreen | `screens/community/ConnectFeedScreen.tsx` |
| FeedItemCard (all templates) | `components/community/FeedItemCard.tsx` (gallery, polls, itinerary, ratings, upgraded Pulse + Editorial cards) |
| PostDetailScreen, PulseDetailScreen | `screens/community/` |
| NewPostScreen (all 10 templates) | `screens/community/NewPostScreen.tsx` (post, hidden-gem, cultural-take, food-review, book-review, creative-showcase, poll, itinerary, event, quote) |
| Composer sub-components | `components/composer/` (StarRating, MultiRating, PollBuilder, ItineraryBuilder, DirectorySearch) |
| TemplatePickerSheet | `components/community/TemplatePickerSheet.tsx` — 2×2 grid bottom sheet modal, FAB → onSelect → NewPost with template param |
| Shared UI components | Avatar, TypeBadge, ImageLightbox (`components/ui/`), ReactionBar, HashtagText (`components/community/`) |
| MemberDirectoryScreen | `screens/community/MemberDirectoryScreen.tsx` |
| MemberDashboardScreen | `screens/member/MemberDashboardScreen.tsx` (passkey banner, stats, badges, quick links) |
| MemberSettingsScreen | `screens/member/MemberSettingsScreen.tsx` (5 tabs: Profile/Directory/Interests/Newsletters/Security) |
| PerksScreen | `screens/member/PerksScreen.tsx` (passkey gate, redeem → proxy) |
| WalletScreen | `screens/member/WalletScreen.tsx` (history + cashout, GBP/USD/NGN fields) |
| CouponsScreen | `screens/member/CouponsScreen.tsx` (QR placeholder, expiry countdown) |
| MagazineScreen, ArticleScreen | `screens/magazine/` |
| MemberProfileScreen (basic) | `screens/community/MemberProfileScreen.tsx` |
| TierBadge, TimeAgo | `components/ui/` |
| MembershipScreen | `screens/member/MembershipScreen.tsx` (two-tier cards, Citizen/Pro CTA logic) |
| EventsScreen | `screens/events/EventsScreen.tsx` (WP CPT fetch, filter strip, event cards) |
| EventDetailScreen | `screens/events/EventDetailScreen.tsx` (meta card, RSVP form → `/api/events/rsvp`) |
| TriviaGameScreen | `screens/games/TriviaGameScreen.tsx` (fully native, ABCD options, explanation, MMKV played-today gate) |
| WhoSaidItGameScreen | `screens/games/WhoSaidItGameScreen.tsx` (fully native, tap-author options, review, MMKV gate) |
| GamesScreen (updated) | `screens/games/GamesScreen.tsx` (navigates to TriviaGame + WhoSaidIt; Crossword/Sudoku dimmed) |
| PasskeyManager | `screens/member/MemberSettingsScreen.tsx` SecurityTab (full register/delete WebAuthn flow via `react-native-passkeys`) |
| Dark mode | `src/theme.ts` (`lightColors`, `darkColors`, `ColorPalette`), `src/store/themeStore.ts` (Zustand+MMKV, `ThemeMode`), `src/hooks/useColors.ts` (`useColors()` hook), Appearance tab in MemberSettingsScreen |
| Lifestyle Shop | `screens/shop/ShopScreen.tsx` (home), `store/cartStore.ts` (item count badge), Shop tab added to navigation (6th tab between Games and Events) |
| CartScreen | `screens/shop/CartScreen.tsx` — 3 frames: cart with items/qty/summary/Pro savings strip, empty state, checkout handoff with animated progress bar + security badges |
| cartStore (full) | `store/cartStore.ts` — expanded from count-only to full item mgmt: `addItem/removeItem/updateQty/clearCart`, legacy `setItemCount/increment` kept |
| TheEditScreen | `screens/shop/TheEditScreen.tsx` — editorial curated shop: hero gradient, feature card with editorial quote, horizontal season picks with badges, editorial stories, 2-col grid |
| MakerProfileScreen | `screens/shop/MakerProfileScreen.tsx` — maker hero + stats bar + about + Origins bridge + 2-col product grid + contact card |
| ShopSearchScreen | `screens/shop/ShopSearchScreen.tsx` — search with recent/popular suggestions, debounced results list |
| ShopFilterSheet | `components/shop/ShopFilterSheet.tsx` — BottomSheet with category pills, sort radios, toggle rows; exports `ShopFilters` type |
| ProEarlyAccessGate | `components/shop/ProEarlyAccessGate.tsx` — gold-bordered gate card with countdown, upgrade CTA |
| OrderConfirmationScreen | `screens/shop/OrderConfirmationScreen.tsx` — celebration screen with overlapping item circles, track/continue buttons |
| BottomSheet system | `components/ui/BottomSheet.tsx` — peek/full/dismiss states with PanResponder gestures |
| PostDetailSheet | `components/community/PostDetailSheet.tsx` — all 9 community templates in a bottom sheet |
| SheetErrorState | `components/ui/SheetErrorState.tsx` — wifi error state in a peek-height bottom sheet |
| HappeningDetailModal | `components/community/HappeningDetailModal.tsx` — migrated to BottomSheet |
| DirectoryDetailModal | `components/community/DirectoryDetailModal.tsx` — migrated to BottomSheet |
| QuoteDetailModal | `components/community/QuoteDetailModal.tsx` — migrated to BottomSheet |
| EditorialSheet | `components/community/EditorialSheet.tsx` — full-bleed hero + CTA for editorial cards |
| InternalLinkCard (in FeedItemCard) | Inline component inside `FeedItemCard.tsx` — mirrors web `InternalLinkCard`: bordered pill with 90px feature image left, gold "MOVEEE MAGAZINE" label, title, excerpt. Used at bottom of EditorialCard. |
| MagazineScreen (enhanced) | `screens/magazine/MagazineScreen.tsx` — category strip, featured hero, horizontal sections, issues, series |
| IssuesArchiveScreen | `screens/magazine/IssuesArchiveScreen.tsx` — latest issue hero + 2-col grid |
| MagazineSearchScreen | `screens/magazine/MagazineSearchScreen.tsx` — search bar + category strip + results |
| ArticleScreen (enhanced) | `screens/magazine/ArticleScreen.tsx` — progress bar, sticky header, hero controls, pull quote, Pro gate, "Article complete!" banner, series strip, TOC FAB bottom sheet |
| ConfirmDialog | `components/ui/ConfirmDialog.tsx` — reusable modal dialog, supports destructive variant |
| Toast system | `components/ui/Toast.tsx` + `components/ui/ToastContainer.tsx` + `hooks/useToast.ts` — 4 types with animated progress bar |
| ContextMenu | `components/ui/ContextMenu.tsx` — 200px floating menu with divider before destructive actions |
| ReportPostSheet | `components/community/ReportPostSheet.tsx` — 3-option radio sheet, submits to community/report |
| ForYouExplainerSheet | `components/community/ForYouExplainerSheet.tsx` — sparkle icon + serif title + interests CTA |
| Location features | ConnectFeedScreen: region chip strip (All/Africa/Diaspora UK/US/Europe) defaults to user's region; EventsScreen: city filter + local sort; MemberDirectoryScreen: city chip strip; MemberSettingsScreen: newsletter segment auto-derived from countryOfResidence |
| Reputation privileges | Feed boost for high-rep authors; Taste Maker skips new-member queue; Poll/Itinerary gated at 2500 rep (PHP + mobile UI 🔒); Perk min_rep_tier gating; Culture Authority can nominate for Culture Icon |

### What is missing (priority order)
1. MembershipScreen IAP wiring (Google Play Billing + App Store IAP) — low priority; current behaviour directs users to the web to upgrade

### Event template endpoint note
Event image upload: `POST https://themoveee.com/api/events/upload-image`
Event submit: `POST https://themoveee.com/api/events/member-submit`
Both go via the Next.js proxy (NOT WordPress directly). The `PROXY` constant
(`"https://themoveee.com/api"`) is defined at the top of NewPostScreen.tsx.
All other post templates submit to `${CULTURE_API}/community/submit` (WordPress directly).

### Passkey key notes
- Registration: `GET ${PROXY}/auth/passkey/register-options` → `Passkeys.create(options)` → `POST ${PROXY}/auth/passkey/register-verify`
- Verify body shape: `{ id, rawId, type, clientDataJSON, attestationObject, transports, device_name }`
  (`credential.response` fields flattened to top level; `device_name` = `Platform.OS === "ios" ? "iPhone" : "Android"`)
- `transports` must be cast as `any` — the `CreationResponse` type from `react-native-passkeys` doesn't expose it directly
- Delete uses `api.delete(url, { credential_id })` — `api.delete` now accepts an optional body parameter
- Auth store updated immediately after success: `updateUser({ hasPasskey: true, passkeyCount: ... })`
- User-cancel from native prompt returns `null` from `Passkeys.create()` — must check before proceeding; also guard `e?.message?.includes("cancel")` in the catch block
- `Passkeys.isSupported()` returns false on simulators and old OS versions — show warning banner rather than crashing

### Games key notes
- Both Trivia and Who Said It use MMKV (`storage` from `src/store/storage.ts`) for played-today detection — keys `trivia_last_played_date` / `wsi_last_played_date` (ISO date string, e.g. `2026-06-09`)
- Trivia score is also persisted in `trivia_last_score` so the "already played" screen can show it
- Both games fetch from `${PROXY}/games/trivia/daily` and `${PROXY}/games/who-said-it/daily` — routed through Next.js proxy with user JWT
- GamesStack wraps GamesList + TriviaGame + WhoSaidIt; navigation name in tab is "Games" → resolves to GamesStack
- EventsScreen fetches directly from WordPress CPT REST (no auth required): `https://cms.themoveee.com/wp-json/wp/v2/culture_event?per_page=50&status=publish&_embed=1`
- EventDetailScreen RSVP posts to `${PROXY}/events/rsvp` (Next.js proxy)

### Phase 8 key notes
- `useFeedRecommendations.ts` is a direct port of `lib/feed-recommendations.ts` — keep them in sync
- `react-native-svg` and `react-native-qrcode-svg` are now installed
- AnalyticsScreen uses `react-native-svg` for SVG bar/line charts — no external charting lib
- Notification bell polls `/api/notifications/count` every 30s via `useNotificationCount` hook
- "For You" badge on community cards: ochre `badgePulseBg` background, `badgePulseText` colour

### Expo SDK version — critical
The mobile app uses **Expo SDK 52** (not 54). The lockfile is the source of truth.
- `expo: ~52.0.0`, `react: 18.3.1`, `react-native: 0.76.9`
- `react-native-passkeys` must be pinned to `0.4.0` (0.4.1 requires Expo 53+)
- **Always regenerate `package-lock.json` from scratch** after changing `package.json` —
  EAS Build uses `npm ci` which only installs what's in the lockfile. If a package is in
  `package.json` but not in the lockfile, it won't be installed.
- To regenerate: `cd /tmp && cp apps/mobile/package.json . && npm install --package-lock-only && cp package-lock.json apps/mobile/`
  (must be outside the monorepo to avoid workspace interference)

### Key gotchas
- The RN app calls **WordPress REST directly** for most endpoints. Wallet/Perks/Passkey endpoints require `CULTURE_API_SECRET` so those must go through Next.js proxy routes at `https://themoveee.com/api/...`
- `patron` = Connect Pro DB value — never rename in code
- `react-native-passkeys` replaces `@simplewebauthn/browser` for WebAuthn in RN
- `react-native-qrcode-svg` for rendering perk QR codes
- Cashout fee is flat 30% (not tiered); `credits_per_gbp` comes from the wallet balance API response — never hardcode
- Phase 8b "For You" scoring is pure client-side TypeScript — `scoreItem()` from `lib/feed-recommendations.ts` on the web; replicate the same algorithm in `src/features/community/useFeedRecommendations.ts`
- Full spec at `docs/moveee-connect-rn-spec.md` — that file is the single source of truth for RN implementation details
- **Shop product data**: fetched from `GET /mobile/shop/products?category=X&page=N` (public, no auth). PHP handler uses `wc_get_product()` (requires WooCommerce). Pro pricing = **10% off** regular price (not 7%). Product badges: `new` (< 14 days old), `pro_early_access` (meta `_pro_early_access`), `sale` (has sale price), `low_stock` (≤ 3 stock). Vendor/maker stored in product meta `_maker_name` and `_maker_city`.
- **Shop multi-currency (live FX, June 2026)**: WooCommerce store currency is GBP — the single source of truth for all `WC_Order` totals. Shop is shown in NGN to Nigeria-resident shoppers via a manually-set admin exchange rate, never a live FX API. Since `/mobile/shop/products`, `/mobile/shop/products/{id}`, and `/mobile/shop/the-edit` all use `__return_true` permission callbacks (no `mobile_permission()` auth), `wp_get_current_user()` is unreliable there — currency must be resolved from an explicit `?country=` query param, not the session. Mobile screens (`ShopScreen.tsx`, `ShopListingScreen.tsx`, `ProductDetailScreen.tsx`, `TheEditScreen.tsx`) append `country=${user.countryOfResidence}` from the auth store to every shop fetch. Backend: `Culture_Mobile_API::resolve_shop_currency($request)` / `::convert_shop_price($gbp, $fx)` in `class-culture-mobile-api.php` — `country === "nigeria"` (case-insensitive) → NGN at `get_option('culture_shop_fx_ngn_per_gbp', 1900)`, else passthrough GBP. Admin rate + fallback flat shipping configured in WP Admin → Culture Community → Payment tab → "Lifestyle Shop" section (`culture_shop_fx_ngn_per_gbp`, `culture_shop_flat_shipping_gbp` options, registered in `class-culture-settings.php`). **When adding any new shop endpoint that returns prices, call `resolve_shop_currency()`/`convert_shop_price()` — don't read `get_woocommerce_currency()` directly.**
- **Cart**: `cartStore.ts` supports full item management (`addItem/removeItem/updateQty/clearCart`). CartScreen uses WooCommerce web checkout via `Linking.openURL()`. **In-house native checkout is in progress** (replacing the hosted-checkout redirect) — see active session notes; not yet complete as of this entry.
- **Dark mode pattern**: ALL screens must use `const c = useColors(); const styles = useMemo(() => createStyles(c), [c]);` where `createStyles(c: ColorPalette)` is defined at module level. **Never use the static `colors.*` import inside `createStyles`** — it bypasses dark mode. Use `c.*` exclusively inside that function.

### Cross-stack navigation rules (critical)
React Navigation stacks are isolated — a screen in ShopStack cannot navigate to a screen registered only in MagazineStack or ConnectStack. Rules:

| From stack | To navigate to | Use |
|---|---|---|
| ShopStack | Article (magazine) | `nav.navigate("Magazine", { screen: "Article", params: { slug } } as any)` |
| ShopStack | Membership (member) | `nav.navigate("Connect", { screen: "Membership" } as any)` |
| Any stack | Login | Only valid from unauthenticated AuthStack — authenticated screens should navigate to Membership instead |

Screens registered per stack (as of latest):
- **ConnectStack**: ConnectFeed, PostDetail, PulseDetail, NewPost, DirectorySubmit, MemberProfile, MemberDirectory, Notifications, Article, MemberDashboard, MemberSettings, Wallet, Coupons, Perks, Membership, Analytics
- **MagazineStack**: MagazineList, Article, IssuesArchive, MagazineSearch
- **ShopStack**: ShopHome, ShopListing, ProductDetail, Cart, Checkout, TheEdit, ShopSearch, MakerProfile, OrderConfirmation
- **GamesStack**: GamesList, TriviaGame, WhoSaidIt, Sudoku, Crossword
- **EventsStack**: EventsList, EventDetail
- **MemberStack**: MemberDashboard, MemberSettings, Wallet, Coupons, Perks, Membership, Analytics

### api.get() / api.post() signature
```ts
api.get<T>(url: string, auth = true)   // second arg is boolean, NOT an options object
api.post<T>(url: string, body: Record<string,unknown>, auth = true)
api.put / api.patch / api.delete       // always authenticated
```
Common mistake: `api.get(url, { auth: false })` — the object is truthy so it injects the Bearer token anyway. Correct: `api.get(url, false)`.

### useNotificationCount hook
Returns `{ unread: number, refresh: () => void }`. The field is `unread`, not `unreadCount`. Destructure as `const { unread } = useNotificationCount()` or alias: `const { unread: unreadCount } = useNotificationCount()`.

### ConnectFeedScreen category chip matching (substring + alias, June 2026)
`matchesCategory()` in `ConnectFeedScreen.tsx` no longer requires an exact string match between
a filter chip (e.g. "Food") and the backend taxonomy term name (e.g. "Food & Drink" from
`culture_dir_type`, or freeform `pulse_category`/WP `category` terms). It now does substring
containment in both directions plus a small `CATEGORY_ALIASES` lookup table for cases substring
matching alone can't catch (e.g. `music` → `album`, `travel` → `place`, `design` → `architecture`).
When adding a new filter chip, check whether it needs an alias entry — substring matching alone
is enough for cases like "Food" ⊂ "Food & Drink".

### theme.ts — available keys
- `shadows`: only `card`, `modal`, `fab` — no `sm`, `lg`, `xl` variants
- `radius`: `sm`(2), `md`(4), `lg`(6), `xl`(12), `"2xl"`(20), `full`(9999) — use bracket notation for `"2xl"`
- `fontSize`: includes `eyebrow`(9) for uppercase labels
- `fonts`: `sans`, `sansBold`, `serif`, `serifBold`, `mono`, `monoBold` — no `sansItalic`/`serifItalic` (use `fontStyle: "italic"` instead)
