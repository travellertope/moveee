import { EDITIONS, type EditionSlug } from "@/lib/editions";

const WP_GRAPHQL_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://cms.themoveee.com/graphql";
const WP_BASE_URL = WP_GRAPHQL_URL.replace(/\/graphql\/?$/, "");

/** Default timeout (ms) for all WP fetches — prevents server hangs when CMS is slow. */
const WP_FETCH_TIMEOUT = 8000;

function wpSignal(ms = WP_FETCH_TIMEOUT): { signal: AbortSignal; clear: () => void } {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, clear: () => clearTimeout(timer) };
}

// Circuit breaker: stop hammering the CMS when it's already struggling.
// State is stored in Vercel KV so it's shared across all serverless instances.
// Falls back to a per-process variable when KV is not configured (local dev).
const _cbLocal = { failures: 0, openUntil: 0 };
const CB_THRESHOLD = 3;
const CB_COOLDOWN = 60_000; // 60s cooldown after 3 consecutive failures
const CB_KEY = "cb:cms";

async function cbCheck(): Promise<boolean> {
  const kv = await getKV();
  if (kv) {
    try {
      const state = await kv.get<{ openUntil: number; failures: number }>(CB_KEY);
      if (state?.openUntil && Date.now() < state.openUntil) return false;
      return true;
    } catch { return true; }
  }
  // Local fallback
  if (_cbLocal.openUntil && Date.now() < _cbLocal.openUntil) return false;
  if (_cbLocal.openUntil && Date.now() >= _cbLocal.openUntil) {
    _cbLocal.openUntil = 0;
    _cbLocal.failures = 0;
  }
  return true;
}

async function cbSuccess(): Promise<void> {
  const kv = await getKV();
  if (kv) {
    try { await kv.del(CB_KEY); } catch { /* ignore */ }
    return;
  }
  _cbLocal.failures = 0;
}

async function cbFail(): Promise<void> {
  const kv = await getKV();
  if (kv) {
    try {
      const state = (await kv.get<{ openUntil: number; failures: number }>(CB_KEY)) ?? { openUntil: 0, failures: 0 };
      state.failures++;
      if (state.failures >= CB_THRESHOLD) {
        state.openUntil = Date.now() + CB_COOLDOWN;
        console.warn(`[circuit-breaker] CMS circuit opened (shared) for ${CB_COOLDOWN / 1000}s after ${CB_THRESHOLD} failures`);
      }
      await kv.set(CB_KEY, state, { ex: Math.ceil(CB_COOLDOWN / 1000) + 30 });
    } catch { /* KV write failure: degrade gracefully */ }
    return;
  }
  _cbLocal.failures++;
  if (_cbLocal.failures >= CB_THRESHOLD) {
    _cbLocal.openUntil = Date.now() + CB_COOLDOWN;
    console.warn(`[circuit-breaker] CMS circuit opened (local) for ${CB_COOLDOWN / 1000}s after ${CB_THRESHOLD} failures`);
  }
}

// ── Vercel KV cache ───────────────────────────────────────────────────────────
// Wraps getWPData with a Redis (Vercel KV) cache so WordPress is only hit on
// genuine cache misses. TTL matches the Next.js revalidate value.
// Falls back gracefully if KV env vars are not set (local dev / non-KV deploys).
let _kv: typeof import("@vercel/kv").kv | null = null;
async function getKV() {
  if (_kv) return _kv;
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null;
  try {
    const { kv } = await import("@vercel/kv");
    _kv = kv;
    return kv;
  } catch { return null; }
}

function kvKey(query: string, variables: object): string {
  // Short stable cache key: hash of query name + variables
  const tag = query.match(/query\s+(\w+)/)?.[1] ?? query.slice(0, 40).replace(/\s+/g, "_");
  const vars = Object.keys(variables).length ? JSON.stringify(variables) : "";
  return `wp:${tag}:${vars}`;
}

async function getWPDataFromCMS(query: string, variables = {}, options: any = {}): Promise<any> {
  if (!(await cbCheck())) return null;

  const { signal, clear } = wpSignal();
  try {
    const res = await fetch(WP_GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      next: { revalidate: options.revalidate !== undefined ? options.revalidate : 3600 },
      body: JSON.stringify({ query, variables }),
    });
    clear();

    if (!res.ok) {
      console.error(`Fetch failed for ${WP_GRAPHQL_URL}: ${res.statusText}`);
      await cbFail();
      return null;
    }

    const json = await res.json();
    await cbSuccess();

    if (json.errors) {
      console.warn(`GraphQL partial errors for ${WP_GRAPHQL_URL}:`, json.errors);
      return json.data || null;
    }

    return json.data;
  } catch (error: any) {
    clear();
    await cbFail();
    console.error(`Network or Parsing Error for ${WP_GRAPHQL_URL}:`, error.message || error);
    return null;
  }
}

export async function getWPData(query: string, variables = {}, options: any = {}) {
  const kv = await getKV();
  const ttl = options.revalidate !== undefined ? options.revalidate : 3600;

  if (kv) {
    const key = kvKey(query, variables);
    try {
      const cached = await kv.get(key);
      if (cached !== null && cached !== undefined) return cached;
      // Cache miss — log for Vercel function log monitoring
      console.log(`[wp:kv-miss] ${key.slice(0, 100)}`);
    } catch {
      console.warn(`[wp:kv-error] KV read failed for ${key.slice(0, 80)}`);
    }

    const data = await getWPDataFromCMS(query, variables, options);
    if (data) {
      try {
        await kv.set(key, data, { ex: ttl });
      } catch (e: any) {
        console.warn(`[wp:kv-write-fail] ${key.slice(0, 80)}: ${e?.message ?? e}`);
      }
    }
    return data;
  }

  // No KV configured — call CMS directly (original behaviour)
  return getWPDataFromCMS(query, variables, options);
}

function mapRestEventToFrontendShape(item: any) {
  const embeddedMedia = item?._embedded?.["wp:featuredmedia"]?.[0];
  const acf = item?.acf || {};
  const meta = item?.meta || {};
  const cem = item?.culture_event_meta || {};
  const pick = (...vals: any[]) => vals.find(v => v !== undefined && v !== null && v !== "" && v !== false) ?? null;

  const toMediaItem = (img: any) => {
    if (!img) return null;
    if (typeof img === "string") return { sourceUrl: img };
    if (typeof img === "object") {
      const url = img.url || img.source_url || img.sizes?.full || img.sizes?.large;
      return url ? { sourceUrl: url, altText: img.alt || "" } : null;
    }
    return null;
  };

  const normalizeShowcase = (arr: any) =>
    Array.isArray(arr)
      ? arr.map((s: any) => ({
          title: s?.title || "",
          media: s?.media || "",
          dimensions: s?.dimensions || "",
          year: s?.year || "",
          price: s?.price || "",
          image: toMediaItem(s?.image),
        }))
      : [];

  const normalizeHost = (h: any) => {
    // ACF relationship field can return: null, a post object, or an array of post objects/IDs
    const raw = Array.isArray(h) ? h[0] : h;
    if (!raw || typeof raw !== "object") return null;
    return {
      title: raw.post_title || raw.title || raw.name || "",
      slug: raw.post_name || raw.slug || "",
      excerpt: raw.post_excerpt || raw.excerpt || "",
      featuredImage: toMediaItem(raw.featured_image || raw.thumbnail)
        ? { node: toMediaItem(raw.featured_image || raw.thumbnail) }
        : null,
    };
  };

  const normalizeJourney = (j: any) => {
    if (!j || typeof j !== "object") return null;
    return {
      title: j.post_title || j.title || "",
      slug: j.post_name || j.slug || "",
    };
  };

  return {
    id: String(item?.id ?? ""),
    databaseId: item?.id,
    slug: item?.slug ?? "",
    title: item?.title?.rendered ?? "Untitled",
    date: item?.date ?? null,
    excerpt: item?.excerpt?.rendered ?? "",
    content: item?.content?.rendered ?? "",
    eventDate: pick(cem.event_date, acf.event_date, meta.event_date, meta._culture_event_date) ?? null,
    endDate: pick(cem.end_date, acf.end_date, meta.end_date, meta._culture_event_end_date),
    location: pick(cem.location, acf.location, meta.location, meta._culture_location),
    city: pick(cem.city, acf.city, meta.city, meta._culture_event_city),
    admission: pick(cem.admission, acf.admission, meta.admission, meta._culture_admission),
    isFeatured: Boolean(pick(acf.is_featured, meta.is_featured, meta._culture_is_featured)),
    isLiterati: Boolean(pick(acf.event_is_literati, meta.is_literati, meta._culture_event_is_literati)),
    // WP's own templates (single/archive-culture_event.php) default an unset
    // _culture_is_physical to "Virtual" — but almost none of the seeded/
    // existing events have ever had this checkbox touched, so that default
    // made the entire calendar falsely show a Virtual tag. Flipped here:
    // only an explicit '0'/false counts as Virtual, unset/anything else
    // defaults to In-Person.
    isPhysical: ![false, 0, '0'].includes(pick(acf.is_physical, meta.is_physical, meta._culture_is_physical) as any),
    rsvpCount: Number(cem.rsvp_count) || 0,
    isAiGenerated: [true, 1, '1', 'true', 'yes'].includes(cem.ai_generated ?? acf.ai_generated ?? meta.ai_generated ?? meta._culture_ai_generated),
    openingHours: pick(cem.opening_hours, acf.opening_hours, meta.opening_hours, meta._culture_opening_hours),
    tagline: pick(acf.tagline, meta.tagline, meta._culture_tagline),
    attribution: pick(acf.attribution, meta.attribution, meta._culture_attribution),
    ticketingUrl: pick(cem.ticketing_url, acf.ticketing_url, meta.ticketing_url, meta._culture_ticketing_url),
    organiserDirectoryId: cem.organiser_id ? Number(cem.organiser_id) : (meta._culture_event_organiser_id ? Number(meta._culture_event_organiser_id) : undefined),
    organiserName: cem.organiser_name || undefined,
    organiserSlug: cem.organiser_slug || undefined,
    eventImageUrl: pick(cem.image_url, acf.event_image_url, meta.event_image_url, meta._culture_event_image_url),
    featuredImage: embeddedMedia?.source_url
      ? {
          node: {
            sourceUrl: embeddedMedia.source_url,
            altText: embeddedMedia.alt_text || "",
          },
        }
      : null,
    cultureInterests: {
      nodes: Array.isArray(item?.culture_interests)
        ? item.culture_interests.map((c: any) => ({ name: c.name, slug: c.slug }))
        : [],
    },
    metrics: Array.isArray(acf.metrics) ? acf.metrics : (Array.isArray(meta.metrics) ? meta.metrics : []),
    schedule: Array.isArray(acf.schedule) ? acf.schedule : (Array.isArray(meta.schedule) ? meta.schedule : []),
    showcase: normalizeShowcase(acf.showcase || meta.showcase),
    featuredHost: normalizeHost(acf.featured_host),
    associatedJourney: normalizeJourney(acf.associated_journey),
    pressDetails: acf.press_details || meta.press_details || null,
    eventSubtype: pick(acf.event_subtype, meta.event_subtype),
    aboutLabel: pick(acf.about_label, meta.about_label),
    venueAddress: pick(acf.venue_address, meta.venue_address),
    rsvpCapacity: acf.rsvp_capacity ? parseInt(String(acf.rsvp_capacity), 10) : null,
    rsvpMembersNote: pick(acf.rsvp_members_note, meta.rsvp_members_note),
    showcaseLabel: pick(acf.showcase_label, meta.showcase_label) || null,
    artistSectionLabel: pick(acf.artist_section_label, meta.artist_section_label) || null,
    artistLinkLabel: pick(acf.artist_link_label, meta.artist_link_label) || null,
    rsvpTicketTypes: Array.isArray(acf.rsvp_ticket_types)
      ? acf.rsvp_ticket_types.map((t: any) => ({
          ticketName:     t.ticket_name     ?? '',
          ticketSlug:     t.ticket_slug     ?? '',
          ticketInfo:     t.ticket_info     ?? '',
          ticketPrice:    t.ticket_price    ?? null,
          ticketAmount:   t.ticket_amount   != null ? parseInt(String(t.ticket_amount), 10) : 0,
          ticketCurrency: t.ticket_currency ?? 'NGN',
        }))
      : [],
  };
}

