const { withProjectBuildGradle } = require("@expo/config-plugins");

// EAS Android builds were failing with a long series of Gradle errors of the
// form:
//   A problem was found with the configuration of task
//   ':sentry_react-native:<X>'.
//     Reason: Task ':sentry_react-native:<X>' uses this output of task
//     ':sentry-react-native:<Y>' without declaring an explicit or implicit
//     dependency.
//
// Root cause: @sentry/react-native ships both a react-native.config.js
// (classic RN autolinking) and an expo-module.config.json (Expo Modules
// autolinking) — this dual-autolinking situation (a known, documented class
// of bug, only properly fixed by a unified autolinking resolver Expo shipped
// in SDK 54, see https://kitten.sh/blog/autolinkings-broken-promise) causes
// the SAME android/ folder to be registered as TWO separate Gradle projects
// under two differently-sanitized names — one with underscores
// (:sentry_react-native, from classic autolinking's name-sanitization) and
// one with hyphens (:sentry-react-native, from Expo Modules autolinking's).
//
// Because both projects share one physical source root, they also share ONE
// build/ directory — so EVERY task in one project writes to a path some task
// in the other project reads. Gradle 8.10's stricter task validation rejects
// each such unordered pair as a hard build failure.
//
// This app is deliberately pinned to Expo SDK 52 (see CLAUDE.md's "Expo SDK
// version — critical" section — react-native-passkeys 0.4.0 and other pinned
// packages require it), so upgrading to SDK 54 to get the real fix is out of
// scope.
//
// ---------------------------------------------------------------------------
// WHY THIS IS A BLANKET ORDERING AND NOT A LIST OF TASK PAIRS
// ---------------------------------------------------------------------------
// The first eight iterations of this fix enumerated specific producer/consumer
// task-name pairs and wired them with Task#dependsOn. Every one of those was
// individually correct, and each got the build measurably further (342 -> 352
// -> 440 -> 474 -> 480 -> 684 tasks executed). But the approach could never
// terminate: since the two projects alias the WHOLE build directory, any task
// pair that touches it races, so each fix just revealed the next pair in the
// pipeline — resources, then compilation, then class bundling, then (the
// eighth) shader/asset packaging, with JNI libs, art profiles and lint still
// queued up behind that.
//
// Gradle's own error message lists three possible solutions, and the third is
// "Declare an explicit dependency ... using Task#mustRunAfter". mustRunAfter
// is a pure ORDERING constraint rather than a data dependency: it never forces
// a task to run, it only fixes relative order when both tasks are already in
// the graph. That is exactly the guarantee needed here — the two projects
// produce identical outputs, so the only real problem is that they interleave
// nondeterministically.
//
// So instead of naming task pairs, this declares ONE rule: every task in
// :sentry_react-native runs after every task in :sentry-react-native. That
// satisfies the validation for every pair that exists today and every pair
// that would otherwise have surfaced in a future round.
//
// Why this cannot cycle: the ordering is strictly one-directional between two
// disjoint task sets, and neither project declares a dependency on the other
// (they are sibling leaf libraries; only :app depends on them, and :app is not
// involved in this ordering). A cycle would require some task in
// :sentry-react-native to depend on a task in :sentry_react-native, which
// nothing creates.
//
// Cost: the two modules are serialized rather than built in parallel. They are
// two copies of one small library, so this is a negligible amount of wall time
// in exchange for ending an unbounded sequence of build failures.
//
// If a future dependency bump removes the duplicate registration (or renames
// either project), the findProject guards below make this whole block a
// harmless no-op rather than a build failure.
module.exports = function withSentryGradleTaskOrderingFix(config) {
  return withProjectBuildGradle(config, (config) => {
    const marker = "withSentryGradleTaskOrderingFix";
    if (!config.modResults.contents.includes(marker)) {
      config.modResults.contents += `

// ${marker} — see apps/mobile/plugins/withSentryGradleTaskOrderingFix.js.
gradle.projectsEvaluated {
    // Order is deliberate and one-directional: everything in the SECOND
    // project runs after everything in the FIRST. Do not make this
    // bidirectional — that would be a cycle by construction.
    def sentryFirstPath = ':sentry-react-native'
    def sentrySecondPath = ':sentry_react-native'

    def sentryFirst = findProject(sentryFirstPath)
    def sentrySecond = findProject(sentrySecondPath)

    if (sentryFirst != null && sentrySecond != null) {
        sentrySecond.tasks.configureEach { secondTask ->
            // Passing the TaskCollection resolves lazily, so tasks registered
            // after this point are covered too.
            secondTask.mustRunAfter(sentryFirst.tasks)
        }
    }
}
`;
    }
    return config;
  });
};
