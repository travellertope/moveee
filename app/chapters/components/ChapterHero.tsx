interface ChapterHeroProps {
  title: string;
  subtitle?: string;
  isSingle?: boolean;
}

export default function ChapterHero({ title, subtitle, isSingle = false }: ChapterHeroProps) {
  if (isSingle) {
    return (
      <section className="chapter-single-hero">
        <div className="overlay" />
        <div className="content">
          <h1>{title}</h1>
        </div>
      </section>
    );
  }

  return (
    <section className="chapters-hero">
      <div className="inner">
        <div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
    </section>
  );
}
