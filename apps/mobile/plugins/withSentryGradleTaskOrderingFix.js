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
// separate validation failure.
//
// A second version tried to close this class of bug for good by matching
// EVERY task in the consumer project whose name merely contains the variant
// string (e.g. "Release") instead of enumerating exact task names. This was
// wrong and broke the build outright: "Release"/"Debug" also appears in
// preReleaseBuild/preDebugBuild and in the producer tasks themselves
// (generateReleaseResValues, generateReleaseResources) — and since the outer
// loop runs BOTH orderings (A-as-producer/B-as-consumer and vice versa), this
// wired B.preReleaseBuild.dependsOn(A.generateReleaseResValues) AND
// A.preReleaseBuild.dependsOn(B.generateReleaseResValues). Combined with
// AGP's own built-in dependency (generateReleaseResValues already depends on
// preReleaseBuild within the same project), that closes a genuine cycle:
// A.generateReleaseResValues -> A.preReleaseBuild -> B.generateReleaseResValues
// -> B.preReleaseBuild -> A.generateReleaseResValues. Gradle correctly
// refused to build with "Circular dependency between the following tasks".
//
// Fixed by going back to an explicit allowlist of the exact consumer task
// names actually observed racing the producer's output — never a task
// starting with generate/pre, so it can never re-wire onto the producer's
// own dependency chain and can never cycle.
//
// A third round surfaced a SECOND, deeper layer: Gradle additionally flagged
// ':sentry-react-native:compileReleaseLibraryResources' and
// ':sentry_react-native:parseReleaseLocalResources' as implicitly reading
// the OTHER project's packageReleaseResources output. This is real — the
// duplicate projects alias the same physical output directory at this layer
// too — but it's a genuinely different producer (packageReleaseResources,
// not generateReleaseResValues/Resources). compileLibraryResources and
// parseLocalResources are true AGP siblings of packageResources (both only
// depend on generateResources within their own project, never on
// packageResources), so wiring them as consumers of the OTHER project's
// packageResources cannot loop back into it and cannot cycle.
//
// DEPENDENCY_LAYERS below makes each layer's producer/consumer task-name
// templates explicit and independently extensible. If a future build
// surfaces yet another consumer task racing an existing producer, add its
// template to that layer's consumerTemplates. If it's a new producer
// entirely, add a new layer. Never widen a template back into a substring
// match (see the incident above for exactly why that breaks).
module.exports = function withSentryGradleTaskOrderingFix(config) {
  return withProjectBuildGradle(config, (config) => {
    const marker = "withSentryGradleTaskOrderingFix";
    if (!config.modResults.contents.includes(marker)) {
      config.modResults.contents += `

// ${marker} — see apps/mobile/plugins/withSentryGradleTaskOrderingFix.js.
gradle.projectsEvaluated {
    def sentryProjectPaths = [':sentry-react-native', ':sentry_react-native']
    def variants = ['Release', 'Debug']

    // Each layer: producerTemplates are task names that write the shared,
    // aliased output directory; consumerTemplates are task names observed
    // reading it without an explicit dependency. Extend, don't broaden.
    def dependencyLayers = [
        [
            producerTemplates: ['generate\${variant}ResValues', 'generate\${variant}Resources'],
            consumerTemplates: ['package\${variant}Resources', 'extractDeepLinks\${variant}'],
        ],
        [
            producerTemplates: ['package\${variant}Resources'],
            consumerTemplates: ['compile\${variant}LibraryResources', 'parse\${variant}LocalResources'],
        ],
    ]

    sentryProjectPaths.each { producerPath ->
        def producerProject = findProject(producerPath)
        if (producerProject == null) return

        sentryProjectPaths.each { consumerPath ->
            if (consumerPath == producerPath) return
            def consumerProject = findProject(consumerPath)
            if (consumerProject == null) return

            variants.each { variant ->
                dependencyLayers.each { layer ->
                    def producerTasks = layer.producerTemplates.collect { template ->
                        producerProject.tasks.findByName(template.replace('\${variant}', variant))
                    }.findAll { it != null }
                    if (producerTasks.isEmpty()) return

                    layer.consumerTemplates.each { template ->
                        def consumerTaskName = template.replace('\${variant}', variant)
                        def consumerTask = consumerProject.tasks.findByName(consumerTaskName)
                        if (consumerTask == null) return

                        producerTasks.each { producerTask ->
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
