import Link from "next/link";
import Image from "next/image";
import { decodeHtml } from "@/lib/decode-html";
import { sanitizeHtml } from "@/lib/sanitize";
import "./KafartSection.css";

interface Props {
  stories: any[];
}

export default function KafartSection({ stories }: Props) {
  const safe = Array.isArray(stories) ? stories.filter(Boolean) : [];
  if (safe.length === 0) return null;

  return (
    <section className="kft-section">
      <div className="kft-header">
        <div>
          <p className="kft-eyebrow">In Partnership With</p>
          <h2 className="kft-title">
            KAFART<span className="kft-year">2026</span>
          </h2>
          <p className="kft-sub">
            Exclusive stories from the Kaduna Fashion &amp; Art Festival
          </p>
        </div>
        <Link href="/magazine/tag/kafart2026" className="kft-viewall">
          All coverage →
        </Link>
      </div>

      <div className="kft-scroll">
        {safe.map((story) => {
          const img = story.featuredImage?.node?.sourceUrl || null;
          const alt = story.featuredImage?.node?.altText || story.title || "";
          const cat = story.categories?.nodes?.[0]?.name || "KAFART2026";
          const date = story.date
            ? new Date(story.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
            : null;
          return (
            <Link key={story.slug || story.id} href={`/magazine/${story.slug}`} className="kft-card">
              <div className="kft-card-img">
                {img ? (
                  <Image src={img} alt={alt} fill style={{ objectFit: "cover" }} />
                ) : (
                  <div className="kft-card-img-placeholder" />
                )}
              </div>
              <p className="kft-card-cat">{decodeHtml(cat)}</p>
              <h3
                className="kft-card-title"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(story.title) }}
              />
              {date && <p className="kft-card-date">{date}</p>}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
