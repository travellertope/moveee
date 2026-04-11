"use client";

import React from "react";
import Link from "next/link";
import Ticker from "./Ticker";

interface HeaderProps {
  variant?: "light" | "dark";
}

const Header = ({ variant = "light" }: HeaderProps) => {
  // Determine current datestamp
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <>
      <div className="masthead-bar">
        <div className="masthead-bar-left">
          <span><span className="dot"></span>Issue N°014</span>
          <span>{today}</span>
          <span>Lagos · London · Accra · NYC</span>
        </div>
        <div className="masthead-bar-right">
          <span>Culture Narratives Vol I out now</span>
          <span>EN / FR</span>
        </div>
      </div>

      <header className="masthead">
        <nav className="masthead-left">
          <Link href="/magazine">Magazine</Link>
          <Link href="/events">Events</Link>
          <Link href="/origins">Origins</Link>
          <Link href="/shop">Lifestyle</Link>
        </nav>
        <div className="wordmark">
          <div className="kicker">Est. 2022 · Best in Culture</div>
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <h1>The M<em>o</em>veee</h1>
          </Link>
        </div>
        <div className="masthead-right">
          <button>Search</button>
          <Link href="/account">Sign in</Link>
          <Link href="/connect" className="join-btn" style={{ textDecoration: 'none' }}>Join Connect →</Link>
        </div>
      </header>
    </>
  );
};

export default Header;
