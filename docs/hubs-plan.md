# Hubs — Full Planning & Implementation Spec

Status: **Phase 1 built (see §9's Phase 1 line for the full checklist).**
This document is the single source of truth for building this feature — do
not begin Phase 2 until it's read in full. Modeled directly on
`docs/literati-connect-plan.md` (Stoop) — read that doc's own structure for
precedent on tone/rigor if anything here is ambiguous.

**Decisions already made (do not re-litigate without the user):**
- Feature name: **Hubs** (not "Communities" — avoids further overloading the
  word "community", already used generically everywhere for the community
  feed/posts/`culture_post` CPT).
- Hub posts do **not** appear in the default (newest-first) main feed. They
  **do** appear in a user's **For You** ranked feed if that user follows
  (or is a member of) the Hub the post belongs to — see §4.5, revised. A Hub
  also has its own dedicated feed screen showing all of its posts regardless
  of the viewer's follow status. This is a deliberate middle ground: it keeps
  the plain chronological main feed from being diluted as more Hubs are
  created, while still surfacing relevant Hub activity to people who've
  opted in, the same way Followed-author posts already get a scoring boost
  in For You today.
- **Entry points**: no dedicated "Hubs" tab/nav item and no placement inside
  Discover. Instead, the feed screen's header Reload icon is removed and
  replaced with two icons — **Hub** and **Stoop** — linking to the Hubs
  browse screen and the user's Stoop respectively. See §4.2, revised.

---

## 0. Naming and scope discipline (read first)

- "Hub" is the brand name for a single user-created topic community (e.g. a
  Hub called "The White Lotus HBO"). Plural "Hubs" is the feature/section
  name. Never call it "Community" or "Communities" in user-facing copy —
  that word is already load-bearing for the existing community feed/post
  system and mixing the two would be genuinely confusing (a Hub is a
  sub-space *within* the community system, not a rename of it).
- A Hub is topic-based and has no geography, no weekly cadence, no
  check-in/attendance concept — it is **not** Stoop. Do not borrow Stoop's
  QR check-in, host-election, or forming/active-threshold mechanisms; those
  exist to solve small-in-person-group problems that don't apply here. The
  only thing borrowed from Stoop's build is the *shape* of the code (CPT +
  membership table + REST mirroring convention), not its lifecycle logic.
- Explicitly **out of scope** for the first build (do not build these unless
  this doc is revised first):
  - Hub-level chat/DMs between members (same exclusion as Stoop, same
    reasoning — this is a posts+comments space, not a messaging product).
  - Cross-posting a single post into multiple Hubs at once.
  - Paid/sponsored Hubs, Hub monetization of any kind.
  - Nested/sub-Hubs (no "r/x + r/x/subforum" hierarchy in v1).
  - Hub-specific custom theming/branding beyond a name, description, and
    cover image.
  - Real-time notifications beyond the existing notification-bell pipeline.
  - Algorithmic Hub recommendation ("Hubs you might like") — v1 discovery is
    search + browse + trending-by-recent-activity only, no ML ranking.

---

## 1. Data model

### 1.1 New CPT: `culture_hub`

Registered in `class-culture-post-types.php` alongside `culture_cluster`.
`public => false` (not rendered as a page — surfaced only through dedicated
screens/endpoints, same rationale as `culture_cluster`/`culture_directory`).

Fields (all `show_in_rest => true`, registered via `register_post_meta`):

