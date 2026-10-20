import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

export async function POST(req: NextRequest) {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const id = Number(body?.id) || 0;
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  const res = await fetch(`${WP_URL}/wp-json/culture/v1/directory/${id}/enrich`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  }).catch(() => null);

  if (!res || !res.ok) {
    return NextResponse.json({ error: "Enrichment failed." }, { status: res?.status ?? 502 });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
