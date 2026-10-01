# CLAUDE.md archive — historical visual-rebuild passes and resolved build-fix sagas

This file is NOT auto-loaded by Claude Code. It holds sections moved out of `CLAUDE.md`
because they were closed-out, superseded, or purely historical narrative that was bloating
the auto-loaded instructions file past a usable context budget. Read it manually if you need
the full detail behind one of the one-line pointers left in `CLAUDE.md`.

---

### Shop archive + product detail — full visual rebuild (Site A, August 2026)

Mockup-first as usual (two Artifacts, approved before building: `shop-redesign-mockup.html`
then `shop-product-detail-mockup.html`, both continuing the same product photo actually used
on both pages — Studio Fern's "Terracotta Vessel No. 4" — as the running example) — this
brought both `/shop` and `/shop/[slug]` onto the site-wide `--radius-xl`/`--radius-2xl`/
`--shadow-card` card convention (see "Border-radius convention" above). The archive page was
already fairly close to that system going in (product/maker cards already used rounded
corners and `--shadow-card`-style shadows); the product detail page was not — it still had
the old flush, zero-radius, hairline-rule "editorial" aesthetic across its gallery, maker
story image, process-step squares, vendor visual, and related-product thumbnails.

**Archive (`ShopArchiveWrapper.tsx` + `shop.css`)**:
- **Masthead → compact head** (`.sl-masthead` → `.sl-head`) — dropped the big centered
  serif title block for a slim left-aligned eyebrow ("The Shop") + h1 + one-line description,
  same move as the earlier `/magazine` archive rebuild.
- **"Editorial Picks" 2×2 sub-grid → hero pick + 3-across "More From The Edit" row**
  (`.sl-picks-grid`/`.sl-pick-sub-grid`/`.sl-pick-card` deleted, replaced by `.sl-hero-grid`
  + `.sl-week-row`/`.sl-week-card`) — one large `--radius-2xl`/`--shadow-lift` framed hero
  image with an "Editor's Pick" eyebrow, vendor name, title, short description (from the
  already-fetched `shortDescription` field, HTML-stripped), price + 10%-off Pro price, and a
  pill CTA, plus 3 compact companion cards below. `heroPick`/`companionPicks` derived from
  `products.slice(0, 4)` in the wrapper (was `products.slice(0, 5)` feeding a 1-hero+4-small
  layout before).
- **Trust strip (4-item grid with descriptions) + scrolling ticker marquee → one slim single
  line** (`.sl-trust`) — the ticker repeated the same 4 claims already in the trust strip, so
  it was dropped from this page's JSX entirely (the shared `.ticker-wrap`/`.ticker-track` CSS
  in `globals.css` is untouched — still used by `/journeys`, `/events`, and `ShopArchiveWrapper`
  no longer imports it, but other pages still do).
- **Two separate flush `.sl-bridge` sections (Magazine, then Origins, on either side of the
  product grid) → one merged slim tinted band** with both CTAs side by side
  (`.sl-bridge-left`/`.sl-bridge-links`), positioned once between the filter bar and the grid.
- **Member band (Moveee Pro) → rounded dark card with a radial gold glow**, inset inside a
  padded `.sl-member-wrap` wrapper instead of a flush full-bleed two-column strip — matches
  the homepage/magazine CTA-band visual language. The right-side stat block also changed from
  its own purple/ochre gradient panel + dot pattern to a simple bordered translucent card
  floating on the shared dark gradient (`.sl-member-stat`, white text).
  Category-grid tiles and maker cards got the same `--radius-xl` + persistent `--shadow-card`
  treatment (previously `--shadow-card` on maker cards only appeared on hover); the closing
  Origins-journal image bumped from an 8px-radius flush rectangle to `--radius-2xl` +
  `--shadow-lift`.

**Product detail (`page.tsx` + its 5 subcomponents + `shop.css`)** — this page needed the
bigger lift, since it still had the pre-radius-convention flush aesthetic everywhere:
- **Gallery** (`ProductGallery.tsx`, JSX untouched) — main image bumped to `--radius-2xl` +
  `--shadow-lift`; thumbnails bumped to 8px radius with an `outline` (not `border`) for the
  active/hover ring, since outline doesn't affect box size the way changing border-width would.
- **Buy box** (`ProductSelectors.tsx`) — price row/selector labels restyled onto the mono-pill
  language already established on the archive page; the color swatch and size-chip selectors
  (`.sp-swatches`/`.sp-sizes`) changed from square/rectangular to `--radius-full` pills; the
  Add to Cart button became a full pill (`.sp-btn-add`, ochre hover, matches every other
  primary CTA on the site) instead of a flush rectangle; delivery/returns info moved from a
  flat two-column grey box to a simple icon+text note list (`.sp-buy-notes`). **New: a
  quantity stepper** (`.sp-qty`, local `quantity` state) was added ahead of the Add to Cart
  button — previously there was no way to buy more than 1 unit from this page at all;
  `useCart()`'s `addItem(productId, quantity)` already supported a quantity param, it just
  wasn't wired up here.
- **New: mobile sticky buy bar** (`.sp-mobile-bar`, rendered unconditionally in
  `ProductSelectors.tsx` but `display: none` until the `max-width: 640px` media query flips it
  to `display: flex; position: fixed; bottom: 0`) — mirrors price (or the Pro member price)
  + an Add to Cart / "Get early access" button, staying pinned while the rest of the page
  scrolls underneath. The in-flow `.sp-qty`/`.sp-cta-row` are hidden on that same breakpoint so
  there's exactly one buy control visible at a time, not two competing ones.
- **Accordion** (`ProductAccordion.tsx`) — header label switched from uppercase JetBrains Mono
  to a plain serif title (matches the mockup), and the expand indicator switched from a static
  "+" that rotates 45° into an "×" to literally swapping the character between "+"/"−" based on
  `isOpen` — simpler and clearer than the rotation trick.
- **"As Seen In"** (`page.tsx`) — was a large dark full-bleed 3-column box (60px padding, a
  38px serif title, a radial-gradient decoration) that only ever fires when a magazine feature
  post is actually linked; rebuilt into the same slim tinted single-line bridge pattern as the
  archive page's `.sl-bridge` (`.sp-seen`/`.sp-seen-inner`/`.sp-seen-left`/`.sp-seen-cta`).
- **Maker Story** — dropped the giant italic "01" section-numeral + 3-column header grid for a
  compact eyebrow ("Origins Journal") + heading + subhead, matching the archive/process
  sections' header language; the portrait image bumped from a flush square to `--radius-2xl` +
  `--shadow-lift` (asymmetric 4:5 framing). The rich-text `makerStory` body's existing drop-cap
  first-letter and pull-quote (`blockquote`) treatment was kept as-is — still a nice touch,
  unrelated to the header simplification.
- **Process ("How It's Made")** — rebuilt from oversized flush black squares with a huge
  italic gold number overlaid on each (there's no per-step image data in `processSteps` at all,
  so those squares were always just decorative) into plain white `--radius-lg`/`--shadow-card`
  cards with a small mono "01"–"04" tag, heading, description, and duration — **the numbering
  is kept and is legitimate here**, since this is a real ordered production sequence (clay prep
  → coiling → firing → finishing), unlike a decorative numbered-step pattern elsewhere that
  wouldn't carry real information.
- **Vendor profile** — was a 2-column layout (flush square image, giant serif heading, a
  3-stat row boxed in hairline top/bottom rules, separate outline/filled buttons) sitting loose
  on the page; rebuilt as **one wide rounded card** (`.sp-vendor-card`, `--radius-2xl` +
  `--shadow-lift`, `overflow: hidden`) with the image as the card's own left half and a white
  body on the right — stats and CTAs now sit inside the same card rather than floating below it.