function mapRestDirectoryToFrontendShape(item: any) {
  const embeddedMedia = item?._embedded?.["wp:featuredmedia"]?.[0];
  const embeddedTerms: any[][] = item?._embedded?.["wp:term"] ?? [];
  const dirTypes  = embeddedTerms.flat().filter((t: any) => t?.taxonomy === "culture_dir_type");
  const interests = embeddedTerms.flat().filter((t: any) => t?.taxonomy === "culture_interest");
  const acf = item?.acf || {};
  const pick = (...vals: any[]) => vals.find(v => v !== undefined && v !== null && v !== "") ?? null;
  return {
    id: String(item?.id ?? ""),
    databaseId: item?.id,
    slug: item?.slug ?? "",
    title: item?.title?.rendered ?? "Untitled",
    date: item?.date ?? null,
    excerpt: item?.excerpt?.rendered ?? "",
    featuredImage: embeddedMedia?.source_url
      ? { node: { sourceUrl: embeddedMedia.source_url, altText: embeddedMedia.alt_text || "" } }
      : null,
    cultureDirectoryTypes: { nodes: dirTypes.map((t: any) => ({ name: t.name, slug: t.slug })) },
    cultureInterests: { nodes: interests.map((t: any) => ({ name: t.name, slug: t.slug })) },
    cultureAccesses: { nodes: [] },
    websiteUrl: pick(acf.website_url, acf.websiteUrl, item?.website_url),
    instagramHandle: pick(acf.instagram_handle, acf.instagramHandle),
    twitterHandle: pick(acf.twitter_handle, acf.twitterHandle),
    isPartner: item?.meta?._is_partner === true || item?.meta?._is_partner === "1",
    partnerStatus: item?.meta?._partner_status ?? null,
    partnerPerk: item?.meta?._partner_perk_template ?? null,
    communityReviewCount: item?.meta?._community_review_count ?? 0,
    averageRating: item?.meta?._average_rating ? Number(item.meta._average_rating) : null,
    selectedWorks: [],
    infobox: null,
  };
}

export async function getDirectoryEntriesWithFallback(first = 200, options: any = {}) {
  const gql = await getWPData(GET_DIRECTORY_ENTRIES, { first }, options);
  const gqlEntries = gql?.cultureDirectories?.nodes ?? [];
  if (gqlEntries.length > 0) return gqlEntries;

  try {
    const url = `${WP_BASE_URL}/wp-json/wp/v2/culture_directory?per_page=${Math.min(first, 100)}&status=publish&_embed=1&orderby=date&order=desc`;
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      next: { revalidate: options.revalidate !== undefined ? options.revalidate : 3600 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    if (!Array.isArray(json)) return [];
    return json.map(mapRestDirectoryToFrontendShape);
  } catch {
    return [];
  }
}

function isEventExpired(event: any): boolean {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  // If an end_date exists, the event expires after that day
  const end = event.endDate || event.end_date;
  if (end) {
    const d = new Date(end); d.setHours(0, 0, 0, 0);
    return !isNaN(d.getTime()) && d < today;
  }
  // Otherwise expire after the event_date day itself
  const start = event.eventDate || event.event_date || event.date;
  if (start) {
    const d = new Date(start); d.setHours(0, 0, 0, 0);
    return !isNaN(d.getTime()) && d < today;
  }
  return false;
}

/** REST-only event list fetch for feed/list views — single request, all meta fields. */
export async function getEventsForFeed(first = 30, options: any = {}): Promise<any[]> {
  try {
    const revalidate = options.revalidate !== undefined ? options.revalidate : 300;
    const url = `${WP_BASE_URL}/wp-json/wp/v2/culture_event?per_page=${first}&status=publish&_embed=wp:featuredmedia&_fields=id,slug,title,date,excerpt,content,acf,meta,culture_event_meta,_links,_embedded&orderby=date&order=desc`;
    const { signal, clear } = wpSignal();
    const res = await fetch(url, { signal, next: { revalidate } });
    clear();
    if (!res.ok) return [];
    const json = await res.json();
    if (!Array.isArray(json)) return [];
    return json.map(mapRestEventToFrontendShape).filter((e: any) => !isEventExpired(e));
  } catch {
    return [];
  }
}

export async function getEventsWithFallback(first = 50, options: any = {}) {
  const gql = await getWPData(GET_EVENTS, { first }, options);
  const gqlEvents = (gql?.cultureEvents?.nodes ?? []).filter((e: any) => !isEventExpired(e));
  if (gqlEvents.length > 0) {
    // WPGraphQL often returns null for ACF/meta fields — patch via REST bulk fetch.
    // Always patch: rsvpCount has no GraphQL resolver and must stay live, not cached.
    const needsPatch = true;
    if (needsPatch) {
      try {
        const patchCtrl = new AbortController();
        const patchTimeout = setTimeout(() => patchCtrl.abort(), 10000);
        const restUrl = `${WP_BASE_URL}/wp-json/wp/v2/culture_event?per_page=${first}&status=publish&_fields=id,slug,acf,meta,culture_event_meta&orderby=date&order=desc`;
        const restRes = await fetch(restUrl, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          signal: patchCtrl.signal,
          next: { revalidate: 60 },
        });
        clearTimeout(patchTimeout);
        if (restRes.ok) {
          const restJson = await restRes.json();
          if (Array.isArray(restJson)) {
            const metaBySlug = new Map<string, any>();
            for (const r of restJson) {
              metaBySlug.set(r.slug, r);
            }
            const pick = (...vals: any[]) => vals.find(v => v !== undefined && v !== null && v !== "" && v !== false) ?? null;
            for (const ev of gqlEvents) {
              const rest = metaBySlug.get(ev.slug);
              if (!rest) continue;
              const acf = rest.acf ?? {};
              const meta = rest.meta ?? {};
              const cem = rest.culture_event_meta ?? {};
              if (!ev.eventDate)    ev.eventDate    = pick(cem.event_date,    acf.event_date,    meta._culture_event_date);
              if (!ev.endDate)      ev.endDate      = pick(cem.end_date,      acf.end_date,      meta._culture_event_end_date);
              if (!ev.location)     ev.location     = pick(cem.location,      acf.location,      meta._culture_location);
              if (!ev.city)         ev.city         = pick(cem.city,          acf.city,          meta._culture_event_city);
              if (!ev.admission)    ev.admission    = pick(cem.admission,     acf.admission,     meta._culture_admission);
              if (!ev.openingHours) ev.openingHours = pick(cem.opening_hours, acf.opening_hours, meta._culture_opening_hours);
              if (!ev.venueAddress) ev.venueAddress = pick(acf.venue_address, meta.venue_address);
              if (!ev.ticketingUrl) ev.ticketingUrl = pick(cem.ticketing_url, acf.ticketing_url, meta._culture_ticketing_url);
              if (!ev.organiserDirectoryId && cem.organiser_id) ev.organiserDirectoryId = Number(cem.organiser_id);
              if (!ev.organiserName && cem.organiser_name) ev.organiserName = cem.organiser_name;
              if (!ev.organiserSlug && cem.organiser_slug) ev.organiserSlug = cem.organiser_slug;
              ev.rsvpCount = Number(cem.rsvp_count) || 0;
              if (!ev.isFeatured) ev.isFeatured = Boolean(cem.is_featured);
              if (!ev.isLiterati) ev.isLiterati = Boolean(cem.is_literati);
            }
          }
        }
      } catch { /* patch is best-effort */ }
    }
    return gqlEvents;
  }

  try {
    const url = `${WP_BASE_URL}/wp-json/wp/v2/culture_event?per_page=${first}&status=publish&_embed=wp:featuredmedia&_fields=id,slug,title,date,excerpt,content,acf,meta,culture_event_meta,_links,_embedded&orderby=date&order=desc`;
    const { signal, clear } = wpSignal();
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal,
      next: {
        revalidate: options.revalidate !== undefined ? options.revalidate : 3600,
      },
    });
    clear();
    if (!res.ok) return [];
    const json = await res.json();
    if (!Array.isArray(json)) return [];
    return json.map(mapRestEventToFrontendShape).filter((e: any) => !isEventExpired(e));
  } catch {
    return [];
  }
}

