import Link from 'next/link';
import Image from 'next/image';
import { sanitizeHtml } from "@/lib/sanitize";

interface Story {
  id: string;
  slug: string;
  title: string;
  date: string;
  categories?: { nodes: { name: string }[] };
  featuredImage?: { node: { sourceUrl: string; altText?: string } };
}

export default function EditorialSection({ stories }: { stories: Story[] }) {
  if (!stories.length) return null;

  const [lead, ...rest] = stories;

  return (
    <section className="mg-edit">
      <div className="mg-edit-inner">
        <div className="mg-sec-label">Curated</div>
        <div className="mg-sec-header">
          <h3>The <em>Edit</em></h3>
        </div>

        <div className="edit-mosaic">
          <Link href={`/magazine/${lead.slug}`} className="edit-lead">
            <div className="edit-lead-img">
              {lead.featuredImage?.node?.sourceUrl ? (
                <Image
                  src={lead.featuredImage.node.sourceUrl}
                  alt={lead.featuredImage.node.altText || lead.title}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'var(--ink)' }} />
              )}
            </div>
            <div className="edit-lead-body">
              <p className="edit-lead-kicker">{lead.categories?.nodes?.[0]?.name || 'Opinion'}</p>
              <h4
                className="edit-lead-title"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(lead.title) }}
              />
              <p className="edit-lead-date">
                {new Date(lead.date).toLocaleDateString('en-GB')}
              </p>
            </div>
          </Link>

          {rest.length > 0 && (
            <div className="edit-stack">
              {rest.map((story) => (
                <Link key={story.id} href={`/magazine/${story.slug}`} className="edit-row">
                  <div className="edit-row-thumb">
                    {story.featuredImage?.node?.sourceUrl && (
                      <Image
                        src={story.featuredImage.node.sourceUrl}
                        alt={story.featuredImage.node.altText || story.title}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    )}
                  </div>
                  <div className="edit-row-body">
                    <p className="edit-row-kicker">{story.categories?.nodes?.[0]?.name || 'Opinion'}</p>
                    <h4
                      className="edit-row-title"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(story.title) }}
                    />
                    <span className="edit-row-date">
                      {new Date(story.date).toLocaleDateString('en-GB')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
