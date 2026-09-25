# Reading Tracker (StoryGraph-style shelves, mood/pace, and stats) — Full Planning Spec

Status: **Not started — planning only.** This document is the single source
of truth for building this feature — do not begin Phase 1 until it's read in
full. Modeled directly on `docs/hubs-plan.md` and
`docs/literati-connect-plan.md` — read either for precedent on tone/rigor if
anything here is ambiguous.

**Decisions already made (do not re-litigate without the user):**
- Feature name in user-facing copy: **Reading Tracker** (the underlying
  screens/shelves are "Want to Read" / "Currently Reading" / "Read" — plain,
  StoryGraph-standard language, not a coined Moveee brand name). Internal
  identifiers use `reading_shelf`/`book_shelf`-style names, not "storygraph"
  or any competitor name anywhere in code, copy, or comments.
- This is **not** a new social network bolted onto Book Review — it is a
  personal, private-by-default layer (shelves, mood/pace, stats, goal) that
  sits on top of the **existing** Book Review composer template and the
  existing `culture_directory` `book` entries. A Book Review post stays a
  public act (as it is today); adding a book to a shelf is a private,
  low-friction act that does not require writing a review at all — the two
  are related but independent, exactly like StoryGraph itself separates
  "I finished this" from "I wrote about it."
- Mood/pace tags live on the **directory entry** (`culture_directory`, type
  `book`), not on the individual shelf row or the review post — they are a
  property of the book itself, community-sourced and aggregated (mode of all
  taggers), the same way `_average_rating`/`_community_review_count` are
  already aggregated onto a directory entry from many posts. A shelf row
  never carries its own copy of mood/pace.
- Buddy Reads are **not** a new concept — they are Hubs (see
  `docs/hubs-plan.md`) used as-is: a member starts a Hub scoped to one book
  and invites others into it. No new CPT, no new membership table. The only
  net-new thing Buddy Reads needs is a "Currently Reading" quick-share prompt
  ("Start a Buddy Read Hub for this book?") — a UI affordance, not a backend
  feature.
- Content warnings are **out of scope for v1** — flagged in §7, not built.
  Community-sourced content warnings need their own moderation/dispute model
  (who resolves a disagreement about whether a book "contains" something)
  that doesn't exist anywhere in this codebase yet and shouldn't be
  improvised inside this feature's first pass.

---

## 0. Naming and scope discipline (read first)

- "Shelf" is the generic term for the three states (`want_to_read` /
  `currently_reading` / `read`). Never call this "library" (that word is
  unused elsewhere in this codebase but "library" implies ownership/lending,
  which this isn't) or "collection" (already a real, different feature —
  `/member/collection`, bookmarked posts across every content type, see
  `CollectionTabs.tsx` in CLAUDE.md's Account Dashboard Phase 6 entry — do
  not conflate the two; a shelved book is not automatically added to
  Collection and vice versa).