export async function getEventBySlugWithFallback(slug: string, options: any = {}) {
  const gql = await getWPData(GET_EVENT_BY_SLUG, { slug }, options);
  if (gql?.cultureEvent) {
    const ev = gql.cultureEvent;
    // WPGraphQL may not resolve ACF/meta fields reliably — patch via REST when missing
    const needsHostPatch = !ev.featuredHost?.title;
    const needsMetaPatch = !ev.location || !ev.city || !ev.eventDate || !ev.endDate || !ev.openingHours || !ev.eventImageUrl;
    const needsShowcasePatch = Array.isArray(ev.showcase) && ev.showcase.some((s: any) => !s.image?.sourceUrl && !s.image?.mediaItemUrl);
    let precomputedShowcaseUrls: string[] | null = null;
    if (needsHostPatch || needsMetaPatch || needsShowcasePatch) {
      try {
        const metaRes = await fetch(
          `${WP_BASE_URL}/wp-json/wp/v2/culture_event?slug=${encodeURIComponent(slug)}&status=publish&_fields=acf,meta,culture_event_meta`,
          { next: { revalidate: 3600 } }
        );
        if (metaRes.ok) {
          const metaJson = await metaRes.json();
          const acf = metaJson[0]?.acf ?? {};
          const meta = metaJson[0]?.meta ?? {};
          const cem = metaJson[0]?.culture_event_meta ?? {};
          const pick = (...vals: any[]) => vals.find(v => v !== undefined && v !== null && v !== "" && v !== false) ?? null;

          // Read pre-computed showcase URLs (written by cache_event_showcase_urls PHP hook on save)
          if (meta._culture_event_showcase_urls) {
            try { precomputedShowcaseUrls = JSON.parse(meta._culture_event_showcase_urls); } catch { /* ignore */ }
          }

          if (needsMetaPatch) {
            if (!ev.eventDate)    ev.eventDate    = pick(cem.event_date,    acf.event_date,    meta._culture_event_date);
            if (!ev.endDate)      ev.endDate      = pick(cem.end_date,      acf.end_date,      meta._culture_event_end_date);
            if (!ev.location)     ev.location     = pick(cem.location,      acf.location,      meta._culture_location);
            if (!ev.city)         ev.city         = pick(cem.city,          acf.city,          meta._culture_event_city);
            if (!ev.admission)    ev.admission    = pick(cem.admission,     acf.admission,     meta._culture_admission);
            if (!ev.openingHours) ev.openingHours = pick(cem.opening_hours, acf.opening_hours, meta._culture_opening_hours);
            if (!ev.ticketingUrl) ev.ticketingUrl = pick(cem.ticketing_url, acf.ticketing_url, meta._culture_ticketing_url);
            if (!ev.eventImageUrl) ev.eventImageUrl = pick(cem.image_url, acf.event_image_url, meta._culture_event_image_url);
            if (!ev.featuredImage?.node?.sourceUrl && cem.image_url) {
              ev.featuredImage = { node: { sourceUrl: cem.image_url, altText: "" } };
            }
          }

          if (needsHostPatch) {
            const rawHost = acf.featured_host;
            const hostId = typeof rawHost === "number" ? rawHost
              : Array.isArray(rawHost) ? (typeof rawHost[0] === "number" ? rawHost[0] : rawHost[0]?.ID ?? rawHost[0]?.id ?? null)
              : typeof rawHost === "object" && rawHost ? (rawHost.ID ?? rawHost.id ?? null)
              : null;
            if (hostId) {
              const hostRes = await fetch(
                `${WP_BASE_URL}/wp-json/wp/v2/culture_directory/${hostId}?_embed=1`,
                { next: { revalidate: 3600 } }
              );
              if (hostRes.ok) {
                const h = await hostRes.json();
                const img = h._embedded?.["wp:featuredmedia"]?.[0];
                ev.featuredHost = {
                  title: h.title?.rendered ?? "",
                  slug: h.slug ?? "",
                  excerpt: h.excerpt?.rendered?.replace(/<[^>]+>/g, "") ?? "",
                  featuredImage: img?.source_url ? { node: { sourceUrl: img.source_url, altText: img.alt_text ?? "" } } : null,
                };
              }
            }
          }
        }
      } catch { /* non-fatal */ }
    }

    // Resolve missing showcase images — use pre-computed URLs when available (no media API calls)
    if (Array.isArray(ev.showcase)) {
      if (Array.isArray(precomputedShowcaseUrls)) {
        ev.showcase.forEach((s: any, i: number) => {
          if (!s.image?.sourceUrl && precomputedShowcaseUrls![i]) {
            ev.showcase[i] = { ...s, image: { sourceUrl: precomputedShowcaseUrls![i] } };
          }
        });
      } else {
        const missing = ev.showcase
          .map((s: any, i: number) => {
            if (s.image?.sourceUrl) return null;
            if (s.image?.mediaItemUrl) { ev.showcase[i].image = { sourceUrl: s.image.mediaItemUrl }; return null; }
            const id = s.image?.databaseId ?? null;
            return id ? { i, id } : null;
          })
          .filter(Boolean) as { i: number; id: number }[];
        if (missing.length > 0) {
          for (let b = 0; b < missing.length; b += 3) {
            await Promise.allSettled(missing.slice(b, b + 3).map(async ({ i, id }) => {
              try {
                const mRes = await fetch(`${WP_BASE_URL}/wp-json/wp/v2/media/${id}`, { next: { revalidate: 3600 } });
                if (mRes.ok) {
                  const m = await mRes.json();
                  const url = m.source_url ?? m.guid?.rendered;
                  if (url) ev.showcase[i] = { ...ev.showcase[i], image: { sourceUrl: url } };
                }
              } catch { /* non-fatal */ }
            }));
          }
        }
      }
    }

    return ev;
  }

  try {
    const url = `${WP_BASE_URL}/wp-json/wp/v2/culture_event?slug=${encodeURIComponent(slug)}&status=publish&_embed=1`;
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      next: {
        revalidate: options.revalidate !== undefined ? options.revalidate : 3600,
      },
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!Array.isArray(json) || json.length === 0) return null;
    const event = mapRestEventToFrontendShape(json[0]);

    // ACF post_object fields can return a bare integer ID, an object, or an array.
    // normalizeHost handles objects/arrays; if host is still missing, do a secondary fetch.
    if (!event.featuredHost?.title) {
      const rawHost = json[0]?.acf?.featured_host;
      const hostId = typeof rawHost === "number" ? rawHost
        : Array.isArray(rawHost) ? (typeof rawHost[0] === "number" ? rawHost[0] : rawHost[0]?.ID ?? rawHost[0]?.id ?? null)
        : typeof rawHost === "object" && rawHost ? (rawHost.ID ?? rawHost.id ?? null)
        : null;
      if (hostId) {
        try {
          const hostRes = await fetch(
            `${WP_BASE_URL}/wp-json/wp/v2/culture_directory/${hostId}?_embed=1`,
            { next: { revalidate: 3600 } }
          );
          if (hostRes.ok) {
            const h = await hostRes.json();
            const img = h._embedded?.["wp:featuredmedia"]?.[0];
            event.featuredHost = {
              title: h.title?.rendered ?? "",
              slug: h.slug ?? "",
              excerpt: h.excerpt?.rendered?.replace(/<[^>]+>/g, "") ?? "",
              featuredImage: img?.source_url ? { node: { sourceUrl: img.source_url, altText: img.alt_text ?? "" } } : null,
            };
          }
        } catch { /* non-fatal */ }
      }
    }

    // Resolve showcase image IDs → URLs; prefer pre-computed meta to avoid media API calls
    const preUrls = (() => {
      try {
        const raw = json[0]?.meta?._culture_event_showcase_urls;
        return raw ? JSON.parse(raw) : null;
      } catch { return null; }
    })();

    if (Array.isArray(preUrls) && Array.isArray(event.showcase)) {
      event.showcase.forEach((s: any, i: number) => {
        if (!s.image?.sourceUrl && preUrls[i]) event.showcase[i].image = { sourceUrl: preUrls[i] };
      });
    } else {
      const showcaseImageIds: { i: number; id: number }[] = [];
      (event.showcase ?? []).forEach((s: any, i: number) => {
        const raw = json[0]?.acf?.showcase?.[i]?.image;
        if (!s.image?.sourceUrl && typeof raw === "number" && raw > 0) showcaseImageIds.push({ i, id: raw });
      });
      if (showcaseImageIds.length > 0) {
        for (let b = 0; b < showcaseImageIds.length; b += 3) {
          await Promise.allSettled(showcaseImageIds.slice(b, b + 3).map(async ({ i, id }) => {
            try {
              const mRes = await fetch(`${WP_BASE_URL}/wp-json/wp/v2/media/${id}`, { next: { revalidate: 3600 } });
              if (mRes.ok) {
                const m = await mRes.json();
                const url = m.source_url ?? m.guid?.rendered;
                if (url) event.showcase[i].image = { sourceUrl: url };
              }
            } catch { /* non-fatal */ }
          }));
        }
      }
    }


    return event;
  } catch {
    return null;
  }
}

function mapRestNewsletterToFrontendShape(item: any) {
  const embeddedMedia = item?._embedded?.["wp:featuredmedia"]?.[0];
  const embeddedTerms: any[][] = item?._embedded?.["wp:term"] ?? [];
  const interestTerms = embeddedTerms.flat().filter((t: any) => t?.taxonomy === "culture_interest");
  const accessTerms   = embeddedTerms.flat().filter((t: any) => t?.taxonomy === "culture_access");

  return {
    id: String(item?.id ?? ""),
    databaseId: item?.id,
    slug: item?.slug ?? "",
    title: item?.title?.rendered ?? "Untitled",
    date: item?.date ?? null,
    excerpt: item?.excerpt?.rendered ?? "",
    content: item?.content?.rendered ?? "",
    nlList: item?.meta?.["_culture_nl_list"] || item?.["_culture_nl_list"] || null,
    nlSegment: item?.meta?.["_culture_nl_segment"] || item?.["_culture_nl_segment"] || "",
    nlIssueNum: parseInt(String(item?.meta?.["_culture_nl_issue_num"] || item?.["_culture_nl_issue_num"] || 0), 10) || null,
    featuredImage: embeddedMedia?.source_url
      ? { node: { sourceUrl: embeddedMedia.source_url, altText: embeddedMedia.alt_text || "" } }
      : null,
    cultureInterests: { nodes: interestTerms.map((t: any) => ({ name: t.name, slug: t.slug })) },
    cultureAccesses:  { nodes: accessTerms.map((t: any) => ({ slug: t.slug })) },
  };
}

