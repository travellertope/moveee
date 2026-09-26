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
// THE DUPLICATES ARE NOT IDENTICAL — WHICH ONE RUNS LAST IS LOAD-BEARING
// ---------------------------------------------------------------------------
// Earlier revisions of this file assumed the two registrations were byte-
// identical copies, which made their relative order look arbitrary. That was
// wrong, and it cost a build to find out.
//
// The Expo-autolinked copy (:sentry-react-native) compiles an additional source
// set that the classic-autolinked copy (:sentry_react-native) does not — the
// one providing io.sentry.react.expo.SentryExpoPackage. :expo's generated
// ExpoModulesPackageList.java references that class directly.
//
// Since both projects write the same classes.jar, the copy that runs LAST
// decides what ends up in it. Ordering the classic copy last produced a jar
// without the expo package and :expo failed to compile with
// "package io.sentry.react.expo does not exist" — not a Gradle validation
// error, a real javac failure. Before any ordering existed at all this was a
// coin flip that sometimes landed the right way round.
//
// So the order below is deliberate and load-bearing: the classic copy runs
// first and the Expo copy runs last, because the Expo copy's output is a
// superset. Do not swap these two values. (This is also the true explanation
// for an earlier failed experiment that disabled the classic registration via
// react-native.config.js and hit this same missing-class error — the missing
// symbol was the real signal, and it was misread as the exclusion breaking a
// dependency.)
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
    // Order is deliberate, one-directional, and load-bearing. Both projects
    // write the same classes.jar, so whichever runs LAST decides its contents.
    // The Expo copy compiles a superset (it provides
    // io.sentry.react.expo.SentryExpoPackage, which :expo needs), so it must
    // run last. Swapping these two values produces a jar missing that class
    // and breaks :expo:compileReleaseJavaWithJavac. Do not make this
    // bidirectional either — that would be a cycle by construction.
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
