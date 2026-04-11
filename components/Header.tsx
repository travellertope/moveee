"use client";

import React from "react";
import Link from "next/link";
import Ticker from "./Ticker";
import { Search, ShoppingBag, User } from "lucide-react";

interface HeaderProps {
  variant?: "light" | "dark";
}

const Header = ({ variant = "light" }: HeaderProps) => {
  const isDark = variant === "dark";
  const bgClass = isDark ? "bg-night text-paper" : "bg-paper text-ink";
  const borderClass = isDark ? "border-ink-soft/30" : "border-rule";
  const navBgClass = isDark ? "bg-indigo-deep/50" : "bg-paper-deep";
  const softClass = isDark ? "text-paper/70" : "text-ink-soft";

  return (
    <header className={`w-full ${bgClass} z-50 transition-colors duration-500`}>
      <Ticker variant={variant} />
      
      <div className={`border-b ${borderClass}`}>
        <div className="max-w-[1440px] mx-auto px-6 h-24 flex items-center justify-between">
          
          {/* Left: Quick Links */}
          <div className={`hidden lg:flex items-center gap-8 text-[11px] uppercase tracking-[0.2em] font-medium ${softClass}`}>
            <Link href="/magazine" className="text-ochre font-bold">The Magazine</Link>
            <Link href="/about" className="hover:text-ochre transition-colors">Our Ethos</Link>
            <Link href="/contact" className="hover:text-ochre transition-colors">Connect</Link>
          </div>

          {/* Center: Brand Logo */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <Link href="/">
              <h1 className={`text-4xl md:text-5xl font-serif font-black tracking-[-0.03em] ${isDark ? "text-paper" : "text-ink"}`}>
                THE MOVEEE
              </h1>
            </Link>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-6">
            <button className="hover:text-ochre transition-colors"><Search size={20} strokeWidth={1.5} /></button>
            <Link href="/newsletter" className={`hidden border ${isDark ? "border-paper text-paper" : "border-ink text-ink"} px-6 py-2 rounded-full text-[10px] uppercase font-bold tracking-widest hover:bg-ochre hover:text-paper hover:border-ochre transition-all`}>
              Subscribe
            </Link>
            <Link href="/account" className="hover:text-ochre transition-colors"><User size={20} strokeWidth={1.5} /></Link>
          </div>
        </div>
      </div>

      {/* Bottom Nav: Magazine Pillars */}
      <nav className={`border-b ${borderClass} ${navBgClass} overflow-x-auto no-scrollbar`}>
        <div className={`max-w-4xl mx-auto flex items-center justify-center gap-8 md:gap-14 py-3 text-[10px] uppercase tracking-[0.25em] font-bold ${softClass} whitespace-nowrap px-6`}>
          <Link href="/magazine?category=culture" className="hover:text-ochre transition-colors">Culture</Link>
          <Link href="/magazine?category=lifestyle" className="hover:text-ochre transition-colors">Lifestyle</Link>
          <Link href="/magazine?category=interviews" className="hover:text-ochre transition-colors">Interviews</Link>
          <Link href="/magazine?category=portraits" className="hover:text-ochre transition-colors">Portraits</Link>
          <Link href="/magazine?category=dispatches" className="hover:text-ochre transition-colors">Dispatches</Link>
        </div>
      </nav>
    </header>
  );
};

export default Header;
