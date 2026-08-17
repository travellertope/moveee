# Google Play Store submission metadata — Moveee (Android)

Compiled from the current `apps/mobile` config and site legal pages. Text fields are
ready to paste into Play Console as-is. Everything under **"Blockers before you can
submit"** is a real gap, not boilerplate — read that section before starting the
submission.

---

## 1. App identity

| Field | Value |
|---|---|
| App name (in-app / marketing) | Moveee |
| Package name (`applicationId`) | `com.moveee.connect` — **fixed once uploaded, cannot change later** |
| Current version | `1.0.1` (`app.config.ts`) |
| Version code | Auto-incremented by EAS (`appVersionSource: "remote"` in `eas.json`) |
| Build type for production | Android App Bundle (`.aab`) — already configured in `eas.json`'s `production` profile |
| Default listing language | English (US or UK — pick one; the site defaults to en-GB copy) |
| Free or paid | Free (with in-app virtual economy — see Financial features below) |

---

## 2. Store listing copy

**App title** (30 char max, currently 26):
```
Moveee: Connect to Culture
```

**Short description** (80 char max, currently 79):
```
Post, discover, and earn — the social platform for people who live for culture.
```

**Full description** (4000 char max, currently ~1,850 — room to expand later):
```
Moveee is a community and discovery platform for people who live for culture — a place to post, discover, and earn for your taste.

WHAT YOU CAN DO ON MOVEEE

Pulse Feed
Share your take on the culture around you. Choose from post formats built for how you actually talk about culture: a Place recommendation, a Food Review, a Book, Music, or Film Review with real star-rated breakdowns, a Creative Showcase for your own work, a Poll, an Itinerary for a trip worth repeating, or a Quote worth sharing.

Discover
Browse a living directory of people, places, food, books, film, music, fashion, and ideas — search, filter by type and region, and sort by what's trending in the community right now.

Events & Stoop
Find happenings near you, RSVP, and check in. Stoop connects you with a small, area-level group of members who meet regularly — hosted, weekly, and built around real conversation.

Culture Games
Daily Trivia and Who Said It? test your culture knowledge; Sudoku and Crossword round out the puzzle lineup. Compete, learn, and keep a streak going.

Earn as You Go
Every post, comment, RSVP, and game you play earns Culture Credits and Reputation Points. Build reputation to unlock privileges — skip the new-member review queue, post polls and itineraries, and eventually get nominated for Culture Icon status. Redeem Culture Credits for partner perks, or cash them out.

Moveee Magazine
Long-form essays, interviews, and cultural commentary from Moveee's editorial team, built right into the app you're already in.

MEMBERSHIP

Moveee Citizen is free — post, discover, RSVP, play, and earn from day one.
Moveee Pro unlocks extras across the platform, including discounted shop pricing and expanded posting privileges.

Moveee is built for people who take culture seriously — not as a category, but as a way of paying attention. Join the community.
```

Copy checked against the brand-language rule in `CLAUDE.md` — universal "culture"
framing throughout, no African/Black/diaspora-specific scoping, no "worldwide"/"global"
qualifiers.

---

## 3. Graphics

| Asset | Spec | Status |
|---|---|---|
| App icon (Play Store listing) | 512×512 PNG, no alpha | **Done** — `mockups/store-assets/app-icon-512.png` (resized from `apps/mobile/assets/icon.png`) |
| Feature graphic | 1024×500 PNG/JPG, no alpha | **Done** — `mockups/store-assets/feature-graphic.png` (source: `feature-graphic.html` in the same folder, easy to tweak and re-render) |
| Phone screenshots | Min 2, max 8 · JPEG/PNG · 16:9 or 9:16 · each side 320–3840px | **Still missing — this one I genuinely can't produce here.** They have to be real captures of the running app against live data (device/simulator + a working backend session); this sandbox has neither, and `cms.themoveee.com` is network-blocked from it anyway. Capture these from an EAS preview build on your own device. |
| 7"/10" tablet screenshots | Optional but recommended if any tablet support is claimed | N/A — `ios.supportsTablet` is `false`; skip unless Android tablet support is added |
| Promo video | Optional — YouTube URL | None; optional, skip for v1 |

---

## 4. Categorization & contact

| Field | Suggested value |
|---|---|
| App category | **Social** (best fit — feed, directory, events, community, perks). "Lifestyle" is the fallback if Play's reviewers push back on category fit. |
| Tags | Pick up to 5 from Play Console's live tag list at submission time — e.g. Social Networking, Events, Lifestyle |
| Contact email (required) | `hello@themoveee.com` |
| Contact phone (optional) | None on file — leave blank or add one if you want support calls |
| Website (optional but recommended) | `https://themoveee.com` |
| Privacy policy URL (required) | `https://themoveee.com/privacy` |