- Explicitly **out of scope** for the first build (do not build these unless
  this doc is revised first):
  - Content warnings (see decision above).
  - Page-count progress tracking mid-book (StoryGraph shows "40% through" on
    the Currently Reading shelf). v1 ships status-only (the three shelves);
    percent-complete is a real, separate follow-up once shelves themselves
    are proven out — don't build a progress slider before the shelf exists.
  - Format tracking (physical/audio/ebook) as its own facet. Reuse is
    possible later via the same `_about_fields` mechanism Book Review
    already uses for Author, but isn't needed for v1's stats to be useful.
  - Goodreads/StoryGraph import. No OAuth/CSV-import infrastructure exists
    anywhere in this codebase for a third-party reading service, and this is
    a large, separate scoping exercise (rate limits, dedup against existing
    `culture_directory` book entries, mapping their shelf states onto ours).
  - A public "reading profile" page distinct from the existing public
    profile (`/connect/[username]`) — stats surface on the *viewer's own*
    dashboard only in v1, not as a shareable public page. Revisit once it's
    clear people want to show this off, not just track it privately.
  - Recommendations ranked by mood/pace similarity (§6.3's stretch item) —
    v1 only *collects* mood/pace data; using it to rank anything is Phase 4,
    deliberately last, since it needs a real corpus of tagged books before
    it can produce a recommendation better than genre-matching already does.

---

## 1. Data model

### 1.1 New DB table: `wp_culture_reading_shelf`

Created in `Culture_Activator::create_tables()` (mandatory — a table added
anywhere else silently never gets created in production, per the documented
`CULTURE_VERSION`/dbDelta gotcha in CLAUDE.md). Bump `CULTURE_VERSION` so
`culture_community_maybe_upgrade()` picks it up on next deploy.

```
id, user_id, directory_id, status ('want_to_read'|'currently_reading'|'read'),
started_at (nullable datetime), finished_at (nullable datetime),
created_at, updated_at
UNIQUE KEY (user_id, directory_id)
KEY (user_id, status)
KEY (directory_id, status)
```

One row per (user, book) — moving a book between shelves is an `UPDATE`,
never a new row (same upsert-not-duplicate convention as
`wp_culture_hub_members`/`wp_culture_follows`/`wp_culture_community_rsvp`).
`directory_id` is the `culture_directory` post ID (type `book`) — the exact
same entry Book Review already creates/links via `DirectorySearch`'s
`externalSource="google_books"` flow. Removing a book from all shelves is a
hard delete of its row, not a fourth "removed" status — there's no history
value in keeping it (unlike, say, `wp_culture_hub_members`'s `left` status,
which exists because re-joining needs to distinguish "never joined" from
"left and might rejoin").

`started_at` is set (if not already) the first time a book's status becomes
`currently_reading`; `finished_at` is set the first time it becomes `read`.
Both are **sticky** — moving `read` → `currently_reading` (a re-read) does
**not** clear `finished_at`; it's left as the date of the *first* finish,
and a genuine re-read is out of scope for v1 (see §7) rather than
half-supported by silently overwriting history.

### 1.2 New DB table: `wp_culture_reading_goal`

```
id, user_id, year (int), target_books (int), created_at, updated_at
UNIQUE KEY (user_id, year)
```

One row per (user, year) — a goal is set once per calendar year (StoryGraph's
own model), editable at any time during that year. Progress is **never**
stored — it's always computed live as `COUNT(*) FROM wp_culture_reading_shelf
WHERE user_id = ? AND status = 'read' AND YEAR(finished_at) = ?`, the same
"don't cache what's cheap to compute and easy to get stale" posture already
used for `wp_culture_notifications`'s unread count (small per-user row
counts, not a denormalized counter like Hub member/post counts, which are
denormalized specifically because *those* counts are read on every browse-
list render across many users' Hubs at once — a personal reading-goal count
is read once, by one user, on one dashboard).

### 1.3 New meta on `culture_directory` (type `book` only): mood/pace tags

- `_book_moods` — JSON array of strings, from a fixed vocabulary (see
  `MOOD_TAGS` below). Community-sourced: any signed-in member with the book
  on a shelf (any status) may submit their own mood tags for it; the entry's
  displayed moods are the **top N by submission count** (mode), mirroring
  the existing `_average_rating` aggregation pattern (many individual
  signals → one aggregated display value), not a single canonical
  admin-set list.
- `_book_pace` — single string enum, `slow` | `medium` | `fast`. Same
  community-sourced-then-aggregated model as moods (majority vote, ties
  broken toward `medium`).
- New table: `wp_culture_book_mood_votes` — `id, directory_id, user_id,
  moods (JSON array), pace (string), created_at` — `UNIQUE KEY
  (directory_id, user_id)`, one vote per person per book, upsert on
  re-vote. `_book_moods`/`_book_pace` on the directory post are recomputed
  from this table on every vote (small per-book vote count, cheap to
  recompute — same reasoning as the goal-progress query above, not a
  denormalized-counter situation).
- `MOOD_TAGS` (fixed vocabulary, defined once in
  `Culture_Reading_Tracker::MOOD_TAGS` and mirrored in
  `packages/shared/lib/reading-tracker.ts` / a mobile TS const — same
  "no shared source of truth across the PHP/TS boundary" caveat this
  codebase already documents for `TEMPLATE_REP_GATE`/notification icon
  maps): `dark`, `emotional`, `funny`, `reflective`, `adventurous`,
  `mysterious`, `hopeful`, `tense`, `sad`, `informative`, `lighthearted`,
  `inspiring` — 12 tags, StoryGraph's own published set, chosen so the
  vocabulary is recognizable rather than invented from scratch.

### 1.4 Reuse, not new: everything else

- Book identity, cover art, author, genres — **already exists** via
  `culture_directory` (type `book`), `_external_cover_url`, the `_about_fields`
  Author mechanism, and Book Review's genre chips. Shelving a book never
  creates a second, competing book record — `DirectorySearch`'s existing
  dedup-by-`external_id` (`find_by_external_id()`) is reused verbatim so a
  book added via "shelve it" and a book added via "write a review" always
  resolve to the same directory entry.
- Star rating / written review — **already exists** via Book Review. The
  Reading Tracker never duplicates a rating field; if a shelved book also
  has a Book Review post by the same user, the shelf UI surfaces a link to
  it ("You reviewed this ★★★★☆ →") rather than asking for a second rating.

---

## 2. Backend — REST API surface

New PHP class: `culture-community/includes/core/class-culture-reading-tracker.php`
(`Culture_Reading_Tracker`) — single source of truth for both REST surfaces,
same mirrored-endpoint convention as Follow/Community RSVP/Hubs. Key static
methods: `set_shelf_status()`, `remove_from_shelf()`, `get_user_shelf()`
(one status, paginated), `get_shelf_counts()` (three counts in one query,
for the tab badges), `vote_mood_pace()`, `get_reading_stats()` (the
aggregation query behind the whole stats dashboard, §4), `get_goal()`,
`set_goal()`.

| Mobile (`/mobile/reading/...`, JWT) | Web (`/reading/...`, API key + explicit `user_id`) | Purpose |
|---|---|---|
| `POST shelf` | `POST shelf` | Set/move a book's shelf status (`directory_id`, `status`) |
| `DELETE shelf` | `DELETE shelf` | Remove a book from all shelves |
| `GET shelf` | `GET shelf` | List a shelf (`status` param, paginated) |
| `GET shelf/counts` | `GET shelf/counts` | `{want_to_read, currently_reading, read}` — tab badges |
| `POST mood-vote` | `POST mood-vote` | Submit mood/pace vote for a `directory_id` |
| `GET stats` | `GET stats` | The full stats payload (§4), optional `year` param |
| `GET goal` | `GET goal` | Current year's goal + live progress |
| `POST goal` | `POST goal` | Set/update `target_books` for a year |

All six mirror the exact JWT-vs-API-key auth split already used everywhere
else in this codebase (`Culture_Community_RSVP`, `Culture_Follows`,
`Culture_Hubs`) — mobile reads `get_current_user_id()`, web takes an
explicit `user_id` param resolved server-side by the Next.js proxy route
from the session, never trusted from the client body directly.

**`GET shelf` response shape** mirrors `DiscoverCard`'s existing `DiscoverEntry`
shape as closely as possible (title, cover, author, average rating) plus the
shelf-specific fields (`status`, `startedAt`, `finishedAt`) — this lets the
web/mobile shelf grid reuse the exact same card component Discover already
has for books, rather than inventing a fourth book-card component across
this codebase (Book Review's feed card, Directory's book infobox, Discover's
`DiscoverCard`, and now this would be a fourth if not deliberately reused).

**`GET stats` response shape**:
```json
{
  "year": 2026,
  "books_read": 14,
  "pace_breakdown": { "slow": 3, "medium": 8, "fast": 3 },
  "mood_breakdown": { "dark": 5, "hopeful": 4, "funny": 2, "...": 0 },
  "rating_distribution": { "1": 0, "2": 1, "3": 4, "4": 6, "5": 3 },
  "top_genres": [{ "genre": "Literary Fiction", "count": 6 }, "..."],
  "books_per_month": [{ "month": "2026-01", "count": 2 }, "..."]
}
```
Computed live via raw SQL joins across `wp_culture_reading_shelf` (status =
`read`, filtered by `YEAR(finished_at)`) and each book's directory-entry
meta — same "raw SQL for a pure per-user read with no WP hook/filter logic"
convention documented in CLAUDE.md's "Raw SQL REST endpoints" section (this
is exactly that category: a personal stats read, not content, not a
mutation). Do **not** build this as a `WP_Query` loop over posts — that's
the wrong tool for an aggregation query, per that same section's own
guidance ("`meta_query` OR-branches... can hang for 20s+").

---

## 3. Frontend — shelves (mobile + web, mirrored)

### 3.1 Adding a book to a shelf

Two entry points, both reusing `DirectorySearch` exactly as Book Review
already does (same `externalSource="google_books"` prop, same dedup
mechanism) — no new search UI is built:
1. **From Discover / a book's directory page** — a new "+ Add to Shelf"
   button (three-way segmented control: Want to Read / Currently Reading /
   Read) next to the existing Follow/review-count chrome on a book-type
   directory entry.
2. **From a dedicated "Add a Book" action** — a lightweight modal/sheet
   (`DirectorySearch` alone, `externalSource="google_books"`, no other
   composer fields) reachable from the new Reading Tracker screen's own
   header, for adding a book that isn't already a directory entry.

Neither entry point requires writing a Book Review — that's the whole point
of separating shelving from reviewing (see the decisions section above).

### 3.2 Reading Tracker screen

New route: mobile `ReadingTrackerScreen.tsx` (registered in `ConnectStack`
and linked from `MemberDashboardScreen.tsx`'s quick links, same placement
pattern as `MyEventsScreen`), web `/member/reading` (added to `AccountNav.tsx`
between Portfolio and Collection — see CLAUDE.md's Account Dashboard Phase 6
entry for why that nav list is the one place every account destination must
be registered, or a page has "no navigational path to it at all," the exact
gap that entry documents happening to Portfolio/Collection once already).

Three tabs (Want to Read / Currently Reading / Read), same underline-tab
convention as `SettingsTabs.tsx`/`CollectionTabs.tsx` — not a third new tab
component. Each tab is a grid of book cards (reusing `DiscoverCard`'s shape,
per §2) with a status-change action per card (a small menu: move to another
shelf, remove). Read tab additionally shows `finishedAt` per book, sorted
newest-finished-first.

### 3.3 Reading Goal

A slim progress card at the top of the Reading Tracker screen (only the
"Read" tab, or persistent across all three — pick persistent, since the
goal is year-scoped not shelf-scoped): "{books_read} of {target} books this
year" + a bar. Tapping it opens a small "Set your {year} goal" input if no
goal is set yet, or lets you edit the target if one is. No badge/reward tied
to hitting 100% in v1 — flagged as a natural Phase 2/3 gamification hook
(see §6) but not required for the goal tracker itself to ship useful.

### 3.4 Mood/pace voting

Surfaced on the book's directory-entry page (both `apps/connect/app/
directory/[slug]/page.tsx` and its mobile equivalent) as a compact
"How would you describe this book?" prompt — 12 mood chips (multi-select,
same wrap-not-scroll convention CLAUDE.md documents for the composer's
genre/section chip rows) + a 3-way pace selector — shown once per user per
book (hide the prompt if `wp_culture_book_mood_votes` already has this
user's row for this `directory_id`; still let them tap through to edit
their own vote). The aggregated `_book_moods`/`_book_pace` display (chips,
read-only) renders in the existing infobox area alongside genre/rating,
matching the visual weight of an existing metadata field, not a new
prominent section — moods are a discovery aid, not the headline.

---

## 4. Frontend — stats dashboard

New route, `/member/reading/stats` (web) and a "Your Year in Books" section
at the top of the mobile Reading Tracker screen (not a separate screen on
mobile — the stats payload is small enough to sit above the shelf tabs
without needing its own navigation destination there, unlike web where
`AnalyticsClient.tsx`'s own page already sets the "stats get their own
route" precedent).

Reuses the exact SVG bar/line chart components `AnalyticsClient.tsx`
(`BarChart`/`LineChart`, plain SVG, no charting library, per CLAUDE.md's
"Phase 8c — Member analytics" section) already defines — do not pull in a
new charting dependency for this. Sections, in order: books-read count (a
single large stat, same visual weight as `AnalyticsClient`'s summary stats
row), the books-per-month bar chart, the pace breakdown (3-segment bar,
not a full chart — slow/medium/fast is too small a set for a bar chart to
earn its keep), the mood breakdown (a horizontal bar list, one row per mood
with a nonzero count, sorted descending), the rating distribution (5-bar
chart, same shape as `ProductReviews.tsx`'s existing star-distribution bar
chart on the Lifestyle shop — reuse that exact visual pattern rather than
inventing a second one), and a "Top Genres" list (plain ranked list, no
chart needed for 3-5 items).

---

## 5. Buddy Reads (Hubs reuse, no new backend)

A "Start a Buddy Read" affordance is added to the Currently Reading tab's
per-book action menu — it pre-fills `CreateHubClient.tsx`'s (web) /
`HubCreateScreen.tsx`'s (mobile) Hub-creation form with the book's title as
the Hub name (e.g. "Buddy Read: Beloved") and a description template
mentioning the book, then hands off entirely to the existing Hub creation
flow — this feature does **not** touch `class-culture-hubs.php` at all,
it's purely a prefill/deep-link into a flow that already exists. No
`_hub_id`-to-`directory_id` link is stored anywhere; a Buddy Read Hub is,
structurally, just a normal Hub whose name happens to reference a book. If
a future pass wants a *real* Hub↔book link (e.g. to show "3 active Buddy
Read Hubs for this book" on the book's directory page), that's a genuine
schema addition (`_hub_book_directory_id` meta on `culture_hub`) — not
assumed or half-built here.

---

## 6. Gamification integration (light touch, Phase 3+)

- New action: `book_finished` — fires when a shelf row's status becomes
  `read` for the first time (guarded so moving `read` → `currently_reading`
  → `read` again on the same book doesn't double-award; check whether
  `finished_at` was already set before this transition). Award via
  `Culture_Gamification::award_points()`, same bridge every other action
  already uses — a credits/reputation value TBD by whoever sets the admin
  config, not hardcoded here.
- New badge: a books-read-this-year milestone (e.g. 12/25/52 books —
  StoryGraph-style round numbers), same `REPUTATION_TIERS`-adjacent badge-
  trigger pattern already used for `gem_hunter`/`culture_guide`. Naming and
  exact thresholds: pick at implementation time, not fixed in this doc.
- **Deliberately not built in v1**: any reward tied to mood/pace *voting*
  itself (as opposed to finishing books) — voting is meant to feel like a
  quick, low-stakes contribution, and gamifying it risks incentivizing fast,
  careless tags over honest ones, exactly the failure mode this doc's
  "content warnings need a real moderation model" exclusion in §0 is also
  guarding against for the same underlying reason (a rewarded, low-effort
  community-tagging system degrades without curation).

---

## 7. Ground rules

- **Privacy default**: a user's shelves, goal, and stats are visible only to
  that user in v1 (§0's "no public reading profile" exclusion) — every new
  endpoint in §2 must check `user_id === get_current_user_id()` (mobile) or
  the session-resolved `user_id` (web), never accept an arbitrary target
  user id the way public-profile endpoints do. This is a meaningfully
  different trust model from `handle_get_public_profile()` and must not
  reuse that handler's shape by copy-paste without re-checking this.
- **Never fabricate a book record.** Every shelved book must resolve to a
  real `culture_directory` entry via the existing Google Books search/dedup
  path — no client-side "just type a title, we'll sort it out later"
  shortcut that could create an orphaned or duplicate directory entry.
- **Re-reads are explicitly out of scope**, not silently mishandled — see
  §1.1's `finished_at` stickiness. If re-read tracking is ever requested,
  it needs its own schema decision (a `finished_at` history table, not a
  single column) — don't bolt it on as a special case of the existing
  status transition.
- **Mood/pace vocabulary is fixed at 12 tags for v1** — do not let the admin
  or a future pass silently grow this list ad hoc; StoryGraph's own set is
  deliberately small so aggregation stays meaningful (a 40-tag vocabulary
  produces mostly-empty aggregates per book). If the vocabulary needs to
  change, that's a deliberate edit to `MOOD_TAGS` in one place (§1.3),
  mirrored in both frontend consts, not an admin-configurable free list.

---

## 8. Implementation order (phases — build strictly in this order)

1. **Backend + shelves only** (§1.1, §1.2 skipped for now, §2's `shelf`/
   `shelf/counts` endpoints only, §3.1–§3.2). Ships a usable "Want to Read /
   Currently Reading / Read" tracker with no goal, no mood/pace, no stats,
   no Buddy Reads — the smallest slice that's genuinely useful on its own,
   mirroring how Hubs Phase 1 shipped core CPT/membership before Phase 6's
   Section bridge or Phase 5's rewards.
2. **Reading goal** (§1.2, §3.3, the `goal` endpoints). Small, independent,
   safe to ship right after Phase 1 proves the shelf model out.
3. **Mood/pace** (§1.3, §3.4, the `mood-vote` endpoint). Independent of
   goal — can be built in parallel with Phase 2 if two people were working
   on this, but ship as its own reviewable unit either way.
4. **Stats dashboard** (§4, the `stats` endpoint) — deliberately after
   shelves/goal/mood exist, since the stats payload reads from all three.
5. **Buddy Reads prefill** (§5) — a small UI-only addition once Currently
   Reading (Phase 1) exists to attach the action menu to.
6. **Gamification** (§6) — last, once `book_finished` is a real, reliable
   transition to hook (Phase 1) and there's a real badge-threshold decision
   to make with actual usage data informing it, not a guess made before
   anyone has used the feature.

---

## 9. Open items deliberately deferred (not blockers, just not v1)

- Page-count/percent-complete progress on Currently Reading.
- Format tracking (physical/audio/ebook).
- Goodreads/StoryGraph CSV or OAuth import.
- A public, shareable reading-profile page.
- Content warnings.
- Mood/pace-driven recommendation ranking (only genre/category-based
  ranking exists today, per `packages/shared/lib/feed-recommendations.ts`
  and its mobile port — extending that to weight mood/pace similarity is a
  real, separate scoping exercise once enough books carry real vote data).
- Re-read tracking / reading history beyond first-finish date.
