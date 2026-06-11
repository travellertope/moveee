/**
 * pulse-rss.ts
 *
 * Fetches and parses RSS/Atom feeds from 25+ African, diaspora, music,
 * fashion, and culture publications. Each feed has a 6-second timeout;
 * failures are silent so one broken feed never kills the whole refresh.
 *
 * Returns deduplicated items from the last 72 hours, sorted newest-first,
 * capped at MAX_ITEMS total so the Gemini prompt stays manageable.
 */

export interface FeedItem {
  title:       string;
  link:        string;
  description: string;
  pubDate:     Date | null;
  source:      string;
  sourceUrl:   string; // feed homepage
  imageUrl?:   string; // first image found in the item (media:content, enclosure, or <img>)
}

interface FeedDef {
  feed:   string;  // RSS/Atom URL
  source: string;  // Display name
  home:   string;  // Publication homepage (used as fallback source_url)
}

// ─── Feed registry ────────────────────────────────────────────────────────────
// Covers: pan-African news, West/East/Southern Africa, UK & US diaspora,
// music, fashion, film, lifestyle, tech, activism, and more.
const FEEDS: FeedDef[] = [
  // ── Pan-African ─────────────────────────────────────────────────────────────
  { feed: "https://www.okayafrica.com/rss/",                               source: "OkayAfrica",            home: "https://www.okayafrica.com" },
  { feed: "http://feeds.bbci.co.uk/news/world/africa/rss.xml",            source: "BBC Africa",             home: "https://www.bbc.co.uk/news/world/africa" },
  { feed: "https://www.theguardian.com/world/africa/rss",                 source: "The Guardian Africa",    home: "https://www.theguardian.com/world/africa" },
  { feed: "https://theafricareport.com/feed/",                            source: "The Africa Report",      home: "https://theafricareport.com" },
  { feed: "https://face2faceafrica.com/feed",                             source: "Face2Face Africa",       home: "https://face2faceafrica.com" },
  { feed: "https://africanarguments.org/feed/",                           source: "African Arguments",      home: "https://africanarguments.org" },
  { feed: "https://venturesafrica.com/feed/",                             source: "Ventures Africa",        home: "https://venturesafrica.com" },
  { feed: "https://africasacountry.com/feed/",                            source: "Africa Is a Country",    home: "https://africasacountry.com" },
  { feed: "https://qz.com/africa/rss",                                    source: "Quartz Africa",          home: "https://qz.com/africa" },
  { feed: "https://www.aljazeera.com/xml/rss/all.xml",                    source: "Al Jazeera",             home: "https://www.aljazeera.com" },

  // ── West Africa ──────────────────────────────────────────────────────────────
  { feed: "https://www.bellanaija.com/feed/",                             source: "BellaNaija",             home: "https://www.bellanaija.com" },
  { feed: "https://techcabal.com/feed/",                                  source: "TechCabal",              home: "https://techcabal.com" },
  { feed: "https://notjustok.com/feed/",                                  source: "NotJustOk",              home: "https://notjustok.com" },
  { feed: "https://www.vanguardngr.com/feed/",                            source: "Vanguard Nigeria",       home: "https://www.vanguardngr.com" },
  { feed: "https://www.premiumtimesng.com/feed/",                         source: "Premium Times Nigeria",  home: "https://www.premiumtimesng.com" },
  { feed: "https://pulse.ng/feed/",                                       source: "Pulse Nigeria",          home: "https://pulse.ng" },
  { feed: "https://pulse.com.gh/feed/",                                   source: "Pulse Ghana",            home: "https://pulse.com.gh" },
  { feed: "https://citinewsroom.com/feed/",                               source: "Citi Newsroom Ghana",    home: "https://citinewsroom.com" },
  { feed: "https://www.myjoyonline.com/feed/",                            source: "MyJoyOnline Ghana",      home: "https://www.myjoyonline.com" },
  { feed: "https://www.ghanaweb.com/GhanaHomePage/rss/headlines.rss",     source: "GhanaWeb",               home: "https://www.ghanaweb.com" },

  // ── East Africa ──────────────────────────────────────────────────────────────
  { feed: "https://nation.africa/rss.xml",                                source: "Nation Africa Kenya",    home: "https://nation.africa" },
  { feed: "https://www.the-star.co.ke/rss/",                             source: "The Star Kenya",         home: "https://www.the-star.co.ke" },
  { feed: "https://www.monitor.co.ug/rss/",                              source: "Daily Monitor Uganda",   home: "https://www.monitor.co.ug" },

  // ── Southern Africa ──────────────────────────────────────────────────────────
  { feed: "https://www.timeslive.co.za/rss/",                            source: "Times Live South Africa", home: "https://www.timeslive.co.za" },
  { feed: "https://www.dailymaverick.co.za/feed/",                        source: "Daily Maverick",         home: "https://www.dailymaverick.co.za" },
  { feed: "https://www.news24.com/feed/",                                 source: "News24 South Africa",    home: "https://www.news24.com" },

  // ── Diaspora UK ──────────────────────────────────────────────────────────────
  { feed: "https://voice-online.co.uk/feed/",                            source: "The Voice UK",           home: "https://voice-online.co.uk" },
  { feed: "https://www.gal-dem.com/feed/",                               source: "gal-dem",                home: "https://www.gal-dem.com" },

  // ── Diaspora US ──────────────────────────────────────────────────────────────
  { feed: "https://www.theroot.com/rss",                                  source: "The Root",               home: "https://www.theroot.com" },
  { feed: "https://thegrio.com/feed/",                                    source: "The Grio",               home: "https://thegrio.com" },
  { feed: "https://shadowandact.com/feed/",                               source: "Shadow and Act",         home: "https://shadowandact.com" },
  { feed: "https://www.essence.com/feed/",                                source: "Essence",                home: "https://www.essence.com" },
  { feed: "https://colorlines.com/feed/",                                 source: "Colorlines",             home: "https://colorlines.com" },

  // ── Music & Entertainment ────────────────────────────────────────────────────
  { feed: "https://afropunk.com/feed/",                                   source: "Afropunk",               home: "https://afropunk.com" },
  { feed: "https://www.fader.com/rss",                                    source: "The FADER",              home: "https://www.fader.com" },
  { feed: "https://pitchfork.com/rss/news/",                              source: "Pitchfork",              home: "https://pitchfork.com" },
  { feed: "https://www.billboard.com/feed/",                              source: "Billboard",              home: "https://www.billboard.com" },

  // ── Fashion & Lifestyle ──────────────────────────────────────────────────────
  { feed: "https://www.vogue.com/feed/tag/africa/rss",                    source: "Vogue Africa",           home: "https://www.vogue.com" },
  { feed: "https://www.hypebeast.com/feed",                               source: "Hypebeast",              home: "https://www.hypebeast.com" },
  { feed: "https://www.highsnobiety.com/feed/",                           source: "Highsnobiety",           home: "https://www.highsnobiety.com" },

  // ── Tech & Business ──────────────────────────────────────────────────────────
  { feed: "https://disrupt-africa.com/feed/",                             source: "Disrupt Africa",         home: "https://disrupt-africa.com" },
  { feed: "https://www.itnewsafrica.com/feed/",                           source: "IT News Africa",         home: "https://www.itnewsafrica.com" },
];

