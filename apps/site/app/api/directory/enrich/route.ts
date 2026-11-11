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

async function findWikiTitle(q: string, type: string): Promise<string | null> {
  const hint = TYPE_HINT[type];
  const query = hint ? `${q} ${hint}` : q;
  const data = await wikiFetch({
    action: "opensearch",
    search: query,
    limit: "3",
    redirects: "resolve",
  });
  const titles: string[] = Array.isArray(data?.[1]) ? data[1] : [];
  return titles[0] ?? null;
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

    // Take first ranked claim only
    const best = claimArr.find((c: any) => c.rank !== "deprecated") ?? claimArr[0];
    const snak = best?.mainsnak;
    if (!snak || snak.snaktype !== "value") continue;

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
