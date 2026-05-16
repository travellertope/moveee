// Matches #hashtag — must start with a letter, 2–50 chars, letters/digits/underscore.
export const HASHTAG_RE = /#([a-zA-Z][a-zA-Z0-9_]{1,49})/g;

/** Extract unique lowercase hashtag strings (without #) from arbitrary text. */
export function parseHashtags(text: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  let match: RegExpExecArray | null;
  const re = new RegExp(HASHTAG_RE.source, "g");
  while ((match = re.exec(text)) !== null) {
    const lower = match[1].toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      result.push(lower);
    }
  }
  return result;
}