export async function getNewslettersWithFallback(first = 50, options: any = {}) {
  try {
    const gql = await getWPData(GET_NEWSLETTERS, { first }, options);
    const nodes = gql?.cultureNewsletters?.nodes ?? [];
    if (nodes.length > 0) return nodes;
  } catch {}

  try {
    const { signal, clear } = wpSignal();
    const url = `${WP_BASE_URL}/wp-json/wp/v2/culture_newsletter?per_page=${first}&status=publish&_embed=1&orderby=date&order=desc`;
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal,
      next: { revalidate: options.revalidate !== undefined ? options.revalidate : 3600 },
    });
    clear();
    if (!res.ok) return [];
    const json = await res.json();
    if (!Array.isArray(json)) return [];
    return json.map(mapRestNewsletterToFrontendShape);
  } catch {
    return [];
  }
}

export async function getNewsletterBySlugWithFallback(slug: string, options: any = {}) {
  try {
    const gql = await getWPData(GET_NEWSLETTER_BY_SLUG, { slug }, options);
    if (gql?.cultureNewsletter) return gql.cultureNewsletter;
  } catch {}

  try {
    const url = `${WP_BASE_URL}/wp-json/wp/v2/culture_newsletter?slug=${encodeURIComponent(slug)}&status=publish&_embed=1`;
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      next: { revalidate: options.revalidate !== undefined ? options.revalidate : 3600 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!Array.isArray(json) || json.length === 0) return null;
    return mapRestNewsletterToFrontendShape(json[0]);
  } catch {
    return null;
  }
}

/**
 * Common Fragments for Editorial Components
 */
const STORY_FIELDS_FRAGMENT = `
  fragment StoryFields on Post {
    id
    databaseId
    title
    slug
    date
    excerpt
    content
    featuredImage {
      node {
        sourceUrl
        altText
      }
    }
    asToldTo
    seoTitle
    seoDescription
    author {
      node {
        name
        slug
        databaseId
        description
        avatar {
          url
        }
      }
    }
    categories {
      nodes {
        name
        slug
      }
    }
    industries {
      nodes {
        name
        slug
      }
    }
    series {
      nodes {
        name
        slug
        description
      }
    }
    countries {
      nodes {
        name
        slug
      }
    }
    # Event specific fields (expected from ACF/JetEngine)
    location
    eventStatus: status
    isFeatured
    admission
  }
`;

export const STORY_FIELDS = STORY_FIELDS_FRAGMENT;

export const GET_STORY_BY_SLUG = `
  query GetStoryBySlug($slug: ID!) {
    post(id: $slug, idType: SLUG) {
      ...StoryFields
      content
      featuredProducts {
        id
        slug
        name
        price
        imageUrl
        imageAlt
      }
    }
  }
  ${STORY_FIELDS_FRAGMENT}
`;

export const GET_STORIES = `
  query GetStories($first: Int, $categoryName: String, $tag: String) {
    posts(first: $first, where: { categoryName: $categoryName, tag: $tag }) {
      nodes {
        ...StoryFields
      }
    }
  }
  ${STORY_FIELDS_FRAGMENT}
`;

// Lightweight query — only fetches id + tags for edition-exclusion logic.
// Avoids touching STORY_FIELDS_FRAGMENT in case post_tag isn't in the schema.
export const GET_STORIES_TAGS = `
  query GetStoriesTags($first: Int, $tag: String) {
    posts(first: $first, where: { tag: $tag }) {
      nodes {
        id
        tags {
          nodes {
            slug
          }
        }
      }
    }
  }
`;

export const GET_FILTERS = `
  query GetFilters {
    categories(where: { hideEmpty: true, orderby: COUNT, order: DESC }, first: 100) { nodes { name, slug } }
    industries(where: { hideEmpty: true }, first: 100) { nodes { name, slug } }
    countries(where: { hideEmpty: true }, first: 100) { nodes { name, slug } }
    series(where: { hideEmpty: true }, first: 100) { nodes { name, slug, description } }
  }
`;

// ── The Moveee Literary ───────────────────────────────────────────────────
// A quarterly poetry/fiction/nonfiction/translation vertical at
// apps/site/app/literary/*, built on the *same* `post` type as the rest of
// the magazine (see "The Moveee Literary" in CLAUDE.md) — no new CPT, no
// GraphQL schema changes. Every piece must carry the parent "literary"
// category PLUS exactly one of the four genre child categories below:
// WPGraphQL's `categoryName` filter matches only the exact term, it does
// NOT include descendant terms, so tagging both is what makes
// `categoryName: "literary"` return every piece across genres while
// `categoryName: "literary-poetry"` (etc.) returns just one genre's pieces.
export const LITERARY_CATEGORY_SLUG = "literary";

export interface LiteraryGenre {
  slug: string;
  categorySlug: string;
  label: string;
  tagline: string;
}

export const LITERARY_GENRES: LiteraryGenre[] = [
  {
    slug: "poetry",
    categorySlug: "literary-poetry",
    label: "Poetry",
    tagline: "Verse that moves like breath and lands like weather.",
  },
  {
    slug: "fiction",
    categorySlug: "literary-fiction",
    label: "Fiction",
    tagline: "Short stories and excerpts that hold a whole life in a few pages.",
  },
  {
    slug: "nonfiction",
    categorySlug: "literary-nonfiction",
    label: "Nonfiction",
    tagline: "Essays and true stories, reported and remembered.",
  },
  {
    slug: "translation",
    categorySlug: "literary-translation",
    label: "Translation",
    tagline: "Work carried across languages, credited by name.",
  },
];

export function getLiteraryGenre(slug: string): LiteraryGenre | undefined {
  return LITERARY_GENRES.find((g) => g.slug === slug.toLowerCase());
}

type CategorizedPost = { categories?: { nodes?: { slug: string }[] | null } | null } | null | undefined;

export function isLiteraryPost(post: CategorizedPost): boolean {
  return (post?.categories?.nodes || []).some((c) => c.slug === LITERARY_CATEGORY_SLUG);
}

export function literaryGenreOfPost(post: CategorizedPost): LiteraryGenre | undefined {
  const slugs = new Set((post?.categories?.nodes || []).map((c) => c.slug));
  return LITERARY_GENRES.find((g) => slugs.has(g.categorySlug));
}

/**
 * Fetches pieces for the whole vertical (omit categorySlug) or one genre
 * (pass one of LITERARY_GENRES[].categorySlug). Degrades to an empty array
 * on any fetch failure — same pattern as every other magazine-section
 * helper in this file — so a CMS hiccup never takes down /literary.
 */
export async function getLiteraryPieces(categorySlug?: string, first = 24): Promise<any[]> {
  try {
    const data = await getWPData(GET_STORIES, {
      first,
      categoryName: categorySlug || LITERARY_CATEGORY_SLUG,
    });
    return data?.posts?.nodes || [];
  } catch (err: any) {
    console.error("[literary] getLiteraryPieces failed:", err?.message || err);
    return [];
  }
}

// Kept for reference but no longer used directly — see GET_SERIES_STORIES etc.
export const GET_TAX_STORIES = `
  query GetTaxStories($category: String, $series: ID, $industry: ID, $country: ID) {
    seriesItem(id: $series, idType: SLUG) { posts(first: 24) { nodes { ...StoryFields } } }
    industry(id: $industry, idType: SLUG) { posts(first: 24) { nodes { ...StoryFields } } }
    country(id: $country, idType: SLUG) { posts(first: 24) { nodes { ...StoryFields } } }
  }
  ${STORY_FIELDS_FRAGMENT}
`;

// ── Magazine Issues ───────────────────────────────────────────────────────────

export const GET_ALL_ISSUES = `
  query GetAllIssues {
    issues(first: 50, where: { orderby: TERM_ORDER, order: DESC, hideEmpty: true }) {
      nodes {
        id
        databaseId
        name
        slug
        description
        issueFields {
          issueNumber
          issueSubtitle
          issueEditorialNote
          issueCoverImageUrl
        }
        posts(first: 1) {
          nodes { date }
        }
      }
    }
  }
`;

export const GET_ISSUE_BY_SLUG = `
  query GetIssueBySlug($slug: ID!) {
    issue(id: $slug, idType: SLUG) {
      id
      databaseId
      name
      slug
      description
      issueFields {
        issueNumber
        issueSubtitle
        issueEditorialNote
        issueCoverImageUrl
      }
      posts(first: 100) {
        nodes {
          ...StoryFields
        }
      }
    }
  }
  ${STORY_FIELDS_FRAGMENT}
`;

// Separate per-taxonomy queries so we never pass null to a required ID! argument.
export const GET_SERIES_STORIES = `
  query GetSeriesStories($series: ID!) {
    seriesItem(id: $series, idType: SLUG) {
      name
      slug
      description
      posts(first: 48) { nodes { ...StoryFields } }
    }
  }
  ${STORY_FIELDS_FRAGMENT}
`;

export const GET_SERIES_STORIES_BATCH = `
  query GetSeriesBatch {
    theRadar: seriesItem(id: "the-radar", idType: SLUG) { posts(first: 8) { nodes { ...StoryFields } } }
    portraits: seriesItem(id: "portraits-of-the-city", idType: SLUG) { posts(first: 8) { nodes { ...StoryFields } } }
    theLane: seriesItem(id: "the-lane", idType: SLUG) { posts(first: 8) { nodes { ...StoryFields } } }
    thinkCreative: seriesItem(id: "think-like-a-creative", idType: SLUG) { posts(first: 8) { nodes { ...StoryFields } } }
  }
  ${STORY_FIELDS_FRAGMENT}
`;

export const GET_INDUSTRY_STORIES = `
  query GetIndustryStories($industry: ID!) {
    industry(id: $industry, idType: SLUG) {
      name
      slug
      description
      posts(first: 48) { nodes { ...StoryFields } }
    }
  }
  ${STORY_FIELDS_FRAGMENT}
`;

