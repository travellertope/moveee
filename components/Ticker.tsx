"use client";

import React from "react";
import Link from "next/link";

interface TickerProps {
  issueText?: string;
  issueUrl?: string;
  announcementText?: string;
  announcementUrl?: string;
  locations?: string;
  date?: string;
}

const Ticker = ({
  issueText = "Issue N°014",
  issueUrl = "",
  announcementText = "Culture Narratives Vol I out now",
  announcementUrl = "",
  locations = "Lagos · London · Accra · NYC",
  date = "",
}: TickerProps) => {

  const content = (
    <div className="flex items-center space-x-24 px-12">
      <div className="flex items-center gap-3">
        <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
        {issueUrl ? (
          <Link href={issueUrl} className="hover:underline whitespace-nowrap">
            {issueText}
          </Link>
        ) : (
          <span className="whitespace-nowrap">{issueText}</span>
        )}
      </div>
      <span className="whitespace-nowrap text-white/70">{date}</span>
      <span className="whitespace-nowrap text-white/70 tracking-[0.2em]">
        {locations}
      </span>
      <div className="flex items-center gap-3">
        {announcementUrl ? (
          <Link href={announcementUrl} className="hover:underline whitespace-nowrap">
            {announcementText}
          </Link>
        ) : (
          <span className="whitespace-nowrap">{announcementText}</span>
        )}
      </div>
      <span className="px-6 text-white/20">|</span>
    </div>
  );

  return (
    <div className="bg-black text-white py-6 overflow-hidden whitespace-nowrap border-b border-white/10 uppercase text-[10px] tracking-[0.2em] font-sans font-medium">
      <div className="flex w-max animate-marquee">
        {/* Two copies: animation translates -50% (= one copy width) for seamless loop */}
        {Array(2).fill(null).map((_, i) => (
          <div key={i} className="flex shrink-0 items-center">
            {content}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Ticker;
