import type { Metadata } from "next";
import Link from "next/link";
import { getUnifiedFeed } from "@/lib/unified-feed";
import HashtagFeed from "@/components/pulse/HashtagFeed";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  return {
    title: `#${tag} — Moveee Pulse`,
    description: `Posts tagged #${tag} on Moveee Pulse.`,
  };
}

export default async function HashtagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;

  const allItems = await getUnifiedFeed();

  // Filter items whose title or excerpt contains #tag (whole-word, case-insensitive)
  const tagRegex = new RegExp(`\\B#${tag}\\b`, "i");
  const items = allItems.filter((item) => {
    return tagRegex.test(item.title) || (item.excerpt ? tagRegex.test(item.excerpt) : false);
  });

  return (
    <div style={{ background: "#ffffff", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{
        background: "#fff",
        borderBottom: "1px solid #e8e2d8",
        padding: "1.25rem 1.5rem 1rem",
      }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          {/* Breadcrumb */}
          <p style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: "0.65rem",
            color: "#7a6f5c",
            margin: "0 0 0.75rem",
          }}>
            <Link href="/connect" style={{ color: "#7a6f5c", textDecoration: "none" }}>← Connect</Link>
          </p>

          {/* Hashtag display */}
          <h1 style={{
            fontSize: "1.5rem",
            fontWeight: 400,
            color: "#14110d",
            margin: "0 0 0.35rem",
            fontFamily: "var(--font-fraunces), serif",
            lineHeight: 1.2,
          }}>
            <span style={{ color: "#c5491f" }}>#</span>{tag}
          </h1>

          {/* Count */}
          <p style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: "0.7rem",
            color: "#7a6f5c",
            margin: 0,
          }}>
            {items.length} {items.length === 1 ? "post" : "posts"}
          </p>
        </div>
      </div>

      {/* Feed */}
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        <HashtagFeed initialItems={items} tag={tag} />
      </div>
    </div>
  );
}