export const GET_COUNTRY_STORIES = `
  query GetCountryStories($country: ID!) {
    country(id: $country, idType: SLUG) {
      name
      slug
      description
      posts(first: 48) { nodes { ...StoryFields } }
    }
  }
  ${STORY_FIELDS_FRAGMENT}
`;

// ── Multi-country story lookup (REST) ───────────────────────────────────────
// WPGraphQL only exposes single-country lookups for this taxonomy —
// `country(id, idType: SLUG) { posts }` — there's no countryIn/countrySlugIn
// filter on the posts root query (confirmed against the live schema). WP
// core's REST API natively supports comma-separated term IDs on any
// REST-queryable taxonomy's query var, though — confirmed live:
// wp-json/wp/v2/posts?country=982,1042,1070 just works with zero plugin
// changes. Used for edition (UK/US/Africa) story scoping in
// fetchHomepageData.ts, which needs "any of several countries", not just one.
function mapRestStoryToFrontendShape(item: any) {
  const media = item?._embedded?.["wp:featuredmedia"]?.[0];
  const author = item?._embedded?.author?.[0];
  const terms: any[] = (item?._embedded?.["wp:term"] ?? []).flat();
  const byTaxonomy = (tax: string) =>
    terms.filter((t) => t?.taxonomy === tax).map((t) => ({ name: t.name, slug: t.slug }));

  return {
    id: String(item?.id ?? ""),
    databaseId: item?.id,
    title: item?.title?.rendered ?? "Untitled",
    slug: item?.slug ?? "",
    date: item?.date ?? null,
    excerpt: item?.excerpt?.rendered ?? "",
    featuredImage: media?.source_url
      ? { node: { sourceUrl: media.source_url, altText: media.alt_text ?? "" } }
      : null,
    author: author
      ? { node: { name: author.name ?? "", slug: author.slug ?? "", databaseId: author.id, avatar: { url: author.avatar_urls?.["96"] ?? "" } } }
      : null,
    categories: { nodes: byTaxonomy("category") },
    countries: { nodes: byTaxonomy("country") },
  };
}

/**
 * Resolves `country` taxonomy slugs to term IDs, then fetches the most
 * recent posts tagged with any of them — the REST path for multi-country
 * "edition" scoping (see mapRestStoryToFrontendShape above for why this
 * isn't done via GraphQL). Returns [] on any failure — best-effort, same as
 * every other REST fallback helper in this file.
 */
export async function getStoriesByCountrySlugs(slugs: string[], first = 14, options: any = {}) {
  if (!slugs.length) return [];
  try {
    const { signal: termsSignal, clear: clearTerms } = wpSignal();
    const termsUrl = `${WP_BASE_URL}/wp-json/wp/v2/country?slug=${encodeURIComponent(slugs.join(","))}&per_page=100&_fields=id,slug`;
    const termsRes = await fetch(termsUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: termsSignal,
      next: { revalidate: options.revalidate !== undefined ? options.revalidate : 3600 },
    });
    clearTerms();
    if (!termsRes.ok) return [];
    const terms = await termsRes.json();
    const ids = Array.isArray(terms) ? terms.map((t: any) => t.id).filter(Boolean) : [];
    if (!ids.length) return [];

    const { signal: postsSignal, clear: clearPosts } = wpSignal();
    const postsUrl = `${WP_BASE_URL}/wp-json/wp/v2/posts?country=${ids.join(",")}&per_page=${first}&status=publish&_embed=1&orderby=date&order=desc`;
    const postsRes = await fetch(postsUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: postsSignal,
      next: { revalidate: options.revalidate !== undefined ? options.revalidate : 600 },
    });
    clearPosts();
    if (!postsRes.ok) return [];
    const json = await postsRes.json();
    if (!Array.isArray(json)) return [];
    return json.map(mapRestStoryToFrontendShape);
  } catch {
    return [];
  }
}

// ── Magazine section fetching — the same pinned-section pattern used by
// /magazine's default (unfiltered) view (News → "The Edit", Viewpoints →
// "Opinions & Essays", the-lane series → "The Lane", the-free-critics
// series → "The Free Critics", plus a general edition-aware top pool for
// "The Front Page"/hero content). Extracted out of
// apps/site/app/magazine/MagazineArchiveWrapper.tsx so the homepage can
// reuse the exact same fetch/dedupe logic instead of re-deriving it —
// see that file's own `else` branch, which now just calls
// getMagazineSections() too. Keep both callers in sync if this changes.

async function getGlobalStoryPool(): Promise<any[]> {
  const data = await getWPData(GET_STORIES, { first: 40 });
  return data?.posts?.nodes || [];
}

async function getMagazineMainPool(edition: EditionSlug | undefined): Promise<any[]> {
  if (!edition || edition === "global") {
    return getGlobalStoryPool();
  }

  try {
    const countrySlugs = (EDITIONS[edition]?.countrySlugs ?? []) as unknown as string[];
    const [editionPosts, latestData] = await Promise.all([
      getStoriesByCountrySlugs(countrySlugs, 40, { revalidate: 300 }),
      getWPData(GET_STORIES, { first: 40 }),
    ]);
    const latestPosts: any[] = latestData?.posts?.nodes || [];

    const allEditionCountrySlugs = new Set(
      Object.values(EDITIONS).flatMap((e) => e.countrySlugs as unknown as string[])
    );
    const editionIds = new Set(editionPosts.map((p: any) => p.id));
    const universalPosts = latestPosts.filter((p: any) => {
      if (editionIds.has(p.id)) return false;
      const postCountrySlugs: string[] = (p.countries?.nodes ?? []).map((c: any) => c.slug);
      return !postCountrySlugs.some((s) => allEditionCountrySlugs.has(s));
    });

    const pool = [...editionPosts, ...universalPosts];
    if (pool.length > 0) return pool;

    console.warn(`[magazine-sections] empty pool for edition "${edition}", falling back to global`);
    return getGlobalStoryPool();
  } catch (err: any) {
    console.error(`[magazine-sections] getMagazineMainPool failed for edition "${edition}":`, err?.message || err);
    return getGlobalStoryPool();
  }
}

export interface MagazineSections {
  /** News-excluded, edition-aware top pool — hero/sidebar/band content lives here. */
  topPool: any[];
  /** News category — "The Edit". */
  editorialStories: any[];
  /** Viewpoints category — "Opinions & Essays". */
  opinionStories: any[];
  /** "the-lane" series — "The Lane". */
  portraitStories: any[];
  /** "the-free-critics" series — "The Free Critics". */
  digestStories: any[];
}

export async function getMagazineSections(edition?: EditionSlug): Promise<MagazineSections> {
  try {
    const [mainPool, editData, opinionData, portraitData, digestData] = await Promise.all([
      getMagazineMainPool(edition),
      getWPData(GET_STORIES, { first: 6, categoryName: "news" }),
      getWPData(GET_STORIES, { first: 12, categoryName: "viewpoints" }),
      getWPData(GET_SERIES_STORIES, { series: "the-lane" }),
      getWPData(GET_SERIES_STORIES, { series: "the-free-critics" }),
    ]);
    const editorialStories = editData?.posts?.nodes || [];

    const topPool = mainPool.filter(
      (p: any) => !p.categories?.nodes?.some((c: any) => c.slug === "news")
    );

    const usedByTopIds = new Set(topPool.slice(0, 7).map((p: any) => p.id));

    const opinionStories = (opinionData?.posts?.nodes || [])
      .filter((p: any) => !usedByTopIds.has(p.id))
      .slice(0, 4);
    const portraitStories = (portraitData?.seriesItem?.posts?.nodes || [])
      .filter((p: any) => !usedByTopIds.has(p.id))
      .slice(0, 5);
    const digestStories = (digestData?.seriesItem?.posts?.nodes || [])
      .filter((p: any) => !usedByTopIds.has(p.id))
      .slice(0, 4);

    return { topPool, editorialStories, opinionStories, portraitStories, digestStories };
  } catch (err: any) {
    console.error("[magazine-sections] getMagazineSections failed:", err?.message || err);
    return { topPool: [], editorialStories: [], opinionStories: [], portraitStories: [], digestStories: [] };
  }
}

export const GET_CATEGORY_INFO = `
  query GetCategoryInfo($slug: ID!) {
    category(id: $slug, idType: SLUG) {
      name
      slug
      description
    }
  }
`;

export const GET_TAG_INFO = `
  query GetTagInfo($tag: ID!) {
    tag(id: $tag, idType: SLUG) {
      name
      slug
      description
    }
  }
`;

// ── DIRECTORY & EVENTS FRAGMENTS ─────────────────────────────────

const DIRECTORY_FIELDS_FRAGMENT = `
  fragment DirectoryFields on CultureDirectory {
    id
    databaseId
    title
    slug
    date
    excerpt
    featuredImage {
      node {
        sourceUrl
        altText
        mediaDetails {
          width
          height
        }
      }
    }
    cultureDirectoryTypes {
      nodes {
        name
        slug
      }
    }
    cultureInterests {
      nodes {
        name
        slug
      }
    }
    cultureAccesses {
      nodes {
        slug
      }
    }
    websiteUrl
    instagramHandle
    twitterHandle
    isPartner
    partnerStatus
    partnerPerk
    communityReviewCount
    averageRating
    selectedWorks {
      title
      imageUrl
    }
    infobox {
      born died nationality occupation knownFor originCity activeYears awards labels education
      country region population officialLanguage currency founded area
      founders originCountry activePeriod ideology keyFigures relatedMovements
      originDecade instruments tempoBpm keyArtists relatedGenres subgenres
      keyThinkers period relatedConcepts
      director year starring cinematographer language distributor runtime productionCompany
      author yearPublished genre publisher pages isbn
      artist medium dimensions currentLocation artCollection style
      foodType mainIngredients alsoKnownAs culturalContext
      origin era keyDesigners materials culturalSignificance
      creator network seasons years
    }
  }
`;

