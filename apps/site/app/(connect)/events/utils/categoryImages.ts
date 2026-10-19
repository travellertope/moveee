/**
 * Category-based fallback images for events that have no featured photo.
 * Images: curated Unsplash photos (w=900, q=80, fit=crop).
 * Gradient fallbacks live in events.css under [data-cat-ph].
 */

const BASE = "https://images.unsplash.com/photo-";
const PARAMS = "?w=900&q=80&fit=crop&auto=format";

const CATEGORY_IMAGES: Record<string, string> = {
  // Core event categories
  "music":        `${BASE}1493225457124-a3eb161ffa5f${PARAMS}`, // live concert crowd
  "film":         `${BASE}1478720568477-152d9b164e26${PARAMS}`, // cinema interior
  "visual-arts":  `${BASE}1541367777708-7905fe3ab498${PARAMS}`, // art gallery wall
  "fashion":      `${BASE}1509631179647-0177331693ae${PARAMS}`, // fashion runway
  "food":         `${BASE}1414235077428-338989a2e8c0${PARAMS}`, // food spread
  "literature":   `${BASE}1481627834876-b7833e8f5570${PARAMS}`, // books / library
  "design":       `${BASE}1558618666-fcd25c85cd64${PARAMS}`,    // design tools
  "performance":  `${BASE}1507676184212-d03ab07a01bf${PARAMS}`, // stage performance
  "community":    `${BASE}1511632765153-9ea8a0a2b02d${PARAMS}`, // community gathering
  "tech":         `${BASE}1540575467063-178a50c2df87${PARAMS}`, // tech conference

  // Interest-slug aliases (from cultureInterests taxonomy)
  "live-music":        `${BASE}1493225457124-a3eb161ffa5f${PARAMS}`,
  "music-production":  `${BASE}1598488035466-da7ece5900f9${PARAMS}`, // studio / mixing desk
  "independent-film":  `${BASE}1478720568477-152d9b164e26${PARAMS}`,
  "visual-art":        `${BASE}1541367777708-7905fe3ab498${PARAMS}`,
  "fashion-streetwear":`${BASE}1509631179647-0177331693ae${PARAMS}`,
  "food-drink":        `${BASE}1414235077428-338989a2e8c0${PARAMS}`,
  "street-food":       `${BASE}1555396273-367ea4eb4db5${PARAMS}`, // street food stall
  "nightlife":         `${BASE}1516450360452-9312f5e86fc7${PARAMS}`, // city night scene
  "sport-wellness":    `${BASE}1571019613454-1cb2f99b2d8b${PARAMS}`, // wellness / yoga
  "architecture":      `${BASE}1486325212027-8081e485255e${PARAMS}`, // architectural building
  "photography":       `${BASE}1502982720700-bfff97943522${PARAMS}`, // camera / photography
  "visual-design":     `${BASE}1558618666-fcd25c85cd64${PARAMS}`,
  "tech-culture":      `${BASE}1540575467063-178a50c2df87${PARAMS}`,
  "travel":            `${BASE}1469854523086-cc02fe5d8800${PARAMS}`, // travel / destination
  "ideas":             `${BASE}1456081101716-74e616ab1d46${PARAMS}`, // discussion / ideas
  "event-performance": `${BASE}1507676184212-d03ab07a01bf${PARAMS}`,
  "event-community":   `${BASE}1511632765153-9ea8a0a2b02d${PARAMS}`,
};

/**
 * Returns a fallback image URL for the given category slug.
 * Falls back to a generic cultural event image if the category isn't mapped.
 */
export function getCategoryImage(categorySlug?: string | null): string {
  if (categorySlug) {
    const key = categorySlug.toLowerCase().trim();
    if (CATEGORY_IMAGES[key]) return CATEGORY_IMAGES[key];
  }
  // Generic fallback: vibrant cultural event
  return `${BASE}1470229722913-7c0e2dbbafd3${PARAMS}`;
}

/**
 * CSS gradient per category — used as background on placeholder divs.
 * These show instantly (no network) and serve as last-resort fallback when
 * the Unsplash image itself fails to load.
 */
export const CATEGORY_GRADIENTS: Record<string, string> = {
  "music":        "linear-gradient(135deg, #1a1033 0%, #6b21a8 100%)",
  "film":         "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
  "visual-arts":  "linear-gradient(135deg, #7c3aed 0%, #db2777 100%)",
  "fashion":      "linear-gradient(135deg, #111827 0%, #be123c 100%)",
  "food":         "linear-gradient(135deg, #7c2d12 0%, #c2410c 100%)",
  "literature":   "linear-gradient(135deg, #1e3a5f 0%, #0e7490 100%)",
  "design":       "linear-gradient(135deg, #064e3b 0%, #0d9488 100%)",
  "performance":  "linear-gradient(135deg, #4a1942 0%, #be185d 100%)",
  "community":    "linear-gradient(135deg, #14532d 0%, #15803d 100%)",
  "tech":         "linear-gradient(135deg, #172554 0%, #1d4ed8 100%)",
};

export function getCategoryGradient(categorySlug?: string | null): string {
  if (categorySlug) {
    const key = categorySlug.toLowerCase().trim();
    if (CATEGORY_GRADIENTS[key]) return CATEGORY_GRADIENTS[key];
  }
  return "linear-gradient(135deg, #1c1917 0%, #44403c 100%)";
}
