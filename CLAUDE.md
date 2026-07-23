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
| `apps/connect` | **Moveee** | `web.themoveee.com` |
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

### Brand architecture (as of 2026-06-21)

- **Moveee** is the primary product brand — the community and discovery platform
  (apps/connect + apps/mobile). It is never called "the app", "Connect", or "the Moveee
  Connect app" in user-facing copy. Just **Moveee**. Site/page metadata (titles,
  descriptions, OG tags) should lead with Moveee, not with "magazine".
- **Moveee Magazine** is the editorial arm (apps/site editorial content) — secondary to
  Moveee in marketing copy, but still gets a real spotlight treatment (e.g. Latest Issue
  card) wherever it appears.
- **Literati Connect** is a *separate* offering — the name for city-by-city physical
  meetup clusters of Moveee members. Do not confuse this with the Moveee product itself,
  and do not use "Connect" alone to refer to the app/platform — "Connect" as a bare noun
  now belongs to Literati Connect. **Full planning doc (read before any build work on
  this feature): `docs/literati-connect-plan.md`** — covers Literati Connect (monthly,
  city-wide — reuses the existing editorial `culture_event` CPT) and Stoop
  (weekly, area-cluster — new `culture_cluster` CPT, open to all tiers, three
  host-selection mechanisms: appointed/self-nominated/elected, overflow joining when a
  home-area cluster is full, QR-based weekly check-in mirroring the Perks redemption
  pattern). **Renamed from "Stoop" to "Stoop" (2026-07-08)** — copy-only
  rename, same pattern as the Culture Credits/Reputation Points rename below: the
  `culture_cluster` CPT, `_cluster_*` meta keys, `Culture_Clusters` PHP class, DB table
  names, badge trigger keys (`cluster_regular`, `city_convener`), action keys
  (`cluster_founded`, `cluster_checked_in`, `cluster_host_served`), notification type
  keys, and REST route paths (`/cluster/...`) are all unchanged — only user-facing copy
  and file names literally named after the old brand (`Stoop.tsx`,
  `StoopReminderCard.tsx`, formerly `Stoop.tsx`/`StoopReminderCard.tsx`)
  were updated. "Street-level" framing was also changed to "area-level" throughout —
  the underlying `_cluster_street` meta field and its form labels/state vars are
  untouched (still literally collecting a street name), only the *scope* language
  changed. Status as of 2026-06-21: Phases 1–5 complete end-to-end (backend + mobile +
  web) — Stoop CPT/membership/host-election/QR check-in (1–3), rewards +
  badges + notifications + cron (4), and the Literati Connect integration + feed
  surfacing (5 — attendance-sweep cron/reward, Discover/Events rail, Stoop
  feed reminder card) are all live. The feature is fully shipped. See the plan doc's
  own status line for the authoritative, up-to-date detail — keep this summary in sync
  with it rather than re-deriving phase status here.

  **Marketing landing page (added 2026-07-08):** `/connect` (`apps/connect/app/connect/page.tsx`)
  is now a real page — a from-scratch landing page (no mockup, built to match the existing
  `mco-*`/`con-btn-*` design system already used by `/connect/people` and
  `/connect/membership`) introducing both offerings side by side, a 4-step "how Stoop
  works" explainer, the two badges (Cluster Regular, City Convener), and CTAs
  into `/connect/people` (Stoop) and `/events` (Literati Connect's rail). New
  page-scoped CSS: `apps/connect/app/connect/connect-landing.css` (`lc-*` namespace).
  This required removing the old `pathname === '/connect'` → `/feed` back-compat redirect
  in `apps/connect/proxy.ts` (see "Connect app feed route" above) — `/connect` is no longer
  just a legacy alias, it's a real destination now. A "Literati Connect" link was added to
  the shared `mco-section-nav` row on `/connect/people`, `/connect/membership`, and the
  logged-out `ConnectHero.tsx` (feed hero) so the page is reachable in-app, not just by
  direct URL.

  **Host onboarding flow (added 2026-06-25):** a 5-step pre-creation journey runs
  before the cluster creation form, collecting: (1) country (UK/Nigeria/Other — drives
  context-aware copy in subsequent steps), (2) venue type (home/café/coworking/other)
  + optional host note, (3) realistic gathering capacity (2–20) + step-free access
  toggle, (4) locality commitment checkbox (`_cluster_host_locality_confirmed`),
  (5) address visibility (members_only/on_request/area_only). New meta fields:
  `_cluster_venue_type`, `_cluster_host_note`, `_cluster_realistic_capacity`,
  `_cluster_accessible`, `_cluster_address_visible`, `_cluster_host_locality_confirmed`.
  Mobile: `HostOnboardingScreen.tsx` (`screens/community/`) → `StartClusterScreen`
  (accepts params, shows compact summary card, removed "How it works" block).
  `MemberDirectoryScreen`'s "Start" buttons now route to `HostOnboardingScreen`.
  Web: `/cluster/create` (`app/cluster/create/page.tsx` + `CreateClusterClient.tsx`
  in `apps/connect`). `Stoop.tsx`'s inline `StartClusterModal` removed —
  "Start" buttons are now `<Link href="/cluster/create">`.
  CSS namespace: `hfc-*` in `apps/connect/app/member.css`.
- **Tier names renamed (2026-06-21): `Connect Citizen`/`Connect Pro` → `Moveee
  Citizen`/`Moveee Pro` everywhere in user-facing copy** (web, mobile, PHP-generated
  emails/admin labels) — this superseded the prior naming and is now fully applied
  repo-wide. Internal DB/PHP values (`patron`, `citizen`) are unchanged, per the table
  below. The `/connect` route *path* in `apps/connect` also changed: the feed itself
  moved from `/connect` to `/feed` (see "Connect app feed route" below) — `/connect`
  is now only the parent path for the `people`, `membership`, `perks`, and `[username]`
  sub-routes, plus a back-compat redirect to `/feed` for the bare path.
- The header in `apps/connect/components/Header.tsx` no longer renders a "Connect"
  badge next to the logo (removed 2026-06-21, consistent with "Connect" no longer
  referring to the Moveee platform itself).

| Internal DB value | User-visible label |
|---|---|
| `patron` | Moveee Pro / Pro |
| `citizen` | Moveee Citizen / Citizen |
| `getmelit` | GetMeLit |
| `culture-drop` | Culture Drop |
| `credits` (gamification ledger) | **Culture Credits (Cr)** |
| `reputation` (gamification score) | **Reputation Points (Pt)** |

Never change the internal DB/PHP values (`patron`, `citizen`, `getmelit`,
`culture-drop`, `credits`, `reputation`, `credit_ledger`, `award_credits`,
`REPUTATION_TIERS`, etc.). Only change user-visible copy.

**Credits/Reputation rename (user-facing only):** what used to be shown to users as
"credits" is now **"Culture Credits"**, abbreviated **"Cr"** (e.g. `+15 Cr`). What used
to be shown as "reputation" is now **"Reputation Points"**, abbreviated **"Pt"** (e.g.
`280 Pt`). This is copy-only — `class-culture-gamification.php`, the `credit_ledger`
table, `award_credits()`/`award_reputation()`, `REPUTATION_TIERS`, the `credits`/
`reputation` fields in the NextAuth session shape, and all REST/API field names stay
exactly as they are. Only labels, button text, card titles, and chart legends in
user-visible UI change. As of 2026-06-20 this has only been applied to
`docs/figma-make-prompts-web.md` Section 1 (moved there in the June 2026 mobile/web prompt-file
split — see "Figma Make prompt files" below) — a full sweep of `apps/site`, `apps/connect`,
`apps/mobile`, and `packages/shared` UI copy (gamification feature descriptions, wallet/
analytics pages, badge/credit toast messages, membership perk copy) is still pending.

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

### Newsletter Hub page — rebuilt from mockup (July 2026)

`mockups/web/newsletter_hub_2.html` (mobile 390px frame, "2. Newsletter Hub (Mobile 390px)")
uploaded, and `apps/site/app/newsletter/page.tsx` was rebuilt section-by-section to match it
rather than patched — several sections that existed on the old hub but aren't in the mockup
were removed outright, not just supplemented:

- **Masthead** — copy aligned to the mockup ("Two newsletters. One cultural obsession.") and a
  new `.nl-masthead-pills` row (two cadence pills, "★ Culture Drop · Every Tuesday" /
  "★ GetMeLit · Mon–Sat") added below the subhead. Stacks full-width at `max-width: 640px`.
- **Subscribe cards** — the old inline `.nl-card-features` bullet list is **removed** from both
  cards (that content moved into the new "Inside the programme" section below); GetMeLit's card
  eyebrow/note corrected from stale "Weekly" copy to "Daily · Mon–Sat" (matches its real cadence
  in `NL_META` and the mockup). Each card still ends with a `.nl-card-preview` mock (flat,
  non-tilted variant of `NewsletterPublicationPage.tsx`'s `.np-preview-card`, rendered by a new
  `NlCardPreview` component) sourced from `NL_META` rather than hardcoded copy.
- **Testimonials** — new `.nl-testimonials`/`.nl-testimonial-card` section (stacked cards on
  mobile, 3-up row at `min-width: 720px`), inserted right after the cards. Styled as its own
  `paper-warm` rounded-card block rather than reusing `NewsletterPublicationPage.tsx`'s flat,
  card-less `.np-testimonials` — the mockup wants the card treatment.
- **"Inside the programme"** (new `.nl-inside-*` block) — **replaces** the old desktop-only
  `.gml-whats-inside` pillars grid, the `.gml-pull-band` pull-quote, and the standalone
  `.nl-culturedrop-feature` GetMeLit section entirely. One section, two columns ("Inside Culture
  Drop" / "Inside GetMeLit"), each a list of 4 items with a colored left bar — sourced directly
  from `NL_META[...].pillars`, no fabricated copy. GetMeLit's items get a Daily/Sat cadence tag
  per item (`GETMELIT_ITEM_TAGS`, matching the mockup's per-row cadence badges); Culture Drop's
  don't, since all four of its sections ship in the single weekly Tuesday issue.
- **Recent issues** — rebuilt as `.nl-recent-*` (was `.gml-recent`/`.gml-issue-card`, Culture
  Drop-only). Now shows the 3 most recent issues **across both lists** with a colored
  `nl-list-badge` per card, matching the mockup's mixed grid; "See all →" links to `#archive` on
  the same page instead of `/newsletter/culture-drop`.
- **Coming Soon** — unchanged, already matched the mockup closely.
- **Archive** — tabs get a `max-width: 640px` override into scrollable pills
  (`.nl-archive-tab--active` → filled `var(--ink)` pill), and the date column
  (`.digest-archive-date`) is hidden at that width to match the mockup's mobile row (number +
  title + badge + arrow only, no date). Note: `.digest-archive-tags` (the badge) was already
  being hidden below `1024px` by a **pre-existing, unrelated** rule higher up in the file (the
  old "Cultural Digest" section) — that rule is overridden back to visible at `max-width: 640px`
  specifically for this archive, since the mockup keeps the badge.
- **`EditionNewsletterHub.tsx`** (the `/newsletter/uk`, `/us`, `/africa` pages) has since been
  rebuilt to the same design in a follow-up pass — see below. The old `gml-whats-inside`/
  `gml-pull-band`/`gml-recent`/`nl-culturedrop-feature` CSS blocks are still not deleted (kept in
  case anything else ever needs them), just unused by both newsletter components now.
- Not visually verified in a browser (no WordPress/env credentials in this pass) — verified via
  `tsc --noEmit` (clean) and a CSS brace-balance check on `newsletter.css`.

### Edition newsletter hubs (`/newsletter/uk`, `/us`, `/africa`) — rebuilt + region-scoped (July 2026)

`EditionNewsletterHub.tsx` got the same section-by-section rebuild as the global hub above
(masthead pills, no inline features list, `NlCardPreview`, testimonials, the unified "Inside the
programme" block — with Culture Drop's Calendar item still overridden per edition via
`EDITION_CONFIG[edition].calendarDesc` — mixed-list Recent Issues, Coming Soon, pill archive tabs).

**Region-scoping (new, closes a real gap):** before this pass, every edition page fetched and
displayed the exact same global newsletter archive — `_culture_nl_segment` (the post meta that
already exists for the WP-Cron send queue to filter subscribers by region, see "Newsletter system
architecture" above) was never exposed to the frontend at all, so there was no data to filter by.
Fixed:
- `culture-community/includes/core/class-culture-post-types.php` — `_culture_nl_segment` now
  `register_post_meta`'d with `show_in_rest: true` (mirrors `_culture_nl_list` immediately above
  it), plus a mirrored `nlSegment` GraphQL field on `CultureNewsletter` (same
  `register_graphql_field` pattern as the existing `nlList` field, needed because WPGraphQL's
  generic `metaValue()` resolver blocks underscore-prefixed meta keys).
- `packages/shared/lib/wp.ts` — `nlSegment` added to `NEWSLETTER_FIELDS_FRAGMENT` (GraphQL path)
  and to `mapRestNewsletterToFrontendShape()` (REST fallback path) — both newsletter data paths
  needed the field added, same as every other newsletter field in this file.
- `EditionNewsletterHub.tsx` — new `EDITION_SEGMENTS` map (`uk → ["uk"]`, `us → ["us","ca"]`,
  `africa → ["ng","gh"]`, derived from `packages/utils/editions.ts`'s existing country groupings)
  filters the fetched newsletters down to issues whose `nlSegment` is one of the edition's
  segments **or empty** (empty segment = sent to everyone, per the existing segment convention) —
  applied once, before `allCount`/`cdCount`/`gmlCount`/recent issues/the archive list are derived,
  so the whole page (counts, tabs, cards, archive rows) is consistently region-scoped rather than
  just the visible list.
- No `CULTURE_VERSION` bump needed — this only registers meta/GraphQL field exposure, not a new
  `dbDelta` table (see "Plugin DB table auto-upgrade" above for when a bump *is* required).
- Existing newsletter issues almost certainly have no `_culture_nl_segment` value set today (no
  UI previously surfaced it as a distinguishing factor beyond subscriber-list filtering at send
  time) — so until editors start setting a segment on new issues, edition pages will show
  effectively the same content as the global hub (every issue falls into the "empty segment = all
  regions" bucket). That's expected, not a bug — the plumbing is now in place for region-targeted
  content going forward.

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

## Hidden / opt-out newsletter lists (e.g. "Announcements", added June 2026)

Not every list follows the standard opt-in + frontend-visible pattern above.
**Announcements** (`announcements`) is a general-purpose list for periodic
operational notices that must never be selectable or visible on the public
`/newsletter` archive, and that every subscriber (existing and new) is on by
default unless they explicitly opt out.

This required two deviations from the standard process:

1. **Archive exclusion is a data filter, not a missing tab.** Omitting a
   `NL_LABELS` entry/filter tab is not enough — the "All" tab in
   `apps/site/app/newsletter/page.tsx` renders the full unfiltered
   `newsletters` array. `announcements`-tagged posts are filtered out of that
   array immediately after fetch, before any counts/filtering run:
   ```ts
   newsletters = newsletters.filter((n) => (n.nlList || "") !== "announcements");
   ```
   Do not add `announcements` to `NL_LABELS` or add a filter tab for it — that
   omission is deliberate and permanent, not a TODO.
2. **Default-ON (opt-out) instead of default-OFF (opt-in)** — the subscriber
   data model (`culture_newsletter_subscribers` option) only has an opt-in
   `lists[]` array, no native opt-out flag, so "everyone is on by default" is
   simulated two ways:
   - **One-time backfill** for existing subscribers:
     `Culture_Subscribers::maybe_backfill_announcements()` (gated by the
     `culture_announcements_backfilled` option so it runs exactly once and
     never re-adds the list after a subscriber opts out later).
   - **Default-include on creation** for new subscribers, everywhere a new
     subscriber record can be created: `Culture_Subscribers::merge_subscribers()`
     (covers bulk import, MailPoet sync, WP user import, and
     auto-subscribe-on-registration — all four funnel through this one
     helper) and `handle_newsletter_subscribe()` in `class-culture-rest-api.php`
     (the public-facing REST endpoint used by the website's own subscribe
     forms) both add `'announcements'` to a brand-new subscriber's `lists[]`.
     **Existing** subscribers being added to a *different* list are
     deliberately NOT force-re-added to `announcements` in this code path —
     that would silently undo a prior opt-out.

It otherwise still follows the standard list-registration process above
(send-meta-box dropdown/config, subscriber-list checkbox, queue email footer
label, analytics label, REST `$allowed_lists` arrays, settings preferences
list) — only the archive visibility and default-subscription behavior differ.
If a future newsletter needs the same "hidden + opt-out" treatment, follow
this section instead of (or in addition to) the standard one.

---

## CSS custom properties (from globals)

```css
var(--ink)        /* #14110d — primary dark text / dark backgrounds */
var(--paper)      /* #f3ece0 — primary light background */
var(--paper-deep) /* slightly deeper paper, for card backgrounds */
var(--ochre)      /* #c5491f — accent rust (NOT amber — corrected June 2026, see note below) */
var(--gold)       /* #b38238 — accent gold/amber, distinct from ochre */
var(--rule)       /* border colour, subtle */
var(--mute)       /* muted text */
var(--ink-soft)   /* softer body text */
```

**Correction (June 2026):** this table previously listed `var(--ochre)` as `#b38238`
(amber) — that was wrong. The actual definitions in `apps/connect/app/globals.css`
are `--ochre: #c5491f` (rust) and `--gold: #b38238` (amber) — two distinct tokens.
This matches the Figma Make mockups' own Tailwind config (`ochre: '#C5491F'`,
`gold: '#B38238'`) exactly. If a future rebuild pass seems to find an "ochre vs gold
mismatch" between mockups and the live CSS, check the real `globals.css` values first
— they likely already match; don't assume the stale value once documented here.

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

Two separate bugs in `apps/connect`'s vendor dashboard (`/vendor/shipping`,
`/vendor/analytics`):

1. **Shipping method settings shape.** WooCommerce REST API v3's
   `POST /wp-json/wc/v3/shipping/zones/{zone_id}/methods/{instance_id}` expects
   `settings` as a **flat map of `setting_id => string value`**
   (`{ "cost": "10.00" }`), not a nested object (`{ "cost": { "value": "10.00" } }`).
   `apps/connect/app/vendor/shipping/page.tsx`'s `saveMethod()` was building the
   nested shape, so every save silently no-opped against the real API (the proxy
   route itself, `app/api/vendor/shipping/zones/[zoneId]/methods/[instanceId]/route.ts`,
   was a correct pass-through — the bug was purely in the payload shape built
   client-side). Fixed by building `Record<string, string>` instead.
2. **Analytics pagination + cross-vendor misattribution**
   (`app/api/vendor/analytics/route.ts`). Two compounding issues:
   - Both order-fetch sources (WCFM `wcfmmp/v1/orders` and the WooCommerce v3
     fallback `wc/v3/orders`) were hardcoded to a single page
     (`per_page=100&page=1`) despite a comment claiming intent to paginate —
     any vendor with >100 orders in the selected period silently lost data.
     Fixed with a bounded pagination loop (`MAX_PAGES = 5`, up to 500 orders)
     on both sources.
   - The vendor-line-item match used `!meta || String(meta.value) === vendorId`
     — i.e. "no vendor meta on this line item? count it as this vendor's."
     Core WooCommerce's `/wc/v3/orders` endpoint has **no vendor scoping at
     all** and returns every vendor's orders system-wide; only WCFM tags line
     items with `_vendor_id`/`vendor_id` meta. So whenever the WCFM fetch came
     back empty and the code fell back to the unscoped `/wc/v3/orders` source,
     every other vendor's revenue/order data (all missing vendor meta) got
     misattributed wholesale to whichever vendor was viewing the dashboard.
     Fixed by tracking `usingWcfm` and deriving `strict = !usingWcfm`, threaded
     through `groupByDay()`, `topProducts()`, the `vendorOrders` filter, and
     the aggregation loop: `meta ? String(meta.value) === vendorId : !strict` —
     when on the unscoped fallback, a missing meta key now excludes the line
     item rather than including it.
   - If a future vendor-analytics bug surfaces as "vendor sees other vendors'
     orders" or "numbers don't match WCFM," check first whether the WCFM
     orders fetch is failing/empty (triggering the unscoped fallback) before
     assuming a deeper data issue.

---

## Vendor shipping-zone ownership (June 2026)

WooCommerce shipping zones (`wc/v3/shipping/zones...`) are a global, store-wide
construct with **no native per-vendor scoping** — any vendor calling the existing
`apps/connect` vendor shipping API could previously read/rename/delete/add methods
to **any** zone in the store, not just their own (the routes only checked
`session.user.isVendor`, never which zone belonged to which vendor). Fixed by adding
an ownership-mapping layer entirely outside WooCommerce:

- **DB table**: `wp_culture_vendor_shipping_zones` (`zone_id` UNIQUE, `vendor_id`,
  `created_at`) — created in `Culture_Activator::create_tables()`,
  `CULTURE_VERSION` bumped to `2.7.0` to trigger the table on next deploy (see
  "Plugin DB table auto-upgrade" above).
- **PHP class**: `Culture_Vendor_Shipping_Zones`
  (`includes/core/class-culture-vendor-shipping.php`) — `assign_owner()` (no-op if
  already owned, never overwrites), `get_owner()`, `is_owner()`,
  `get_owned_zone_ids()`.
- **REST endpoints** (`class-culture-rest-api.php`, API-key auth, same convention as
  every other `culture/v1` endpoint): `POST /culture/v1/vendor/shipping-zone-owner`
  (`handle_assign_shipping_zone_owner` — 409 `already_owned` if the zone has a
  different owner) and `GET /culture/v1/vendor/shipping-zone-owner` (
  `handle_get_shipping_zone_owner` — pass `zone_id` for `{vendor_id}`, or
  `vendor_id` for `{zone_ids}`; 400 `missing_param` otherwise).
- **Next.js helper**: `apps/connect/lib/vendor-shipping.ts` — `assertVendorOwnsZone()`,
  `getOwnedZoneIds()`, `recordZoneOwner()`. Uses the `CULTURE_API_SECRET`
  `Authorization: Bearer` convention (not the `wcAuth()` consumer-key query string
  the shipping routes use to talk to WooCommerce itself — these are two separate
  auth mechanisms in the same files, don't conflate them).
- **Enforcement — all 5 vendor shipping operations now ownership-checked**:
  - `app/api/vendor/shipping/zones/route.ts` — `GET` filters the zone list down to
    `getOwnedZoneIds(user.id)` before returning; `POST` calls `recordZoneOwner()`
    immediately after a new zone is created in WooCommerce.
  - `app/api/vendor/shipping/zones/[zoneId]/route.ts` — `PATCH`/`DELETE` both call
    `assertVendorOwnsZone(zoneId, user.id)` right after reading `zoneId` from
    `params`, before doing anything else.
  - `app/api/vendor/shipping/zones/[zoneId]/methods/route.ts` — `POST` (add method)
    same guard.
  - `app/api/vendor/shipping/zones/[zoneId]/methods/[instanceId]/route.ts` —
    `PATCH`/`DELETE` same guard.
- **Backfill decision for pre-existing zones**: deliberately **fail-closed, no
  automatic backfill**. A zone created before this change has no ownership row, so
  `getOwnedZoneIds()` won't include it and `assertVendorOwnsZone()` returns false for
  everyone — such a zone simply won't appear in any vendor's dashboard until an admin
  manually assigns it via `POST /culture/v1/vendor/shipping-zone-owner` (call once per
  orphaned zone with the correct `vendor_id`, e.g. via `wp eval` or a one-off API
  call). This was chosen over guessing an owner from zone name/locale heuristics —
  silently mis-assigning a zone to the wrong vendor would be worse than it being
  temporarily invisible. If a vendor reports a "missing" zone after this ships, that's
  the fix: look up the zone ID and assign it manually.

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
  All user-facing copy uses "Moveee Pro" / "Pro".
- "Cultural Digest" / "The Cultural Digest" is the old name — do not use it.
  Use "GetMeLit" and "Culture Drop" specifically, or "Moveee newsletters"
  generically.
- Newsletter post meta `_culture_nl_list` defaults to `culture-drop` (the
  flagship). Always set it explicitly on new posts.
- The subscriber count in the Send Newsletter meta box updates live when the
  list or segment dropdown changes (JS reads `data-counts` on the box div).
- Segment codes: `us` `uk` `ng` `gh` `ca` `au` — empty string = all segments.

---

## Figma Make prompt files (split into mobile vs. web, June 2026)

Two separate catalogs of structured Figma Make / First Draft prompts, **do not merge them
back together**:

- `docs/figma-make-prompts.md` — **mobile only** (`apps/mobile`, iOS & Android). Sections
  numbered §0–17 + Appendix. Frames are 390×844px iOS throughout.
- `docs/figma-make-prompts-web.md` — **webapp only** (`apps/site` + `apps/connect`). Sections
  numbered independently, starting at §1 (currently §1 Web Homepage, §2 Shop/Lifestyle
  Marketplace Redesign). Frames are desktop 1440px + a mobile-companion 390px frame per screen
  — not the same thing as the mobile app catalog above.

Both follow the same per-section convention: a brand-architecture/scope preamble, a "why this
section exists" rationale grounded in the actual current code, a verbatim marketing-copy block
(the prompt must use this copy as-is, never paraphrase), a `<!-- DEV: <note> -->` annotation
list flagging real engineering gotchas, then a `### PROMPT N` block broken into numbered
`FRAME` sections with exact dimensions/colors/fonts/copy placement. When adding a new prompt,
append a new numbered section to whichever file matches the surface (mobile app → the first
file; `apps/site`/`apps/connect` → the web file) rather than inventing a third file or a new
top-level doc.

### Rendered Figma mockup HTML files (distinct from the prompt catalogs above)

These are the actual self-contained HTML output files (Tailwind CDN + Google Fonts, multiple
"Frame N" sections at fixed pixel widths) generated *from* the prompt catalogs above — not to be
confused with the `.md` prompt text files themselves. They live in a dedicated top-level
**`mockups/`** folder (moved there 2026-06-24, see below for the prior locations), kept deliberately
separate from `apps/figma/` — `apps/figma/` is a *different* artifact entirely: a live, buildable
Figma Make code export (`src/`, `index.html`, `README.md`, a real React app for design tokens), not
a mockup archive. Mixing static reference HTML into that folder was confusing, hence the move.

- `mockups/mobile/` — **mobile app** mockups (`apps/mobile`).
- `mockups/web/` — **webapp** mockups (`apps/site` + `apps/connect`). Filenames can overlap with
  the mobile folder (e.g. `moveee_connect_settings.html`, `moveee_dark_mode_ui.html`,
  `moveee_overlays.html`, `moveee_wallet.html`, `moveee_directory.html`, `moveee_magazine.html`
  exist in both) — these are different files with different content per surface, not duplicates.
  Don't dedupe across the two folders.

When a user uploads a new mockup HTML file and asks to "upload"/"add" it to the repo: strip the
random upload-hash prefix from the filename (e.g. `8143d30d-moveee_connect_settings.html` →
`moveee_connect_settings.html`), then copy it into whichever of the two folders matches the
surface the mockup is for, `git add` by filename, commit, and push — don't invent a third
location like `docs/figma-design/` or put it back under `apps/figma/`.

**History (2026-06-24):** these folders were originally `apps/figma/designs/` (mobile) and
`apps/figma/designs-web/` (web) — first consolidated together under `apps/figma/` from three
separate locations, then immediately relocated again to the current top-level `mockups/mobile/`
and `mockups/web/` once it became clear `apps/figma/`'s own purpose (the live design-token export
above) shouldn't share a folder with a static mockup archive. Before that first consolidation, a
third, older mockup location existed at the repo-root `/designs/` folder — predating any of this
convention (single one-off HTML prototypes, not "Frame N" multi-frame Figma Make output),
containing a mix of `apps/site` mockups (`homepage.html`, `magazine_index.html`, `shop_index.html`,
`shop_product.html`, `origins_index.html`, `origins_journey.html`, `gele_return.html`,
`marrakech_dispatch.html`, `portrait_feature.html`, `event_opening.html`, `events_index.html`,
`newsletter/hub.html`, `newsletter/issue.html` — title tag `"... · The Moveee"`) and `apps/connect`
mockups (`community_posts.html`, `composer_states.html`, `directory_detail_1.html`,
`events_list_and_detail.html`, `feed_cards.html`, `feed-cards-v2.html`,
`mobile-article-detail-v2.html` — title tag `"Moveee Connect - ..."`, including one file with
"mobile" in its name that is actually a 390px mobile-companion frame of a *web* mockup, not an
`apps/mobile` screen). All of it was confirmed (by title-tag + frame-width inspection) to be
web-surface content, so it stayed under `mockups/web/` rather than `mockups/mobile/` — but it was
kept in its own **`mockups/web/legacy/`** subfolder rather than flattened in among the 17
pre-existing Figma Make web mockups, since it's an older, different-vintage batch (one-off
prototypes vs. multi-frame Figma Make exports) and the user wanted that distinction preserved even
though both batches are confirmed same-surface. No filename collisions, nothing misclassified. If
you see a reference to `/designs/` or `apps/figma/designs*` anywhere (e.g. stale docs), update it
to `mockups/web/legacy/` (for the older batch) or `mockups/web/`/`mockups/mobile/` (for the Figma
Make batch) as appropriate.

---

## Git branch

Active development branch: `claude/sweet-ritchie-xr21c3` (merged to main 2026-06-15)
New work: create a fresh branch from main or use whatever branch is specified at session start.

---

## Reaction consistency fix (June 2026)

Reactions (love/fire/clap) on community posts, pulse stories, quotes, and
magazine articles were inconsistent across surfaces — some components never
hydrated the viewer's own reaction state from the server (always starting
"not reacted" on mount), some allowed multiple simultaneous "active"
reactions per post (contradicting the single-reaction-per-user backend
model), and web's reaction endpoint did a non-atomic GET-then-PATCH against
native WP REST with no real per-user server record (relied on localStorage).

