import { NextRequest, NextResponse } from "next/server";

const WP_BASE = process.env.NEXT_PUBLIC_WORDPRESS_API_URL?.replace(/\/graphql\/?$/, "") ?? "https://cms.themoveee.com";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch(`${WP_BASE}/wp-json/culture/v1/ticket/initiate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name:              body.name,
        email:             body.email,
        event_slug:        body.eventSlug,
        event_title:       body.eventTitle ?? "",
        ticket_type_slug:  body.ticketTypeSlug,
        ticket_type_name:  body.ticketTypeName ?? body.ticketTypeSlug,
        price_amount:      body.priceAmount,
        price_currency:    body.priceCurrency ?? "NGN",
        source:            body.source ?? "",
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error ?? "ticket_error", message: data?.message ?? "Could not initiate payment." },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json({ error: "server_error", message: "Internal server error." }, { status: 500 });
  }
}
