'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function ConnectHero() {
  const { data: session, status } = useSession();
  // While session is loading, render nothing — avoids layout shift
  if (status === 'loading' || session) return null;

  return (
    <section className="mco-hero">
      <div className="mco-hero-inner">
        <div className="mco-hero-text">
          <p className="mco-eyebrow">Moveee</p>
          <h1 className="mco-headline">
            Where culture <em>gathers.</em>
          </h1>
          <p className="mco-lede">
            Village square for culture loving creatives, entrepreneurs, professionals.
          </p>
        </div>
        <div className="mco-hero-cta">
          <Link href="/register" className="con-btn-primary">Join Moveee →</Link>
          <Link href="/login?callbackUrl=/connect" className="con-btn-ghost">Already a member? Sign in</Link>
        </div>
      </div>
      <nav className="mco-section-nav" aria-label="Connect sections">
        <a href="#feed" className="mco-nav-link">Pulse Feed</a>
        <Link href="/connect/people" className="mco-nav-link">People Near Me</Link>
        <Link href="/connect/membership" className="mco-nav-link">Membership</Link>
      </nav>
    </section>
  );
}
