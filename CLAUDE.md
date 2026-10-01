# Moveee — Agent Instructions

This file is read automatically by Claude Code at the start of every session.
It captures project conventions, architecture decisions, and step-by-step
processes for recurring tasks so they can be completed correctly without
re-discovering context.

**This file is a short index now (September 2026), not the full documentation.**
Its size alone was exhausting sessions' context budgets before any real work
could happen, so almost every feature/architecture section was moved out into
two files that are **not** auto-loaded — read only on request:
- `docs/claude-md-reference.md` — full detail for features and architecture
  decisions that are still live/current. Most "See `docs/claude-md-reference.md`
  for full detail" one-liners below point here.
- `docs/claude-md-archive.md` — narrow, closed-out bug-fix passes and old
  "visual rebuild" write-ups with no remaining generalizable lesson; fully
  historical, safe to ignore unless you're specifically digging into why
  something is the way it is.

**When you need the detail behind a one-liner, read the matching section in
whichever file it points to — don't guess from the heading alone.** And when
you add new material to this project: if it's a short, universal convention
or gotcha (like the ones kept in this file), add it here; if it's a
feature-specific writeup, add it to `docs/claude-md-reference.md` instead and
leave only a one-line pointer here. Don't let this file re-accumulate the
bloat it was just cut down from.

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
| `apps/connect` | **Moveee** | `web.themoveee.com` |
| `apps/mobile` | **Moveee** | iOS / Android |

- `apps/site` is always called **Moveee Magazine** in user-facing copy, metadata, and JSON-LD.
- `apps/connect` and `apps/mobile` are both just **Moveee** — no sub-brand qualifier.
- Never use "Moveee Connect" as a product name.
- Site tagline (Moveee Magazine): **"Best in Culture"**
- App tagline (Moveee): **"Connect to Culture"**
- Brand description framing: universal — do not describe the brand as specifically African,
  Black, Nigerian, or "diaspora" in metadata, SEO copy, AI prompts, or any other user-facing
  text. The content and community speak for themselves.
  Use language like: *"an independent magazine and community for people who live for culture."*
  **Read the "Brand language" section immediately below before writing or copying ANY
  copy** — this one-line rule is not enough on its own; it has been violated repeatedly
  (see that section for why and how to actually not repeat it).

---

## Brand language — content favours African/Black/Caribbean diaspora; public copy does not announce it

See `docs/claude-md-reference.md` for full detail.

## Project overview

Next.js 15 (App Router) frontend + WordPress headless CMS backend.
WordPress runs the `culture-community` plugin (custom CPTs, REST API, email
queue, analytics). The frontend fetches via GraphQL (WPGraphQL) with a REST
fallback. Members have two tiers: **Moveee Citizen** (free, `citizen` in DB)
and **Moveee Pro** (paid, `patron` in DB — the DB value is `patron` but all
user-visible copy says "Moveee Pro" or "Pro").

This is a **Turborepo monorepo** (as of June 2026).

Key paths:
- `apps/site/` — Site A: Moveee Magazine at themoveee.com (Editorial + Shop, no auth)
  - `app/` — pages and route handlers
  - `components/` — Site A-only components (Header, CartDrawer, HomepageContent…)
  - `lib/fetchHomepageData.ts` — Site A-only homepage fetch
  - `proxy.ts` — edge routing (Next.js 16 replacement for middleware.ts)
- `apps/connect/` — Site B: Moveee at web.themoveee.com (Community + Auth)
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
- Site B project: Root Directory = `apps/connect` → deploys to web.themoveee.com
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

See `docs/claude-md-reference.md` for full detail.

## Newsletter system architecture

See `docs/claude-md-reference.md` for full detail.

## Magic-code sign-in + subscribe — every `<SubscribeForm>` on the site (September 2026)

See `docs/claude-md-reference.md` for full detail.

## The Moveee Literary (`/literary`, added September 2026)

See `docs/claude-md-reference.md` for full detail.

## Literary About Us + Submissions pages — real copy from The Moveee's editors (September 2026)

See `docs/claude-md-reference.md` for full detail.

## Literary Submissions Manager — admin tool, mechanics still current (intake model superseded below)

See `docs/claude-md-reference.md` for full detail.

## Literary Submissions — real payment-integrated online form replaces email intake entirely (September 2026)

See `docs/claude-md-reference.md` for full detail.

## Literary "Browse by Section" + Submissions cover — colourful illustrated covers, no more abbreviations (September 2026)

See `docs/claude-md-reference.md` for full detail.

## The Moveee Commons (`/commons`, added September 2026)

See `docs/claude-md-reference.md` for full detail.

## Moveee Magazine content gate — swapped to the same magic-code system as /literary (September 2026)

See `docs/claude-md-reference.md` for full detail.

## Process: adding a new newsletter

