# Reverted Changes: June 8–10 2026

Reverted on: 2026-06-10  
Reverted to: commit `6fb8df4` (last commit on June 7 2026)  
Backup branch: `backup/june-10-current` (contains all the code below)

To restore everything: `git reset --hard backup/june-10-current`

---

## Why this was reverted

The website started behaving erratically on June 9. The root cause was that
a large batch of new features added on June 8–9 introduced several performance
problems that overwhelmed the WordPress CMS:

- Pages with `force-dynamic` or `revalidate:0` were hitting WordPress live on
  every single visitor request — no caching at all
- `generateStaticParams` on community/pulse/magazine/edition pages was fetching
  ALL WordPress slugs on every Vercel deployment, firing hundreds of parallel
  pre-renders and exhausting all PHP-FPM workers
- The newsletter subscriber option was stored with `autoload=yes`, causing
  megabytes of subscriber data to be deserialised on every WordPress request
  (every GraphQL call, every REST call)
- `evaluate_badges()` ran up to 35 raw DB queries per credit award; under
  concurrent traffic this produced thousands of DB queries per second
- The NotificationBell component polled `/api/notifications/count` every 30s
  on every open browser tab — multiplied across hundreds of users this added
  significant continuous load
- Several broken GraphQL fields (`cultureAccesses`, `membershipSettings`,
  `adSettings`) were generating error responses on every page load

The June 9–10 commits were all attempts to fix these problems, but the
instability persisted. Reverting to the pre-June-8 state is the clean solution.

---

## React Native app — did it contribute?

**The RN app itself cannot crash the Next.js website** — it's a completely
separate process running on users' phones.

However, the June 8–10 batch included `class-culture-mobile-api.php`, a new
WordPress REST API file with its own `/culture/v1/mobile/*` endpoints. If the
mobile app was actively used while these endpoints were registered, the combined
load (mobile API calls + web frontend calls + broken generateStaticParams) would
have amplified the problem.

The mobile API file is also reverted. The RN app will fall back to its previous
endpoint calls.

---

## What was removed — full feature inventory

### 1. Notifications system (Phase 8a) — Next.js + WordPress

This is the biggest missing feature visible on the website.

**WordPress (`culture-community/`):**
- `class-culture-notifications.php` — new PHP class managing a
  `wp_culture_notifications` DB table (`id, user_id, type, title, body,
  action_url, meta, read_at, created_at`)
- Notification types: `credit_earned`, `badge_unlocked`, `perk_expiring`,
  `perk_redeemed`, `cashout_approved`, `cashout_rejected`, `escrow_released`,
  `comment_received`, `post_validated`, `system`
- Auto-fired on WP action hooks: credits awarded, badge awarded, new comment on
  a community post, cashout approved/rejected, escrow released, post validated
- Hourly WP-Cron job checking for perks expiring within 48h
- REST endpoints: `GET /culture/v1/notifications`, `GET /culture/v1/notifications/count`,
  `POST /culture/v1/notifications/read`

**Next.js (`app/` + `components/`):**
- `app/api/notifications/route.ts` — proxy to WP notifications endpoint
- `app/api/notifications/count/route.ts` — returns `{ unread: N }`
- `components/NotificationBell.tsx` — bell icon in site header; polls unread
  count every 30s; dropdown panel showing emoji + title + body + time-ago
- `app/member/notifications/page.tsx` — full notifications page with mark-read

---

### 2. "For You" feed recommendations (Phase 8b) — Next.js

**`lib/feed-recommendations.ts`** — pure TypeScript scoring library:
- `scoreItem(item, interestTagSet)` — 0–100 score (50pts interest match,
  30pts recency 3-day half-life, 20pts engagement log scale)
- `rankFeed(items, interestTagSet)` — sorted by score descending
- `getTrending(items, limit=5)` — highest engagement in last 7 days
- `matchesInterests(item, interestTagSet)` — boolean

**`components/pulse/PulseFeed.tsx`** changes:
- "For You" toggle button in feed header
- When active: re-ranks feed using user's saved interests
- Trending items shown in sidebar (desktop) and top of For You feed
- Falls back to recency sort if user has no saved interests

**`components/pulse/FeedCard.tsx`** changes:
- "✦ For You" badge on community cards that match user interests
- Ochre background, 9px mono uppercase

---

### 3. Member analytics dashboard (Phase 8c) — Next.js + WordPress

**WordPress:**
- `GET /culture/v1/member/analytics?user_id=X` — new REST endpoint returning:
  - `credit_days` (earned/spent per day, last 30 days)
  - `balance`, `reputation`, `posts_published`, `posts_pending`, `badge_count`
  - `top_posts` (ranked by reactions + comments, last 90 days)
  - `rep_months` (reputation earned per month)

**Next.js:**
- `app/api/member/analytics/route.ts` — proxy (adds API key server-side)
- `app/member/analytics/` — full analytics page with:
  - SVG bar chart: credits earned vs spent per day
  - SVG line chart: reputation earned per month
  - Top posts table ranked by engagement
  - Summary stats: balance, reputation, posts published, badge count
  - All charts are plain SVG — no external charting library

---

### 4. React Native app — Phase 8 (notifications, For You, analytics, QR)

**`moveee-connect/src/features/community/useFeedRecommendations.ts`:**
- Direct port of `lib/feed-recommendations.ts` for use in the RN app

**`screens/member/AnalyticsScreen.tsx`:**
- Bar/line charts using `react-native-svg` (matches web analytics page)
- No external charting library

**`components/community/NotificationBell` (RN):**
- Polls `/api/notifications/count` every 30s via `useNotificationCount` hook

**`screens/member/CouponsScreen.tsx`:**
- QR code rendering via `react-native-qrcode-svg`

