// countrySlugs — real `country` WP taxonomy term slugs (cms.themoveee.com,
// verified live July 2026) that scope magazine content to each edition —
// replaces the old Tags-based `tag` field for CONTENT geotagging
// (fetchHomepageData.ts). `tag` is kept only for the shop/product edition
// scoping, which is unrelated and still Tags-based.
//
// The country taxonomy itself has real data-hygiene issues (duplicate terms
// for the same country, e.g. "uk" vs "united-kingdom"; a handful of
// non-country terms like person names) — these lists are a deliberately
// curated allow-list of only the real, known-good country slugs, not a
// blind dump of every term. If the taxonomy is ever cleaned up in WP Admin
// (duplicates merged), the redundant slug entries below can be trimmed but
// don't need to be — an unmatched slug is simply a no-op.
export const EDITIONS = {
  global: { label: "Global",  tag: undefined,   path: "/",        countries: [] as string[], countrySlugs: [] as string[] },
  uk:     { label: "UK",      tag: "uk",         path: "/uk",      countries: ["GB"],
            countrySlugs: ["united-kingdom", "uk"] },
  us:     { label: "US",      tag: "us",         path: "/us",      countries: ["US", "CA", "MX"],
            countrySlugs: ["united-states-of-america", "united-states"] },
  africa: { label: "Africa",  tag: "africa",     path: "/africa",  countries: [
    "NG","GH","KE","ZA","ET","EG","TZ","UG","CM","SN","CI","MA",
    "DZ","LY","TN","SD","AO","MZ","MG","CD","ML","BF","NE","TD",
    "GN","RW","BJ","BI","SO","TG","SL","LR","MR","GM","GW","CV",
    "ST","KM","MU","SC","RE","YT","ZM","ZW","MW","LS","SZ","BW","NA",
  ], countrySlugs: [
    "nigeria", "ghana", "south-africa", "kenya", "ivory-coast", "cote-divoire",
    "congo", "democratic-republic-of-congo", "the-republic-of-congo",
    "senegal", "sudan", "uganda", "zambia", "zimbabwe", "algeria", "ethiopia",
    "togo", "the-gambia", "benin", "cameroon", "malawi", "mozambique",
    "tanzania", "africa",
  ] },
} as const;

export type EditionSlug = keyof typeof EDITIONS;
export const REGIONAL_SLUGS = ["uk", "us", "africa"] as const;
export type RegionalSlug = typeof REGIONAL_SLUGS[number];

export function isValidRegionalSlug(s: string): s is RegionalSlug {
  return REGIONAL_SLUGS.includes(s as RegionalSlug);
}

export function editionFromCountry(country: string): EditionSlug {
  for (const [slug, cfg] of Object.entries(EDITIONS)) {
    if ((cfg.countries as readonly string[]).includes(country)) {
      return slug as EditionSlug;
    }
  }
  return "global";
}
