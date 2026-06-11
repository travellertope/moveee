import React from 'react';

interface OriginHeroProps {
  description?: string;
}

const OriginHero: React.FC<OriginHeroProps> = ({ description }) => {
  return (
    <section className="origins-hero">
      <div className="origins-hero-inner">
        <div className="origins-hero-left">
          <h1 className="origins-hero-title">Moveee <em>Origins</em></h1>
          {description && <p className="origins-hero-desc">{description}</p>}
        </div>
      </div>
    </section>
  );
};

export default OriginHero;
