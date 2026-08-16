import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const CMS        = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

/**
 * POST /api/vendor/profile-image
 * Attaches an already-uploaded WP media attachment (via /api/vendor/upload)
 * as the current vendor's store avatar or banner. Two steps by design —
 * upload the file, then attach it — so the same /api/vendor/upload endpoint
 * used by product images is reused here rather than duplicating upload logic.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user    = session?.user as any;
  if (!user?.isVendor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { type?: string; attachmentId?: number };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (body.type !== "avatar" && body.type !== "banner") {
    return NextResponse.json({ error: "type must be 'avatar' or 'banner'" }, { status: 422 });
  }
  if (!body.attachmentId) {
    return NextResponse.json({ error: "attachmentId is required" }, { status: 422 });
  }

  try {
    const res = await fetch(`${CMS}/wp-json/culture/v1/vendor/profile-image`, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${API_SECRET}`,
      },
      body: JSON.stringify({
        vendor_id:     user.id,
        type:          body.type,
        attachment_id: body.attachmentId,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.message ?? "Update failed" }, { status: res.status });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