**Backend (single source of truth):** `_culture_post_reactions` usermeta —
a `post_id => reaction_type` map per user. `Culture_Mobile_API::toggle_reaction()`
(`class-culture-mobile-api.php`) is the one place the toggle/switch logic
lives; both mobile's `handle_react()` (JWT, `/mobile/community/react`) and
web's new `handle_react()` (API key, `/community/react`, in
`class-culture-rest-api.php`) just call into it — same mirrored-endpoint
pattern as Follow/Community RSVP. Switching emoji decrements the old type's
counter and increments the new one; tapping the same emoji again un-reacts.
`_culture_liked_posts` (flat array) is kept in sync for backward
compatibility with old boolean-`liked` reads.

**Reading current reaction state:** Feed/list responses (`get_pulse_feed_items()`,
`get_quote_feed_items()`, `get_community_feed_items()`, `format_community_post()`)
now include a `userReaction` field sourced from the map directly — no extra
request needed when rendering from a feed. Surfaces that fetch content
*outside* a feed (e.g. magazine articles, fetched by slug) have no
`userReaction` field to read, so there's a small dedicated GET lookup
instead: web `GET /culture/v1/user/reaction` (used by
`packages/shared/components/pulse/ReactionBar.tsx` on mount, proxied via
`apps/connect/app/api/community/react/route.ts`), mobile
`GET /culture/v1/mobile/user/reaction` (used by `ArticleScreen.tsx`).
**Per the project's WPGraphQL-vs-REST rule**, this lookup was deliberately
kept as a separate small REST call rather than threading `userReaction`
through the GraphQL-sourced web content fetch (`unified-feed.ts`) —
user-specific reads stay off the content/GraphQL path.

