# Literati Connect & House Fellowship — Full Planning & Implementation Spec

Status: **Phases 1–4 complete end-to-end (backend + mobile + web). Phase 5 next.**
This document is the single source of truth for building this feature. Do not
begin implementation on any later phase until this document is read in full —
it exists specifically to prevent scope creep and to avoid omitting load-bearing
pieces (gamification wiring, notification wiring, mobile/web parity) that are
easy to forget mid-build in this codebase.

**Phase 1 (Data model & core membership) — done.** `culture_cluster` CPT +
`_cluster_*` meta (`class-culture-post-types.php`). `wp_culture_cluster_members`
table, `Culture_Clusters` core class (`create_cluster`, `join`, `leave`,
`get_cluster`, `get_member_status`, `list_for_user`, `discover`, `maybe_activate`).
Gamification (`cluster_founded`), notifications (`cluster_activated`,
`cluster_forming_expired`), cron (`sweep_forming_clusters`), admin settings
section, REST endpoints (mobile + web, mirrored), and both frontends (Discover
integration, cluster home screen, founding flow UI) all shipped.

**Phase 2 (Host mechanisms) — done.** Election flow (§2.4.3) incl. cron tally,
both frontends (`ClusterElection.tsx` on web, equivalent section in mobile's
`ClusterScreen.tsx`).

**Phase 3 (Check-in & attendance) — done.** `wp_culture_cluster_checkins` table
+ `(cluster_id, user_id, meeting_date)` unique constraint. `Culture_Clusters`
extended with `generate_host_qr`/`verify_checkin_qr` (HMAC-signed, 900s TTL),
`check_in` (idempotent — returns `alreadyCheckedIn` on duplicate scan rather
than erroring), `checkin_manual`, `get_attendance_history`. Five mirrored REST
endpoints (mobile `/mobile/cluster/...` JWT, web `/cluster/...` API-key) for
members/host-qr/checkin/checkin-manual/attendance. Mobile: `ClusterScreen.tsx`
host QR display (`react-native-qrcode-svg`, 13-min refresh) via `expo-camera`
member scan flow, host manual check-in member-list modal, attendance/streak
row. Web: `ClusterCheckin.tsx` (`qrcode.react` for host QR display) — no
in-browser camera scanning in v1; web members are directed to scan via the
mobile app or rely on the host's manual check-in fallback — plus the same
manual check-in modal and attendance/streak row, wired into
`app/cluster/[id]/page.tsx` alongside `ClusterElection`.

**Phase 4 (Rewards & notifications) — done.** Reward wiring: `cluster_checked_in`
(`Culture_Clusters::check_in()` calls `award_points()` on a genuine new
check-in only, not the `alreadyCheckedIn` early-return path) and
`cluster_host_served` (new monthly cron, see below) added to both
`Culture_Gamification::POINTS`/`::CREDIT_BONUSES`. Two new badges:
`cluster_regular` (trigger `cluster_checkin_streak`, threshold 8, reads
`Culture_Clusters::get_checkin_streak()`) and `city_convener` (trigger
`cluster_host_consecutive_months`, threshold 3, reads the new
`Culture_Clusters::get_host_consecutive_months()`, which walks distinct
year-month buckets in the credit ledger). Two new cron jobs in
`class-culture-cron.php`: `culture_award_cluster_host_service` (monthly —
required adding a custom `'monthly'` interval to `add_schedules()`, since WP
core has no built-in monthly schedule; awards each active cluster's current
host once per calendar month, idempotency checked via a ledger query scoped
to `source = 'cluster_host_served' AND source_id = $cluster_id AND
created_at >= ` start of month, not `ledger_has_entry()` which has no time
window) and `culture_send_cluster_checkin_reminders` (daily — matches
`_cluster_meeting_day` against today's day name, notifies every active
member of a matching cluster). One new notification type,
`cluster_checkin_reminder`, registered in `Culture_Notifications::TYPES` with
icon-map entries added across all three frontend files and a deep-link case
in mobile's `openNotification()` (routes to `ClusterScreen`, same as the
other four cluster types — all four of those were already fully wired in
Phases 1–3, confirmed during this pass).

**Note on `literati_connect_attended` (deferred to Phase 5):** this doc's §6.1
table lists it as a Phase 4 action key, but §7's implementation order
explicitly assigns "the attendance-sweep cron and its reward" for Literati
Connect to Phase 5, alongside the `_culture_event_is_literati` editorial-CPT
meta flag from §1 that the sweep depends on (also Phase 5 scope, not yet
built). Since the action key's only real trigger doesn't exist yet, it was
deliberately left out of `POINTS`/`CREDIT_BONUSES` in this pass rather than
added as dead config — add it together with the `culture_sweep_literati_attendance`
cron job and the §1 meta flag when Phase 5 is built, not before.

