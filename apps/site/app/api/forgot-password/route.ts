const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

export async function POST(req: Request) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ success: false, message: "Invalid request." }, { status: 400 });
  }

  if (!body.email) {
    return Response.json({ success: false, message: "Email is required." }, { status: 400 });
  }

  try {
    await fetch(`${WP_URL}/wp-json/culture/v1/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: body.email }),
      cache: "no-store",
    });
  } catch {
    // Swallow errors — always respond with success to avoid enumeration
  }

  // Always return success regardless of whether the email exists.
  return Response.json({ success: true });
}
