// Hub categories — mirrors Culture_Hubs::categories() (and its
// SECTION_HUB_SLUGS keys) on the PHP side exactly: the same 11 names
// already used everywhere else as "Section" (the composer's Section
// picker, official Hubs, etc.), reused here rather than inventing a
// second, diverging list. Keep in sync with the PHP array and with
// apps/mobile's equivalent (src/utils/hubCategories.ts).
export const HUB_CATEGORIES = [
  "Music", "Fashion", "Art", "Film", "Food",
  "Sport", "Travel", "Ideas", "Literature", "Design", "Tech",
];
