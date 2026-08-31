const { withPodfile } = require("@expo/config-plugins");

// Newer Xcode/Clang versions (needed for Apple's Xcode 26+ App Store SDK
// requirement — see eas.json's build.production.ios.image) fail to compile
// `fmt` 11.0.2 (pulled in transitively via RCT-Folly, a core React Native
// native dependency — react-native/third-party-podspecs/fmt.podspec pins
// this exact version and fetches it fresh from GitHub at pod-install time,
// it is not vendored in node_modules) with:
//   call to consteval function 'fmt::basic_format_string<...>' is not a
//   constant expression
//
// fmt's own compiler-version detection (include/fmt/base.h) only disables
// `consteval` for "Apple clang < 14" — Xcode 26's Clang is far newer than
// that cutoff, so fmt still enables `consteval`, but this specific Clang
// has a real regression/incompatibility with fmt 11.0.2's usage pattern
// that fmt's own detection logic (written before this Clang existed)
// doesn't know to exclude.
//
// A `GCC_PREPROCESSOR_DEFINITIONS` override of FMT_CONSTEVAL/
// FMT_USE_CONSTEVAL does NOT work here — verified against the real fmt
// 11.0.2 source (include/fmt/base.h): the whole detect-and-define block has
// no `#ifndef` guard, so the header's own `#define FMT_USE_CONSTEVAL 1` /
// `#define FMT_CONSTEVAL consteval` unconditionally executes and silently
// wins over anything predefined via compiler flags. The only reliable fix
// is to patch the actual fetched source file after CocoaPods checks it out
// (post_install runs after `pod install`'s download phase, so the file is
// already on disk), forcing FMT_USE_CONSTEVAL back to 0 via an #undef +
// #define appended right after fmt's own block — this always wins since it
// comes later in the same file, and #undef before #define is always valid
// (unlike redefining an already-defined macro without #undef first, which
// is what silently failed with the compiler-flag approach).
module.exports = function withFmtConstevalFix(config) {
  return withPodfile(config, (config) => {
    const marker = "withFmtConstevalFix";
    if (!config.modResults.contents.includes(marker)) {
      config.modResults.contents = config.modResults.contents.replace(
        /post_install do \|installer\|/,
        `post_install do |installer|
    # ${marker} — see apps/mobile/plugins/withFmtConstevalFix.js.
    fmt_pod_dir = installer.sandbox.pod_dir('fmt')
    if fmt_pod_dir
      fmt_headers = Dir.glob(File.join(fmt_pod_dir.to_s, '**', 'base.h'))
      Kernel.warn("[${marker}] WARNING: no fmt base.h found under #{fmt_pod_dir} — the consteval patch was NOT applied. If the iOS build fails with a 'consteval function ... is not a constant expression' error, the fmt pod's file layout has likely changed and this plugin's glob needs updating.") if fmt_headers.empty?
      fmt_headers.each do |path|
        content = File.read(path)
        patched = content.sub(
          /#if FMT_USE_CONSTEVAL\\n#  define FMT_CONSTEVAL consteval\\n#  define FMT_CONSTEXPR20 constexpr\\n#else\\n#  define FMT_CONSTEVAL\\n#  define FMT_CONSTEXPR20\\n#endif/,
          "#undef FMT_USE_CONSTEVAL\\n#define FMT_USE_CONSTEVAL 0\\n#define FMT_CONSTEVAL\\n#define FMT_CONSTEXPR20"
        )
        if patched == content
          Kernel.warn("[${marker}] WARNING: #{path} did not match the expected FMT_USE_CONSTEVAL block — the consteval patch was NOT applied to this file. fmt's source has likely changed shape; update this plugin's regex to match the current version.")
        else
          File.write(path, patched)
        end
      end
    else
      Kernel.warn("[${marker}] WARNING: no 'fmt' pod found in the CocoaPods sandbox — the consteval patch was NOT applied.")
    end`
      );
    }
    return config;
  });
};
