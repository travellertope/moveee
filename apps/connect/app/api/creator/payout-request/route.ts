import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions as any) as any;
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { amount, currency, bank_code, account_number, account_name } = body as {
    amount?: number;
    currency?: string;
    bank_code?: string;
    account_number?: string;
    account_name?: string;
  };

  if (!amount || typeof amount !== "number" || amount <= 0) {
    return NextResponse.json({ error: "Amount must be greater than zero." }, { status: 400 });
  }
  if (!currency || !bank_code || !account_number || !account_name) {
    return NextResponse.json({ error: "All bank details are required." }, { status: 400 });
  }

  try {
    const res = await fetch(`${WP_URL}/wp-json/culture/v1/creator/payout-request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_SECRET}`,
      },
      body: JSON.stringify({
        user_id: session.user.id,
        amount,
        currency,
        bank_code,
        account_number,
        account_name,
      }),
    });

    const data = await res.json();
    if (!res.ok && !data.error && data.message) data.error = data.message;
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
