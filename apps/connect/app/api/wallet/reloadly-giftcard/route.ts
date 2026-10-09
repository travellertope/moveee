import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions as any) as any;
  if (!session?.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }

  const { product_id, amount, currency, email } = body;
  if (!product_id || !amount || !email) {
    return NextResponse.json({ error: "product_id, amount and email are required." }, { status: 400 });
  }

  try {
    const res = await fetch(`${WP_URL}/wp-json/culture/v1/reloadly/giftcard`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_SECRET}` },
      body: JSON.stringify({ user_id: session.user.id, product_id, amount, currency, email }),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
