import { NextRequest, NextResponse } from "next/server";
import { getWPData, GET_DIRECTORY_ENTRY_BY_SLUG } from "@/lib/wp";

/**
 * GET /api/directory/entry?slug=xxx
 *
 * Returns the fields needed to pre-populate the improve/edit form.
 * Public — the entry itself is already public on the site.
 */
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug")?.trim();
  if (!slug) {
    return NextResponse.json({ error: "slug is required." }, { status: 400 });
  }

  try {
    const data = await getWPData(GET_DIRECTORY_ENTRY_BY_SLUG, { slug });
    const entry = data?.cultureDirectory;
    if (!entry) {
      return NextResponse.json({ error: "Entry not found." }, { status: 404 });
    }

    return NextResponse.json({
      title: entry.title ?? "",
      // Strip HTML tags from excerpt — the form textarea is plain text
      excerpt: (entry.excerpt ?? "").replace(/<[^>]*>/g, "").trim(),
      content: entry.content ?? "",
      entryType: entry.cultureDirectoryTypes?.nodes?.[0]?.slug ?? "concept",
      slug: entry.slug,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load entry." },
      { status: 502 }
    );
  }
}
