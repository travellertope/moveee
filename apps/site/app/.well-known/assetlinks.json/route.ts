import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Android's equivalent of the apple-app-site-association file above —
// grants the Moveee Android app's Credential Manager (the API
// react-native-passkeys uses on Android) permission to use themoveee.com
// as its passkey relying party. The "get_login_creds" relation specifically
// is what's required for passkey autofill/creation to trust the app at
// all — without it, calls fail silently or return "no matching
// credentials" rather than a clear error.
//
// "themoveee.com" must match Culture_WebAuthn::rp_id() — see the docblock
// in apple-app-site-association/route.ts, same caveat applies here.
const ANDROID_PACKAGE = "com.moveee.connect";

// Comma-separated SHA-256 signing certificate fingerprints (colon-hex,
// e.g. "AA:BB:CC:..."), one per keystore that will ever sign a build you
// want passkeys to work on — same "every cert that will sign a test build"
// requirement as the Google Sign-In SHA-1 setup in CLAUDE.md (production
// keystore and any EAS preview-profile keystore are typically different).
// Get each one via `eas credentials` → Android → view keystore (look for
// "SHA256:"), or `keytool -list -v -keystore <file>.jks`.
const SHA256_FINGERPRINTS = (process.env.ANDROID_PASSKEY_SHA256_FINGERPRINTS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export async function GET() {
  return NextResponse.json(
    [
      {
        relation: [
          "delegate_permission/common.handle_all_urls",
          "delegate_permission/common.get_login_creds",
        ],
        target: {
          namespace: "android_app",
          package_name: ANDROID_PACKAGE,
          // Empty until ANDROID_PASSKEY_SHA256_FINGERPRINTS is set — a safe,
          // inert default rather than a guessed fingerprint that would
          // silently be wrong.
          sha256_cert_fingerprints: SHA256_FINGERPRINTS,
        },
      },
    ],
    { headers: { "Content-Type": "application/json" } }
  );
}
