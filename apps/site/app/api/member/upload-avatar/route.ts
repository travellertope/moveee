import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import sharp from "sharp";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";
const WP_AUTH_HEADERS = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${API_SECRET}`,
  "X-Culture-API-Secret": API_SECRET,
};
const WP_UPLOAD_AUTH = Buffer.from(
  `${process.env.WP_USERNAME ?? ""}:${process.env.WP_APP_PASSWORD ?? ""}`
).toString("base64");

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in to upload a photo." }, { status: 401 });
  }

  const user = session.user as any;
  const userId: string = String(user?.id ?? "");

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

  // Crop to square, resize to 400×400 WebP for consistent avatar dimensions.
  let uploadBuffer: Buffer;
  try {
    uploadBuffer = await sharp(rawBuffer)
      .resize({ width: 400, height: 400, fit: "cover", position: "attention" })
      .webp({ quality: 85 })
      .toBuffer();
  } catch {
    uploadBuffer = rawBuffer;
  }

  const filename = `avatar-${userId}-${Date.now()}.webp`;

  const wpRes = await fetch(`${WP_URL}/wp-json/wp/v2/media`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${WP_UPLOAD_AUTH}`,
      "Content-Type": "image/webp",
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
  const avatarUrl: string = media.source_url ?? media.guid?.rendered ?? "";

  // Save the URL to user meta via the culture REST API.
  const updateRes = await fetch(`${WP_URL}/wp-json/culture/v1/user/update`, {
    method: "POST",
    headers: WP_AUTH_HEADERS,
    body: JSON.stringify({ user_id: userId, avatar_url: avatarUrl }),
  });

  if (!updateRes.ok) {
    return NextResponse.json({ error: "Uploaded but failed to save URL." }, { status: 500 });
  }

  return NextResponse.json({ url: avatarUrl });
}
