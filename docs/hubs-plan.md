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
| `_hub_cover_image_url` | string | **Revised from the original int/attachment-ID spec.** Directly-stored R2 URL, matching the codebase's actual convention for user-generated images (avatar, cover photo, community post images all store a URL, never a WP attachment ID). Falls back to a generated placeholder (initials on a deterministic color, same idea as avatar fallbacks elsewhere) when empty |
| `_hub_creator_id` | int | WP user ID. Immutable |
| `_hub_status` | string enum | `active` \| `archived` — no `forming` state (unlike Stoop, a Hub is public and joinable the instant it's created — there's no activation threshold to gate on) |
| `_hub_allowed_templates` | JSON array | Subset of the 9 templates in `Culture_Hubs::ALLOWED_TEMPLATES` (**revised — `quote` is excluded**, see the Phase 2 status note in §9: quotes are a separate CPT that can't carry `_hub_id`). Default on creation: `["post", "cultural-take"]` — the two templates with no reputation/tier gate (see §3.2), so a brand-new Hub always has *something* postable regardless of what the creator later restricts. `event` in a Hub context has no RSVP-capacity/organiser semantics beyond what `culture_post`'s existing event template already does — do not build Hub-specific event handling. |
| `_hub_member_count` | int | Denormalized counter, incremented/decremented on join/leave (same "avoid COUNT(*) on every read" rationale as any other denormalized count in this codebase — kept in sync inside `Culture_Hubs::join()`/`leave()`, not computed live) |
| `_hub_post_count` | int | Denormalized counter. **Implemented differently than originally planned**: rather than an explicit increment call inside each submit path, `Culture_Hubs::on_hub_id_meta_added()` hooks WordPress's own `added_post_meta` action for the `_hub_id` key — increments identically for both mobile's explicit `update_post_meta()` call and web's meta-on-insert via native REST, with no risk of either call site forgetting to increment. |
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

### 3.3 Default templates, and why `post`/`cultural-take` are always safe

**Revised during Phase 2 build** — the original version of this section
included `quote` as a third always-safe default; it was dropped once
implementation revealed quotes are a separate `culture_quote` CPT with their
own submission endpoint, entirely outside `handle_submit_post()`/
`community/submit`, so a quote can never carry `_hub_id`. See the Phase 2
status note in §9 for the full explanation.

`post`/`cultural-take` have no reputation/tier gate today (only `poll`/
`itinerary` require Taste Maker-or-Pro, and `event` requires Culture
Contributor-or-Pro). A new Hub defaults to allowing exactly those two so
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

**Phase 2 — Posting into a Hub. Core posting DONE; For You inclusion NOT
done yet (see below).**

- `_hub_id` registered on `culture_post` (`class-culture-post-types.php`),
  surfaced as `hubId` on both platforms' feed-item mapping.
- **Deliberate scope correction vs. the original §1.1/§3.3 spec: "quote" is
  excluded from every Hub's postable templates.** Quotes are a separate
  `culture_quote` CPT — both composers submit them through a wholly
  different endpoint (`/api/quotes/create` web, `/mobile/community/quote`
  mobile), never through `handle_submit_post()`/`community/submit`, so a
  quote can never actually carry `_hub_id`. Offering "Quote" in a Hub's
  template picker would have silently created quotes that never appeared in
  that Hub's feed. `Culture_Hubs::ALLOWED_TEMPLATES` now has 9 entries (not
  10) and `DEFAULT_ALLOWED_TEMPLATES` is `['post', 'cultural-take']` (not
  three). Every "what can members post" picker (web ×2, mobile ×2) had its
  Quote chip removed to match. Revisit only if `culture_quote` ever gets its
  own Hub-linkage plumbing — out of scope for now.
- **Server-side enforcement**, both submit paths, mirrored per the plan:
  `handle_submit_post()` (mobile) validates Hub exists/active/member/
  allowed-template *before* the insert, then sets `_hub_id` after.
  `apps/connect/app/api/community/submit/route.ts` (web — bypasses PHP
  entirely per its pre-existing architecture) re-implements the identical
  check via the already-built `GET /hub/{id}` + `GET /hub/{id}/status`
  endpoints, then includes `_hub_id` in the WP REST meta payload.
- **`_hub_post_count` increment**: not called explicitly from either submit
  path — instead `Culture_Hubs::on_hub_id_meta_added()` hooks WordPress's
  own `added_post_meta` action for the `_hub_id` key, so both submit paths
  (mobile's explicit `update_post_meta()` call and web's meta-on-insert via
  native REST) increment it identically without either one needing to
  remember to call a helper.
