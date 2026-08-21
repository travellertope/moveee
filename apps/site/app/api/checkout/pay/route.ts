import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const CMS = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET;

// POST /api/checkout/pay — start payment for a quote.
// Body: quote_token, name, email, phone, country (for currency/gateway resolution)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await req.json();
  const country = typeof body?.country === "string" ? body.country : "";
  const countryParam = country ? `?country=${encodeURIComponent(country)}` : "";

  const res = await fetch(`${CMS}/wp-json/culture/v1/shop/checkout/pay${countryParam}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_SECRET}`,
    },
    body: JSON.stringify({ ...body, user_id: session.user.id }),
    cache: "no-store",
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json({ error: data.message ?? "Payment failed to start" }, { status: res.status });
  }
  return NextResponse.json(data);
}
