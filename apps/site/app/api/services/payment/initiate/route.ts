import { NextRequest, NextResponse } from "next/server";
import { resolveSectionPayment, resolvePartnershipPayment, type PaymentKind } from "@/app/services/payment-lookup";

const CMS = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET;

// POST /api/services/payment/initiate — start a /services checkout.
// Body: name, email, market, sectionId, itemName, kind ("one_time" |
// "subscription"), and either nothing more (a normal market section) or
// partnershipCategory (a Media Partnership sub-category page).
//
// The price is never taken from the request — it's re-derived here, on the
// server, from the same market-data.ts/partnership-pages.ts a pricing card
// itself renders from (see payment-lookup.ts's own header comment for why).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "invalid_body", message: "Invalid request." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const market = typeof body.market === "string" ? body.market : "";
  const sectionId = typeof body.sectionId === "string" ? body.sectionId : "";
  const itemName = typeof body.itemName === "string" ? body.itemName : "";
  const kind: PaymentKind = body.kind === "subscription" ? "subscription" : "one_time";
  const partnershipCategory = typeof body.partnershipCategory === "string" ? body.partnershipCategory : "";

  if (!name || !email || !sectionId || !itemName) {
    return NextResponse.json({ error: "missing_fields", message: "Please fill in your name and email." }, { status: 400 });
  }

  const resolved = partnershipCategory
    ? resolvePartnershipPayment(market, partnershipCategory, itemName, kind)
    : resolveSectionPayment(market, sectionId, itemName, kind);

  if (!resolved) {
    return NextResponse.json(
      { error: "not_payable", message: "This package isn't available for direct checkout — please get in touch instead." },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`${CMS}/wp-json/culture/v1/services/payment/initiate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_SECRET}`,
      },
      body: JSON.stringify({
        name,
        email,
        market,
        section_id: partnershipCategory ? `partnership-${partnershipCategory}` : sectionId,
        item_name: resolved.label,
        item_kind: kind,
        price_amount: resolved.amount,
        price_currency: resolved.currency,
      }),
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error ?? "payment_error", message: data?.message ?? "Could not start checkout. Please try again." },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json({ error: "server_error", message: "Internal server error." }, { status: 500 });
  }
}
