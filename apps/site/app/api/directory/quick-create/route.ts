import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

function getBearerToken(req: NextRequest): string {
  const auth = req.headers.get("authorization") ?? "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : "";
}

// Resolves the calling user's WP ID for either caller:
//  - mobile app: sends Authorization: Bearer <mobile JWT>, resolved via
//    WordPress's own /mobile/me.
//  - website (packages/shared/components/composer/DirectorySearch.tsx,
//    used by ComposerModal's Music/Book/Film review and Event organiser
//    pickers): sends no Authorization header at all — it was never wired
//    with one, since the browser already carries the session as a cookie —
//    so this previously always fell through to "Unauthorized.", silently
//    swallowed by the component's own bare `catch {}`. A tap on any iTunes/
//    Google Books/TMDB search result looked like it did nothing, every
//    time, for every web user. Falls back to getServerSession() whenever
//    there's no bearer token, mirroring every other /api/directory/*
//    route (e.g. [id]/follow/route.ts) that already authenticates the web
//    composer this way.
async function resolveUserId(req: NextRequest): Promise<{ userId: number | null; error?: NextResponse }> {
  const token = getBearerToken(req);
  if (!token) {
    const session = (await getServerSession(authOptions as any)) as any;
    const userId = session?.user?.id ? Number(session.user.id) : null;
    if (!userId) {
      return { userId: null, error: NextResponse.json({ error: "Unauthorized.", code: "no_session" }, { status: 401 }) };
    }
    return { userId };
  }

  // Distinguish "your token is actually invalid" (WordPress explicitly said
  // 401/403) from "we couldn't reach/parse WordPress" (network hiccup, 5xx,
  // malformed body) — the mobile client force-logs-out on ANY 401 from an
  // authenticated call (see api/client.ts's _onUnauthorized wiring), so
  // collapsing a transient upstream failure into a 401 here was kicking
  // signed-in users straight back to the login screen for no real reason.
  // Only a genuine 401/403 from WordPress itself should propagate as 401;
  // everything else surfaces as a retryable 502.
  const meRes = await fetch(`${WP_URL}/wp-json/culture/v1/mobile/me`, {
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => null);

  if (!meRes) {
    return { userId: null, error: NextResponse.json({ error: "Could not reach the server. Please try again." }, { status: 502 }) };
  }
  if (meRes.status === 401 || meRes.status === 403) {
    const meBody = await meRes.json().catch(() => ({}));
    return {
      userId: null,
      error: NextResponse.json(
        { error: "Unauthorized.", code: meBody?.code ?? `wp_${meRes.status}` },
        { status: 401 }
      ),
    };
  }
  if (!meRes.ok) {
    return { userId: null, error: NextResponse.json({ error: "Could not verify your account. Please try again." }, { status: 502 }) };
  }

  const userId = (await meRes.json().catch(() => ({})))?.id;
  if (!userId) {
    return { userId: null, error: NextResponse.json({ error: "Could not verify your account. Please try again." }, { status: 502 }) };
  }
  return { userId };
}

// Proxied here because WordPress's quick-create endpoint is gated by
// CULTURE_API_SECRET, not a per-user JWT or session — that secret must
// stay server-side. The endpoint also needs an explicit user_id (it has
// no session of its own to derive one from), so it's resolved first from
// whichever auth the caller actually sent (see resolveUserId() above).
export async function POST(req: NextRequest) {
  const { userId, error } = await resolveUserId(req);
  if (!userId) return error!;

  const body = await req.json().catch(() => ({}));

  const res = await fetch(`${WP_URL}/wp-json/culture/v1/directory/quick-create`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...body, user_id: userId }),
  }).catch(() => null);

  // This call authenticates with the server's own CULTURE_API_SECRET, not
  // the user's token — a 401/403 here means the secret is misconfigured,
  // not that the user is unauthorized, so never forward it as 401 (that
  // would force-logout the user for a server-side config problem).
  if (!res || !res.ok) {
    const status = !res ? 502 : res.status === 401 || res.status === 403 ? 502 : res.status;
    return NextResponse.json({ error: "Could not create directory entry." }, { status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
