# Phase 2 — Credits & Reputation Split

## Goal

Evolve the existing single `_culture_points` system into two distinct tracks:
**Moveee Credits** (spendable, daily-capped, earned mainly via validated posts)
and **Reputation** (permanent, cumulative, unlocks status and privileges). This
is the economic backbone for the partner perks system in Phase 6.

---

## 1. Data Model

### 1.1 User Meta (WordPress)

| Meta key | Type | Description |
|----------|------|-------------|
| `_culture_credits` | int | Spendable credit balance |
| `_culture_reputation` | int | Cumulative reputation score (never decreases) |
| `_culture_credits_earned_today` | int | Rolling 24hr credit counter |
| `_culture_credits_last_reset` | string (date) | Last date the daily counter reset |
| `_culture_points` | int | **Legacy** — frozen at current value, read-only |

### 1.2 Migration

On plugin update, run once:
```php
// For every user with _culture_points:
// - Copy value to _culture_reputation
// - Set _culture_credits to 0 (clean start for spendable credits)
// - Keep _culture_points as legacy (don't delete)
```

All existing points become reputation. Credits start fresh — this is
intentional because there's no redemption infrastructure yet (that's Phase 6),
so there's nothing to spend them on.

### 1.3 Transaction Ledger Table

**New table: `{prefix}culture_credit_ledger`**

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint, auto | Primary key |
| `user_id` | bigint | User |
| `type` | enum('credit','reputation','both') | Which track |
| `amount` | int | Positive = earn, negative = spend |
| `source` | varchar(50) | Action type (see §2) |
| `source_id` | bigint | Related post/event/user ID |
| `balance_after` | int | Balance after this transaction |
| `created_at` | datetime | Timestamp |

This gives us a full audit trail for anti-fraud checks (Phase 7) and the
admin verification queue (Phase 6).

---

## 2. Earning Rules

### 2.1 Reputation Earning (Primary Track)

These are the existing point values, now mapped to reputation:

| Action | Reputation | Credits | Notes |
|--------|------------|---------|-------|
| Event RSVP | +5 | +1 | |
| Event check-in | +15 | +2 | |
| Refer a member | +25 | +3 | |
| Newsletter comment | +10 | +1 | |
| Newsletter reaction | +2 | +0 | Too small for credits |
| Quote submission | +10 | +1 | |
| Quote like received | +1 | +0 | Too small |
| Magazine article read | +5 | +1 | Via FinishReading component |
| Magazine article share | +5 | +1 | |
| Directory entry submitted | +15 | +2 | New — for Hidden Gem flow |
| Game completed | +5 | +1 | Daily games |

### 2.2 Credit Earning via Posts (Validation Threshold)

This is the PRD's core "upvote-to-earn" mechanic:

**Rule:** A community post earns credits ONLY when it crosses a validation
threshold:
- **5 verified upvotes** (reactions from 5 distinct, non-flagged users), OR
- **3 unique comments** from 3 distinct verified users

**Payout on threshold:**
- +10 credits (one-time per post, recorded in ledger)
- +5 reputation

**Implementation hook:** In the reaction and comment API handlers, after
recording the reaction/comment, check if the post has crossed threshold.
If yes and no prior credit payout for this post exists in the ledger,
award credits to the post author.

```php
// Pseudo-logic in handle_community_react() and handle_community_comment():
$post_id = $request['post_id'];
$author_id = get_post_meta( $post_id, 'community_author_id', true );

// Count distinct reactors
$love  = (int) get_post_meta( $post_id, 'reaction_love', true );
$fire  = (int) get_post_meta( $post_id, 'reaction_fire', true );
$clap  = (int) get_post_meta( $post_id, 'reaction_clap', true );
$total_reactions = $love + $fire + $clap;

// Count distinct commenters
$comments = get_comments( array( 'post_id' => $post_id, 'count' => true ) );

$threshold_met = ( $total_reactions >= 5 ) || ( $comments >= 3 );

if ( $threshold_met ) {
    $already_paid = culture_ledger_has_entry( $author_id, 'post_validated', $post_id );
    if ( ! $already_paid ) {
        culture_award_credits( $author_id, 10, 'post_validated', $post_id );
        culture_award_reputation( $author_id, 5, 'post_validated', $post_id );
    }
}
```

### 2.3 Daily Credit Cap

**Default cap:** 50 credits per rolling 24-hour window.

On every credit award:
1. Check `_culture_credits_last_reset` — if date is before today, reset
   `_culture_credits_earned_today` to 0 and update the date.
2. If `_culture_credits_earned_today + amount > 50`, clamp to remaining
   allowance. If allowance is 0, skip credit award (reputation still awarded).
