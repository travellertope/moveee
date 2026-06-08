# Phase 7 — Passkeys & Credit Security

## Goal

Add WebAuthn passkey support as an optional security layer for all users and a
mandatory gate for credit redemption and cash-out. Passkeys bind accounts to
physical hardware, providing strong anti-Sybil protection without invasive
device fingerprinting or third-party SDKs.

---

## 1. What Passkeys Provide

- **Hardware binding**: Each passkey is tied to a specific device (phone, laptop,
  security key). One credential = one physical device.
- **Phishing resistance**: Passkeys are domain-bound and can't be replayed.
- **Multi-account deterrent**: If we enforce max 2 passkeys per device, users
  can't create unlimited accounts on the same hardware.
- **Seamless UX**: On modern devices, passkey auth is a fingerprint scan or
  Face ID prompt — faster than OTP.

---

## 2. Registration & Setup Flow

### 2.1 When Passkeys Are Offered

**Post-registration prompt (after email verification):**
After completing the registration flow (Phase 1 interests step + profile),
show a one-time prompt:

```
┌──────────────────────────────────────────────┐
│  Secure your account with a Passkey           │
│                                               │
│  Passkeys use your device's biometrics        │
│  (fingerprint, Face ID) for faster, safer     │
│  sign-in. Required to earn and spend Moveee   │
│  Credits.                                     │
│                                               │
│  [Set up Passkey]    [Maybe later]            │
└──────────────────────────────────────────────┘
```

"Maybe later" dismisses — the prompt appears again in member settings and
as a banner when the user first tries to redeem credits.

**In member settings:**
`/member/settings` → Security section → "Manage Passkeys"

### 2.2 Passkey Registration (WebAuthn)

**Client-side flow:**
1. User clicks "Set up Passkey".
2. Frontend calls `POST /api/auth/passkey/register-options` to get
   WebAuthn `PublicKeyCredentialCreationOptions`.
3. Browser triggers `navigator.credentials.create()` — user authenticates
   with biometrics.
4. Frontend sends the attestation response to
   `POST /api/auth/passkey/register-verify`.
5. Server validates and stores the credential.

**Libraries:**
- Backend: `@simplewebauthn/server` (Node.js) or a PHP WebAuthn library
  (e.g., `web-auth/webauthn-lib`)
- Frontend: `@simplewebauthn/browser`

Since the auth backend is WordPress (PHP), we'll use the PHP library in the
WordPress plugin. The Next.js API routes proxy to WordPress endpoints.

---

## 3. Data Model

### 3.1 Passkey Credentials Table

**New table: `{prefix}culture_passkeys`**

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint auto | Primary key |
| `user_id` | bigint | Owner |
| `credential_id` | varchar(512) | WebAuthn credential ID (base64url) |
| `public_key` | text | COSE public key (base64url) |
| `sign_count` | int | Signature counter (replay protection) |
| `device_name` | varchar(100) | User-assigned label ("My iPhone") |
| `aaguid` | varchar(36) | Authenticator Attestation GUID |
| `transports` | varchar(200) | JSON array of transport types |
| `created_at` | datetime | |
| `last_used_at` | datetime | |

### 3.2 Device Limiting

The `aaguid` field identifies the authenticator model. Combined with the
credential ID, we can enforce:

- **Max 2 unique user accounts per device**: Before completing registration,
  check if the `aaguid` + authenticator properties are already associated with
  2 other user accounts. If so, block with:
  "This device already has the maximum number of Moveee accounts."

This is a soft limit — determined users with multiple devices can work around
it, but it stops casual multi-accounting and bot farms.

### 3.3 User Meta

| Meta key | Type | Description |
|----------|------|-------------|
| `_culture_has_passkey` | bool | Whether user has at least one passkey |
| `_culture_passkey_count` | int | Number of registered passkeys |

---

## 4. Authentication with Passkeys

### 4.1 Sign-In with Passkey

Add a "Sign in with Passkey" option to the login page alongside the existing
username/password form.

**Flow:**
1. User clicks "Sign in with Passkey".
2. Frontend calls `POST /api/auth/passkey/login-options` (no username needed —
   discoverable credential).
3. Browser triggers `navigator.credentials.get()`.
4. Frontend sends assertion to `POST /api/auth/passkey/login-verify`.
5. Server validates, identifies user from credential ID, returns session.
6. NextAuth session created as normal.

### 4.2 Step-Up Authentication

For sensitive actions (credit redemption, cash-out, profile changes), require
a fresh passkey assertion even if the user is already logged in:

```
POST /api/auth/passkey/step-up
```

Returns a challenge. Frontend prompts biometric. Server validates and issues
a short-lived step-up token (5 minutes). The subsequent sensitive action
includes this token.

---

## 5. Credit Gates

### 5.1 What Requires a Passkey