const JOURNEY_FIELDS_FRAGMENT = `
  fragment JourneyFields on CultureJourney {
    id
    databaseId
    title
    slug
    date
    excerpt
    content
    featuredImage {
      node {
        sourceUrl
        altText
      }
    }
    journeyEdition
    journeyDates
    journeyLocation
    journeyPrice
    journeySpots
    journeyStatus
    journeyInclusions
    journeyExclusions
    journeyItinerary {
      dayNumber
      dayTitle
      dayLocation
      dayDescription
      activities {
        activityTime
        activityTitle
        activityDescription
        activityType
      }
    }
    journeyHosts {
      hostName
      hostRole
      hostBio
      hostImage {
        sourceUrl
      }
    }
  }
`;

// Lightweight fragment for list/feed queries — omits complex ACF sub-objects that
// can cause WP GraphQL internal server errors on malformed records.
const EVENT_LIST_FIELDS_FRAGMENT = `
  fragment EventListFields on CultureEvent {
    id
    databaseId
    title
    slug
    date
    eventDate
    endDate
    location
    eventLocation: location
    admission
    ticketingUrl
    eventImageUrl
    isFeatured
    isLiterati
    isPhysical
    isAiGenerated
    tagline
    attribution
    openingHours
    excerpt
    content
    featuredImage {
      node {
        sourceUrl
        altText
      }
    }
    cultureInterests {
      nodes {
        name
        slug
      }
    }
    eventSubtype
    aboutLabel
    venueAddress
  }
`;

// Full fragment for single-event detail pages — includes all ACF sub-objects.
const EVENT_FIELDS_FRAGMENT = `
  fragment EventFields on CultureEvent {
    id
    databaseId
    title
    slug
    date
    eventDate
    endDate
    location
    eventLocation: location
    admission
    ticketingUrl
    eventImageUrl
    isFeatured
    isLiterati
    isPhysical
    isAiGenerated
    tagline
    attribution
    openingHours
    excerpt
    content
    featuredImage {
      node {
        sourceUrl
        altText
      }
    }
    cultureInterests {
      nodes {
        name
        slug
      }
    }
    metrics {
      label
      value
    }
    schedule {
      time
      title
      description
      access
    }
    showcase {
      title
      media
      dimensions
      year
      price
      imageUrl
    }
    featuredHost {
      title
      slug
      excerpt
      featuredImage {
        node {
          sourceUrl
          altText
        }
      }
    }
    associatedJourney {
      ...JourneyFields
    }
    pressDetails {
      eyebrow
      title
      content
      link
    }
    eventSubtype
    aboutLabel
    showcaseLabel
    artistSectionLabel
    artistLinkLabel
    venueAddress
    rsvpCapacity
    rsvpMembersNote
    rsvpTicketTypes {
      ticketName
      ticketSlug
      ticketInfo
      ticketPrice
      ticketAmount
      ticketCurrency
    }
  }
`;

export const JOURNEY_FIELDS = JOURNEY_FIELDS_FRAGMENT;

export const GET_JOURNEYS = `
  query GetJourneys($first: Int) {
    cultureJourneys(first: $first) {
      nodes {
        ...JourneyFields
      }
    }
  }
  ${JOURNEY_FIELDS_FRAGMENT}
`;

export const GET_AUTHOR_STORIES = `
  query GetAuthorStories($first: Int, $id: ID!) {
    user(id: $id, idType: DATABASE_ID) {
      name
      description
      slug
      databaseId
      avatar {
        url
      }
      posts(first: $first) {
        nodes {
          ...StoryFields
        }
      }
    }
  }
  ${STORY_FIELDS_FRAGMENT}
`;

export const GET_AUTHOR_STORIES_BY_SLUG = `
  query GetAuthorStoriesBySlug($first: Int, $slug: ID!) {
    user(id: $slug, idType: SLUG) {
      name
      description
      slug
      databaseId
      avatar {
        url
      }
      posts(first: $first) {
        nodes {
          ...StoryFields
        }
      }
    }
  }
  ${STORY_FIELDS_FRAGMENT}
`;

export const GET_AUTHOR_STORIES_BY_LOGIN = `
  query GetAuthorStoriesByLogin($first: Int, $login: ID!) {
    user(id: $login, idType: USERNAME) {
      name
      description
      slug
      databaseId
      avatar {
        url
      }
      posts(first: $first) {
        nodes {
          ...StoryFields
        }
      }
    }
  }
  ${STORY_FIELDS_FRAGMENT}
`;

const NEWSLETTER_FIELDS_FRAGMENT = `
  fragment NewsletterFields on CultureNewsletter {
    id
    databaseId
    title
    slug
    date
    excerpt
    content
    nlList
    nlSegment
    nlIssueNum
    featuredImage {
      node {
        sourceUrl
        altText
      }
    }
    cultureInterests {
      nodes {
        name
        slug
      }
    }
    cultureAccesses {
      nodes {
        slug
      }
    }
  }
`;

export const NEWSLETTER_FIELDS = NEWSLETTER_FIELDS_FRAGMENT;

export const GET_NEWSLETTERS = `
  query GetNewsletters($first: Int) {
    cultureNewsletters(first: $first, where: { status: PUBLISH, orderby: { field: DATE, order: DESC } }) {
      nodes {
        ...NewsletterFields
      }
    }
  }
  ${NEWSLETTER_FIELDS_FRAGMENT}
`;

export const GET_NEWSLETTER_BY_SLUG = `
  query GetNewsletterBySlug($slug: ID!) {
    cultureNewsletter(id: $slug, idType: SLUG) {
      ...NewsletterFields
      content
    }
  }
  ${NEWSLETTER_FIELDS_FRAGMENT}
`;

export const GET_ADJACENT_NEWSLETTERS = `
  query GetAdjacentNewsletters($notIn: [ID], $first: Int) {
    cultureNewsletters(first: $first, where: { status: PUBLISH, notIn: $notIn }) {
      nodes {
        title
        slug
        date
      }
    }
  }
`;

export const GET_EVENTS = `
  query GetEvents($first: Int) {
    cultureEvents(first: $first) {
      nodes {
        ...EventListFields
      }
    }
  }
  ${EVENT_LIST_FIELDS_FRAGMENT}
`;

export const GET_EVENT_BY_SLUG = `
  query GetEventBySlug($slug: ID!) {
    cultureEvent(id: $slug, idType: SLUG) {
      ...EventFields
      content
    }
  }
  ${EVENT_FIELDS_FRAGMENT}
  ${JOURNEY_FIELDS_FRAGMENT}
`;

export const GET_JOURNEY_BY_SLUG = `
  query GetJourneyBySlug($slug: ID!) {
    cultureJourney(id: $slug, idType: SLUG) {
      ...JourneyFields
      content
    }
  }
  ${JOURNEY_FIELDS_FRAGMENT}
`;

const PRODUCT_FIELDS_FRAGMENT = `
  fragment ProductFields on Product {
    id
    databaseId
    name
    slug
    description
    shortDescription
    image { sourceUrl altText }
    galleryImages { nodes { sourceUrl altText } }
    productCategories { nodes { name slug } }
    productTags { nodes { name slug } }
    ... on SimpleProduct {
      price
      regularPrice
      salePrice
      stockStatus
      stockQuantity
      onSale
      attributes { nodes {
        name
        label
        options
        variation
        ... on GlobalProductAttribute { terms { nodes { name } } }
      } }
    }
    ... on VariableProduct {
      price
      stockStatus
      onSale
      attributes { nodes {
        name
        label
        options
        variation
        ... on GlobalProductAttribute { terms { nodes { name } } }
      } }
      variations(first: 12) {
        nodes {
          price
          stockStatus
          attributes { nodes { name value } }
        }
      }
    }
  }
`;

export const PRODUCT_FIELDS = PRODUCT_FIELDS_FRAGMENT;

// Newest-first ordering for the products connection.
//
// IMPORTANT: unlike WPGraphQL core's `posts`/`cultureNewsletters` connections
// (which use this exact shape elsewhere in this file and are proven against the
// live schema), `orderby` inside the *products* where-args is WooGraphQL
// territory and its support is version-dependent. If the running WooGraphQL
// rejects it, the query fails validation, WPGraphQL returns `data: null`, and
// getWPData() hands back null — which the shop renders as a completely empty
// grid with no error anywhere on the page. Every products query therefore ships
// in an ordered and an unordered form; fetch them via getProductsWithFallback()
// rather than calling getWPData() with the ordered query directly.
//
// The two forms MUST keep distinct GraphQL operation names — getCacheKey()
// derives the KV cache key from the operation name, so reusing one name would
// make the fallback read (and overwrite) the failing query's cached result.
const PRODUCTS_ORDER_NEWEST = ", orderby: { field: DATE, order: DESC }";

const buildGetProducts = (opName: string, order: string) => `
  query ${opName}($first: Int, $category: String, $tag: String) {
    products(first: $first, where: { category: $category, tag: $tag${order} }) {
      nodes {
        ...ProductFields
      }
    }
  }
  ${PRODUCT_FIELDS_FRAGMENT}
`;
export const GET_PRODUCTS = buildGetProducts("GetProducts", PRODUCTS_ORDER_NEWEST);
export const GET_PRODUCTS_UNORDERED = buildGetProducts("GetProductsUnordered", "");

/**
 * Fetch a products connection, falling back to the unordered form of the same
 * query when the ordered one comes back empty.
 *
 * A genuinely empty result is cheap to double-check (it only happens on an
 * empty catalogue or a broken query), so this costs one extra request in
 * exactly the case where the page would otherwise be blank.
 */
export async function getProductsWithFallback(
  ordered: string,
  unordered: string,
  variables: Record<string, any> = {},
  options: any = {}
) {
  const data = await getWPData(ordered, variables, options);
  if (data?.products?.nodes?.length) return data;

  const fallback = await getWPData(unordered, variables, options);
  if (fallback?.products?.nodes?.length) {
    console.warn(
      "[shop] The ordered products query returned nothing but the unordered one " +
        "returned results — this WooGraphQL version is rejecting `orderby` inside " +
        "the products where-args. Serving unordered results."
    );
    return fallback;
  }
  return data ?? fallback;
}