**Phase 5 (Literati Connect integration + feed surfacing) — not started, up next.**

Two related but distinct offerings, both physical/IRL, both open to **all**
members (Citizen and Pro — no tier gating anywhere in this feature):

| Offering | Cadence | Scope | Backed by |
|---|---|---|---|
| **Literati Connect** | Monthly | City-wide | Existing editorial `culture_event` CPT (reused, not duplicated) |
| **House Fellowship** | Weekly | Street/neighbourhood cluster | New `culture_cluster` CPT + new tables (this doc's main subject) |

---

## 0. Naming and scope discipline (read first)

- "Literati Connect" is the **brand name for the whole physical-meetup
  initiative** (per existing CLAUDE.md naming table) *and* specifically the
  monthly city-wide event format. Do not invent a second name for the
  initiative as a whole — when in doubt, "Literati Connect" = the umbrella,
  and "House Fellowship" = the weekly cluster format under that umbrella.
- "Connect" as a bare noun belongs to Literati Connect, not to the Connect
  app. Never reintroduce "Connect" as a stand-alone UI label.
- This doc covers House Fellowship's full build (new system) and Literati
  Connect's *integration* work only (it reuses the existing editorial event
  system almost as-is — see §1).
- Explicitly **out of scope** for the first build (do not build these unless
  this doc is revised first):
  - In-app messaging/chat between cluster members.
  - Paid ticketing for Literati Connect events (it's free, RSVP-based, same
    as the existing editorial RSVP system already supports).
  - Cross-city cluster directory/search beyond what's specified in §4.
  - Any moderation tooling beyond the existing report/blocklist system
    already in place for community content.
  - Push notifications beyond the existing notification-bell pipeline (no
    SMS/WhatsApp reminders in v1).

---

## 1. Literati Connect (monthly, city-wide) — integration only

No new CPT. These are `culture_event` posts (the existing editorial event
system, `Culture_Event_RSVP`, `wp_culture_event_rsvp` table) with one new
piece of metadata:

- New post meta on `culture_event`: `_culture_event_is_literati` (bool).
  Registered in `class-culture-post-types.php` alongside the other
  `culture_event` meta. When true, the event is tagged as a Literati Connect
  event for filtering/badging purposes only — RSVP, capacity, and all
  existing editorial-event machinery is untouched.
- Editorial team creates these events through the existing WP Admin flow
  (no new admin screen needed) and ticks a new "This is a Literati Connect
  event" checkbox in the existing event meta box.
- Frontend: a `🪶 Literati Connect` badge is added wherever `culture_event`
  cards/pages already render badges (mirrors the existing `isFeatured`
  badge pattern — same components, one more conditional badge class), on
  both web (`HappeningCard` in `FeedCard.tsx`, `HappeningDetailModal.tsx`)
  and mobile (`EventsScreen.tsx`, `EventDetailScreen.tsx`).
- Discoverability: a "Literati Connect near you" rail is added to the
  existing Events surface (see §4.3), filtered by
  `_culture_event_is_literati = 1` and the user's city/region (existing
  region-matching utilities — see §3.4).