const FEED_TIMEOUT_MS = 6_000;
const MAX_AGE_HOURS   = 72;
const MAX_ITEMS       = 80; // cap before sending to Gemini

// ─── Simple RSS/Atom XML parser ───────────────────────────────────────────────
function stripCdata(s: string): string {
  return s.replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/, "$1").trim();
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/\s{2,}/g, " ").trim();
}

function getTagContent(xml: string, tag: string): string {
  // CDATA variant
  const cd = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[[\\s\\S]*?\\]\\]><\\/${tag}>`, "i"));
  if (cd) return stripCdata(cd[0].replace(new RegExp(`<\\/?${tag}[^>]*>`, "gi"), ""));
  // Normal variant
  const nm = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return nm ? nm[1].trim() : "";
}

function getLink(item: string): string {
  // Atom: <link href="..."/>
  const atom = item.match(/<link[^>]+href=["']([^"']+)["']/i);
  if (atom) return atom[1];
  // RSS: <link>...</link>  (with possible CDATA or whitespace)
  const rss = item.match(/<link[^>]*>([^<]+)<\/link>/i);
  if (rss) return rss[1].trim();
  // guid that looks like a URL
  const guid = item.match(/<guid[^>]*>(https?:\/\/[^<]+)<\/guid>/i);
  return guid ? guid[1].trim() : "";
}

function parseDate(raw: string): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

function getImageUrl(raw: string): string | undefined {
  // <media:content url="..."> or <media:thumbnail url="...">
  const media = raw.match(/<media:(?:content|thumbnail)[^>]+url=["']([^"']+)["']/i);
  if (media) return media[1];
  // <enclosure url="..." type="image/...">
  const encl = raw.match(/<enclosure[^>]+type=["']image\/[^"']*["'][^>]+url=["']([^"']+)["']/i)
            ?? raw.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]+type=["']image\/[^"']*["']/i);
  if (encl) return encl[1];
  // first <img src="..."> in the description/content
  const img = raw.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (img) return img[1];
  return undefined;
}

function parseItems(xml: string, feedDef: FeedDef): FeedItem[] {
  // Split on <item> or <entry> (Atom)
  const itemRegex = /(<item[\s>][\s\S]*?<\/item>|<entry[\s>][\s\S]*?<\/entry>)/gi;
  const matches = xml.match(itemRegex) ?? [];
  const items: FeedItem[] = [];

  for (const raw of matches) {
    const title = stripHtml(stripCdata(getTagContent(raw, "title")));
    const link  = getLink(raw);
    const desc  = stripHtml(stripCdata(
      getTagContent(raw, "description") ||
      getTagContent(raw, "summary") ||
      getTagContent(raw, "content")
    )).slice(0, 400);
    const dateRaw = getTagContent(raw, "pubDate") ||
                    getTagContent(raw, "published") ||
                    getTagContent(raw, "updated") ||
                    getTagContent(raw, "dc:date");
    const pubDate = parseDate(dateRaw);
    const imageUrl = getImageUrl(raw);

    if (!title || !link) continue;
    items.push({ title, link, description: desc, pubDate, source: feedDef.source, sourceUrl: feedDef.home, imageUrl });
  }
  return items;
}

async function fetchFeed(feedDef: FeedDef): Promise<FeedItem[]> {
  try {
    const res = await Promise.race([
      fetch(feedDef.feed, {
        headers: { "User-Agent": "Moveee-Pulse-Bot/1.0 (+https://themoveee.com)" },
        next: { revalidate: 0 },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), FEED_TIMEOUT_MS)
      ),
    ]);
    if (!(res as Response).ok) return [];
    const xml = await (res as Response).text();
    return parseItems(xml, feedDef);
  } catch {
    return []; // silent — one broken feed never kills the refresh
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────
export async function fetchAllFeeds(): Promise<FeedItem[]> {
  const cutoff = new Date(Date.now() - MAX_AGE_HOURS * 60 * 60 * 1000);

  const batches = await Promise.all(FEEDS.map(fetchFeed));
  const all = batches.flat();

  const seen  = new Set<string>();
  const fresh: FeedItem[] = [];

  for (const item of all) {
    if (seen.has(item.link)) continue;
    seen.add(item.link);
    if (!item.pubDate || item.pubDate >= cutoff) fresh.push(item);
  }

  // Newest first
  fresh.sort((a, b) =>
    (b.pubDate?.getTime() ?? 0) - (a.pubDate?.getTime() ?? 0)
  );

  return fresh.slice(0, MAX_ITEMS);
}
