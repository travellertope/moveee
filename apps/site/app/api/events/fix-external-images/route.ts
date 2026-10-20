/**
 * POST /api/events/fix-external-images
 *
 * Admin endpoint. Finds all published events whose _culture_event_image_url
 * is an external URL, downloads each image, uploads it to the WordPress Media
 * Library, and replaces the meta value with the stable WP-hosted URL.
 *
 * Body (optional): { perPage?: number } — events to process per call (default 50).
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime     = "nodejs";
export const maxDuration = 300;

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_KEY = process.env.CULTURE_API_SECRET ?? "";
const WP_UPLOAD_AUTH = Buffer.from(
  `${process.env.WP_USERNAME ?? ""}:${process.env.WP_APP_PASSWORD ?? ""}`
).toString("base64");

function isAllowed(email: string): boolean {
  const list = process.env.PULSE_ADMIN_EMAILS;
  if (!list) return true;
  return list.split(",").map((e) => e.trim().toLowerCase()).includes(email.toLowerCase());
}

async function downloadAndUpload(imageUrl: string): Promise<string | null> {
  try {
    const imgRes = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Moveee/1.0; +https://themoveee.com)",
        Accept: "image/*,*/*;q=0.8",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(12000),
    });
    if (!imgRes.ok) return null;

    const contentType = imgRes.headers.get("content-type") ?? "";
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const mime = allowed.find((t) => contentType.startsWith(t));
    if (!mime) return null;

    const buffer = await imgRes.arrayBuffer();
    if (buffer.byteLength > 8 * 1024 * 1024) return null;

    const ext  = mime.split("/")[1].replace("jpeg", "jpg");
    const name = `event-img-${Date.now()}.${ext}`;

    const upload = await fetch(`${WP_URL}/wp-json/wp/v2/media`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${WP_UPLOAD_AUTH}`,
        "Content-Type": mime,
        "Content-Disposition": `attachment; filename="${name}"`,
      },
      body: new Uint8Array(buffer),
      signal: AbortSignal.timeout(20000),
    });
    if (!upload.ok) return null;

    const media = await upload.json();
    return (media.source_url ?? media.guid?.rendered ?? null) as string | null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  if (!isAllowed((session.user as any).email)) {
    return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const perPage = Math.min(Number(body.perPage) || 50, 200);

  const listRes = await fetch(
    `${WP_URL}/wp-json/culture/v1/events/external-images?per_page=${perPage}`,
    { headers: { Authorization: `Bearer ${API_KEY}` }, cache: "no-store" }
  );
  if (!listRes.ok) {
    return NextResponse.json({ error: "Failed to fetch events from WP." }, { status: 502 });
  }
  const { events, total } = await listRes.json();

  const results = { fixed: 0, skipped: 0, errors: [] as string[], total };

  for (const event of events as Array<{ id: number; title: string; image_url: string }>) {
    try {
      const wpUrl = await downloadAndUpload(event.image_url);
      if (!wpUrl) { results.skipped++; continue; }

      const patchRes = await fetch(`${WP_URL}/wp-json/culture/v1/events/update-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
        body: JSON.stringify({ id: event.id, image_url: wpUrl }),
        cache: "no-store",
      });
      if (patchRes.ok) {
        results.fixed++;
      } else {
        results.errors.push(`#${event.id} "${event.title}": patch failed ${patchRes.status}`);
      }
    } catch (err: any) {
      results.errors.push(`#${event.id} "${event.title}": ${err?.message}`);
    }
    await new Promise((r) => setTimeout(r, 300));
  }

  return NextResponse.json({ success: true, ...results });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !isAllowed((session.user as any).email)) {
    return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  }
  const res = await fetch(
    `${WP_URL}/wp-json/culture/v1/events/external-images?per_page=200`,
    { headers: { Authorization: `Bearer ${API_KEY}` }, cache: "no-store" }
  );
  if (!res.ok) return NextResponse.json({ error: "WP unreachable." }, { status: 502 });
  const { total } = await res.json();
  return NextResponse.json({ externalImages: total });
}