See `docs/claude-md-reference.md` for full detail.

## Hidden / opt-out newsletter lists (e.g. "Announcements", added June 2026)

See `docs/claude-md-reference.md` for full detail.

## CSS custom properties (from globals)

```css
var(--ink)        /* #14110d — primary dark text / dark backgrounds */
var(--paper)      /* #f3ece0 — primary light background */
var(--paper-deep) /* slightly deeper paper, for card backgrounds */
var(--ochre)      /* #7a241c — accent brick/oxblood red (changed from rust #c5491f — see note below) */
var(--ochre-deep) /* #5c1b15 — deeper/hover shade of --ochre, same value as --lit-oxblood-deep */
var(--gold)       /* #b38238 — accent gold/amber, distinct from ochre */
var(--rule)       /* border colour, subtle */
var(--mute)       /* muted text */
var(--ink-soft)   /* softer body text */
```

**Correction (June 2026):** this table previously listed `var(--ochre)` as `#b38238`
(amber) — that was wrong. `--ochre` and `--gold` are two distinct tokens. This matches
the Figma Make mockups' own Tailwind config exactly. If a future rebuild pass seems to
find an "ochre vs gold mismatch" between mockups and the live CSS, check the real
`globals.css` values first — they likely already match; don't assume the stale value
once documented here.

**Ochre recolored from rust to brick/oxblood (September 2026).** `--ochre`/`--color-ochre`
(and their Tailwind `ochre.DEFAULT` mirrors) changed from `#c5491f` (rust) to `#7a241c`
(a dark brick/oxblood — the same hue already used as `--lit-oxblood` for The Moveee
Literary vertical, see that section below) across `apps/site`, `apps/connect`,
`packages/shared`, and `apps/mobile`'s `theme.ts` (`colors.ochre`) — this is the
site-wide heading/accent/CTA color, not just a Literary-section-specific one. `--ochre-deep`
(hover/pressed shade) changed from `#8a2d10` to `#5c1b15` — reusing `--lit-oxblood-deep`'s
exact value for the same reason. `apps/connect/app/globals.css`'s dark-mode override block
(`--ochre`/`--ochre-deep` at a lighter value for legibility against a dark background) was
recalculated proportionally: `#954f49`/`#7d4944` (was `#d4603a`/`#a83f20`). Every literal
hex occurrence of the four old values (`#c5491f`, `#8a2d10`, `#d4603a`, `#a83f20`) across
`apps/site`, `apps/connect`, `apps/mobile`, and `packages/shared` — not just the CSS
variable definitions — was swept and replaced with its new counterpart, including
`packages/shared/lib/gemini.ts`'s illustration-generation prompt (which names the brand
palette literally, so AI-generated art keeps matching the new accent). `--gold` (`#b38238`,
amber) is unrelated and untouched — this only recolors the ochre/rust token, not every
warm accent on the site. A handful of one-off literal fallback hexes on `var(--ochre-deep,
#a83d18)`-style CSS fallbacks (a slightly different literal than the four swept above)
were left as-is — harmless, since `--ochre-deep` is always defined at `:root` so the
fallback never actually triggers.

The `/newsletter` page and all newsletter-related pages must use paper
backgrounds only. No `var(--ink)` background on any section of the list page.
Dark backgrounds are only acceptable for: buttons, hover states, and
single-issue page components (`.gml-issue-hero`, `.digest-sidebar-card.dark`).

---

## Border-radius convention (site-wide, June 2026 — supersedes the old flush/rectangular look)

**Rounded corners are now the default everywhere it's feasible** — cards, buttons, badges,
images, inputs, panels, pills. Several Site A surfaces (`apps/site/app/makers/makers.css`,
`legal.css`, `not-found.css`, `pulse-layout.css`, `sections.css`,
`components/CartDrawer.css`) previously had **zero** `border-radius` anywhere — a deliberate
flush-rectangle editorial aesthetic. That aesthetic is retired; do not introduce new flush,
hard-cornered components, and apply radius retroactively when touching any of the files above.

Canonical radius scale — same values on both web apps and mirrors
`apps/mobile/src/theme.ts`'s `radius` object exactly, so all three surfaces stay visually
consistent:

```css
var(--radius-sm)    /* 2px  — hairline elements, small chips */
var(--radius-md)    /* 4px  — inputs, small buttons, thumbnails */
var(--radius-lg)    /* 6px  — standard cards, buttons */
var(--radius-xl)    /* 12px — larger cards, modals, image frames */
var(--radius-2xl)   /* 20px — hero panels, prominent CTAs */
var(--radius-full)  /* 9999px — pills, avatars, dots */
```

