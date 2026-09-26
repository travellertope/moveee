// @sentry/react-native ships both a react-native.config.js-style classic
// autolinking registration AND an Expo Modules autolinking registration
// (expo-module.config.json) for the exact same android/ source folder. Expo
// SDK 52 has no unified autolinking resolver (that only shipped in SDK 54,
// see https://kitten.sh/blog/autolinkings-broken-promise — upgrading is out
// of scope, see CLAUDE.md's "Expo SDK version — critical"), so BOTH
// autolinkers independently register a Gradle project for it, under two
// differently-sanitized names: `:sentry-react-native` (Expo Modules,
// hyphen-sanitized) and `:sentry_react-native` (classic RN, underscore-
// sanitized). Both projects point at the identical physical output
// directory, so their tasks can implicitly race each other — this is the
// root cause behind every "implicit_dependency" Gradle validation failure
// this app hit while pinned to SDK 52 (see
// apps/mobile/plugins/withSentryGradleTaskOrderingFix.js's own history for
// the four task-pairs that surfaced one at a time before this fix existed).
//
// This disables classic RN autolinking's Android registration for this one
// package specifically — Expo Modules autolinking already covers it via its
// own expo-module.config.json-driven mechanism, so nothing is lost. This
// should eliminate the `:sentry_react-native` duplicate project entirely,
// removing the race at its source rather than continuing to patch every
// task pair that happens to read the same output directory.
//
// withSentryGradleTaskOrderingFix.js is intentionally left in place as a
// no-cost safety net: every dependency it adds is gated on both project
// paths actually resolving (`findProject(path) == null` short-circuits), so
// if this exclusion fully removes the duplicate, that plugin becomes a
// harmless no-op rather than dead code that needs separately removing.
module.exports = {
  dependencies: {
    "@sentry/react-native": {
      platforms: {
        android: null,
      },
    },
  },
};