| Action | Passkey required? |
|--------|-------------------|
| Browse feed, post, comment | No |
| Earn reputation | No |
| Earn credits (post validation threshold) | Yes — passkey must be set up |
| Browse perks | No |
| Redeem a partner perk | Yes — step-up auth |
| Cash-out credits | Yes — step-up auth |
| Change email or password | Yes — step-up auth (if passkey exists) |

### 5.2 Enforcement UI

**Credit earning gate:**
When a post crosses the validation threshold (5 upvotes / 3 comments) and
the author doesn't have a passkey:
- Credits are held in escrow (recorded in ledger as `status: 'held'`).
- Author sees a notification: "You've earned 10 credits! Set up a Passkey
  to claim them."
- Once passkey is set up, all held credits release to their balance.

**Redemption gate:**
When attempting to redeem a perk or cash out without a passkey:
- Block with inline prompt to set up passkey.
- If passkey exists but step-up auth fails, block the action.

---

## 6. Regional OTP Hybrid (PRD §2.2)

The PRD calls for SMS/WhatsApp OTP as part of anti-fraud. Passkeys are the
primary mechanism, but we add optional phone verification for regions where
passkey support is limited:

### 6.1 Phone Verification

**When offered:** During registration complete flow, after interests step,
before membership step. Optional but encouraged.

**Implementation:**
- UK/US: Twilio SMS OTP (6-digit code, 10-minute expiry)
- Nigeria/West Africa: WhatsApp Business API OTP (cheaper, more reliable)

**User meta:**
| Meta key | Type |
|----------|------|
| `_culture_phone_verified` | bool |
| `_culture_phone_number` | string (E.164 format) |
| `_culture_phone_verified_at` | datetime |

### 6.2 Verification Hierarchy

For credit redemption, the system checks (in order):
1. Passkey step-up auth → strongest, preferred
2. Phone OTP verification → acceptable fallback
3. Neither → blocked

For cash-out, passkey is mandatory (no phone-only fallback).

---

## 7. API Endpoints

### 7.1 WordPress (PHP)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/culture/v1/passkey/register-options` | POST | Generate WebAuthn creation options |
| `/culture/v1/passkey/register-verify` | POST | Validate attestation, store credential |
| `/culture/v1/passkey/login-options` | POST | Generate WebAuthn assertion options |
| `/culture/v1/passkey/login-verify` | POST | Validate assertion, return user session |
| `/culture/v1/passkey/step-up` | POST | Generate step-up challenge |
| `/culture/v1/passkey/step-up-verify` | POST | Validate step-up assertion |
| `/culture/v1/passkey/list` | GET | List user's registered passkeys |
| `/culture/v1/passkey/delete` | DELETE | Remove a passkey (requires step-up) |
| `/culture/v1/phone/send-otp` | POST | Send SMS/WhatsApp OTP |
| `/culture/v1/phone/verify-otp` | POST | Validate OTP code |

### 7.2 Next.js Proxies

Mirror each WP endpoint as `/api/auth/passkey/*` and `/api/auth/phone/*`.

---

## 8. Frontend Changes

| File / Page | Change |
|-------------|--------|
| `app/login/page.tsx` | Add "Sign in with Passkey" button |
| `app/register/complete/page.tsx` | Add passkey setup prompt + optional phone verify |
| `app/member/settings/page.tsx` | Security section: manage passkeys, phone number |
| `components/PasskeyPrompt.tsx` | **New** — reusable passkey setup/step-up modal |
| `components/PhoneVerify.tsx` | **New** — phone OTP input component |
| `app/connect/perks/page.tsx` | Step-up auth before redeem |
| `app/member/wallet/page.tsx` | Step-up auth before cash-out |
| `lib/auth.ts` | Add `hasPasskey`, `phoneVerified` to CultureUser |

---

## 9. PHP Dependencies

**WebAuthn library for WordPress:**

```
composer require web-auth/webauthn-lib
```

This provides:
- Attestation/assertion validation
- COSE key parsing
- AAGUID handling
- Transport detection

The library runs server-side in the WordPress plugin. No external service
dependency — all verification is local.

---

## 10. Dependencies

- **Phase 2** (Credits/Reputation) — passkeys gate credit earning and spending.
- **Phase 6** (Partner Perks) — step-up auth required for redemption and
  cash-out flows.
- Can be partially built in parallel: passkey registration/login can ship
  before the credit gates are wired up.

---

## 11. Acceptance Criteria

- [ ] Users can register a passkey from settings or post-registration prompt
- [ ] "Sign in with Passkey" works on login page
- [ ] Max 2 accounts per physical device enforced
- [ ] Passkey list visible in member settings (add, label, delete)
- [ ] Step-up auth works for perk redemption and cash-out
- [ ] Credits held in escrow until passkey is set up
- [ ] Phone OTP works via SMS (UK/US) and WhatsApp (Nigeria)
- [ ] Phone verification stored as user meta
- [ ] Passkey or phone required for credit redemption
- [ ] Passkey mandatory for cash-out (no phone fallback)
- [ ] `hasPasskey` and `phoneVerified` available in session
- [ ] Device limit prevents more than 2 accounts per authenticator