Defined as CSS custom properties in both `apps/site/app/globals.css` and
`apps/connect/app/globals.css` `:root`/`@theme` blocks — use `var(--radius-*)`, never a
hardcoded px value, in new or edited CSS. `apps/mobile`'s `theme.ts` `radius` object
(`sm`(2)/`md`(4)/`lg`(6)/`xl`(12)/`"2xl"`(20)/`full`(9999)) is the source of truth this scale
mirrors — if the mobile scale ever changes, update both web `globals.css` files to match.

When writing or updating a Figma Make prompt (`docs/figma-make-prompts.md` /
`docs/figma-make-prompts-web.md`), do not describe any new surface as "flush" or
"no border-radius" — use the scale above instead. Existing prompt sections that documented the
old flush aesthetic (e.g. the Maker storefront and Shop sections) should be treated as
superseded by this convention going forward.

---

## Vendor dashboard — shipping zones + analytics gotchas (fixed June 2026)

See `docs/claude-md-reference.md` for full detail.

## Vendor shipping-zone ownership (June 2026)

See `docs/claude-md-reference.md` for full detail.

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

## Optimole lazy-load breaks CMS images on every non-browser consumer (fixed August 2026)

See `docs/claude-md-reference.md` for full detail.

## Key conventions

- Internal tier value is `patron` — never rename it in PHP or the DB.
  All user-facing copy uses "Moveee Pro" / "Pro". A third tier, `lit`
  (Moveee Lit — full access to The Moveee Literary only, see "Three-tier
  membership" above), joined `citizen`/`patron` in September 2026 — same
  rule applies, never rename it either.
- "Cultural Digest" / "The Cultural Digest" is the old name — do not use it.
  Use "GetMeLit" and "Culture Drop" specifically, or "Moveee newsletters"
  generically.
- Newsletter post meta `_culture_nl_list` defaults to `culture-drop` (the
  flagship). Always set it explicitly on new posts.
- The subscriber count in the Send Newsletter meta box updates live when the
  list or segment dropdown changes (JS reads `data-counts` on the box div).
- Segment codes: `us` `uk` `ng` `gh` `ca` `au` — empty string = all segments.

---

## Site A (`apps/site`) SEO title/description brand-suffix cleanup (August 2026)

See `docs/claude-md-reference.md` for full detail.

## Figma Make prompt files (split into mobile vs. web, June 2026)

See `docs/claude-md-reference.md` for full detail.

## Git branch

Active development branch: `claude/sweet-ritchie-xr21c3` (merged to main 2026-06-15)
New work: create a fresh branch from main or use whatever branch is specified at session start.

---

## Reaction consistency fix (June 2026)

See `docs/claude-md-reference.md` for full detail.

## @mentions system (June 2026)

See `docs/claude-md-reference.md` for full detail.

## Site architecture — split complete

See `docs/claude-md-reference.md` for full detail.

## Connect App build phases

See `docs/claude-md-reference.md` for full detail.

## Mobile quote-share QR code led to a 404 — wrong URL pattern for native quotes (fixed September 2026)

See `docs/claude-md-reference.md` for full detail.

## Quotes link to the Directory (September 2026)

See `docs/claude-md-reference.md` for full detail.

## Quotes feed merge — synthetic system author + seeding retirement (September 2026)

See `docs/claude-md-reference.md` for full detail.

## `/quotes` standalone product retired — bare permalink kept as a share/SEO target (September 2026)

See `docs/claude-md-reference.md` for full detail.

## Raw `cms.themoveee.com/{slug}/` links now redirect to the real frontend URL (September 2026)

See `docs/claude-md-reference.md` for full detail.

## Cron / scheduled jobs — split ownership between WP-Cron and cron-job.org (June 2026)

See `docs/claude-md-reference.md` for full detail.

## Front-end draft preview — Next.js Draft Mode for magazine articles + Lifestyle products (September 2026)

See `docs/claude-md-reference.md` for full detail.

## Byline Contributor role + Guest Byline field (September 2026)

See `docs/claude-md-reference.md` for full detail.

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

## Connect app feed route (`/feed`, renamed 2026-06-21)

See `docs/claude-md-reference.md` for full detail.

## Connect app left-nav rail (replaces the top header, July 2026)

See `docs/claude-md-reference.md` for full detail.

## Footer removed sitewide (Connect web only, July 2026)

See `docs/claude-md-reference.md` for full detail.

## App download nudge (Connect web only, June 2026)

See `docs/claude-md-reference.md` for full detail.

## Plugin DB table auto-upgrade (critical — June 2026)

`culture-community.php` deploys via direct file sync to the Lightsail server, not
the WP plugin repo, so `register_activation_hook()` only fires on a manual
deactivate/reactivate in WP Admin — a code deploy alone never runs it. Every
`dbDelta` table lives in `Culture_Activator::create_tables()`, which was previously
**only** called from that activation hook. Any table added after a site's initial
activation (e.g. `wp_culture_follows`) would silently never get created in
production — inserts/reads against the missing table fail with no visible error
(`$wpdb` suppresses errors by default), so features looked like they "didn't save"
(e.g. Follow button showing 0 followers and reverting after reload).

**Fixed**: `culture_community_maybe_upgrade()` in `culture-community.php`, hooked
on `plugins_loaded`, compares the `culture_db_version` option to `CULTURE_VERSION`
and re-runs `Culture_Activator::create_tables()` on mismatch — `dbDelta` itself is
idempotent, so this is safe to run on every version bump going forward. **Any new
dbDelta table must still go through this same path** (just add it inside
`create_tables()`) — no further wiring needed. If a feature backed by a custom
table looks broken in production after a deploy, suspect this first: confirm the
table actually exists (`SHOW TABLES LIKE 'wp_culture_%'`) before debugging the
application logic.

---

## Chapter Leader system removal (June 2026)

See `docs/claude-md-reference.md` for full detail.

## VIP Club Upgrade — Phase Status

See `docs/claude-md-reference.md` for full detail.

## Phase 8a — Notifications architecture

See `docs/claude-md-reference.md` for full detail.

## Phase 8b — Feed recommendations

See `docs/claude-md-reference.md` for full detail.

## Phase 8c — Member analytics

See `docs/claude-md-reference.md` for full detail.

## Feed card offcanvas detail modals

See `docs/claude-md-reference.md` for full detail.

## Profile cover photo

See `docs/claude-md-reference.md` for full detail.

## Mobile image uploads → Cloudflare R2 (June 2026)

See `docs/claude-md-reference.md` for full detail.

## Follow system (June 2026)

See `docs/claude-md-reference.md` for full detail.

## Events/Happenings web surface — full visual rebuild (`evt-*` namespace, June 2026)

See `docs/claude-md-reference.md` for full detail.

## Event Spotlight carousel (June 2026)

See `docs/claude-md-reference.md` for full detail.

## Editorial event self-checkin (`culture_event` CPT — separate from Literati Connect / Stoop)

See `docs/claude-md-reference.md` for full detail.

## Event system enhancements

See `docs/claude-md-reference.md` for full detail.

## Composer redesign — modal-first flow + dedicated page (web, July 2026)

See `docs/claude-md-reference.md` for full detail.

## Hubs vs. Stoop — the two community axes (product positioning, September 2026)

See `docs/claude-md-reference.md` for full detail.

## Hubs — user-created topic communities

See `docs/claude-md-reference.md` for full detail.

## Community event RSVP (free, capacity-limited — June 2026)

See `docs/claude-md-reference.md` for full detail.

## NewPostScreen composer — template field reference (v2, June 2026)

See `docs/claude-md-reference.md` for full detail.

## Reputation tier thresholds

See `docs/claude-md-reference.md` for full detail.

## Public profiles (`app/connect/[username]/`)

See `docs/claude-md-reference.md` for full detail.

## Community post full page (`app/community/[slug]/`)

See `docs/claude-md-reference.md` for full detail.

## Discover (directory browse feature, June 2026)

See `docs/claude-md-reference.md` for full detail.

## Stoop marketing landing page (`/stoop`, Site A, September 2026)

See `docs/claude-md-reference.md` for full detail.

## Reading Tracker (StoryGraph-style shelves/mood/pace/stats) — Phases 1–4 shipped, September 2026

See `docs/claude-md-reference.md` for full detail.

## Interest taxonomy (canonical slugs)

See `docs/claude-md-reference.md` for full detail.

## Auth flow — full visual rebuild onto the composer design system (`auth-*`, July 2026)

See `docs/claude-md-reference.md` for full detail.

## Registration flow (redesigned)

See `docs/claude-md-reference.md` for full detail.

## Sign-in and registration — one-time codes are the default (September 2026)

See `docs/claude-md-reference.md` for full detail.

## Google Sign-In (June 2026)

See `docs/claude-md-reference.md` for full detail.

## Sign in with Apple (September 2026)

See `docs/claude-md-reference.md` for full detail.

## Account deletion (August 2026)

See `docs/claude-md-reference.md` for full detail.

## Google Play Billing — Moveee Pro upgrade on Android (August 2026)

See `docs/claude-md-reference.md` for full detail.

## Sentry error tracking (mobile, August 2026)

See `docs/claude-md-reference.md` for full detail.

## Passkeys (WebAuthn) — never worked on native, missing platform setup (fixed August 2026)

See `docs/claude-md-reference.md` for full detail.

## Community feed spam protection

See `docs/claude-md-reference.md` for full detail.

## moveee-connect React Native app — current state

See `docs/claude-md-reference.md` for full detail.


---

## Expo SDK 52 → 57 upgrade (September 2026) — authoritative over all SDK-52-era notes above

See `docs/claude-md-reference.md` for full detail.
