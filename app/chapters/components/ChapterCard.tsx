import Link from 'next/link';
import Image from 'next/image';

interface ChapterCardProps {
  chapter: {
    title: string;
    slug: string;
    memberCount?: number;
    featuredImage?: {
      node: {
        sourceUrl: string;
        altText: string;
      };
    };
    cultureInterests?: {
      nodes: {
        name: string;
        slug: string;
      }[];
    };
  };
}

export default function ChapterCard({ chapter }: ChapterCardProps) {
  const imageUrl = chapter.featuredImage?.node?.sourceUrl || '/placeholder-chapter.jpg';
  const interests = chapter.cultureInterests?.nodes || [];

  return (
    <Link href={`/chapters/${chapter.slug}`} className="chapter-card">
      <div className="cc-image">
        <Image 
          src={imageUrl} 
          alt={chapter.featuredImage?.node?.altText || chapter.title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>
      <div className="cc-body">
        {interests.length > 0 && (
          <div className="cc-interests">
            {interests.slice(0, 3).map((interest) => (
              <span key={interest.slug} className="cc-tag">
                {interest.name}
              </span>
            ))}
          </div>
        )}
        <h3 className="cc-title">{chapter.title}</h3>
        <div className="cc-meta">
          <span>{chapter.memberCount || 0} Members</span>
          <span>View Chapter &rarr;</span>
        </div>
      </div>
    </Link>
  );
}
