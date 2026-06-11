const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

export async function POST(req: Request) {
  let body: { login?: string; key?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ success: false, message: "Invalid request." }, { status: 400 });
  }

  const { login, key, password } = body;

  if (!login || !key || !password) {
    return Response.json(
      { success: false, message: "login, key, and password are required." },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`${WP_URL}/wp-json/culture/v1/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, key, password }),
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      return Response.json(
        { success: false, message: data?.message ?? "Reset failed." },
        { status: res.status }
      );
    }

    return Response.json({ success: true, message: data.message });
  } catch {
    return Response.json(
      { success: false, message: "Service temporarily unavailable." },
      { status: 503 }
    );
  }
}
