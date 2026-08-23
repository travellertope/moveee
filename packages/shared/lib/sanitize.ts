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
  // WordPress's oEmbed handler (YouTube, Vimeo, SoundCloud, Spotify) renders
  // a real <iframe> into the_content server-side — without this, every
  // embedded video/track was silently stripped (the whole tag, not just
  // unwrapped) since it wasn't in this allowlist at all.
  "iframe",
]);

const ALLOWED_ATTR = new Set([
  "href", "src", "alt", "title", "class", "id",
  "target", "rel", "width", "height",
  // Responsive/loading hints. `srcset`/`sizes` in particular were previously
  // stripped, which silently downgraded every CMS image to its full-size
  // original — see unlazyImages() below for the related lazy-load bug.
  "srcset", "sizes", "loading", "decoding",
  // iframe embed attributes — allow/allowfullscreen/referrerpolicy are the
  // ones YouTube/Vimeo's own embed markup actually sets.
  "allow", "allowfullscreen", "frameborder", "referrerpolicy",
]);

// iframe `src` is restricted to known embed providers — unlike img/a hrefs
// (any CMS-authored link/image is fine), an arbitrary iframe src renders a
// full external page inside ours, so it gets its own allowlist rather than
// just the javascript:/data:/vbscript: scheme check below.
const IFRAME_HOST_ALLOWLIST = [
  "youtube.com", "www.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com",
  "player.vimeo.com",
  "w.soundcloud.com",
  "open.spotify.com", "embed.spotify.com",
];

function isAllowedIframeSrc(value: string): boolean {
  try {
    const url = new URL(value, "https://placeholder.invalid");
    if (url.protocol !== "https:") return false;
    return IFRAME_HOST_ALLOWLIST.includes(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

// Attributes an image-optimisation / lazy-load plugin parks the REAL image URL
// in while `src` holds a placeholder. Ordered by preference: Optimole's own
// attribute first, then the generic names used by Smush/Rocket/Jetpack/etc.
const LAZY_SRC_ATTRS = [
  "data-opt-src", "data-src", "data-lazy-src", "data-original", "data-lazy-original",
];
const LAZY_SRCSET_ATTRS = [
  "data-opt-srcset", "data-srcset", "data-lazy-srcset",
];

function readAttr(tag: string, name: string): string | null {
  const re = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i");
  const m = re.exec(tag);
  if (!m) return null;
  const val = (m[1] ?? m[2] ?? "").trim();
  return val || null;
}

function writeAttr(tag: string, name: string, value: string): string {
  const escaped = value.replace(/"/g, "&quot;");
  const re = new RegExp(`(\\s${name}\\s*=\\s*)(?:"[^"]*"|'[^']*'|[^\\s>]+)`, "i");
  if (re.test(tag)) return tag.replace(re, `$1"${escaped}"`);
  return tag.replace(/<img\b/i, `<img ${name}="${escaped}"`);
}

/**
 * Promote lazy-load placeholder images back to their real URLs.
 *
 * WordPress runs Optimole's `the_content` filter before WPGraphQL hands us the
 * post body, so in-body images arrive as lazy-load placeholders:
 *
 *   <img src="data:image/svg+xml;base64,…" data-opt-src="https://….i.optimole.com/…">
 *   <noscript><img src="https://….i.optimole.com/…"></noscript>
 *
 * Optimole's own JavaScript is what swaps `data-opt-src` into `src` — and that
 * script is enqueued by WordPress, so it never runs on this headless Next.js
 * frontend. On top of that, sanitizeHtml() drops `data-*` attributes (not in the
 * allowlist) AND blocks `data:` URIs on `src`, so the image ends up with no
 * usable src at all and renders as a blank box at its reserved width/height —
 * the "images white out" bug. Only images Optimole skips (it excludes the first
 * N above-the-fold images from lazy loading) survived, which is why *some*
 * images on a post render fine and the rest don't.
 *
 * Resolving this here rather than by suspending Optimole's filter in PHP (the
 * approach `Culture_Newsletter_Queue::render_content()` takes for email, where
 * the same JS-never-runs problem applies) is deliberate: the promoted URL is
 * still the Optimole CDN one, so images stay optimised/resized. Suspending the
 * filter would fall back to unoptimised originals served straight from
 * cms.themoveee.com.
 */
export function unlazyImages(html: string): string {
  if (!html || html.indexOf("<img") === -1) return html;

  let promoted = 0;
  let out = html.replace(/<img\b[^>]*>/gi, (tag) => {
    let realSrc: string | null = null;
    for (const name of LAZY_SRC_ATTRS) {
      realSrc = readAttr(tag, name);
      if (realSrc) break;
    }
    let realSrcset: string | null = null;
    for (const name of LAZY_SRCSET_ATTRS) {
      realSrcset = readAttr(tag, name);
      if (realSrcset) break;
    }
    if (!realSrc && !realSrcset) return tag;

    promoted++;
    let next = tag;
    if (realSrc) next = writeAttr(next, "src", realSrc);
    if (realSrcset) next = writeAttr(next, "srcset", realSrcset);
    return next;
  });

  // Drop the plugin's <noscript> fallback copies. sanitizeHtml() strips unknown
  // *tags* but keeps their children, so these would otherwise unwrap into a
  // second, duplicate <img> next to the one we just repaired. Only done when we
  // actually promoted something, so a <noscript> image is never removed unless a
  // real one has taken its place.
  if (promoted > 0) {
    out = out.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, "");
  }
  return out;
}

// Matches an opening or closing HTML tag with its attributes.
const TAG_RE = /<(\/?)([\w-]+)([^>]*?)(\s*\/?)>/gi;

// Matches a single attribute: name="value", name='value', name=value, or a
// bare boolean attribute with no value at all (e.g. YouTube/Vimeo's own
// embed markup writes `allowfullscreen` with no `=`, not `allowfullscreen=""`).
const ATTR_RE = /([\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]*)))?/gi;

function sanitizeAttrs(attrString: string, tag: string): string {
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
    // srcset is a comma-separated candidate list, so the scheme can appear
    // anywhere in the value rather than only at the start.
    if (name === "srcset" && /(javascript|vbscript|data):/i.test(value)) continue;
    // iframe src is restricted to known embed providers — see
    // IFRAME_HOST_ALLOWLIST's own comment for why this is separate from the
    // scheme check above.
    if (tag === "iframe" && name === "src" && !isAllowedIframeSrc(value)) continue;
    out.push(`${name}="${value.replace(/"/g, "&quot;")}"`);
  }
  return out.length ? " " + out.join(" ") : "";
}

/**
 * Sanitize HTML from the CMS before rendering with dangerouslySetInnerHTML.
 *
 * Runs unlazyImages() first — it has to happen before attribute filtering,
 * since the real image URL lives in a `data-*` attribute the allowlist drops.
 * Doing it here rather than at each call site means no content surface can miss
 * it: every place that renders CMS HTML already funnels through this function.
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return "";
  return unlazyImages(dirty).replace(TAG_RE, (_match, slash, tag, attrs, selfClose) => {
    const lower = tag.toLowerCase();
    if (!ALLOWED_TAGS.has(lower)) return "";
    if (slash) return `</${lower}>`;
    return `<${lower}${sanitizeAttrs(attrs, lower)}${selfClose ? " /" : ""}>`;
  });
}

/** Strip all HTML — for plain-text contexts. */
export function stripHtml(dirty: string): string {
  if (!dirty) return "";
  return dirty.replace(/<[^>]+>/g, "");
}
