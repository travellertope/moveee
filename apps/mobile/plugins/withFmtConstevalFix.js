const { withPodfile } = require("@expo/config-plugins");

// Newer Xcode/Clang versions (needed for Apple's Xcode 26+ App Store SDK
// requirement — see eas.json's build.production.ios.image) enforce C++20
// `consteval` evaluation more strictly than the `fmt` library bundled via
// RCT-Folly (a React Native core native dependency) expects, causing a hard
// compile failure:
//   call to consteval function 'fmt::basic_format_string<...>' is not a
//   constant expression
// The standard community workaround is to define the FMT_CONSTEVAL macro as
// empty, which makes fmt fall back to a plain `constexpr` constructor
// instead of `consteval` — avoiding the stricter compile-time-evaluation
// requirement entirely. Applied broadly (every pod target) rather than only
// to RCT-Folly/fmt specifically, since it's harmless for targets that don't
// use fmt and keeps this plugin resilient to the exact pod name/structure
// changing in a future RN version.
module.exports = function withFmtConstevalFix(config) {
  return withPodfile(config, (config) => {
    const marker = "FMT_CONSTEVAL=";
    if (!config.modResults.contents.includes(marker)) {
      config.modResults.contents = config.modResults.contents.replace(
        /post_install do \|installer\|/,
        `post_install do |installer|
    # See apps/mobile/plugins/withFmtConstevalFix.js for why this is here.
    installer.pods_project.targets.each do |t|
      t.build_configurations.each do |bc|
        defs = bc.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] || ['$(inherited)']
        defs = ['$(inherited)'] if defs.is_a?(String)
        defs << '${marker}' unless defs.include?('${marker}')
        bc.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] = defs
      end
    end`
      );
    }
    return config;
  });
};