**Dependencies added to RN:**
- `react-native-svg`
- `react-native-qrcode-svg`

---

### 5. React Native app — Events & Games screens

**`screens/events/EventsScreen.tsx`:**
- Lists WordPress `culture_event` CPT posts
- Filter strip by event category
- Event cards with date, location, admission

**`screens/events/EventDetailScreen.tsx`:**
- Full event detail: meta card, RSVP form → `/api/events/rsvp`

**`screens/games/TriviaGameScreen.tsx`:**
- Fully native daily trivia game
- ABCD option buttons, answer explanation reveal
- MMKV played-today gate (`trivia_last_played_date`)
- Score persisted in `trivia_last_score`

**`screens/games/WhoSaidItGameScreen.tsx`:**
- Fully native daily "who said it" quote game
- Tap-author options, review screen
- MMKV played-today gate (`wsi_last_played_date`)

**`screens/games/GamesScreen.tsx`:**
- Updated to navigate to TriviaGame + WhoSaidIt
- Crossword/Sudoku still shown but dimmed (not yet built)

---

### 6. React Native app — PasskeyManager (native WebAuthn)

**`screens/member/MemberSettingsScreen.tsx` — Security tab:**
- Full passkey registration via `react-native-passkeys`
- Delete passkey flow
- Calls `GET /api/auth/passkey/register-options` → `Passkeys.create()` →
  `POST /api/auth/passkey/register-verify`
- Auth store updated on success: `updateUser({ hasPasskey: true, passkeyCount })`
- Handles user-cancel from native prompt (returns `null`)
- Shows warning banner when `Passkeys.isSupported()` returns false (simulator,
  old OS)

---

### 7. React Native app — detail drawer modals

**`components/community/HappeningDetailModal` (RN):**
- Right-side slide-in drawer on Happening card tap
- Shows: event name, full dates, location, venue address, admission, organiser
  (linked to directory), description, "Get tickets" button

**`components/community/DirectoryDetailModal` (RN):**
- Drawer on Directory card tap
- Shows: name, type badge, excerpt, full body, "View full entry →" link

**`components/community/QuoteDetailModal` (RN):**
- Drawer on Quote card tap
- Large quote text, author, source, ReactionBar

**New FeedItem fields added (RN types):**
- `endDate`, `venueAddress`, `openingHours`, `admission`, `eventCategory`,
  `organiserName`, `organiserSlug`, `city` (all optional strings)

---

### 8. Mobile API layer (`class-culture-mobile-api.php`) — WordPress

New PHP file adding a full `/culture/v1/mobile/*` endpoint namespace for the
RN app, separate from the web API:

| Endpoint | Purpose |
|----------|---------|
| `GET /mobile/feed` | Unified feed with camelCase fields |
| `GET /mobile/community` | Community posts |
| `POST /mobile/community/react` | Reactions (includes pulse + quote types) |
| `POST /mobile/community/poll-vote` | Poll voting |
| `GET /mobile/user/me` | Authenticated user profile |
| `PUT /mobile/user/me` | Update profile (incl. directory fields, interests) |
| `GET /mobile/members` | Member directory (camelCase, Bearer token auth) |
| `GET/POST /mobile/newsletter-preferences` | Subscribe/unsubscribe |
| `POST /mobile/user/reset-password` | Send password reset email |
| `GET /mobile/events` | Events list |

All endpoints use Bearer token auth (not API key) so the RN app can call
WordPress directly without routing through the Next.js proxy.

**RN (`moveee-connect/src`):**
- `MOBILE_API` constant added to `src/api/client.ts`
- All community/feed/member/directory/settings screens switched from
  `CULTURE_API` to `MOBILE_API`

---

### 9. Performance fixes applied June 8–10 (also reverted)

These were hotfixes for the crashes — they're gone with the revert, but the
underlying features that caused the problems are also gone, so they shouldn't
be needed.

| Fix | What it addressed |
|-----|-------------------|
| Thundering herd mutex in proxy.ts | Multiple requests refreshing redirect cache simultaneously |
| Circuit breaker in `getWPData()` | Cascading failures when WP went down |
| Remove `generateStaticParams` from `[edition]` page | Vercel build timeout (3×60s WP calls) |
| `autoload=false` on newsletter subscribers option | MB of data deserialized on every WP request |
| `evaluate_badges()` 5-min transient gate | 35 DB queries per credit award |
| Batch SQL for `handle_get_members_directory` | N+1 meta queries (9 × 200 users) |
| Empty `generateStaticParams` on community/pulse/magazine | Mass parallel pre-renders crashing WP |
| Remove broken GraphQL fields (`cultureAccesses`, `membershipSettings`) | Wasted error responses on every load |
| Split `EVENT_FIELDS_FRAGMENT` for list vs detail | Corrupted record triggering 40–57s WP error |
| 15s timeout on newsletter REST fallback | ISR death loop on `/newsletter` page |
| NotificationBell: 60s poll, skip when tab hidden | Continuous load from all open tabs |
| Eliminate all `revalidate:0` / `force-dynamic` pages | Every visit hitting WP live |
| Fix header/footer unstyled on non-homepage routes | `homepage.css` only imported on some pages |
| ISR revalidate:300 on events/newsletter/journey pages | Were all `force-dynamic` |

---

## How to restore if needed

```bash
# See what's on the backup
git log backup/june-10-current --oneline | head -20

# Restore everything
git checkout claude/admiring-dirac-lgzivc
git reset --hard backup/june-10-current
git push -u origin claude/admiring-dirac-lgzivc --force
```

Or cherry-pick specific features (e.g. just notifications):
```bash
# Find the commit hash
git log backup/june-10-current --oneline --grep="notification"

# Cherry-pick it
git cherry-pick <hash>
```
