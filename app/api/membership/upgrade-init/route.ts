import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { NextRequest } from "next/server";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { plan_key } = await req.json();

    const res = await fetch(`${WP_URL}/wp-json/culture/v1/user/upgrade-init`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_SECRET}`,
        "X-Culture-API-Secret": API_SECRET || "",
      },
      body: JSON.stringify({
        user_id: (session.user as any).id,
        plan_key,
      }),
    });

    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch (error) {
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
