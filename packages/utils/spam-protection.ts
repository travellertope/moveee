/**
 * Spam protection for the Moveee feed.
 *
 * Rate limiting uses an in-memory store keyed by user ID.
 * On a multi-instance deployment replace the Map with a shared Redis counter
 * (e.g. Upstash) — the interface and call sites don't need to change.
 *
 * Rules enforced:
 *   Posts   — 5 per 10 minutes, no duplicate within 30 minutes
 *   Comments — 10 per 10 minutes
 *   Both    — no bare URLs in content (Pro tier exempt if ALLOW_LINKS_FOR_PRO=true)
 *   Both    — phrase/keyword blocklist (hardcoded defaults + admin-configurable)
 */

const POST_LIMIT      = 5;
const COMMENT_LIMIT   = 10;
const WINDOW_MS       = 10 * 60 * 1000;   // 10 minutes
const DUPE_WINDOW_MS  = 30 * 60 * 1000;   // 30 minutes

// URL pattern: catches http(s)://, www., and common TLDs without a scheme.
const URL_PATTERN = /https?:\/\/[^\s]+|www\.[^\s]{3,}|\b[\w-]+\.(com|net|org|io|co|app|dev|ly|link|me|tv|gg)\b/i;

// ── Blocklist ──────────────────────────────────────────────────────────────

const DEFAULT_BLOCKLIST = [
  // Promotional spam
  "click here to win",
  "you have been selected",
  "limited time offer",
  "make money fast",
  "work from home opportunity",
  "earn $",
  "earn £",
  "wire transfer",
  "bitcoin investment",
  "crypto signal",
  "binary options",
  "whatsapp me",
  "dm me for",
  "inbox me",
  "check my bio",
  "link in bio",
  "buy followers",
  "buy likes",
  "increase your followers",
  "seo services",
  // Scam patterns
  "congratulations you won",
  "you are a winner",
  "send your details",
  "send me your",
  "urgent response needed",
  "verify your account",
  "your account has been",
];

// Settings fetched from WP admin — cached for 5 minutes.
interface ModerationSettings {
  phrases: string[];
  review_days: number;
}
let _settingsCache: ModerationSettings = { phrases: [], review_days: 7 };
let _settingsCachedAt = 0;
const BLOCKLIST_TTL_MS = 5 * 60 * 1000;

async function fetchModerationSettings(): Promise<ModerationSettings> {
  const now = Date.now();
  if (now - _settingsCachedAt < BLOCKLIST_TTL_MS) return _settingsCache;
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com"}/wp-json/culture/v1/community-blocklist`,
      {
        headers: { "X-Culture-API-Secret": process.env.CULTURE_API_SECRET ?? "" },
        cache: "no-store",
      }
    );
    if (res.ok) {
      const data = await res.json();
      _settingsCache = {
        phrases:     Array.isArray(data.phrases) ? (data.phrases as string[]) : [],
        review_days: typeof data.review_days === "number" ? data.review_days : 7,
      };
      _settingsCachedAt = now;
    }
  } catch {
    // Keep stale cache on network error
  }
  return _settingsCache;
}

export async function getReviewDays(): Promise<number> {
  const s = await fetchModerationSettings();
  return s.review_days;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findBlockedPhrase(text: string, phrases: string[]): boolean {
  const lower = text.toLowerCase();
  for (const phrase of phrases) {
    const p = phrase.trim().toLowerCase();
    if (!p) continue;
    if (p.includes(" ")) {
      // Multi-word: substring match
      if (lower.includes(p)) return true;
    } else {
      // Single word: whole-word match to avoid false positives
      if (new RegExp(`\\b${escapeRegex(p)}\\b`, "i").test(text)) return true;
    }
  }
  return false;
}

export async function checkBlocklist(text: string): Promise<SpamCheckResult> {
  const { phrases: custom } = await fetchModerationSettings();
  const all = [...DEFAULT_BLOCKLIST, ...custom];
  if (findBlockedPhrase(text, all)) {
    return {
      allowed: false,
      reason:  "Your post contains content that isn't allowed in this community.",
      status:  400,
    };
  }
  return { allowed: true };
}

// ── Rate limiting & duplicate detection ───────────────────────────────────

interface PostBucket {
  timestamps: number[];
  recentTexts: Array<{ text: string; at: number }>;
}

interface CommentBucket {
  timestamps: number[];
}

const postBuckets    = new Map<string, PostBucket>();
const commentBuckets = new Map<string, CommentBucket>();

function pruneTimestamps(arr: number[], windowMs: number): number[] {
  const cutoff = Date.now() - windowMs;
  return arr.filter((t) => t > cutoff);
}

export type SpamCheckResult =
  | { allowed: true }
  | { allowed: false; reason: string; status: number };

export function checkPostSpam(userId: string, text: string, tier: string): SpamCheckResult {
  // URL check — Pro members can post links; Citizens cannot.
  const allowLinks = tier === "patron" || process.env.ALLOW_LINKS_FOR_PRO === "false";
  if (!allowLinks && URL_PATTERN.test(text)) {
    return {
      allowed: false,
      reason:  "Links are not allowed in community posts. Share the title or topic instead.",
      status:  400,
    };
  }

  const now = Date.now();
  const bucket = postBuckets.get(userId) ?? { timestamps: [], recentTexts: [] };

  // Prune stale entries.
  bucket.timestamps  = pruneTimestamps(bucket.timestamps, WINDOW_MS);
  bucket.recentTexts = bucket.recentTexts.filter((r) => now - r.at < DUPE_WINDOW_MS);

  // Rate limit.
  if (bucket.timestamps.length >= POST_LIMIT) {
    return {
      allowed: false,
      reason:  `You can post up to ${POST_LIMIT} times every 10 minutes. Please wait a moment.`,
      status:  429,
    };
  }

  // Duplicate detection (case-insensitive, normalised whitespace).
  const normalised = text.replace(/\s+/g, " ").trim().toLowerCase();
  const isDupe = bucket.recentTexts.some(
    (r) => r.text.replace(/\s+/g, " ").trim().toLowerCase() === normalised
  );
  if (isDupe) {
    return {
      allowed: false,
      reason:  "You already posted this recently. Please share something new.",
      status:  409,
    };
  }

  // Record and persist.
  bucket.timestamps.push(now);
  bucket.recentTexts.push({ text, at: now });
  postBuckets.set(userId, bucket);

  return { allowed: true };
}

export function checkCommentSpam(userId: string, text: string, tier: string): SpamCheckResult {
  const allowLinks = tier === "patron" || process.env.ALLOW_LINKS_FOR_PRO === "false";
  if (!allowLinks && URL_PATTERN.test(text)) {
    return {
      allowed: false,
      reason:  "Links are not allowed in comments.",
      status:  400,
    };
  }

  const now    = Date.now();
  const bucket = commentBuckets.get(userId) ?? { timestamps: [] };
  bucket.timestamps = pruneTimestamps(bucket.timestamps, WINDOW_MS);

  if (bucket.timestamps.length >= COMMENT_LIMIT) {
    return {
      allowed: false,
      reason:  `You can comment up to ${COMMENT_LIMIT} times every 10 minutes. Please slow down.`,
      status:  429,
    };
  }

  bucket.timestamps.push(now);
  commentBuckets.set(userId, bucket);

  return { allowed: true };
}