**Frontend pattern (apply to any new reaction surface):** hydrate initial
state from `item.userReaction` (or the dedicated lookup if there's no feed
item), track at most one active reaction (a single `reacted` key/Set with
at most one entry, not independent booleans per emoji), and after the POST
always overwrite local state with the response's `reactionType`/`reactions`
rather than trusting the optimistic guess (the server's switch logic is the
authority, not the client's prediction). Fixed in this pass:
`packages/shared/components/pulse/ReactionBar.tsx` (web shared),
`apps/mobile/src/components/community/ReactionBar.tsx`,
`PostDetailSheet.tsx`'s `ReactionsRow`, `FeedItemCard.tsx`'s `QuoteCard`
(love-only bespoke handler), `QuoteDetailModal.tsx`, and
`ArticleScreen.tsx`'s lifted top/bottom-bar state. Any component still
written as `useState(false)` per emoji rather than one shared "which
reaction is active" value has this same bug.

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
  - proxy.ts 308-redirects all auth/community/vendor paths → web.themoveee.com
- **Site B (`web.themoveee.com`)** — Community + Auth + Vendor.
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

### Lifestyle Shop archive page (Site A, rebuilt from mockup June 2026)

`apps/site/app/shop/ShopArchiveWrapper.tsx` (async server component, fetches
`products`/`categories`/`makers` via `getWPData`/REST fallback) renders the
page in this exact order: 1. Shop Head, 2. Trust Strip, [inside
`ShopFilterProvider`] 3. `ShopFilterBar`, 3b. Ticker, 4. Featured Editorial
Picks, 5. Editorial Bridge (Magazine), 6. `ShopProductGrid`, 7. Editorial
Bridge (Origins, `.ed-bridge--origins`), [outside provider] 8. Category Grid,
9. Vendor Strip ("Meet the Makers"), 10. Member Band (Moveee Pro), 11. Origins
Bridge Closing (full image+copy block, `.ob-*` classes — visually distinct
from the compact text-only `.ed-bridge` banners in steps 5/7).

**Component split (`ShopBrowser.tsx` deleted, replaced June 2026)** — the
mockup's filter bar and product grid aren't adjacent (other sections sit
between them), so state had to move to a shared React Context instead of one
combined client component:
- `components/ShopFilterContext.tsx` — `ShopFilterProvider` + `useShopFilter()`
  hook; owns all filter/sort/view state and the derived `filtered` list, plus
  shared helper exports (`vendorName`, `parsePrice`, `formatGBP`, `isNew`,
  `isOutOfStock`, `averageRating`, `reviewCount`, `PRICE_BANDS`).
- `components/ShopFilterBar.tsx` — renders the filter dropdown pills, search
  toggle, sort select, view toggle, and active-filter chips. Pure consumer of
  `useShopFilter()`, no local state.
- `components/ShopProductGrid.tsx` — renders the actual product cards from
  `filtered`. Also a pure consumer of `useShopFilter()`.

Both `ShopFilterBar` and `ShopProductGrid` must be rendered inside
`ShopFilterProvider` (see the section order above — sections 3 through 7 are
nested inside the provider in `ShopArchiveWrapper.tsx`; the category
grid/vendor strip/member band/origins-closing sections after it are outside,
since they don't need filter state).

- Facets: price bands (4 fixed ranges), tag pills derived from `productTags`
  (excluding the `"new"` tag slug), **Material pills** (from the
  `product_material` taxonomy, June 2026) and **Maker-Location pills**
  (derived from `vendorProfile.city`/`.country`, falling back to country
  when city is empty) — both added in the same pass as the reviews system
  below, replacing the prior "no material taxonomy exists" gap.
- Sort: Featured (default), Price Low–High/High–Low, Newest, and
  **Most Loved** (sorts by `reviewCount` desc, tiebreak `averageRating`
  desc) — added alongside the reviews system.
- Pro price (10% off) is computed client-side from the existing `price`
  string (same `replace(/<[^>]*>/g,"").replace(/[^0-9.]/g,"")` parse pattern
  used in `app/shop/[slug]/page.tsx`) rather than fetched from
  `moveeeMeta.memberPrice` — that field lives in `wp.ts`'s `GET_PRODUCT_EXTRA`
  query, which is **deliberately kept separate** from the shared
  `PRODUCT_FIELDS_FRAGMENT` so the product page still renders if the
  moveee-graphql-bridge plugin isn't active; merging it into the listing
  fragment would risk failing the whole shop grid query in any environment
  where that plugin/field isn't available. Don't merge them — compute Pro
  price client-side instead, as done here.
- Each card shows `★ {averageRating} ({reviewCount})` when `reviewCount > 0`,
  otherwise falls back to the static "New listing" placeholder.
- The member-band section now says "Moveee Pro" (was stale "Connect
  Members" copy) and its CTA links to `/register?tier=patron`. The "2,400
  Members & growing" stat in that section is still a hardcoded literal, not
  a live count — out of scope until there's a backend count to wire up
  (explicitly deferred — not part of the reviews/facets/sort build below).

**Mobile-companion responsive styling (June 2026)** — added a dedicated block at
the top of `shop.css`'s existing `@media (max-width: 640px)` query (right after
the masthead/trust-strip rules) covering all archive sections: horizontally
scrolling filter pills (`.filter-dd-row` gets `overflow-x: auto` + hidden
scrollbar instead of wrapping), featured picks stack to 1 column, 2-up product
grid (`.product-grid`/`.cat-grid`/`.vendor-cards` all `repeat(2, 1fr)`), shrunk
`.pcard`/`.pimg` dimensions (460px→320px / 280px→160px) with proportional font
sizes, compact "mini" vendor cards (`.vc-desc` hidden), non-overlapping member
band, and a full-bleed edge-to-edge origins-bridge image. This is **CSS-only** —
no changes to `ShopFilterBar.tsx`/`ShopFilterContext.tsx`; the filter dropdowns
stay native `<select>` pills (just restyled to scroll), not real bottom sheets.
**Two bugs caught and fixed in this pass**: (1) `.member-band-inner`'s
`@media (max-width: 1200px)` override set `grid-template-columns: 1fr`, which
was a no-op since the element's base `display` is `flex` not `grid` — changed
to `flex-direction: column` (this also makes the pre-existing `.mb-img`/
`.mb-float` mobile rules actually take effect for the first time). (2) `.padd`
(the product-card "Add to Cart" button) is hover-revealed (`opacity: 0` until
`:hover`), which never fires on touch devices — added `opacity: 1; transform:
none;` inside the mobile override so the button is visible by default on
mobile. **If you add a hover-revealed element anywhere in the shop UI, check
whether it also needs a mobile always-visible override** — touch devices never
trigger `:hover`.

### Lifestyle Shop product reviews + Material/Location facets (June 2026)

Built on top of the existing WooCommerce **native** comment-based review
system (`comment_type = 'review'`, `_wc_average_rating`/`_wc_review_count`
postmeta) rather than inventing a new table — `moveee-graphql-bridge.php`
(repo root) only adds a thin REST + GraphQL layer on top of WooCommerce's own
storage, so any other WooCommerce code reading those two postmeta keys stays
in sync automatically.

- **Taxonomy**: `product_material` (non-hierarchical, `show_in_graphql:
  false` — deliberately not auto-wired through WPGraphQL's generic taxonomy
  support; exposed manually instead, see below) registered on `product` in
  `moveee-graphql-bridge.php`. Tag products with materials (Linen, Oak,
  Brass, etc.) via the normal WP Admin taxonomy UI on the product edit
  screen.
- **GraphQL fields** (`averageRating: String`, `reviewCount: Int`,
  `productMaterials: [String]`) added via `register_graphql_field` at
  priority 99 on the four product types, exactly mirroring the existing
  `vendorProfile`/`moveeeMeta` manual-resolver pattern — chosen over relying
  on `show_in_graphql` taxonomy auto-wiring since WPGraphQL WooCommerce's
  taxonomy connections (`productCategories`/`productTags`) are themselves
  manually wired by that third-party plugin, not generic WP core behavior.
  Fetched via two new isolated queries in `wp.ts`,
  `GET_PRODUCTS_EXTRA`/`GET_PRODUCTS_BY_VENDOR_EXTRA` (listing grid) and an
  extension of the existing `GET_PRODUCT_EXTRA` (single product page) — all
  three follow the same `Promise.allSettled` + merge-by-`databaseId`
  isolation pattern as `vendorProfile`/`moveeeMeta`, so a bridge-plugin
  outage degrades gracefully (no rating/materials shown, "New listing"
  placeholder, no facets) rather than failing the whole shop.
- **REST endpoints** (`moveee-graphql-bridge.php`, namespace `moveee/v1`,
  separate from the WordPress plugin's own `culture/v1` namespace):
  `GET /moveee/v1/products/{id}/reviews` (public, lists approved reviews) and
  `POST /moveee/v1/products/{id}/reviews` (requires `Authorization: Bearer
  {culture_api_secret}` — mirrors `Culture_Rest_Api::api_key_permission()`'s
  `verify_bearer_token()` convention, **not** the `X-Culture-Secret` header
  that `apps/site/app/api/comments/route.ts` sends, which WordPress never
  actually checks for that route). One review per user per product —
  resubmitting updates the existing comment via `wp_update_comment()` rather
  than inserting a duplicate. `moveee_recalculate_product_rating()` recomputes
  `_wc_average_rating`/`_wc_review_count` via a raw-SQL `AVG()`/`COUNT()`
  join against `wp_comments`/`wp_commentmeta` after every submit and busts
  WooCommerce's product transients.
- **Next.js proxy**: `app/api/shop/reviews/route.ts` — `GET` is a thin public
  passthrough; `POST` requires `getServerSession(authOptions)` (consistent
  with the comments route's auth pattern) and forwards
  `Authorization: Bearer ${CULTURE_API_SECRET}` to the bridge endpoint.
- **UI**: `app/shop/[slug]/ProductReviews.tsx` (client component) — review
  list + a session-gated review form (5-star picker + textarea), rendered as
  its own section on the product page between "Vendor Profile" and "More
  From This Category". Average rating + material pills also surfaced near
  the product title/lede in `[slug]/page.tsx`. `ShopBrowser.tsx`'s
  `availableMaterials`/`availableLocations` facet pills and the "Most Loved"
  sort option (see above) read `productMaterials`/`vendorProfile.city`/
  `averageRating`/`reviewCount` off the same merged product objects.

### Magazine archive page — "The Edit" section gotcha (fixed June 2026)

`apps/site/components/EditorialSection.tsx` (renders "The Edit" hover-swap spotlight
block on `/magazine`) uses its own classname scheme (`.editorial`, `.editorial-inner`,
`.ed-left`, `.ed-grid`, `.ed-item`, `.ed-visual`, `.ek`, `.em`) that is **separate from**
the page's `mg-*` namespace in `magazine.css` — this is intentional (it's a
component-scoped style, not part of the archive's section-by-section `mg-*` system) but
it means **the CSS for this component must be added to `magazine.css` manually; it does
not come along "for free" when the rest of the `mg-*` system is touched.** A prior page
rebuild moved the whole archive to the `mg-*` system but never added equivalent rules for
`.editorial`/`.ed-*`, leaving the section completely unstyled (plain text, no card/image
layout) — and because `.ed-visual` had no `position: relative`, the absolutely-positioned
hover-swap `<Image fill>` elements and the ochre fallback tint inside it escaped to the
nearest positioned ancestor and visually overlapped unrelated sections elsewhere on the
page (looked like random "floating orange squares"). **Lesson: any container with an
absolutely-positioned child must itself be `position: relative` (or similar) — an
unstyled wrapper around `fill`/`inset: 0` elements doesn't just look unstyled, it lets
those children paint outside their intended box.** Also fixed: `EditorialSection.tsx`
referenced a `var(--ochre-deep)` CSS custom property that was never defined anywhere
(only a Tailwind utility class `bg-ochre-deep` exists, not a CSS var) — swapped to the
real `var(--ochre)` token. Separately, `.mg-nav-tabs` (the category tab row) lacked
`flex: 1 1 auto; min-width: 0`, so on category-heavy lists it could overflow past its
flex sibling `.mg-nav-filters` instead of scrolling within its own bounds — fixed the
same way. The Opinions & Essays section (`opinionStories` slice in
`MagazineArchiveWrapper.tsx`) is capped at 2 articles, not 6 — `.mg-op-grid` is already a
2-column grid so this needs no CSS change if the cap changes again.

### Homepage queries (Site A) — current state
`lib/fetchHomepageData.ts` now fetches only 5 queries (down from 10):
stories, products, latest issue, interviews, series batch.
Events, directory, quotes, pulse, origins removed from homepage.

### Figma Make web design rebuild — section-by-section status tracker (June 2026)

Tracks progress against the 18 numbered sections in `docs/figma-make-prompts-web.md`
(each section has a matching mockup in `mockups/web/`). The intent of this initiative
is to fully override the current site design page-by-page, not just patch bugs — update
this table whenever a section's rebuild starts or finishes so progress isn't
re-derived from scratch each session.

| § | Section | Surface | Status |
|---|---|---|---|
| 1 | Web Homepage | Site A | Done — rebuilt from mockup |
| 2/3 | Shop/Lifestyle Homepage | Site A | Done — rebuilt from mockup (see "Lifestyle Shop archive page" above) |
| 4 | Pulse Feed | Site B | Done (built in a separate session, confirmed by user 2026-06-24) |
| 5 | Post Composer | Site B | Done (built in a separate session, confirmed by user 2026-06-24) |
| 6 | Magazine / Article Detail | Site A | Done — rebuilt from mockup (see "Magazine archive page" above) |
| 7 | Events / Happenings | Site B | Done — rebuilt from mockup (see "Events/Happenings web surface" above) |
| 8 | Culture Games | Site B | Done — rebuilt from mockup 2026-06-26 (see "Culture Games — visual rebuild" below) |
| 9 | Member Dashboard | Site B | Done — rebuilt from mockup 2026-06-24 (see "Member Dashboard — visual rebuild" below) |
| 10 | Member Settings | Site B | Done — rebuilt from mockup 2026-06-24 (see "Member Settings — visual rebuild" below) |
| 11 | Wallet, Perks & Coupons | Site B | Done — rebuilt from mockup 2026-06-24 (see "Wallet, Perks & Coupons — visual rebuild" below) |
| 12 | Member Directory & Public Profiles | Site B | Done — rebuilt from mockup 2026-06-25 (see "Member Directory & Public Profiles — visual rebuild" below) |
| 13 | Notifications & Analytics | Site B | Done — rebuilt from mockup 2026-06-25 (see "Notifications & Analytics — visual rebuild" below) |
| 14 | Lifestyle Shop | Site A | Done — rebuilt from mockup (covered by §2/3 entry above) |
| 15 | Feed Card Detail Drawers | Site B | Done — rebuilt from mockup 2026-06-24 (see "Feed Card Detail Drawers — visual rebuild" below). A prior pass on this date had wrongly marked this "Done" by comparing against the prose spec in this doc instead of the real mockup HTML; the user caught the discrepancy and the 5 drawers were corrected to match `mockups/web/moveee_connect_feed_drawers.html` |
| 16 | Design System & Core UI Components | Site A + B | Not started |
| 17 | Authentication Flow | Site B | Done — rebuilt from mockup 2026-06-25 (see "Authentication Flow — visual rebuild" below) |
| 18 | Overlays & Micro-interactions | Site B | Done — rebuilt from mockup 2026-06-25 (see "Overlays & Micro-interactions — visual rebuild + dark-mode hex-color fix" below) |

### Culture Games — visual rebuild (§8, June 2026)

`mockups/web/moveee_culture_games.html` (5 frames: Games Hub, Trivia In Progress, Trivia
Answer Revealed, Shared Game Done Screen for Quiz & Puzzle States, Mobile Companion)
diffed directly against the live components — `packages/shared/components/games/`
(`GameCard.tsx`, `GameDoneScreen.tsx`, `TriviaGame.tsx`, `WhoSaidItGame.tsx`) and
`apps/connect/app/games.css`. Game logic/backend (Trivia, Who Said It?, Sudoku,
Crossword) was already fully functional going in — this was a visual-only pass, same
methodology as every other §-rebuild in this file.

- **`GameCard.tsx`** (Games Hub cards): wrapped the meta row + CTA in a new
  `.game-card__footer` div so they sit on one row per the mockup, and added
  `borderColor: badgeColor` to the difficulty badge's inline style (was missing an
  outline, just a filled pill).
- **`GameDoneScreen.tsx`** (shared end screen for all 4 games, Frame 4): added a
  `GAME_TAG_MODIFIER` lookup (`gds-game-tag--trivia/wsi/sudoku/crossword`) so each
  game's header pill gets its own brand color instead of one flat style; the
  dot-separator + "Already played today" badge in the meta row is now gated on
  `!isPuzzle` (quiz games only) — the mockup's puzzle-state variant (Sudoku/Crossword)
  shows date-only with no badge, since puzzles have no daily-replay-block concept; share
  button + subscribe form + nav actions are now wrapped in one `.gds-actions-zone`
  container (matching the mockup's single 32px-padded/24px-gap "Actions Zone" block,
  previously three separately-spaced siblings); the share button now toggles a real
  `gds-share-btn--copied` modifier class on copy-success (was text-only before, so the
  mockup's green success-state pill styling was unreachable); removed the redundant
  "✓ " text prefix from the subscribe-success message since `.gds-sub-success` now
  renders the checkmark as a CSS `::before` pseudo-element circle instead.
- **`games.css`**: split `.gds-game-tag` into a base class + 4 color modifiers
  (Trivia → `var(--moss)`, Who Said It → `var(--ochre)`, Sudoku →
  `var(--game-sudoku, #1a3a5c)`, Crossword → `var(--game-crossword, #5c3a1a)` — the last
  two are fallback literals since no `--game-sudoku`/`--game-crossword` CSS variables
  exist in `globals.css`, following the project's standard `var(--token, #fallback)`
  convention). Also fixed a duplicate, non-adjacent `.gds-sub-success` selector
  (layout/background props and typography props had been split across two separate rule
  blocks with the `::before` pseudo-element sandwiched between them) by merging into one
  consolidated rule. Rebuilt the games-hub layout, game-page nav, Trivia progress
  pips/option states, and the full `.gds-*` Game Done Screen block to match the mockup's
  spacing/radius/color values (`--radius-xl`/`--radius-full`, `--shadow-card`,
  `--success`/`--error` for the subscribe success/error states — same semantic-color
  convention used in the Wallet/Perks/Overlays passes elsewhere in this file).
- **`TriviaGame.tsx`**: CSS-only — its JSX already matched the mockup's question/option/
  explanation structure; only `games.css` rules needed updating.
- **Deliberate deviation — Who Said It? reuses the Trivia design system.** The mockup has
  no dedicated "Who Said It?" gameplay frame (Frames 2/3 are both Trivia). `WhoSaidItGame.tsx`
  required no JSX changes; its quote-card/option/feedback states were mapped onto the same
  CSS classes and visual language already built for Trivia's progress bar, option states, and
  feedback callouts, rather than inventing a separate, unspecified design.
- **Confirmed dead, left untouched**: `.game-result*` CSS block has zero references in any
  `.tsx`/`.ts` file (grepped across the repo) — not part of this rebuild, not removed either,
  consistent with this file's general practice of only removing dead code when it's
  specifically in scope or flagged by the user.
- **Deferred, no mockup ground truth**: light-touch rounding/hover polish on
  `.sudoku-numpad-btn`/`.cw-btn` chrome and in-board cell-state coloring
  (`.sudoku-cell--*`/`.cw-cell--*`) were not addressed in this pass — the mockup has no
  Sudoku/Crossword gameplay frame, only the shared Game Done Screen's puzzle-state variant.
- **Not visually verified in a browser** — same `NEXTAUTH_SECRET`/WordPress credentials gap
  as every other Figma rebuild pass in this file. Verified via `tsc --noEmit` (clean, zero
  errors) on `apps/connect` and a CSS brace-balance check on `games.css` (230/230, balanced).
  Re-check pixel fidelity against `mockups/web/moveee_culture_games.html` in a real
  environment before considering this fully closed.

### Member Dashboard — visual rebuild (§9, June 2026)

`apps/connect/app/member/page.tsx` + `MemberDashboard.tsx`/`MemberBadges.tsx`/
`PasskeyBanner.tsx` (`packages/shared/components/`) + `apps/connect/app/member.css`
rebuilt against `mockups/web/moveee_dashboard_web.html`:

- **Full-bleed band pattern** (new structural pattern, reusable for future sections):
  the mockup's hero, passkey banner, and stats row are each page-width sections with
  their own background color, while their *content* is horizontally centered at
  `max-width: 1200px`. Previously only the hero followed this — the passkey banner and
  stats row were nested inside `.mem-body`'s `max-width:1200px` wrapper, so they looked
  like cards instead of full-width bands. Fixed by moving `<PasskeyBanner>` and
  `<MemberDashboard>` out of `.mem-body` in `page.tsx`, and adding a `.mem-stats-band`
  wrapper (full width, own background/border) around the existing `.mem-stats` grid
  (which itself became the `max-width:1200px` centered inner element). **If a future
  section's mockup shows a full-width tinted strip, check for this same pattern** — don't
  assume every section lives inside the body's centered container.
- `.mem-hero` switched from a dark `ink` background with light text to a white/paper
  background with ink text (mockup uses light hero, not dark) — avatar enlarged to 96px
  with a gold ring border; tier badge switched to a full pill (`border-radius: 999px`,
  was 2px).
- `PasskeyBanner.tsx` rewritten from a small inline-styled rounded box to a full-width
  dark `ink`-background bar (className-based, matching the rest of the redesigned
  components' convention) with a white pill CTA button — also fixed a copy-priority bug
  where the "credits waiting" message never became the bold title even when
  `creditsEscrowed > 0`.
- `.mem-stats` grid: `repeat(4,1fr)` → `repeat(5,1fr)` (5 stats were already rendered by
  the component; only the CSS column count was stale). `.mem-tooltip` flipped from
  appearing above the stat to below it (`top: calc(100% + 12px)`, arrow flipped to point
  up), matching the mockup.
- `.mem-badges-grid`: `repeat(4,1fr)` → `repeat(2,1fr)`; `.mem-badge` restructured from a
  centered icon-over-text column to a left-aligned row card with a 40px circular icon
  swatch — required a matching JSX change in `MemberBadges.tsx` (wrapped name/desc in a
  new `.mem-badge-text` div) since the row layout needs name+desc stacked beside the icon,
  not below it.
- Responsive breakpoints updated to match the new 5-stat/2-badge-column base (the
  `max-width: 1024px`/`640px` overrides previously assumed a stale 4-stat/4-badge-column
  layout) — stats wrap 3+2 at 1024px and 2-per-row at 640px via `nth-child` border rules
  rather than the old fixed 2-column assumption.
- **Not visually verified in a browser** — this environment has no `NEXTAUTH_SECRET` or
  WordPress backend credentials configured, so `getServerSession()` 500s before any
  member-page markup renders. Verified instead via: CSS brace-balance check, mockup
  HTML re-read for exact values (colors/radii/spacing), and component/CSS class-name
  cross-referencing. If this matters, re-check pixel fidelity against
  `mockups/web/moveee_dashboard_web.html` in a real environment before considering it
  fully closed.

### Member Settings — visual rebuild (§10, June 2026)

`apps/connect/app/member.css` plus `app/member/settings/profile/page.tsx` and
`app/member/settings/directory/page.tsx` (className only) and
`app/member/settings/PasskeyManager.tsx` rebuilt against
`mockups/web/moveee_connect_settings.html`. The underlying structure/logic
(per-field inline-edit-with-autosave, read-only field treatment, Directory
tab cross-tab preview, WebAuthn/Passkey management, settings-only newsletter
preference list) was already fully implemented going into this pass — only
visual fidelity gaps needed fixing, all confirmed by direct grep of the
mockup HTML rather than the prose spec (see the `--ochre` correction above —
an earlier pass on this same pass nearly went down the wrong path assuming
`var(--ochre)` was amber rather than rust, based on the doc table that has
now been corrected):

- `.mem-card` was a flat rectangle (no radius, no shadow) — the mockup wants
  `rounded-xl` + `shadow-card` on every card, confirmed against *both* the
  Settings mockup and the already-completed Dashboard mockup (so this was a
  pre-existing gap, not Settings-specific). Added `border-radius: 12px` +
  a subtle `box-shadow` to the shared `.mem-card` base class with its
  existing neutral border kept. Settings' editable-field cards specifically
  also want an ochre-tinted border (`border-ochre/20` in the mockup, distinct
  from Dashboard's neutral `border-ghost/20`) — added as a separate
  `.mem-card--editable` modifier class, applied only to the Profile and
  Directory settings page's wrapping `<section>` (the two pages with
  inline-editable fields), not to Security/Notifications/Interests/
  Newsletters (action-row or toggle-row cards, which the mockup keeps on a
  neutral border — see the Password row in the Security frame for the
  confirming example).
- `.prf-tab--active::after` (the active tab's underline) was `var(--ink)` —
  mockup uses `border-ochre` for the active tab underline while keeping the
  tab *text* itself `text-ink` (don't change the text color, only the
  underline — confirmed via the mockup's literal class list,
  `text-ink ... border-b-[2px] border-ochre`).
- `.mem-field-btn` (Edit/Change links) defaulted to `var(--ink)`, only
  turning ochre on hover — mockup's Edit/Change links (`text-ochre`) are
  ochre by default. Default color changed to `var(--ochre)`; hover changed
  to `var(--ochre-deep)` so there's still a visible hover state.
- `.mem-toggle` (Notifications on/off buttons) was missing
  `border-radius: 999px` — mockup uses a full pill (`rounded-full`) for these;
  the existing on/off background colors (`var(--ink)` for "on") were already
  correct and didn't need changing.
- `.mem-field-input` (editable text inputs) was missing `border-radius`
  (mockup uses `rounded-lg`, ~8px) and only showed an ochre border on focus —
  mockup's editable inputs have a persistent `border-ochre` outline, not just
  on focus. Added `border-radius: 8px` and changed the default border to
  `var(--ochre)`.
- `PasskeyManager.tsx`'s "Remove" button and inline error-message text used
  the literal `#c5491f` (brand ochre/rust) for a destructive/error action —
  the mockup uses a **distinct** error-red token (`error: '#C62828'`, not the
  brand accent) for this. Swapped both to `#c62828`/`rgba(198,40,40,...)`.
  There's no `--error` CSS variable in `globals.css` yet — this file uses a
  literal, consistent with how other one-off colors (e.g. `var(--moss,
  #5a7a5a)`) are already handled ad hoc in `member.css`. If a real error-red
  variable is ever introduced, swap this literal for it.
- `.dir-toggle`, `.dir-toggle--on`, `.dir-preview-tag`, `.dir-discipline-tag`/
  `--on` in the Directory tab were checked against the mockup and found to
  already be correct — no changes needed there.
- **Not visually verified in a browser** — same `NEXTAUTH_SECRET`/WordPress
  credentials gap as the Dashboard rebuild above. Verified via CSS
  brace-balance check and direct mockup HTML re-read for exact class names/
  values. Re-check pixel fidelity against `mockups/web/moveee_connect_settings.html`
  in a real environment before considering this fully closed.

### Wallet, Perks & Coupons — visual rebuild (§11, June 2026)

Three routes (`/member/wallet` → `WalletClient.tsx`, `/connect/perks` →
`PerksClient.tsx`, `/member/coupons` → `CouponsClient.tsx`) rebuilt against the
single mockup `mockups/web/moveee_wallet.html` (674 lines, 5 frames: Wallet
History, Wallet Cash Out, Perks + redeem modal/QR success, Coupons, plus a
mobile companion frame). Confirmed via direct HTML read, not the prose spec.

- **New semantic color tokens** added to `apps/connect/app/globals.css`:
  `--success`, `--error`, `--warning`, `--warning-dark` — previously every
  success/error indicator across these three pages used literal hex
  (`#2e7d32`/`#c5491f`/`rgba(198,40,40,...)`) rather than a shared token, even
  though the mockup treats these as distinct semantic colors from the brand
  ochre/rust accent. `WalletClient.tsx`'s ledger amount color, step-up error
  banner, and cash-out result banner all swapped from literal hex to
  `var(--success)`/`var(--error)`.
- **`CouponsClient.tsx` Active/Used/Expired rebuild** — Active coupons now
  render as a `repeat(auto-fill, minmax(220px,1fr))` grid of centered cards
  (`--radius-xl` + `--shadow-card`, success-tinted border by default, flipping
  to warning-tinted when `daysUntil(expires_at) <= 3`), each with an
  absolutely-positioned top-right pill badge ("Active", tinted to match the
  card's state), a centered QR, and a bold expiry line. Used/Expired now
  render as rounded (`--radius-lg`), opacity-reduced rows (Used: 0.6, Expired:
  0.4 + title strikethrough) with a trailing pill status badge — previously
  both were a flatter, non-pill, non-card treatment. Mirrors the
  success/error/warning token convention introduced above.
- **`perks.css`**: added `.perk-stepup-working { animation: perk-pulse 1.8s
  ease-in-out infinite; }` + the `@keyframes perk-pulse` rule itself —
  `PerksClient.tsx`'s "waiting for biometrics" banner already had this
  className applied in JSX but no matching CSS existed, so the mockup's
  `animate-pulse` behavior was silently missing.
- **Investigated, deliberately left unchanged**: `.perk-redeem-btn` is dead
  CSS (grepped across `apps/connect/`, including the compiled `.next` output —
  no `.tsx` references it; `PerksClient.tsx` uses `.perk-card-btn` instead).
  `.perks-filter-btn`'s underline-tab style (not a pill) was checked against
  the mockup's own Frame 2 tab markup (`border-b-[2px] border-ochre`, not a
  rounded pill) and confirmed already correct — no change needed.
- **Cashout fee confirmed at 40% (fixed June 2026):** `WalletClient.tsx`'s live
  fee calculator (`feePercent`, ~line 108) previously read `30`, mismatching
  both the static copy on the same page ("A flat 40% fee applies", ~line 228)
  and the PHP backend (`Culture_Perks::cashout_fee_percent()` — already
  hardcoded to `40`). The user confirmed 40% is the correct, intended fee —
  `feePercent` is now `40`, matching the backend and the static copy. Grepped
  the rest of the web app, mobile app, and `culture-community/` for any other
  stray "30%"/cashout-fee literals — none found; this was the only place the
  wrong number lived.
- **Not visually verified in a browser** — same `NEXTAUTH_SECRET`/WordPress
  credentials gap as the Dashboard/Settings rebuilds above. Verified via CSS
  brace-balance checks (`perks.css`, `globals.css`) and a full `tsc --noEmit`
  pass on `apps/connect` (clean). Re-check pixel fidelity against
  `mockups/web/moveee_wallet.html` in a real environment before considering
  this fully closed.

### Feed Card Detail Drawers — visual rebuild (§15, June 2026)

**Gotcha that caused a false "Done" claim, then got corrected:** when verifying a Figma
Make web rebuild section against its mockup, always diff the actual mockup HTML
(`mockups/web/*.html`) — never the prose spec text in `docs/figma-make-prompts-web.md`.
A first pass on this section compared the 5 live drawer components against the prose
description only, concluded they "already matched," and committed that claim. The user
immediately flagged it ("the website still have the old designs") and was right — a
real diff against `mockups/web/moveee_connect_feed_drawers.html` turned up genuine
mismatches, all now fixed in `HappeningDetailModal.tsx`, `DirectoryDetailModal.tsx`,
`QuoteDetailModal.tsx`, `PulseDetailModal.tsx`, `CommunityDetailModal.tsx` (all
`packages/shared/components/pulse/`):

- Badges: `borderRadius: "2px"` → `"999px"` (full pill) everywhere, including the 6
  template badges inside `CommunityDetailModal.tsx` (hidden-gem/cultural-take/food-review/
  creative-showcase/itinerary/event).
- Header background is `#faf8f5` (distinct from the panel's `var(--paper, #f3ece0)`), not
  the same paper color as the body — padding uniform `1.25rem`.
- "Full page"/"Open full page" link: plain underlined text, rust `#c5491f`, no border/pill/
  icon (was previously a bordered box with an SVG arrow). **Directory drawer omits this
  link entirely** per the mockup's own inline comment.
- Close button: real SVG stroke "X" icon (`<path d="M6 18L18 6M6 6l12 12"/>`), not a `✕`
  Unicode glyph.
- Full-width CTA buttons (Happening "View Event Details →", Directory "View Full Entry →"):
  `width: 100%, height: 52px, borderRadius: 999px` pill, not an inline-block square button.
- Quote drawer: sharing-reason callout `borderRadius: 12px` + `boxShadow: 0 1px 2px
  rgba(0,0,0,0.05)`; date line centered + `font-family: monospace`.
- Pulse/Editorial drawer badge relabeled "Editorial" (bg `#eeedfe`/text `#3c3489`) — the
  mockup's literal text, not the old "Pulse" label.
- Community drawer's event-details block now wrapped in a white bordered card (`#fff`
  bg, `1px solid #e8e2d8`, `borderRadius: 6px`, `boxShadow: 0 1px 2px rgba(0,0,0,0.05)`)
  instead of plain text rows.
- `RsvpDisplay`'s RSVP button `borderRadius: 4px` → `999px` — fixed in **both**
  `CommunityDetailModal.tsx` and `FeedCard.tsx` (duplicate, non-shared copies per the
  mockup's own dev-comment — any future RSVP/poll UI change must be applied to both files).
- `ProBadge.tsx` (the "PRO" pill next to author names) was checked and already matched the
  mockup's `rounded-sm` style (`borderRadius: Math.max(3, size*0.3)`) — no change needed.

### Member Directory & Public Profiles — visual rebuild (§12, June 2026)

`mockups/web/moveee_directory.html` (4 frames: People Near Me Desktop, Public Profile Community
Tab Desktop, Public Profile Portfolio Tab split gated/unlocked Desktop, Mobile Companion). Diffed
directly against the mockup HTML, not the prose spec. Touches `packages/shared/components/connect/
MemberDirectory.tsx` (shared — directory grid + member cards), `apps/connect/app/feed/feed.css`
(`mco-*` namespace), and `apps/connect/app/connect/[username]/{CommunityTab,PortfolioTab,
profile.css}` (`prf-*` namespace).

- `.prf-tab--active::after` (the active Community/Portfolio tab underline) was `var(--ink)` —
  mockup uses `border-ochre` for the underline while keeping the tab text itself `text-ink` (same
  text-stays/underline-changes pattern already established for Settings tabs in §10 — don't change
  the text color, only the underline).
- `MemberDirectory.tsx` was missing the mockup's "{N} members near you" live count caption next to
  the filter controls — added a `.mco-dir-count` span, monospace, muted, rendered only once loaded
  and non-empty.
- Member card footer links were plain underlined text labels ("Website", "LinkedIn", …) — mockup
  renders a footer row (top border, gap) of circular 32px icon-glyph buttons (🌐 / `in` / `ig` / `𝕏`)
  followed by a trailing ochre "View Profile →" link. Rebuilt `.mco-member-links`/`.mco-member-link`
  in `feed.css` to match, and changed the `links` array in `MemberDirectory.tsx` to carry a `glyph`
  per platform (rendered instead of the label) plus reordered to website/linkedin/instagram/twitter
  per the mockup's icon order.
- Portfolio tab's pinned community posts (`PinnedPostCard`) rendered identically to regular
  portfolio items, with no visual distinction — mockup gives pinned cards an ochre border, a 📌 pin
  glyph in the top-right corner, and a colored category badge (Showcase=blue, Cultural Take=purple,
  Hidden Gem=green, Food Review=red, fallback=ochre) instead of the generic type label. Added a
  `PINNED_BADGE` lookup map in `PortfolioTab.tsx` and matching `.prf-pinned-card`/`.prf-pinned-pin`/
  `.prf-pinned-badge--*` rules in `profile.css`.
- `.mco-dir-empty` (the "No one near you yet" empty state) had no icon and a flat background —
  mockup shows a dashed border card with a large grayscale 👥 glyph above the title. Added both.
- `CommunityTab`'s "Load more" button was a `.prf-filter-pill`-styled pill with an inline padding
  override — mockup's is a plain full-width text link (ochre, bold, underline-on-hover, no
  border/background). Replaced with a dedicated `.prf-load-more` class.
- CSS tokens verified against the live `globals.css` before use (per the project's `--ochre`-vs-
  `--gold` precedent): `--paper-deep` (`#f2f2f2` light) is close enough to the mockup's standalone
  Tailwind `#F5F5F5` — no token fix needed; `.prf-badge-tooltip`'s new shadow uses
  `var(--shadow-tooltip, <fallback>)`, the same already-established fallback pattern used elsewhere
  in `globals.css` (no literal `--shadow-tooltip` variable exists anywhere in the codebase, by
  design — see the existing precedent at the line that already does this).
- **Deliberately left unchanged**: regular (non-pinned) `PortfolioCard` items still open a click-to-
  modal lightbox rather than the mockup's hover-reveal "View project" overlay — a judgment call
  favoring touch/accessibility-friendliness over literal mockup replication, since hover-reveal
  controls don't work on touch devices (see the existing "hover-revealed elements need a mobile
  always-visible override" lesson from the Lifestyle Shop mobile-responsive pass) and there was no
  mockup-specified touch fallback for this interaction.
- **Not visually verified in a browser** — same `NEXTAUTH_SECRET`/WordPress credentials gap as the
  Dashboard/Settings/Wallet rebuilds above. Verified via `tsc --noEmit` (clean) on
  `MemberDirectory.tsx`/`PortfolioTab.tsx`/`CommunityTab.tsx` and CSS brace-balance checks on
  `profile.css` (110/110) and `feed.css` (149/149). Re-check pixel fidelity against
  `mockups/web/moveee_directory.html` in a real environment before considering this fully closed.

### Notifications & Analytics — visual rebuild (§13, June 2026)

`mockups/web/notifications_analytics.html` diffed directly against the live components, not the
prose spec. Touches `packages/shared/components/NotificationBell.tsx` (shared header dropdown),
`apps/connect/app/member/notifications/NotificationsClient.tsx` (full-page list), and
`apps/connect/app/member/analytics/AnalyticsClient.tsx` (stat cards, SVG bar/line charts, top
posts). No CSS files were touched in this pass — all three components use inline `style={{...}}`
objects exclusively, so there's nothing to brace-balance-check, only `tsc --noEmit`.

- **Recurring color-family bug, found in two separate files**: both `NotificationBell.tsx`'s
  dropdown rows and `NotificationsClient.tsx`'s full-page rows used a **gold**-family tint
  (`rgba(179,130,56,...)` = `#b38238`) for the unread-row background — the mockup specifies an
  **ochre/rust** tint (`#c5491f` at low opacity) instead. Fixed in both files (dropdown rows in
  `NotificationBell.tsx` in an earlier pass this session; full-page rows in
  `NotificationsClient.tsx` in this pass). The same gold-vs-ochre mixup recurred a third time in
  `AnalyticsClient.tsx`'s Top Posts rank-#1 badge (see below) — **if a future surface shows an
  unread/highlight/rank-1 accent that looks "off-brand," check whether it's using `--gold`
  (`#b38238`, amber) where the mockup actually wants `--ochre` (`#c5491f`, rust)** — this is now a
  3-for-3 pattern in this codebase, not a one-off.
- `NotificationBell.tsx` (dropdown): badge border, dropdown shadow, mark-all-read color+weight,
  the unread/read background fix above (+ matching hover handlers), timestamp color+font, and the
  footer redesigned from a conditionally-shown link to an always-visible sticky bottom bar.
- `NotificationsClient.tsx` (full page): header row rebuilt into a fixed-height (64px) banded bar
  with its own background/border (was a plain flex row with `marginBottom`); row padding increased
  to a uniform 20px with 16px gap (was 14px/14px); emoji size increased to 24px, title to 15px;
  body/date text now conditionally colored brighter when unread vs. muted when read (previously
  both were always `var(--mute)` regardless of read state); unread dot enlarged 7px→8px; added a
  client-side "Load more" pagination affordance (`visibleCount` state, `PAGE_SIZE = 20`, slices the
  already-fetched `items` array — the notifications API has no offset/pagination param wired up
  server-side, so this is a pure client-side reveal rather than a new network request per page).
- `AnalyticsClient.tsx`: the one confirmed functional/color bug was the Top Posts rank-#1 badge
  using gold (`#b38238`) instead of ochre (`#c5491f`) — fixed. Remaining changes are pure visual
  polish to match the mockup: chart gridlines in both `BarChart` and `LineChart` changed from a
  solid `#e5ddd0` line to a dashed (`strokeDasharray="4 4"`) `#c8bfb0` line; axis/label text color
  changed from `#9c8e7a` to the project's documented `var(--mute)`-equivalent literal `#7a6f5c`
  throughout both charts; `StatCard` restyled from a flat tan card to a white card with 12px
  radius, a subtle box-shadow, and a monospace uppercase label (was a plain sans label); the Top
  Posts container restyled from the generic shared `.mem-card` class to its own white
  card-with-shadow wrapper (the mockup gives this section a distinct rounded/shadowed treatment),
  and each row's reaction/comment counts switched from a three-column plain-number layout to
  emoji-prefixed (`❤️`/`💬`) counts on one line plus a bold "{N} Eng" total beneath.
- **Confirmed already correct, no bug** — checked against the mockup and found matching, no
  changes made: the 6-stat-card grid (Credit Balance, Points, Posts, Badges, Earned (30d), Spent
  (30d)); `BarChart`'s earned/spent bar colors (`["#b38238", "#c5491f"]`, gold=earned/ochre=spent —
  matches the mockup's `chart-earn`/`chart-spend` tokens exactly); `LineChart`'s call-site color
  override (`color="#2a6496"`, a one-off blue distinct from both ochre and gold, matching the
  mockup's dedicated `chart-line` token); the "← Back to Dashboard" link's `var(--ochre)` color.
- **Not visually verified in a browser** — same `NEXTAUTH_SECRET`/WordPress credentials gap as
  every other Figma rebuild pass in this file. Verified via `tsc --noEmit` (clean) on
  `apps/connect`. Re-check pixel fidelity against `mockups/web/notifications_analytics.html` in a
  real environment before considering this fully closed.

### Authentication Flow — visual rebuild (§17, June 2026)

`mockups/web/authentication_flow.html` diffed directly against the 5 live auth pages in
`apps/connect/app/` — `login/page.tsx`, `register/page.tsx`, `register/complete/page.tsx`,
`forgot-password/page.tsx`, `reset-password/page.tsx`. All five already had the correct
functionality (NextAuth credentials/passkey/Google sign-in, registration verification flow,
forgot/reset password) — this was a targeted visual fidelity pass, not a rebuild, same as the
§9–§15 passes before it. All five files use inline `style={{...}}` / a `Record<string,
React.CSSProperties>` object at the bottom of the file (no CSS modules/files for this surface),
so verification was `tsc --noEmit` only — no brace-balance check applicable.

- **Systemic `.form-label` fix, all 5 pages**: every form label across the auth flow used a
  bold, dark, 13px treatment (`fontSize:13, fontWeight:600, color:"#14110d"`) — the mockup's
  `.form-label` token is light/muted/non-bold (`fontSize:11, fontWeight:400, color:"#7a6f5c"`),
  matching the same label styling already used elsewhere in the codebase (e.g. Settings'
  `.mem-field-label` per §10). Fixed in `login`, `register`, `register/complete`,
  `forgot-password`, `reset-password` — this is now the 5-for-5 pattern across the whole flow,
  not a one-off.
- **`login/page.tsx`**: error-state inputs (`username`/`password`) get a visible red-tinted
  border (`rgba(192,57,43,.5)`) when an error is present, instead of staying neutral; the
  Google "G" icon button restyled to match the mockup's icon sizing/spacing; the
  forgot-password/create-account footer links consolidated into a single flex-column container
  (`gap: 12`) instead of two separately-margined `<p>` tags.
- **`register/page.tsx`**: same footer-consolidation treatment as login (sign-in link +
  "Upgrade after joining" link into one flex-column block).
- **`reset-password/page.tsx`**: added a `successBlock` style (green-tinted card —
  `background:"#f0fdf4"`, `border:"1px solid rgba(39,174,96,.15)"`, `color:"#27ae60"`) for the
  post-submit success message, matching the mockup's `.success-block` pattern — previously this
  state had no dedicated styling.
- **`register/complete/page.tsx`** (Steps 2/3 — DOB/country/city/occupation, interests,
  membership tier):
  - Membership tier card: `tierLabel` changed from a prominent bold 17px dark heading to a
    muted uppercase eyebrow-style label (`fontSize:11, fontWeight:400, textTransform:
    "uppercase", color:"#7a6f5c"`); `tierPrice` changed from a bold brownish accent
    (`color:"#8b6f47"`) to a large dark serif price (`Georgia, serif, fontWeight:300,
    fontSize:28`) — matching the serif/weight-300 heading pattern used across the rest of the
    auth flow (login/register/forgot-password/reset-password headings all follow this same
    `Georgia, serif` + `fontWeight:300` convention).
  - `savingsTag` color corrected from brand ochre/rust (`#c5491f`/`#fdf2f0`) to a distinct
    semantic green (`#27ae60`/`#e6f4ea`) — "savings" is a positive/success indicator, not a
    brand-accent callout, consistent with the green/success token already established
    elsewhere (e.g. the Wallet/Perks/Coupons rebuild's `--success` token, §11).
  - Billing-cycle toggle (Monthly/Annually) softened from a solid black/white active pill to a
    white-background "chip" with a subtle shadow (`boxShadow: "0 1px 3px rgba(20,17,13,.12)"`)
    when active, matching the mockup's lighter toggle treatment.
  - Interest-grid pills' active state changed from a light background tint + ring box-shadow to
    a solid black fill with white label text, matching the mockup's selected-state styling. No
    changes to the underlying 18-slug `INTERESTS` data or 3-column grid layout — visual-only.
  - The `ProgressBar` helper component's step-indicator sizing (32px circular nodes) was left
    unchanged — a minor, deliberately accepted deviation, not revisited in this pass.
- **Dead code removed**: `apps/connect/app/login/login/` (`page.tsx` + `layout.tsx`) — an
  orphaned duplicate route under `/login/login` with zero genuine source references anywhere in
  the codebase. Confirmed dead before removal (not a in-progress feature) and removed via
  `git rm -r`. Its removal left stale references in the auto-generated Next.js route-validator
  type files (`.next/types/validator.ts`, `.next/dev/types/validator.ts`) that only cleared
  after `rm -rf .next` — if a future `tsc --noEmit` run reports errors pointing at a route you
  just deleted, clear the `.next` cache before assuming the deletion is incomplete.
- **`packages/shared/components/PasskeyBanner.tsx` deliberately out of scope** — it's a
  dashboard-context component (rendered on `/member`, not any of the 5 auth pages above); the
  mockup's passkey-prompt frame is illustrative of the concept, not a literal target for this
  pass.
- **Not visually verified in a browser** — same `NEXTAUTH_SECRET`/WordPress credentials gap as
  every other Figma rebuild pass in this file. Verified via `tsc --noEmit` (clean, zero errors
  after clearing the stale `.next` cache) across all 5 edited files. Re-check pixel fidelity
  against `mockups/web/authentication_flow.html` in a real environment before considering this
  fully closed.

### Overlays & Micro-interactions — visual rebuild + dark-mode hex-color fix (§18, June 2026)

Two related fixes landed in the same pass: a genuine dark-mode bug (several shared
`pulse/` components hardcoded hex colors in inline styles instead of the theme-aware
CSS variables already defined in `apps/connect/app/globals.css`, so they didn't adapt
when dark mode was toggled), and the §18 Overlays & Micro-interactions build itself,
diffed against `mockups/web/moveee_overlays.html` (8 frames) — not the prose spec.

**Dark-mode hex-color bug** — `packages/shared/components/pulse/FeedCard.tsx`,
`CommunityDetailModal.tsx`, `DirectoryDetailModal.tsx`, `HappeningDetailModal.tsx`,
`PulseDetailModal.tsx`, `QuoteDetailModal.tsx` were audited for literal hex/rgba colors
on text, borders, and backgrounds that should track theme state, and swapped to the
existing `var(--ink)`, `var(--mute)`, `var(--rule-dark)`, `var(--paper-warm)`,
`var(--error)`, `var(--success)` tokens (all already defined with both light and dark
values in `globals.css`) wherever a literal would otherwise paint the wrong color in
dark mode. No new CSS variables were introduced — every fix maps onto a token that
already existed.

**Overlays frames (`mockups/web/moveee_overlays.html`)**:
- **Frame 1 (Locked Template Pill)** — already implemented correctly pre-pass
  (`SubmitPost.tsx`'s `TEMPLATE_REP_GATE`/dimmed-pill/lock-tooltip, see the Composer
  gating section above); no changes needed.
- **Frame 2 (Report Post Inline States)** — `FeedCard.tsx`'s report flow already had
  the spam/harassment/inappropriate radio expansion; this pass added dimming
  (`opacity`) on the `ReactionBar` wrapper and comment-count button while
  `reportState !== "idle"`, and bolded the post-submit "sent" confirmation text, to
  match the mockup's de-emphasis of secondary actions during a report submission.
- **Frame 3 (Destructive Confirm Modal)** — checked against
  `packages/shared/components/ui/ConfirmDialog.tsx`-equivalent web pattern; already
  matched, no changes.
- **Frame 4 (Sign Out Dropdown)** — `apps/connect/components/header.css`'s
  `.ch-user-item--danger`/`:hover` used `#c0392b`/`#fff5f5`; mockup specifies a
  distinct orange (not the brand ochre/rust and not the `--error` red) for this
  specific destructive action — changed to `#e65100`/`#fef2f2`.
- **Frame 5 (Image Lightbox)** — already implemented (see
  `DirectoryLightboxImage.tsx` precedent and existing pulse-modal lightbox usage); no
  changes.
- **Frame 6A (Composer Success Banner)** — already matched the mockup's purple
  (`#7A4DA0`/`#F3EEF8`) tokens exactly; no change.
- **Frame 6B (Composer Link-Blocked Error)** — `apps/connect/app/globals.css`'s
  `.composer-error` used plain `#c5491f` (ochre) with no font-weight; mockup wants the
  semantic error-red plus bold — changed to `var(--error); font-weight: 700;`. Same
  ochre-vs-error mixup pattern documented elsewhere in this file (gold-vs-ochre,
  ochre-vs-error) — this is now recurring across at least 3 separate features.
- **Frame 6C (Perk Redeem Success)** — `apps/connect/app/connect/perks/perks.css`'s
  `.perk-success-title` used a literal `#2e7d32` green; changed to `var(--success)`.
  The existing success-state structure (full success section, not a modal) was kept
  as-is — only the color token was a bug.
- **Frame 6D (Perk Redeem Error)** — same `perks.css`'s `.perk-modal-error` had the
  identical ochre-vs-error bug (`#c5491f`, no weight) as Frame 6B; fixed to
  `var(--error); font-weight: 700;` with matching `rgba(198,40,40,...)`
  background/border (was `rgba(197,73,31,...)`).
- **Frame 7 (For You Nudge Cards)** — two fixes in
  `packages/shared/components/pulse/PulseFeed.tsx` and `apps/connect/app/pulse-layout.css`:
  the no-interests banner's inline styles were literal hex (`#fdf5e6`/`#e8d8b0`/
  `#7a6f5c`/`#14110d`) — swapped to `var(--paper-warm)`/`var(--rule-dark)`/
  `var(--mute)`/`var(--ink)` so the banner is dark-mode-safe; the "For You →" button
  was a small inline pill (`borderRadius: 3`) instead of the mockup's full-width pill
  (`borderRadius: 999, width: "100%"`); `.pulse-foryou-hint`'s background/border were
  tightened to the mockup's exact `rgba(179,130,56,...)` gold tint at `12px` radius
  (was a flat `var(--paper-warm)` at `4px`) — the rgba-overlay approach stays
  dark-mode-safe since it tints whatever paper background shows through rather than
  setting an opaque literal.
- **Frame 8 (Split Context Actions)** — covered by the Frame 2 work above (dimming
  secondary actions during an in-flight state); no separate changes needed.

**Not visually verified in a browser** — same `NEXTAUTH_SECRET`/WordPress credentials
gap as every other Figma rebuild pass in this file. Verified via `tsc --noEmit`
(clean) in both `apps/connect` and `apps/site`, and a CSS brace-balance check on all 4
touched CSS files (`globals.css`, `header.css`, `perks.css`, `pulse-layout.css` — all
balanced). Re-check pixel fidelity against `mockups/web/moveee_overlays.html` and
dark-mode behavior in a real environment before considering this fully closed.

### Dark-mode hex-color audit — full sweep of `packages/shared/components/pulse/` and `connect/` (June 2026)

Follow-up to the Overlays pass above: a full audit of every remaining file in
`packages/shared/components/pulse/` and `packages/shared/components/connect/` for the
same hardcoded-hex-instead-of-CSS-variable bug (literal colors that don't track theme
state, so they paint wrong in dark mode). Bare hex literals found and fixed (same
`var(--token, #original-literal)` pattern as elsewhere — fallback preserves the exact
light-mode value) in: `ReactionBar.tsx` (border-top, inactive reaction text/icon,
copy-link button default/copied states), `SourcePreviewCard.tsx` and
`InternalLinkCard.tsx` (border/background + hover-handler literals, title/description/
domain-suffix text colors), `CommentThread.tsx` (input style object, section border,
comment list border/author/date/body colors, auth CTA box, form labels, status
messages, submit button), `HashtagText.tsx` (mention button color), 
`StoopReminderCard.tsx` (icon circle background), `EventSpotlightCarousel.tsx`
(category color fallback, card background, featured-stripe/star color, date/venue/title/
price text, outer container background, heading, "See all →" link — also introduced
`var(--cat-community-bg, #edf7ed)`/`var(--cat-community-fg, #2e7d32)` for the
`isCommunity` badge, which are **not** real defined CSS variables in `globals.css`; the
fallback hex is what actually renders in both themes today — either map these to a real
existing token or treat as a known follow-up if dark-mode fidelity on that one badge
ever matters), and `Stoop.tsx` (`connect/`, error block + ink/paper button-text
pairing). `MemberDirectory.tsx` (`connect/`) was checked and is genuinely clean — already
used CSS variables throughout, no changes needed. `ImageLightbox.tsx` is intentionally
theme-independent (a full-screen photo lightbox with a black scrim and white controls
should not change with site theme — confirmed not a bug, left as-is).

`PulseFeed.tsx` had 8 bare-hex spots fixed, all using the same `var(--token,
#original-literal)` pattern as the rest of this file's dark-mode fixes (fallback
preserves the exact original value so light mode is pixel-identical, only dark mode
changes): page wrapper background (`#ffffff` → `var(--paper, #ffffff)`); the mobile "For
You" filter pill's active-state background/text/border (`#14110d`/`#fff`/`#14110d` →
`var(--ink, #14110d)`/`var(--paper, #fff)`/`var(--ink, #14110d)` — the white text needed
to become `var(--paper, #fff)` rather than staying literal, since it's paired with the
`--ink`-tracking background and the two invert together in dark mode); the mobile type
filter pill's active state (same ink/paper-pairing fix, plus the ochre accent
`#c5491f` → `var(--ochre, #c5491f)` for consistency even though the ochre literal alone
wasn't a bug); the "⊞ Sections" toggle button (background/text/shadow, same
ink/paper-pairing + ochre-wrapping pattern); the Sections/Categories dropdown panel's
border/background; the dropdown's nav link text/border-right; the empty-feed-state text
(`#aaa` → `var(--mute, #aaa)`); the "Loading…" text (`#bbb` → `var(--mute, #bbb)`).

**`PulseCard.tsx`, `PulseStory.tsx`, `CategoryPage.tsx` are confirmed dead code** (no
imports anywhere in the codebase, verified via Grep) and were initially skipped in this
pass despite having the same class of hex-literal bugs — fixing dead code is normally
wasted effort. **Fixed anyway in a follow-up pass at explicit user request** (override of
the deferral) — all three now use the same `var(--token, #fallback)` pattern as the rest
of the audit (`--paper`/`--rule`/`--mute`/`--ink`/`--ink-soft`/`--ochre`), with their
categorical badge maps (`ARM_STYLES` and its `armStyle`/`relatedArmStyle` fallbacks)
deliberately left as plain literals, consistent with other untokenized category-badge
maps elsewhere in the codebase (e.g. `PINNED_BADGE`). If either file is ever wired back
up, no further dark-mode sweep should be needed for it on that basis alone.

**Not visually verified in a browser** — same `NEXTAUTH_SECRET`/WordPress credentials
gap as every other pass in this file. Verified via `tsc --noEmit` (clean) in both
`apps/connect` and `apps/site`.

---

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

## Cron / scheduled jobs — split ownership between WP-Cron and cron-job.org (June 2026)

Two independent schedulers trigger Next.js worker routes via `Authorization:
Bearer {CRON_SECRET}`. They are **not** interchangeable and must not both
schedule the same job — discovered June 2026 when a cron-job.org dashboard
audit showed several jobs double-firing on mismatched schedules (e.g.
directory seeding running daily via cron-job.org while `Culture_Cron`
scheduled it weekly), and three jobs auto-disabled ("Inactive") by
cron-job.org after repeated failures.

**WP-Cron (`Culture_Cron`, `culture-community/includes/core/class-culture-cron.php`)
is the canonical owner for jobs that have WP-side logic**, triggered by a real
Lightsail server crontab every 30 min (`DISABLE_WP_CRON=true`):
grace period check (daily), directory seed (weekly), pulse refresh (daily),
events seed (daily), quotes seed (weekly). **Do not also schedule these five
on cron-job.org** — disable any matching entries there.

**cron-job.org is the sole scheduler for jobs with no WP-side logic at all**
(there is nothing to make canonical in PHP for these): `trivia daily`
(`/api/games/trivia/daily`), `who said it daily`, `quote audit`. This is
intentional, not a stopgap — keep these on cron-job.org's free tier rather
than inventing WP-Cron hooks for them.

**`/api/games/crossword/daily` needs no scheduler at all** — it lazy-generates
and caches the puzzle on the first player request each day (see the route
file for the WordPress-cache → Gemini → static-bank fallback chain). Any
cron-job.org entry for it should be deleted, not fixed.

**Important: there is no Vercel-native cron in this project** — `apps/site/vercel.json`
is `{}`. Some route file comments previously claimed "invoked by Vercel cron"
(stale/aspirational, fixed June 2026) — if you see that phrasing anywhere
else, it's wrong; the real trigger is one of the two schedulers above.

**Timeout mismatch gotcha:** cron-job.org's per-job request timeout (configured
in its dashboard, commonly defaulted to 30s) can be shorter than a route's own
`maxDuration` (e.g. `auto-seed` is 300s, `pulse/refresh` is 120s) — cron-job.org
reports "Failed (timeout)" even when the underlying serverless function may
still complete fine server-side. When keeping a job on cron-job.org, set its
timeout to match or exceed the route's `maxDuration`.

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

The community feed used to live at the bare `/connect` path in `apps/connect`. It now
lives at `app/feed/` (`page.tsx`, `feed.css` — renamed from `connect.css`, `ConnectHero.tsx`,
`loading.tsx`), and `apps/connect/proxy.ts` redirects `/` and the old `/connect` path to
`/feed`. The `app/connect/` directory still exists and still serves its other sub-routes
unchanged: `app/connect/people/`, `app/connect/membership/`, `app/connect/perks/`,
`app/connect/[username]/` — only the feed page itself moved. `apps/site/proxy.ts`'s
`connectPrefixes` cross-domain redirect array includes both `/connect` and `/feed` so
either path on themoveee.com correctly forwards to web.themoveee.com.

**If you add a new link to the community feed**, point it at `/feed`, not `/connect` —
`/connect` alone now only resolves via the back-compat redirect. Links to the sub-routes
(`/connect/people` etc.) are unaffected and should stay as-is.

---

## Connect app left-nav rail (replaces the top header, July 2026)

`apps/connect/components/Header.tsx` renders **two full markup trees on every page, always**,
with visibility toggled purely by CSS media query at the **860px** breakpoint (same breakpoint
the 3-column `/feed` layout already used) — there is no conditional rendering in JS, to avoid a
hydration mismatch between server and client:

- **`<aside className="ch-rail">`** — the `>=860px` surface. A WhatsDhype-style left sidebar:
  logo → search bar button (opens `SearchModal`) → main nav (Feed/Events/Games/Magazine) →
  spacer → a bottom block (`.ch-rail-bottom`) with `RAIL_LINKS` (**Discover Culture**, **People
  Near Me**, **Stoop IRL**, **Interest Hubs** — in that order), theme toggle, notification bell,
  then account (avatar+name+tier opening a dropdown that opens **upward** via
  `.ch-user-menu--rail`, since it's anchored near the bottom of a tall sidebar) or Sign in/Join
  when logged out. `position: sticky; top: 0; height: 100vh`.
- **`<header className="ch-header">`** — the `<860px` surface, essentially the old top bar
  (unchanged), except the inline Discover/Hubs/Stoop links and theme toggle were removed from
  `.ch-right` (to avoid crowding an already-tight mobile bar) and now only live in the mobile
  hamburger drawer (`#ch-mobile-nav`), which mirrors the rail's bottom block content.

**This replaced per-page sidebars, not just added a new one.** `/feed`'s old
`.pulse-sidebar-left` (Content Type filter list + Sections links + a "For You" personalised
link) is now fully redundant with the global rail + search modal and was **removed from
`PulseFeed.tsx` entirely** — the feed's left rail is gone, replaced by a simple **For You /
Latest tab pair** (`.feed-tabs`) directly above the post list (Twitter/Instagram pattern), and
the "About Moveee" card moved to the top of the right sidebar. `apps/connect/app/pulse-layout.css`
gained a `.pulse-layout--feed` modifier (2-column: timeline + right rail, no 240px left track) —
**the base 3-column `.pulse-layout`/`.pulse-sidebar-left` classes are still real and still used**
by `pulse/[slug]/page.tsx` and `community/[slug]/page.tsx`'s own (unrelated, inline-styled)
sidebars, so don't delete those base rules when touching this file — only `/feed` opted out via
the modifier class.

**Sticky offset gotcha (fixed as part of this change):** `.pulse-sidebar-left`/
`.pulse-sidebar-right`'s sticky `top` used to be `60px` (with `max-height: calc(100vh - 60px)`)
to clear the old sticky top header. Since the header is now a left rail at `>=860px` (no sticky
top bar to clear at that width — the top header only exists at `<860px`, where both sidebars are
already `display: none` anyway), both were reverted to `top: 0` / `max-height: 100vh`. **If you
ever reintroduce a sticky top bar at desktop widths in this app, this offset will need to come
back.**

**Global search** (`Cmd+K`/`Ctrl+K` or the rail's search button) opens `SearchModal.tsx` —
content-type chips (Pulse/News/Editorial/Event/Directory/Quote) and category chips are the
**replacement** for the filtering controls that used to live in `/feed`'s left sidebar and
category pill strip; they don't filter the feed itself, they filter a separate search query.
Backend: `apps/connect/app/api/search/route.ts` proxies to WordPress core's **native**
`GET /wp-json/wp/v2/search` (not a custom `culture/v1` endpoint) with a `subtype` param mapped
from the content-type chip — confirmed via live testing to genuinely cover all six content types
(`culture_post`, `pulse_story`, `post`, `culture_event`, `culture_directory`, `culture_quote`).
The category chip has no true taxonomy-aware filter on this endpoint, so it's folded into the
search query as an extra term (`${q} ${category}`) — an approximation, not a real facet. Hrefs
are reconstructed from `subtype` + a slug parsed out of WP's raw permalink (mirroring the route
shapes in `packages/shared/lib/unified-feed.ts`), since `wp/v2/search` doesn't return app-facing
routes. `SearchModal.tsx`'s `CATEGORIES` array is a manually-kept-in-sync copy of the categories
that used to live in `PulseFeed.tsx` — no shared source of truth, same caveat as the
notification-icon maps and `TEMPLATE_REP_GATE` elsewhere in this file.

`apps/connect/app/layout.tsx` now wraps `ConnectHeader` + `<main>` + `Footer` in a
`.cw-shell`/`.cw-shell-content` flex pair (`display:flex` only at `>=860px`, so the rail and
page content sit side-by-side) — `AppDownloadBanner`/`AppDownloadModal`/`GlobalAuthModal` are
deliberately kept **outside** `.cw-shell` so the download banner still spans the full viewport
width regardless of the rail.

---

## App download nudge (Connect web only, June 2026)

`apps/connect` (web.themoveee.com) shows a non-blocking nudge encouraging visitors to use
the native Moveee app instead of the web app — "TikTok-style" but explicitly never
blocking. `apps/site` (themoveee.com) does **not** get this — it already has its own
download section (`.mz-download-strip` in `MoveeeZone.tsx`).

Two pieces, both mounted globally in `apps/connect/app/layout.tsx` (alongside
`ConnectHeader`/`Footer`):
- `components/AppDownloadBanner.tsx` — persistent top banner, dismissible (✕ button writes
  `sessionStorage["moveee_app_banner_dismissed"]` — reappears next session, never permanently
  gone).
- `components/AppDownloadModal.tsx` — occasional soft modal, shown at most once per session
  after `PAGE_VIEW_THRESHOLD` (3) page views (`usePathname` change increments a
  `sessionStorage` counter). Strong messaging ("The full experience to connect to culture is
  on the app.") but always offers a de-emphasized "Continue in browser" dismiss — never a
  hard wall, per explicit product decision not to block.
- Styles: `components/app-download-nudge.css`, imported once from `app/layout.tsx`.

**CTA destination — the app is pre-launch (no real App Store/Play Store listing yet).**
Both components link to `https://themoveee.com/#download` rather than a store URL — this
reuses Site A's existing waitlist flow (`MoveeeZone.tsx`'s `.mz-download-strip` +
`WaitlistModal.tsx`) instead of duplicating email-capture infrastructure in `apps/connect`
(which has no anonymous newsletter-subscribe route — only member-scoped
`NewsletterPreferences.tsx`). `MoveeeZone.tsx` has an `id="download"` anchor on the strip and
a mount-time `useEffect` that auto-opens `WaitlistModal` when the page loads with
`#download` in the URL, so the cross-domain link lands the visitor straight on the waitlist
form rather than just scrolling them to it. **Once the app actually ships to the stores,
swap these href targets for real store URLs** (same TODO as the `DEV:` comment already in
`MoveeeZone.tsx` for its own store badges) rather than leaving the waitlist redirect in place.

---

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

The entire "Chapter Leader" / `culture_chapter` system has been removed. Rationale: the
`culture_chapter` CPT was never actually registered via `register_post_type()` anywhere in the
codebase, no assignment UI ever existed for chapter membership (`primary_chapter`/
`secondary_chapter` fields were posted by JS to an AJAX action, `culture_set_chapters`, that had
no PHP handler), and the feature has been fully superseded by the now-functional Literati Connect /
Stoop build (see `docs/literati-connect-plan.md`).

Removed: the `culture_chapter` CPT references, `_culture_chapter_leader_id`/`_culture_chapter_id`
post meta, `_culture_primary_chapter_id`/`_culture_secondary_chapter_id` user meta, the
`chapter_leader` WP role, `class-culture-leader-dashboard.php` (the WP Admin "QR Scanner" +
"Attendance" submenu pages), the `/culture/v1/check-in` REST endpoint, the single/archive
`culture_chapter` plugin templates and their theme counterparts, all chapter-related CSS in both
`culture-community/assets/css/culture-community.css` and `culture-theme/assets/css/theme.css`
(including the homepage "Chapters Grid" section and its customizer background-color wiring in
`culture-theme/functions.php`), the dead `bindChapterSelect()` / chapter-toggle JS in
`culture-community.js`/`culture-admin.js`, and a broken `{chapter_name}` merge tag in the welcome
email template (`class-culture-email-templates.php`) that was declared but never actually
substituted by the sending code — a genuine latent bug caught as a side effect of this sweep.

Deliberately **kept** (still load-bearing, do not remove): the `culture_scan_qr` capability (used
by `class-culture-ticket-payment.php`'s door-staff ticket verification), the `wp_culture_attendance`
table (written by `handle_self_checkin()`, read by `class-culture-gamification.php` for badge
triggers, `class-culture-ticket-payment.php`, `templates/single-culture_event.php`, and
`class-culture-analytics.php`), and `handle_self_checkin()`/`handle_generate_checkin_token()` in
`class-culture-rest-api.php` (the working, member-initiated editorial-event self-checkin flow — see
"Editorial event self-checkin" above).

**Known follow-on, out of scope for this pass**: with `class-culture-leader-dashboard.php` deleted,
nothing in the plugin enqueues `culture-admin.js` anymore (no `wp_enqueue_script` call references
it) — its remaining content (registration form step-nav JS) may itself be dead/unreachable. Not
fixed here since it predates and is independent of the chapter removal; investigate before touching.

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
  `handle_upload_cover_photo()` in `class-culture-mobile-api.php`, stores to
  Cloudflare R2 (see "Mobile image uploads → Cloudflare R2" below), same
  pattern as `handle_upload_avatar()`.
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

## Mobile image uploads → Cloudflare R2 (June 2026)

All three mobile image-upload surfaces (community post images, avatar,
cover photo) store to the **same R2 bucket the web app uses**, not
WordPress's local media library. There are now two parallel ways this
happens — both land in the same bucket, neither is "wrong", pick whichever
pattern matches what you're touching:

1. **Next.js proxy route, pre-existing pattern** (`apps/site/app/api/mobile/...`,
   reached via the `PROXY = "https://themoveee.com/api"` constant in mobile
   screens) — re-uses `packages/shared/lib/r2.ts`'s `uploadToR2()` directly,
   plus a `sharp` re-compression step (community images: resize to
   1600×1600 max, WebP q82; avatar: 400×400 cover-crop, WebP q85). Avatar
   upload (`MemberSettingsScreen.tsx` → `${PROXY}/mobile/me/avatar` →
   `apps/site/app/api/mobile/me/avatar/route.ts`) and community post images
   (`NewPostScreen.tsx` → `${PROXY}/mobile/community/upload-image` →
   `apps/site/app/api/mobile/community/upload-image/route.ts`) both use this
   path. The avatar route saves the resulting URL back to WordPress via
   `POST /mobile/me/avatar-url` (`handle_save_avatar_url()` — URL-only, no
   file handling) since the upload itself already happened in Next.js.
   **Do not "fix" these mobile screens to call the WordPress JWT host
   directly thinking the PROXY route is dead** — it isn't; a prior session
   in this same project mistakenly redirected the community-upload call from
   `PROXY` to `MOBILE_API` believing the Next.js route didn't exist (it does,
   see `apps/site/app/api/mobile/community/upload-image/route.ts`'s git
   history, which predates that "fix"). That call site currently still
   points at `MOBILE_API` and is **not** broken — see point 2 below for why —
   but if you're investigating an upload bug, check whether the Next.js
   route or the WordPress route is actually being hit before assuming either
   one is missing.
2. **WordPress-native R2 upload, new (`class-culture-r2.php`,
   `Culture_R2`)** — a from-scratch PHP AWS SigV4 signer (no AWS SDK
   dependency; raw `wp_remote_request()` PUT), functionally mirroring
   `r2.ts`'s `uploadToR2()`. Used by `handle_upload_image()` (community,
   key prefix `community/{userId}/`), `handle_upload_avatar()` (key prefix
   `avatars/{userId}/`, direct-to-WP path — currently unused by the mobile
   client, which goes through the Next.js proxy instead, but kept R2-backed
   for parity since it's still a reachable registered route), and
   `handle_upload_cover_photo()` (key prefix `covers/{userId}/`) in
   `class-culture-mobile-api.php`. A shared private helper,
   `upload_to_r2_from_request( $request, $key_prefix )`, does the
   validation (MIME allowlist, 8MB cap) + R2 upload for all three. No WebP
   re-compression on this path — uploads the original bytes/MIME type as-is.

**R2 credentials (WordPress side)**: `Culture_R2`'s five private getters
follow the project's standard `defined('CONSTANT') ?: get_option(...)`
pattern (same as `Culture_Perks::hmac_key()`) —
`CULTURE_R2_ACCOUNT_ID`/`culture_r2_account_id`,
`CULTURE_R2_ACCESS_KEY_ID`/`culture_r2_access_key_id`,
`CULTURE_R2_SECRET_ACCESS_KEY`/`culture_r2_secret_access_key`,
`CULTURE_R2_BUCKET_NAME`/`culture_r2_bucket_name` (default
`moveee-media`), `CULTURE_R2_PUBLIC_URL`/`culture_r2_public_url` (default
`https://media.themoveee.com`). WP Admin fields live in the General tab
(`render_general_tab()` in `class-culture-settings.php`), in a "Cloudflare
R2 Storage" section — values must match the same R2 account/bucket the
Next.js apps use (`R2_ACCOUNT_ID`/`R2_ACCESS_KEY_ID`/etc. on Vercel).

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

## Events/Happenings web surface — full visual rebuild (`evt-*` namespace, June 2026)

`apps/connect/app/events/` (homepage `page.tsx`, `[slug]/page.tsx` detail page, and
all of `app/events/components/`) was rebuilt from scratch off a new mockup, replacing
every prior CSS namespace (`ev-*`, `ticker-wrap`/`page-body`/`left-col`/`sidebar`,
`ehl-*`, `rsvp-card`/`info-card`/`artist-strip`, heavy inline `style={{...}}` props)
with a single canonical namespace: **`evt-*`**, fully defined in `app/events.css`.
This is now the only namespace to use for any future work on this surface — don't
reintroduce the old classnames or inline styles even for small tweaks.

- **Three event sources unified into one shape**: editorial/seeded `culture_event`
  CPT events (`getEventsWithFallback()`), community-published `culture_post` events
  with `_template_type = "event"` (`getCommunityPosts()` + `isEventItem()`), and
  backend-created `culture_event` CPT events (same fetch path as the first — no
  special-casing needed, they're indistinguishable from seeded events once published).
  `mapCommunityEvent()` in `app/events/page.tsx` converts a community `FeedItem` into
  the same shape editorial events already use (`cultureInterests.nodes[0]` for
  category, etc.) so both render through the same `EventTimeline`/`EventsCarousel`
  components.
- **`href` override pattern**: `TimelineEvent`/`CarouselEvent` interfaces both carry
  an optional `href?: string`. Editorial events fall back to `/events/{slug}`;
  community events set `href` explicitly to `/community/{slug}` (their real detail
  page) via `mapCommunityEvent()`. Any new mixed-source list component should follow
  this same pattern rather than hardcoding `/events/${slug}`.
- **AI-generated events are unaffected** — `[slug]/page.tsx` still delegates to
  `DiscoveredEventPage` unchanged when `event.isAiGenerated` is true; that component
  and its siblings (`CommunityRadarSection.tsx`, `EventCard.tsx`, `SpotlightCard.tsx`,
  `DiscoveredEventRow.tsx`) were deliberately left untouched by this rebuild.
- **Ticker pattern**: any `evt-ticker-track` (`.evt-ticker`/`.evt-detail-ticker`) needs
  to be rendered as **two tracks** (`evt-ticker-track` + `evt-ticker-track--b`, second
  one `aria-hidden`), not one — the CSS animation moves `translateX(0)` →
  `translateX(-100%)` on a loop, which only looks seamless if the content is
  duplicated into a second track positioned at `left: 100%`. A single track will
  visibly snap/gap at the loop boundary. `events/page.tsx`'s homepage ticker and
  `[slug]/page.tsx`'s detail ticker both follow this `["a","b"].map(...)` pattern.
- `RSVPForm.tsx` was already on the `evt-*` namespace going into this pass (`evt-rsvp-card`,
  `evt-state-card`, `evt-capacity-block`, `evt-submit-btn`, etc.) — no changes needed there.
- City/category archive pages (`city-archive.tsx`/`category-archive.tsx`) delegate to
  the same rebuilt `EventTimeline` and needed only their own header/wrapper classes
  updated to `evt-archive-*`.
- Every class needed for this rebuild already existed in `app/events.css` going in —
  no new CSS was authored, only the JSX/classname layer changed across all 9 files.

---

## Event Spotlight carousel (June 2026)

Horizontally-scrolling carousel merging editorial `culture_event` items + community
`culture_post` events (`templateType === 'event'`) into a ranked highlight strip,
inserted once after the 5th feed item on initial load (never re-inserted on
pagination/infinite scroll). Implemented independently on web and mobile — both
platforms mirror the same scoring/filtering rules, per the project's existing
web/mobile duplication convention (RN can't import `packages/shared`).

### Scoring/filtering utility
- Web: `packages/shared/lib/event-spotlight.ts`
- Mobile: `apps/mobile/src/features/community/eventSpotlight.ts`

Both export `getSpotlightEvents(items: FeedItem[], limit = 10): FeedItem[]`.
Filters to `type === "happening"` or (`type === "community"` and
`templateType === "event"`), hides any event missing 2+ of {image, venue/location,
admission}, returns `[]` (hide the module) when fewer than 2 qualifying events
remain. Score = `isFeatured(40) + completeness(0-30) + log-scale rsvpCount(0-20) +
organiserDirectoryId(10)`; falls back to soonest-upcoming-first sort when none of
the scoring inputs (`isFeatured`/`rsvpCount`/`organiserDirectoryId`) are present on
any candidate.

### Backend fields required for scoring
- `isFeatured`: editorial events read `_culture_is_featured` postmeta; community
  events already had it via `community_event_meta`.
- `rsvpCount`: editorial events previously had none — added
  `Culture_Mobile_API::get_editorial_event_rsvp_count()` (raw SQL count against
  `wp_culture_event_rsvp` by `event_slug`/`status='confirmed'`) for mobile;
  web's `mapRestEventToFrontendShape` already covers it.
- `organiserDirectoryId`: read from `_culture_event_organiser_id` (community) /
  the existing organiser resolution (editorial) on both platforms.
- Wired in `class-culture-mobile-api.php`'s `get_happening_feed_items()` /
  `get_community_feed_items()` (mobile `/mobile/feed`), and in
  `packages/shared/lib/unified-feed.ts` (web) — both feed mappers needed these
  fields added since each builds its own response shape independently.

### UI components
- Web: `packages/shared/components/pulse/EventSpotlightCarousel.tsx`, inserted in
  `PulseFeed.tsx` via array slicing (`visible.slice(0,5)` / carousel /
  `visible.slice(5)`) — declarative slicing achieves "once, at position 5" without
  needing a ref, since position 5 is stable across re-renders.
- Mobile: `apps/mobile/src/components/community/EventSpotlightCarousel.tsx`, wired
  into `ConnectFeedScreen.tsx`'s `FlatList` via a synthetic marker item
  (`id: "__event-spotlight__"`) spliced into `listData` at index 5. The spotlight
  item list itself is computed once into a ref (`spotlightLockRef`) on first
  non-empty load and never recomputed — required because `FlatList`'s `data` array
  changes on every pagination page, and reactively recomputing the spotlight set
  would reorder/jump the already-rendered carousel.

Both platforms reuse existing detail UI rather than building new ones: tapping a
"happening"-type card opens `HappeningDetailModal` (self-managed inside the
carousel component, mirroring the existing `HappeningCard` pattern); tapping a
"community"-type card delegates to whatever the host screen already uses for that
(web: `CommunityDetailModal` rendered by `EventSpotlightCarousel.tsx` itself; mobile:
`onOpenCommunity` callback → the screen's existing `sheetItem`/`PostDetailSheet`).
"See all →" routes to the existing Events tab/screen, not a new one.

### Event-type cards fully removed from the inline feed (replaced, not duplicated)
The Spotlight carousel is the **exclusive** surface for event-type items in the
Connect feed — `isEventItem()` (exported from both scoring utilities) is used to
filter every "happening" and community "event"-template item out of the regular
feed list (`PulseFeed.tsx`'s `filtered` memo on web, `ConnectFeedScreen.tsx`'s
`visibleItems` memo on mobile), regardless of whether that item actually qualifies
for/appears in the carousel. Because of this, the qualifying bar inside
`getSpotlightEvents()` was deliberately loosened to `>= 1` of {image, venue,
price} (down from `>= 2`) so that nearly every event is still discoverable
somewhere rather than disappearing — an event missing all three fields entirely
is rare and likely incomplete/spam. On mobile, the spotlight ref computation
reads from the raw `items` array (not the already-filtered `visibleItems`), since
the event items it needs have been stripped out of `visibleItems` by this exact
filter.

## Editorial event self-checkin (`culture_event` CPT — separate from Literati Connect / Stoop)

This is **unrelated** to the Literati Connect / Stoop check-in system (which uses
HMAC-signed QR on `culture_cluster` posts, see `docs/literati-connect-plan.md`). This one is a
simple SHA-256-hash check-in token on editorial `culture_event` posts.

- WP Admin edit screen for `culture_event` shows a "Generate QR Token" button
  (`render_event_checkin_meta_box()` in `class-culture-post-types.php`) → AJAX
  `culture_generate_checkin_token` → generates a token, stores `hash('sha256', $token)` as
  `_event_checkin_token_hash` post meta, builds
  `https://web.themoveee.com/events/checkin?id={eventId}&t={token}`, renders the QR as an
  `<img src="https://api.qrserver.com/...">` (third-party QR image API, no local QR library).
- **`class-culture-rest-api.php` used to register a second, duplicate copy of this exact metabox
  + AJAX handler** (`add_event_checkin_metabox`/`render_event_checkin_metabox`/
  `ajax_generate_checkin_token`, registered on the identical `wp_ajax_culture_generate_checkin_token`
  hook with a different, non-per-post nonce). Because WordPress only runs the first callback that
  calls `wp_die()` (which `wp_send_json_success`/`_error` do internally) on a shared action hook,
  and `class-culture-post-types.php` loads first in `culture-community.php`, the rest-api.php copy
  was unreachable dead code that also produced a second, confusing "Event Check-in QR" metabox on
  the same edit screen — clicking its button hit the post-types.php handler with the wrong nonce
  format and failed. **Removed (fixed 2026-06-21)** — the canonical implementation is the one in
  `class-culture-post-types.php` only. If you ever need to touch this metabox again, there should
  be exactly one `add_meta_box('culture_event_checkin', ...)` registration and one
  `wp_ajax_culture_generate_checkin_token` handler — check both files if something seems off.
- Member-facing check-in flow: scanning/visiting the URL hits
  `apps/connect/app/events/checkin/page.tsx` → `EventCheckinClient.tsx` → `POST /api/events/checkin`
  → WP `POST /culture/v1/events/self-checkin` (`handle_self_checkin()`), which verifies the token
  hash and records the check-in. **Gotcha (fixed 2026-06-21): `page.tsx`'s `searchParams` prop is a
  `Promise` in this Next.js version (same convention as `params` elsewhere, e.g.
  `app/discover/page.tsx`, `app/cluster/[id]/page.tsx`) — it must be `await`ed.** The page previously
  destructured it synchronously, so `id`/`t` were always `undefined`, tripping the
  `if (!id || !t) redirect("/events")` guard before the session/login check or the actual check-in
  ever ran — symptom: scanning the QR silently bounced to `/events` with no login prompt and no
  check-in confirmation, for both logged-in and logged-out users.
- `wp_culture_attendance` is a separate table, deliberately kept despite the rest of the Chapter
  Leader system being removed (see "Chapter Leader system removal" below) — it's read by
  `class-culture-gamification.php` for badge triggers, `class-culture-ticket-payment.php`'s
  permission checks, `templates/single-culture_event.php`, and WP Admin analytics
  (`class-culture-analytics.php`); do not remove it without checking all of these. The
  `culture_scan_qr` capability is kept for the same reason (still used by
  `class-culture-ticket-payment.php`'s door-staff ticket verification). The REST route that used to
  write to this table (`/culture/v1/check-in`) and the WP Admin "Chapter Leader" dashboard UI that
  called it have both been removed — see below.

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

### Composer client-side gating UI (web, June 2026)

Two client-side affordances added to `packages/shared/components/pulse/SubmitPost.tsx` to
surface server-side gates *before* submit instead of only after a 403 — previously a user
could fill out an entire Poll/Itinerary/Event form, or type a link into a standard Post, and
only find out it was rejected after pressing Post.

- **Reputation-gated template pills**: `TEMPLATE_REP_GATE` maps `poll`/`itinerary` → Taste
  Maker (2,500 rep) and `event` → Culture Contributor (500 rep), mirroring the existing
  server-side gate in `handle_submit_post()` (mobile) and
  `apps/connect/app/api/community/submit/route.ts` (web) — Moveee Pro always bypasses, same
  as the server. `meetsTemplateGate()` checks `session.user.reputation` against this map;
  pills that fail the gate render dimmed with a 🔒 and a `title` tooltip, and clicking one
  shows an inline `.composer-template-lock-tip` banner (auto-dismisses after 4s) instead of
  switching the form to that template. **Keep `TEMPLATE_REP_GATE` in sync with the PHP/route
  thresholds if those ever change** — there's no shared source of truth across the
  PHP/TS boundary here, same caveat as the notification icon maps elsewhere in this file.
- **Inline link-blocked warning**: Citizens (non-`patron`) typing a URL into a standard Post
  now see a `.composer-link-warning` banner ("Links are a Moveee Pro feature…" + an Upgrade
  link to `/register?upgrade=patron`) the moment `URL_RE` matches the text, and `canSubmit()`
  disables the Post button while a link is present for non-Pro users — both mirror the
  link-block rule already enforced server-side in `packages/utils/spam-protection.ts`
  (`checkPostSpam()`'s literal `tier === "patron"` check, no reputation bypass for this one).
  The link-preview fetch effect itself is also now gated on `isPro` so non-Pro users don't
  fire a wasted preview request for a link that will be rejected anyway.
- Both additions are CSS-duplicated across `apps/connect/app/globals.css` and
  `apps/site/app/globals.css` (`.composer-template-pill--locked`, `.composer-template-lock`,
  `.composer-template-lock-tip`, `.composer-link-warning`) — same duplication pattern the
  rest of the composer CSS already follows in both files, since `SubmitPost.tsx` is a shared
  component consumed from both apps (`PulseFeed.tsx`, `CategoryPage.tsx`).

---

## Composer redesign — modal-first flow + dedicated page (web, July 2026)

Reworked how the `/feed` composer opens, based on an approved mockup (Reddit's post-creation
pattern adapted to Moveee's own template system) — this replaced the old "pill expands into
an inline wizard on the same page" behavior. **Mobile app is unaffected** — it already had a
modal-first flow (`TemplatePickerSheet` → `NewPostScreen`); this brings web to the same shape
rather than inventing a third pattern. Only `apps/connect`/`apps/site`'s shared `SubmitPost.tsx`
and its two real consumers (`PulseFeed.tsx`'s feed composer, `CategoryPage.tsx`'s locked-Section
composer) are affected.

### New flow (`/feed`)
1. Clicking `.composer-pill` opens `TypePickerModal.tsx` (`packages/shared/components/pulse/`)
   — a 2-column grid of template tiles (emoji + full label + one-line description from a local
   `MODAL_META` map, reputation-gated tiles dimmed with 🔒 exactly like the old inline pill row
   was), plus a leading "Continue Draft" tile when a saved draft exists.
2. Picking a tile navigates to `apps/connect/app/post/new/page.tsx?template={slug}` (a real
   session-gated route, `redirect("/login?callbackUrl=/post/new")` if logged out) — `SubmitPost`
   now renders full-page instead of inline.
3. The dedicated page's `PostNewClient.tsx` renders `<SubmitPost key={template} initialTemplate=
   {template} onChangeType={...} onSaveDraft={...} onPosted={...} />` — the `key={template}`
   forces a clean remount (fresh state) whenever the template changes, rather than trying to
   reset ~30 pieces of per-template state by hand.
4. `SubmitPost`'s **`onChangeType` prop** is the switch between the two composer shapes: when
   provided, the old always-visible horizontal `.composer-template-bar` chip row is replaced
   with a slim `.composer-slim-bar` (emoji + label + a **Change Type** link that reopens
   `TypePickerModal`) — mirrors mobile's real `templateBar`/"Change format" pattern exactly.
   When `onChangeType` is *not* passed (`CategoryPage.tsx`'s inline, always-open, locked-Section
   composer), the original full chip row still renders unchanged — this was a deliberate
   backward-compat branch, not a full replacement of every `SubmitPost` usage.

### "Posting to" Section picker (replaces the old `<select>`)
The Section/tag control moved from a plain `<select>` buried in the bottom action bar to a
`Posting to: {Section} ▾` pill near the top of the fields column (`.composer-posting-to`/
`.composer-posting-to-wrap`/`.composer-section-menu`) — custom popover, not a native select, so
it can show an **`AUTO`** badge (`.composer-posting-to-auto`) when the Section was set by
`detectTagFromContent()` rather than a manual pick. **No new detection logic was written** —
`tag`/`tagLocked`/`handleTagChange`/`detectTagFromContent()` are the exact same state/functions
that powered the old `<select>`; only the rendering changed. Behavior unchanged from before:
hidden entirely for quote/food-review/event, shown locked (🔒, non-interactive) when `lockedTag`
prop is set (CategoryPage) or `TEMPLATE_TAGS[template]` has a fixed value (Book/Music/Film
Review → Literature/Music/Film, Itinerary → Travel, Creative Showcase → Art), otherwise an
open pill+popover listing the 11 `TAGS` plus a "Main Feed" reset option identical to the old
empty-string option.

### Ratings — Overall folded into the breakdown box, label before stars
Book/Music/Film Review's separate "Overall rating" field above the Production/Lyrics/etc.
breakdown box is gone — `MultiRating` (`packages/shared/components/composer/MultiRating.tsx`)
now takes an optional `overall={{ value, onChange, label? }}` prop and renders it as the box's
last row, set off by a dashed divider (`.composer-multi-rating-overall`) with bigger stars.
`StarRating.tsx` gained a passthrough `className` prop to make this possible without a new
component. Every row (breakdown and Overall) is label-then-stars on one line — the old
`.composer-multi-rating .composer-star-rating` CSS override that stacked label above stars
(`flex-direction: column`) was removed; the base `.composer-star-rating` row layout (already
label-then-stars) now applies inside the box too. Music Review's "Replay" breakdown label is
now **"Replay Value"** — `MultiRating`'s `ratings` items gained an optional `key` field so the
display label and the state key it writes to (`replay`, unchanged) can differ; without it the
key is still derived from `label.toLowerCase()` as before (Book/Film's labels are single words,
so they're unaffected).

### Save Draft
`SubmitPost` gained `initialDraft?: { text?: string; tag?: string }` (hydrates on mount only,
same pattern as the pre-existing `initialTemplate`) and `onSaveDraft?: (draft: { template, text,
tag }) => void` (renders a "Save draft" button in the action bar when passed). **Deliberately
partial scope**: only `text` and `tag` are persisted — ratings, the attached `DirectorySearch`
entry, and images are not, since `File` objects/blob preview URLs can't survive a
`localStorage` round-trip meaningfully. A restored draft brings back the words and the Section;
the user re-attaches images/re-picks the book/album/film if needed. `PostNewClient.tsx` owns
the actual persistence — plain `localStorage`, key `moveee_post_draft_{userId}`, no backend
table. `TypePickerModal`'s "Continue Draft" tile only shows when that key exists for the
logged-in user; selecting it (or the modal itself, from either `PulseFeed.tsx` or
`PostNewClient.tsx`) navigates to `/post/new?draft=1`, which the page reads back on mount. The
draft is cleared on successful post (`onPosted` → `localStorage.removeItem` before redirecting
to `/feed`), never on navigating away without saving — an unsaved draft is just lost, same as
leaving any form.

### Not yet done
Mobile app's own Book/Music/Film Review rating UI (`NewPostScreen.tsx`'s `BookRatingsRow`
breakdown) was **not** given the same Overall-folded-into-box treatment — this pass was scoped
to web only, per the mockup it was built from. Revisit only if the mobile app's rating UI is
explicitly brought into scope later.

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
(attendee list/export) are restricted to Moveee Pro (`patron`) members only** —
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

**Book Review** — `DirectorySearch` (`typeFilter="book"`, `showAuthorField`) for picking/creating the
`culture_directory` book entry → status chips (Finished/Reading/Want to Read) → overall StarRating →
breakdown MultiRating (Writing/Story/Characters/Pacing) → review textarea → favourite quote (ochre
left border, italic) → recommend chips (Yes green / No) → genre chips (multi-select). No images.

Submits to `${MOBILE_API}/community/submit` with extra fields: `linked_directory_id` (the selected
book's `culture_directory` post ID — see "Book Review → directory linkage" below), `book_title`,
`book_author`, `book_status`, `book_overall_rating`, `book_rating_writing/story/characters/pacing`,
`book_fav_quote?`, `book_recommend`, `book_genres?`

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
bookEntry  // DirectoryEntry | null — selected via shared DirectorySearch, not a bespoke search
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

**Every action awards both credits and reputation (no rep-only or credit-only
actions, June 2026).** Previously some "passive" actions (`magazine_read`,
`magazine_share`, `game_completed`, `poll_vote`, `newsletter_reaction`,
`community_like`, `quote_like`) gave 0 reputation by design (Option B) — this
was changed so the mobile "How Rewards Work" breakdown table never shows a
dash in either column. All 19 actions now have nonzero entries in both
`Culture_Gamification::POINTS` and `::CREDIT_BONUSES`.

Admin-configurable per-action overrides for **both** credits and reputation
live under the same `culture_points_{action}` / `culture_credits_{action}`
option-key prefixes (`class-culture-settings.php` → Credits/Reputation
settings tabs). **Do not reintroduce a `culture_rep_{action}` prefix** — that
prefix used to exist for the reputation tab but was never read by any runtime
code (`get_reputation_value()` had zero callers); it was retired in favor of
`culture_points_{action}`, which is what `get_point_value()` (the live path
used by `award_points()`) actually reads. `get_point_values()` (plural, feeds
the mobile rewards table via `handle_points_config()`) delegates to
`get_point_value()` (singular) rather than `Culture_Settings::get_points()`
directly, so the table stays in sync with what's actually awarded at runtime.

A few award call sites bypass the `award_points()` bridge and call
`award_credits()`/`award_reputation()` directly (`poll_vote` in
`class-culture-rest-api.php`, `game_completed` in `class-culture-rest-api.php`,
`magazine_read` in both `class-culture-rest-api.php` and
`class-culture-mobile-api.php`) — if you add a new standalone award call site,
make sure it awards both, using `Culture_Gamification::get_point_value()` /
`get_credit_bonus()` rather than hardcoded literals.

Daily credit cap: `DAILY_CREDIT_CAP = 50` credits per user per day.

### Reputation-gated privileges (implemented)

| Privilege | Minimum tier | Where enforced |
|---|---|---|
| Feed boost (+10 score) | Taste Maker | `useFeedRecommendations.ts` scoreItem() — reads `authorRepTier` on FeedItem |
| Skip new-member review queue | Taste Maker (2,500 rep) | `class-culture-mobile-api.php` handle_submit_post |
| Event template (creation) | Culture Contributor (500 rep), Moveee Pro bypasses | PHP `handle_submit_post()` (mobile) and the web submit route (added June 2026) |
| Poll + Itinerary templates | Taste Maker (2,500 rep), Moveee Pro bypasses | PHP `handle_submit_post()` (mobile, 403) and `apps/connect/app/api/community/submit/route.ts` (web, 403 — added June 2026, web previously had zero gating on these templates since this route bypasses PHP entirely) |
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

## Discover (directory browse feature, June 2026)

A dedicated browse/search surface over `culture_directory` entries (the 11 entry
types: person, place, food, book, film, genre, movement, artwork, concept,
fashion, tv-series) — separate from the existing `/directory` listing page
(`DirectoryGrid.tsx`, which fetches all entries via GraphQL and filters
client-side with no pagination/region/sort). Discover adds server-side
pagination, search, a type filter (always visible, single-select chips), a
region filter, sort options, and a live entry count — implemented identically
on mobile and web per the project's existing web/mobile duplication
convention.

### Backend
- `Culture_Directory::handle_browse()` (`class-culture-directory.php`) — new
  paginated endpoint, registered as `GET /culture/v1/directory/browse`
  (public, `class-culture-rest-api.php`). Params: `q` (optional text search),
  `type` (comma-separated slugs — backend supports multi but both frontends
  only ever send one, since the UI is single-select), `region` (single slug),
  `sort` (`relevant`|`recent`|`rating`|`trending`|`random`), `seed` (integer,
  only used by `sort=random`), `page`/`per_page` (capped 50, default
  20). Returns `{ entries: [...], total, page, perPage, seed }` — `total` is
  `$query->found_posts`, the basis for the filter sheet's live "Show N
  entries" count.
- `sort=trending` orders by `_community_review_count` (existing aggregate —
  no new computation) as a proxy for "most referenced by community posts".
- `sort=random` powers the "Explore More" grid's per-visit shuffle (see
  Mobile/Web sections below) via a seeded MySQL `RAND(seed)` `posts_orderby`
  filter — stable across "Load more" pagination within one visit (same
  client-generated seed reused for every page request) but different on the
  next visit/screen-mount. The client only sends `sort=random` when the user
  hasn't chosen an explicit sort and isn't searching (`sort === "relevant" &&
  !query`) — an explicit "Recently Added"/"Highest Rated" choice or an active
  text search always overrides it.
- Region filtering has no dedicated taxonomy/meta field to query — there's
  only the freeform `_entry_city` string. `Culture_Directory::REGION_CITY_KEYWORDS`
  is a static substring-match keyword table (nigeria/ghana/uk/usa/pan-african)
  resolved via raw SQL against `wp_postmeta` into `post__in` (same documented
  pattern as the `culture_event` meta_query fix — raw SQL resolve-to-IDs
  instead of a `meta_query` LIKE join, with `array(0)` forcing zero results
  rather than an empty array). This is only as accurate as the keyword list;
  extend `REGION_CITY_KEYWORDS` if a city is miscategorized.
- The "subtype" pill shown on each card (e.g. "Music", "Venue") reuses the
  entry's first attached `culture_interest` term — no new per-type subtype
  taxonomy was added.
- `_average_rating`/`_community_review_count` meta (already computed by
  `Culture_Directory::recompute_directory_aggregates()`) is reused as-is for
  card ratings — no new computation.

### Mobile (`apps/mobile`)
- Entry point: compass icon in `ConnectFeedScreen.tsx`'s header, left of the
  notification bell → `nav.navigate("Discover")`. Registered in
  `AppParamList` (`useNav.ts`) and as a screen in `ConnectStack`
  (`navigation/index.tsx`).
- `screens/community/DiscoverScreen.tsx` — search icon toggles a hidden
  search bar; the type-filter chip row is always visible (tapping a chip
  applies immediately); a "Filters" pill opens `DiscoverFilterSheet` for
  region + sort. "Recently Added" horizontal rail (compact cards, `sort=recent`)
  and a "Trending in Community" rail (`sort=trending`) above a 2-column
  paginated "Explore More" grid (renamed from "Browse All", `onEndReached`
  infinite scroll) — the grid defaults to `sort=random` with a per-visit
  seed (`useRef`, regenerated only on screen remount) so default browsing
  always surfaces a fresh mix; an explicit sort choice or active search
  overrides the randomization.
- `components/community/DiscoverCard.tsx` — shared rail/grid card, exports
  `DiscoverEntry` type and the `TYPE_BADGE` emoji/label/color map per entry
  type (compact mode for the rail, full mode with star rating + subtype pill
  for the grid).
- `components/community/DiscoverFilterSheet.tsx` — `BottomSheet`-based panel:
  type pills (mirrors the screen's chip row, kept in sync since the sheet can
  also change type), region pills, sort radios, and a sticky footer button
  that debounce-fetches `per_page=1` against `/directory/browse` with the
  draft filters to show a real `total` count before applying.

### Web (`apps/connect` + `packages/shared`)
- Entry point: compass icon link to `/discover` in `ConnectHeader.tsx`
  (`apps/connect/components/Header.tsx`), shown for both authenticated and
  unauthenticated visitors (the underlying data is public).
- `app/api/directory/browse/route.ts` — proxy to
  `GET /culture/v1/directory/browse` (same pattern as the existing
  `app/api/directory/search/route.ts`).
- `app/discover/page.tsx` — thin server component reading `?type=`/`?region=`
  query params, rendering `DiscoverBrowser`.
- `packages/shared/components/DiscoverBrowser.tsx` — the client component
  mirroring the mobile screen exactly: search toggle, always-visible type
  chips, a "Filters" overlay panel (region + sort + live debounced count),
  Recently Added rail, Trending in Community rail, paginated "Explore More"
  grid (random-by-default, same seed/override rules as mobile above) with a
  "Load more" button (web has no scroll-based infinite scroll here, unlike
  mobile's `onEndReached`). Styled via `apps/connect/app/discover.css`,
  imported as `@/app/discover.css` from inside the shared component — same
  resolution trick `PulseFeed.tsx` already uses for `@/app/pulse-layout.css`.
- Web-only, not duplicated to `apps/site` — Discover is a Site B (Connect)
  community feature, consistent with where `/directory` itself lives.

### Not yet implemented (deferred, lower priority)
- Feed inline treatments for newly-added directory entries (State A: a small
  "New to Discover" card in the main feed; State B: a reference chip on
  community posts that link to a directory entry via `_linked_directory_id`)
  — flagged in the original mockup but not built in this pass.

### Discover web — visual fidelity pass (June 2026)

`mockups/web/moveee_discover.html` ("Moveee - Discover", 3 frames: Discover Home
Desktop 1440px, Filter Panel Desktop Overlay, Mobile Companion 390px) diffed
directly against `packages/shared/components/DiscoverBrowser.tsx` +
`apps/connect/app/discover.css` — the feature itself (pagination, search, type
filter, region filter, sort, rails, grid) was already fully built and correct
going into this pass; only CSS/JSX visual fixes were needed, same methodology
as every other Figma rebuild pass in this file.

- `.disc-filter-apply` was `var(--ink)` — mockup's sticky filter-panel footer
  button is `bg-ochre` (hover `#A93C15`). Fixed.
- Desktop filter panel was a centered bottom-sheet-style modal — mockup's
  Frame 2 is a **right-edge-anchored slide-in panel** (`width: 420px, height:
  100%, border-radius: 16px 0 0 16px` — left-corner radius only). Fixed via a
  `@media (min-width: 720px)` override on `.disc-filter-overlay`
  (`align-items: stretch; justify-content: flex-end`) and `.disc-filter-panel`
  (full height, no bottom-sheet radius). Mobile keeps the original bottom-sheet
  treatment (`border-radius: 16px 16px 0 0`, `max-height: 85vh`) — matches
  Frame 3.
- `.disc-filter-close` was a bare "✕" text glyph — mockup uses a circular
  32×32 `bg-paper-warm` button with an inline SVG stroke-X icon. Rebuilt to
  match (`DiscoverBrowser.tsx`'s close button JSX + a new `.disc-filter-close`
  class).
- `.disc-empty` (no-results state) had no icon and a flat background — mockup
  shows a dashed-border, rounded, tinted-background card with a grayscale icon
  above the text. Added `.disc-empty-icon` (🔍, `filter: grayscale(1);
  opacity: 0.5`) and restyled the container to match.
- Added a "Reset" link (ochre, `.disc-filter-reset`) to the filter panel
  header, shown only when a draft region/sort differs from default — mockup's
  Frame 3 mobile filter sheet has this; desktop panel reuses the same header
  component for consistency. Reset only clears the draft state (region/sort
  inputs) — the user still presses the existing "Show N entries" apply button
  to commit, consistent with the pre-existing draft/apply UX pattern (Reset
  doesn't auto-apply).
- "⚙ Filters" pill button now shows an active-filter count suffix (e.g.
  "⚙ Filters (1)") via a new `activeFilterCount` computed value
  (`region ? 1 : 0` + `sort !== "relevant" ? 1 : 0`), matching Frame 3's
  "⚙ Filters (1)" mobile chip-row treatment.
- Search bar radius split: mockup wants a pill (`999px`) on mobile (Frame 3)
  but `rounded-lg` (8px) + centered `max-width: 480px` on desktop (Frame 1) —
  previously a single radius was used at all widths. Added a `@media
  (min-width: 720px)` override.
- Star ratings now always render 5 characters total — hollow/ghost stars
  (`var(--ghost, #d8cfc0)`) pad out the remainder (e.g. `★★★★☆ 4.4`), matching
  the mockup's fixed 5-star display; previously only filled stars were
  rendered with no padding.
- **Deliberately left unchanged**: the mockup's desktop type-filter is a
  dropdown-trigger + popover (collapsed by default, opens on click), while the
  live implementation keeps the always-visible horizontally-scrollable
  chip row at all breakpoints — the same UX already used on mobile and already
  shipped/tested. Chose consistency across breakpoints over literal mockup
  replication for this one control, the same kind of judgment call as the
  Member Directory portfolio-card hover-vs-touch precedent elsewhere in this
  file. Revisit only if a future pass specifically wants the popover pattern.
- **Not yet implemented in this pass**: Frame 1's dashed-border icon-topped
  "empty state" demo card in the Explore More grid area was a mockup
  illustration of the same `.disc-empty` treatment described above, not a
  separate component — no additional work needed beyond the `.disc-empty`
  fix.
- Verified via CSS brace-balance check on `discover.css` (51/51, balanced)
  and `tsc --noEmit` on `apps/connect` (clean, zero errors, after restoring
  `node_modules` which was missing from this session's sandbox at the start
  of the pass). **Not visually verified in a browser** — same
  `NEXTAUTH_SECRET`/WordPress credentials gap as every other Figma rebuild
  pass in this file. Re-check pixel fidelity against
  `mockups/web/moveee_discover.html` in a real environment before considering
  this fully closed.

### Directory Entry Detail page — visual fidelity pass (June 2026)

`mockups/web/directory_entry_detail.html` ("Moveee Connect - Directory Entry Detail", 4
frames: Desktop Person, Mobile Reordered, Gated Book, Empty Movement). Targets
`apps/connect/app/directory/[slug]/page.tsx` + `apps/connect/app/directory.css`
(`dir-wiki-*` namespace) — **not** `apps/site/app/directory/[slug]/`, which is dead code:
`apps/site/proxy.ts`'s `connectPrefixes` array already includes `/directory`, so that whole
route tree 308-redirects to `web.themoveee.com` and is unreachable in production.

This page was already structurally very close to the mockup going in (same `dir-wiki-*`
classnames, same 220px/1fr/260px three-column grid, same `--dir-*` token values, same
`/discover` back-link, same body-only `ContentGate` paywall pattern, same empty-content
copy, same per-type infobox field definitions for all 11 `culture_directory` entry types)
— this was a targeted fidelity pass, not a rebuild. Fixes applied:

- **Non-cropping images (explicit user requirement):** the Selected Works thumbnail
  (`page.tsx`'s `.dir-wiki-work-img`) and the infobox featured image
  (`.dir-wiki-infobox-img`) both used `objectFit: "cover"` (crops to fill). Changed both to
  `objectFit: "contain"` so the original aspect ratio is always fully visible — both
  container divs already had a background color behind the image (`var(--dir-border)` /
  `var(--dir-dark-bg)`), so `contain`'s letterboxing reads as an intentional fill rather
  than empty space. **If a future image requirement says "don't crop," `contain` +
  a background on the wrapping element is the established pattern here** — don't reach for
  `cover` by default on directory/profile imagery going forward.
- `.dir-improve-btn` was a square (`border-radius: 2px`), ochre-background, mono-font
  button — mockup wants a pill (`rounded-full`), `bg-dir-dark-ink`/`text-dir-dark-bg`
  (i.e. the light `--dir-dark-ink` token on dark `--dir-dark-bg`, since this button sits
  inside the dark `.dir-improve-cta` section), sans-bold 13px. Rebuilt to match.
  `--dir-dark-ink`/`--dir-dark-bg` are named from the *dark section's* perspective (ink =
  the light foreground color used on a dark background, bg = the dark background itself)
  — don't assume "dark-ink" means a dark color literal.
  - `--dir-bg` (used by `.dir-wiki-page`'s background) was never defined in `:root` — only
    `--dir-paper` exists. Dead/typo'd variable reference, silently resolving to nothing.
  - Fixed to `var(--dir-paper)`.
- Upcoming Events card badge (`Happening`) was `border-radius: 2px` — squared off, not a
  pill — and the event card itself was `border-radius: 6px` vs the mockup's `8px`. Fixed
  both (badge to `999px`, card to `8px`).
- `.dir-community-card` (Community Reviews & Takes) used `var(--paper-deep)`/`var(--rule)`
  (the page's tan/neutral globals.css tokens) at `border-radius: 4px` — mockup wants white
  `bg-dir-paper`/`border-dir-border` at `8px`. Also, `.dir-community-stars`,
  `.dir-community-pro-badge`, `.dir-community-star-rating`, and `.dir-community-read-more`
  all used `var(--ochre)` (`#c5491f`, brand rust) where the mockup explicitly specifies
  `#B38238` — that's `var(--dir-ochre)` (this page's own gold token, distinct from the
  global ochre/gold pair, see the `--ochre`-vs-`--gold` precedent elsewhere in this file).
  All four swapped to `var(--dir-ochre)`. **This page has its own `--dir-*` color
  namespace, separate from `globals.css`'s `--ochre`/`--gold` — don't mix the two systems
  when touching `directory.css`.**
- `.dir-wiki-sidebar-empty` ("No related entries yet.") was unstyled inline text — mockup
  wraps it in a centered, bottom-bordered row. Added `display: flex; align-items: center;
  justify-content: center; padding: 12px 0; border-bottom: 1px solid var(--dir-border);`
  plus `font-style: italic` to match.
- `ContentGate` (`packages/shared/components/ContentGate.tsx`, the shared Pro-paywall used
  here and on article pages) was checked against the mockup's Frame 3 gate design (bordered
  box, lock icon, "★ Moveee Pro" label, "You're one step away." headline, pill CTA, price
  footnote via `PatronPrice`) and already matches — it's a shared cross-surface component,
  not specific to this page, so it was deliberately left untouched.
- **Not visually verified in a browser** — same `NEXTAUTH_SECRET`/WordPress credentials gap
  as every other Figma rebuild pass in this file. Verified via `tsc --noEmit` (clean) and a
  CSS brace-balance check on `directory.css` (180/180). Re-check pixel fidelity against
  `mockups/web/directory_entry_detail.html` in a real environment before considering this
  fully closed.

### Directory Entry Detail page — follow-up bug-fix pass (double border, radius, lightbox; June 2026)

User-reported, from a live screenshot of `web.themoveee.com/directory/{slug}`: a double border
under the title area, inconsistent/no border-radius on boxes, and a request to make every image on
the page open in a lightbox. All three fixed in `apps/connect/app/directory.css` and
`apps/connect/app/directory/[slug]/page.tsx`.

- **Double border root cause**: `.dir-wiki-divider` (rendered in JSX immediately above the entry
  body) already draws the single intended rule (`border-top` + `margin: 24px 0`). `.dir-single-body`
  — a "legacy" class name (no `wiki` infix) that looks like dead fallback CSS but is actually still
  the live class used to render entry body HTML on this page — had its own independent
  `border-top: 1px solid var(--dir-border); padding-top: 36px;`, producing two stacked rules.
  Fixed by deleting both properties from `.dir-single-body`; `.dir-wiki-divider`'s own margin
  already provides the spacing. **Lesson: a class name implying "legacy/unused" doesn't mean it's
  dead — grep for actual JSX usage before assuming, especially in this file's "kept for fallback"
  section.**
- **Border-radius**: added/bumped radius on exactly the 5 `dir-wiki-*` box classes that belong to
  this page (confirmed via Grep that every other unradiused `2px` box in `directory.css` belongs to
  the separate directory listing/archive page or `/directory/submit`, out of scope) —
  `.dir-wiki-sidebar-card` (8px, was 0), `.dir-wiki-related-thumb` (2px→6px, kept smaller since it's
  only 36px), `.dir-wiki-improve` (8px, was 0), `.dir-wiki-work-card` (2px→8px),
  `.dir-wiki-infobox` (8px, was 0 — already has `overflow:hidden` so its featured image/rows clip
  cleanly to the new radius).
- **Lightbox**: new generic client component `apps/connect/app/directory/[slug]/DirectoryLightboxImage.tsx`
  — wraps any existing thumbnail markup (`className`/`style` passed through unchanged, so
  `next/image fill` layouts are unaffected), manages its own open state, closes on Escape or
  backdrop click, locks `document.body.style.overflow` while open, renders a fixed full-screen
  `rgba(20,17,13,0.9)` backdrop with a plain `<img>` at `maxWidth/Height: 92vw/92vh` + a close
  button. Wired onto all 5 images on the page: related-entries sidebar thumb, Selected Works card
  thumb, community review avatar, Upcoming Events list thumb, and the right-sidebar infobox
  featured image. **Three of these (related-entries thumb, Upcoming Events thumb) sit inside a
  `<Link>`** — the component's trigger `onClick` calls `e.preventDefault()` +
  `e.stopPropagation()` before opening, so clicking the image opens the lightbox instead of
  navigating; this guard is built into the component itself, so any future image wrapped in it
  is automatically Link-safe with no extra wiring. **If a future page needs an image lightbox,
  reuse this exact component rather than building a per-page one** — it's already generic
  (`src`/`alt`/optional `className`/`style`/`children`).
- **Not visually verified in a browser** — same credentials gap as above. Verified via
  `tsc --noEmit` (clean) on `apps/connect` and a CSS brace-balance check on `directory.css`
  (180/180, confirmed unchanged after these edits).

### Book Review → directory linkage (mobile-only, fixed June 2026)
Book Review posts are backed by `culture_directory` entries (`culture_dir_type = book`),
same as Hidden Gem (place) and Food Review (food) — they were **not** before this fix.
`handle_submit_post()` in `class-culture-mobile-api.php` already saves and reads back
`_linked_directory_id` generically for any `culture_post` template (not gated by
`template_type`), so no PHP changes were needed; the gap was purely in
`NewPostScreen.tsx`, which had a bespoke book search (`bookSearch`/`bookSearchResults`/
`bookSearchOpen` state, a fake `Date.now()`-based ID, city used as a stand-in for author)
that never created or linked a real directory post. Fixed by swapping it for the shared
`DirectorySearch` component (`typeFilter="book"`, `showAuthorField`) — same component
already used by Hidden Gem and Food Review. `bookEntry` is now a `DirectoryEntry | null`
from `DirectorySearch`'s exported interface; the submit payload includes
`linked_directory_id: bookEntry!.id`. Author is stored on the directory entry via the
generic `_about_fields` JSON blob (`[{label: "Author", value: ...}]`), read back by
`Culture_Directory::get_about_field()` and returned as `author` in both
`/directory/search` and `/directory/quick-create` responses — this is the same
mechanism `DirectorySearch`'s `showAuthorField` prop already expected, just not
previously wired up for books. `PostDetailSheet.tsx`'s `TemplateBookReview` now renders
a "View in Directory →" chip when `item.linkedDirectoryId` is set, mirroring
`TemplateHiddenGem`'s existing pattern. Web has no Book Review composer or
feed-rendering at all, so this fix is mobile-only — no `packages/shared` or
`apps/connect` changes needed.

### External catalog search (Google Books / Spotify / TMDB) — Book Review web parity + Music Review (July 2026)

Book Review reached full web parity (it was previously mobile-only) and **Music Review** and
**Film Review** templates were built on both platforms (July 2026), all three backed by the same
reusable external-catalog-search layer. All three source integrations (Google Books, Spotify,
TMDB) are now live — this section is the reference for how the pattern works, not a TODO.

- **Normalized external result shape**: every `/api/external/{source}/search` proxy route
  (`google_books` | `spotify` | `tmdb`) returns `{externalId, title, about?, year?, coverUrl?}`
  regardless of the upstream API's own shape — duplicated in both `apps/connect` and `apps/site`
  (mobile hits `apps/site` via `PROXY`, web hits `apps/connect` via a relative fetch). Google
  Books needs an optional `GOOGLE_BOOKS_API_KEY` env var (works keyless at low volume). Spotify
  needs `SPOTIFY_CLIENT_ID`/`SPOTIFY_CLIENT_SECRET` (client-credentials OAuth via
  `packages/shared/lib/spotify.ts`'s `getSpotifyToken()`, module-level cached). TMDB has **no
  keyless tier** — needs `TMDB_API_KEY` (v3 API, plain `api_key` query param, no OAuth) or every
  search returns empty. All three degrade to empty results (not an error) when credentials are
  absent — the manual "add anyway" fallback always still works.
- **`DirectorySearch`** (both `packages/shared/components/composer/DirectorySearch.tsx` and
  `apps/mobile/src/components/composer/DirectorySearch.tsx`) takes an optional
  `externalSource?: "google_books" | "spotify" | "tmdb"` prop — when set, it searches the
  external catalog in parallel with the local directory search and shows results in a "From
  {Source}" group; selecting one calls `/api/directory/quick-create` with
  `external_source`/`external_id`/`cover_image_url` plus a source-specific lazy lookup made only
  on selection, never per search result (search responses carry no track/crew data): Spotify
  resolves `preview_url` via `/api/external/spotify/preview?albumId=`, TMDB resolves the
  director via `/api/external/tmdb/credits?movieId=` (reads `crew.find(c => c.job ===
  "Director")` from TMDB's `/movie/{id}/credits`) and passes it as `about_value`. The manual "add
  anyway" fallback is **always** available alongside external results, not just when there are
  zero local matches, on both platforms.
- **Dedup**: `Culture_Directory::find_by_external_id($source, $external_id)` is checked first in
  `handle_quick_create()` — if a matching entry already exists, it's returned immediately
  instead of creating a duplicate, so every reviewer picking "the same" book/album lands on one
  shared directory entry.
- **Generic about-field mechanism**: the old book-only "Author" write was generalized into a
  `_about_fields` JSON blob (`[{label, value}]`) via `about_label`/`about_value` params (an
  `author` param is kept as a back-compat alias that auto-sets `about_label='Author'`). The
  client-side prop is `aboutFieldLabel` (was a boolean `showAuthorField`) — "Author" for books,
  "Artist" for music, "Director" for film.
- **Cover art / preview URLs are stored as plain URL strings, not sideloaded into WP media**
  (deliberate v1 scope): `_external_cover_url` (directory-entry level, all 3 sources) and
  `_external_preview_url` (directory-entry level, Spotify only). Community posts additionally
  get their own denormalized copies at submit time (`_music_title`/`_music_artist`/etc.,
  `_music_preview_url`) to avoid a join at feed-render time — same pattern as `_book_title`/etc.

**Music Review template** — directory type `album` (pre-seeded, no new taxonomy needed), rating
breakdown is Production/Lyrics/Replay/Vibe (state key `replay`, not `replayValue` — kept
consistent as `_music_rating_replay`/`music_rating_replay`/`musicRatingReplay` everywhere). No
status field (no equivalent to Book's Finished/Reading/Want-to-Read) and uses "favourite lyric"
instead of "favourite quote". Deliberately ungated (no reputation/Pro requirement), same as Book
Review. Badge color teal `#0D7377` everywhere (web literal + mobile `templateMusicBg`/
`templateMusicText`, light `#E6FFFA`/`#0D7377`, dark `#042F2E`/`#5EEAD4`) — Book Review is purple
`#6B48A8`. **If a Music Review surface ever shows the wrong purple**, it's this exact mixup —
happened once already in the web `AudioPreviewButton`, fixed.

**Film Review template** — directory type `film` (pre-seeded, no new taxonomy needed), rating
breakdown is Story/Acting/Visuals/Pacing, uses "favourite line" instead of "favourite quote"/
"favourite lyric". Like Music Review, no status field. Deliberately ungated, same as Book/Music
Review. No audio-preview equivalent — TMDB has no preview-clip concept, so `AudioPreviewButton`
is not rendered anywhere on Film Review surfaces. Badge color blue `#2B4C7E` everywhere (web
literal + mobile `templateFilmBg`/`templateFilmText`, light `#E8EEF7`/`#2B4C7E`, dark
`#16233A`/`#8FB4E3`) — distinct from Book's purple and Music's teal.

**"+ Other" custom genre input (Book/Music/Film Review, all on both platforms)** — `BOOK_GENRES`/
`MUSIC_GENRES`/`FILM_GENRES` are fixed suggestion lists, not an enum the backend validates
against (genres are stored as plain `sanitize_text_field`-ed strings in a JSON array, no
taxonomy). Every genre chip row therefore ends with a "+ Other" chip that reveals a small text
input (`show{X}GenreInput`/`{x}GenreInput` state pair) — Enter/blur commits the trimmed value
into the same genres array (deduped case-insensitively) and the chip UI renders it identically to
a predefined selection (`{x}Genres.filter(g => !{X}_GENRES.includes(g))`, in addition to the
predefined `.map()`). If a future genre list needs the same escape hatch, mirror this exact
pattern rather than only offering the fixed list.

**Composer selection-chip rows wrap, they don't scroll (fixed July 2026)** — every chip-style
selection row in the community composer (genres, section tags, cuisine, showcase medium, event
category, quote type, book status) now uses `flex-wrap: wrap` (web: `.composer-chip-wrap` class;
mobile: `styles.chipRow`/`.priceChipRow` with `flexWrap: "wrap"`, plain `<View>` not `<ScrollView
horizontal>`) instead of a horizontally-scrolling single row. The old scroll pattern hid options
off-screen with no visual affordance, and on narrow mobile widths the ratings-breakdown box
(`.composer-multi-rating`) actually overflowed the viewport. **If you add a new chip-style
selection row to the composer, wrap it — don't reach for horizontal scroll.** The one exception
left as intentionally-scrollable: photo/image thumbnail strips (e.g. `.photosRow` on mobile) —
those are a different UI pattern (browsing attached media, not choosing from a fixed option set)
and were not touched by this fix.

**Text-prefill "guide chips" removed (all templates, both platforms, fixed July 2026)** — every
template used to show a row of tappable phrases (e.g. "Finished it and honestly:") above the
empty textarea that inserted the phrase into the field on tap. Removed at the user's request as
unnecessary friction — `TEMPLATE_GUIDES` (web) and `TEMPLATES` (mobile) no longer carry a `chips`
field, only `desc` (web) / nothing extra (mobile, `tmplDef.desc` is still shown). Do not
reintroduce this pattern.

**Audio preview playback (30s Spotify clip)**: `AudioPreviewButton` exists on both platforms —
`packages/shared/components/pulse/AudioPreviewButton.tsx` (web, plain `<audio>` element) and
`apps/mobile/src/components/ui/AudioPreviewButton.tsx` (mobile, `expo-av`'s `Audio.Sound`,
added as a dependency `expo-av: ~15.0.1` matching the SDK 52 pin — regenerated via the
documented out-of-tree lockfile process, see "Expo SDK version" below). Rendered wherever
`previewUrl`/`musicPreviewUrl` is present: both `DirectorySearch`'s selected-entry chip, the
feed card (`FeedCard.tsx` / `FeedItemCard.tsx`'s `MusicReviewCard`), and the detail view
(`CommunityDetailModal.tsx` / `PostDetailSheet.tsx`'s `TemplateMusicReview`). Both button
implementations self-manage their own play/pause state and unload/pause on unmount; neither
enforces single-playback-at-a-time across multiple cards on screen (matches web's plain
`<audio>` behavior — not treated as a bug).

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

### Sign-out cookie clearing gotcha (`__Secure-`/`__Host-` prefix rules, fixed July 2026)

Both `apps/site/app/api/auth/clear-cookies/route.ts` and `apps/connect/app/api/auth/clear-cookies/route.ts`
exist because `signOut()` only clears the cookie matching the exact name/Domain configured in
`authOptions` (domain-scoped, `__Secure-`-prefixed in prod, see the `cookies.sessionToken` block
in `packages/shared/lib/auth.ts`) — any legacy host-only cookie set before the `.themoveee.com`
domain config existed survives `signOut()` untouched, so this route is a safety-net that expires
every plausible name/Domain permutation via `res.cookies.set(name, "", { maxAge: 0, ... })`.

**The safety-net itself had the same class of bug it was written to fix.** Cookie name prefixes
carry hard requirements the browser enforces *silently* — a `Set-Cookie` that violates them isn't
rejected with an error, it's just dropped, so nothing in the network tab looks wrong:
- `__Secure-` requires the `Secure` attribute on **every** `Set-Cookie` using that name, including
  clears.
- `__Host-` additionally **forbids a `Domain` attribute** entirely (and also requires `Secure` +
  `Path=/`).

The route was clearing every cookie name the same generic way (no `secure` on either the
host-only or domain-scoped write, and setting `domain: ".themoveee.com"` on the `__Host-` name
too) — so the clear for `__Secure-next-auth.session-token` (the actual production session cookie
name) and `__Host-next-auth.csrf-token` silently never took effect. Symptom: clicking Sign Out
looked like it worked (redirect happened, no errors), but a browser holding one of those
host-only legacy cookies stayed logged in — `signOut()`'s own domain-scoped clear can't touch a
cookie set without a `Domain` attribute, and this safety-net's clear was the specific thing meant
to catch that case.

Fixed by branching per cookie name instead of one generic loop: `__Host-`-prefixed names get a
single host-only clear with `secure: true` and no `domain`; every other name gets both a
host-only and a domain-scoped clear, with `secure: true` added whenever the name starts with
`__Secure-`. **If you ever add a new cookie name to either route's list, check its prefix first**
— `__Secure-`/`__Host-` cookies need this exact treatment, plain-named ones don't.

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
- Step 3: Membership tier (Citizen / Moveee Pro)
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

## Google Sign-In (June 2026)

Web (NextAuth) and mobile (Expo) both sign in through the same WordPress
backend verification — there is no separate OAuth flow per surface, only a
different REST entry point.

### Server-side token verification
`culture-community/includes/core/class-culture-google-auth.php`
(`Culture_Google_Auth`) — no JWKS library, no new Composer dependency.
Verifies a client-obtained Google ID token by calling Google's
`https://oauth2.googleapis.com/tokeninfo?id_token=...` endpoint (Google
itself rejects expired tokens; only `aud` and `email_verified` need
checking here). `verify_id_token()` checks `aud` against the three
configured client IDs (web/iOS/Android — any one matching is accepted) and
requires `email_verified === "true"`. `find_or_create_user()` looks up by
email; if no account exists, creates one with a random password, sets
`_culture_membership_tier = citizen`, `_culture_email_verified = '1'`, and
copies the Google profile photo into `_culture_avatar_url`. Required in
`culture-community.php` alongside the other core includes.

### Client ID storage
Three Client IDs (Web/iOS/Android, from Google Cloud Console — public
identifiers, not secrets) are stored as WP options
(`culture_google_client_id_web/ios/android`), configurable in WP Admin →
Culture Community → General → "Google Sign-In" section
(`class-culture-settings.php`). Same pattern as `culture_api_secret` —
**not** a `wp-config.php` constant.

### REST endpoints
| Route | Surface | Returns |
|---|---|---|
| `POST /culture/v1/login-google` | Web (public) | Full profile via `user_profile()` — same shape as `/login` |
| `POST /culture/v1/mobile/login-google` | Mobile (public) | `{ token, user }` — same shape as `/mobile/login`, `token` from `issue_token()` |

Both just call `Culture_Google_Auth::verify_id_token()` then
`find_or_create_user()` — the only difference is the response shape,
matching each surface's existing `/login` handler.

### Web integration (NextAuth)
`packages/shared/lib/auth.ts` — `GoogleProvider` added to `providers` only
when `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` env vars are set. The `jwt`
callback gained an `account` param; when `account?.provider === "google"`,
it POSTs `account.id_token` to `/wp-json/culture/v1/login-google` and maps
the response onto the token via a new `applyCultureProfile()` helper
(mirrors the field set the Credentials-branch already produces — keep both
in sync if profile fields change). `app/login/page.tsx` has a "Continue
with Google" button calling `signIn("google", { callbackUrl })`.
Env vars (`.env.example`): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (the
Web Client ID/secret — must match the "Web Client ID" in WP Admin).

### Mobile integration (Expo) — native SDK, June 2026

**The app no longer targets Expo Go for testing — do not design mobile auth
flows around Expo Go compatibility.** Google Sign-In uses
`@react-native-google-signin/google-signin` (native module, requires an EAS
dev/preview/production build — `expo-auth-session` + `expo-web-browser`'s
Custom Tab flow was the prior approach and has been fully removed for Google
specifically; `expo-web-browser` itself is still used elsewhere, by
`src/utils/openInApp.ts`, for opening Moveee links in an in-app browser).
- `src/config/google.ts` — `GOOGLE_IOS_CLIENT_ID`, `GOOGLE_ANDROID_CLIENT_ID`
  (registered against the app's package name + release/preview keystore
  SHA-1 in Google Cloud Console — the native Android flow resolves the
  client implicitly via Play Services, no client ID param needed in code),
  `GOOGLE_WEB_CLIENT_ID` (passed as `webClientId` to `GoogleSignin.configure()`
  — required on every platform because it's what actually issues the
  `idToken`, the iOS/Android client IDs alone don't).
- `app.config.ts` — `GOOGLE_IOS_URL_SCHEME` constant (reversed form of
  `GOOGLE_IOS_CLIENT_ID`, e.g. `com.googleusercontent.apps.<id>`) passed to
  the `@react-native-google-signin/google-signin` config plugin's
  `iosUrlScheme` option — keep it in sync if `GOOGLE_IOS_CLIENT_ID` ever
  changes. No `scheme`/`googleServicesFile` needed for the Android side;
  Play Services resolves the registered OAuth client via package name + SHA-1
  alone.
- `screens/auth/LoginScreen.tsx` — `GoogleSignin.configure()` called once at
  module scope, `handleGoogleSignIn()` calls `GoogleSignin.hasPlayServices()`
  then `GoogleSignin.signIn()`, reads `response.data?.idToken`, POSTs it to
  `${MOBILE_API}/login-google`, calls `loginWithToken()`. Cancellation is
  detected via `e.code === statusCodes.SIGN_IN_CANCELLED` (silently no-ops,
  no error banner) — the old Custom Tab flow used a string-match on
  `e.message` for this, the native SDK gives a proper error code instead.
- After swapping `expo-auth-session` for `@react-native-google-signin/google-signin`
  in `package.json`, the lockfile was regenerated via the standard
  out-of-tree process (see "Expo SDK version — critical" below) — required
  for EAS Build's `npm ci`.
- **Per-build-profile SHA-1 gotcha**: EAS preview builds (APK, `eas.json`
  `preview` profile) and production builds (app-bundle) can be signed with
  different keystores, each with its own SHA-1 fingerprint. The Android
  OAuth client in Google Cloud Console must have **every** SHA-1 that will
  ever sign a build you test Google Sign-In on added as an additional
  fingerprint (Google allows multiple SHA-1s per package name — no need for
  a second client ID). Run `eas credentials` → Android → select the profile
  → view keystore to get the exact SHA-1 to add. A `redirect_uri_mismatch` /
  "Access blocked" error on a build that worked fine on another profile is
  the signature of this gotcha specifically.

### Google Cloud Console setup (one-time, by a human with console access)
1. Create an OAuth 2.0 **Web application** client. Authorized redirect URI:
   `https://web.themoveee.com/api/auth/callback/google`. Use its
   Client ID/Secret for `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` (Vercel
   env vars, Site B project) and its Client ID for the WP Admin "Web
   Client ID" field.
2. Create an OAuth 2.0 **iOS** client with bundle ID
   `com.moveee.moveeeplatform`. Its Client ID goes in WP Admin "iOS Client
   ID" and `GOOGLE_IOS_CLIENT_ID` in `src/config/google.ts`.
3. Create an OAuth 2.0 **Android** client with package name
   `com.moveee.connect` (the actual `android.package` in `app.config.ts` —
   not `com.moveee.moveeeplatform`, which is stale/wrong if seen elsewhere)
   and **every** SHA-1 signing cert fingerprint that will sign a build you
   test Google Sign-In on (production keystore and the EAS `preview`
   profile's keystore are typically different — see the per-build-profile
   SHA-1 gotcha in "Mobile integration" above). Its Client ID goes in WP
   Admin "Android Client ID" and `GOOGLE_ANDROID_CLIENT_ID` in
   `src/config/google.ts`.
4. No "Authorized redirect URI" entries are needed for the iOS/Android OAuth
   clients — `@react-native-google-signin/google-signin` is a native module
   (Play Services on Android, native Google SDK on iOS) and doesn't use a
   redirect-URI-based flow the way the web client does. This requires an EAS
   dev/preview/production build to test; it will not work in Expo Go.

---

## Community feed spam protection

All checks run server-side in **`packages/utils/spam-protection.ts`** (imported everywhere as
`@/lib/spam-protection` — resolves there via the `@/lib/*` tsconfig paths entry, which checks
`packages/shared/lib/*` first, then `packages/utils/*`, then the app-local `./lib/*`; this file
lives in `packages/utils`, not `packages/shared/lib`, despite the import alias) before posts reach
WordPress.

**Checks applied to posts (`app/api/community/submit/route.ts`):**
1. URL/link blocking — Citizens cannot post links; Moveee Pro members can. Gate is a literal
   `tier === "patron"` check in `checkPostSpam()`/`checkCommentSpam()` — no reputation-based bypass
   for this one (unlike Poll/Itinerary/Event templates, which bypass on reputation OR Pro). There's
   also an `process.env.ALLOW_LINKS_FOR_PRO === "false"` escape hatch that — despite the variable's
   name — disables the link block for **everyone** (not just Pro) when explicitly set to the string
   `"false"`; this looks like a kill-switch for the whole feature, not a per-tier toggle. Don't rely
   on this env var being set in normal operation; the default behavior with it unset is the
   Citizen/Pro split described above.
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
- `patron` = Moveee Pro DB value — never rename in code
- `react-native-passkeys` replaces `@simplewebauthn/browser` for WebAuthn in RN
- `react-native-qrcode-svg` for rendering perk QR codes
- Cashout fee is flat 40% (not tiered, see `Culture_Perks::cashout_fee_percent()`); `credits_per_gbp` comes from the wallet balance API response — never hardcode
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

**Gotcha (fixed June 2026): mobile must call the JWT mobile endpoint, not the web proxy.**
`useNotificationCount.ts` previously called `https://themoveee.com/api/notifications/count` —
the Next.js web proxy route, which authenticates via `getServerSession()` (NextAuth cookie). The
mobile app has no NextAuth session, only a JWT bearer token, so that route's `session?.user` was
always null and it silently returned `{ unread: 0 }` — the bell badge (in `ConnectFeedScreen.tsx`'s
header) and the Connect tab's red dot (`navigation/index.tsx` `MainTabs`) both read from this same
hook, so both were permanently dark regardless of actual unread count. Fixed: the hook now calls
`${MOBILE_API}/notifications/count` directly (the pre-existing mobile JWT endpoint,
`handle_notification_count()` in `class-culture-mobile-api.php`) via `api.get()`, which attaches
the Bearer token automatically. **Any future mobile hook that proxies through
`https://themoveee.com/api/...` should first check whether a same-shaped `/mobile/...` JWT endpoint
already exists** — most of the wallet/perks/passkey endpoints genuinely need the web proxy (they
require `CULTURE_API_SECRET`, per the "Key gotchas" section above), but notifications already had
a working mobile-native route that was simply never wired up.

**Same bug class recurred (fixed June 2026) in `NewPostScreen.tsx`'s `uploadImages()`** — it POSTed
to `${PROXY}/mobile/community/upload-image` (`PROXY = "https://themoveee.com/api"`, the Next.js web
proxy), but no such route exists there; the real endpoint is
`POST culture/v1/mobile/community/upload-image` on WordPress, reachable via `MOBILE_API`. Every
image attached to a community post silently failed to upload ("Image upload failed" alert on every
submit). Fixed by switching to `${MOBILE_API}/community/upload-image`; the now-unused `PROXY`
constant was deleted from the file (the Event template's own past use of `PROXY` was already
rerouted to `community/submit` earlier, so nothing else referenced it). **Lesson reinforced: before
introducing or fixing any mobile API call to `https://themoveee.com/api/...`, grep
`class-culture-mobile-api.php` for a matching `/mobile/...` route first** — this is now the second
time a mobile screen called the web proxy for an endpoint that already had a native JWT route.

### Notification tap routing (smart deep-links, June 2026)
Tapping a notification in `NotificationsScreen.tsx` now navigates somewhere relevant instead of
just marking it read. `openNotification(item, nav)` switches on `item.type` and reads fields off
`item.meta` (the JSON blob set by whichever PHP call site fired the notification — see
`Culture_Notifications::add()` call sites for the authoritative field names per type):
- `mention` / `comment_received` / `new_follower_post` → `meta.post_id` → fetches the actual post
  via `GET /mobile/community/post?post_id=X` (new endpoint, returns `{ item: FeedItem }`) then
  navigates to `PostDetail` with the fetched item. **`PostDetail` requires a full `FeedItem` object,
  not just an id** — there was previously no way to deep-link to an arbitrary post by id alone, only
  via the unified feed list. The new endpoint reuses the exact same per-post field mapping as the
  unified feed (extracted into `format_community_feed_item()`, called by both
  `get_community_feed_items()` and the new `handle_get_community_post()`) so the post renders
  identically regardless of entry point.
- `new_follower` → `meta.follower_id` → `MemberProfile` with that `userId`.
- `badge_unlocked` → own `MemberDashboard` (badges shown there).
- `credit_earned` / `cashout_approved` / `cashout_rejected` / `escrow_released` / `post_validated`
  → `Wallet`.
- `perk_redeemed` / `perk_expiring` → `Coupons`.
- `referral_received` → `Referral`. `event_rsvp` → `MyEvents`. `system` → no-op (not actionable).
- The pressed row shows a small spinner in place of its emoji while the post-fetch case is in
  flight (`navigatingId` state) — the other cases navigate synchronously so this is rarely visible
  outside the fetch-based branch.
- `MyEvents` was missing from `AppParamList` in `useNav.ts` despite already being a registered
  `ConnectStack` screen — added it. If `nav.navigate()` to an existing screen throws a type error,
  check `useNav.ts`'s `AppParamList` before assuming the screen isn't registered.

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
- `fonts`: `sans`, `sansBold`, `sansItalic`, `serif`, `serifBold`, `serifItalic`, `serifBoldItalic`, `mono`, `monoBold`, `monoItalic`. **`fontStyle: "italic"` synthesis is unreliable for custom/embedded TTF fonts on iOS** — applying it on top of a non-italic `fontFamily` (e.g. `Fraunces_400Regular`) can silently fall back to the system font's italic face instead of rendering the custom font at all. Always reference the real italic font file by name instead (`fonts.serifItalic` → `Fraunces_400Regular_Italic`). **Fixed app-wide June 2026** — every `fontFamily: fonts.serif/sans/mono(...)` + `fontStyle: "italic"` combo across the codebase (quote views, pull quotes, book-review favourite quotes, game screens, composer inputs, TOC titles, etc.) was swapped to the matching `*Italic` key. The italic weights (`Fraunces_700Bold_Italic`, `DMSans_400Regular_Italic`, `JetBrainsMono_400Regular_Italic`) are loaded in `App.tsx`'s `useFonts()` call alongside the existing weights — **if you add a new bold/regular weight to `theme.ts`'s `fonts` object, check whether an italic counterpart should be added and loaded at the same time**, since there's no synthesis fallback that looks right on iOS. Text with no explicit `fontFamily` (system default) is unaffected and can use plain `fontStyle: "italic"` safely — e.g. `react-native-render-html`'s `em`/`i`/`blockquote` tag styles in `ArticleScreen.tsx` intentionally have no custom `fontFamily`.