**Developer account / legal entity** (for the Play Console account itself, not the
listing): **Moveee Media Ltd**, registered in Nigeria (per `apps/site/app/terms`) —
jurisdiction is Lagos, Nigeria courts. If this is a new Play Console developer
account, Google will require ID/organization verification (D-U-N-S number for an
organization account) before the app can go to production — budget time for this,
it's not instant.

---

## 5. App content questionnaire — answer guide

Play Console's "App content" section asks a fixed set of declarations. Best-effort
answers based on what's actually built:

| Question | Answer | Notes |
|---|---|---|
| Privacy policy URL | `https://themoveee.com/privacy` | |
| Ads — does your app contain ads? | **No** | Confirmed no ad SDK (AdMob etc.) anywhere in `apps/mobile` — the AdSense/AdSettings code in the repo is Site A (web) only |
| App access — is all functionality available without special access? | **No — restricted** | Most features require a logged-in account. Provide a real demo account's username/password in the "instructions for access" field, or reviewers can't get past login |
| Target audience & content | Likely **13+ / general audience, not primarily child-directed** | Registration collects date of birth but there's no enforced minimum-age gate visible in the codebase — confirm the actual minimum-age policy before answering this, since it also affects the content rating outcome |
| News app declaration | **No** | Moveee Magazine is one section of a broader community app, not a news-primary app |
| COVID-19 tracing/status app | **No** | |
| Government app | **No** | |
| Data safety section | See §6 below | |
| Financial features | **Yes — flag for review, don't self-certify blind** | See §7 below, this is the one with real legal exposure |

---

## 6. Data safety section — collection mapping

Based on the fields actually collected across registration, profile, and posting
(`NextAuth` session shape, `class-culture-rest-api.php` handlers, `MemberSettingsScreen.tsx`).
**Verify this against your actual production data-processing agreement/DPA before
submitting — a wrong data-safety declaration is a policy violation, not just a UX
detail.**

| Data type | Collected? | Shared with 3rd parties? | Purpose |
|---|---|---|---|
| Name | Yes | No | Account functionality |
| Email address | Yes | No | Account functionality, communications |
| Phone number | Yes (optional field) | No | Account functionality |
| Physical address / city / country | Yes (city, country of residence) | No | Personalization (edition scoping, currency), account functionality |
| Photos | Yes (avatar, cover photo, post images) | No (stored on your own R2 bucket) | App functionality, user-generated content |
| User-generated content (posts, comments, reviews) | Yes | Yes — publicly visible to other users/visitors by design | App functionality |
| Financial info (wallet balance, cash-out details) | Yes | Depends on your payment processor — declare it if one is used for cash-out payouts | App functionality (Culture Credits wallet) |
| App activity (in-app search, interactions, gameplay) | Yes | No | Analytics, personalization, feed ranking |
| Device or other IDs | Likely yes (push notification tokens) | No | App functionality (notifications) |
| Precise location | No (only IP-derived country, not GPS) | — | — |

Data deletion: users **can request account deletion**, but see the blocker below —
there's currently no self-serve deletion flow to point Play Console at, and Play
requires one.

---

## 7. Financial features — flag for legal/compliance review

Moveee has a real virtual-economy wallet: Culture Credits earned via engagement can be
**cashed out for real money** (flat 40% fee, GBP/USD/NGN, per `Culture_Perks::cashout_fee_percent()`).
Two things this touches that need a human legal/compliance sign-off before submission,
not just a metadata answer:

1. **Google Play's Financial Services / Payments declarations** — an app that lets
   users cash out real money almost certainly needs the "Financial features"
   declaration filled in with details of the payout mechanism, and may draw extra
   Play review scrutiny (fraud/AML angle).
2. **Moveee Pro membership currently checks out via a web redirect**, not Google Play
   Billing (`apps/mobile`'s IAP wiring is explicitly unfinished — see
   `CLAUDE.md`'s "What is missing" list, `react-native-iap` was stripped for preview
   builds). Google's Payments policy generally requires **digital goods/services
   unlocked inside the app to be sold through Google Play's billing system**, with
   narrow exceptions. If the Play Store build lets a user tap through to an external
   checkout to unlock in-app Pro features, that's a plausible rejection/suspension
   reason. Recommend resolving this — either wire up Google Play Billing for the Pro
   upgrade, or scope what the Android build can/can't offer — before submitting, not
   after a rejection.

---

## 8. Content rating

Google Play no longer lets you self-select a rating — you fill out the **IARC
questionnaire** in Play Console and it computes the rating. Can't be done in advance
here, but given what's in the app (open user-generated content, comments/chat-adjacent
features, a "nightlife" interest tag, a real-money cash-out feature), expect at least a
**Teen-equivalent rating**, not "Everyone" — budget for that when planning your target
audience answer in §5.

---

