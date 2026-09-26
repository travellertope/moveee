const { withProjectBuildGradle } = require("@expo/config-plugins");

// EAS Android builds were failing with:
//   A problem was found with the configuration of task
//   ':sentry_react-native:packageReleaseResources' (type 'MergeResources').
//     Reason: Task ':sentry_react-native:packageReleaseResources' uses this
//     output of task ':sentry-react-native:generateReleaseResValues' without
//     declaring an explicit or implicit dependency.
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
// Both projects physically point at the same source root and therefore
// write/read the exact same build output directory
// (node_modules/@sentry/react-native/android/build/generated/res/...), so
// either project's resource-packaging task can race against the other
// project's resource-generation tasks — Gradle 8.10's stricter task
// validation (see the "implicit_dependency" doc link in the original error)
// now rejects this as a hard build failure instead of silently tolerating
// the race.
//
// This app is deliberately pinned to Expo SDK 52 (see CLAUDE.md's "Expo SDK
// version — critical" section — react-native-passkeys 0.4.0 and other
// pinned packages require it), so upgrading to SDK 54 to get the real fix
// is out of scope. Instead, this declares the missing dependency directly —
// exactly Gradle's own suggested fix #2 in the original error message
// ("Declare an explicit dependency ... using Task#dependsOn"). Registered
// via `gradle.projectsEvaluated` (fires once every subproject has been
// configured) so it works regardless of project evaluation order, and
// guarded with null-checks throughout so it's a harmless no-op if a future
// dependency bump removes the duplicate (or renames the projects) rather
// than failing the build outright.
//
// A first version of this fix only wired the ONE consumer task named in the
// original error (packageReleaseResources, type MergeResources). The very
// next build hit a DIFFERENT consumer task racing the same producer output —
// extractDeepLinksRelease (type ExtractDeepLinksTask) also reads
// generateReleaseResValues's res/resValues directory, and Gradle validates
// this per task-type, not per producer, so each new consumer task type is a
// separate validation failure. Rather than keep enumerating exact task names
// one whack-a-mole round at a time, every task in the consumer project whose
// name matches the same build variant (Release/Debug) is made to depend on
// the producer's generateResValues/generateResources tasks for that variant
// — broad, but harmless (a few extra ordering edges within one small,
// mutually-duplicate pair of projects), and it closes this class of bug for
// good instead of one task name at a time.
module.exports = function withSentryGradleTaskOrderingFix(config) {
  return withProjectBuildGradle(config, (config) => {
    const marker = "withSentryGradleTaskOrderingFix";
    if (!config.modResults.contents.includes(marker)) {
      config.modResults.contents += `

// ${marker} — see apps/mobile/plugins/withSentryGradleTaskOrderingFix.js.
gradle.projectsEvaluated {
    def sentryProjectPaths = [':sentry-react-native', ':sentry_react-native']
    def variants = ['Release', 'Debug']
    def producerTaskSuffixes = ['ResValues', 'Resources']

    sentryProjectPaths.each { producerPath ->
        def producerProject = findProject(producerPath)
        if (producerProject == null) return

        sentryProjectPaths.each { consumerPath ->
            if (consumerPath == producerPath) return
            def consumerProject = findProject(consumerPath)
            if (consumerProject == null) return

            variants.each { variant ->
                def producerTasks = producerTaskSuffixes.collect { suffix ->
                    producerProject.tasks.findByName("generate\${variant}\${suffix}")
                }.findAll { it != null }
                if (producerTasks.isEmpty()) return

                consumerProject.tasks.matching { it.name.contains(variant) }.each { consumerTask ->
                    producerTasks.each { producerTask ->
                        if (consumerTask != producerTask) {
                            consumerTask.dependsOn(producerTask)
                        }
                    }
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
