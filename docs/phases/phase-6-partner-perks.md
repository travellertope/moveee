# Phase 6 — Partner Perks & Credits Redemption

## Goal

Build the dual-route liquidity loop: users spend Moveee Credits on partner
perks (0% fee, QR code redemption) or cash out (20–30% fee, admin-approved).
Partners are local businesses from the directory and/or vendor system that
accept credits. This is the revenue engine — Moveee earns CPA commission from
partners on every redemption.

---

## 1. Partner Infrastructure

### 1.1 Who Can Be a Partner

Three pathways into the partner programme:

1. **Directory entries** with `_is_partner: true` (set up in Phase 3)
2. **Vendors** with `_vendor_is_partner: true` (marketplace sellers)
3. **New partner-only businesses** — don't sell on the marketplace and may
   not have a directory entry yet. They get a directory entry created during
   partner onboarding.

### 1.2 Partner Onboarding

**Admin-side (initial launch):**
Partners are onboarded manually by the Moveee team. Admin creates or updates
a directory entry with partner fields:
- `_is_partner: true`
- `_partner_status: active`
- `_partner_business_name`
- `_partner_contact_email`
- `_partner_cpa_rate` (10–20%)
- `_partner_perks` — JSON array of available perks

**Self-service (future iteration):**
Partner application form at `/partner/apply` → admin approval queue.

### 1.3 Perk Definition

Each partner can offer 1–5 perks:

```json
{
  "id": "perk-uuid",
  "partner_directory_id": 789,
  "title": "£5 off a £20 spend",
  "credit_cost": 50,
  "min_spend": 2000,       // in minor currency (pence)
  "min_spend_display": "£20",
  "currency": "GBP",
  "expiry_days": 14,
  "max_redemptions_per_user": 2,
  "max_total_redemptions": 500,
  "status": "active"
}
```

Stored as a custom option or a dedicated DB table (see §2).

---

## 2. Data Model

### 2.1 Perks Table

**New table: `{prefix}culture_partner_perks`**

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint auto | Primary key |
| `partner_directory_id` | bigint | Linked directory entry |
| `partner_vendor_id` | bigint | Linked vendor user (if vendor-partner) |
| `title` | varchar(200) | Perk display name |
| `description` | text | Perk details |
| `credit_cost` | int | Cost in Moveee Credits |
| `min_spend` | int | Minimum spend at partner (minor currency) |
| `min_spend_currency` | varchar(3) | GBP, NGN, USD |
| `expiry_days` | int | Days until coupon expires (default 14) |
| `max_per_user` | int | Max redemptions per user (0 = unlimited) |
| `max_total` | int | Total pool (0 = unlimited) |
| `redeemed_count` | int | Running redemption counter |
| `status` | enum('active','paused','expired') | |
| `created_at` | datetime | |

### 2.2 Redemptions Table

**New table: `{prefix}culture_redemptions`**

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint auto | Primary key |
| `user_id` | bigint | Redeeming user |
| `perk_id` | bigint | Which perk (FK → partner_perks) |
| `type` | enum('perk','cashout') | Route A or Route B |
| `credits_spent` | int | Credits deducted |
| `fee_credits` | int | Fee deducted (0 for perks, 20–30% for cashout) |
| `qr_token` | varchar(64) | HMAC token for QR code verification |
| `qr_scanned` | bool | Whether the QR was scanned at partner |
| `status` | enum('active','used','expired','pending','approved','rejected') | |
| `expires_at` | datetime | Coupon expiry |
| `created_at` | datetime | |
| `approved_at` | datetime | For cashout: admin approval timestamp |
| `approved_by` | bigint | Admin user ID |

### 2.3 Cash-Out Requests (Route B)

Cash-out uses the same `culture_redemptions` table with `type: 'cashout'`:

| Additional columns | Type | Description |
|--------------------|------|-------------|
| `cashout_amount` | int | Amount in minor currency after fee |
| `cashout_currency` | varchar(3) | GBP, NGN, USD |
| `cashout_method` | varchar(50) | `bank_transfer`, `paystack`, `stripe` |
| `cashout_account_name` | varchar(200) | Account holder name |
| `cashout_account_ref` | varchar(200) | Account number / ref (encrypted) |

