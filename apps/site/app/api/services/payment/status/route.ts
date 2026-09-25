import { NextRequest, NextResponse } from "next/server";

const CMS = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

// GET /api/services/payment/status?code=SVC-XXXX — polled by the checkout
// page while waiting for Stripe's async webhook to confirm a payment.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code") ?? "";
  if (!code) {
    return NextResponse.json({ error: "missing_code" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${CMS}/wp-json/culture/v1/services/payment/status?code=${encodeURIComponent(code)}`,
      { cache: "no-store" }
    );
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
