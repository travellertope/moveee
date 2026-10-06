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

// Map the edition URL slugs to the nlSegment codes used in WP post meta.
// "africa" covers NG + GH; we try ng first, then gh, then the untagged fallback.
const EDITION_TO_SEGMENTS: Record<string, string[]> = {
  uk:     ["uk"],
  us:     ["us"],
  ng:     ["ng"],
  gh:     ["gh"],
  ca:     ["ca"],
  au:     ["au"],
  africa: ["ng", "gh"],
};

// Pick the best issue for a given edition out of a deduplicated issue list.
// Tries each candidate segment in order; falls back to an untagged issue.
export function pickEditionIssue(issues: any[], edition: string): any | null {
  const segments = EDITION_TO_SEGMENTS[edition] ?? [];
  for (const seg of segments) {
    const match = issues.find((n) => (n.nlSegment || "") === seg);
    if (match) return match;
  }
  return issues.find((n) => (n.nlSegment || "") === "") ?? issues[0] ?? null;
}

// Issue numbers per list, not one shared counter across both newsletters.
// The archive on /newsletter and the edition hubs used to number every row
// by its position in the combined (both-lists) array, so "All" counted
// down 19, 18, 17... across Culture Drop and GetMeLit interleaved instead
// of each newsletter having its own sequence. Prefers each issue's own
// editorially-set _culture_nl_issue_num (nlIssueNum) when present, falling
// back to a positional count scoped to that issue's own list.
export function issueNumbersByList(issues: any[]): Map<string, number> {
  const map = new Map<string, number>();
  const byList: Record<string, any[]> = {};
  for (const n of issues) {
    const list = n.nlList || "unknown";
    (byList[list] ??= []).push(n);
  }
  for (const list of Object.keys(byList)) {
    const items = byList[list];
    const total = items.length;
    items.forEach((issue, idx) => {
      const num = issue.nlIssueNum && issue.nlIssueNum > 0 ? issue.nlIssueNum : total - idx;
      map.set(issue.id, num);
    });
  }
  return map;
}
