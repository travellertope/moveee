import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const userId = session.user.id ?? session.user.sub ?? "";

  const formData = await req.formData();
  const file = formData.get("file");
  const type = (formData.get("type") as string) ?? "cover";

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const fd = new FormData();
  fd.append("file", file);
  fd.append("type", type);
  fd.append("user_id", String(userId));

  const res = await fetch(`${WP_URL}/wp-json/culture/v1/cluster/${id}/photo`, {
    method: "POST",
    headers: { Authorization: `Bearer ${API_SECRET}` },
    body: fd,
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
