import React from 'react';
import { sanitizeHtml } from "@/lib/sanitize";

interface EventHeroProps {
  title: string;
  standfirst?: string;
  stats?: {
    num: string | number;
    label: string;
  }[];
  issueNo?: string;
  seed?: string; // Used to pick a stable random pattern
}

const EventHero: React.FC<EventHeroProps> = ({ 
  title, 
  standfirst, 
  stats = [], 
  issueNo = "N°03",
  seed = "default"
}) => {
  // Simple hash function for stable "random" pattern selection
  const getSeedIndex = (s: string) => {
    let hash = 0;
    for (let i = 0; i < s.length; hash = s.charCodeAt(i++) + ((hash << 5) - hash));
    return Math.abs(hash);
  };

  const patternIndex = getSeedIndex(seed || title) % 4;

  const patterns = [
    // Pattern 0: The Original (Warm Ochre Glow)
    {
      bg: "linear-gradient(to bottom, #2a1208 0%, #14110d 50%, #0c0805 100%)",
      glow1: "#c5491f",
      glow2: "#b38238",
      accent: "#c5491f"
    },
    // Pattern 1: Deep Indigo & Moss
    {
      bg: "linear-gradient(to bottom, #0c121e 0%, #14110d 50%, #0c0805 100%)",
      glow1: "#1e2b42",
      glow2: "#3d4a2a",
      accent: "#b38238"
    },
    // Pattern 2: Ochre Deep & Paper
    {
      bg: "linear-gradient(to bottom, #4a1d0b 0%, #14110d 60%, #0c0805 100%)",
      glow1: "#8a2d10",
      glow2: "#ebe1d0",
      accent: "#c5491f"
    },
    // Pattern 3: Moss & Gold
    {
      bg: "linear-gradient(to bottom, #1a2212 0%, #14110d 50%, #0c0805 100%)",
      glow1: "#3d4a2a",
      glow2: "#b38238",
      accent: "#b38238"
    }
  ];

  const theme = patterns[patternIndex];

  return (
    <section className="events-hero">
      <div className="hero-inner">
        <h1 className="hero-title" dangerouslySetInnerHTML={{ __html: sanitizeHtml(title) }} />
        {standfirst && <p className="hero-standfirst">{standfirst}</p>}
      </div>
    </section>
  );
};

export default EventHero;
