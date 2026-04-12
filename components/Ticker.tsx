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
    <span className="inline-flex items-center">
      <span className="ticker-item px-6 flex items-center">
        {issueUrl ? (
          <Link href={issueUrl} className="hover:underline flex items-center">
            <span className="w-1.5 h-1.5 bg-white rounded-full mr-2"></span>{issueText}
          </Link>
        ) : (
          <span className="flex items-center">
            <span className="w-1.5 h-1.5 bg-white rounded-full mr-2"></span>{issueText}
          </span>
        )}
      </span>
      <span className="ticker-item px-6">{date}</span>
      <span className="ticker-item px-6">{locations}</span>
      <span className="ticker-item px-6">
        {announcementUrl ? (
          <Link href={announcementUrl} className="hover:underline">
            {announcementText}
          </Link>
        ) : (
          announcementText
        )}
      </span>
      <span className="px-6">·</span>
    </span>
  );

  return (
    <div className="bg-black text-white py-2 overflow-hidden whitespace-nowrap border-b border-white/10 uppercase text-[10px] tracking-[0.15em] font-sans font-medium">
      <div className="inline-block animate-marquee whitespace-nowrap">
        {content}
        {content}
        {content}
        {content}
      </div>
    </div>
  );
};

export default Ticker;