## 9. Testing track & rollout

- Package as an **App Bundle** for the production track (`eas build --profile production`
  — already configured to output `.aab`).
- If this is a **new Play Console developer account**, Google's testing policy requires
  running a **closed test with at least 12 testers for 14 continuous days** before you
  can request production access — factor this into your timeline, it's not optional.
- Confirm `targetSdkVersion`/target API level meets Play's current minimum for new
  submissions (Google raises this roughly every year — check the current requirement
  in Play Console at submission time; Expo SDK 52's managed build config should already
  target a compliant level, but verify rather than assume).

---

## 10. Blockers before you can actually submit

Status as of the last pass through this doc:

1. ~~No account-deletion flow~~ — **Built.** See §11 below for exactly what shipped and
   where.
2. **No screenshots exist.** These need to come from a real build against live data —
   I can't produce them from this sandbox (no device, and `cms.themoveee.com` is
   blocked by this environment's network policy). You'll need to capture these from an
   EAS preview/dev build.
3. ~~No feature graphic~~ — **Built.** `mockups/store-assets/feature-graphic.png` (1024×500)
   and `mockups/store-assets/app-icon-512.png` (512×512, exported from the existing app
   icon). Edit `feature-graphic.html` in the same folder and re-render if you want a
   different look.
4. **Moveee Pro's payment flow isn't Play Billing–compliant yet** (§7) — resolve or
   scope before submitting, since Google flags this class of issue reliably. Not
   touched in this pass — it's a product decision (build Play Billing vs. hide the
   in-app upgrade path on Android), not something to silently pick for you.
5. **Play Console org verification** (if this is a new developer account under Moveee
   Media Ltd) takes real calendar time — start it early, independent of app readiness.
6. **`react-native-iap` and its Android store-flavor plugin were deliberately stripped**
   for preview builds (see `CLAUDE.md`'s production-build checklist) — must be restored
   in `package.json`/`app.config.ts` before a production build, then `npm install` rerun.
   Tied to blocker 4 above — restoring this dependency is a prerequisite for the Play
   Billing path, not needed if you choose to hide the upgrade path instead.

---

## 11. Account deletion — what was built

Mirrors the existing email-verification token pattern (`_culture_email_verify_token`
in `class-culture-rest-api.php`) exactly: a random token, stored only as a `wp_hash()`,
emailed to the account's own address, expiring after 24 hours. Two-step, so a stray tap
or a malicious link can't delete an account outright.

- **Backend**: `culture-community/includes/core/class-culture-account-deletion.php`
  (`Culture_Account_Deletion::request_deletion()` / `::confirm_deletion()`), wired into
  `class-culture-rest-api.php` (web: `POST /culture/v1/account/delete-request`,
  `POST /culture/v1/account/delete-confirm`) and `class-culture-mobile-api.php`
  (mobile: `POST /mobile/account/delete-request`, JWT). Email template added to
  `class-culture-emails.php` (`send_account_deletion_email()`).
- **Deletion mechanics**: on confirm, `wp_delete_user()` removes the WP user row and
  every `wp_usermeta` row — which is where all the real PII actually lives (name,
  email, phone, DOB, city, occupation, avatar/cover URLs, interests, directory bio).
  Authored posts/comments are reassigned to a lazily-created "Deleted User" placeholder
  account rather than left attributed to a vanished ID.
- **Known, deliberate scope limit**: custom plugin tables keyed by user_id (credit
  ledger, notifications, follows, RSVPs, hub/cluster membership, redemptions, etc.)
  are *not* swept — their rows become orphaned references to a user_id that no longer
  resolves, which is harmless (nothing renders for a nonexistent user) but isn't a full
  data purge. Revisit with a proper per-table cleanup pass if a stricter data-retention
  audit ever requires it.
- **Web** (`apps/connect`, since auth/account pages live on Site B):
  `/account/delete` — public page; shows a "Delete my account" flow for a logged-in
  visitor, or a login prompt + support-email fallback for a logged-out one (never
  redirects a logged-out visitor away, since Play requires this page to be reachable
  without the app installed). `/account/delete/confirm?uid=&token=` — public, reads the
  emailed link, requires an explicit final tap (not auto-triggered on page load, so an
  email client's link-preview scanner can't fire it).
- **Mobile** (`apps/mobile`): Settings → Security tab has a "Delete Account" row in a
  new Danger Zone card. Taps through a confirm alert, calls the delete-request
  endpoint, then signs the user out — completion happens via the emailed link, same as
  web.
- **This satisfies Google Play's requirement directly**: an in-app path to *initiate*
  deletion (mobile Settings) plus a public web page that can *complete* it without the
  app installed (`/account/delete/confirm`) — Play's own policy explicitly allows
  completion to happen via a follow-up step like this rather than a single in-app tap.
