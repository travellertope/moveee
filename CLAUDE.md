# Moveee — Agent Instructions

This file is read automatically by Claude Code at the start of every session.
It captures project conventions, architecture decisions, and step-by-step
processes for recurring tasks so they can be completed correctly without
re-discovering context.

**This file was trimmed in September 2026 because its size alone was exhausting
sessions' context budgets before any real work could happen.** Narrow,
closed-out bug-fix passes and old "visual rebuild" sections with no remaining
generalizable lesson were moved to `docs/claude-md-archive.md` — a file that is
**not** auto-loaded, read only on request. A "Moved to `docs/claude-md-archive.md`"
one-liner under a heading here means the full historical detail lives there; go
look it up if you need it, but don't assume it needs restoring into this file —
keep this file lean going forward rather than re-accumulating the same bloat.

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

**This is a recurring failure mode, not a one-time fix — read this section fully before
writing or copying any user-facing string, AI prompt, or example/placeholder text,
anywhere in this repo (web, mobile, PHP, docs, mockups).** As of August 2026 a full-repo
sweep found and fixed ~90 files where copy, AI prompts, seed data, and example placeholders
loudly announced Moveee as an African/Black-diaspora product — including inside a
brand-new Games-hub mockup built in the *same session* that had already read an earlier
version of this rule. A first pass at fixing it then over-corrected: it stripped the
African/Caribbean/Black-diaspora *content favouring* out of the AI generation prompts
themselves, not just the public messaging. **That was wrong and was reverted.** The
platform's actual content — what the AI curates, generates, and seeds — is meant to keep
favouring African, Caribbean, and Black diaspora subjects. What changes is only whether the
platform *announces* that scope to the public as its defining identity.

**Two different layers — keep them straight:**

1. **Seeded/generated content (AI prompts, seed-topic lists, RSS source lists) — KEEP the
   favouring.** These are internal instructions the AI reads, never rendered to a user
   verbatim. `packages/shared/lib/gemini.ts` (directory entries, quotes, event curation),
   `pulse-gemini.ts` (Moveee Pulse story selection), `crossword-gemini.ts` and the daily
   trivia/crossword routes' prompts, `class-culture-directory-tools.php`'s seed topic list
   (mirrored in `apps/*/app/api/directory/auto-populate/route.ts`), and
   `packages/shared/lib/pulse-rss.ts`'s `FEEDS` registry should all continue to say
   something like *"favour African, Caribbean, and Black diaspora subjects, with room for
   other regions too"* — don't neutralize these into "draw evenly from everywhere." That
   was the August 2026 over-correction; it's reverted and should stay reverted. If you're
   asked to touch any of these files for an unrelated reason, don't "fix" the favouring
   language you find there — it's intentional, not a leftover bug.
2. **Public-facing copy (page titles, meta descriptions, taglines, UI labels, region
   filter chips, form placeholder examples, marketing/partnership copy) — stays universal,
   never announces the African/diaspora focus as the platform's defining scope.** This is
   the layer the original sweep was actually about, and the fix here stands:
   - Never frame the brand, its audience, or its content scope as African, Black, or
     "diaspora" in anything a visitor reads — not "African and diaspora culture," not
     "Black diaspora," not "African audience" (except the one deliberately symmetric
     exception below). Use language like *"an independent magazine and community for
     people who live for culture."*
   - Never reach for "worldwide," "global culture," "around the world," or similar
     geography-emphasizing qualifiers as the "safe" replacement either — that's a tell,
     not neutral. The house style is plain, unqualified **"culture."** Don't say
     *"celebrating culture worldwide"* — say *"celebrating culture."* If a sentence reads
     fine with the qualifier deleted outright, delete it; don't reach for a synonym.
   - Illustrative "e.g. …" placeholder text and UI copy should be genuinely diverse, not
     default to one region every time (see `DirectorySubmitScreen.tsx`'s
     `EXCERPT_PLACEHOLDERS` for the pattern: Japan, Morocco, Korea, Brazil, Mexico, India,
     South Africa, NY — this is about UI copy variety, unrelated to the content-favouring
     rule in point 1 above).

**The one legitimate exception to point 2:** the `/uk`, `/us`, and `/africa` edition pages
(`apps/site/app/[edition]/page.tsx`, `EditionNewsletterHub.tsx`, `magazine/africa/page.tsx`,
etc.) are *deliberately* region-scoped — a member who navigates to the Africa edition should
see Africa-focused framing, exactly as the UK edition says "rooted in Britain" and the US
edition says "through an American lens." This is symmetric, chosen scoping for a page whose
whole purpose is regional content. If you ever touch one of these edition pages, check that
whatever you write is symmetric with its UK/US siblings.

**Before considering any copy-writing task done, run:**
```bash
bash scripts/check-brand-language.sh
```
This greps the repo for the point-2 violating patterns and prints file:line hits for review
(it is a review tool, not a hard CI gate). Its `ALLOWLIST` deliberately excludes the AI
prompt/seed-list files described in point 1 above — those are supposed to contain this
language now, so the script doesn't flag them. If it reports a new hit outside the
allowlist, that's a real public-copy bug — fix it. If you find a genuinely new legitimate
exception, add a narrow entry to the script's `ALLOWLIST` **and** a note here explaining
why, the same way every existing entry is documented.

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

### Subscriber storage — real DB tables (September 2026, supersedes the option-array model below)

**The flat `culture_newsletter_subscribers` wp_options array described in this
subsection is retired as a write target — it is migrated once, then left
untouched as a historical snapshot.** Real storage is now three tables:
`wp_culture_newsletter_lists` (the list/segment **registry** —
`Culture_Newsletter_Lists`), `wp_culture_subscribers` (one row per email —
`Culture_Subscribers_DB`), and `wp_culture_subscriber_lists` (many-to-many
between the two). This is what the old array's `lists[]` and `segment` fields
used to encode as freeform strings against hardcoded PHP constants
(`LIST_OPTIONS`/`SEGMENT_OPTIONS` in `class-culture-subscribers.php`, now
deleted) — they're unified into one thing: any subscriber can belong to any
number of list rows, and a list row's `type` (`content` / `region` / `system`)
says what it's for. A `region` row (uk/ng/us/...) is a narrowing filter
applied alongside a `content` list on a send, not something a subscriber is
"subscribed to" in the ordinary sense — this preserves the old List+Segment
two-dropdown shape in the Send Newsletter meta box and in
`Culture_Subscribers_DB::resolve_send_emails()`, just backed by real rows
instead of a hardcoded array. `system` (e.g. `announcements`) is hidden from
the public archive/preferences UI, same as before, via `visibility: 'hidden'`
and `default_subscribed: 1` (opt-out) columns instead of special-cased code.

**Every write everywhere in the plugin (admin UI, REST endpoints, mobile API,
imports, WP-CLI, `Culture_Literary_Access`) must go through
`Culture_Subscribers_DB`** — that class is the single find-or-create/list-
membership entry point (`subscribe()`, `subscribe_many()`,
`add_to_list_slug()`, `remove_from_list_slug()`, `resolve_send_emails()`,
`resolve_emails_for_lists()`). Never call `get_option('culture_newsletter_subscribers')`
or `update_option()` against it again — the one remaining read of that option
is the one-time migration inside `Culture_Subscribers_DB::maybe_migrate_from_options()`,
gated by the `culture_subscribers_migrated_to_db` option so it only ever runs
once per site.

**Admin UI, three pages under Culture Community**: **Subscribers**
(`class-culture-subscribers.php`, unchanged menu slug `culture-subscribers`)
— add/edit/delete subscribers, list-membership checkboxes populated
dynamically from the registry, search + filter-by-list, CSV export. **Newsletter
Lists** (`class-culture-newsletter-lists-admin.php`, slug
`culture-newsletter-lists`, new) — create/rename/delete a list or region row,
set its type/visibility/opt-out default; this is what makes "manage segments"
a real, no-code admin action instead of a PHP constant edit. **Campaigns**
(see "One-off email campaigns" below).

**`Culture_Newsletter_Lists::get_all()`/`get_by_slug()` are what every
"which lists exist" check reads now** — `handle_newsletter_subscribe()`
(REST), the Send Newsletter meta box's list/segment dropdowns, and
`class-culture-nl-analytics.php`'s per-list counts all validate/populate
against the registry rather than a hardcoded array. A list created on the
Newsletter Lists admin page (or auto-provisioned for a Hub, see below) is
immediately usable everywhere with zero code changes — this is what
"Process: adding a new newsletter" (further down this file) used to require
editing ~7 files for; that process is now **only relevant for a list that
needs bespoke frontend UI** (its own subscribe card copy on `/newsletter`,
its own archive filter tab) — the list/segment/send-targeting plumbing itself
no longer needs any of those steps.

**Unsubscribe is scoped to the list the email actually came from, not the
whole account.** `Culture_Newsletter_Queue::handle_unsubscribe()` (the email
footer link) resolves the list from the `c=` (newsletter post ID) or
`campaign=` (one-off campaign ID) query param and removes only that
membership; only a link with neither param (pre-September-2026 already-sent
mail) falls back to deleting the whole subscriber record. The frontend's own
`/newsletter/unsubscribe` page (`handle_newsletter_unsubscribe()` REST
endpoint) is still a full "remove from everything" action, unchanged.

### One-off email campaigns

A send that is **not** a `culture_newsletter`/`getmelit`/`culture_drop` post
at all — no CPT, no frontend archive entry, no issue number. `Culture_Campaigns`
(`wp_culture_campaigns` table) owns its own subject/body/target-lists/status
and reuses `Culture_Newsletter_Queue::build_email()` (now `public`, renamed
label param to a plain string instead of a hardcoded lookup —
`build_campaign_email()` is the wrapper Campaigns calls) for the actual HTML
template, plus the same batched-WP-Cron-dispatch shape as newsletter sends
(`culture_campaign_process_batch`, 50/batch, 60s apart). Admin UI: **Campaigns**
page (`class-culture-campaigns-admin.php`, slug `culture-campaigns`) — compose
with `wp_editor()`, tick one or more lists from the registry (a campaign can
target several lists in one send — `Culture_Subscribers_DB::resolve_emails_for_lists()`
unions and dedupes them), Save Draft / Send Test / Send Now. A campaign is
`draft` → `sending` → `sent`; only a draft can be edited or deleted.

### Hub → newsletter list auto-provisioning

Per an explicit September 2026 decision: **every Hub (`culture_hub` post),
official or user-created, automatically gets its own newsletter list**, and
members are **auto-subscribed on join, opt-out available afterward** (not
opt-in) — same "default ON" posture as the pre-existing `announcements` list.
- `Culture_Hubs::create()` calls `Culture_Newsletter_Lists::get_or_create_for_hub()`
  right after inserting the Hub post — slug `hub-{hub_slug}`, type `content`,
  visibility `hidden` (it's a Hub-management concern, not something a visitor
  picks off `/newsletter`), `source_type/source_id` = `'hub'`/the Hub's post
  ID, so the list can always be found again via `get_for_hub()`. The owner is
  subscribed immediately (their membership row is inserted directly in
  `create()`, not via `join()`).
- `Culture_Hubs::join()`/`leave()` call `Culture_Subscribers_DB::subscribe()`/
  `remove_from_list_slug()` against that same list — this is the actual
  mechanism that makes "email this Hub's members" possible; nothing else
  writes to a Hub's list.
- **Existing Hubs from before this feature shipped are covered by a one-time
  backfill**, `Culture_Hubs::maybe_backfill_hub_lists()` (hooked in `init()`,
  gated by `culture_hub_lists_backfilled`, same shape as this file's other
  `maybe_*` migrations) — provisions a list for every already-published Hub
  and subscribes every currently-active member, so the end state matches a
  Hub that had always had this feature.
- **If you ever need to email a specific Hub's members**, use the Campaigns
  page and tick that Hub's list (named `"{Hub Name} (Hub)"` in the Newsletter
  Lists admin page) — don't reach for a bespoke query against
  `wp_culture_hub_members`, the list is already kept in sync.

### WP Admin menu structure — split into top-level menus (September 2026)

The single "Culture Community" top-level menu had grown to 15 submenu items
and was hard to navigate — split into multiple top-level WP Admin menus,
initially 3 (Community/Newsletters/Events), then Literary was split out of
Community into its own 4th shortly after. **Every slug is unchanged**, only
which menu a page is parented under (and, for the renamed top-level itself,
its label) changed — so no `admin.php?page=...` link/bookmark anywhere in the
codebase or in anyone's browser needed updating.

- **Moveee Community** (slug `culture-community`, was labelled "Culture
  Community") — Settings (the default/anchor page), Analytics, Redirect
  Manager, Email Templates, Pro Memberships. Registered in
  `class-culture-settings.php`. **Directory Tools moved out to Moveee
  Content in September 2026** (see below) — don't look for it here anymore.
- **Moveee Newsletters** (anchor slug `culture-subscribers` — Subscribers
  is both the top-level page and a submenu of itself, the standard WP
  "duplicate the anchor slug as the first submenu with its own label" pattern)
  — Subscribers, Lists & Segments (`culture-newsletter-lists`), Campaigns
  (`culture-campaigns`), Import Newsletters (`culture-import-newsletters`),
  Games Subscribers (`culture-games-subscribers` — a separate, older
  subscriber list for the games feature, unrelated storage to
  `Culture_Subscribers_DB`, but grouped here since it's the same kind of
  "manage an email list" concern). Registered in `class-culture-subscribers.php`
  (top-level `add_menu_page()` + the anchor submenu); every other page in this
  group just changed its `add_submenu_page()` parent from `culture-community`
  to `culture-subscribers`. **The three newsletter CPTs — Newsletters
  (`culture_newsletter`), GetMeLit (`getmelit`), Culture Drop (`culture_drop`)
  — were moved here too (September 2026)**: they're native CPT edit/list
  screens (`register_post_type()`'s `show_in_menu` pointing at
  `culture-subscribers`), not custom admin pages, but they're newsletter
  content types, not general community content, so they belong in this group
  per the "pick a parent by kind" rule below.
- **Moveee Events** (anchor slug `culture-ticket-sales`, same pattern) —
  Ticket Sales, Event RSVPs (`culture-rsvp-manager`), and — since September
  2026 — the Community Events CPT (`culture_event`, native CPT screens, was
  Culture Community; ticketing/RSVP-related, so it belongs here per the
  "pick a parent by kind" rule below). Registered in
  `class-culture-tickets-admin.php`.
- **Moveee Content** (anchor slug `culture-content-manager`, same pattern,
  added September 2026) — a catch-all for general content CPTs that don't
  belong under any of the other top-level menus: Directory
  (`culture_directory`), Feed Posts (`culture_post`, sidebar label renamed
  from "All Community Posts" — see below), Journeys (`culture_journey` — all
  native CPT screens, `show_in_menu` pointing at `culture-content-manager`,
  all were under Culture Community), plus **Directory Tools**
  (`culture-directory-tools`, moved from Culture Community — it manages the
  Directory CPT's seeder/image tools, so it belongs alongside Directory
  itself). Registered in the new `class-culture-content-admin.php` (top-level
  `add_menu_page()` + the anchor submenu, a plain landing page linking out to
  each CPT's list screen — there was never a real admin page for these CPTs
  before, just their native WP list/edit screens, so this class only
  registers the menu shell). Directory Tools' `enqueue_assets()` hook-suffix
  check was updated to `culture-content-manager_page_culture-directory-tools`
  — see the hook-suffix gotcha note below.
  **Quotes (`culture_quote`) removed from the sidebar entirely (September
  2026, follow-up to the same-month "Quotes feed merge")** — the previous
  entry here flagged this as an open question ("if quotes are ever fully
  retired into community posts, this menu entry is what to remove"); the
  same pass that removed the standalone `/quotes` archive/author pages and
  submission UI from the site (see "Quotes feed merge" elsewhere in this
  file) made the sidebar entry pointless, since there's no longer a browsing
  surface that points an editor at individual quote management day-to-day.
  `culture_quote` itself is **not** deleted or hidden from the DB/REST/
  GraphQL layer — it's still what backs quote cards in the unified feed and
  `/quotes/[slug]` single pages — only `show_in_menu` flipped to `false` in
  `class-culture-post-types.php` (same "hide the native screen, keep it
  reachable by direct URL" pattern already used for `culture_cluster`/
  `culture_hub`). The Moveee Content landing page keeps one plain link to
  `edit.php?post_type=culture_quote` for when a quote genuinely needs manual
  editing (the Bulk Quote Importer CSV panel on Directory Tools is still the
  normal way to add quotes in bulk — see "Quotes feed merge" for what's
  automated vs. manual). **"Community Posts" CPT's `all_items` label renamed
  to "Feed Posts"** (was "All Community Posts") — copy-only, the CPT's own
  `name`/`singular_name`/slug/REST base (`community-posts`) and everything
  else about it are unchanged.
- **Moveee Literary** (anchor slug `culture-literary-submissions`, same
  pattern) — just Literary Submissions (the submissions manager + its
  Waivers tab) today; registered in `class-culture-literary-submissions.php`.
  Split into its own top-level the same day as the 3-menu split above, once
  it became clear this feature area would keep growing on its own (see "The
  Moveee Literary" section elsewhere in this file for the feature itself).
  The pending-submissions count badge (`awaiting-mod`/`pending-count` WP-core
  classes) that used to show on the submenu label now shows on the top-level
  label instead — same mechanism (raw HTML in the `$menu_title` arg), just
  duplicated onto both `add_menu_page()`'s and `add_submenu_page()`'s title
  args since a top-level menu and its anchor submenu render independently.
- **Moveee Hubs** (anchor slug `culture-hubs-manager`, same pattern) — a
  brand-new page, not a moved one: before this, `culture_hub` posts had no
  real WP Admin UI at all (see "Moveee Hubs admin manager" below). Registered
  in the new `class-culture-hubs-admin.php`.
- **Moveee Stoop** (anchor slug `culture-clusters-manager`, same pattern) —
  just Clusters (the Stoop host-appointment manager) today, moved out of
  Moveee Community the same way Literary/Hubs were. Registered in
  `class-culture-clusters-admin.php`. Like Hubs, `culture_cluster`'s own
  native CPT admin screen had its `show_in_menu` flipped to `false` in
  `class-culture-post-types.php` at the same time — the real manager already
  existed for this one (unlike Hubs, which had no admin page at all before
  this pass), so there was never a second competing "Clusters" entry to add,
  only to stop the bare native one from also showing up as a sibling of it.

**Gotcha this pass hit and fixed**: an `admin_enqueue_scripts` hook-suffix
check hardcoded to the *old* parent (`'culture-community_page_culture-campaigns'
=== $hook`, in `class-culture-campaigns-admin.php`'s `maybe_enqueue_editor()`)
silently stopped matching once Campaigns was reparented — the hook suffix
WordPress generates is derived from the parent menu slug
(`{parent_slug}_page_{slug}` for a submenu of a top-level page, `toplevel_page_{slug}`
for the top-level page itself), so moving a page to a new parent changes its
hook suffix even though its own slug is unchanged. **If you ever reparent a
submenu page again, grep that file (and any file enqueuing assets scoped to
it) for a hardcoded `{old_parent}_page_{slug}`/`toplevel_page_{slug}` string
— `class-culture-analytics.php`, `class-culture-nl-analytics-admin.php`, and
`class-culture-directory-tools.php` all have one of these for pages that
stayed under Moveee Community and were correctly left alone in this pass, but
the exact same string needs updating if any of those three ever move.**

**If you add a new admin page to this plugin**, pick a parent by kind:
newsletter/subscriber/list/campaign-related → `culture-subscribers`;
ticketing/RSVP-related → `culture-ticket-sales`; Literary-related →
`culture-literary-submissions`; general content (Directory/Quotes/Community
Posts/Journeys and anything in that vein) → `culture-content-manager`;
anything else → `culture-community`. Only add another top-level menu if a
new feature area grows to several pages of its own (the actual bar has
turned out to be lower than "3+" — Literary got its own top-level with just
one page, since the user wanted it broken out regardless of page count) —
check with the user rather than assuming a single new page should just join
`culture-community` by default.

### Sending
Each `culture_newsletter` post has two pieces of post meta:
- `_culture_nl_list` — which newsletter (`getmelit` or `culture-drop`)
- `_culture_nl_segment` — regional target (`us`, `uk`, `ng`, `gh`, `ca`,
  `au`) or empty for all

The send queue (`class-culture-newsletter-queue.php`) filters subscribers
by these meta values at send time (now via `Culture_Subscribers_DB::resolve_send_emails()`,
not an inline scan of the option array — see above). Batches of 50, 60s
intervals via WP-Cron.

### Multi-axis segment filters — List vs. Segment is now a real, general-purpose split (September 2026)

Per explicit user request: "Send to Segment" used to be one flat dropdown of Region rows
(`Culture_Newsletter_Lists::TYPE_REGION`) plus two hardcoded virtual filters (`africa` = an
OR of ng/gh/ke/za, `pro` = a live `_culture_membership_tier` check) — a single-select,
single-dimension filter bolted onto one content list. It's now a real multi-axis filter:
**any number of segment axes (Region, Age, Tier, or a custom one an admin creates) can be
combined on one send** — check boxes within one axis (OR: "any UK or US subscriber") across
any number of axes at once (AND: "...who are also Moveee Pro and 25–34"). This is what makes
List (what someone subscribed to — Culture Drop, GetMeLit, a Hub) and Segment (who they are —
demographics) two genuinely independent things, per the mental model the user asked for.

**No schema change, no `CULTURE_VERSION` bump** — `Culture_Newsletter_Lists`' `type` column
already distinguished `content`/`region`/`system`; this generalizes the meaning of "anything
else" from "must be region" to "is a segment axis, and the type value IS the axis name."
`Culture_Newsletter_Lists::RESERVED_TYPES` (`content`, `system`) is the only thing still
special-cased — `region`/`age`/`tier`/any future custom axis just fall out of
`get_axes()` grouping every non-reserved-type row by its `type`. `create()`'s type validation
was loosened from a fixed 3-value enum to "any non-empty `sanitize_key()`'d string" — the
Lists & Segments admin page's Type field is now a free-text input with a `<datalist>` of
suggestions (Content/Region/Age/Tier/System), so typing a brand-new word (e.g. "interest")
starts a whole new axis with zero code changes, appearing as its own checkbox group on every
send immediately.

**Two fundamentally different narrowing mechanisms, both hidden behind one API**
(`Culture_Subscribers_DB::apply_segment_filters( array $emails, $filters )`, called by both
`resolve_send_emails()` — one content list — and `Culture_Campaigns::send()` — a union across
several lists, closing the gap where Campaigns previously had no segment narrowing at all):
- **Region** narrows via real list membership (a region row is just another list a
  subscriber's email is/isn't tagged into) — same mechanism as before, just generalized to
  compose with other axes instead of being the only filter.
- **Every other axis (Age, Tier, any future one) narrows by reading the linked WP user
  account** at send time — there's no list-membership row for these, since nobody
  "subscribes" to being 25–34 or Moveee Pro. `Culture_Newsletter_Lists::age_bracket_for_user()`
  buckets `_culture_dob` against `AGE_BRACKETS` (Under 18/18–24/25–34/35–44/45–54/55+, seeded
  as real `type=age` rows so they're editable/orderable like any other segment value); Tier
  reads `_culture_membership_tier` directly against real `type=tier` rows whose **slugs are
  the literal tier values** (`citizen`/`patron`/`lit`) — no prefix, so the filter check is a
  direct `in_array($tier, $filters['tier'])`, no translation table needed. **This lookup is
  per-email and only ever runs against an already-region-narrowed candidate set**, not the
  full subscriber table — same cost shape the old `pro` virtual filter already had.

**`Culture_Newsletter_Lists::normalize_segment_filters( $input )`** is the one place that
understands every shape a filter can arrive in — the new nested array
(`array( axis_type => array(slugs) )`, from checkboxes/campaign postmeta), or a legacy bare
string (a real row slug, resolved to its own axis via a registry lookup — no more assuming
"bare string = region"; or the two pre-existing virtual slugs `pro`/`africa`, still understood
for any already-saved post or REST automation client passing the old shape). Every resolver
and every persist-to-postmeta call site goes through this — there's no second copy of the
shape-detection logic anywhere.

**Storage — two postmeta keys, on purpose, to protect a load-bearing frontend feature.**
`_culture_nl_segment_filters` (new, JSON-encoded, the multi-axis source of truth going
forward) is what `Culture_Newsletter_Queue::schedule_send()` actually reads
(`get_segment_filters_for_post()`, preferring the new key, falling back to the old one). But
`_culture_nl_segment` (the pre-existing plain-string meta) is **still written too**, whenever
the selection collapses to one of the shapes it already understood (exactly one region slug,
the 4-country Africa set, or Tier=Patron alone) — because that field is exposed via GraphQL
(`nlSegment` on `culture_newsletter`) and is what the `/newsletter/{uk,us,africa}` edition
pages' region-scoping already depends on (see "Edition story-scoping" elsewhere in this file).
**Never repoint that GraphQL field at the new JSON key** — a 2+-axis selection (or an Age/Tier-
only one) simply can't be expressed as a single slug, so `_culture_nl_segment` is cleared in
that case and the post just shows as "no segment tag" on edition pages, same as any other
untagged post today. `Culture_Newsletter_Send::legacy_segment_string()` is the one place that
does this collapse — it's deliberately narrow, not "best effort."

**UI**: both the Send Newsletter meta box (Culture Drop/GetMeLit/`culture_newsletter`) and the
new Send Campaign meta box render the same thing —
`Culture_Newsletter_Lists::render_segment_filter_fields( $field_name, $selected )`, one
scrollable checkbox group per axis from `get_axes()`, posting as
`{$field_name}[{axis_type}][]`. **The old client-side, fully-precomputed subscriber-count
lookup table is gone** — it only worked when segment was one flat dropdown (a small, fixed
set of possible values); with any combination of axes now checkable at once, precomputing
every combination isn't feasible. Replaced with a debounce-free AJAX round trip
(`wp_ajax_culture_nl_recount` → `Culture_Newsletter_Send::ajax_recount()`) fired on every list/
checkbox change (`.js-nl-list-select, .js-nl-segment-check` in `culture-newsletter-send.js`),
recomputing the live count server-side via the same `resolve_send_emails()`/
`apply_segment_filters()` path an actual send would use — so the displayed count is never
stale/approximate the way a precomputed table could be. **If you add a new segment-filter UI
anywhere else, reuse this AJAX-recount pattern, not a client-side precomputed matrix** — it
doesn't scale past one flat axis.

**Campaigns gained segment filtering for free** — `_campaign_segment_filters` (new postmeta,
`register_post_meta`'d in `class-culture-post-types.php`), same checkbox UI, applied via
`Culture_Subscribers_DB::apply_segment_filters()` right after the existing cross-list union
(`resolve_emails_for_lists()`) in `Culture_Campaigns::send()` — a campaign can now target
"Culture Drop + GetMeLit, Nigeria only, Moveee Pro only" in one send, where before it could
only union whole lists with no narrowing at all.

**Deliberately out of scope for this pass**: the Lists & Segments admin table's Subscribers
column shows an em-dash (with a tooltip) for Age/Tier rows rather than a count, since those
axes have no list-membership rows to count — the number only ever exists as a live, per-send
computation, never a stored figure. `class-culture-nl-analytics.php`/`-admin.php`'s segment
label display still only reads the legacy single-string mirror — a 2+-axis send just shows no
segment label there, a cosmetic gap, not a data-correctness one, left for a later pass if it
ever matters.

### Multi-edition sends from a single post (September 2026)

Culture Drop (and GetMeLit/`culture_newsletter`) used to require **4 separate posts** for a
US/UK/Australia/Africa regional send — same issue number tag on all 4, each one's
`_culture_nl_segment` set to a different region, each post's body a full manual copy-paste
of the shared intro plus that region's own appendix. Per explicit request, one post can now
carry the shared intro (the native content field, unchanged) plus an optional **per-edition
appendix** via a new ACF field group, "Edition Appendix" (`class-culture-acf-fields.php`) —
4 WYSIWYG fields (`edition_appendix_us`/`_uk`/`_au`/`_africa`, plain postmeta, no
`register_post_meta`/REST exposure needed since only PHP reads them), shown on
`culture_drop`/`getmelit`/`culture_newsletter` post edit screens, right below the main
content editor.

- **`Culture_Newsletter_Queue::EDITIONS`** (`us`/`uk`/`au`/`africa`) is the fixed, hardcoded
  list this covers — deliberately **not** sourced from `Culture_Newsletter_Lists`' full
  region registry (which can hold arbitrary rows like `ca`/`ke`/`za` with no matching ACF
  field). Add a 5th entry here **and** a matching ACF field if a 5th edition is ever needed.
- **Trigger logic, in `resolve_recipients()`**: if the post has an explicit `_culture_nl_segment`
  picked (the "Send to Segment" dropdown), that always wins and the send is single/uniform,
  exactly as before — appendix fields are ignored even if filled in. Otherwise, if any
  `EDITIONS` field is non-empty, it's a **multi-edition send**: for each filled edition,
  `Culture_Subscribers_DB::resolve_send_emails($list_id, $edition)` resolves that region's
  recipients (the exact same region-filter mechanism `_culture_nl_segment` already used —
  no new resolver), unioned/deduped by email across editions (first-listed edition wins a
  double-membership edge case). A subscriber not in any of the filled regions gets nothing
  from this send — same effective behavior as the old 4-posts workflow, where such a
  subscriber wasn't in any of the 4 region lists either.
- **The send-queue transient now holds `{email, edition}` pairs for a multi-edition send**
  (plain email strings for every other kind of send, unchanged) — `process_batch()` branches
  on `is_array($recipient)`; `send_to($email, $post_id, $edition = '')` appends
  `render_edition_appendix($post, $edition)` after the shared body.
  `render_content()`/`render_edition_appendix()` both funnel through a new shared
  `render_html($raw_content, $post)` (extracted from the old `render_content()`, which is now
  a one-line wrapper) — so an appendix gets identical the_content/block expansion,
  Optimole-lazy-load-suspension, and CMS→frontend link rewriting as the main body, never
  appended as raw unfiltered HTML.
- **Send Test can preview one edition** — a `<select>` (only rendered when editions are
  filled and no segment is picked) in the Send Newsletter meta box's Send Test section,
  wired through the existing AJAX call (`edition` param) into
  `Culture_Newsletter_Queue::send_test($post_id, $test_email, $edition)`.
- **The meta box shows a read-only summary** ("This post has appendix content for: US (120),
  UK (85)...", with subscriber counts reused from the box's existing `$counts_map`) — or, if
  a segment is also picked, a warning that the appendix fields will be ignored. No new UI for
  *picking* editions — that's just whichever ACF fields an editor filled in.
- **The old 4-separate-posts workflow still works, unchanged** — this is additive, not a
  replacement. A team that wants entirely different content per region (not just a shared
  intro + different appendix) can still use 4 posts with the same issue number, exactly as
  documented below.
- No new dbDelta table — plugin header version bumped only, for the standard
  redeploy-confirmation reason (see "Plugin DB table auto-upgrade" below).

### Subscriber storage (historical — the option array itself, now migrated)
Was stored as a single WordPress option: `culture_newsletter_subscribers` —
an array of objects:
```php
[
  'email'   => 'user@example.com',
  'name'    => 'Display Name',
  'date'    => '2026-01-01 00:00:00',  // MySQL datetime
  'lists'   => ['culture-drop'],        // which newsletters they're on
  'segment' => 'uk',                    // regional segment (optional)
]
```
Legacy plain-string entries (pre-multi-list) were treated as GetMeLit-only
throughout the codebase. Kept here for reference only — the option itself is
never read again after the one-time migration described above; don't add a
new write path against it.

### Email template
Plain white background, no header block. Content flows directly from the
newsletter body. Footer has "Read online · Unsubscribe" as plain text links
(no boxed button — see below). The newsletter name (GetMeLit / Culture Drop)
is derived from `_culture_nl_list` post meta and used in the footer "You are
receiving this because you subscribed to X" line.

**"Read online" boxed button removed, folded into the footer (September 2026).**
`build_email()` (`class-culture-newsletter-queue.php`, shared by every
newsletter/digest send and — per "One-off email campaigns" above — reused as
`build_campaign_email()` for Campaigns too, so this fix covers both) used to
render a separate bordered "READ ONLINE →" button block (`.read-more`)
between the content and the footer. Per explicit user feedback, that whole
block (and its CSS) is gone — "Read online" is now a plain text link inside
the footer `<p>`, right before "· Unsubscribe", same font/size/color as the
rest of the footer copy so it reads as one flowing line rather than a
separate CTA. Still gated on the same `$permalink && '#' !== $permalink`
check as before — a send with no real permalink (e.g. a preview/test send)
just shows "Unsubscribe" alone, no dangling "·".

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

### Subscribers admin page — bulk actions, date filter, per-page (September 2026)

`class-culture-subscribers.php`'s Subscriber List table gained three things,
all server-side (nothing client-only/decorative):

- **Date-range filter** — `date_from`/`date_to` GET params (`YYYY-MM-DD`,
  validated via regex), threaded into `Culture_Subscribers_DB::all()`
  alongside the pre-existing search/list_id filters, matched against
  `s.created_at` (`>= {date_from} 00:00:00`, `<= {date_to} 23:59:59`,
  inclusive). Rendered as a pair of `<input type="date">` fields in the
  filter form, with a "Reset filters" link shown whenever any filter
  (search/list/date) is active.
- **Adjustable per-page** — a `per_page` `<select>` (25/50/100/200, default
  50), validated server-side against that exact allowlist, also threaded
  into `all()`.
- **Bulk actions** — the whole table (toolbar + rows) is wrapped in one
  `<form method="post" action="admin-post.php">` (`action=
  culture_bulk_action_subscribers`, nonce `culture_bulk_subscribers`) with a
  leading checkbox column (`subscriber_ids[]`), a select-all header
  checkbox, and a `bulk_action` `<select>` — "Remove selected" (`delete`) or
  "Add to list…"/"Remove from list…" per real list (`add_to_list_{id}` /
  `remove_from_list_{id}`, populated from `Culture_Newsletter_Lists::get_all()`).
  `handle_bulk_action()` (new, `admin_post_culture_bulk_action_subscribers`)
  applies the action to the selected IDs and redirects back to the exact
  filtered/paginated view it was invoked from (via hidden `ret_*` fields —
  search/list/date/per_page/paged, echoed back into the redirect URL).
  Two new thin wrapper methods on `Culture_Subscribers_DB` —
  `add_subscriber_to_list_id( $subscriber_id, $list_id )` /
  `remove_subscriber_from_list_id( $subscriber_id, $list_id )` — give the
  bulk handler an ID-based way to change list membership (the pre-existing
  `add_to_list_slug()`/`remove_from_list_slug()` are email+slug-based, built
  for the REST/mobile-API write paths, not an admin page operating on
  numeric IDs already in hand).
  **The per-row single "Remove" action changed from a `<form>` to a plain
  nonced GET `<a>` link** (`wp_nonce_url()`, `handle_delete()` now reads
  `$_REQUEST['subscriber_email']` instead of `$_POST[...]`) — a `<form>`
  cannot nest inside another `<form>`, and once the whole table became one
  outer bulk-actions form, the old per-row form would have been invalid
  HTML. If you ever need a similarly per-row destructive single-item action
  inside a bulk-actions table again, use this same nonced-GET-link pattern,
  not a nested form.

### Campaigns "Send to" — searchable multi-select (September 2026)

The one-off Campaigns compose form's "Send to" control (`class-culture-
campaigns-admin.php`) used to render one checkbox per list — fine at a
handful of lists, but stopped scaling once the list registry grew past a
couple dozen entries (Hub auto-provisioning alone adds one list per Hub, see
"Hub → newsletter list auto-provisioning" above). Replaced with a
type-to-filter searchable multi-select: `render_list_multiselect()` renders
a real `<select multiple name="list_ids[]">` (the actual form field/source
of truth — this is what makes it degrade to a plain native multi-select box
with JS disabled, never hidden by PHP) wrapped in a small combobox UI
(`data-culture-ms` / `data-culture-ms-input` / `data-culture-ms-dropdown` /
`data-culture-ms-tags`) that vanilla JS (`multiselect_js()`, no jQuery UI or
select2 dependency, inlined via `wp_add_inline_script('jquery-core', ...)`
— attached to that handle purely because it's reliably always-enqueued in
wp-admin, not because the JS itself uses jQuery) progressively enhances
into a type-ahead filter with removable tag pills, toggling the underlying
`<option>`'s `selected` state on click/Enter. CSS is `multiselect_css()`,
inlined via `wp_add_inline_style('wp-admin', ...)`. Both are only enqueued
on the Campaigns page itself (`maybe_enqueue_editor()`'s existing hook-suffix
check, `culture-subscribers_page_culture-campaigns`) — same file, same hook,
extended rather than duplicated. **If another admin page in this plugin ever
needs the same "checkbox-per-item doesn't scale" fix, reuse
`render_list_multiselect()`'s pattern (or factor it out into a shared
static helper) rather than hand-rolling a third checkbox/dropdown
convention** — this is the second time a list-selection UI has needed this
treatment (the first was the Subscriber bulk-actions "Add to list…"
dropdown above, which stayed a plain `<select>`+`<optgroup>` since dropdown
menus scale fine for a flat picklist — the multi-select-with-many-items case
is what specifically needed the searchable-combobox treatment).

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
- *(Not verified live this pass.)*

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

## Magic-code sign-in + subscribe — every `<SubscribeForm>` on the site (September 2026)

Every "enter your email" subscribe widget site-wide — homepage `JoinSection`, `LiteraryFooter`/
`CommonsFooter`, `CultureDropBand`, the Lifestyle Shop email band, Literary/Commons piece
newsletter breaks — no longer just adds the email to a list. Subscribing now goes through a
magic-code sign-in: a 6-digit code is emailed, and entering it both subscribes the address to the
given list **and** signs the visitor into Moveee (a new Citizen account is created if the email has
none, or the existing account is signed into if it does) — one action does both. Built first for
the new **`/literary/subscribe`** landing page (the destination `LiteraryMasthead.tsx`'s "Get
Updates" ribbon link and "Subscribe" pill now point at, replacing the generic `/newsletter` hub),
then generalized to every other subscribe surface on the site per explicit user follow-up.

**Backend**: `culture-community/includes/core/class-culture-magic-otp.php`
(`Culture_Magic_OTP`) — `request_otp($email)` (rate-limited 3/10min, 6-digit code, `wp_hash()`'d in
a transient, 10-minute TTL, mirrors `Culture_Literary_Access`'s OTP mechanics exactly) and
`verify_otp($email, $code, $list_slug)` (max 5 wrong attempts, single-use, then finds-or-creates a
real WP account — same shape as `Culture_Google_Auth::find_or_create_user()` — and subscribes the
email via `Culture_Subscribers_DB::subscribe()`). Deliberately a **separate class** from
`Culture_Literary_Access`, even though the OTP mechanics are identical in shape — that class's
`verify_code()` issues a signed *content-access* token and never touches a real account; this one
always creates/updates a real WP user and returns a full profile instead of a token. New REST
routes (public): `POST /culture/v1/magic-otp/request`, `POST /culture/v1/magic-otp/verify` (returns
the same `user_profile()` shape `/login` and `/login-google` already return). Email:
`Culture_Emails::send_magic_otp_email()` — deliberately generic copy, not Literary-specific, since
every subscribe surface now uses it.

**NextAuth wiring**: the shared `CredentialsProvider` in `packages/shared/lib/auth.ts` gained a
third `authorize()` branch (alongside username/password and the passkey-token exchange) — when
`credentials.otpEmail`/`otpCode` are present, it calls `/culture/v1/magic-otp/verify` directly and
maps the response the same way the password branch does. **`apps/site` needed its own
`app/api/auth/[...nextauth]/route.ts` for this to work** — it never had one before (it only ever
called `getServerSession()`, which just decodes the shared `.themoveee.com` session cookie and
needs no local route), but `next-auth/react`'s `signIn()` posts to the *current* app's own origin,
so a visitor entering a code on `themoveee.com` needs a real handler there to land on. Same shared
`authOptions`, so the resulting session works on both apps immediately (shared cookie domain).

**Frontend**: `packages/shared/components/SubscribeForm.tsx` (mirrored, per the existing
convention, into the unused-but-kept-in-sync `apps/site/components/SubscribeForm.tsx` copy) is now
a two-step widget — email+button → code+button, same input/button slot and props (`placeholder`/
`buttonLabel`/`buttonClassName`/`inputClassName`/`successMessage`/`list`) as before, so all 9
existing call sites needed zero changes. Step 1 POSTs to the new
`apps/site/app/api/newsletter/magic-otp/request/route.ts` proxy; step 2 calls
`signIn("credentials", { otpEmail, otpCode, otpList: list, redirect: false })` directly — no
verify proxy route needed, `authorize()` talks to WordPress itself. `segment` stays in the props
interface for backward compatibility but is unused — the magic-OTP endpoint has no per-region
segment concept. **The pre-existing `/api/newsletter/subscribe` route and
`NewsletterPreferences.tsx` (the member-settings list-toggle page) are untouched** — those serve an
already-authenticated member managing their own subscriptions, a different flow from an anonymous
visitor subscribing for the first time.

`components/LiterarySubscribeForm.tsx` is a separate, full-page variant (locked copy + the same
two-step flow) built for `/literary/subscribe` specifically — it renders inside `.lit-submit-wrap`/
reuses `.lit-form-*` classes from `literary.css` rather than the compact inline pair the generic
`SubscribeForm` uses, since it's a dedicated landing page, not a footer widget. Both call the same
`/api/newsletter/magic-otp/request` proxy and the same `signIn()` verify path — no duplicated
backend logic between them.

*(Not verified live this pass — needs the plugin redeployed before it's live in production.)*

## The Moveee Literary (`/literary`, added September 2026)

A fiction/poetry/essays/conversations/translation vertical on Site A (`apps/site`), built to feel
like a distinct modern literary magazine. **Digital-only for now — there is no print edition.**
An earlier pass in this build described it as shipping alongside "The Moveee's print quarterly";
that was wrong and has been corrected throughout the section's copy (landing page, submissions
page) and the brand-guide rebuild entry below — don't reintroduce "print"/"quarterly edition"
language into this vertical's user-facing copy unless a real print product is confirmed later.
"The Moveee Literary" is a named section title, same pattern as "The Lane"/"The Edit"/"The Free
Critics" — legitimate use of "The X" as this section's own proper noun, not the "The Moveee"
generic-brand-name bug documented elsewhere in this file.

### Three-tier membership — Moveee Lit (September 2026)

A third membership tier, **Moveee Lit** — `_culture_membership_tier` value `'lit'`, alongside the
existing `'citizen'` (free) and `'patron'` (Moveee Pro, paid). Explicit spec from the user:
"Moveee Lit — everything in citizen plus access to everything in Moveee Literary." This
**reverses** the decision documented in "Literary access gating" below against a separate
Literary tier — the user confirmed this scope directly after being shown the tradeoff (the
two-tier boolean was baked into dozens of touchpoints across web/mobile/PHP).

**The load-bearing property that made this tractable**: every gating check in this codebase —
web, mobile, and PHP alike — is a *strict* equality/inequality against the literal string
`'patron'` (`tier === "patron"` / `'patron' === $tier`), never a "not citizen" or ordinal
comparison. That means introducing a third value is safe by default everywhere: any check that
was never explicitly updated for `'lit'` still correctly treats a Lit member the same as a
Citizen (i.e., **not** Pro) for that feature — shop discount, game-play/credit caps, cashout,
Poll/Itinerary templates, feed-boost, Magazine's own patron-only gate, event RSVP management, etc.
all remain Pro-only, untouched. Only the few places that needed to explicitly *grant* something
to Lit are listed below — everything else needed zero changes.

**Where Lit actually grants access — Literary only, never Magazine:**
- `Culture_Literary_Access::verify_code()` (`culture-community/includes/core/
  class-culture-literary-access.php`) resolves a verified email's access as `'pro'` when the
  account's tier is `patron`, or **`'lit'`** when the tier is `lit` **and** the caller's
  `$context === 'literary'`. A Lit-tier member verifying through the *Magazine* gate
  (`$context === 'magazine'`) still gets plain `'free'` — this one context check is what keeps
  Lit from ever unlocking Magazine's separate patron-only content. The signed token's `access`
  value is now `'free' | 'lit' | 'pro'` (widened in both `make_token()`/`verify_token()` here and
  `apps/site/lib/literary-access.ts`'s `LiteraryAccess` type) — Magazine's own check
  (`apps/site/app/magazine/[slug]/page.tsx`, `app/api/magazine/remainder/route.ts`) still compares
  strictly against `'pro'`, so it was never touched and can't be fooled by a `'lit'` token.
- `apps/site/app/literary/[slug]/page.tsx`'s `PiecePage` and `app/api/literary/remainder/
  route.ts` both compute `hasLiteraryFullAccess` (or equivalent inline) as `isPatron || isLit ||
  litToken?.access === "pro" || litToken?.access === "lit"` — this is the only widened check on
  either file.
- `LiteraryPieceGate.tsx`'s `mode === "pro"` gate now unlocks on `json.access === "lit"` too, and
  its copy/upgrade CTA leads with **Moveee Lit** (cheaper, and it's exactly what unlocks this
  content) rather than Pro — `/register?tier=lit`, not `/register?tier=patron`.
- **If a Lit-tier member's real WP session (not the OTP token) is what's being checked**
  (`session.user.tier`), the same `|| isLit` / `|| tier === "lit"` pattern applies — grep
  `apps/site/app/literary/[slug]/page.tsx` for the canonical shape if extending this further.

**Payment — Paystack + Stripe, parallel to the existing Patron flow, not a new gateway:**
- `Culture_Paystack`/`Culture_Stripe`'s `get_plan_code()`/`get_amount_lowest()`/`get_price_id()`
  all take a `$tier` param now. `'patron'` keeps the exact pre-existing option-key shape
  (`culture_paystack_plan_{cycle}_{currency}`, `culture_stripe_price_{cycle}_usd`) so nothing
  needed re-configuring for Pro; `'lit'` reads a parallel `_lit`-suffixed key
  (`culture_paystack_plan_{cycle}_{currency}_lit`, `culture_stripe_price_{cycle}_usd_lit`),
  falling back to roughly a third of the matching Patron amount when unset. **Configure real Lit
  prices/plan codes in WP Admin → Culture Community → Payment** — new "Moveee Lit — Nigeria
  (NGN) Plans" and "Moveee Lit — Stripe (USD) Price IDs" sections, mirroring the existing Patron
  fields exactly (`class-culture-settings.php`).
- **Paystack needed a "remember which tier this checkout is for" mechanism** since its webhook
  (`subscription.create`) carries no metadata of its own — `_culture_pending_tier` usermeta is
  set right before every checkout is initiated (`init_checkout_session()`,
  `process_checkout_action()`, `ajax_init_payment()`) and read back (defaulting to `'patron'` for
  backward compatibility with any in-flight checkout that predates this change) by whichever of
  `handle_payment_callback()`/`handle_subscription_create()` completes first, then deleted.
  Stripe doesn't need this — its Checkout Session `metadata.tier` survives round-trip to the
  `checkout.session.completed` webhook natively, so `upgrade_user()` just reads it back directly.
- `POST /culture/v1/user/upgrade-init` (existing-user upgrade flow, called by
  `apps/connect/app/api/membership/upgrade-init/route.ts` **and** its Site A twin,
  `apps/site/app/api/membership/upgrade-init/route.ts` — the latter didn't exist before this
  pass; Site A's own `/register/complete` page was calling a route that had never been created,
  a real pre-existing bug this work happened to surface and fix) and `POST /culture/v1/
  complete-profile` (new-user registration flow) both accept an optional `tier` param (`'lit'` or
  `'patron'`, defaulting to `'patron'`) and pass it straight through to
  `Culture_Paystack::get_checkout_url()`/`Culture_Stripe::get_checkout_url()`.
- **Registration** (`class-culture-registration.php`'s shortcode form): the tier radio group
  gained a Lit card between Citizen and Patron; server-side validation widened from
  `['citizen','patron']` to `['citizen','lit','patron']`; a Lit signup redirects to Paystack
  checkout exactly like Patron does (`Culture_Paystack::get_checkout_url($user_id,
  'monthly_ngn', $tier)`).
- **`apps/site/app/register/complete/page.tsx` and its `apps/connect` twin** (byte-identical
  logic, different `auth-*`-class-based styling — keep both in sync) — the membership step's
  tier state widened to `"citizen" | "lit" | "patron"`, a 3-card grid (Citizen/Lit/Pro,
  `.auth-tier-grid` bumped from a 2-col to a 3-col/2-col/1-col responsive grid in
  `apps/connect/app/auth.css`), and `?upgrade=lit` (alongside the existing `?upgrade=patron`) on
  both `/register` and `/register/complete` pre-selects and fast-tracks straight to the
  membership step for an already-logged-in member upgrading in place.

**WP Admin — "Pro Memberships" renamed to "Paid Memberships"**
(`class-culture-memberships.php`, same `culture-memberships` slug, unchanged URLs): the list
query, status-count SQL, and pagination all widened from a hardcoded `meta_value = 'patron'` to
`IN ('patron', 'lit')`; a new Tier filter tab row (All / Moveee Pro / Moveee Lit) sits above the
existing Status tabs; the list table gained a Tier column; the Add/Edit form's tier `<select>`
gained a Lit option; `handle_save()`'s allow-list widened to `['patron','lit','citizen']`.

**Two latent bugs this surfaced and fixed, unrelated to the UI work above but load-bearing**:
1. `Culture_Cron`'s manual-expiry sweep (`class-culture-cron.php`) queried strictly
   `_culture_membership_tier = 'patron'` before checking whether an admin-set expiry date had
   passed — a Lit member given a manual expiry date would never have been auto-downgraded to
   Citizen. Widened to `IN ('patron', 'lit')`.
2. `Culture_Emails::send_payment_receipt()` hardcoded its plan-name fallback to `"Patron
   Membership"` whenever the payment payload didn't carry an explicit plan name (true for every
   Paystack/Stripe flow in this codebase) — a Lit purchaser's receipt would have said "Patron
   Membership." Fixed to read the user's just-granted tier fresh and pick the matching default.

**Deliberately not built in this pass**: a native Google Play Billing SKU for Lit on Android
(`MembershipScreen.tsx`'s Lit card always says "Upgrade on the web," same as iOS's Pro path —
see "Google Play Billing" elsewhere in this file for why a second real Play Console subscription
product is a human-setup step, not something code alone can do) and any live-pricing API for the
marketing pages that display a Lit price (`apps/connect/app/connect/membership/page.tsx`,
`apps/site/app/features/membership/page.tsx` both show a hardcoded fallback figure —
`PatronPrice.tsx`'s own live-pricing plumbing is itself dead code today, since
`apps/connect/app/layout.tsx` passes `initialPricing={null}` unconditionally; a Lit price display
was made consistent with that pre-existing state, not worse than it).

**Citizen-vs-Lit pricing table added to `/literary/subscribe` (September 2026 follow-up)** —
`apps/site/app/literary/subscribe/page.tsx` (the destination for `/literary`'s "Get Updates"
ribbon/masthead "Subscribe" pill — see "Magic-code sign-in + subscribe" above) previously only
offered the free GetMeLit OTP signup, with no Lit-membership upsell on the page at all. Added a
two-card pricing table (new `.lit-pricing-*` classes in `literary.css`, styled off the section's
own oxblood/parchment palette rather than the sitewide tokens, per this vertical's standing
"own standalone brand identity" rule) directly above the `<LiterarySubscribeForm>`:
- **Moveee Citizen** — free; `LITERARY_FREE_READ_LIMIT` (3, imported from `lib/literary-access.ts`
  rather than hardcoded) free reads every 30 days; GetMeLit/Culture Drop; the rest of Moveee.
- **Moveee Lit** — real pricing (₦1,500/mo or ₦15,000/yr, $1/mo or $13/yr — same figures already
  shipped on `/register/complete`'s membership step, not re-derived): everything in Citizen, plus
  unmetered full access to every piece (public and exclusive alike), **commenting on stories**,
  early news/previews/event invites (especially Literati Connect), and complimentary "TML
  Originals × The Moveee Literary" merch for annual subscribers only.
- **"Comment on stories" built, same follow-up session.** New: `apps/site/components/
  LiteraryComments.tsx` — a Literary-branded sibling of `ArticleComments.tsx`, same `/api/comments`
  backend and `Comment` shape, but its own JSX/CSS (`.lit-comments-*` in `literary.css`, not
  `editorial.css`'s `.ar-gate`/`.comments` families) since this section runs its own `--lit-*`
  design tokens. Mounted at the bottom of the piece body in `app/literary/[slug]/page.tsx`
  (`<LiteraryComments postId={post.databaseId} canComment={hasLiteraryFullAccess} />`) — gated
  on the exact same `hasLiteraryFullAccess` check every other Literary-only feature already uses
  (`isLit || isPatron || litToken?.access === "pro" || litToken?.access === "lit"`), confirmed
  directly with the user rather than assumed: **Moveee Pro also gets to comment, same as every
  other Literary-only feature** — a literal "Moveee Lit only, excluding Pro" reading was floated
  and explicitly rejected in favor of staying consistent with the rest of this section's gating.
  Three states: signed-in + gated tier → real composer; signed-in + ungated (Citizen) → an inline
  upsell card ("Comments are for members" + an Upgrade-to-Lit CTA); signed-out → the same card
  with a sign-in link added. The comment thread itself (once posted) is always visible to every
  reader regardless of tier — only *posting* is gated, reading isn't. **Not built**: replies/likes
  on individual comments (no such backend concept exists here either, same limitation
  *(Not verified live this pass.)*

### Literary access gating — metered soft-paywall + email/OTP "join the club" box (September 2026)

**Superseded in part by "Three-tier membership — Moveee Lit" above.** Pro-only Literary pieces
were originally folded into the existing Moveee Pro mechanism only — no separate tier — per an
explicit decision against a second paid tier splitting the audience. That decision was
**reversed** the same month: Moveee Lit now also unlocks every Pro-only Literary piece (see that
section for the mechanics — the `pro`/`lit` access split is deliberate and Magazine-side gating is
untouched). Everything below in this section (the metering, the OTP mechanism, the truncation)
is unchanged; only which tiers can satisfy `accessLevel === "patron-only"` grew.

All non-logged-in readers are also
metered: a limited number of free Literary reads per rolling 30 days, enforced server-side
(genuine truncation of the HTML that's sent, not a client-hidden soft gate), with a compact inline
email/OTP box doing double duty as both the unlock mechanism and the list-building funnel.

**Prerequisite bug fixed first**: `STORY_FIELDS_FRAGMENT` in `packages/shared/lib/wp.ts` was
missing `cultureAccesses { nodes { slug } } }` entirely — `getAccessLevel()` (`lib/access.ts`)
always silently returned `"public"` for anything fetched via `GET_STORY_BY_SLUG`, so Pro-gating
never actually worked on `/magazine` either, only on pages using a different query. Fixed by
adding the field to the shared fragment — this incidentally fixes magazine Pro-gating too, not
just Literary.

**Why the existing `ArticleContentGate` pattern couldn't be reused as-is**: it's a client
component (`"use client"`) that receives the full article HTML as a `fullContent` prop and only
conditionally *renders* it based on `useSession()` — the full content is still present in the
RSC payload sent to every visitor regardless of access, just hidden client-side. That's fine for
a soft nudge but not for genuine enforcement, so Literary's gate does real server-side truncation
instead (see below) and only ever ships the withheld remainder over the wire once verified.

**Backend** (`culture-community/includes/core/class-culture-literary-access.php`,
`Culture_Literary_Access`) — same HMAC-signed-token trust model as `Culture_Preview`
(`base64url(email|access|expiry) + "." + hash_hmac('sha256', ..., culture_api_secret)`), so no
new secret to keep in sync:
- `request_code($email)` — generates a 6-digit code, stores only its `wp_hash()` in a 10-minute
  transient (never the code itself), rate-limited (3 requests / 10 min per email), emails it via
  a new `Culture_Emails::send_literary_otp_email()`.
- `verify_code($email, $code)` — checks the code (max 5 wrong attempts before it's invalidated),
  then resolves access: an email matching an existing WP user with `_culture_membership_tier =
  patron` gets `access: 'pro'`; anything else gets `access: 'free'` **and** is added to the
  `culture_newsletter_subscribers` option under a `literary-club` list tag (the list-building
  mechanism — mirrors `handle_newsletter_subscribe()`'s find-or-create shape rather than calling
  it, since `Culture_Subscribers::merge_subscribers()` is private). Issues the signed token.
- REST: `POST /culture/v1/literary/request-code`, `POST /culture/v1/literary/verify-code` (both
  public — the code/token themselves are the credential).

**Next.js verifies the token locally, not via a round trip to WordPress** —
`apps/site/lib/literary-access.ts`'s `verifyLiteraryToken()` re-implements the same HMAC check in
Node using `process.env.CULTURE_API_SECRET` (the same value as the `culture_api_secret` WP
option, already the shared secret for the Bearer-auth REST surface). Also in that file:
- `truncateHtmlByPercent(html, percent)` — splits sanitized HTML on top-level block-tag
  boundaries (`p`/`h1-6`/`blockquote`/`figure`/`ul`/`ol`/`table`/`div`), accumulates each block's
  plain-text length until the target percentage is reached, and cuts there — never mid-paragraph.
  Degrades to "show everything, no gate" when the content is a single block (too short/flat to
  split sensibly) rather than gating something that can't be partially shown.
- `isCrawlerUserAgent()` — known search-engine/social-preview bots always get the full piece,
  untracked, ungated. This is a list-building mechanism, not an anti-indexing wall.
- Free-read metering — `moveee_lit_reads` cookie (JSON array of `{slug, ts}`, pruned to a 30-day
  window, deduped by slug so re-reading the same piece doesn't cost another credit). Written by
  a Route Handler (`app/api/literary/track-read/route.ts`), not `page.tsx` itself — a Server
  Component can't set a cookie during render in this Next.js version, only a Route
  Handler/Server Action can, so the piece page calls a tiny client component
  (`LiteraryReadTracker.tsx`, fire-and-forget `useEffect` POST) to write it after mount instead.
  `LITERARY_FREE_READ_LIMIT = 3` per 30 days.

**Cross-origin cookie relay**: WordPress can't set a cookie on `themoveee.com` directly (different
origin), so `app/api/literary/verify-code/route.ts` is what actually sets the first-party
`moveee_lit_token` httpOnly cookie (30-day `maxAge`) after relaying the verify call to WordPress —
same relay pattern `/api/preview` already uses for the draft-preview token.

**`apps/site/app/literary/[slug]/page.tsx`'s `PiecePage` computes access server-side** on every
request (session via `getServerSession(authOptions)`, the verified-token cookie, the free-reads
cookie, and the crawler check) and branches three ways:
1. **Patron-only piece, not authorized, logged in** (any tier but Pro) → real server-side
   truncation at 30%, then a plain static "Upgrade to Moveee Pro" block (not the email box — they
   already have an account, the box is specifically for anonymous readers).
2. **Patron-only piece, not authorized, anonymous** → truncated at 30%, `LiteraryPieceGate`
   (`mode="pro"`, `blocking`) — verifying with an email that isn't a Pro account still joins them
   to the free list but leaves this specific piece gated with an upgrade nudge.
3. **Public piece, anonymous, free-read quota exhausted** → truncated at 30%,
   `LiteraryPieceGate` (`mode="meter"`, `blocking`) — verifying (free or Pro either way) unlocks
   it via one AJAX fetch to `app/api/literary/remainder/route.ts`, which re-derives authorization
   server-side (never trusts the client) and returns just the withheld HTML, injected in place —
   no page reload, so scroll position/reading state is never disturbed.
4. **Public piece, anonymous, quota still has reads left** → full content ships as normal, but a
   **non-blocking** `LiteraryPieceGate` (`mode="meter"`, `blocking={false}`) is still inserted at
   the 30% mark as a dismissible "Join The Moveee Literary Club" nudge — this is the literal
   "compact box after every 30% read for non-logged-in users" ask, independent of metering
   enforcement. A "Skip for now" link just hides it; nothing is withheld in this case since the
   whole point is the content's already fully present.
5. **Logged in (any tier) on a public piece, or already carrying a valid verified-token cookie**
   → full content, no box at all — the box only ever renders when the page decides to render it
   (there's no client-side "hide if logged in" check needed inside `LiteraryPieceGate` itself).

**If all articles were ever made fully paid** (raised and rejected in this same design pass): it
would kill the entire free/discovery/SEO/organic-sharing loop this vertical depends on — an
all-paid model was explicitly not built. Keep the metered model; don't remove the free tier of
reads without a deliberate, separate decision.

**Not built in this pass**: a WP Admin UI for adjusting `LITERARY_FREE_READ_LIMIT`/code TTLs (both
are code constants, not options); the mobile app has no equivalent gating (Literary isn't
surfaced on `apps/mobile` at all yet, per the rest of this section).

**Gate copy re-branded to The Moveee Literary's own voice (September 2026, follow-up)** — the
gate boxes originally used generic sitewide "Moveee Pro" copy (`"This piece is Moveee Pro"`,
`"Verify your Moveee Pro membership"`) with no Literary framing at all. Every gate state (the
logged-in-non-Pro static block in `page.tsx`, and all three `LiteraryPieceGate.tsx` stages —
email, otp, pro-needed) now leads with a `★ The Moveee Literary` eyebrow (`.lit-gate-eyebrow`,
gold, mono uppercase — mirrors `ContentGate.tsx`'s `★ {tierLabel}` pattern but in the Literary
palette) and rewritten headings/body copy in the section's own restrained voice (no hype words,
no "we don't have X" negative framing, per the Voice/copy constraints documented above) — e.g.
`"There's more to read."` / `"This piece continues in the Moveee Pro archive..."` instead of the
generic `"This piece is Moveee Pro"`. **The underlying mechanism is completely unchanged** — this
is copy/branding only, same as the Hidden Gem→Place and Route→Itinerary renames elsewhere in
this file; the fold-into-Moveee-Pro decision, the metering, and the token/verification flow are
untouched.

**End-of-piece author bio (September 2026)** — `PiecePage` now renders a `.lit-piece-author` band
at the end of the article body (after the share-icons row, inside `<article>`), reusing
`post.author.node`'s existing `avatar.url`/`description`/`name`/`slug` fields (already fetched by
`STORY_FIELDS_FRAGMENT` — no query change needed, same fields `/magazine/[slug]`'s own
`.ar-author` band already reads). Circular photo (initial-letter fallback when no avatar is set),
name, a real bio when `description` is set, or a plain `"Contributing writer, The Moveee
Literary."` fallback when it isn't (never fabricated personal copy), and a `"More by {first
name} →"` link to `/author/{slug}` (the shared, sitewide author-archive route) when the author
has a slug. Mirrors `/magazine/[slug]`'s `.ar-author` pattern but restyled with the Literary
palette/type system (`.lit-piece-author-*` in `literary.css`) rather than reusing `.ar-author`
directly, since `editorial.css` isn't loaded on `/literary` routes at all.

*(Not verified live this pass.)*

**Deliberately reuses the existing magazine `post` type — no new CPT, no GraphQL schema
changes — and, critically, reuses an existing WordPress category rather than inventing one.**
An initial draft of this feature assumed a brand-new "literary" category tree didn't exist yet
and needed to be created; that was wrong — Moveee had already been publishing poetry, fiction,
and nonfiction for a while under a real category (shown in WP Admin as **"Essay, Fiction &
Poetry"**, 19 posts at the time this was built) whose **slug is `literary`** (the display name
and the slug were set independently in WP and don't have to match — this tripped up the first
pass). The whole vertical is scoped to that one existing category:

- `LITERARY_CATEGORY_SLUG = "literary"` in `packages/shared/lib/wp.ts` is that category's slug.
  `isLiteraryPost(post)` just checks whether a post carries it. **All 19 pre-existing posts
  already qualify with zero WP Admin changes** — they show up in the main `/literary` feed
  immediately on deploy, no backfill needed.
- **Section/genre is a plain WordPress tag, not a child category** — the existing posts predate
  any genre split and were never tagged by genre, so genre is an *optional overlay* on top of the
  category, never a requirement for a piece to belong to the vertical. `literaryGenreOfPost(post)`
  reads `post.tags.nodes`, matching against `LITERARY_GENRES[].tagSlug` — plain tag slugs, no
  `literary-` prefix, no new categories. **Six sections, per the brand guide's "editorial
  architecture" (`docs/the-moveee-literary-brand-guide.pdf`, §07), in this exact order**: Fiction,
  Poetry, Essays, Conversations, In Translation, Notes (`LITERARY_GENRES` in
  `packages/shared/lib/wp.ts` — this superseded an earlier 4-genre Poetry/Fiction/Nonfiction/
  Translation model built before the brand guide existed; if you see a reference to only 4
  genres anywhere, it's stale). "Conversations" is the deliberate brand-guide term for what would
  otherwise be called "Interviews" — warmer, more literary, per the guide's own voice section.
  "Notes" (short criticism, dispatches, letters, observations) is a lower-traffic catch-all, not a
  primary pillar, but **is** included in `LiteraryMasthead.tsx`'s section nav along with the other
  five — the September 2026 Granta-inspired rebuild (see below) shows the full section list rather
  than dropping one for space, unlike the header nav it replaced. **A post with no genre tag still appears in the main
  `/literary` feed; it just won't show up on any single genre's page (`/literary/poetry` etc.)
  until someone adds the matching tag in WP Admin.** This can be done at any time, for old or new
  posts, with a single tag edit — no migration, no re-categorization.
- `getLiteraryPieces(tagSlug?, first)` always queries `GET_STORIES` scoped to
  `categoryName: "literary"`, optionally adding `tag: tagSlug` to narrow to one genre — both
  params are native, pre-existing `GET_STORIES` where-args, so no query changes were needed
  beyond adding a `tags { nodes { name slug } }` field to the shared `STORY_FIELDS_FRAGMENT`
  (a standard WP core taxonomy connection, same risk profile as the `categories`/`countries`
  fields already there — not a custom/plugin field, so no bridge-plugin-isolation concerns).
- Genre metadata (slug, tag slug, label, one-line tagline) lives in one place: `LITERARY_GENRES`
  in `packages/shared/lib/wp.ts`, alongside `LITERARY_CATEGORY_SLUG`, `getLiteraryGenre()`,
  `isLiteraryPost()`, `literaryGenreOfPost()`, and `getLiteraryPieces()`. Add a fifth genre here
  — nowhere else — if one is ever needed.

**Routes** (`apps/site/app/literary/`):
- `layout.tsx` — sets the section's metadata, loads the four brand Google Fonts scoped to this
  route tree (`next/font/google`, CSS variables via `variable`), wraps `children` in `.lit-page`
  (its own Ivory background, not `.mg-page-white`/magazine.css's white), and — per the September
  2026 Granta-inspired rebuild below — mounts `LiteraryMasthead`/`LiteraryFooter` around
  `{children}`, since the sitewide Header/Footer don't render on any `/literary` route at all.
- `page.tsx` — landing page, rebuilt from an approved Granta-inspired mockup: a real hero carousel,
  a "Latest" grid, an "In Translation" band, a "More From The Moveee Literary" grid, a submissions
  spotlight, and a "Browse by Section" shelf — see that rebuild entry below for the full detail
  and for what the mockup showed that this doesn't have (per-issue volumes, a purchasable print
  plug, a 6-tile genre-index grid, an editorial-promise pull-quote — all removed, not adapted).
- `[slug]/page.tsx` — **one dynamic segment serving two different things.** Next.js doesn't allow
  sibling routes with different dynamic-segment names at the same level (`[genre]` next to
  `[slug]` is a build error), so this single file checks the incoming slug against
  `LITERARY_GENRES` first — a match renders the genre archive (`GenreArchive`), anything else
  falls through to a real post lookup (`PiecePage`, which 404s if the post isn't in the
  `literary` category). If you ever need a third `/literary/*` "thing" that isn't a genre or a
  piece, it
  has to be a real static segment (like `submit/`, below) — Next.js resolves static segments
  before dynamic ones, so there's no conflict — not another dynamic catch-all.
- `submit/page.tsx` — static submissions guidelines (reading windows, formatting, response time,
  rights language, a `mailto:literary@themoveee.com` link). **The specific windows/response
  time/rights language in this file are reasonable starting defaults, not confirmed editorial
  policy** — there's a code comment flagging this; check with The Moveee's editors before treating
  it as final copy.

**`/magazine/[slug]` redirects literary posts to `/literary/[slug]`** (added to that file's page
component, right after the `notFound()` check) so there's exactly one canonical URL per piece —
without this, a literary post would be reachable and fully renderable at both URLs (duplicate
content), since it's the same underlying `post`. `sitemap.ts` mirrors this split: literary posts
are filtered out of `articleUrls` (`/magazine/...`) and listed under a separate `literaryPieceUrls`
(`/literary/...`) instead.

**This redirect takes effect immediately on deploy for the 19 pre-existing posts already in the
`literary` category** — any of them currently reachable/indexed at `/magazine/{slug}` will start
308-redirecting to `/literary/{slug}` the moment this ships, since they already carry the
category. A 308 preserves most SEO equity, but it's a real, immediate change to already-published
URLs, not just new behavior for future content — worth knowing before deploying, not a silent
side effect.

**`'literary'` was added to `proxy.ts`'s `APP_ROUTES` set** — without this, the bare `/literary`
path (no further segment) would be caught by the legacy-WordPress-permalink catch-all and
301-redirected to the nonexistent `/magazine/literary`. Any future single-segment top-level route
needs the same registration — see that file's own comment.

### Brand-guide rebuild, then a full Granta-inspired rebuild (September 2026) — standalone mini-site, own shell, real data

Two passes, both superseded-by-the-next — this entry describes only the current, live state.
The first pass (per the brand identity PDF, `docs/the-moveee-literary-brand-guide.pdf`) gave the
section its own palette/type system but kept it living inside the sitewide floating header pill
and used a text-drawn logo lockup. The user then supplied the **real logo file** and asked for a
layout modeled directly on Granta's actual homepage ("build it for real... exactly as is, do not
try to unnecessarily retain anything from current site") — that second pass is what's live now,
and it removed or replaced most of what the first pass built.

**Palette** (`apps/site/app/literary.css`, `:root` scope): `--lit-ivory` (`#f5efe4`, background),
`--lit-ink` (`#161412`, text), `--lit-oxblood`/`--lit-oxblood-deep` (`#7a241c`/`#5c1b15`, primary
accent), `--lit-mahogany` (`#6b2b21`), `--lit-gold` (`#b88942`, sparing luxury accent, per the
guide's 70/20/7/3 Ivory/Ink/Oxblood/Gold ratio), `--lit-parchment` (`#e9ddc8`), `--lit-umber`
(`#8b4d2e`), plus derived `--lit-mute`/`--lit-rule`/`--lit-rule-strong`. **No longer needs global
`:root` scope for the header's sake** (see below — the sitewide header doesn't render on
`/literary` at all anymore) but was left at `:root` anyway since nothing else on the site uses the
`--lit-*` prefix. `.lit-page` (`layout.tsx`) still sits above the sitewide body-grain texture with
this Ivory background, same trick as `/magazine`'s `.mg-page-white`.

**Typography** — same four Google Fonts as before, loaded via `next/font/google` in
`app/literary/layout.tsx` (`--font-lit-display` = Bodoni Moda, `--font-lit-italic` = Cormorant
Garamond, `--font-lit-body` = EB Garamond, `--font-lit-meta` = Inter) — only real inside `.lit-page`.

**The Moveee Literary is now a fully standalone shell — no sitewide chrome at all**, not just a
re-skinned floating pill:
- `Header.tsx` — the sitewide floating pill now **returns `null` entirely** when `isLiteraryPage`
  (`pathname === "/literary" || .startsWith("/literary/")`), right before its `return (...)` (all
  hooks still run unconditionally above that, per Rules of Hooks). The old `.toolbar-shell--literary`/
  `.toolbar-lit-nav*` CSS and the `isLiteraryPage` branch inside the pill's JSX are gone — deleted,
  not left dead, per this rebuild's own instruction not to retain unneeded old stuff.
- `ConditionalFooter.tsx` — gained an `isLiteraryPath()` check alongside its existing newsletter-
  reader check; the sitewide dark `Footer.tsx` never renders on any `/literary` route.
- **`apps/site/components/LiteraryMasthead.tsx`** (new, client) and **`LiteraryFooter.tsx`** (new)
  are mounted once from `app/literary/layout.tsx`, wrapping `{children}` — so every page under
  `/literary` (landing, genre archives, single pieces, submissions) gets the same standalone
  masthead/nav/footer, not just the homepage the mockup itself showed.
  `LiteraryMasthead` renders: a slim oxblood ribbon ("New fiction, poetry, essays and translation,
  published continuously." + a "Get Updates" link to `/newsletter`), a masthead row (real logo +
  Sign In [cross-domain to `web.themoveee.com/login`, session-aware via `useSession()`] / Submit /
  Subscribe / a search button reusing the sitewide `SearchOverlay` component), and a full 6-item
  section nav (Fiction/Poetry/Essays/Conversations/In Translation/Notes — all six, unlike the old
  pill nav which dropped Notes for space).
- **Logo**: the user supplied the actual approved lockup file (a PNG: "The" in oxblood italic over
  a bold black "moveee." wordmark with an oxblood period, "LITERARY" tracked serif caps beneath) —
  saved as the real static asset `apps/site/public/logo-literary.png`. `LiteraryLogo.tsx` is now a
  thin wrapper rendering that image (`compact`/`inverted` props for header vs. footer sizing/color)
  — **no longer a CSS text-drawn lockup**; the old `.lit-logo*` CSS classes were deleted.

**Homepage (`app/literary/page.tsx`) — rebuilt from an approved Granta-inspired Artifact mockup,
every section wired to real `getLiteraryPieces()` data, not the mockup's placeholder copy:**
- **Hero** — `LiteraryHeroCarousel.tsx` (new client component): a real carousel over the 3 most
  recent pieces (arrows/dots only render when there's more than one), each slide showing the genre
  tag, title (links to the piece), byline, and a plain-text excerpt standfirst. Falls back to an
  `.lit-empty` prompt when there are zero pieces.
- **"Latest From The Moveee Literary"** — next 6 pieces (after the 3 in the hero) in two rows of
  three, the second row getting a `.lit-grid--divided` hairline top border (mirrors the mockup's
  print-gutter rule). Section is omitted entirely when empty.
- **"In Translation: A Rotating Table"** — a real `getLiteraryPieces("translation", 6)` fetch on a
  `--lit-parchment`-tinted band (`.lit-band`); omitted entirely if no translation-tagged pieces
  exist yet (graceful degradation, same convention as the rest of this codebase).
- **"More From The Moveee Literary"** — up to 3 more pieces from the same pool, deduped against
  everything already shown above via a running `Set` of used slugs.
- **Submissions spotlight (`.lit-plug`)** — replaces the mockup's print-issue plug (a purchasable
  physical volume, "Buy the Issue," a cover price) with the one thing that's actually real and
  always relevant here: an always-open submissions call, reusing the plug's visual shape (a dark
  cover-style tile + copy + CTA) but pointing at `/literary/submit`.
- **"Browse by Section" (`LiteraryShelf.tsx`, new client component)** — replaces the mockup's
  back-catalogue shelf of purchasable past volumes (there's no volume/issue taxonomy in the CMS at
  all) with a horizontally-scrolling shelf of the six real genre archive pages instead — same
  scroll-and-arrow-button mechanism as the mockup, backed by data that's always correct rather than
  fabricated volume names/prices.
- **Deliberately NOT carried over from the mockup or the prior brand-guide build**: any "Issue
  04"/"Vol. IV" numbering (no such taxonomy exists — see the digital-only correction above), the
  print-quarterly framing (see that same section), the old 6-tile genre-index grid and the
  editorial-promise pull-quote section (both fully removed, not just unused), and the per-genre
  accent-color scheme from the original build (one restrained oxblood accent throughout, per the
  guide's own restraint principle).

**`LiteraryPieceCard.tsx` gained a real image** — the mockup's cards all lead with a photo; the
prior build's card had none. Renders `piece.featuredImage.node.sourceUrl` when present, an oxblood-
gradient placeholder div when not. Its wrapper/class names were renamed from `lit-card`/
`lit-card-kicker`/etc. to `piece`/`lit-tag`/`piece-title`/`piece-dek`/`piece-byline` to match the
mockup's own naming — this is the one card component every grid across the whole section reuses
(homepage, genre archives, the single-piece "More {Genre}" grid).

**Cards are flush, not shadowed** — `.piece`/`.lit-shelf-item` deliberately have no border-radius/
box-shadow (unlike the sitewide `--radius-xl`/`--shadow-card` convention every other Site A grid
follows) — restraint, closer to how Granta/The Paris Review actually lay out an archive than a
modern card-UI grid.

**Signature motif (brand guide §11, curved oxblood/gold line)** — never built in either pass;
still not wired into any page. If asked for later, it has no CSS classes reserved for it anymore
(the placeholder `.lit-motif*` rules from the first pass were deleted in this rebuild).

**Voice/copy constraints, apply to any future literary-section copywriting**: avoid superlative/
hype words ("groundbreaking," "revolutionary," "prestigious," "best," "world-class," "incredible");
prefer short declarative sentences over abstractions; restraint is treated as a form of luxury
here. **Also avoid announcing what the section is *not*** — an earlier draft of this section's
ribbon copy read "No print edition — read it all here," which the user flagged directly as bad
copy ("why would you think it even makes sense to say something like this"): a real publication
never states what it isn't. The same reflex ("digital home," "published continuously online")
was caught and removed from the submissions page too — don't reintroduce a "we are/aren't X"
qualifier anywhere in this section's copy.

**Discoverability**: linked from the Site A header's menu overlay (`Header.tsx`'s full-screen menu,
between Magazine and Shop — that link is unaffected by the pill returning `null` on `/literary`
itself), the shared `Footer.tsx`'s Explore column, `LiteraryFooter.tsx`'s own Sections/Magazine
columns, and a contact card on `/contact`.

**Not built in this pass, deliberately out of scope**: a real submissions intake portal (the
guidelines page still just points to a mailto address), Pro/Patron content gating (magazine
articles nominally support this via `getAccessLevel()`/`ArticleContentGate`, but `GET_STORY_BY_SLUG`
doesn't request the `cultureAccesses` field that gate reads, so it doesn't work even on `/magazine`
— not fixed here, not worth replicating into a new vertical), and any Issue/Volume taxonomy (see
above — there's nothing to tie to yet).

*(Not verified live this pass.)*

## Literary About Us + Submissions pages — real copy from The Moveee's editors (September 2026)

`apps/site/app/literary/submit/page.tsx`'s content was previously flagged in this file as
"reasonable starting defaults, not confirmed editorial policy" — that placeholder is now
replaced with the real thing, supplied directly by the editors (two Word documents: an About Us
page and a Submissions Landing Page). A new route, `apps/site/app/literary/about/page.tsx`, was
also added — there was no About page under `/literary` before this.

- **Both pages reuse the existing `.lit-submit-*` CSS classes** (`literary.css`) as-is — despite
  the name, that class family is a plain long-form-content layout (eyebrow, h1, body copy with
  h2 breaks, a closing 2-card row), not literally scoped to the submissions page. No new CSS was
  needed for either page.
- **Real, confirmed policy, not placeholders**: quarterly issues pay $15&ndash;$25/piece (The
  Moveee Flash pays a flat $10), an 8&ndash;12 week response time (4 weeks for Flash), a $3
  quarterly submission fee with up to 100 free waiver slots per quarter (Flash has no fee),
  first-publication-and-archival-rights-only (author retains copyright), and prize-nomination
  language (Pushcart, Caine Prize for African Writing, Best Small Fictions, O. Henry Prize, plus
  an internal Moveee Editor&rsquo;s Prize). If any of these numbers ever change, this is the one
  page to update — there's no other copy of them anywhere in the codebase.
- **The Moveee Flash** (a free monthly flash-fiction call reserved for African writers/stories,
  distinct from the paid quarterly issues open to writers from anywhere) is documented here for
  the first time — it didn't exist in the old placeholder copy. If Flash ever gets its own
  route/CTA beyond a mention on the Submissions page, this is the section to expand from.
- **`LiteraryFooter.tsx`'s "The Magazine" column** gained an "About Us" link
  (`/literary/about`), placed between "The Moveee Literary" and "Submit Your Work" — the
  masthead's top nav (`LiteraryMasthead.tsx`) was deliberately left as-is (genre links only,
  plus the existing Submit/Subscribe pills) since the user asked specifically for the footer.
- This section's editorial voice (no hype words, no "we are/aren't X" negative framing — see the
  Voice/copy constraints entry above) is naturally satisfied by the supplied copy as given; no
  further rewriting was needed beyond adapting it into JSX (headings, lists, `&mdash;`/`&rsquo;`
  entities for the site's existing HTML-entity convention).
- *(Not verified live this pass.)*

## Literary Submissions Manager — admin tool, mechanics still current (intake model superseded below)

`Culture_Literary_Submissions` (`culture-community/includes/admin/class-culture-literary-submissions.php`,
WP Admin submenu `culture-literary-submissions`) is the editorial tool for tracking a submission
through decision — fields: writer name/email, section, title, status (Received/In
Review/Accepted/Rejected/Published), fee status, payment status, assigned reviewer, notes.
Storage: single `culture_literary_submissions` wp_options row (array), not a table — a small,
manually-curated list, same pattern as `Culture_Redirects`.

**The original email-only intake this section described (writers emailing
`literary@themoveee.com`) is superseded by the real payment-integrated form below — skip there
for how writers submit today.** The admin tool's mechanics below are still current and are reused
by that form:
- **`Culture_Literary_Submissions::SECTIONS`** hardcodes fee/payment/response-window terms per
  section, mirroring `/literary/submit`'s real policy copy — **no shared source of truth**; if
  those figures ever change on the submissions page, update this constant too.
- **"Push to WordPress"** (Accepted/Published rows only) creates a real `draft` post (never
  auto-published) in the `literary` category with a genre tag matching the section — re-pushing
  updates the same post via its stored `wp_post_id`, never duplicates. Author is the writer's own
  WP account if their email matches one, else the editor doing the push (no guest-author system
  exists).
- **Accept/reject/received emails** are WP Admin-editable templates (`literary_accepted`,
  `literary_rejected`, plus `literary_received` from the form below) via the existing
  `Culture_Email_Templates` system — fix wording there, not in PHP, unless the merge-tag set
  itself changes. Merge tags: `{writer_name}`, `{piece}`, `{section}`, `{payment_label}`.
  Fires only on an actual status transition into accepted/rejected, never on every save.

## Literary Submissions — real payment-integrated online form replaces email intake entirely (September 2026)

**This supersedes every earlier "intake stays email" decision documented above.** After the
manual Submissions Manager and its email-based intake shipped, the user asked directly: if
writers submit by email, how do they even pay the $3 quarterly submission fee? The answer was
to build a real public submission form with payment integrated end-to-end, reusing the exact
same Paystack/Stripe machinery already powering event tickets and membership subscriptions —
not a new payment system. **Email intake is gone.** `literary@themoveee.com` is now only for
questions and waiver-code requests, not submissions.

**The form collects the finished piece as pasted rich text, not a file upload — deliberately,
per explicit user steer mid-build.** An earlier draft of this feature planned a manuscript
file upload (.docx/.doc/PDF) plus server-side DOCX→HTML parsing (a whole planned
`Culture_Literary_Inbox` class, `webklex/php-imap` + `phpoffice/phpword` Composer dependencies,
blocked in this sandbox by `api.github.com` being unreachable through the agent proxy) so an
editor's "Push to WordPress" button would have real body text to work with. **That entire plan
was abandoned, not just deferred** — the user pointed out a simpler design: let the writer
paste their formatted piece directly into a rich-text field on the form itself. This sidesteps
file uploads, R2 storage, and DOCX parsing entirely, and the pasted content lands **directly**
in the same `content` field the admin's existing `wp_editor()`/"Push to WordPress" flow already
expects (see the "WordPress push" follow-up documented in the superseded entry above) — an
editor now gets real, submission-ready body text from the moment a submission arrives, with
zero parsing code needed anywhere. If a future request ever wants file-upload intake back
instead, this is a deliberate, explicit reversal to revisit, not a gap that was missed.

**Manuscript-format copy on `/literary/submit` was rewritten to match** — the old
"we accept .doc, .docx, and PDF files, font size 12, double spacing, Garamond" paragraph
described a manuscript that no longer exists; it now just says the piece is pasted directly
into the online form's editor.

### Payment — mirrors `Culture_Ticket_Payment` almost line-for-line

`Culture_Literary_Submissions` (same file as the admin manager) gained the payment machinery
directly, rather than a new class, since it already owns `add_submission()`'s one true
creation path:

- **New dbDelta table**: `wp_culture_literary_payments` (`payment_table()`/
  `create_payments_table()`, wired into `Culture_Activator::create_tables()`,
  `CULTURE_VERSION` bumped `2.8.0` → `2.9.0` to trigger it — see "Plugin DB table
  auto-upgrade" above). Holds `writer_name`/`writer_email`/`section`/`title`/`content`
  (the pasted rich text, held here until payment clears) plus the usual `payment_code`/
  `payment_gateway`/`payment_reference`/`payment_status`/`status` fields, unique-keyed on
  `payment_code`. **Deliberately a real table, not the option-array store** the confirmed
  Submissions Manager list uses — this one is written at real public-webhook volume, exactly
  the same "option array is for a small curated list, a dbDelta table is for volume" reasoning
  `Culture_Ticket_Payment`'s own docblock gives for `wp_culture_tickets`.
- **Three-way fee routing in `handle_submission_initiate()`** (`POST
  /culture/v1/literary/submission/initiate`, public): (1) **The Moveee Flash**
  (`SECTIONS['flash']['fee'] === 0`) → `add_submission()` fires immediately, `fee_status =
  'n_a'`, no payment step at all. (2) **A waiver code** → `redeem_waiver()` validates it (see
  below), then the same immediate `add_submission()` with `fee_status = 'waived'`.
  (3) **Otherwise** → a pending row is inserted into the new payments table and a real
  Paystack (`Culture_Paystack::charge_initiate()`) or Stripe
  (`Culture_Stripe::payment_session()`) charge is initiated — same `NGN → Paystack, else →
  Stripe` routing `Culture_Ticket_Payment::handle_initiate()` already uses, same
  reference-prefix-then-metadata pattern (`LIT-{payment_code}` here, vs. `TKT-{ticket_code}`
  there) so the two payment flows can share one Paystack account/webhook secret without
  colliding.
- **New REST routes** (all public, `__return_true`, `rest_api_init` — first time this class
  registers REST routes; `init()` gained `add_action('rest_api_init', ...)` alongside its
  existing `admin_post_*` hooks): `POST literary/submission/initiate`, `GET
  literary/submission/status` (poll by `payment_code` — used by the Stripe success-redirect
  path below), `GET literary/submission/callback` (Paystack's browser redirect back),
  `POST literary/submission/webhook/paystack`, `POST literary/submission/webhook/stripe`.
  Webhook signature verification (`x-paystack-signature` HMAC-SHA512, Stripe's `t=/v1=`
  HMAC-SHA256 scheme) is copied verbatim from `Culture_Ticket_Payment` — same secrets
  (`culture_paystack_secret_key`, `culture_stripe_webhook_secret`), no new WP Admin fields
  needed.
- **`confirm_payment($payment_code, $reference, $gateway)`** — idempotent (checked via
  `status === 'confirmed'`, same pattern as `Culture_Ticket_Payment::confirm_ticket()`),
  called from both the Paystack browser callback and either gateway's webhook (whichever
  fires first wins; the other is a no-op). On first confirmation it calls `add_submission()`
  with `fee_status = 'paid'`, stores the resulting submission id back on the payment row, and
  sends the new `literary_received` email (below).
- **Stripe's async confirmation gap, handled the same way the shop checkout flow already
  does**: Stripe's `success_url` lands the browser back on `/literary/submit/form?
  submission_pending={code}&session_id=...` *before* the webhook may have fired, so the page
  polls `GET /api/literary/submission/status` every 3s (cap 40 attempts, ~2 minutes — same
  numbers `CheckoutScreen.tsx`'s order-confirmation poll already uses) until the payment row
  flips to `confirmed`. Paystack's flow doesn't need this — its own browser callback
  (`handle_paystack_callback()`) verifies the transaction and calls `confirm_payment()`
  synchronously before redirecting, landing straight on `?submission_confirmed={code}`.

### Waiver codes — admin-issued, single-use, 100/quarter (per explicit user decision)

Per the second AskUserQuestion answer collected for this feature: a writer who can't afford
the $3 fee still emails to ask (the guidelines page's FAQ already said this), but an editor now
issues a real single-use code from WP Admin rather than trusting a self-serve checkbox.

- **Storage**: `culture_literary_waiver_codes` wp_options row (array of `{code, quarter, used,
  used_by, created_at}`) — same small-array-option pattern as everything else in this class,
  not a table, since codes are admin-generated in small batches, not written by a webhook.
- **`current_quarter()`** — `{Y}-Q{1-4}` derived from the current month (`ceil(month/3)`).
  A code is only redeemable in the quarter it was issued for — `redeem_waiver()` rejects a
  stale code from a prior quarter with `waiver_expired`, distinct from `waiver_used`
  (already redeemed) and `waiver_invalid` (doesn't exist).
- **`generate_waiver_codes($count)`** enforces the 100-per-quarter cap by counting existing
  codes tagged with `current_quarter()` before generating more (caps the requested count down
  to whatever's left, or returns a `quota_reached` `WP_Error` if the quarter is already full)
  — codes are `WAIVE-{8 hex chars}`.
- **Admin UI**: a new "Submission Fee Waivers" panel appended to the bottom of the existing
  Submissions Manager page (`admin.php?page=culture-literary-submissions`) — current
  quarter's issued/remaining count, a "Generate Code(s)" form (capped to the remaining quota),
  and a table of this quarter's codes (code / Used-or-Available / used-by email / created) with
  a Delete link on unused codes only (`handle_waiver_delete()`'s filter explicitly refuses to
  remove an already-used code, so redemption history for a quarter can't be erased by
  accident).

### New editable email: "Literary Submission — Received"

A third template alongside the existing `literary_accepted`/`literary_rejected` pair (see the
superseded entry above for how those work) — **`literary_received`**, added to
`Culture_Email_Templates::templates()` and sent via the new
`Culture_Emails::send_literary_submission_received()` the moment a submission is actually
created (Flash: instantly; waived: instantly; paid: once `confirm_payment()` runs) — distinct
from the accept/reject emails, which still only fire later once an editor makes a decision.
Same merge-tag shape (`{writer_name}`, `{piece}`, `{section}`), same WP Admin → Culture
Community → Email Templates editing surface.

### Frontend (`apps/site` only)

- **`app/literary/submit/form/page.tsx`** (new, client component) — the real form: name/email/
  section/optional-title fields, a `contentEditable` rich-text box (a small Bold/Italic
  toolbar via `document.execCommand` — no editor library dependency, matching in spirit the
  admin's own `teeny`-toolbar `wp_editor()`) for the piece body, and (only shown for a
  fee-bearing section) an optional waiver-code field. A local `SECTIONS` map mirrors the PHP
  constant's `label`/`fee`/`paymentLabel` fields for display — **no shared source of truth
  across the PHP/TS boundary**, same caveat as every other duplicated constant in this
  codebase; keep both in sync if the fee/terms ever change.
  - Submitting calls `POST /api/literary/submission/initiate`; a `'confirmed'` response shows
    a plain "It's In" confirmation screen inline; a `'payment_required'` response does a full
    `window.location.href` redirect to the returned Paystack/Stripe hosted checkout page —
    same "normal browser tab, no in-app WebView" reasoning the shop checkout flow already
    documents for why this is the right pattern on web (vs. mobile, which does have a WebView).
  - On mount, reads `?submission_confirmed=`/`?submission_pending=`/`?submission_failed=`/
    `?submission_cancelled=` off the URL (the four outcomes the PHP redirect targets can land
    on) and branches into the matching state — including the Stripe polling loop described
    above.
- **New proxy routes**: `app/api/literary/submission/initiate/route.ts` and
  `.../status/route.ts` — thin passthroughs to the two public WP REST endpoints (no secret
  needed, same as `app/api/events/ticket/route.ts`'s equivalent proxy for
  `/culture/v1/ticket/initiate`).
- **`app/literary/submit/page.tsx`** (the guidelines page) — the "Send Us Your Work" section's
  mailto instructions were replaced with a "Start Your Submission →" card linking to
  `/literary/submit/form`; `literary@themoveee.com` is now framed purely as "questions or a
  waiver-code request," not a submission address. The manuscript-format FAQ/guidelines
  paragraph was rewritten to describe pasting into the online editor instead of file formats.
- **New CSS**: `.lit-form-*` classes appended to `apps/site/app/literary.css`, built on the
  section's existing `--lit-*` token palette (ivory/ink/oxblood/parchment/rule) — no new
  tokens, no dependency on `.lit-submit-*` beyond the page wrapper it already provides.

### Magic-code verification gate — closes The Moveee Flash's no-fee abuse gap (September 2026, follow-up)

Per explicit user follow-up ("How about the free submissions for The Moveee: Flash? … we need
to ensure only logged in users (perhaps via magic code) can submit"): every submission branch —
Flash's no-fee path, a waiver-code redemption, and the real Paystack/Stripe payment path alike —
now requires a verified email first. This is the same email/OTP "magic code" mechanism already
built for `/literary` and `/magazine` content gating (`Culture_Literary_Access`), reused as-is,
not a new auth system. It's what actually closes the Flash abuse gap: Flash has no payment
barrier at all, so verifying real ownership of an email address is the only gate it can have.

- **PHP**: `handle_submission_initiate()` now requires a `verified_token` param as its very
  first check, before any of the `writer_name`/`section`/fee-routing validation — calls
  `Culture_Literary_Access::verify_token($token)` (already built, previously unused from PHP;
  its own docblock flagged it as "kept … for any future server-side need," which this is) and
  returns 401 `not_verified` if it's missing or invalid/expired. **The verified token's own
  email is authoritative** — `writer_email` is derived from `$verified['email']`, not from a
  client-supplied param; the frontend no longer sends a `writer_email` field at all. This
  applies uniformly across all three fee branches (Flash, waiver, paid), so there's no longer a
  path to `add_submission()` that skips verification.
- **Next.js proxy** (`app/api/literary/submission/initiate/route.ts`): reads the existing
  `moveee_lit_token` httpOnly cookie server-side (`cookies()` from `next/headers`, same cookie
  `/api/literary/verify-code` already sets) and forwards it as `verified_token` — short-circuits
  with a 401 before ever reaching WordPress if the cookie is missing, so an unverified visitor
  gets a fast, clear failure rather than a round trip that WP would reject anyway.
- **New: `app/api/literary/verify-status/route.ts`** — lets the submission page skip the gate
  UI entirely when a valid `moveee_lit_token` cookie already exists (e.g. the visitor verified
  earlier in the same browser session unlocking a gated `/literary` or `/magazine` piece).
  Verifies locally via `verifyLiteraryToken()` (`lib/literary-access.ts`) — no round trip to
  WordPress needed, same as every other client-side literary-access check on this side.
- **Frontend gate UI** (`app/literary/submit/form/page.tsx`): a new `verifyStep` state
  (`checking` → `email` → `code` → `verified`) renders before the actual submission form at
  all — on mount it silently checks `verify-status`; if not already verified, it shows a plain
  email-then-code flow reusing the exact same two existing API routes
  (`/api/literary/request-code`, `/api/literary/verify-code`) that `/literary`'s and
  `/magazine`'s own gates already use. Only once `verifyStep === "verified"` does the real form
  render — the form's own "Your email" field is now a read-only display of the verified address
  (with a small "Verified" badge, `.lit-form-verified-badge`) rather than an editable input, and
  the submit payload no longer includes an email field at all (the server derives it from the
  cookie).
- **New CSS**: `.lit-form-verified-badge` and `.lit-form-linklike` (a plain-button "Use a
  different email" link inside the code step) appended to `apps/site/app/literary.css`'s
  existing `.lit-form-*` block — same `--lit-*` token palette, no new tokens.
- Verified via `php -l` on the edited PHP file and a brace/paren-balance check on all three
  *(Not verified live this pass — needs the plugin redeployed before it's live in production.)*

**Route renamed to `/literary/submit/form` (September 2026, follow-up)** — the submission form
originally shipped at `/literary/submit/new`; moved (`git mv`) to `/literary/submit/form` per
explicit user request. Every reference was updated in the same pass: the two in-page `Link`s
(the guidelines page's "Start Your Submission" card, and the form's own "Try again" link on
payment failure), the PHP payment success/cancel redirect URLs and Paystack callback base URL in
`handle_submission_initiate()`/`init_stripe_payment()`/`init_paystack_payment()`, and the
doc-comments in `literary.css`/`verify-status/route.ts`. No functional/logic changes — purely a
path rename, same pattern as the `/shop` → `/lifestyle` rename elsewhere in this file.

### Deliberately out of scope for this pass

- **No mobile submission flow** — The Moveee Literary isn't surfaced on `apps/mobile` at all
  (per the section's own original scope note), so this form is web-only, same as every other
  Literary page.
- **No file-upload fallback** — a writer who genuinely can't paste plain-formatted text (a
  complex layout, embedded images) has no upload path; they'd need to email
  `literary@themoveee.com` and have an editor manually log the submission via the existing
  admin "Log a New Submission" form, which still exists and still accepts pasted content the
  same way.
- **No currency selection UI** — the form always requests `USD`, routing every real charge to
  Stripe; the PHP side's `NGN → Paystack` branch exists (mirroring the ticket flow) but is
  currently unreachable from this form since nothing sends `currency: "NGN"`. If Naira pricing
  is ever wanted for Nigerian writers, add a currency toggle to the form — the backend routing
  is already there.
- Verified via `php -l` on all five touched/new PHP files and a brace/paren-balance check on
  *(Not verified live this pass — needs the plugin redeployed before it's live in production.)*

## Literary "Browse by Section" + Submissions cover — colourful illustrated covers, no more abbreviations (September 2026)

An earlier "shelf illustration" pass (see "Brand-guide rebuild, then a full Granta-inspired
rebuild" above) landed a `LiteraryGenreArt.tsx` component but never actually removed the
3-letter abbreviation caption (`FIC`/`POE`/`ESS`/…) rendered on top of it, and used a single
monochrome oxblood/ivory/gold palette for every genre — from a live screenshot this read as an
unillustrated flat gradient with cryptic text. Fixed:

- **`LiteraryGenreArt.tsx` now uses a distinct colour palette per section** (deep burgundy for
  Fiction, violet for Poetry, teal for Essays, amber for Conversations, blue/gold for
  Translation, plum for Notes) instead of one shared oxblood tone, and every icon gained real
  colour-fill accents (a red wax bookmark ribbon, a teal inkwell, a gold nib, etc.) rather than
  single-tone ivory line art only — genuinely "illustrated," not just a decorative line icon on
  a dark box.
- **The abbreviation caption is gone entirely** — `LiteraryShelfItem` dropped its `sub` field,
  `LiteraryShelf.tsx` no longer renders a `<span>` inside the cover, and `.lit-shelf-cover`'s CSS
  was simplified to just `position: relative; overflow: hidden` (the illustration is the whole
  cover; the real label still renders below it via `.lit-shelf-name`, unchanged).
- **The Submissions spotlight cover** (`.lit-plug-cover`) also got a real illustration — a
  `slug="submissions"` variant (an open envelope, a rising letter, a gold wax seal) — instead of
  a plain oxblood gradient; the "Submissions / Open" text now overlays it via a new
  `.lit-plug-cover-text` wrapper (`position: relative; z-index: 1`) on top of an absolutely
  positioned `.lit-plug-cover-art`.
- This pass also merged in `LITERARY_HOMEPAGE_CUTOFF` (a separate, unrelated fix that had landed
  on `main` in the meantime — filters the homepage's own pools to pieces published on/after a
  fixed date, see its own code comment in `app/literary/page.tsx`) — no conflict in intent, just
  two branches touching the same file.
- *(Not verified live this pass.)*

**`LITERARY_HOMEPAGE_CUTOFF` extended to every `/literary` listing, not just the homepage, and
moved into `wp.ts` (September 2026, follow-up).** Per explicit request, the fixed
"nothing published before this date shows in a listing" cutoff — previously local to
`app/literary/page.tsx` and applied only to the homepage's hero/Latest/In Translation pools —
now also applies to a genre archive's main grid (`/literary/{genre}`) and a single piece's
"More In {genre}"/"Also Like" grids (`app/literary/[slug]/page.tsx`). Still nothing gets
unpublished or hidden from a direct link, search, or the sitemap — this only ever trims what a
`getLiteraryPieces()` **listing** surfaces, on any page under this vertical. Extracted into a
single shared export in `packages/shared/lib/wp.ts` — `LITERARY_CUTOFF` (renamed from
`LITERARY_HOMEPAGE_CUTOFF`, since it's no longer homepage-only) plus a `filterLiteraryCutoff()`
helper — so both files call the same constant instead of each keeping their own copy. **If this
cutoff ever needs to move or be removed, `LITERARY_CUTOFF` in `wp.ts` is the one place to
change it** — don't reintroduce a page-local copy.

## The Moveee Commons (`/commons`, added September 2026)

A public-affairs/research vertical at `apps/site/app/commons/*` — opinions, reports, research
and news on politics, environment, academia and the systems that govern us. Built the same
way The Moveee Literary was: mockup first (an Artifact design canvas, approved before any code
was written — a "public journal" register, deliberately distinct from Literary's Granta-esque
restraint and Lifestyle's retail energy), then wired to real content. Same "reuse the existing
`post` type, no new CPT" pattern as Literary — see that section above for the underlying
mechanics this one mirrors (dual-purpose `[slug]` route, standalone masthead/footer replacing
the sitewide Header/Footer, its own font/palette system).

**Design brief, for anyone touching this vertical's copy or layout again**: text-first by
default, never structurally dependent on a featured image — some of the publications this
section covers simply don't supply one. The hero and every card grid render a plain
kicker/title/dek/byline block; a photo is an optional upgrade layered on top when present,
never a placeholder standing in for a missing one (`CommonsPieceCard.tsx` only renders an
`<img>` when `featuredImage.node.sourceUrl` actually exists — no gradient fallback, unlike
`LiteraryPieceCard.tsx`'s `.piece-img--placeholder`). New institutional palette — deep green
(`--comm-green: #2f4b3c`) + brass (`--comm-brass: #a6813f`) — and its own type system
(Newsreader serif for reading type, IBM Plex Sans for UI, IBM Plex Mono for kickers/bylines/
data labels), none of it shared with Literary's oxblood/Bodoni-Cormorant-EB-Garamond system or
Lifestyle's ochre/Bricolage Grotesque.

**Two independent, unioned membership rules — this is the core of what was actually asked to
be wired up**, both live in `packages/shared/lib/wp.ts`:
1. **Category** — every post carrying the `"commons"` category (`COMMONS_CATEGORY_SLUG` —
   assumed slug, WordPress's default auto-slug for a "Commons" category title; fix the
   constant if the real slug in WP Admin ends up different). Checked via
   `isCommonsCategoryPost(post)`.
2. **Author** — every post whose real `post_author` is Basit Jamiu, WP `user_id` 15, username
   `basit` (`COMMONS_AUTHOR_ID = 15`), regardless of category — **including a piece where the
   page shows a Guest Byline attributing it to someone else.** Guest Byline is a purely
   display-time override (see "Byline Contributor role + Guest Byline field" above);
   `post_author` never changes, so checking the real author's `databaseId` via
   `isCommonsByAuthor(post)` already covers every guest-bylined piece Basit submits, with zero
   extra plumbing needed for that case specifically.

`isCommonsPost(post)` is the OR of both — "does this piece belong in the Commons feed at all."
`getCommonsPieces(first)` fetches the actual union: the category half via GraphQL
(`GET_STORIES` with `categoryName: "commons"`, same where-arg every other section already
uses), the author half via a new REST helper (`getStoriesByAuthorId()` — WPGraphQL's
`posts(where:)` has no confirmed `authorIn`/`author` filter in this schema, so this hits WP
core REST's native `?author=<id>` instead, same reasoning `getStoriesByCountrySlugs()` already
established for country filtering). Deduped by `databaseId` (category-sourced copy wins on a
collision, since it's the richer GraphQL shape), sorted newest-first. Never throws — either
half failing just means that half contributes nothing (`Promise.allSettled`).

**Every piece that qualifies for the Commons feed gets a canonical `/commons/{slug}` URL —
widened September 2026, per explicit request** (this superseded an earlier, narrower rule where
only category members got a Commons URL and an author-only piece stayed at `/magazine/{slug}`;
that split meant two different article templates depending on which rule matched, which read as
inconsistent once live). `commonsPieceHref(post)` now returns `/commons/{slug}` for anything
`isCommonsPost()` is true for — category or author, no distinction. `/magazine/[slug]/page.tsx`
redirects on the same union (`isCommonsPost`, not just `isCommonsCategoryPost`) right after its
existing Literary redirect, mirroring that redirect's "exactly one canonical URL per piece"
reasoning exactly — so every Basit Jamiu piece (guest-bylined or not) and every "commons"
category piece now renders under Commons chrome, never the magazine template. `sitemap.ts`
follows the identical union: `articleUrls` excludes every Commons-qualifying piece (they all get
`commonsPieceUrls` entries at `/commons/{slug}` instead, whether they qualified by category or
by author).

**Sections are a plain WP tag overlay on the category** — `COMMONS_SECTIONS` (Politics,
Environment, Academia, Reports, Opinion — tag slugs `politics`/`environment`/`academia`/
`reports`/`opinion`) is the exact same "optional overlay, not a requirement" relationship
`LITERARY_GENRES` has to `LITERARY_CATEGORY_SLUG` — a Commons piece with no section tag still
shows in the main `/commons` feed, it just won't appear on any single section's page until
tagged. `app/commons/[slug]/page.tsx` is the same dual-purpose route Literary's `[slug]` uses
(a `COMMONS_SECTIONS.slug` match renders a section archive; anything else falls through to a
real post lookup, gated on `isCommonsPost` — the full union, per the widened canonical-URL rule
above, not just category) — Next.js doesn't allow two sibling routes with different
dynamic-segment names at the same level, same constraint documented on Literary's own `[slug]`
route. Section archives and a piece's own "More in {section}" grid still only ever draw from
`getCommonsCategoryPieces()` (category-scoped, optionally narrowed by section tag) — an
author-only piece can now have a real `/commons/{slug}` page of its own, it just won't be
surfaced by a section archive unless it's also in the "commons" category and tagged (sections
are a category overlay, unrelated to how the page itself is reached).

**Deliberately no Pro-gating, no free-read metering** — unlike Literary/Magazine's magic-code
gate system, Commons content is fully public in this pass; nothing in `[slug]/page.tsx` calls
`cookies()`/`headers()`/`getServerSession()`, so it needed no `dynamic = "force-dynamic"`
override either (that override exists on Literary/Magazine specifically to sidestep the
`generateStaticParams` + Dynamic-API combination throwing `DYNAMIC_SERVER_USAGE` — Commons has
no Dynamic API call to trigger it). If Pro-gating is ever wanted here, extend `[slug]/page.tsx`
the same way `/magazine/[slug]` did, reusing `Culture_Literary_Access`'s existing magic-code
mechanism (`context: "commons"` would need its own entry in
`NEWSLETTER_LIST_BY_CONTEXT` server-side) rather than building a third parallel gate system.

**No real logo asset yet** — `CommonsLogo.tsx` is a CSS-drawn text lockup ("The" italic +
"moveee." bold + "Commons" tracked mono caps in brass), the same "first pass before a real
logo is supplied" precedent `LiteraryLogo.tsx` itself used before its real PNG existed. Swap
for an `<img>` once a real asset is approved, following that component's own history for the
pattern.

**"Data & Reports" band deliberately has no fabricated chart** — the original Artifact mockup
showed an illustrative CSS bar chart explicitly labeled as such; the real homepage
(`app/commons/page.tsx`) replaces it with a real teaser pulled from
`getCommonsCategoryPieces("reports", 3)` (title + byline of actual Reports-tagged pieces)
rather than rendering invented numbers as if they were real data — consistent with this
codebase's standing "never fabricate" rule (see e.g. the Discover facet-count precedent
elsewhere in this file). `.comm-bar-chart`/`.comm-bar` CSS is kept in `commons.css`, unused,
per this file's usual "kept in case needed again" convention, for if a real reporting dataset
is ever wired up to visualize.

**Discoverability**: linked from the Site A header's menu overlay (`Header.tsx`, between "The
Moveee Literary" and "The Moveee Lifestyle"), the shared `Footer.tsx`'s Explore column, and
`CommonsFooter.tsx`'s own Sections/The Commons columns.

**Not built in this pass, deliberately out of scope**: any submissions/pitch intake flow for
non-staff contributors (Literary's own submissions system was a separate, later addition —
revisit the same way if Commons ever needs one), any Pro/Patron gating (see above), and
cleaning up the assumed `"commons"` category slug if WP Admin's real slug differs — check that
first if the feed ever comes back empty despite content existing in WP Admin under a category
that reads "Commons".

*(Not verified live this pass.)*

**Commons-qualifying posts excluded from every `/magazine` and homepage listing (September
2026, follow-up).** Per explicit request — a Commons post's single-page URL already redirected
away from `/magazine/{slug}` (see "Route every Commons-qualifying post to /commons" above), but
it could still surface inside `/magazine`'s own listings as a card linking to that now-redirecting
URL, which reads as a bug even though the click itself worked. Every place a story pool is built
now filters out `isCommonsPost(p)` (the same category-or-author union already used for the
single-page redirect) before rendering:
- `getMagazineSections()` (`wp.ts`) — feeds the site root `/`'s Front Page/Edit/Opinions/Lane/
  Free Critics sections. This is the one function both `/` and (historically) `/magazine` shared,
  so fixing it here is the single highest-leverage change.
- `MagazineArchiveWrapper.tsx` — every filtered view (category/tag/series/industry/country
  archives all assign into one `stories` variable, filtered once after the branch that populates
  it) and the Hub's own "Browse by Section" tile list (`allFetchedCats` now drops the `"commons"`
  category slug outright, so it's not a dead-end tile that resolves to an empty archive).
- `/magazine/[slug]/page.tsx` — the "Keep reading"/related-stories grid at the bottom of an
  article.
- `fetchHomepageData.ts` — the site root's separate hero/`coverStory` pipeline (independent of
  `getMagazineSections()`): the "Featured"-tag pool (so a Commons piece tagged Featured can never
  become the homepage hero), the edition-scoped and general story pools, and the Interviews pool.
- **Deliberately left alone**: `generateStaticParams()` in `/magazine/[slug]/page.tsx` (still
  pre-generates a Commons post's `/magazine/{slug}` static path — harmless, since visiting it
  just hits the existing redirect to `/commons/{slug}`, not a rendered page) and `sitemap.ts`
  (already excludes category-based Commons pieces from `articleUrls`, per the routing commit
  referenced above — no further change needed there).
- *(Not verified live this pass.)*

## Moveee Magazine content gate — swapped to the same magic-code system as /literary (September 2026)

`/magazine/[slug]` articles used to gate member-only/patron-only content with `ArticleContentGate`/
`ContentGate` (`packages/shared/components/`) — a client-only soft gate (full content shipped in the
RSC payload, hidden via `useSession()`) offering a "Join free" / "Sign in" wall. Per explicit
request, this was replaced with The Moveee Literary's real email/OTP magic-code mechanism — reused
as-is, not duplicated: same PHP class (`Culture_Literary_Access`), same signed HMAC token, same
`moveee_lit_token` cookie, same `/api/literary/request-code` and `/api/literary/verify-code` routes.
**Verifying once unlocks gated content on both `/literary` and `/magazine`** — the token only ever
encodes an email + access level, nothing section-specific, so there was no reason to mint a second,
parallel token system.

- **The only thing that differs by caller**: which newsletter list a "free" (non-Pro) verifier joins.
  `Culture_Literary_Access::NEWSLETTER_LIST_BY_CONTEXT` maps `'literary' => 'literary-club'` and
  `'magazine' => 'culture-drop'` (per explicit decision — Magazine content already belongs to Culture
  Drop editorially). `verify_code()` takes an optional `$context` param (default `'literary'`);
  `handle_literary_verify_code()` in `class-culture-rest-api.php` validates it against that map's
  keys before passing it through. The Next.js `/api/literary/verify-code/route.ts` forwards an
  optional `context: "magazine"` body field the same way — no new REST namespace, no new PHP class.
- **New: `apps/site/components/MagazinePieceGate.tsx`** — a Magazine-branded rebuild of
  `LiteraryPieceGate.tsx`'s email → OTP flow, simplified to two modes (`"member"` | `"patron"`,
  matching `AccessLevel`'s `member-only`/`patron-only`) and always blocking (no free-read metering —
  see below), styled onto the existing `.ar-gate` card family in `editorial.css` (new `.ar-gate-form`/
  `.ar-gate-input`/`.ar-gate-error`/`.ar-gate-resend` rules alongside it) rather than `literary.css`'s
  `.lit-email-gate`, since `literary.css` isn't loaded on `/magazine` routes.
- **New: `apps/site/app/api/magazine/remainder/route.ts`** — the same shape as
  `/api/literary/remainder`, generalized: no `isLiteraryPost()` check (any `post` works), and no
  metering branch, since Magazine's gate is decision **b)** below.
- **Deliberate decisions made explicitly, not inferred** (asked directly, since getting any of these
  wrong changes who can read what):
  a) **Verifying a magic code alone fully satisfies `member-only`** — it does not create a real
     WordPress account or session, it just proves the email is real. This intentionally loosens
     "member-only" from "has a free account" to "gave a verified email," matching how Literary's own
     free tier already works. `patron-only` still requires the verified email to belong to an
     existing Pro (`patron`) account, or a real Pro session — magic-code verification never grants
     Pro on its own.
  b) **No free-read metering** — unlike Literary's public pieces (a few free reads per rolling
     window before the gate appears), a gated Magazine article always shows the gate immediately,
     matching the site's existing hard-wall behavior. `MagazinePieceGate` has no "Skip for now" /
     non-blocking mode at all.
  c) **`export const dynamic = "force-dynamic"` on the whole route**, not just the gated path — this
     page also has `generateStaticParams()` (top 100 recent posts), the exact same combination that
     threw `DYNAMIC_SERVER_USAGE` on `/literary/[slug]` for any slug outside its own pre-generated
     list (see that fix's own CLAUDE.md entry above) the moment `cookies()`/`headers()`/
     `getServerSession()` are used. This was a known, explicit tradeoff, not an oversight — every
     article (gated or not) now renders fresh per request instead of via the previous `revalidate =
     600` ISR, a real latency/compute cost accepted for correctness on a first ship. The lighter
     alternative (truncate identically for everyone in the cached HTML, verify client-side after
     load) was considered and explicitly not chosen — revisit if this page's compute cost becomes a
     real problem.
- **Real server-side truncation, not a client-hidden gate** — `sanitizeHtml(processedContent)` is
  truncated to 30% via `truncateHtmlByPercent()` (`lib/literary-access.ts` — despite the filename,
  nothing in it is actually Literary-specific) before it ever reaches the client for a non-authorized
  visitor; the withheld remainder is fetched only after verification, via the new remainder route,
  and injected in place inside another `.prose-content` div (preserving the width-tier grid system —
  `.ar-wrap > .prose-content { display: contents }`, see the "width-tier rail" section above — since
  the injected HTML still needs `alignwide`/`wp-block-gallery`/etc. to size correctly). Crawlers
  always get the full, untruncated piece (`isCrawlerUserAgent()`, same helper Literary uses) so this
  change doesn't regress SEO on gated articles the way real truncation otherwise would.
- **Everything after the gate — Shop the Edit, the Culture Drop `JoinSection`, the "This piece is
  from {Issue}" card, comments, and Finish Reading — stays hidden until authorized**, matching
  `ArticleContentGate`'s old behavior (all of it used to live inside `fullContent`, only rendered
  when `canView` was true).
- **Scope: `/magazine` only.** `ArticleContentGate`/`ContentGate` are untouched and still used
  exactly as before on `/directory/[slug]` (both `apps/site` and `apps/connect`) and the newsletter
  single-issue reader (`/newsletter/[slug]`, `IssueReaderClient.tsx`) — those were never in scope for
  this change and still show the original sign-in/sign-up wall.
- *(Not verified live this pass — needs the plugin redeployed before it's live in production.)*

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

## Optimole lazy-load breaks CMS images on every non-browser consumer (fixed August 2026)

**The single most important thing to know about images in this project: WordPress runs
Optimole's `the_content` filter before any consumer sees a post body, and Optimole's
lazy-load rewrites every in-body image into a placeholder whose real URL only lives in a
`data-*` attribute.** Optimole's own JavaScript is what swaps it into `src` — and that script
is enqueued by WordPress, so it **never runs** on the headless Next.js frontend, in email, or
in the React Native app. Any consumer that isn't a WordPress-rendered page gets placeholders.

This has now bitten twice, in two unrelated places, with the same root cause:

1. **Newsletter email** (fixed earlier) — `Culture_Newsletter_Queue::render_content()`
   suspends every Optimole/Smush/lazy-load `the_content` callback by keyword
   (`suspend_image_filters()`/`restore_image_filters()`) before running the filter, then
   restores them. See that method's own docblock.
2. **Magazine article bodies** (fixed August 2026) — user-reported as *"not all the photos
   show, only a few will show and the rest will just white out."* WPGraphQL's `Post.content`
   applies `the_content`, so the frontend received:
   ```html
   <img src="data:image/svg+xml;base64,…" data-opt-src="https://….i.optimole.com/…">
   <noscript><img src="https://….i.optimole.com/…"></noscript>
   ```
   `sanitizeHtml()` then made it strictly worse: `data-opt-src` isn't in `ALLOWED_ATTR` so the
   real URL was **deleted**, and the `data:` placeholder was **also** dropped by the existing
   `javascript:`/`data:`/`vbscript:` guard on `src`. Net result — `<img width="1024"
   height="683" alt="…">` with no `src` at all, painting a **blank box at the reserved
   dimensions**. That is the "white out". Only images Optimole *skips* still worked (it
   excludes the first N above-the-fold images from lazy loading), which is exactly why *some*
   images on a post rendered and the rest didn't — the symptom looks random but isn't.

**The fix lives in `packages/shared/lib/sanitize.ts`** — a new exported `unlazyImages()` that
promotes `data-opt-src`/`data-src`/`data-lazy-src`/`data-original` into `src` (and
`data-opt-srcset`/`data-srcset` into `srcset`), called from **inside `sanitizeHtml()`** rather
than at each call site, so no content surface can miss it — every place that renders CMS HTML
already funnels through that one function. It must run **before** attribute filtering, since
the real URL is in an attribute the allowlist drops. It also strips the plugin's `<noscript>`
fallback copies, but **only when it actually promoted something** — `sanitizeHtml()` removes
unknown *tags* while keeping their children, so a `<noscript><img></noscript>` would otherwise
unwrap into a duplicate image next to the repaired one.

**Why this was fixed on the frontend rather than by suspending Optimole in PHP** (the
newsletter's approach): the promoted URL is still the Optimole CDN one, so images stay
optimised and resized. Suspending the filter would serve unoptimised originals straight from
`cms.themoveee.com` — losing the entire point of Optimole. **Don't "consolidate" these two
fixes onto the PHP approach**; email genuinely needs the suspension (no CDN-vs-origin
tradeoff matters there and the markup must be inert), the web genuinely wants the promotion.

**Also fixed in the same pass**: `srcset`/`sizes` were never in `ALLOWED_ATTR`, so even
non-lazy CMS images had their responsive candidates stripped and served the full-size original
to every viewport. `srcset` gets its own scheme check rather than reusing the `src`/`href` one
— a candidate list is comma-separated, so a `javascript:` can sit anywhere in the value, not
just at the start.

3. **The mobile app** (fixed August 2026, same pass) — `useMagazine.ts` reads
   `content.rendered` from WP REST, which also applies `the_content`, so mobile received the
   identical placeholders and had **no** lazy-load handling anywhere in `apps/mobile/src`.
   It fails differently from web, though: mobile never calls `sanitizeHtml`, so `src` keeps
   the `data:image/svg+xml;base64,…` placeholder — and React Native's `<Image>` can't render
   an SVG data URI at all, so the image is simply missing rather than a sized blank box.
   Three surfaces were affected: `ArticleScreen.tsx`, `PulseDetailSheet.tsx`,
   `PulseDetailScreen.tsx`.

   Fixed with `apps/mobile/src/utils/unlazyImages.ts` — a **verbatim port** of the web
   function (`apps/mobile` can't import `packages/shared`, RN vs DOM, same as
   feed-recommendations/interest-mappings; **keep the two in sync**). The logic is pure regex
   with no DOM dependency, so it ports cleanly. **One deliberate divergence**: the mobile copy
   refuses to promote a `javascript:`/`vbscript:`/`data:` URL out of a data attribute, because
   web has `sanitizeHtml`'s scheme check downstream to catch it and mobile has no sanitizer in
   the pipeline at all. Every other case is byte-identical between the two (verified by
   diffing their outputs).

   Applied via a new `apps/mobile/src/components/ui/HtmlContent.tsx` — a thin wrapper over
   `RenderHtml` that un-lazies `html` and passes every other prop through. **Import that,
   never `react-native-render-html` directly** (it's the mobile equivalent of the web fix
   living inside `sanitizeHtml()`: one funnel, so a new HTML surface can't reintroduce the
   bug). `RenderHtml` now has exactly one importer in the whole app.

**If images ever "disappear" on a new surface again, check this first** before debugging the
CMS, the CDN, or the fetch layer: log the raw `post.content` and look for `data-opt-src`. And
if you add a new consumer of WP content that isn't a browser page (a feed exporter, an AMP
view, a PDF renderer), assume it has this bug until proven otherwise.

---

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

User-reported: browser-tab/SERP titles across the site read "weird," e.g. `/magazine/africa`
showed **"Magazine — Africa Edition · Moveee Magazine"** — the word "Magazine" appearing twice
in one title. A full sweep of every `title:`/`description:` field in `apps/site/app/**/page.tsx`
(~55 files) turned up two separate, unrelated bugs stacked on top of each other:

1. **`"The Moveee"` — a phrase that appears nowhere in the brand table above — was hardcoded
   into dozens of page titles/descriptions** (`"Contact | The Moveee"`, `"Article · The Moveee"`,
   `"Quote by ${author} — The Moveee"`, etc.), including the **per-article fallback title
   resolver** in `app/magazine/[slug]/page.tsx` (`resolveAioseoTitle()`'s `#site_title` token and
   the no-SEO-title fallback `` `${post.title} · The Moveee` ``) — meaning most individual
   magazine articles rendered this exact bug, not just the handful of static pages initially
   spotted. Fixed by dropping "The" everywhere and, per each page's own content, using either
   bare **"Moveee"** (platform/cross-surface pages: games, quotes, directory, events, journeys,
   services, legal/utility pages, the `/uk`/`/us`/`/africa` **root-`/` edition variants** at
   `app/[edition]/page.tsx` — this route is the home-page family, not `/magazine/*`, and mirrors
   `app/page.tsx`'s own siteName, which is deliberately bare "Moveee" per the brand-architecture
   section above) or **"Moveee Magazine"** (actual editorial/shop content: `/magazine/*` incl.
   the single-article resolver, `/newsletter/*`, `/shop/*`, `/visuals/*`, `/makers/*`, author
   archive — chosen because each of those sections' own root page already set
   `openGraph.siteName: "Moveee Magazine"` explicitly, so the fix makes every page in that
   section agree with its own section's siteName rather than inventing a third convention).
   Also fixed two invented, undocumented sub-brand qualifiers in the same sweep: `"Moveee
   Happenings"` (events pages) and `"Moveee Visuals"` (visuals article page) both collapsed to
   the plain brand name per their section's rule above, `app/[edition]/page.tsx`'s three
   EDITION_META titles (`"The British Moveee — Culture in Britain"`, `"The Moveee America —
   ..."`, `"The Moveee Africa — ..."`) were rewritten to mirror the root homepage's own
   `"Moveee — Culture. Discover and Engage."` pattern (`"Moveee — Culture in Britain"` etc.),
   and `shop/edit/page.tsx`'s `"The Moveee Edit — Curated Shop"` title/H1 and its two "The Moveee
   Edit →" link labels in `ShopArchiveWrapper.tsx` were shortened to **"The Edit"** (no
   documented "Moveee Edit" sub-brand exists — this was the same bug, not an intentional name).
   **Deliberately left alone**: `"The Moveee"` occurrences inside actual body copy/UI eyebrows
   (`register`/`login`/`reset-password`'s `"The Moveee — Culture Community"` eyebrow labels) and
   inside `terms`/`privacy`'s legal defined-term usage (`Moveee Media Ltd ("The Moveee", "we",
   "us")`) — both are UI/legal-content decisions distinct from SEO metadata and out of scope for
   this pass; only `title`/`description` fields (the two visible in a search result or browser
   tab) were touched.
2. **Redundant doubled words on the magazine/newsletter root + edition pages** — the actual bug
   the user flagged. `/magazine`, `/magazine/{africa,uk,us}`, and `/newsletter/{africa,uk,us}`
   all prefixed a generic `"Magazine —"`/`"Newsletters —"` label onto a title that *already*
   ends in the brand suffix, which itself contains the word "Magazine"/"Newsletters" — e.g.
   "Magazine — Africa Edition · Moveee **Magazine**". Fixed by dropping the redundant generic
   prefix: `/magazine/africa` is now `"Africa Edition | Moveee Magazine"` (same pattern for
   `/uk`, `/us`, and the three `/newsletter/*` editions → `"{Edition} Edition | Moveee
   Magazine"`). The root `/magazine` page had no edition-specific words to lean on, so it was
   changed to use the documented Moveee Magazine tagline instead: `"Moveee Magazine — Best in
   Culture"` (was `"Magazine — Moveee Magazine"`).
3. **Suffix separator standardized to `" | "`** wherever a bug fix touched a line — the site had
   `"|"`, `"·"`, and `"—"` all used interchangeably as the final title/brand-suffix joiner across
   different pages, which is part of what read as "weird" alongside the doubled words. Titles
   that were already correct (no "The Moveee" bug, no doubled word) were left as-is even where
   they still use `·`/`—` internally — this pass fixed genuine bugs, not a full site-wide
   separator relint, to keep the change reviewable.

**If you add a new page under `apps/site`**: default the title/description brand suffix to
**`"Moveee Magazine"`** per the brand table's "always called Moveee Magazine in user-facing
copy" rule — reach for bare `"Moveee"` only for pages that are clearly platform/cross-surface
(games, journeys, quotes, events, directory, legal/utility, or anything mirroring the root `/`
homepage), matching whatever `openGraph.siteName` the page/its section root already declares.
Never write `"The Moveee"` — that string is not the brand name.

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

**Artifact Design canvas mockups live in their own subfolder, not flat alongside the single-file
ones** (added 2026-09-27, first instance: `mockups/mobile/moveee-home-log-first/`). These are a
different artifact from every other file in `mockups/` — a multi-file canvas project (one
`*.dc.html` per board plus a `canvas.json` board index), **not** a standalone page. Each board
loads `./support.js` and uses `<sc-if>`/`<sc-for>` and a `class Component extends DCLogic` block,
all supplied by the Artifact type's runtime rather than by the folder, so opening one directly in
a browser renders a blank page — that's expected, not a broken file. Give each such project its
own subfolder with a short `README.md` saying which board is which and that it needs the runtime;
don't flatten the boards in among the single-file mockups, where a future session would waste time
trying to open one. Editing one means editing the files and republishing the canvas to its
existing Artifact URL (`Artifact` tool, `action: publish` with the same `url`) — publishing without
that URL creates a second, disconnected canvas.

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

### `MagazineArchiveWrapper`'s `edition` prop — scope (August 2026)

`/` renders the real homepage directly (edition detection — `moveee-edition` cookie →
`x-vercel-ip-country` header → `editionFromCountry()` — lives in `apps/site/app/page.tsx` itself).
`MagazineArchiveWrapper` still accepts an `edition` prop for its own callers (`/magazine/uk` etc.).
The `/` → `/uk`/`/us`/`/africa` geo-redirect in `proxy.ts` is still disabled (tied to Play Store
gating, unrelated).

`MagazineArchiveWrapper`'s `edition` prop only affects the **default, unfiltered view's main story
pool** (hero + "More This Week" row + Featured Stories band) — when set to `uk`/`us`/`africa`, that
pool is assembled via `getMainPool()`'s edition-scoped-posts-plus-universal-filler fetch (identical
pattern to `fetchHomepageData.ts`'s `country`-taxonomy edition scoping — see "Homepage queries" /
"Edition story-scoping migrated from Tags to the `country` taxonomy" above for the taxonomy
background). The pinned sections (Culture News/News category, Opinions/Viewpoints, The Lane series,
The Free Critics series) and every filtered view (`?category=`/`?series=`/etc.) stay global/unscoped
— matches `fetchHomepageData.ts`'s own scope exactly (it only edition-scopes `stories`/`coverStory`,
nothing else). `/magazine`, `/magazine/uk`, `/magazine/us`, `/magazine/africa` don't pass `edition`
and are unaffected — this is additive, opt-in per caller, not a change to how `/magazine` itself
renders.

### Site A header nav — Shop/Newsletter/Events added (August 2026)

`apps/site/components/Header.tsx`'s desktop nav (`.compact-nav`) and mobile menu previously
only linked **Feed**, **Discover** (both cross-domain to Connect), and **Editorials**
(`/magazine`) — leaving `/shop` and `/newsletter` (both real Site A sections) completely
unreachable from the header despite the header already showing shopping-cart UI with nowhere
for it to lead. Added, in both the desktop nav and mobile menu: **Events** (cross-domain
`${CONNECT_URL}/events`, same pattern as Feed/Discover), **Shop** (`Link href="/shop"`), and
**Newsletter** (`Link href="/newsletter"`) — nav order is now Feed → Discover → Events →
Editorials → Shop → Newsletter. Journeys/Makers/Visuals were deliberately left off the nav —
they read as sub-sections of Editorial/Shop rather than primary destinations.

**Ticker breakpoint bumped 1100px → 1280px** (`apps/site/app/homepage.css`) as a consequence —
`.compact-ticker` is absolutely centered independent of nav width
(`position: absolute; left: 50%`), so the wider 6-item nav risked colliding with it at medium
desktop widths that used to be wide enough for the old 3-item nav. If the nav ever grows
again, re-check this breakpoint (and consider whether the ticker should just move out of the
centered-absolute pattern instead of chasing the breakpoint each time).

### Site A header logo updated (September 2026) — footer logo deliberately untouched

The user supplied an updated Moveee wordmark (a fuller lockup — "The" + bold "moveee." + a
"BEST IN CULTURE" tagline line, vs. the prior header logo's bare "moveee." wordmark with no
tagline) in two color variants. **New files**: `apps/site/public/logo-black.png` (dark
wordmark, for light/solid header states) and `apps/site/public/logo-white.png` (light
wordmark, for the header's transparent-over-dark state) — both cropped tight to their alpha
bounding box (~552×183px, down from the source files' 667×283px, which had dead transparent
margin on all sides) so `.toolbar-logo-img`'s `height: 40px; width: auto` sizing in
`header.css` doesn't leave extra blank space around the mark. Still a much more square-ish
aspect ratio than the old banner-shaped logos.

**Old `logo-dark.png`/`logo-light.png` were deliberately left alone, not overwritten** — per
explicit user instruction not to touch the footer logo. `packages/shared/components/
Footer.tsx` renders `logo-light.png` directly, and before this change `Header.tsx`'s
transparent-header state used that same file — overwriting it in place would have changed
the footer's logo too. Instead, three call sites were repointed to the two new filenames
(`Header.tsx`'s main toolbar image — `onDark ? "/logo-white.png" : "/logo-black.png"` — its
menu-overlay logo, always `/logo-black.png` since the overlay body is always light; and
`SearchOverlay.tsx`'s logo, same always-`/logo-black.png` reasoning) while `Footer.tsx` still
reads the old `/logo-light.png`, completely unchanged. **The old `logo-dark.png`/
`logo-light.png` files are now unused by the header** (still referenced by the footer only)
— left in `public/`, not deleted, per this file's usual "kept in case needed again"
convention.

**If a future logo update needs to touch the footer too**, either update `Footer.tsx`'s own
`/logo-light.png` reference directly (a real, deliberate footer-logo change) or point it at
`/logo-white.png` to unify on the new asset — don't assume the two are already in sync just
because they used to share a filename.

### Shop/Makers ("Lifestyle") logo updated (September 2026)

Same update, second asset — the "Lifestyle" wordmark used on every `/shop` and `/makers`
page (`Header.tsx`'s `isLifestylePage = isShopPage || isMakersPage` branch, the **only**
consumer of this asset in the codebase). New files: `apps/site/public/logo-lifestyle-black.png`
(light/solid header state) and `logo-lifestyle-white.png` (transparent-over-dark state) —
cropped to their alpha bounding box (~551×184px, same "no dead transparent margin" treatment
as the main header logo above) and repointed via `onDark ? "/logo-lifestyle-white.png" :
"/logo-lifestyle-black.png"`. The old `logo-lifestyle-dark.png`/`logo-lifestyle-light.png`
(428×97px) are now unused — left in `public/`, not deleted, same "kept in case needed again"
convention as the main header logo swap. No footer-logo conflict here (unlike the main header
logo) — the shared `Footer.tsx` doesn't reference either lifestyle file, so there was no
"leave X untouched" constraint to observe on this one.

*(Not verified live this pass.)*

*(Not verified live this pass.)*

### Site A floating header pill — reduced radius, full-width, bigger mobile logo (September 2026)

Three CSS-only tweaks to `apps/site/app/header.css`'s `.toolbar-shell`/`.toolbar-pill`, per
explicit user direction — the floating-pill behavior itself (transparent-over-dark, auto-hide
on scroll, solid blurred pill elsewhere) is unchanged, only its shape/sizing:

- **Less rounded**: `.toolbar-shell`'s `border-radius` went from `var(--radius-full)` (9999px,
  a true pill) to `var(--radius-2xl)` (20px) — per the canonical radius scale documented above.
- **Full section width, later reverted (September 2026)**: `.toolbar-shell`'s `width` cap
  originally went from `min(100%, 460px)` to `min(100%, 1328px)` — `1328px` is the site's
  established section column width (`.hpv2 .wrap` in `homepage-v2.css`), so the header spanned
  the same width as the page content below it instead of floating as a small centered capsule.
  **This was reverted the same month, per explicit user follow-up** ("i know i was the one who
  said i wanted the header to be as wide as the page body... but it is too big") — seeing it live
  on an inner page (a magazine article) made clear the full-width pill read as oversized, not as
  a floating pill anymore. `.toolbar-shell`'s `width` is now `min(100%, 620px)` — a standard
  floating-pill width, applied sitewide via the shared `Header.tsx`/`header.css` (i.e. everywhere
  except `/literary`, which already renders its own `LiteraryMasthead` instead of this header —
  see that section above). **If a future pass wants the header to span the full column width
  again, don't just restore `1328px` blindly — re-check with the user first, since this has now
  been tried and explicitly reversed once.** `/shop`/`/makers` ("lifestyle") pages were flagged
  by the user as an area that will eventually get their own dedicated header, similar to
  `/literary` — not built as of this entry, still rendering the shared header/pill for now.
- **Bigger mobile logo, same pill height**: `.toolbar-logo-img`'s mobile-breakpoint (`max-width:
  640px`) height went from `22px` to `28px` — the user flagged it as "too tiny." This didn't
  need any height-compensating padding change to hold the "don't increase header height" rule:
  `.toolbar-icon` is a fixed `32px` box at every breakpoint, and 28px is still shorter than that,
  so the pill's rendered height (still set by the icons + the unchanged `8px`/`8px` vertical
  padding) doesn't move. Horizontal `.toolbar-pill`/`.toolbar-icons` gaps and padding were
  tightened slightly (`gap: 8px→6px`, `padding: 8px 12px 8px 10px → 8px 10px 8px 8px`) to claw
  back the extra horizontal room the bigger logo takes, so all three icons (search/cart/menu)
  still fit down to a 320px-wide viewport — same reasoning the original 22px shrink documented.
  Desktop logo size/padding are untouched (the user's ask was mobile-specific).
- *(Not verified live this pass.)*

## Connect App build phases

| Phase | Status | Scope |
|-------|--------|-------|
| 1. Auth + Vendor | In progress | Login, register, forgot/reset password, vendor dashboard |
| 2. Member | Pending | Dashboard, wallet, notifications, settings, analytics |
| 3. Community | Pending | Feed, directory, events, games, quotes, pulse |

### Shop checkout — in-house Next.js flow, no more WordPress handoff (Site A, August 2026)

Checkout used to be `<a href="https://cms.themoveee.com/checkout">` in `CartDrawer.tsx` — a full
redirect off the Next.js frontend onto the WordPress-rendered WooCommerce checkout page. Replaced
with a real in-house flow on `apps/site`, reusing the exact same backend
(`culture-community/includes/payment/class-culture-shop-checkout.php`, `Culture_Shop_Checkout`)
already built and shipped for `apps/mobile`'s `CheckoutScreen.tsx` — quote totals (real WC
shipping zones) → pay (Paystack NGN / Stripe everything-else, hosted redirect) → webhook creates
the real `WC_Order` via `WC_Checkout::create_order()` (same hooks WCFM Marketplace needs for
vendor payout splitting — see that file's own docblock for why hand-rolling order creation would
silently break vendor payouts). This is not a new payment system, just a new *client* for one that
already existed.

**Why a new set of PHP routes was needed, not just calling the mobile ones directly**: the mobile
endpoints (`/mobile/checkout/*`) are gated by `Culture_Mobile_API::mobile_permission()`, which
requires a `Bearer` JWT-style token issued by the mobile login flow — the web app's NextAuth
session has no such token to present, only a session cookie. `Culture_Shop_Checkout` now registers
a second set of routes mirroring the mobile ones, gated the same way every other web mirror in
this codebase is (API key + explicit `user_id` param — see the Follow system / community RSVP web
mirrors in `class-culture-rest-api.php` for the precedent this follows):
```
POST culture/v1/shop/checkout/totals
POST culture/v1/shop/checkout/pay
GET  culture/v1/shop/checkout/order/{id}
GET  culture/v1/shop/checkout/order-by-reference/{reference}
```
Both the mobile (JWT) and web (API key) callbacks delegate into the same private `do_totals()` /
`do_pay()` / `do_get_order()` / `do_get_order_by_reference()` methods, which take an explicit
`int $user_id` rather than calling `get_current_user_id()` themselves — **one implementation, two
auth front doors**, same pattern as everywhere else this codebase mirrors a mobile endpoint for
web. If this checkout logic ever needs to change, change the `do_*` method — never patch the
mobile-only or web-only wrapper alone, or the two clients will drift.

**Next.js side** (`apps/site`):
- `app/api/checkout/totals/route.ts`, `.../pay/route.ts`, `.../order/[id]/route.ts`,
  `.../order-by-reference/[reference]/route.ts` — thin proxies, same
  `getServerSession(authOptions)` + `Authorization: Bearer ${CULTURE_API_SECRET}` + explicit
  `user_id: session.user.id` pattern as `app/api/shop/reviews/route.ts`'s `POST` handler.
- `app/shop/checkout/page.tsx` — 2-step client flow (Address → Review & Pay), mirrors
  `CheckoutScreen.tsx`'s structure. Step 2's "Pay" button does a full `window.location.href`
  redirect to the Paystack/Stripe hosted page (no in-app WebView the way mobile has one — this is
  a normal browser tab, so a hosted-page redirect is the natural web equivalent). Gated: no
  session → a login-gate card linking to `https://web.themoveee.com/login?callbackUrl=<back here>`
  (absolute callback URLs are already supported by `apps/connect/app/login/page.tsx`); empty cart
  → an empty-state card linking back to `/shop`.
- `app/shop/order-confirmation/page.tsx` — reads `?shop_ref=` (Stripe/Paystack land here after
  payment), polls `order-by-reference` every 3s (same ~2-minute/40-attempt cap as
  `CheckoutScreen.tsx`) since the real `WC_Order` is only created once the payment webhook fires,
  not at the moment the shopper returns from the hosted payment page.
- **`Culture_Shop_Checkout::init_stripe()`'s `cancel_url` was changed from `/shop/cart` to
  `/shop/checkout?checkout_cancelled=1`** — the former pointed at a page that was never built
  (there is no dedicated `/shop/cart` route on this site; the cart is the `CartDrawer` overlay
  only) and would have 404'd. `/shop/checkout` already exists and still has the shopper's items,
  so cancelling now lands them back on step 1 with a small inline notice rather than a dead link.
- **Per-item line prices in the order summary intentionally use the cart's own store-currency
  totals (`useCart()`'s `totals.currency_symbol`, always GBP — the WooCommerce Store API doesn't
  do FX conversion), not the checkout quote's `display.currency`.** The quote's subtotal/shipping/
  tax/total *are* correctly FX-converted (Nigeria-resident shoppers see NGN, per
  `resolve_shop_currency()` — see "Shop multi-currency" in the mobile section below), but if a
  Nigeria shopper's per-item rows tried to reuse that NGN symbol against the cart's raw GBP unit
  prices, the numbers would be GBP-magnitude with an NGN label — wrong. Don't merge these two
  currency sources if you touch this page again.
- **Auth note**: `apps/site` has no login/register pages of its own (see "Site architecture" above
  — those live on Site B) but it *does* run the same `SessionProvider`/NextAuth config as
  `apps/connect` (shared `.themoveee.com` cookie domain), confirmed by `app/api/shop/reviews/
  route.ts` and `app/api/user/interactions/route.ts` already calling `getServerSession()`
  successfully on this app. Checkout works the same way — no proxy/cross-domain session bridging
  needed, a Site B login just works here too.
- *(Not verified live this pass.)*

### "The Moveee Lifestyle" identity wired into the real `/shop` archive (September 2026)

A standalone brand-identity mockup ("The Moveee Lifestyle" — Bricolage Grotesque display type,
a centered oxblood-scrim hero, a "Browse" category dropdown beside the grid label, square
product images) was built and iterated as a Claude Artifact first, approved, then wired into
the real `apps/site/app/shop/ShopArchiveWrapper.tsx` — same route (`/shop`, plus its
`category`/`tag`/`brand` archive variants, all of which already funnel through this one
component), real WPGraphQL/WooCommerce data throughout, no mock content. This **supersedes the
archive-page section order described immediately below** (steps 0–4 of that list); the Editor's
Pick split-strip and the separate "Featured Products" companion grid are gone, folded into one
hero (from the current Editor's Pick) + the existing main grid. **Untouched by this pass**: the
Magazine bridge (`.sl-bridge`), the Moveee Pro member band (`.sl-member`), and the Origins
closing bridge (`.sl-origins`) — all three already matched this identity's brand tokens
(`--ochre`/`--gold`/`--paper`) and needed no restyling, so their `.sl-*` classes and JSX are
exactly as described below. The product **detail** page (`/shop/[slug]`) was deliberately left
out of scope for this pass — it still renders with Fraunces headings; only the archive page's
visual identity changed.

- **New files**: `apps/site/app/shop/layout.tsx` (loads Bricolage Grotesque via
  `next/font/google`, scoped to the whole `/shop` route tree as `--font-lfs-display` — same
  "nested layout, not the root one" pattern as `apps/site/app/literary/layout.tsx`, so the rest
  of Site A's font bundle is unaffected) and `apps/site/app/shop/shop-lifestyle.css` (new
  `lfs-*`-prefixed classes only — imported *after* `shop.css` in `ShopArchiveWrapper.tsx`, and
  deliberately additive: it never redefines an existing `.sl-*` selector wholesale, so nothing
  in `shop.css` needed renaming). One surgical exception lives directly in `shop.css`:
  `.sl-pcard-img`'s `aspect-ratio` changed `3/4` → `1/1` (every grid card is now square, the
  identity's signature look) and its radius bumped to `var(--radius-xl)`.
- **Ticker** — reuses the shared sitewide `.ticker-wrap`/`.ticker-track` (`globals.css`, the
  same component `/journeys` and `/events` already use), not a bespoke one — real copy: "Vetted
  Makers" (accent-colored via the shared `span.a` convention), "Moveee Pro saves {live
  discount}% storewide", "Earn Culture Credits on every order", and "New: {the newest fetched
  product's real name}".
- **Category nav** (`.lfs-nav`, new) — a "Browse" dropdown (hover/focus-within, pure CSS, no
  client component) listing the real fetched `categories`, sitting where the old horizontal
  category strip used to be conceptually; a `<details>`-based mobile equivalent opens the same
  list via tap, since `:hover` doesn't fire on touch — same disclosure-widget trick used
  elsewhere in this codebase for JS-free mobile menus. No "coming soon" states — every category
  returned by `GET_PRODUCT_CATEGORIES` is a live link.
- **Hero** (`.lfs-hero`, new) — centered copy over the current Editor's Pick's own real product
  photo (not a stock image), with the identity's oxblood radial-gradient scrim. Headline is
  static brand copy ("The Index of things worth *owning*."); the trust line reads "Secure
  Checkout by Stripe and Paystack. Moveee Pro members save {live discount}% storewide." — same
  wording locked in on the standalone mockup. "Shop the Index →" anchors to `#lfs-grid`, a new
  `id` added directly to `ShopProductGrid.tsx`'s `<section>`.
- **Email capture** (`.lfs-email`, new) — a real `<SubscribeForm list="culture-drop">`
  (`apps/site/components/SubscribeForm.tsx` — note `@/components/*` resolves to
  `packages/shared/components/*` first per this app's tsconfig paths, so this actually renders
  the `packages/shared` copy; both are functionally identical, same `/api/newsletter/subscribe`
  call), not a decorative `onsubmit="return false"` form. This section didn't exist on the
  archive page before this pass.
- **Maker Story** (`.lfs-maker`, new) — spotlights the current hero pick's own maker (real
  `vendorProfile`/`moveeeMeta.makerStory`, sanitized via `sanitizeHtml()`, falling back to
  `vendorProfile.bio` when no per-product story is set — same fallback chain already documented
  for the product detail page's own Maker Story section). **Deliberately not a bulk all-makers
  grid** — that pattern was intentionally removed sitewide (see "Shop by Category + Meet the
  Makers sections removed" above); this pass didn't reintroduce it, it built a single spotlight
  card instead. Added `moveeeMeta` to `ShopArchiveWrapper.tsx`'s extra-data merge (it was already
  being fetched by `GET_PRODUCTS_EXTRA`'s `PRODUCT_EXTRA_TYPE_FIELDS`, just never copied onto
  the merged product object before this pass).
- *(Not verified live this pass.)*

### The Moveee Lifestyle becomes a fully standalone mini-site — own header + footer, every `/shop/*` route (September 2026, follow-up)

**Corrects a scope gap in the pass above.** The prior pass only rebuilt the archive page's own
body content — it left the sitewide floating `Header.tsx` pill and the sitewide `Footer.tsx`
rendering on every `/shop` route, same as any other Site A page. The user explicitly rejected
this as "half" the implementation: the whole point of a from-scratch brand identity for the shop
is that `/shop` and everything under it should feel like its own distinct mini-website, with
**nothing** from the rest of the site's chrome — or the old (pre-identity) shop design — surviving
anywhere in the tree. This pass makes the identity's own masthead and footer the *only* header/
footer any `/shop/*` route renders, using the exact same "standalone mini-site" mechanism already
proven for The Moveee Literary (`LiteraryMasthead.tsx`/`LiteraryFooter.tsx`, `Header.tsx` returning
`null`, `ConditionalFooter.tsx` excluding the path) rather than inventing a new pattern:

- **`apps/site/components/Header.tsx`** — added `isShopPage = pathname === "/shop" ||
  pathname.startsWith("/shop/")` and changed the existing literary-only early return to
  `if (isLiteraryPage || isShopPage) return null;`. The dead `isLifestylePage`/`ShopSearchModal`
  branches that used to make the sitewide pill *look* shop-flavoured on `/shop` (before this pass,
  the sitewide header still rendered there, just re-skinned) were removed entirely — the sitewide
  header has no role on `/shop` at all anymore, so there's nothing left to re-skin.
  `isMakersPage` is untouched and still drives the sitewide header's own lifestyle-flavoured logo
  on `/makers` — that route is a *sibling* of `/shop`, not nested under it, so it's out of scope
  for this pass and still uses the shared sitewide chrome.
- **`apps/site/components/ConditionalFooter.tsx`** — added `isShopPath()` (same shape as
  `isLiteraryPath()`) to the exclusion condition, so the sitewide dark `Footer.tsx` never renders
  on any `/shop` route.
- **New: `apps/site/components/ShopHeader.tsx`** (client) — the identity's own masthead, rebuilt
  verbatim from the approved mockup's `.masthead`/`.mast-*` markup: the shared ticker
  (`.ticker-wrap`/`.ticker-track`, now living here instead of duplicated per-page — see below),
  the real Moveee Lifestyle logo (`/logo-lifestyle-black.png`), a "Categories" dropdown (desktop
  hover, mobile `<details>`) sourced from a new small client fetch, and search/account/bag icons —
  live cart count from `useCart()`, a session-aware account link (`useSession()`), and the existing
  `ShopSearchModal` wired to the search icon (moved here from `Header.tsx`, which no longer needs
  it since it never renders on `/shop`).
- **New: `apps/site/components/ShopFooter.tsx`** (client) — the identity's own footer, rebuilt
  verbatim from the mockup's `.foot`/`.foot-*` markup: brand blurb + logo, and three link columns
  (Shop / Makers / Account). Every link points at a real destination — the mockup's own "Gift
  Cards" and "Meet the Makers" items were dropped rather than kept as dead links, since neither has
  a real feature/page behind it (no gift-card system exists anywhere in the codebase; the bulk
  all-makers grid was deliberately removed sitewide, see "Shop by Category + Meet the Makers
  sections removed" above) — same "never fabricate" rule applied to the mockup's bottom-bar "Index
  last updated {date}" line, which was dropped since there's no real data source backing it.
- **New: `apps/site/app/api/shop/categories/route.ts`** — a small client-fetchable proxy (same
  "global chrome slot" pattern as the pre-existing `/api/header/featured-product`), returning both
  the real product categories (for the header's dropdown) and the live `proDiscountPercent` (for
  the header's ticker's "Moveee Pro saves X% storewide" line) in one response, cached 5 minutes.
- **New: `apps/site/app/shop/shop-chrome.css`** — the masthead/footer CSS, remapped from the
  mockup's own token names onto the real site's tokens (`--bg`→`--paper`, `--text`→`--ink`,
  `--text-mute`→`--mute`, `--line`→`--rule`, `--line-strong`→`--rule-strong` with a `--rule`
  fallback, `--accent`→`--ochre`, `--surface`→`--paper-deep`, `--surface-raised`→`--paper`,
  `--shadow-plate`→`--shadow-card`) — same remapping convention already used by
  `shop-lifestyle.css`'s own header comment.
- **`apps/site/app/shop/layout.tsx`** now mounts `<ShopHeader />` before `{children}` and
  `<ShopFooter />` after, inside the existing Bricolage Grotesque font-variable wrapper — this is
  the **only** place either component is mounted, so it's automatically inherited by every nested
  route under `/shop` (archive, `category`/`tag`/`brand` archives, `[slug]` product detail,
  `checkout`, `edit`, `shipping`, `order-confirmation`) with zero per-page changes, the same way
  Next.js layouts always propagate.
- **Ticker de-duplicated, not left doubled** — `ShopArchiveWrapper.tsx` previously rendered its own
  inline `.ticker-wrap` (with live "New: {product name}" copy) *in addition to* the header's now
  owning the ticker sitewide; that inline copy and the now-meaningless `.sl-header-spacer` clearance
  block (a hack that only made sense when the sitewide header was a fixed/floating pill reserving
  no layout space of its own — `ShopHeader` renders in normal document flow, so there's no gap to
  fill) were both removed from `ShopArchiveWrapper.tsx`. The "New: {product}" line was not carried
  over to `ShopHeader`'s ticker — the header is one shared component across every `/shop/*` route
  (including pages with no "current product" concept, like the archive or checkout), so its ticker
  copy is deliberately generic ("Vetted Makers · Moveee Pro saves X% storewide · Earn Culture
  Credits on every order · Free returns within 14 days" — the 14-day figure matches the real,
  canonical policy on `/shop/shipping`, not the unrelated stale "30 days" copy that still exists on
  the product detail page's own buy box, `ProductSelectors.tsx` — that pre-existing mismatch is out
  of scope for this pass).
- **`.sp-product-hero`'s `padding-top: calc(var(--header-clear, 96px) + 50px)` removed**
  (`shop.css`, product detail page) — same "no more fixed/floating header to clear" reasoning as
  the archive page's spacer above; left in place it would have added a large dead gap under the
  new normal-flow `ShopHeader`.
- **A handful of the archive page's own Fraunces headings switched to the identity's Bricolage
  Grotesque display face**, per "nothing from the old lifestyle page should survive": `.sl-head-inner
  h1` (dead — no longer rendered by `ShopArchiveWrapper.tsx`, kept in case needed again, per this
  file's usual convention), `.sl-bridge-title`, `.sl-member-left h3`, and `.sl-origins-content h3`
  — each moved to `font-family: var(--font-lfs-display, var(--font-serif))` at `font-weight: 800`
  (Bricolage's own bold weight, matching `.lfs-hero-title`'s existing treatment), with their `em`
  children switched from `font-style: italic` to `font-style: normal; font-weight: 800; color:
  var(--ochre)` — Bricolage Grotesque is a sans display face with no distinct italic cut in this
  identity's usage (mirrors `.lfs-hero-title em`'s own `font-style: normal` precedent), so italicizing
  it would have looked like a font-fallback bug, not a deliberate emphasis style.
- **Follow-up, same pass — the product detail page (`/shop/[slug]`) got the same treatment too**,
  closing the gap flagged above. Every genuine heading/title/large-display-number on that page
  moved from `'Fraunces', serif` to `var(--font-lfs-display, var(--font-serif))` at `font-weight:
  700`/`800` (matching each element's prior weight tier), with any `em` emphasis child switched
  from italic to `font-style: normal` + bold + `var(--ochre)`, same convention as the archive-page
  fixes above: `.sp-product-name` (the h1 product title — also tightened its size clamp from
  `42–64px` to `38–56px` and dropped its unusually light `font-weight: 400` base, since Bricolage
  at 400 reads thin compared to the rest of the identity's bold display type), `.sp-reviews-head
  h2` ("Reviews"), `.sp-rs-avg` (the big review-average number — same "large display number"
  treatment as `.sl-member-stat-num`), `.sp-review-form h3` ("Write a review"), `.sp-acc-header
  .title` (the accordion tab labels — Description/Specifications/Materials & Care/etc.),
  `.sp-seen-title` ("As Seen In" bridge), `.sp-story-header h2` / `.sp-process-header h2` /
  `.sp-more-from-header h2` (the Origins Journal/How It's Made/More From This Category section
  heads — these three had no `font-family` override before this pass at all, so they were already
  rendering in the sitewide sans body font rather than the old Fraunces branding; upgraded to the
  identity's display face anyway for consistency with every other section heading on the page,
  not because they were "old design" specifically), `.sp-process-step h4` (the 01–04 step titles),
  `.sp-vendor-stat .num`, and `.mini-product .name` (the "More From This Category" card titles —
  the product-detail-page mirror of the archive grid's own `.sl-pcard-name` fix below).
- **The two most-repeated pieces of shop typography were also fixed, sitewide across every
  `/shop/*` route** — not page-specific, since both classes render everywhere their section
  appears: `.sl-pcard-name` (every product card's title, on the archive, every category/tag/brand
  archive, and the "More From This Category" grid's sibling class `.mini-product .name` above) and
  `.sl-member-stat-num`/`.sl-empty-text` (the Moveee Pro band's stat number and the empty-grid
  "No products found" message, both rendered wherever `ShopArchiveWrapper`/`ShopProductGrid` are).
  These were arguably the single most-visible remaining trace of the old design, since a product
  card's title is the one piece of typography a visitor sees dozens of times per page.
- **Deliberately left as editorial serif body copy, not converted** — these are genuine reading
  text or decorative letterforms, not brand headings, so switching them to the sans display face
  would have made the page read worse, not more "on-identity": `.sp-product-lede` (the short-
  description standfirst under the product title), `.sp-story-text p` and its drop-cap
  `::first-letter` + the maker-story pull-quote (`blockquote`), `.sp-selector-label .value` (the
  small inline "Blue"/"Large" selected-variant value next to a swatch), and `.sp-review-avatar-
  fallback` (a single decorative initial letter in an avatar circle). Also left alone: `.sl-pick-
  title`/`.sl-featured-name`/`.sl-cat-title`/`.sl-cat-name`/`.sl-makers-label`/`.sl-mcard-name` —
  confirmed dead (zero JSX references anywhere in `apps/site/app/shop`) leftover CSS from sections
  already removed in earlier passes (Editor's Pick split-strip, Shop by Category, Meet the Makers
  — see those entries above), so there was nothing live left to convert.
- **Follow-up, same pass — checkout, order confirmation, and The Edit swept too** (user asked to
  "verify the checkout and edit pages too"). Both `/shop/checkout` and `/shop/edit` (plus
  `/shop/order-confirmation`, which shares `checkout.css`) were confirmed to already inherit
  `ShopHeader`/`ShopFooter` correctly (neither imports `Header`/`Footer` directly, and neither has
  any leftover `--header-clear`-style padding — both only ever existed on the sitewide floating
  pill, which these pages never used even before this identity build). Typography gaps found and
  fixed: `checkout.css`'s `.chk-title` and `.chk-confirm-title` were still `Georgia, serif` at
  `font-weight: 300` — converted to `var(--font-lfs-display, var(--font-serif))` at `700`, matching
  every other page-level heading's weight tier in this identity. `shop.css`'s `.edit-*` classes (The
  Edit — `/shop/edit`, editorial-story-linked products) had four genuine headings still on
  `var(--font-serif)`: `.edit-headline` and `.edit-browse-title` (bumped to `800`, matching the
  archive/product-page hero-title tier) and `.edit-empty h2`/`.edit-feature-title` (kept at `700`).
  No `em` emphasis elements exist anywhere in either page's JSX, so the italic→normal+bold+ochre
  conversion didn't apply here. Everything else in both files (mono eyebrows, sans body/meta text,
  the `.chk-step`/`.edit-eyebrow` labels) was already sans/mono, not serif, and needed no change.
- **This closes the "nothing from the old lifestyle page should survive" ask for typography** —
  every genuinely-visible heading across the whole `/shop/*` tree (archive, category/tag/brand
  archives, the product detail page, checkout, order confirmation, and The Edit) now uses the
  identity's Bricolage Grotesque display face; only intentional editorial-serif body copy and
  confirmed-dead CSS remain on the old face.
- *(Not verified live this pass.)*

### Shop hero + product grid — current state (September 2026)

`.lfs-hero` (`ShopArchiveWrapper.tsx`) always renders a fixed brand photo,
`apps/site/public/shop-hero.jpg` — **never** a per-product image; swap the file at that path if it
ever needs replacing, don't reintroduce a per-pick background. Current sizing: `aspect-ratio
16/9`, `min-height 320px`, `max-height 460px` (mobile `max-height 420px`, portrait `4/5` ratio
unchanged). Its scrim (`.lfs-hero-scrim`) uses a radial spotlight plus **two** linear gradients,
top- and bottom-anchored — a single bottom-anchored gradient alone left a washed-out white gap at
the top edge. **General lesson: a radial-plus-single-direction-linear scrim can leave a real gap
at whichever edge the linear gradient doesn't cover — check every edge, not just the one nearest
the text.**

The product grid (`ShopProductGrid.tsx`/`.sl-product-grid`/`.sl-pcard*` in `shop.css`) is a flat
trade-catalog layout matching `moveee-lifestyle-identity.html`'s `.prod-grid` exactly: one
bordered/radiused outer container, cards butted flush with only a 1px hairline between them (no
individual card borders/shadows), `grid-template-columns: repeat(auto-fit, minmax(230px, 1fr))`
(no breakpoint overrides needed), a circular "+" quick-add button bottom-right of the photo at
`opacity: .85` by default (not hover-only — always faintly visible, full opacity + scale on
hover), and a price row showing the strikethrough original price first, then "Pro ₦X" second when
a Pro price applies. The middle meta line always renders something (`★ rating (count)` or a "New
listing" fallback) so cards with no reviews don't lose their vertical rhythm.

**Lesson worth keeping**: "implement exactly as in the mockup" means literally — don't leave
old-design values in place under a plausible-sounding excuse, and check the session scratchpad for
an already-supplied asset before substituting a stock/placeholder one.

### `/makers` brought onto the Moveee Lifestyle standalone chrome (September 2026)

Per explicit user request ("the new design convention for Moveee Lifestyle needs to extend to
Maker pages — from header to footer especially"), `/makers` (archive + `[slug]` profile) now
shares the exact same standalone mini-site chrome as `/lifestyle` — new **`apps/site/app/makers/
layout.tsx`** mounts `ShopHeader`/`ShopFooter` (same components, same `shop-chrome.css` import,
same Bricolage Grotesque `--font-lfs-display` font load) around `{children}`, identical shape to
`app/lifestyle/layout.tsx`/`app/literary/layout.tsx`. Previously `/makers` was only a *sibling* of
the Lifestyle identity, still rendering the sitewide floating pill (with a special-cased logo
swap) and the sitewide dark `Footer.tsx` — that's gone now.

- **`Header.tsx`**: `isMakersPage` was added to the early-return (`if (isLiteraryPage ||
  isLifestylePage || isMakersPage) return null;`) alongside the existing Literary/Lifestyle
  checks — the sitewide pill no longer renders on `/makers` at all. This made the old
  `isMakersPage ? ... : ...` ternaries for the toolbar logo (swap to the Lifestyle wordmark,
  link to `/makers` instead of `/`) unreachable dead code, so they were simplified back to the
  plain always-`/`/`Moveee` case rather than left as unreachable conditionals.
- **`ConditionalFooter.tsx`**: `isLifestylePath()` now also matches `/makers`/`/makers/*`, so the
  sitewide `Footer.tsx` is excluded there the same way it already was for `/lifestyle`.
- **`makers.css`**: every `--header-clear` top-padding rule was removed (`.makers-header`,
  `.maker-hero`, and the `768px` mobile override of `.makers-header`) — same "no more fixed/
  floating header to clear" reasoning as every other page that gained a standalone header in this
  file. (`.maker-breadcrumb`'s own `--header-clear` padding was left alone — confirmed dead CSS,
  that element isn't rendered in the JSX at all, per its own pre-existing comment.)
- **Typography** — every genuine heading/title/stat-number on both pages moved from
  `var(--font-serif)` (Fraunces) to `var(--font-lfs-display, var(--font-serif))` (Bricolage
  Grotesque), matching the exact treatment the shop archive/product pages already got: weight
  bumped to `700`/`800` per element's size tier, and every `em` emphasis child switched from
  `font-style: italic` to `font-style: normal; font-weight: 800; color: var(--ochre)` (Bricolage
  has no distinct italic cut in this identity's usage, same reasoning documented for the shop
  pages) — `.makers-title`, `.maker-card-name`, `.maker-hero-name`, `.maker-stat-num`,
  `.maker-products-title`, `.maker-editorial-title`, `.maker-editorial-post-title`, and
  `.maker-not-found h1`.
- **Product-count removal, same ask as the Lifestyle grid change directly above** — the maker
  profile page had two of its own "total number of products" displays that weren't caught by
  that pass since they're a different file: the stats row's `{productCount} Products` tile
  (removed entirely, leaving "Maker since"/rating) and the products section header's
  `{productCount} pieces` span (removed). The now-unused `productCount` const was deleted too.
  `.maker-stat-num`/`.maker-products-count`'s CSS is untouched/still real (the former still
  renders "Maker since"/rating, the latter is now dead, kept per convention).

*(Not verified live this pass.)*

**Production build failure, fixed same month — duplicate `next/font/google` call broke the
Vercel build.** A real production deploy failed at `next build` (Turbopack) with `Module not
found: Can't resolve '@vercel/turbopack-next/internal/font/google/font'` /
`next/font/google queries have exactly one entry`, traced to `app/makers/layout.tsx`. Root
cause: `app/lifestyle/layout.tsx` and `app/makers/layout.tsx` each called
`Bricolage_Grotesque({ subsets: ["latin"], weight: ["500","700","800"], variable:
"--font-lfs-display", display: "swap" })` — **byte-identical arguments, in two separate files**
— per the "Bricolage Grotesque is loaded again here ... since Next.js font loaders are scoped
per call site" reasoning this section originally gave for `/makers`. That reasoning was wrong:
Turbopack (Next.js 16) hashes a `next/font/google` call's config to name its generated internal
font asset, so two identical calls in different files collide on the same hash and only one of
them resolves at build time — the other fails exactly this way. **Fixed** by extracting the call
into a single shared module, `apps/site/lib/lifestyle-font.ts` (exports `bricolage`), imported by
both `app/lifestyle/layout.tsx` and `app/makers/layout.tsx` instead of each calling
`Bricolage_Grotesque(...)` itself. **If a third route ever needs this font, import it from
`lib/lifestyle-font.ts` — never add a third duplicate call site**, and more generally: never call
`next/font/google` with the same exact config in two different files in this codebase; factor it
into a shared module instead. Verified via a brace/paren-balance check on all three files (no
`node_modules` installed this session, so `next build`/`tsc` couldn't reproduce the Turbopack
error directly) and confirming the `@/lib/*` tsconfig alias resolves the new module correctly
(no colliding `packages/shared/lib/lifestyle-font.ts`). Re-check the next Vercel production
build actually goes green before considering this fully closed.

### Email-capture + Moveee Pro bands tightened (September 2026)

Mockup-first (Artifact, before/after comparison at real content/widths) — both bands sat far
taller than their content needed, per explicit user request. Implemented in
`ShopArchiveWrapper.tsx` + `shop-lifestyle.css` (`.lfs-email*`) + `shop.css` (`.sl-member*`):

- **Email band** (`.lfs-email-inner`) — vertical padding cut `56px`→`22px` (900px breakpoint
  `40px`→`20px`, 640px `40px`→`20px`); heading `clamp(24–32px)`→`clamp(17–20px)`; form input/button
  padding trimmed to match. Copy/layout unchanged, only sizing.
- **Moveee Pro band** (`.sl-member*`) — the floating "2,400 Members & growing" stat card
  (`.sl-member-right`/`.sl-member-stat*`) is **removed from the JSX**, its number folded straight
  into the eyebrow line instead via a new `.sl-member-stat-inline` span ("Moveee Pro · 2,400
  members and growing") — CSS for the old stat card is left in place, unused, per this file's
  usual "kept in case needed again" convention. `.sl-member-left` dropped its `flex: 0 0 60%` split
  (now `flex: 1 1 auto`, full width) since there's no right column left to share space with.
  `.sl-member`'s `min-height: 460px` was removed so the card sizes to its (now much shorter)
  content instead of a fixed floor. `.sl-member-wrap` padding `72px`→`40px` (900px `56px`→`28px`,
  640px `40px`→`24px`); `.sl-member-left` padding `64px`→`36px 44px`; heading `42px`→`26px`; body
  copy `16px`→`14px`; the perks grid went from a spacious 2×2 (`20px 40px` gap) to one tight row of
  4 (`repeat(4, 1fr)`, `8px 24px` gap, dropping to 2-up at 900px and 1-up at 640px, same as before);
  every title→sub→perks→CTA margin was roughly halved; CTA padding `14px 28px`→`10px 20px`.
- **Bonus fix, same pass**: `.sl-member-eyebrow` ("Moveee Pro") had **zero CSS anywhere in the
  codebase** — a bare, unstyled `<div>` inheriting the page's default dark ink text color onto a
  dark photo band, so it rendered at near-invisible contrast. Since this pass was already adding
  real content to that element (the folded-in member count), it got a real style too: mono
  uppercase label, `rgba(243,236,224,.65)`. **If a similar low-contrast/invisible-text report ever
  comes up on a dark band, grep for the class first** — an element with no matching CSS rule
  anywhere is exactly this bug, not a color-token mismatch.
- *(Not verified live this pass.)*

### Lifestyle product grid header — current state (September 2026)

`ShopProductGrid.tsx`'s grid header (`.sl-grid-header`) shows no divider and no product count
anywhere on the page — label is **"Recent"** by default (`isFiltered ? activeLabel : "Recent"`),
`ShopSearchModal.tsx`'s filter-panel footer button reads plain **"Show Results"** with no number.
`isFiltered`/`activeLabel`/`resultCount` props are still passed/computed but unused for display
(harmless — kept so the shared types don't need touching for no functional benefit). `.sl-grid`
top padding is `24px`/`16px` (mobile) — tightened so the grid shows within the hero's own
viewport height. `.sl-grid-label`/`.sl-grid-count` CSS is dead, kept per the usual convention.

### The Moveee Lifestyle route renamed from `/shop` to `/lifestyle` (September 2026)

Every page under `apps/site/app/shop/` was moved (`git mv`) to `apps/site/app/lifestyle/` — archive,
`[slug]` product detail, `category`/`tag`/`brand` archives, `checkout`, `edit`, `shipping`,
`order-confirmation`, `layout.tsx`, and the three CSS files (`shop.css`/`shop-chrome.css`/
`shop-lifestyle.css` — filenames themselves were **not** renamed, only their parent directory, so
every `import "./shop.css"`-style relative import inside the moved tree still resolves with zero
changes). Every internal `href="/shop"`/`` href={`/shop/${x}`} ``-style link across the codebase
(`ShopHeader.tsx`, `ShopFooter.tsx`, `Header.tsx`'s menu overlay, `ConditionalFooter.tsx`,
`CartDrawer.tsx`, `SearchOverlay.tsx`, `ShopSearchModal.tsx`, `ShopCarousel.tsx`/`ShopRail.tsx`,
`Hero.tsx`, the homepage, `/makers/[slug]`, `/magazine/[slug]`'s Shop-the-Edit strip, `/terms`,
and every page inside the moved tree itself) was updated to `/lifestyle`, along with
`sitemap.ts`'s two `/shop`/`/shop/${slug}` entries and `api/revalidate/route.ts`'s revalidation
path list. **`/api/shop/*` (the Next.js proxy API namespace — categories, reviews, etc.) was
deliberately left unchanged** — that's an internal fetch path, not a public page route, and
renaming it would have meant touching every `fetch("/api/shop/...")` call site for zero user-
facing benefit; same reasoning for WordPress's own `culture/v1/shop/checkout/*` and
`mobile/shop/products` REST namespaces (`app/api/checkout/*`, `app/api/mobile/shop/search`) —
those are WordPress-side API paths, unrelated to this Next.js page rename.

**Old `/shop/*` URLs 301-redirect to their `/lifestyle/*` equivalent** — `proxy.ts` gained a
dedicated block (`pathname === '/shop' || pathname.startsWith('/shop/')` →
`pathname.replace(/^\/shop/, '/lifestyle')`) placed **before** the existing `ROUTE_ALIASES` map,
since that map only ever matches a single whole path segment with no internal slashes (confirmed
by reading its `cleanPath.includes('/')` guard) and so could never have handled a nested URL like
`/shop/category/ceramics` on its own — only the bare `/shop` path. The pre-existing
`ROUTE_ALIASES['lifestyle'] = '/shop'` entry (a stale, backwards-looking alias that had been
sitting unused, redirecting the *not-yet-real* `/lifestyle` to `/shop`) was removed along with it.
`APP_ROUTES` now lists `'lifestyle'` instead of `'shop'`. **If a genuinely new page is ever added
back at `/shop` for some unrelated reason, this redirect will swallow it** — check `proxy.ts`
first if that ever comes up.

**SEO/branding — every title/description under this route dropped the "| Moveee Magazine"
suffix in favour of "The Moveee Lifestyle" as its own standalone brand**, mirroring how The
Moveee Literary handles its own section branding (`siteName: "Moveee Magazine"` kept only for
OG/schema.org attribution, never in the visible title) rather than the sitewide "always suffix
with Moveee Magazine" convention documented elsewhere in this file — this section is a standalone
mini-site with its own identity, not ordinary editorial/shop content:
- `/lifestyle` (root): title `"The Moveee Lifestyle"` (was `"Shop | Moveee Magazine"`).
- `/lifestyle/{slug}` (product): title `` `${product.name} | The Moveee Lifestyle` `` (was
  `` `${product.name} — Moveee Magazine Shop` ``); the Product JSON-LD's `brand`/`seller` fallback
  and `openGraph.siteName` were deliberately **left** as `"Moveee Magazine"` — those name the real
  owning organization for structured data, not the visible page title, same distinction Literary
  draws.
- `/lifestyle/category/{slug}`, `/lifestyle/tag/{slug}`, `/lifestyle/brand/{slug}`,
  `/lifestyle/edit`, `/lifestyle/shipping` — all switched from `"... | Shop | Moveee Magazine"`/
  `"... | Moveee Magazine"` to `"... | The Moveee Lifestyle"`.
- Visible UI copy updated to match: the sitewide header menu's nav link ("Shop" → "The Moveee
  Lifestyle", matching how "The Moveee Literary" is written in that same list), its "From the
  Shop"/"Visit the Shop" column labels, `ShopFooter.tsx`'s "Shop" link-column heading (→
  "Lifestyle"), and the product page's breadcrumb JSON-LD ("Shop" → "The Moveee Lifestyle").
  `isShopPage`/`isShopPath` identifiers in `Header.tsx`/`ConditionalFooter.tsx` were renamed to
  `isLifestylePage`/`isLifestylePath` for the same consistency reason, not because the old names
  were broken.
- Every doc-comment across the touched files that said "`app/shop/layout.tsx`"/"`/shop route`"/
  "`/shop path`"/etc. was updated to say `/lifestyle` — these were purely explanatory and had no
  functional effect, but a stale path in a comment is exactly the kind of thing that misleads the
  next person to touch this code.

**Deliberately left as literal "shop" everywhere else, not renamed**: the `shopFiltersBus.ts`/
`shopHelpers.ts`/`shopCountry.ts`/`ShopHeader.tsx`/`ShopFooter.tsx`/`ShopArchiveWrapper.tsx`/
`ShopSearchModal.tsx`/`ShopProductGrid.tsx`/`ShopFilterContext.tsx`/`ShopCarousel.tsx`/
`ShopRail.tsx` **filenames and component/export names** — only the public route path and visible
copy changed; renaming every internal identifier too would have been a much larger, purely
cosmetic diff for no functional or SEO benefit. The `/shop-hero.jpg` public asset path is
unrelated (a static image filename, not a route) and was never touched.

*(Not verified live this pass.)*

### Shop masthead — current nav/categories/bridge state (September 2026)

Settled after several iterations — this is the final state, don't re-derive from superseded
intermediate layouts if you see references to them in git history. `ShopHeader.tsx`'s
`.masthead-row` (max-width `1240px`, header-specific — the rest of `/shop` stays `1440px`):
`.mast-left` holds the logo + `.mast-cat-nav` (plain inline links, one per fetched category, no
dropdown/panel); `.mast-right` holds `.mast-nav` (destination links Edit/Magazine only — Shop and
Makers were dropped) + `.mast-icons`. **Real category filtering lives exclusively in
`ShopSearchModal`** — the header's old Categories dropdown and the archive page's own separate
"Browse ▾" bar (`.lfs-nav-wrap`) were both removed as duplicates of it; don't reintroduce either.
Superseded dropdown/`<details>` CSS (`.mast-cat`/`.mast-cat-btn`/`.mast-cat-panel`/`.mast-filter`,
`.lfs-nav*`/`.lfs-cat*`) is dead, left in place per the "kept in case needed again" convention.

Also current: the email-capture band (`.lfs-email`) is ochre-background with white text/pill, not
grey; the single-maker "Meet the Maker" spotlight section is removed entirely; the Magazine bridge
(`.sl-bridge`) shows one CTA ("Read The Edit →"), not two.

### Lifestyle Edit closing bridge — current state (September 2026)

The `.sl-origins` band (closing "The stories behind the objects" section) has no eyebrow label
above its heading (`.sl-origins-label` CSS is dead, kept per convention) and a shorter image —
`min-height` `320px` desktop (was `480px`), `200px`/`160px` at the `900px`/`640px` breakpoints.

### Shop footer — top padding (September 2026)

`ShopFooter.tsx` has top padding in **two places, additively** — `.lfs-foot` itself (`40px`, added
on top of) and the nested `.lfs-foot-inner` (`24px`/`20px`/`18px` across breakpoints). If the
footer's total top gap ever looks off, check both rules, not just one.

### Lifestyle Shop archive — filter architecture (still current)

`apps/site/app/shop/ShopArchiveWrapper.tsx`'s product grid uses a shared React Context
(`components/ShopFilterContext.tsx`, `ShopFilterProvider`/`useShopFilter()`) rather than one
combined component, since the mockup's filter control and product grid aren't adjacent in the
page (other sections sit between them). `ShopFilterContext` mirrors `apps/site/lib/
shopFiltersBus.ts` into local state (it doesn't own filter/sort/view state itself — see "Shop
search + filter moved into a dedicated header search modal" below) and exposes shared helpers
(`vendorName`, `parsePrice`, `formatGBP`, `isNew`, `isOutOfStock`, `averageRating`, `reviewCount`,
`PRICE_BANDS`). **`ShopProductGrid` must render inside `ShopFilterProvider`** — the trust
bar/head/hero/member-band/origins sections around it don't need filter state and sit outside it.

Facets: price bands, tag pills, Material pills (`product_material` taxonomy), Maker-Location
pills. Sort: Featured/Price/Newest/Most Loved (by review count). **Pro price (10% off) is computed
client-side from the `price` string, not fetched from `moveeeMeta.memberPrice`** — that field
lives in a deliberately separate GraphQL query from the shared `PRODUCT_FIELDS_FRAGMENT` so a
missing bridge-plugin field can't fail the whole shop grid query (same bridge-plugin-isolation
pattern used elsewhere in this file) — don't merge them.

### Shop search + filter moved into a dedicated header search modal (Site A, August 2026)

Per explicit user request: the grid/list view toggle was removed outright (not migrated
anywhere), the Trust Bar moved from mid-page (section 4, below the Hero Pick/Featured
Products) to section 0 — the very first thing on the page, above the Shop Head — and
switched from a white background to `var(--ink)` (black) with "Free Returns in 30 days"
dropped from its copy (now just "Vetted Makers · 4.8 average rating · Moveee Pro saves
{X}%"). The entire on-page search + filter bar (`ShopFilterBar.tsx` — search input,
Category/Price/Material/Maker-Location pills, In Stock Only, sort select, active-filter
chips) was deleted and rebuilt as `components/ShopSearchModal.tsx`, opened from the
**header** search icon (not a page-level control) whenever the visitor is on any
`/shop`-prefixed route — mirrors the existing generic `SearchOverlay.tsx` visual shell
(`.search-overlay`/`.search-panel`/`.search-input-row`, defined in `homepage.css`) but
with a shop-specific filter body instead of live cross-content search results.

**Why a bus, not props or the existing React Context alone**: `Header.tsx` (and
therefore `ShopSearchModal`, mounted from it) renders on every page as a sibling of
`<main>{children}</main>` in the root layout — it is structurally outside
`ShopFilterProvider`, which only wraps a few sections deep inside the `/shop` page tree.
Neither can reach the other via props or `useContext` alone. `apps/site/lib/
shopFiltersBus.ts` is a plain module-level pub/sub store (same shape as
`apps/connect`'s `discoverFiltersBus.ts`/`peopleFiltersBus.ts` — see those entries above
for the precedent this follows) bridging the two trees:
- `ShopFilterProvider` (`ShopFilterContext.tsx`) no longer owns filter/sort state as its
  own `useState`s — it mirrors `getShopFilters()`/`subscribeShopFilters()` into local
  state purely so `filtered` can be a memo, and pushes its derived facets (categories —
  now passed to the provider as a prop, `availableMaterials`, `availableLocations`,
  `priceBands`, `activeCategorySlug`, and `filtered.length` as `resultCount`) up via
  `setShopFilterMeta()` in a `useEffect`, clearing them (`clearShopFilterMeta()`) on
  unmount so the modal knows when it's no longer looking at a shop page. It also resets
  the bus's filters to defaults on mount, so a filter/search term picked on one shop page
  doesn't silently leak into the next one navigated to.
- `ShopSearchModal.tsx` reads `getShopFilterMeta()`/`getShopFilters()` and re-renders on
  every `subscribeShopFilters()` tick; every pill/button calls `setShopFilters({...})`
  directly (immediate-apply, same "chip applies without typing" pattern documented for
  `apps/connect`'s `SearchModal.tsx` structural filters above) — there is no "apply"
  step, the page's product grid updates live the moment a filter changes (though it's
  not visible until the modal closes, since the modal is a full-viewport overlay).
  Category is rendered as real `<Link>`s to `/shop` / `/shop/category/{slug}` (full
  navigation, same as the old `<select>`'s `window.location.href` — category was never
  part of the live-filtered `products` array, it's a different WP query per category)
  rather than a bus-driven filter. Price/Material/Location/Sort/In-Stock reuse the
  existing `.sl-fpill`/`.sl-fpill--active`/`.sl-fpill--filled`/`--unfilled`/`.sl-chip`/
  `.sl-filter-clear`/`.sl-sort-select` classes from the now-otherwise-dead sticky filter
  bar CSS (`shop.css`, still there, marked dead in its own header comment) as buttons
  instead of `<select>`s, styled via new `.shop-search-*` wrapper classes.
- `Header.tsx` gained `isShopPage = pathname === "/shop" || pathname.startsWith("/shop/")`
  and now renders `<ShopSearchModal>` instead of the generic `<SearchOverlay>` when true.
  **A future `/shop/*` page automatically gets the shop modal for free** (path-prefix
  check) — but it only shows facets/results if that page also renders
  `<ShopFilterProvider>` somewhere in its tree (product detail pages don't).

Current facet state: no Material filter (removed entirely — `productMaterials` data is still
fetched/used by the product detail page, just not filterable from the archive); Maker Location is
pills-only at every width; Category/Price/Sort are a native `<select>` on mobile, pills on
desktop, toggled by the same `max-width: 640px` breakpoint (no JS viewport detection).

### Shop by Category + Meet the Makers sections removed (Site A, August 2026)

`ShopArchiveWrapper.tsx`'s "Shop by Category" and "Meet the Makers" sections are gone entirely,
along with their only consumers (`GET_ALL_MAKERS`, the `wp-json/moveee/v1/vendors` REST fallback,
`FALLBACK_VENDORS`). `categories` itself is kept — still used by the filter's category dropdown.
`.sl-cat-*`/`.sl-makers-*` CSS left in place, unused, per convention.

### `/shop` grid has no `orderby` and a hard 24-item cap with no pagination (fixed August 2026)

Moved to `docs/claude-md-archive.md` (narrow, closed-out bug-fix pass; see that file for full detail if ever needed).

### Shop archive + product detail — full visual rebuild (Site A, August 2026)

Moved to `docs/claude-md-archive.md` (historical visual-rebuild / build-fix pass — superseded or no longer actionable; see that file for full detail if ever needed).

### Product editorial fields — rich text (Bold/Italic) for Care Instructions + Delivery Info (August 2026)

The product-creation "backend" for these fields is **not** the custom Next.js vendor dashboard
(`packages/shared/components/vendor/ProductForm.tsx`, used by `apps/connect/app/vendor/products/
{new,[id]}/page.tsx`) — that form only has name/price/sale_price/stock/description/short_description/
categories/tags/status and has never had Maker Story/Care Instructions/Delivery Info fields.
(There's also a stale, unreachable copy at `apps/site/components/vendor/ProductForm.tsx` — dead
code, since `apps/site` has no `/vendor` route at all anymore, per "Site architecture — split
complete" above; every `/vendor/*` path 308-redirects to Site B. Don't edit that copy.)

These three fields are actually an **ACF ("Moveee Product Details") field group** registered in
`moveee-graphql-bridge.php` (`acf/init` hook), shown as a metabox on the **WordPress Admin native
product edit screen** — `maker_story`, `care_instructions`, `delivery_info` postmeta, exposed via
GraphQL as `moveeeMeta.{makerStory,careInstructions,deliveryInfo}` and rendered on
`apps/site/app/shop/[slug]/page.tsx`'s accordion (Maker Story / Materials & Care / Delivery &
Returns tabs). User-reported: no way to add Bold/Italic to Materials & Care or Delivery & Returns
when editing a product in WP Admin.

Root cause: `maker_story` was already an ACF `wysiwyg` field (`toolbar: 'basic'` — the standard
WordPress/TinyMCE bold/italic/link/list toolbar), but `care_instructions` and `delivery_info`
were both plain ACF `textarea` fields — no formatting toolbar exists for a plain textarea, so
there was genuinely no way to bold or italicize anything in those two fields. Fixed by changing
both from `'type' => 'textarea'` to `'type' => 'wysiwyg', 'toolbar' => 'basic', 'media_upload' =>
0`, matching `maker_story`'s existing config exactly. ACF wysiwyg fields still save as a plain
HTML string in postmeta (same storage shape as textarea), so `get_post_meta()` on the PHP read
side needed no changes.

**Frontend read-side bug found and fixed in the same pass**: `deliveryInfo` and `makerStory`
already rendered via `dangerouslySetInnerHTML` + `sanitizeHtml()` (ready for HTML), but
`careInstructions` rendered as plain escaped text — `<p>{careInstructions}</p>` — so switching
its WP field to `wysiwyg` alone would have made literal `<strong>`/`<em>` tags print onscreen
instead of rendering as bold/italic. Fixed to match the other two:
`<div dangerouslySetInnerHTML={{ __html: sanitizeHtml(careInstructions) }} />`.

**Known gap, deliberately not touched in this pass**: `apps/mobile/src/screens/shop/
ProductDetailScreen.tsx`'s "Materials & Care" and "Delivery & Returns" accordion items are
hardcoded generic placeholder copy ("Details about materials and care instructions.", "Free
delivery on orders over £75...") — they were never wired to `care_instructions`/`delivery_info`
at all, on either platform's mobile fetch. That's a separate, pre-existing "wire up the real
field" gap unrelated to rich-text support, out of scope for this pass.

### Setting Featured Products — two distinct mechanisms (August 2026, docs-only)

User asked how to mark a product Featured; investigation turned up two unrelated features that
both use the word "featured," easy to conflate:

1. **Shop-wide "Editor's Pick"** (drives `/shop`'s hero + "More From The Edit" row, and boosts
   ranking in a product page's "More From This Category" — see "Editor's Pick curation" in the
   "Shop archive + product detail" section above) — WooCommerce's own **native** Featured flag.
   Set via WP Admin → Products → open a product → "Product data" box header → "Catalog
   visibility: Edit" link → check **"This is a featured product"** → Update. No custom code;
   `wc_get_product($id)->is_featured()` reads it directly.
2. **"Shop the Edit — Featured Products"** (`moveee-graphql-bridge.php`, §6) — a *different*,
   per-article mechanism: up to 6 WooCommerce products attached to one **magazine post** (not
   shop-wide), rendered as a "Shop the Edit" strip on that article. Set via a sidebar meta box
   titled **"Shop the Edit — Featured Products"** on the post's own WP Admin edit screen
   (multi-select, Ctrl/Cmd+click, up to 6). Backend: `_culture_featured_products` postmeta (JSON
   array of product IDs) on the `post`, exposed via GraphQL as `Post.featuredProducts`.

These are independent — marking a product Featured (1) doesn't add it to any article's Shop the
Edit list (2), and vice versa.

### Product page variation-attribute selectors made generic (August 2026)

User-reported gap, found while answering "does the product page properly display attributes?":
`ProductSelectors.tsx` only recognized **two hardcoded attribute names** for variation selection
— `extractAttr(variations, "color")` and `extractAttr(variations, "size")` (exact, case-
insensitive match). Any other WooCommerce variation attribute (Material, Finish, Scent, Pattern,
etc.) was silently invisible — no selector rendered for it at all, so a buyer had no way to pick
a value for it even though WooCommerce still requires one to identify a specific variation.

Fixed by replacing the two hardcoded calls with a generic `extractAttrGroups()` that walks every
variation's `attributes.nodes` once and returns **one group per distinct attribute name actually
present** (in first-seen order), each with its own list of distinct values. Selection state
changed from two `useState<number>` (`selectedColor`/`selectedSize`) to a single
`useState<Record<string, number>>` keyed by attribute name, so an arbitrary number of attribute
groups can each track their own selected index. Render logic loops `attrGroups` and picks a
swatch UI (`.sp-swatches`/`.sp-swatch`) only for a group literally named "color"/"colour";
everything else renders as pill chips (`.sp-sizes`/`.sp-size-btn` — reused as-is, since that
class's padding-based sizing already accommodates arbitrary-length values like "Extra Firm" or
"Lavender Fields", not just short size codes). No new CSS was needed.

**Bonus fix, same code block**: color swatches previously rendered as an empty bordered circle
with no actual color shown (`style={{ border: ... }}`, no `background`) — now sets
`background: val.toLowerCase()`, which works directly as a CSS `background` value for any
variation value that happens to be a standard CSS color keyword (Red, Blue, Black, Navy, etc.,
which is how most WooCommerce color attributes are named in practice). A non-keyword value (e.g.
"Rust", "Ochre") just silently keeps a transparent swatch — a graceful no-worse-than-before
fallback, not a new failure mode.

**Related, deeper gap found but *not* fixed in this pass (flagged, needs a decision)**:
`ProductSelectors.tsx`'s "Add to Cart" (`addItem(productId, quantity)`) never passes a variation
ID — `CartContext.tsx`'s `addItem` signature is `(productId: number, quantity?: number) =>
Promise<void>`, with no variation parameter at all, and `PRODUCT_FIELDS_FRAGMENT`'s
`VariableProduct.variations` doesn't even fetch a `databaseId`/`id` per variation node. This
means **selecting a Colour/Size/etc. swatch is currently purely cosmetic — it has no effect on
what actually gets added to the cart**, regardless of how many attribute groups render. Fixing
this properly requires: fetching variation IDs in the GraphQL fragment, matching the full set of
selected attribute values against a variation to resolve its ID, extending `CartContext.addItem`
to accept an optional variation ID, and threading it through both the desktop and mobile-sticky
Add to Cart buttons here. Out of scope for the "handle any attribute name generically" ask this
pass addressed — revisit if/when asked to make variation selection functionally correct.

### Maker Story falls back to the vendor's WCFM bio instead of repeating per product (August 2026)

User-reported UX gap, found while testing the rich-text fix above: the per-product `Maker
Story` ACF field (§"Product editorial fields" above) had no fallback to anything maker-specific
when left blank — it fell straight through to a generic hardcoded sentence ("{vendor} is a
vetted Moveee partner…"), even though **a real, maker-level bio already exists** —
`vendorProfile.bio` (WCFM vendor profile, entered once per maker account, not per product) —
and is already reused automatically elsewhere on the same page (the "About the Maker" accordion
tab, and the separate "Vendor Profile" section). The `sp-story`/"Origins Journal" section just
never consulted it, so a maker with the same story across their whole catalogue had no choice
but to paste the identical text into every single product's Maker Story field — exactly the
duplication the user flagged.

Fixed in `apps/site/app/shop/[slug]/page.tsx`'s Maker Story render: the fallback chain is now
per-product `makerStory` (rich HTML, rendered via `sanitizeHtml`) → vendor's own
`vendorDesc`/`vp.bio` (plain text, same as the "About the Maker" tab already renders it) →
the generic hardcoded sentence only if neither exists. **Net effect**: a maker only needs to
write their story once, on their WCFM vendor profile, and it now shows on every one of their
products automatically. The per-product ACF field becomes a genuine *override* — fill it in
only when one specific piece has its own story worth telling separately from the maker's usual
bio (a limited-run piece, a collaboration, etc.), not a mandatory per-product chore.

Checked mobile for the same gap: `apps/mobile/src/screens/shop/ProductDetailScreen.tsx` never
fetches or renders the per-product `makerStory` field at all — it only ever uses the
vendor-level `makerBio`, so mobile never had this duplication problem in the first place; no
mobile change needed.

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

Moved to `docs/claude-md-archive.md` (narrow, closed-out bug-fix pass; see that file for full detail if ever needed).

### `/magazine` archive page — full redesign (August 2026)

Mockup-first (Artifact), iterated through two rounds of explicit feedback before being built
for real — first "i dont like the design concept of these sections" (The Edit + Opinions,
no direction given, so a clarifying question was asked before revising), then two structural
asks mid-build ("remove this section" re: the masthead, "remove the category ticker") that
were folded directly into the real implementation before any of it was committed. Touches
`apps/site/app/magazine/MagazineArchiveWrapper.tsx`, `apps/site/components/
EditorialSection.tsx`, and `apps/site/app/magazine.css` — brings the whole page onto the
site-wide `--radius-xl`/`--radius-2xl`/`--shadow-card` card convention (see "Border-radius
convention" above), which this page predated entirely (flush 8px radii, no shadows, image
directly followed by unwrapped text with no card chrome).

- **Masthead removed entirely** — no more "Moveee Editorials" h1/eyebrow/desc block, per
  explicit user direction. `.mg-head` is now just the wrapping section for `.mg-nav`
  (category tabs + filter pills), not a big centered title block — `text-align: center` and
  the large top padding were dropped along with it. `.mg-head-inner`/`.mg-head-title`/
  `.mg-head-desc` CSS deleted (confirmed zero other usages before removing).
- **Ticker removed entirely** from this page — the `<div className="ticker-wrap">` JSX block
  was deleted from `MagazineArchiveWrapper.tsx`'s non-filtered branch. **The shared
  `.ticker-wrap`/`.ticker-track` CSS in `globals.css` was left untouched** — it's still used
  by `/journeys`, `/events`, `/events/[slug]`, and `apps/site/app/shop/ShopArchiveWrapper.tsx`.
  If you ever need the ticker back on `/magazine`, the CSS is still there; only this page's
  JSX usage was removed.
- **Hero restructured** from a flex row (image+title+desc on the left, a divider, then a
  320px `.mg-hero-sidebar` list of 3 stories on the right) into a proper 2-column cover
  layout (`.mg-hero-grid`: image left, kicker/title/dek/meta right, `1.15fr 1fr` at
  `min-width: 900px`) with the same 3 `sidebarStories` promoted into their own full-width
  **"More This Week"** 3-card row (`.mg-week-row`/`.mg-week-card`) below the hero instead of
  a cramped sidebar list. `.mg-hero-sidebar`/`.mg-hero-divider`/`.mg-sf-*` CSS deleted
  (confirmed only ever used by this one file before removing).
- **Featured Stories, In Focus, and the filtered-view grid** all now render `.mg-card` as a
  real white card (`background: var(--paper)`, `border-radius: var(--radius-xl)`,
  `box-shadow: var(--shadow-card, ...)`, `overflow: hidden`) instead of a flush image
  directly followed by unwrapped text — required wrapping the kicker/title/desc/date block
  in a new `<div className="mg-card-body">` (padding: 18px 20px 22px) in **both** places
  `.mg-card` is used (`mg-band-grid` and `mg-filtered-grid` — they share the one class, so
  both needed the same JSX wrapper added). `.mg-portrait-img` (In Focus) bumped from flush
  8px to `radius-xl` + `shadow-card`, aspect-ratio unchanged (4/5, intentionally portrait —
  this is a photography-forward section, don't "fix" it to 4/3).
- **"The Edit" rebuilt from a dark hover-swap panel to an always-visible light mosaic** —
  the old design needed `useState`/`onMouseEnter` to reveal anything in the visual panel (a
  static render showed nothing but an empty gradient), which read as dated once actually
  looked at without hovering. `EditorialSection.tsx` is no longer a client component (no
  `'use client'`, no `useState`) — it's a plain server-renderable function that splits
  `stories` into `[lead, ...rest]` and renders one large `.edit-lead` feature card (image +
  title) beside a `.edit-stack` of up to 3 compact `.edit-row` items (76×76 thumb + kicker +
  title + date), `1.3fr 1fr` at `min-width: 900px`. Wrapped in `.mg-edit`/`.mg-edit-inner`
  following the same full-bleed-background + max-width-inner split every other tinted
  section in this file already uses (see `.mg-opinions`/`.mg-opinions-inner` for the
  pre-existing precedent) — **do not put a background directly on a section that also
  carries its own `max-width`/`margin: 0 auto`, or the tint won't span full viewport
  width**; this file now has three of these split pairs (`.mg-band`/`.mg-band-inner`,
  `.mg-edit`/`.mg-edit-inner`, `.mg-digest`/`.mg-digest-inner`) plus the pre-existing
  `.mg-opinions`/`.mg-opinions-inner` — follow this shape for any future tinted section here.
- **Alternating tint rhythm, adjacent-tint seam divider**: Featured Stories (`.mg-band`) and
  The Free Critics (`.mg-digest` — renamed from "Quick Reads", see the follow-up entry below)
  both gained a `#F2F2F2` tint they didn't have before; Opinions
  & Essays (`.mg-opinions`) had its tint **removed** (now plain white) — the new order is
  Featured Stories (tint) → The Lane (white — renamed from "In Focus") → The Edit (tint) →
  The Free Critics (tint) → Opinions (white) → CTA. Since The Edit and The Free Critics are
  adjacent tinted sections, both
  carry their own `border-top: 1px solid rgba(200,191,176,.3)` so they don't visually merge
  into one undifferentiated grey block — this exact same "two same-background sections
  butted together with no divider" bug was caught and fixed in the mockup stage first (via a
  `.sec--tint + .sec--tint` sibling-border rule there) before the real build ever happened.
- **Opinions & Essays rebuilt** from a giant italic pull-quote extracted from the post title
  (`.mg-op-quote`, `border-left: 4px solid #C5491F`) into an image-led feature card
  (`.mg-op-img` 16/9 + `.mg-op-body` with kicker/title/byline) matching Featured Stories'
  visual language — asymmetric `1.4fr 1fr` at `min-width: 900px` via a `.mg-op-card--lead`
  modifier on the first of the 2 `opinionStories`, so two cards don't read as sparse/
  identical. The description excerpt clamp (`.mg-op-desc`) is gone — kicker/title/byline
  only, no body copy on the card.
- **Newsletter CTA restructured** from a flush full-bleed dark 3-column section
  (`.mg-cta`/`.mg-cta-inner`) into a rounded `radius-2xl` dark band with a radial gold
  accent overlay (`.mg-cta-section`/`.mg-cta-band`, matches the homepage `.mz-download-strip`
  visual language) sitting inset inside a padded white page section — 2-column at
  `min-width: 900px` (was 3-column always) with the description/tags now living in the same
  left column as the title (there is no more separate "mid" column). `.mg-cta-title` was
  replaced by using `.mg-cta-left h3` directly (font-weight dropped 700→400, size now
  `clamp(24px, 2.6vw, 32px)`, em color switched from `--ochre` to `--gold`) — if you're
  looking for where the CTA heading style lives, it's `.mg-cta-left h3`, not a dedicated
  `.mg-cta-title` class (that class name is gone).
- Filter pills (`MagazineFilterPills.tsx`, unchanged component logic) restyled from small
  bordered rectangular pills to full `radius-full` JetBrains-Mono uppercase chips, matching
  Discover/People's filter language — CSS-only change, no JSX touched.
- *(Not verified live this pass.)*

### Magazine article body — width-tier rail, sidebar retired (August 2026)

Mockup-first as usual (`mockups/web/moveee_article_rail.html`, an Artifact iterated
through several rounds before being built for real) — solves two things the article page
had no answer for: multi-image galleries and wide CMS tables both had nowhere to go but a
680–844px reading column, and there was no `table` CSS in this file at all (a CMS table
rendered unstyled and overflowed). Supersedes the "MAIN LAYOUT — 2-column grid" /
`.ar-prose` + `.ar-sidebar` model entirely — read this entry before touching the article
page again, the old model is gone.

**The core mechanism — `display: contents` on `.prose-content`.** `.ar-wrap` is one CSS
grid with three named-line tracks (`text` 680px default, `wide` ~1080px, `full` edge to
edge). The raw, sanitized CMS body used to render *inside* a wrapping `.prose-content` div
— which would make that whole div a single grid cell, sized to whatever's biggest inside
it, killing any idea of per-block width variation. `.prose-content` is instead
`display: contents`: this removes only its own box, not the DOM node, so its real children
(the actual `<p>`/`<h2>`/`<table>`/`<figure class="wp-block-gallery">` elements) become
direct grid items of `.ar-wrap` for layout purposes — while `.ar-wrap .prose-content h2`
-style descendant selectors still match correctly, since `display: contents` doesn't
change the DOM tree, only what generates a box. This is the one idea that makes the whole
system work; if a future pass ever needs to touch this, understand this trick before
changing anything.

**Width tiers map onto Gutenberg's own alignment control** — `add_theme_support(
'align-wide' )` was already set in `culture-theme/functions.php` before this pass, so no
WP change was needed. `alignwide`/`alignfull` (the classes WP emits) map straight onto the
`wide`/`full` grid tracks; `table`/`.wp-block-table`/`.wp-block-gallery` default to `wide`
without the editor doing anything; `.is-text-width` (Advanced → CSS class) is the escape
hatch back to reading width. `class` was already confirmed in `sanitize.ts`'s
`ALLOWED_ATTR` before this was built — had it been stripped, every block would have
silently collapsed to one width with no visible cause. **A read-only "Article Layout
Guide" meta box** was added to the WP Admin `post` edit screen (side panel, low priority —
`Culture_Post_Types::render_layout_guide_meta_box()` in `class-culture-post-types.php`) so
this is documented right where an editor is writing, not in a doc nobody opens.

**The old `.ar-sidebar` is gone — its six cards were redistributed by purpose, not moved
as a block:**
| Old sidebar card | New home |
|---|---|
| Details (Writer/Location/Section/Series) | Left gutter, first row of the grid — `.ar-details`, a `<dl>`. Ties into the same `height: 0; overflow: visible` trick as figure captions (see the dead-space bug below) so it never inflates the row it sits in. |
| Share/Bookmark/Like (`ArticleActions`) | Moved out of the hero's frosted-glass byline entirely, now directly under Details, using the light `.ar-actions--standard` variant (`ArticleActions` gained an optional `className` prop for this). |
| Shop the Edit | Inline `.ar-band` card, mid-article, at the wide tier. The old *separate* mobile-only strip (`.ste-section--mobile`) is gone — one band now serves every width. |
| Culture Drop newsletter box | **Reuses the homepage's `<JoinSection>` component directly** — not a lookalike — passed `edition="global"` and `relatedStories[0]` (already-fetched, same slug/title/excerpt/featuredImage shape `JoinSection` expects on the homepage) as `featureStory`. One component, two places. |
| "This piece is from" (Issue) | `.ar-issue-card`, inline near the end of the article, beside where Series context already sits. |
| 2× related-story cards + "From the archive" dark card | **Deleted, not moved** — both duplicated the standalone `.ar-related` "Keep reading" section that already exists at the bottom of the page (outside `.ar-wrap`, untouched by this pass) — no functional loss. |

**`ArticleComments.tsx` split from a body-plus-comments component into comments-only** —
it used to `dangerouslySetInnerHTML` the article body into a leading `.prose-content` div
*and* render the comment thread, both from one `content` prop. That made it impossible to
place the new inline bands (Shop the Edit / Culture Drop / Issue) between the body and the
comments, since both were welded into one component's return value. `page.tsx` now renders
`.prose-content` itself, directly, ahead of `<ArticleComments>` and the new bands. **The
`content` prop on `ArticleComments` is now optional, not removed** — the newsletter reader
(`app/newsletter/[slug]/page.tsx`) still passes it and still relies on the component
rendering both together; that path is completely unchanged. Don't "clean up" the optional
prop later without checking that caller first.

**A dead-space bug, and the general lesson from it**: any element positioned in the
gutter (Details, a figure's margin-note-style caption) is still a real grid child, so its
own height would otherwise set its row's height for the *whole* row — a tall Details block
then pushes whatever paragraph sits beside it down by the difference, reading as random
dead space between two unrelated paragraphs. Fixed with `height: 0; overflow: visible` on
gutter items only (`@media (min-width: 1025px)`, matching this file's existing tablet
breakpoint rather than introducing a fourth, close-but-different threshold) — they still
paint exactly where positioned, they just stop contributing to row sizing. **If a future
gutter element reintroduces visible dead space in adjacent body copy, this is almost
certainly the cause** — check whether it has the `height: 0` treatment before assuming
it's a spacing/margin problem.

**Typography ported from the newsletter reader** (`.rd-body` in `newsletter.css`) so the
two reading experiences feel like one system rather than two: h2/h3 go ochre over a
hairline rule, h4 becomes a mono-uppercase label (not a heading), list markers are ochre
dot bullets / ochre numbered discs with hollow-ring nesting, blockquote keeps its existing
ochre left border. Captions are a mono ochre label line over an italic description — this
was a judgment call (the reader's own captions are plain italic only), flagged in the
mockup review, not objected to.

**Floating share button** (`ArticleShareFab.tsx`, new) — bottom-left pill (icon-only circle
under 760px), opposite `ArticleToc`'s existing bottom-right FAB. Deliberately a separate,
lighter share handler from `ArticleActions`'s (which is wired into the like/bookmark sync
flow and awards `magazine_share` points) rather than a shared hook — this one has no auth
gate and is meant as an always-visible nudge, matching the mockup's standalone pill.

**Verification**: reproduced the real DOM shape (`.ar-wrap > .ar-details` +
`.prose-content` with realistic Gutenberg output — `alignwide` table, `wp-block-gallery
columns-3`, nested lists — + the inline bands) via a scratch route under
`app/features/artcheck/` (deleted before commit, per the homepage-crash lesson above:
clean mock data proves little, the real risk was always in the grid mechanics), screenshot
-verified in Chromium. `tsc --noEmit` clean on both `apps/site` and `apps/connect`
(`JoinSection`/`ArticleActions`/`ArticleComments` are consumed cross-app), CSS
brace-balanced (242/242), `php -l` clean on `class-culture-post-types.php`. **Not visually
verified against a live CMS** — same `NEXTAUTH_SECRET`/WordPress credentials gap as every
other pass in this file; external test images in the verification route failed to load
(no network in the sandbox) but reserved the correct `aspect-ratio`-driven space, confirmed
not a layout bug. Re-check pixel fidelity against a real article with a real gallery/table
in a live environment before considering this fully closed.

### Magazine article page — hero rebuild: gradient bg + right-bleed image panel (August 2026)

`apps/site/app/magazine/[slug]/page.tsx` + `apps/site/app/editorial.css` (`ar-*`
namespace). Mockup-first as usual, including an explicit follow-up question about mobile
behavior before building for real (see below). Two related changes shipped together:

**Hero — the featured image moved from a full-bleed background to a framed panel.**
Previously `hasFeaturedImage` rendered the actual `post.featuredImage` as a `fill`
background image spanning the entire `.ar-hero` (`opacity: 0.7`, with `.ar-hero-vignette`
darkening the bottom for text legibility). Per explicit user direction ("keep the
gradient background... focus the featured image in the empty space on the right hand
side instead of across the entire hero"), the hero's background is now a fixed gradient
wash (`linear-gradient(160deg, #3d3020, #14110d 60%)` + a new `.ar-hero-wash` radial
ochre/gold overlay, `opacity: .55`) — the same atmosphere as before, just not
photo-driven — and the real featured image now renders inside `.ar-hero-photo`, a framed
panel that bleeds to the hero's right edge: `position: absolute; right: 0`, rounded only
on the inner/left corners (`var(--radius-2xl) 0 0 var(--radius-2xl)`), full opacity (was
0.7), `width: clamp(280px, 34vw, 560px)`. `.ar-hero-text`'s `max-width` was narrowed from
900px to 640px so it doesn't run into the panel. `.ar-hero-vignette` is unchanged — still
darkens the gradient toward the bottom behind the text, same as before.
**`object-fit: cover` already handled the "what if the source image is landscape, not
portrait" question with zero extra code** — every WP featured image is fetched the same
way regardless of orientation, and `cover` center-crops whichever shape comes back to
fill the panel; there is no per-orientation branching anywhere in this change.

**Mobile (≤768px) — stacks instead of bleeding.** The right-bleed panel has nowhere to go
under ~768px, so `.ar-hero-photo` switches from `position: absolute` to a full-width,
`aspect-ratio: 4/3` block via the existing 768px media query, and `.ar-hero { min-height:
0; justify-content: flex-start }` (was `min-height: 50vh`) so the hero sizes to its actual
stacked content (image + text) instead of an artificial viewport-relative minimum that
would leave dead gradient space above the image. Because `.ar-hero-photo` sits before
`.ar-hero-text` in the DOM and both are normal-flow children of the flex-column hero once
the panel loses `position: absolute`, this reorders the layout automatically — no JS,
no duplicate markup. Text renders **below** the image as a normal gradient block, not
overlaid on the photo — legibility never depends on where a given image happens to be
busy or plain. This mobile treatment was previewed as its own mockup frame (390px) before
being built, at the user's request, since the two-column desktop layout obviously
couldn't just reflow as-is.

**Convention pass — same visit, same file.** The TOC (`.ar-toc`, previously bare sticky
text with only a border-left active-state indicator) gained real card chrome
(`background: #fff`, `border`, `var(--radius-xl)`, `var(--shadow-card, ...)` fallback,
padding) — no JSX changes needed, the existing `.ar-toc a:hover/.active` border-left
treatment was left as-is rather than replaced. `.ar-sidebar-card` bumped from a flat 8px
radius + one-off `--ar-shadow` to `var(--radius-xl)` + the same `--shadow-card` fallback
token used elsewhere in this file (see `.ar-gate`'s pre-existing precedent for the
`var(--token, <fallback>)` pattern — `--shadow-card` isn't a literal variable anywhere in
`apps/site`, same as `--shadow-tooltip` on the Connect side). `.ar-author` (previously a
flush strip with only top/bottom borders) became a proper white radius-xl/shadow-card
card with real top margin. `.ar-rc` (related-story cards) gained the same white
card/border/shadow/radius wrapper with inner padding (`.ar-rf`'s own radius bumped 4px →
`var(--radius-lg)`) plus a hover shadow-lift, replacing the previous bare
image-then-text-with-no-chrome layout.

- *(Not verified live this pass.)*

### Header dark-zone detection was measuring the wrong coordinate space (fixed September 2026) + hero photo panel widened to landscape

**Bug**: user-reported — on page load, the floating header should render transparent with the
white logo variant whenever it's sitting over a page's dark hero (homepage's `.hero-full`, or an
inner page's own `[data-header-zone="dark"]` section, e.g. `/magazine/[slug]`'s `.ar-hero`) — it
worked on the homepage but not on inner pages. Root cause in `Header.tsx`'s `inDarkZone()`: it
measured each zone element's `offsetTop`/`offsetHeight` and compared against `window.scrollY`.
`offsetTop` is relative to the element's nearest **positioned** ancestor, not the document — a
page whose hero sits inside its own `position: relative` wrapper (`/magazine/*`'s `.mg-page-white`,
added by the "plain-white magazine background" fix earlier in this file) measures `offsetTop`
relative to *that* wrapper, not the viewport/document `scrollY` the code was comparing it against.
The homepage's `.hero-full` has no such wrapper, so the arithmetic happened to still line up there
and masked the bug everywhere else. **Fixed** by switching `inDarkZone()` to
`element.getBoundingClientRect()` (always viewport-relative, regardless of how many positioned
ancestors sit between the element and the document) instead of reconstructing document position
from `offsetTop`/`scrollY` — the header now just checks `rect.top <= 40 && rect.bottom > 160` on
each dark-zone element, no coordinate-space conversion to get wrong. **If a future page's dark
hero doesn't trigger the transparent header, check first whether it sits inside a `position:
relative`/`absolute` wrapper** — that's the exact class of bug this was.

**Also, same session, unrelated**: `/magazine/[slug]`'s `.ar-hero-photo` (the framed featured-image
panel on the right side of the hero) widened from `clamp(260px, 30vw, 520px)` to `clamp(380px,
46vw, 760px)` (tablet breakpoint: `clamp(220px, 32vw, 380px)` → `clamp(280px, 40vw, 480px)`) per
explicit user request — same `top`/`bottom` (height) as before, only `width` grew, so the panel
reads as landscape instead of near-square and fills more of the empty gutter between it and
`.ar-hero-text`. Only `right` is pinned on this element (no `left`), so growing the width extends
the panel leftward into that gap, which is exactly the effect asked for.

*(Not verified live this pass.)*

### Article body — zero spacing after a `wp-block-gallery` (fixed September 2026)

User-reported: a 2-up (or any N-up) Gutenberg gallery in an article body ran flush into the
paragraph directly below it, no gap at all — every other block (single images, `<figure>`,
tables) had normal spacing. Root cause in `editorial.css`: `.ar-wrap .prose-content
.wp-block-gallery { margin: 0; }` (needed so gallery images don't inherit the generic
`figure { margin: 2em 0 }` rule's spacing *between grid items*) has three classes in its selector
— higher specificity than `.ar-wrap .prose-content figure`'s two-classes-plus-a-type-selector —
so it always won regardless of source order, zeroing the gallery's own *outer* top/bottom margin
too, not just what was intended (the margin on the `figure.wp-block-image` wrappers nested inside
it, which is a separate, correctly-scoped rule at `.wp-block-gallery figure.wp-block-image {
margin: 0; }`). Fixed by changing the outer rule to `margin: 2em 0` — same vertical rhythm every
other prose block already uses; the inner per-image-inside-the-grid rule is untouched, so gallery
images still don't get individual spacing between each other, only the gallery block as a whole
gets space above/below it again. **This is the same "unexpectedly-more-specific selector zeroes
a margin that a more general rule was supposed to set" bug class** — if a future block-level
element in `.prose-content` (a new Gutenberg block type, say) reads as flush against its
neighbors despite `figure`/`img`'s generic 2em rule existing, check whether that block has its
own zero-margin override winning on specificity before assuming the generic rule isn't applying
at all.

*(Not verified live this pass.)*

**Same bug recurred on tables (fixed September 2026)** — user-reported: a Gutenberg table also
ran flush into the paragraph below it. Identical root cause: `.ar-wrap .prose-content
.wp-block-table, .ar-wrap .prose-content figure.wp-block-table { margin: 0; ... }` (also 3
classes) beat the generic `figure { margin: 2em 0 }` rule the same way the gallery rule did.
Fixed the same way — changed to `margin: 2em 0`.

### Article body — Gutenberg "Wide width" not applying to galleries/tables (fixed September 2026)

User-reported, with a screenshot: a 2-photo gallery set to "Wide width" in the WordPress editor
rendered at the same width as the surrounding text column instead of extending into the wide
grid track. The CSS itself (`.ar-wrap > .prose-content > .wp-block-gallery { grid-column: wide;
}` in `editorial.css`) was correct and unconflicted on inspection — the bug was in the DOM shape
reaching that selector, not the selector itself.

**Root cause**: WordPress's legacy `wpautop()` filter (still applied to `the_content` even for
Gutenberg block output when there's a blank line around a block in the raw post) wraps a
block-level element like a gallery figure or a table in a stray `<p>...</p>`. Because
`.prose-content` is `display: contents` (see the "width-tier rail" system documented above),
only `.prose-content`'s own *direct children* get promoted into real CSS Grid items — a `<p>`
that wraps the gallery becomes the grid item instead (landing on the default `text` track via
the `.ar-wrap > .prose-content > *` catch-all), and the actual `.wp-block-gallery`/`<table>`
inside it just stretches to fill that paragraph's width, silently ignoring its own `alignwide`/
`wp-block-gallery` class since the width-tier selector requires a *direct-child* match
(`.ar-wrap > .prose-content > .wp-block-gallery`) that this extra `<p>` breaks. This is also why
the margin fix above kept working the whole time — that rule uses a plain descendant selector
(`.ar-wrap .prose-content .wp-block-gallery`), which matches regardless of how deep the element
is nested, so it was never affected by this same bug.

**Fixed** in `apps/site/app/magazine/[slug]/page.tsx`'s `cleanContent()`: a new
`unwrapBlockParagraphs()` step (run first, before the existing CMS-link rewrite) strips a `<p>`
wrapper when its entire content is exactly one `<figure class="...wp-block-gallery...">`,
`<figure class="...wp-block-table...">`, or bare `<table>...</table>` — restoring the real
element as a genuine direct child of `.prose-content` before it ever reaches the grid. Verified
against representative WP markup (a 2-image gallery with nested `wp-block-image` figures, plus a
standalone table) in a scratch Node script: both unwrap cleanly, adjacent unrelated paragraphs
are left untouched, and two separate galleries in the same content unwrap independently without
one match's greedy matching bleeding into the other (uses a lazy `[\s\S]*?` up to the first
`</figure>\s*</p>`/`</table>\s*</p>` sequence, not a greedy one, to avoid over-matching across
paragraph boundaries).

**If a future "block doesn't get its wide/full width" report comes in for some other Gutenberg
block type**, check first whether the block is arriving wrapped in a stray `<p>` (view source /
log `post.content` and look for `<p><figure` or `<p><table` immediately preceding the block) —
this is now a known, recurring WordPress content-pipeline quirk, not a one-off. Extend
`unwrapBlockParagraphs()`'s pattern list rather than touching the grid CSS, which is already
correct as long as the element reaching it is a genuine direct child.

*(Not verified live this pass.)*

**Follow-up investigation (same month) — the `unwrapBlockParagraphs()` fix above turned out to be
solving a bug that didn't exist; the wide-width mechanism itself was never actually broken.**
User reported it was still broken after the fix above shipped. Investigation this time pulled the
*real* production HTML+CSS directly from `themoveee.com` (this sandbox can reach the live Vercel
site over `curl`, unlike `cms.themoveee.com`) for three live articles with real galleries, and
rendered them offline in the pre-installed headless Chromium against the exact deployed CSS
bundle:
- None of the three galleries were wrapped in a stray `<p>` — `wpautop` isn't doing this to this
  site's content, at least not for galleries. The September 2026 fix above is harmless (a no-op
  on real content) but wasn't addressing a real defect.
- The production CSS already forces every `.wp-block-gallery`/table onto the `wide` grid track
  unconditionally (no `alignwide` class required) — confirmed by grepping the live, deployed
  `editorial.css` bundle directly.
- Measured directly in a headless render of `saelem-hasnt-released-his-best-song-yet`'s real
  markup against its real CSS: the gallery computed to `width: 1080px`, `grid-column:
  wide/wide`; the paragraph beside it computed to `width: 680px`, `grid-column: text/text`. The
  full ancestor chain (`figure.wp-block-gallery > div.prose-content(display:contents) >
  div.ar-wrap > … > main`) was walked and confirmed nothing constrains it. **In this isolated,
  reconstructed render, the mechanism works exactly as designed.**
- The user's own browser screenshot of the *same* live URL still shows the gallery rendering
  narrow (only slightly wider than the text column, not the full ~1080px wide track) — a direct
  contradiction of the above that was not resolved before this session ended. This sandbox's
  headless Chromium cannot reach `themoveee.com` over its own network stack (the agent-proxy
  tunnel used by `curl`/raw HTTP works, but Chromium's connections through it fail with
  `ws_closed_mid_exchange` / `ERR_CONNECTION_RESET` — tried both the default and an explicit
  `proxy: { server: ... }` launch option), so a true apples-to-apples live-browser repro was not
  possible from here.
- **Open question for whoever picks this back up**: since the code-level mechanism checks out in
  isolation, the two most likely explanations are (a) the user's browser was showing a stale
  cached CSS/JS bundle from before some earlier fix, or (b) something real-browser-specific
  (actual viewport width, an actual image failing to load and affecting the gallery's own
  intrinsic sizing, a client-side hydration quirk) that an offline reconstruction with blocked
  network can't reproduce. **Before touching the CSS again**, get the user to open DevTools on
  the live page and check the computed `grid-column-start` value on the `.wp-block-gallery`
  element directly, and their actual browser viewport width — that's more diagnostic than another
  screenshot.

### Newsletter single-issue reader (`/newsletter/[slug]`) — `.rd-layout` never cleared the floating header (fixed September 2026)

Moved to `docs/claude-md-archive.md` (narrow, closed-out bug-fix pass; see that file for full detail if ever needed).

### Directory REST fallback — oversized `_embed=1` response broke Next's data cache and tripped a real production build failure (fixed September 2026)

Moved to `docs/claude-md-archive.md` (narrow, closed-out bug-fix pass; see that file for full detail if ever needed).

### Article/newsletter comment box — sleek/minimal redesign (September 2026)

`apps/site/components/ArticleComments.tsx` + its CSS in `apps/site/app/globals.css` (previously
`.article-comments-*`, now `.comments`/`.composer`/`.comment-list`/`.c-*`) rebuilt from a
user-approved Artifact mockup — replaces the old boxed textarea + separate grey "Post Comment"
button + bordered-card-per-comment look. **One component, two surfaces**: this is the same
component the magazine article page and the newsletter single-issue reader both render (see the
`content` prop's doc comment on why) — the redesign applies to both automatically, no per-surface
work needed.

- **Composer**: flat inline field (no boxed textarea sitting above a separate button) — a
  circular initial-avatar next to a bordered `.composer-field` that highlights on focus.
  Cancel/Post only fade in once focused or typed into (`.composer-actions.force-open`), matching
  a modern "add a comment" pattern instead of always showing action buttons. Auto-growing
  textarea (`rows={1}`, JS `scrollHeight`-driven height, capped at 220px) replaces the old fixed
  `rows={4}` box.
- **Comment rows**: circular initial-avatars (no real avatar URL exists on `Comment` — computed
  as the first letter of `author`), hairline top-border dividers between rows instead of an
  individually bordered/padded card per comment, name+time on one line (mono time, sans bold
  name) instead of a separate uppercase-mono author label.
- **No reactions/replies were added** — the mockup showed like/reply icon rows, but the real
  backend (`GET/POST /api/comments`, `Comment` interface: `id`/`author`/`content`/`date`) has no
  per-comment like or threaded-reply concept at all. Building that UI without a backend would
  have been fake, non-functional chrome, so it was deliberately left out of the real
  implementation — flag this as a real follow-up if per-comment reactions/replies are ever
  wanted, since it needs new REST endpoints + DB columns first, not just UI.
- **Sign-in prompt**: dashed-border row with an inline lock-ish person icon, replacing a plain
  `<p>` with an underlined link.
- **Empty state**: centered italic serif line, unchanged copy ("No comments yet — be the first to
  share your thoughts."), just recentered/repadded to sit better under the new composer.
- **Class-name collision avoided**: the mockup's button classes were literally `.btn-ghost`/
  `.btn-primary`, but `apps/site/app/globals.css` already defines **global**, differently-shaped
  `.btn-ghost`/`.btn-primary` classes used site-wide (quotes archive, event RSVP CTA, etc.) — a
  same-named second definition later in the cascade would have silently overridden every other
  use of those classes on the site. Renamed to `.comment-btn-ghost`/`.comment-btn-primary`
  instead. **If you ever port a mockup's class names verbatim into `globals.css`, grep for an
  existing definition first** — this file already has multiple unrelated components sharing the
  `.btn-*` prefix.
- `QuoteComments.tsx` (a separate, inline-`style`-only comment component on `/quotes/[slug]`) was
  deliberately left untouched — it shares no class names with this redesign and wasn't part of
  what was asked ("posts and newsletters").
- *(Not verified live this pass.)*

### `/visuals` is a live section — an earlier retirement attempt never stuck

A branch once removed `/visuals` (the Site A illustration gallery), but `main` kept shipping to it
in parallel and the removal was reverted on merge. **`/visuals` is live**:
`apps/site/app/visuals/page.tsx` + `[slug]/page.tsx`, `VisualsGrid.tsx`/`VisualsSingleClient.tsx`,
the Footer link, the sitemap entry, and `'visuals'` in `proxy.ts`'s `APP_ROUTES` are all real.
Backend (WP Admin illustration-generation tool, `culture/v1/visuals` REST endpoint,
`_culture_visual_downloads` credit-tracking) is unrelated and was never touched either way. The
mobile app's own "Visuals" **category** filter on `MagazineScreen.tsx` is a different, unrelated
concept (a magazine category, not this gallery).

### Pull-quote/blockquote — centered treatment, magazine + literary + newsletters (September 2026)

Mockup-first as usual (Artifact, iterated once — first draft was flush-left with the quotation
mark bleeding off the left edge, corrected to centered per explicit feedback: "how about the way
the quote boxes are flushed left?"). Approved mockup:
`https://claude.ai/artifact/CNoWUikwT4cKCwh5YmDCXi`.

- **The sitewide "Unified pull-quote/blockquote treatment" rule in `globals.css`** (shared by
  `.ar-wrap .prose-content blockquote` — magazine articles — `.digest-prose`/`.gml-issue-prose`/
  `#issue-body .prose-content`/`.gml-page-body` — GetMeLit/digest surfaces — and `.rd-body` — the
  newsletter reader) was redesigned from a left-border block (`border-left: 3px solid
  var(--ochre)`) into a centered pull-quote: a solid oxblood `"` glyph (`::before`, Fraunces,
  84px) floats above the quote, the quote text itself centers below in italic Fraunces at 23px
  (capped to `46ch` so it doesn't stretch full-width), and WP core Quote block's optional `<cite>`
  centers underneath, flanked by two short 20px rules on either side. `max-width: 640px; margin:
  2.6em auto` centers the whole block within the prose column regardless of which surface's own
  column width it sits in. A `max-width: 480px` breakpoint shrinks the mark/text sizes.
  **Still one shared rule, still edited only in `globals.css`** — none of the per-surface CSS
  files (`editorial.css`/`newsletter.css`/`getmelit.css`) needed touching, same "don't add a
  divergent rule here" convention the original comment already established.
- **The Moveee Literary vertical (`/literary`) got its own equivalent, separate rule** —
  `.lit-piece-body blockquote` in `literary.css` — since that section deliberately runs its own
  brand palette/type system (`--lit-oxblood`, `--font-lit-display` for the mark, `--font-lit-italic`
  for the quote body, `--font-lit-meta` for the attribution), not the sitewide `--ochre`/Fraunces
  tokens. Same centered shape (glyph above, italic serif center, mono attribution with flanking
  rules below), scaled slightly smaller (620px max-width, 76px mark) to match this vertical's more
  restrained sizing elsewhere. This was **not** folded into the sitewide selector list — keep it
  that way; the Literary section's whole point is a separate visual identity (see "The Moveee
  Literary" section elsewhere in this file).
- **Deliberately out of scope for this pass**: the Quotes archive (`/quotes`, `QuoteCard.tsx`/
  `quotes.css`) and the author-page hero variant — both were shown in the same mockup as
  companion pieces but the user's actual ask ("implement it for magazine articles, literary
  articles and newsletters") named only the three prose surfaces above. `QuoteCard.tsx`'s own
  `.quote-content::before` faint-glyph treatment is untouched. Revisit only if asked.
- *(Not verified live this pass.)*

### Homepage hero — only shows posts tagged "Featured" (September 2026)

`FullBleedHero` (`app/page.tsx`) renders whatever `fetchHomepageData()` sets as `coverStory` —
previously just `pool[0]`, i.e. whichever post happened to sort first out of the latest-14/
edition-scoped pool, with no editorial control over what lands in the hero. Per explicit user
request, `coverStory` is now sourced from a dedicated fetch, `getWPData(GET_STORIES, { first: 8,
tag: "featured" })` in `fetchHomepageData.ts` — `GET_STORIES` already supported a `tag` where-arg
(same param the shop's edition-tagged products already used), so no query changes were needed,
only a new call site. To put a post in the hero, tag it `Featured` in WP Admin (slug `featured`).

- **Edition-scoped (`/uk`, `/us`, `/africa`)**: prefers a featured post whose `countries.nodes`
  matches that edition's country slugs, then a featured post with no country tag at all
  (universal), then any featured post regardless of edition — same fallback shape the pre-existing
  "universal filler" logic already used for the `stories` row, for consistency.
- **Global (`/`)**: just `featuredPool[0]`.
- **Deliberate fallback, not a strict requirement**: if literally nothing is tagged `Featured` yet
  (a brand-new/unconfigured site), `coverStory` falls back to the old `pool[0]` behaviour rather
  than rendering a blank hero — `FullBleedHero` has no empty-state design of its own to fall back
  to, so an empty hero would look broken, not intentional. This mirrors the project's usual
  "degrade gracefully rather than break" convention (see e.g. the Discover/Literary "omit the
  section entirely when empty" pattern) applied to a single required slot instead of a whole
  section.
- The featured pool is fetched **separately** from the general stories pool and never contributes
  to the `stories`/carousel rows below the hero — it exists solely to pick the hero post.
  `stories` (the pool used for the row directly under the hero, itself currently unused
  downstream — see the pre-existing "computed-but-unused" note elsewhere in this file) now
  excludes whatever `coverStory` resolved to, by slug, instead of assuming it was always `pool[0]`.
- *(Not verified live this pass.)*

### Header transparent-on-dark-hero: never recovered after a root `loading.tsx` Suspense swap (fixed September 2026)

User-reported, on a fresh (non-scrolled) load of `/newsletter/africa`: the floating header rendered
solid instead of transparent-over-dark, even though `EditionNewsletterHub.tsx`'s hero still carries
`data-header-zone="dark"` and was never touched by the `.rd-layout` fix directly above (that fix
only edited `.rd-layout` in `newsletter.css`, used exclusively by the unrelated `/newsletter/[slug]`
single-issue reader — confirmed by re-reading `EditionNewsletterHub.tsx`, `newsletter-hub.css`, and
`Header.tsx` line-by-line before concluding this was a separate, pre-existing bug rather than a
regression from that fix).

**Root cause**: `apps/site/app/loading.tsx` is a **root-level** `loading.tsx` — Next.js App Router
treats this as a Suspense fallback wrapping every routed page's content, including on a genuine
hard/fresh load via streaming SSR, not just client-side transitions. It renders a plain white
shimmer skeleton with zero `[data-header-zone="dark"]` elements in it.
`EditionNewsletterHub.tsx` is an async Server Component (`await getNewslettersWithFallback(...)`)
— if that WordPress fetch takes any real time, Next.js streams this white skeleton in first, then
swaps in the real page (with `.nlh-hero`) once the data resolves. `Header.tsx`'s dark-zone
detection (`inDarkZone()`, see the September 2026 `getBoundingClientRect()` fix above) only
re-checks on mount, scroll, resize, the `load` event, and two rAF ticks right after mount — none of
which fire when React swaps a Suspense boundary's content in place. So the header's early checks
can all run and find zero dark zones (the loading skeleton has none) before the real `.nlh-hero`
has streamed in, latch `isSolid` to true, and then have nothing left to trigger a recheck once the
real dark hero appears underneath — until the user happens to scroll. This isn't specific to
`/newsletter/africa` or to anything from this session's work — it's a gap in the header's own
recovery mechanism that can affect **any** page with a `data-header-zone="dark"` section behind a
slow enough async Server Component fetch; it just hadn't been reported before now.

**Fixed** by adding a rAF-throttled `MutationObserver` on `document.body` (`childList`/`subtree`)
inside the same `useLayoutEffect` in `Header.tsx`, alongside the existing scroll/resize/load
listeners — any DOM change (including a Suspense boundary's fallback-to-real-content swap) now
triggers the same throttled `update()` the scroll handler already uses. This is a general fix, not
a per-page one: it doesn't depend on knowing which pages are slow enough to trip the root
`loading.tsx`, and it also covers any other future async-content-swap scenario the header's
existing event listeners don't hear about.

*(Not verified live this pass.)*

### Magazine article page — left TOC column removed, contents moved to a floating FAB (August 2026)

User request: "create more width for the post body area" by removing the left sidebar on the
post page, making the table of contents "a floating icon just like in the mobile app," and
moving "the other details" into a box on the right sidebar. Touches
`apps/site/app/magazine/[slug]/page.tsx`, `apps/site/app/editorial.css`, and adds
`apps/site/components/ArticleToc.tsx`.

- **`.ar-wrap` is now a 2-column grid** — `minmax(0, 1fr) 300px` (was `160px 1fr 260px`).
  Measured in a headless browser at 1440px: the prose column went **700px → 844px** (+20%).
  `max-width` bumped 1200 → 1248 with `padding: 0 24px 80px` + `box-sizing: border-box`, so
  the content column is still exactly 1200px at wide viewports. **This also fixed a
  pre-existing edge-touching bug**: `.ar-wrap` had `padding: 0 0 60px` at the `max-width:
  1024px` breakpoint, so between ~1024px and 1200px the grid ran flush to the viewport edges;
  it's now `0 32px 60px`, matching every other section at that breakpoint.
- **`.ar-prose` bumped to 17px/1.7** (was 16px/1.6) — a wider column needs a slightly larger
  type size to keep the measure comfortable; this is the counterweight to the width gain, not
  an unrelated typography change. Also added `scroll-margin-top: 24px` to `.ar-prose h2/h3`
  and `.ar-prose p[id]` (the pseudo-heading pattern, see the heading-id injection comment in
  `page.tsx`) so a TOC jump doesn't park the heading against the top of the viewport.
- **`ArticleToc.tsx`** (new client component) — fixed 48px round FAB bottom-right
  (`.ar-toc-fab`, 44px at ≤768px) opening a `.ar-toc-panel` contents list, mirroring
  `apps/mobile/src/screens/magazine/ArticleScreen.tsx`'s `tocFab` + contents bottom sheet.
  Desktop: a 320px panel anchored above the button, closed by outside-click/Escape/✕/picking
  an item. **≤768px it becomes a real bottom sheet** (full-width, `border-radius: 20px 20px 0
  0`, 70vh) with a tinted tap-catching `.ar-toc-scrim`. The scrim is `display: none` at
  desktop **on purpose** — a full-viewport scrim there would swallow the first click on the
  page, so desktop closes via the outside-click listener instead. Renders nothing at all when
  the article has no headings (the old column's "Full article" single-item fallback is gone —
  a FAB that opens a one-item list isn't worth the chrome).
- **`TocScrollSpy.tsx` deleted**, its logic folded into `ArticleToc.tsx`. It worked by
  toggling an `.active` class on `.ar-toc a[href^='#']` DOM nodes, which **cannot** work now
  that those links only exist while the panel is open — active state is React state driven off
  the `headings` prop instead, so it survives open/close cycles. Confirmed zero other
  importers before removing. The `IntersectionObserver` config (`rootMargin: "0px 0px -70%
  0px"`) and the "last heading above the viewport" fallback are carried over verbatim.
- **Article meta moved to the right sidebar** as a new first card,
  `.ar-sidebar-card--meta` ("Details") — Writer / Location / Section / Series / Industry,
  built from an `articleMeta` array in `page.tsx` and rendered as label-left/value-right rows
  (`.ar-meta-row`, hairline-divided, same shape as the mobile TOC sheet's `tocMetaRow`).
  Deliberately **not** duplicating Published/Reading time, which the hero byline already
  shows — only the fields that lived under the old TOC moved.
- **Dead CSS removed rather than kept** (a deviation from this file's usual "leave it in case
  it's needed again" convention, since these are directly superseded and reference a column
  that no longer exists): `.ar-toc`, `.ar-toc-heading`, `.ar-toc-details`, `.ar-toc-summary`,
  `.ar-toc-toggle-label`, `.ar-toc-chevron`, `.ar-toc-meta*`, and the `.ar-toc { display:
  none; }` mobile override. Note `.ar-toc-*` names are now **reused** by the new floating
  panel (`.ar-toc-fab`/`.ar-toc-panel`/`.ar-toc-list`/`.ar-toc-num`) — if you find a stale
  `.ar-toc` reference somewhere, it means the old column, not the FAB.
- **Verified in a real browser this time** (unlike most passes in this file): the live CMS is
  unreachable from the sandbox (the agent proxy denies `cms.themoveee.com` at the network
  policy level, so the page can't be server-rendered with real content), so the layout was
  checked instead via a static harness loading the real `editorial.css` with representative
  markup, screenshotted in the pre-installed Chromium at 1440/1024/390px. Confirmed: correct
  column widths at each breakpoint, no horizontal overflow (`scrollWidth === viewport` at all
  three), the desktop panel anchoring, and the mobile sheet + scrim. Also verified via
  `tsc --noEmit` (clean) on `apps/site` and a CSS brace/paren-balance check on `editorial.css`
  (213/213, 204/204). Still worth an eyes-on check against a real article — the harness has no
  featured-image hero, gate, comments, or `Shop the Edit` card.

### Homepage + site-wide header/footer — full rebuild onto the "WePresent concept" (August 2026)

**Supersedes the `MoveeeZone.tsx`/`HomepageContent.tsx` homepage entry directly below, and the
`Header.tsx`/`Footer.tsx` shape referenced throughout the rest of this file.** Mockup-first as
usual — `mockups/web/moveee_homepage_wepresent_concept.html` (a from-scratch concept, not a
rebuild of the prior mockup) was approved, then wired to real data "to the last T" per explicit
user direction, and — per an explicit scope expansion mid-build — the new floating-pill header
and dark WePresent-style footer were adopted **site-wide**, not just on the homepage.

**What changed and where:**
- `apps/site/components/Header.tsx` + `apps/site/app/header.css` — full rewrite. A floating pill
  (`search | logo | cart | menu`, no separate always-visible auth/language controls) that starts
  transparent-over-dark only on a page with a `.hero-full` section (currently just `/`) and solid
  everywhere else, auto-hiding on scroll-down/returning on scroll-up. Opening the hamburger opens
  a full-screen `.menu-overlay` (3-column ≥900px): real nav links, a "From the Shop" card fetched
  live from the new `GET /api/header/featured-product` route (random pick via `GET_PRODUCTS_EXTRA`,
  refetched every time the menu opens), and an "Account" column that's session-aware
  (`useSession()`) — signed-in members get a dashboard/feed/wallet/settings/sign-out card, signed-
  out visitors get Join/Sign-in CTAs. **No EN/FR language switcher and no masthead ticker** — both
  existed in the mockup and were explicitly cut before shipping. `SearchOverlay.tsx`'s own
  fetch/grouping logic is untouched; only its CSS shell was restyled (full-screen white takeover
  instead of a dark-scrim dropdown).
- `packages/shared/components/Footer.tsx` + `apps/site/app/footer.css` — full rewrite, WePresent's
  own structure (newsletter form + socials up top, big-serif link columns, a centred wordmark, one
  thin closing line) in Moveee's dark-`--ink` palette. The newsletter form is a real
  `<SubscribeForm list="culture-drop">`, not decorative. The 3-column link layout was kept from the
  mockup (not expanded to 5) with the real link set redistributed into it: **Explore**
  (Magazine/Newsletter/Origins/Visuals/Quotes), **Moveee** (Feed/People Near Me/Happenings/Culture
  Directory/Games/Shop), **Company** (Contact/Privacy/Terms/Cookie Policy/AI Use Policy). The
  pre-existing edition `<select>` (reads/writes the `moveee-edition` cookie) is unchanged, just
  restyled. `Footer.tsx` is confirmed the **only** Footer importer site-wide (`apps/connect`
  removed its own Footer entirely, see "Footer removed sitewide" above) — safe to rewrite freely.
- `apps/site/app/page.tsx` — now renders the real new homepage directly (no more temporary
  Magazine-archive swap, no more `/app` detour — see below). Same edition detection as the old
  temporary swap (`moveee-edition` cookie → `x-vercel-ip-country` header → `editionFromCountry()`),
  `dynamic = "force-dynamic"` for the same reason. Sections, top to bottom: `FullBleedHero` (real
  `coverStory`, same "pool[0]" lead-story pattern `fetchHomepageData.ts` already used), a masthead
  (`Best in *culture*, every single week.`) with `HeroCarousel` beneath it, then five sections
  reusing the **exact same pinned-taxonomy fetch** `/magazine`'s default view already uses — "The
  Front Page" (News-excluded top pool), "From The Shop" (`ShopRail`, real products), "The Lane"
  (the-lane series), "The Edit" (News category), "The Free Critics" (the-free-critics series),
  "Opinions & Essays" (Viewpoints category) — and closes with `JoinSection` (real subscribe form +
  an edition-scoped "latest issue" feature card, no client-side timezone guess like the mockup's
  static prototype).
- **`getMagazineSections(edition?)` extracted into `packages/shared/lib/wp.ts`** (new exported
  function, plus its private `getGlobalStoryPool()`/`getMagazineMainPool()` helpers) — this is the
  pinned-section fetch/dedupe logic that used to live only as private, inline functions inside
  `MagazineArchiveWrapper.tsx`. Both the new homepage and `MagazineArchiveWrapper.tsx` (refactored
  in this same pass to call it instead of keeping its own duplicate copy) now share one
  implementation. **If this fetch/dedupe logic ever needs to change, there is exactly one place to
  change it** — don't let a future edit reintroduce a second copy in either caller.
- New homepage-only components (all in `apps/site/components/`): `FullBleedHero.tsx` (server,
  renders `coverStory`), `HeroCarousel.tsx` (client — centred-snap scroll carousel, active-card
  scale-up; a **simplified** port of the mockup's carousel that drops its infinite-loop
  clone-and-jump trick — a real, large story pool doesn't need to fake looping the way a
  ~7-item static prototype did), `MasonryRandomSection.tsx` (server — the mockup randomises each
  row's card-shape via client `Math.random()` on load; this instead derives shape
  deterministically from each story's own id, so server and client render identically with no
  hydration mismatch and no client component needed just for this), `ShopRail.tsx` (client —
  arrow-paged horizontal product rail, real products). New CSS: `apps/site/app/homepage-v2.css`
  (hero/masthead/carousel/framed-card/masonry/shop-rail/join-section rules, ported directly from
  the mockup's `<style>` block).
- `apps/site/app/globals.css` — added `--shadow-1`/`--shadow-2`/`--shadow-3` (real values; every
  usage sitewide previously fell back to a hardcoded `var(--shadow-card, ...)` literal since no
  real token existed) and `--rule-strong`. `--color-paper-deep` in the `@theme` Tailwind-mirror
  block was also corrected from a stale `#f5f5f5` to `#f2f2f2`, matching `:root`'s own
  `--paper-deep` (a pre-existing drift between the two blocks, unrelated to this rebuild but
  caught while pulling the mockup's token values).
- **`/app` route retired** — deleted (`apps/site/app/app/page.tsx`), since the real homepage now
  lives at `/` directly and there's no more "temporary Magazine-archive swap at `/`, real
  homepage parked at `/app`" split to maintain. `'app'` was left in `proxy.ts`'s `APP_ROUTES` set
  (harmless now that the route doesn't exist) rather than removed, per that set's own documented
  tolerance for stale entries.
- **apps/site has no dark-mode system** (confirmed via grep — zero `data-theme`/`ThemeToggle`/
  `useColors`/`prefers-color-scheme` references anywhere in the app, unlike `apps/connect`'s
  extensive dark-mode work documented elsewhere in this file) — "adapt to dark mode" for this
  rebuild meant building off the real `--paper`/`--ink`/etc. tokens rather than hardcoded hex, not
  adding `[data-theme]` blocks. If dark mode is ever added to Site A, this rebuild's CSS is
  already token-driven and shouldn't need a rewrite — just new dark values for the existing tokens
  in `globals.css`, same shape as `apps/connect`'s own dark-mode tokens.
- *(Not verified live this pass.)*

### Homepage "Something went wrong" crash — an index lookup that could return `undefined` (fixed August 2026)

After the WePresent homepage rebuild shipped, `/` served the `app/error.tsx` boundary
("SOMETHING WENT WRONG / A brief interruption") on every visit while **every other route
worked fine**. Root cause was one line in `apps/site/components/MasonryRandomSection.tsx`:

```ts
return layouts[seed % layouts.length] as any;   // ← can be undefined
```
called as `[...shapeForRow(row1Seed), ...shapeForRow(row2Seed)]`. `seed` is CMS-derived
(`databaseId`, falling back to an id string's `.length`), so a missing or non-numeric
`databaseId` makes the modulo `NaN`, `layouts[NaN]` is `undefined`, and **spreading
`undefined` throws** `TypeError: ... is not iterable`. That killed the whole Server
Components render. Fixed by making `shapeForRow` total (coerce the seed, fall back to
layout 0 for any non-finite value) and filtering null entries out of `stories` first.

**Three diagnosis traps this hit, worth internalising — they cost days:**
1. **HTTP 200 proves nothing.** Streaming SSR commits the status before the render fails,
   so Vercel logs showed `/ → 200` for every broken request. Don't rule out a server
   crash because the status looks healthy.
2. **A clean `next build` log proves nothing for a `force-dynamic` route.** The page body
   never executes at build time — only at request time. The build being green was
   meaningless here.
3. **Production redacts the error.** Next.js strips Server Component error messages before
   they reach the browser; the console only shows "An error occurred in the Server
   Components render..." plus an opaque `digest`. Nothing anywhere printed the real cause.
   `apps/site/instrumentation.ts` (`onRequestError`) now logs one greppable line per server
   error — **search Vercel logs for `MOVEEE_SERVER_ERROR`** to get message, stack, route,
   and digest. Reach for that first next time instead of guessing from stack traces.

**What actually found it:** running `next dev` in the sandbox and requesting the page.
Note the sandbox's blocked network is a *feature* here — it simulates total CMS failure —
but an all-empty CMS response makes every one of these components early-return `null`, so
that alone exercises almost nothing. The bug only surfaced after rendering the components
against **deliberately hostile data** (missing `databaseId`, string/`NaN` ids, `null`
`featuredImage.node`, absent `slug`) via a scratch page under an `APP_ROUTES`-allowed path.
**If a homepage/section component needs debugging again, build that hostile-data page
first** — clean mock data renders fine and proves nothing. Two gotchas when doing it: a
route directory starting with `_` is a Next private folder and won't route, and `proxy.ts`
301-redirects any first path segment not in its `APP_ROUTES` set.

**This fix was incomplete — the crash kept recurring after it shipped (fixed for real,
same day).** The `MOVEEE_SERVER_ERROR` marker the fix above added did its job: pulling the
actual Vercel log entry for a request that still hit the error boundary post-deploy showed
a **different** `TypeError`, not the `shapeForRow` one:
```
TypeError: ((intermediate value) || "").replace is not a function
```
Root cause was the same class of bug, one field over: `FullBleedHero.tsx`, `JoinSection.tsx`,
and `MasonryRandomSection.tsx` all rendered `(story.excerpt || "").replace(/<[^>]*>/g,
"")` directly in JSX (not inside `loadHomeSections()`'s try/catch, which only wraps the
data-fetch phase — a throw during render itself is never caught by it). `x || ""` only
substitutes the fallback when `x` is falsy; if `excerpt` comes back from WPGraphQL as a
**truthy non-string** value for some post (seen in production), `.replace` doesn't exist on
it and throws, same "kills the whole Server Components render" outcome as the first bug.
Fixed by checking the type explicitly — `typeof x === "string" ? x : ""` — in all three
components, `app/page.tsx`'s own `stripHtml()`, and every other place in the codebase with
the identical fragile pattern found by grepping for it repo-wide: the newsletter reader's
two title-strip call sites and `lib/rss.ts` (`apps/site/app/newsletter/[slug]/page.tsx`),
`app/journeys/page.tsx`'s local `stripHtml`, two API routes (`api/search`,
`api/directory/entry`), and `packages/shared/components/DirectoryGrid.tsx` — all take
CMS-sourced excerpt/content/title fields and were equally exposed, just hadn't crashed
(yet) in production. **`(x || "").replace(...)` (or `?.replace`, or `(x ?? "").replace`)
on any CMS-sourced field is not a safe idiom in this codebase** — WPGraphQL fields here
have demonstrably come back as truthy-but-non-string at least once; always guard with an
explicit `typeof x === "string"` check instead of relying on `||`/`??`/`?.` alone.
**Lesson for next time this class of bug is suspected**: a fix that only addresses the
one stack trace you have doesn't mean the bug class is gone — grep for the same fragile
pattern repo-wide before considering it closed, the same way this pass eventually did.

### Homepage sections — pastel/tint chrome retired in favour of the Issue Archive style (September 2026)

**Supersedes the colour treatment described throughout the "WePresent concept" entry above** —
that entry (and its mockup) is still accurate for the hero, masthead, carousel, and footer; only
the five repeating body sections (The Front Page, From The Shop, The Lane, The Edit, The Free
Critics, Opinions & Essays) changed, at explicit user request, from a colourful pastel-card
design to a calmer, editorial one (not a bug fix). The old look: each section had a centered
`.band-head` above a 4-column `.masonry-rand` grid of `.wcard` cards, each card's whole background
a random pastel fill from `lib/cardColors.ts`'s `colorForCard(seed)`, with every other section
alternating white/`.band--tint` (`#F2F2F2`).

**Current state**: every homepage section (including the shop rail) renders on plain white, using
the `/magazine/issues/[slug]` header/card language — `<h2>` + a "More →" link on a
`justify-content: space-between` row, then a flush 4-column grid (`.arc-grid`, 3-up at
`max-width: 1100px`, 2-up at `780px`) of plain image cards: 4:3 photo, serif title, one-line dek
(real `story.excerpt`, HTML-entity-decoded via `packages/utils/decode-html.ts`'s `decodeHtml()`
— CMS text comes back with numeric entities like `&#8217;s` that a regex-only tag-strip doesn't
decode, so titles render as plain `<h3>{title}</h3>` rather than `dangerouslySetInnerHTML`), mono
"Read →". Same route, same data, same section order as before.

- **Classes**: `.arc-section`/`.arc-hdr`/`.arc-grid`/`.arc-card`/`.arc-card-img`/`.arc-cta` in
  `apps/site/app/homepage-v2.css` (parallel to, not reusing, `magazine.css`'s `.mag-issue-*`,
  since that file isn't loaded on `/`). `.arc-shop-card`/`.arc-shop-vendor`/`.arc-shop-price` are
  the shop rail's variant (flush 1:1 image, vendor mono caption, serif title, mono price below).
- **`MasonryRandomSection.tsx`** — renders the archive-style header + 4-up grid; no `sectionType`/
  `subtitle`/`tint`/`viewAllLabel` props (all removed — the header is just `<h2>` + an optional
  "More →"). The Shop section's header is hand-written in `page.tsx` (no magazine-post excerpt to
  reuse the component for).
- **`HeroCarousel.tsx`** ("Right Now", the masthead carousel) **and `ShopRail.tsx`** ("From The
  Shop") both auto-scroll continuously and loop seamlessly, not just on arrow click. Mechanism
  (same in both): the item list renders **twice** back-to-back (`looped = [...items, ...items]`);
  one `requestAnimationFrame` loop increments `rail.scrollLeft` at a slow, ambient
  `AUTO_SCROLL_SPEED = 0.035px/ms`, and once it reaches exactly one set's width
  (`rail.scrollWidth / 2`) it's wound back by that width — since both halves are identical, the
  reset is invisible. `scroll-snap-type`/`scroll-snap-align` are deliberately **not** set on
  either rail (snap-on-scroll-end fights a script setting `scrollLeft` every frame). A `pausedRef`
  (not React state, to avoid a per-frame re-render) pauses on hover/touch and for 2.2s after an
  arrow click, then resumes. **If a future rail wants auto-scroll + loop + still
  arrow-controllable, copy this pattern** rather than the pure-CSS duplicated-track marquee used
  elsewhere (e.g. `.evt-ticker-track`) — that one can't be paused/nudged by user interaction.
- **New shared component: `apps/site/components/ArchiveCardGrid.tsx`** — the flush `.arc-grid`/
  `.arc-card` treatment factored out so any open-ended story listing can reuse it instead of
  hand-rolling a copy. Works because `homepage-v2.css` loads site-wide via the root `layout.tsx`.
  Wired into `MagazineArchiveWrapper.tsx`'s filtered-view grid, `SeriesLandingPage.tsx`'s "More
  from {series}" grid, and `author/[slug]/page.tsx`'s "Stories by {author}" grid.
- **`MagazineHub.tsx`**'s "Browse by Section"/"Recurring Series" tile grids (no image, just a
  name + arrow) also used `colorForCard()` — not candidates for `ArchiveCardGrid`, so flattened
  in place to `background: var(--paper); border: 1px solid var(--rule)` with ochre hover state.
- **`lib/cardColors.ts` (`colorForCard()`/`LIGHT_COLORS`) and `lib/masonryShapes.ts` deleted
  outright** — confirmed zero remaining call sites repo-wide after this sweep. The narrower
  `.wcard`/`.wcard-photo`/`.wcard-caption` base rules **stay** in `homepage-v2.css` — still used
  by `JoinSection.tsx`'s single "latest issue" feature card (a different, single-card use) and by
  `.masonry-rand`/`.band`/`.band-head`/`.wcard--sq`/`.wcard--rect` on `SeriesLandingPage.tsx`,
  `MagazineArchiveWrapper.tsx`, and `author/[slug]/page.tsx` — none of those pages were in scope
  for this pass and they share these exact class names. **If a future pass wants the archive-style
  treatment on `/magazine` or the author page too, extend `.arc-*` rather than repurposing
  `.mag-issue-*`/`.masonry-rand` in place.**
- Confirmed genuinely dead, left untouched: `IssueCarousel.tsx`/`ShopCarousel.tsx` (zero
  importers) and the pre-existing dead `.shop-card`/`.shop-price-tag`/`.shop-caption*` CSS.

**Current spacing**: `.arc-section` vertical padding `clamp(24px,3vw,36px)`, `.join-section`
`clamp(28px,3.5vw,48px)`, `.masthead` top padding `clamp(28px,4vw,56px)` (flat `14px` below
`640px` — the clamp's floor reads as disproportionately large on short mobile viewports, so
mobile gets its own value rather than inheriting the desktop clamp), `.masthead h1` font-size
`clamp(28px,4vw,46px)`. The `.arc-hdr` row above "Right Now" is an empty `<div>` (no heading/link,
just the hairline divider `.arc-hdr` itself draws). `.hpv2 .wrap` is the one shared `max-width:
1328px` column rule every section (including `.masthead`'s own content) uses — don't reintroduce
a second, more-specific `max-width` override scoped to just one section, that's what caused an
earlier column-width mismatch between "Right Now" and the sections below it.

**Real bug, worth remembering**: `.masthead`/`.masthead h1`/`.masthead h1 em`/`.masthead p.sub`
were briefly left as **bare, unscoped selectors** in this file — since `homepage-v2.css` loads
site-wide (not homepage-only), those rules leaked onto any other page with an element literally
named `.masthead`, padding `/lifestyle`'s completely unrelated `ShopHeader.tsx` masthead.
**Every rule in this file must be scoped to `.hpv2` (the homepage's own wrapper div) — never
write a bare `.masthead` (or similar generic-sounding class) selector here, even for a quick
tweak.**

**MoveeeZone hero rebuild** (mockup-first, Artifact `homepage-redesign-mockup.html`): headline
"Culture doesn't happen *to* you. It happens because of you."; the `.mz-eyebrow` badge and
`.mz-trust` line are removed; secondary CTA is "Read the Magazine" (anchors to `id="magazine"`
around the editorial sections). The Membership tier-card section was removed entirely per
explicit feedback — the download strip now stands alone in its own `mz-section
mz-section--bordered`; `.mz-tier-*` CSS is left in place, unused (dead but harmless, generic
button classes). Hero visual is a single full-width `aspect-ratio: 4/5` framed photo
(`.mz-hero-photo-frame`, `object-fit: cover`) with the floating quote card/points-chip
overlapping its edges at fixed small offsets — not the earlier rotated-photo-strip collage. "From
The Magazine" renders via a new, additive `.mg-cover-*` class family in `magazine.css`
(deliberately **not** a modification of `.mg-hero`/`.mg-hero-main`, which `MagazineArchiveWrapper.tsx`
still depends on for its own layout) — image left, kicker/title/dek/"Read the full story →" on
the right, using `coverStory.excerpt`/date already on `STORY_FIELDS_FRAGMENT`. **Lesson**: this
page is assembled from three separately-maintained components (`MoveeeZone.tsx`,
`HomepageContent.tsx`, `MagazineSpotlight.tsx`) — a mockup-fidelity pass must check all three
individually; checking only one missed a leftover literal "Moveee Magazine" eyebrow in
`MagazineSpotlight.tsx` that the mockup had explicitly dropped.
- *(Not verified live this pass.)*

### "The Edit" pinned to News category + plain-white magazine background (August 2026)

Fixes against `/magazine` and its edition pages (`/magazine/africa`, `/uk`, `/us` all render the
same `MagazineArchiveWrapper` with no props). **Root bug class, hit four separate times**: several
sections (The Edit, Opinions & Essays, The Lane, The Free Critics) used to be positional slices
(`stories.slice(12, 16)` etc.) of one generic pool, so each showed whatever category/series
happened to land in that numeric range rather than its intended taxonomy. All four are now their
own fetch, pinned to a real taxonomy, run in parallel with the main pool:
- **The Edit** → `GET_STORIES({ first: 7, categoryName: "news" })`. News is the one category
  **excluded wholesale** from every other section (hero/sidebar/band/etc.), not just from the 7
  posts picked here — a standing, explicit request. Main pool fetch bumped to `first: 40` to leave
  headroom after the exclusion.
- **Opinions & Essays** → `GET_STORIES({ categoryName: "viewpoints", first: 12 })`, rendered as 4
  equal columns (`repeat(4,1fr)` ≥900px, 2-up ≥640px, 1-up below) — no oversized "lead" card.
- **The Lane** (renamed from "In Focus") and **The Free Critics** (renamed from "Quick Reads") →
  `GET_SERIES_STORIES({ series: "the-lane" })` / `"the-free-critics"` (`first: 48` buffer, sliced
  to 5/4 client-side). `digestStories`/`.mg-digest*` class names are unchanged, only the heading
  text and taxonomy source changed.
- **Dedupe is top-pool-first, by id — not a taxonomy-wide exclusion for any of these three.** The
  top pool (Hero + "More This Week" + Featured Stories, News already excluded) picks its posts
  *first*; those ids become `usedByTopIds`; Opinions/The Lane/The Free Critics then filter their
  own taxonomy pool against `usedByTopIds` before slicing to their needed count — so the single
  best/most-recent story site-wide always wins the Hero slot even if it also carries a Viewpoints
  tag or sits in a pinned series. **If you add a new pinned section, give it this same "fetch a
  buffer, filter against `usedByTopIds`, then slice" treatment** — don't compute pinned sections
  before the top pool, and don't blanket-exclude a whole category/series the way News is excluded
  (News is the one deliberate exception).
- All decorative section-eyebrow kicker labels ("Curated", "Selected", etc.) were removed from
  `MagazineArchiveWrapper.tsx`/`EditorialSection.tsx` — each section now leads straight with its
  `<h3>`. `.mg-sec-label` CSS is left, unused. `.mg-hero-eyebrow` (the "★ {Category}" badge on the
  hero story) is live per-article metadata and was deliberately left alone.

**Magazine background is pure white via a dedicated layout wrapper, not a global change** —
`globals.css`'s `body` has a sitewide fixed `body::before` SVG "paper grain" texture
(`z-index: 100`) that dulls anything under it, including sections already on `var(--paper)`. Kept
sitewide (homepage/shop/etc. still want it); `apps/site/app/magazine/layout.tsx` wraps every
`/magazine/*` route in a `.mg-page-white` div (`z-index: 101; background: var(--paper)`) that
paints solid white above the grain for that whole route tree — one file, no per-page changes.

**Current state — section tints, chrome, alignment**: every `.mg-*` section (Featured Stories,
Culture News/`.mg-edit`, The Free Critics) is now plain white (`background: var(--paper, #fff)`),
not the `#F2F2F2` tint they briefly had — a deliberate "calmer page" request. The `border-top`
dividers between adjacent sections stayed (still read fine as plain dividers on white).
`.mg-filter-pill` is also flattened to `var(--paper, #fff)` with its existing border for
affordance. `.mg-cta-band`'s dark `var(--ink)` background is deliberately untouched — a CTA accent
block, not a generic section tint. "Culture News"'s lead card (`.edit-lead`) has **no card chrome
at all** — no background/radius/shadow, just a rounded image (`.edit-lead-img`) with text flowing
underneath; the date sits beside the category (`.edit-lead-meta`, a flex row), not pinned to the
card's bottom. `.mg-nav`'s `border-bottom` under the category tabs/dropdowns was removed (the
active-tab underline is a separate, unrelated rule and stays).

**Alignment — every section uses one shared column shape; three independent bugs, same root
cause.** `.mg-head` (nav/filter row), `.mg-edit`'s padding placement, and `.mg-portrait-scroll`
(The Lane's card row, a sibling of — not nested inside — its own header) were each found missing
the shared `max-width: calc(1200px + 128px); margin: 0 auto; box-sizing: border-box;` treatment
that every other section's *inner* div carries, while a sibling element in the same section had
it — each time producing a visible left/right misalignment against the rest of the page at wide
viewports. **The canonical shape for a tinted section**: outer div carries background/border/
vertical-padding only; inner div carries the max-width/margin/horizontal-padding together (same
shape as `.mg-band`/`.mg-digest`/`.mg-opinions`) — `.mg-edit`/`.mg-edit-inner` were fixed to match
this shape, including at both mobile breakpoints (`1024px`/`768px`), where the padding split must
be mirrored too, not just at the base/desktop rule. **If a future section still looks misaligned,
check every element that renders visible content for it, not just its header/title wrapper** —
this bug recurred three times because each pass only checked the one element it happened to be
looking at.

### Cross-page mockup-fidelity audit + fixes (August 2026)

Moved to `docs/claude-md-archive.md` (historical visual-rebuild / build-fix pass — superseded or no longer actionable; see that file for full detail if ever needed).

### Homepage queries (Site A) — current state
`lib/fetchHomepageData.ts` now fetches only 5 queries (down from 10):
stories, products, latest issue, interviews, series batch.
Events, directory, quotes, pulse, origins removed from homepage.

**Edition story-scoping migrated from Tags to the `country` taxonomy (July 2026).** This
was previously dead code — `HomepageContent.tsx` accepted `coverStory`/`stories`/`products`/
`interviewStories`/`seriesX` as props but only ever rendered `latestIssue`, so the
Tags-based (`tag: "uk"/"us"/"africa"`) edition filtering in `fetchHomepageData.ts`'s Stories
section had zero visible effect on `/`, `/uk`, `/us`, `/africa` (which are themselves
`robots: { index: false }`, not indexed). Per explicit user direction this was turned into a
real, live feature rather than left dead or deleted — `HomepageContent.tsx` now actually
renders `coverStory` (as a `.mg-hero`) and `stories` (as a `.mg-band`/`.mg-filtered-grid`,
reusing `apps/site/app/magazine.css`'s existing card classes) below `MoveeeZone`.
`products`/`interviewStories`/`seriesTheRadar`/etc. are still computed-but-unused — that's a
separate, unrelated dead-code question, deliberately out of scope for this pass (which was
specifically about country-taxonomy geotagging).

- **`country` is a JetEngine-registered taxonomy, not registered anywhere in this repo** —
  bridged into WPGraphQL via `moveee-graphql-bridge.php`'s `register_taxonomy_args` filter
  (confirms `graphql_single_name: country` / `graphql_plural_name: countries`, matching
  every `country`/`countries` GraphQL query already in `wp.ts`). Confirmed live via REST
  that JetEngine has `show_in_rest` enabled for it — `wp-json/wp/v2/country` (collection),
  `wp-json/wp/v2/posts?country={id}` (filter), and `_embed`'s `wp:term` all expose real term
  data (id/name/slug), which is what makes both the web REST helper below and the mobile
  `country` field (see "Mobile: country field" below) possible at all.
- **The `country` taxonomy had real data-hygiene issues** — duplicate terms for the same
  country (`uk` vs `united-kingdom`, `united-states` vs `united-states-of-america`,
  `ivory-coast` vs `cote-divoire`), plus several non-country terms mixed in (person names
  like `rema`/`usain-bolt`/`helon-habila`, labels like `book-review`/`exhibition`/`review`).
  `EDITIONS[...].countrySlugs` (`packages/utils/editions.ts`) is a deliberately curated
  allow-list of only the real, verified-live country slugs per edition (including known
  duplicate-slug variants for UK/US), not a blind dump of every term — an unmatched/junk
  slug is simply never in the list, so it's naturally excluded without needing the taxonomy
  itself cleaned up.
  **The duplicate-term half of this is now fixed automatically, not just worked around.**
  `Culture_Country_Cleanup` (`includes/core/class-culture-country-cleanup.php`, hooked on
  `wp_loaded` — not `init`, since JetEngine registers `country` on its own `init` callback
  and this plugin's `culture_community_init` runs at priority 5, so `taxonomy_exists()`
  could still see "not registered yet" on `init`; `wp_loaded` fires after every `init`
  callback at any priority has run, so the taxonomy is guaranteed to exist by then if it
  exists at all) merges `Culture_Country_Cleanup::DUPLICATE_MAP`'s three known pairs
  (reassigns every post via `wp_set_object_terms(..., true)` so other countries already on
  the post are preserved, then `wp_delete_term()`s the empty duplicate) exactly once, gated
  by the `culture_country_terms_deduped` option — same one-time-migration shape as
  `Culture_Hubs::maybe_merge_duplicate_official_hubs()`. Runs automatically on the next
  deploy; no manual WP Admin step needed for these three pairs specifically. **The
  non-country-term half is deliberately still untouched and still manual** — person names
  and generic labels aren't safe to auto-delete (unlike merging two same-country terms,
  there's no unambiguous "correct" side to keep), so that still needs a human pass through
  `/wp-admin/edit-tags.php?taxonomy=country` whenever someone gets to it. If a new
  duplicate pair turns up in the future, add it to `DUPLICATE_MAP` rather than hand-merging
  it in WP Admin — the option gate means a new entry added after the first deploy won't
  re-run automatically on its own; either bump/rename the gate option or run the merge via
  `wp eval` for a one-off addition.
- **No GraphQL bulk country filter exists** — WPGraphQL only exposes single-country lookups
  (`country(id, idType: SLUG) { posts }`, used by `GET_COUNTRY_STORIES` for the
  `/magazine/country/[slug]` archive) — confirmed against the live schema that
  `countryIn`/`countrySlugIn`/etc. don't exist on the `posts` root query's `where` args. WP
  core's REST API, however, natively supports comma-separated term IDs on any
  REST-queryable taxonomy's query var with zero plugin changes — confirmed live:
  `wp-json/wp/v2/posts?country=982,1042,1070` just works. **`getStoriesByCountrySlugs()`
  (`packages/shared/lib/wp.ts`) is the REST path this uses**: resolves slugs → term IDs via
  `wp-json/wp/v2/country?slug=a,b,c`, then fetches `wp-json/wp/v2/posts?country=<ids>&_embed=1`
  and maps the raw REST shape via a new `mapRestStoryToFrontendShape()` — **this is the
  first REST-fallback path for magazine stories in this file**; `STORY_FIELDS_FRAGMENT`-based
  queries (`GET_STORIES` etc.) are otherwise GraphQL-only with no REST equivalent, unlike
  events/directory/newsletters which each have a real `mapRest*ToFrontendShape()`.
  `fetchHomepageData.ts`'s "universal filler" logic (posts with no edition-country match,
  backfilled to pad out the edition's story pool) now derives directly from `countries.nodes`
  already present on the GraphQL-fetched "latest 20" posts (via `STORY_FIELDS_FRAGMENT`) —
  no separate cross-edition-tag-exclusion fetch needed anymore (`GET_STORIES_TAGS` is still
  exported from `wp.ts` but no longer used anywhere).
- **Article page**: the country name in the hero eyebrow (`ar-hero-eyebrow`) is now a
  `Link` to `/magazine/country/{slug}`, matching the category breadcrumb. **Deliberately
  left as plain text**: the TOC sidebar's "Location" meta item (`ar-toc-meta-item`) — its
  siblings (Section/Series/Industry) are all plain text too, so linking only Location would
  read as an inconsistency, not a feature. Also added `contentLocation` (schema.org `Place`)
  to the Article JSON-LD when a country is set.
- **`sitemap.ts`** now includes `/magazine/country/{slug}` for every term returned by
  `GET_FILTERS`'s `countries` field (alongside the pre-existing gap that category/tag/series
  archive URLs are also missing from the sitemap — see `docs/seo-plan.md` — country was
  fixed here since it was in scope, the others weren't).
- **Search**: `SEARCH_POSTS` (`app/api/search/route.ts`) now selects `countries { nodes {
  name slug } }` too; `SearchOverlay.tsx` shows it as part of the result's meta line
  (`"{Category} · {Country}"`) — a display facet, not a server-side filter (no bulk-country
  GraphQL filter exists, per above, so this stays a lightweight addition rather than a full
  faceted-search rebuild).
- **Mobile: country field** — `Article.country?: { name, slug }` added to
  `apps/mobile/src/types/index.ts`. `useMagazine.ts`'s `mapPost()` extracts it from the
  already-fetched `wp:term` embed (every taxonomy attached to the post is already in that
  array, including `country` — no new `_embed`/fetch param needed, same as how `category`
  is already extracted there). Surfaced in `ArticleScreen.tsx`'s TOC bottom sheet as a
  "LOCATION" row (shown only when set), mirroring the web TOC sidebar's scope decision
  above — no new filter UI was built for this pass.

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

Moved to `docs/claude-md-archive.md` (historical visual-rebuild / build-fix pass — superseded or no longer actionable; see that file for full detail if ever needed).

### Member Dashboard — visual rebuild (§9, June 2026)

Moved to `docs/claude-md-archive.md` (historical visual-rebuild / build-fix pass — superseded or no longer actionable; see that file for full detail if ever needed).

### Account Dashboard redesign — Phase 1: Overview + shared AccountNav (July 2026)

**Supersedes the "Full-bleed band pattern" from the §9 rebuild directly above** — that
dark/light-band structure is gone from `/member`; this pass moved the page onto the same
full-width single-column convention as Discover/Events/Stoop/Games (see those sections),
built from a user-approved Artifact mockup after an explicit scope conversation: the user
wants the *entire* account area (Overview, Settings' 6 tabs, Wallet, Coupons, Perks,
Notifications, Analytics, My Events, Referrals, Portfolio, Collection) redesigned for a
"sleek, simple, easily navigable" account section, shipped **phase by phase** rather than
all at once. This is Phase 1: the Overview landing page plus the shared navigation piece
every later phase will plug into. `.mem-*` classes are **deliberately left untouched** —
Settings/Wallet/Perks/Coupons/Notifications/Analytics/Events/Referrals/Portfolio/Collection
still render with them until each gets its own phase; only `/member` itself and its
Overview-only components (`MemberDashboard.tsx`, `MemberBadges.tsx`) were touched.

- **New: `AccountNav.tsx`** (`packages/shared/components/`) — the reusable piece. A
  horizontally-scrollable pill/tab row (`.acct-nav-*`, underline-active style matching
  `SettingsTabs.tsx`'s `.prf-tab` convention) listing every top-level account destination:
  Overview · Wallet · Coupons · Perks · Notifications · Analytics · My Events (Pro-only,
  filtered by an `isPatron` prop) · Referrals · Settings. Active state is `usePathname()`-
  derived (exact match for Overview since every other `/member/*` route would otherwise
  also match it as a prefix; prefix match for the rest, so `/member/settings/profile` etc.
  still highlight "Settings"). **This replaces `MemberNavSelect`'s navigational role on
  `/member` specifically** — `MemberNavSelect` itself is untouched and still used by
  `/member/wallet`, `/member/events`, and `/member/settings/layout.tsx` until those get
  their own phases and adopt `AccountNav` too.
- **New `.acct-*` CSS namespace** (`apps/connect/app/member.css`, appended at the end,
  ~350 lines) — full-width `.acct-page`/`.acct-wrap` (max-width 1100px, no more full-bleed
  bands), `.acct-profile` (lighter avatar+name+tier-pill strip, replaces the old `.mem-hero`
  *on this page only* — `.mem-hero` itself is untouched since 8 other pages still use it),
  `.acct-stats` (5 individual white `radius-xl`/`shadow-card` stat tiles replacing the old
  single flat `.mem-stats-band`), `.acct-card`/`.acct-badges`/`.acct-earn-*` (Achievements
  and How-to-Earn restyled onto the same card language), `.acct-card--upgrade` (dark side
  card, same visual role as the old `.mem-card--dark`).
- **`MemberDashboard.tsx` and `MemberBadges.tsx` rewritten** (both confirmed single-use —
  only `/member/page.tsx` imports either, so no risk to other pages) to render into the new
  `.acct-stat-card`/`.acct-badge` markup instead of the old flat band/grid. `MemberBadges.tsx`
  also gained a "Show all 18" / "Show fewer" toggle (previously always rendered all 18
  badges unconditionally, which was dense) — collapses to 6 by default, sorted
  earned-first as before.
- **`PasskeyBanner.tsx` and `MemberReferralCopy.tsx` kept as-is (component logic
  untouched)** — both are also single-use on this page, so their existing CSS classes
  (`.mem-passkey-banner`, `.mem-referral-*`) were restyled in place (rounded `radius-xl`
  card instead of a full-bleed edge-to-edge band; subtle corner-rounding on the referral
  URL/copy-button pair) rather than given new class names — no JSX changes needed.
- **The old flat ~15-item `MemberNavSelect` dropdown/list is gone from this page** — its
  navigational entries are now `AccountNav`; the handful of genuinely non-account links it
  also carried (Newsletters, Upcoming Events, Magazine, Discover, Quotes Archive, Sign out)
  moved into a small new "Explore Moveee" card in the side column, kept deliberately
  separate from the account nav since they're not account destinations.
- **New "Stoop" card** in the side column — the `myCluster` lookup (already fetched
  server-side, previously only surfaced as one line inside the giant nav list) now gets its
  own small card, same pattern as the Upgrade/Referral cards.
- *(Not verified live this pass.)*

### Account Dashboard redesign — Phase 2: Wallet, Coupons, Perks (August 2026)

Mockup-first as usual — built as an Artifact, corrected once for a stale detail (the mockup
used the old cream `#f3ece0` hex directly instead of the actual `--paper` token, which is
`#ffffff` now per the earlier cream-removal pass — always pull the live token value, don't
hardcode a remembered hex), then approved and built for real.

- **Wallet** (`/member/wallet`) — full rebuild. `page.tsx` swapped `.mem-hero` +
  `MemberNavSelect` for `.acct-page`/`.acct-wrap` + `<AccountNav isPatron={...} />`, same
  shape as Phase 1. `WalletClient.tsx` gained a new stat row above the tab switcher (`.wal-stats`
  — dark `.wal-stat-card--balance` tile leading, plus Earned (30d)/Spent (30d) tiles computed
  client-side from the existing `entries` ledger prop, no new API call). Every inline
  `style={{}}` in the transaction list and cash-out form was replaced with new `.wal-*`
  classes (`apps/connect/app/member.css`) — transaction rows, field/label/input, the fee
  breakdown box (`.wal-fee-box`), the passkey-required banner, and the non-Pro upsell card
  (`.wal-upsell`, dark card matching `.acct-card--upgrade`'s visual role). **Zero business-logic
  changes** — `doStepUp()`, `handleCashout()`, per-currency (GBP/USD/NGN) field validation, and
  the 40% flat fee calculation are all untouched, only the rendering layer changed.
- **Coupons** (`/member/coupons`) — full rebuild, same shell swap. `CouponsClient.tsx`'s
  Active/Used/Expired sections moved from ad hoc inline styles to `.cpn-*` classes: Active
  renders as a `.cpn-grid` of `.cpn-card`s (success-tinted border, flips to
  `.cpn-card--warn` when `daysUntil(expires_at) <= 3`, matching Phase 1's Wallet visual
  language), Used/Expired render as `.cpn-row-list` rows with opacity-reduced
  `.cpn-row--used`/`--expired` states and a trailing `.cpn-row-status` pill. Fetch logic
  (`/api/wallet/redemptions`) untouched.
- **Perks** (`/connect/perks`) — deliberately light touch, per the mockup. `perks.css`
  already had its own well-developed card language (radius-xl/shadow-card, JetBrains
  Mono labels, Fraunces titles) close to the `.acct-*` convention, so it was **not**
  rebuilt — only `<AccountNav isPatron={isPatron} />` was inserted above the existing hero,
  shown only when `session.user` exists (Perks stays publicly browsable for logged-out
  visitors, unlike Wallet/Coupons which both redirect to login — the nav simply doesn't
  render for them). No CSS block needed for this page; `member.css`'s `.acct-nav-*` rules
  are already loaded globally via `apps/connect/app/layout.tsx`.
- *(Not verified live this pass.)*

### Account Dashboard redesign — Phase 3: Settings (August 2026)

Shell-only, per the mockup and the same "light touch" reasoning used for Perks in Phase 2
— the 6 tab-content components (`ProfileEditor.tsx`, `DirectoryProfile.tsx`,
`InterestEditor.tsx`, `NewsletterPreferences.tsx`, `NotificationPreferences.tsx`,
`PasskeyManager.tsx`) already render into `.mem-card`/`.mem-card--editable` (12px radius +
shadow, ochre-tinted border on editable cards) and `.mem-field-*`/`.mem-toggle` classes
from the June §10 rebuild directly below — that styling is **already** visually
equivalent to the `.acct-card` language (same radius, same shadow weight, just a
different literal shadow value), so none of it was touched. Only `settings/layout.tsx`
changed.

- **`settings/layout.tsx`** — swapped the dark `.mem-hero` + `.mem-settings-back` link +
  `.mem-settings-grid` two-column split (main content + a `MemberNavSelect` side-rail
  duplicating ~9 links, several of them not even account destinations) for the same
  `.acct-page`/`.acct-wrap`/`.acct-profile` + `<AccountNav isPatron={...} />` shell every
  other Phase 1–3 page now uses. `SettingsTabs.tsx` itself is **unchanged** — it already
  used the existing `.prf-tab` underline convention (the same one `WalletClient.tsx`'s
  History/Cash Out switcher uses), which reads correctly as a second, subordinate level of
  navigation sitting right below `AccountNav` without needing a new tab style invented for
  it. (An earlier mockup draft for this phase sketched a plain-sans tab style for
  `SettingsTabs` before the real `.prf-tab` CSS was re-checked — reusing the existing
  convention was the right call once it was clear `.prf-tab` already does this job
  elsewhere in the same shell.)
- **Tab content is now wrapped in a `maxWidth: 640` flex column** (inline style in
  `layout.tsx`, not a new CSS class) instead of the old grid's `minmax(0,1fr)` main column
  — needed because `.mem-card` has no max-width of its own (by design, since e.g.
  Wallet's cash-out grid wants it to stretch), so rendering the six settings pages
  directly into the full 1100px `.acct-wrap` without this wrapper would have stretched
  every field-list/toggle-row card edge-to-edge, which reads badly for a form.
- *(Not verified live this pass.)*

### Account Dashboard redesign — Phase 4: Notifications + Analytics (August 2026)

- **Notifications** (`/member/notifications`) — full rebuild, same as Wallet/Coupons in
  Phase 2. `NotificationsClient.tsx` was entirely inline `style={{}}` objects (the same
  debt state Wallet/Coupons were in before their own rebuild) — every row, the header bar,
  and the load-more footer moved onto new `.ntf-*` classes (`apps/connect/app/member.css`).
  `page.tsx` swapped `.mem-hero` + the `mem-settings-grid`/`MemberNavSelect` side-rail
  (four links, all already covered by `AccountNav`) for the standard `.acct-page`/`.acct-wrap`
  shell. **Zero behavior changes** — `markRead()`, the optimistic read-state update, and
  the 20-per-page `visibleCount` pagination are byte-for-byte the same logic, only the JSX
  markup and class names changed.
- **Analytics** (`/member/analytics`) — lighter touch, matching the mockup. `StatCard`
  already had radius+shadow going in; it was moved onto `.an-stat` classes and its ad hoc
  `grid-template-columns: repeat(auto-fill, minmax(140px,1fr))` replaced with a fixed
  `.an-stats` 6-column grid (3-col at ≤900px, 2-col at ≤560px — same breakpoint shape as
  Phase 1's `.acct-stats`). The two chart sections and the Top Posts list moved from
  `.mem-card`/raw inline-styled divs onto `.acct-card`/`.an-post-row` — chart-drawing logic
  in `BarChart`/`LineChart` (plain SVG, no library) is completely unchanged, only the
  wrapping card markup differs. The redundant "← Back to Dashboard" link that used to sit
  below the Top Posts card was removed — `AccountNav`'s Overview item already covers this,
  same reasoning as every other phase.
- *(Not verified live this pass.)*

### Account Dashboard redesign — Phase 5: My Events + Referrals (August 2026)

Both pages were entirely inline-styled going in — same debt state Wallet/Coupons/
Notifications were in before their own rebuilds — so both got full rebuilds, same
treatment as those.

- **My Events** (`/member/events`) — `page.tsx` extracted the avatar/name/tier-pill strip
  into a shared `profileStrip` JSX const (both the Pro and non-Pro branches render it
  identically, only the body below differs) plus `<AccountNav isPatron={isPatron} />` on
  both. The non-Pro branch's upgrade gate now reuses `.evt-upsell` — the exact same dark
  full-width upsell card shape as Wallet's cash-out gate in Phase 2, not a new pattern.
  `EventsClient.tsx`'s expandable event rows + attendee sub-lists moved onto `.evt-row`/
  `.evt-attendee-row` classes; `toggleEvent()`/`downloadCsv()` logic is untouched. The
  card itself provides its own `.acct-card` wrapper + header (matching Wallet/
  Notifications' pattern of the client component owning its card, not the page
  double-wrapping it).
- **Referrals** (`/member/referrals`) — same shell swap. `ReferralsClient.tsx`'s share-link
  card, 3-tile stat row (`.ref-stats`/`.ref-stat`, same shape as `.an-stats`/`.an-stat` from
  Phase 4), badge-progress bars (`.ref-track`/`.ref-fill`, flips to `.ref-fill--done` at
  100%), invited-friends list, and the numbered "How It Works" steps all moved off inline
  styles onto `.ref-*` classes. `handleCopy()`'s clipboard logic and the `useEffect` fetch
  fallback (for when `initialData` is null) are untouched.
- **`MemberNavSelect.tsx` deleted** (`packages/shared/components/`) — Phase 5 was the last
  page still importing it (`/member/events`'s side-rail); confirmed zero remaining
  importers repo-wide via grep before removing, rather than leaving it as dead code. If a
  future phase needs a flat link-list component again, this is gone — don't assume it
  still exists.
- *(Not verified live this pass.)*

### Account Dashboard redesign — Phase 6: Portfolio + Collection (August 2026, final phase)

Last phase of the initiative that began with Phase 1's Overview rebuild — see that entry
for the full "Everything, page by page" scope this closes out. Two different starting
points again, same as Phase 4's Notifications/Analytics split:

- **Portfolio** (`/member/portfolio`) — fully inline-styled going in, full rebuild.
  `page.tsx` swapped `.mem-hero` for the `.acct-page`/`.acct-wrap`/`AccountNav` shell.
  `PortfolioManager.tsx`'s locked state (below Taste Maker/500 rep), pinned-posts list,
  portfolio-item list (reorder/edit/delete), and the add/edit `ItemForm` all moved onto
  new `.pf-*` classes. All state/fetch logic — `saveItems()`, `togglePin()`,
  `moveUp()`/`moveDown()`, the picker fetch in `openPicker()` — untouched.
- **Collection** (`/member/collection`) — different case: it already had real
  `.collection-*` CSS classes, not inline styles, so `CollectionTabs.tsx` itself needed
  no rebuild, only two fixes: (1) `.collection-grid`/`.collection-card` were still on the
  old flush "1px-gap, no radius, hairline-border" grid pattern the site-wide
  border-radius convention retired — bumped to individual `radius-xl`/`shadow-card` cards
  matching every other rebuilt grid in this file (Discover, related-stories, etc.);
  (2) **found and fixed a real bug**: three `.collection-*` rules referenced
  `font-family: 'Overpass Mono'`, which is not loaded anywhere in `apps/connect` (no
  `@font-face`, no `next/font` import) — confirmed via repo-wide grep before touching it.
  It had been silently falling back to the browser's default monospace this whole time,
  quietly off-brand from the `JetBrains Mono` used everywhere else. Fixed to
  `'JetBrains Mono'`. Also removed a redundant `maxWidth: 900, margin: "0 auto"` inline
  wrapper in `CollectionTabs.tsx` — content now flows left-aligned inside `.acct-wrap`
  like every other rebuilt page in this initiative, rather than auto-centering inside it
  (which read inconsistently once the two-column `.mem-body` shell was gone).
- **`AccountNav.tsx` gained two new entries** (`packages/shared/components/`) — Portfolio
  (🎨) and Collection (🔖), inserted after Referrals and before Settings. Neither existed
  in the nav before this phase; both pages were previously only reachable via the old
  `MemberNavSelect` link lists on `/member/settings` and `/member` (both already removed
  in earlier phases), meaning **Portfolio and Collection had no navigational path to them
  at all going into this phase** — a real gap, not just a visual one, closed here.
  Portfolio has no Pro/rep gating at the nav-item level (`PortfolioManager.tsx` shows its
  own locked-state message inline when reputation is below 500, same as before); neither
  entry is filtered by `isPatron` the way `events` is.
- **This closes the initiative** — all 12 account-area destinations (Overview, Wallet,
  Coupons, Perks, Settings' 6 tabs, Notifications, Analytics, My Events, Referrals,
  Portfolio, Collection) now share the same `.acct-*` shell and `AccountNav`. If a future
  account-area page is added, follow this same pattern from the start rather than
  reintroducing `.mem-hero`/a bespoke side-rail.
- *(Not verified live this pass.)*

### Member Settings — visual rebuild (§10, June 2026)

Moved to `docs/claude-md-archive.md` (historical visual-rebuild / build-fix pass — superseded or no longer actionable; see that file for full detail if ever needed).

### Wallet, Perks & Coupons — visual rebuild (§11, June 2026)

Moved to `docs/claude-md-archive.md` (historical visual-rebuild / build-fix pass — superseded or no longer actionable; see that file for full detail if ever needed).

### Feed Card Detail Drawers — visual rebuild (§15, June 2026)

Moved to `docs/claude-md-archive.md` (historical visual-rebuild / build-fix pass — superseded or no longer actionable; see that file for full detail if ever needed).

### Member Directory & Public Profiles — visual rebuild (§12, June 2026)

Moved to `docs/claude-md-archive.md` (historical visual-rebuild / build-fix pass — superseded or no longer actionable; see that file for full detail if ever needed).

### Notifications & Analytics — visual rebuild (§13, June 2026)

Moved to `docs/claude-md-archive.md` (historical visual-rebuild / build-fix pass — superseded or no longer actionable; see that file for full detail if ever needed).

### Authentication Flow — visual rebuild (§17, June 2026)

Moved to `docs/claude-md-archive.md` (historical visual-rebuild / build-fix pass — superseded or no longer actionable; see that file for full detail if ever needed).

### Overlays & Micro-interactions — visual rebuild + dark-mode hex-color fix (§18, June 2026)

Moved to `docs/claude-md-archive.md` (historical visual-rebuild / build-fix pass — superseded or no longer actionable; see that file for full detail if ever needed).

### Dark-mode hex-color audit — full sweep of `packages/shared/components/pulse/` and `connect/` (June 2026)

Moved to `docs/claude-md-archive.md` (historical visual-rebuild / build-fix pass — superseded or no longer actionable; see that file for full detail if ever needed).

### Dark-mode sweep #2 — CSS-file structural chrome + two undiscovered page-scoped token gaps (July 2026)

Moved to `docs/claude-md-archive.md` (historical visual-rebuild / build-fix pass — superseded or no longer actionable; see that file for full detail if ever needed).

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

## Mobile quote-share QR code led to a 404 — wrong URL pattern for native quotes (fixed September 2026)

User-reported: scanning the QR code on a shared quote's image (mobile app, `QuoteShareCard.tsx`)
led to a 404. Root cause was a `/community/{slug}` share-URL pattern applied to the **wrong**
content type. This codebase has two structurally distinct "quote" things:

1. **Native quotes** — `culture_quote` CPT posts (editorially seeded or system-authored), surfaced
   in the mobile feed as `FeedItem.type === "quote"`, rendered via `QuoteCard` →
   `QuoteDetailModal.tsx`. Their real detail page is `/quotes/{databaseId}-{slug}` on
   `web.themoveee.com` — a **compound** URL segment (`apps/connect/app/quotes/[slug]/page.tsx`
   parses only the leading numeric id via `segment.split('-')[0]`, then does an ID-based GraphQL
   lookup, not a slug-based one).
2. **Composer-submitted quote posts** — real `culture_post` entries created via the composer's
   "Update family" quote template (`_template_type = 'quote'`), surfaced as `FeedItem.type ===
   "community"` (`item.templateType === "quote"`). Their real detail page genuinely is
   `/community/{slug}`.

`QuoteDetailModal.tsx` (and, duplicated verbatim, `PostDetailSheet.tsx`'s `TemplateQuote`) built
the QR/share URL as `` item.slug ? `https://themoveee.com/community/${item.slug}` : ... ``
unconditionally — correct for case 2, but wrong for case 1 on two counts: wrong page
(`/community/[slug]` only ever queries WordPress's `community-posts` REST base, i.e. the
`culture_post` CPT — `packages/shared/lib/community-wordpress.ts`'s `getCommunityPostBySlug()`
has zero knowledge of `culture_quote` at all, so the lookup always comes back empty →
`notFound()`) **and** wrong slug shape (`item.slug` on a native quote is the bare WP `post_name`,
never the `{id}-{slug}` compound `/quotes/[slug]` expects).

**The fix didn't need a new URL-construction scheme** — the PHP feed mapper already emits a
correctly-shaped, per-type relative path on every `FeedItem.href`
(`class-culture-mobile-api.php`'s `get_quote_feed_items()`: `'href' => '/quotes/' . $post->ID .
'-' . $post->post_name`, vs. `get_community_feed_items()`'s `'href' => '/community/' .
$post->post_name`) — it just wasn't being used for sharing. New shared helper
`apps/mobile/src/utils/shareUrl.ts` (`shareUrlFor(item)`) builds off `item.href` instead of
hand-rolling a path from `item.slug`, with domain routing (`themoveee.com` for `editorial`,
`web.themoveee.com` for everything else). Kept as its own tiny module rather than exported from
`FeedItemCard.tsx` — that file already imports `QuoteDetailModal.tsx`, so exporting the helper
from there and importing it back into `QuoteDetailModal.tsx` would have created a circular
import. `FeedItemCard.tsx`'s own local `shareUrlFor()` (previously used for the native
`QuoteCard`'s inline share button and `FeedReactionBar`'s generic share prop — and itself missing
a `"quote"` branch, silently falling into the same broken `/community/{slug}` fallback) was
deleted in favor of importing this new util.

**If a future share/QR/deep-link feature needs a content item's public URL, always build off
`item.href`, never re-derive one from `item.slug` + a hardcoded path segment** — `href` is the
one field the backend already guarantees is shaped correctly per item type; a hand-rolled
per-caller path is exactly how this bug happened (twice, in near-identical duplicated lines).

## Quotes link to the Directory (September 2026)

A quote used to point at nothing. Who said it was a freeform
`culture_quote_author` **taxonomy term** — a second, lower-quality person
registry shadowing the Directory — and where it came from was a plain
`_quote_source` string. `_quote_type` (`Person`/`Book`/`Film`/`Speech`/`Song`)
mapped almost exactly onto `culture_dir_type`, so someone had already reached
for the right model and stopped one field short of the pointer. Net effect: the
most shareable object in the app (quotes have share cards, QR codes and a
permalink kept alive specifically so shares resolve) produced no signal, and a
line could never appear on the entry of the book or person it belonged to.

**Two links, both optional.** `_linked_directory_id` = the **work** it came
from; `_quote_author_directory_id` = the **person** who said it. Optional is
load-bearing, not laziness: a proverb, an overheard line and a `Speech`-type
quote (there is no `speech` `culture_dir_type`) legitimately have neither.

- **The work reuses `_linked_directory_id`, the same key community posts use**,
  so every reverse-lookup that already queries it keeps working. Verified safe
  before doing it: all four readers that aggregate off that key —
  `Culture_Directory::recompute_directory_aggregates()`,
  `handle_directory_posts()`'s meta_query, `Culture_Reading_Tracker::
  get_reading_stats()`'s join, and the mobile entry query — scope to
  `post_type = 'culture_post'`, so **a quote can never inflate a review count,
  a star average or a rating histogram**. Re-check that before adding a fifth
  reader.
- **`Culture_Directory::quotes_for_directory_entry()`** is the one lookup, used
  by both surfaces. It **unions** the two keys, which is what makes a person's
  entry show everything they said regardless of source while a work's entry
  shows lines from that work. Raw SQL resolve-to-IDs, never a two-branch OR
  `meta_query` — that is the exact shape that hung the `culture_event` endpoint
  for 20s+ in production.
- **Quotes come back from the endpoint that already powers reviews**
  (`/directory/{id}/posts` → new `quotes` array + `summary.total_quotes`), not a
  parallel route, so the entry page needs no second fetch. Rendered under
  reviews on both web (`.dir-quote-*` in `directory.css`) and mobile. On a
  `person` entry the heading reads "Lines people saved" and each line shows its
  **source**; elsewhere it reads "Lines saved from this" and shows the **author**
  — repeating the page's own title on every row is noise.
- **The composer's author field is a `DirectorySearch`, not a text input**
  (`typeFilter="person"`), on both platforms. The freeform input stays
  underneath, shown only while nothing is picked, as the escape hatch for an
  unattributable line — "Anonymous" should not become a person entry to satisfy
  a required field. The **source** field is a picker only where the type maps to
  something the Directory holds (`QUOTE_SOURCE_TYPES`: Book→`book`+Google Books,
  Film→`film`+TMDB, Song→`album`+Spotify); `Person` hides it (the person *is*
  the source) and `Speech`/none fall back to freeform. **That map is mirrored in
  three places** — `SubmitPost.tsx`, `NewPostScreen.tsx` and the PHP backfill —
  same no-shared-source-of-truth caveat as every other constant trio here.
- **The freeform strings are still written exactly as before.** The taxonomy
  term and `_quote_source` meta are unchanged, so every existing reader (feed
  mapper, `/quotes/[slug]`, share cards, GraphQL) keeps working whether or not a
  link was supplied. The ids are purely additive.
- **`apps/connect/app/api/quotes/create/route.ts` destructures the body
  explicitly rather than spreading it**, so a new field is silently dropped
  unless named there. It nearly was. Check that route when adding any quote field.
- **Backfill**: `Culture_System_Author::maybe_link_quotes_to_directory()`
  (`wp_loaded`, gated by `culture_quotes_directory_linked`) resolves existing
  quotes' author terms and source strings against directory titles.
  **Exact, case-insensitive match only — never fuzzy, and don't "improve" it
  later.** A near match attributes words to the wrong person *on their own entry
  page*: an unlinked quote is merely invisible, a mislinked one is a fabrication.
  A title shared by two entries of the same type is skipped for the same reason.
  Batched 300/request and resumable — the gate is only set once a pass finds
  nothing left, so a large archive finishes over several requests instead of
  timing out.

**Pre-existing bug found and fixed in the same pass**: the mobile directory
entry endpoint read `_culture_linked_directory` and `_community_template_type`,
**neither of which is written anywhere in this codebase** (the composer writes
`_linked_directory_id` and `_template_type`). That section had therefore never
rendered a single post on mobile. If a mobile entry screen suddenly starts
showing reviews it never had, this is why.

**Verified**: `php -l` clean on all four touched PHP files; `tsc --noEmit`
**exit 0** on `apps/connect` and `apps/site`, `apps/mobile` at its documented
37-error baseline with none in touched files; `directory.css` brace-balanced
(199/199); `scripts/check-brand-language.sh` shows only the four pre-existing
Literary/comment hits, none in touched files. Both new queries were **executed
against real tables** rather than reasoned about — the union lookup returns both
a work-linked and an author-linked quote newest-first, and the backfill candidate
query correctly flags partial links while excluding a fully-linked quote. **Not**
tested against a live WordPress: needs the plugin redeployed (no new table, so no
`CULTURE_VERSION` bump), then a real round trip — post a quote with each type,
confirm it appears on both the person's and the work's entry pages, and check the
backfill actually linked existing quotes rather than silently matching nothing.

**No web-side (`apps/connect`/`packages/shared`) equivalent exists** — the QR-code-on-shared-
image feature is mobile-only (`QuoteShareCard.tsx`); confirmed via grep that no `QRCode`/`qrcode`
usage exists anywhere under `packages/shared/components`.

Verified via a brace/paren-balance check on all four touched/new files (no `node_modules`
installed in this sandbox, so `tsc --noEmit` couldn't run) and a grep confirming no other
`item.slug`-based `/community/{slug}` construction elsewhere in `apps/mobile/src` is reachable
by a native-quote `FeedItem` (the other two matches — `SavedArticlesScreen.tsx`,
`DirectoryPostsScreen.tsx` — both only ever build this href for genuine `type: "community"`
items, and `PostDetailScreen.tsx`'s two literal share-URL constructions are only ever reached via
`nav.navigate("PostDetail", { item: { type: "community", ... } })` call sites, never a quote —
left as-is to keep this fix scoped). Re-check the real request-code → scan → `/quotes/{id}-{slug}`
round trip on a real device before considering this fully closed.

---

## Quotes feed merge — synthetic system author + seeding retirement (September 2026)

First step of a longer-term plan to retire the standalone `/quotes` product and make
`culture_quote` posts fully feed-native — the user's explicit goal, stated as "how can we
merge web.themoveee.com/quotes to work as part of the feed not a separate product? so we
can retire /quotes/". Quote cards already rendered natively inline in the unified feed on
both platforms (`FeedCard.tsx`'s quote branch on web, `QuoteCard` in
`apps/mobile/src/components/community/FeedItemCard.tsx` on mobile — neither ever linked
out to `/quotes/[slug]` to render; `href` is only used for the ReactionBar's share URL) —
so this pass tackled the two specific gaps flagged when the merge was scoped: seeded
quotes had no valid author identity, and the auto-seeding automation was confirmed
non-functional and explicitly approved for retirement. The standalone `/quotes` pages
themselves are **not yet retired** — that's a later step, to be scoped again (same
`AskUserQuestion` treatment as the `/visuals` retirement) once the author-archive-view and
other `/quotes`-only functionality (like/report/audit endpoints, sitemap entry, SEO
`Quotation` JSON-LD, the global `SearchModal`'s quote content-type) have a plan.

**Synthetic system author (`Culture_System_Author`, new class,
`culture-community/includes/core/class-culture-system-author.php`)** — editorially-seeded
quotes have no real community submitter; `/api/quotes/auto-populate` (see retirement below)
always POSTed `user_id: 0`, and `handle_create_quote()`'s fallback chain
(`user_id → get_current_user_id()`) also resolved to 0 for an unauthenticated API-key
request, so every seeded quote's `post_author` ended up `0`. `get_userdata(0)` returns
`false`, so `get_quote_feed_items()`'s `communityAuthor`/`communityAuthorUsername`/
`communityAuthorAvatar` fields (which mobile's `QuoteCard`/`CommunityQuoteCard` are already
built to read, same as every other feed item type) silently rendered blank for these.
Fixed by giving `handle_create_quote()` a third fallback — `Culture_System_Author::get_id()`
— mirroring `Culture_Account_Deletion::get_placeholder_user_id()`'s exact shape: a
lazily-created, login-disabled WP user (`moveee-editors`, display name "Moveee", random
unusable password, `subscriber` role, `_culture_avatar_url` pointed at
`https://themoveee.com/logo-black.png`), cached by the `culture_system_author_user_id`
option so it's only ever created once. `Culture_System_Author::maybe_backfill_quote_authors()`
(hooked on `wp_loaded`, same reasoning as `Culture_Country_Cleanup::init()` — needs the
`culture_quote` post type already registered) is a one-time migration reassigning every
pre-existing `post_author = 0` quote to this account, gated by
`culture_quote_authors_backfilled` — same shape as every other `maybe_backfill_*` in this
plugin. New quotes submitted through the real composer path (`SubmitPost.tsx`'s Update
family) are unaffected — they already carry a real submitter.

**Seeding automation retired** — per explicit user instruction ("the seeding dont even
work autonomously anyways. So I dont mind retiring it"). Removed entirely, not just
disabled:
- The WP-Cron "Quotes seed (weekly)" job (`Culture_Cron::HOOK_SEED_QUOTES`/`seed_quotes()`)
  — removed from `class-culture-cron.php`'s hook registration, `schedule()`/`unschedule()`
  hook lists, and its handler method. A new one-time `maybe_clear_retired_jobs()` (hooked
  alongside the others in `init()`, gated by `culture_cron_retired_jobs_cleared`) clears
  any already-scheduled `culture_seed_quotes` cron-table row on sites that had it —
  otherwise it would keep firing into a `do_action()` with no listener forever, harmless
  but cluttering WP Admin's cron views. If a future job is ever retired the same way, add
  its hook name to `maybe_clear_retired_jobs()`'s list rather than leaving a stale row.
- `/api/quotes/auto-populate` (both `apps/site` and `apps/connect` — the route + its
  `data.ts` curated-quote list) — deleted outright.
- The WP Admin "Quote Seeder" panel on the Directory Tools page (`class-culture-
  directory-tools.php` — the "Seed Moveee Quotes" button, its `ajax_run_quote_seeder()`
  handler and `wp_ajax_culture_run_quote_seeder` registration, its `culture_quote_seeder_
  offset` option, and its JS click handler) — removed, since it called the now-deleted
  route too. The adjacent **"Bulk Quote Importer" panel (CSV paste/upload) is unrelated
  and was left untouched** — that's a manual, non-automated import path, not "seeding."
- `packages/shared/lib/quotes-seeder.ts` trimmed to just `searchSerper()`/
  `SerperQuoteResult` — still needed by `/api/quotes/audit` (a distinct, still-live
  concern: fact-checking *existing* quotes for fabrication, not creating new ones).
  `QUOTE_AUTHORS`, `buildQuoteQueries()`, `fetchVerifiedQuotesForAuthor()`, and
  `runVerifiedQuotesBatch()` were deleted along with their only caller. `gemini.ts`'s
  `searchAndExtractQuotes()` is now unused (kept, per this file's "leave dead code that
  might be needed again" convention) — it has no remaining call site.
- Manual, admin-curated quote creation still works exactly as before (WP Admin post
  editor for `culture_quote`, and the Bulk Quote Importer CSV panel) — only the automated
  discovery/seeding pipeline (curated-list-then-Serper/Gemini-discovery) is gone.

*(Not verified against a real WordPress install this pass. Re-check in WP Admin that a fresh
`culture_quote` created with no author picked still resolves sensibly, and that the Directory
Tools page no longer shows the removed "Seed Moveee Quotes" button.)*

## `/quotes` standalone product retired — bare permalink kept as a share/SEO target (September 2026)

Second, final step of the retirement scoped in the section above — the standalone browsable
`/quotes` product (archive, author archive, its own like/report/comment UI) is now gone. Quotes
render natively inline in the feed on both platforms; this pass removed everything that turned
that same content into a second, separately-browsable "site."

**Removed**: `apps/connect/app/quotes/page.tsx` (archive/browse — its search input was never
wired to anything), `apps/connect/app/quotes/author/[slug]/page.tsx` (author archive),
`packages/shared/components/{QuotesInfiniteGrid,QuoteSubmissionModal,SubmitQuoteTrigger}.tsx` +
`apps/connect/app/quotes.css`, the confirmed-dead `apps/site/components/QuoteSubmissionModal.tsx`
(zero importers, predates this pass), `POST /culture/v1/quotes/like` /
`/culture/v1/quotes/report` (`handle_like_quote`/`handle_report_quote`) and their Next.js proxies
(`apps/connect/app/api/quotes/{like,report}/route.ts`) — this was the standalone product's own
bespoke like/report system, entirely separate from the feed's real reaction system
(`ReactionBar`/`/community/react`), and had no other caller. `apps/site/app/quotes/*` and
`apps/site/app/api/quotes/report/route.ts` were already dead (redirect-shadowed by
`proxy.ts`'s `connectPrefixes`) — deleted as pure cleanup. Links removed: `Footer.tsx`'s Explore
column, `/member`'s `EXPLORE_LINKS` "Quotes Archive" entry, the `/quotes` sitemap entry.

**Kept, deliberately**: `POST /culture/v1/quotes` (`handle_create_quote`) and its mobile mirror
`POST /culture/v1/mobile/community/quote` (`handle_submit_quote`, a pure delegate) —
**a scoping mistake was caught before shipping this**: these were first assumed to be reachable
only from the retired archive's own "Submit a Quote" modal, duplicating the composer's own Quote
tab. That was wrong. `packages/shared/components/pulse/SubmitPost.tsx` (web) posts directly to
`/api/quotes/create` → this exact endpoint, and `apps/mobile/src/screens/community/
NewPostScreen.tsx` posts directly to `/mobile/community/quote` → the exact same delegate. This is
the live backend for the feed-native composer's Quote template on both platforms, not standalone-
product-only — removing it would have broken quote creation entirely, not just retired a browsing
UI. **If you ever need to touch quote creation again, this is the one method
(`Culture_REST_API::handle_create_quote()`) both platforms' composers funnel into** — same
"one implementation, two auth front doors" shape as the community RSVP / follow-system mirrors
elsewhere in this file.

**`/quotes/[slug]` still exists, rebuilt as a bare permalink, not deleted** — per an explicit
product decision: since a quote's `href` (`/quotes/{id}-{slug}`) is the load-bearing destination
for mobile+web share/QR codes (see the "Quote share/QR code 404" fix elsewhere in this file),
`SearchModal`'s Quote-type search results (`apps/connect/app/api/search/route.ts`), and the
member Collection's saved-quote links, killing the permalink outright would have broken all
three. The rebuilt page has **no archive link, no author link, no like/bookmark/report actions,
no "browse more" footer** — just the quote (styled to match `QuoteDetailModal.tsx`'s own look,
so the permalink and the in-feed drawer are visually consistent), the real feed `ReactionBar`
(`itemType="quote"`, same reaction system every other content type uses), and `QuoteComments`
(unchanged — it already only ever depended on the shared `WpComment`/`getPostComments()` backend,
not the archive). Nothing in the app links to this page except a quote's own `item.href` — don't
add a "browse all quotes" link back into it.

**Real, pre-existing bug fixed in the same pass**: `Culture_REST_API::saved_post_summary()`
(backs the member Collection's "liked"/"bookmarked" lists) built a saved quote's `url` as
`/quotes/{bare-slug}` — no numeric ID prefix — while the permalink page's `parseId()` requires
`/quotes/{id}-{slug}` (`segment.split('-')[0]`). Every saved quote in a member's Collection would
have 404'd once clicked. Fixed to `/quotes/{$post->ID}-{$slug}`, matching
`get_quote_feed_items()`'s href shape exactly. `CollectionTabs.tsx`'s "Browse Quotes" empty-state
buttons were repointed to `/feed` (where quotes are actually discoverable now), since `/quotes`
is no longer a browsable destination.

*(Not verified live this pass — needs the plugin redeployed before it's live in production.)*

---

## Raw `cms.themoveee.com/{slug}/` links now redirect to the real frontend URL (September 2026)

Visiting a WordPress permalink directly on the CMS origin (e.g. a link an editor
pasted into Slack, or one search engines indexed from the un-proxied backend)
used to serve the bare `culture-theme` template — unbranded, and on a headless
setup, not the page anyone actually wants. `moveee_redirect_singular()`
(`culture-theme/functions.php`, a sibling of the pre-existing
`moveee_redirect_taxonomies()` right above it — same file, same
`template_redirect` hook, same `MOVE_FRONTEND_URL`-constant-with-production-
fallback pattern) 301-redirects any single-post request on `cms.themoveee.com`
to its real Next.js URL, on whichever site actually owns that content type:

| Post type | Redirects to |
|---|---|
| `post` | Site A `/magazine/{slug}` (the Next.js side itself redirects further to `/literary/{slug}` or `/commons/{slug}` when the post belongs there — see those sections above — so this is always correct, just occasionally a two-hop redirect) |
| `product` | Site A `/lifestyle/{slug}` |
| `culture_newsletter` / `getmelit` / `culture_drop` | Site A `/newsletter/{slug}` (all three render through the same route, see "Archive / frontend" above) |
| `culture_journey` | Site A `/journeys/{slug}` |
| `culture_directory` | Site B `/directory/{slug}` |
| `culture_quote` | Site B `/quotes/{id}-{slug}` (compound slug — see "Quotes feed merge" above for why) |
| `culture_post` | Site B `/community/{slug}` |
| `culture_event` | Site B `/events/{slug}` |
| `culture_hub` | Site B `/hub/{slug}` |
| `culture_cluster` | Site B `/cluster/{id}` (Stoop clusters route by numeric id, not slug) |

**Deliberately skipped**: `is_preview()` requests — `Culture_Preview::maybe_redirect_preview_request()`
(also hooked on `template_redirect`, in the plugin) already owns that case and
sends a draft to `/api/preview`, not the plain public URL; `moveee_redirect_singular()`
returns early on `is_preview()` so it never fights that handler for the same
request. Any post type with no row above (native WP `page`, `attachment`, or a
future CPT with no frontend route yet) is left alone — same "if nothing
matched, do nothing" behavior `moveee_redirect_taxonomies()` already has.

**If a new CPT is added with a real frontend detail page, add a `case` here** —
this is now the single place that maps a WP post type to its canonical
frontend URL for the purpose of un-proxied CMS links; don't invent a second,
route-specific redirect for it.

Needs the theme redeployed (manual zip+upload, same as the plugin — see
"Plugin DB table auto-upgrade" for why a code push alone isn't enough) before
it takes effect in production — bumped `culture-theme/style.css`'s `Version:`
header (1.0.0 → 1.0.1) for the same redeploy-confirmation reason the plugin
*(Not verified live this pass.)*

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

## Front-end draft preview — Next.js Draft Mode for magazine articles + Lifestyle products (September 2026)

Editors can now preview a draft/pending `post` (magazine article) or a draft WooCommerce
`product` through the real Next.js page (`/magazine/[slug]`, `/lifestyle/[slug]`) instead of
only WordPress's own theme-rendered preview — which never worked properly for a headless
frontend anyway, since WP's native preview requires a logged-in WP auth cookie that never
reaches the separate `apps/site` origin. Scope for this pass: magazine articles + Lifestyle
products only (newsletters/community posts/events are not wired up — extend the same pattern
if/when those need it).

**Trust model — no new secret to keep in sync.** WordPress signs a short-lived (1hr) HMAC
token (`post_id|post_type|expiry`, signed with the existing `culture_api_secret` option — the
same secret already used everywhere else in this plugin as the `Authorization: Bearer` REST
secret, see `Culture_REST_API::verify_bearer_token()`) and verifies it entirely server-side.
Next.js never needs to hold the secret itself, only the token it's handed — this is why the
resolve endpoint is public (`__return_true` permission callback, same pattern as
`/newsletter-unsubscribe`), not gated by `api_key_permission`.

**WordPress side** (`culture-community/includes/core/class-culture-preview.php`,
`Culture_Preview`):
- `add_filter('preview_post_link', ...)` overrides WP Admin's native "Preview"/"Preview
  Changes" button for `post` and `product` post types only (`SUPPORTED_TYPES`) — any other
  post type's Preview button is untouched, still WP's own theme preview.
- `make_token()`/`verify_token()` — base64url(`id|type|expiry`) + a `hash_hmac('sha256', ...)`
  signature, `hash_equals()`-checked, expiry-checked. Falls back to WP's own preview link
  (doesn't touch the filter) if `culture_api_secret` isn't set yet, rather than generating a
  token nothing could ever verify.
- The overridden link points at `{culture_preview_frontend_url}/api/preview?token=...&type=...
  &slug=...` — `culture_preview_frontend_url` defaults to `https://themoveee.com` (no WP Admin
  UI for this option yet; set it via `wp option update` or `update_option()` if it's ever
  wrong for a given environment).
- `Culture_Preview::resolve($id, $type)` builds the actual payload — shaped as closely as
  practical to match `STORY_FIELDS_FRAGMENT`/`ProductFields` in `packages/shared/lib/wp.ts` so
  the existing page components need minimal branching to render it. Deliberately best-effort
  on secondary fields: `seoTitle`/`seoDescription` are always `null` in preview (a draft rarely
  has SEO set yet, and `generateMetadata()` already falls back gracefully to `"{title} | Moveee
  Magazine"` when absent — this is a safe default, not a gap), and taxonomy lookups
  (`series`/`industry`/`country`) degrade to `[]` if the taxonomy isn't registered rather than
  erroring.
- New public REST endpoint: `GET /culture/v1/preview/resolve?token=...`
  (`Culture_REST_API::handle_preview_resolve()`) — verifies the token via `Culture_Preview` and
  returns `{ type, item }`.

**Next.js side** (`apps/site` only — this feature doesn't exist on `apps/connect`):
- `packages/shared/lib/wp.ts`'s `getPreviewItem(token)` — a plain REST `fetch()` against
  `{WP_BASE_URL}/wp-json/culture/v1/preview/resolve`, deliberately **bypassing `getWPData()`
  entirely**: this must never hit the KV cache (a draft's content changes on every save) or the
  CMS circuit breaker (a preview is a rare, editor-only, time-sensitive action that should fail
  fast and visibly, not silently wait out a 60s cooldown meant for public-traffic protection).
- `app/api/preview/route.ts` — the entry point WordPress's overridden Preview button opens.
  Calls `getPreviewItem(token)` (this both verifies the token *and* fetches the content in one
  round trip — the route never trusts the caller-supplied `type`/`slug` query params on their
  own, only what the verified response says); on success, enables Next.js Draft Mode
  (`(await draftMode()).enable()`) and stashes the raw token in its own httpOnly
  `culture_preview_token` cookie (Draft Mode's own cookie only marks "draft mode is on" — it
  carries no payload, so the actual page still needs the token to refetch the draft on its own,
  separate request), then redirects to the real `/magazine/{slug}` or `/lifestyle/{slug}`.
- `app/api/preview/disable/route.ts` — disables Draft Mode, clears the cookie, redirects back
  (`?redirect=` param, set by `PreviewBanner`).
- `components/PreviewBanner.tsx` — a small sticky ochre bar ("Preview mode — this is a draft,
  not the live page" + an Exit preview link) rendered at the top of the page only when
  `isPreview` is true.
- **Page wiring** (`app/magazine/[slug]/page.tsx`, `app/lifestyle/[slug]/page.tsx`): both
  already fetch their content via GraphQL first, same as before — GraphQL only ever returns
  published content, so a draft always comes back `null`. Only when that happens **and** Draft
  Mode is enabled **and** the resolved preview item's slug matches the requested slug does the
  page fall back to the preview payload (`isPreview = true`) instead of `notFound()`-ing. This
  means the normal, published-content render path is completely unchanged; preview is purely an
  additive fallback that only ever engages for an actual 404 while previewing.
- **If a future pass extends this to another content type** (newsletters, community posts):
  add its post type to `Culture_Preview::SUPPORTED_TYPES`, a `resolve_{type}()` branch in
  `Culture_Preview::resolve()`, and the same "GraphQL null → check Draft Mode → fall back to
  `getPreviewItem()`" pattern in that type's own `[slug]/page.tsx` — don't invent a second
  token/verification scheme, reuse `Culture_Preview` as-is.
- *(Not verified live this pass — needs the plugin redeployed before it's live in production.)*

**Gotcha found in live testing, fixed same month: the `preview_post_link` filter alone never
fires from the block editor.** The plugin's `culture_api_secret` was already correctly set, the
new plugin code was correctly uploaded, and clicking "Preview in new tab" still landed on
`cms.themoveee.com`'s own theme-rendered preview. Root cause: `preview_post_link` is only read by
code that calls `get_preview_post_link()` **server-side** — the classic editor did this, but the
block editor's "Preview in new tab" button builds its URL **client-side in JS**, straight from
the post's own permalink plus `?preview=true`, and never touches this PHP filter at all. So the
filter was dead code for the one UI path anyone actually uses to click Preview.

**Fixed** by adding a second, more robust mechanism in `Culture_Preview::init()`: a
`template_redirect` hook (`maybe_redirect_preview_request()`) that intercepts *any* incoming
preview request server-side via `is_preview()`, regardless of how the URL that got there was
built — this is what actually fixes the reported bug, since it doesn't care whether the request
came from the classic editor, the block editor, or someone pasting a preview URL directly. Gated
by the same `current_user_can( 'edit_post', $post->ID )` check as an extra safety net alongside
`is_preview()`'s own nonce verification, so it can never leak a draft's real content to someone
who couldn't already see it via WP's own preview. The original `filter_preview_link()`/
`preview_post_link` filter is kept alongside it (harmless, not a competing mechanism — same
token, same destination) in case some other caller ever does read that filter server-side.
**If this class of "preview button" or "edit link" feature is ever extended, don't trust a single
WordPress hook/filter to fire from every UI surface that can reach the same outcome — verify
against the actual button being clicked (here, the block editor specifically bypassed the
filter this whole feature was originally built around) or intercept the eventual HTTP request
server-side instead, the way `template_redirect` does here.**

Plugin header `Version:` bumped to `2.2.0` in the same pass specifically so a redeploy is
visually confirmable on the WP Admin Plugins list — the original build left this at `2.1.0`
unchanged, so there was no way to tell from WP Admin alone whether an upload had actually taken
effect. `CULTURE_VERSION` (the dbDelta-gate constant, unrelated to the plugin header) was **not**
bumped — this fix adds no new tables, so there's nothing for `culture_community_maybe_upgrade()`
to run.

## Byline Contributor role + Guest Byline field (September 2026)

A restricted WP role that can create and publish `post` (Moveee Magazine article) entries and
attribute the article to a typed guest-writer name/bio — no real WordPress user account is ever
created for the guest, and the role never sees any other author's posts or any other post type.

**Role — `culture_byline_contributor`** (`culture-community/includes/core/
class-culture-guest-byline.php`, `Culture_Guest_Byline`). Author-equivalent primitive
capabilities only (`edit_posts`/`edit_published_posts`/`publish_posts`/`delete_posts`/
`delete_published_posts`/`upload_files`/`read`) — deliberately no `edit_others_posts`/
`edit_private_posts`/`list_users`/`create_users`/`manage_options`. WP's own post-list query
already restricts a user without `edit_others_posts` to their own posts, so "no access to all
posts" is the ordinary capability model, not custom query filtering.

**The real complication, worth understanding before touching this again**: every custom CPT in
this plugin (`culture_event`, `culture_directory`, `culture_newsletter`, `culture_quote`,
`culture_post`, `culture_journey`, `culture_cluster`, `culture_hub`) is registered with
`'capability_type' => 'post'` as a bare string, not a namespaced array — WordPress reuses the
exact same `edit_posts`/`publish_posts`/`edit_post`/`delete_post` capability strings as core
Posts for all of them. There is no native way to grant Author-level access to just `post` without
also granting it to every one of those CPTs. `Culture_Guest_Byline` closes this itself, not by
touching any of those `register_post_type()` calls (would risk changing behavior for the
`author`/`editor` roles that already rely on those exact strings):
- `map_meta_cap` filter (`restrict_to_post_type()`) denies `edit_post`/`delete_post`/
  `publish_post`/`read_private_post` on any post whose `post_type !== 'post'`, for a user holding
  this role without `manage_options` — this is the real enforcement.
- `admin_menu` (`trim_admin_menu()`) removes the other CPTs' submenu pages for this role — a UX
  trim only; note they're all registered under `show_in_menu => 'culture-community'` (a nested
  submenu), so this uses `remove_submenu_page('culture-community', ...)`, not
  `remove_menu_page()`.
- Role registration is version-gated (`ROLE_VERSION`/`culture_byline_role_version` option, same
  shape as every other one-time-migration in this plugin) so a future cap-set change reaches
  existing installs on their next request via `remove_role()` + `add_role()`, not just new sites.

**Guest Byline — display-only, `post_author` never changes.** A new ACF field group ("Guest
Byline": `guest_byline_name`, `guest_byline_bio`, `guest_byline_avatar`) in
`class-culture-acf-fields.php`, restricted to the `post` type and, via ACF's "Current User Role"
location rule, to `culture_byline_contributor` + `administrator` only — it doesn't clutter the
editor screen for anyone else. Because ownership never changes, every capability/revision/
authorship check above still applies to the real logged-in account; only the rendered byline
changes. This is a second, independent mechanism from the pre-existing `as_told_to` field (name
only, still shows the real WP author as "as told to {author}") — Guest Byline takes precedence
over `as_told_to` wherever both are checked.

**Gotcha (fixed September 2026): the location rule must use `current_user_role`, not
`user_role`.** ACF has two similarly-named location params and it's easy to reach for the wrong
one — `user_role` is "User Role" (matches the role of the user profile being *edited* on
`user-edit.php`; it has no applicable value on a `post` editor screen, so a rule using it there
never matches, for **anyone**, admins included) vs. `current_user_role` ("Current User Role" —
the role of whoever is *viewing* the current admin screen, which is what "only Byline
Contributors and admins see this field" actually needs). The field group shipped with the wrong
param on first build and was invisible for every role until this was caught and fixed. If a
future ACF field group needs to gate on "who's logged in right now" rather than "which user
profile is being edited," use `current_user_role` — verify by testing as a *non-admin* role
before considering the field group done, since an admin's own account can otherwise mask a
broken location rule (superadmin capability checks elsewhere might still let a field show for
you even when the rule itself is wrong).

**GraphQL**: `guestByline { name bio avatarUrl }` registered on `Post` in
`moveee-graphql-bridge.php` (same isolation pattern as `moveeeMeta`/`featuredProducts` — reads
plain postmeta directly, not `get_field()`, so it degrades to `null` if ACF is ever inactive
rather than breaking the query) and added to `STORY_FIELDS_FRAGMENT` in
`packages/shared/lib/wp.ts`. `Culture_Preview::resolve_guest_byline()` mirrors the same resolver
shape for the draft-preview payload (`class-culture-preview.php`).

**Frontend — `apps/site/app/magazine/[slug]/page.tsx` only.** A `guestByline`/`bylineDisplay`
pair is derived once near the top of the page and threaded through every byline surface on this
one route: both hero "Words by" blocks, the "Writer" row in the sidebar Details card, the
end-of-article author band (name/bio/avatar — falls back to `guestByline.bio ||
"Contributing writer, Moveee Magazine."` when no bio is set), and the `Article` JSON-LD `author`
field. The "More by {name} →" archive link is **omitted** whenever `guestByline` is set — there's
no real `/author/{slug}` page for a typed guest name, so linking to the real WP account's archive
under the guest's displayed name would be actively wrong.

**Mobile app extended (September 2026, follow-up).** `apps/mobile` fetches articles via raw
WordPress REST (`wp-json/wp/v2/posts`), not GraphQL, so the GraphQL-only resolver above was
invisible to it — fixed two ways:
- `Culture_Post_Types::register_guest_byline_meta()` (new, `class-culture-post-types.php`,
  hooked on `init`) registers `guest_byline_name`/`guest_byline_bio`/`guest_byline_avatar` via
  `register_post_meta('post', ..., ['show_in_rest' => true])` — mirrors the pre-existing
  `as_told_to` registration in the same file. **ACF-stored postmeta is not automatically REST-
  visible** — without this, `meta.guest_byline_*` never appears in the REST response regardless
  of what the ACF field group itself does; this is the one call GraphQL didn't need (WPGraphQL's
  resolver reads raw postmeta directly) but REST does.
- `useMagazine.ts`'s `mapPost()` reads `post.meta?.guest_byline_name` and, when set, overrides
  the mapped `author` (`name`/`avatarUrl`/`bio`) the same way the web page does — `slug` is left
  `""` for a guest byline (no real `/author` archive to link to). `Article`'s `author` type in
  `types/index.ts` gained an optional `bio` field and a comment documenting the empty-slug
  convention. `ArticleScreen.tsx`'s "More articles by {name} →" link is now gated on
  `article.author.slug` being non-empty, mirroring the web page's own "omit the archive link for
  a guest byline" rule.

**RSS, sitemap, and search — checked, nothing to extend.** None of these actually display an
author name in the first place, so there's no override to add:
- `apps/site/lib/rss.ts`'s newsletter RSS template (`buildNewsletterRssFeed`) has no
  author/`dc:creator`/`itunes:author` field at all, and there is no RSS feed for magazine
  articles anywhere in this codebase.
- `apps/site/app/sitemap.ts` has zero author references. The real author archive page
  (`apps/site/app/author/[slug]/page.tsx`) correctly shows the real account's own name/avatar/bio
  on its masthead (it's that account's own page, not a per-article override target) and its
  story grid (`ArchiveCardGrid.tsx`, shared with the homepage/`/magazine`/series pages) never
  renders a per-card author byline at all.
- Site A's search (`apps/site/app/api/search/route.ts`'s `SEARCH_POSTS` query +
  `SearchOverlay.tsx`) shows only Category · Country as a result's meta line, never an author.
  Site B's search (`apps/connect/app/api/search/route.ts`, native `wp/v2/search`) maps results to
  a bare `{id, title, subtype, href}` — no author field is fetched or rendered by
  `SearchModal.tsx` either.

If a genuine author-display gap turns up on any of these later, extend from the `guestByline`
GraphQL field (web) or the newly-REST-exposed `meta.guest_byline_*` fields (mobile/any future
REST consumer) — don't build a second mechanism.

*(Not verified live this pass — needs the plugin redeployed before it's live in production.)*

**Production outage caused by this feature, fixed same day (September 2026).** The `guestByline`
GraphQL field above was added directly into `STORY_FIELDS_FRAGMENT` — the shared fragment nearly
every story query on the site uses, including the homepage's own `getMagazineSections()` and
`/magazine`'s archive. Once the frontend code shipped ahead of `moveee-graphql-bridge.php` being
redeployed (per the "manual zip+upload" note above), the live GraphQL schema didn't recognize
`guestByline` — **an unrecognized field fails the entire GraphQL query, not just that field** —
so every page fetching stories via WPGraphQL came back empty: the homepage sections all went
blank and newly-published articles stopped appearing anywhere on the web app, while the mobile
app (raw WP REST, not GraphQL) kept working fine. This is the same "bridge-plugin isolation"
failure mode `GET_PRODUCTS_EXTRA`'s own comment already warns about for the shop — `guestByline`
just wasn't given the same treatment when it was added. **Fixed** by moving `guestByline` out of
`STORY_FIELDS_FRAGMENT` into its own isolated `GET_STORY_GUEST_BYLINE` query
(`packages/shared/lib/wp.ts`), fetched only by `/magazine/[slug]/page.tsx` and wrapped in a bare
`try {} catch {}` — a missing/undeployed bridge field can now only ever cost that one page its
guest-byline lookup, never break story listings sitewide. **If you ever add a new bridge-plugin
field to a GraphQL response, it must go in its own isolated query with a swallowed-error caller,
never into a shared fragment used by listing pages** — this is not optional, it's the one rule
this incident exists to enforce.

**Mobile "always shows the generic account name" bug, same pass.** Separately, `useMagazine.ts`'s
`mapPost()` only ever read `guest_byline_name` (brand new, essentially unused in real content) and
never `as_told_to` (the older, pre-existing, actually-used field) — so any article an editor
attributed via As-Told-To showed the real writer's name on web but silently fell back to the
generic WP publishing account's name on mobile, on every single as-told-to article, which is what
read as "always says the wrong byline." Fixed by giving `mapPost()` the same three-way precedence
web's article page already has (Guest Byline full override → As-Told-To compound "{person}, as
told to {account}" string → plain real author name, with `"The Moveee"` as the final fallback,
matching web's own literal fallback string) — `as_told_to` was already `show_in_rest`-registered
from before this feature existed, so no plugin redeploy was needed for this half of the fix.

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

## Footer removed sitewide (Connect web only, July 2026)

`apps/connect` (web.themoveee.com) no longer renders a site footer anywhere —
`ConditionalFooter.tsx` (which used to render the shared `packages/shared/components/Footer.tsx`
on every page except `/feed`) was deleted, and `app/layout.tsx` no longer mounts it (or imports
`footer.css`). **`apps/site` (themoveee.com Magazine) is unaffected** — it still renders
`Footer.tsx` directly from its own `layout.tsx`; only `apps/connect` had this removed.

In its place, every `apps/connect` page that has a right rail carries a small copyright block
(`© {year} The Moveee. All Rights Reserved.` + Terms/Privacy/Contact links) at the bottom of
that rail — this is the exact pattern `/feed` already used before this change (see
`PulseFeed.tsx`, which predates and motivated this). Pages without a right rail (member
dashboard/settings/wallet/perks/coupons/notifications/analytics, `/connect/people`,
`/connect/membership`, auth pages, hub pages, vendor dashboard, etc.) simply have no footer and
no copyright line — this was a deliberate scope decision (only add the block where a natural
right-rail slot already exists), not an oversight; revisit only if a future pass gives those
pages a right rail of their own.

Pages with the copyright block: `/feed` (`PulseFeed.tsx`), `/community/[slug]`, `/pulse/[slug]`,
`/directory/[slug]`, `/events/[slug]`, and `/events` + its city/category archives (all three via
the shared `EventTimeline.tsx`'s `evt-timeline-sidebar`, appended after the `rightRail` prop
override so it shows regardless of which rail content a given page passes in). `apps/connect`'s
`vendor/layout.tsx` also has an `<aside>`, but it's a persistent nav sidebar (vendor dashboard
chrome), not a content right-rail — deliberately excluded.

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

**Desktop hide (fixed July 2026).** Both the banner and the modal used to render at every
viewport width — since there is no desktop app to push people toward, showing "Moveee is
better in the app" copy on a desktop browser was actively wrong, not just unnecessary. Fixed
with a single CSS rule in `components/app-download-nudge.css`:
```css
@media (min-width: 860px) {
  .adb-banner,
  .adm-overlay {
    display: none;
  }
}
```
`860px` matches the project's existing desktop breakpoint (same value the left-nav rail in
`Header.tsx` switches on — see "Connect app left-nav rail" above). CSS-only fix — no JS
viewport check was added, since `AppDownloadModal.tsx`'s page-view counter still increments
on desktop; the modal's overlay just never becomes visible there, which is simpler than
gating the counter logic itself and has the same net effect.

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

FeedCard lazy-loads these modals via `dynamic(() => import(...), { ssr: false })`.

**Community cards are the exception (web, July 2026) — they navigate directly to
`/community/{slug}` instead of opening an off-canvas drawer.** `FeedCard.tsx`'s community
branch used to open `CommunityDetailModal.tsx` the same way the three modals above still
work; this was changed to `router.push(\`/community/${item.slug}\`)` on both the post-body
click and the comment-count button click, and the `modalOpen`/`CommunityDetailModal` state
and dynamic import were removed from `FeedCard.tsx` entirely. `CommunityDetailModal.tsx`
the component file is **not** dead — `EventSpotlightCarousel.tsx` still renders it for
community-type spotlight items (see "Event Spotlight carousel" above) — only `FeedCard.tsx`
stopped using it. Mobile's equivalent (`PostDetailSheet.tsx` bottom sheet in
`ConnectFeedScreen.tsx`) was deliberately left unchanged — this was a web-only UX request.

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
so they're unaffected). Ratings box background is white (`#fff`), not the grey `#f5f5f5` it
originally shipped with in this pass — same "no more warm/grey tints where the mockup wants
white" direction as the sitewide paper-background removal. Mobile's `bookRatingsContainer`
(`NewPostScreen.tsx`) got the matching explicit `backgroundColor: c.paper` — it had no background
set before (relying on whatever sat behind it), now made explicit for the same reason.

**Overall rating auto-calculates (July 2026, both web and mobile).** `bookOverallRating`/
`musicOverallRating`/`filmOverallRating` are no longer purely independent fields — each is now
the rounded average of that template's breakdown ratings (`averageRating()`, a small local helper
— duplicated between `SubmitPost.tsx` and `NewPostScreen.tsx`, keep in sync), recalculated on
every breakdown change via a `useEffect`. The moment the user taps a star on **Overall** itself,
a `bookOverallManual`/`musicOverallManual`/`filmOverallManual` flag flips true and that effect
stops overwriting it for the rest of the draft — same "auto until manually overridden" shape as
the Section picker's `tagLocked`. `averageRating()` ignores unrated (`0`) breakdown fields and
returns `0` itself until at least one is rated, so Overall stays empty rather than showing a
misleading `0`/`NaN` average before the user has entered anything. Mobile got the same auto-calc
logic (`NewPostScreen.tsx`) but **not** the box-merge/white-background visual changes above —
its Overall `StarRating` stays in its own row, unchanged layout, per the existing "mobile rating
UI visual changes are out of scope, web-mockup-only" boundary noted below.

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

### Multi-step wizard for long templates (web + mobile, July 2026)
Hidden Gem, Food Review, Book/Music/Film Review, Creative Showcase, Route (itinerary), and Event
were broken into up to 3 logical steps with Next/Back nav instead of one long scroll — Post,
Quote, Poll, and Cultural Take stay single-step (short forms, no wizard needed). Implemented
independently on web (`SubmitPost.tsx`) and mobile (`NewPostScreen.tsx`), same shape on both,
kept in sync per the project's usual web/mobile duplication convention.

- **Config**: `WIZARD_STEPS` (template → step count, only long templates listed; anything absent
  defaults to 1/non-wizard) + `WIZARD_SECTION_STEP` (section key → per-template step index;
  absent entries default to step 0) — both are plain module-level consts, mirrored verbatim
  between the two files.
- **`showSection(key)`** — `!isWizard ? true : step === (WIZARD_SECTION_STEP[key]?.[template] ?? 0)`.
  Existing JSX blocks got this ANDed onto their `template === "x"` condition rather than being
  restructured — e.g. web's Book Review block split from one `<>...</>` into two
  (`showSection("rating")` for the MultiRating+review, `showSection("extras")` for fav
  quote/recommend/genres); mobile's per-template `render*()` functions got the same treatment
  inside their existing bodies. Section keys used: `search` (default step 0, DirectorySearch +
  any paired fields), `rating` (breakdown ratings + review text), `extras` (fav
  quote/lyric/line + recommend + genres — Book/Music/Film Review only), `stops` (itinerary's
  `ItineraryBuilder`), `photos` (final image/video step), `basics`/`details`/`rsvpphoto`
  (event's 3 steps). `text`/`photos` are reused across templates with different step numbers per
  template — that's intentional, not a naming collision.
- **Step-local validation**: `canProceedStep()` (web) / the `canProceedStep` memo (mobile) gates
  the "Next" button — a lighter, per-step version of `canSubmit()`/`isSubmitDisabled` so a step
  can't be skipped without its own required fields, without demanding later steps' fields yet.
  Kept in sync with each file's own final-submit validation (not invented fresh) — e.g. mobile's
  food-review step-1 gate only requires `foodRatings.taste > 0`, matching what
  `validateAndSubmit()` actually enforces (not the full taste+value+vibe web enforces), since the
  two platforms' final gates already differed before this pass and the wizard didn't newly
  tighten either one.
- **Web-specific**: `handleSubmit` now early-returns when `isWizard && step < totalSteps - 1` —
  needed because a text `<input>`'s Enter key submits the form natively regardless of the
  visible button's `type="button"`/label, so without this guard a fast typist could
  Enter-key-submit an event from step 0 with only title+date filled. `resetForm()` and
  `handleTemplateChange()` both reset `step` to 0. Progress UI: `.composer-wizard-progress`
  (dots + "Step N of M" label) at the top of `.composer-fields`; `.composer-back-btn` next to
  the existing Save Draft/Post buttons in the action bar.
- **Mobile-specific**: the header's right button swaps between "Next" (advances `step`, disabled
  via `canProceedStep`) and "Post" (final step, unchanged `validateAndSubmit`/`isSubmitDisabled`
  behavior); the left button swaps between "← Back" (steps > 0) and "Cancel" (`nav.goBack()`).
  Progress dots row (`wizardProgress`/`wizardDots`/`wizardDot*` styles) sits below the existing
  template indicator bar. The bottom toolbar's photo icon is additionally gated on
  `showSection("photos")` so tapping it never adds an image while looking at an unrelated step.
  `switchTemplate()` resets `step` to 0.
- **Step→section assignments are identical across both files** (see `WIZARD_SECTION_STEP` above)
  except where the two platforms' own field sets already differ — e.g. mobile's Itinerary has a
  `itineraryTitle`/`itineraryCity` step 0 the web version doesn't (web's itinerary template has
  no separate title/city fields, only the shared description textarea), and mobile's Event step 0
  also includes the inline `DateTimePicker` modal (web uses native `<input type="datetime-local">`,
  no separate picker UI to gate). If you add a field to one platform's template, check whether the
  other platform has an equivalent before assuming the step split should match exactly.

### Guide description moved to top of form (web + mobile, July 2026)
The per-template description (`TEMPLATE_GUIDES[template].desc` on web, `tmplDef.desc` on mobile —
same text source the type-picker cards already used) used to render just above the main textarea
and hide once the user started typing. It's now pinned to the **top of the form**, above the
wizard progress/Posting-to picker, and stays visible permanently (the hide-on-typing behavior made
sense next to the textarea; it didn't make sense once the wizard put the textarea on a later step).
Web: unconditional `<div className="composer-guide">` at the top of `.composer-fields`, no longer
gated by `showSection("text")`. Mobile: previously **only** the `post` template showed this at all
(inline inside `renderStandardPost()`) — now every template shows it, moved above the wizard
progress row in the fixed header area (outside the `ScrollView`, so it needed its own
`paddingHorizontal` since the body's own padding no longer applies to it).

### Review family — Place/Food/Music/Book/Film Review unified under one "Review" tile (July 2026)
Hidden Gem, Food Review, Music Review, Book Review, and Film Review are still five separate
`TemplateType`/`TemplateId` slugs internally (`hidden-gem`, `food-review`, `music-review`,
`book-review`, `film-review` — payloads, validation, and backend gating are all untouched), but
the type picker now shows **one** "⭐ Review" tile instead of five separate ones. Picking it opens
the composer on `REVIEW_DEFAULT` (`hidden-gem`); a **subtype tab row** (`.composer-review-tabs` on
web, `styles.reviewTabs` on mobile — plain text + ochre underline, deliberately not a pill/chip
row) then lets the user switch between Place/Food/Music/Book/Film in place, calling the same
`handleTemplateChange()`/`switchTemplate()` every other template switch already uses.

- **Config, mirrored between `packages/shared/components/pulse/SubmitPost.tsx` (exports
  `REVIEW_FAMILY`, `REVIEW_DEFAULT`, `REVIEW_TAB_META`, `isReviewTemplate()`) and
  `apps/mobile/src/components/community/TemplatePickerSheet.tsx`** (same four exports) — keep both
  in sync, same convention as `WIZARD_STEPS`/`WIZARD_SECTION_STEP`.
- **Type-picker merge**: `TypePickerModal.tsx` builds a `GRID_ITEMS` list (web) / `TemplatePickerSheet.tsx`
  builds a filtered `defs` list (mobile) that walks the full template list once and collapses the
  first review-family member it hits into a single synthetic "review" tile, skipping the rest —
  this preserves the tile's original grid position (where Hidden Gem used to sit) rather than
  appending it at the end.
- **Slim bar / template-bar label**: when the current template is a review-family member, the
  dedicated-page slim bar (web) reads its emoji+label from `REVIEW_TAB_META` instead of the base
  `TEMPLATES` array, so it stays consistent with the tab row directly below it.
- **"Hidden Gem" renamed to "Place" everywhere it's a display label** (copy-only — same convention
  as the Stoop rename: internal slug/keys/DB values/theme keys like `templateGemBg`/`templateGemText`
  and the `gem_hunter` achievement badge are all untouched, only user-facing text changed). Hit
  every `TEMPLATES`/`TEMPLATE_DEFS` array, badge/label maps in feed cards and detail
  screens/sheets/modals, the WP admin credits-settings label, and one apps/site feature-card title.
  Marketing prose that uses "hidden gem(s)" as a plain descriptive phrase (not a literal UI label —
  apps/site's pulse-feed/discover/features pages, `MoveeeZone.tsx`) was deliberately left alone —
  that's a copywriting call, not a UI label rename.

### Food Review: dish/item is now the searchable field, not a restaurant search (July 2026)
Food Review used to show a `DirectorySearch` for "Which restaurant or venue?" (`typeFilter=
"restaurant"`) followed by a plain-text "Dish or item name" input. The restaurant search is
**removed** — restaurant/venue reviews are now expected to go through Place (Hidden Gem) review
instead. The dish/item name is now itself the searchable `DirectorySearch` field
(`typeFilter="food"`, matching the Book/Music/Film Review pattern exactly), backed by a dedicated
`foodEntry` state (web) / `foodEntry` state (mobile) — replacing the old plain-text `foodDishName`
state on both platforms. `payload.food_dish_name`/`body.food_dish_name` (the field name sent to
the backend is unchanged) is now sourced from `foodEntry?.title`, and `linked_directory_id` from
`foodEntry?.id` — previously food-review reused the shared `directoryEntry`/`linkedEntry` state
that hidden-gem also uses; now it has its own, same as book/music/film. Feed rendering
(`FeedCard.tsx`, `CommunityDetailModal.tsx`, `PostDetailSheet.tsx`, `FeedItemCard.tsx`) reads the
same `foodDishName` field on `FeedItem` as before — untouched, since only the *source* of that
value in the composer changed, not the field name it's stored/displayed under.

### Update family — Update/Poll/Quote unified under one "Updates" tile; Cultural Take removed entirely (July 2026)

Same shape as the Review family merge above, applied to a second group: **Update ("post"),
Poll, and Quote now share one "Updates" entry point** in the type picker (web `TypePickerModal.tsx`,
mobile `TemplatePickerSheet.tsx`), with an in-form tab row to switch between them — mirroring
`composer-review-tabs`. **Cultural Take was removed as a template entirely**, not folded in
alongside Update/Poll/Quote as a fourth tab — its one distinguishing feature (a required
"what are you writing about?" directory link) became an **optional** field on the plain Update
form instead, since a normal update should still work with no directory link at all.

- **Config constants** (`packages/shared/components/pulse/SubmitPost.tsx`): `UPDATE_FAMILY =
  ["post", "poll", "quote"]`, `UPDATE_DEFAULT = "post"`, `UPDATE_TAB_META` (label + emoji per
  slug), `isUpdateTemplate()` — same shape as `REVIEW_FAMILY`/`REVIEW_DEFAULT`/`REVIEW_TAB_META`/
  `isReviewTemplate()` directly above them. Mirrored on mobile in
  `components/community/TemplatePickerSheet.tsx` (`UPDATE_FAMILY`/`UPDATE_DEFAULT`/
  `UPDATE_TAB_META`/`isUpdateTemplate()`/`UPDATE_CARD_DEF`) — keep both in sync per the project's
  usual web/mobile duplication convention.
- **`TemplateType`/`TemplateId` no longer has a `cultural-take` member** on either platform — it's
  not just hidden from the picker, the composer-side type itself dropped the slug. The
  **display-side** types that render *historical* posts (mobile `types/index.ts`'s `TemplateType`,
  web `FeedCard.tsx`/`CommunityDetailModal.tsx`/`PostDetailSheet.tsx`'s plain-string
  `item.templateType` checks) **deliberately still handle `"cultural-take"`** — old cultural-take
  posts already in the DB must keep rendering correctly; only the *creation* path was removed.
  Don't conflate the two type surfaces when touching this area again.
- **Generic subtype-tabs helper, shared by both families**: what was `.composer-review-tabs`/
  `.composer-review-tab*` CSS (both `apps/connect/app/globals.css` and `apps/site/app/globals.css`)
  and a Review-only JSX block in `SubmitPost.tsx` is now `.composer-subtype-tabs`/
  `.composer-subtype-tab*`, driven by a single `renderSubtypeTabs(family, meta)` function (a plain
  function, not a nested component, so it doesn't remount on every render) called once per family:
  `{isReviewTemplate(template) && renderSubtypeTabs(REVIEW_FAMILY, REVIEW_TAB_META)}` and
  `{isUpdateTemplate(template) && renderSubtypeTabs(UPDATE_FAMILY, UPDATE_TAB_META)}`. Mobile's
  `NewPostScreen.tsx` got the equivalent treatment: `reviewTabs`/`reviewTab*` styles renamed to
  `subtypeTabs`/`subtypeTab*`, and a `renderSubtypeTabs()` helper replaces the old inline
  Review-only tab-row JSX.
- **Optional directory field on Update and Poll**: both `template === "post"` and `template ===
  "poll"` now render an (optional) `DirectorySearch` — web: `placeholder="What are you writing
  about? (optional)"`; mobile: same label, wired to the same `linkedEntry` state Hidden Gem/Place
  already used (mobile) / `directoryEntry` state Hidden Gem already used (web) — no new state
  variable needed, since Cultural Take used to share exactly this state already. When set,
  `payload.linked_directory_id`/`body.linked_directory_id` (+ `location_name`) are attached to the
  submission generically, same as every other template that carries a directory link. Poll's field
  was added per an explicit "should we add this to Poll too?" ask, not left as a follow-up.
- **Removed entirely, not just hidden**: `culturalTakeHeadline` state, `renderCulturalTake()`
  (mobile), the cultural-take branches in `validateAndSubmit()`/`isSubmitDisabled`/payload-building
  (mobile) and `canSubmit()`/payload-building (web), the `cultural-take` `MAX_CHARS`/
  `TEMPLATE_GUIDES`/`placeholders` entries, and the `styles.culturalHeadline` style block.
  `TEMPLATE_REP_GATE` never had a cultural-take entry (it was never rep-gated), so no gate cleanup
  was needed there.
- **Backend allowlists updated to reject new cultural-take submissions** (still fully serving
  historical reads — no data migration, no table changes): `apps/connect/app/api/community/submit/
  route.ts`'s `ALLOWED_TEMPLATES`/`MAX_CHARS`, `class-culture-mobile-api.php`'s
  `handle_submit_post()` `$allowed_templates`, and `class-culture-hubs.php`'s
  `Culture_Hubs::ALLOWED_TEMPLATES`/`DEFAULT_ALLOWED_TEMPLATES` (the latter's "which templates are
  ungated by default" rationale shrank from `['post', 'cultural-take']` to just `['post']`).
  **Deliberately left untouched** (historical/reward plumbing only, reads existing data, doesn't
  gate creation): `class-culture-gamification.php`'s `culture_guide` badge (still earnable from
  *past* cultural-take posts) and its `cultural-take` credit/reputation award-map entry, and
  `class-culture-settings.php`'s admin label for the `cultural_take_count` badge-trigger dropdown —
  none of these can be reached by a new submission anymore, so there's nothing to break by leaving
  them as-is.
- **Hub template allowlists** (`apps/connect/app/hub/create/CreateHubClient.tsx`,
  `apps/connect/app/hub/[slug]/HubManage.tsx`, mobile's `HubCreateScreen.tsx`/
  `HubDetailScreen.tsx` — all four keep their own hardcoded `ALL_TEMPLATES` arrays, not sourced
  from `SubmitPost.tsx`/`TemplatePickerSheet.tsx`) had their `cultural-take` entries removed and
  `DEFAULT_TEMPLATES` trimmed from `["post", "cultural-take"]` to `["post"]`.
- **Itinerary rename** (below) landed in the same pass — if you're grepping history for one and
  find the other, that's why they're adjacent.

### "Route" renamed to "Itinerary" (display label only, July 2026)

Copy-only rename, same convention as the Hidden Gem→Place rename above: the `itinerary` slug,
`_itinerary_*` payload/meta field names, and all internal identifiers are untouched — only the
**label text "Route"** shown to users was changed to **"Itinerary"**. Touched: `TEMPLATES` in
`SubmitPost.tsx`, `MODAL_META` in `TypePickerModal.tsx`, the hardcoded `ALL_TEMPLATES` arrays in
both hub-management files (web) and both hub screens (mobile — though mobile's own
`TEMPLATE_DEFS` in `TemplatePickerSheet.tsx` already said "Itinerary", only the hub-scoped lists
needed fixing), and three "Weekend Route" itinerary-badge labels that had drifted out of sync
with the template's own name (`FeedCard.tsx`, `CommunityDetailModal.tsx`,
`apps/connect/app/community/[slug]/CommunityPostClient.tsx` — all now say "Itinerary"; the
`apps/figma/` design-token showcase had the same stale label and was updated too, for
consistency, even though that app isn't the production composer).

---

## Hubs vs. Stoop — the two community axes (product positioning, September 2026)

Two systems in this codebase both build "communities" but along deliberately different axes —
worth stating explicitly since it's easy to conflate them when writing product copy, onboarding
flows, or admin tooling:

- **Hubs = what you're into.** Topic-based, location-agnostic. Anyone anywhere can join —
  nothing in the data model (`culture_hub`, `wp_culture_hub_members`) ties a Hub to a place. The
  11 official Hubs (Music, Fashion, Art, Film, Food, Sport, Travel, Ideas, Literature, Design,
  Tech) are the canonical example; a niche interest Hub (gamers, romance readers, a specific
  beverage/cocktail community, etc.) is exactly the same shape and just as legitimate. Each Hub
  has its own feed, allowed post templates, mods, a pinned post, and (per the September 2026
  newsletter work above) its own auto-provisioned mailing list.
- **Stoop = who you can physically show up with.** Real-world, place-bound. The whole mechanic
  (`culture_cluster`, `_cluster_street`/city fields, a capacity cap, weekly QR check-in, host
  election — see `docs/literati-connect-plan.md`) assumes proximity: people meeting in person,
  regularly, to do something together (reading, watching a film, sharing food). It answers "who's
  near me," not "what am I into."

**The two are not mutually exclusive and don't compete** — someone can be in the global "Romance
Readers" Hub *and* a local Stoop that happens to read romance together in person; the Hub is the
interest, the Stoop is the standing local meetup. When building copy, onboarding, or discovery UI
for either feature, keep this framing (interest vs. proximity) rather than treating one as a
scaled-down version of the other.

## Hubs — user-created topic communities

**Full plan (read before touching any Hub code): `docs/hubs-plan.md`.** Phases 1–4 (core
CPT/membership/moderation, `wp_culture_hub_members`/`wp_culture_hub_follows` tables,
`class-culture-hubs.php`) were built in an earlier session with no CLAUDE.md pointer ever added
— this entry (and the doc itself) is the fix. Phase 6, the **Section/Hub bridge** (every
`community_tag` value gets a matching official, platform-owned Hub; posting with a Section set
auto-links to it; official Hubs alone are exempt from the main-feed Hub exclusion; feed cards
get a Hub badge + Join button; the Section filter gets a "Join the X Hub →" prompt) shipped July
2026 — see `docs/hubs-plan.md` §10 for the full mechanics/reasoning, §10.6 for exactly what's
built vs. deferred (notably: **no bulk Hub-join-status endpoint yet**, so the feed's Join button
always starts on "Join" even for members who already joined — idempotent, so harmless, just an
extra click; and **mobile's feed cards don't render the Hub badge/Join UI yet**, only the backend
fields needed to build it). Phase 5 (rewards/badges/notifications/cron) also already shipped —
see the doc's own status line, which is the authoritative source, not this summary.

### WP Admin Hubs manager (September 2026)

Before this, `culture_hub` posts had **no real WP Admin UI** — the CPT was registered `show_ui:
true` with a bare native post-list/edit screen (title field + a generic Custom Fields box; no
meta box for description/cover/category/allowed templates, no member list, no way to archive).
`class-culture-hubs-admin.php` is the real manager, a new top-level **Moveee Hubs** menu (anchor
slug `culture-hubs-manager`, see the "WP Admin menu structure" note above): a list view (search,
filter by status/category/official-only, member/post counts, owner, linked newsletter-list
subscriber count, per-row Archive/Reactivate) and a detail view per Hub (edit
name/description/cover/category/allowed post types, archive/reactivate, member list with
promote/demote/make-owner/remove actions, an "Add member by email/username" form, and a shortcut
to the Campaigns page for emailing that Hub's auto-provisioned list).

**The native CPT admin screen is now hidden, not just superseded** — `culture_hub`'s
`show_in_menu` was flipped from `'culture-community'` to `false` in
`class-culture-post-types.php` (`show_ui` stays `true`, so `edit.php?post_type=culture_hub` still
technically works if visited directly, it's just not linked from the sidebar anymore) — otherwise
there'd be two different, confusing "Hubs" entries in WP Admin.

**Why this needed new `Culture_Hubs::admin_*()` methods instead of just calling the existing
API**: every mutating method on `Culture_Hubs` (`update()`, `archive()`, `appoint_mod()`,
`remove_mod()`, `remove_member()`) gates on the **requester** holding `'owner'`/`'mod'` in
`wp_culture_hub_members` — there is no admin bypass baked into any of them, on purpose, so as not
to weaken the member-facing permission model those same methods serve on the REST API. That's a
real dead end for the 11 official/platform-owned Hubs specifically: they have `post_author = 0`
and **no owner row at all** (seeded by `maybe_seed_official_hubs()`), so `get_role()` returns
`null` for literally every user, admin included — meaning a real WP administrator could not
rename an official Hub, change its category, or add a first member to it through the existing
API at all. `Culture_Hubs::admin_update()` / `admin_set_status()` / `admin_set_role()` /
`admin_remove_member()` are a parallel, un-gated set of methods added specifically for this admin
page — **they perform no requester/role check of their own; the caller (only
`class-culture-hubs-admin.php`) is responsible for the `current_user_can('manage_options')`
check**. Never call them from a REST route without adding that capability check at the route
handler itself.

`admin_set_role()` also does two things the member-facing API can't: it can hand ownership to a
new user directly (demoting whoever currently holds `'owner'` to `'mod'` so a Hub is never left
with two owners — official Hubs, having no owner, just skip that demote step and go straight to
assigning one), and it auto-subscribes a newly-added member to the Hub's newsletter list the same
way `join()` already does (`admin_remove_member()` mirrors `leave()`'s unsubscribe the same way)
— so a member added directly from WP Admin behaves identically to one who joined through the app.

**Never hard-deletes a Hub** — only `archive`/`reactivate`, same "never hard-delete a user-created
group" convention as Stoop Clusters and every other community feature in this codebase. If a
genuine deletion is ever needed, that's a deliberate exception to raise with the user first, not
something to add to this admin page by default.

### Official-Hub seeding race condition — duplicate Hubs (fixed July 2026)

User-reported: two "Literature" Hub cards on `/hub`, one with real member/post activity, one
nearly empty. Root cause: `Culture_Hubs::init()` (which calls `maybe_seed_official_hubs()`) is
hooked on WordPress's `init` action — fires on **every** request, not just plugin
activation/deploy. `maybe_seed_official_hubs()`'s only guard was a `culture_official_hubs_seeded`
option checked-then-set with no locking, so any concurrent requests landing in the brief window
before that option was persisted (realistically: a burst of traffic right after this feature
first deployed) could each pass the "not seeded yet" check, then each independently
`wp_insert_post()` their own Hub for the same section — one ends up referenced in
`culture_section_hub_map` (the "canonical" one everything auto-links to going forward), the
other(s) become invisible, un-linked-to orphans that are still `publish`ed and still show up in
the Discover listing (`Culture_Hubs::discover()`, which only filters by `_hub_status`/
`post_status`, not slug-uniqueness).

Fixed with three changes in `class-culture-hubs.php`:
- **`maybe_seed_official_hubs()`** now takes a `get_transient()`/`set_transient()` advisory lock
  (30s TTL) before entering the seeding loop, plus a direct DB check (`_hub_slug` meta, not the
  possibly-stale `$map` local variable) for an already-existing Hub before inserting a new one for
  any given section. Neither is a perfect atomic guarantee on its own, but together they close off
  the race for all practical purposes — this was a one-time burst-traffic bug, not an ongoing
  contention path.
- **`maybe_merge_duplicate_official_hubs()`** (new, hooked into `init()` after the two existing
  `maybe_*` calls, gated by its own `culture_hub_duplicates_merged` option — same one-time-only
  shape as every other `maybe_backfill_*()` in this class) finds any leftover duplicate Hub post
  per section slug and merges it onto the canonical (mapped) Hub via a new private
  `merge_hub_into()`: reassigns any `culture_post._hub_id` pointing at the duplicate, reassigns
  `wp_culture_hub_members`/`wp_culture_hub_follows` rows (dropping the duplicate's row instead of
  reassigning it for any user who already has one on the canonical Hub, since both tables have a
  `UNIQUE (hub_id, user_id)` constraint), recomputes the canonical Hub's cached
  `_hub_member_count`/`_hub_post_count` counters from the merged data (these are cached counters,
  not live queries — see `get_hub()`), then `wp_trash_post()`s the now-empty duplicate. Nothing
  genuine (a post, a membership, a follow) is lost — only the duplicate shell post goes away, and
  it's trashed rather than hard-deleted, so it's reversible.
- **`get_hub_by_slug()`** now joins `wp_posts` and excludes `post_status = 'trash'` — previously a
  raw `postmeta` lookup with no status filter, so a trashed duplicate's `_hub_slug` postmeta row
  (untouched by `wp_trash_post()`) could still win the `LIMIT 1` depending on row order even after
  merging. Fixed with an explicit `ORDER BY post_id ASC` for determinism too.
- **If this pattern (a `maybe_*once*` seeding/backfill function hooked on `init`) is reused for a
  future feature, give it the same transient-lock + direct-DB-existence-check treatment from the
  start** — `maybe_seed_official_hubs()` had none of this until the bug actually surfaced in
  production.

### Official-Hub default cover images (July 2026)

Official Hubs are platform-owned (`post_author = 0`, no owner row in `wp_culture_hub_members`),
so nobody could ever upload a cover for them — they launched with an empty `_hub_cover_image_url`
and showed the generic 🏷 placeholder on `/hub` for all 11. (Creator-owned Hubs already had a
working upload flow the whole time — `CreateHubClient.tsx`/`HubManage.tsx` — this only affects the
11 platform-owned ones.)

- **`Culture_Hubs::SECTION_COVER_IMAGES`** — one Wikimedia Commons `upload.wikimedia.org` URL per
  section (Music/Fashion/Art/Film/Food/Sport/Travel/Ideas/Literature/Design/Tech), chosen for
  stability (permanent direct file URLs, no API key, no expiry) over Unsplash/Pexels (both need a
  key for programmatic use; `source.unsplash.com`'s keyless redirect service was deprecated).
- **`Culture_Hubs::SECTION_COVER_CREDITS`** — attribution text for the 6 sections under CC BY /
  CC BY-SA (license requires credit); empty string for the 5 under CC0/Public Domain
  (Music/Travel/Literature/Design/Tech), which require none. Stored per-Hub as
  `_hub_cover_image_credit` postmeta, surfaced only as the cover `<img>`'s `title` attribute (a
  native hover tooltip) in `HubDiscoverClient.tsx` and the single-Hub banner
  (`hub/[slug]/page.tsx`) — a ~100px archive card thumbnail has no good spot for a permanent
  visible credit line without cluttering it, and a hover tooltip is a defensible "reasonable to
  the medium" attribution for a small decorative thumbnail. **If a future redesign gives Hub
  covers more visual real estate (e.g. a full-width single-Hub hero), consider making the credit
  visible rather than hover-only** — the tooltip is a deliberate space-constrained compromise, not
  the ideal.
- Both maps are keyed by section name and consumed by `maybe_seed_official_hubs()` (new installs)
  and the new one-time `maybe_backfill_official_hub_covers()` (hooked into `init()`, gated by
  `culture_hub_covers_backfilled`, same shape as every other `maybe_*` in this class) — the
  backfill only ever fills in a currently-empty `_hub_cover_image_url`, never overwrites one an
  admin set manually. `handle_hub_update()`'s `coverImageUrl` branch clears
  `_hub_cover_image_credit` when a real cover replaces a default one (not reachable via the API
  today for official Hubs specifically, since they have no owner row, but kept correct for if an
  admin tool for that ever ships).
- Sourcing method: none of the 11 images are a portrait of a specific identifiable named person
  (avoids likeness/publicity-right complications) — all were verified to actually resolve (real
  image bytes, not a 404/redirect) before being hardcoded into the constants above. If any ever
  goes stale (Commons file renamed/deleted — rare but not impossible for permanent file URLs),
  swap the one broken entry in `SECTION_COVER_IMAGES`/`SECTION_COVER_CREDITS`, not the whole set.

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

Moved to `docs/claude-md-archive.md` (historical visual-rebuild / build-fix pass — superseded or no longer actionable; see that file for full detail if ever needed).

### Directory Entry Detail page — visual fidelity pass (June 2026)

Moved to `docs/claude-md-archive.md` (historical visual-rebuild / build-fix pass — superseded or no longer actionable; see that file for full detail if ever needed).

### Directory Entry Detail page — follow-up bug-fix pass (double border, radius, lightbox; June 2026)

Moved to `docs/claude-md-archive.md` (historical visual-rebuild / build-fix pass — superseded or no longer actionable; see that file for full detail if ever needed).

### SearchModal structural-filter pattern — chips apply without typing (July 2026)

A real gap was found and fixed while building the People Near Me rebuild below: not every chip
group in `apps/connect/components/SearchModal.tsx` actually did anything without a typed query.
Only Directory's Region/Sort chips called their bus emitters directly on click
(`emitDiscoverFilters()`, independent of `query`); every other facet (Category, Event City/Price/
Format) only ever fed into `runSearch()`, which early-returns when `query` is empty — so clicking
those chips with an empty search box silently did nothing. Two fixes landed from this:
- **The generic Category chip row is now hidden in both Directory and People context**
  (`!isDirectory && !isPeople`) — it never had real wiring in either context (Directory has its
  own Type group below; People has the Industry group below), so showing it was a dead control,
  not a smaller version of a working one. **(The People half is gone as of September 2026 —
  the guard is now `!isDirectory && !isStoop`; see "People Near Me / member directory
  RETIRED" above. The principle stands and still applies to any new chip group.)**
- **Any future context-specific chip group must follow the Region/Sort pattern**: call its own
  `emit*Filters()` bus function directly from the `onClick`, not route through `runSearch`/
  `runPeopleSearch`. Those two functions (and their `!q.trim()` early-return) are only for
  populating the modal's own inline result list — a completely separate concern from
  remote-controlling a page's grid. Events' City/Price/Format chips still have this exact gap
  (flagged, not yet fixed — out of scope for this pass, only Discover and People were in scope).

**Discover's Type filter also moved into the modal (later same month, July 2026)** — it had
originally been kept on-page as `.disc-type-tabs` underline tabs (a deliberate choice at the
time: "no typing required, always visible"), but the user asked to bring it in line with
People Near Me's Industry treatment. `DiscoverFilters` (`discoverFiltersBus.ts`) gained a `type:
string | null` field alongside `region`/`sort`; `SearchModal.tsx` gained a `DISCOVER_TYPES` chip
group (mirrors `TYPE_BADGE` in `DiscoverBrowser.tsx`, colored dot, no emoji) right above Region,
with a `selectDiscoverType()` handler following the exact same immediate-emit pattern. On the
page side, `.disc-type-tabs` is now dead (left in `discover.css`, not deleted, same "kept in case
needed again" convention used elsewhere in this file) and replaced by a `.disc-active-filters`
row — one chip for Type, one for Region, each independently clearable — mirroring
`.ppl-active-filters` exactly. The modal's own text-search fold-in (for its inline result list)
now combines both Type and Region labels into the `category` keyword param when present.

## Stoop marketing landing page (`/stoop`, Site A, September 2026)

A public acquisition page for Stoop, built because Stoop is being used as the main
entry-point pitch for joining Moveee and downloading the app. Mockup-first as usual (an
Artifact, iterated through several rounds of copy direction before any code was written);
`apps/site/app/stoop/page.tsx` + `stoop.css`. It is a **plain static server component** — no
data fetching, no session, no `dynamic` override needed.

- **Route registration**: `'stoop'` added to `APP_ROUTES` in `apps/site/proxy.ts`, without
  which the bare `/stoop` path would be swallowed by the legacy-WordPress-permalink catch-all
  and 301'd to a nonexistent `/magazine/stoop` — the same trap `'literary'` documents. It is
  **deliberately not in `connectPrefixes`**: this is Site A's own page, and its CTAs link out
  to `web.themoveee.com` rather than the path itself redirecting there. Also added to
  `sitemap.ts`'s `staticPages`.
- **CTAs**: "Get Started" → `{CONNECT_URL}/register`, "Sign in" → `{CONNECT_URL}/login`, both
  carrying a `callbackUrl` of `/connect/stoop` so a member lands on the Stoop browser rather
  than the generic feed. "Read about hosting" → `/cluster/create`.
- **Every class is `stp-`-prefixed, and this is not optional.** The mockup used bare
  `.hero`/`.btn-primary`/`.btn-ghost`/`.step`/`.wrap`, and `stoop.css` loads into `apps/site`'s
  global cascade where several of those names already belong to other surfaces — carrying them
  over verbatim would have silently restyled unrelated pages. Same lesson as the comment-box
  redesign's `.btn-ghost` collision documented elsewhere in this file.
- **Gotcha worth knowing: `apps/site`'s global `--rule` is a solid dark colour (`#2a241c`), not
  a translucent hairline.** The mockup assumed the latter. Using `var(--rule)` for the card
  borders here would have painted them near-black. Local `--stp-rule`/`--stp-rule-strong`/
  `--stp-shadow`/`--stp-shadow-lift` are scoped to `.stp-page`, never `:root`, so nothing
  leaks out of the route. **Check what `--rule` actually resolves to in the app you're in
  before reaching for it as a border colour.**
- **Photo slots are CSS background layers, not `<img>`/`next/image`** — each `.stp-ph--*` rule
  is `background-image: url("/stoop/<name>.jpg"), linear-gradient(...)`, so a missing file
  degrades to a plausible block of colour instead of a broken-image icon. That is what let the
  page ship before the photography existed. **Drop the real files at
  `apps/site/public/stoop/{hero,talking,table,doorstep,arriving,planning,street}.jpg` and
  they appear with no code change.** Each filename is commented in `stoop.css` with the shot it
  needs. **When the real photos land, convert these to `next/image`** — a CSS background
  carries no alt text, no responsive srcset and no lazy loading, which is fine for placeholder
  art and not fine long-term. There is a TODO to this effect in the file.
- **The page clears the fixed header via `padding-top: var(--header-clear, 96px)` on
  `.stp-page`** — the hero is light, so it deliberately does *not* carry
  `data-header-zone="dark"`.
- Copy is deliberately plain and non-technical, per explicit direction: no "check in", no
  "streak", no "cluster", no "tier", no punchlines. The weekly section describes what people
  actually do (turn up, eat and talk, make plans), not the QR/reminder mechanics. Rewards are
  one line, not a breakdown. **If you edit this page's copy, keep that register** — several
  rounds of feedback went into removing exactly that kind of language.
- **Three follow-up changes (September 2026)**: the CTA pairs became `StoopCtas.tsx`, a client
  island that swaps "Get Started"/"Sign in" for "Find groups near you"/"Start a group" once
  `useSession()` resolves an authenticated visitor (same pattern as `LiteraryMasthead.tsx`,
  reading the shared `.themoveee.com` cookie — the page itself stays static); the "A group opens
  once four people have joined" section was removed at the user's request, leaving
  `.stp-facts`/`.stp-fact*`/`.stp-ph--door` dead but kept, and `door.jpg` no longer needed; and
  `.stp-two` went from `align-items: center` to `start` so a left column doesn't float
  vertically against a taller card beside it.
- **A real bug found in that pass, worth remembering**: `.stp-week-note`'s `margin-top` had
  never once applied, because `.stp-page p { margin: 0 }` (0,1,1) out-specifies
  `.stp-week-note` (0,1,0) — the note had been sitting flush against the cards since it
  shipped. Fixed by qualifying the rule to `.stp-page .stp-week-note`. **This file sets
  `margin: 0` on every `p` under `.stp-page`, so any new rule here that needs a margin on a
  paragraph must carry at least two classes** — same "a more specific selector silently zeroes
  a margin a more general rule was meant to set" class of bug already documented for the
  article gallery/table.
- **Verified in a real browser** (unlike most passes in this file): the real `stoop.css` plus
  the real `:root` tokens from `globals.css` were rendered in headless Chromium at 1280px and
  390px — no horizontal overflow at either width, no console errors. Also checked via a
  TypeScript syntax pass on all three touched/new files, a CSS brace/paren balance check
  (73/73, 86/86), a JSX-vs-CSS class parity diff (zero orphans in either direction), and
  `scripts/check-brand-language.sh` (clean). `apps/site` has no `node_modules` in this sandbox,
  so no `next build`/full type-check was possible — re-check the live route and the outbound
  CTAs in a real environment.

### People Near Me / member directory RETIRED — both platforms (September 2026)

**The whole feature is gone.** Per an explicit product decision: Stoop and Literati Connect
are now how a member finds people near them, so a second, parallel "browse every member in
your area" surface was redundant with them and was retired rather than maintained alongside
them. **Everything in the "People Near Me — full rebuild" section directly below this one is
superseded and describes deleted code** — it is kept only so the git history and any external
reference to that rebuild resolve to an explanation rather than a silent gap.

**Deleted outright** (not left as dead code, since none of it had any other consumer):
`apps/connect/app/connect/people/` (the `/connect/people` route), `apps/connect/app/people.css`
(`ppl-*`), `packages/shared/components/connect/MemberDirectory.tsx`,
`packages/shared/lib/peopleFiltersBus.ts`, and
`apps/mobile/src/screens/community/MemberDirectoryScreen.tsx` plus its `ConnectStack`
registration and its `AppParamList`/`RootStackParamList` entries.

**`/connect/people` was doing double duty as the de facto "Find your Stoop" destination** —
five separate CTAs pointed at it even though a real Stoop browser (`/connect/stoop`,
`StoopBrowser.tsx`) had existed since July 2026. Every one of them was **re-pointed, not
removed**, which is a genuine fix rather than a migration: `/member`'s Stoop card,
`/connect`'s hero CTA, its mid-page offer CTA and its final-band CTA, `/cluster/create`'s back
link, and — on mobile — `MemberDashboardScreen.tsx`'s "Find your Stoop" quick link (now
`StoopHomeScreen`). `Culture_Cron`'s two `cluster_forming_expired` notification `action_url`s
(`class-culture-cron.php`) said "try joining a nearby Stoop instead" while linking at the
member directory — also re-pointed to `/connect/stoop`. **If you find any other link still
aimed at a removed people surface, `/connect/stoop` is almost always the right target.**

**Nav/chrome entries removed**: `Header.tsx`'s `RAIL_LINKS` entry and its now-unused `people`
`RailIcon` case, the shared `Footer.tsx`'s "People Near Me" link, the `mco-section-nav` row on
both `/connect` and `/connect/membership` (both now read "Stoop" and point at
`/connect/stoop`), the `← Directory` back link on `/connect/[username]`, and
`MakerProfileScreen.tsx`'s "View in Directory →" card. **Public member profiles
(`/connect/[username]`) are untouched and still fully live** — they are linked from feed
cards, mentions and follow lists everywhere, and were never part of the directory itself.

**`SearchModal.tsx` lost its entire People context** — the `Person` content type (which was
never a real WP post subtype), the `PEOPLE_INDUSTRIES`/`PEOPLE_REGIONS` facet consts, the
`MemberResult` shape, `runPeopleSearch()`, the `selectPeopleIndustry()`/`selectPeopleRegion()`
bus emitters, the two `isPeople` filter groups and the member results branch. The generic
Category chip row's `!isDirectory && !isPeople && !isStoop` guard is now
`!isDirectory && !isStoop`. **Consequence worth knowing: there is no longer any way to search
for a member by name anywhere in the app** — WordPress's native search has no concept of
Users, which is exactly why that bespoke endpoint existed. If member search is ever wanted
back, it needs a deliberate new decision, not a revert of this removal.

**Deliberately left in place, unused**: `GET /culture/v1/members` +
`Culture_REST_API::handle_get_members_directory()` (including the `region`/`sort`/`offset`
params added for the July 2026 rebuild) and its `apps/connect/app/api/connect/members/route.ts`
proxy. Removing them would need a plugin redeploy for zero benefit, they are a harmless
authenticated read, and they are the only member-search backend that exists — so they are the
natural starting point if the decision above is ever revisited. This follows the same
"kept in case needed again" convention used throughout this file. **The mobile
`/mobile/members` endpoint is a different thing and is still load-bearing** — it backs the
composer's `@mention` autocomplete and `UserSearch.tsx`; do not remove it.

Verified via `tsc --noEmit` on `apps/mobile` (37 errors before and after, byte-identical — the
documented pre-existing baseline, see the SDK 57 upgrade entry), a TypeScript syntax check on
all nine edited web files, `php -l` on `class-culture-cron.php`, and a repo-wide grep
confirming no live reference to any removed symbol or route survives (the remaining hits are
all historical comments). `apps/connect` has no `node_modules` in this sandbox, so no
`next build`/full type-check was possible — re-check that `/connect/stoop` actually renders
from each re-pointed CTA in a real environment before considering this closed.

### Lesson from the (now-deleted) People Near Me rebuild: `apps/site`'s `tsc` checks all of `packages/shared/**`

`apps/site/tsconfig.json`'s `include` array globs the entire `packages/shared/**` tree
(`"../../packages/shared/**/*.tsx"`) regardless of whether any `apps/site` page actually imports a
given file — so a shared component importing a helper that only lives in `apps/connect/lib/` (via
the `@/lib/*` alias, which checks `packages/shared/lib/*` → `packages/utils/*` → `./lib/*` last)
resolves fine for `apps/connect`'s own build but fails `apps/site`'s `next build` type-check,
surfacing as a real Vercel deploy failure, not just an IDE squiggle. **A shared component that's
only consumed by one app still needs its *own* dependencies to live under `packages/shared/`, not
under that one app's local `lib/`.** Don't dismiss a "Cannot find module '@/lib/...'" error under
`packages/shared/` as another app's problem without checking whether `next build`'s own
type-check — not just a manual `tsc --noEmit` scoped to one app — would actually hit it.

### Stoop — full rebuild on the Discover/People/Events design system (`stoop-*`, July 2026)

`/connect/stoop` and `/cluster/[id]` rebuilt from an approved Artifact mockup, following the same
conventions established for Discover/People Near Me/Events — full-width single-column layout,
the shared search-modal trigger button (a new "Stoop" `SearchModal` context with a City chip
group, immediate-apply via a new `stoopFiltersBus.ts`), and white feed-card visual language.
Both pages previously used the old `.mco-*`/`.con-btn-*`/`.mem-*` treatments (`/connect/stoop`'s
plain dark hero + inline `Stoop.tsx` list card; `/cluster/[id]`'s dark `mem-hero` + flat white
`mem-card` stack) — this was the last major Connect surface still on that older system.

- **New CSS namespace**: `apps/connect/app/stoop.css` — `.stoop-*` for the browse page (search
  btn, active-filter chip, "How Stoop Works" 3-step band, rails, grid, capacity bar, empty/start
  states), `.your-stoop`/`.ys-*` for the member-state hero card, `.stoop-detail-*` for the
  individual Stoop page. All colors route through the existing `--paper`/`--ink`/`--ochre`/
  `--gold`/`--success`/`--mute`/`--rule` tokens (`color-mix(in srgb, var(--token) X%,
  transparent)` for tinted overlays, same convention as the dark-mode sweep above) — no new
  literals, so this inherits full dark-mode support automatically.
- **`packages/shared/components/connect/StoopBrowser.tsx`** (new, replaces the deleted
  `Stoop.tsx`) — mirrors `MemberDirectory.tsx`'s shape exactly: subscribes to
  `stoopFiltersBus`'s City filter (never renders its own filter UI, same as People's
  industry/region), resolves membership via `/api/cluster/my-clusters` once on mount, then
  branches:
  - **Browse state** (not a member): "How Stoop Works" 3-step band, a "Near You" rail
    (`/api/cluster/discover` scoped to city/country), and a paginated "Explore More" grid with a
    Fewest-members/Newest sort dropdown (maps directly to the backend's existing
    `nearest_capacity`/`newest` sort param — no new backend work needed).
  - **Member state**: a full-bleed dark "Your Stoop" hero (meeting cadence, host, a live member
    avatar strip via `/api/cluster/{id}/members`) plus a "More in {city}" overflow rail —
    **joining a second Stoop is just a normal `join()` call** (confirmed by reading
    `Culture_Clusters::join()` — it only checks capacity and this cluster's own existing-member
    row, nothing prevents a second membership), so "Join as Overflow" is UI framing only, no new
    endpoint.
  - Every card shows a **capacity badge** derived from `memberCount`/`capacity`
    (`capacityBadge()`: <60% "Open", 60–79% "Filling up", ≥80% "N spot(s) left", 100% "Full",
    join disabled) — this data was already fetched everywhere but never surfaced before.
- **Privacy fix, not just a redesign**: the old pages showed a cluster's exact `street` to
  *everyone*, member or not, regardless of the `_cluster_address_visible` setting (which defaults
  to `members_only` at creation — see the Host Onboarding Flow entry above). That field is set
  but was never actually read anywhere in the frontend. Fixed by withholding `street` from every
  browse-context card (rail, grid, overflow — anywhere a Join button appears) down to city-level
  only; the full address now only ever renders once you're actually a member (the "Your Stoop"
  hero, and the detail page's capacity card when `status.isMember`).
- **`/cluster/[id]/page.tsx`** rebuilt onto `stoop-detail-*`: host-mechanism/venue-type/
  accessibility badges, a real capacity gauge, and — new — an actual **rendered member list**
  (`ClusterMembers.tsx`, new, server-rendered from the same `/culture/v1/cluster/{id}/members`
  endpoint `ClusterCheckin.tsx`'s manual check-in modal already used) where the old page only
  ever showed a bare count even though the per-member data already existed server-side.
  `ClusterActions.tsx` was split into join-only; a new `ClusterLeaveButton.tsx` handles leaving
  separately (previously one component did both, toggling on local state) — this made the
  top-of-page primary CTA (`.stoop-detail-primary-cta`, shown only when not a member) and the
  low-emphasis bottom "Leave this Stoop" link (shown only when a member) cleanly independent,
  server-truth-driven via conditional rendering rather than client-side toggling.
  `ClusterCheckin.tsx`/`ClusterElection.tsx` kept their exact existing logic (QR code, manual
  check-in, streak counter, candidate voting/starting an election) — only the JSX/classnames
  changed, no behavior changes. `ClusterShareButton.tsx` (invite-link banner for pre-active
  clusters gathering their first 4 members) was left untouched — still pulls its `.clu-share-*`
  styles from `member.css`, which `page.tsx` now imports alongside the new `stoop.css`.
- **Deleted**: `packages/shared/components/connect/Stoop.tsx` (the old inline list-card, fully
  superseded by `StoopBrowser.tsx` — confirmed via grep it had exactly one importer, the page
  being rebuilt). Its `.mco-fellowship-*` CSS in `feed.css` was left in place (kept in case
  needed again, same convention as other superseded CSS blocks noted elsewhere in this file).
- *(Not verified live this pass.)*

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
  regardless of the upstream API's own shape (TMDB's results also carry a `genres?: string[]`,
  see below) — duplicated in both `apps/connect` and `apps/site`
  (mobile hits `apps/site` via `PROXY`, web hits `apps/connect` via a relative fetch). Google
  Books needs an optional `GOOGLE_BOOKS_API_KEY` env var (works keyless at low volume). Spotify
  needs `SPOTIFY_CLIENT_ID`/`SPOTIFY_CLIENT_SECRET` (client-credentials OAuth via
  `packages/shared/lib/spotify.ts`'s `getSpotifyToken()`, module-level cached). TMDB has **no
  keyless tier** — needs `TMDB_API_KEY` (v3 API, plain `api_key` query param, no OAuth) or every
  search returns empty. All three degrade to empty results (not an error) when credentials are
  absent — the manual "add anyway" fallback always still works.
  **Bug fixed (July 2026): the Google Books route folder was actually `/api/external/books/search`**
  in both apps — a naming mismatch against `DirectorySearch.tsx`'s `externalSource="google_books"`
  (which fetches `/api/external/${externalSource}/search`), so every Google Books search silently
  hit a 404 and fell back to empty results, **regardless of whether `GOOGLE_BOOKS_API_KEY` was set
  correctly** — the request never reached the route at all. Fixed by renaming the folder to
  `google_books` in both `apps/connect` and `apps/site` to match the already-correct
  `externalSource` convention used by Spotify/TMDB. If Spotify/TMDB search still doesn't work
  after confirming this fix is deployed, check that `SPOTIFY_CLIENT_ID`/`SPOTIFY_CLIENT_SECRET`/
  `TMDB_API_KEY` are set on **both** Vercel projects (Site A `apps/site` and Site B
  `apps/connect` have entirely separate env var configs — web hits `apps/connect`'s own routes,
  mobile hits `apps/site`'s via `PROXY`) and that a fresh deploy happened *after* adding them —
  Vercel snapshots env vars per-deployment, so saving them in the dashboard alone doesn't reach
  an already-running serverless function until the next build.
  **Follow-up (September 2026): every credential/upstream failure was completely silent, making
  a real "music search doesn't work, book search does" report undiagnosable from the codebase
  alone.** `getSpotifyToken()` and all four of `/api/external/{spotify,tmdb}/{search,preview}`'s
  own fetches (in both `apps/connect` and `apps/site`) collapsed missing env vars, a rejected
  token/search request, and a genuine network error into the exact same empty array/`null` —
  indistinguishable from "no results found for this query." Google Books "working" while
  Spotify/TMDB don't is exactly what you'd see if the latter two's credentials were never
  correctly reaching this deployment (wrong Vercel project, not redeployed after saving, a
  swapped/truncated Client ID or Secret) — Google Books is the one source of the three that
  still makes a real request and gets real results even with **no** key at all, so it can't
  fail this way. Added `console.error("[spotify]"/"[spotify-search]"/"[spotify-preview]"/
  "[tmdb-search]" ...)` at every one of these failure branches (missing credentials, the token
  endpoint rejecting them, a rejected search/preview request, a thrown network error) — the
  client-visible behavior (empty results, no error surfaced) is unchanged, but this deployment's
  Vercel Function Logs will now say exactly which step failed. **If this exact symptom recurs,
  check Function Logs for a `[spotify]`/`[tmdb-search]` line before assuming it's a code bug
  again** — it will now say whether the env vars are missing on *this* deployment specifically,
  or whether Spotify/TMDB themselves rejected the configured credentials (wrong pair, expired/
  regenerated secret, etc.), rather than requiring another round of blind guessing. Not verified
  against real Spotify/TMDB credentials or a live Vercel deployment from this sandbox — verified
  via a brace/paren balance check on all 7 touched files. Re-check the real Function Logs the
  next time a music/film search is attempted before considering this closed.
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
- **TMDB genre pre-select (July 2026, Film Review only)** — unlike the director, genre data
  *is* on the search result itself (`genre_ids: number[]` from `/search/movie`, no extra
  lookup needed), so both `/api/external/tmdb/search` routes map it straight into a `genres:
  string[]` field on each result via a small static `TMDB_GENRE_MAP` (TMDB's genre IDs are a
  small, stable set — no need for a live `/genre/movie/list` call). Only mapped for the 8 TMDB
  genres that have a match in the composer's own curated `FILM_GENRES` list (Action, Animation,
  Comedy, Documentary, Drama, Romance, Sci-Fi, Thriller) — the rest (Adventure, Crime, Family,
  Fantasy, History, Horror, Music, Mystery, TV Movie, War, Western) are dropped, never
  force-mapped to something close. Selecting a film in `DirectorySearch` passes `genres` through
  to the parent's `onChange`/`onSelect`, which pre-selects the Film Review genre chips
  (`setFilmGenres(entry.genres)`) — a **suggestion**, not a lock: the reviewer can still add/
  remove chips freely afterward, and picking a different film just re-suggests from scratch.
  Book (Google Books `categories`, free-text/inconsistent) and Music (Spotify genre is
  artist-level, not album-level, via a separate call, and uses a messy micro-genre taxonomy)
  were deliberately **not** given the same treatment — no clean source data to pre-fill from.
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

## Reading Tracker (StoryGraph-style shelves/mood/pace/stats) — Phases 1–4 shipped, September 2026

**Full plan: `docs/reading-tracker-plan.md`.** Build order is strictly phased (§8): shelves →
goal → mood/pace → stats dashboard → Buddy Reads prefill → gamification hook. **Phases 1
(shelves), 2 (reading goal), 3 (mood/pace tags), and 4 (stats dashboard) are all built** —
Buddy Reads prefill and the gamification hook are still planning-only; don't assume either
exists because the first four phases do. Requested as "implement
similar features to StoryGraph (the book-tracking app) into Moveee web and mobile" — the plan
doc breaks StoryGraph's feature set into what's already covered by existing Moveee
infrastructure (Book Review's ratings/genres, `culture_directory` book entries, Hubs for Buddy
Reads, the `AnalyticsClient.tsx` chart components for stats) versus what's genuinely new.
Explicitly deferred past v1 regardless of phase: page-progress tracking, format tracking,
Goodreads/StoryGraph import, a public reading-profile page, content warnings, and
mood/pace-driven recommendation ranking (see the doc's §0/§9).

### Phase 1 — shelves (want to read / currently reading / read)

**Backend**: `Culture_Reading_Tracker` (new,
`culture-community/includes/core/class-culture-reading-tracker.php`) — single source of truth,
same "one class, two mirrored REST surfaces" shape as `Culture_Community_RSVP`. New table
`wp_culture_reading_shelf` (`id, user_id, directory_id, status, started_at, finished_at,
created_at, updated_at`, `UNIQUE KEY (user_id, directory_id)` — upsert, not duplicate rows, same
convention as `wp_culture_hub_members`/`wp_culture_follows`), wired into
`Culture_Activator::create_tables()`; `CULTURE_VERSION` bumped `3.1.0` → `3.2.0` to trigger the
dbDelta on next deploy (a code push alone never runs `register_activation_hook()` — see "Plugin
DB table auto-upgrade" above). `set_shelf_status()` validates the status against
`Culture_Reading_Tracker::STATUSES` and that `directory_id` resolves to a published
`culture_directory` post; `started_at`/`finished_at` are **sticky** — set once on first entry
into `currently_reading`/`read`, never overwritten by a later re-transition (e.g. finishing a
re-read doesn't erase the original finish date). `get_user_shelf()` returns each entry's
title/slug/thumbnail (post thumbnail or `_external_cover_url`) and author via
`Culture_Directory::get_first_about_field()` — that method was widened from `private` to
`public` specifically so this class could reuse it rather than re-parsing `_about_fields` itself.

REST routes, mirrored exactly like every other feature in this plugin (mobile JWT vs. web
API-key + explicit `user_id`): `POST/DELETE/GET /mobile/reading/shelf`,
`GET /mobile/reading/shelf/counts` (`class-culture-mobile-api.php`) and
`POST/DELETE/GET /reading/shelf`, `GET /reading/shelf/counts` (`class-culture-rest-api.php`).

**Web** (`apps/connect`): `/member/reading` (new `AccountNav` entry, "📚 Reading Tracker",
between Portfolio and Collection — added immediately, not left as a "no nav path to it" gap the
way Portfolio/Collection once were, per that section's own documented lesson). `page.tsx` is the
standard `.acct-page`/`.acct-wrap`/`AccountNav` server shell (modeled on `/member/wallet`);
`ReadingTrackerClient.tsx` owns the three-tab (`.wal-tabs`, reused verbatim) shelf switcher, a
`.rt-grid` of `.rt-card` book cards (per-card shelf-move `<select>` + remove button), and an
"Add a Book" modal wrapping the shared `DirectorySearch` composer component
(`typeFilter="book"`, `aboutFieldLabel="Author"`, `externalSource="google_books"` — same
dedup-by-external-id mechanism Book Review already uses, no new search/creation endpoint
needed). Two new proxy routes, `app/api/reading/shelf/route.ts` (GET/POST/DELETE) and
`app/api/reading/shelf/counts/route.ts` — both resolve `user_id` from
`getServerSession(authOptions)` server-side and never trust a client-supplied one, per the plan
doc's own privacy ground rule (§7). New `.rt-*` CSS appended to `member.css`.

**Mobile** (`apps/mobile`): `ReadingTrackerScreen.tsx` (`screens/member/`), registered in both
`ConnectStack` and `MemberStack` (same dual-registration every other member screen gets) and
added to `useNav.ts`'s `AppParamList`. Same shelf-tabs/grid/add-book-modal shape as web, calling
`${MOBILE_API}/reading/shelf*` via `api.get/post/delete`. Uses the mobile `DirectorySearch`
component (`components/composer/DirectorySearch.tsx` — note its prop names differ slightly from
the web version: `onSelect`/`selected`, not `onChange`/`value`, and its `DirectoryEntry` has no
`slug` field). Linked from `MemberDashboardScreen.tsx`'s `QUICK_LINKS` ("📚 Reading Tracker").

### Phase 2 — reading goal (per-year target, live progress)

**Backend**: extends `Culture_Reading_Tracker` — a new table, `wp_culture_reading_goal`
(`id, user_id, year (smallint), target_books (int), created_at, updated_at`, `UNIQUE KEY
(user_id, year)` — one row per user per year, upsert on repeat sets), wired into the same
`create_table()` this class already owned; `CULTURE_VERSION` bumped `3.2.0` → `3.3.0` to trigger
the new table's `dbDelta` on next deploy (plugin header also bumped `2.6.1` → `2.6.2` for the
same redeploy-confirmation reason documented elsewhere in this file). `get_goal($user_id, $year)`
returns `{year, targetBooks, booksRead}` — **`booksRead` is always a live `COUNT(*)` against
`wp_culture_reading_shelf` (`status = 'read'` AND `YEAR(finished_at) = $year`), never cached or
denormalized**, unlike a Hub's member/post counters — a personal per-user count doesn't carry
the same "read across many users' lists at once" cost that denormalization exists to solve for
Hubs. `set_goal($user_id, $year, $target_books)` validates `$target_books >= 1`
(`WP_Error('invalid_target', ...)` otherwise) and upserts.

REST routes mirror the shelf endpoints exactly: `GET`/`POST /mobile/reading/goal` (JWT,
`class-culture-mobile-api.php`, `year` optional — defaults to the current year) and `GET`/
`POST /reading/goal` (API-key + explicit `user_id`, `class-culture-rest-api.php`). Both call the
same `Culture_Reading_Tracker::get_goal()`/`set_goal()`.

**Web**: `app/api/reading/goal/route.ts` (new proxy, same shape as the Phase 1 shelf routes —
`getServerSession()` → 401 if absent → `user_id` resolved server-side, never trusted from the
client body). `ReadingTrackerClient.tsx` renders a `.rt-goal-card` **persistent across all three
shelf tabs** (year-scoped, not shelf-scoped, per the plan's own reasoning) — right below the
"+ Add a Book" button and above the tab row. Two states: a summary ("{booksRead} of {targetBooks}
books this year" + an `.rt-goal-bar` progress fill, tapping it opens edit mode) when a goal is
set, or an inline "Set your {year} goal" number input + Save when it isn't. Marking a book `read`
(via `moveShelf`) re-fetches the goal so the progress bar updates live. New `.rt-goal-*` CSS in
`member.css`.

**Mobile**: `ReadingTrackerScreen.tsx` renders the same goal card (`styles.goalCard`/
`goalText`/`goalBar`/`goalBarFill`/`goalEdit*`) as a "Your Year in Books"-style section, placed
between the header and the tab row — same persistent-across-tabs placement as web, same
edit/summary toggle, same "read" transition re-triggers `loadGoal()`.

**No badge/reward tied to hitting 100% in v1** — per the plan's explicit scope note; if that's
ever wanted, it belongs with the later gamification-hook phase, not bolted onto this one.

### Phase 3 — mood/pace tags (community-sourced, per §1.3/§3.4/§7)

Extends `Culture_Reading_Tracker` (same file as Phases 1–2) with a fixed 12-tag mood vocabulary
(`MOOD_TAGS` — StoryGraph's own published set: dark/emotional/funny/reflective/adventurous/
mysterious/hopeful/tense/sad/informative/lighthearted/inspiring) plus a slow/medium/fast pace —
both live on the **directory entry**, not the shelf row, and are community-aggregated (mode of
every signed-in member's own vote), the same "many individual signals → one displayed value"
pattern `_average_rating` already uses. **Per the plan doc's §7 rule, this 12-tag list is fixed
— never let it grow ad hoc** (an admin-configurable free list defeats the point: a 40-tag
vocabulary produces mostly-empty aggregates per book).

**Backend**: new table `wp_culture_book_mood_votes` (`directory_id, user_id, moods JSON, pace`,
`UNIQUE KEY (directory_id, user_id)` — one vote per person per book, upsert on re-vote), wired
into `Culture_Activator::create_tables()` via the same `create_table()` method Phases 1–2 already
use; `CULTURE_VERSION` bumped `3.3.0` → `3.4.0` to trigger it on next deploy (plugin header also
bumped `2.6.4` → `2.6.5`, same redeploy-confirmation convention as every other version-bump entry
in this file). `vote_mood_pace()` validates the target is a real, published `book`-type directory
entry (`has_term('book', 'culture_dir_type', $post)` — `culture_dir_type` is a taxonomy, not
postmeta, don't reach for `get_post_meta()` here) and every submitted mood against `MOOD_TAGS`
before storing, then calls `recompute_book_mood_pace()` — a small per-book aggregation query (mode
for moods, top 5 by count with zero-vote tags dropped; majority for pace, ties broken toward
`medium` per the plan doc) that writes `_book_moods`/`_book_pace` postmeta directly. Same "small
per-book vote count, cheap to recompute on every vote" reasoning the plan doc already gives for
not denormalizing this into a running counter — don't reach for a cached aggregate table if this
ever needs revisiting.

**REST routes**: `POST /mobile/reading/mood-vote` (JWT) / `POST /reading/mood-vote` (API key +
explicit `user_id`) mirror every other Reading Tracker write. **The read side is deliberately the
one exception to this feature's "everything scoped to the caller's own user_id" privacy model**
(see the plan doc's own callout in §7/§1.3) — `GET /mobile/reading/mood-pace` /
`GET /reading/mood-pace` are public (`__return_true`), since the aggregated moods/pace are a
community-visible property of the book, exactly like `_average_rating` already is. A `user_id`
(mobile: `get_current_user_id()`, always attached if a JWT is present; web: only appended by the
proxy route when a session exists) is accepted purely to also return that viewer's own current
vote (`myVote`), so the frontend can show "edit your vote" instead of the initial prompt — never
to reveal anyone else's vote, no other-user read path exists here.

**Frontend — book-only, both platforms**: rendered inside the book's own `culture_directory`
detail page (web: `apps/connect/app/directory/[slug]/BookMoodPace.tsx`, inserted into the
existing infobox column right after the per-type infobox fields, gated on `typeSlug === "book"`;
mobile: `components/community/BookMoodPace.tsx`, inserted into `DirectoryDetailScreen.tsx` as its
own "Mood & Pace" `aboutCard`-styled block, gated on `entry.entryType === "book"`) — **not** the
Reading Tracker screen itself, since mood/pace is a property of the book, not of a user's shelf.
Aggregate chips always render (public data, no auth needed); the voting prompt/form only renders
for a signed-in visitor, and flips from "How would you describe this book? →" to "Edit your mood/
pace vote →" once `myVote` comes back non-null. Chips use `flex-wrap`, never horizontal scroll,
per this file's own standing "composer selection-chip rows wrap, they don't scroll" convention.
Shared vocabulary constants live in `packages/shared/lib/reading-tracker.ts` (web) and
`apps/mobile/src/features/community/readingTracker.ts` (mobile, since RN can't import
`packages/shared`) — both mirror `Culture_Reading_Tracker::MOOD_TAGS` by hand; **keep all three
in sync if this list ever changes**, same caveat this file already documents for
`TEMPLATE_REP_GATE`/the notification icon maps.

**Deliberately not built in this pass** (per the plan doc's own §3.1 item 1, a *Phase 1* gap that
was never actually shipped, not a Phase 3 scope item): a "+ Add to Shelf" segmented control on
the book's own directory-entry page — Phase 1 only ever shipped the Reading Tracker screen's own
"+ Add a Book" modal as the one entry point for shelving. If that directory-page shortcut is ever
wanted, it's a small, independent addition to `set_shelf_status()`'s existing REST surface, not
something this Phase 3 pass touched.

**Not built in this Phase 3 pass** (later phases, do not start without explicit direction beyond
what Phase 4 below now covers): Buddy Reads prefill from a Hub, and the gamification hook
(credits/reputation for shelf/mood activity). None of Phases 1–3's tables/endpoints/components
needed to change to support Phase 4 below — it's additive, per the plan doc's own phase breakdown.

*(Not verified live this pass — needs the plugin redeployed before it's live in production.)*

### Phase 4 — stats dashboard ("Your Year in Books", per §2/§4)

Adds `Culture_Reading_Tracker::get_reading_stats( int $user_id, int $year )` — a single raw-SQL
aggregation method, no new dbDelta table (no `CULTURE_VERSION` bump needed; only the plugin
header `Version:` was bumped, to `2.6.6`, purely for the standard redeploy-confirmation reason
documented in "Plugin DB table auto-upgrade" above). Returns the exact shape the plan doc's §2
specifies (`year`, `books_read`, `pace_breakdown`, `mood_breakdown`, `rating_distribution`,
`top_genres`, `books_per_month`) computed entirely via `$wpdb` queries — never a `WP_Query` loop,
per CLAUDE.md's own "Raw SQL REST endpoints" convention, which this method's own docblock cites
directly.

**Where each number actually comes from, since three different sources feed one payload**:
- `books_read`/`books_per_month` — a single query against `wp_culture_reading_shelf`
  (`status = 'read' AND YEAR(finished_at) = $year`), bucketed by month in PHP after the fetch
  (a fixed 12-key map, always present even for a month with zero books, so the frontend never
  has to backfill missing months itself).
- `pace_breakdown`/`mood_breakdown` — **not** re-derived from the vote table
  (`wp_culture_book_mood_votes`); they read the already-community-aggregated `_book_pace`/
  `_book_moods` postmeta (the same fields `get_book_mood_pace()` reads) off every directory
  entry the user finished that year, via one batched `wp_postmeta` `IN (...)` query. This means
  a user's own stats reflect the *book's* aggregate mood/pace, not what that one user personally
  voted — a deliberate reading of the plan doc's data model, since `_book_pace`/`_book_moods`
  are the only pace/mood values that exist per book (a user's own vote is one input into that
  aggregate, not a separately stored "my pace for this book" value).
- `rating_distribution`/`top_genres` — **sourced from the user's own Book Review posts** (
  `culture_post`, `_template_type = 'book-review'`, `post_author = $user_id`), joined via
  `_linked_directory_id` against the same set of directory IDs finished that year — one grouped
  raw-SQL query using `MAX(CASE WHEN meta_key = '...' THEN meta_value END)` per postmeta key
  (avoids a 1-query-per-post loop). This follows the plan doc's §1.4 "reuse, not new" rule
  directly: rating and genres already live on the Book Review post, never duplicated onto the
  shelf row — a shelved-but-unreviewed book contributes to `books_read`/`books_per_month`/
  `pace_breakdown`/`mood_breakdown` but not to `rating_distribution`/`top_genres`, since there's
  no rating/genre data to pull without a review.
- `mood_breakdown` is returned **sparse** (nonzero moods only, sorted descending by count) rather
  than the full fixed-12-key map `get_book_mood_pace()` would suggest — matches the plan doc §4's
  explicit "one row per mood with a nonzero count, sorted descending" instruction. `top_genres`
  is capped to the top 5.

**REST routes**, same mirrored shape as every other phase: `GET /mobile/reading/stats` (JWT,
`class-culture-mobile-api.php`, `year` optional) / `GET /reading/stats` (API key + explicit
`user_id`, `class-culture-rest-api.php`).

**Web**: new `apps/connect/app/api/reading/stats/route.ts` proxy (session-resolved `user_id`,
same pattern as every other Reading Tracker route) and a new **`/member/reading/stats`** page —
deliberately **not** added to `AccountNav.tsx` as a top-level destination; it's a sub-page of
Reading Tracker (same "linked from its parent page, not the nav" relationship Analytics' own
quick-links have to the Member Dashboard), reached via a new "Your Year in Books →" link added
to `ReadingTrackerClient.tsx`'s toolbar (`.rt-toolbar`, now wrapping the pre-existing "+ Add a
Book" button alongside it). `ReadingStatsClient.tsx` renders six sections (big books-read stat,
books-per-month bars, a 3-segment pace bar + legend, a mood horizontal-bar list, a 5-star rating-
distribution bar list, and a ranked top-genres list) — **deliberately does not reuse
`AnalyticsClient.tsx`'s SVG `BarChart`/`LineChart` components directly**, despite the plan doc
§4 naming them as the thing to reuse: every section here is a small, fixed-size breakdown (≤12
months, 3 paces, ≤12 moods, 5 star ratings, ≤5 genres) that the codebase's existing plain-CSS
"label / track+fill / count" bar-row pattern (the exact shape
`apps/site/app/lifestyle/[slug]/ProductReviews.tsx`'s star-distribution chart already uses)
renders just as well as an SVG chart, with far less code — this was a deliberate implementation
choice, not a shortcut; the *visual pattern* being reused is `ProductReviews.tsx`'s bar rows, per
the plan doc's own alternate framing of the same section ("same shape as `ProductReviews.tsx`'s
existing star-distribution bar chart... reuse that exact visual pattern"). New `.rts-*` CSS
appended to `member.css`, right after the existing Reading Tracker (`.rt-*`) block.

**Mobile**: per the plan doc's explicit "not a separate screen on mobile" instruction, the whole
stats payload renders inline on `ReadingTrackerScreen.tsx` itself, as a new collapsible "Your
Year in Books" card between the reading-goal card and the shelf tab row — collapsed by default
(just the books-finished count), expanding on tap to the same six sections as web. **The
expanded body is wrapped in its own bounded `maxHeight: 340` `ScrollView`** (`nestedScrollEnabled`)
rather than left to grow the outer screen — the screen's header/goal-card/stats-card/tab-row
sit in a plain (non-scrolling) column above the shelf grid's own `ScrollView`, so an unbounded
expanded stats card could in principle push the tabs and the whole shelf grid off-screen with no
way to scroll back to them; bounding the stats body's height and giving it its own internal
scroll avoids that regardless of how much content a given user's stats produce. `loadStats()` is
called on mount alongside `loadCounts()`/`loadGoal()`, and again (alongside `loadGoal()`)
whenever a book's status moves to `read`, so the count/charts stay live without a manual refresh.
Shared `ReadingStats` type (mirrored between `packages/shared/lib/reading-tracker.ts` and
`apps/mobile/src/features/community/readingTracker.ts`, same "no shared source of truth across
the PHP/TS boundary or between the two TS copies" caveat as `MOOD_TAGS`/`PACES`) — keep all three
representations (PHP, web TS, mobile TS) in sync if the response shape ever changes.

**This closes the Reading Tracker feature's four core phases** — shelves, goal, mood/pace, and
stats are all live on both platforms. Only Buddy Reads (a Hub-creation prefill, no new backend)
and the gamification hook (credits/reputation for shelf/mood activity) remain, per the plan
doc's own phase breakdown — do not start either without explicit direction.

*(Not verified live this pass — needs the plugin redeployed before it's live in production.)*

### "Log-First" home concept — naming note

The original mobile-only pass's `SHELF_LABELS`/`LogEntryPanel.tsx` were superseded by the
"Generalised from books to all five review media" pass below (`MEDIA`/`TYPE_MEDIA_MAP`/
`statusLabel()`, `EntryLogControl` + `SocialProofLine`) — if you see those old names in git
history, that's why they're gone.

### Stoop proximity banner + member geolocation (mobile-only, September 2026)

Closes the deferral flagged in the "Log-First" pass above — "N people within 3 miles want to go
too" on a Place directory entry, with a "Start a Stoop here" CTA. Needed real location data first,
which the app never collected before this pass (only free-text city/country strings). Two explicit
decisions were locked in before building, since location is privacy-sensitive: **capture is a
one-time device GPS snapshot** (never background/continuous tracking — the member re-triggers it
manually if they move and want the feature to reflect it), and **stored coordinates are fuzzed to
~2 decimal places (~1.1km at the equator)** before being persisted, so no one's exact home/work
address is ever stored, regardless of how precise the original GPS fix was.

**Backend — new `Culture_Geolocation` class**
(`culture-community/includes/core/class-culture-geolocation.php`) — plain usermeta storage, no new
table: `_culture_geo_lat`/`_culture_geo_lng`/`_culture_geo_updated_at`. `set_location()` is the
**only** write path and always rounds before storing — there is no way to persist an unrounded
coordinate through this class. Also owns the haversine `distance_miles()` helper. Required
alongside `class-culture-reading-tracker.php` in `culture-community.php`.

**`Culture_Reading_Tracker::get_place_proximity( $viewer_user_id, $directory_id, $radius_miles =
3.0 )`** — reuses the exact same `status = 'want_to_read'` shelf rows the "Log-First" social-proof
card already reads (see that pass above), just filtered by real distance instead of by follow
graph. One raw-SQL query joins the shelf table to each interested member's saved lat/lng via two
`LEFT JOIN`s filtered by `meta_key` in the join condition (not a `meta_query`), per this file's
"Raw SQL REST endpoints" convention; distance itself is computed in PHP per row since the result
set is always small (people interested in one specific place). Returns `hasLocation: false` when
the *viewer* hasn't saved a location yet (frontend shows an opt-in prompt instead of the banner);
a member who wants to go but never saved a location is simply excluded from the count — there's no
way to place them. **Never returns another user's raw coordinates** — only a count and up to 3
example names/avatars, closest-first.

**REST — mirrored on both surfaces, same shape as every other Reading Tracker endpoint**:
`GET /mobile/reading/place-proximity` (JWT) / `GET /reading/place-proximity` (API key + explicit
`user_id`) for the read; `POST`/`GET`/`DELETE /mobile/me/location` (JWT) / `.../me/location`
(API key + explicit `user_id`) for capturing, checking, and clearing a member's own location.
**The web write routes are unreachable in practice** — there's no web capture UI (no browser GPS
button was built), but the routes were mirrored anyway per this codebase's standing convention,
since a web capture flow could be added later for free.

**Mobile**: `expo-location` (`~18.0.4`, matching the SDK 52 pin — see "Expo SDK version" below)
added with **foreground-only** permission config in `app.config.ts` (`locationAlwaysAndWhenInUsePermission:
false`, `isAndroidBackgroundLocationEnabled: false`) — there is no background-location entitlement
anywhere in this feature, consistent with the one-time-snapshot decision. `src/features/location/
useLocation.ts` wraps the request-permission → get-fix → POST round trip
(`requestAndSaveLocation()`) plus `clearLocation()`/`fetchLocationState()`.
`src/components/community/StoopProximityBanner.tsx` renders one of three states on a Place entry:
an opt-in prompt (no location saved yet), nothing at all (location saved, but a `count` of 0 —
this is a signal-driven nudge, not always-on copy, per this codebase's "hide the whole section
when empty" convention), or the real banner (avatars + count + "Start a Stoop here →", which
navigates to the existing `HostOnboardingScreen` with no prefill — that screen takes no params
today, so location/city prefill from the directory entry is a real follow-up, not done here) plus
a small "Turn off" link to clear the saved location. Wired into `DirectoryDetailScreen.tsx`
directly below `EntryLogControl`/`SocialProofLine`, gated on `entry.entryType === "place"`.

*(Not verified live this pass — needs the plugin redeployed before it's live in production.)*

### "From people you follow" activity feed — real star ratings/comments (mobile-only, September 2026)

Closes the second deferral flagged in the "Log-First" pass above. `Culture_Reading_Tracker::
get_following_activity()` previously only showed the plain fact "X finished this" — no rating, no
comment, even when the follow actually wrote a full review. `REVIEW_RATING_META` (a class const —
originally added narrower, as `REVIEW_TEMPLATE_BY_TYPE`, then folded into the broader
`REVIEW_RATING_META` map the "Generalised from books to all five review media" pass below builds
for the stats dashboard) maps each review template to the rating meta key that goes with it —
`book-review` → `_book_overall_rating`, `film-review` → `_film_overall_rating`, `music-review` →
`_music_overall_rating`, `hidden-gem` → `_star_rating` (the "Review family" unification's Place
review, see that section elsewhere in this file — not `food-review`, which isn't linked to the
shelf mechanism at all). Using the broader map means this feed's rating/comment enrichment covers
music-review entries too, not just book/film/place.

One extra raw-SQL query (same multi-`LEFT JOIN`-filtered-by-`meta_key` shape
`get_reading_stats()`'s own `$review_rows` query already uses) finds every review post any of the
viewer's follows authored across all three templates, keyed by `"{author}-{directory_id}"` so it
can be matched against each activity row with no N+1 lookup. A matched row gets `rating` (int) and
`reviewExcerpt` (the review's `post_content`, HTML-stripped and truncated to 140 chars) merged in;
an entry with no matching review just gets both as `null` — same plain "X finished this" as
before. `FollowingActivityItem` (`src/features/community/readingTracker.ts`) gained both fields;
`LogHomeScreen.tsx`'s activity card renders a `★★★★★ N of 5` line and the excerpt (2-line clamp)
when present, mirroring the mockup's "★★★★★ 5 of 5 — finished it on the bus" treatment. **No web
mirror of `FollowingActivityItem` exists** — this type was never ported to
`packages/shared/lib/reading-tracker.ts` in the first place, consistent with the rest of the
Log-First feature being mobile-only.

*(Not verified live this pass — needs the plugin redeployed before it's live in production.)*

### Directory-entry follows — follow a Person or Place (backend + mobile, September 2026)

A member can now follow a `culture_directory` entry (Person or Place, gated client-side per
entry type — see `DirectoryDetailScreen.tsx`) and get notified whenever a new community post
links to it, closing a gap flagged in the "Log-First" pass above. **Deliberately a separate
relationship from `Culture_Follows`** (member-to-member, real WP user IDs on both sides) — most
Person directory entries are catalogued public figures with no Moveee account at all, so there's
no "account" on the followed side to reuse that table for.

- **Backend**: `Culture_Directory_Follows`
  (`culture-community/includes/core/class-culture-directory-follows.php`) — a small dedicated
  table, `wp_culture_directory_follows` (`id, user_id, directory_id, created_at`, `UNIQUE KEY
  (user_id, directory_id)`), wired into `Culture_Activator::create_tables()`;
  `CULTURE_VERSION` bump already covers this table (no separate bump needed beyond what shipped
  with the rest of this pass). `follow()`/`unfollow()`/`is_following()`/`followers_count()`/
  `get_follower_ids()`/`get_status()` are the full public surface — `get_status()` returns
  `{isFollowing, followersCount}`, the shape every REST handler and the web/mobile UI both
  consume directly.
  - **Notification trigger is hook-based, not called from either submit handler** —
    `on_directory_link_added()` is registered on WordPress core's own `added_post_meta` action
    (fires once, the first time a given `(post, meta_key)` pair is written — not `update`),
    watching for `_linked_directory_id` being set on a newly-published `culture_post`. This
    covers every composer template that can link to a directory entry (Hidden Gem/Place,
    Book/Film/Music Review, Food Review, Cultural Take, etc.) **and** both write paths — the
    mobile PHP submit handler and the web submit route, which writes postmeta via native WP
    REST and bypasses the PHP handler entirely — with one implementation instead of two. Fires
    only when the link is first created on an already-published post; a post that starts
    pending/draft and is published later does **not** retroactively notify (known v1
    limitation, not wired to a status-transition hook — flagged in the class's own docblock).
- **REST routes**, same mirrored shape as every other feature in this plugin: `POST`/`POST`/`GET
  /mobile/directory/{id}/follow`, `/unfollow`, `/follow-status` (JWT,
  `class-culture-mobile-api.php`) and `/directory/{id}/follow`, `/unfollow`, `/follow-status`
  (API key + explicit `user_id`, `class-culture-rest-api.php`) — both just delegate to
  `Culture_Directory_Follows::follow()`/`unfollow()`/`get_status()`.
- **Mobile UI**: `DirectoryFollowButton`-equivalent wired into `DirectoryDetailScreen.tsx`
  (built in an earlier pass this session, alongside the Stoop proximity banner and the
  following-activity enrichment below) — gated to Person/Place entry types only, matching the
  backend's own real-world reasoning for why a Book/Film/Album entry doesn't get a follow
  affordance (there's no "new content about this book" notion the way there is for a person or
  a place).
- **Web UI (this pass, closing the mobile-only gap)**: `apps/connect/app/directory/[slug]/
  DirectoryFollowButton.tsx` — same `SUPPORTED_TYPES = new Set(["person", "place"])` gate as
  mobile, calls the new `/api/directory/[id]/follow`, `/unfollow`, `/follow-status` proxy
  routes (session-resolved `user_id`, same `getServerSession()` → 401-if-absent pattern every
  other proxy route in this feature uses), wired into `apps/connect/app/directory/[slug]/
  page.tsx` alongside the rest of the Log-First panel components (see below).
- *(Not verified live this pass — needs the plugin redeployed before it's live in production.)*

### `LogHomeScreen` wired in as the mobile default tab; Events dropped from the bottom bar (September 2026)

**Supersedes the "build first, wire up nav after" deferral in the "Log-First" section above** —
per explicit later direction, `LogHomeScreen` ("Your log") is now a real, reachable screen and
the app's default landing tab, not just a built-but-unwired file. The bottom tab bar is now
**Home → Feed (Connect) → Magazine → Shop → Games** — 5 tabs, reordered, with **Events removed
as its own tab entirely** and moved to a topbar icon instead (see below). This does *not* revive
the earlier, larger "renamed bottom nav — Log / Discover / Hubs / Stoop / You" concept from the
section above (that would have dropped Magazine/Games/Shop too) — only Home was added and only
Events was removed; Magazine/Shop/Games all stay as real tabs, just reordered.

- **`apps/mobile/src/navigation/index.tsx`** — new `HomeStack()` function, mounted as the first
  `Tab.Screen` (`name="Home"`). It mirrors `ConnectStack()`'s **entire** screen list verbatim
  (`LogHome` inserted first, so it's the stack's initial route) rather than a minimal subset —
  same "duplicate registration across stacks" convention `MemberStack` already uses for its own
  large overlap with `ConnectStack` (Wallet/Coupons/Perks/Membership/Analytics/etc. are each
  registered in more than one stack today). This matters because `LogHomeScreen.tsx`'s own
  `nav.navigate(...)` calls (`ConnectFeed`, `NewPost`, `DirectoryDetail`, `Notifications`,
  `ReadingTracker`) are all plain, same-stack navigates, not cross-stack `{ screen, params }`
  calls — for those to resolve from the Home tab, every target screen has to exist inside
  `HomeStack` too, not just `ConnectStack`.
- **Events tab removed** — `EventsStack()` (the function) was deleted outright, not just
  unmounted; `EventsList`/`EventDetail`/`MyRSVPs` are registered directly inside both
  `ConnectStack` and the new `HomeStack` instead. A new calendar-icon button was added to the
  topbar on both screens that lost their Events tab neighbor: `ConnectFeedScreen.tsx`'s existing
  Hub/Stoop/Directory/Discover/Bell/Avatar icon row (inserted between Discover and Bell) and
  `LogHomeScreen.tsx`'s own header (inserted between the "Your log" title and the notification
  bell) — both navigate to `EventsList`, which now resolves in-stack from either tab.
  `components/community/EventSpotlightCarousel.tsx`'s "See all →" link — the one place in the
  codebase that cross-stack-navigated to the old `Events` tab
  (`nav.navigate("Events", { screen: "EventsList" } as any)`) — was fixed to a plain
  `nav.navigate("EventsList")`, since that carousel only ever renders inside `ConnectFeedScreen`,
  which now lives in both stacks that register `EventsList` directly.
- **`useNav.ts`'s `AppParamList`** gained `LogHome: undefined` (screen) and a tab-level `Home:
  undefined` entry (for any future cross-stack navigate into the Home tab), and dropped the
  now-tabless `Events` tab-level entry — `EventsList`/`EventDetail`/`MyRSVPs` (the real screens)
  were already declared and are untouched.
- **`TabletRail.tsx`** — `TAB_ICONS` gained a `Home: ["home", "home-outline"]` entry (the rail's
  icon/label maps are driven by whatever `Tab.Screen`s actually exist via `state.routes`, so
  removing Events from the bottom `Tab.Navigator` automatically removed it from the tablet rail
  too — no code change needed there beyond adding the new tab's icon, per this file's own
  existing "if you add a 6th tab, only the icon/label maps need an entry" note).
- **If a future pass wants the unread-notification badge to move from the Feed tab icon to the
  new Home tab (since Home is now the default landing screen)**, that's a deliberate follow-up,
  not something this pass did — the badge still lives only on the `Connect`/"Feed" tab icon,
  unchanged.
- Not tested on a real device/simulator — this sandbox has neither. Verified via a brace/paren/
  bracket balance check on every touched file (`navigation/index.tsx`, `useNav.ts`,
  `TabletRail.tsx`, `ConnectFeedScreen.tsx`, `LogHomeScreen.tsx`,
  `EventSpotlightCarousel.tsx` — no `node_modules` installed in this sandbox, so `tsc --noEmit`
  couldn't run) and a repo-wide grep confirming no other `navigate("Events"...)` cross-stack call
  survived the removal. Re-check a cold app launch lands on Home, that both new calendar icons
  open Events correctly, and that the tablet rail renders 5 items in the right order, on a real
  device before considering this fully closed.

### Log-First web UI — brings `apps/connect` to parity with the mobile Log Home screen (September 2026)

Closes the "everything above was built mobile-only" gap the "Log-First" section flagged —
every backend REST route for shelving/saved lines/social proof/also-logged/place-proximity/
following-activity/directory-follows was already mirrored for web (same "one class, two auth
surfaces" pattern used everywhere else in this codebase); this pass is purely the `apps/connect`
pages/components that call them. No backend changes in this pass beyond the directory-follows
class documented directly above (built in an earlier pass this session).

- **10 new proxy routes** (`apps/connect/app/api/`), all following the established proxy shape
  (session check → 401 if absent, `user_id` resolved server-side and never trusted from the
  client, `Authorization: Bearer ${CULTURE_API_SECRET}` to WordPress, `.catch(() => null)` → 502
  on network failure — see `app/api/reading/shelf/route.ts` for the canonical shape every one of
  these mirrors): `reading/saved-lines` (GET/POST) + `reading/saved-lines/[id]` (DELETE),
  `reading/social-proof` (GET), `reading/also-logged` (GET, public — a property of the entry
  itself, matches the PHP route's own public permission callback), `reading/place-proximity`
  (GET), `reading/following-activity` (GET), `me/location` (POST/GET/DELETE),
  `directory/[id]/follow` / `/unfollow` (POST) / `/follow-status` (GET).
- **Directory entry detail page** (`apps/connect/app/directory/[slug]/page.tsx`) now renders
  four new panels, mirroring `DirectoryDetailScreen.tsx`'s mobile layout section-for-section:
  - `EntryLogControl.tsx` — "Add to your log" shelf-status buttons + one-tap rating (rendered only
    for entry types with a shelf — see the generalized `TYPE_MEDIA_MAP` documented below; renders
    nothing for a medium of `'other'`) plus `SocialProofLine.tsx`, a small standalone component
    underneath it showing "N of your follows have logged this" (split out separately during the
    SDK 57 merge, since `EntryLogControl` itself is mirrored 1:1 with mobile and shouldn't grow a
    Log-First-only feature onto it).
  - `SavedLines.tsx` — the "Lines saved from this" list plus an inline "+ Save a line" composer,
    rendered for **every** entry type (no type gate — a Person entry gets this section the same
    as a Book, matching the backend's own type-agnostic `save_line()`).
  - `DirectoryFollowButton.tsx` — see the directory-follows section directly above.
  - `StoopProximityBanner.tsx` — the web equivalent of the mobile "N people within 3 miles want
    to go too" banner, gated to `typeSlug === "place"` only. Uses the browser's own
    `navigator.geolocation.getCurrentPosition()` for a one-time location capture (never
    continuous/background tracking, matching the mobile capture's own privacy posture — see
    "Stoop proximity banner + member geolocation" above), POSTing the fix to `/api/me/location`
    (which itself rounds to ~2 decimal places server-side via `Culture_Geolocation::
    set_location()` before ever persisting it — the web route never sends an unrounded
    coordinate anywhere it could be logged unrounded, but the actual privacy guarantee lives in
    the PHP class, not the client). Three render states, same as mobile: an opt-in prompt (no
    location saved yet), nothing at all (location saved, `count` is 0 — hide-when-empty, same
    convention as every other signal-driven nudge in this codebase), or the real banner with a
    "Start a Stoop here →" link to `/cluster/create`.
- **`FollowingActivity.tsx`** (`apps/connect/app/member/reading/FollowingActivity.tsx`, new) —
  the "From People You Follow" activity feed on `/member/reading`, the last missing piece of
  web parity: mirrors `LogHomeScreen.tsx`'s mobile activity card exactly, including the
  star-rating/review-excerpt enrichment `get_following_activity()` already computes server-side
  (see "'From people you follow' activity feed — real star ratings/comments" above for the full
  backend mechanics — `REVIEW_RATING_META` maps each shelf-supporting review template to its
  rating meta key, one batched raw-SQL lookup, no N+1). Renders a
  plain activity row per followed member's recently-finished entry — avatar (or an initial-letter
  placeholder), "{name} finished {title}", a `★★★★★ N of 5` line when a matching review exists,
  the review excerpt (already truncated server-side to 140 chars), and a relative timestamp
  (`timeAgo()`, a small local helper parsing the MySQL-datetime-shaped ISO string PHP returns).
  Renders nothing (`return null`) when the feed is empty — same "hide the whole section rather
  than show an empty state with no signal" convention used throughout this codebase. Wired into
  `ReadingTrackerClient.tsx`, rendered directly below the shelf grid and above the "Add a Book"
  modal.
- **`packages/shared/lib/reading-tracker.ts`** extended with the shared TS types every one of
  these components consumes (`ShelfStatus`, `SavedLine`, `SocialProofExample`, `SocialProof`,
  `AlsoLoggedEntry`, `FollowingActivityItem` — with `rating: number | null` /
  `reviewExcerpt: string | null`, `PlaceProximity`, `DirectoryFollowStatus`; `ShelfEntry`/
  `SHELF_LABELS`/`shelfLabelsFor()` from the original book/film/place-only pass are superseded by
  the generalized `ShelfEntry`/`statusLabel()` the "all five review media" pass below adds — the
  old `SHELF_LABELS` pair is left in the file as dead code, harmless since `EntryLogControl`
  doesn't import it). **No shared source of truth with the mobile TS copy**
  (`apps/mobile/src/features/community/readingTracker.ts`, since React Native can't import
  `packages/shared`) or the PHP response shapes — keep all three in sync by hand if any of these
  shapes ever change, same caveat already documented for `MOOD_TAGS`/`PACES` elsewhere in this
  file.
- **New CSS**: `apps/connect/app/directory.css` gained `.dir-follow-*`/`.dir-log-*`/
  `.dir-proximity-*`/`.dir-lines-*` rules for the four new directory-page panels;
  `apps/connect/app/member.css` gained a `.rt-activity-*` block (heading, row list, avatar,
  rating line, excerpt, timestamp) for `FollowingActivity.tsx`, inserted directly before the
  pre-existing "Reading Tracker stats dashboard" CSS comment — both new blocks reuse the
  existing design tokens (`var(--ink)`, `var(--mute)`, `var(--rule)`, `var(--paper-deep)`,
  `var(--gold, #b38238)`, `var(--font-serif, 'Fraunces', serif)`) rather than introducing new
  literals.
- **This closes the "Log-First" feature's mobile-only gap** — shelving, saved lines, mood/pace
  (already had `BookMoodPace.tsx` from an earlier pass), social proof, directory-entry follows,
  the Stoop proximity banner, and the enriched following-activity feed are all now live on both
  `apps/mobile` and `apps/connect`. The one piece still deliberately out of scope, per the
  original "Log-First" section above: `LogHomeScreen.tsx` itself (the dedicated mobile home
  screen replacing/sitting alongside the Feed tab) has no web equivalent — this pass brought its
  *constituent* panels to web (shelving lives on `/member/reading`, the directory-page panels
  live on `/directory/[slug]`), not a single unified "Log home" web page mirroring that mobile
  screen's own layout. If a dedicated web Log Home page is ever wanted, that's a separate,
  explicitly-scoped follow-up, not something this pass silently attempted.
- *(Not verified live this pass — needs the plugin redeployed before it's live in production.)*

### Generalised from books to all five review media — the "Culture Log" (September 2026)

**Supersedes the books-only framing everywhere above.** The tracker now covers the same five
things the composer's `REVIEW_FAMILY` does — **book / film / music / food / place** — not just
books. Prompted by a marketing-strategy question: the accumulating layer that creates real
switching cost (shelves, a goal, year-end stats) only worked for one of the five things members
actually review, so the log couldn't carry a campaign built on the review system.

**No migration, no new table, no `CULTURE_VERSION` bump.** `wp_culture_reading_shelf` was
already keyed on a plain `directory_id` with no type column, and the three status values
(`want_to_read`/`currently_reading`/`read`) are unchanged in the DB — they were always
medium-neutral internally. What was actually book-specific was only ever: the stats query, the
labels, and the absence of a medium dimension.

- **Medium is derived from the entry, never from the review template.** `Culture_Reading_Tracker
  ::TYPE_MEDIA_MAP` maps a `culture_dir_type` slug to one of the five media
  (`album`→music, `tv-series`→film, `restaurant`/`event-venue`→place, etc.); anything unmapped
  resolves to `'other'`. **This is deliberately not driven by `_template_type`** — Place
  (hidden-gem) reviews are composed with no `typeFilter` at all, so the template says nothing
  reliable about what the thing is. `media_for_directory_ids()` is the batch resolver (one raw
  taxonomy query for a whole page, never `get_the_terms()` per row).
- **Shelf reads gained a `medium` filter**, threaded through both mirrored REST surfaces
  (`GET /reading/shelf` and `/mobile/reading/shelf`) and validated against `MEDIA` server-side.
  `medium_where_clause()` builds an `EXISTS`/`NOT EXISTS` fragment from class constants only —
  `'other'` is the inverse of every mapped slug, so an untyped entry is still reachable by
  filter rather than only visible under "All". The fragment adds no `%` placeholders, so the
  surrounding `$wpdb->prepare()` arg count is unaffected (verified).
- **`get_shelf_counts()` returns a `byMedium` map** alongside the pre-existing flat per-status
  totals, which is what the filter chips' counts read.
- **`get_reading_stats()` widened from one review template to five.** One pivoted postmeta join
  now reads `_book_/_film_/_music_overall_rating`, `_star_rating` (place), and the three
  `_food_rating_*` scores, plus `_book_/_film_/_music_genres` and `_cuisine_tag` (food).
  **Food has no stored overall rating, so its three breakdown scores are averaged** — exactly
  what the composer already does to derive an overall for book/music/film. New fields:
  `entries_logged`, `per_month`, `medium_breakdown`, and a `medium` on each `top_genres` row.
- **`pace_breakdown`/`mood_breakdown` stay book-only, on purpose.** The 12-tag vocabulary is
  StoryGraph's and doesn't transfer to a restaurant or an album; both sections are now labelled
  "Books only" in the UI. **Don't "finish the job" by widening these without a real vocabulary
  for the other four** — that's a product decision, not a gap.
- **Deprecated aliases are returned deliberately.** `books_read`/`books_per_month` (stats) and
  `targetBooks`/`booksRead` (goal) still ship alongside the new names, because an
  already-installed mobile build can't be force-updated and would otherwise render zeros. Drop
  them once the field has turned over; read the new names in anything new.
- **Statuses keep one set of values and vary only by label.** `STATUS_LABELS` in
  `packages/shared/lib/reading-tracker.ts` (mirrored in the mobile copy) gives each medium its
  own verbs — Want to Read/Reading/Read, Want to Watch/Watching/Watched, Want to Go/Going/Been,
  etc. Tabs use the active filter's verbs (or neutral Planned/In progress/Done under "All");
  **a card always uses its own medium's verbs, not the active filter's**.
- **The goal stayed a single cross-medium target per year**, not one per medium — a member
  logging 30 things across five media is the number worth showing, and five separate targets is
  a lot of setup friction for a feature most people never configure at all. Revisit only if
  asked.
- **User-facing rename, copy-only** (same convention as Hidden Gem→Place / Stoop): "Reading
  Tracker" → **Culture Log**, "Your Year in Books" → **Your Year in Culture**. The `/member/
  reading` route, the `reading/*` REST paths, the table names and the class name are all
  unchanged — don't rename them.
- **A real gap this pass caught**: `apps/connect/app/api/reading/shelf/route.ts` dropped the new
  `medium` param, which would have made the web filter silently no-op while the mobile one
  worked. **If you add a param to a `reading/*` endpoint, check that proxy forwards it** — the
  proxy rebuilds the query string by hand rather than passing it through.
- **The Add modal now picks a medium first**, mapping to the right `typeFilter`/`externalSource`
  (Google Books / TMDB / Spotify, none for food/place) via a `MEDIA_SEARCH` map duplicated
  between the web and mobile screens. `typeFilter` is a single slug on purpose: `DirectorySearch`
  reuses that same value as the `entry_type` it *creates* with, so a comma list would widen
  search at the cost of creating entries with a nonsense type. Place therefore searches `place`
  only and won't surface `restaurant`-typed entries in that modal — a narrower search is the
  better half of that trade.
- **Verified**: `tsc --noEmit` **exit 0** on both `apps/connect` and `apps/site`; `apps/mobile`
  held at exactly its documented 37-error pre-existing baseline with none in the touched files;
  `php -l` clean on all four touched PHP files; CSS brace balance on `member.css` (629/629); the
  generated medium SQL fragments checked standalone in real PHP for every branch
  (none/book/place/other/invalid) confirming valid SQL and a stable placeholder count; and the
  new chip row / scope-note pills rendered in real Chromium at 1280px and 390px against the real
  `member.css` (no horizontal overflow at either). **Not** tested against a live WordPress —
  needs the plugin redeployed (header bumped to 2.6.10; no new table, so no `CULTURE_VERSION`
  bump) and then a real round trip: log something of each medium, review a couple of them, and
  confirm the filter, the counts and every stats section agree.

### Rating without a review — the `rating` column (September 2026)

Until this, a rating could only exist on a `culture_post` **review**
(`_book_overall_rating` and its four siblings), so there was no way to say "4 stars"
without going through the composer. The log had a cheap action (shelve it) and an
expensive one (write a review) and nothing in between — and a member who rated
nothing showed an empty histogram on Your Year in Culture no matter how much they
had logged.

- **`wp_culture_reading_shelf` gained `rating tinyint(4) NOT NULL DEFAULT 0` and
  `rated_at datetime`.** `CULTURE_VERSION` bumped `3.4.0` → `3.5.0` so
  `culture_community_maybe_upgrade()` runs the `dbDelta` (plugin header `2.6.10` →
  `2.6.11`). **0 means unrated, not zero stars** — there is no zero-star rating
  anywhere in this product, and the frontends rely on that distinction.
- **`set_shelf_rating( $user_id, $directory_id, $rating )`** is the new write.
  A rating above 0 also moves the row to `read` and stamps `finished_at` (stickily,
  same rule the rest of this class already follows), because rating something *is*
  the finish action in both frontends. **Clearing a rating (0) deliberately does not
  un-read it** — those are separate statements. Rating an unshelved entry creates the
  row; rating 0 on an unshelved entry is a no-op rather than a reason to insert an
  empty one.
- **`set_shelf_status()` took an optional 4th `$rating` param** so a status change and
  a rating can land in one write. **Neither REST surface `absint`s the `rating` arg** —
  the handler needs to tell an absent param (leave the rating alone) from an explicit
  `0` (clear it), and `absint` collapses both. `is_valid_rating()` rejects anything
  non-integral or outside 0–5 rather than clamping: a 7 is a caller bug, not a 5.
- **New routes, mirrored as usual**: `POST /culture/v1/reading/rating` (API key +
  explicit `user_id`) and `POST /culture/v1/mobile/reading/rating` (JWT), both thin
  wrappers over the one method. Next.js proxy: `apps/connect/app/api/reading/rating/
  route.ts`. The pre-existing shelf POST proxy needed no change — it already spreads
  `...body`, so `rating` passes through.
- **`get_reading_stats()`'s rating histogram was restructured from per-review to
  per-entry.** A review's rating still wins (it has prose behind it); the shelf column
  only fills entries with no review, which previously went uncounted entirely. This
  also closes a latent double-count: the old loop incremented once per *review*, so two
  reviews pointing at one entry counted twice. New fields `rated_count` and
  `average_rating` (one decimal, `null` when nothing is rated) come out of the same
  pass. **Top genres stay review-only** — the shelf has no genre data to fall back on.
- **Copy that was wrong the moment this shipped, and is fixed**: both stats screens said
  "Ratings — Your Reviews" with an empty state reading "review something you've logged to
  see it here." Ratings no longer require a review; both now read "Your ratings" with the
  average inline, and the empty state points at the stars.
- **Not built**: no credits/reputation award for rating (the gamification hook is still
  its own later phase, and paying for a one-tap action is exactly the list-stuffing
  incentive the plan doc warns about); no half-stars; no rating history (a re-rate
  overwrites, `rated_at` moves).
- **Verified**: `tsc --noEmit` **exit 0** on `apps/connect` and `apps/site`, `apps/mobile`
  held at its documented 37-error baseline with none in the touched files; `php -l` clean
  on all four touched PHP files; CSS brace balance on `member.css` (633/633); and both new
  pieces of logic exercised standalone in real PHP rather than reasoned about — the
  review-wins/shelf-fallback resolution across seven fixtures (review only, shelf only,
  both on one entry, mixed, none, out-of-range, empty year) and `is_valid_rating()` across
  fifteen inputs including `3.0`, `"4.5"`, `true` and `[]`. **Not** tested against a live
  WordPress: needs the plugin redeployed before the column exists, then a real round trip —
  rate from each platform, re-tap to clear, rate something that also has a review, and
  confirm the histogram and average agree.

### The entry page became the place you log from (September 2026)

Everything the log could do — shelve, rate, save a line against a thing — could only be
reached from `/member/reading` or the composer's own template picker. The directory entry
page, which is where you actually *are* when you finish a book or want to keep a line,
offered none of it: CLAUDE.md had already flagged the missing shelf control as a Phase 1
gap, and the `rating` column shipped with a route and no UI anywhere near the thing being
rated. This closes all three on both platforms.

- **`Culture_Reading_Tracker::get_entry_state( $user_id, $directory_id )`** is the new read
  — the entry's medium plus this viewer's own status/rating/dates, or nulls. **It returns a
  medium even for a logged-out visitor and even with no shelf row**, which is the whole
  point: the UI needs to know whether to say "Want to Read" or "Want to Watch" *before*
  there is a row to read verbs off. Mirrored as `GET /culture/v1/reading/entry` (API key)
  and `GET /culture/v1/mobile/reading/entry` (JWT), same one-method-two-front-doors shape as
  every other `reading/*` pair. **`user_id` is optional on the web route only** — unlike
  every other reading read, which requires it.
- **`EntryLogControl`** (`apps/connect/app/directory/[slug]/EntryLogControl.tsx` and
  `apps/mobile/src/components/community/EntryLogControl.tsx`) renders status buttons with
  the medium's own verbs, a one-tap star row once the status is `read`, and a remove link.
  **It returns `null` when the medium is `other`** — a person, a movement, a concept has no
  shelf, and `TYPE_MEDIA_MAP` resolves all of them there. The mobile copy takes a
  `containerStyle` prop and applies it *itself* rather than being wrapped by the screen,
  so a person's page doesn't render an empty card. Tapping the star you already gave clears
  the rating (`rating === state.rating ? 0 : rating`) rather than re-setting it.
- **"Save a line" deep-links the real composer instead of growing a second quote form.**
  `/post/new?template=quote&link_id=&link_role=&link_title=&link_type=` (mobile: the same
  four as `NewPost` route params) seeds `SubmitPost`'s new `initialQuoteLink` prop, which
  pre-fills `quoteAuthorEntry` **or** `quoteSourceEntry` depending on `role` and picks the
  matching quote type. `role` is `author` on a person and `source` on a work — the two
  optional links from "Quotes link to the Directory" above, chosen by what you're standing
  on. `link_type` mirrors `QUOTE_SOURCE_TYPES` (`book`/`film`/`album`, `tv-series`→`film`);
  anything not in that map has no source picker, so it's omitted.
- **The lines section now renders with zero lines** on a person or on any type that map
  covers — an entry with nothing saved yet is exactly who needs the CTA. Everywhere else it
  still only appears once there's something to show.
- **Deliberately not built**: the log-first home from the mockup (capture bar, In Progress
  rail, Year in Culture strip). That's a feed rebuild, not an entry-page control, and was
  left for a separate decision.
- **Verified**: `tsc --noEmit` exit 0 on `apps/connect`; `apps/mobile` at its documented
  37-error baseline with none in touched files; `php -l` clean on all three PHP files; CSS
  brace balance on `directory.css` (213/213); `check-brand-language.sh` showing only the
  pre-existing Literary hits. **Not** tested against a live WordPress — needs the plugin
  redeployed before `reading/entry` exists, then a real round trip on both platforms:
  shelve and rate from an entry page, re-tap a star to clear, and save a line from both a
  person and a work and confirm it lands on both pages.

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

## Auth flow — full visual rebuild onto the composer design system (`auth-*`, July 2026)

All 5 auth pages in `apps/connect` — `login/page.tsx`, `register/page.tsx`,
`register/complete/page.tsx`, `forgot-password/page.tsx`, `reset-password/page.tsx` — were
rebuilt from a user-approved Artifact mockup, replacing five separate hardcoded-hex inline
`style={{...}}`/`StyleSheet`-style objects (zero dark-mode support, one-off colors not shared
with any other surface) with a single new CSS file, `apps/connect/app/auth.css` (`auth-*`
namespace), styled explicitly off the **composer's own form tokens**
(`.composer-input`/`.composer-field-label`/`.composer-submit` in `globals.css`) per an explicit
user request to match "form styles like used in the post creation page" — ochre focus borders on
inputs, ochre primary buttons, uppercase DM Sans field labels, `var(--radius-md)` (4px) inputs, a
`--shadow-card`-elevated card floating on `--paper-warm`. Same "mockup first, then build exactly
what was approved" process as the Stoop rebuild above — the user explicitly corrected an early
attempt to skip straight to code with "mockup first perhaps," and the approved mockup dropped a
"The Moveee — Culture Community" eyebrow that was in an earlier draft ("no need for the eyebrow").

- **This was a pure visual rebuild — zero business-logic changes.** All auth logic (passkey
  sign-in via `@simplewebauthn/browser`, Google OAuth, NextAuth credentials sign-in, the
  honeypot-plus-timestamp anti-bot pair on `/register`, the 5-step `register/complete` state
  machine — verify/about/interests/membership/done — token verification, `/api/complete-profile`
  and `/api/membership/upgrade-init` calls, the `?next=`/`?upgrade=patron` redirect handling) was
  preserved verbatim; only the render/JSX/className layer changed on all 5 files.
- **Key `auth-*` class groups** (all in `auth.css`, all token-driven — no hardcoded hex except
  documented `var(--token, #fallback)` pairs): `.auth-page`/`.auth-card`(`--wide`/`--center`) for
  page/card chrome; `.auth-field`/`.auth-label`(`-required`/`-optional`)/`.auth-input`(`--error`)
  for form fields; `.auth-btn-primary`/`.auth-btn-secondary`(`--nav`) for buttons;
  `.auth-error`/`.auth-success` for status messages; `.auth-divider*` for the login page's
  "or" rule between password and passkey/Google; `.auth-footer*`/`.auth-link` for the
  below-form links. `register/complete`'s multi-step UI got its own sub-families:
  `.auth-steps`/`.auth-step`/`.auth-step-circle`(`--done`/`--active`)/`.auth-step-label`
  (`--current`)/`.auth-steps-track`/`.auth-steps-fill` for the 3-step progress bar (replaces a
  fully inline-styled `ProgressBar` component — the component itself is unchanged in structure,
  only its render swapped from inline styles to these classes); `.auth-chip*` for the interest
  picker grid (`.auth-chip`(`--active`)/`.auth-chip-emoji`/`.auth-chip-label`/`.auth-chip-count`
  (`--ok`)); `.auth-billing-toggle`/`.auth-cycle-btn`(`--active`)/`.auth-savings-tag` for the
  Monthly/Annually toggle; `.auth-tier-*` for the Citizen/Moveee Pro membership cards
  (`.auth-tier-grid`/`.auth-tier-card`(`--active`)/`.auth-tier-radio-input`/`.auth-tier-label`/
  `.auth-tier-price-row`/`.auth-tier-price`/`.auth-tier-period`/`.auth-tier-perks`);
  `.auth-currency-notice`/`.auth-currency-switch` for the NGN/USD toggle; `.auth-nav` for the
  Back/Continue footer row shared by all 3 register/complete steps.
- `CountrySelect`/`CitySelect` (`packages/shared/components/LocationSelect.tsx`) already
  supported an `inputClassName` prop (in addition to `inputStyle`) going into this pass — switched
  from `inputStyle={styles.input}` to `inputClassName="auth-input"`, no component changes needed.
- The `/register` honeypot field (`website`, off-screen absolute positioning, `aria-hidden`,
  paired with a `formLoadedAt` timestamp checked server-side) was deliberately kept as a raw
  inline `style` object rather than converted to a CSS class — it's a functional anti-bot
  mechanism, not decorative chrome, and its off-screen positioning technique is unrelated to the
  visual system being rebuilt here.
- *(Not verified live this pass.)*

## Registration flow (redesigned)

**Partly superseded (September 2026)** — the flow below is still exactly what happens when
someone picks "Set a username and password" on `/register`, but it is no longer the default
path. See "Sign-in and registration — one-time codes are the default (September 2026)" below
for what `/login` and `/register` actually lead with now, and for which of the steps below are
still blocking (none of them are).


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

## Sign-in and registration — one-time codes are the default (September 2026)

Signing up used to be six screens: `/register` (email + username + password) → leave the site
and click an emailed verification link → `/register/complete`'s three-step wizard (DOB/country/
city/occupation → a 3-interest minimum → pick a membership tier). Almost none of it was
load-bearing, and the tier step asked a stranger to choose a plan before they had seen
anything. `/login` and `/register` now both lead with a 6-digit emailed code instead: enter an
email, type the code, you are in — the same two taps whether or not the address already has an
account.

**Almost nothing new was built — the mechanism already existed and was only ever pointed at
newsletter widgets.** `Culture_Magic_OTP` (`class-culture-magic-otp.php`) and the `otpEmail`/
`otpCode` branch of `authorize()` in `packages/shared/lib/auth.ts` have been shipped since the
"Magic-code sign-in + subscribe" work on Site A; `verify_otp()` already found-or-created a real
account (auto-generating a username from the email, `citizen` tier, email marked verified). The
work here was wiring that to the auth pages and taking the wall down behind it.

- **New: `apps/connect/components/MagicCodeSignIn.tsx`** — the email → code widget both pages
  render. Step 1 posts to the new `apps/connect/app/api/auth/magic-otp/request/route.ts` (Site
  B's own copy of the proxy Site A already had at `app/api/newsletter/magic-otp/request`); step
  2 calls `signIn("credentials", { otpEmail, otpCode })` directly, so there is deliberately no
  verify proxy on either app — `authorize()` is what reaches WordPress. Includes a 30s resend
  countdown, because WordPress rate-limits to 3 requests per 10 minutes per address and it is
  easy to burn all three on impatient taps.
- **`otpList` is now sent as `""` from the auth pages, and that empty value is meaningful.**
  `handle_magic_otp_verify()` switched from `get_param('list') ?: 'getmelit'` to
  `has_param('list') ? ... : 'getmelit'`, and `verify_otp()` skips subscribing on an empty slug
  — signing in must never silently join anyone to a mailing list. A caller that omits the param
  entirely still gets the GetMeLit default the subscribe widgets were built around, so
  `SubscribeForm`/`LiterarySubscribeForm` are untouched (all three already pass a real slug).
  **Never pass a real list slug from an auth page.**
- **Referral attribution survives the code path**, which it would not have by default.
  `Culture_Referrals::process_referral()` is hooked on `user_register` and reads
  `$_COOKIE['culture_ref']` or `$_POST['culture_referral_code']` — the cookie can't work
  headlessly (it would land on `cms.themoveee.com`, not the frontend origin) and a JSON REST
  body never populates `$_POST`. So `verify_otp()`/`find_or_create_user()` take a `$referral`
  param and set `$_POST['culture_referral_code']` around the `wp_create_user()` call only,
  restoring the previous value after. `?ref=` on `/register` is threaded through as
  `otpReferral`. **If another headless path ever needs to create an account with referral
  credit, copy this shape — don't re-hook `user_register`.**
- **`/register/complete` is no longer a gate.** Every field on the About step is optional (the
  `required` attributes and the three "*" markers are gone), the interests step's 3-minimum is
  gone, and both steps have a real "Skip for now" that completes the account as a free Citizen.
  `handleMembershipSubmit()` was split so `submitProfile(tier)` can be called from either. The
  membership step now opens with "Moveee Citizen is free and already selected". The
  `?upgrade=patron|lit` entry is untouched and still goes straight to the membership step.
- **Interests needed no new nudge** — `PulseFeed.tsx` has shown a "Personalise your feed" banner
  to logged-in members with none set since the Overlays pass. That is now the primary place
  interests get collected, where the payoff is visible.
- **Stoop collects the location instead**, since it is the only surface where "near you" is
  load-bearing. `StoopBrowser.tsx` renders a `.stoop-loc-prompt` card (CountrySelect +
  CitySelect + save) when the viewer has no city or country on their profile and no city filter
  set; it PATCHes the existing `/api/user/profile` and then sets the component's own `city`
  state directly rather than waiting for the NextAuth JWT to pick the saved profile up on its
  next refresh. Without it the page still worked, it just silently listed every Stoop
  everywhere.
- **Two pre-existing bugs fixed in passing**: `/register` called `router.replace()` during
  render, *before* its `useState` calls, on the `isUpgrade && session` path — a Rules of Hooks
  violation that changes the hook count between renders (moved into a `useEffect`); and
  `/register` only ever read `?next=`, so the `?callbackUrl=` that Site A's `/stoop` landing
  page sends was silently dropped. It now accepts either.
- **Known rough edge, deliberately left**: finishing the *password* path still redirects to
  `/login?registered=1` rather than signing you in, because that flow never holds the password
  on the client. The code path signs you in immediately, so this only affects the secondary
  route; closing it properly needs a token exchange and was out of scope.
- Plugin header bumped `2.6.8` → `2.6.9` for redeploy confirmation. **No `CULTURE_VERSION`
  bump** — no new dbDelta table. The plugin must be redeployed before `referral`/the empty-list
  behaviour exist in production; until then an auth-page sign-in would subscribe the address to
  GetMeLit, which is the pre-existing behaviour, not a new break.
- **Verified**: `tsc --noEmit` clean on both `apps/connect` and `apps/site` (exit 0, not merely
  "no new errors" — `node_modules` was present this session), `php -l` clean on all three
  touched PHP files, CSS brace-balance on `auth.css` (96/96) and `stoop.css` (167/167), and the
  code step rendered in real Chromium at 1280px and 390px against the real `auth.css` (no
  horizontal overflow at either). **Not** tested end-to-end against a live WordPress — re-check
  the full email → code → account-created → signed-in round trip, on both a brand-new address
  and an existing member's, and a `?ref=` signup, before considering this closed.

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

## Sign in with Apple (September 2026)

Added specifically to satisfy **App Store Review Guideline 4.8** — an app that
offers a third-party/social login (Google, above) must offer Sign in with Apple as
an equivalent option, or risk rejection on first submission. iOS-only; Android is
unaffected and doesn't render the button.

**Verification is a local JWKS check, not a single HTTP call like Google's.** Apple
has no `tokeninfo`-style endpoint — the ID token is a standard RS256 JWT, so
`Culture_Apple_Auth` (`culture-community/includes/core/class-culture-apple-auth.php`)
fetches Apple's public keys from `https://appleid.apple.com/auth/keys` (cached 12h via
transient), reconstructs the matching RSA public key as a PEM **by hand** from the
JWK's raw `n`/`e` (manual ASN.1 DER encoding — no JWT/JWK Composer library, same "raw,
no SDK" convention as `class-culture-r2.php`'s hand-rolled AWS SigV4 signer), then
verifies the signature via PHP's built-in `openssl_verify()`. This DER/PEM
reconstruction is the one genuinely fragile part of this feature — it was verified
standalone (a real generated RSA keypair, a fake signed Apple-shaped JWT, a positive
verify + a tampered-payload negative verify) before being trusted; if Sign in with
Apple ever starts failing with `invalid_apple_token`, suspect this reconstruction
first, not the rest of the flow.

**No Client-ID-style setup needed for the native app flow, unlike Google.** The
native `ASAuthorizationAppleIDProvider` flow (what `expo-apple-authentication`
wraps) issues an ID token whose `aud` claim is the app's own bundle identifier —
`Culture_Apple_Auth::allowed_audiences()` hardcodes `com.moveee.connect` (matching
`app.config.ts`'s `ios.bundleIdentifier`/`android.package`) rather than requiring a
Google-Cloud-Console-style manual client registration. WP Admin → Culture Community
→ General → "Sign in with Apple" only has one optional field, a Service ID — that's
solely for if Sign in with Apple is ever added to a **web** login flow later; the
mobile app needs nothing filled in here to work.

**Email caveat, same as any Apple Sign-In integration**: Apple may return a private
relay address (`...@privaterelay.appleid.com`) instead of the user's real email —
treated identically to any other email by `find_or_create_user()`, no special
handling needed. **The user's real name is only ever sent once, on the very first
authorization ever** — `LoginScreen.tsx`'s `handleAppleSignIn()` reads
`credential.fullName` and forwards it as `full_name` on every call regardless (it's
`null`/empty on every subsequent login), and the backend only applies it when
creating a brand-new account, never overwriting an existing one's `display_name`.

**REST routes**: `POST /culture/v1/mobile/login-apple` (`identity_token`,
`full_name`) — mobile-only, mirrors `/mobile/login-google`'s handler shape exactly
(`Culture_Apple_Auth::verify_id_token()` → `::find_or_create_user()` → issue the
existing mobile session token). **No web/`apps/connect` route was added** — this
pass was scoped to the mobile app specifically, since that's what App Store review
actually gates; if Apple Sign-In is ever wanted on `web.themoveee.com` too, mirror
the Google web route (`/culture/v1/login-apple`, API-key gated) and wire it into
NextAuth as a new provider, same shape as `providers.google` in
`packages/shared/lib/auth.ts` — that's a separate, unstarted piece of work.

**Client side** (`apps/mobile`): `expo-apple-authentication@~7.1.3` (the Expo
SDK 52-aligned version, confirmed against `bundledNativeModules.json` on the
`sdk-52` branch — don't bump this independently of the SDK 52 pin documented under
"Expo SDK version — critical" below). Added to `app.config.ts`'s `plugins` array —
the package's own Expo config plugin sets the `com.apple.developer.applesignin`
entitlement automatically, no manual `ios.entitlements` needed.
`LoginScreen.tsx` renders Apple's own `AppleAuthenticationButton` component (guarantees
Apple's Human Interface Guidelines visual compliance for free — don't hand-roll a
custom Apple button) below the existing Google button, gated on `Platform.OS ===
"ios" && appleAvailable` (`AppleAuthentication.isAvailableAsync()`, checked once on
mount). Cancellation is detected via `e.code === "ERR_REQUEST_CANCELED"` (silently
no-ops, same convention as Google's `SIGN_IN_CANCELLED` check right above it).

*(Not tested against a real device/EAS build this pass — the JWK→PEM DER reconstruction was
verified offline via a standalone script with a real RSA keypair, see above. Needs the plugin
redeployed too before `/mobile/login-apple` is live in production. Re-check the full
`AppleAuthentication.signInAsync()` round trip on a real device/build.)*


**Archive failed on a stale provisioning profile (September 2026)** — a real EAS iOS
production build got all the way to `xcodebuild archive` and failed with *"Provisioning
Profile ... does not support the Associated Domains capability"* / *"... the Sign In with
Apple capability"*. Not a code bug: the profile EAS reused was minted **before** either
entitlement existed in this app (passkeys added `associatedDomains`, this feature added
`com.apple.developer.applesignin`), and EAS syncs capabilities onto the App ID when it
*creates* a profile, not when it reuses a cached one.

Two halves, and both are needed:
- **Config** — `ios.usesAppleSignIn: true` added to `app.config.ts`. The
  `expo-apple-authentication` plugin writes the entitlement into the native project, but
  **EAS reads this config field on the credentials side**, so without it a profile can be
  issued that the entitlement then fails to match. `associatedDomains` was already
  declared and needs no equivalent flag. Keep both the plugin and this field.
- **Credentials, a human step** — the existing profile still has to be regenerated:
  `eas credentials` → iOS → production → Build Credentials → delete the provisioning
  profile, then rebuild. EAS mints a fresh one with the current capabilities. **A code
  push alone cannot fix this build**, the same way a plugin code push alone never
  redeploys the WordPress plugin.

**If a future entitlement is ever added** (HealthKit, push, App Groups, anything), expect
the identical failure on the first build and plan for the profile regeneration as part of
shipping it — don't re-debug it from the Xcode log each time.

---

## Account deletion (August 2026)

Required by Google Play's account-deletion policy ahead of the Play Store submission
(see `docs/play-store-listing.md` for the full submission-readiness doc this is part
of) — an app that supports account creation must offer both an in-app path to
*initiate* deletion and a public web page that can *complete* it without the app
installed. Two-step request/confirm flow, mirroring the existing email-verification
token pattern (`_culture_email_verify_token` in `class-culture-rest-api.php`) exactly:
a random token, stored only as `wp_hash()`, emailed to the account's own address,
expiring after 24 hours. Two steps rather than one in-app tap so a stray tap or a
forwarded/leaked link can't delete an account outright.

- **Backend**: `culture-community/includes/core/class-culture-account-deletion.php`
  (`Culture_Account_Deletion::request_deletion()` / `::confirm_deletion()`). Wired into
  `class-culture-rest-api.php` (web, API-key: `POST /culture/v1/account/delete-request`
  takes an explicit `user_id`, `POST /culture/v1/account/delete-confirm` takes `uid`+
  `token`) and `class-culture-mobile-api.php` (mobile, JWT: `POST
  /mobile/account/delete-request` only — mobile never gets a confirm endpoint, since
  confirmation always happens via the emailed web link, see below). Email template:
  `Culture_Emails::send_account_deletion_email()`.
- **Deletion mechanics**: on confirm, `wp_delete_user()` removes the WP user row and
  every `wp_usermeta` row — which is where the actual PII lives (name, email, phone,
  DOB, city, occupation, avatar/cover URLs, interests, directory bio). Authored
  posts/comments are reassigned to a lazily-created "Deleted User" placeholder account
  (`Culture_Account_Deletion::get_placeholder_user_id()`, cached in the
  `culture_deleted_user_id` option) rather than left attributed to a vanished ID.
- **Deliberate scope limit, not an oversight**: custom plugin tables keyed by user_id
  (credit ledger, notifications, follows, RSVPs, hub/cluster membership, redemptions,
  attendance, etc.) are **not** swept — their rows become orphaned references to a
  user_id that no longer resolves via `get_userdata()`, which is harmless (nothing
  renders for a nonexistent user) but isn't a full data purge. If a stricter
  data-retention audit ever requires it, that's a real follow-up project (enumerate
  every `wp_culture_*` table with a `user_id`/`author_id` column and write a proper
  per-table cleanup pass) — don't assume it's already covered.
- **Web** (`apps/connect` — auth/account pages live on Site B, per the site-split
  rules above): `/account/delete` (public — shows the delete flow for a logged-in
  visitor, or a login prompt + `privacy@themoveee.com` fallback for a logged-out one;
  deliberately never redirects a logged-out visitor away, since Play requires this
  page reachable without the app) and `/account/delete/confirm?uid=&token=` (public,
  reads the emailed link — requires an explicit final button tap, not auto-triggered
  on page load, so an email client's link-preview/security scanner prefetching the URL
  can't fire a destructive action). Proxied through `/api/account/delete-request`
  (session-based) and `/api/account/delete-confirm` (public — the token itself is the
  credential, same trust model `/api/verify-email` already uses).
- **Mobile**: `MemberSettingsScreen.tsx`'s Security tab has a "Delete Account" row in a
  new Danger Zone card (`secStyles.dangerCard`/`dangerLabel`) below the passkeys card.
  Confirms via `Alert`, calls the delete-request endpoint, then calls `logout()` —
  nothing left to do in-app until the emailed link is confirmed.
- **`apps/site` is untouched** — its own `/account/*` prefix already 308-redirects to
  `web.themoveee.com` (see "Site architecture — split complete" above), so
  `themoveee.com/account/delete` correctly reaches these new `apps/connect` pages with
  no proxy changes needed there.

---

## Google Play Billing — Moveee Pro upgrade on Android (August 2026)

Moveee Pro's Android upgrade goes through real Google Play Billing now, not a web-
checkout redirect — the redirect risked a Payments-policy rejection (an app unlocking
in-app digital features via an external checkout), flagged during Play Store submission
prep (see `docs/play-store-listing.md`). A client-reported purchase is never trusted on
its own — every purchase token is verified against the Play Developer API server-side
before Pro is granted, matching the existing Stripe/Paystack posture.

**Restored, not new**: `react-native-iap` and its Android store-flavor config plugin
(`apps/mobile/plugins/withAndroidIapStoreFlavor.js` — the file itself was never
deleted, only unwired) had been deliberately stripped from `package.json`/`app.config.ts`
to unblock early preview builds (see the "Production build checklist" table above,
which is now stale on this point — both are back). Lockfile regenerated via the
documented out-of-tree process.

- **Client** (`apps/mobile`): `src/config/iap.ts` — the two subscription SKU constants
  (`moveee_pro_monthly` / `moveee_pro_annual`) that must match Play Console and the WP
  Admin setting below exactly. `src/features/billing/iap.ts` — `initIAP()`/`endIAP()`,
  `getProSubscriptions()`, `purchaseProSubscription()` (wraps react-native-iap's
  purchase-updated/error listeners into one promise that only resolves after our
  backend verifies the purchase). Android's Billing Library v5+ requires an explicit
  `offerToken` per SKU, not a bare SKU string — pulled from the live subscription's own
  `subscriptionOfferDetails` rather than hardcoded, so a promotional offer added later
  in Play Console keeps working with no code change.
- **`MembershipScreen.tsx`**: on Android, fetches both subscriptions on mount and shows
  Monthly/Annual buttons with live store-formatted prices — falls back to the original
  "Upgrade on the web" button if Play Billing is unavailable (no Play Services, some
  emulators). iOS is untouched, still redirects to web checkout — StoreKit wiring is
  separate, out-of-scope work.
- **Backend**: `culture-community/includes/core/class-culture-google-play-billing.php`
  (`Culture_Google_Play_Billing::verify_and_grant()`) — signs its own OAuth2
  service-account JWT with `openssl_sign()` (RS256) and calls the Play Developer API via
  raw `wp_remote_request()`, no Google API client library / Composer dependency, same
  "raw HTTP, no SDK" convention as `class-culture-r2.php`'s hand-rolled AWS SigV4
  signer. Checks `paymentState`/`expiryTimeMillis` before granting anything; **rejects
  any `product_id` that isn't one of the two configured subscription IDs** (so a valid
  purchase token for some unrelated product under the same package could never grant
  Pro on its own); acknowledges the purchase with Google if not already acknowledged
  (required within 3 days or Google auto-refunds it); fires the same
  `culture_payment_completed` action Stripe/Paystack already fire, so receipt emails
  and analytics work unmodified. New REST route:
  `POST /culture/v1/mobile/billing/verify-google-play` (JWT).
- **WP Admin**: Payment tab → new "Google Play Billing (Android app)" section — package
  name, service account JSON (textarea, mirrors the `culture_stripe_secret_key`-style
  plaintext-option storage convention every other payment gateway here already uses),
  monthly/annual product IDs.
- **Human setup still required before this works end-to-end** (none of this is
  something code alone can do): create the `moveee_pro_monthly`/`moveee_pro_annual`
  subscription products in Play Console → Monetize → Subscriptions under this app's
  package (or use different IDs and update the WP Admin fields to match); create a
  service account with Play Developer API access (Play Console → Setup → API access)
  and paste its downloaded JSON key into WP Admin; note the subscription products can't
  go live/testable until a build has been uploaded to a Play Console testing track —
  there's an unavoidable chicken-and-egg ordering with the rest of the submission
  checklist.
- **Known, deliberate scope limit — this only verifies at purchase time.** Renewals,
  cancellations, refunds, and grace-period/account-hold transitions that happen later
  are **not** reflected automatically — that needs Google Play Real-Time Developer
  Notifications (a Cloud Pub/Sub subscription), which needs Google Cloud infrastructure
  a human has to set up before any code could consume it. Until that's built: a
  subscription that's been cancelled but hasn't reached its paid-through date still
  correctly shows as Pro (right — they paid for the period), but a subscription that
  silently lapses without the app ever calling this endpoint again won't auto-downgrade
  to Citizen. If a future "why do cancelled users still have Pro" report comes in, this
  is why — it's a scoped-out gap, not a bug, and closing it means building the RTDN
  receiver, not re-debugging this class.

---

## Sentry error tracking (mobile, August 2026)

`apps/mobile` reports JS errors, native crashes, and navigation-tagged breadcrumbs to
Sentry via `@sentry/react-native` (`~8.24.0`, compatible with the pinned Expo SDK 52 /
RN 0.76.9 — see "Expo SDK version" above). **DSN/org/project are live** (org `moveee`,
project `moveee-mobile`, EU data-residency region — the DSN's ingest host is
`ingest.de.sentry.io`, not the default `sentry.io`) — `Sentry.init()` in `App.tsx` only
skips itself when `SENTRY_DSN` is blank, which it no longer is, so JS errors/native
crashes report as soon as a build runs this code. Source-map upload (readable stack
traces, not just minified offsets) still needs the one remaining human step below —
without it, events still arrive, just without symbolication.

- **`src/config/sentry.ts`** — `SENTRY_DSN` (public identifier, same "safe to ship in
  the binary" convention as `GOOGLE_IOS_CLIENT_ID` in `src/config/google.ts` — it only
  lets events be *sent* to the project, no read access) plus `SENTRY_ORG`/
  `SENTRY_PROJECT` slugs for the build plugin. `App.tsx` only calls `Sentry.init()`
  when `SENTRY_DSN` is truthy — kept as a guard for local/fork dev, not because this
  DSN is expected to go blank again.
- **`App.tsx`** — `Sentry.init()` at module scope (before any component renders, so
  startup crashes are captured too); the existing `ErrorBoundary` class's
  `componentDidCatch` now also calls `Sentry.captureException()` (it still owns the
  visible "Startup Error" fallback screen — Sentry reporting is additive, not a
  replacement); the default export is `Sentry.wrap(App)` for automatic touch-event
  breadcrumbs and cold/warm start timing; a `useEffect` keyed on the auth store's
  `isAuthenticated`/`user.id`/`user.username` calls `Sentry.setUser()` — **id +
  username only, deliberately never email/phone/DOB/etc.** — and clears it
  (`Sentry.setUser(null)`) on logout so a handed-down/shared device doesn't
  misattribute the next session's errors to the previous user.
- **`src/navigation/index.tsx`** — exports `navigationIntegration =
  Sentry.reactNavigationIntegration()` at module scope (imported by `App.tsx` into
  `Sentry.init()`'s `integrations` array), and the `Navigation` component's
  `NavigationContainer` gets a `useNavigationContainerRef()` ref registered via
  `onReady={() => navigationIntegration.registerNavigationContainer(navigationRef)}`
  — this is what actually turns screen changes into Sentry breadcrumbs/route
  performance spans, `reactNavigationIntegration()` alone does nothing without it.
- **`metro.config.js`** — final export wrapped in `withSentryConfig()` (from
  `@sentry/react-native/metro`), applied *after* all the existing monorepo
  react/react-native resolution customization rather than replacing
  `getDefaultConfig()` — adds source-context annotations to the bundle so stack
  traces resolve to real file/line. Safe with `SENTRY_DSN` unset; only affects
  bundling, not whether events are sent.
- **`app.config.ts`** — `@sentry/react-native/expo` added to the `plugins` array
  (after `withAndroidIapStoreFlavor`, order doesn't matter for this one — unlike the
  IAP flavor plugin, which must come after `react-native-iap`), configured with
  `SENTRY_ORG`/`SENTRY_PROJECT` from `src/config/sentry.ts` and `url:
  "https://de.sentry.io/"` — the EU-region API host, matching the DSN's ingest region
  (**not** the default `https://sentry.io/` a US-region org would use). This is what
  patches the native iOS/Android projects for crash-symbolication upload and, when a
  `SENTRY_AUTH_TOKEN` env var is present at EAS build time, uploads JS source maps —
  the auth token is a real secret and is **never** hardcoded here, only ever read
  from the environment (see the one remaining setup step below).

**One remaining human step — source-map upload** (same shape as the Google Play
Billing / R2 "code alone can't do this" callouts elsewhere in this file; DSN/org/
project are already filled in, this is the only gap left):
1. Create a Sentry auth token (Settings → Auth Tokens, scoped to `project:releases`,
   in the `moveee` org) and set it as an EAS Secret from `apps/mobile` —
   `eas secret:create --name SENTRY_AUTH_TOKEN --value <token> --type string` — so
   `@sentry/react-native/expo` can upload source maps and crash-symbolication data
   during EAS builds. Never commit this token to the repo.
2. Rebuild with EAS (a local `expo start` dev-client reload won't pick up the new
   native config plugin) before expecting native (not just JS) crashes to report, and
   before stack traces resolve to real file/line instead of minified bundle offsets.

**If a future error-tracking report says "nothing showed up in Sentry," check the
`moveee` org's `moveee-mobile` project — not `sentry.io` in general, since this org is
EU-region-hosted (`de.sentry.io`) and won't show up under a default US-region search.**
If events arrive but stack traces are unreadable, that's the `SENTRY_AUTH_TOKEN` step
above not having been done yet (or not picked up by the build that shipped), not a
bug in the instrumentation itself.

**Sentry was initialized correctly but reporting nothing, because nothing ever called
it (fixed August 2026).** `apps/mobile/src` has ~140 silent `catch {}` blocks — the
intentional "fail quietly, don't crash the screen" pattern used throughout this app —
but that also meant `Sentry.captureException` was only ever invoked from the top-level
render `ErrorBoundary` in `App.tsx`. Every network/API failure (a 500, a token-
resolution bug, a genuine crash-causing backend issue) got caught locally and silently
swallowed before Sentry ever heard about it. Fixed by centralizing reporting in
`src/api/client.ts`'s `request()`/`upload()` — the one choke point nearly every
network call in the app funnels through, so coverage no longer depends on whether a
given call site's `catch` block happens to report anything. Every failed request now
leaves a Sentry breadcrumb; a full `captureException` only fires for network/fetch
failures and 5xx responses — not ordinary 4xx application flow (validation errors, the
expected 401-triggers-logout path), which are normal, not something to page on. If a
future report says "X clearly failed but there's nothing in Sentry," check first
whether the failure happened somewhere that *doesn't* route through `api/client.ts`
(e.g. `react-native-iap`/passkey native module errors, a thrown error inside a
component's own render) — those still need an explicit `Sentry.captureException` call
added at the point of failure, this fix only covers the HTTP layer.

**Correction (September 2026): "the expected 401-triggers-logout path... is normal, not
something to page on" was too broad.** User-reported: picking a Google Books/Spotify/TMDB
search result in the community composer (`DirectorySearch.tsx`'s `handleSelectExternal()` →
`/directory/quick-create`) was force-logging users out. Investigation found the
*previously known* cause of exactly this symptom (a March/earlier fix, "Fix Book Review
composer kicking users to login on select" — collapsing transient upstream failures into a
blanket 401) was already fixed and already live in the code for weeks, yet the bug was
still being reported — meaning either a genuinely different, still-undiagnosed cause, or a
real (if surprising) session invalidation. **Either way, there was no way to tell which**,
because a 401 that fires `_onUnauthorized()` (i.e., one that actually force-logs someone
out) was — by this section's own prior guidance — deliberately excluded from
`captureException`, so it left literally no discoverable trace in Sentry. Fixed:
`request()` now calls `Sentry.captureMessage()` (not `captureException` — still not treated
as a crash-level bug) specifically in the branch where a 401 is about to fire
`_onUnauthorized()`, including the URL/method and the response's `code` field. **Every
route a mobile client hits that can 401 should return a distinguishing `code` field in its
JSON error body** (e.g. `no_token` vs. `wp_401`/the upstream WP_Error's own `code`) — see
`apps/site/app/api/directory/quick-create/route.ts`'s two 401 branches for the pattern —
otherwise this new Sentry message can only say "a 401 happened here," not why, which is the
exact gap being closed. **If a 401-triggered logout is ever reported again, search Sentry
for `Auto-logout triggered:`** — that message now names the exact endpoint and code every
time this fires, instead of the silent-by-design gap this section used to document as
correct behavior.

**Follow-up (September 2026) — the diagnostic paid off immediately: the very next real
occurrence's Sentry event was `Auto-logout triggered: POST
https://themoveee.com/api/directory/quick-create → 401 (no_token)`, and the user separately
confirmed the same symptom happens "at all types of post creation," not just picking an
external search result.** `no_token` is emitted by that proxy route's very first check
(`if (!token) return ... code: "no_token"`, before it ever contacts WordPress) — meaning
the mobile app's own outgoing request had **no `Authorization` header at all**. That rules
out every theory this section's earlier passes considered (a masked-401 bug in the proxy,
a WAF/Cloudflare challenge page, a WordPress-side token check) — the request never got far
enough to hit any of those. The only way `request()`/`upload()` in `src/api/client.ts` send
no header on an `auth: true` call is if the in-memory `_authToken` variable was falsy at
that exact moment.

Traced every place that can clear or set `_authToken` (`setAuthToken()` has exactly five
call sites, all in `authStore.ts`'s `hydrate()`/`login()`/`loginWithToken()`/`logout()`) and
confirmed `hydrate()` only ever runs once, at boot (`App.tsx`'s one `useEffect([])`) — so a
mid-session composer failure can't be a hydrate timing race. That leaves the in-memory
mirror simply falling out of sync with the real, durable SecureStore-held token for reasons
this investigation couldn't pin down further from static analysis alone (no live device/
Sentry-session access from this environment) — but regardless of the exact trigger, an
in-memory cache disagreeing with its own durable backing store is a class of bug with a
standard fix: **re-sync from the durable store before concluding the session is gone,
rather than trusting the cache blindly.**

Fixed in `src/api/client.ts` with a new `resolveAuthToken()` — called from both `request()`
and `upload()` in place of reading `_authToken` directly. It returns `_authToken` unchanged
when set; when it's empty, it re-reads `SecureStore.getItemAsync("auth_token")` (the same
key `authStore.ts` writes) and, if that comes back non-empty, repopulates `_authToken` and
uses it for this request (with a Sentry breadcrumb noting the recovery, so a future
investigation can see exactly how often this actually saves a request). Only if SecureStore
*also* has nothing does the request go out tokenless and legitimately 401/`no_token`/force a
real logout — this only ever prevents a **false-positive** logout for a session that was
still genuinely valid; it changes nothing for an actually-expired-or-revoked session. This
is now the single choke point every authenticated mobile call goes through (same "one
implementation, not per-endpoint" reasoning as everything else in `client.ts`), so the fix
automatically covers every post-creation path the user described ("all types") — community
submit, image upload, and directory quick-create alike — without needing per-endpoint changes.

**A second, related bug fixed in the same pass**: `authStore.ts`'s `hydrate()` used to
delete the stored token and call `setAuthToken(null)` on **any** exception from its
boot-time "verify the token" call (`GET /mobile/me`) — including a plain network error or a
5xx, not just a genuine 401/403 rejection. A network hiccup on cold start (spotty wifi,
cellular handoff mid-launch) would permanently throw away a perfectly valid token, forcing
a real session to log back in for no reason — the exact same "collapsing a transient
upstream failure into a blanket auth rejection" anti-pattern this file's own
`quick-create/route.ts` comment already warns against, just one layer up, at the client's
own boot sequence. Fixed to only wipe the stored token when the failure is a genuine
`ApiError` with `status === 401 || status === 403` (i.e. WordPress itself rejected the
token); any other failure now just leaves `isLoading` false and skips setting
`isAuthenticated` for that launch, without destroying the durable credential — so a retry or
next launch can still recover once the network is back.

*(Not verified live this pass.)*

---

## Passkeys (WebAuthn) — never worked on native, missing platform setup (fixed August 2026)

Web passkeys (`apps/connect`'s `PasskeyManager.tsx`, browser `@simplewebauthn/browser`)
have worked since Phase 7 shipped — browser WebAuthn just checks the calling page's own
origin, no extra platform config needed. **Mobile passkeys never worked, on either
platform, because two OS-level trust files that `react-native-passkeys` requires were
never set up** — this isn't a subtle bug, it's a complete, silent gap: without them,
iOS/Android refuse to create or use a platform passkey for any `rp.id` at all, and
`Passkeys.create()`/`.get()` in `MemberSettingsScreen.tsx`'s `PasskeyManager`-equivalent
just fail (often silently, caught by one of the ~140 `catch {}` blocks mentioned in the
Sentry entry above — which is also why this never showed up in Sentry either, before
that fix).

**What was missing and what closes it:**
1. **iOS Associated Domains entitlement** — `apps/mobile/app.config.ts`'s `ios` block
   now sets `associatedDomains: ["webcredentials:themoveee.com"]`. Without this, the
   OS never even attempts to look up trust for the app.
2. **`apple-app-site-association` file**, hosted at
   `https://themoveee.com/.well-known/apple-app-site-association` (no extension, no
   redirects) — new route handler,
   `apps/site/app/.well-known/apple-app-site-association/route.ts`. Its `apps` array
   is `["<APPLE_TEAM_ID>.com.moveee.connect"]`, built from an `APPLE_TEAM_ID` env var
   (Vercel, Site A project) that still needs to be set — find it in Apple Developer →
   Membership, or the "Team ID" line `eas credentials` prints. Deliberately degrades to
   an empty `apps` array (inert, not broken) when unset, rather than baking in a
   guessed value.
3. **`assetlinks.json` file**, hosted at
   `https://themoveee.com/.well-known/assetlinks.json` — new route handler,
   `apps/site/app/.well-known/assetlinks.json/route.ts`. Its
   `sha256_cert_fingerprints` comes from an `ANDROID_PASSKEY_SHA256_FINGERPRINTS` env
   var (comma-separated, colon-hex format) — same "every keystore that will ever sign
   a build you test on" requirement as the Google Sign-In SHA-1 setup elsewhere in
   this file (production keystore and any EAS preview-profile keystore are typically
   different certs). Get each via `eas credentials` → Android → view keystore, or
   `keytool -list -v -keystore <file>.jks`. The `delegate_permission/
   common.get_login_creds` relation specifically is what Android's Credential Manager
   checks for passkey trust — without it, calls fail silently or return "no matching
   credentials" rather than a clear error.
4. **`expo-build-properties` plugin** (`apps/mobile/app.config.ts`, new dependency) —
   `react-native-passkeys`'s own setup docs require it for setting a real iOS
   deployment target (`15.1` — the platform-authenticator/passkey APIs don't exist
   below iOS 15). Android's `compileSdkVersion 34+` requirement is already satisfied
   by Expo SDK 52's own default, so no explicit override was added for that half.

**The `themoveee.com` domain choice is an assumption, not a certainty — verify it.**
`Culture_WebAuthn::rp_id()` (`culture-community/includes/core/class-culture-webauthn.php`)
auto-derives the relying-party ID by stripping the `cms.` prefix off WordPress's own
`home_url()` (→ `themoveee.com`) — there is no `culture_webauthn_rp_id` WP option ever
set anywhere in this codebase and no WP Admin UI to set one, so the auto-derived
default is almost certainly what's live in production. **But this must match exactly
whatever `rp.id` the server actually returns from `GET
/culture/v1/auth/passkey/register-options`** — if that ever turns out to be
`web.themoveee.com` instead (e.g. an option was set directly in the database, bypassing
the codebase entirely), both the `associatedDomains` entry and the `.well-known` files'
location need to move to match. Confirm by hitting that endpoint and checking the
`rp.id` in its response before assuming this fix is complete.

**Requires a full native rebuild — a JS-only OTA update will not pick this up.** All
four pieces above are native config (entitlements, deployment target) that only take
effect through a real EAS build, not `expo start`/an OTA update. **Also still requires
the two Vercel env vars above (`APPLE_TEAM_ID`, `ANDROID_PASSKEY_SHA256_FINGERPRINTS`)
to be set on Site A before passkeys will actually work** — the code deploys safely
without them (empty/inert `.well-known` responses), it just means passkeys stay broken
until a human fills them in.

*(Not verified live this pass — needs a real EAS build to confirm.)*

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

### Tablet support — foundational shell (August 2026)

Mockup-first as usual (Artifact, two frames — Feed and Discover at iPad-landscape width),
iterated once (an early draft used the just-retired `paperWarm` cream background — caught
and fixed before this was built) then approved. This is the **foundational shell** pass
specifically — a real per-screen tablet layout audit across the other ~40 screens is a
separate, larger follow-up, not done here.

- **`ios.supportsTablet`** flipped to `true` in `app.config.ts` (was `false`, iPad was
  explicitly opted out). Both iPad and Android tablets are in scope.
- **`src/hooks/useIsTablet.ts`** — the one detection primitive everything else is built on.
  Uses `Math.min(width, height) >= 600` (`useWindowDimensions`), matching Android's own
  `sw600dp` tablet qualifier — shortest-side, not raw width, so a phone in landscape
  doesn't misfire as "tablet."
- **Left nav rail replaces the bottom tab bar on tablet** — `src/navigation/TabletRail.tsx`,
  passed as the `tabBar` prop on the existing `Tab.Navigator` in `navigation/index.tsx`'s
  `MainTabs()` only when `useIsTablet()` is true (`tabBar={isTablet ? (props) => <TabletRail
  {...props} /> : undefined}`). This is the same `Tab.Navigator`/route state phones use —
  no new navigator type, no `@react-navigation/drawer` dependency added — the rail is just a
  custom renderer for the identical state, following React Navigation's own documented
  custom-tab-bar pattern (`navigation.emit('tabPress', ...)` before navigating, so
  `tabPress` listeners on individual screens still fire correctly). **If you add a 6th
  top-level tab in the future, no rail changes are needed** — it maps over `state.routes`
  generically; only the `TAB_ICONS`/`TAB_LABELS` lookup maps need a new entry (same
  maintenance burden the old bottom-tab `screenOptions.tabBarIcon` already had).
- **Feed** (`ConnectFeedScreen.tsx`) — on tablet, the feed column caps at 620px and centers
  (`listContentTablet`) instead of stretching edge-to-edge, and a new 288px right rail
  appears with Trending (reusing the same `getTrending()` data/component logic the phone's
  horizontal "Trending Strip" already used — the strip itself is hidden on tablet via
  `!isTablet &&`, so the same data isn't shown twice) and a static About card. Unlike the
  phone strip (only shown in "For You" mode), the tablet rail's Trending card shows
  regardless of feed mode — matches how the equivalent web sidebar behaves (see "Phase 8b —
  Feed recommendations" above, web's trending sidebar is independent of the For You filter
  too). The FAB shifts left on tablet (`fabTablet`) so it floats over the feed column, not
  on top of the new right rail.
- **Discover** (`DiscoverScreen.tsx`) — the "Explore More" grid's `numColumns` goes from a
  hardcoded `2` to `isTablet ? 3 : 2`. **`FlatList.numColumns` can't change without a
  remount** — `key={`grid-${numColumns}`}` forces one when the value flips (e.g. rotating an
  iPad, or a Slide Over/Split View resize). Grid content also caps at 960px width and
  centers on very wide screens (`gridContentTablet`) so a 4-up-equivalent grid on a 12.9"
  iPad doesn't stretch absurdly wide. The horizontal "Picked for You"/"Recently Added"/
  "Trending in Community" rails above the grid are untouched — still phone-sized cards,
  out of scope for this pass.
- **Not touched in this pass, still phone-only layout**: every screen besides Feed/
  Discover, and the in-screen headers some screens carry (e.g. `ConnectFeedScreen.tsx`'s
  own Hub/Stoop/Bell/Avatar icon row) — those provide real navigation the
  rail doesn't cover and were deliberately left as-is rather than restructured into the rail
  itself, to keep this pass scoped to the shell + two example screens the mockup covered.
- *(Not verified on a real device/simulator this pass — re-check on an actual iPad/Android tablet
  and a phone before considering this closed.)*

### Site B (`apps/connect`) title-metadata sweep — doubled brand suffix + "The Moveee" (September 2026)

User-reported as "why is the Hubs page title showing **Hubs · Moveee | Moveee**". That one page
was a symptom of two bugs across 44 files — the Site B counterpart to the `apps/site` brand-suffix
cleanup documented above, which never covered this app.

**Bug 1 — the doubled suffix.** `apps/connect/app/layout.tsx` sets
`title: { default: ..., template: "%s | Moveee" }`. Next.js applies that template to every
descendant page's **plain** `title:` string, so any page title that already ended in the brand
rendered it twice. 21 pages did (`"Hubs · Moveee"` → `Hubs · Moveee | Moveee`). Fixed by making
the page title the bare page name and letting the template supply the brand.
**The rule for this app: a plain `title:` must never contain "Moveee".** Only
`title: { absolute: "…" }` bypasses the template, and those keep the brand themselves.

- **`openGraph.title` and `twitter.title` are NOT templated** — Next.js applies `title.template`
  only to `metadata.title`. A nested `"Name | Moveee"` in either block is correct and was
  deliberately left alone (see `app/connect/[username]/page.tsx`, where line 72 was fixed but
  lines 75/82 were not). Don't "fix" those to match; they'd lose the brand entirely.
  `ShareButton.tsx`'s `navigator.share({ title })` is not metadata at all — also left alone.

**Bug 2 — "The Moveee" in 30 titles.** Same banned string the `apps/site` sweep removed; that
rule ("Never write 'The Moveee' — that string is not the brand name") was never applied here.
Normalised to plain **Moveee**, separator standardised to `" | "`, and invented sub-brands
collapsed per the same precedent: `Moveee Happenings`, `Moveee Community`, `Moveee Pulse` and
`The Moveee Games` all became plain `Moveee`. Real feature names were kept as the page-name half
(`Culture Games`, `Culture Directory`, `Vendor Dashboard`). Also fixed: `siteName` and the JSON-LD
publisher `name` in `community/[slug]` and `pulse/[slug]`, and the root layout description.

**Deliberately left alone**, matching the `apps/site` sweep's own scope (metadata only):
- **`The Moveee Literary`** — a legitimate section proper noun, explicitly sanctioned above.
  Not the generic-brand-name bug.
- **`© {year} The Moveee. All Rights Reserved.`** footers (6 files) — the established legal
  entity line, same "legal defined-term usage is out of scope" call as on Site A.
- Body copy and AI prompts containing the phrase.

Two other things fixed in passing, both caught while reading the titles: `app/feed/page.tsx` was
titled `"Moveee — Community for Global Creatives"`, which both doubled **and** used the
geography-emphasising "Global" the brand-language rule above warns against — now just `"Feed"`.
And `app/pulse/categories/layout.tsx`'s `"Categories — Moveee Pulse"` became `"Pulse Categories"`
rather than a bare `"Categories"`, which would have been meaningless in a browser tab.

Not verified in a browser — `apps/connect` has no `node_modules` in this sandbox, so neither
`tsc --noEmit` nor `next build` could run. Verified via a brace/paren-balance check on all 44
edited files and a re-run of the audit script that found the bug (0 templated titles still
carrying the brand, 0 titles containing "The Moveee"). Re-check a couple of real tabs after
deploy before considering this closed.

### Stoop companion Hubs hidden from the Hubs browse page; Stoop icon changed (September 2026)

Two small Stoop-facing fixes, both user-reported.

**Companion Hubs no longer appear in Hub discovery.** Every Stoop cluster auto-provisions its own
Hub on creation (`Culture_Clusters::maybe_create_companion_hub()` — named `"{Cluster} — Stoop"`,
linked both ways via `_cluster_hub_id` / `_hub_cluster_id`), which is the right mechanism: it
reuses the ordinary Hub join/post/feed plumbing rather than a bespoke cluster-chat feature. But
those Hubs are a private discussion space for one small local group, not a topic community anyone
can usefully browse into — and at one per cluster they would swamp the public directory as Stoops
grow. `Culture_Hubs::discover()` now subtracts every post ID carrying `_hub_cluster_id` from its
candidate set, right after the `_hub_status = active` lookup and before the category filter, using
the same raw-SQL resolve-to-IDs shape the rest of that method already uses (never a `meta_query`
join — see the "meta_query OR-branches are slow" note above).

- **Deliberately scoped to `discover()` only.** `my_hubs()` is untouched: a member who joined
  their Stoop's Hub still sees it in their own list, which is correct — it genuinely is one of
  their Hubs. This is the narrower reading of "don't list Stoop hubs on the Hubs page"; if the
  intent was to hide them from the member's own list too, that is a second, separate filter.
- **Nothing is stranded.** The companion Hub stays reachable from its cluster page on both
  platforms (`ClusterScreen.tsx` and `apps/connect/app/cluster/[id]/page.tsx` both render a link
  gated on `cluster.hubId && cluster.hubSlug`). Verified before making the change.
- Needs the plugin redeployed before it takes effect in production. No new dbDelta table, so no
  `CULTURE_VERSION` bump. Verified via `php -l`.

**Stoop's nav icon changed from `home-outline` to `bonfire-outline`** (`ConnectFeedScreen.tsx`
header). A house glyph reads as "go to the start of the app" in every other app's navigation, so
it competed with the nav's own semantics instead of naming the feature — and it was inaccurate
besides: `HostOnboardingScreen.tsx` offers home / café / coworking / other as venue types, so a
Stoop is frequently not a home at all. A bonfire reads as "a small group that gathers here
regularly", which is what a Stoop is, and collides with nothing else in the header (Hub is
`planet-outline`). Runner-up was `location-outline`, which leans on the area-level half of the
idea instead — a one-word swap if that framing is ever preferred.

- `MemberDashboardScreen.tsx`'s `QUICK_LINKS` still uses a 🏠 emoji for "My Stoop" / "Find your
  Stoop". Left as-is: it sits directly beside its own text label, so it can't be misread as a
  home button the way a bare nav icon can.
- `HostOnboardingScreen.tsx`'s 🏠 (and the web equivalents in `CreateClusterClient.tsx` /
  `cluster/[id]/page.tsx`) are the literal "Home" **venue type**, not Stoop branding — correct as
  they are, don't sweep them.
- Web is untouched — `apps/connect`'s `Header.tsx` rail already uses its own named `"stoop"` icon.

### Feed header trimmed to four targets — Discover + People Near Me moved to the account menu (September 2026)

**Partly superseded**: People Near Me was retired outright later the same month (see "People
Near Me / member directory RETIRED" above), so only the Discover half of this move survives.
The rest of this entry — the crowding measurement, the `MemberStack`-is-never-mounted
reasoning, and the header's final Hub/Stoop/Bell/Avatar shape — still holds.

`ConnectFeedScreen.tsx`'s header row carried five 22px Ionicons plus the 34px avatar in a 390px
bar, which left roughly 4px of visual gap between tap targets (the `hitSlop` made them *usable*,
but the row read as crowded — user-reported against a true-size mockup of the screen). Two of
the five were removed: **People Near Me** (`MemberDirectory`) and **Discover**. The row is now
Hub → Stoop → Bell → Avatar.

Neither destination was orphaned — both were added to `MemberDashboardScreen.tsx`'s
`QUICK_LINKS` (🧭 Discover, 👥 People Near Me, placed first, ahead of Wallet), which is the
account menu the header's own avatar opens. **This works because `MemberDashboard` is only ever
reached through `ConnectStack`**, where `Discover` and `MemberDirectory` are both registered —
`MemberStack` declares neither, but it is defined and never mounted (`MainTabs` has five tabs:
Connect/Magazine/Games/Shop/Events), so it's dead code and not a real second entry path. The
pre-existing "Find your Stoop" quick link already relied on this same assumption by routing to
`MemberDirectory`. **If `MemberStack` is ever actually mounted as a tab, both new links (and
that pre-existing one) will break** — register the two routes there at the same time.

Web is unaffected: `apps/connect`'s left nav rail (see "Connect app left-nav rail" above) has
its own `RAIL_LINKS` block with plenty of room, and was deliberately left alone.

Verified via `tsc --noEmit` on `apps/mobile` — 37 errors before and after, all pre-existing (see
the SDK 57 upgrade entry for why that baseline is 37 and what's in it), so this introduced none.
Not verified on a real device.

### Tablet support — remaining ~55 screens (August 2026, same day follow-up)

Closes the "screen-by-screen tablet audit is a separate follow-up" gap left open by the
foundational-shell pass above — every other screen in the app now gets the same
cap-and-center treatment Feed/Discover proved out, rather than stretching edge-to-edge on
an iPad/Android tablet.

- **New: `src/hooks/useTabletContentStyle.ts`** — the shared primitive this pass is built
  on. `useTabletContentStyle(maxWidth = 720)` returns `{ maxWidth, width: "100%", alignSelf:
  "center" }` on tablet (per `useIsTablet()`) and `undefined` on phone, so spreading it into
  a `contentContainerStyle` array (`[styles.scroll, tabletCap]`) is a no-op on phone and a
  centered reading/form column on tablet. Every screen below calls this once and passes the
  result into its outer `ScrollView`/`FlatList`'s `contentContainerStyle` (or, for the rare
  screen with no scroll container, its outer `View`).
- **Scope**: every screen under `src/screens/{magazine,shop,events,games,member,community,
  auth}/` that wasn't already covered by the foundational-shell pass — roughly 55 screens.
  Two screens were deliberately skipped: `MemberScreen.tsx`/`SettingsScreen.tsx` (confirmed
  dead — not registered in `navigation/index.tsx`) and `OnboardingScreen.tsx` (a full-bleed
  swipeable paging carousel sized directly off `Dimensions.get("window")` — capping it would
  break the `pagingEnabled` snap math, so it stays full-bleed on tablet, same as the
  full-bleed-hero exception below).
- **Consistent `maxWidth` choices by content type** (not a single universal number): ~440px
  for single-column auth forms (Login/Register/Forgot/Reset/VerifyEmail), ~520–620px for
  puzzle/game screens (Sudoku/Crossword/Trivia/WhoSaidIt — narrower, since a stretched grid
  or quiz card reads worse than a stretched article), ~680px for detail/settings/list pages
  (the majority of the pass), ~760–900px for browse/grid pages (Shop home, Member Directory,
  Perks — wider, since these want more of a tablet's horizontal space per the same reasoning
  `gridContentTablet` used for Discover).
- **Full-bleed hero exception, applied consistently**: any screen with a full-bleed
  photo/gradient hero above a card-style body (`ArticleScreen.tsx`, `EventDetailScreen.tsx`)
  caps only the body "sheet"/"content" card below the hero, not the hero itself — same
  reasoning as `ArticleScreen.tsx`'s original tablet pass (the very first screen done in this
  batch, before the rest were tackled): a capped-width hero on a wide iPad would look like a
  mistake, not a design choice. Everywhere else (product pages, event listings, shop
  screens with a hero banner inside the main scroll), the simpler "cap the whole scroll
  content" treatment was used instead, accepting that a hero banner shrinks along with the
  rest of the page — the same tradeoff already made for `ShopScreen.tsx`'s hero banner in the
  foundational-shell pass's own reasoning, applied consistently rather than re-litigated
  per screen.
- **`FlatList numColumns` grids were *not* given the Discover-style column-bump treatment**
  in this pass (2 columns stays 2 columns on tablet, e.g. `ShopListingScreen.tsx`,
  `MemberDirectoryScreen.tsx`, `PerksScreen.tsx`) — only cap-and-center. Bumping column count
  cleanly requires reworking each screen's own card-width math (several compute `colW` from
  a module-level `Dimensions.get("window")` snapshot, not a reactive hook), which is real
  per-screen work; Discover got it because it was one of the two screens the original mockup
  covered. If a specific grid screen's tablet layout looks sparse, that's the known,
  deliberate gap to revisit — not a bug.
- **`MemberSettingsScreen.tsx`** (7 tabs — Profile/Directory/Interests/Newsletters/
  Notifications/Appearance/Security) needed one `useTabletContentStyle()` call and one
  `contentContainerStyle` wrap *per tab component*, since each tab is its own function
  component with its own local styles/state, not a shared outer scroll container.
- *(Not verified on a real device/simulator this pass, same as the foundational-shell pass above
  — re-check pixel fidelity on an actual iPad/Android tablet before considering this closed.)*

### Production build checklist — react-native-iap restored (August 2026)

`react-native-iap` and `./plugins/withAndroidIapStoreFlavor` were stripped in an
earlier pass to unblock preview APK builds (Gradle couldn't resolve the Amazon/Play
store flavor without the plugin) — **both are now restored**, since Moveee Pro's
Android upgrade needs real Google Play Billing to be Payments-policy compliant. See
"Google Play Billing — Moveee Pro upgrade on Android" above for the full
implementation. Lockfile was regenerated via the documented out-of-tree process below
after restoring the dependency.

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

**SUPERSEDED (September 2026): the app is now on Expo SDK 57, and the SDK 52 pin described
below is retired. See "Expo SDK 52 → 57 upgrade" at the end of this file for the current
state — it is authoritative over every SDK-52-era claim in this section and the several that
follow it.** Google Play rejected the 1.0.1 release on three errors (target API 34 vs 36, no
16 KB page support, Play Billing 7 vs 8) that SDK 52 structurally could not satisfy.

Current: `expo: ~57.0.0`, `react: 19.2.3`, `react-native: 0.86.3`, and the New Architecture
is **enabled** (SDK 57's template sets `newArchEnabled=true`; SDK 52's set it to `false`).
`react-native-passkeys` is `0.4.2` and `react-native-iap` is `^14.7.20` — **both old pins
below are wrong now**; passkeys `0.4.2` requires `expo >=53`, and the iOS bug that forced the
exact `12.16.3` pin does not exist in v14. `expo-location` is now `~57.0.20` (used only for a
one-time GPS snapshot — see "Stoop proximity banner + member geolocation" above — never
background tracking).

The lockfile is still the source of truth, and the regeneration process below is unchanged
and still mandatory.
- **Always regenerate `package-lock.json` from scratch** after changing `package.json` —
  EAS Build uses `npm ci` which only installs what's in the lockfile. If a package is in
  `package.json` but not in the lockfile, it won't be installed.
- To regenerate: `cd /tmp && cp apps/mobile/package.json . && npm install --package-lock-only && cp package-lock.json apps/mobile/`
  (must be outside the monorepo to avoid workspace interference)

### `react-native-iap` 12.16.4 breaks the iOS native build — pin to 12.16.3 exactly (August 2026)

Moved to `docs/claude-md-archive.md` (historical visual-rebuild / build-fix pass — superseded or no longer actionable; see that file for full detail if ever needed).

### iOS native build failure — `fmt` library vs. newer Xcode/Clang `consteval` checking (fixed August 2026; the first fix attempt did nothing — corrected same day)

Moved to `docs/claude-md-archive.md` (historical visual-rebuild / build-fix pass — superseded or no longer actionable; see that file for full detail if ever needed).

#  define FMT_CONSTEVAL consteval
#  define FMT_CONSTEXPR20 constexpr
#else
#  define FMT_CONSTEVAL
#  define FMT_CONSTEXPR20
#endif
```
`FMT_CONSTEVAL` gets unconditionally `#define`'d based on `FMT_USE_CONSTEVAL`'s computed value
(itself unconditionally defined a few lines above, same lack of guard) — so whatever value a
`-D`/`GCC_PREPROCESSOR_DEFINITIONS` compiler flag predefines gets silently overwritten the moment
the header's own `#define` executes, since redefining an already-`#define`'d macro without an
intervening `#undef` is exactly what happens here, and the *header's* definition (textually after
the command-line one, in preprocessing order) is the one that wins. This is why the compiler-flag
approach is a real, commonly-cited pattern that works for *many* libraries but did nothing here —
it only works when the target header itself has an `#ifndef` guard around its own definition,
and this one doesn't. **Lesson: verify a "standard community workaround" against the actual
source of the specific version in use before trusting it — don't assume a fix that works for
fmt/libraries in general applies unchanged to every version.**

**The fix that actually works**: patch the fetched `fmt` source file directly, post-checkout.
`apps/mobile/plugins/withFmtConstevalFix.js` (a `withPodfile` config plugin, same
`@expo/config-plugins` API family as the existing `withAndroidIapStoreFlavor.js`) injects Ruby
into the **existing** `post_install do |installer|` block Expo's own Podfile template already
generates (`post_install` runs after `pod install`'s download phase, so the fmt source is already
on disk by then). It locates the checked-out fmt pod via CocoaPods' `installer.sandbox.pod_dir
('fmt')` API (version/path-agnostic — doesn't hardcode a checkout path), globs for `base.h`, and
replaces the entire `#if FMT_USE_CONSTEVAL ... #endif` block above with an `#undef` followed by a
forced `#define FMT_USE_CONSTEVAL 0` / empty `FMT_CONSTEVAL`/`FMT_CONSTEXPR20` — since this comes
*after* fmt's own block in the same file, and uses `#undef` before redefining, it reliably wins
regardless of what fmt's own detection computes. This forces the exact same non-consteval
codepath that already compiled successfully on every pre-Xcode-26 build.

**Critical implementation detail — inject into the existing `post_install` block, don't add a
second one.** Expo's generated Podfile already defines one `post_install do |installer| ... end`
block (calling `react_native_post_install(...)`, essential to the RN build). CocoaPods' Podfile
DSL treats a second, separately-declared `post_install do |installer| ... end` as **overwriting**
the first, not accumulating — so appending a whole new block instead of inserting into the
existing one would have silently dropped `react_native_post_install(...)` and broken the build in
a much harder-to-diagnose way. The plugin's regex specifically targets the literal `post_install
do |installer|` opening line and inserts new lines immediately after it, inside the same block,
before the pre-existing `react_native_post_install(...)` call.

Registered last in `app.config.ts`'s `plugins` array (order doesn't matter here specifically,
since the regex anchor is a stable string none of the other plugins touch). Verified end-to-end
in this sandbox, not just syntax-checked: fetched the real fmt 11.0.2 `base.h` from GitHub,
confirmed the exact `#if FMT_USE_CONSTEVAL ... #endif` block text matches what the plugin's regex
targets, ran the **actual generated Ruby** (`ruby`, not a JS/Python simulation) against a copy of
that real file with a stubbed `pod_dir`, and confirmed the patched output forces
`FMT_USE_CONSTEVAL` to `0` / `FMT_CONSTEVAL` to empty exactly as intended. Also confirmed: the
full Podfile-level Ruby (existing `post_install` content plus the injection) is syntax-valid
(`ruby -c`), `npx expo config --json` loads the plugin with no errors, and `tsc --noEmit`/`expo
export:embed` show no regressions. **The actual native Xcode compile still needs a real EAS build
to give the final word** — this sandbox has no Xcode/CocoaPods toolchain, so nothing here can
execute the real `pod install` + Xcode compile end-to-end. If this exact error recurs after
pulling this fix, re-verify the regex still matches the *current* fmt version's `base.h` — a
future RN bump could pull in a different fmt version with a differently-shaped (but likely
equivalent) `#if FMT_USE_CONSTEVAL` block that no longer matches this plugin's exact-text regex,
silently making the injected patch a no-op again (the plugin doesn't currently warn if its `sub`
finds no match).

### Android build failure — duplicate `:sentry-react-native`/`:sentry_react-native` Gradle projects (September 2026)

Moved to `docs/claude-md-archive.md` (historical visual-rebuild / build-fix pass — superseded or no longer actionable; see that file for full detail if ever needed).

### `tsc --noEmit` in `apps/mobile` — React 18/19 type collision (fixed August 2026; the original fix broke a real production build — corrected same month)

Moved to `docs/claude-md-archive.md` (historical visual-rebuild / build-fix pass — superseded or no longer actionable; see that file for full detail if ever needed).

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

### `paperWarm` cream background removed — now plain white (August 2026)

Mirrors `apps/connect`'s earlier "cream-removal pass" (`--paper` went from `#f3ece0` to
`#ffffff`, see the `apps/site` shop-rebuild section above) — the mobile app had the same
cream tone under a different name, `paperWarm` (`theme.ts` comment: "Primary background"),
kept as a **separate token from `paper`** (`"Card surface"`, already white) rather than the
single token web uses. `paperWarm` is used as a screen-level `backgroundColor` in **~110
places** across `apps/mobile/src`.

**Fixed by changing the token's value, not each call site** — same resolution shape as the
web pass: `lightColors.paperWarm` and `darkColors.paperWarm` in `theme.ts` now equal
`paper`'s value in each palette (`#FFFFFF` light, `#242018` dark) instead of their own cream/
warm-black tone. Every screen using `c.paperWarm` picked this up automatically with a
2-line diff — no risk of missing one of the ~110 call sites. Cards now differentiate from
the screen background via `shadows.card`/borders alone, not a background-color contrast —
already the dominant pattern (`shadows.card` was already used pervasively), so this didn't
introduce a new visual language, just removed a tint.

**Also fixed, since they bypassed the token entirely and wouldn't have picked up the
above**: `app.config.ts`'s native splash screen (`backgroundColor: "#f3ece0"` → `"#ffffff"`
— `assets/splash.png` itself turned out to be a **flat cream rectangle with no logo at
all**, so it was safe to just regenerate as flat white rather than needing to preserve any
artwork), and two **unreachable/dead screens** (`screens/member/MemberScreen.tsx`,
`screens/member/SettingsScreen.tsx` — neither is registered in `navigation/index.tsx`;
the real settings screen is `MemberSettingsScreen.tsx`) that had `"#f3ece0"` hardcoded
directly rather than through the theme — fixed for hygiene even though nothing renders them.

**Deliberately left alone** — confirmed these are foreground/decorative uses of the cream
tone, not backgrounds, so flattening the token wouldn't have touched them anyway and they
don't need a separate fix: `PostCard.tsx`/`QuoteShareCard.tsx`/`GameScoreCard.tsx`/
`EventDetailScreen.tsx` (light-colored text/border on a dark card), `DirectoryDetailScreen.tsx`/
`MemberProfileScreen.tsx` (gradient decoration endpoints), `ForgotPasswordScreen.tsx`/
`OnboardingScreen.tsx` (illustrative SVG fill), `Avatar.tsx` (initials text color). If a
future pass wants the cream tone fully gone from the app (not just as a background), revisit
this list — it was out of scope for "no more paper background."

### theme.ts — available keys
- `shadows`: only `card`, `modal`, `fab` — no `sm`, `lg`, `xl` variants
- `radius`: `sm`(2), `md`(4), `lg`(6), `xl`(12), `"2xl"`(20), `full`(9999) — use bracket notation for `"2xl"`
- `fontSize`: includes `eyebrow`(9) for uppercase labels
- `fonts`: `sans`, `sansBold`, `sansItalic`, `serif`, `serifBold`, `serifItalic`, `serifBoldItalic`, `mono`, `monoBold`, `monoItalic`. **`fontStyle: "italic"` synthesis is unreliable for custom/embedded TTF fonts on iOS** — applying it on top of a non-italic `fontFamily` (e.g. `Fraunces_400Regular`) can silently fall back to the system font's italic face instead of rendering the custom font at all. Always reference the real italic font file by name instead (`fonts.serifItalic` → `Fraunces_400Regular_Italic`). **Fixed app-wide June 2026** — every `fontFamily: fonts.serif/sans/mono(...)` + `fontStyle: "italic"` combo across the codebase (quote views, pull quotes, book-review favourite quotes, game screens, composer inputs, TOC titles, etc.) was swapped to the matching `*Italic` key. The italic weights (`Fraunces_700Bold_Italic`, `DMSans_400Regular_Italic`, `JetBrainsMono_400Regular_Italic`) are loaded in `App.tsx`'s `useFonts()` call alongside the existing weights — **if you add a new bold/regular weight to `theme.ts`'s `fonts` object, check whether an italic counterpart should be added and loaded at the same time**, since there's no synthesis fallback that looks right on iOS. Text with no explicit `fontFamily` (system default) is unaffected and can use plain `fontStyle: "italic"` safely — e.g. `react-native-render-html`'s `em`/`i`/`blockquote` tag styles in `ArticleScreen.tsx` intentionally have no custom `fontFamily`.

---

## Expo SDK 52 → 57 upgrade (September 2026) — authoritative over all SDK-52-era notes above

Google Play rejected the 1.0.1 production release with five errors. Two were console-only
(AD_ID declaration, no countries selected) and were fixed in Play Console. The other three —
**target API 34 vs required 36**, **no 16 KB page support**, **Play Billing 7.0.0 vs required
8.0.0** — were one problem: the toolchain was too old.

**There was no configuration-only fix**, and this is the part worth internalising: forcing
API 36 on SDK 52 would have made 16 KB support *mandatory* (it only applies to apps targeting
Android 15+) while SDK 52's pinned `ndkVersion 26.1.10909125` cannot produce 16 KB-aligned
libs — i.e. it would have shipped an app that crashes on 16 KB devices. The two are coupled.

Full reasoning and the verified evidence for each claim: `docs/expo-sdk-57-upgrade.md`.

### What changed

- `expo ~57.0.0`, `react 19.2.3`, `react-native 0.86.3`. The dependency set was taken from
  SDK 57's own `bundledNativeModules.json`, not hand-picked, so it matches what
  `expo install` would choose. **`@sentry/react-native` moved to `~7.11.0`** — Expo's tested
  pin, which is a step *back* from the 8.24.0 we had.
- **The New Architecture is now ON.** SDK 57's template sets `newArchEnabled=true`; SDK 52's
  set `false`. This invalidates the old note that `SentryExpoPackage` is "inert since New Arch
  is not enabled" — that handler catches exceptions swallowed by bridgeless error handling and
  is now genuinely load-bearing.
- **iOS 15 is no longer supported.** SDK 57 enforces `ios.deploymentTarget >= 16.4`; below it
  `expo config` refuses to load outright.
- `expo-av` does not exist in SDK 57. `AudioPreviewButton.tsx` moved to `expo-audio`, whose
  play/pause are synchronous void calls and whose `playing` is a plain property.

### Three workarounds this upgrade killed — do not reintroduce them

1. **`expo.autolinking.exclude` for `@sentry/react-native`** — removed, and
   `plugins/withSentryGradleTaskOrderingFix.js` deleted with it. That whole saga existed
   because `expo-modules-autolinking@2.0.8` ignores the `android.path`/`android.name` keys
   Sentry declares. Verified: autolinking `57.x` reads both, so the duplicate Gradle project
   and the missing `SentryExpoPackage` class both disappear on their own.
2. **`plugins/withAndroidIapStoreFlavor.js`** — deleted. It injected a
   `missingDimensionStrategy` hint because `react-native-iap` v12 shipped "amazon"/"play"
   product flavors. v14 ships no flavors, and its own Expo plugin only adds iOS StoreKit
   entitlements now.
3. **The `typeRoots`/`types` hack in `apps/mobile/tsconfig.json`** — removed, along with the
   `module`/`moduleResolution` overrides that fought SDK 57's base config (which sets
   `moduleResolution: "bundler"` + `customConditions`). The hack stopped TS resolving the
   monorepo root's React 19 types into a React 18 app; mobile is React 19 now, so the
   collision is gone. **It had also started breaking resolution outright** — it pointed at
   `apps/mobile/node_modules/@types`, which does not exist under workspace hoisting.

### The type-check baseline was never real

Under the old tsconfig, `tsc` bailed after 2 config errors without analysing any code. The
"35 pre-existing errors" baseline recorded elsewhere in this file was therefore never a
measurement. With the config repaired the true count is **37 pre-existing errors** — navigation
param mismatches (`product`/`productId`, `article`/`slug`, `event`/`eventId`), a `fontSize
'3xl'` that does not exist in the theme, an author `.role` that does not exist, and dead code
in `MemberScreen.tsx`. None are upgrade fallout; none were fixed.

Upgrade-caused fixes were: `StyleSheet.absoluteFillObject` → `absoluteFill` (13 sites — only
safe because RN 0.86 turned `absoluteFill` into a plain object with the old shape; on older RN
the same edit silently breaks every overlay), React 19's `RefObject<T | null>` variance, React
19 removing the zero-argument `useRef` overload, and `expo-notifications` replacing
`shouldShowAlert` with `shouldShowBanner`/`shouldShowList`.

### `react-native-render-html` is abandoned and needs React 19 help — fixed in our code

`6.3.4` is both our version and the newest published. It configures its render engine via
`TRenderEngineProvider.defaultProps`, which React 19 ignores on function components, and
`RenderHTML` spreads caller props straight into that provider without adding defaults. Left
alone, every article and pulse body loses base typography and all user-agent styling.

**`HtmlContent.tsx` re-supplies those defaults ahead of caller props.** Deliberately not
`patch-package`: the library is abandoned so the values cannot drift, and patching
`node_modules` is fragile under workspace hoisting and awkward on EAS. Its other three
`defaultProps` sites were each checked and are genuinely safe to lose — `renderChildren`
already has a `propsForChildren = empty` default parameter, and `propsFromParent` is read with
optional chaining plus a `typeof !== 'number'` guard.

### `plugins/withFmtConstevalFix.js` — verified, probably now unnecessary

RN 0.86 pins fmt **12.1.0**, not the 11.0.2 it was written against. Checked against real
12.1.0 source: the block it rewrites is unchanged so it still matches (it is *not* silently
no-opping, and it warns if it ever stops matching). 12.1.0 also added the
`#ifdef FMT_USE_CONSTEVAL` guard whose absence was the entire reason the simpler
compiler-flag approach failed originally. Kept for now; **delete it and its `app.config.ts`
entry once one real iOS build goes green on SDK 57.**

### Hazard: never run `npm install` from inside `apps/mobile`

It rewrites the **root** lockfile and prunes the other workspaces' entries out of it — a
6,193-line deletion in this case, which would likely break the Vercel builds for both web
apps. If you need `node_modules` locally to type-check, back up the root lockfile first and
restore it afterwards. The mobile lockfile must still be regenerated out-of-tree per the
process documented above; that is what EAS's `npm ci` consumes.

### Do NOT let `@sentry/react-native` follow Expo SDK 57's pin — it is stale and breaks the build

SDK 57's `bundledNativeModules.json` pins `@sentry/react-native: ~7.11.0` (and the long-dead
`sentry-expo: ~7.0.0`). That pin is **wrong for this package** — 7.11.0 is *older* than the
8.24.0 this repo already ran on SDK 52. Taking it broke the iOS JS bundle two separate ways,
both caught by `expo export:embed` before any build credit was spent:

1. **`Unable to resolve module promise/setimmediate/done`** — 7.11.0 `require()`s the `promise`
   package at runtime but declares it nowhere (not a dep, not a peer). 8.28.0 declares it as an
   optional peer.
2. **`Cannot read properties of undefined (reading 'match')` in `determineDebugIdFromBundleSource`**
   — Metro 0.84 resolves the serializer to `{ artifacts, assets }`, not `{ code, map }`. 7.11.0's
   `extractSerializerResult` only understands `{ code, map }` and crashes. 8.28.0 returns `null`
   for an unrecognised shape and passes the result through untouched, with a comment citing
   upstream [getsentry/sentry-react-native#6650](https://github.com/getsentry/sentry-react-native/issues/6650)
   — Expo's own serializer adds the debug IDs for that output.

7.11.0 also ships **no `expo-module.config.json` at all**, so the Expo handler would not autolink
— i.e. it silently undoes the reasoning behind removing the `expo.autolinking.exclude` workaround.
8.28.0 ships the modern `android.path`/`android.name` schema that SDK 57's autolinking reads.

**Pinned to `^8.28.0` deliberately. Never run `expo install --fix` / `expo-doctor --fix` and let it
"correct" this back to `~7.11.0`** — that reintroduces all three problems at once. If expo-doctor
flags the version as mismatched, that warning is expected and should be ignored for this package.

**`promise` hoisting — FIXED September 2026, and the old note here was wrong.** This entry used
to claim that "the standalone `apps/mobile/package-lock.json` that EAS's `npm ci` consumes hoists
it to top level, which is the layout that actually matters," and to recommend a local symlink
(`ln -sfn .../react-native/node_modules/promise node_modules/promise`) to make local checks
faithful. **Both halves of that were wrong, and together they hid a real build break for weeks.**

A real EAS iOS production build failed with exactly the `Unable to resolve module
promise/setimmediate/done from .../@sentry/react-native/...` error this section describes. The
log's first line — `npm warn config ignoring workspace config at
/Users/expo/workingdir/build/apps/mobile/.npmrc` — plus its resolution paths (`../../node_modules`,
i.e. the monorepo root) prove **EAS installs from the repo root as a workspace, not from the
standalone mobile lockfile**. And the root lockfile placed `promise` at
`node_modules/react-native/node_modules/promise`, where `@sentry/react-native` (a sibling at
`node_modules/@sentry/react-native/`) genuinely cannot reach it. The recommended symlink made
every local `expo export:embed` pass regardless, so the one check that would have caught this was
neutralised by the very note telling you to run it.

**The fix is a one-line dependency declaration**: `"promise": "^8.3.0"` in `apps/mobile/package.json`
(matching React Native's own range exactly, so there is never a second copy or a version skew).
Declaring it as a direct dependency of the workspace forces npm to hoist a single copy to the root
`node_modules`, where both `react-native` and `@sentry/react-native` resolve it by ordinary upward
lookup. Verified empirically, not by reasoning: with the symlink removed, `npx expo export:embed
--eager --platform ios --dev false` reproduced the EAS error byte-for-byte; with `promise` moved to
top level exactly as the regenerated lockfile specifies, the same command bundled 2606 modules
cleanly.

**Never reinstate the symlink.** If a local check needs a faithful tree, delete
`node_modules/promise` if it is a symlink and let a real install place it. **And do not trust the
standalone `apps/mobile/package-lock.json` as "the one EAS uses"** — it is still tracked and still
regenerated out-of-tree per the process above, but the root `package-lock.json` is what a
root-workspace EAS build actually resolves against. When a dependency-resolution bug reaches an EAS
build, check the **root** lockfile's layout for the package first (`python3 -c "import json; pk =
json.load(open('package-lock.json'))['packages']; print([k for k in pk if
k.endswith('node_modules/<pkg>')])"`), not the mobile one.

**Regenerating the root lockfile is safe from the repo root** (`npm install --package-lock-only`)
— that is not the forbidden operation. The forbidden one is running `npm install` *inside*
`apps/mobile`, which prunes the other workspaces out of the root lockfile. After regenerating,
confirm the diff is scoped: entry count unchanged, all 8 `apps/*`/`packages/*` workspace entries
still present. This fix's own diff was exactly one added declaration plus `promise` moving from
nested to top level.
