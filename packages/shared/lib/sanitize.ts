/**
 * HTML sanitizer — no DOM dependency, safe in Node.js serverless environments.
 *
 * Replaces isomorphic-dompurify (which pulls in jsdom → html-encoding-sniffer →
 * @exodus/bytes ESM) with a pure-regex allowlist approach. Zero external deps,
 * works identically in Node.js, Edge, and the browser.
 */

const ALLOWED_TAGS = new Set([
  "p", "br", "b", "i", "em", "strong", "u", "s", "strike",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li", "blockquote", "pre", "code",
  "a", "img", "figure", "figcaption",
  "table", "thead", "tbody", "tr", "th", "td",
  "hr", "span", "div",
]);

const ALLOWED_ATTR = new Set([
  "href", "src", "alt", "title", "class", "id",
  "target", "rel", "width", "height",
]);

// Matches an opening or closing HTML tag with its attributes.
const TAG_RE = /<(\/?)([\w-]+)([^>]*?)(\s*\/?)>/gi;

// Matches a single attribute: name="value", name='value', or name=value
const ATTR_RE = /([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]*))/gi;

function sanitizeAttrs(attrString: string): string {
  const out: string[] = [];
  let m: RegExpExecArray | null;
  ATTR_RE.lastIndex = 0;
  while ((m = ATTR_RE.exec(attrString)) !== null) {
    const name  = m[1].toLowerCase();
    const value = (m[2] ?? m[3] ?? m[4] ?? "").trim();
    if (!ALLOWED_ATTR.has(name)) continue;
    // Block javascript: / data: / vbscript: URIs on href and src
    if ((name === "href" || name === "src") &&
        /^\s*(javascript|data|vbscript):/i.test(value)) continue;
    out.push(`${name}="${value.replace(/"/g, "&quot;")}"`);
  }
  return out.length ? " " + out.join(" ") : "";
}

/** Sanitize HTML from the CMS before rendering with dangerouslySetInnerHTML. */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return "";
  return dirty.replace(TAG_RE, (_match, slash, tag, attrs, selfClose) => {
    const lower = tag.toLowerCase();
    if (!ALLOWED_TAGS.has(lower)) return "";
    if (slash) return `</${lower}>`;
    return `<${lower}${sanitizeAttrs(attrs)}${selfClose ? " /" : ""}>`;
  });
}

/** Strip all HTML — for plain-text contexts. */
export function stripHtml(dirty: string): string {
  if (!dirty) return "";
  return dirty.replace(/<[^>]+>/g, "");
}
