import { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

interface RegisterBody {
  username: string;
  email: string;
  password: string;
  display_name?: string;
  phone?: string;
  whatsapp?: string;
  tier?: "citizen" | "patron";
  referral_code?: string;
  directory_opt_in?: string;
  directory_disciplines?: string;
  directory_bio?: string;
  next?: string;
  /** Honeypot — real users never see or fill this field; a non-empty value
   * means a bot populated every input on the form. */
  website?: string;
  /** Timestamp (ms) the form mounted, from the client — a submit that
   * arrives implausibly fast almost certainly wasn't a human filling out
   * three fields. Both this and the honeypot need no external service or
   * API keys, unlike a real CAPTCHA. */
  form_loaded_at?: string;
}

const MIN_FORM_FILL_MS = 2500;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const { allowed } = await checkRateLimit("register", ip, 5, "1h");
  if (!allowed) {
    return Response.json({ success: false, message: "Too many requests. Please try again later." }, { status: 429 });
  }

  let body: RegisterBody;

  try {
    body = await req.json();
  } catch {
    return Response.json(
      { success: false, message: "Invalid request body." },
      { status: 400 }
    );
  }

  if (body.website) {
    // Silently reject rather than explain why — no point telling a bot
    // script exactly what tripped it.
    return Response.json({ success: false, message: "Registration failed." }, { status: 400 });
  }

  const loadedAt = Number(body.form_loaded_at);
  if (Number.isFinite(loadedAt) && Date.now() - loadedAt < MIN_FORM_FILL_MS) {
    return Response.json({ success: false, message: "Registration failed." }, { status: 400 });
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

  const API_SECRET = process.env.CULTURE_API_SECRET;

  try {
    const res = await fetch(`${WP_URL}/wp-json/culture/v1/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_SECRET}`,
      },
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
