"use client";

import React from "react";

interface TickerProps {
  variant?: "light" | "dark";
}

const Ticker = ({ variant = "light" }: TickerProps) => {
  const isDark = variant === "dark";
  const bgClass = isDark ? "bg-ochre text-paper" : "bg-ink text-paper";

  return (
    <div className={`${bgClass} border-b border-rule py-1.5 overflow-hidden whitespace-nowrap transition-colors duration-500`}>
      <div className="inline-block animate-marquee uppercase text-[10px] tracking-[0.2em] font-sans font-medium">
        <span>The Moveee — Best in Culture • </span>
        <span>Issue N°14 Available Now • </span>
        <span>Shop Vetted Makers • </span>
        <span>Join the Community • </span>
        <span>The Moveee — Best in Culture • </span>
        <span>Issue N°14 Available Now • </span>
        <span>Shop Vetted Makers • </span>
        <span>Join the Community • </span>
        <span>The Moveee — Best in Culture • </span>
        <span>Issue N°14 Available Now • </span>
        <span>Shop Vetted Makers • </span>
        <span>Join the Community • </span>
      </div>
    </div>
  );
};

export default Ticker;
