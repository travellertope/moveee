import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET;

interface CashoutBody {
  credits?: number;
  method?: string;
  account_name?: string;
  account_ref?: string;
  currency?: string;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions as any) as any;
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: CashoutBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { credits, method, account_name, account_ref, currency } = body;

  if (!credits || typeof credits !== "number" || credits < 100) {
    return NextResponse.json({ error: "Minimum cash out is 100 credits." }, { status: 400 });
  }
  if (!method || !account_name || !account_ref || !currency) {
    return NextResponse.json({ error: "All payment details are required." }, { status: 400 });
  }

  try {
    const res = await fetch(`${WP_URL}/wp-json/culture/v1/wallet/cashout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_SECRET}`,
      },
      body: JSON.stringify({
        user_id: session.user.id,
        credits,
        method,
        account_name,
        account_ref,
        currency,
      }),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