- **Reviews** (`ProductReviews.tsx`, the biggest functional change) — was a narrow 720px
  centered column with a plain average+count line, a flat list of reviews with no card chrome,
  and an always-visible review form pinned to the bottom. Rebuilt into a full-width tinted
  section (matches the archive page's tinted bands) containing: a summary card
  (`.sp-reviews-summary`) with the average/stars/count on the left and a **real 5-star
  distribution bar chart on the right** — computed client-side via a `useMemo` over the
  already-fetched `reviews` array (`Math.round(r.rating)` bucketed into 5 counts, no new
  backend endpoint needed, since individual review ratings were already being fetched, just
  never aggregated into a breakdown before); a **"Write a review" button that toggles the form
  open/closed** (`formOpen` state) instead of the form always rendering at the bottom, whether
  or not anyone was going to use it; and a 3-across grid of white `--shadow-card` review cards
  (avatar — real image or a deterministic color-hashed initial circle when none is set — name,
  relative "time ago" date computed from the raw ISO date, star rating, review text) replacing
  the old flat bordered-row list. Login-gating and the post-submit success state are unchanged.
- **More From This Category** (`page.tsx` + `.mini-product`) — product thumbnails were flush
  squares with plain text below, no card boundary at all; wrapped in the same `--radius-xl`/
  `--shadow-card` mini-card treatment as everywhere else on the site, with a new
  `.mini-product-body` div for the padded vendor/name/price text block.
- **Byproduct bug fix**: `.sp-story-header h3`/`.sp-process-header h3`/`.sp-vendor-profile h3`/
  `.sp-more-from-header h3` were the CSS selectors for those section headings, but the actual
  JSX in `page.tsx` has always rendered them as `<h2>` — a pre-existing mismatch, so none of
  that intended heading styling was ever actually applying. Fixed as part of rewriting each of
  these sections (new CSS now targets `h2`, matching the real markup). **If a heading anywhere
  on this page still looks like unstyled browser-default text, check for this same tag/selector
  mismatch before assuming the CSS is missing.**
- *(Not verified live this pass.)*

**Follow-up fixes (same pass, August 2026):**
- **Filter bar controls were never actually restyled** — the summary above claimed the pills
  matched the mockup's pill language, but `.sl-fpill`/`.sl-sort-select`/`.sl-view-toggle` were
  still the pre-rebuild DM-Sans boxed style (13px, `border-radius: 6px` on sort/view-toggle,
  no uppercase). Fixed to match `.sl-hero-kicker`/bridge-label treatment exactly: JetBrains
  Mono, 10.5px, 700 weight, `.06em` letter-spacing, uppercase, `border-radius: 100px`.
  "In Stock Only" filled state changed from ochre to ink (matches the mockup's `--radius-full`
  filled-pill convention used elsewhere). `.sl-view-toggle` is now one pill-shaped container
  with the active button filling ink, not two separately bordered squares.
- **Compact head**: dropped the "The Shop" eyebrow entirely (kept the CSS rule, unused, per
  this file's usual "leave dead CSS in case needed again" convention) and reworded the title
  to "*Lifestyle* Shop". `.sl-head-desc` widened from `max-width: 440px` to `560px` so the
  description wraps to 2 lines instead of 3.
- **Editor's Pick curation (was purely positional)** — `heroPick`/`companionPicks` used to be
  nothing more than `products.slice(0, 4)`, i.e. whichever products WPGraphQL happened to
  return first (`GET_PRODUCTS` has no `orderby`) — not a real editorial choice. Wired up
  WooCommerce's native "Featured" flag instead:
  - `moveee-graphql-bridge.php` — new `featured: Boolean` field registered on the same
    `$product_types` loop as `averageRating`/`reviewCount`/`productMaterials`, resolved via
    `wc_get_product($pid)->is_featured()` (the standard WooCommerce API, reflects the
    Products → Catalog visibility → **Featured** checkbox in WP Admin).
  - Per the established bridge-plugin-isolation rule (see `GET_PRODUCTS_EXTRA`'s own comment),
    `featured` was added to `GET_PRODUCTS_EXTRA`/`GET_PRODUCTS_BY_VENDOR_EXTRA` — **not** the
    main `PRODUCT_FIELDS_FRAGMENT`/`GET_PRODUCTS` — so a bridge-plugin outage still degrades to
    "no featured flag" rather than breaking the whole grid.
  - `ShopArchiveWrapper.tsx`: `heroPick`/`companionPicks` now come from
    `products.filter(p => p.featured)`, falling back to the original `products.slice(0, 4)`
    positional behavior when nothing is marked Featured yet (so the section never goes empty
    on a store that hasn't been curated). To set the Editor's Pick, mark a product Featured in
    WP Admin — the first Featured product (in catalog order) becomes the hero, the next 3
    become "More From The Edit".
  - **Same fix applied to the product detail page's "More From This Category"**
    (`page.tsx`'s `relatedProducts`) — this had the identical bug (`GET_PRODUCTS` with no
    `orderby`, first 4 after excluding the current product). Now fetches an 8-product pool per
    category via `GET_PRODUCTS` + `GET_PRODUCTS_EXTRA` in parallel (the latter wrapped in its
    own `.catch(() => null)` so a bridge-plugin failure only drops the featured signal, not the
    whole related-products fetch), merges `featured` by `databaseId`, and prefers
    Featured-within-category products before falling back to positional order. The rest of the
    page's sections (As Seen In, Maker Story, Process, Vendor Profile, Reviews) were already
    backed by real editorial fields or genuine per-product data — not positional luck — so they
    didn't need this treatment.
- **Search box missing its icon (user-reported, same session)** — `shop-redesign-mockup.html`'s
  `.sh-search` is a wrapper div (`position: relative`) holding both a `.sh-search-icon` span
  (absolutely positioned into a left-padding gap reserved on the input) and the `<input>` itself
  — and `shop.css`'s `.sl-search`/`.sl-search input`/`.sl-search-icon` rules already matched that
  shape exactly (`padding: 0 16px 0 34px` on the input, reserving the 34px for the icon). But
  `ShopFilterBar.tsx`'s JSX put `className="sl-search"` directly on the `<input>` itself and
  never rendered an `.sl-search-icon` span at all — so the CSS's reserved icon gap just sat empty,
  making the input look unstyled/oddly indented. Fixed by wrapping the input in a
  `<div className="sl-search">` with a `<span className="sl-search-icon">⚲</span>` sibling,
  matching what the CSS was already built for. **If a mockup-matched CSS block looks unstyled
  in the browser, check whether the JSX actually has the wrapper/child structure the CSS
  assumes** — the CSS itself was correct here, only the markup was missing a piece of it.

---

### Cross-page mockup-fidelity audit + fixes (August 2026)

Triggered directly by the homepage incident above: once it was clear that a "rebuilt from
mockup" claim could be wrong, the user asked to check every other page for the same gap. The
first audit pass compared pages against the **wrong** mockups — the old, already-superseded
`mockups/web/*.html` repo files — instead of the actual Artifact mockups built and approved
*in this same chat session*, which live only in the ephemeral scratchpad
(`account-dashboard-mockup.html`, `wallet-coupons-perks-mockup.html`, `settings-mockup.html`,
`notifications-analytics-mockup.html`, `events-referrals-mockup.html`,
`portfolio-collection-mockup.html`, `events-redesign-mockup.html`, `games-mockup.html`,
`discover-mockup.html`, `people-near-me-mockup.html`, `stoop-mockup.html`, `auth-mockup.html`).
**Lesson: when auditing a page against "the mockup," always check the session's own scratchpad
first for a newer Artifact before falling back to the committed `mockups/web/` archive** — a
page can have been rebuilt more than once, and the repo file is not automatically the latest
source of truth.

Re-run against the correct files, real mismatches were found and fixed:

- **Culture Games** (`apps/connect/app/games.css`, `GamesHubClient.tsx`) — non-done badge
  colors were the same dark value as the card's accent color instead of the mockup's lighter/
  desaturated tint (Trivia `#7a9450`, Crossword `#a06a3a` — `badgeBg` was already correct, only
  `badgeColor` was wrong); the "2/4" progress count was forced into Fraunces serif when the
  mockup has no font-family override (inherits sans). **Not changed**: the hub title's 22px/700
  plain-sans size — that's the user's own explicit fix from earlier in this session
  (superseding the mockup's big serif hero treatment), not a bug to revert.
- **Events** (`apps/connect/app/events.css`, `SearchModal.tsx`) — `.evt-row-title` had no
  `font-family`, so it silently inherited sans instead of the intended serif (its sibling date
  labels were already correctly serif); `.evt-day-rows` had a left-rail/indent treatment with no
  mockup equivalent, replaced with flat `border-bottom`-separated rows; right-rail cards
  (`.evt-sb-block`/`.evt-literati-teaser`) used shadow-with-no-border instead of the mockup's
  border-with-no-shadow; the Event content-type chip and the new City/Price/Format filter groups
  in `SearchModal` had no "locked"/"New" badge treatment (`.sm-chip.active.locked`,
  `.sm-new-badge` added).
- **Discover** (`apps/connect/app/discover.css`, `DiscoverBrowser.tsx`) — the entire hero section
  (eyebrow/big-serif-title/subhead) had never been built, only a flat 22px "Discover" title
  existed; rebuilt inside the existing `.disc-wrap` container (not full-bleed edge-to-edge like
  the mockup, and without its decorative photo collage — both a deliberate scope reduction, see
  the code comment at the JSX call site). **Copy fix while doing this**: the mockup's subhead
  read "...living archive of African & diaspora culture..." — rewritten to plain "culture" per
  this repo's own brand-language rule (public copy stays universal, see that section above).
  Also fixed: "Recently Added"/"Trending in Community" rails were in swapped order; section
  headings were 16px sans instead of 24px Georgia serif + an ochre "✦" spark icon; rail cards
  were 180×230/10px padding/14.5px title instead of the mockup's 230×290/14px/19px; star ratings
  rendered plain white instead of the mockup's gold (`#ffd77a`).
- **Stoop** (`StoopBrowser.tsx`, `stoop.css`, `ClusterElection.tsx`, `ClusterCheckin.tsx`) — the
  "Your Stoop" member hero rendered only one plain-text link ("View Stoop →") where the mockup
  wants two real actions (ghost "View Members" + primary "Open Check-in QR →"); `.ys-btn-primary`
  existed in CSS but was never referenced anywhere in the JSX. Restructured so the name/details
  block is its own `Link` and `.ys-actions` holds two real `Link` buttons (the QR one points at
  `#checkin`, a new `id="checkin"` added to `ClusterCheckin.tsx`'s wrapper). Host Election's
  empty state now names the current host (`ClusterElection.tsx` gained a `hostName` prop, threaded
  from `cluster/[id]/page.tsx`) — the mockup also wanted an election date, which isn't tracked
  anywhere in the backend, so that part was deliberately left out rather than fabricated. Also
  added the missing "(exact address shown to members only)" note to the member hero.
- **Auth Flow** (`apps/connect/app/auth.css`, `login/page.tsx`, `register/page.tsx`,
  `register/complete/page.tsx`) — removed two leftover inline styles (`marginTop` hack →
  `.auth-btn-secondary + .auth-btn-secondary` sibling-spacing rule; the Google "G" glyph's raw
  style object → `.auth-google-glyph` class); the membership tier-card's radio selector was
  visually invisible (native input hidden for custom styling, but no replacement indicator was
  ever added) — added a real ring/dot `.auth-tier-radio`; `.auth-divider-label`/`.auth-tier-label`
  were missing the mockup's monospace font; the Pro-upsell footer line on `/register` was the same
  size as the primary "Sign in" line instead of subordinate (`.auth-footer-sub`, 12px).
  **Deliberately not changed** (larger, lower-priority redesigns, not simple property fixes):
  the interest-picker chips are a 3-column grid with 2px borders where the mockup wants a
  single-row pill list — a real layout difference, not just wrong tokens; and
  `register/complete`'s step indicator is a custom circle-stepper rather than the mockup's
  3-dot/eyebrow design — both work correctly today and would need a genuine rebuild, not a
  property tweak, so they're flagged here rather than done in this pass.
- **Account Dashboard Phase 2 (Wallet/Coupons/Perks)** — a real regression, not just a visual
  miss: `wallet/page.tsx` and `coupons/page.tsx` were repurposing the `.acct-name` slot (meant
  for the user's own display name, shown on every other account page) to render the page title
  ("Wallet"/"My Coupons") instead — so a visitor's actual name silently disappeared on exactly
  these two pages. Fixed by restoring `.acct-name` to `{displayName}` and adding the
  `.acct-page-head`/`.acct-page-eyebrow`/`.acct-page-title`/`.acct-page-sub` block the mockup
  always specified for the actual page title (CSS for these already existed, unused, in
  `member.css`). Also fixed: the Wallet History/Cash Out tab switcher was reusing `.prf-tab`
  (tiny uppercase mono caption styling) instead of a dedicated `.wal-tab` (larger semibold sans,
  now added); the Coupons active-card dropped the partner/venue name entirely (showed a
  cost/date meta line instead) — fixed by adding `perk_partner_name` to the
  `GET /culture/v1/user/redemptions` PHP response (resolves `partner_directory_id` →
  `get_the_title()`) and rendering it in the mockup's field order (badge → QR → title → partner
  → expiry); the Perks page wrapped `AccountNav` in a hand-duplicated inline style instead of the
  shared `.acct-wrap` class (didn't even import `member.css`) — fixed to match Wallet/Coupons/
  Overview.
- **Account Dashboard Phase 6 (Portfolio)** — confirmed via two independent audits: the
  add/edit `ItemForm` inside `PortfolioManager.tsx` still rendered with the old
  `.mem-field-list`/`.mem-field-label`/`.mem-input`/`.mem-field-btn` classes and a raw inline
  `style={{}}` on its submit button, even though a full set of `.pf-form`/`.pf-field`/`.pf-label`/
  `.pf-input`/`.pf-submit-btn` rules already existed in `member.css`, unused — the CSS had been
  written for this exact form and never wired in. Fixed; added a new `.pf-cancel-btn` (the
  mockup's form has no Cancel button at all, so this one was authored fresh, matching the
  existing `.pf-submit-btn`'s visual language).
- **Confirmed already correct, no changes needed**: Account Dashboard Phases 1, 3, 4, 5
  (Overview, Settings, Notifications/Analytics, My Events/Referrals), Directory Entry Detail,
  Member Directory/People Near Me. Two "mismatches" from the first (wrong-mockup) audit pass
  turned out to be non-issues once re-checked against the right file: Discover's photo-card/
  scrim treatment and masonry Explore-More grid are exactly what the correct mockup specifies,
  not a deviation from it.
- *(Not verified live this pass.)*

---

### Culture Games — visual rebuild (§8, June 2026)

`mockups/web/moveee_culture_games.html` (5 frames: Games Hub, Trivia In Progress, Trivia
Answer Revealed, Shared Game Done Screen for Quiz & Puzzle States, Mobile Companion)
diffed directly against the live components — `packages/shared/components/games/`
(`GameCard.tsx`, `GameDoneScreen.tsx`, `TriviaGame.tsx`, `WhoSaidItGame.tsx`) and
`apps/connect/app/games.css`. Game logic/backend (Trivia, Who Said It?, Sudoku,
Crossword) was already fully functional going in — this was a visual-only pass, same
methodology as every other §-rebuild in this file.

- **`GameCard.tsx`** (Games Hub cards): wrapped the meta row + CTA in a new
  `.game-card__footer` div so they sit on one row per the mockup, and added
  `borderColor: badgeColor` to the difficulty badge's inline style (was missing an
  outline, just a filled pill).
- **`GameDoneScreen.tsx`** (shared end screen for all 4 games, Frame 4): added a
  `GAME_TAG_MODIFIER` lookup (`gds-game-tag--trivia/wsi/sudoku/crossword`) so each
  game's header pill gets its own brand color instead of one flat style; the
  dot-separator + "Already played today" badge in the meta row is now gated on
  `!isPuzzle` (quiz games only) — the mockup's puzzle-state variant (Sudoku/Crossword)
  shows date-only with no badge, since puzzles have no daily-replay-block concept; share
  button + subscribe form + nav actions are now wrapped in one `.gds-actions-zone`
  container (matching the mockup's single 32px-padded/24px-gap "Actions Zone" block,
  previously three separately-spaced siblings); the share button now toggles a real
  `gds-share-btn--copied` modifier class on copy-success (was text-only before, so the
  mockup's green success-state pill styling was unreachable); removed the redundant
  "✓ " text prefix from the subscribe-success message since `.gds-sub-success` now
  renders the checkmark as a CSS `::before` pseudo-element circle instead.
- **`games.css`**: split `.gds-game-tag` into a base class + 4 color modifiers
  (Trivia → `var(--moss)`, Who Said It → `var(--ochre)`, Sudoku →
  `var(--game-sudoku, #1a3a5c)`, Crossword → `var(--game-crossword, #5c3a1a)` — the last
  two are fallback literals since no `--game-sudoku`/`--game-crossword` CSS variables
  exist in `globals.css`, following the project's standard `var(--token, #fallback)`
  convention). Also fixed a duplicate, non-adjacent `.gds-sub-success` selector
  (layout/background props and typography props had been split across two separate rule
  blocks with the `::before` pseudo-element sandwiched between them) by merging into one
  consolidated rule. Rebuilt the games-hub layout, game-page nav, Trivia progress
  pips/option states, and the full `.gds-*` Game Done Screen block to match the mockup's
  spacing/radius/color values (`--radius-xl`/`--radius-full`, `--shadow-card`,
  `--success`/`--error` for the subscribe success/error states — same semantic-color
  convention used in the Wallet/Perks/Overlays passes elsewhere in this file).
- **`TriviaGame.tsx`**: CSS-only — its JSX already matched the mockup's question/option/
  explanation structure; only `games.css` rules needed updating.
- **Deliberate deviation — Who Said It? reuses the Trivia design system.** The mockup has
  no dedicated "Who Said It?" gameplay frame (Frames 2/3 are both Trivia). `WhoSaidItGame.tsx`
  required no JSX changes; its quote-card/option/feedback states were mapped onto the same
  CSS classes and visual language already built for Trivia's progress bar, option states, and
  feedback callouts, rather than inventing a separate, unspecified design.
- **Confirmed dead, left untouched**: `.game-result*` CSS block has zero references in any
  `.tsx`/`.ts` file (grepped across the repo) — not part of this rebuild, not removed either,
  consistent with this file's general practice of only removing dead code when it's
  specifically in scope or flagged by the user.
- **Deferred, no mockup ground truth**: light-touch rounding/hover polish on
  `.sudoku-numpad-btn`/`.cw-btn` chrome and in-board cell-state coloring
  (`.sudoku-cell--*`/`.cw-cell--*`) were not addressed in this pass — the mockup has no
  Sudoku/Crossword gameplay frame, only the shared Game Done Screen's puzzle-state variant.
- *(Not verified live this pass.)*

---

### Member Dashboard — visual rebuild (§9, June 2026)

`apps/connect/app/member/page.tsx` + `MemberDashboard.tsx`/`MemberBadges.tsx`/
`PasskeyBanner.tsx` (`packages/shared/components/`) + `apps/connect/app/member.css`
rebuilt against `mockups/web/moveee_dashboard_web.html`:

- **Full-bleed band pattern** (new structural pattern, reusable for future sections):
  the mockup's hero, passkey banner, and stats row are each page-width sections with
  their own background color, while their *content* is horizontally centered at
  `max-width: 1200px`. Previously only the hero followed this — the passkey banner and
  stats row were nested inside `.mem-body`'s `max-width:1200px` wrapper, so they looked
  like cards instead of full-width bands. Fixed by moving `<PasskeyBanner>` and
  `<MemberDashboard>` out of `.mem-body` in `page.tsx`, and adding a `.mem-stats-band`
  wrapper (full width, own background/border) around the existing `.mem-stats` grid
  (which itself became the `max-width:1200px` centered inner element). **If a future
  section's mockup shows a full-width tinted strip, check for this same pattern** — don't
  assume every section lives inside the body's centered container.
- `.mem-hero` switched from a dark `ink` background with light text to a white/paper
  background with ink text (mockup uses light hero, not dark) — avatar enlarged to 96px
  with a gold ring border; tier badge switched to a full pill (`border-radius: 999px`,
  was 2px).
- `PasskeyBanner.tsx` rewritten from a small inline-styled rounded box to a full-width
  dark `ink`-background bar (className-based, matching the rest of the redesigned
  components' convention) with a white pill CTA button — also fixed a copy-priority bug
  where the "credits waiting" message never became the bold title even when
  `creditsEscrowed > 0`.
- `.mem-stats` grid: `repeat(4,1fr)` → `repeat(5,1fr)` (5 stats were already rendered by
  the component; only the CSS column count was stale). `.mem-tooltip` flipped from
  appearing above the stat to below it (`top: calc(100% + 12px)`, arrow flipped to point
  up), matching the mockup.
- `.mem-badges-grid`: `repeat(4,1fr)` → `repeat(2,1fr)`; `.mem-badge` restructured from a
  centered icon-over-text column to a left-aligned row card with a 40px circular icon
  swatch — required a matching JSX change in `MemberBadges.tsx` (wrapped name/desc in a
  new `.mem-badge-text` div) since the row layout needs name+desc stacked beside the icon,
  not below it.
- Responsive breakpoints updated to match the new 5-stat/2-badge-column base (the
  `max-width: 1024px`/`640px` overrides previously assumed a stale 4-stat/4-badge-column
  layout) — stats wrap 3+2 at 1024px and 2-per-row at 640px via `nth-child` border rules
  rather than the old fixed 2-column assumption.
- *(Not verified live this pass.)*

---

### Member Settings — visual rebuild (§10, June 2026)

`apps/connect/app/member.css` plus `app/member/settings/profile/page.tsx` and
`app/member/settings/directory/page.tsx` (className only) and
`app/member/settings/PasskeyManager.tsx` rebuilt against
`mockups/web/moveee_connect_settings.html`. The underlying structure/logic
(per-field inline-edit-with-autosave, read-only field treatment, Directory
tab cross-tab preview, WebAuthn/Passkey management, settings-only newsletter
preference list) was already fully implemented going into this pass — only
visual fidelity gaps needed fixing, all confirmed by direct grep of the
mockup HTML rather than the prose spec (see the `--ochre` correction above —
an earlier pass on this same pass nearly went down the wrong path assuming
`var(--ochre)` was amber rather than rust, based on the doc table that has
now been corrected):

- `.mem-card` was a flat rectangle (no radius, no shadow) — the mockup wants
  `rounded-xl` + `shadow-card` on every card, confirmed against *both* the
  Settings mockup and the already-completed Dashboard mockup (so this was a
  pre-existing gap, not Settings-specific). Added `border-radius: 12px` +
  a subtle `box-shadow` to the shared `.mem-card` base class with its
  existing neutral border kept. Settings' editable-field cards specifically
  also want an ochre-tinted border (`border-ochre/20` in the mockup, distinct
  from Dashboard's neutral `border-ghost/20`) — added as a separate
  `.mem-card--editable` modifier class, applied only to the Profile and
  Directory settings page's wrapping `<section>` (the two pages with
  inline-editable fields), not to Security/Notifications/Interests/
  Newsletters (action-row or toggle-row cards, which the mockup keeps on a
  neutral border — see the Password row in the Security frame for the
  confirming example).
- `.prf-tab--active::after` (the active tab's underline) was `var(--ink)` —
  mockup uses `border-ochre` for the active tab underline while keeping the
  tab *text* itself `text-ink` (don't change the text color, only the
  underline — confirmed via the mockup's literal class list,
  `text-ink ... border-b-[2px] border-ochre`).
- `.mem-field-btn` (Edit/Change links) defaulted to `var(--ink)`, only
  turning ochre on hover — mockup's Edit/Change links (`text-ochre`) are
  ochre by default. Default color changed to `var(--ochre)`; hover changed
  to `var(--ochre-deep)` so there's still a visible hover state.
- `.mem-toggle` (Notifications on/off buttons) was missing
  `border-radius: 999px` — mockup uses a full pill (`rounded-full`) for these;
  the existing on/off background colors (`var(--ink)` for "on") were already
  correct and didn't need changing.
- `.mem-field-input` (editable text inputs) was missing `border-radius`
  (mockup uses `rounded-lg`, ~8px) and only showed an ochre border on focus —
  mockup's editable inputs have a persistent `border-ochre` outline, not just
  on focus. Added `border-radius: 8px` and changed the default border to
  `var(--ochre)`.
- `PasskeyManager.tsx`'s "Remove" button and inline error-message text used
  the literal `#c5491f` (brand ochre/rust) for a destructive/error action —
  the mockup uses a **distinct** error-red token (`error: '#C62828'`, not the
  brand accent) for this. Swapped both to `#c62828`/`rgba(198,40,40,...)`.
  There's no `--error` CSS variable in `globals.css` yet — this file uses a
  literal, consistent with how other one-off colors (e.g. `var(--moss,
  #5a7a5a)`) are already handled ad hoc in `member.css`. If a real error-red
  variable is ever introduced, swap this literal for it.
- `.dir-toggle`, `.dir-toggle--on`, `.dir-preview-tag`, `.dir-discipline-tag`/
  `--on` in the Directory tab were checked against the mockup and found to
  already be correct — no changes needed there.
- *(Not verified live this pass.)*

---

### Wallet, Perks & Coupons — visual rebuild (§11, June 2026)

Three routes (`/member/wallet` → `WalletClient.tsx`, `/connect/perks` →
`PerksClient.tsx`, `/member/coupons` → `CouponsClient.tsx`) rebuilt against the
single mockup `mockups/web/moveee_wallet.html` (674 lines, 5 frames: Wallet
History, Wallet Cash Out, Perks + redeem modal/QR success, Coupons, plus a
mobile companion frame). Confirmed via direct HTML read, not the prose spec.

- **New semantic color tokens** added to `apps/connect/app/globals.css`:
  `--success`, `--error`, `--warning`, `--warning-dark` — previously every
  success/error indicator across these three pages used literal hex
  (`#2e7d32`/`#c5491f`/`rgba(198,40,40,...)`) rather than a shared token, even
  though the mockup treats these as distinct semantic colors from the brand
  ochre/rust accent. `WalletClient.tsx`'s ledger amount color, step-up error
  banner, and cash-out result banner all swapped from literal hex to
  `var(--success)`/`var(--error)`.
- **`CouponsClient.tsx` Active/Used/Expired rebuild** — Active coupons now
  render as a `repeat(auto-fill, minmax(220px,1fr))` grid of centered cards
  (`--radius-xl` + `--shadow-card`, success-tinted border by default, flipping
  to warning-tinted when `daysUntil(expires_at) <= 3`), each with an
  absolutely-positioned top-right pill badge ("Active", tinted to match the
  card's state), a centered QR, and a bold expiry line. Used/Expired now
  render as rounded (`--radius-lg`), opacity-reduced rows (Used: 0.6, Expired:
  0.4 + title strikethrough) with a trailing pill status badge — previously
  both were a flatter, non-pill, non-card treatment. Mirrors the
  success/error/warning token convention introduced above.
- **`perks.css`**: added `.perk-stepup-working { animation: perk-pulse 1.8s
  ease-in-out infinite; }` + the `@keyframes perk-pulse` rule itself —
  `PerksClient.tsx`'s "waiting for biometrics" banner already had this
  className applied in JSX but no matching CSS existed, so the mockup's
  `animate-pulse` behavior was silently missing.
- **Investigated, deliberately left unchanged**: `.perk-redeem-btn` is dead
  CSS (grepped across `apps/connect/`, including the compiled `.next` output —
  no `.tsx` references it; `PerksClient.tsx` uses `.perk-card-btn` instead).
  `.perks-filter-btn`'s underline-tab style (not a pill) was checked against
  the mockup's own Frame 2 tab markup (`border-b-[2px] border-ochre`, not a
  rounded pill) and confirmed already correct — no change needed.
- **Cashout fee confirmed at 40% (fixed June 2026):** `WalletClient.tsx`'s live
  fee calculator (`feePercent`, ~line 108) previously read `30`, mismatching
  both the static copy on the same page ("A flat 40% fee applies", ~line 228)
  and the PHP backend (`Culture_Perks::cashout_fee_percent()` — already
  hardcoded to `40`). The user confirmed 40% is the correct, intended fee —
  `feePercent` is now `40`, matching the backend and the static copy. Grepped
  the rest of the web app, mobile app, and `culture-community/` for any other
  stray "30%"/cashout-fee literals — none found; this was the only place the
  wrong number lived.
- *(Not verified live this pass.)*

---

### Feed Card Detail Drawers — visual rebuild (§15, June 2026)

**Gotcha that caused a false "Done" claim, then got corrected:** when verifying a Figma
Make web rebuild section against its mockup, always diff the actual mockup HTML
(`mockups/web/*.html`) — never the prose spec text in `docs/figma-make-prompts-web.md`.
A first pass on this section compared the 5 live drawer components against the prose
description only, concluded they "already matched," and committed that claim. The user
immediately flagged it ("the website still have the old designs") and was right — a
real diff against `mockups/web/moveee_connect_feed_drawers.html` turned up genuine
mismatches, all now fixed in `HappeningDetailModal.tsx`, `DirectoryDetailModal.tsx`,
`QuoteDetailModal.tsx`, `PulseDetailModal.tsx`, `CommunityDetailModal.tsx` (all
`packages/shared/components/pulse/`):

- Badges: `borderRadius: "2px"` → `"999px"` (full pill) everywhere, including the 6
  template badges inside `CommunityDetailModal.tsx` (hidden-gem/cultural-take/food-review/
  creative-showcase/itinerary/event).
- Header background is `#faf8f5` (distinct from the panel's `var(--paper, #f3ece0)`), not
  the same paper color as the body — padding uniform `1.25rem`.
- "Full page"/"Open full page" link: plain underlined text, rust `#c5491f`, no border/pill/
  icon (was previously a bordered box with an SVG arrow). **Directory drawer omits this
  link entirely** per the mockup's own inline comment.
- Close button: real SVG stroke "X" icon (`<path d="M6 18L18 6M6 6l12 12"/>`), not a `✕`
  Unicode glyph.
- Full-width CTA buttons (Happening "View Event Details →", Directory "View Full Entry →"):
  `width: 100%, height: 52px, borderRadius: 999px` pill, not an inline-block square button.
- Quote drawer: sharing-reason callout `borderRadius: 12px` + `boxShadow: 0 1px 2px
  rgba(0,0,0,0.05)`; date line centered + `font-family: monospace`.
- Pulse/Editorial drawer badge relabeled "Editorial" (bg `#eeedfe`/text `#3c3489`) — the
  mockup's literal text, not the old "Pulse" label.
- Community drawer's event-details block now wrapped in a white bordered card (`#fff`
  bg, `1px solid #e8e2d8`, `borderRadius: 6px`, `boxShadow: 0 1px 2px rgba(0,0,0,0.05)`)
  instead of plain text rows.
- `RsvpDisplay`'s RSVP button `borderRadius: 4px` → `999px` — fixed in **both**
  `CommunityDetailModal.tsx` and `FeedCard.tsx` (duplicate, non-shared copies per the
  mockup's own dev-comment — any future RSVP/poll UI change must be applied to both files).
- `ProBadge.tsx` (the "PRO" pill next to author names) was checked and already matched the
  mockup's `rounded-sm` style (`borderRadius: Math.max(3, size*0.3)`) — no change needed.

---

### Member Directory & Public Profiles — visual rebuild (§12, June 2026)

`mockups/web/moveee_directory.html` (4 frames: People Near Me Desktop, Public Profile Community
Tab Desktop, Public Profile Portfolio Tab split gated/unlocked Desktop, Mobile Companion). Diffed
directly against the mockup HTML, not the prose spec. Touches `packages/shared/components/connect/
MemberDirectory.tsx` (shared — directory grid + member cards), `apps/connect/app/feed/feed.css`
(`mco-*` namespace), and `apps/connect/app/connect/[username]/{CommunityTab,PortfolioTab,
profile.css}` (`prf-*` namespace).

- `.prf-tab--active::after` (the active Community/Portfolio tab underline) was `var(--ink)` —
  mockup uses `border-ochre` for the underline while keeping the tab text itself `text-ink` (same
  text-stays/underline-changes pattern already established for Settings tabs in §10 — don't change
  the text color, only the underline).
- `MemberDirectory.tsx` was missing the mockup's "{N} members near you" live count caption next to
  the filter controls — added a `.mco-dir-count` span, monospace, muted, rendered only once loaded
  and non-empty.
- Member card footer links were plain underlined text labels ("Website", "LinkedIn", …) — mockup
  renders a footer row (top border, gap) of circular 32px icon-glyph buttons (🌐 / `in` / `ig` / `𝕏`)
  followed by a trailing ochre "View Profile →" link. Rebuilt `.mco-member-links`/`.mco-member-link`
  in `feed.css` to match, and changed the `links` array in `MemberDirectory.tsx` to carry a `glyph`
  per platform (rendered instead of the label) plus reordered to website/linkedin/instagram/twitter
  per the mockup's icon order.
- Portfolio tab's pinned community posts (`PinnedPostCard`) rendered identically to regular
  portfolio items, with no visual distinction — mockup gives pinned cards an ochre border, a 📌 pin
  glyph in the top-right corner, and a colored category badge (Showcase=blue, Cultural Take=purple,
  Hidden Gem=green, Food Review=red, fallback=ochre) instead of the generic type label. Added a
  `PINNED_BADGE` lookup map in `PortfolioTab.tsx` and matching `.prf-pinned-card`/`.prf-pinned-pin`/
  `.prf-pinned-badge--*` rules in `profile.css`.
- `.mco-dir-empty` (the "No one near you yet" empty state) had no icon and a flat background —
  mockup shows a dashed border card with a large grayscale 👥 glyph above the title. Added both.
- `CommunityTab`'s "Load more" button was a `.prf-filter-pill`-styled pill with an inline padding
  override — mockup's is a plain full-width text link (ochre, bold, underline-on-hover, no
  border/background). Replaced with a dedicated `.prf-load-more` class.
- CSS tokens verified against the live `globals.css` before use (per the project's `--ochre`-vs-
  `--gold` precedent): `--paper-deep` (`#f2f2f2` light) is close enough to the mockup's standalone
  Tailwind `#F5F5F5` — no token fix needed; `.prf-badge-tooltip`'s new shadow uses
  `var(--shadow-tooltip, <fallback>)`, the same already-established fallback pattern used elsewhere
  in `globals.css` (no literal `--shadow-tooltip` variable exists anywhere in the codebase, by
  design — see the existing precedent at the line that already does this).
- **Deliberately left unchanged**: regular (non-pinned) `PortfolioCard` items still open a click-to-
  modal lightbox rather than the mockup's hover-reveal "View project" overlay — a judgment call
  favoring touch/accessibility-friendliness over literal mockup replication, since hover-reveal
  controls don't work on touch devices (see the existing "hover-revealed elements need a mobile
  always-visible override" lesson from the Lifestyle Shop mobile-responsive pass) and there was no
  mockup-specified touch fallback for this interaction.
- *(Not verified live this pass.)*

---

### Notifications & Analytics — visual rebuild (§13, June 2026)

`mockups/web/notifications_analytics.html` diffed directly against the live components, not the
prose spec. Touches `packages/shared/components/NotificationBell.tsx` (shared header dropdown),
`apps/connect/app/member/notifications/NotificationsClient.tsx` (full-page list), and
`apps/connect/app/member/analytics/AnalyticsClient.tsx` (stat cards, SVG bar/line charts, top
posts). No CSS files were touched in this pass — all three components use inline `style={{...}}`
objects exclusively, so there's nothing to brace-balance-check, only `tsc --noEmit`.

- **Recurring color-family bug, found in two separate files**: both `NotificationBell.tsx`'s
  dropdown rows and `NotificationsClient.tsx`'s full-page rows used a **gold**-family tint
  (`rgba(179,130,56,...)` = `#b38238`) for the unread-row background — the mockup specifies an
  **ochre/rust** tint (`#c5491f` at low opacity) instead. Fixed in both files (dropdown rows in
  `NotificationBell.tsx` in an earlier pass this session; full-page rows in
  `NotificationsClient.tsx` in this pass). The same gold-vs-ochre mixup recurred a third time in
  `AnalyticsClient.tsx`'s Top Posts rank-#1 badge (see below) — **if a future surface shows an
  unread/highlight/rank-1 accent that looks "off-brand," check whether it's using `--gold`
  (`#b38238`, amber) where the mockup actually wants `--ochre` (`#c5491f`, rust)** — this is now a
  3-for-3 pattern in this codebase, not a one-off.
- `NotificationBell.tsx` (dropdown): badge border, dropdown shadow, mark-all-read color+weight,
  the unread/read background fix above (+ matching hover handlers), timestamp color+font, and the
  footer redesigned from a conditionally-shown link to an always-visible sticky bottom bar.
- `NotificationsClient.tsx` (full page): header row rebuilt into a fixed-height (64px) banded bar
  with its own background/border (was a plain flex row with `marginBottom`); row padding increased
  to a uniform 20px with 16px gap (was 14px/14px); emoji size increased to 24px, title to 15px;
  body/date text now conditionally colored brighter when unread vs. muted when read (previously
  both were always `var(--mute)` regardless of read state); unread dot enlarged 7px→8px; added a
  client-side "Load more" pagination affordance (`visibleCount` state, `PAGE_SIZE = 20`, slices the
  already-fetched `items` array — the notifications API has no offset/pagination param wired up
  server-side, so this is a pure client-side reveal rather than a new network request per page).
- `AnalyticsClient.tsx`: the one confirmed functional/color bug was the Top Posts rank-#1 badge
  using gold (`#b38238`) instead of ochre (`#c5491f`) — fixed. Remaining changes are pure visual
  polish to match the mockup: chart gridlines in both `BarChart` and `LineChart` changed from a
  solid `#e5ddd0` line to a dashed (`strokeDasharray="4 4"`) `#c8bfb0` line; axis/label text color
  changed from `#9c8e7a` to the project's documented `var(--mute)`-equivalent literal `#7a6f5c`
  throughout both charts; `StatCard` restyled from a flat tan card to a white card with 12px
  radius, a subtle box-shadow, and a monospace uppercase label (was a plain sans label); the Top
  Posts container restyled from the generic shared `.mem-card` class to its own white
  card-with-shadow wrapper (the mockup gives this section a distinct rounded/shadowed treatment),
  and each row's reaction/comment counts switched from a three-column plain-number layout to
  emoji-prefixed (`❤️`/`💬`) counts on one line plus a bold "{N} Eng" total beneath.
- **Confirmed already correct, no bug** — checked against the mockup and found matching, no
  changes made: the 6-stat-card grid (Credit Balance, Points, Posts, Badges, Earned (30d), Spent
  (30d)); `BarChart`'s earned/spent bar colors (`["#b38238", "#c5491f"]`, gold=earned/ochre=spent —
  matches the mockup's `chart-earn`/`chart-spend` tokens exactly); `LineChart`'s call-site color
  override (`color="#2a6496"`, a one-off blue distinct from both ochre and gold, matching the
  mockup's dedicated `chart-line` token); the "← Back to Dashboard" link's `var(--ochre)` color.
- *(Not verified live this pass.)*

---

### Authentication Flow — visual rebuild (§17, June 2026)

`mockups/web/authentication_flow.html` diffed directly against the 5 live auth pages in
`apps/connect/app/` — `login/page.tsx`, `register/page.tsx`, `register/complete/page.tsx`,
`forgot-password/page.tsx`, `reset-password/page.tsx`. All five already had the correct
functionality (NextAuth credentials/passkey/Google sign-in, registration verification flow,
forgot/reset password) — this was a targeted visual fidelity pass, not a rebuild, same as the
§9–§15 passes before it. All five files use inline `style={{...}}` / a `Record<string,
React.CSSProperties>` object at the bottom of the file (no CSS modules/files for this surface),
so verification was `tsc --noEmit` only — no brace-balance check applicable.

- **Systemic `.form-label` fix, all 5 pages**: every form label across the auth flow used a
  bold, dark, 13px treatment (`fontSize:13, fontWeight:600, color:"#14110d"`) — the mockup's
  `.form-label` token is light/muted/non-bold (`fontSize:11, fontWeight:400, color:"#7a6f5c"`),
  matching the same label styling already used elsewhere in the codebase (e.g. Settings'
  `.mem-field-label` per §10). Fixed in `login`, `register`, `register/complete`,
  `forgot-password`, `reset-password` — this is now the 5-for-5 pattern across the whole flow,
  not a one-off.
- **`login/page.tsx`**: error-state inputs (`username`/`password`) get a visible red-tinted
  border (`rgba(192,57,43,.5)`) when an error is present, instead of staying neutral; the
  Google "G" icon button restyled to match the mockup's icon sizing/spacing; the
  forgot-password/create-account footer links consolidated into a single flex-column container
  (`gap: 12`) instead of two separately-margined `<p>` tags.
- **`register/page.tsx`**: same footer-consolidation treatment as login (sign-in link +
  "Upgrade after joining" link into one flex-column block).
- **`reset-password/page.tsx`**: added a `successBlock` style (green-tinted card —
  `background:"#f0fdf4"`, `border:"1px solid rgba(39,174,96,.15)"`, `color:"#27ae60"`) for the
  post-submit success message, matching the mockup's `.success-block` pattern — previously this
  state had no dedicated styling.
- **`register/complete/page.tsx`** (Steps 2/3 — DOB/country/city/occupation, interests,
  membership tier):
  - Membership tier card: `tierLabel` changed from a prominent bold 17px dark heading to a
    muted uppercase eyebrow-style label (`fontSize:11, fontWeight:400, textTransform:
    "uppercase", color:"#7a6f5c"`); `tierPrice` changed from a bold brownish accent
    (`color:"#8b6f47"`) to a large dark serif price (`Georgia, serif, fontWeight:300,
    fontSize:28`) — matching the serif/weight-300 heading pattern used across the rest of the
    auth flow (login/register/forgot-password/reset-password headings all follow this same
    `Georgia, serif` + `fontWeight:300` convention).
  - `savingsTag` color corrected from brand ochre/rust (`#c5491f`/`#fdf2f0`) to a distinct
    semantic green (`#27ae60`/`#e6f4ea`) — "savings" is a positive/success indicator, not a
    brand-accent callout, consistent with the green/success token already established
    elsewhere (e.g. the Wallet/Perks/Coupons rebuild's `--success` token, §11).
  - Billing-cycle toggle (Monthly/Annually) softened from a solid black/white active pill to a
    white-background "chip" with a subtle shadow (`boxShadow: "0 1px 3px rgba(20,17,13,.12)"`)
    when active, matching the mockup's lighter toggle treatment.
  - Interest-grid pills' active state changed from a light background tint + ring box-shadow to
    a solid black fill with white label text, matching the mockup's selected-state styling. No
    changes to the underlying 18-slug `INTERESTS` data or 3-column grid layout — visual-only.
  - The `ProgressBar` helper component's step-indicator sizing (32px circular nodes) was left
    unchanged — a minor, deliberately accepted deviation, not revisited in this pass.
- **Dead code removed**: `apps/connect/app/login/login/` (`page.tsx` + `layout.tsx`) — an
  orphaned duplicate route under `/login/login` with zero genuine source references anywhere in
  the codebase. Confirmed dead before removal (not a in-progress feature) and removed via
  `git rm -r`. Its removal left stale references in the auto-generated Next.js route-validator
  type files (`.next/types/validator.ts`, `.next/dev/types/validator.ts`) that only cleared
  after `rm -rf .next` — if a future `tsc --noEmit` run reports errors pointing at a route you
  just deleted, clear the `.next` cache before assuming the deletion is incomplete.
- **`packages/shared/components/PasskeyBanner.tsx` deliberately out of scope** — it's a
  dashboard-context component (rendered on `/member`, not any of the 5 auth pages above); the
  mockup's passkey-prompt frame is illustrative of the concept, not a literal target for this
  pass.
- *(Not verified live this pass.)*

---

### Overlays & Micro-interactions — visual rebuild + dark-mode hex-color fix (§18, June 2026)

Two related fixes landed in the same pass: a genuine dark-mode bug (several shared
`pulse/` components hardcoded hex colors in inline styles instead of the theme-aware
CSS variables already defined in `apps/connect/app/globals.css`, so they didn't adapt
when dark mode was toggled), and the §18 Overlays & Micro-interactions build itself,
diffed against `mockups/web/moveee_overlays.html` (8 frames) — not the prose spec.

**Dark-mode hex-color bug** — `packages/shared/components/pulse/FeedCard.tsx`,
`CommunityDetailModal.tsx`, `DirectoryDetailModal.tsx`, `HappeningDetailModal.tsx`,
`PulseDetailModal.tsx`, `QuoteDetailModal.tsx` were audited for literal hex/rgba colors
on text, borders, and backgrounds that should track theme state, and swapped to the
existing `var(--ink)`, `var(--mute)`, `var(--rule-dark)`, `var(--paper-warm)`,
`var(--error)`, `var(--success)` tokens (all already defined with both light and dark
values in `globals.css`) wherever a literal would otherwise paint the wrong color in
dark mode. No new CSS variables were introduced — every fix maps onto a token that
already existed.

**Overlays frames (`mockups/web/moveee_overlays.html`)**:
- **Frame 1 (Locked Template Pill)** — already implemented correctly pre-pass
  (`SubmitPost.tsx`'s `TEMPLATE_REP_GATE`/dimmed-pill/lock-tooltip, see the Composer
  gating section above); no changes needed.
- **Frame 2 (Report Post Inline States)** — `FeedCard.tsx`'s report flow already had
  the spam/harassment/inappropriate radio expansion; this pass added dimming
  (`opacity`) on the `ReactionBar` wrapper and comment-count button while
  `reportState !== "idle"`, and bolded the post-submit "sent" confirmation text, to
  match the mockup's de-emphasis of secondary actions during a report submission.
- **Frame 3 (Destructive Confirm Modal)** — checked against
  `packages/shared/components/ui/ConfirmDialog.tsx`-equivalent web pattern; already
  matched, no changes.
- **Frame 4 (Sign Out Dropdown)** — `apps/connect/components/header.css`'s
  `.ch-user-item--danger`/`:hover` used `#c0392b`/`#fff5f5`; mockup specifies a
  distinct orange (not the brand ochre/rust and not the `--error` red) for this
  specific destructive action — changed to `#e65100`/`#fef2f2`.
- **Frame 5 (Image Lightbox)** — already implemented (see
  `DirectoryLightboxImage.tsx` precedent and existing pulse-modal lightbox usage); no
  changes.
- **Frame 6A (Composer Success Banner)** — already matched the mockup's purple
  (`#7A4DA0`/`#F3EEF8`) tokens exactly; no change.
- **Frame 6B (Composer Link-Blocked Error)** — `apps/connect/app/globals.css`'s
  `.composer-error` used plain `#c5491f` (ochre) with no font-weight; mockup wants the
  semantic error-red plus bold — changed to `var(--error); font-weight: 700;`. Same
  ochre-vs-error mixup pattern documented elsewhere in this file (gold-vs-ochre,
  ochre-vs-error) — this is now recurring across at least 3 separate features.
- **Frame 6C (Perk Redeem Success)** — `apps/connect/app/connect/perks/perks.css`'s
  `.perk-success-title` used a literal `#2e7d32` green; changed to `var(--success)`.
  The existing success-state structure (full success section, not a modal) was kept
  as-is — only the color token was a bug.
- **Frame 6D (Perk Redeem Error)** — same `perks.css`'s `.perk-modal-error` had the
  identical ochre-vs-error bug (`#c5491f`, no weight) as Frame 6B; fixed to
  `var(--error); font-weight: 700;` with matching `rgba(198,40,40,...)`
  background/border (was `rgba(197,73,31,...)`).
- **Frame 7 (For You Nudge Cards)** — two fixes in
  `packages/shared/components/pulse/PulseFeed.tsx` and `apps/connect/app/pulse-layout.css`:
  the no-interests banner's inline styles were literal hex (`#fdf5e6`/`#e8d8b0`/
  `#7a6f5c`/`#14110d`) — swapped to `var(--paper-warm)`/`var(--rule-dark)`/
  `var(--mute)`/`var(--ink)` so the banner is dark-mode-safe; the "For You →" button
  was a small inline pill (`borderRadius: 3`) instead of the mockup's full-width pill
  (`borderRadius: 999, width: "100%"`); `.pulse-foryou-hint`'s background/border were
  tightened to the mockup's exact `rgba(179,130,56,...)` gold tint at `12px` radius
  (was a flat `var(--paper-warm)` at `4px`) — the rgba-overlay approach stays
  dark-mode-safe since it tints whatever paper background shows through rather than
  setting an opaque literal.
- **Frame 8 (Split Context Actions)** — covered by the Frame 2 work above (dimming
  secondary actions during an in-flight state); no separate changes needed.

*(Not verified live this pass.)*

---

### Dark-mode hex-color audit — full sweep of `packages/shared/components/pulse/` and `connect/` (June 2026)

Follow-up to the Overlays pass above: a full audit of every remaining file in
`packages/shared/components/pulse/` and `packages/shared/components/connect/` for the
same hardcoded-hex-instead-of-CSS-variable bug (literal colors that don't track theme
state, so they paint wrong in dark mode). Bare hex literals found and fixed (same
`var(--token, #original-literal)` pattern as elsewhere — fallback preserves the exact
light-mode value) in: `ReactionBar.tsx` (border-top, inactive reaction text/icon,
copy-link button default/copied states), `SourcePreviewCard.tsx` and
`InternalLinkCard.tsx` (border/background + hover-handler literals, title/description/
domain-suffix text colors), `CommentThread.tsx` (input style object, section border,
comment list border/author/date/body colors, auth CTA box, form labels, status
messages, submit button), `HashtagText.tsx` (mention button color), 
`StoopReminderCard.tsx` (icon circle background), `EventSpotlightCarousel.tsx`
(category color fallback, card background, featured-stripe/star color, date/venue/title/
price text, outer container background, heading, "See all →" link — also introduced
`var(--cat-community-bg, #edf7ed)`/`var(--cat-community-fg, #2e7d32)` for the
`isCommunity` badge, which are **not** real defined CSS variables in `globals.css`; the
fallback hex is what actually renders in both themes today — either map these to a real
existing token or treat as a known follow-up if dark-mode fidelity on that one badge
ever matters), and `Stoop.tsx` (`connect/`, error block + ink/paper button-text
pairing). `MemberDirectory.tsx` (`connect/`) was checked and is genuinely clean — already
used CSS variables throughout, no changes needed. `ImageLightbox.tsx` is intentionally
theme-independent (a full-screen photo lightbox with a black scrim and white controls
should not change with site theme — confirmed not a bug, left as-is).

`PulseFeed.tsx` had 8 bare-hex spots fixed, all using the same `var(--token,
#original-literal)` pattern as the rest of this file's dark-mode fixes (fallback
preserves the exact original value so light mode is pixel-identical, only dark mode
changes): page wrapper background (`#ffffff` → `var(--paper, #ffffff)`); the mobile "For
You" filter pill's active-state background/text/border (`#14110d`/`#fff`/`#14110d` →
`var(--ink, #14110d)`/`var(--paper, #fff)`/`var(--ink, #14110d)` — the white text needed
to become `var(--paper, #fff)` rather than staying literal, since it's paired with the
`--ink`-tracking background and the two invert together in dark mode); the mobile type
filter pill's active state (same ink/paper-pairing fix, plus the ochre accent
`#c5491f` → `var(--ochre, #c5491f)` for consistency even though the ochre literal alone
wasn't a bug); the "⊞ Sections" toggle button (background/text/shadow, same
ink/paper-pairing + ochre-wrapping pattern); the Sections/Categories dropdown panel's
border/background; the dropdown's nav link text/border-right; the empty-feed-state text
(`#aaa` → `var(--mute, #aaa)`); the "Loading…" text (`#bbb` → `var(--mute, #bbb)`).

**`PulseCard.tsx`, `PulseStory.tsx`, `CategoryPage.tsx` are confirmed dead code** (no
imports anywhere in the codebase, verified via Grep) and were initially skipped in this
pass despite having the same class of hex-literal bugs — fixing dead code is normally
wasted effort. **Fixed anyway in a follow-up pass at explicit user request** (override of
the deferral) — all three now use the same `var(--token, #fallback)` pattern as the rest
of the audit (`--paper`/`--rule`/`--mute`/`--ink`/`--ink-soft`/`--ochre`), with their
categorical badge maps (`ARM_STYLES` and its `armStyle`/`relatedArmStyle` fallbacks)
deliberately left as plain literals, consistent with other untokenized category-badge
maps elsewhere in the codebase (e.g. `PINNED_BADGE`). If either file is ever wired back
up, no further dark-mode sweep should be needed for it on that basis alone.

*(Not verified live this pass.)*

---

---

### Dark-mode sweep #2 — CSS-file structural chrome + two undiscovered page-scoped token gaps (July 2026)

The June 2026 audit above covered `packages/shared/components/pulse/`/`connect/` (React
inline styles). This pass covers the remaining class of dark-mode bug: hardcoded colors
in the **CSS files themselves** (`apps/connect/app/*.css`) — never audited before,
surfaced by a user report that `/discover`, `/connect/people`, and even `/feed` still
showed white boxes in dark mode. Same root cause as the June pass (literal hex/rgba
instead of the theme-aware `--paper`/`--ink`/etc. tokens), same `var(--token,
#original-literal)` / `color-mix(in srgb, var(--token) X%, transparent)` fix pattern —
but this time at the CSS-file level, and it turned up two much bigger structural gaps,
not just isolated literals.

- **Structural chrome backgrounds** (`pulse-layout.css`, `discover.css`, `people.css`,
  `member.css`, `globals.css`'s `.composer-*` rules) — page/card/sidebar backgrounds
  hardcoded to `#fff`/`#ffffff` instead of `var(--paper, #fff)`. This is what was
  actually visible in the report: the feed's `.pulse-about-card`/`.pulse-sidebar-right`,
  the whole `/discover` and `/connect/people` page backgrounds, member/badge cards, and
  the composer's quote-box/slim-bar.
- **`background: var(--ink); color: #fff;` pairing bug** (`discover.css`'s
  `.disc-active-filter`, `people.css`'s `.ppl-active-filter`/`.ppl-empty-cta`,
  `member.css`'s `.hfc-submit-btn`/`.hfc-nav-next`) — `--ink` **flips** between themes
  (dark in light mode, light in dark mode), so pairing it with a *literal* white text
  color works in light mode but goes invisible-on-light-background in dark mode. Fixed by
  swapping the literal to `var(--paper)`, which flips the opposite direction and stays
  correctly contrasting in both themes — confirmed via a full-codebase scan (parsed every
  CSS rule block, not just grep) that no other occurrence of this exact pairing survived
  anywhere in `apps/connect/app/*.css` after the fix.
- **Mechanical `rgba(42, 36, 28, X)` → `color-mix(in srgb, var(--ink) X%, transparent)`
  sweep**, ~51 occurrences across `member.css`, `events.css`, `footer.css`,
  `sections.css`, `games.css`, `people.css`. `rgba(42,36,28,...)` was a pervasive
  copy-pasted "subtle dark tint" literal for hairline borders/hover backgrounds,
  effectively always assuming a light background underneath — invisible or wrong-weight
  once the surface actually went dark. `color-mix` against `var(--ink)` preserves the
  exact original visual weight in light mode (the two colors are close enough at
  low opacity to be imperceptibly different) while correctly inverting in dark mode.
  Script-verified value-by-value before applying (extracted every distinct opacity used,
  confirmed the percentage math), not a blind find/replace.
- **Two page-scoped color-token namespaces had zero dark-mode override, ever** —
  `directory.css`'s `--dir-*` tokens and `events.css`'s `--evt-*` tokens (each page
  intentionally keeps its own separate namespace instead of the global `--paper`/`--ink`,
  see each file's own header comment) were defined once in `:root` with no
  `[data-theme="dark"]` block anywhere in either file. This meant the **entire** Directory
  Entry Detail page and the **entire** Events/Happenings surface never responded to the
  theme toggle at all — not isolated literals, a total gap. Fixed by adding a
  `[data-theme="dark"]` override block to each, mirroring `globals.css`'s already-shipped
  dark values for every token with a direct equivalent (`--dir-ink`/`--dir-paper`/
  `--dir-ochre` ← global `--ink`/`--paper`/`--gold`; `--evt-*`'s full set). `--dir-muted`/
  `--dir-border` were also refactored from separate literals into `color-mix(in srgb,
  var(--dir-ink) X%, transparent)` derivations, so they auto-flip with `--dir-ink` instead
  of needing their own duplicate dark-mode entries. `--evt-ghost`/`--evt-ghost-light`/
  `--evt-rule` have no global-token equivalent to mirror (they're page-specific neutral
  shades) — their dark values were hand-picked to preserve the same relative
  lightness/contrast against the new dark `--evt-paper`, not derived from an existing
  value. **`--dir-dark-bg`/`--dir-dark-ink`** (directory.css) were deliberately left
  untouched — those name the page's permanently-dark "Improve this entry" CTA section,
  independent of site theme, not a token that should flip (see the existing "Directory
  Entry Detail page" entry above for why that section is dark-styled regardless of
  theme).
- **Tailwind's `@theme` block tokens were a separate, silent gap** — `globals.css`'s
  `[data-theme="dark"]` block only ever redefined the plain `--paper`/`--ink`/etc. custom
  properties (used directly by hand-written CSS via `var(--paper)`). The `@theme { --color-paper:
  ...; --color-ink: ...; }` block a few lines above it defines a **separate** set of
  `--color-`-prefixed properties that Tailwind's generated utility classes
  (`bg-paper`, `text-ink`, `text-ink-soft`, used directly in JSX — e.g. `apps/connect/app/events/page.tsx`,
  `events/[slug]/city-archive.tsx`/`category-archive.tsx`, `quotes/[slug]/page.tsx`) actually
  compile to underneath. Nothing had ever mirrored those into the dark block, so every
  page using `bg-paper`/`text-ink`-style utility classes silently never changed with the
  theme toggle, sitting alongside otherwise-correctly-dark-mode-aware hand-written CSS on
  the same page. Fixed by adding matching `--color-*` mirrors (same values, `--color-`
  prefix) inside the existing `[data-theme="dark"]` block — since Tailwind's compiled
  utilities reference the custom property, not a static value, this alone is enough; no
  Tailwind `dark:` variant config needed. **If a future page uses a `bg-*`/`text-*`
  Tailwind utility for a themeable color, verify the underlying `--color-*` token has a
  dark-mode mirror in this block — it's easy to add a new `--color-*` token to the
  `@theme` block above without remembering it needs one here too, since the two blocks
  aren't adjacent and don't visually look connected.**
- Deliberately left alone (confirmed intentional, not bugs, on inspection of each): white
  text/badges/borders sitting on top of a photo or a solid saturated-color background
  (`.disc-card`/`.ppl-avatar`/`.disc-card-new`/ochre-and-gold badges throughout) — these
  don't need to track theme since the surface behind them isn't `--paper`-based; and
  `rgba(243, 236, 224, X)` literals used as text/border color on components that are
  themselves permanently dark-styled regardless of theme (`.con-tier-card--patron`,
  `.cookie-bar-*`, `.nl-manage--dark`) — matches the project's existing "dark backgrounds
  are only acceptable for buttons/hover-states/single-issue-page-components" rule, not a
  gap to fix.
- *(Not verified live this pass.)*

---

---

### Discover web — visual fidelity pass (June 2026)

`mockups/web/moveee_discover.html` ("Moveee - Discover", 3 frames: Discover Home
Desktop 1440px, Filter Panel Desktop Overlay, Mobile Companion 390px) diffed
directly against `packages/shared/components/DiscoverBrowser.tsx` +
`apps/connect/app/discover.css` — the feature itself (pagination, search, type
filter, region filter, sort, rails, grid) was already fully built and correct
going into this pass; only CSS/JSX visual fixes were needed, same methodology
as every other Figma rebuild pass in this file.

- `.disc-filter-apply` was `var(--ink)` — mockup's sticky filter-panel footer
  button is `bg-ochre` (hover `#A93C15`). Fixed.
- Desktop filter panel was a centered bottom-sheet-style modal — mockup's
  Frame 2 is a **right-edge-anchored slide-in panel** (`width: 420px, height:
  100%, border-radius: 16px 0 0 16px` — left-corner radius only). Fixed via a
  `@media (min-width: 720px)` override on `.disc-filter-overlay`
  (`align-items: stretch; justify-content: flex-end`) and `.disc-filter-panel`
  (full height, no bottom-sheet radius). Mobile keeps the original bottom-sheet
  treatment (`border-radius: 16px 16px 0 0`, `max-height: 85vh`) — matches
  Frame 3.
- `.disc-filter-close` was a bare "✕" text glyph — mockup uses a circular
  32×32 `bg-paper-warm` button with an inline SVG stroke-X icon. Rebuilt to
  match (`DiscoverBrowser.tsx`'s close button JSX + a new `.disc-filter-close`
  class).
- `.disc-empty` (no-results state) had no icon and a flat background — mockup
  shows a dashed-border, rounded, tinted-background card with a grayscale icon
  above the text. Added `.disc-empty-icon` (🔍, `filter: grayscale(1);
  opacity: 0.5`) and restyled the container to match.
- Added a "Reset" link (ochre, `.disc-filter-reset`) to the filter panel
  header, shown only when a draft region/sort differs from default — mockup's
  Frame 3 mobile filter sheet has this; desktop panel reuses the same header
  component for consistency. Reset only clears the draft state (region/sort
  inputs) — the user still presses the existing "Show N entries" apply button
  to commit, consistent with the pre-existing draft/apply UX pattern (Reset
  doesn't auto-apply).
- "⚙ Filters" pill button now shows an active-filter count suffix (e.g.
  "⚙ Filters (1)") via a new `activeFilterCount` computed value
  (`region ? 1 : 0` + `sort !== "relevant" ? 1 : 0`), matching Frame 3's
  "⚙ Filters (1)" mobile chip-row treatment.
- Search bar radius split: mockup wants a pill (`999px`) on mobile (Frame 3)
  but `rounded-lg` (8px) + centered `max-width: 480px` on desktop (Frame 1) —
  previously a single radius was used at all widths. Added a `@media
  (min-width: 720px)` override.
- Star ratings now always render 5 characters total — hollow/ghost stars
  (`var(--ghost, #d8cfc0)`) pad out the remainder (e.g. `★★★★☆ 4.4`), matching
  the mockup's fixed 5-star display; previously only filled stars were
  rendered with no padding.
- **Deliberately left unchanged**: the mockup's desktop type-filter is a
  dropdown-trigger + popover (collapsed by default, opens on click), while the
  live implementation keeps the always-visible horizontally-scrollable
  chip row at all breakpoints — the same UX already used on mobile and already
  shipped/tested. Chose consistency across breakpoints over literal mockup
  replication for this one control, the same kind of judgment call as the
  Member Directory portfolio-card hover-vs-touch precedent elsewhere in this
  file. Revisit only if a future pass specifically wants the popover pattern.
- **Not yet implemented in this pass**: Frame 1's dashed-border icon-topped
  "empty state" demo card in the Explore More grid area was a mockup
  illustration of the same `.disc-empty` treatment described above, not a
  separate component — no additional work needed beyond the `.disc-empty`
  fix.
- Verified via CSS brace-balance check on `discover.css` (51/51, balanced)
  and `tsc --noEmit` on `apps/connect` (clean, zero errors, after restoring
  `node_modules` which was missing from this session's sandbox at the start
  *(Not verified live this pass.)*

---

### Directory Entry Detail page — visual fidelity pass (June 2026)

`mockups/web/directory_entry_detail.html` ("Moveee Connect - Directory Entry Detail", 4
frames: Desktop Person, Mobile Reordered, Gated Book, Empty Movement). Targets
`apps/connect/app/directory/[slug]/page.tsx` + `apps/connect/app/directory.css`
(`dir-wiki-*` namespace) — **not** `apps/site/app/directory/[slug]/`, which is dead code:
`apps/site/proxy.ts`'s `connectPrefixes` array already includes `/directory`, so that whole
route tree 308-redirects to `web.themoveee.com` and is unreachable in production.

This page was already structurally very close to the mockup going in (same `dir-wiki-*`
classnames, same 220px/1fr/260px three-column grid, same `--dir-*` token values, same
`/discover` back-link, same body-only `ContentGate` paywall pattern, same empty-content
copy, same per-type infobox field definitions for all 11 `culture_directory` entry types)
— this was a targeted fidelity pass, not a rebuild. Fixes applied:

- **Non-cropping images (explicit user requirement):** the Selected Works thumbnail
  (`page.tsx`'s `.dir-wiki-work-img`) and the infobox featured image
  (`.dir-wiki-infobox-img`) both used `objectFit: "cover"` (crops to fill). Changed both to
  `objectFit: "contain"` so the original aspect ratio is always fully visible — both
  container divs already had a background color behind the image (`var(--dir-border)` /
  `var(--dir-dark-bg)`), so `contain`'s letterboxing reads as an intentional fill rather
  than empty space. **If a future image requirement says "don't crop," `contain` +
  a background on the wrapping element is the established pattern here** — don't reach for
  `cover` by default on directory/profile imagery going forward.
- `.dir-improve-btn` was a square (`border-radius: 2px`), ochre-background, mono-font
  button — mockup wants a pill (`rounded-full`), `bg-dir-dark-ink`/`text-dir-dark-bg`
  (i.e. the light `--dir-dark-ink` token on dark `--dir-dark-bg`, since this button sits
  inside the dark `.dir-improve-cta` section), sans-bold 13px. Rebuilt to match.
  `--dir-dark-ink`/`--dir-dark-bg` are named from the *dark section's* perspective (ink =
  the light foreground color used on a dark background, bg = the dark background itself)
  — don't assume "dark-ink" means a dark color literal.
  - `--dir-bg` (used by `.dir-wiki-page`'s background) was never defined in `:root` — only
    `--dir-paper` exists. Dead/typo'd variable reference, silently resolving to nothing.
  - Fixed to `var(--dir-paper)`.
- Upcoming Events card badge (`Happening`) was `border-radius: 2px` — squared off, not a
  pill — and the event card itself was `border-radius: 6px` vs the mockup's `8px`. Fixed
  both (badge to `999px`, card to `8px`).
- `.dir-community-card` (Community Reviews & Takes) used `var(--paper-deep)`/`var(--rule)`
  (the page's tan/neutral globals.css tokens) at `border-radius: 4px` — mockup wants white
  `bg-dir-paper`/`border-dir-border` at `8px`. Also, `.dir-community-stars`,
  `.dir-community-pro-badge`, `.dir-community-star-rating`, and `.dir-community-read-more`
  all used `var(--ochre)` (`#c5491f`, brand rust) where the mockup explicitly specifies
  `#B38238` — that's `var(--dir-ochre)` (this page's own gold token, distinct from the
  global ochre/gold pair, see the `--ochre`-vs-`--gold` precedent elsewhere in this file).
  All four swapped to `var(--dir-ochre)`. **This page has its own `--dir-*` color
  namespace, separate from `globals.css`'s `--ochre`/`--gold` — don't mix the two systems
  when touching `directory.css`.**
- `.dir-wiki-sidebar-empty` ("No related entries yet.") was unstyled inline text — mockup
  wraps it in a centered, bottom-bordered row. Added `display: flex; align-items: center;
  justify-content: center; padding: 12px 0; border-bottom: 1px solid var(--dir-border);`
  plus `font-style: italic` to match.
- `ContentGate` (`packages/shared/components/ContentGate.tsx`, the shared Pro-paywall used
  here and on article pages) was checked against the mockup's Frame 3 gate design (bordered
  box, lock icon, "★ Moveee Pro" label, "You're one step away." headline, pill CTA, price
  footnote via `PatronPrice`) and already matches — it's a shared cross-surface component,
  not specific to this page, so it was deliberately left untouched.
- *(Not verified live this pass.)*

---

### Directory Entry Detail page — follow-up bug-fix pass (double border, radius, lightbox; June 2026)

User-reported, from a live screenshot of `web.themoveee.com/directory/{slug}`: a double border
under the title area, inconsistent/no border-radius on boxes, and a request to make every image on
the page open in a lightbox. All three fixed in `apps/connect/app/directory.css` and
`apps/connect/app/directory/[slug]/page.tsx`.

- **Double border root cause**: `.dir-wiki-divider` (rendered in JSX immediately above the entry
  body) already draws the single intended rule (`border-top` + `margin: 24px 0`). `.dir-single-body`
  — a "legacy" class name (no `wiki` infix) that looks like dead fallback CSS but is actually still
  the live class used to render entry body HTML on this page — had its own independent
  `border-top: 1px solid var(--dir-border); padding-top: 36px;`, producing two stacked rules.
  Fixed by deleting both properties from `.dir-single-body`; `.dir-wiki-divider`'s own margin
  already provides the spacing. **Lesson: a class name implying "legacy/unused" doesn't mean it's
  dead — grep for actual JSX usage before assuming, especially in this file's "kept for fallback"
  section.**
- **Border-radius**: added/bumped radius on exactly the 5 `dir-wiki-*` box classes that belong to
  this page (confirmed via Grep that every other unradiused `2px` box in `directory.css` belongs to
  the separate directory listing/archive page or `/directory/submit`, out of scope) —
  `.dir-wiki-sidebar-card` (8px, was 0), `.dir-wiki-related-thumb` (2px→6px, kept smaller since it's
  only 36px), `.dir-wiki-improve` (8px, was 0), `.dir-wiki-work-card` (2px→8px),
  `.dir-wiki-infobox` (8px, was 0 — already has `overflow:hidden` so its featured image/rows clip
  cleanly to the new radius).
- **Lightbox**: new generic client component `apps/connect/app/directory/[slug]/DirectoryLightboxImage.tsx`
  — wraps any existing thumbnail markup (`className`/`style` passed through unchanged, so
  `next/image fill` layouts are unaffected), manages its own open state, closes on Escape or
  backdrop click, locks `document.body.style.overflow` while open, renders a fixed full-screen
  `rgba(20,17,13,0.9)` backdrop with a plain `<img>` at `maxWidth/Height: 92vw/92vh` + a close
  button. Wired onto all 5 images on the page: related-entries sidebar thumb, Selected Works card
  thumb, community review avatar, Upcoming Events list thumb, and the right-sidebar infobox
  featured image. **Three of these (related-entries thumb, Upcoming Events thumb) sit inside a
  `<Link>`** — the component's trigger `onClick` calls `e.preventDefault()` +
  `e.stopPropagation()` before opening, so clicking the image opens the lightbox instead of
  navigating; this guard is built into the component itself, so any future image wrapped in it
  is automatically Link-safe with no extra wiring. **If a future page needs an image lightbox,
  reuse this exact component rather than building a per-page one** — it's already generic
  (`src`/`alt`/optional `className`/`style`/`children`).
- *(Not verified live this pass.)*

---

### `react-native-iap` 12.16.4 breaks the iOS native build — pin to 12.16.3 exactly (August 2026)

A real EAS iOS production build failed at the native `fastlane`/Xcode compile step (not the JS
bundling step) with `value of type 'Transaction' has no member 'appTransactionID'`. Root cause:
`react-native-iap`'s native `ios/IapSerializationUtils.swift` reads a StoreKit 2
`Transaction.appTransactionID` property behind a guard that's wrong for what it's trying to do:

```swift
#if compiler(>=5.10)
if #available(iOS 15.2, tvOS 15.2, *) {
    result["appTransactionID"] = t.appTransactionID
}
#endif
```

`#if compiler(>=5.10)` checks the **Swift compiler** version, not whether the **StoreKit SDK**
the build is compiling against actually has this property yet — those aren't the same thing.
`appTransactionID` was added to `Transaction` in a StoreKit SDK newer than what EAS's build image
ships, but that image's Swift compiler is still `>=5.10`, so the guard passes and the code tries
to reference a symbol the SDK headers don't have — a hard compile error, not a runtime one.

Confirmed via `npm pack`+diff across every `12.16.x` patch that **`appTransactionID` was
introduced in `12.16.4` specifically** — `12.16.0` through `12.16.3` don't reference it at all
and build cleanly. `package.json` previously pinned `"react-native-iap": "^12.15.4"` (a caret
range), which silently resolved to the newest available `12.16.4` at lockfile-regen time — fixed
by pinning the **exact** version `"react-native-iap": "12.16.3"` (no caret), so a future
`package-lock.json` regen can't drift back onto the broken patch. Verified after the pin: the
resolved package's `ios/IapSerializationUtils.swift` has zero `appTransactionID` references, and
`npx expo export:embed --eager --platform ios --dev false` (the JS-bundling half of what EAS
runs) still succeeds — the native Xcode compile itself can only be verified by an actual EAS
build, not from this sandbox, so re-confirm the real `eas build --platform ios` output after
pulling this fix.

**If a future `npm update`/dependency bump ever moves `react-native-iap` off `12.16.3`**, check
whether the target version still has this broken guard before accepting the bump — search the
installed package for `appTransactionID` in `ios/IapSerializationUtils.swift`. If a `12.16.5+`
or `13.x` release ever properly fixes the availability guard (e.g. gates on the actual SDK/OS
version the property needs, not just the Swift compiler version), it's safe to move off this
pin; don't assume it's fixed without checking the actual guard condition, since the compiler
check alone isn't a reliable proxy for SDK contents.

---

### iOS native build failure — `fmt` library vs. newer Xcode/Clang `consteval` checking (fixed August 2026; the first fix attempt did nothing — corrected same day)

Once `react-native-iap` was pinned off the broken `12.16.4` (above), the next EAS iOS build hit a
**different** native compile error, in a completely unrelated dependency:

```
call to consteval function 'fmt::basic_format_string<...>::basic_format_string<FMT_COMPILE_STRING, 0>' is not a constant expression
```

Root cause: `fmt` 11.0.2 (a C++ formatting library — `react-native/third-party-podspecs/
fmt.podspec` pins this exact version and fetches it fresh from GitHub at `pod install` time, it's
never vendored in `node_modules`; pulled in transitively via `RCT-Folly`, a core React Native
native dependency, nothing in this repo depends on it directly) uses a C++20 `consteval`
constructor gated by its own compiler-version detection in `include/fmt/base.h`. That detection
only disables `consteval` for "Apple clang < 14" — the Clang shipped with the Xcode 26+ image
`eas.json`'s `build.production.ios.image: "latest"` now requires (Apple's App Store SDK
requirement, see the Google Play Billing section's iOS-submission context above) is far newer
than that cutoff, so fmt still enables `consteval` — but that specific newer Clang has a real
regression/incompatibility with this usage pattern that fmt 11.0.2's detection logic (written
before this Clang existed) has no way to know about.

**First attempt — a `GCC_PREPROCESSOR_DEFINITIONS` override defining `FMT_CONSTEVAL=` — changed
nothing and the exact same error recurred on the next build.** Root cause of *that* failure,
found by fetching fmt 11.0.2's real `include/fmt/base.h` from GitHub and reading it directly:
the entire detect-and-define block has **no `#ifndef` guard** —
```cpp
#if FMT_USE_CONSTEVAL
#  define FMT_CONSTEVAL consteval
#  define FMT_CONSTEXPR20 constexpr
#else
#  define FMT_CONSTEVAL
#  define FMT_CONSTEXPR20
#endif
```
`FMT_CONSTEVAL` gets unconditionally `#define`'d based on `FMT_USE_CONSTEVAL`'s computed value
(itself unconditionally defined a few lines above, same lack of guard) — so whatever value a
`-D`/`GCC_PREPROCESSOR_DEFINITIONS` compiler flag predefines gets silently overwritten the moment
the header's own `#define` executes, since redefining an already-`#define`'d macro without an
intervening `#undef` is exactly what happens here, and the *header's* definition (textually after
the command-line one, in preprocessing order) is the one that wins. This is why the compiler-flag
approach is a real, commonly-cited pattern that works for *many* libraries but did nothing here —
it only works when the target header itself has an `#ifndef` guard around its own definition,
and this one doesn't. **Lesson: verify a "standard community workaround" against the actual
source of the specific version in use before trusting it — don't assume a fix that works for
fmt/libraries in general applies unchanged to every version.**

**The fix that actually works**: patch the fetched `fmt` source file directly, post-checkout.
`apps/mobile/plugins/withFmtConstevalFix.js` (a `withPodfile` config plugin, same
`@expo/config-plugins` API family as the existing `withAndroidIapStoreFlavor.js`) injects Ruby
into the **existing** `post_install do |installer|` block Expo's own Podfile template already
generates (`post_install` runs after `pod install`'s download phase, so the fmt source is already
on disk by then). It locates the checked-out fmt pod via CocoaPods' `installer.sandbox.pod_dir
('fmt')` API (version/path-agnostic — doesn't hardcode a checkout path), globs for `base.h`, and
replaces the entire `#if FMT_USE_CONSTEVAL ... #endif` block above with an `#undef` followed by a
forced `#define FMT_USE_CONSTEVAL 0` / empty `FMT_CONSTEVAL`/`FMT_CONSTEXPR20` — since this comes
*after* fmt's own block in the same file, and uses `#undef` before redefining, it reliably wins
regardless of what fmt's own detection computes. This forces the exact same non-consteval
codepath that already compiled successfully on every pre-Xcode-26 build.

**Critical implementation detail — inject into the existing `post_install` block, don't add a
second one.** Expo's generated Podfile already defines one `post_install do |installer| ... end`
block (calling `react_native_post_install(...)`, essential to the RN build). CocoaPods' Podfile
DSL treats a second, separately-declared `post_install do |installer| ... end` as **overwriting**
the first, not accumulating — so appending a whole new block instead of inserting into the
existing one would have silently dropped `react_native_post_install(...)` and broken the build in
a much harder-to-diagnose way. The plugin's regex specifically targets the literal `post_install
do |installer|` opening line and inserts new lines immediately after it, inside the same block,
before the pre-existing `react_native_post_install(...)` call.

Registered last in `app.config.ts`'s `plugins` array (order doesn't matter here specifically,
since the regex anchor is a stable string none of the other plugins touch). Verified end-to-end
in this sandbox, not just syntax-checked: fetched the real fmt 11.0.2 `base.h` from GitHub,
confirmed the exact `#if FMT_USE_CONSTEVAL ... #endif` block text matches what the plugin's regex
targets, ran the **actual generated Ruby** (`ruby`, not a JS/Python simulation) against a copy of
that real file with a stubbed `pod_dir`, and confirmed the patched output forces
`FMT_USE_CONSTEVAL` to `0` / `FMT_CONSTEVAL` to empty exactly as intended. Also confirmed: the
full Podfile-level Ruby (existing `post_install` content plus the injection) is syntax-valid
(`ruby -c`), `npx expo config --json` loads the plugin with no errors, and `tsc --noEmit`/`expo
export:embed` show no regressions. **The actual native Xcode compile still needs a real EAS build
to give the final word** — this sandbox has no Xcode/CocoaPods toolchain, so nothing here can
execute the real `pod install` + Xcode compile end-to-end. If this exact error recurs after
pulling this fix, re-verify the regex still matches the *current* fmt version's `base.h` — a
future RN bump could pull in a different fmt version with a differently-shaped (but likely
equivalent) `#if FMT_USE_CONSTEVAL` block that no longer matches this plugin's exact-text regex,
silently making the injected patch a no-op again (the plugin doesn't currently warn if its `sub`
finds no match).
---

### Android build failure — duplicate `:sentry-react-native`/`:sentry_react-native` Gradle projects (September 2026)

A real EAS Android production build (`eas build --platform android --profile production`) got past
network/auth issues, dependency resolution, Metro bundling, and Sentry source-map upload, then
failed at the Gradle build step:
```
A problem was found with the configuration of task ':sentry_react-native:packageReleaseResources'
(type 'MergeResources').
  Reason: Task ':sentry_react-native:packageReleaseResources' uses this output of task
  ':sentry-react-native:generateReleaseResValues' without declaring an explicit or implicit
  dependency.
```
Earlier in the same log, both `:sentry-react-native:*` (hyphenated) and `:sentry_react-native:*`
(underscored) task graphs appear — two separate Gradle project registrations pointing at the exact
same physical folder, `node_modules/@sentry/react-native/android`.

**Root cause**: `@sentry/react-native` ships both a `react-native.config.js` (picked up by classic
React Native autolinking, which sanitizes the package name with underscores → `sentry_react-native`)
and an `expo-module.config.json` (picked up by Expo Modules autolinking, which sanitizes with
hyphens → `sentry-react-native`) — a known, documented class of bug (dual-autolinking discovery of
the same native module under two different project names; see
[kitten.sh/blog/autolinkings-broken-promise](https://kitten.sh/blog/autolinkings-broken-promise)),
only properly fixed by the unified autolinking resolver Expo shipped in **SDK 54**. This app is
deliberately pinned to **SDK 52** (see "Expo SDK version — critical" above — `react-native-passkeys`
0.4.0 and other pinned packages require it), so upgrading to get the real fix is out of scope.
Because both duplicate projects physically share one output directory, either one's resource-
packaging task can race the other's resource-generation tasks — Gradle 8.10's stricter task
validation now rejects that race as a hard failure instead of silently tolerating it.

**Fixed** with `apps/mobile/plugins/withSentryGradleTaskOrderingFix.js` (new, registered in
`app.config.ts`'s `plugins` array right after `withFmtConstevalFix`) — a `withProjectBuildGradle`
config plugin appending a `gradle.projectsEvaluated` block to `android/build.gradle` that declares
the missing `dependsOn` directly (Gradle's own suggested fix #2 for this exact error class).
Guarded with null-checks throughout (`findProject`/`tasks.findByName`) so it's a harmless no-op if
a future dependency bump removes the duplicate or renames either project, rather than failing the
build outright.

**First version only covered the exact task named in the original error
(`packageReleaseResources`, type `MergeResources`) — the very next build hit a *different*
consumer task racing the same producer output** (`extractDeepLinksRelease`, type
`ExtractDeepLinksTask` — also reads `generateReleaseResValues`'s `res/resValues` directory, and
Gradle validates per task *type*, not per producer, so each new consumer task type is its own
separate validation failure). Rather than keep enumerating exact task names one whack-a-mole round
at a time, the fix now makes **every task in the consumer project whose name matches the same
build variant** (Release/Debug) depend on the producer's `generateResValues`/`generateResources`
tasks for that variant — broader than Gradle's own minimal suggestion, but harmless (a few extra
ordering edges within one small, mutually-duplicate pair of projects), and it closes this class of
bug for good instead of one task name at a time. **If a third consumer-task-type failure somehow
still turns up, it means some other producer task besides `generateResValues`/`generateResources`
is being raced — check the new error's own "output of task X" line, since that's the new producer
to add to `producerTaskSuffixes`, not the consumer to add to an enumerated list.**

*(Not verified against a real Gradle/Android toolchain this pass. Re-run
`eas build --platform android --profile production` to confirm this clears the Gradle error.)*

**Real root cause found and fixed at source (September 2026) — everything above is a symptom, and
the ordering plugin is now expected to be inert.** Eight rounds of ordering fixes cleared every
`implicit_dependency` failure but then hit a real javac error,
`package io.sentry.react.expo does not exist`, in `:expo:compileReleaseJavaWithJavac`. A theory
that the two duplicates were not identical (that the Expo copy compiled a superset, making their
relative order load-bearing) was tested by flipping the order — the identical error recurred, which
disproved it and prompted actually downloading and reading the installed package instead of
reasoning about it. `:expo:compileReleaseJavaWithJavac` had in fact **never once succeeded** in any
build this session; the ordering work simply got far enough to reach a problem that was always
there.

What the package actually contains: `@sentry/react-native@8.24.0`'s `expo-module.config.json` is
`{"platforms":["android"],"android":{"name":"sentry-react-native-expo","path":"android/expo-handler"}}`
— the autolinking **3.x** schema (SDK 54+). `expo-modules-autolinking@2.0.8`, which SDK 52 pins,
reads neither `path` nor `name`: its only config key here is `android.gradlePath`
(`ExpoModuleConfig.androidGradlePaths()`), and its project names are derived mechanically from the
package name plus the gradle file's directory (`convertPackageWithGradleToProjectName`), never from
`android.name`. Both of Sentry's keys are therefore silently ignored, and it falls back to globbing
`*/build.gradle` **one level deep** (`findGradleFilesAsync`) — which matches `android/build.gradle`
but not `android/expo-handler/build.gradle`. So Expo links `:sentry-react-native` → `android/`, the
exact directory classic RN autolinking already links as `:sentry_react-native`. That is the
duplicate, and it is a schema-version mismatch, not the generic dual-autolinking bug the original
entry above blamed.

The missing class is the same misread, one step on: Expo's package-list generator scans the whole
linked source tree, so it finds `SentryExpoPackage.java` at `android/expo-handler/src/...` (which is
under `android/`) and writes it into the generated `ExpoModulesPackageList.java` — but the Gradle
project rooted at `android/` compiles only `android/src`, so the class is referenced and never
compiled.

**Fix**: one key in `apps/mobile/package.json` —
`"expo": { "autolinking": { "exclude": ["@sentry/react-native"] } }` (`exclude` is supported in
2.0.8, confirmed in `findModules.js`). This drops the package from **Expo** autolinking only;
classic autolinking still links `android/` and registers `RNSentryPackage`, so native Sentry crash
reporting is unaffected. The only thing lost is `SentryExpoPackage`, whose entire job (per its own
javadoc) is registering a `ReactNativeHostHandler` to catch native exceptions swallowed by Expo's
**bridgeless** error handling — and this app does not enable the New Architecture, so that handler
was inert here regardless.

**This supersedes the ordering plugin.** With no duplicate project, `withSentryGradleTaskOrderingFix.js`'s
`findProject` guards make it a no-op. It was deliberately left registered for the first build after
this fix so only one variable changed; once a production build is green, delete it and its entry in
`app.config.ts`'s `plugins` array. **If a duplicate `:sentry-*` project ever reappears, fix the
autolinking registration — do not re-derive ordering rules.** The same applies to any other package
that starts throwing `implicit_dependency` errors against itself: check whether its
`expo-module.config.json` uses a schema key this pinned autolinking version cannot read, before
assuming Gradle is at fault.

Verified by inspecting the real published tarballs (`@sentry/react-native@8.24.0` and
`expo-modules-autolinking@2.0.8` fetched from the npm registry) rather than by reasoning — this
sandbox has no `node_modules` and no Android toolchain, so the Gradle side still needs a real
`eas build --platform android --profile production` to confirm.

---

### `tsc --noEmit` in `apps/mobile` — React 18/19 type collision (fixed August 2026; the original fix broke a real production build — corrected same month)
In a full monorepo `npm install`, `react-native` (hoisted by npm to the **root** `node_modules`,
since nothing forces it local to `apps/mobile`) has its own bundled `.d.ts` files that do
`import * as React from 'react'`. Because those `.d.ts` files physically live under
`/node_modules/react-native/...`, TypeScript's classic (`Node10`) module resolution walks
**up from that location**, not from `apps/mobile/`, when it falls back to an `@types/<pkg>`
lookup — and lands on the monorepo root's `node_modules/@types/react` (v19, installed for
`apps/site`/`apps/connect`'s Next.js/React 19 apps) instead of `apps/mobile`'s own pinned
`@types/react` (v18.3, matching the Expo SDK 52 / `react@18.3.1` pin above). Two conflicting
global `ReactNode`/`JSX` declarations end up in one compilation — React 19's `ReactNode` type
added `bigint` as a member, React 18's didn't — so **every** JSX element in the app (`<View>`,
`<Text>`, etc.) fails with `TS2786: 'X' cannot be used as a JSX component ... Type 'bigint' is
not assignable to type 'ReactNode'`, cascading into 5,000+ near-duplicate errors from one root
cause. A plain `"types": ["react"]` restriction does **not** fix this — that only controls
*implicit* ambient `@types` inclusion, not this specific `@types` **fallback** step, which
ignores it.

**The original fix was wrong and broke a real production EAS build — do not reintroduce it.**
The first fix tried was a `"paths"` remap of the bare `"react"` specifier straight to
`./node_modules/@types/react` in `apps/mobile/tsconfig.json`, on the reasoning that this only
affects `tsc`'s type resolution. That reasoning was **wrong**: Expo SDK 52 bundles a Metro
version that also reads `tsconfig.json`'s `"paths"` for real, runtime JS module resolution — so
the remap redirected the actual `import React from "react"` used by every component in the app
to the types-only `@types/react` package (which has no runtime JS, just `.d.ts` files), and the
production iOS build failed at the Metro bundling step on EAS's servers with `While trying to
resolve module 'react' ... this package itself specifies a 'main' module field that could not be
resolved`. This sat undetected for a while because local `tsc --noEmit` checks (which this fix
was written for) don't exercise Metro at all, and no EAS build had been run since the fix was
added until this bit for real. **The doc previously claimed this was "sandbox-only, not a
runtime bug" — that claim was wrong; it was corrected after reproducing the exact EAS bundling
failure locally.**

**The actual, Metro-safe fix**: set `"typeRoots": ["./node_modules/@types"]` in
`apps/mobile/tsconfig.json`'s `compilerOptions`, and do **not** touch `"paths"` for `react` at
all (removed from `"paths"` entirely — that key should only ever carry the unrelated
`@moveee/utils/*` alias). `typeRoots` is TypeScript-only — Metro has no concept of it and never
reads it, so it cannot leak into JS bundling. It works by restricting where TS's `@types`
fallback search is allowed to look, which is enough to stop it from ever finding the monorepo
root's `@types/react` in the first place. Verified (August 2026 correction pass) against both
failure modes at once, with a real React 19 `@types/react` planted at the repo root to reproduce
the exact original conditions: `tsc --noEmit` stays at the same 35-pre-existing-error baseline
with zero bigint/JSX conflict errors, **and** `npx expo export:embed --eager --platform ios
--dev false` (the exact command EAS Build runs) succeeds and produces a real bundle. If this
resolution trick ever needs revisiting (e.g. after a dependency bump changes how `react-native`
or `@types/react` are laid out), re-run `npx tsc --noEmit --traceResolution | grep "Resolving
module 'react' from.*react-native"` to see exactly which `@types/react` copy wins — but **never
put `"react"` or `"react/*"` back into this file's `"paths"`**, regardless of what problem it
looks like it would solve; use `typeRoots`, `types`, or a different lever instead, and if none of
those work, test the fix against a real `expo export:embed`/EAS build before trusting it, not
just `tsc --noEmit` alone.

---

### `/shop` grid has no `orderby` and a hard 24-item cap with no pagination (fixed August 2026)

User-reported: "i have published products, how come they are not showing in the shop page?"
Root cause found in `packages/shared/lib/wp.ts`: `GET_PRODUCTS`/`GET_PRODUCTS_EXTRA`/
`GET_PRODUCTS_BY_VENDOR`/`GET_PRODUCTS_BY_VENDOR_EXTRA` all fetch `products(first: $first,
where: {...})` with **no `orderby` clause at all**, and `ShopArchiveWrapper.tsx` calls them
with a hard `first: 24` and no pagination anywhere in `ShopProductGrid.tsx` (no "Load more",
no offset param) — the grid only ever renders whatever 24 products WPGraphQL/WooGraphQL's
*default* ordering happens to return. With no explicit `orderby`, WooGraphQL's product
resolver falls back to WooCommerce's own catalog default sort (`menu_order` — effectively
random/by-ID among products that all share `menu_order = 0`, which is nearly every product
that was never manually reordered in WP Admin's drag-and-drop sorting screen), **not**
newest-first. A freshly published product has no reason to land inside that first-24 window
once a store has more than ~24 products, so it can be fully published, in-stock, and visible
in every other respect, and still never appear on `/shop`.

Fixed by adding `orderby: { field: DATE, order: DESC }` to all four queries' `where` clause
— same shape already used and confirmed working against the live schema by
`GET_NEWSLETTERS`/`GET_STORIES_BY_TAG` elsewhere in this file. This guarantees newly
published products always sort to the front, so they're inside the `first: 24` window
immediately after publish (subject to the KV cache flush below) regardless of total catalog
size — it does **not** add pagination/a "Load more" control, so a store with 25+ products
still only ever shows the newest 24 on `/shop` itself (individual products are still fully
reachable via `/shop/{slug}`, category pages, and search). If a full catalog needs to be
browsable beyond 24, that's a separate, larger pagination feature — out of scope for this fix.

**Other things to verify on the WordPress/Vercel side if a product still doesn't show after
this fix** (none of these are checkable from the codebase alone):
- **Product status is actually `publish`**, not `draft`/`pending` — WPGraphQL's `products`
  connection only returns `publish`-status products to unauthenticated requests, same as
  `posts`.
- **Catalog visibility isn't set to "Hidden"** (Publish box → "Catalog visibility: Edit" on
  the product edit screen) — a hidden product is real WooCommerce data but intentionally
  excluded from shop/search listings.
- **KV cache flush is actually configured and firing.** `product` is already in
  `class-culture-community.php`'s `flush_on_publish()`/`flush_vercel_kv_cache()`
  `$cacheable_types` list (see "Plugin DB table auto-upgrade"-adjacent caching docs above),
  so publishing a product should POST to `{site}/api/revalidate-kv` and clear every cached
  `wp:*` key. But `flush_vercel_kv_cache()` silently no-ops if
  `culture_vercel_site_url`/`culture_vercel_revalidate_secret` (WP options) aren't set, or if
  they don't match `WP_REVALIDATE_SECRET` on the target Vercel project — if that flush isn't
  actually reaching `/api/revalidate-kv`, a product published inside the last hour could still
  be served from a stale KV-cached empty/partial result (`getWPData()`'s default TTL is 3600s
  when no `options.revalidate` is passed, which is the case for every product query here).
  Confirm in WP Admin → Culture Community → General that both options are set and match the
  Vercel env vars, and check the Vercel function logs for `[kv-revalidate]` after a test
  publish.

Verified via `tsc --noEmit` (clean) on both `apps/site` and `apps/connect` (this file is
`packages/shared`, consumed by both).

---

### Magazine archive page — "The Edit" section gotcha (fixed June 2026)

`apps/site/components/EditorialSection.tsx` (renders "The Edit" hover-swap spotlight
block on `/magazine`) uses its own classname scheme (`.editorial`, `.editorial-inner`,
`.ed-left`, `.ed-grid`, `.ed-item`, `.ed-visual`, `.ek`, `.em`) that is **separate from**
the page's `mg-*` namespace in `magazine.css` — this is intentional (it's a
component-scoped style, not part of the archive's section-by-section `mg-*` system) but
it means **the CSS for this component must be added to `magazine.css` manually; it does
not come along "for free" when the rest of the `mg-*` system is touched.** A prior page
rebuild moved the whole archive to the `mg-*` system but never added equivalent rules for
`.editorial`/`.ed-*`, leaving the section completely unstyled (plain text, no card/image
layout) — and because `.ed-visual` had no `position: relative`, the absolutely-positioned
hover-swap `<Image fill>` elements and the ochre fallback tint inside it escaped to the
nearest positioned ancestor and visually overlapped unrelated sections elsewhere on the
page (looked like random "floating orange squares"). **Lesson: any container with an
absolutely-positioned child must itself be `position: relative` (or similar) — an
unstyled wrapper around `fill`/`inset: 0` elements doesn't just look unstyled, it lets
those children paint outside their intended box.** Also fixed: `EditorialSection.tsx`
referenced a `var(--ochre-deep)` CSS custom property that was never defined anywhere
(only a Tailwind utility class `bg-ochre-deep` exists, not a CSS var) — swapped to the
real `var(--ochre)` token. Separately, `.mg-nav-tabs` (the category tab row) lacked
`flex: 1 1 auto; min-width: 0`, so on category-heavy lists it could overflow past its
flex sibling `.mg-nav-filters` instead of scrolling within its own bounds — fixed the
same way. The Opinions & Essays section (`opinionStories` slice in
`MagazineArchiveWrapper.tsx`) is capped at 2 articles, not 6 — `.mg-op-grid` is already a
2-column grid so this needs no CSS change if the cap changes again.

**Superseded by the full archive redesign below (August 2026)** — `.editorial`/
`.editorial-inner`/`.ed-left`/`.ed-grid`/`.ed-item`/`.ed-visual`/`.ek`/`.em` no longer exist
anywhere in the codebase; "The Edit" is now `.mg-edit`/`.edit-mosaic`/`.edit-lead`/
`.edit-stack`/`.edit-row` (light, always-visible, no hover-swap). The rest of this entry
(the `position: relative` lesson, the `--ochre-deep` fix, the `.mg-nav-tabs` flex fix) is
still accurate and still applies.

---

### Newsletter single-issue reader (`/newsletter/[slug]`) — `.rd-layout` never cleared the floating header (fixed September 2026)

User-reported, with a screenshot: on `/newsletter/{slug}` (the full-viewport "reader" UI —
`IssueReaderClient.tsx`, sidebar + reading pane), the sitewide floating header pill visibly
overlapped page content — the logo/search icons sat on top of the sidebar's own logo and "Browse
all N issues…" text, and the sticky "Issue N°X" badge in the top-right of the reading pane sat
directly behind the header's cart/menu icons.

**Root cause**: `.rd-layout` (`apps/site/app/newsletter.css`) is a full-viewport app-shell —
`height: calc(100svh - 64px); overflow: hidden`, with the sidebar and reading pane as `height:
100%` flex children — that predates the "WePresent concept" floating-pill header redesign (see
that section above). Every other page's first section on this site carries an explicit
`padding-top: var(--header-clear, 96px)` (documented at length in `globals.css`, right where
`--header-clear: 96px` is defined) specifically because the header is `position: fixed` with no
layout space reserved for it — `.rd-layout` never got this treatment on desktop; only the
`max-width: 768px` mobile override had a (correct, working) `padding-top: var(--header-clear,
96px)`. Since `.rd-sidebar-header` and the sticky `.rd-issue-badge` (`position: sticky; top: 20px`
inside `.rd-pane`) both anchor to the very top of this uncleared box, they rendered directly under
the fixed header instead of below it — the `- 64px` in the old height calc was a stale leftover
from some earlier, shorter, non-floating header design, not a header-clearance offset at all.

**Fixed** by giving `.rd-layout` `margin-top: var(--header-clear, 96px)` and changing its height
calc to `calc(100svh - var(--header-clear, 96px))` (was `- 64px`) — margin (not padding) so the
box's own `height: 100%` children still fill exactly down to the bottom of the viewport, just
starting below the header instead of at `y: 0`. The existing `max-width: 768px` override's own
`padding-top: var(--header-clear, 96px)` was removed (would have doubled the offset once stacked
with the new base-rule `margin-top`) — that breakpoint now only needs to flip the layout from a
fixed-height flex row to a normal-flow column; the base rule's `margin-top` already does the
clearance work for it too.

*(Not verified live this pass — this page is fully client-rendered, so it can't be checked offline.
Re-check `/newsletter/{any-slug}` in a real browser at both desktop and the 768px breakpoint.)*

---

### Directory REST fallback — oversized `_embed=1` response broke Next's data cache and tripped a real production build failure (fixed September 2026)

A live Vercel production build (on `main`) failed outright: WordPress/WPGraphQL calls during
static generation started timing out (`Network or Parsing Error: This operation was aborted`),
which tripped the KV-backed circuit breaker (see "Server stability fixes" above —
`[circuit-breaker] CMS circuit opened (shared) for 60s after 3 failures`). While the CMS was
struggling, one fetch stood out in the logs: `Failed to set Next.js data cache for
.../wp-json/wp/v2/culture_directory?per_page=100&_embed=1..., items over 2MB can not be cached
(5525442 bytes)`. Because that response could never be cached, it was refetched in full on every
build worker that needed it — real added load on an already-struggling CMS, not just a log
warning. `/directory/[slug]` pages then blew past their 60s-per-attempt budget three times each
(`Failed to build /directory/[slug]/page: /directory/spoken-word-poetry after 3 attempts`) and the
build exited nonzero.

**Root cause**: `getDirectoryEntriesWithFallback()` in `packages/shared/lib/wp.ts` — the REST
fallback path used only when WPGraphQL returns zero entries (i.e. exactly when the CMS is already
having trouble, the worst possible time to make the fetch heavier) — requested
`per_page=100&_embed=1` with no `_fields` filter. `_embed=1` embeds the **full, unstripped**
`content` field on every one of the 100 posts to pull in featured media + taxonomy terms, but
`mapRestDirectoryToFrontendShape()` right below it never reads `content` at all — only
`id`/`slug`/`title`/`date`/`excerpt`/`acf`/`meta` plus the embedded media/term objects. 100 posts'
worth of full rich-text bodies is exactly the kind of payload that blows past Next's 2MB
per-entry data-cache ceiling.

**Fixed** by adding `&_fields=id,slug,title,date,excerpt,acf,meta,_links,_embedded` to the
fallback URL — WP core REST's `_fields` param whitelists top-level response fields (dropping the
unused `content`, `guid`, `type`, etc.), which is enough on its own to bring a 100-post response
back under 2MB. **`_links`/`_embedded` must be listed explicitly in `_fields`** — WP applies field
filtering *after* embedding, so without those two names in the list, `_fields` strips the embedded
media/terms data right back out along with everything else, silently breaking every directory
card's image and type badges.

**The same pattern likely exists in every other `_embed=1` REST-fallback fetch in this file**
(`culture_newsletter?per_page=${first}&_embed=1`, `posts?country=...&_embed=1`,
`posts?issues=...&per_page=100&_embed=1`) — none were touched in this pass since only the
directory one was the one actually observed failing in production, but if a future build failure
shows the same "`_embed=1`... items over 2MB can not be cached" warning against a different REST
fallback URL, apply the identical `_fields` fix there rather than re-diagnosing from scratch.

*(Not verified live this pass.)*

**Follow-up — the `_fields`-only fix above was not actually enough (confirmed by a real
production build failure, September 2026).** A live Vercel build showed the exact same failure
mode against the exact same, already-`_fields`-trimmed URL: `Failed to set Next.js data cache for
.../culture_directory?per_page=100&...&_fields=id,slug,title,date,excerpt,acf,meta,_links,_embedded,
items over 2MB can not be cached (2944629 bytes)` — down from the original 5.5MB, but still over
the 2MB ceiling, still uncacheable, and it still cascaded into the identical
`/directory/[slug]` 60-second-timeout-×3 build failure this section originally documented as
fixed. **Root cause of the shortfall**: `_fields` only filters *top-level* response fields — it
has no way to trim what's nested inside an embedded object. `_embed=1`'s `wp:featuredmedia` entry
is the *entire* attachment object (every registered image size's url/width/height/mime,
description, caption, author, its own `_links`, etc.), and that alone is enough to push 100 posts
back over 2MB even with `content`/`guid`/`type` already stripped from the top level. **Actually
fixed** by capping `per_page` from 100 down to 50 (on top of, not instead of, the `_fields` trim)
— halving the entry count roughly halves the payload, landing with real margin under the 2MB
ceiling instead of hovering just over it regardless of which posts happen to be in the batch. If
this exact "`_fields` is already applied but the response is still uncacheable" symptom recurs
here or on any of the other `_embed=1` fallback fetches this section already flagged as sharing
the pattern, don't reach for `_fields` again — it's already doing everything it can; lower
`per_page` instead.
