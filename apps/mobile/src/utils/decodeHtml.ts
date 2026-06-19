// Decode common HTML entities that WordPress includes in API text fields.
export function decodeHtml(str: string | undefined | null): string {
  if (!str) return str as string;
  return str
    .replace(/&#8217;/g, "’")  // right single quote / apostrophe
    .replace(/&#8216;/g, "‘")  // left single quote
    .replace(/&#8220;/g, "“")  // left double quote
    .replace(/&#8221;/g, "”")  // right double quote
    .replace(/&#8211;/g, "–")  // en dash
    .replace(/&#8212;/g, "—")  // em dash
    .replace(/&#8230;/g, "…")  // ellipsis
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g,  "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g,   "<")
    .replace(/&gt;/g,   ">")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}
