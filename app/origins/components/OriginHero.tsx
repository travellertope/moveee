import React from 'react';

interface OriginHeroProps {
  title: string;
  standfirst?: string;
}

const OriginHero: React.FC<OriginHeroProps> = ({ title, standfirst }) => {
  return (
    <section className="origins-hero">
      <svg viewBox="0 0 1440 240" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="hatch-origins" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#14110d" strokeWidth=".4" opacity=".03"/>
          </pattern>
        </defs>
        <rect width="1440" height="240" fill="var(--paper)"/>
        <rect width="1440" height="240" fill="url(#hatch-origins)"/>
      </svg>

      <div className="origins-hero-inner">
        <h1 className="origins-hero-title" dangerouslySetInnerHTML={{ __html: title }} />
        <div>
          {standfirst && <p className="origins-hero-standfirst">{standfirst}</p>}
        </div>
      </div>
    </section>
  );
};

export default OriginHero;
