import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = (await getServerSession(authOptions as any)) as any;
  const userId = session?.user?.id;

  const { searchParams } = new URL(req.url);
  const page = searchParams.get("page") ?? "1";
  const perPage = searchParams.get("per_page") ?? "20";

  const qs = new URLSearchParams({ page, per_page: perPage });
  if (userId) qs.set("viewer_id", String(userId));

  const res = await fetch(
    `${WP_URL}/wp-json/culture/v1/hub/${id}/feed?${qs}`,
    {
      headers: { Authorization: `Bearer ${API_SECRET}` },
      cache: "no-store",
    }
  );

  const data = await res.json().catch(() => ({ items: [] }));
  return NextResponse.json(data, { status: res.status });
}
