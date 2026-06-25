import Link from "next/link";
import type { Metadata } from "next";
import FeatureCTA from "@/components/FeatureCTA";

export const metadata: Metadata = {
  title: "Discover — The Map Only the Community Could Write | Moveee",
  description:
    "Browse Moveee Discover — people, places, food, books, film, genres, movements, artwork, concepts, fashion and TV series, all searchable, filterable by type and region, and rated by the community.",
  alternates: { canonical: "https://themoveee.com/features/discover" },
  openGraph: {
    title: "Discover — The Map Only the Community Could Write | Moveee",
    description:
      "People, places, dishes, films, movements — browsable by type and city, rated by the community that knows them best.",
    url: "https://themoveee.com/features/discover",
    siteName: "Moveee",
    type: "website",
    images: [{ url: "/og-fallback.png", width: 1200, height: 630, alt: "Moveee Discover" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Discover — The Map Only the Community Could Write | Moveee",
    description:
      "People, places, dishes, films, movements — browsable by type and city, rated by the community that knows them best.",
  },
};

const ENTRY_TYPES = [
  { icon: "🧑", label: "People" },
  { icon: "📍", label: "Places" },
  { icon: "🍜", label: "Food" },
  { icon: "📚", label: "Books" },
  { icon: "🎬", label: "Film" },
  { icon: "🎸", label: "Genres" },
  { icon: "✊", label: "Movements" },
  { icon: "🖼️", label: "Artwork" },
  { icon: "💭", label: "Concepts" },
  { icon: "👗", label: "Fashion" },
  { icon: "📺", label: "TV Series" },
];

export default function DiscoverPage() {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="fp-hero">
        <div className="fp-hero-inner">
          <div>
            <div className="fp-eyebrow-row">
              <Link href="/features" className="fp-back-link">← All features</Link>
            </div>
            <p className="mz-eyebrow" style={{ marginTop: 16 }}>Discover</p>
            <h1 className="fp-h1">
              The map <em>only the community could write.</em>
            </h1>
            <p className="fp-subhead">
              Eleven entry types — people, places, food, books, film, genres, movements,
              artwork, concepts, fashion and TV series — searchable, filterable, and rated
              by the people who actually know them.
            </p>
            <div className="fp-hero-cta">
              <Link href="/register" className="mz-btn-primary">Join Moveee</Link>
              <a href="#types" className="mz-btn-secondary">See all entry types</a>
            </div>
            <p className="fp-trust">Free to join · iOS &amp; Android · Built entirely from member contributions</p>
            <div className="fp-stat-row">
              <div className="fp-stat">
                <span className="fp-stat-num">11</span>
                <span className="fp-stat-label">Entry types</span>
              </div>
              <div className="fp-stat">
                <span className="fp-stat-num">★</span>
                <span className="fp-stat-label">Community-rated</span>
              </div>
              <div className="fp-stat">
                <span className="fp-stat-num">🌍</span>
                <span className="fp-stat-label">Filter by region</span>
              </div>
            </div>
          </div>
          <div aria-hidden="true">
            <img
              src="https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=900&q=80&auto=format&fit=crop"
              alt=""
              className="fp-hero-photo"
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* ===== ENTRY TYPE GRID ===== */}
      <section className="fp-section" id="types">
        <div className="fp-section-inner">
          <div className="fp-intro">
            <p className="mz-eyebrow mz-eyebrow--centred">Eleven ways to browse culture</p>
            <h2 className="fp-h2">If it has taste, it's in Discover.</h2>
            <p className="fp-body fp-body--centred">
              Every entry is contributed and vetted by the community — a hidden gem posted
              to the feed becomes a permanent, searchable Discover entry that everyone after
              you can find.
            </p>
          </div>
          <div className="fp-grid">
            {ENTRY_TYPES.map((t) => (
              <div key={t.label} className="fp-card">
                <span className="fp-card-icon">{t.icon}</span>
                <div className="fp-card-title">{t.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SEARCH/FILTER + RAILS ===== */}
      <section className="fp-section fp-section--white">
        <div className="fp-section-inner">
          <div className="fp-row">
            <img
              src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&q=80&auto=format&fit=crop"
              alt=""
              className="fp-row-photo"
              loading="lazy"
            />
            <div className="fp-row-text">
              <p className="fp-row-eyebrow">Search &amp; filter</p>
              <h3 className="fp-row-title">Find exactly what you're looking for.</h3>
              <p className="fp-row-body">
                Search by name, filter by type with a single tap, narrow by region, and sort
                by what matters — most relevant, recently added, highest rated, or trending in
                the community right now.
              </p>
              <ul className="fp-row-list">
                <li>Always-visible type filter — single-select, instant results</li>
                <li>Region filter — Nigeria, Ghana, UK, US, Pan-African and more</li>
                <li>Sort by relevance, recency, rating, or trending</li>
                <li>Live entry count as you refine your filters</li>
              </ul>
            </div>
          </div>

          <div className="fp-row fp-row--reverse">
            <img
              src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900&q=80&auto=format&fit=crop"
              alt=""
              className="fp-row-photo"
              loading="lazy"
            />
            <div className="fp-row-text">
              <p className="fp-row-eyebrow">Recently Added &amp; Trending</p>
              <h3 className="fp-row-title">Always something new to explore.</h3>
              <p className="fp-row-body">
                A Recently Added rail surfaces the newest community contributions. A Trending
                in Community rail highlights what's being referenced and reviewed most right
                now. Below both, an Explore More grid reshuffles every visit so there's always
                something fresh to browse.
              </p>
              <ul className="fp-row-list">
                <li>Recently Added — the newest entries, first</li>
                <li>Trending in Community — ranked by reviews and references</li>
                <li>Explore More — a fresh, shuffled mix on every visit</li>
                <li>Star ratings and review counts on every card</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <FeatureCTA
        currentSlug="discover"
        heading="Start exploring what your city has to offer."
        body="Download Moveee and browse Discover — or post the hidden gem nobody's found yet and become the reason someone else finds it."
      />
    </>
  );
}
