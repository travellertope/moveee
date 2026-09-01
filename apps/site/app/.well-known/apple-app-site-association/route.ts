import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Grants the Moveee iOS app permission to use themoveee.com as its passkey
// (WebAuthn) relying party — required alongside the `associatedDomains:
// ["webcredentials:themoveee.com"]` entitlement in apps/mobile/app.config.ts
// for react-native-passkeys to work at all; without both halves, iOS just
// refuses every Passkeys.create()/.get() call. Must be served with no
// redirects and (per Apple's docs) without a file extension in the URL —
// this route's folder name IS the URL path, so that's satisfied for free.
//
// "themoveee.com" here must match Culture_WebAuthn::rp_id()'s actual value
// (culture-community/includes/core/class-culture-webauthn.php) — currently
// its auto-derived default (no culture_webauthn_rp_id option has ever been
// set). If that ever changes, this file needs to move to whichever app
// serves the new rp.id's domain.
//
// APPLE_TEAM_ID: Vercel env var (Site A project) — find it in Apple
// Developer → Membership, or in the "Team ID" line `eas credentials` prints
// when generating/viewing iOS signing credentials. Not a secret (Apple
// exposes it in every provisioning profile), just not hardcoded here so a
// future team-transfer (see CLAUDE.md's SprintFastest → Moveee Media Ltd
// note) doesn't require a code change.
const APPLE_TEAM_ID = process.env.APPLE_TEAM_ID ?? "";
const IOS_BUNDLE_ID = "com.moveee.connect";

export async function GET() {
  return NextResponse.json(
    {
      webcredentials: {
        // Empty until APPLE_TEAM_ID is set — a safe, inert default (no
        // trust is granted, so nothing breaks) rather than baking in a
        // guessed Team ID that would silently be wrong.
        apps: APPLE_TEAM_ID ? [`${APPLE_TEAM_ID}.${IOS_BUNDLE_ID}`] : [],
      },
    },
    { headers: { "Content-Type": "application/json" } }
  );
}
