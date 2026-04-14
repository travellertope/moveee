import React from 'react';

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
      <svg viewBox="0 0 1440 620" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="heroBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={theme.bg.split(' ')[2]}/>
            <stop offset="50%" stopColor="#14110d"/>
            <stop offset="100%" stopColor="#0c0805"/>
          </linearGradient>
          <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#f3ece0" strokeWidth=".4" opacity=".06"/>
          </pattern>
          <radialGradient id="glow1" cx="25%" cy="40%" r="40%">
            <stop offset="0%" stopColor={theme.glow1} stopOpacity=".35"/>
            <stop offset="100%" stopColor="#14110d" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="glow2" cx="75%" cy="60%" r="35%">
            <stop offset="0%" stopColor={theme.glow2} stopOpacity=".2"/>
            <stop offset="100%" stopColor="#14110d" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <rect width="1440" height="620" fill="url(#heroBg)"/>
        <rect width="1440" height="620" fill="url(#hatch)"/>
        <rect width="1440" height="620" fill="url(#glow1)"/>
        <rect width="1440" height="620" fill="url(#glow2)"/>

        <g opacity=".06" stroke="#f3ece0" strokeWidth="1">
          <line x1="240" y1="0" x2="240" y2="620"/>
          <line x1="480" y1="0" x2="480" y2="620"/>
          <line x1="720" y1="0" x2="720" y2="620"/>
          <line x1="960" y1="0" x2="960" y2="620"/>
          <line x1="1200" y1="0" x2="1200" y2="620"/>
        </g>

        <g opacity=".15">
          <rect x="280" y="120" width="140" height="200" fill={theme.glow1}/>
          <rect x="540" y="160" width="120" height="160" fill={theme.accent}/>
          <rect x="780" y="100" width="180" height="240" fill={theme.glow2}/>
          <rect x="1060" y="140" width="130" height="190" fill="#3d4a2a"/>
        </g>
      </svg>

      <div className="hero-inner">
        <div>
          <div className="hero-eyebrow" style={{ color: theme.accent }}>{issueNo} · Culture Happenings</div>
          <h1 className="hero-title" dangerouslySetInnerHTML={{ __html: title }} />
          {standfirst && <p className="hero-standfirst">{standfirst}</p>}
        </div>
        
        {stats.length > 0 && (
          <div className="hero-stats">
            {stats.map((stat, idx) => (
              <div key={idx} className="hero-stat">
                <div className="num" style={{ color: theme.accent }}>{stat.num}</div>
                <div className="label">{stat.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default EventHero;
