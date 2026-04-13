export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const country = searchParams.get("country") ?? "";

  if (!country) return Response.json({ cities: [] });

  try {
    const res = await fetch("https://countriesnow.space/api/v0.1/countries/cities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country }),
      // no-store so each request is fresh
      cache: "no-store",
    });

    if (!res.ok) return Response.json({ cities: [] });

    const data = await res.json();

    if (data.error || !Array.isArray(data.data)) {
      return Response.json({ cities: [] });
    }

    return Response.json({ cities: data.data as string[] });
  } catch {
    return Response.json({ cities: [] });
  }
}
