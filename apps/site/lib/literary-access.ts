import crypto from "crypto";

/**
 * The Moveee Literary — metered soft-paywall + email/OTP verification.
 *
 * Mirrors Culture_Literary_Access (culture-community/includes/core/
 * class-culture-literary-access.php) on the WordPress side: a verification
 * token is base64url(email|access|expiry) + "." + hmac_sha256(...). Verified
 * locally here with CULTURE_API_SECRET (the same secret already used for the
 * Bearer-auth REST surface, and the same `culture_api_secret` WP option that
 * signs the token) rather than round-tripping to WordPress on every article
 * page load.
 */

// "lit" (Moveee Lit — full access to The Moveee Literary only, see
// CLAUDE.md's "Three-tier membership" section) is distinct from "pro"
// (Moveee Pro) — a Lit-tier verification must never be mistaken for a Pro
// one by any Magazine-side check, which is why every such check compares
// strictly against "pro", never against this whole union.
export type LiteraryAccess = "free" | "lit" | "pro";

export interface LiteraryVerification {
  email: string;
  access: LiteraryAccess;
  expires: number;
}

function base64UrlDecode(input: string): string {
  const padded = input + "=".repeat((4 - (input.length % 4)) % 4);
  return Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

/** Verifies a token issued by Culture_Literary_Access::make_token(). */
export function verifyLiteraryToken(token: string | undefined | null): LiteraryVerification | null {
  const secret = process.env.CULTURE_API_SECRET;
  if (!token || !secret) return null;

  const dotIndex = token.indexOf(".");
  if (dotIndex < 0) return null;
  const encoded = token.slice(0, dotIndex);
  const sig = token.slice(dotIndex + 1);

  const expectedSig = crypto.createHmac("sha256", secret).update(encoded).digest("hex");
  const sigBuf = Buffer.from(sig, "utf8");
  const expectedBuf = Buffer.from(expectedSig, "utf8");
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  let payload: string;
  try {
    payload = base64UrlDecode(encoded);
  } catch {
    return null;
  }

  const parts = payload.split("|");
  if (parts.length !== 3) return null;
  const [email, access, expiresStr] = parts;
  const expires = parseInt(expiresStr, 10);
  if (
    !email ||
    (access !== "free" && access !== "lit" && access !== "pro") ||
    !Number.isFinite(expires)
  )
    return null;
  if (Date.now() / 1000 > expires) return null;

  return { email, access: access as LiteraryAccess, expires };
}

/** Free anonymous reads allowed per rolling 30-day window before the gate becomes blocking. */
export const LITERARY_FREE_READ_LIMIT = 3;
export const LITERARY_READ_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
export const LITERARY_READS_COOKIE = "moveee_lit_reads";
export const LITERARY_TOKEN_COOKIE = "moveee_lit_token";

interface ReadEntry {
  slug: string;
  ts: number;
}

/** Parses the moveee_lit_reads cookie, pruning entries outside the window. */
export function parseReadsCookie(raw: string | undefined | null): ReadEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const cutoff = Date.now() - LITERARY_READ_WINDOW_MS;
    return parsed.filter(
      (e): e is ReadEntry => e && typeof e.slug === "string" && typeof e.ts === "number" && e.ts > cutoff
    );
  } catch {
    return [];
  }
}

/** Known search-engine / social-preview crawlers — always get full content, never metered. */
const BOT_UA_RE =
  /bot|crawl|spider|slurp|googlebot|bingbot|facebookexternalhit|whatsapp|twitterbot|slackbot|discordbot|linkedinbot|applebot|pinterest|redditbot|ia_archiver|embedly|quora link preview|w3c_validator/i;

export function isCrawlerUserAgent(userAgent: string | undefined | null): boolean {
  return !!userAgent && BOT_UA_RE.test(userAgent);
}

interface Block {
  html: string;
  textLength: number;
}

const BLOCK_RE = /<(p|h[1-6]|blockquote|figure|ul|ol|table|div)\b[^>]*>[\s\S]*?<\/\1>/gi;

function splitIntoBlocks(html: string): Block[] {
  const matches = html.match(BLOCK_RE);
  if (!matches || matches.length < 2) {
    return [{ html, textLength: html.replace(/<[^>]+>/g, " ").trim().length }];
  }
  return matches.map((block) => ({
    html: block,
    textLength: block.replace(/<[^>]+>/g, " ").trim().length,
  }));
}

export interface TruncatedContent {
  visibleHtml: string;
  remainderHtml: string;
  hasMore: boolean;
}

/**
 * Splits sanitized article HTML at roughly `percent` of its plain-text
 * length, on a block boundary (never mid-paragraph). Degrades to "show
 * everything" when the content is too short/flat to split sensibly (a
 * single block) rather than gating something that can't be meaningfully
 * partial.
 */
export function truncateHtmlByPercent(html: string, percent: number): TruncatedContent {
  const blocks = splitIntoBlocks(html);
  const total = blocks.reduce((sum, b) => sum + b.textLength, 0);

  if (blocks.length < 2 || total === 0) {
    return { visibleHtml: html, remainderHtml: "", hasMore: false };
  }

  const target = total * percent;
  let running = 0;
  let cutIndex = blocks.length - 1;
  for (let i = 0; i < blocks.length; i++) {
    running += blocks[i].textLength;
    if (running >= target) {
      cutIndex = i;
      break;
    }
  }
  // Never gate on nothing, and never gate away the whole piece.
  if (cutIndex >= blocks.length - 1) {
    return { visibleHtml: html, remainderHtml: "", hasMore: false };
  }

  return {
    visibleHtml: blocks
      .slice(0, cutIndex + 1)
      .map((b) => b.html)
      .join(""),
    remainderHtml: blocks
      .slice(cutIndex + 1)
      .map((b) => b.html)
      .join(""),
    hasMore: true,
  };
}