---

## 3. Route A — Partner Perk Redemption

### 3.1 Browse Perks

**New page: `app/connect/perks/page.tsx`** (replaces current sparse perks page)

```
┌──────────────────────────────────────────────┐
│  Moveee Perks                                 │
│  Spend your credits at partner venues         │
│                                               │
│  Your balance: 150 Credits                    │
│                                               │
│  [Filter: All | Food & Drink | Fashion |      │
│   Music | Wellness]                           │
│                                               │
│  ┌─ Perk Card ─────────────────────────────┐ │
│  │ [Partner logo/image]                     │ │
│  │ Nok by Alara · Nigerian Fine Dining     │ │
│  │ £5 off a £20 minimum spend              │ │
│  │ Cost: 50 credits · Expires in 14 days   │ │
│  │ [Redeem →]                              │ │
│  └──────────────────────────────────────────┘ │
│                                               │
│  ┌─ Perk Card ─────────────────────────────┐ │
│  │ ...                                      │ │
│  └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

### 3.2 Redeem Flow

1. User taps "Redeem" on a perk card.
2. Confirmation modal: "Spend 50 credits for '£5 off a £20 spend' at Nok by
   Alara? This coupon expires in 14 days."
3. On confirm: `POST /api/perks/redeem`
   - Deduct credits from user balance (via ledger).
   - Create redemption record with QR token.
   - Return QR code data.
4. Success screen shows QR code + coupon details.

### 3.3 QR Code Generation

The QR code encodes a verification URL:
```
https://themoveee.com/api/perks/verify?token=HMAC_TOKEN
```

The HMAC token is generated from:
```
HMAC-SHA256(redemption_id + user_id + perk_id + expiry, SECRET_KEY)
```

When scanned by the partner (or verified by Moveee admin), it validates the
token, marks the redemption as `used`, and shows confirmation.

### 3.4 My Coupons

**New page: `app/member/coupons/page.tsx`**

Shows the user's active, used, and expired coupons. Each active coupon
displays the QR code and countdown timer.

---

## 4. Route B — Direct Cash-Out

### 4.1 Cash-Out Flow

1. User navigates to `app/member/wallet/page.tsx` (new page).
2. Wallet shows: credit balance, transaction history, "Cash Out" button.
3. Cash-out form:
   - Amount (in credits, min 100)
   - Cash equivalent shown with fee: "100 credits = £7.50 after 25% fee"
   - Payment method: bank transfer details
4. Submit: `POST /api/wallet/cashout`
   - Credits deducted immediately.
   - Redemption created with `status: 'pending'`, `type: 'cashout'`.
   - 48-hour security hold starts.
   - Enters admin approval queue.

### 4.2 Fee Structure

| Credit amount | Fee % | User receives |
|---------------|-------|---------------|
| 100–499 | 30% | 70% equivalent |
| 500–999 | 25% | 75% equivalent |
| 1000+ | 20% | 80% equivalent |

Tiered to reward larger redemptions but still heavily favour Route A.

### 4.3 Admin Approval Queue

**WP Admin: Culture Community → Cash-Out Queue**

Displays pending cash-out requests with:
- User profile link
- Credit balance and earning history
- Account age
- Linked financial profiles (flag if multiple users share same bank details)
- Approve / Reject buttons
- Rejection reason field

On approval: Admin triggers manual payment (bank transfer, Paystack payout).
Status updated to `approved`, user notified via email.

On rejection: Credits refunded to user balance. Status updated to `rejected`.
User notified with reason.

### 4.4 Anti-Fraud Cross-Checks

Before showing the "Approve" button, the admin queue automatically checks:
- Are there other users with the same `cashout_account_ref`? (Flag)
- Has this user's account been flagged for suspicious activity?
- Is the account age < 30 days? (Warning)
- Has the user hit the daily credit cap every day for the past week? (Flag
  for potential farming)

These are informational flags — admin makes the final decision.

---

## 5. Credit-to-Currency Conversion

### 5.1 Exchange Rate

Admin-configurable in WP Settings → Culture Community → Credits tab:

| Setting | Default |
|---------|---------|
| Credits per £1 GBP | 10 |
| Credits per $1 USD | 10 |
| Credits per ₦1000 NGN | 10 |

Perks are priced in credits. Cash-out converts credits to local currency
using these rates minus the fee.

### 5.2 Perk Pricing

Partners define perks in local currency (e.g., "£5 off a £20 spend"). The
credit cost is calculated from the discount value:
- £5 discount × 10 credits/£ = 50 credits

---

## 6. Revenue Model for Moveee

### 6.1 Route A Revenue (Partner CPA)

When a perk is redeemed AND used (QR scanned):
- Moveee invoices the partner for CPA commission.
- CPA rate: 10–20% of the minimum spend (not the discount).
- Example: "£5 off a £20 spend" at 15% CPA = £3 commission to Moveee.

### 6.2 Route B Revenue (Cash-Out Fee)

The fee spread on cash-outs (20–30%) is retained by Moveee.
- 100 credits cashed out at 30% fee = Moveee retains 30 credits' worth.

### 6.3 Reporting

Admin dashboard tab: Credits Economy
- Total credits in circulation
- Credits redeemed (Route A vs Route B breakdown)
- CPA revenue generated (estimated from redemption × CPA rate)
- Fee revenue from cash-outs
- Top partners by redemption volume

---

## 7. API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/culture/v1/perks` | GET | List active perks (filterable by category, partner) |
| `/culture/v1/perks/redeem` | POST | Redeem a perk (deduct credits, generate QR) |
| `/culture/v1/perks/verify` | GET | Verify a QR token (partner-facing) |
| `/culture/v1/wallet/balance` | GET | User's credit balance + daily remaining |
| `/culture/v1/wallet/history` | GET | Transaction ledger for user |
| `/culture/v1/wallet/cashout` | POST | Request cash-out |
| `/culture/v1/admin/cashout-queue` | GET | Pending cash-outs (admin) |
| `/culture/v1/admin/cashout-approve` | POST | Approve cash-out (admin) |
| `/culture/v1/admin/cashout-reject` | POST | Reject cash-out (admin) |
| `/culture/v1/admin/perks` | POST/PUT/DELETE | CRUD perks (admin) |

