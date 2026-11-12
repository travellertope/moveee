import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Wikipedia and Wikidata base URLs
const WP_API = "https://en.wikipedia.org/w/api.php";
const WD_API = "https://www.wikidata.org/w/api.php";

// Wikidata property IDs → infobox field names, per entry type.
// Entity-reference properties (QID values) are resolved to labels via a
// separate batch call; primitive properties (time, quantity, string) are
// extracted directly.
const WD_PROPS: Record<string, Record<string, string>> = {
  film: {
    P57:   "director",
    P58:   "writer",
    P136:  "genre",
    P577:  "year",
    P2047: "runtime_min",
    P364:  "original_language",
    P162:  "producer",
    P161:  "cast",
    P272:  "production_company",
    P495:  "country_of_origin",
  },
  book: {
    P50:   "author",
    P123:  "publisher",
    P577:  "year_published",
    P136:  "genre",
    P407:  "original_language",
    P1104: "pages",
    P856:  "website",
    P495:  "country_of_origin",
  },
  album: {
    P175:  "artist",
    P264:  "record_label",
    P577:  "year",
    P136:  "genre",
    P2554: "producer",
    P495:  "country_of_origin",
  },
  place: {
    P131:  "located_in",
    P571:  "founded",
    P856:  "website",
    P17:   "country",
  },
  food: {
    P131:  "located_in",
    P856:  "website",
    P17:   "country",
    P571:  "founded",
    P495:  "country_of_origin",
  },
  person: {
    P569:  "born",
    P570:  "died",
    P27:   "nationality",
    P106:  "occupation",
    P800:  "notable_work",
    P19:   "place_of_birth",
  },
};

// Properties whose datavalue.value is an entity reference {id: "Q…"} that
// must be resolved to a readable label.
const ENTITY_REF_PROPS = new Set([
  "P57", "P58", "P136", "P162", "P161", "P272", "P495", // film
  "P50", "P123", "P407",                                  // book
  "P175", "P264", "P2554",                               // album
  "P131", "P17",                                         // place/food
  "P27", "P106", "P800", "P19",                         // person
]);

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

async function wikiFetch(params: Record<string, string>, base = WP_API) {
  const p = new URLSearchParams({ ...params, format: "json", origin: "*" });
  const res = await fetch(`${base}?${p}`, { next: { revalidate: 3600 } }).catch(() => null);
  if (!res?.ok) return null;
  return res.json().catch(() => null);
}

// Search hint by type to improve Wikipedia match accuracy
const TYPE_HINT: Record<string, string> = {
  film:  "film",
  book:  "novel",
  album: "album",
};

const STOPWORDS = new Set(["the", "and", "for", "with", "from", "that", "this", "into", "also", "more", "over", "some", "have", "been", "were", "their"]);

