const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

interface RegisterBody {
  username: string;
  email: string;
  password: string;
  display_name?: string;
  phone?: string;
  whatsapp?: string;
  tier?: "citizen" | "patron";
  primary_chapter?: number;
  secondary_chapter?: number;
  referral_code?: string;
}

export async function POST(req: Request) {
  let body: RegisterBody;

  try {
    body = await req.json();
  } catch {
    return Response.json(
      { success: false, message: "Invalid request body." },
      { status: 400 }
    );
  }

  const { username, email, password } = body;

  if (!username || !email || !password) {
    return Response.json(
      { success: false, message: "username, email, and password are required." },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return Response.json(
      { success: false, message: "Password must be at least 8 characters." },
      { status: 422 }
    );
  }

  try {
    const res = await fetch(`${WP_URL}/wp-json/culture/v1/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      return Response.json(
        { success: false, message: data?.message ?? "Registration failed." },
        { status: res.status }
      );
    }

    return Response.json({ success: true, ...data });
  } catch {
    return Response.json(
      { success: false, message: "Service temporarily unavailable." },
      { status: 503 }
    );
  }
}