- **Main-feed exclusion**: mobile's `get_community_feed_items()` excludes
  `_hub_id`-tagged posts via `post__not_in` (raw-SQL resolved, same pattern
  as the documented `meta_query` gotcha's fix). Web's equivalent is a new
  `rest_culture_post_query` filter, `Culture_Post_Types::exclude_hub_posts()`
  — applies only to the default *listing* query; a `?slug=`/`?include=`
  lookup (the `/community/{slug}` permalink page, notification deep links)
  is left untouched so a Hub post's own permalink still resolves, per §4.5's
  original "no changes needed there" note.
- **`get_hub_feed_items()`**: added as a `public static` method on
  `Culture_Mobile_API` (was `format_community_feed_item()`, now also public)
  rather than duplicated into `Culture_Hubs` — reuses the exact same
  field-mapping function the main feed and single-post deep-link lookup
  already use, so a Hub post renders identically everywhere. Web's
  `GET /hub/{id}/feed` handler in `class-culture-rest-api.php` calls this
  cross-class, same established pattern as `Culture_Mobile_API::toggle_reaction()`
  being called from the web REST class today.
- **Composer**: `SubmitPost.tsx` gained `hubId`/`hubAllowedTemplates` props —
  filters the template bar to only allowed templates (absent, not dimmed),
  hides the section-tag picker per §1.4's recommendation, includes `hub_id`
  in every submission. Mobile's `TemplatePickerSheet` gained an `allowedIds`
  filter prop; `NewPostScreen.tsx` reads `hubId`/`hubSlug`/
  `hubAllowedTemplates` route params, defaults to the Hub's first allowed
  template, includes `hub_id` in the submit body, and navigates back to the
  Hub (not the main feed) on success.
- **Hub feed UI**: web's `/hub/[slug]` page renders a real `HubFeed.tsx`
  client component (fetch + `FeedCard.tsx` reuse — the PHP response's field
  names already match the web `FeedItem` shape closely enough to be a
  passthrough cast, not a real transform) with an inline composer toggle for
  members. Mobile's `HubDetailScreen` fetches the same endpoint and renders
  `FeedItemCard` directly, with a "+ New post" button for members and a
  `useFocusEffect` refresh so returning from the composer shows the new
  post. Comments work for free via the existing `CommentSection`/
  `CommentThread` on both platforms, unchanged, confirmed during Phase 1
  research.
- **For You feed inclusion (§4.5) — DONE, follow-up pass.** Implemented as a
  dedicated candidate-pool fetch rather than folding Hub posts into the
  default feed query, to honor §4.5's "default newest-first feed unaffected"
  rule without touching `get_community_feed_items()`/`getCommunityPosts()`:
  - New `Culture_Mobile_API::get_hub_candidate_items( $hub_ids, $limit,
    $viewer_id )` — a `WP_Query` with a single `meta_query` `IN` clause
    against `_hub_id` (not the OR-branch/`NOT EXISTS` pattern the
    `meta_query` gotcha warns about — a single `IN` condition is fine),
    reusing `format_community_feed_item()` so results render identically to
    every other feed item. Exposed as `GET /mobile/hub/for-you-candidates`
    and `GET /hub/for-you-candidates` (mirrored, same convention as every
    other Hub endpoint), plus a new `apps/connect/app/api/hub/for-you-candidates`
    proxy route.
  - `rankFeed()` (both `packages/utils/feed-recommendations.ts` and
    `apps/mobile/src/features/community/useFeedRecommendations.ts`) gained a
    `followedOrJoinedHubIds?: Set<number>` 6th param — filters candidates
    *before* scoring (`item.hubId == null || followedOrJoinedHubIds.has(item.hubId)`),
    matching the "opt-in visibility, not a lower score" rule exactly.
    `scoreItem()` itself is unchanged — no extra boost for Hub posts, per
    the plan.
  - `PulseFeed.tsx` (web) and `ConnectFeedScreen.tsx` (mobile): both now
    fetch `my-hubs` (joined + followed → `Set<number>`) and the candidate
    pool *only when For You is toggled on* (not on every feed load, since
    it's otherwise unused), merge the candidates into the ranking input
    (filtered through `isEventItem()` first, same as every other feed
    source — events stay Spotlight-carousel-only), and pass the hub-ids set
    into `rankFeed()`. The non-For-You/newest-first path is completely
    untouched — it never sees `hubCandidateItems` at all.
  - `hubId` added to the web `FeedItem` type (`packages/shared/lib/unified-feed.ts`)
    and mobile `FeedItem` type (`apps/mobile/src/types/index.ts`) — present
    only on items returned by the new candidate-pool fetch, never on the
    default main-feed fetch (which still excludes Hub posts server-side, per
    Phase 2's existing exclusion).
  - Verified via `tsc --noEmit` (clean on `apps/connect`/`apps/site`; mobile
    shows only its documented pre-existing JSX/type-mismatch noise, cross-
    checked via `git stash` diff same as every other pass in this doc) and
    `php -l` on both touched REST classes.

Phase 2 is now fully closed — posting, feed display, and For You inclusion
are all live on both platforms.

**Phase 3 — Moderation. DONE.**

- `Culture_Hubs` gained `list_members()`, `appoint_mod()`, `remove_mod()`,
  `remove_member()`, `pin_post()`, `unpin_post()`, and `remove_post()` (this
  last one wasn't in §5.1's original method list but is required by §7.1's
  own "remove post" tool — added during implementation). All enforce
  role hierarchy in PHP, not just the UI: owner-only for appoint/remove-mod
  and archive; mod-or-owner for pin/unpin/remove-post/remove-member; a mod
  can never remove another mod or the owner (owner-only escalation).
- `_hub_pinned_post_id` added to the CPT meta (one pinned post max, per
  §4.4) — `Culture_Mobile_API::get_hub_feed_items()` fetches and prepends it
  on page 1 only (excluded from the main paginated query via `post__not_in`
  so it doesn't also show up twice in date order), tagging it `isPinned:
  true` in the response.
- Mirrored REST endpoints on both surfaces: `GET {id}/members`, `POST
  {id}/mods`, `DELETE {id}/mods/{userId}`, `DELETE {id}/members/{userId}`,
  `POST`/`DELETE {id}/pin`, and `POST {id}/remove-post` (the one endpoint
  not in the original §5.2 table, added alongside the method above) — plus
  matching Next.js proxy routes.
- Three new notification types — `hub_mod_appointed`, `hub_post_removed`,
  `hub_member_removed` — added to `Culture_Notifications::TYPES` and wired
  through `appoint_mod()`/`remove_member()`/`remove_post()` directly (no
  intermediate hook, same direct-mutation pattern as `perk_redeemed`).
  Icon-map entries added to all three frontend files
  (`NotificationBell.tsx`, web `NotificationsClient.tsx`, mobile
  `NotificationsScreen.tsx`) plus web's `NotificationPreferences.tsx` toggle
  list — per the existing "no shared source of truth across the PHP/TS
  boundary" caveat, confirmed once again to also apply to the pre-existing
  `cluster_*` types, which turned out to already be missing from several of
  these same lists (a pre-existing gap, not something this pass introduced,
  left alone except where fixing it was free — e.g. mobile's
  `NotificationType` union needed the `cluster_*` variants added anyway to
  stop a real type error, so they were included at that point).
  `hub_new_post` (the fourth type from §6.3) is deliberately deferred to
  Phase 4, since it's a rewards/notify-on-post feature, not a moderation
  action.
- Web: `HubManage.tsx` now takes a `role: "owner" | "mod"` prop — owners get
  the full name/description/cover/allowed-templates/archive tools (Phase
  1/1.5's build) plus a members list with appoint/remove-mod and remove-
  member; mods get only the members list with remove-member (no appoint/
  remove-mod, no archive, no hub-info editing). `HubFeed.tsx` renders a
  Pin/Unpin + Remove control under each post for mods/owners, and a "📌
  Pinned" label above the pinned post.
- Mobile: `HubDetailScreen.tsx`'s inline manage panel follows the identical
  owner-vs-mod gating, plus the same pin/remove-post controls on each
  `FeedItemCard` in the Hub feed. Notification taps for the three new types
  fetch the Hub by id (for its slug) and navigate to `HubDetail` — added to
  `openNotification()`'s switch, mirroring the existing `cluster_*` case.
- Verified via `tsc --noEmit` (clean on `apps/connect`/`apps/site`; mobile
  shows only its documented pre-existing JSX/type-mismatch noise) and
  `php -l` on all touched PHP files.

**Phase 4 — Rewards & notifications. DONE.**

- `hub_created` (20 pts / 5 credits) and `hub_post_published` (10 pts /
  2 credits) added to `Culture_Gamification::POINTS`/`CREDIT_BONUSES` and
  routed exclusively through `award_points()`, per §6.1 — no direct
  `award_reputation()`/`award_credits()` calls. `hub_post_published` is
  awarded at exactly the same tier as an ordinary `community_post` (not a
  new incentive tier) — it exists purely so Hub-specific analytics can be
  segmented later; `handle_submit_post()`'s single award call site now
  branches on `$hub_id` to pick between the two keys instead of always
  awarding `community_post`. No `hub_joined`/`hub_followed` reward was
  added, per the plan's explicit anti-gaming note.
- New "Hub Founder" badge (`hub_founder`, trigger `hub_max_members`,
  threshold 10) — awarded when a Hub the user **owns** reaches 10 active
  members. Implementation deviates slightly from a literal reading of
  §6.2: `award_reputation()`'s automatic `evaluate_badges()` call only
  evaluates the reputation-earner (the *joiner*, on a Hub join), not the
  Hub *owner* — so `Culture_Hubs::join()` now calls
  `Culture_Gamification::evaluate_badges( $creator_id )` explicitly right
  after the member-count update, and a new
  `Culture_Hubs::get_max_owned_hub_member_count( $user_id )` helper (not
  named in the original plan) computes the trigger value as the max
  member-count across every Hub the user owns, via a single raw-SQL
  subquery — consistent with this codebase's raw-SQL-for-reads convention.
- Fourth notification type `hub_new_post` added to
  `Culture_Notifications::TYPES` (deferred from Phase 3 per that phase's
  own note). `Culture_Hubs::notify_followers_of_hub_post()` /
  `get_post_notify_follower_ids()` mirror the Follow system's
  `notify_followers_of_post()` sync-batch-then-cron-offload pattern exactly
  (`SYNC_NOTIFY_BATCH = 200`, remainder scheduled via
  `wp_schedule_single_event()` on a new `culture_notify_hub_followers_batch`
  cron hook) — only followers with `notify_posts = 1` on
  `wp_culture_hub_follows` are notified, per §6.3/§6.4's opt-in requirement.
  Mobile's `handle_submit_post()` calls this directly (it already runs
  through PHP). The web submit route
  (`apps/connect/app/api/community/submit/route.ts`) bypasses PHP entirely
  for post creation (native `wp/v2/community-posts` + Basic Auth) — this was
  first patched with a dedicated `POST /hub/{id}/notify-new-post` endpoint
  called fire-and-forget after a successful create, but that approach was
  replaced (see the "web gamification/notification gap" bullet below) with
  a single fix at the actual architectural seam: `Culture_REST_API` already
  registers a `rest_after_insert_culture_post` hook
  (`handle_community_post_created`) that fires for **every** REST-created
  `culture_post`, regardless of which route created it — since it hooks on
  post type, not on REST base, it fires just the same for
  `wp/v2/community-posts` (the web composer's create call) as for any other
  REST path. That hook now also calls
  `Culture_Hubs::notify_followers_of_hub_post()` when `_hub_id` postmeta is
  present, so the dedicated notify-new-post endpoint became redundant and
  was removed.
  Icon-map entries for `hub_new_post` added to all three frontend files
  (`NotificationBell.tsx`, web `NotificationsClient.tsx`, mobile
  `NotificationsScreen.tsx`'s `getTypeMeta()` + a new `openNotification()`
  switch case reusing the existing Hub-fetch-then-navigate branch) plus web
  `NotificationPreferences.tsx`'s toggle list, and mobile's
  `NotificationType` union in `types/index.ts` — same "no shared source of
  truth across the PHP/TS boundary" rollout as every other notification
  type in this codebase.
- §6.4 opt-in UI: `Culture_Hubs::get_status()` now returns a `notifyPosts`
  field (backed by a new `get_notify_posts()` helper reading the
  `notify_posts` column) alongside `isMember`/`role`/`isFollowing` — the
  single source both platforms hydrate their toggle from. Web:
  `HubActions.tsx` gained a "Notify me when they post" checkbox (visible
  only while following), calling the existing `follow` endpoint again with
  an updated `notify_posts` value (the PHP `follow()` method already
  upserts `notify_posts` on a repeat follow of an existing row, so no new
  endpoint was needed) — unfollowing also resets local `notifyPosts` state
  to false. Mobile: `HubDetailScreen.tsx` gained the identical checkbox row,
  styled to match the pre-existing `MemberProfileScreen.tsx` Follow-system
  "Notify me when they post" row (`Ionicons` checkbox/square-outline,
  ochre-when-on) rather than inventing new visual language for the same
  concept. Following a Hub still defaults `notify_posts` to off in both
  UIs, matching the platform-wide Follow system's opt-in-by-default-off
  posture.
- **Web gamification/notification gap — found and fixed, corrected from an
  earlier, wrong "confirmed but out of scope" note.** A first pass of this
  phase claimed web-created posts never earn gamification points at all,
  since `apps/connect/app/api/community/submit/route.ts` never calls PHP
  gamification logic directly. That claim was wrong — closer investigation
  found `Culture_REST_API::handle_community_post_created()`, hooked on
  `rest_after_insert_culture_post` (unrelated in name only to this phase's
  own `Culture_Hubs` work — it's an older, pre-existing hook), already
  awards `community_post` reputation/credits and sends @mention
  notifications for **any** REST-created `culture_post`, including
  web-composer posts, since the hook fires on post type rather than on
  which REST route/base handled the request. So gamification and mentions
  were never actually broken for web. What genuinely *was* missing, and is
  now fixed in that same hook:
  - It always awarded the `community_post` key, even for Hub posts — now
    branches on `_hub_id` postmeta to award `hub_post_published` instead,
    matching mobile's behavior and unlocking the intended Hub-analytics
    segmentation for web-created Hub posts too.
  - It never wrote `community_author_rep_tier` postmeta — meaning
    web-authored posts were silently invisible to the Phase 8b feed
    ranking's reputation boost (`authorRepTier`-gated) since that field was
    simply never set. Now written on every award, mirroring
    `handle_submit_post()`.
  - It never called `Culture_Follows::notify_followers_of_post()` — authors'
    opted-in followers were never notified about web-created posts at all
    (mobile-created posts always triggered this). Now called unconditionally
    after the award.
  - It never called `Culture_Hubs::notify_followers_of_hub_post()` — now
    called when `_hub_id` is present, replacing the standalone
    notify-new-post endpoint described above.
  Net effect: web- and mobile-created posts now trigger byte-for-byte the
  same downstream side effects, with zero extra network round-trips added
  to the Next.js submit route (the fix lives entirely in the hook WordPress
  already runs on every REST post-create) — the old fire-and-forget
  `notify-new-post` fetch was removed from
  `apps/connect/app/api/community/submit/route.ts` since it's now
  redundant.
- Verified via `tsc --noEmit` (clean on `apps/connect`; mobile's error count
  is unchanged in kind from the pre-Phase-4 baseline — diffed line-number-
  stripped output against a `git stash` baseline to confirm no new error
  signatures were introduced, only the documented pre-existing JSX/type-
  mismatch noise) and `php -l` on all touched PHP files.

**Phase 5 — Polish.** Archive flow (§5.4/§7.3), Trending sort on Discovery
(§4.2's recent-activity proxy), "My Hubs" screen refinements.

Do not begin Phase 2 until Phase 1 is fully shipped and confirmed working
end-to-end (create → join → follow → discover) on both platforms — same
build discipline Stoop's own doc enforced.

---

## 10. Section/category integration — decided July 2026, not yet built

**Decisions already made (do not re-litigate without the user):** every value in
the existing `community_tag` enum (`SECTION_TAGS`/`TAGS` — Music, Fashion, Art,
Film, Food, Sport, Travel, Ideas, Literature, Design, Tech) gets a matching
**official Hub**. Posting with a Section set auto-links the post to that Hub.
Official Hubs are exempt from §4.5's main-feed exclusion; regular (user-created)
Hubs are not — that rule still exists specifically to protect the main feed from
unbounded long-tail Hub volume, and this change doesn't touch it.

This section was reached by first evaluating and rejecting a full Section↔Hub
merge (feed-visibility inversion, quotes having no `_hub_id` path, and no
sensible owner for a "Food" Hub were all real blockers), then reconsidering once
the user proposed relaxing the main-feed exclusion specifically for the
already-fixed, small set of official Hubs rather than Hubs in general — which
turns out to resolve all three blockers at once. Worth preserving that reasoning
here rather than presenting this as though it were the first idea considered.

### 10.1 Why this resolves the three original blockers

- **Feed visibility.** Official-Hub posts are exempt from exclusion, so nothing
  that shows in the main feed today stops showing there — every Section-tagged
  post already appears there, and that doesn't change. Regular Hubs keep the
  exclusion, so the dilution risk that rule exists for (arbitrary, unbounded
  user-created Hubs flooding a chronological feed) is unaffected — that risk was
  never about the fixed 11, only about long-tail volume.
- **Quotes.** Never actually a blocker once checked — quotes are already
  excluded from the Section picker entirely (`template !== "quote"` in the
  composer's tag-selector condition, `SubmitPost.tsx`). No plumbing needed.
- **Ownership.** Official Hubs are **platform-owned**, not created by or
  attributed to any member — same as the Section label itself has no owner
  today. Regular Hubs are unaffected: still member-created, still owner/mod
  moderation exactly as Phase 1–4 already shipped.

### 10.2 Mechanics

- `_hub_id` auto-set server-side whenever `community_tag` is set on a
  `culture_post` — both submit paths (mobile's `handle_submit_post()`, web's
  `apps/connect/app/api/community/submit/route.ts`) resolve the Section value to
  its matching official Hub ID and set both fields together. No new composer UI
  — this is transparent plumbing, not a decision the poster makes. Food Review's
  existing auto-set-to-"Food" behavior carries through unchanged (auto-links to
  the Food Hub the same as an explicitly-chosen Section would).
- A new lookup table/option mapping each of the 11 Section values to its
  official Hub ID — needs to exist before this can ship, since the 11 Hubs
  themselves don't exist yet (this is decided, not built — see §10.5).
- §1.4's exclusion logic (mobile's `post__not_in` resolution, web's
  `exclude_hub_posts()` `rest_culture_post_query` filter) gains an `is_official`
  check — only non-official `_hub_id` values get excluded. `culture_hub` needs a
  new `_hub_is_official` meta flag (bool) for this check to key off; the 11
  official Hubs are the only rows that ever get it set.
- **Auto-detected Section is a real edge case, flagged not resolved.**
  `detectTagFromContent()` can silently set `community_tag` from keyword
  scoring, not just an explicit user choice. Today that only adds a filter
  label; once it also determines Hub membership for the post, an
  off-topic-mention getting auto-tagged "Music" now also means it's published
  into the Music Hub's own feed, not just filterable as Music. Worth a second
  look before shipping — possibly fine as-is since total visibility is
  unchanged, but it's a bigger behavioral role for the same auto-detect than it
  had before.

### 10.3 Undefined / niche categories

Deliberately **not** solved by adding a free-text option to the Section field.
Section stays the fixed 11 values, no custom entries — a topic outside that list
is what **regular Hubs already exist for**: create or join one directly, with
the real community/ownership/discovery mechanics a text field can't offer. Same
shape as the composer's own "+ Other" custom-genre escape hatch (Book/Music/Film
Review's genre chips — see CLAUDE.md) — a fixed list for the fast path, a real
escape valve for everything else, deliberately not two overlapping mechanisms
solving the same problem.

### 10.4 Section-filter view stays separate from the Hub page

Filtering the main feed by a Section (e.g. "Music") is **not** changed into a
redirect to `/hub/music` — it stays exactly as it is today: a lightweight,
in-place filter, no navigation. What's added is a contextual **"Join the Music
Hub →"** prompt shown inline on that filtered view. Reasoning: filtering is a
fast, frequent, low-commitment action; the Hub page is a heavier destination
(member count, Join button, mod tools for mods). Content is now identical
either way (every Music post is Hub-linked), so there's no correctness reason to
force them together — only a UX cost, since every quick filter click would then
pay for chrome most people filtering don't want yet. Filter stays cheap, the
Hub stays one click away for anyone who wants the fuller experience.

Feed cards carrying an official `_hub_id` should show the Hub's badge (name,
Hub-specific styling) plus an inline **Join** button — both on the main feed and
in For You — giving the Reddit `r/community`-per-post treatment, now accurate
since these posts are genuinely Hub-linked rather than just labeled.

### 10.5 Migration

Existing posts predate this and won't have `_hub_id` set even though they
already carry a `community_tag`. Needs a one-time backfill matching historical
`community_tag` values to their new official Hub IDs — same shape as
`Culture_Subscribers::maybe_backfill_announcements()` (gated by a
`culture_hub_categories_backfilled`-style option so it runs exactly once).
Without this, the Music Hub would launch with zero history despite years of
Music-tagged posts already existing.

### 10.6 Status

**Decided, not built.** This is a new phase on top of the already-shipped
Phases 1–4 (§9) — the 11 official Hubs don't exist yet, the auto-link plumbing
doesn't exist yet, `_hub_is_official` doesn't exist yet, and the badge/Join
treatment on feed cards doesn't exist yet. Scope this as its own phase (Phase 6)
rather than folding it into Phase 5's polish list — it's new mechanics, not a
refinement of what's already there.
