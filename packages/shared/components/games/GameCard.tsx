import Link from "next/link";

interface GameCardProps {
  href:       string;
  name:       string;
  tagline:    string;
  icon:       string;
  badge:      string;
  accentColor: string;
  badgeBg:    string;
  badgeColor: string;
  difficulty: string;
  rounds:     string;
}

export default function GameCard({
  href, name, tagline, icon, badge,
  accentColor, badgeBg, badgeColor,
  difficulty, rounds,
}: GameCardProps) {
  return (
    <Link href={href} className="game-card">
      <div className="game-card__accent" style={{ background: accentColor }} />
      <span
        className="game-card__badge"
        style={{ background: badgeBg, color: badgeColor, borderColor: badgeColor }}
      >
        {badge}
      </span>
      <div className="game-card__icon">{icon}</div>
      <h2 className="game-card__name">{name}</h2>
      <p className="game-card__tagline">{tagline}</p>
      <div className="game-card__footer">
        <div className="game-card__meta">
          <span className="game-card__meta-item">{difficulty}</span>
          <span className="game-card__meta-item">·</span>
          <span className="game-card__meta-item">{rounds}</span>
        </div>
        <span className="game-card__cta">
          Play now
          <span className="game-card__cta-arrow">→</span>
        </span>
      </div>
    </Link>
  );
}
