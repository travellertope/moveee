import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const CMS = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET;

export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get("product_id");
  if (!productId) return NextResponse.json({ error: "product_id required" }, { status: 400 });

  const res = await fetch(`${CMS}/wp-json/moveee/v1/products/${productId}/reviews`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return NextResponse.json([]);
  return NextResponse.json(await res.json());
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await req.json();
  const { product_id, rating, content } = body;
  if (!product_id || !rating || !content?.trim()) {
    return NextResponse.json({ error: "product_id, rating and content are required" }, { status: 400 });
  }

  const res = await fetch(`${CMS}/wp-json/moveee/v1/products/${product_id}/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_SECRET}`,
    },
    body: JSON.stringify({ user_id: session.user.id, rating, content: content.trim() }),
  });

  const data = await res.json();
  if (!res.ok) return NextResponse.json({ error: data.message ?? "Failed to post review" }, { status: res.status });
  return NextResponse.json(data);
}
