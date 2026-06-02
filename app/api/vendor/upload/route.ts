import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const CMS = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

// WP Application Password — set WP_APP_USER and WP_APP_PASS in .env.local
// Generate at: WP Admin → Users → Edit → Application Passwords
function wpAppAuthHeader(): string {
  const user = process.env.WP_APP_USER ?? "";
  const pass = process.env.WP_APP_PASS ?? "";
  if (!user || !pass) return "";
  return "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
}

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

/** POST /api/vendor/upload
 *  Accepts multipart/form-data with a `file` field.
 *  Proxies to the WordPress media library and returns { url, id }.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user    = session?.user as any;
  if (!user?.isVendor) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const auth = wpAppAuthHeader();
  if (!auth) {
    return NextResponse.json(
      { error: "Media upload not configured — WP_APP_USER / WP_APP_PASS missing." },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Unsupported file type. Use JPEG, PNG, WebP, or GIF." },
      { status: 415 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 8 MB." },
      { status: 413 }
    );
  }

  const fileName =
    (file instanceof File ? file.name : null) ??
    `upload-${Date.now()}.${file.type.split("/")[1]}`;

  try {
    const wpForm = new FormData();
    wpForm.append("file", file, fileName);

    const res = await fetch(`${CMS}/wp-json/wp/v2/media`, {
      method:  "POST",
      headers: { Authorization: auth },
      body:    wpForm,
    });

    const data = await res.json();

    if (!res.ok) {
      const msg = data?.message ?? data?.error ?? "WordPress upload failed";
      return NextResponse.json({ error: msg }, { status: res.status });
    }

    return NextResponse.json({
      id:  data.id,
      url: data.source_url ?? data.guid?.rendered ?? "",
    });
  } catch {
    return NextResponse.json({ error: "Upload service unavailable" }, { status: 503 });
  }
}
