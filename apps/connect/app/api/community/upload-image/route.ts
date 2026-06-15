import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import sharp from "sharp";
import { authOptions } from "@/lib/auth";
import { uploadToR2 } from "@/lib/r2";

export const runtime = "nodejs";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 8 * 1024 * 1024;

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

  const userId = session.user.id ?? "u";
  const key = `community/${userId}/${Date.now()}.${uploadExt}`;

  try {
    const url = await uploadToR2(key, uploadBuffer, uploadType);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[upload-image]", err);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
