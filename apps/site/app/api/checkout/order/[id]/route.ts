import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const CMS = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET;

// GET /api/checkout/order/{id} — order status lookup, ownership-checked.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await params;

  const res = await fetch(
    `${CMS}/wp-json/culture/v1/shop/checkout/order/${encodeURIComponent(id)}?user_id=${session.user.id}`,
    {
      headers: { Authorization: `Bearer ${API_SECRET}` },
      cache: "no-store",
    }
  );

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json({ error: data.message ?? "Order not found" }, { status: res.status });
  }
  return NextResponse.json(data);
}
