import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Categories — Moveee Pulse",
};

const CATEGORIES = [
  { slug: "music",      label: "Music",       desc: "Artists, releases, and the sounds shaping the diaspora." },
  { slug: "fashion",    label: "Fashion",     desc: "Designers, style movements, and cultural identity." },
  { slug: "art",        label: "Art",         desc: "Visual art, exhibitions, and creative voices." },
  { slug: "film",       label: "Film",        desc: "Cinema, directors, and storytelling on screen." },
  { slug: "food",       label: "Food",        desc: "Cuisine, chefs, and the culture on the plate." },
  { slug: "sport",      label: "Sport",       desc: "Athletes, competitions, and sport as culture." },
  { slug: "travel",     label: "Travel",      desc: "Destinations, journeys, and where the diaspora roams." },
  { slug: "literature", label: "Literature",  desc: "Books, writers, and the written word." },
  { slug: "design",     label: "Design",      desc: "Architecture, product, and creative direction." },
  { slug: "tech",       label: "Tech",        desc: "Innovation, startups, and technology from Africa and the diaspora." },
];

export default function CategoriesPage() {
  return (
    <div style={{ background: "#f7f5f2", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ padding: "2rem 1.5rem 1rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <p style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: "0.65rem",
            color: "#c5491f",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            margin: "0 0 0.5rem",
          }}>
            Moveee Pulse
          </p>
          <h1 style={{
            fontSize: "1.5rem",
            fontWeight: 400,
            color: "#14110d",
            margin: "0 0 0.5rem",
            fontFamily: "var(--font-fraunces), serif",
          }}>
            Categories
          </h1>
          <p style={{
            color: "#7a6f5c",
            fontSize: "0.85rem",
            margin: 0,
          }}>
            Explore culture across music, film, fashion, and more — all through an African and diaspora lens.
          </p>
        </div>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 1rem 3rem" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: "1px",
          background: "#e8e2d8",
        }}>
          {CATEGORIES.map(({ slug, label, desc }) => (
            <CategoryCard key={slug} slug={slug} label={label} desc={desc} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CategoryCard({ slug, label, desc }: { slug: string; label: string; desc: string }) {
  return (
    <Link
      href={`/pulse/${slug}`}
      style={{
        background: "#fff",
        padding: "1.5rem",
        textDecoration: "none",
        color: "inherit",
        display: "block",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#fdf9f5"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#fff"; }}
    >
      <p style={{
        fontFamily: "var(--font-mono), monospace",
        fontSize: "0.6rem",
        color: "#c5491f",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        margin: 0,
      }}>
        Category
      </p>
      <p style={{
        fontFamily: "var(--font-fraunces), serif",
        fontSize: "1.1rem",
        fontWeight: 500,
        color: "#14110d",
        margin: "0.4rem 0 0",
      }}>
        {label}
      </p>
      <p style={{
        fontSize: "0.78rem",
        color: "#7a6f5c",
        margin: "0.4rem 0 0",
        lineHeight: 1.5,
      }}>
        {desc}
      </p>
      <p style={{
        fontFamily: "var(--font-mono), monospace",
        fontSize: "0.7rem",
        color: "#c5491f",
        margin: "1rem 0 0",
      }}>
        →
      </p>
    </Link>
  );
}
