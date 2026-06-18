// Google OAuth Client IDs from Google Cloud Console. These are public identifiers
// (not secrets) — safe to ship in the app binary. Fill in after creating the
// OAuth client in Google Cloud Console; see CLAUDE.md "Google Sign-In" section.
// GOOGLE_IOS_CLIENT_ID also drives GOOGLE_IOS_URL_SCHEME in app.config.ts — keep them in sync.
export const GOOGLE_IOS_CLIENT_ID = "818521894942-85rteetrkupjtch3027nld5q8pv8t2jc.apps.googleusercontent.com";
export const GOOGLE_ANDROID_CLIENT_ID = "818521894942-pv579o1lcucafdupsfjcoau18ij811bb.apps.googleusercontent.com";
// Passed as webClientId to GoogleSignin.configure() — required even on native
// builds because it's what's used to request the idToken (Android/iOS client IDs
// alone don't issue one).
export const GOOGLE_WEB_CLIENT_ID = "818521894942-evfkkj0vidtc5iu7rd4lv6n415kd2h4o.apps.googleusercontent.com";
