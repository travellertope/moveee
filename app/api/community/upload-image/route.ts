import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import sharp from "sharp";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const AUTH = Buffer.from(
  `${process.env.WP_USERNAME ?? ""}:${process.env.WP_APP_PASSWORD ?? ""}`
).toString("base64");

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB raw input limit

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in to upload images." }, { status: 401 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, WebP, or GIF allowed." }, { status: 400 });
  }

  const rawBuffer = Buffer.from(await file.arrayBuffer());
  if (rawBuffer.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be under 8 MB." }, { status: 400 });
  }

  // Compress still images to WebP; leave GIFs as-is (animated GIF support
  // requires additional sharp options and is rarely used here).
  let uploadBuffer: Buffer;
  let uploadType: string;
  let uploadExt: string;

  if (file.type === "image/gif") {
    uploadBuffer = rawBuffer;
    uploadType = "image/gif";
    uploadExt = "gif";
  } else {
    uploadBuffer = await sharp(rawBuffer)
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    uploadType = "image/webp";
    uploadExt = "webp";
  }

  const filename = `community-${Date.now()}.${uploadExt}`;

  const wpRes = await fetch(`${WP_URL}/wp-json/wp/v2/media`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${AUTH}`,
      "Content-Type": uploadType,
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
    body: new Uint8Array(uploadBuffer),
  });

  if (!wpRes.ok) {
    const err = await wpRes.json().catch(() => ({}));
    return NextResponse.json(
      { error: (err as any).message ?? `Upload failed (${wpRes.status})` },
      { status: 500 }
    );
  }

  const media = await wpRes.json();
  // Optimole rewrites source_url automatically once the plugin is active.
  const url: string = media.source_url ?? media.guid?.rendered ?? "";

  return NextResponse.json({ url });
}
