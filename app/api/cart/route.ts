import { NextRequest, NextResponse } from "next/server";

const CMS = "https://cms.themoveee.com";
const STORE_API = `${CMS}/wp-json/wc/store/v1`;

// Proxy GET /api/cart → WooCommerce Store API /cart
export async function GET(req: NextRequest) {
  try {
    const res = await fetch(`${STORE_API}/cart`, {
      headers: forwardHeaders(req),
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data, {
      status: res.status,
      headers: collectCookies(res),
    });
  } catch {
    return NextResponse.json({ error: "Cart unavailable" }, { status: 502 });
  }
}

// Proxy POST /api/cart?action=add  { id, quantity }
//          /api/cart?action=remove { key }
//          /api/cart?action=update { key, quantity }
export async function POST(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action") ?? "add";
  const body = await req.json();

  const endpoint =
    action === "add"
      ? `${STORE_API}/cart/add-item`
      : action === "remove"
      ? `${STORE_API}/cart/remove-item`
      : `${STORE_API}/cart/update-item`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...forwardHeaders(req),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data, {
      status: res.status,
      headers: collectCookies(res),
    });
  } catch {
    return NextResponse.json({ error: "Cart unavailable" }, { status: 502 });
  }
}

// Forward the WooCommerce session cookie from the browser to the CMS
function forwardHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  const cookie = req.headers.get("cookie");
  if (cookie) headers["Cookie"] = cookie;
  // WooCommerce Store API nonce (sent by client after initial cart fetch)
  const nonce = req.headers.get("x-wc-store-api-nonce");
  if (nonce) headers["X-WC-Store-Api-Nonce"] = nonce;
  return headers;
}

// Relay Set-Cookie headers back so the WC session persists in the browser
function collectCookies(res: Response): Record<string, string> {
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) return { "Set-Cookie": setCookie };
  return {};
}