3. Update `_culture_credits_earned_today`.

**UI feedback:** When cap is hit, show in the member dashboard:
> "Daily credit limit reached. Keep posting to grow your Reputation Score!"

Reputation is NEVER capped.

---

## 3. Reputation Tiers & Privileges

| Reputation threshold | Title | Privileges |
|---------------------|-------|------------|
| 0–99 | Member | Base access |
| 100–499 | Culture Contributor | Profile badge |
| 500–1499 | Taste Maker | Profile badge + early event access |
| 1500+ | Culture Authority | Profile badge + early event access + featured in directory |

These tiers are cosmetic and access-gating only — no credit multipliers.
The badge system already exists (`MemberBadges.tsx`); we add these tier
badges alongside the existing achievement badges.

---

## 4. API Changes

### 4.1 Award Endpoint (Existing)

**File: `culture-community/includes/api/class-culture-rest-api.php`**
→ `handle_points_award()`

Rename internally to `handle_award()`. Accept new params:

```
POST /culture/v1/points/award
{
  "user_id": 123,
  "credits": 10,        // optional, default 0
  "reputation": 5,      // optional, default 0
  "source": "post_validated",
  "source_id": 456
}
```

Backwards-compatible: if only `points` is sent (legacy callers), map to
reputation only.

### 4.2 User Profile Endpoint

**File: `class-culture-rest-api.php` → `user_profile()`**

Add to response:
```json
{
  "credits": 150,
  "reputation": 1250,
  "reputation_tier": "taste-maker",
  "daily_credits_remaining": 35,
  "points": 800  // legacy, frozen
}
```

### 4.3 Frontend Proxy

**File: `app/api/points/award/route.ts`**

Update to pass `credits` and `reputation` fields through to the WP endpoint.

---

## 5. Frontend Changes

### 5.1 Member Dashboard

**File: `components/MemberDashboard.tsx`**

Current: Shows single "Culture Points" number.
New: Two-card layout:
- **Moveee Credits**: Current balance, "X remaining today" subtitle
- **Reputation Score**: Total score, tier badge label

### 5.2 Member Page

**File: `app/member/page.tsx`**

Update the "How to Earn Points" table to show both columns (credits +
reputation). Rename section to "How to Earn".

### 5.3 Auth Session

**File: `lib/auth.ts`**

Add to `CultureUser`:
```ts
credits: number;
reputation: number;
reputationTier: string;
dailyCreditsRemaining: number;
```

Keep `points` for backwards compatibility (maps to reputation).

---

## 6. Admin Dashboard

### 6.1 Analytics

**File: `culture-community/includes/admin/class-culture-analytics.php`**

Add to Community tab:
- Total credits in circulation
- Total credits earned today (across all users)
- Top 10 credit earners this week
- Daily cap hit rate (% of active users hitting the cap)

### 6.2 User Management

**File: `culture-community/includes/admin/class-culture-memberships.php`**

Add credits and reputation columns to the member list table.
Admin can manually adjust both via an edit form (logged in ledger as
`source: 'admin_adjustment'`).

---

## 7. Files Changed (Summary)

| File | Change |
|------|--------|
| `culture-community/culture-community.php` | Create `culture_credit_ledger` table on activation |
| `culture-community/includes/api/class-culture-rest-api.php` | Evolve award endpoint, update user_profile response |
| `culture-community/includes/core/class-culture-gamification.php` | Add credit/reputation helper functions, daily cap logic |
| `lib/auth.ts` | Add credits, reputation, reputationTier to CultureUser |
| `components/MemberDashboard.tsx` | Dual-card layout |
| `app/member/page.tsx` | Update earning table |
| `app/api/points/award/route.ts` | Pass credits + reputation fields |
| `components/pulse/FeedCard.tsx` | Threshold notification on own posts |

---

## 8. Dependencies

- **None for launch.** This phase is self-contained.
- Phase 6 (Partner Perks) depends on credits existing as a spendable balance.
- Phase 7 (Passkeys) depends on credits for the "mandatory for redemption"
  gate.

---

## 9. Acceptance Criteria

- [ ] Existing points migrated to reputation; credits start at 0
- [ ] Credit ledger table created with full transaction history
- [ ] Posts earn credits only after crossing 5-reaction or 3-comment threshold
- [ ] Daily credit cap of 50 enforced; reputation uncapped
- [ ] Member dashboard shows Credits and Reputation separately
- [ ] Reputation tier badges display on profile
- [ ] "Daily limit reached" message shown when cap hit
- [ ] Admin can view and manually adjust credits/reputation
- [ ] Legacy `points` field still returned in API for backwards compatibility
