import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const CMS        = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

/** POST /api/vendor/register — promote an authenticated member to vendor */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user    = session?.user as any;
  if (!user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (user?.isVendor) return NextResponse.json({ error: "Already a vendor" }, { status: 409 });

  let body: {
    storeName: string;
    storeUrl: string;
    bio?: string;
    country?: string;
    category?: string;
    instagram?: string;
    website?: string;
  };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!body.storeName?.trim()) return NextResponse.json({ error: "Store name is required" }, { status: 422 });
  if (!body.storeUrl?.trim())  return NextResponse.json({ error: "Store URL is required"  }, { status: 422 });

  try {
    const res = await fetch(`${CMS}/wp-json/culture/v1/vendor/apply`, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${API_SECRET}`,
      },
      body: JSON.stringify({
        user_id:    user.id,
        store_name: body.storeName.trim(),
        store_url:  body.storeUrl.trim(),
        bio:        body.bio?.trim()       ?? "",
        country:    body.country?.trim()   ?? "",
        category:   body.category?.trim()  ?? "",
        instagram:  body.instagram?.trim() ?? "",
        website:    body.website?.trim()   ?? "",
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.message ?? "Registration failed" }, { status: res.status });
    }
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
