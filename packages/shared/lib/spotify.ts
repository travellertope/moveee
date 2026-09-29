// Server-only. Spotify's client-credentials flow (no per-user OAuth needed
// for catalog search) — shared by both apps' /api/external/spotify/* routes
// via the @/lib/* path resolution (packages/shared/lib checked first).

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET ?? "";

let cachedToken: { token: string; expiresAt: number } | null = null;

/** Returns a cached-when-possible app access token, or null if credentials
 * aren't configured / the token request fails — callers should degrade to
 * an empty result set rather than throwing.
 *
 * Every failure branch below logs server-side (visible in this deployment's
 * Vercel Function Logs, prefixed "[spotify]") — the caller only ever sees
 * `null`, which is indistinguishable client-side from "no results found".
 * This was added after a real report of "music search doesn't work, book
 * search does" that turned out impossible to diagnose without it: every
 * failure mode (missing env vars, wrong Vercel project — apps/site and
 * apps/connect have entirely separate env configs, see CLAUDE.md's
 * "External catalog search" section — a saved-but-not-redeployed env var,
 * or a genuinely wrong Client ID/Secret pair) silently produced the exact
 * same empty array. If this ever recurs, check this deployment's Function
 * Logs for a "[spotify]" line before assuming it's a code bug again. */
export async function getSpotifyToken(): Promise<string | null> {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error(
      "[spotify] SPOTIFY_CLIENT_ID/SPOTIFY_CLIENT_SECRET not set on this deployment — " +
      "music search will always return empty results until both are added AND a fresh " +
      "deploy has happened (Vercel snapshots env vars per-deployment)."
    );
    return null;
  }
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.token;

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  }).catch((e) => {
    console.error("[spotify] token request threw a network error:", e instanceof Error ? e.message : e);
    return null;
  });

  if (!res) return null;
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[spotify] token request rejected: ${res.status} ${res.statusText} — ${body.slice(0, 300)}`);
    return null;
  }
  const data = await res.json().catch(() => null);
  if (!data?.access_token) {
    console.error("[spotify] token response had no access_token:", JSON.stringify(data ?? {}).slice(0, 300));
    return null;
  }

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + Math.max(60, (data.expires_in ?? 3600) - 60) * 1000,
  };
  return cachedToken.token;
}
