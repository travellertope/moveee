// Dynamic Expo config — keeps runtimeVersion and OTA updates out of Expo Go
// (where they cause fetch errors) but restores them for EAS production builds.
const IS_EAS_BUILD = !!process.env.EAS_BUILD;

// Reversed form of GOOGLE_IOS_CLIENT_ID (src/config/google.ts) — required by
// @react-native-google-signin/google-signin's config plugin so iOS can register
// the URL scheme Google redirects back to after the native sign-in sheet closes.
const GOOGLE_IOS_URL_SCHEME = "com.googleusercontent.apps.818521894942-85rteetrkupjtch3027nld5q8pv8t2jc";

// Mirrors src/config/sentry.ts's SENTRY_ORG/SENTRY_PROJECT — kept in sync
// manually, NOT imported. Expo's app.config.ts loader evaluates this file
// via plain Node module resolution, which only resolves .js/.json/.node on
// a bare relative require — it can't follow an import into a sibling .ts
// file (unlike Metro/tsc, which both handle this fine for App.tsx's own
// import of the same file). Importing it here fails with a silent
// "Cannot find module" that EAS/expo swallow without printing anything.
// Same reason GOOGLE_IOS_URL_SCHEME above is a literal instead of importing
// from google.ts — follow that pattern for any future app.config.ts value
// that also lives in src/config/*.ts.
const SENTRY_ORG = "moveee";
const SENTRY_PROJECT = "moveee-mobile";

export default {
  expo: {
    name: "Moveee",
    slug: "moveee-platform",
    owner: "moveee-pro",
    version: "1.0.1",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.moveee.connect",
      // Declares the app's export-compliance status directly in the built
      // Info.plist so App Store Connect stops asking the manual "App
      // Encryption Documentation" question on every new build upload. The
      // app only uses standard OS-level HTTPS/TLS (no proprietary/non-
      // exempt encryption), so this is the correct value — Apple's own
      // suggested fix for a build stuck in "Missing Compliance".
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
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
        "CAMERA",
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
      [
        "expo-camera",
        {
          cameraPermission:
            "Allow Moveee to access your camera to scan Stoop check-in codes.",
        },
      ],
      "@react-native-community/datetimepicker",
      "expo-asset",
      "expo-font",
      [
        "@react-native-google-signin/google-signin",
        { iosUrlScheme: GOOGLE_IOS_URL_SCHEME },
      ],
      "react-native-iap",
      // react-native-iap ships both "amazon" and "play" Android product
      // flavors — Gradle can't resolve which one to use without this hint.
      // Must come after the "react-native-iap" plugin above so the Gradle
      // file it patches already has the dependency block react-native-iap's
      // own plugin adds.
      "./plugins/withAndroidIapStoreFlavor",
      // Patches native iOS/Android projects (dSYM/ProGuard mapping upload
      // build phases) and, when a SENTRY_AUTH_TOKEN env var is present at
      // build time (EAS Secret — never hardcoded), uploads JS source maps
      // so Sentry can symbolicate stack traces. Org/project come from
      // src/config/sentry.ts; blank values are fine, the plugin just skips
      // the upload step until they're filled in.
      //
      // url is the org's Sentry API host, not the DSN's ingest host — this
      // org is on Sentry's EU data-residency region (its DSN points at
      // ingest.de.sentry.io), so the management/API host is de.sentry.io
      // too, not the default sentry.io. If this org is ever migrated to a
      // different region, update this alongside SENTRY_DSN.
      [
        "@sentry/react-native/expo",
        {
          organization: SENTRY_ORG,
          project: SENTRY_PROJECT,
          url: "https://de.sentry.io/",
        },
      ],
      // Works around a native iOS build failure ("call to consteval
      // function ... is not a constant expression") caused by the fmt
      // library (bundled via RCT-Folly, a React Native core dependency)
      // being incompatible with the stricter C++20 consteval checking in
      // the newer Xcode/Clang required by eas.json's build.production.ios.image
      // ("latest"). See apps/mobile/plugins/withFmtConstevalFix.js.
      "./plugins/withFmtConstevalFix",
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
