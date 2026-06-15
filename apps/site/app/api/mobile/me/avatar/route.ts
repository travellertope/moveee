import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { uploadToR2 } from "@/lib/r2";

export const runtime = "nodejs";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024;

const WP_API = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

function getBearerToken(req: NextRequest): string {
  const auth = req.headers.get("authorization") ?? "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : "";
}

export async function POST(req: NextRequest) {
  const token = getBearerToken(req);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, or WebP allowed." }, { status: 400 });
  }

  const rawBuffer = Buffer.from(await file.arrayBuffer());
  if (rawBuffer.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be under 8 MB." }, { status: 400 });
  }

  // Crop to square and resize to 400×400 for avatars
  let uploadBuffer: Buffer;
  try {
    uploadBuffer = await sharp(rawBuffer)
      .resize(400, 400, { fit: "cover", position: "centre" })
      .webp({ quality: 85 })
      .toBuffer();
  } catch {
    uploadBuffer = rawBuffer;
  }

  // Get user ID from WordPress to namespace the avatar key
  const profileRes = await fetch(`${WP_API}/wp-json/culture/v1/mobile/me`, {
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => null);

  const userId: string = profileRes?.ok
    ? String((await profileRes.json().catch(() => ({}))).id ?? "u")
    : token.slice(-8).replace(/[^a-zA-Z0-9]/g, "x");

  const key = `avatars/${userId}/avatar-${Date.now()}.webp`;

  let avatarUrl: string;
  try {
    avatarUrl = await uploadToR2(key, uploadBuffer, "image/webp");
  } catch (err) {
    console.error("[avatar/upload]", err);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }

  // Save the URL back to WordPress user meta
  await fetch(`${WP_API}/wp-json/culture/v1/mobile/me/avatar-url`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url: avatarUrl }),
  }).catch(() => null); // best-effort; don't fail the upload if this fails

  return NextResponse.json({ url: avatarUrl });
}
