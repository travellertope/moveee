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
// A fourth round surfaced a THIRD layer, continuing the exact same AGP
// library-resource pipeline: ':sentry_react-native:generateReleaseRFile'
// (type GenerateLibraryRFileTask) was flagged reading the OTHER project's
// parseReleaseLocalResources output (R-def.txt). parseLocalResources plays
// both roles now — a consumer in layer 2 (of packageResources) and a
// producer in layer 3 (of generateRFile) — exactly like packageResources
// itself plays both roles across layers 1 and 2. generateRFile is the
// terminal step of this per-project pipeline (nothing in this codebase's
// producer/consumer set depends on it), so this cannot loop back either.
//
// A fifth round surfaced a FOURTH layer, the next and expected-final stage
// of this same pipeline: ':sentry-react-native:compileReleaseJavaWithJavac'
// (type JavaCompile) was flagged reading the OTHER project's
// generateReleaseRFile output (the compiled R.jar, needed to resolve R.*
// symbols during Java compilation). compileJavaWithJavac has nothing in
// this codebase's producer/consumer set depending on it, so it's a further
// terminal extension of the chain and cannot cycle. compileKotlin is added
// alongside it pre-emptively (same relationship — Kotlin compilation also
// needs R.jar when a module has Kotlin sources referencing resources) even
// though this specific module currently has no compileKotlin task
// registered; the findByName guard already makes an absent task a no-op,
// so covering it now costs nothing and may save a sixth round-trip.
//
// A sixth round surfaced two MORE producers feeding the SAME fourth-layer
// consumer set (compileJavaWithJavac/compileKotlin): javaPreCompileRelease
// (type JavaPreCompileTask, writes annotationProcessors.json — the
// annotation-processor classpath list) and generateReleaseBuildConfig (type
// GenerateBuildConfig, writes the generated BuildConfig.java source dir).
// Both are genuinely new outputs Java/Kotlin compilation reads, not a
// repeat of the R.jar dependency already covered — so rather than add a
// wholly separate layer (which would just re-iterate the identical
// consumer set), they were folded directly into layer four's own
// producerTemplates list. Neither task is a consumer anywhere in this
// file's layers, and neither depends on compileJavaWithJavac/compileKotlin
// in AGP's own graph (both run BEFORE compilation, per their "pre"/
// "generate...for-compilation" naming), so this cannot introduce a cycle.
//
// DEPENDENCY_LAYERS below makes each layer's producer/consumer task-name
// templates explicit and independently extensible. If a future build
// surfaces yet another consumer task racing an existing producer, add its
// template to that layer's consumerTemplates. If it's a new producer
// entirely, add a new layer (or extend an existing layer's
// producerTemplates if the consumer set is identical, as above). Never
// widen a template back into a substring match (see the incident above for
// exactly why that breaks).
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
        [
            producerTemplates: ['parse\${variant}LocalResources'],
            consumerTemplates: ['generate\${variant}RFile'],
        ],
        [
            producerTemplates: [
                'generate\${variant}RFile',
                'javaPreCompile\${variant}',
                'generate\${variant}BuildConfig',
            ],
            consumerTemplates: ['compile\${variant}JavaWithJavac', 'compile\${variant}Kotlin'],
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
