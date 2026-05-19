import { NextRequest, NextResponse } from "next/server";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const discipline = searchParams.get("discipline") ?? "";
  const location = searchParams.get("location") ?? "";

  try {
    const params = new URLSearchParams({ directory: "1" });
    if (search) params.set("search", search);
    if (discipline) params.set("discipline", discipline);
    if (location) params.set("location", location);

    const res = await fetch(
      `${WP_URL}/wp-json/culture/v1/members?${params}`,
      { next: { revalidate: 300 } }
    );

    if (!res.ok) return NextResponse.json({ members: [] });

    const data = await res.json();
    const members = Array.isArray(data)
      ? data.map((m: any) => ({
          id: String(m.id),
          displayName: m.display_name ?? m.displayName ?? "",
          occupation: m.occupation ?? "",
          city: m.city ?? "",
          countryOfResidence: m.country_of_residence ?? m.countryOfResidence ?? "",
          tier: m.tier ?? "citizen",
          chapter: m.primary_chapter?.name ?? m.primaryChapter?.name ?? "",
          bio: m.directory_bio ?? "",
          disciplines: m.directory_disciplines
            ? String(m.directory_disciplines).split(",").map((s: string) => s.trim()).filter(Boolean)
            : [],
          instagram: m.directory_instagram ?? "",
          linkedin: m.directory_linkedin ?? "",
          website: m.directory_website ?? "",
        }))
      : [];

    return NextResponse.json({ members });
  } catch {
    return NextResponse.json({ members: [] });
  }
}
