import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize HTML from the CMS or user-generated content before rendering
 * with dangerouslySetInnerHTML. Allows standard rich-text tags but strips
 * event handlers and dangerous attributes.
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      "p", "br", "b", "i", "em", "strong", "u", "s", "strike",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li", "blockquote", "pre", "code",
      "a", "img", "figure", "figcaption",
      "table", "thead", "tbody", "tr", "th", "td",
      "hr", "span", "div",
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "title", "class", "id", "target", "rel", "width", "height"],
    FORCE_BODY: true,
  });
}

/** Sanitize for plain-text contexts — strips all HTML. */
export function stripHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}
