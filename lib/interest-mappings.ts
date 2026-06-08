export const INTERESTS = [
  { slug: "fashion-streetwear", label: "Fashion & Streetwear",      emoji: "👗" },
  { slug: "food-drink",         label: "Specialty Coffee & Dining", emoji: "☕" },
  { slug: "live-music",         label: "Live Music",                 emoji: "🎵" },
  { slug: "independent-film",   label: "Independent Film",           emoji: "🎬" },
  { slug: "art-architecture",   label: "Art & Architecture",         emoji: "🎨" },
  { slug: "literature",         label: "Literature & Poetry",        emoji: "📚" },
  { slug: "design-tech",        label: "Design & Creative Tech",     emoji: "💻" },
  { slug: "sport-wellness",     label: "Sport & Wellness",           emoji: "⚽" },
  { slug: "travel",             label: "Travel & Exploration",       emoji: "✈️" },
  { slug: "ideas",              label: "Ideas & Culture Theory",     emoji: "💡" },
  { slug: "music-production",   label: "Music Production",           emoji: "🎧" },
  { slug: "photography",        label: "Photography & Visual Art",   emoji: "📷" },
] as const;

export type InterestSlug = typeof INTERESTS[number]["slug"];

export const INTEREST_TO_TAGS: Record<string, string[]> = {
  "fashion-streetwear": ["Fashion", "fashion"],
  "food-drink":         ["Food", "food"],
  "live-music":         ["Music", "music"],
  "independent-film":   ["Film", "film"],
  "art-architecture":   ["Art", "art"],
  "literature":         ["Literature", "literature"],
  "design-tech":        ["Design", "Tech", "design", "tech"],
  "sport-wellness":     ["Sport", "sport"],
  "travel":             ["Travel", "travel"],
  "ideas":              ["Ideas", "ideas"],
  "music-production":   ["Music", "music"],
  "photography":        ["Art", "art", "design"],
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
