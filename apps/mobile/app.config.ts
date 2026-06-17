// Dynamic Expo config — keeps runtimeVersion and OTA updates out of Expo Go
// (where they cause fetch errors) but restores them for EAS production builds.
const IS_EAS_BUILD = !!process.env.EAS_BUILD;

export default {
  expo: {
    name: "Moveee",
    slug: "moveee-platform",
    owner: "moveees-team",
    version: "1.0.1",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#f3ece0",
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.moveee.connect",
    },
    android: {
      package: "com.moveee.connect",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#b54a24",
      },
      permissions: [
        "NOTIFICATIONS",
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE",
      ],
    },
    plugins: [
      "expo-notifications",
      "expo-secure-store",
      [
        "expo-image-picker",
        {
          photosPermission:
            "Allow Moveee to access your photos so you can share images in Connect posts.",
        },
      ],
      "@react-native-community/datetimepicker",
      "expo-asset",
      "expo-font",
    ],
    extra: {
      eas: {
        projectId: "943d1ee4-9194-4a36-8b6a-48ab32dfd813",
      },
    },
    // Only include OTA update config in EAS builds — Expo Go can't reach the
    // EAS update server and throws a 500 "fetch failed" error if these are set.
    ...(IS_EAS_BUILD
      ? {
          runtimeVersion: { policy: "appVersion" },
          updates: {
            url: "https://u.expo.dev/943d1ee4-9194-4a36-8b6a-48ab32dfd813",
          },
        }
      : {}),
  },
};
