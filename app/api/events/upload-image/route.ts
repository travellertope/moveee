import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import sharp from "sharp";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const WP_UPLOAD_AUTH = Buffer.from(
  `${process.env.WP_USERNAME ?? ""}:${process.env.WP_APP_PASSWORD ?? ""}`
).toString("base64");

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 12 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions as any) as any;
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in to upload an image." }, { status: 401 });
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
    return NextResponse.json({ error: "Image must be under 12 MB." }, { status: 400 });
  }

  // Resize to max 1600px wide, convert to WebP for consistent quality.
  let uploadBuffer: Buffer;
  let contentType = "image/webp";
  try {
    uploadBuffer = await sharp(rawBuffer)
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 88 })
      .toBuffer();
  } catch {
    uploadBuffer = rawBuffer;
    contentType = file.type;
  }

  const userId = String(session.user.id ?? "anon");
  const filename = `event-${userId}-${Date.now()}.webp`;

  const wpRes = await fetch(`${WP_URL}/wp-json/wp/v2/media`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${WP_UPLOAD_AUTH}`,
      "Content-Type": contentType,
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
  const url: string = media.source_url ?? media.guid?.rendered ?? "";
  const id: number  = media.id ?? 0;
  return NextResponse.json({ url, id });
}
