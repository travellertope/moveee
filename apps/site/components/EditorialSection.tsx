import Link from 'next/link';
import Image from 'next/image';
import { sanitizeHtml } from "@/lib/sanitize";

interface Story {
  id: string;
  slug: string;
  title: string;
  date: string;
  excerpt?: string;
  categories?: { nodes: { name: string }[] };
  featuredImage?: { node: { sourceUrl: string; altText?: string } };
}

function plainExcerpt(html?: string, max = 140): string {
  if (!html) return "";
  const text = html.replace(/<[^>]*>/g, "").trim();
  return text.length > max ? `${text.slice(0, max).trim()}…` : text;
}

export default function EditorialSection({ stories }: { stories: Story[] }) {
  if (!stories.length) return null;

  const [lead, ...rest] = stories;

  return (
    <section className="mg-edit">
      <div className="mg-edit-inner">
        <div className="mg-sec-header">
          <h3>Culture <em>News</em></h3>
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
              <div className="edit-lead-meta">
                <span className="edit-lead-kicker">{lead.categories?.nodes?.[0]?.name || 'Opinion'}</span>
                <span className="edit-lead-date">
                  {new Date(lead.date).toLocaleDateString('en-GB')}
                </span>
              </div>
              <h4
                className="edit-lead-title"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(lead.title) }}
              />
              {plainExcerpt(lead.excerpt) && (
                <p className="edit-lead-excerpt">{plainExcerpt(lead.excerpt)}</p>
              )}
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
