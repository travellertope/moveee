import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { uploadToR2 } from "@/lib/r2";

export const runtime = "nodejs";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 8 * 1024 * 1024;

// Authenticated via Bearer token (WP JWT) — we extract user_id from the
// Authorization header rather than a Next.js session since this is a mobile client.
function extractUserId(req: NextRequest): string {
  // The mobile API client sends `Authorization: Bearer <jwt>`.
  // We don't validate the JWT here (WordPress does that for post submit),
  // but we use the presence of the header as a basic auth gate and derive
  // a folder name from a hash of the token so uploads are namespaced.
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return "";
  // Use last 8 chars of token as a short user folder key
  const token = auth.slice(7);
  return token.slice(-8).replace(/[^a-zA-Z0-9]/g, "x");
}

export async function POST(req: NextRequest) {
  const userKey = extractUserId(req);
  if (!userKey) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
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

  let uploadBuffer: Buffer;
  let uploadType: string;
  let uploadExt: string;

  if (file.type === "image/gif") {
    uploadBuffer = rawBuffer;
    uploadType = "image/gif";
    uploadExt = "gif";
  } else {
    try {
      uploadBuffer = await sharp(rawBuffer)
        .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
      uploadType = "image/webp";
      uploadExt = "webp";
    } catch {
      uploadBuffer = rawBuffer;
      uploadType = file.type;
      uploadExt = file.type.split("/")[1].replace("jpeg", "jpg");
    }
  }

  const key = `community/${userKey}/${Date.now()}.${uploadExt}`;

  try {
    const url = await uploadToR2(key, uploadBuffer, uploadType);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[mobile/upload-image]", err);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
