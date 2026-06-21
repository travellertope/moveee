/** Regional newsletter segment codes. Mirrors apps/mobile/src/screens/member/MemberSettingsScreen.tsx deriveSegment(). */
export function deriveSegment(countryOfResidence?: string): string {
  const c = (countryOfResidence ?? "").toLowerCase().trim();
  if (!c) return "";
  if (/nigeria/.test(c)) return "ng";
  if (/ghana/.test(c)) return "gh";
  if (/united kingdom|\buk\b|\bgb\b/.test(c)) return "uk";
  if (/united states|\busa\b/.test(c)) return "us";
  if (/canada/.test(c)) return "ca";
  if (/australia/.test(c)) return "au";
  return "";
}