/** Strip diacritics and return lowercase ASCII — "Candomblé" → "candomble". */
function asciiLower(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function sigWords(text: string): string[] {
  return asciiLower(text)
    .split(/[^a-z0-9]+/)
    .filter(w => w.length >= 4 && !STOPWORDS.has(w));
}

/** Check whether a word (or its de-pluralised/pluralised form) appears as a whole word in haystack.
 * Plural tolerance only applies for 7+ character stems to avoid false positives
 * ("margins"→"margin" at 6 chars is excluded; "festivals"→"festival" at 8 chars is included). */
function wordIn(word: string, haystack: string): boolean {
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (new RegExp(`\\b${esc(word)}\\b`).test(haystack)) return true;
  // Plural query word → check stem (only for long stems, 7+ chars)
  if (word.endsWith("s")) {
    const stem = word.slice(0, -1);
    if (stem.length >= 7 && new RegExp(`\\b${esc(stem)}\\b`).test(haystack)) return true;
  }
  // Singular query word → check plural form (only for long words, 7+ chars)
  if (word.length >= 7 && new RegExp(`\\b${esc(word)}s\\b`).test(haystack)) return true;
  return false;
}

/** Validates that a Wikipedia candidate title is plausibly related to the query
 * by requiring significant word overlap in either direction. For multi-word
 * titles, requires ≥2 matching words to prevent cross-matching on a single
 * shared word (e.g. "Women on the Margins" ≠ "In the Margins"). */
function wikiTitleMatches(original: string, candidate: string): boolean {
  const origWords = sigWords(original);
  if (!origWords.length) return true; // very short title — skip validation

  const candAscii = asciiLower(candidate);
  const origAscii = asciiLower(original);

  // Single-word original: 1 match is enough. Multi-word: need ≥2 in either
  // direction so one incidentally shared word can't cause a false positive.
  const minMatch = origWords.length >= 2 ? 2 : 1;

  let origInCand = 0;
  for (const w of origWords) {
    if (wordIn(w, candAscii) && ++origInCand >= minMatch) return true;
  }
  let candInOrig = 0;
  for (const w of sigWords(candidate)) {
    if (wordIn(w, origAscii) && ++candInOrig >= minMatch) return true;
  }
  return false;
}

async function findWikiTitle(q: string, type: string): Promise<string | null> {
  const hint = TYPE_HINT[type];

  async function trySearch(query: string, validateAgainst: string): Promise<string | null> {
    const hintedQuery = hint ? `${query} ${hint}` : query;
    const data = await wikiFetch({
      action: "opensearch",
      search: hintedQuery,
      limit: "5",
      redirects: "resolve",
    });
    const titles: string[] = Array.isArray(data?.[1]) ? data[1] : [];
    // Skip disambiguation pages by title suffix
    return titles.find(t => t && !t.includes("(disambiguation)") && wikiTitleMatches(validateAgainst, t)) ?? null;
  }

  // Pass 0: if the title already has a parenthetical qualifier (e.g. "The Thomas Crown Affair (1999 film)"),
  // try fetching that exact Wikipedia title directly — Wikipedia has dedicated articles for these.
  // fetchWikiPageData returns null for disambiguation pages, so this naturally skips them.
  if (/\s*\([^)]+\)\s*$/.test(q)) {
    const exactPage = await fetchWikiPageData(q);
    if (exactPage) return exactPage.title ?? q;
  }

  // Pass 1: full title
  let result = await trySearch(q, q);
  if (result) return result;

  // Pass 2: strip trailing (TV series)/(film) etc.
  const parenBase = q.replace(/\s*\([^)]+\)\s*$/, "");
  if (parenBase && parenBase !== q) {
    result = await trySearch(parenBase, parenBase);
    if (result) return result;
  }

  // Pass 3: strip subtitle after ': '
  const colonIdx = q.indexOf(": ");
  if (colonIdx !== -1) {
    const colonBase = q.slice(0, colonIdx);
    result = await trySearch(colonBase, colonBase);
    if (result) return result;
  }

  // Pass 4: strip edition suffix after ' - '
  const dashIdx = q.indexOf(" - ");
  if (dashIdx !== -1) {
    const dashBase = q.slice(0, dashIdx);
    result = await trySearch(dashBase, dashBase);
    if (result) return result;
  }

  // Pass 5: CirrusSearch full-text
  const ftsData = await wikiFetch({
    action: "query",
    list: "search",
    srsearch: hint ? `${q} ${hint}` : q,
    srlimit: "3",
    srinfo: "",
    srprop: "titlesnippet",
  });
  const ftsResults: Array<{title: string}> = ftsData?.query?.search ?? [];
  const ftsMatch = ftsResults.find(r => r.title && wikiTitleMatches(q, r.title));
  if (ftsMatch) return ftsMatch.title;

  return null;
}

async function fetchWikiPageData(title: string) {
  const data = await wikiFetch({
    action: "query",
    prop: "extracts|pageimages|pageprops",
    exintro: "1",
    exsentences: "12",
    titles: title,
    pithumbsize: "800",
    redirects: "1",
    pilicense: "any",
  });
  const pages: Record<string, any> = data?.query?.pages ?? {};
  const page = Object.values(pages)[0] as any;
  if (!page || "missing" in page) return null;
  // Disambiguation pages have no useful content — skip them
  if ("disambiguation" in (page.pageprops ?? {})) return null;
  return page;
}

