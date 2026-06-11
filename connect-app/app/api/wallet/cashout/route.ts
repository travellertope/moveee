import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET;

interface CashoutBody {
  credits?: number;
  method?: string;
  currency?: string;
  account_name?: string;
  account_number?: string;
  sort_code?: string;
  routing_number?: string;
  bank_name?: string;
  step_up_token?: string;
}

function buildAccountRef(body: CashoutBody): string | null {
  const { currency, account_number, sort_code, routing_number, bank_name } = body;
  if (currency === "GBP") {
    if (!sort_code || !account_number) return null;
    return `SC: ${sort_code} / AC: ${account_number}`;
  }
  if (currency === "USD") {
    if (!bank_name || !routing_number || !account_number) return null;
    return `Bank: ${bank_name} / RT: ${routing_number} / AC: ${account_number}`;
  }
  if (currency === "NGN") {
    if (!bank_name || !account_number) return null;
    return `Bank: ${bank_name} / NUBAN: ${account_number}`;
  }
  return null;
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

  const { credits, method, account_name, currency, step_up_token } = body;

  if (!credits || typeof credits !== "number" || credits < 100) {
    return NextResponse.json({ error: "Minimum cash out is 100 credits." }, { status: 400 });
  }
  if (!currency || !method || !account_name) {
    return NextResponse.json({ error: "All payment details are required." }, { status: 400 });
  }

  const account_ref = buildAccountRef(body);
  if (!account_ref) {
    return NextResponse.json({ error: "Bank details are incomplete for the selected currency." }, { status: 400 });
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
        step_up_token,
      }),
    });

    const data = await res.json();
    if (!res.ok && !data.error && data.message) data.error = data.message;
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
