/**
 * Decode HTML entities from WordPress REST API rendered fields.
 * WP encodes smart quotes, ampersands etc. as numeric entities (&#8217;)
 * which React renders as literal text rather than the intended character.
 */
export function decodeHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "")           // strip HTML tags
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))            // decimal entities  &#8217;
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))  // hex entities &#x2019;
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&rsquo;/g, "’")
    .replace(/&lsquo;/g, "‘")
    .replace(/&ldquo;/g, "“")
    .replace(/&rdquo;/g, "”")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&hellip;/g, "…")
    .trim();
}
