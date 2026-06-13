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
- Site tagline: **"Connect to Culture"**
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

Active development branch: `claude/admiring-dirac-lgzivc`
Always commit and push to this branch.

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
- `scoreItem(item, interestTagSet)` → 0–100 score: 50 pts interest match, 30 pts recency (3-day half-life), 20 pts engagement (log scale)
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

## Reputation tier thresholds

Defined in `Culture_Gamification::REPUTATION_TIERS`:
```php
1500 => 'culture-authority',
500  => 'taste-maker',
100  => 'culture-contributor',
0    => 'member',
```
Daily credit cap: `DAILY_CREDIT_CAP = 50` credits per user per day.

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
| FeedItemCard (all templates) | `components/community/FeedItemCard.tsx` (gallery, polls, itinerary, ratings) |
| PostDetailScreen, PulseDetailScreen | `screens/community/` |
| NewPostScreen (all 9 templates) | `screens/community/NewPostScreen.tsx` (post, hidden-gem, cultural-take, food-review, creative-showcase, poll, itinerary, event, quote) |
| Composer sub-components | `components/composer/` (StarRating, MultiRating, PollBuilder, ItineraryBuilder, DirectorySearch) |
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

### Key gotchas
- The RN app calls **WordPress REST directly** for most endpoints. Wallet/Perks/Passkey endpoints require `CULTURE_API_SECRET` so those must go through Next.js proxy routes at `https://themoveee.com/api/...`
- `patron` = Connect Pro DB value — never rename in code
- `react-native-passkeys` replaces `@simplewebauthn/browser` for WebAuthn in RN
- `react-native-qrcode-svg` for rendering perk QR codes
- Cashout fee is flat 30% (not tiered); `credits_per_gbp` comes from the wallet balance API response — never hardcode
- Phase 8b "For You" scoring is pure client-side TypeScript — `scoreItem()` from `lib/feed-recommendations.ts` on the web; replicate the same algorithm in `src/features/community/useFeedRecommendations.ts`
- Full spec at `docs/moveee-connect-rn-spec.md` — that file is the single source of truth for RN implementation details
- **Shop product data**: fetched from `GET /mobile/shop/products?category=X&page=N` (public, no auth). PHP handler uses `wc_get_product()` (requires WooCommerce). Pro pricing = 10% off regular price. Product badges: `new` (< 14 days old), `pro_early_access` (meta `_pro_early_access`), `sale` (has sale price), `low_stock` (≤ 3 stock). Vendor/maker stored in product meta `_maker_name` and `_maker_city`.
- **Cart**: `cartStore.ts` tracks item count for badge only. Full cart uses WooCommerce Store API or web checkout URL (`wc_get_checkout_url()`).
- **Dark mode pattern**: screens use `const c = useColors(); const styles = useMemo(() => createStyles(c), [c]);` where `createStyles(c: ColorPalette)` is defined at module level. Static `colors` import still works for non-themed screens. Only screens converted so far: ConnectFeedScreen, ArticleScreen, MemberDashboardScreen.
