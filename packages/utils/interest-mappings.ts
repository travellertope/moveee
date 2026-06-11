export const INTERESTS = [
  { slug: "fashion-streetwear", label: "Fashion & Streetwear",    emoji: "👗" },
  { slug: "food-drink",         label: "Specialty Coffee & Dining", emoji: "☕" },
  { slug: "live-music",         label: "Live Music",               emoji: "🎵" },
  { slug: "music-production",   label: "Music Production",         emoji: "🎧" },
  { slug: "independent-film",   label: "Independent Film",         emoji: "🎬" },
  { slug: "visual-art",         label: "Visual Art",               emoji: "🎨" },
  { slug: "architecture",       label: "Architecture",             emoji: "🏛️" },
  { slug: "photography",        label: "Photography",              emoji: "📷" },
  { slug: "literature",         label: "Literature & Poetry",      emoji: "📚" },
  { slug: "visual-design",      label: "Visual Design",            emoji: "✏️" },
  { slug: "tech-culture",       label: "Tech & Digital Culture",   emoji: "💻" },
  { slug: "sport-wellness",     label: "Sport & Wellness",         emoji: "⚽" },
  { slug: "travel",             label: "Travel & Exploration",     emoji: "✈️" },
  { slug: "ideas",              label: "Ideas & Culture Theory",   emoji: "💡" },
  { slug: "street-food",        label: "Street Food & Markets",    emoji: "🍜" },
  { slug: "nightlife",          label: "Nightlife & Bars",         emoji: "🍸" },
] as const;

export type InterestSlug = typeof INTERESTS[number]["slug"];

export const INTEREST_TO_TAGS: Record<string, string[]> = {
  "fashion-streetwear": ["Fashion", "fashion"],
  "food-drink":         ["Food", "food"],
  "live-music":         ["Music", "music"],
  "music-production":   ["Music", "music"],
  "independent-film":   ["Film", "film"],
  "visual-art":         ["Art", "art"],
  "architecture":       ["Art", "art"],
  "photography":        ["Art", "art"],
  "literature":         ["Literature", "literature"],
  "visual-design":      ["Design", "design"],
  "tech-culture":       ["Tech", "tech"],
  "sport-wellness":     ["Sport", "sport"],
  "travel":             ["Travel", "travel"],
  "ideas":              ["Ideas", "ideas"],
  "street-food":        ["Food", "food"],
  "nightlife":          ["Food", "food"],
};

/** Given a user's interest slugs, return the flat set of tags they map to */
export function interestsToTagSet(interests: string[]): Set<string> {
  const tags = new Set<string>();
  for (const slug of interests) {
    for (const tag of INTEREST_TO_TAGS[slug] ?? []) {
      tags.add(tag.toLowerCase());
    }
  }
  return tags;
}
