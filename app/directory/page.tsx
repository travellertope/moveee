import { getWPData, GET_DIRECTORY_ENTRIES, GET_DIRECTORY_TYPES } from "@/lib/wp";
import Link from "next/link";
import "../directory.css";
import DirectoryGrid from "@/components/DirectoryGrid";

export const revalidate = 3600;

export const metadata = {
  title: "Culture Directory · The Moveee",
  description:
    "A living wiki of African and diaspora culture — people, places, movements, genres, and more.",
};

export default async function DirectoryPage() {
  const [entriesData, typesData] = await Promise.allSettled([
    getWPData(GET_DIRECTORY_ENTRIES, { first: 200 }),
    getWPData(GET_DIRECTORY_TYPES, {}),
  ]);

  const entries: any[] =
    entriesData.status === "fulfilled"
      ? (entriesData.value?.cultureDirectories?.nodes ?? [])
      : [];

  const types: any[] =
    typesData.status === "fulfilled"
      ? (typesData.value?.cultureDirectoryTypes?.nodes ?? [])
      : [];

  return (
    <>
      {/* ── HERO ── */}
      <section className="dir-hero">
        <div className="dir-hero-inner">
          <div className="dir-eyebrow">★ The Moveee</div>
          <h1 className="dir-heading">Culture Directory</h1>
          <p className="dir-subheading">
            A living wiki of African and diaspora culture — people, places,
            movements, genres, and more. Community-built. AI-assisted.
          </p>
          <Link href="/directory/submit" className="dir-hero-cta">
            Add an Entry →
          </Link>
        </div>
      </section>

      {/* ── GRID + FILTERS ── */}
      <div className="dir-wrap">
        {entries.length === 0 ? (
          <div className="dir-empty">
            <p>
              No entries yet.{" "}
              <Link href="/directory/submit">Be the first to add one →</Link>
            </p>
          </div>
        ) : (
          <DirectoryGrid entries={entries} types={types} />
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
