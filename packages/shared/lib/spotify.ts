// Server-only. Spotify's client-credentials flow (no per-user OAuth needed
// for catalog search) — shared by both apps' /api/external/spotify/* routes
// via the @/lib/* path resolution (packages/shared/lib checked first).

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET ?? "";

let cachedToken: { token: string; expiresAt: number } | null = null;

/** Returns a cached-when-possible app access token, or null if credentials
 * aren't configured / the token request fails — callers should degrade to
 * an empty result set rather than throwing. */
export async function getSpotifyToken(): Promise<string | null> {
  if (!CLIENT_ID || !CLIENT_SECRET) return null;
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.token;

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  }).catch(() => null);

  if (!res || !res.ok) return null;
  const data = await res.json().catch(() => null);
  if (!data?.access_token) return null;

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + Math.max(60, (data.expires_in ?? 3600) - 60) * 1000,
  };
  return cachedToken.token;
}