- Reward: attending (RSVP'd + event date has passed, no explicit check-in
  required for this cadence — see §6.1 for why House Fellowship needs
  check-in but Literati Connect doesn't) awards credits/reputation via the
  `award_points()` bridge under a new action key `literati_connect_attended`
  (see §6 for the full points table). This requires one new cron-driven
  sweep (see §6.3) since RSVP alone isn't proof of attendance — see §6.1 for
  the distinction.

That's the entirety of Literati Connect's build. Everything else in this
document is House Fellowship.

---

## 2. House Fellowship — data model

### 2.1 New CPT: `culture_cluster`

Registered in `class-culture-post-types.php` alongside the other CPTs.
`public => false` (not a content type rendered as a page — it's a structured
entity surfaced only through dedicated screens/endpoints, same rationale as
`culture_directory`).

Fields (all `show_in_rest => true`, registered via `register_post_meta`):

| Meta key | Type | Notes |
|---|---|---|
| `_cluster_name` | string | Defaults to street/neighbourhood name at creation, editable by host |
| `_cluster_city` | string | Required. Same free-text city field pattern as `_entry_city` on `culture_directory` |
| `_cluster_street` | string | Required. Free-text street/neighbourhood name |
| `_cluster_country` | string | Required. Used for region matching (reuses `REGION_CITY_KEYWORDS`-style logic — see §3.4) |
| `_cluster_lat` / `_cluster_lng` | float | Optional. Populated if the founder grants location permission at creation (device geocode); used only for "nearby clusters" sorting, never required |
| `_cluster_status` | string enum | `forming` \| `active` \| `archived` — see §2.3 lifecycle |
| `_cluster_founder_id` | int | WP user ID. Immutable once set |
| `_cluster_host_id` | int | WP user ID. Mutable — see §2.4 host mechanisms |
| `_cluster_host_mechanism` | string enum | `appointed` \| `self_nominated` \| `elected` — records how the *current* host got the role |
| `_cluster_capacity` | int | Default 12 (configurable in WP Admin — see §2.5). `0` = unlimited |
| `_cluster_meeting_day` | string enum | `mon`...`sun` — the cluster's standing weekly meeting day |
| `_cluster_meeting_time` | string | Free-text, e.g. `"19:00"` |
| `_cluster_meeting_location_note` | string | Free-text, e.g. "Host's living room — message for address" (clusters are physical/private, so no public street address requirement) |
| `_cluster_created_at` | string (MySQL datetime) | Set on creation |
| `_cluster_activated_at` | string (MySQL datetime, nullable) | Set when status flips `forming → active` |
| `_cluster_election_open_until` | string (MySQL datetime, nullable) | Non-null only during an active election — see §2.4.3 |

Post title = `_cluster_name`. Post content unused (empty).

### 2.2 New DB tables

Both created in `Culture_Activator::create_tables()` (per the existing
mandatory pattern — **a new table added anywhere else will silently never
get created in production**, per the documented dbDelta gotcha in
CLAUDE.md). Bump `CULTURE_VERSION` so `culture_community_maybe_upgrade()`
picks it up on next deploy.

**`wp_culture_cluster_members`**
```
id, cluster_id, user_id, role ('member'|'host'), joined_at, status ('active'|'left')
UNIQUE KEY (cluster_id, user_id)
KEY (cluster_id, status)
KEY (user_id, status)
```
Re-joining after leaving just flips `status` back to `active` (same
upsert-not-duplicate pattern as `wp_culture_follows` and
`wp_culture_community_rsvp`).

**`wp_culture_cluster_checkins`**
```
id, cluster_id, user_id, meeting_date (DATE, not datetime — one row per
calendar week's meeting), checked_in_at, method ('qr'|'host_manual')
UNIQUE KEY (cluster_id, user_id, meeting_date)
KEY (cluster_id, meeting_date)
```
The `UNIQUE KEY` on `(cluster_id, user_id, meeting_date)` is the mechanism
that makes a check-in idempotent per member per week — scanning twice in
the same week is a silent no-op, not a duplicate row.

### 2.3 Cluster lifecycle (status state machine)

```
forming ──(>= MIN_ACTIVATION_MEMBERS within 30 days)──> active
   │
   └──(30 days elapse, threshold not met)──> archived

active ──(host leaves with no successor and no members remain after 14-day grace)──> archived
```

- `MIN_ACTIVATION_MEMBERS` = 4 (configurable, see §2.5). Founder counts as
  member #1 automatically on creation.
- `forming` clusters are visible only to the founder and anyone the founder
  has explicitly invited (via a shareable invite link — see §4.2). They do
  **not** appear in any public people/members-near-me search surface.
- `active` clusters are publicly discoverable (see §4) and joinable by
  anyone, subject to capacity (see §2.6 for overflow behavior).
- `archived` clusters are read-only history — visible on the former
  founder/host's profile as a past cluster, not joinable, not shown in the
  people/members-near-me discovery section. They are never hard-deleted
  (consistent with the project's general no-hard-delete posture for
  user-generated structures, e.g. Follow/RSVP soft-cancel patterns).
- A WP-Cron job (daily, mirroring the existing `culture_check_perk_expiry`
  hourly-job pattern) sweeps `forming` clusters past their 30-day window
  and flips them to `archived`, notifying the founder (new notification
  type `cluster_forming_expired`, see §6.4) with a CTA to merge into a
  nearby active cluster instead (links to the people/members-near-me
  House Fellowship section, pre-filtered by city).

### 2.4 Host-selection mechanisms (all three, coherently sequenced)

The cluster always has exactly one `_cluster_host_id` at any time. The
*current* host's `_cluster_host_mechanism` field records which of the three
mechanisms produced them. All three are valid at different points in the
lifecycle — this is not three independent settings a cluster "picks", it's
a sequence:

**2.4.1 — Self-nominated (cluster creation, always the starting state)**

The founder is automatically the host on creation, mechanism =
`self_nominated`. This is the only way a `forming` cluster ever gets a
host — there is nothing to appoint or elect yet because there's no member
base. No special action needed beyond §2.1's creation flow.

**2.4.2 — Appointed (admin/City Convener override, available any time)**

A small WP Admin screen (new tab under Culture Community, "Clusters") lets
an admin reassign `_cluster_host_id` directly, setting mechanism =
`appointed`. This exists for:
- Replacing an inactive/unresponsive host without waiting for an election.
- Seeding a brand-new city's first clusters with a trusted local Culture
  Authority/Culture Icon member as host, bypassing the organic
  founder-led path entirely (useful for launch markets).
This is the only mechanism with no in-app member-facing trigger — it is an
operator tool, not a feature members invoke.

**2.4.3 — Elected (member-triggered, available once `active`)**

Only available on `active` clusters (an election with fewer than 4 members
present is meaningless). Any member can trigger "Start a host election"
from the cluster screen (see §4.4) if no election is already open. This
sets `_cluster_election_open_until` to now + 7 days and opens a simple
plurality vote (new table not introduced — reuse `wp_culture_cluster_members`
joined with a lightweight vote: add `_cluster_election_votes` as cluster
post meta, a JSON map `{voter_user_id: candidate_user_id}`, since this is
low-volume/low-concurrency data, not a candidate for its own table — same
"don't add a table you don't need" judgment call already established by
e.g. `_about_fields` JSON blob on `culture_directory`). Any active member
can stand as a candidate by tapping "I'll run" (no nomination signatures
required — keep this lightweight). On expiry, a cron job (same daily sweep
as §2.3) tallies `_cluster_election_votes`, sets the plurality winner as
`_cluster_host_id` with mechanism = `elected`, clears the votes map and
`_cluster_election_open_until`, and notifies all members (new notification
type `cluster_new_host`, see §6.4). Tie → earliest-candidate-by-signup
wins (deterministic, no runoff round in v1).

**Outgoing host on any transition** keeps their `member` row (role flips
`host → member`) — losing host status never removes someone from the
cluster.

### 2.5 Admin configuration

New "Literati Connect / House Fellowship" section in WP Admin → Culture
Community → General tab (`class-culture-settings.php`), same pattern as the
existing "Cloudflare R2 Storage" / "Lifestyle Shop" sections:
- `culture_cluster_min_activation_members` (default 4)
- `culture_cluster_forming_window_days` (default 30)
- `culture_cluster_default_capacity` (default 12)
- `culture_cluster_election_window_days` (default 7)

All read via the established `defined('CONST') ?: get_option(...)` getter
pattern, never hardcoded in PHP logic.

### 2.6 Overflow joining (home-street cluster full or nonexistent)

A user's "home cluster" is whichever `active` cluster has
`_cluster_street`/`_cluster_city` matching their profile address most
closely (string match, same tolerance as `_entry_city` disambiguation —
no new geocoding requirement). If that cluster is at `_cluster_capacity`,
or no cluster exists yet for their street:
- They are shown the next-nearest `active` clusters in the same city
  (sorted by member count ascending, i.e. prioritizing clusters that need
  members — not by physical distance, since `_cluster_lat`/`_cluster_lng`
  is optional and many users won't have it set) and may join any of them
  directly, no approval step.
- If the user is at capacity *and* no other city cluster has room either,
  they're shown the "Start a House Fellowship" CTA (§2.7) instead.
- Joining a cluster outside one's home street has no different treatment
  in the data model — `wp_culture_cluster_members` doesn't care why someone
  joined. There is no "home cluster" flag stored anywhere; "home cluster"
  is a computed UI concept (best-string-match against the user's profile
  city/street), purely for sorting/default suggestion, never enforced.

### 2.7 Cluster founding / bootstrap flow

This is the mechanism for how a cluster comes to exist before anyone has
joined it:

1. Any member (Citizen or Pro — no gating) taps **"Start a House
   Fellowship"** from the people/members-near-me screen or from the
   empty-state shown when their street has no cluster (see §4.1/§4.2 for
   exact entry points).
2. A short form: cluster name (pre-filled from their profile
   street/neighbourhood, editable), city/street/country (pre-filled from
   profile, editable — handles people who want to found a cluster
   somewhere other than their listed home address, e.g. a student founding
   one near campus), weekly meeting day/time, optional location note,
   optional capacity override.
3. On submit: creates the `culture_cluster` post, `_cluster_status =
   forming`, `_cluster_founder_id` = them, `_cluster_host_id` = them,
   `_cluster_host_mechanism = self_nominated`, inserts their own row into
   `wp_culture_cluster_members` (role `host`, status `active`).
4. The founder gets a shareable invite link (`/cluster/{post_id}/invite` —
   resolves to a join screen even while `forming`, bypassing the "must be
   active to be publicly discoverable" rule specifically for direct
   invite links) to send to neighbours/friends directly — this is the
   *only* way a `forming` cluster gains members, since it isn't in any
   public listing yet.
5. Once membership hits `culture_cluster_min_activation_members` (default
   4), the cluster auto-flips to `active` (no admin step),
   `_cluster_activated_at` is set, and it becomes publicly discoverable.
   The founder gets a celebratory notification (new type
   `cluster_activated`, §6.4) and a credit/reputation award (§6.2,
   `cluster_founded` action — awarded once, on activation, not on
   creation, to avoid rewarding clusters that never actually form).
6. If 30 days pass without hitting the threshold, see §2.3's expiry path.

This directly answers the "how does a brand-new cluster come into
existence" question: **someone willing to start it always starts as both
founder and self-nominated host of a `forming`, invite-only cluster; public
existence is earned by hitting a real member threshold, not granted on
creation.**

---

## 3. Backend — REST API surface

Following the project's mirrored mobile(JWT)/web(API-key) convention
exactly. New PHP class: `class-culture-clusters.php` (`Culture_Clusters`) —
single source of truth for all logic, called identically from both
`class-culture-mobile-api.php` and `class-culture-rest-api.php` handlers
(same pattern as `Culture_Follows`, `Culture_Community_RSVP`).

### 3.1 Core methods on `Culture_Clusters`

- `create_cluster($user_id, $data)` — §2.7 step 3
- `get_cluster($cluster_id)` — full cluster object incl. member count,
  capacity, host info, status
- `get_member_status($cluster_id, $user_id)` — `{isMember, role, joinedAt}`
- `join($cluster_id, $user_id)` — capacity check (skip check if
  `_cluster_capacity = 0`), upsert membership row
- `leave($cluster_id, $user_id)` — sets membership `status = 'left'`; if
  the leaver is host, triggers host-vacancy handling (§3.3)
- `list_for_user($user_id)` — all clusters the user belongs to
- `discover($params)` — public browse, mirrors `Culture_Directory::handle_browse()`
  shape: `q`, `city`, `country`, `status` (defaults to `active` only —
  `forming` never returned here except via the invite-link path),
  `sort` (`nearest_capacity` default — fewest members first per §2.6 —
  or `newest`), `page`/`per_page`
- `start_election($cluster_id, $user_id)` — §2.4.3
- `cast_vote($cluster_id, $voter_id, $candidate_id)` — §2.4.3
- `check_in($cluster_id, $user_id, $method)` — §5
- `generate_host_qr($cluster_id, $host_id)` — §5.2
- `get_attendance_history($cluster_id, $user_id)` — for streak/badge
  computation (§6)

### 3.2 REST endpoints (mirrored)

| Mobile (`/mobile/cluster/...`, JWT) | Web (`/cluster/...`, API key) | Purpose |
|---|---|---|
| `POST create` | `POST create` | §2.7 |
| `GET discover` | `GET discover` | §3.1 `discover()` |
| `GET {id}` | `GET {id}` | Full cluster detail |
| `GET {id}/status` | `GET {id}/status` | Membership status for current/given user |
| `POST {id}/join` | `POST {id}/join` | §2.6 |
| `POST {id}/leave` | `POST {id}/leave` | — |
| `GET my-clusters` | `GET my-clusters` | `list_for_user()` |
| `POST {id}/election/start` | `POST {id}/election/start` | §2.4.3 |
| `POST {id}/election/vote` | `POST {id}/election/vote` | §2.4.3 |
| `POST {id}/checkin` | `POST {id}/checkin` | §5.1 (member self-check-in via scanned QR) |
| `GET {id}/host-qr` | `GET {id}/host-qr` | §5.2 (host-only; 403 if not `_cluster_host_id`) |
| `GET {id}/attendance` | `GET {id}/attendance` | Member's own streak data |

Mobile handlers added to `class-culture-mobile-api.php`, web handlers to
`class-culture-rest-api.php` — both delegate to `Culture_Clusters`, no
duplicated business logic (same discipline as Follow/RSVP).

### 3.3 Host vacancy handling (host leaves entirely)

If `_cluster_host_id` calls `leave()`:
- If an election is already open, nothing special happens — it resolves
  normally on schedule, and the leaving host is simply not a candidate
  (their candidacy, if any, is removed from `_cluster_election_votes`).
- If no election is open and the cluster has other members, auto-starts an
  election (`start_election()` called internally) rather than leaving the
  cluster headless.
- If no other members remain, the cluster enters a 14-day grace window
  (no new field needed — computed from `joined_at`/`status` of the last
  remaining membership row) before the daily cron archives it.

### 3.4 Region/city matching reuse

`_cluster_city`/`_cluster_country` matching for `discover()`'s implicit
"clusters in my city" default reuses the existing
`Culture_Directory::REGION_CITY_KEYWORDS` substring-match table rather than
inventing a second one — extend that table if needed, do not fork it.

---

## 4. Frontend — discovery & membership UX (mobile + web, mirrored)

Per the established convention, mobile (`apps/mobile`) and web
(`apps/connect` + `packages/shared`) duplicate this UI independently (RN
can't import `packages/shared`) — keep both in sync, exactly as documented
for Discover, Follow, and feed-recommendations elsewhere in this repo.

### 4.1 Entry points

- New **"House Fellowship"** section inside the existing people/members-near-me
  surface — `MemberDirectoryScreen.tsx` on mobile, `app/connect/people/page.tsx`
  on web. Not Discover: Discover's mental model is content browsing (places,
  books, films, the `culture_directory` entry types), whereas a cluster is
  fundamentally about *who's near you*, which is exactly what the people
  directory already represents. Placed as a dedicated section/tab at the top
  of that screen (e.g. a "Your Street" segment above the regular member grid),
  not a separate nav item.
- A **dashboard quick link** ("My House Fellowship" or "Find your House
  Fellowship" depending on membership state) on `MemberDashboardScreen.tsx`
  / `app/member/page.tsx`'s quick links — same slot pattern as the
  existing Wallet/Perks/Events links.
- If the user has no cluster and their street has none either, an
  empty-state card with the "Start a House Fellowship" CTA (§2.7) appears
  in both of the above locations.
- Unlike Discover (which already has a reusable paginated search/filter
  shell), the people/members-near-me screens have less existing
  infrastructure to lean on — §3.1's `discover()` endpoint still mirrors
  `Culture_Directory::handle_browse()`'s shape for consistency, but the
  client-side list/grid UI for clusters is new work on both platforms, not
  a drop-in reuse of an existing component.

### 4.2 Cluster discovery screen

- List/grid of nearby `active` clusters (city default = user's profile
  city), each card: name, street, member count / capacity, meeting
  day/time, a "Forming" vs "Active" indicator is never shown here since
  `forming` clusters aren't listed (only reachable via invite link).
- Tapping a card opens cluster detail (read-only preview if not a member:
  name, street, meeting cadence, member count, capacity, a "Join" button
  or "Full — see other clusters nearby" per §2.6).
- Invite-link landing screen (`/cluster/{id}/invite`) — same detail view
  but reachable regardless of `forming` status, with a "Join" button that
  works even pre-activation.

### 4.3 Literati Connect rail

A horizontal rail of upcoming `_culture_event_is_literati = 1` events. Since
House Fellowship discovery now lives on the people/members-near-me screen
(§4.1) rather than Discover, this rail is placed directly in the Events
tab/screen instead (it's a city-wide *event*, not a people-near-you concept,
so Events is the better fit regardless of where clusters live) — reuses
existing `HappeningCard` rendering, not a new card component.

### 4.4 Cluster home screen (for members)

Once joined, a dedicated cluster screen (new: `screens/community/
ClusterScreen.tsx` on mobile, `app/cluster/[id]/page.tsx` on web):
- Header: cluster name, street/city, meeting day/time, location note
  (visible to members only — never public), member count/capacity.
- Member list (avatars + names, host highlighted with a small badge).
- If current user is host: "Show check-in QR" button (§5.2) and "Reassign
  host" → admin-only in practice but the UI affordance for *triggering an
  election* is member-facing (see next point) — the host never directly
  hands off the role themselves in v1 (keeps the model simple: only
  election or admin appointment changes a host, never a unilateral
  self-removal-with-handoff in one step — a host who wants to step down
  just leaves, which auto-triggers an election per §3.3).
- If current user is a non-host member: "Start a host election" button
  (disabled/hidden if one is already open, in which case a voting UI shows
  instead — simple radio list of candidates, including a "I'll run" link
  to add yourself as a candidate before voting closes).
- "Leave cluster" action (with confirm dialog — reuses `ConfirmDialog`/
  `confirm()` patterns already in each codebase).
- Attendance streak summary for the current user (this week
  checked-in/not, current streak count) — feeds the badge system (§6).

### 4.5 Feed surfacing

A House Fellowship reminder appears as a feed-injected card (same
injection mechanism as the Event Spotlight carousel — a fixed-position
slice at a stable index, not a re-sorted item) on the user's *own* cluster
meeting day, e.g. "Your House Fellowship meets tonight at 7pm — tap to see
who's going." This is the only place House Fellowship appears inside the
main community feed; everything else lives in Discover/dashboard/cluster
screen.

---

## 5. Check-in & attendance tracking

### 5.1 Why House Fellowship needs check-in (unlike Literati Connect)

Literati Connect events are RSVP-only because they're large, public,
city-wide, low-frequency — RSVP-then-attendance-sweep (§1) is good enough
signal. House Fellowship is small, weekly, recurring, and its entire reward
value (streaks, host trust signals, "Cluster Regular" badge) depends on
*actually showing up*, not just intending to — so it needs a real per-week
attendance record, hence the `wp_culture_cluster_checkins` table.

### 5.2 Mechanism: host-generated rotating QR, reusing the Perks pattern

Exactly mirrors the existing partner-perk QR redemption flow
(`class-culture-perks.php`'s HMAC-signed, short-lived code pattern) instead
of inventing a new one:
- Host opens "Show check-in QR" on the cluster screen → calls
  `GET {id}/host-qr` → backend generates an HMAC-signed token
  `{cluster_id, meeting_date: today, exp: now+15min}` (same HMAC key
  helper pattern as `Culture_Perks::hmac_key()`), rendered as a QR
  (`react-native-qrcode-svg` on mobile, an equivalent web QR lib — check
  for an existing web QR dependency before adding a new one, otherwise add
  the smallest available one, e.g. `qrcode.react` — flag if none exists at
  build time and confirm before adding a new dependency).
- Attending members scan it with their device camera (mobile: reuse
  whatever camera/scan utility already powers any existing QR flow if one
  exists for perks; if perks redemption is staff-scans-member rather than
  member-scans-code, this is the **first** member-scans-code flow in the
  codebase — confirm Perks' actual scan direction before assuming reuse,
  and budget for adding a barcode-scanner dependency, e.g.
  `expo-camera`/`expo-barcode-scanner`, if none exists).
- Scanning POSTs the decoded token to `{id}/checkin`; backend verifies
  HMAC + expiry + that `meeting_date` matches today, then inserts into
  `wp_culture_cluster_checkins` (silently no-ops on the `UNIQUE KEY`
  conflict if already checked in this week).
- Fallback for members without a working camera/QR: `method = 'host_manual'`
  — host can tap a member's name in the member list and mark them present
  directly (calls the same `{id}/checkin` endpoint server-side with
  `method=host_manual`, host-only, 403 otherwise).

### 5.3 What attendance powers

- Per-member streak (consecutive weeks checked in) shown on the cluster
  screen (§4.4) and used for badge thresholds (§6.2).
- Cluster-level health signal (e.g. average weekly attendance) — exposed
  only to the host/admin in v1, not members, to avoid turning attendance
  into a public leaderboard (deliberately avoiding a competitive/shaming
  dynamic in a small in-person group).

---

## 6. Rewards, gamification & notifications integration

### 6.1 New action keys (via the `award_points()` bridge — never direct calls)

Add to `Culture_Gamification::POINTS` and `::CREDIT_BONUSES` (both required —
per the "every action awards both" rule already established repo-wide):

| Action key | Trigger | Notes |
|---|---|---|
| `cluster_founded` | Cluster flips `forming → active` (§2.7 step 5) | Awarded once to the founder only |
| `cluster_checked_in` | Successful `{id}/checkin` | Awarded to the attending member, capped by the existing daily credit cap like everything else |
| `cluster_host_served` | Monthly, swept by cron, per active host | Small recurring reward for carrying host duties — prevents the role from being purely a burden |
| `literati_connect_attended` | Post-event attendance sweep (§1) | Mirrors `magazine_read`-style standalone award call, since it's cron-driven not request-driven — call `award_points()` directly from the cron job, same as any other server-triggered (non-request) award already in the codebase |

All four go through admin-configurable `culture_points_{action}` /
`culture_credits_{action}` overrides automatically by virtue of using the
bridge — no extra admin UI work needed beyond what already exists.

### 6.2 New badges

Two new badges added to the existing badge system (wherever
`culture_badge_awarded` consumers/badge-definition tables already live —
follow the existing badge-addition process, do not invent a parallel one):
- **"Cluster Regular"** — 8-week consecutive check-in streak.
- **"City Convener"** — served as host for 3+ consecutive months (tracked
  via `cluster_host_served` award count, not a new field).

### 6.3 New cron jobs (WP-Cron, mirroring existing hourly/daily jobs)

- Daily: `culture_check_cluster_forming_expiry` (§2.3), `culture_check_cluster_elections`
  (tallies any election past `_cluster_election_open_until`, §2.4.3),
  `culture_check_cluster_host_vacancy_grace` (§3.3 14-day grace sweep).
- Weekly (or daily, scanning for "yesterday's" events): `culture_sweep_literati_attendance`
  — awards `literati_connect_attended` to every user who RSVP'd to a
  `_culture_event_is_literati` event whose date has passed (§1, §6.1).
- Monthly: `culture_award_cluster_host_service` — awards `cluster_host_served`
  to every current `_cluster_host_id` on an `active` cluster.

### 6.4 New notification types

Add to `Culture_Notifications::TYPES`: `cluster_activated`,
`cluster_new_host`, `cluster_forming_expired`, `cluster_election_started`
(fires to all members when any member triggers §2.4.3), `cluster_checkin_reminder`
(fires same-day, morning of the cluster's meeting day, to all members —
this is the trigger behind the feed card in §4.5 as well as the bell
notification).

**Mandatory per the repo's documented gotcha**: add an icon entry for all
five new types to **all three** existing icon maps —
`packages/shared/components/NotificationBell.tsx`,
`apps/connect/app/member/notifications/NotificationsClient.tsx`,
`apps/mobile/src/screens/member/NotificationsScreen.tsx` — there is no
shared source of truth for these, and every past addition that skipped one
of the three has had to be fixed retroactively.

**Also mandatory**: extend `openNotification()`'s deep-link switch (mobile,
§ "Notification tap routing" in CLAUDE.md) to route all five new types to
the relevant `ClusterScreen` — without this they'll just mark-as-read with
no navigation, which is the documented failure mode for any notification
type added without a routing case.

---

## 7. Implementation order (phases — build strictly in this order)

1. **Phase 1 — Data model & core membership.** `culture_cluster` CPT, both
   new tables, `Culture_Clusters` core methods (`create_cluster`, `join`,
   `leave`, `get_cluster`, `get_member_status`, `list_for_user`,
   `discover`), all REST endpoints except election/check-in, mobile + web
   Discover integration, cluster home screen (read/join/leave only, no
   host tools yet), founding flow (§2.7) end-to-end including the
   forming→active cron sweep. **Ship and verify this phase fully working
   before starting Phase 2** — it's a complete, usable feature on its own
   (people can found and join clusters) even without check-in/rewards.
2. **Phase 2 — Host mechanisms.** Election flow (§2.4.3) incl. cron tally,
   admin "Clusters" appointment screen (§2.4.2), host-vacancy auto-election
   (§3.3) and grace-period archival.
3. **Phase 3 — Check-in & attendance.** QR generation/scan flow (§5.2),
   manual host check-in fallback, attendance history endpoint, streak
   display on cluster screen.
4. **Phase 4 — Rewards & notifications.** All four action keys wired
   through `award_points()`, two new badges, all cron jobs in §6.3, all
   five notification types incl. icon-map and deep-link updates.
5. **Phase 5 — Literati Connect integration + feed surfacing.** §1's
   editorial-CPT meta flag and badge, the attendance-sweep cron and its
   reward, the Discover/Events rail, and the House Fellowship feed-injected
   reminder card (§4.5).

Do not start a phase before the previous one is fully working
end-to-end (backend + both frontends) on a dev/staging build. Do not
add anything not described in this document without first updating this
document — that's the scope-creep guardrail this doc exists to provide.

---

## 8. Open items deliberately deferred (not blockers, just not v1)

- Cross-city "find clusters while traveling" mode.
- In-app cluster chat (today: members coordinate location details via
  whatever existing 1:1 contact path exists, if any — likely just
  `_cluster_meeting_location_note` text and members independently
  reaching out via public profile, not a new feature).
- Host handoff *without* triggering a full election (e.g. host nominates a
  specific successor directly) — left out to keep v1's three-mechanism
  model simple; revisit only if real usage shows election-only handoff is
  too slow in practice.
- Public attendance leaderboards — deliberately excluded per §5.3's
  reasoning, not an oversight.
