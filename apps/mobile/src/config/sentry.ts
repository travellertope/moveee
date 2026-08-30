// Sentry DSN — a public identifier, safe to ship in the app binary (same
// convention as the Google OAuth client IDs in ./google.ts). It only lets
// events be *sent* to this Sentry project; it grants no read/write access
// to anything. From Sentry → Settings → Projects → moveee-mobile → Client
// Keys (DSN).
export const SENTRY_DSN =
  "https://9aa9f5fcb1f767b069be717c94097dbc@o4512001481048064.ingest.de.sentry.io/4512001493303376";

// Org/project slugs used by the @sentry/react-native/expo config plugin
// (app.config.ts) to tag EAS builds and upload source maps so stack traces
// in the Sentry dashboard resolve to real file/line instead of minified
// bundle offsets. These are not secrets either — the actual upload is
// authenticated separately via a SENTRY_AUTH_TOKEN env var at build time
// (EAS Secrets), never committed here. See CLAUDE.md "Sentry error
// tracking (mobile)" for full setup steps.
export const SENTRY_ORG = "moveee";
export const SENTRY_PROJECT = "moveee-mobile";
