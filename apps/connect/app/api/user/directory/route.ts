import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

function wpAuthHeaders() {
  const secret = process.env.CULTURE_API_SECRET ?? "";
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${secret}`,
    "X-Culture-API-Secret": secret,
  };
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const u = session.user as any;
  const secret = process.env.CULTURE_API_SECRET ?? "";

  let body: Record<string, string>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const form = new URLSearchParams({
    user_id:                String(u.id),
    directory_opt_in:       body.directory_opt_in       ?? "0",
    directory_bio:          body.directory_bio          ?? "",
    directory_disciplines:  body.directory_disciplines  ?? "",
    directory_instagram:    body.directory_instagram    ?? "",
    directory_linkedin:     body.directory_linkedin     ?? "",
    directory_website:      body.directory_website      ?? "",
    directory_twitter:      body.directory_twitter      ?? "",
  });

  try {
    const res = await fetch(`${WP_URL}/wp-json/culture/v1/user/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Bearer ${secret}`,
        "X-Culture-API-Secret": secret,
      },
      body: form.toString(),
      cache: "no-store",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({ error: (err as any).message ?? "Update failed" }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const u = session.user as any;

  try {
    const res = await fetch(
      `${WP_URL}/wp-json/culture/v1/user/directory?user_id=${u.id}`,
      { headers: wpAuthHeaders(), cache: "no-store" }
    );
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({
        optIn:       data.directory_opt_in   === true || data.directory_opt_in === "1",
        bio:         data.directory_bio      ?? "",
        disciplines: data.directory_disciplines
          ? String(data.directory_disciplines).split(",").map((s: string) => s.trim()).filter(Boolean)
          : [],
        instagram:   data.directory_instagram ?? "",
        linkedin:    data.directory_linkedin  ?? "",
        website:     data.directory_website   ?? "",
        twitter:     data.directory_twitter   ?? "",
      });
    }
  } catch { /* fall through to defaults */ }

  return NextResponse.json({ optIn: false, bio: "", disciplines: [], instagram: "", linkedin: "", website: "", twitter: "" });
}