async function batchEntityLabels(qids: string[]): Promise<Record<string, string>> {
  if (!qids.length) return {};
  // Wikidata allows up to 50 IDs per request
  const data = await wikiFetch(
    { action: "wbgetentities", ids: qids.slice(0, 50).join("|"), props: "labels", languages: "en" },
    WD_API
  );
  const entities: Record<string, any> = data?.entities ?? {};
  const out: Record<string, string> = {};
  for (const [qid, entity] of Object.entries(entities)) {
    const label = (entity as any)?.labels?.en?.value;
    if (label) out[qid] = label;
  }
  return out;
}

async function fetchWikidataInbox(
  qid: string,
  type: string
): Promise<Record<string, string>> {
  const propMap = WD_PROPS[type] ?? WD_PROPS["place"];
  const propIds = [...new Set(Object.keys(propMap))]; // deduplicate

  const data = await wikiFetch(
    { action: "wbgetentities", ids: qid, props: "claims" },
    WD_API
  );
  const entity = data?.entities?.[qid];
  if (!entity) return {};

  const claims: Record<string, any[]> = entity.claims ?? {};
  const inbox: Record<string, string> = {};
  const entityRefQids: string[] = [];
  const qidToKey: Record<string, string> = {};

  for (const propId of propIds) {
    const fieldKey = propMap[propId];
    if (!fieldKey) continue;
    const claimArr = claims[propId];
    if (!claimArr?.length) continue;

    // Prefer preferred-rank claims with a real value, then fall back to any
    // non-deprecated claim with a real value. A novalue/somevalue sentinel as
    // the first claim would otherwise silently drop the whole field.
    const best =
      claimArr.find((c: any) => c.rank === "preferred" && c.mainsnak?.snaktype === "value") ??
      claimArr.find((c: any) => c.rank !== "deprecated" && c.mainsnak?.snaktype === "value");
    if (!best) continue;
    const snak = best.mainsnak;

    const val = snak.datavalue?.value;
    if (!val) continue;

    if (typeof val === "string") {
      inbox[fieldKey] = val;
    } else if (typeof val === "object") {
      if (typeof val.text === "string") {
        // monolingualtext
        inbox[fieldKey] = val.text;
      } else if (val.amount !== undefined) {
        // quantity
        inbox[fieldKey] = String(Math.abs(Number(val.amount)));
      } else if (typeof val.time === "string") {
        // time — extract year from "+YYYY-MM-DDT…"
        const year = val.time.replace(/^\+/, "").slice(0, 4);
        if (year && year !== "0000") inbox[fieldKey] = year;
      } else if (typeof val.id === "string" && ENTITY_REF_PROPS.has(propId)) {
        // entity reference — batch-resolve label later
        entityRefQids.push(val.id);
        qidToKey[val.id] = fieldKey;
      }
    }
  }

  // Batch-resolve entity labels (director name, genre name, etc.)
  if (entityRefQids.length) {
    const labels = await batchEntityLabels(entityRefQids);
    for (const [qid, label] of Object.entries(labels)) {
      const key = qidToKey[qid];
      if (key && !inbox[key]) inbox[key] = label;
    }
  }

  return inbox;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const type = searchParams.get("type") ?? "concept";

  if (q.length < 2) return NextResponse.json({ found: false });

  // 1. Find best-matching Wikipedia article
  const wikiTitle = await findWikiTitle(q, type);
  if (!wikiTitle) return NextResponse.json({ found: false });

  // 2. Fetch page: intro extract + thumbnail + Wikidata QID
  const page = await fetchWikiPageData(wikiTitle);
  if (!page) return NextResponse.json({ found: false });

  const rawExtract: string = page.extract ?? "";
  const description = rawExtract ? stripHtml(rawExtract) : null;
  const coverUrl: string | null = page.thumbnail?.source ?? null;
  const pageTitle: string = page.title ?? wikiTitle;
  const wikiSlug = pageTitle.replace(/ /g, "_");
  const wikiUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(wikiSlug)}`;

  // 3. Enrich with Wikidata structured fields (director, genre, year, etc.)
  const qid: string | undefined = page.pageprops?.wikibase_item;
  let infobox: Record<string, string> | null = null;
  if (qid) {
    const fields = await fetchWikidataInbox(qid, type);
    if (Object.keys(fields).length) infobox = fields;
  }

  return NextResponse.json({
    found: true,
    wikiSlug,
    wikiUrl,
    wikiTitle: pageTitle,
    description,
    coverUrl,
    infobox,
  });
}
