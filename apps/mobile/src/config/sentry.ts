// Sentry DSN — a public identifier, safe to ship in the app binary (same
// convention as the Google OAuth client IDs in ./google.ts). It only lets
// events be *sent* to this Sentry project; it grants no read/write access
// to anything. Get the real value from Sentry → Settings → Projects →
// moveee-mobile → Client Keys (DSN), then paste it in below.
//
// Left empty until a human sets it up — Sentry.init() in App.tsx no-ops
// (and stays disabled) when this is blank, so leaving it unset is safe,
// it just means crashes/errors aren't being reported anywhere yet.
export const SENTRY_DSN = "";

// Org/project slugs used by the @sentry/react-native/expo config plugin
// (app.config.ts) to tag EAS builds and upload source maps so stack traces
// in the Sentry dashboard resolve to real file/line instead of minified
// bundle offsets. These are not secrets either — the actual upload is
// authenticated separately via a SENTRY_AUTH_TOKEN env var at build time
// (EAS Secrets), never committed here. See CLAUDE.md "Sentry error
// tracking (mobile)" for full setup steps.
export const SENTRY_ORG = "";
export const SENTRY_PROJECT = "";
