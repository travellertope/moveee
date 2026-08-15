/**
 * Promote lazy-load placeholder images back to their real URLs.
 *
 * PORT OF `packages/shared/lib/sanitize.ts`'s `unlazyImages()` — keep the two in
 * sync. `apps/mobile` can't import from packages/shared (RN vs DOM), same as
 * feed-recommendations/interest-mappings; the logic itself is pure regex with no
 * DOM dependency, so it ports verbatim.
 *
 * WordPress runs Optimole's `the_content` filter before any consumer sees a post
 * body, so in-body images arrive as lazy-load placeholders:
 *
 *   <img src="data:image/svg+xml;base64,…" data-opt-src="https://….i.optimole.com/…">
 *   <noscript><img src="https://….i.optimole.com/…"></noscript>
 *
 * Optimole's own JavaScript is what swaps `data-opt-src` into `src`, and that
 * script is enqueued by WordPress — so it never runs here. React Native's
 * <Image> can't render an SVG data URI at all, so the placeholder resolves to
 * nothing and the image is simply missing from the article. (The web frontend
 * hits the same root cause but fails differently — there sanitizeHtml strips the
 * data attribute AND the data: URI, leaving an <img> with no src that paints a
 * blank box. See the CLAUDE.md section on this for the full story.)
 *
 * Applied centrally by `components/ui/HtmlContent.tsx`, which every RenderHtml
 * call site goes through, so no content surface can miss it.
 */

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

    // A javascript:/vbscript: URL parked in a data attribute must never be
    // promoted into src. The web copy relies on sanitizeHtml's scheme check
    // downstream; mobile has no sanitizer in the pipeline, so it's enforced here.
    if (realSrc && /^\s*(javascript|vbscript|data):/i.test(realSrc)) return tag;

    promoted++;
    let next = tag;
    if (realSrc) next = writeAttr(next, "src", realSrc);
    if (realSrcset) next = writeAttr(next, "srcset", realSrcset);
    return next;
  });

  // Drop the plugin's <noscript> fallback copies so they can't render as a
  // duplicate image beside the one we just repaired. Only when something was
  // actually promoted, so a <noscript> image is never removed unless a real one
  // has taken its place.
  if (promoted > 0) {
    out = out.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, "");
  }
  return out;
}
