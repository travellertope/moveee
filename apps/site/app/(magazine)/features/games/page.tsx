import Link from "next/link";
import type { Metadata } from "next";
import FeatureCTA from "@/components/FeatureCTA";

export const metadata: Metadata = {
  title: "Daily Games — Keep Your Culture IQ Sharp | Moveee",
  description:
    "Trivia and Who Said It? — two new daily games on Moveee. Two minutes a day, bragging rights forever, and Culture Credits every time you play.",
  alternates: { canonical: "https://themoveee.com/features/games" },
  openGraph: {
    title: "Daily Games — Keep Your Culture IQ Sharp | Moveee",
    description: "Trivia and Who Said It? — two minutes a day, bragging rights forever.",
    url: "https://themoveee.com/features/games",
    siteName: "Moveee",
    type: "website",
    images: [{ url: "/og-fallback.png", width: 1200, height: 630, alt: "Moveee Daily Games" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Daily Games — Keep Your Culture IQ Sharp | Moveee",
    description: "Trivia and Who Said It? — two minutes a day, bragging rights forever.",
  },
};

const GAMES = [
  { icon: "🧠", title: "Trivia", body: "A new set of culture trivia questions every day — multiple choice, with an explanation after each answer." },
  { icon: "💬", title: "Who Said It?", body: "Match the quote to the person who said it. Trickier than it sounds, addictive once you start." },
  { icon: "🧩", title: "Crossword", body: "Coming soon — a daily culture-themed crossword." },
  { icon: "🔢", title: "Sudoku", body: "Coming soon — classic number puzzles, Moveee style." },
];

export default function GamesPage() {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="fp-hero">
        <div className="fp-hero-inner">
          <div>
            <div className="fp-eyebrow-row">
              <Link href="/features" className="fp-back-link">← All features</Link>
            </div>
            <p className="mz-eyebrow" style={{ marginTop: 16 }}>Daily Games</p>
            <h1 className="fp-h1">
              Keep your culture IQ <em>sharp.</em>
            </h1>
            <p className="fp-subhead">
              Two minutes a day. New Trivia and Who Said It? rounds every single day,
              plus Culture Credits for playing and bragging rights for getting it right.
            </p>
            <div className="fp-hero-cta">
              <Link href="/register" className="mz-btn-primary">Join Moveee</Link>
              <a href="#games" className="mz-btn-secondary">See today's games</a>
            </div>
            <p className="fp-trust">Free to join · iOS &amp; Android · One play per game, per day</p>
            <div className="fp-stat-row">
              <div className="fp-stat">
                <span className="fp-stat-num">2</span>
                <span className="fp-stat-label">Minutes a day</span>
              </div>
              <div className="fp-stat">
                <span className="fp-stat-num">Daily</span>
                <span className="fp-stat-label">Fresh questions, every day</span>
              </div>
              <div className="fp-stat">
                <span className="fp-stat-num">Cr</span>
                <span className="fp-stat-label">Earned every time you play</span>
              </div>
            </div>
          </div>
          <div aria-hidden="true">
            <img
              src="https://images.unsplash.com/photo-1632501641765-e568d28b0015?w=900&q=80&auto=format&fit=crop"
              alt=""
              className="fp-hero-photo"
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* ===== GAME GRID ===== */}
      <section className="fp-section" id="games">
        <div className="fp-section-inner">
          <div className="fp-intro">
            <p className="mz-eyebrow mz-eyebrow--centred">Today's lineup, plus what's coming</p>
            <h2 className="fp-h2">Pick your game, play in seconds.</h2>
          </div>
          <div className="fp-grid">
            {GAMES.map((g) => (
              <div key={g.title} className="fp-card">
                <span className="fp-card-icon">{g.icon}</span>
                <div className="fp-card-title">{g.title}</div>
                <p className="fp-card-body">{g.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== DETAIL ===== */}
      <section className="fp-section fp-section--white">
        <div className="fp-section-inner">
          <div className="fp-row">
            <img
              src="https://images.unsplash.com/photo-1606327054678-1dc7decf8a89?w=900&q=80&auto=format&fit=crop"
              alt=""
              className="fp-row-photo"
              loading="lazy"
            />
            <div className="fp-row-text">
              <p className="fp-row-eyebrow">How it works</p>
              <h3 className="fp-row-title">One round a day, every day.</h3>
              <p className="fp-row-body">
                Each game resets daily — once you've played, come back tomorrow for a
                fresh round. Trivia gives you an explanation after every answer so you
                actually learn something, win or lose.
              </p>
              <ul className="fp-row-list">
                <li>One play per game, per day — no grinding, just a quick daily ritual</li>
                <li>Trivia includes an explanation after each question</li>
                <li>Culture Credits and Reputation Points for every completed round</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <FeatureCTA
        currentSlug="games"
        heading="Today's round is waiting."
        body="Download Moveee and see how your culture IQ stacks up — two minutes, every day."
      />
    </>
  );
}
