import { NextRequest, NextResponse } from "next/server";

const CMS = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const STORE_API  = `${CMS}/wp-json/wc/store/v1`;

// ─── GET /api/cart ────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const wcRes = await fetch(`${STORE_API}/cart`, {
      headers: forwardHeaders(req),
      cache: "no-store",
    });
    const data = await wcRes.json();
    const res  = NextResponse.json(data, { status: wcRes.status });
    applyWCHeaders(wcRes, res);
    return res;
  } catch (err) {
    console.error("[cart proxy GET]", err);
    return NextResponse.json({ error: "Cart unavailable" }, { status: 502 });
  }
}

// ─── POST /api/cart?action=add|remove|update ──────────────────────────────────
export async function POST(req: NextRequest) {
  const action   = req.nextUrl.searchParams.get("action") ?? "add";
  const body     = await req.json();
  const endpoint =
    action === "add"    ? `${STORE_API}/cart/add-item`    :
    action === "remove" ? `${STORE_API}/cart/remove-item` :
                          `${STORE_API}/cart/update-item`;

  try {
    const wcRes = await fetch(endpoint, {
      method:  "POST",
      headers: { "Content-Type": "application/json", ...forwardHeaders(req) },
      body:    JSON.stringify(body),
      cache:   "no-store",
    });

    const text = await wcRes.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!wcRes.ok) {
      console.error(`[cart proxy POST action=${action}] ${wcRes.status}:`, data);
    }

    const res = NextResponse.json(data, { status: wcRes.status });
    applyWCHeaders(wcRes, res);
    return res;
  } catch (err) {
    console.error("[cart proxy POST]", err);
    return NextResponse.json({ error: "Cart unavailable" }, { status: 502 });
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function forwardHeaders(req: NextRequest): Record<string, string> {
  const h: Record<string, string> = { Accept: "application/json" };
  const cookie = req.headers.get("cookie");
  if (cookie) h["Cookie"] = cookie;
  // Send nonce under both names — different WooCommerce versions use different headers
  const nonce = req.headers.get("x-wc-store-api-nonce") ?? req.headers.get("nonce");
  if (nonce) {
    h["Nonce"]               = nonce;
    h["X-WC-Store-Api-Nonce"] = nonce;
  }
  return h;
}

function applyWCHeaders(wcRes: Response, nextRes: NextResponse) {
  // Relay nonce so the client can authenticate subsequent mutations
  const nonce = wcRes.headers.get("x-wc-store-api-nonce");
  if (nonce) nextRes.headers.set("X-WC-Store-API-Nonce", nonce);

  // Relay session cookies — strip Domain=cms.themoveee.com so the browser
  // stores them against our Next.js origin instead of rejecting them.
  const rawCookies: string[] =
    typeof (wcRes.headers as any).getSetCookie === "function"
      ? (wcRes.headers as any).getSetCookie()
      : wcRes.headers.get("set-cookie")
        ? [wcRes.headers.get("set-cookie") as string]
        : [];

  for (const raw of rawCookies) {
    const cleaned = raw
      .replace(/;\s*domain=[^;,]+/gi,    "")          // drop Domain= so it applies to our origin
      .replace(/;\s*samesite=strict/gi,   "; SameSite=Lax");
    nextRes.headers.append("Set-Cookie", cleaned);
  }
}
