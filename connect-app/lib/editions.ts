export const EDITIONS = {
  global: { label: "Global",  tag: undefined,   path: "/",        countries: [] as string[] },
  uk:     { label: "UK",      tag: "uk",         path: "/uk",      countries: ["GB"] },
  us:     { label: "US",      tag: "us",         path: "/us",      countries: ["US", "CA", "MX"] },
  africa: { label: "Africa",  tag: "africa",     path: "/africa",  countries: [
    "NG","GH","KE","ZA","ET","EG","TZ","UG","CM","SN","CI","MA",
    "DZ","LY","TN","SD","AO","MZ","MG","CD","ML","BF","NE","TD",
    "GN","RW","BJ","BI","SO","TG","SL","LR","MR","GM","GW","CV",
    "ST","KM","MU","SC","RE","YT","ZM","ZW","MW","LS","SZ","BW","NA",
  ]},
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
