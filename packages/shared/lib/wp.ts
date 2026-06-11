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
    } catch { /* KV unavailable — fall through to CMS */ }

    const data = await getWPDataFromCMS(query, variables, options);
    if (data) {
      try { await kv.set(key, data, { ex: ttl }); } catch { /* ignore KV write errors */ }
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

export async function getEventsWithFallback(first = 50, options: any = {}) {
  const gql = await getWPData(GET_EVENTS, { first }, options);
  const gqlEvents = (gql?.cultureEvents?.nodes ?? []).filter((e: any) => !isEventExpired(e));
  if (gqlEvents.length > 0) {
    // WPGraphQL often returns null for ACF/meta fields — patch via REST bulk fetch
    const needsPatch = gqlEvents.some((e: any) => !e.location || !e.city || !e.endDate || !e.venueAddress);
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
    if (needsHostPatch || needsMetaPatch) {
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

          // Patch core event meta fields that WPGraphQL may return as null
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
            // ACF returns object, array-of-objects, or bare integer ID depending on return_format
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

    // Resolve missing showcase images via WP media API when GraphQL returns null
    if (Array.isArray(ev.showcase)) {
      const missing = ev.showcase
        .map((s: any, i: number) => {
          if (s.image?.sourceUrl) return null;
          // Try mediaItemUrl first, then fall back to databaseId fetch
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

    // Resolve showcase image IDs → actual URLs
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
    series(where: { hideEmpty: true }, first: 100) { nodes { name, slug } }
  }
`;

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

// ── COMMUNITY CHAPTERS & EVENTS FRAGMENTS ─────────────────────────────────

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
    nlList
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
    }
    ... on VariableProduct {
      price
      stockStatus
      onSale
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

export const GET_PRODUCTS = `
  query GetProducts($first: Int, $category: String, $tag: String) {
    products(first: $first, where: { category: $category, tag: $tag }) {
      nodes {
        ...ProductFields
      }
    }
  }
  ${PRODUCT_FIELDS_FRAGMENT}
`;


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
export const GET_PRODUCT_EXTRA = `
  query GetProductExtra($slug: ID!) {
    product(id: $slug, idType: SLUG) {
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
        memberPrice
        earlyAccessUntil
      }
    }
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

export const GET_PRODUCTS_BY_VENDOR = `
  query GetProductsByVendor($first: Int, $vendor: String) {
    products(first: $first, where: { authorName: $vendor }) {
      nodes {
        ...ProductFields
      }
    }
  }
  ${PRODUCT_FIELDS_FRAGMENT}
`;

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
