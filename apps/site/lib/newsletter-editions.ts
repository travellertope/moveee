import { headers } from "next/headers";

// Shared by the newsletter hub (/newsletter) and both publication landing
// pages (/newsletter/culture-drop, /newsletter/getmelit) — extracted here
// so all three dedupe regional editions the same way. Previously only the
// hub deduped; GetMeLitPage/CultureDropPage's own "recent issues" sidebar
// and stat count didn't, so the same issue (one post per region) could
// show up twice with different issue numbers.

const COUNTRY_TO_SEGMENT: Record<string, string> = {
  GB: "uk", US: "us", NG: "ng", GH: "gh", CA: "ca", AU: "au",
};

export async function geoSegment(): Promise<string> {
  try {
    const h = await headers();
    const country = h.get("x-vercel-ip-country") ?? "";
    return COUNTRY_TO_SEGMENT[country.toUpperCase()] ?? "";
  } catch {
    return "";
  }
}

const HTML_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  hellip: "…", mdash: "—", ndash: "–", lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”",
};

function cleanTitle(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, "")
    .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(Number(c)))
    .replace(/&([a-z]+);/gi, (m, n) => HTML_ENTITIES[n.toLowerCase()] ?? m)
    .trim();
}

// Deduplicate regional editions: group by cleaned title, pick the geo-appropriate slug.
export function deduplicateEditions(issues: any[], segment: string): any[] {
  const seen: string[] = [];
  const groups: Record<string, any[]> = {};
  for (const n of issues) {
    const t = cleanTitle(n.title || "");
    if (!groups[t]) { seen.push(t); groups[t] = []; }
    groups[t].push(n);
  }
  return seen.map((t) => {
    const group = groups[t];
    return (
      group.find((n) => (n.nlSegment || "") === segment) ||
      group.find((n) => (n.nlSegment || "") === "") ||
      group[0]
    );
  });
}