/**
 * Diagnostic for the "/shop is empty but GraphQL works fine" case (August 2026).
 *
 * A raw fetch() against the CMS proves the GraphQL API itself is healthy, but
 * ShopArchiveWrapper never calls the CMS directly — it goes through getWPData,
 * which sits behind a Vercel-KV cache AND a KV-backed circuit breaker, both of
 * which are private to this module. A raw-fetch probe can look completely
 * healthy while the real page keeps serving a stale cached empty result, or
 * gets short-circuited by a still-open circuit breaker, and there was
 * previously no way to see either of those states from outside this file.
 *
 * `bust: true` deletes the two cache keys this checks (ordered + unordered,
 * default/no-filter shop listing) before reading them, so a caller can force
 * a genuinely fresh read through the real code path without waiting out the
 * TTL. Only ever touches those two keys — never a blanket cache flush.
 */
export async function __shopDebugState(opts: { first?: number; bust?: boolean } = {}) {
  const first = opts.first ?? 24;
  const kv = await getKV();
  const vars = { first, category: null, tag: null };
  const keyOrdered = kvKey(GET_PRODUCTS, vars);
  const keyUnordered = kvKey(GET_PRODUCTS_UNORDERED, vars);

  if (opts.bust && kv) {
    await Promise.allSettled([kv.del(keyOrdered), kv.del(keyUnordered)]);
  }

  const [cbState, cachedOrdered, cachedUnordered] = kv
    ? await Promise.all([
        kv.get(CB_KEY).catch(() => null),
        kv.get(keyOrdered).catch(() => null),
        kv.get(keyUnordered).catch(() => null),
      ])
    : [null, null, null];

  // The exact call ShopArchiveWrapper makes for the default (no brand/category/
  // tag) listing — this is the real code path, cache and circuit breaker included.
  const liveResult = await getProductsWithFallback(GET_PRODUCTS, GET_PRODUCTS_UNORDERED, vars);

  return {
    kvConfigured: !!kv,
    cacheBusted: !!(opts.bust && kv),
    circuitBreaker: {
      raw: cbState,
      currentlyOpen: !!(cbState && (cbState as any).openUntil > Date.now()),
    },
    cache: {
      keyOrdered,
      hasCachedOrdered: cachedOrdered !== null && cachedOrdered !== undefined,
      cachedOrderedProductCount: (cachedOrdered as any)?.products?.nodes?.length ?? null,
      keyUnordered,
      hasCachedUnordered: cachedUnordered !== null && cachedUnordered !== undefined,
      cachedUnorderedProductCount: (cachedUnordered as any)?.products?.nodes?.length ?? null,
    },
    // What ShopArchiveWrapper would actually receive right now, from this exact call.
    liveProductCount: liveResult?.products?.nodes?.length ?? null,
    liveSample: (liveResult?.products?.nodes ?? []).slice(0, 3).map((n: any) => n?.slug ?? null),
  };
}


export const GET_PRODUCT_BY_SLUG = `
  query GetProductBySlug($slug: ID!) {
    product(id: $slug, idType: SLUG) {
      ...ProductFields
    }
  }
  ${PRODUCT_FIELDS_FRAGMENT}
`;

// Fetched separately so the product page still renders if the
// moveee-graphql-bridge plugin is not yet active.
// $country: pass the shopper's country ("nigeria", case-insensitive — matches
// the mobile app's own request-param convention, see moveee-graphql-bridge.php's
// moveee_resolve_shop_currency()) to get displayPrice converted to their local
// currency; omit/pass anything else to get the store's base GBP price back.
// vendorProfile/moveeeMeta/averageRating/reviewCount/productMaterials/
// displayPrice are registered per concrete WooCommerce product type
// (SimpleProduct/VariableProduct/ExternalProduct/GroupProduct) in
// moveee-graphql-bridge.php, not on the Product interface itself — querying
// them directly on `product { ... }` with no inline fragment is a GraphQL
// validation error ("Cannot query field ... on type Product"), which
// getWPData() swallows as a fetch failure, silently dropping vendor/maker
// data with no visible error. Every one of these fields MUST stay inside an
// `... on <ConcreteType>` block, same as PRODUCT_FIELDS_FRAGMENT above.
const PRODUCT_EXTRA_TYPE_FIELDS = `
      vendorProfile {
        slug
        storeName
        bio
        city
        country
        avatarUrl
        yearsActive
        rating
        productCount
      }
      moveeeMeta {
        makerStory
        careInstructions
        processSteps
        asSeenInPostId
        deliveryInfo
        earlyAccessUntil
      }
      averageRating
      reviewCount
      productMaterials
      displayPrice(country: $country) {
        price
        regularPrice
        salePrice
        proPrice
        proDiscountPercent
        currencyCode
      }
`;

export const GET_PRODUCT_EXTRA = `
  query GetProductExtra($slug: ID!, $country: String) {
    product(id: $slug, idType: SLUG) {
      ... on SimpleProduct {${PRODUCT_EXTRA_TYPE_FIELDS}}
      ... on VariableProduct {${PRODUCT_EXTRA_TYPE_FIELDS}}
      ... on ExternalProduct {${PRODUCT_EXTRA_TYPE_FIELDS}}
      ... on GroupProduct {${PRODUCT_EXTRA_TYPE_FIELDS}}
    }
  }
`;

// Batched extra-data fetch for the shop listing/grid pages — same isolation
// rationale as GET_PRODUCT_EXTRA above (these fields depend on the
// moveee-graphql-bridge plugin and must never be merged into
// PRODUCT_FIELDS_FRAGMENT/GET_PRODUCTS, or a bridge-plugin outage would take
// down the whole grid query). Re-issues the same first/category/tag args as
// GET_PRODUCTS so the result set lines up, then the caller merges by id.
// displayPrice(country: $country) — see GET_PRODUCT_EXTRA's comment above for
// the $country value convention ("nigeria", not an ISO code).
// Same interface-vs-concrete-type fragment requirement as
// PRODUCT_EXTRA_TYPE_FIELDS above — databaseId/slug are on the Product
// interface itself and are safe unwrapped, but everything from the bridge
// plugin is registered per concrete type and must stay inside `... on X`.
const PRODUCT_EXTRA_GRID_FIELDS = `
        vendorProfile { storeName city country }
        averageRating
        reviewCount
        productMaterials
        featured
        displayPrice(country: $country) {
          price
          regularPrice
          salePrice
          proPrice
          proDiscountPercent
          currencyCode
        }
`;
const PRODUCT_EXTRA_NODE_FIELDS = `
        databaseId
        slug
        ... on SimpleProduct {${PRODUCT_EXTRA_GRID_FIELDS}}
        ... on VariableProduct {${PRODUCT_EXTRA_GRID_FIELDS}}
        ... on ExternalProduct {${PRODUCT_EXTRA_GRID_FIELDS}}
        ... on GroupProduct {${PRODUCT_EXTRA_GRID_FIELDS}}
`;

const buildGetProductsExtra = (opName: string, order: string) => `
  query ${opName}($first: Int, $category: String, $tag: String, $country: String) {
    products(first: $first, where: { category: $category, tag: $tag${order} }) {
      nodes {${PRODUCT_EXTRA_NODE_FIELDS}}
    }
  }
`;
export const GET_PRODUCTS_EXTRA = buildGetProductsExtra("GetProductsExtra", PRODUCTS_ORDER_NEWEST);
export const GET_PRODUCTS_EXTRA_UNORDERED = buildGetProductsExtra("GetProductsExtraUnordered", "");

const buildGetProductsByVendorExtra = (opName: string, order: string) => `
  query ${opName}($first: Int, $vendor: String, $country: String) {
    products(first: $first, where: { authorName: $vendor${order} }) {
      nodes {${PRODUCT_EXTRA_NODE_FIELDS}}
    }
  }
`;
export const GET_PRODUCTS_BY_VENDOR_EXTRA = buildGetProductsByVendorExtra("GetProductsByVendorExtra", PRODUCTS_ORDER_NEWEST);
export const GET_PRODUCTS_BY_VENDOR_EXTRA_UNORDERED = buildGetProductsByVendorExtra("GetProductsByVendorExtraUnordered", "");

// Sitewide default Moveee Pro discount percentage, for page-level copy
// ("Moveee Pro saves X%") that isn't about one specific product — a given
// product's own effective percent (which may differ via a per-product
// override) is on that product's displayPrice.proDiscountPercent instead.
export const GET_SHOP_PRO_DISCOUNT_PERCENT = `
  query GetShopProDiscountPercent {
    moveeeShopProDiscountPercent
  }
`;

export const GET_PRODUCT_CATEGORIES = `
  query GetProductCategories {
    productCategories(first: 20, where: { hideEmpty: true }) {
      nodes {
        name
        slug
        count
        image { sourceUrl altText }
      }
    }
  }
`;

export const GET_POST_BY_ID = `
  query GetPostById($id: ID!) {
    post(id: $id, idType: DATABASE_ID) {
      title
      slug
      excerpt
      featuredImage { node { sourceUrl altText } }
      categories { nodes { name slug } }
    }
  }
`;

const buildGetProductsByVendor = (opName: string, order: string) => `
  query ${opName}($first: Int, $vendor: String) {
    products(first: $first, where: { authorName: $vendor${order} }) {
      nodes {
        ...ProductFields
      }
    }
  }
  ${PRODUCT_FIELDS_FRAGMENT}
`;
export const GET_PRODUCTS_BY_VENDOR = buildGetProductsByVendor("GetProductsByVendor", PRODUCTS_ORDER_NEWEST);
export const GET_PRODUCTS_BY_VENDOR_UNORDERED = buildGetProductsByVendor("GetProductsByVendorUnordered", "");

const VENDOR_PROFILE_FIELDS = `
  slug storeName bio city country avatarUrl bannerUrl yearsActive rating productCount
  website instagram twitter directorySlug
`;

export const GET_ALL_MAKERS = `
  query GetAllMakers($first: Int) {
    moveeeVendors(first: $first) { ${VENDOR_PROFILE_FIELDS} }
  }
`;

export const GET_MAKER_BY_SLUG = `
  query GetMakerBySlug($slug: String!) {
    moveeeVendorBySlug(slug: $slug) { ${VENDOR_PROFILE_FIELDS} }
  }
`;

