const { withAppBuildGradle } = require("@expo/config-plugins");

// react-native-iap ships both "amazon" and "play" Android product flavors;
// Gradle can't resolve which one to use without this hint.
module.exports = function withAndroidIapStoreFlavor(config) {
  return withAppBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes("missingDimensionStrategy 'store'")) {
      config.modResults.contents = config.modResults.contents.replace(
        /defaultConfig\s*{/,
        `defaultConfig {\n        missingDimensionStrategy 'store', 'play'`
      );
    }
    return config;
  });
};
