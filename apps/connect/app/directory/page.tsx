import { getWPData, getDirectoryEntriesWithFallback, GET_DIRECTORY_TYPES } from "@/lib/wp";
import Link from "next/link";
import "../directory.css";
import DirectoryGrid from "@/components/DirectoryGrid";

export const revalidate = 3600;

export const metadata = {
  title: { absolute: "Culture Directory | The Moveee" },
  description: "A living reference of global culture — creatives, institutions, movements, genres, cities, and more. Discover and add to the canon.",
};

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type: initialType } = await searchParams;

  const [entries, typesData] = await Promise.allSettled([
    getDirectoryEntriesWithFallback(200),
    getWPData(GET_DIRECTORY_TYPES, {}),
  ]);

  const dirEntries: any[] = entries.status === "fulfilled" ? entries.value : [];
  const types: any[] =
    typesData.status === "fulfilled"
      ? (typesData.value?.cultureDirectoryTypes?.nodes ?? [])
      : [];

  return (
    <>
      {/* ── HERO ── */}
      <section className="dir-hero">
        <div className="dir-hero-inner">
          <h1 className="dir-heading">Culture Directory</h1>
          <p className="dir-subheading">
            A living wiki of global culture — people, places,
            movements, genres, and more. Community-built. AI-assisted.
          </p>
          <Link href="/directory/submit" className="dir-hero-cta">
            Add an Entry →
          </Link>
        </div>
      </section>

      {/* ── GRID + FILTERS ── */}
      <div className="dir-wrap">
        {dirEntries.length === 0 ? (
          <div className="dir-empty">
            <p>
              No entries yet.{" "}
              <Link href="/directory/submit">Be the first to add one →</Link>
            </p>
          </div>
        ) : (
          <DirectoryGrid entries={dirEntries} types={types} initialType={initialType ?? null} />
        )}

        <div className="dir-submit-cta">
          <p>Know something we&rsquo;re missing?</p>
          <Link href="/directory/submit" className="dir-submit-link">
            Submit a new entry →
          </Link>
        </div>
      </div>
    </>
  );
}
