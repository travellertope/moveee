# Android release notes — Moveee

Play Console "What's new" copy, newest first. Keep each entry under **500 characters**
(Google's hard limit per language) and write it for a member, not for us — no build
tooling, no internal names. Copy is checked against the brand-language rule in
`CLAUDE.md`: plain unqualified "culture", no African/Black/diaspora scoping, no
"worldwide"/"global" qualifiers, never the string "The Moveee".

---

## 1.0.1 — initial release

**Play Console "What's new" (paste as-is):**

```
Welcome to Moveee.

Share your take on culture in formats built for it — place, food, book, music and film
reviews, creative showcases, polls, itineraries and quotes.

Discover people, places and ideas. Find events near you and join a Stoop.

Play daily Culture Games. Earn Culture Credits and Reputation Points on everything you
do, and redeem them for partner perks.

Read Moveee Magazine without leaving the app.
```

**Context for this entry:** first production build to reach the Play Store. The work
immediately preceding it was entirely build infrastructure (Expo autolinking, native
compile fixes, dependency pinning) with no user-facing change, so this note describes
the app as a whole rather than a delta.

---

## Closed-test note (internal — do not paste into Play Console)

If this goes out on a closed track first (Google requires 12 testers × 14 continuous
days for a new developer account — see `docs/play-store-listing.md` §9), send testers
this instead:

> This is the first Android build of Moveee. Please exercise: signing up and signing in,
> posting in a few different formats, Discover search and filters, RSVPing to an event,
> the daily games, and your wallet/credits balance. Report anything that crashes, hangs,
> or looks visually broken — including which screen you were on.

**Ask testers to confirm these specifically**, because they depend on platform setup
that cannot be verified from the codebase alone and has never been exercised on a real
device:

- **Google Sign-In** — needs this build profile's keystore SHA-1 registered on the
  Android OAuth client. A different signing key than a previous profile will fail with
  "Access blocked".
- **Passkeys** — needs `ANDROID_PASSKEY_SHA256_FINGERPRINTS` set on the Site A Vercel
  project so `/.well-known/assetlinks.json` serves real fingerprints. Until then,
  passkey registration is expected to fail silently.
- **Moveee Pro upgrade (Play Billing)** — needs the `moveee_pro_monthly` /
  `moveee_pro_annual` subscription products created in Play Console and the service
  account JSON saved in WP Admin. Falls back to "Upgrade on the web" if unavailable.
- **Crash reporting** — events reach Sentry (`moveee` org, `moveee-mobile` project, EU
  region), but stack traces stay unsymbolicated until `SENTRY_AUTH_TOKEN` is set as an
  EAS secret.

Known gap, not a bug to report: cancelled Pro subscriptions don't auto-downgrade yet —
that needs Play Real-Time Developer Notifications, which isn't built.
