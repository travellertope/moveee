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

  const { operator_id, amount, currency, phone, country_iso } = body;
  if (!operator_id || !amount || !phone || !country_iso) {
    return NextResponse.json({ error: "operator_id, amount, phone and country_iso are required." }, { status: 400 });
  }

  try {
    const res = await fetch(`${WP_URL}/wp-json/culture/v1/reloadly/topup`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_SECRET}` },
      body: JSON.stringify({ user_id: session.user.id, operator_id, amount, currency, phone, country_iso }),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