Frontend proxies in `app/api/` for each.

---

## 8. Frontend Pages

| Page | Description |
|------|-------------|
| `app/connect/perks/page.tsx` | Browse & redeem partner perks (replaces current) |
| `app/member/wallet/page.tsx` | **New** — credit balance, history, cash-out |
| `app/member/coupons/page.tsx` | **New** — active/used/expired coupons with QR |
| `app/api/perks/redeem/route.ts` | **New** — redeem proxy |
| `app/api/perks/verify/route.ts` | **New** — QR verification |
| `app/api/wallet/balance/route.ts` | **New** — balance proxy |
| `app/api/wallet/history/route.ts` | **New** — history proxy |
| `app/api/wallet/cashout/route.ts` | **New** — cashout proxy |

---

## 9. Dependencies

- **Phase 2** (Credits/Reputation) — credits must exist as a spendable
  balance with the ledger table.
- **Phase 3** (Directory Knowledge Graph) — partner flag on directory entries.
- **Phase 7** (Passkeys) — passkey verification mandatory for cash-out and
  recommended for high-value perk redemptions.

---

## 10. Acceptance Criteria

- [ ] Partners manageable in WP Admin (create perks, set CPA rate)
- [ ] Perks browsable at `/connect/perks` with category filtering
- [ ] Perk redemption deducts credits and generates QR code
- [ ] QR code verifiable via URL scan
- [ ] Redeemed coupons visible in `/member/coupons`
- [ ] Coupons expire after configured days (default 14)
- [ ] Cash-out form at `/member/wallet` with fee calculation
- [ ] Cash-out enters 48hr admin queue
- [ ] Admin can approve/reject with anti-fraud flags visible
- [ ] Rejected cash-outs refund credits
- [ ] Transaction history shows all credit movements
- [ ] Credit economy dashboard in WP Admin
- [ ] Partner CPA reporting available
