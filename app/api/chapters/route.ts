const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

export async function GET() {
  try {
    const res = await fetch(`${WP_URL}/wp-json/culture/v1/chapters`, {
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return Response.json([], { status: 200 });
    }

    const data = await res.json();
    return Response.json(data);
  } catch {
    return Response.json([], { status: 200 });
  }
}
