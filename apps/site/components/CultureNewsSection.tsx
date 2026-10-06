import Link from "next/link";
import { decodeHtml } from "@/lib/decode-html";
import "./CultureNewsSection.css";

interface Props {
  stories: any[];
  viewAllHref?: string;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return "";
  }
}

function StoryRow({ story }: { story: any }) {
  const title = decodeHtml(typeof story.title === "string" ? story.title : "");
  const img = story.featuredImage?.node?.sourceUrl || null;
  const alt = story.featuredImage?.node?.altText || title;
  const date = formatDate(story.date);

  return (
    <Link href={`/magazine/${story.slug}`} className="cn-row">
      <div className="cn-thumb">
        {img && <img src={img} alt={alt} loading="lazy" />}
      </div>
      <span className="cn-title">{title}</span>
      {date && <span className="cn-date">{date}</span>}
    </Link>
  );
}

export default function CultureNewsSection({
  stories,
  viewAllHref = "/magazine/category/news",
}: Props) {
  const safeStories = Array.isArray(stories) ? stories.filter(Boolean) : [];
  if (safeStories.length === 0) return null;

  const items = safeStories.slice(0, 12);
  const col1 = items.slice(0, 4);
  const col2 = items.slice(4, 8);
  const col3 = items.slice(8, 12);

  return (
    <section className="arc-section">
      <div className="wrap">
        <div className="arc-hdr">
          <h2>
            Culture <em>News</em>
          </h2>
          <Link href={viewAllHref} className="arc-viewall">
            More →
          </Link>
        </div>
        <div className="cn-grid">
          <div className="cn-col">
            {col1.map((story) => (
              <StoryRow key={story.slug || story.id} story={story} />
            ))}
          </div>
          {col2.length > 0 && (
            <div className="cn-col">
              {col2.map((story) => (
                <StoryRow key={story.slug || story.id} story={story} />
              ))}
            </div>
          )}
          {col3.length > 0 && (
            <div className="cn-col">
              {col3.map((story) => (
                <StoryRow key={story.slug || story.id} story={story} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