| Meta key | Type | Notes |
|---|---|---|
| `_hub_name` | string | Post title mirrors this. Editable by owner/mod. |
| `_hub_slug` | string | URL-safe, unique, generated from name at creation (append `-2`, `-3`... on collision, same pattern as WP's own post-slug dedup) |
| `_hub_description` | string | Short, required, shown in discovery cards |
| `_hub_cover_image_id` | int | Optional WP attachment ID. Falls back to a generated placeholder (initials on a deterministic color, same idea as avatar fallbacks elsewhere) |
| `_hub_creator_id` | int | WP user ID. Immutable |
| `_hub_status` | string enum | `active` \| `archived` — no `forming` state (unlike Stoop, a Hub is public and joinable the instant it's created — there's no activation threshold to gate on) |
| `_hub_allowed_templates` | JSON array | Subset of the 10 existing template types (`post`, `hidden-gem`, `cultural-take`, `food-review`, `book-review`, `creative-showcase`, `poll`, `itinerary`, `event`, `quote`). Default on creation: `["post", "cultural-take", "quote"]` — the three templates with no reputation/tier gate (see §3.2), so a brand-new Hub always has *something* postable regardless of what the creator later restricts. `event` in a Hub context has no RSVP-capacity/organiser semantics beyond what `culture_post`'s existing event template already does — do not build Hub-specific event handling. |
| `_hub_member_count` | int | Denormalized counter, incremented/decremented on join/leave (same "avoid COUNT(*) on every read" rationale as any other denormalized count in this codebase — kept in sync inside `Culture_Hubs::join()`/`leave()`, not computed live) |
| `_hub_post_count` | int | Denormalized counter, incremented on `handle_submit_post()` when `hub_id` is present |
| `_hub_created_at` | string (MySQL datetime) | Set on creation |

Post title = `_hub_name`. Post content unused (empty), same convention as
`culture_cluster`.

### 1.2 New DB table: `wp_culture_hub_members`

Created in `Culture_Activator::create_tables()` (mandatory — a table added
anywhere else silently never gets created in production, per the documented
dbDelta gotcha in CLAUDE.md). Bump `CULTURE_VERSION` so
`culture_community_maybe_upgrade()` picks it up on next deploy.

```
id, hub_id, user_id, role ('member'|'mod'|'owner'), joined_at, status ('active'|'left')
UNIQUE KEY (hub_id, user_id)
KEY (hub_id, status)
KEY (user_id, status)
```

Re-joining after leaving flips `status` back to `active` (upsert-not-duplicate,
same pattern as `wp_culture_cluster_members`/`wp_culture_follows`/
`wp_culture_community_rsvp`). The creator's own row is inserted with
`role = 'owner'` at creation time, same as Stoop's founder-is-first-member
pattern.

**Role semantics**: `owner` (the creator — exactly one per Hub, cannot leave
without transferring ownership first, see §5.3) → `mod` (owner-appointed,
can pin/remove posts and remove members, cannot delete the Hub or change
`_hub_allowed_templates`) → `member` (can post within `_hub_allowed_templates`,
comment, join/leave). No election mechanism like Stoop's host election —
mod appointment is owner-only, always (a Hub is topic-curation, not a
physical-safety-and-fairness structure the way Stoop's host role is).

### 1.3 New DB table: `wp_culture_hub_follows`

A **new, separate table** — do not overload the existing `wp_culture_follows`
table (user→user only, `followed_id` has no type discriminator) or
`wp_culture_hub_members` (following is lighter-weight than joining — see
§4.1 for the distinction). This mirrors the codebase's own precedent of
keeping similar-but-distinct concepts in separate tables rather than adding
a type column to a live one (e.g. `wp_culture_community_rsvp` kept
deliberately distinct from the pre-existing `wp_culture_event_rsvp`).

```
id, hub_id, user_id, created_at
UNIQUE KEY (hub_id, user_id)
```

No `status` column needed (unlike members) — unfollowing is a hard delete,
there's no "left" state worth preserving for a lightweight follow.

### 1.4 New post meta on `culture_post`: `_hub_id`

**This is the actual missing link and the biggest structural gap** — `culture_post`
currently has no topic/category taxonomy at all, only the flat, hardcoded
11-value `community_tag` enum (`SECTION_TAGS` in `class-culture-mobile-api.php`).
Add `_hub_id` (int, nullable, `show_in_rest => true`) to `culture_post`'s
existing meta registration block. `null`/absent = an ordinary community post,
unaffiliated with any Hub (today's existing behavior, completely unchanged).
Non-null = the post belongs to that Hub and is excluded from the main feed
(see §4).

`community_tag` (the existing `SECTION_TAGS` enum) stays as-is and is
**orthogonal** to `_hub_id` — a Hub post can still carry a section tag if the
composer UI wants to keep asking for one; not a blocker either way, decide
at implementation time whether the composer hides the section-tag picker
when posting into a Hub (recommended: hide it — Hub membership already
signals topic, asking for both is redundant).

`_hub_id` must be surfaced as `hubId` on the `FeedItem` shape on both
platforms (`packages/shared/lib/unified-feed.ts` web,
`class-culture-mobile-api.php`'s feed mapper for mobile) — this is required
by §4.5's For You filtering logic, not optional/deferrable.

---

## 2. Lifecycle

```
active ──(owner deletes the Hub, see §5.4)──> archived
```

Deliberately the simplest lifecycle in the codebase's set of user-created
group features — no `forming` state, no activation threshold, no expiry
cron. A Hub is live and publicly joinable the instant `create()` succeeds.
This is a deliberate contrast with Stoop (which gates public visibility
behind a 4-member threshold because a *physical, weekly, address-sharing*
group has real reasons to stay invite-only until it's real) — a topic-based
discussion Hub has no equivalent safety/commitment reason to hide behind a
threshold, and gating it would only suppress legitimate small/niche Hubs
that are exactly the long-tail use case ("r/TheWhiteLotusHBO" doesn't need
4 people to already be talking before anyone can find it).

`archived` Hubs are read-only history (existing posts/comments remain
visible, no new posts/joins/follows accepted) — never hard-deleted, same
no-hard-delete posture as every other user-generated structure in this
codebase.

---

## 3. Post creation inside a Hub

### 3.1 Composer entry point

`SubmitPost.tsx` gains an optional `hubId`/`hubName` prop (mobile:
`NewPostScreen.tsx` gains the equivalent route param). When present:
- The template picker (`TemplatePickerSheet.tsx` / mobile equivalent) is
  filtered down to only the templates in that Hub's `_hub_allowed_templates`
  — not just gated-and-dimmed like `TEMPLATE_REP_GATE` does today, but
  **absent entirely** for templates the Hub owner has excluded. This is a
  second, independent filter layered on top of (not replacing) the existing
  reputation/tier gate — a template can be simultaneously excluded by the
  Hub AND rep-gated; both conditions must pass.
- Submission includes `hub_id` in the POST body.
- On success, redirect to the Hub's own feed (§4), not the main feed.

### 3.2 Server-side enforcement (never trust the client-side filter alone)

`handle_submit_post()` (`class-culture-mobile-api.php`) and the web route
(`apps/connect/app/api/community/submit/route.ts`) both gain a Hub check,
mirroring how `TEMPLATE_REP_GATE` is already independently duplicated in
both places (same caveat already documented in CLAUDE.md — "no shared
source of truth across the PHP/TS boundary"):
1. If `hub_id` present, look up the Hub, confirm `_hub_status = active`.
2. Confirm the poster is an active member (`wp_culture_hub_members`,
   `status = active`) — **posting requires membership, following alone is
   not enough** (see §4.1 for why these are different permission levels).
3. Confirm `template_type` is in the Hub's `_hub_allowed_templates`.
4. All existing checks still apply unchanged: reputation/tier gates,
   `packages/utils/spam-protection.ts` (link-blocking, rate limit, duplicate
   detection, keyword blocklist, new-member review queue).
5. On success, increment `_hub_post_count`.

### 3.3 Default templates, and why `post`/`cultural-take`/`quote` are always safe

Those three templates have no reputation/tier gate today (only `poll`/
`itinerary` require Taste Maker-or-Pro, and `event` requires Culture
Contributor-or-Pro). A new Hub defaults to allowing exactly those three so
that a brand-new member (who may have 0 reputation) can always post
*something* the moment they join, regardless of what the owner later
restricts the Hub to.

---

## 4. Frontend — discovery, membership, and the Hub feed

### 4.1 Follow vs. join — two distinct permission levels

- **Follow** (`wp_culture_hub_follows`): see the Hub in a "Following" list,
  get notified of new posts (if notification prefs allow it) — read-only,
  no posting rights, no member-count contribution. Anyone can follow any
  active Hub with one tap, no approval.
- **Join** (`wp_culture_hub_members`, role `member`): everything Follow
  gives, plus posting/commenting rights and counting toward
  `_hub_member_count`. Anyone can join any active Hub with one tap, no
  approval (no invite-only Hubs in v1 — that's an explicit future-open-item,
  see §8).
- Joining does **not** require a prior Follow, and Following does not
  require Joining — they're independent actions a user can take in either
  order or neither.

### 4.2 Entry points

- **Feed header icon swap (the primary entry point) — done.**
  - **Mobile**: `ConnectFeedScreen.tsx`'s header had a "Ghost refresh"
    `refresh-outline` icon — confirmed the screen's `FlatList` already has a
    `RefreshControl` wired to the same `refresh()` function (pull-to-refresh
    parity confirmed per the verification note below), so the icon was safe
    to remove. Replaced with two icons: **Hub** (`planet-outline` →
    `HubsScreen`) and **Stoop** (`home-outline` → `StoopHomeScreen`, a new
    screen — see below).
  - **Web has no equivalent Reload icon** — `PulseFeed.tsx`'s feed header
    never had one (the original assumption that it mirrored mobile's Reload
    icon was wrong). Instead, Hub and Stoop icons were added to the
    persistent global site header, `apps/connect/components/Header.tsx`,
    next to the existing Discover compass icon (same `ch-icon-btn` pattern,
    visible on every Connect page including the feed) — Hub links to `/hub`,
    Stoop links to a new `/connect/stoop` page.
  - **`/connect/stoop` (new)**: renders `Stoop.tsx` (the join/discover
    widget) with its own hero, mirroring the page structure the old
    People-screen render used before removal. This is what actually revives
    `Stoop.tsx` from the "unused, pending" state noted below.
  - **`StoopHomeScreen` (new, mobile)**: recreates the removed
    `HouseFellowshipSection` inline logic as its own screen (fetch
    `my-clusters`, show the active cluster or nearby clusters + a "Start a
    Stoop" CTA) — necessary because removing it from `MemberDirectoryScreen`
    left no other mobile screen doing this resolve.
  - **Done ahead of Phase 1**: the old People-screen Stoop entry point had
    already been removed (web: `Stoop` import/render deleted from
    `apps/connect/app/connect/people/page.tsx`; mobile: the
    `HouseFellowshipSection` inline component and its `hf*` styles deleted
    from `MemberDirectoryScreen.tsx`'s `ListHeaderComponent`) so there was no
    competing entry point to reconcile once the feed icons shipped.
    `packages/shared/components/connect/Stoop.tsx` is no longer unused — see
    `/connect/stoop` above.
  - Manual refresh on mobile is preserved via the pre-existing
    `RefreshControl`/pull-to-refresh on the feed `FlatList` — confirmed
    before removing the Reload icon, per the verification note this
    replaces.
- No dedicated Hubs tab in the main tab bar, and Hubs are **not** placed
  inside Discover — the feed-header icon above is the only nav entry point.
  A **Hubs browse screen** (name search, sort, "My Hubs", "Start a Hub" —
  same content as originally scoped) is what the Hub icon opens; it just
  isn't reached via Discover or a 7th tab.
- A **"My Hubs"** section (joined + followed, two tabs) at the top of the
  Hubs screen for a logged-in user with at least one membership/follow.
- Hub search/browse: name search, sorted by `_hub_member_count` (default,
  "Popular") or `_hub_created_at` (newest) or recent-post-activity
  ("Trending" — a lightweight proxy: Hubs with the most posts in the last
  7 days, computed via a raw-SQL query against `culture_post` filtered by
  `_hub_id`, not a stored/cached value in v1).
- **"Start a Hub"** CTA, always visible on the Hubs screen (no gating on
  who can create one beyond being a logged-in member — Citizen or Pro, no
  tier restriction, consistent with Stoop's "no gating anywhere in this
  feature" posture).

### 4.3 Hub creation flow

Single-step form (much simpler than Stoop's 6-step onboarding — there's no
country/venue/capacity/locality context to collect): name, description,
optional cover image upload (reuses the existing `/api/community/upload-image`
R2 path), and an initial `_hub_allowed_templates` picker (checkboxes,
defaulting to the three safe templates per §3.3, with rep-gated templates
shown but visually flagged "members will still need Taste Maker rep (or
Pro) to use this," matching `TEMPLATE_REP_GATE`'s existing dimmed-pill
treatment elsewhere in the composer).

On submit: creates the `culture_hub` post, `_hub_status = active`,
`_hub_creator_id` = them, inserts their own `wp_culture_hub_members` row
(`role = owner`, `status = active`), `_hub_member_count = 1`. No forming
period, no invite-link bootstrap mechanism needed (contrast Stoop §2.7) —
redirect straight to the new Hub's feed.

### 4.4 Hub home screen (`/hub/[slug]` web, `HubScreen.tsx` mobile)

- Header: cover image, name, description, member count, Follow button,
  Join/Leave button, "+ New post" (only enabled for members, disabled with
  a tooltip for non-members explaining they need to join first).
- **The Hub's own feed** — posts where `_hub_id` matches, newest-first (no
  "For You" ranking in v1; that's a `feed-recommendations.ts` extension
  point for later, not required for launch). Reuses `FeedCard.tsx` template
  rendering as-is (poll/quote/event/etc. all render exactly like they do in
  the main feed — only the *source query* changes, not the card components).
- Comments on Hub posts: **fully reuses `CommentSection.tsx`/
  `CommentThread.tsx`/`useComments.ts` unchanged** — nothing in the comment
  system is post-source-specific, confirmed during research for this doc.
- If current user is owner: "Manage Hub" — edit name/description/cover,
  edit `_hub_allowed_templates`, appoint/remove mods, remove members,
  archive the Hub (§5.4).
- If current user is a mod: a lighter "Moderate" affordance — pin/unpin a
  post (one pinned post max, shown first regardless of sort), remove a
  post, remove a member (cannot touch other mods or the owner).

### 4.5 Feed surfacing — For You inclusion for followed/joined Hubs

Revised from the original "hub-only, never in main feed" decision. A Hub
post now appears in three places:

1. **The Hub's own feed** (§4.4) — always, regardless of viewer.
2. **The viewer's For You feed** (`rankFeed()`, `feed-recommendations.ts` on
   web, `useFeedRecommendations.ts` on mobile) — **only** if the viewer
   follows or is a member of that post's Hub. Implementation: both
   `scoreItem()`/`rankFeed()` functions already take a `followedUsernames`
   set as an optional parameter for the existing Follow-system feed boost
   (see CLAUDE.md's "Feed-ranking boost" section under the Follow system) —
   add a second, analogous optional parameter, `followedOrJoinedHubIds?:
   Set<number>`, checked against `item.hubId` (a new optional field on
   `FeedItem`, populated only when `_hub_id` is present). A Hub post whose
   `hubId` is **not** in that set is filtered out of the For You candidate
   list entirely (not merely down-ranked) — this is what "hub-only unless
   followed" means in practice: For You is opt-in visibility, not a lower
   score. A Hub post whose `hubId` **is** in the set is scored normally (no
   special extra boost beyond the existing scoring factors) and can appear
   anywhere in the ranked results a regular post could.
   - The **default, newest-first (non-For-You) main feed stays exactly as
     originally scoped**: Hub posts are always excluded from it, regardless
     of follow status. Only For You changes. This keeps the plain
     chronological feed's behavior unchanged for users who never touch the
     For You toggle.
   - Fetching `followedOrJoinedHubIds` requires a small new endpoint, `GET
     .../hub/my-hub-ids` (or reuse `GET my-hubs` from §5.2 and derive the ID
     set client-side) — call it alongside the existing `follow/following`
     fetch already made when For You is active (`PulseFeed.tsx` /
     `ConnectFeedScreen.tsx`), same fetch-once-per-session pattern.
   - **Keep both platform copies in sync** — this is the same duplication
     caveat that already applies to every other `feed-recommendations.ts` /
     `useFeedRecommendations.ts` change (see CLAUDE.md's Phase 8b and Follow
     system sections).
3. The post author's own public profile (Portfolio/Community tab — no
   special-casing needed, already shows all of a user's posts regardless of
   source) and the Hub-post permalink page (`/community/{slug}` web,
   existing route — already generic enough to render any `culture_post`
   regardless of `_hub_id`).

There is still **no** feed-injected "new post in a Hub you follow" reminder
card (contrast Stoop's meeting-day reminder card) — For You inclusion above
is the mechanism for feed visibility; a separate reminder card would be
redundant. New-post awareness beyond For You is still covered by the
notification bell (§6.4).

---

## 5. Backend — REST API surface

Following the project's established mirrored mobile(JWT)/web(API-key)
convention (the convention Stoop's actual implementation *deviated from* —
Stoop ended up web-only per the research for this doc; Hubs should not
repeat that gap, since a Hubs feature with no mobile posting/joining would
be a significantly worse experience than Stoop having no mobile QR-scan
alternative). New PHP class: `class-culture-hubs.php` (`Culture_Hubs`) —
single source of truth for all logic, called identically from both
mobile and web REST handlers, mirroring `Culture_Clusters`'s structure.

### 5.1 Core methods on `Culture_Hubs`
`create()`, `get()`, `get_by_slug()`, `update()` (owner-only: name/desc/
cover/allowed-templates), `archive()` (owner-only), `join()`, `leave()`,
`follow()`, `unfollow()`, `is_member()`, `is_following()`, `get_role()`,
`list_members()`, `appoint_mod()`, `remove_mod()`, `remove_member()`
(mod/owner), `pin_post()`/`unpin_post()` (mod/owner), `discover()`
(search/sort, mirrors `Culture_Directory::handle_browse()`'s shape per the
project's established pagination/search convention), `get_hub_feed()`
(paginated `_hub_id`-filtered post query), `get_for_user()` (a user's
joined + followed Hubs).

### 5.2 REST endpoints (mirrored mobile JWT + web API-key)

| Mobile (`/mobile/hub/...`) | Web (`/hub/...`) | Purpose |
|---|---|---|
| `POST create` | `POST create` | Create a Hub |
| `GET discover` | `GET discover` | Search/browse/sort |
| `GET {id}` / `GET slug/{slug}` | same | Hub detail |
| `GET {id}/feed` | same | Paginated Hub-scoped post feed |
| `POST {id}/join` | same | Join |
| `POST {id}/leave` | same | Leave |
| `POST {id}/follow` | same | Follow |
| `POST {id}/unfollow` | same | Unfollow |
| `GET {id}/members` | same | Member list (paginated) |
| `POST {id}/mods` | same | Appoint a mod (owner-only) |
| `DELETE {id}/mods/{userId}` | same | Remove a mod (owner-only) |
| `DELETE {id}/members/{userId}` | same | Remove a member (mod/owner) |
| `POST {id}/pin` / `DELETE {id}/pin` | same | Pin/unpin a post (mod/owner) |
| `PATCH {id}` | same | Update name/desc/cover/allowed-templates (owner-only) |
| `DELETE {id}` | same | Archive (owner-only) |
| `GET my-hubs` | same | Joined + followed, for the "My Hubs" screen |

`handle_submit_post()` (both mobile and web submit paths) gains the `hub_id`
param handling described in §3.2 — this is an extension of the *existing*
submit endpoint, not a new one, consistent with how every other template
type is handled through the same single submission path.

---

## 6. Rewards, gamification & notifications

### 6.1 New action keys (via the `award_points()` bridge — never direct calls)

Per the "every action awards both credits and reputation" rule already
established repo-wide:

| Action key | Trigger | Notes |
|---|---|---|
| `hub_created` | `Culture_Hubs::create()` succeeds | Awarded once to the creator |
| `hub_post_published` | A post with `hub_id` set is created | Same award tier as an ordinary community post — a Hub post is not worth more/less than a regular post, this key exists only so Hub-specific analytics can be pulled later, not to create a new incentive tier |

No `hub_joined`/`hub_followed` reward — joining/following is a zero-effort
action and awarding credits for it would be gameable (join 50 Hubs for
credits). This mirrors the codebase's existing restraint around
reward-gaming (e.g. `community_like`/`quote_like` are deliberately small).

### 6.2 New badges

One new badge, added to the existing badge system (same process as any
other badge — do not invent a parallel mechanism):
- **"Hub Founder"** — created a Hub that reached 10 members. (Threshold
  check via a cron sweep or an inline check inside `join()` when
  `_hub_member_count` crosses 10 — inline check is simpler and avoids a new
  cron job; prefer that unless a later pass finds a reason not to.)

### 6.3 New notification types

Add to `Culture_Notifications::TYPES`: `hub_new_post` (fires to followers
with notification prefs enabled, and to members — same
`get_post_notify_follower_ids()`-style opt-in pattern as the existing Follow
system's `notify_posts`, reused here rather than reinvented), `hub_mod_appointed`,
`hub_post_removed` (to the post's author, when a mod/owner removes their
post — transparency, not silent moderation), `hub_member_removed` (to the
removed member). Icon-map entries required across all three frontend files
per the existing "no shared source of truth for icons across the PHP/TS
boundary" caveat already documented in CLAUDE.md for every prior
notification-type addition.

### 6.4 Notify-on-new-post opt-in

Following a Hub does **not** default to notifications-on — same
opt-in-by-default-off posture as the existing Follow system's `notify_posts`
flag (a follow itself is silent; the user must additionally opt into
per-post notifications). Store this as a `notify_posts`-equivalent column
on `wp_culture_hub_follows` (add it directly to the table in §1.3, don't
treat it as a v2 addition — cheaper to include now than migrate later).

---

## 7. Moderation

### 7.1 Hub-level moderation (owner/mod tools, §4.4)
Pin/unpin, remove post, remove member, appoint/remove mod (owner only) —
all covered in §5.1's method list. This is **Hub-scoped** moderation, a
different concern from:

### 7.2 Platform-level moderation (unchanged, reused as-is)
The existing report/blocklist system (`packages/utils/spam-protection.ts`,
the report-count-auto-pending mechanism on `FeedCard.tsx`) applies to Hub
posts exactly as it does to any other community post — **no changes
needed**. A post that hits the existing 3-unique-reports threshold gets
moved to `pending` regardless of whether it has a `_hub_id`. Do not build a
parallel Hub-specific report system — the existing one is source-agnostic
already (operates on `culture_post` generically).

### 7.3 What happens to posts when a Hub is archived
They remain visible (read-only) inside the archived Hub's feed — same
no-hard-delete, read-only-history posture as Stoop's archived clusters.
New posts/comments are rejected server-side once `_hub_status = archived`
(same enforcement point as §3.2 step 1).

---

## 8. Open items deliberately deferred (not blockers, just not v1)

- Invite-only / private Hubs (approval-gated join) — v1 is public-join-only,
  same as every other joinable structure in this codebase to date.
- Owner transferring ownership before leaving (currently: an owner simply
  cannot leave their own Hub in v1 — they must archive it instead; a
  transfer-ownership flow is a reasonable v2 addition once real usage shows
  whether this is actually needed).
- Hub-level analytics dashboard for owners (post/member growth over time) —
  the denormalized counters (§1.1) are enough for v1's own UI needs; a
  dedicated analytics view is a natural `member/analytics`-style follow-up,
  not required at launch.
- Algorithmic "Hubs you might like" discovery (§0's exclusion list).
- Cross-posting, nested Hubs, Hub monetization (§0's exclusion list).

---

## 9. Implementation order (phases — build strictly in this order)

**Phase 1 — Data model & core membership. DONE.** `culture_hub` CPT + meta
(`class-culture-post-types.php`). `wp_culture_hub_members` +
`wp_culture_hub_follows` tables (`CULTURE_VERSION` bumped to `2.8.0`,
`class-culture-hubs.php`, wired into `Culture_Activator::create_tables()`).
`Culture_Hubs` core class: `create`, `get_hub`, `get_hub_by_slug`, `join`,
`leave`, `follow`, `unfollow`, `is_member`, `is_following`, `get_role`,
`get_status`, `discover`, `get_for_user`. Mirrored REST endpoints (mobile
`/mobile/hub/*` in `class-culture-mobile-api.php` + web `/hub/*` in
`class-culture-rest-api.php`) for all of the above, plus matching Next.js
proxy routes (`apps/connect/app/api/hub/**`). Web: `/hub` browse screen
(`HubDiscoverClient.tsx` — search/sort/My Hubs), `/hub/create`
(`CreateHubClient.tsx` — single-step form with allowed-template picker),
`/hub/[slug]` (`HubActions.tsx` — join/leave/follow/unfollow; feed section is
a placeholder, posting is Phase 2). Mobile: `HubsScreen`, `HubCreateScreen`,
`HubDetailScreen` (same shape, registered in `ConnectStack` +
`AppParamList`). **Feed header icon swap** (§4.2) also done — see that
section for the corrected mobile/web split (web has no Reload icon; Hub +
Stoop icons landed in the global `ConnectHeader` instead) and the new
`/connect/stoop` + `StoopHomeScreen` entry points this required.
**Follow-up pass (also done) — closed all three previously-deferred items:**
- **Cover image upload** — the field was switched from a WP-attachment-ID
  concept (`_hub_cover_image_id`, int) to a directly-stored R2 URL
  (`_hub_cover_image_url`, string), matching the codebase's actual
  established convention for user-generated images (avatar, cover photo,
  community post images all store a URL, never a WP attachment ID — see
  "Mobile image uploads → Cloudflare R2" elsewhere in this file). Both the
  web creation form (`CreateHubClient.tsx`) and mobile
  (`HubCreateScreen.tsx`) now have a real image picker that uploads through
  the existing generic `/api/community/upload-image` (web) /
  `/mobile/community/upload-image` (mobile) R2 endpoints and submits the
  returned URL as `cover_image_url`. Cover images now render on the browse
  grid (`HubDiscoverClient.tsx`) and the Hub detail hero on both platforms.
- **Owner management UI** — added `Culture_Hubs::update()` (name/
  description/cover/allowed-templates, owner-only) and `::archive()`
  (owner-only, flips `_hub_status` to `archived`, never hard-deletes) to the
  core class, plus mirrored `PATCH /hub/{id}` / `DELETE /hub/{id}` routes on
  both REST surfaces. Web: `HubManage.tsx`, a collapsible "Manage Hub →"
  panel on `/hub/[slug]`, visible only when `status.role === "owner"`. Mobile:
  the same panel built inline into `HubDetailScreen.tsx` (no separate screen
  — kept the file count down since the form is small). Both disable editing
  and hide the archive action once a Hub is already archived; both surfaces
  also now show an "This Hub is archived" banner when `status === "archived"`.
- **Trending sort — reviewed, no bug found.** `Culture_Hubs::discover()`'s
  `trending` branch counts `culture_post` rows with a matching `_hub_id` in
  the last 7 days — correct, and intentionally returns `0` for every Hub
  until Phase 2 adds `_hub_id` to `culture_post` (expected, not a bug). The
  sort re-ranks only *within* the already-paginated `$hubs` slice (same for
  `popular`) — this is a real page-boundary limitation (page 2's "most
  popular" isn't guaranteed to rank below page 1's), but it's not a
  regression: `Culture_Clusters::discover()`'s `nearest_capacity` sort has
  the exact same limitation today, unfixed. Matching existing precedent
  rather than fixing only this one call site was the deliberate call here;
  revisit both together if it ever becomes a real problem.

None of the above blocks Phase 2.

**Phase 2 — Posting into a Hub.** `_hub_id` meta on `culture_post`, surfaced
as `hubId` on `FeedItem` (§1.4). `SubmitPost.tsx`/`NewPostScreen.tsx` gain
the Hub-scoped composer entry point (§3.1). Server-side enforcement in both
submit paths (§3.2). `get_hub_feed()` + the actual Hub feed UI going live
(comments already work for free via the existing `CommentSection`/
`CommentThread`). **For You feed inclusion** (§4.5): `followedOrJoinedHubIds`
threaded into `scoreItem()`/`rankFeed()` on both platforms, Hub posts
filtered out of For You entirely unless the viewer follows/is a member of
that Hub; default newest-first feed unaffected.

**Phase 3 — Moderation.** Mod appointment/removal, pin/unpin, remove
post/member (§7.1). "Manage Hub" screen (owner) + lighter "Moderate"
affordance (mod).

**Phase 4 — Rewards & notifications.** `hub_created`/`hub_post_published`
action keys, "Hub Founder" badge, the four new notification types (§6.3),
notify-on-new-post opt-in wiring.

**Phase 5 — Polish.** Archive flow (§5.4/§7.3), Trending sort on Discovery
(§4.2's recent-activity proxy), "My Hubs" screen refinements.

Do not begin Phase 2 until Phase 1 is fully shipped and confirmed working
end-to-end (create → join → follow → discover) on both platforms — same
build discipline Stoop's own doc enforced.
