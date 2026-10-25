import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const BASE = `${WP_URL}/wp-json/wp/v2`;
const AUTH = Buffer.from(
  `${process.env.WP_USERNAME ?? ""}:${process.env.WP_APP_PASSWORD ?? ""}`
).toString("base64");

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const user = session.user as any;

  const body = await req.json().catch(() => ({})) as {
    postId?: number;
    text?: string;
    tag?: string;
    template_type?: string;
    // Event fields
    event_title?: string;
    event_date?: string;
    event_end_date?: string;
    event_venue?: string;
    event_city?: string;
    event_address?: string;
    event_admission?: string;
    event_category?: string;
    ticket_url?: string;
    rsvp_enabled?: boolean;
    rsvp_capacity?: number;
  };

  const { postId, text, tag, template_type } = body;

  if (!postId) {
    return NextResponse.json({ error: "Missing postId." }, { status: 400 });
  }

  const isEvent = template_type === "event";

  if (!isEvent && !text?.trim()) {
    return NextResponse.json({ error: "Missing text." }, { status: 400 });
  }

  if (isEvent && !body.event_title?.trim()) {
    return NextResponse.json({ error: "Event title is required." }, { status: 400 });
  }

  const userId = Number(user?.id ?? user?.databaseId ?? 0);

  // Verify ownership
  const check = await fetch(`${BASE}/community-posts/${postId}?_fields=id,author,meta`, {
    headers: { Authorization: `Basic ${AUTH}` },
    cache: "no-store",
  });

  if (!check.ok) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }

  const post = await check.json();
  const communityAuthorId = Number(post.meta?.community_author_id ?? 0);
  const isAuthor = post.author === userId || (communityAuthorId > 0 && communityAuthorId === userId);
  const isAdmin = user?.isAdmin === true || user?.role === "administrator";

  if (!isAuthor && !isAdmin) {
    return NextResponse.json({ error: "You can only edit your own posts." }, { status: 403 });
  }

  const isPro = user?.tier === "patron" || user?.tier === "lit" || isAdmin;

  if (!isPro) {
    return NextResponse.json({ error: "Pro membership required to edit posts." }, { status: 403 });
  }

  const escHtml = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  const updateBody: Record<string, any> = {};

  if (isEvent) {
    const title = body.event_title!.trim().slice(0, 150);
    const desc = text?.trim() ?? "";
    updateBody.title = title;
    updateBody.content = desc ? `<p>${escHtml(desc).replace(/\n/g, "</p><p>")}</p>` : "";
    updateBody.meta = {
      _event_date:        body.event_date ?? "",
      _event_end_date:    body.event_end_date?.trim() ?? "",
      _event_venue:       body.event_venue?.trim() ?? "",
      _event_city:        body.event_city?.trim() ?? "",
      _event_address:     body.event_address?.trim() ?? "",
      _event_admission:   body.event_admission?.trim() ?? "",
      _event_ticket_url:  body.ticket_url?.trim() ?? "",
      _event_category:    body.event_category ?? "",
      // RSVP is only updateable for Pro users
      ...(isPro && {
        _culture_rsvp_enabled:  !!body.rsvp_enabled,
        _culture_rsvp_capacity: body.rsvp_enabled && body.rsvp_capacity ? Math.max(0, Number(body.rsvp_capacity)) : 0,
      }),
    };
  } else {
    updateBody.content = `<p>${escHtml(text!.trim()).replace(/\n/g, "</p><p>")}</p>`;
    if (tag) updateBody.meta = { community_tag: tag };
  }

  const res = await fetch(`${BASE}/community-posts/${postId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${AUTH}` },
    body: JSON.stringify(updateBody),
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json({ error: (err as any).message ?? "Edit failed." }, { status: res.status });
  }

  revalidatePath("/feed");
  revalidatePath("/community");

  return NextResponse.json({ success: true });
}