export const GET_MOVEEE_EDIT = `
  query GetMoveeeEdit($first: Int, $tag: String) {
    posts(first: $first, where: { tag: $tag, status: PUBLISH, orderby: { field: DATE, order: DESC } }) {
      nodes {
        id
        databaseId
        title
        slug
        date
        excerpt
        featuredImage { node { sourceUrl altText } }
        categories { nodes { name slug } }
        featuredProducts {
          id
          slug
          name
          price
          imageUrl
          imageAlt
        }
      }
    }
  }
`;

export const GET_POSTS_BY_SEARCH = `
  query GetPostsBySearch($search: String!, $first: Int) {
    posts(first: $first, where: { search: $search, status: PUBLISH }) {
      nodes {
        title
        slug
        excerpt
        featuredImage { node { sourceUrl altText } }
        categories { nodes { name slug } }
        date
      }
    }
  }
`;

export const DIRECTORY_FIELDS = DIRECTORY_FIELDS_FRAGMENT;

export const GET_DIRECTORY_ENTRIES = `
  query GetDirectoryEntries($first: Int) {
    cultureDirectories(first: $first, where: { status: PUBLISH }) {
      nodes {
        ...DirectoryFields
      }
    }
  }
  ${DIRECTORY_FIELDS_FRAGMENT}
`;

/**
 * Fetch all entry-type taxonomy terms (culture_dir_type).
 * Used to populate filter buttons on the listing page and the
 * type select in the submission form — any type added in WP Admin
 * automatically appears without code changes.
 */
export const GET_DIRECTORY_TYPES = `
  query GetDirectoryTypes {
    cultureDirectoryTypes(first: 50) {
      nodes {
        name
        slug
        count
      }
    }
  }
`;

export const GET_DIRECTORY_ENTRY_BY_SLUG = `
  query GetDirectoryEntryBySlug($slug: ID!) {
    cultureDirectory(id: $slug, idType: SLUG) {
      ...DirectoryFields
      content
    }
  }
  ${DIRECTORY_FIELDS_FRAGMENT}
`;

export const GET_DIRECTORY_ENTRIES_BY_TYPE = `
  query GetDirectoryEntriesByType($first: Int, $typeSlug: String) {
    cultureDirectories(first: $first, where: { status: PUBLISH, taxQuery: { taxArray: [{ taxonomy: CULTURE_DIR_TYPE, field: SLUG, terms: [$typeSlug] }] } }) {
      nodes {
        ...DirectoryFields
      }
    }
  }
  ${DIRECTORY_FIELDS_FRAGMENT}
`;

export const GET_DIRECTORY_ENTRIES_BY_INTEREST = `
  query GetDirectoryEntriesByInterest($first: Int, $interestSlug: String) {
    cultureDirectories(first: $first, where: { status: PUBLISH, taxQuery: { taxArray: [{ taxonomy: CULTURE_INTEREST, field: SLUG, terms: [$interestSlug] }] } }) {
      nodes {
        ...DirectoryFields
      }
    }
  }
  ${DIRECTORY_FIELDS_FRAGMENT}
`;

const QUOTE_FIELDS_FRAGMENT = `
  fragment QuoteFields on CultureQuote {
    id
    databaseId
    title
    slug
    content
    date
    quoteSource
    quoteLikes
    quoteSharingReason
    quoteType
    quoteAuthors {
      nodes {
        name
        slug
      }
    }
  }
`;

// Basic fragment without plugin-registered fields (quoteSource, quoteLikes).
// Used as a fallback when the culture-community plugin is not active.
const QUOTE_FIELDS_BASIC_FRAGMENT = `
  fragment QuoteFieldsBasic on CultureQuote {
    id
    databaseId
    title
    slug
    content
    date
    quoteAuthors {
      nodes {
        name
        slug
      }
    }
  }
`;

export const QUOTE_FIELDS = QUOTE_FIELDS_FRAGMENT;

export const GET_QUOTES = `
  query GetQuotes($first: Int) {
    cultureQuotes(first: $first, where: { status: PUBLISH }) {
      nodes {
        ...QuoteFields
      }
    }
  }
  ${QUOTE_FIELDS_FRAGMENT}
`;

const GET_QUOTES_BASIC = `
  query GetQuotesBasic($first: Int) {
    cultureQuotes(first: $first, where: { status: PUBLISH }) {
      nodes {
        ...QuoteFieldsBasic
      }
    }
  }
  ${QUOTE_FIELDS_BASIC_FRAGMENT}
`;

export const GET_QUOTE_BY_ID = `
  query GetQuoteByID($id: ID!) {
    cultureQuote(id: $id, idType: DATABASE_ID) {
      ...QuoteFields
    }
  }
  ${QUOTE_FIELDS_FRAGMENT}
`;

const GET_QUOTE_BY_ID_BASIC = `
  query GetQuoteByIDBasic($id: ID!) {
    cultureQuote(id: $id, idType: DATABASE_ID) {
      ...QuoteFieldsBasic
    }
  }
  ${QUOTE_FIELDS_BASIC_FRAGMENT}
`;

export const GET_QUOTES_BY_AUTHOR = `
  query GetQuotesByAuthor($slug: ID!) {
    quoteAuthor(id: $slug, idType: SLUG) {
      name
      description
      cultureQuotes(first: 100) {
        nodes {
          ...QuoteFields
        }
      }
    }
  }
  ${QUOTE_FIELDS_FRAGMENT}
`;

/**
 * Try the primary query; if it returns null (e.g. schema validation error
 * because the culture-community plugin is not active and quoteSource /
 * quoteLikes are not registered), transparently fall back to the simpler query.
 */
export async function getWPQuotes(variables: { first?: number }, options: { revalidate?: number } = {}) {
  const opts = { revalidate: options.revalidate ?? 3600 };
  const primary = await getWPData(GET_QUOTES, variables, opts);
  if (primary !== null) return primary;
  return getWPData(GET_QUOTES_BASIC, variables, opts);
}

export async function getWPQuoteById(variables: { id: string }) {
  const primary = await getWPData(GET_QUOTE_BY_ID, variables);
  if (primary !== null) return primary;
  return getWPData(GET_QUOTE_BY_ID_BASIC, variables);
}

export const GET_SITE_SETTINGS = `
  query GetSiteSettings {
    allSettings {
      generalSettingsTitle
      generalSettingsDescription
    }
    mastheadTicker {
      issueText
      issueUrl
      announcementText
      announcementUrl
      locations
    }
  }
`;

// ── Issue helpers (REST-based — term meta not available via GraphQL without ACF) ──

export interface IssueTerm {
  id: number;
  name: string;
  slug: string;
  description: string;
  meta: {
    issue_number?: string | number;
    issue_subtitle?: string;
    issue_editorial_note?: string;
    issue_cover_image_url?: string;
  };
}

// Sort issues by decimal version number (e.g. "1.0", "2.1", "2.1.2") descending
function sortIssuesByNumber(issues: IssueTerm[]): IssueTerm[] {
  return [...issues].sort((a, b) => {
    const parse = (n: string | number | undefined) =>
      String(n ?? "0").split(".").map((s) => parseInt(s, 10) || 0);
    const pa = parse(a.meta?.issue_number);
    const pb = parse(b.meta?.issue_number);
    const len = Math.max(pa.length, pb.length);
    for (let i = 0; i < len; i++) {
      const diff = (pb[i] ?? 0) - (pa[i] ?? 0); // descending: latest first
      if (diff !== 0) return diff;
    }
    return b.id - a.id; // fallback: higher id first
  });
}

export async function getLatestIssue(): Promise<IssueTerm | null> {
  try {
    const res = await fetch(
      `${WP_BASE_URL}/wp-json/wp/v2/issues?per_page=50&orderby=id&order=desc&_fields=id,name,slug,description,meta`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return sortIssuesByNumber(data ?? [])[0] ?? null;
  } catch { return null; }
}

export async function getAllIssues(): Promise<IssueTerm[]> {
  try {
    const res = await fetch(
      `${WP_BASE_URL}/wp-json/wp/v2/issues?per_page=50&orderby=id&order=desc&_fields=id,name,slug,description,meta`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return [];
    return sortIssuesByNumber(await res.json());
  } catch { return []; }
}

export async function getIssueBySlug(slug: string): Promise<IssueTerm | null> {
  try {
    const res = await fetch(
      `${WP_BASE_URL}/wp-json/wp/v2/issues?slug=${encodeURIComponent(slug)}&_fields=id,name,slug,description,meta`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.[0] ?? null;
  } catch { return null; }
}

export async function getIssuesForPost(postId: number): Promise<IssueTerm[]> {
  try {
    const res = await fetch(
      `${WP_BASE_URL}/wp-json/wp/v2/issues?post=${postId}&_fields=id,name,slug,description,meta`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

export async function getPostsByIssue(issueId: number): Promise<any[]> {
  try {
    const res = await fetch(
      `${WP_BASE_URL}/wp-json/wp/v2/posts?issues=${issueId}&per_page=100&orderby=date&order=asc&_embed=1&status=publish`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

export interface DirectoryPostsSummary {
  total_posts: number;
  average_rating: number | null;
  by_template: Record<string, number>;
}

export interface DirectoryPost {
  id: number;
  slug?: string;
  template_type: string;
  content: string;
  star_rating: number | null;
  author: { name: string; avatar: string; tier: string };
  reactions: Record<string, number>;
  created_at: string;
}

export interface DirectoryPostsResponse {
  posts: DirectoryPost[];
  summary: DirectoryPostsSummary;
}

export async function getDirectoryPosts(directoryId: number): Promise<DirectoryPostsResponse> {
  const empty: DirectoryPostsResponse = {
    posts: [],
    summary: { total_posts: 0, average_rating: null, by_template: {} },
  };
  try {
    const res = await fetch(
      `${WP_BASE_URL}/wp-json/culture/v1/directory/${directoryId}/posts`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return empty;
    return await res.json();
  } catch { return empty; }
}

export interface DirectoryEvent {
  id: number;
  slug: string;
  title: string;
  href: string;
  event_date: string | null;
  end_date: string | null;
  location: string | null;
  city: string | null;
  admission: string | null;
  image: string | null;
}

export async function getDirectoryEvents(directoryId: number): Promise<DirectoryEvent[]> {
  try {
    const res = await fetch(
      `${WP_BASE_URL}/wp-json/culture/v1/directory/${directoryId}/events`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.events) ? data.events : [];
  } catch { return []; }
}
