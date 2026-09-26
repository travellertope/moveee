# Expo SDK 52 → 54 upgrade plan

**Why:** Play Console rejected the 1.0.1 production release with three errors that are all
one problem — the toolchain is too old:

| Play error | Root cause (verified from package source) |
|---|---|
| Targets API 34, must target ≥36 | `expo-template-bare-minimum@sdk-52` sets `targetSdkVersion = 34`, `compileSdkVersion = 35` |
| No 16 KB memory page support | SDK 52 pins `ndkVersion = 26.1.10909125`; 16 KB alignment needs NDK r27+ |
| Play Billing 7.0.0, must be ≥8.0.0 | `react-native-iap@12.16.3` sets `RNIap_playBillingSdkVersion=7.0.0` |

These are coupled: forcing API 36 on SDK 52 makes 16 KB **mandatory** (it only applies to apps
targeting Android 15+) while NDK 26.1 cannot produce aligned libs — i.e. it would ship an app
that crashes on 16 KB devices. There is no configuration-only fix.

**Target: SDK 54**, not 57. Both default to `compileSdk 36` / `targetSdk 36` (verified in
`expo-modules-core`'s `ExpoModulesCorePlugin.gradle`), so 54 clears the blocker — and 54 still
bundles `expo-av` (`~16.0.8`) while 57 drops it entirely, so 54 avoids an `expo-audio`
migration on top of everything else. 54 is the smallest jump that actually solves the problem.

**The SDK 52 pin's justification is stale.** CLAUDE.md pins 52 because
`react-native-passkeys@0.4.0` required it. Today `0.4.2` declares
`peerDependencies: { expo: ">=53.0.0" }` — the thing the pin protected now wants the opposite.

---

## Forced by the SDK

- `react` 18.3.1 → **19.1.0**
- `react-native` 0.76.9 → **0.81.5**

Everything below follows from those two.

## Managed bumps (mechanical — `npx expo install --fix` handles these)

`@expo/vector-icons` 14→15, `expo-apple-authentication` 7→8, `expo-asset` 11→12,
`expo-av` 15→16, `expo-build-properties` 0.13→1.0, `expo-camera` 16→17, `expo-device` 7→8,
`expo-font` 13→14, `expo-image-picker` 16→17, `expo-linear-gradient` 14→15,
`expo-modules-core` 2.1→3.0, `expo-notifications` 0.29→0.32, `expo-secure-store` 14→15,
`expo-sharing` 13→14, `expo-status-bar` 2→3, `expo-updates` 0.27→29, `expo-web-browser` 14→15,
`@react-native-async-storage/async-storage` → 2.2.0, `react-native-safe-area-context` 4.12→5.6,
`react-native-screens` 4.4→4.16, `react-native-webview` → 13.15.0.

Note `@react-native-community/datetimepicker` moves **down**, `^9.1.0` → `8.4.4`, on SDK 54.

## The four that need real work

### 1. `react-native-render-html` — breaks on React 19, and is abandoned

`6.3.4` is both our version and the latest published — no upgrade exists. It assigns
`.defaultProps` on **function** components in five places (`TChildrenRenderer`,
`TNodeChildrenRenderer`, `TNodeRenderer`, `TRenderEngineProvider`). React 19 removed support
for that; the defaults silently become `undefined`.

This is not niche — per CLAUDE.md it has exactly one importer, `components/ui/HtmlContent.tsx`,
which is the single funnel for **all** CMS HTML: `ArticleScreen`, `PulseDetailSheet`,
`PulseDetailScreen`.

**Preferred fix:** `patch-package` the five assignments into default parameters. Contained,
preserves rendering behaviour exactly, no product decision. Replacing the library outright is
the fallback if the patch proves insufficient.

### 2. `react-native-iap` 12.16.3 → 14.x — required for Billing 8

`14.0.0` hardcodes `com.android.billingclient:billing-ktx:8.0.0`. But v14 moved to
**Nitro modules** (`react-native-nitro-modules` peer) and is an API rewrite, not a bump.
Touches `src/features/billing/iap.ts`, `screens/member/MembershipScreen.tsx`, and
`plugins/withAndroidIapStoreFlavor.js`.

The exact-`12.16.3` pin exists because `12.16.4` broke the iOS build
(`Transaction.appTransactionID` behind a `#if compiler(>=5.10)` guard). **Re-check whether
14.x still has that guard** before assuming the pin can simply be dropped.

### 3. `react-native-passkeys` 0.4.0 → 0.4.2

Straightforward, and `>=53` is now satisfied. Unrelated to this upgrade, the
`.well-known` platform setup is still outstanding (see CLAUDE.md).

### 4. `@react-navigation` 6 → 7

v6 declares `react: >= 18.2.0` so it may technically run on 19, but SDK 54 templates ship v7.
Treat as required, not optional.

## Workarounds this upgrade makes obsolete — remove them

- **`expo.autolinking.exclude: ["@sentry/react-native"]`** in `apps/mobile/package.json` —
  **must be removed.** It exists because `expo-modules-autolinking@2.0.8` reads only
  `android.gradlePath` and ignores Sentry's `android.path`/`android.name`. Verified:
  `expo-modules-autolinking@3.x` **does** read both keys, so on SDK 54 the duplicate project
  and the missing `SentryExpoPackage` class both disappear on their own. Leaving the exclude in
  would drop the Expo handler on an SDK where it works.
- **`plugins/withSentryGradleTaskOrderingFix.js`** — existed only to order the duplicate
  projects. Delete it and its `app.config.ts` entry.
- **`plugins/withFmtConstevalFix.js`** — re-verify. Its regex targets fmt 11.0.2's
  `#if FMT_USE_CONSTEVAL` block; RN 0.81 likely pulls a different fmt. If the patch silently
  no-ops it is worse than useless, since it hides the real state.
- **`typeRoots` in `apps/mobile/tsconfig.json`** — exists to stop TS resolving the monorepo
  root's React 19 `@types/react` into a React 18 app. Once mobile *is* React 19 the collision
  is gone. **Do not remove it blind** — re-run the `--traceResolution` check documented in
  CLAUDE.md first, and never put `"react"` back into `"paths"`.
- **`@sentry/react-native` `~8.24.0`** — bump to a version built for RN 0.81.

## Execution order (fail fast — cheapest signal first)

1. Bump `expo`/`react`/`react-native` + all managed packages; regenerate the lockfile
   out-of-tree (the process in CLAUDE.md — EAS uses `npm ci`).
2. Remove the obsolete workarounds above.
3. `tsc --noEmit` — catches the React 19 and navigation-v7 type fallout with **no build spend**.
4. Patch `react-native-render-html`; verify article/pulse rendering.
5. Migrate `react-native-iap` to 14.x.
6. First EAS build. Expect native fallout here, not before.

Steps 1–4 cost nothing but local time. Do not spend a build cycle before step 6.

## Not verifiable in this sandbox

No `node_modules`, no Android/Xcode toolchain. Every native claim above is read from published
package sources; anything touching an actual compile needs a real EAS build to confirm.
