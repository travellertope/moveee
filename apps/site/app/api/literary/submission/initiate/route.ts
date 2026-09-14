import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { LITERARY_TOKEN_COOKIE } from "@/lib/literary-access";

const WP_BASE = process.env.NEXT_PUBLIC_WORDPRESS_API_URL?.replace(/\/graphql\/?$/, "") ?? "https://cms.themoveee.com";

export async function POST(req: NextRequest) {
  try {
    const verifiedToken = (await cookies()).get(LITERARY_TOKEN_COOKIE)?.value ?? "";
    if (!verifiedToken) {
      return NextResponse.json(
        { error: "not_verified", message: "Please verify your email address before submitting." },
        { status: 401 }
      );
    }

    const body = await req.json();

    const res = await fetch(`${WP_BASE}/wp-json/culture/v1/literary/submission/initiate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        verified_token: verifiedToken,
        writer_name:  body.writerName,
        section:      body.section,
        title:        body.title ?? "",
        content:      body.content,
        waiver_code:  body.waiverCode ?? "",
        currency:     body.currency ?? "USD",
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error ?? "submission_error", message: data?.message ?? "Could not submit your work. Please try again." },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json({ error: "server_error", message: "Internal server error." }, { status: 500 });
  }
}
