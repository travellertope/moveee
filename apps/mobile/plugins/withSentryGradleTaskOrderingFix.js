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
// the graph.
//
// So instead of naming task pairs, this declares ordering rules. There are two,
// because the problem has two halves.
//
// 1. The duplicates against each other.
// 2. Consumers: every project that DEPENDS on sentry runs after both copies.
//    Half one alone left a real gap — :expo:compileReleaseJavaWithJavac reads
//    the shared compile_library_classes_jar and started as soon as the first
//    copy produced it, while the second copy was still rewriting that exact
//    path. Any project depending on sentry has the same exposure, so the
//    consumer set is derived from the project graph at configuration time
//    rather than enumerated by hand.
//
// ---------------------------------------------------------------------------
// THE ROOT CAUSE IS NOW FIXED AT SOURCE — THIS PLUGIN SHOULD BE INERT
// ---------------------------------------------------------------------------
// Everything above treats a symptom. The actual cause was found later, by
// reading the installed package rather than reasoning about it:
//
//   @sentry/react-native@8.24.0's expo-module.config.json declares its Expo
//   integration as { "android": { "name": "sentry-react-native-expo",
//   "path": "android/expo-handler" } }. That is the autolinking 3.x schema
//   (SDK 54+). expo-modules-autolinking@2.0.8, which SDK 52 pins, reads
//   neither `path` nor `name` — it only reads `android.gradlePath`. So both
//   keys are silently ignored and it falls back to globbing */build.gradle
//   one level deep, which matches android/build.gradle: the exact directory
//   classic RN autolinking already links. Hence two Gradle projects over one
//   source root, hence every implicit_dependency failure above.
//
// The same misread caused the second symptom. Expo's package-list generator
// scans the whole linked source tree, so it finds SentryExpoPackage.java at
// android/expo-handler/src/... and writes it into ExpoModulesPackageList.java
// — but the Gradle project rooted at android/ compiles only android/src, so
// the class is referenced and never compiled. That surfaced as
// "package io.sentry.react.expo does not exist" in :expo's javac.
//
// The fix is one key in apps/mobile/package.json: expo.autolinking.exclude
// drops @sentry/react-native from EXPO autolinking only. Classic autolinking
// still links android/ and registers RNSentryPackage, so native Sentry is
// unaffected; and SentryExpoPackage only exists to catch exceptions swallowed
// by Expo's BRIDGELESS error handling, which this app does not use (the New
// Architecture is not enabled).
//
// With that in place there is no duplicate project, so the findProject guards
// below make this entire block a no-op. It is kept for now only so that the
// build changed one variable at a time. Once a production build is green it
// can be deleted outright, along with its entry in app.config.ts's plugins
// array. Do not re-derive the ordering rules below from scratch if the
// duplicate ever returns — fix the autolinking registration instead.
//
// (An earlier revision of this file asserted that the two duplicates were not
// identical, that the Expo copy compiled a superset, and that their relative
// order was therefore load-bearing. That was wrong: the order was flipped and
// the identical missing-class error recurred, which is what prompted actually
// opening the package. Both duplicates are the same directory.)
//
// Why neither rule can cycle. Half one is strictly one-directional between two
// disjoint task sets, and neither duplicate declares a dependency on the other.
// Half two is self-limiting in a stronger way: a project only enters the
// consumer set by declaring a dependency on sentry, and if sentry also depended
// on that project Gradle would already have failed the build as a circular
// project dependency. So the edges added here always point from a dependent to
// its dependency, which is the direction Gradle's own graph already runs.
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
    // Ordering between the two duplicates. Which one runs last does NOT
    // decide what ends up in the shared jar — they are the same directory, so
    // they compile the same classes. Only the ordering itself matters, and
    // only while the duplicate exists at all (see the header: it should not).
    // Do not make this bidirectional — that would be a cycle by construction.
    def sentryFirstPath = ':sentry_react-native'
    def sentrySecondPath = ':sentry-react-native'

    def sentryFirst = findProject(sentryFirstPath)
    def sentrySecond = findProject(sentrySecondPath)

    if (sentryFirst != null && sentrySecond != null) {
        sentrySecond.tasks.configureEach { secondTask ->
            // Passing the TaskCollection resolves lazily, so tasks registered
            // after this point are covered too.
            secondTask.mustRunAfter(sentryFirst.tasks)
        }

        // Part two: consumers. Ordering the duplicates against each other is
        // not enough on its own — a THIRD project that depends on sentry
        // (:expo, :app) starts compiling as soon as the first copy's jar is
        // ready, while the second copy is still rewriting that same path.
        // Gradle flags that too.
        //
        // The consumer set is derived rather than hardcoded, and deriving it
        // this way is what makes the ordering provably acyclic: a project only
        // qualifies if it declares a dependency ON sentry, and Gradle would
        // already have rejected the build as a circular project dependency if
        // sentry also depended on it. So "consumers run after sentry" can
        // never close a loop, no matter which projects turn up here.
        def sentryPaths = [sentryFirstPath, sentrySecondPath] as Set

        rootProject.allprojects.each { candidate ->
            if (sentryPaths.contains(candidate.path)) return

            def dependsOnSentry = false
            try {
                candidate.configurations.each { configuration ->
                    configuration.dependencies.each { dependency ->
                        if (dependency instanceof ProjectDependency
                                && sentryPaths.contains(dependency.dependencyProject.path)) {
                            dependsOnSentry = true
                        }
                    }
                }
            } catch (Exception ignored) {
                // If a future Gradle version changes this inspection API, fall
                // back to treating the project as a non-consumer. That degrades
                // to the previous behaviour rather than risking a bogus
                // ordering edge.
                dependsOnSentry = false
            }

            if (dependsOnSentry) {
                candidate.tasks.configureEach { consumerTask ->
                    consumerTask.mustRunAfter(sentryFirst.tasks, sentrySecond.tasks)
                }
            }
        }
    }
}
`;
    }
    return config;
  });
};
