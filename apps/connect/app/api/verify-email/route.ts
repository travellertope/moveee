const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

export async function POST(req: Request) {
  let body: { uid?: number; token?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ success: false, message: "Invalid request." }, { status: 400 });
  }

  const { uid, token } = body;
  if (!uid || !token) {
    return Response.json({ success: false, message: "uid and token are required." }, { status: 400 });
  }

  const API_SECRET = process.env.CULTURE_API_SECRET;
  try {
    const res = await fetch(`${WP_URL}/wp-json/culture/v1/verify-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_SECRET}`,
        "X-Culture-API-Secret": API_SECRET || "",
      },
      body: JSON.stringify({ uid, token }),
      cache: "no-store",
    });

    const data = await res.json();
    if (!res.ok) {
      return Response.json({ success: false, message: data?.message ?? "Verification failed." }, { status: res.status });
    }
    return Response.json({ success: true, ...data });
  } catch {
    return Response.json({ success: false, message: "Service temporarily unavailable." }, { status: 503 });
  }
}
