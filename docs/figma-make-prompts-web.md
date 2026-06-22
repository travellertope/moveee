# Figma Make Prompts — Moveee Webapp (Site A + Site B)
## Web-only Screen Prompts for themoveee.com and web.themoveee.com

> **Important — Read First:**
> Figma Make generates **interactive React/TypeScript prototypes** (running code), not static Figma frames.
> It is a prompt-to-prototype tool — ideal for click-through testing and stakeholder demos.
>
> If your goal is **editable Figma design files** with native components (for design handoff),
> use **Figma First Draft / Figma Agent** instead and paste these same prompts there.
> Both tools live inside Figma — First Draft is in the Plugins/AI menu; Make is a separate canvas.
>
> This guide covers both workflows. The prompts work for either tool.
>
> **This file is the webapp counterpart to `docs/figma-make-prompts.md`** (mobile-only, §0–17 +
> Appendix). Every prompt in this file targets `apps/site` (themoveee.com, Site A — Editorial +
> Shop, no auth) or `apps/connect` (web.themoveee.com, Site B — Community + Auth). Sections here
> are numbered independently of the mobile file — start at §1, not §18 — since webapp screens will
> keep growing as their own catalog separate from the mobile design system.

---

## TOOL CHOICE GUIDE

| Goal | Tool |
|------|------|
| Click-through prototype, stakeholder demo, code export | **Figma Make** |
| Editable design file, component library, design system | **Figma First Draft / Figma Agent** |
| Best of both | Generate with First Draft → link frames into a Make prototype |

**For this guide, all prompts are optimised for Figma Make (interactive prototypes).**
They follow Figma's recommended TC-EBC framework: **Task · Context · Elements · Behaviour · Constraints.**

---

## HOW TO USE THIS GUIDE

1. Open Figma → Click **"Make"** in the left sidebar (or Plugins → Figma AI → First Draft for editable frames)
2. Work through screens **one section at a time** — paste each prompt block as a new Make session.
3. After generation, use short targeted follow-up prompts to refine individual frames.
4. The **point-and-edit tool** in Make lets you adjust individual elements without spending a prompt.
5. For shared design-system primitives (buttons, inputs, cards) and dark-mode/skeleton-state
   conventions, see `docs/figma-make-prompts.md` §0–1, §14 — those apply equally to web; this file
   only covers screens/sections that are web-specific or web-first.

---

## QUICK REFERENCE — SITE A (themoveee.com) BRAND TOKENS

| Token | Value | Usage |
|-------|-------|-------|
| paper | `#FFFFFF` | Card surfaces, page bg |
| paper-deep | `#F2F2F2` | Subtle card/section backgrounds |
| ink | `#14110D` | Primary text, icons |
| ink-soft | `#3A342B` | Body text |
| mute | `#7A6F5C` | Secondary text |
| rule | `#2A241C` | Borders |
| ochre | `#C5491F` | Primary CTA, actions |
| ochre-deep | `#8A2D10` | Hover/pressed state |
| gold | `#B38238` | Moveee Pro / membership-tier signifiers only |
| Headline font | Fraunces (serif) | Titles, display text |
| Body font | DM Sans | UI labels, body |
| Mono font | JetBrains Mono | Kickers, timestamps, meta |
| Card radius | sm=2px / md=4px / lg=6px / xl=12px / 2xl=20px / full=9999px | |
| Desktop frame width | 1440px | Standard desktop |
| Mobile companion width | 390px | Responsive companion frame |

**Site B (web.themoveee.com, Connect) uses a separate warm palette** — paper-warm `#F3ECE0` bg,
ghost `#C8BFB0`, success `#2D6A4F` — used only where a prompt explicitly bridges into Site B's
visual language (e.g. §1's Moveee marketing zone below). Default to the Site A tokens above
unless a prompt says otherwise.

---

## 1. WEB HOMEPAGE — MOVEEE AS COMMUNITY/DISCOVERY PLATFORM, MAGAZINE AS ITS ARM (Site A, themoveee.com)

> **Note on scope:** every other section in this document targets the mobile app (390×844px
> iOS frames). This section is different — it's a **responsive web redesign** for
> `apps/site` (themoveee.com), so frames are specified at **desktop 1440px** with a
> **mobile 390px** companion frame per screen. Use the same Figma Make / First Draft workflow.

### Brand architecture (read this before writing or designing anything below)

- **Moveee** is the product — the community and discovery platform. It is never called
  "the app" or "an app" in any visible copy; it is always just **Moveee**. Moveee is what
  this homepage leads with.
- **Moveee Magazine** is the editorial arm — the publication this site already runs. It
  gets its own clearly-labelled section lower on the page, including a spotlight of the
  latest issue, but it is not the lead story anymore.
- Internal tier names (**Connect Citizen** / **Connect Pro**) are unchanged — this is a
  platform-brand change, not a membership-tier rename.
- No geography- or identity-based audience language anywhere on this page. Moveee covers
  culture globally; copy describes content categories (music, food, film, style, ideas),
  never an audience's identity or region.

### Why this section exists

themoveee.com today is a magazine homepage with one thin, late-page mention of "Connect"
(an `id="connect"` block buried below several editorial modules — see
`apps/site/components/HomepageContent.tsx`). It undersells what Moveee actually is — a
community that rewards people for actively participating in culture, not just reading about
it — and buries the one product visitors should be funnelled toward. This redesign flips
the hierarchy: Moveee leads, the magazine becomes a clearly-positioned arm with its own
spotlight moment further down the page.

### Marketing copy (final — use verbatim in the prompt; do not let Figma Make invent its own)

**HERO**
- Eyebrow: `A COMMUNITY THAT REWARDS YOU FOR BEING AN ACTIVE PART OF CULTURE`
- H1: `Moveee for culture. Discover and engage.`
- Subhead: `Post the spot before it's cool. Call the next big thing. Rate, react, debate —
  every contribution builds your standing and earns you real rewards. Moveee is where
  culture happens with you in it, not just in front of you.`
- Primary CTA: `Join Moveee`
- Secondary CTA: `See how it works`
- Trust line (small, under CTAs): `Free to join · iOS & Android · No spam, ever`

**"WHAT IS MOVEEE" INTRO**
- Eyebrow: `MOVEEE`
- H2: `Your taste, with receipts.`
- Body: `Moveee is a community and discovery platform built for people who find the spot
  before it's cool, have a take on every new release, and want it to count for something.
  Post a hidden gem. Rate the meal. Call the next big thing. Every contribution builds your
  standing — and earns Culture Credits (Cr) you can spend on real perks from brands that
  get it.`
- Link: `See how it works →`

**FEATURE GRID (6 cards — title / one-line hook / body)**
1. Pulse Feed — *Nine ways to share* — `A hidden gem. A hot take. A poll. An itinerary.
   Post however the moment calls for it — not just another caption.`
2. Culture Credits & Reputation Points — *Get rewarded for having taste* — `Every post,
   comment and validated tip earns Culture Credits (Cr). Build Reputation Points (Pt) and
   climb from Member to Culture Authority — title and all.`
3. Partner Perks & Wallet — *Spend it, or cash it out* — `Redeem Culture Credits (Cr) for
   real discounts at partner spots across the city, or convert them straight to cash.`
4. Discover — *The map only the community could write* — `People, places, dishes, films,
   movements — a living archive, browsable by type and city.`
5. Events — *Know what's actually happening* — `RSVP to the shows, pop-ups and talks
   worth your night — curated by us, submitted by you.`
6. Daily Games — *Keep your culture IQ sharp* — `Trivia and Who Said It? — two minutes a
   day, bragging rights forever.`

**MEMBERSHIP TEASER**
- Eyebrow: `MEMBERSHIP`
- H2: `Free to join. More for the obsessed.`
- Citizen card — `Connect Citizen — Free` — `Post to the feed, browse Discover, RSVP to
  events, and get our newsletters — GetMeLit and Culture Drop — straight to your inbox.`
- Pro card — `Connect Pro — from [PRICE]/mo` — `Everything in Citizen, plus exclusive
  patron stories, 10% off the shop with early access to every drop, and first access to new
  features before anyone else.`
- CTA: `Compare plans` (Citizen) / `Upgrade to Pro` (Pro)

**JOIN MOVEEE — DOWNLOAD MOMENT (near footer)**
- Eyebrow: `JOIN MOVEEE`
- H2: `Carry the culture in your pocket.`
- Body: `Moveee is free on iOS and Android. Download it, claim your handle, and start
  earning from your first post.`
- App Store + Google Play badges + QR code (desktop only, "Scan to download")

**MOVEEE MAGAZINE SPOTLIGHT (the editorial arm — positioned after the Moveee zone, before
the existing Latest Issue / Interviews / Shop modules)**
- Eyebrow: `MOVEEE MAGAZINE — OUR EDITORIAL ARM`
- H2: `The reporting behind the community.`
- Body: `Everything Moveee's community surfaces starts somewhere — Moveee Magazine is our
  independent editorial team covering the music, film, art, fashion, food and ideas worth
  knowing about.`
- Latest Issue card (real spotlight module, not a text link): issue cover image, issue
  title + dek, issue number/date, `Read the latest issue` primary CTA.
- Secondary link: `Browse the archive →`

⚠️ **DEV ANNOTATION REQUIREMENT** — add `<!-- DEV: <note> -->` comments at these points:
  1. Above the hero CTAs: `"DEV: 'Join Moveee' routes to a new /app or /download landing
     route (does not exist yet) that should detect OS via user-agent and deep-link to the
     correct store; fall back to a simple page with both badges + QR for desktop. 'See how
     it works' anchors to the 'What is Moveee' intro block on this same page (#what-is-moveee)."`
  2. Above the App Store / Google Play badges: `"DEV: Store URLs do not exist yet — app is
     not published. Use placeholder badge graphics and wire real store IDs at launch; do not
     hardcode a fake App Store ID."`
  3. Above the Membership teaser pricing: `"DEV: Do not hardcode the Pro price — reuse the
     existing <PatronPrice /> component (apps/site/components, already used in the current
     Connect CTA block) so currency/locale logic stays centralised."`
  4. Above the feature grid: `"DEV: This section replaces the existing thin #connect block
     in HomepageContent.tsx — same anchor id should be preserved if anything else in the
     site links to #connect."`
  5. Above the whole new "Moveee zone" (Hero through Join Moveee download strip):
     `"DEV: This zone intentionally uses the warm paper token (#F3ECE0) to bridge Site A's
     white magazine background with Site B/Connect's visual language — do NOT change the
     global --paper CSS variable (apps/site/app/globals.css), scope the warm background to
     this section locally instead."`
  6. Above the Moveee Magazine Spotlight / Latest Issue card: `"DEV: Wire the Latest Issue
     card to the same data source as the existing Latest Issue module further down the page
     (getNewslettersWithFallback / latest culture_edition query in lib/wp.ts) — do not
     duplicate the fetch, reuse the already-fetched latest-issue data passed into
     HomepageContent.tsx so this card and the existing Latest Issue module never go out of
     sync."`

---

### PROMPT 1 — Homepage Hero + Moveee Marketing Zone + Magazine Spotlight (Desktop 1440px + Mobile 390px)

```
Senior web UX/UI designer — themoveee.com homepage redesign. Desktop frame 1440px wide,
companion mobile frame 390px wide, same content, stacked layout.
Brand tokens — MAGAZINE zone (existing, unchanged): white #FFFFFF bg, ink #14110D text,
ochre #C5491F accent, Fraunces (display) + DM Sans (body) + JetBrains Mono (kickers/meta).
Brand tokens — NEW MOVEEE ZONE (this prompt): paper-warm #F3ECE0 bg, white cards,
ochre #C5491F, gold #B38238, ghost #C8BFB0, mute #7A6F5C, success #2D6A4F.
Radius: sm=2px, md=4px, lg=6px, xl=12px, 2xl=20px, full=9999px.
Shadow-card: 0px 1px 3px rgba(20,17,13,0.08), 0px 1px 2px rgba(20,17,13,0.04).

CONTEXT: themoveee.com is an editorial homepage today (cover story, latest issue, shop,
newsletter). Moveee — the community and discovery platform — is now the lead product;
the magazine is its editorial arm. This prompt covers: a new top section that leads with
Moveee, and a new "Moveee Magazine" spotlight section that hands off to the existing
editorial modules with a real Latest Issue feature card (not just a text link). Everything
below the Magazine Spotlight (Interviews, Shop, series strips, footer) stays exactly as it
is today — this prompt replaces the old hero and the old thin "Connect CTA" block, and
inserts the new Magazine Spotlight directly above the existing Latest Issue module.

Use the marketing copy supplied above VERBATIM — do not paraphrase or invent new headline
copy. Bracketed placeholders like [PRICE] should render as literal bracketed text so it's
obvious to the engineer that real data needs to be wired in.

---

FRAME 1 — DESKTOP HERO (1440×720px, paper-warm #F3ECE0 bg — Moveee zone, this prompt's
new token set):

Split layout, 2 columns (60/40):
  LEFT COLUMN (60%, 64px left padding):
    Eyebrow: "A COMMUNITY THAT REWARDS YOU FOR BEING AN ACTIVE PART OF CULTURE"
      JetBrains Mono 11px bold ochre uppercase, letter-spacing 1px.
    H1: "Moveee for culture. Discover and engage." Fraunces 56px bold ink,
      line-height 1.05, max-width 640px, 16px top margin.
    Subhead: full copy block from above, DM Sans 18px ink-soft, line-height 1.5,
      max-width 560px, 20px top margin.
    CTA ROW (24px top, 16px gap):
      Primary: "Join Moveee" — ink fill white text, radius-full, 56px height,
        20px horizontal padding, DM Sans 15px bold.
      Secondary: "See how it works" — ochre border ochre text, radius-full, 56px height,
        same padding, white bg.
    Trust line: "Free to join · iOS & Android · No spam, ever" JetBrains Mono 11px ghost,
      12px top margin.
  RIGHT COLUMN (40%): Lively composite visual of the Pulse feed / community in action
    (post cards, reactions, a badge unlock) — full-bleed to frame edge, slight ink gradient
    overlay bottom-left for legibility if any text overlaps.

---

FRAME 2 — DESKTOP "WHAT IS MOVEEE" + FEATURE GRID (1440×900px, paper-warm #F3ECE0 bg
continues, full-bleed section, 80px vertical padding), anchor id `#what-is-moveee`:

INTRO BLOCK (centred, max-width 720px, centred horizontally):
  Eyebrow: "MOVEEE" JetBrains Mono 11px bold ochre uppercase, centred.
  H2: "Your taste, with receipts." Fraunces 40px bold ink, centred, 12px top.
  Body: full copy block, DM Sans 17px ink-soft, centred, line-height 1.5, 16px top.
  Link: "See how it works →" DM Sans 14px bold ochre, centred, 16px top.

FEATURE GRID (3 columns × 2 rows, 64px top margin, 24px gap, max-width 1200px centred):
  FEATURE CARD (white fill, radius-xl, shadow-card, 32px padding):
    Icon/emoji 32px (top): 🌊 Pulse Feed · 🏆 Culture Credits & Reputation Points · 🎁
      Partner Perks & Wallet · 🧭 Discover · 📅 Events · 🎮 Daily Games.
    Title: DM Sans 12px bold ochre uppercase, 16px top.
    Hook: Fraunces 20px bold ink, 6px top (the italic "hook" line from the copy above, e.g.
      "Nine ways to share").
    Body: DM Sans 14px ink-soft, line-height 1.5, 8px top, 3 lines max.
  Fill all 6 cards with the exact feature copy supplied above, in the order listed.

---

FRAME 3 — DESKTOP MEMBERSHIP + JOIN MOVEEE DOWNLOAD (1440×640px, paper-warm bg continues,
80px vertical padding, ghost top border separating from Frame 2's section):

MEMBERSHIP TEASER (max-width 1000px, centred):
  Eyebrow + H2 centred, same style as Frame 2's intro block: "MEMBERSHIP" /
    "Free to join. More for the obsessed."
  2 CARDS side by side (480px each, 24px gap):
    CITIZEN CARD (white fill, radius-xl, shadow-card, 32px padding):
      "Connect Citizen" Fraunces 22px bold ink + "Free" DM Sans 14px bold ochre pill inline.
      Body copy, DM Sans 14px ink-soft, line-height 1.5, 12px top.
      "Compare plans" ghost-border button, full width, 48px, radius-full, 20px top.
    PRO CARD (ink fill #14110D bg, radius-xl, shadow-card, 32px padding, gold 2px border):
      "Connect Pro" Fraunces 22px bold white + "from [PRICE]/mo" DM Sans 14px bold gold
        pill inline.
      Body copy, DM Sans 14px white/85% opacity, line-height 1.5, 12px top.
      "Upgrade to Pro" gold fill ink-text button, full width, 48px, radius-full, 20px top.

JOIN MOVEEE DOWNLOAD STRIP (64px top margin, white card, radius-2xl, shadow-card,
  full-width max 1200px centred, 48px padding, split layout):
  LEFT: "JOIN MOVEEE" JetBrains Mono 11px bold ochre uppercase + "Carry the culture in
    your pocket." Fraunces 28px bold ink, 8px top + body copy DM Sans 15px ink-soft, 12px top.
  RIGHT: App Store badge (140×42px placeholder, radius-md) + Google Play badge (same size)
    side by side, 12px gap + small 80×80px QR code placeholder right of the badges, "Scan
    to download" JetBrains Mono 9px mute centred below QR.

---

FRAME 4 — DESKTOP MOVEEE MAGAZINE SPOTLIGHT (1440×560px, white bg — back to magazine zone,
unchanged token set, sits directly above the existing Latest Issue module):

INTRO BLOCK (left-aligned, max-width 600px, 64px left padding):
  Eyebrow: "MOVEEE MAGAZINE — OUR EDITORIAL ARM" JetBrains Mono 11px bold ochre uppercase.
  H2: "The reporting behind the community." Fraunces 36px bold ink, 12px top.
  Body: full copy block, DM Sans 16px ink-soft, line-height 1.5, 16px top.

LATEST ISSUE CARD (right side, 560px wide, white card, radius-xl, shadow-card, ghost 1px
  border, split internally — image left 220px, text right):
  Cover image (220×280px, radius-lg, object-fit cover).
  Issue label: JetBrains Mono 10px mute uppercase (e.g. "ISSUE 14 — JUNE 2026").
  Issue title: Fraunces 22px bold ink, 8px top, max 2 lines.
  Issue dek: DM Sans 13px ink-soft, line-height 1.4, 8px top, max 2 lines.
  "Read the latest issue" ink fill white text button, radius-full, 44px height, 20px top.
  "Browse the archive →" DM Sans 13px bold ochre link, 12px top, below the button.

---

FRAME 5 — MOBILE COMPANION (390px wide, single scrolling stack, all 4 frames condensed):
  Hero: stacked (text block, then visual below, full-width), CTAs full-width stacked not
    side-by-side.
  Feature grid: single column, 1 card per row, full-width.
  Membership cards: stacked vertically, full-width each.
  Join Moveee download strip: badges stacked vertically, full-width, QR code centred
    below both.
  Magazine Spotlight: stacked (intro text, then Latest Issue card full-width below it,
    image on top of card, text below image instead of side-by-side).

---

Output 5 frames: Desktop Hero, Desktop Feature Zone, Desktop Membership + Download,
Desktop Magazine Spotlight, Mobile Companion (full stack).
```

---

## 2. SHOP/LIFESTYLE HOMEPAGE — STANDARD MARKETPLACE REDESIGN (Site A, themoveee.com/shop)

> **Note on scope:** like §1, this is a **responsive web redesign** for `apps/site`
> (themoveee.com), not mobile — frames are specified at **desktop 1440px** with a
> **mobile 390px** companion frame. This covers the `/shop` homepage only
> (`apps/site/app/shop/ShopArchiveWrapper.tsx` + `shop.css`) — the product detail page,
> brand storefront pages (`/shop/brand/[slug]`), and "The Moveee Edit" curated page
> (`/shop/edit`) are out of scope for this prompt and keep their current design.

### Brand architecture (read this before writing or designing anything below)

- This redesign stays entirely inside Site A's **existing magazine/shop token set** — do
  NOT introduce §1's paper-warm `#F3ECE0` Moveee-zone tokens here. The shop is a Site A
  surface, not a Site A/Site B bridge: white `#FFFFFF` bg, paper-deep `#F2F2F2` card bg,
  ink `#14110D` text, ink-soft `#3A342B` body copy, mute `#7A6F5C` secondary text, rule
  `#2A241C` borders, ochre `#C5491F` primary accent, ochre-deep `#8A2D10` hover/pressed,
  gold `#B38238` reserved for member/Pro-tier signifiers only (matches its use elsewhere
  as a membership-tier color). Fraunces (display/serif) + DM Sans (body/sans) +
  JetBrains Mono (kickers/labels/meta), same as every other Site A surface.
  "Vetted" trust pips, the ticker strip, and the Editorial Bridge modules already use
  these tokens correctly — keep that visual language, this prompt extends it rather than
  replacing it.
- "Moveee" is never called "the marketplace" or "the store" in visible copy — it's the
  "Moveee Lifestyle Shop", shortened to "Shop" in nav contexts. "Connect" never refers to
  this page or its members teaser — per the project's naming convention, "Connect" now
  belongs to Literati Connect; the existing "Connect Member Band" module (section 10 of
  the current page) is renamed "Moveee Member Band" in this redesign and its copy updated
  to drop "Connect Members" in favour of "Moveee members" / "Moveee Pro" — bring the page
  in line with the rest of the rebrand while we're touching it.

### Why this section exists

The current `/shop` homepage (read directly from `ShopArchiveWrapper.tsx`) is a strong
*editorial* shop page — masthead, ticker, Editorial Picks, two magazine/journal bridges, a
product grid, a category grid, a vendor strip, a membership band, an Origins bridge — but
it is missing the load-bearing mechanics that make a craft marketplace feel like a
marketplace rather than a lookbook:

- **No search at all.** There is no search input anywhere on the page or in
  `ShopFilterBar.tsx` — a visitor who knows what they want has no way to type it in.
- **Sort and view-toggle exist in the UI but do nothing.** `ShopFilterBar.tsx`'s
  `onSortChange`/`onViewChange` callbacks are typed and the `<select>`/buttons render, but
  `ShopArchiveWrapper.tsx` never passes them in — selecting "Price: Low–High" or the list
  icon is currently a no-op.
- **No faceted filtering.** Category is the only filter axis (via `ShopFilterBar`'s tabs);
  there's no price range, material, maker location, or in-stock-only filter — every
  leading craft marketplace (Etsy chief among them) leans on faceted search as a primary
  discovery mechanic, not just category tabs.
- **No trust/social-proof signal on individual product cards.** The "★ Vetted" pip is
  global flavour text repeated on every card — there are no review counts, ratings, or
  "X sold" signals, which is the single most common trust pattern on craft marketplace
  product cards (Etsy, Not On The High Street, Folksy all surface this directly on the
  card, not just on the PDP).
- **Pro pricing is invisible until checkout.** `GET_PRODUCT_EXTRA` already resolves a
  `memberPrice` field (see `packages/shared/lib/wp.ts`), but no homepage card displays it —
  Moveee Pro's "10% off every purchase" perk (already advertised in the Member Band module
  itself) is not shown anywhere a Pro member is actually browsing.
- **The Vendor Strip and `/makers` directory duplicate the same data with no obvious
  relationship.** `extractVendors()` in `ShopArchiveWrapper.tsx` builds vendor cards purely
  by grouping the current product set by vendor name, separately from the dedicated
  `/makers` and `/makers/[slug]` editorial maker-profile pages and the shop's own
  `/shop/brand/[slug]` storefronts — three surfaces, the same underlying vendor data, no
  shared "maker spotlight" treatment. This redesign doesn't attempt to merge those routes
  (out of scope), but gives the homepage's own Maker spotlight module a clearer, more
  marketplace-standard "Shop by Maker" framing.

This redesign keeps every section of the current page that already works (masthead,
ticker, Editorial Picks, both Editorial Bridges, Category Grid, Origins Bridge) and adds
the missing marketplace mechanics around them: a real sticky search + faceted filter bar,
functional sort, trust signals and Pro pricing on every card, and a sharper "Shop by
Maker" framing for the vendor strip.

### Marketing copy (final — use verbatim in the prompt; do not let Figma Make invent its own)

**STICKY SEARCH + FILTER BAR**
- Search placeholder: `Search makers, materials, or pieces…`
- Filter pill labels (left to right): `Category`, `Price`, `Material`, `Maker Location`,
  `In Stock Only`
- Sort dropdown options: `Featured`, `Newest`, `Price: Low–High`, `Price: High–Low`,
  `Most Loved`
- View toggle: grid icon / list icon (unlabelled, as today)

**MASTHEAD (unchanged from current page — reproduced here for completeness, do not alter)**
- H1: `Moveee Lifestyle` (or the active category/tag/maker name when filtered)
- Body: `Every piece chosen for craft, longevity, and the story behind it. Every maker on
  Moveee is personally vetted for craft integrity, fair production, and lasting quality.`

**TRUST STRIP (new — sits directly under the masthead, above the ticker)**
- Four trust badges, icon + label + one-line proof point:
  1. `✓ Vetted Makers` — `Every maker personally reviewed before their first listing.`
  2. `★ 4.8 average rating` — `Across 1,200+ verified buyer reviews.`
  3. `↺ Free Returns` — `30 days, no questions asked.`
  4. `◇ Moveee Pro saves 10%` — `Automatically applied at checkout for members.`

**PRODUCT CARD — PRO PRICING (applies to every card in the redesigned grid)**
- Standard price shown as today (e.g. `£68`).
- When `memberPrice` is present on the product: a second line below it, smaller, gold
  text: `£61.20 with Moveee Pro` — always phrased as "[member price] with Moveee Pro",
  never "Pro price" alone, so logged-out visitors understand what unlocks it.

**PRODUCT CARD — TRUST SIGNAL (replaces the repeated static "★ Vetted" pip as the *only*
signal — keep the Vetted pip, add a second line below the price)**
- Rating + review count line: `★ 4.9 (38)` — DM Sans 12px, mute colour, shown only when
  the product has at least one review; cards with zero reviews show `New listing` in its
  place (JetBrains Mono 10px uppercase, ochre) rather than leaving blank space.

**"SHOP BY MAKER" SPOTLIGHT (renamed from "Meet the Makers")**
- Eyebrow: `SHOP BY MAKER`
- H3: `The hands behind every piece.`
- Body (new, sits above the maker cards): `Moveee makers are independent craftspeople,
  vetted for quality and fair production before their first listing goes live. Shop their
  full collections, or read their story on the Moveee Maker directory.`
- Card CTA (unchanged): maker name links to `/makers/[slug]`; new secondary link per card:
  `View shop →` linking to `/shop/brand/[slug]`.

**MOVEEE MEMBER BAND (renamed from "Connect Members" — copy update only, layout unchanged)**
- H3: `Moveee Pro`
- Body: `Join Moveee for early access to new makers, exclusive editions, and 10% off every
  purchase in the shop.`
- CTA: `Join Moveee →` (unchanged destination, `/feed`)

⚠️ **DEV ANNOTATION REQUIREMENT** — add `<!-- DEV: <note> -->` comments at these points:
  1. Above the sticky search + filter bar: `"DEV: Search has no backend today — wire to a
     new GraphQL search param on GET_PRODUCTS (packages/shared/lib/wp.ts) or a WooCommerce
     REST search fallback if GraphQL full-text search isn't available. Filter pills
     (Price/Material/Maker Location/In Stock Only) need new query params threaded through
     ShopArchiveWrapper's props and the underlying GET_PRODUCTS query — none of these
     facets currently exist as filterable fields. Category pill reuses the existing
     /shop/category/[slug] route; the others should be implemented as client-side query
     params on /shop itself (?price=&material=&location=&inStock=1) rather than new routes,
     to avoid combinatorial route explosion."`
  2. Above the sort dropdown: `"DEV: ShopFilterBar.tsx already has working onSortChange/
     onViewChange props and local state (lines 16-38) — they're just never wired up by the
     parent. Make ShopArchiveWrapper's main product grid section a client component (or
     extract just the grid into one) that reads sort/view state and actually reorders/
     re-renders the product list — view toggle should switch product-grid between the
     existing card grid and a new horizontal list-row layout."`
  3. Above the Pro pricing line on the product card: `"DEV: memberPrice already resolves
     via GET_PRODUCT_EXTRA in packages/shared/lib/wp.ts but the main GET_PRODUCTS query
     used by the homepage grid does not request it — add memberPrice to GET_PRODUCTS'
     PRODUCT_FIELDS_FRAGMENT rather than fetching it per-card, to avoid an N+1 query
     pattern. Only render the Pro-pricing line when a value is actually returned."`
  4. Above the rating/review-count line on the product card: `"DEV: There is no review/
     rating data model anywhere in this codebase yet (confirmed — no culture_directory-style
     rating field on WooCommerce products). This requires a genuinely new feature (a
     product reviews system, likely backed by WooCommerce's native review/comment system
     via wc_review_count()/wc_get_rating_html() since that's free functionality already
     built into WooCommerce) before this line can show real data — until then, render the
     'New listing' fallback state for every card rather than fabricating a placeholder
     rating."`
  5. Above the trust strip: `"DEV: The '4.8 average rating' and '1,200+ verified buyer
     reviews' figures are placeholder copy pending the reviews system above — do not wire
     real aggregate-query logic until that system exists; treat this strip as static admin-
     configurable copy (a WP option, same pattern as other static trust copy elsewhere in
     the plugin) until then."`
  6. Above the "Shop by Maker" spotlight: `"DEV: extractVendors()'s product-grouping logic
     in ShopArchiveWrapper.tsx (lines 30-49) and the FALLBACK_VENDORS hardcoded array
     (lines 51-56) are unchanged by this redesign — only the section's copy/framing and the
     addition of a per-card 'View shop →' link to /shop/brand/[slug] are new. Do not refetch
     or restructure the underlying maker data in this pass."`

---

### PROMPT 2 — Shop Homepage Marketplace Redesign (Desktop 1440px + Mobile 390px)

```
Senior web UX/UI designer — themoveee.com/shop homepage redesign, evolving the existing
editorial shop page into a standard craft-marketplace homepage. Desktop frame 1440px wide,
companion mobile frame 390px wide, same content, stacked layout.
Brand tokens (Site A, unchanged — do not introduce new tokens): white #FFFFFF bg,
paper-deep #F2F2F2 card/section bg, ink #14110D text, ink-soft #3A342B body copy,
mute #7A6F5C secondary text, rule #2A241C borders, ochre #C5491F primary accent,
ochre-deep #8A2D10 hover state, gold #B38238 reserved for Moveee Pro signifiers only.
Fraunces (display/serif) + DM Sans (body/sans) + JetBrains Mono (kickers/meta/labels).
Radius: sm=2px, md=4px, lg=6px, xl=12px, 2xl=20px, full=9999px.
Shadow-card: 0px 1px 3px rgba(20,17,13,0.08), 0px 1px 2px rgba(20,17,13,0.04).

CONTEXT: the current /shop homepage already has a working masthead, ticker strip,
Editorial Picks grid, two Editorial Bridge modules (to Magazine and Origins), a category
grid, a vendor strip, a membership band, and an Origins bridge — all of these KEEP their
current design and are NOT part of this prompt. This prompt covers ONLY: (1) a new sticky
search + faceted filter bar that replaces the existing non-functional ShopFilterBar, (2) a
new trust strip under the masthead, (3) an upgraded product card (used in both the
Editorial Picks and Main Grid sections) carrying Pro pricing + a rating/review line, and
(4) a reframed "Shop by Maker" spotlight section. Use the marketing copy supplied above
VERBATIM — do not paraphrase or invent new copy.

---

FRAME 1 — DESKTOP STICKY SEARCH + FILTER BAR (1440×120px, white bg, 1px rule bottom border,
sticky on scroll, sits directly below the masthead, replacing the current filter-bar):

ROW 1 (72px height, 32px horizontal padding):
  Search input (left, 420px wide): radius-full, paper-deep fill, mute placeholder text
    "Search makers, materials, or pieces…", small magnifying-glass icon left-inset 16px,
    DM Sans 14px.
  Filter pills (centre, inline after search, 8px gap each): "Category ▾", "Price ▾",
    "Material ▾", "Maker Location ▾" — each a radius-full ghost-border pill, DM Sans 13px
    ink, 36px height, chevron icon right; "In Stock Only" as a plain toggle pill (no
    chevron) that fills ochre when active.
  Right cluster: Sort dropdown (radius-md border, DM Sans 13px, 36px height, options from
    copy above) + grid/list view toggle (two 32px icon buttons, active state ochre fill)
    + result count "248 items" JetBrains Mono 11px mute.
ROW 2 (48px height, shown only when filters are active): active filter chips with × to
  remove each, "Clear all" text link right-aligned, ochre text DM Sans 12px.

---

FRAME 2 — DESKTOP MASTHEAD + TRUST STRIP (1440×360px, white bg):

MASTHEAD (unchanged from current page, reproduced for continuity — centred, max-width
  720px): H1 "Moveee Lifestyle" Fraunces 48px bold ink, centred rule divider below, body
  copy DM Sans 16px ink-soft centred max-width 600px.

TRUST STRIP (new, 32px top margin, 4 columns, max-width 1100px centred, 1px rule top
  border, 32px vertical padding):
  TRUST BADGE (each column): icon 24px (✓ / ★ / ↺ / ◇) ochre colour, label DM Sans 13px
    bold ink directly right of icon, proof-point line DM Sans 12px mute below, 4px top.
  Fill all four badges with the exact copy supplied above, in order.

---

FRAME 3 — DESKTOP UPGRADED PRODUCT CARD (340×460px card spec, used inside both the
Editorial Picks grid and the Main Product Grid — show as a single annotated card spec,
not a full grid, since the grid layout itself is unchanged):

Card: white fill, radius-lg, 1px rule border, hover state lifts shadow-card + 2px
  translateY.
  IMAGE (340×280px, radius-lg top corners only, object-fit cover):
    "★ Vetted" pip (top-left, ink/80%-opacity fill, white text, radius-full, 11px, 8px
      padding) — unchanged from today.
    "New" pip (top-right, ochre fill, same sizing) when applicable — unchanged.
  INFO BLOCK (20px padding):
    Vendor name: DM Sans 11px mute uppercase, letter-spacing 0.5px.
    Product name: Fraunces 16px bold ink, 4px top, max 2 lines.
    PRICE ROW (8px top): standard price DM Sans 15px bold ink (e.g. "£68"); directly below
      it, when memberPrice exists, a second line "£61.20 with Moveee Pro" DM Sans 12px bold
      gold #B38238.
    RATING ROW (6px top): "★ 4.9 (38)" DM Sans 12px mute when reviews exist; OR
      "New listing" JetBrains Mono 10px uppercase ochre when zero reviews — never show both.
    "Add to bag" button (full width, 8px top, ink fill white text, radius-md, 40px height,
      DM Sans 13px bold) — unchanged from today's AddToCartButton placement.

---

FRAME 4 — DESKTOP "SHOP BY MAKER" SPOTLIGHT (1440×520px, paper-deep #F2F2F2 bg, 80px
vertical padding, replacing today's "Meet the Makers" framing — same card grid layout,
new header + copy + secondary link per card):

HEADER BLOCK (left-aligned, max-width 640px, 64px left padding):
  Eyebrow: "SHOP BY MAKER" JetBrains Mono 11px bold ochre uppercase.
  H3: "The hands behind every piece." Fraunces 32px bold ink, 8px top.
  Body: new copy block from above, DM Sans 15px ink-soft, line-height 1.5, 12px top.
  "All makers →" DM Sans 13px bold ochre link, top-right of header row (unchanged
    position from today).

MAKER CARDS (4 across, 64px top margin, 24px gap, unchanged sizing/style from today's
  vendor-cards — image, "★ Vetted Maker" pip, name, location, description, product count):
  Add a new secondary line under the existing product-count line: "View shop →" DM Sans
    12px bold ochre, links to /shop/brand/[slug] (the maker's name itself still links to
    /makers/[slug] as today — two distinct destinations on one card, both visible).

---

FRAME 5 — MOBILE COMPANION (390px wide, single scrolling stack):
  Search + filter bar: search input full-width at top; filter pills become a single
    horizontally-scrolling row below the search input (no wrapping); sort dropdown +
    view toggle + result count collapse into one row below the filter pills, sort as a
    compact icon-button that opens a bottom-sheet selector rather than a native <select>.
  Trust strip: 2×2 grid instead of 4-across, same badge content.
  Product card: same field stack (image → vendor → name → price/Pro-price → rating →
    Add to bag), full-width single-column in the grid, image height reduced to 220px.
  Shop by Maker: header stacked above cards, cards 2-across instead of 4-across, same
    two-link pattern (maker name + "View shop →") preserved on each card.

---

Output 5 frames: Desktop Search/Filter Bar, Desktop Masthead+Trust Strip, Desktop Product
Card Spec, Desktop Shop by Maker Spotlight, Mobile Companion (full stack).
```

---

## 3. FULL SHOP/LIFESTYLE HOMEPAGE — COMPLETE END-TO-END PAGE (Site A, themoveee.com/shop)

> **Relationship to §2:** §2 specified four *new/upgraded* pieces in isolation (search+filter
> bar, trust strip, product card, Shop by Maker reframing) as a redesign delta against the
> current page. This section is the **complete page**, hero to footer-adjacent, folding those
> four upgrades into their place in the full flow alongside every section that was already
> working — masthead, ticker, Editorial Picks, both Editorial Bridges, the category grid, the
> member band, and the closing Origins Bridge. Use this section when generating the whole page
> in one pass; use §2 only if you need to regenerate just the upgraded pieces on their own.
> Same scope rule as §2 applies: product detail (`/shop/[slug]`), brand storefronts
> (`/shop/brand/[slug]`), and "The Moveee Edit" (`/shop/edit`) are separate pages, not covered
> here.

### Brand architecture

Identical to §2 — stay inside Site A's existing token set (white/paper-deep/ink/ochre/gold),
no paper-warm. See the Quick Reference table at the top of this file. Gold is reserved for
Moveee Pro signifiers only, mirrored everywhere it appears below (ticker, product card,
member band).

### Section order (top to bottom — this is the authoritative sequence for the full page)

1. Masthead
2. Trust Strip *(new, §2)*
3. Sticky Search + Filter Bar *(upgraded, §2)*
4. Ticker
5. Featured Editorial Picks
6. Editorial Bridge — Magazine
7. Main Product Grid *(upgraded card, §2)*
8. Editorial Bridge — Origins (mid-page)
9. Category Grid
10. Shop by Maker *(renamed/reframed, §2)*
11. Moveee Member Band *(renamed, §2)*
12. Origins Bridge (closing)

### Marketing copy (final — use verbatim; do not let Figma Make invent its own)

**1 — MASTHEAD**
- H1 (unfiltered): `Moveee Lifestyle` · H1 (filtered): the active category/tag/maker name,
  italic.
- Body (unfiltered): `Every piece chosen for craft, longevity, and the story behind it. Every
  maker on Moveee is personally vetted for craft integrity, fair production, and lasting
  quality.`
- Body (filtered): `A curated collection of [Category] goods from vetted makers.`

**2 — TRUST STRIP** *(verbatim from §2, reproduced for continuity)*
1. `✓ Vetted Makers` — `Every maker personally reviewed before their first listing.`
2. `★ 4.8 average rating` — `Across 1,200+ verified buyer reviews.`
3. `↺ Free Returns` — `30 days, no questions asked.`
4. `◇ Moveee Pro saves 10%` — `Automatically applied at checkout for members.`

**3 — STICKY SEARCH + FILTER BAR** *(verbatim from §2, reproduced for continuity)*
- Search placeholder: `Search makers, materials, or pieces…`
- Filter pills: `Category`, `Price`, `Material`, `Maker Location`, `In Stock Only`
- Sort options: `Featured`, `Newest`, `Price: Low–High`, `Price: High–Low`, `Most Loved`

**4 — TICKER (repeating marquee strip)**
- Items, in order, looping: `Vetted Makers · ★ · Ethical Production · ★ · Free Returns · ★ ·
  Moveee Pro Members Save 10% · ★` — note the last item is a copy update from the current
  page's `Connect Members Save 10%`, bringing it in line with the rest of this redesign's
  "Connect" → "Moveee" rebrand.

**5 — FEATURED EDITORIAL PICKS**
- Section header: `Editorial Picks` (H2, "Picks" italic) + `The Moveee Edit →` link
  (to `/shop/edit`).
- Large hero card + 2×2 grid of small cards. Each card: `★ Vetted` pip, `New` pip (when
  applicable), vendor name, product name, price.

**6 — EDITORIAL BRIDGE (Magazine)**
- Eyebrow: `As Seen In`
- Title: `The Moveee Edit` (italic) + meta `Issue 014 · Craft & Makers`
- CTA: `Read the Issue →` (to `/magazine`)

**7 — MAIN PRODUCT GRID**
- Section label: `[All Products / active filter label] — N pieces`
- Empty state (zero results): `No products found.` (Fraunces italic, mute)
- Cards: upgraded spec from §2 (vendor name, product name, price + `[member price] with
  Moveee Pro` when present, `★ rating (count)` or `New listing`, `Add to bag` button).

**8 — EDITORIAL BRIDGE (Origins, mid-page)**
- Eyebrow: `Origins Journal`
- Title: `Where things` + `come from` (italic) + meta `Stories from the makers behind the
  objects`
- CTA: `Explore Origins →` (to `/journeys`)

**9 — CATEGORY GRID**
- Header: `Shop by` + `Category` (italic)
- Cards: category image, name, `N pieces` count overlay — link to `/shop/category/[slug]`.

**10 — SHOP BY MAKER** *(verbatim from §2, reproduced for continuity)*
- Eyebrow: `Shop by Maker` · H3: `The hands behind every piece.`
- Body: `Moveee makers are independent craftspeople, vetted for quality and fair production
  before their first listing goes live. Shop their full collections, or read their story on
  the Moveee Maker directory.`
- Cards: maker image, `★ Vetted Maker` pip, name (→ `/makers/[slug]`), location, description,
  product count, `View shop →` (→ `/shop/brand/[slug]`).
- Header-right link: `All makers →` (to `/makers`).

**11 — MOVEEE MEMBER BAND**
- H3: `Moveee` + `Pro` (italic)
- Body: `Join Moveee for early access to new makers, exclusive editions, and 10% off every
  purchase in the shop.`
- 4 perks: `◈ Early Access` — `First look at new makers and limited drops.` / `◇ 10% Off` —
  `Applied automatically to every shop order.` / `○ Patron Stories` — `Exclusive maker
  interviews and behind-the-scenes features.` / `△ Maker Events` — `Invitations to studio
  visits and openings.`
- CTA: `Join Moveee →` (to `/feed`)
- Floating stat card: `2,400` / `Members & growing`

**12 — ORIGINS BRIDGE (closing)**
- Eyebrow: `Origins Journal`
- H3: `The stories` + `behind` (italic) + `the objects`
- Body: `Every maker in the shop has a story. We travel to document them — from mountain
  workshops to coastal studios.`
- CTA: `Read Origins →` (to `/journeys`)

⚠️ **DEV ANNOTATION REQUIREMENT** — add `<!-- DEV: <note> -->` comments at these points (items
1–6 below are carried over verbatim from §2's annotation list since those upgrades sit inside
this full-page flow; items 7–10 are new to this section):
  1. Above the search + filter bar — *(from §2)* search/facet backend doesn't exist yet; see
     §2 DEV note 1 for the exact GraphQL/REST wiring approach.
  2. Above the sort dropdown — *(from §2)* `ShopFilterBar.tsx`'s sort/view callbacks already
     exist but are never wired up; see §2 DEV note 2.
  3. Above the Pro pricing line on product cards — *(from §2)* `memberPrice` resolves via
     `GET_PRODUCT_EXTRA` but isn't in the main `GET_PRODUCTS` query yet; see §2 DEV note 3.
  4. Above the rating/review line on product cards — *(from §2)* no reviews data model exists
     yet; render `New listing` for every card until a WooCommerce-native reviews system is
     built; see §2 DEV note 4.
  5. Above the trust strip — *(from §2)* the `4.8` rating and `1,200+ reviews` figures are
     placeholder copy pending the reviews system; treat as static admin-configurable copy
     until then; see §2 DEV note 5.
  6. Above the Shop by Maker spotlight — *(from §2)* `extractVendors()`'s grouping logic and
     `FALLBACK_VENDORS` are unchanged; only copy/framing + the new `View shop →` link are new;
     see §2 DEV note 6.
  7. Above the ticker: `"DEV: TICKER_ITEMS in ShopArchiveWrapper.tsx (lines 66-71) currently
     reads 'Connect Members Save 10%' — update the literal string to 'Moveee Pro Members Save
     10%' as part of this same pass, it's a one-line constant change with no other
     dependencies."`
  8. Above the Main Product Grid's empty state: `"DEV: 'No products found.' is rendered
     as-is today with no suggested-alternative action (e.g. 'clear filters' or 'browse all') —
     once faceted filtering ships (§2 DEV note 1), wire a 'Clear filters' button into this
     empty state so a visitor who over-filters isn't dead-ended."`
  9. Above the two Origins-themed modules (Editorial Bridge §8 and the closing Origins Bridge
     §12): `"DEV: these are two distinct existing components (the thin 'ed-bridge' text strip
     mid-page, and the richer image+copy 'shop-origins-bridge' block at the very end) that
     both link to /journeys with near-identical 'Origins Journal' framing — this is
     intentional repetition (the page funnels toward /journeys twice), not a duplicate bug,
     but the two modules should look visually distinct (text-only bridge vs. full image+copy
     block) so it doesn't read as a copy-paste mistake to the visitor."`
  10. Above the Moveee Member Band's floating stat card: `"DEV: the '2,400 Members & growing'
      figure (member-band-inner .fl-num in ShopArchiveWrapper.tsx) is a hardcoded literal
      today, not a live count — either wire it to a real member-count query or move it into
      WP Admin as an editable option (same static-copy pattern as the trust strip figures
      above) rather than leaving a hardcoded number that will go stale."`

---

### PROMPT 3 — Full Shop/Lifestyle Homepage, Hero to Footer (Desktop 1440px + Mobile 390px)

```
Senior web UX/UI designer — themoveee.com/shop homepage, complete end-to-end page design,
hero to footer-adjacent. Desktop frame 1440px wide per section, companion mobile frame 390px
wide, same content, stacked layout. This is the FULL page, not a partial redesign — generate
every section below in the order given, as one continuous scrolling page.

Brand tokens (Site A — do not introduce new tokens): white #FFFFFF bg, paper-deep #F2F2F2
card/section bg, ink #14110D text, ink-soft #3A342B body copy, mute #7A6F5C secondary text,
rule #2A241C borders, ochre #C5491F primary accent, ochre-deep #8A2D10 hover state,
gold #B38238 reserved for Moveee Pro signifiers only. Fraunces (display/serif) + DM Sans
(body/sans) + JetBrains Mono (kickers/meta/labels). Radius: sm=2px, md=4px, lg=6px, xl=12px,
2xl=20px, full=9999px. Shadow-card: 0px 1px 3px rgba(20,17,13,0.08), 0px 1px 2px
rgba(20,17,13,0.04).

Use the marketing copy supplied above VERBATIM in every frame — do not paraphrase or invent
new copy for any section, including the sections reproduced from §2.

---

FRAME 1 — MASTHEAD (1440×280px, white bg, centred content max-width 720px):
  H1: "Moveee Lifestyle" (or active filter label, italic) Fraunces 48px bold ink, centred.
  Thin ochre rule divider below, 16px margin both sides.
  Body copy (per the unfiltered/filtered variants above) DM Sans 16px ink-soft, centred,
    max-width 600px, 16px top margin.

---

FRAME 2 — TRUST STRIP (1440×140px, white bg, 1px rule top+bottom border, 4 columns,
max-width 1100px centred, 32px vertical padding):
  TRUST BADGE (×4): icon 24px (✓ / ★ / ↺ / ◇) ochre, label DM Sans 13px bold ink beside icon,
    proof-point line DM Sans 12px mute below, 4px top. Fill with the exact 4-item copy above.

---

FRAME 3 — STICKY SEARCH + FILTER BAR (1440×120px, white bg, 1px rule bottom border, sticky
on scroll):
  ROW 1 (72px): search input (420px, radius-full, paper-deep fill, magnifying-glass icon,
    placeholder copy above) — filter pills "Category ▾ / Price ▾ / Material ▾ / Maker
    Location ▾" (radius-full ghost-border, DM Sans 13px) + "In Stock Only" toggle pill —
    right cluster: sort dropdown (copy above) + grid/list view toggle + "N items" result
    count (JetBrains Mono 11px mute).
  ROW 2 (48px, shown only when filters active): removable filter chips + "Clear all" link.

---

FRAME 4 — TICKER (1440×56px, ink #14110D bg, full-bleed horizontal marquee, white text
DM Sans 13px uppercase letter-spacing 1px, ochre "★" separators, continuous scroll
left-to-right, seamless loop): fill with the 4-item copy above (Moveee Pro Members wording,
not "Connect Members").

---

FRAME 5 — FEATURED EDITORIAL PICKS (1440×640px, white bg, 80px vertical padding):
  Header row: "Editorial Picks" (Fraunces 32px bold ink, "Picks" italic) left + "The Moveee
    Edit →" DM Sans 13px bold ochre link right.
  Grid (64px top margin, max-width 1200px centred): 1 large feature card (left, ~50% width,
    image 100% height of card, info block below — vendor name DM Sans 11px mute uppercase,
    product name Fraunces 18px bold ink, price DM Sans 15px bold ink) + a 2×2 grid of smaller
    cards (right, same info-block pattern, smaller image). "★ Vetted" pip (ink/80% fill,
    white text, radius-full, top-left of every image) and "New" pip (ochre fill, top-right,
    when applicable) on all 5 cards.

---

FRAME 6 — EDITORIAL BRIDGE: MAGAZINE (1440×220px, paper-deep #F2F2F2 bg, centred content):
  Eyebrow "As Seen In" JetBrains Mono 11px bold ochre uppercase, centred.
  Title "The Moveee Edit" (italic) Fraunces 28px bold ink + meta "Issue 014 · Craft & Makers"
    DM Sans 13px mute, 8px top, centred.
  CTA "Read the Issue →" DM Sans 14px bold ochre, 16px top, centred.

---

FRAME 7 — MAIN PRODUCT GRID (1440×1200px, white bg, 80px vertical padding):
  Section label: "[All Products / active label] — N pieces" JetBrains Mono 12px mute
    uppercase, left-aligned, max-width 1200px centred container.
  Grid (4 columns, 24px gap, 32px top margin) of the upgraded product card from §2: white
    fill, radius-lg, 1px rule border; image (top, radius-lg top corners, "★ Vetted" +
    optional "New"/"Sold Out" pips); info block (vendor name, product name Fraunces 16px bold,
    price DM Sans 15px bold + "[price] with Moveee Pro" gold #B38238 12px line when present,
    "★ 4.9 (38)" or "New listing" line, full-width "Add to bag" button).
  Empty state (zero results): centred italic Fraunces 16px mute "No products found." with a
    "Clear filters" ghost-border button below it (per DEV note 8 above).

---

FRAME 8 — EDITORIAL BRIDGE: ORIGINS, MID-PAGE (1440×220px, paper-deep #F2F2F2 bg, centred —
visually IDENTICAL layout to Frame 6 but distinct copy, per DEV note 9 — same eyebrow/title/
meta/CTA structure, different content):
  Eyebrow "Origins Journal", title "Where things come from" (last word italic), meta
    "Stories from the makers behind the objects", CTA "Explore Origins →".

---

FRAME 9 — CATEGORY GRID (1440×560px, white bg, 80px vertical padding):
  Header: "Shop by Category" (Fraunces 28px bold ink, "Category" italic), centred, 64px
    bottom margin before grid.
  Grid (6 across, 16px gap, max-width 1200px centred): each cell a 200×240px image card,
    radius-lg, dark gradient overlay bottom third, category name (DM Sans 16px bold white)
    + "N pieces" count (DM Sans 12px white/80%) inside the overlay, bottom-left aligned.

---

FRAME 10 — SHOP BY MAKER (1440×560px, paper-deep #F2F2F2 bg, 80px vertical padding —
identical layout to §2 Frame 4, reproduced here for page continuity):
  Header: eyebrow "Shop by Maker", H3 "The hands behind every piece." (Fraunces 32px bold
    ink), body copy (DM Sans 15px ink-soft) left-aligned max-width 640px, "All makers →" link
    top-right.
  Cards (4 across, 24px gap, 64px top margin): image, "★ Vetted Maker" pip, name
    (Fraunces 18px bold ink), location (DM Sans 13px mute), description (DM Sans 13px
    ink-soft, 2 lines max), product count (DM Sans 12px mute), "View shop →" (DM Sans 12px
    bold ochre, new secondary link below the count).

---

FRAME 11 — MOVEEE MEMBER BAND (1440×520px, ink #14110D bg, white text, split 60/40 layout):
  LEFT (60%, 64px padding): H3 "Moveee Pro" (Fraunces 32px bold white, "Pro" gold #B38238
    italic) + body copy (DM Sans 15px white/85% opacity, 12px top) + 4-perk 2×2 mini-grid
    (icon 20px gold, title DM Sans 13px bold white, desc DM Sans 12px white/70%, 24px top) +
    "Join Moveee →" button (gold fill, ink text, radius-full, 48px height, 24px top).
  RIGHT (40%): full-bleed lifestyle/product photography panel with a floating stat card
    overlapping its bottom-left corner (white fill, radius-lg, shadow-card, 24px padding):
    "2,400" (Fraunces 28px bold ink) + "Members & growing" (DM Sans 12px mute) below.

---

FRAME 12 — ORIGINS BRIDGE, CLOSING (1440×480px, white bg, split 50/50 layout — visually
DISTINCT from Frame 8's thin text bridge, per DEV note 9 — full image+copy treatment):
  LEFT (50%): full-bleed maker/workshop photography panel, radius-lg.
  RIGHT (50%, 64px padding): eyebrow "Origins Journal" (JetBrains Mono 11px bold ochre
    uppercase) + H3 "The stories behind the objects" ("behind" italic, Fraunces 32px bold
    ink, 12px top) + body copy (DM Sans 15px ink-soft, 16px top) + "Read Origins →" (DM Sans
    14px bold ochre, 16px top).

---

FRAME 13 — MOBILE COMPANION (390px wide, single scrolling stack, all 12 sections condensed
in the same order):
  Masthead: unchanged, centred, smaller type scale (H1 32px).
  Trust strip: 2×2 grid instead of 4-across.
  Search + filter bar: search full-width top; filter pills single horizontally-scrolling row;
    sort/view/count collapse into one row below, sort opens a bottom sheet not a native select.
  Ticker: unchanged marquee behaviour, full-bleed.
  Featured Editorial Picks: large card full-width on top, then 2×2 grid below it (still 2
    columns, not stacked to 1).
  Editorial Bridge (Magazine): stacked centred text, unchanged copy.
  Main Product Grid: 2-column grid (not 4), same card field stack, image height 200px.
  Editorial Bridge (Origins, mid-page): stacked centred text, unchanged copy, visually
    identical to the Magazine bridge above per Frame 8's spec.
  Category Grid: 2-column grid (not 6), same overlay treatment.
  Shop by Maker: header stacked above cards, cards 2-across (not 4), both links preserved.
  Moveee Member Band: stacked (text block, then image+stat card below, full-width), perks
    grid stays 2×2.
  Origins Bridge (closing): stacked (image on top, full-width; text block below it), unchanged
    copy.

---

Output 13 frames in this exact order: Masthead, Trust Strip, Search/Filter Bar, Ticker,
Featured Editorial Picks, Editorial Bridge (Magazine), Main Product Grid, Editorial Bridge
(Origins), Category Grid, Shop by Maker, Moveee Member Band, Origins Bridge (closing), Mobile
Companion (full stack).
```

---

## 4. PULSE FEED — WEB (Site B, web.themoveee.com/feed)

> Note on scope: this is the web counterpart to the mobile catalog's
> `docs/figma-make-prompts.md` §3 "CONNECT FEED (Main Home Screen)" + §3B "Happenings
> Spotlight Carousel". The mobile prompt designs a single-column 390px scroll with a
> floating-pencil FAB and a bottom tab bar. The real web feed (`PulseFeed.tsx`,
> `apps/connect/app/feed/page.tsx`) is a fundamentally different layout — a 3-column
> desktop grid (190px left filter rail / fluid center timeline, capped 1080px total /
> 220px right sidebar) with an inline composer at the top of the timeline instead of a
> FAB, and collapses to the mobile catalog's single-column pattern only below 860px. This
> prompt designs the desktop 3-column layout as the primary frame and treats the existing
> mobile catalog entry as the already-correct mobile-companion reference rather than
> re-drawing it.

### Brand architecture
Site B (`apps/connect`, web.themoveee.com) — Moveee, no sub-brand qualifier. This is the
Pulse/Connect feed at `/feed` (renamed from the bare `/connect` path, June 2026 — see
CLAUDE.md "Connect app feed route"). Tier badges read "Moveee Citizen" / "Moveee Pro" —
never "Connect Citizen/Pro".

### Why this section exists
Read directly from `packages/shared/components/pulse/PulseFeed.tsx`,
`apps/connect/app/feed/page.tsx`, `ConnectHero.tsx`, `FeedCard.tsx`,
`EventSpotlightCarousel.tsx`, and `apps/connect/app/pulse-layout.css` before writing this
section. The actual desktop feed is a 3-column grid, distinct from anything in the mobile
catalog:
- **Left rail (190px, sticky, white, right border)**: "Sections" (People Near Me,
  Membership), "Personalised" (For You toggle, shown only when the viewer has interests
  set), "Content Type" (All/Pulse/News/Editorial/Event/Directory/Quote), "Category"
  (Music/Film/Art/Fashion/Literature/Food/Tech/Sport/Travel/Design/Ideas) — all rendered
  as left-border-accent text links, not pills.
- **Center timeline (fluid, max 1080px total page width, right border)**: an inline
  `SubmitPost` composer sits directly in the timeline flow above the feed (not a floating
  pencil FAB like mobile) — there is no FAB anywhere in the web feed. Below the composer
  is a horizontal category-pill strip (`.feed-category-strip`), then the card stream.
- **Right sidebar (220px, sticky)**: "Hot this week 🔥" trending list (left-border-accent
  text rows, no images — title + reaction count, not mini-cards like the mobile Trending
  Strip), a "Personalised feed ready" nudge card (only shown when interests exist and For
  You is off), and an "About Moveee" card.
- **Below 860px**: the two sidebars hide entirely; a horizontal-scroll mobile filter strip
  (For You pill + content-type pills + a "⊞ Sections" button that expands a dropdown panel
  for the Sections links) replaces the left rail, matching the mobile catalog's filter row
  concept but implemented as a strip + overflow dropdown rather than a fixed set of pills.
- **Event Spotlight Carousel** (`EventSpotlightCarousel.tsx`) is real, shipped code —
  inserted once after the 5th feed item exactly as the mobile §3B prompt specifies (same
  scoring formula, same category-dot colour table, same 236px card). A
  `HouseFellowshipReminderCard` is inserted at the same position for logged-in viewers
  only — this has no mobile-catalog equivalent yet and is new to this prompt.
- **Logged-out visitors** see `ConnectHero` above the feed (headline "Where culture
  gathers.", Join/Sign-in CTAs, a section-nav strip) — there is no equivalent hero in the
  mobile catalog since the mobile app requires auth before reaching the feed at all.
- Card types match the mobile catalog's Editorial/Community/Quote cards conceptually but
  render as a single-column stream inside the center rail rather than full-bleed against
  the phone width — same content fields (badges, author rows, reaction bars, poll/RSVP
  inline widgets per `FeedCard.tsx`), narrower max-width.

### Marketing copy (final — use verbatim, do not paraphrase)
- Hero (logged-out only): `"Where culture gathers."` / `"Village square for culture loving
  creatives, entrepreneurs, professionals."` / CTAs `"Join Moveee →"` / `"Already a member?
  Sign in"`
- Section nav: `"Pulse Feed"` · `"People Near Me"` · `"Membership"`
- Interests nudge (no interests set): `"Personalise your feed"` — `"pick your interests for
  a For You view."` — `"Set interests →"`
- Right sidebar nudge (interests set, For You off): `"Personalised feed ready"` —
  `"Switch to For You to see content ranked by your interests."` — `"For You →"`
- Right sidebar About card: `"About Moveee"` — `"The community for Black and diaspora
  creatives, entrepreneurs, and culture lovers. Pulse is where members post, share, and
  stay in the conversation."`
- Trending header: `"Hot this week 🔥"`
- Spotlight carousel header: `"📅 Upcoming Near You"` / `"See all →"` (copy already
  finalised in the mobile §3B prompt — reuse verbatim, do not redraft)
- Empty feed state: `"Nothing here yet — check back soon."`
- Directory teaser (below feed): `"Find Each Other"` / `"The Directory"` / `"A searchable
  index of members — who they are, what they do, and where they're based. The Lagos
  photographer. The UK art director. The Nigerian lawyer in New York."` / `"Browse the
  directory →"`
- Membership teaser (below feed): `"Membership"` / `"Moveee Citizen & Moveee Pro"` / `"Free
  membership gets you in. Moveee Pro gets you featured, gated content, a Pro badge, and
  more. Two tiers. One community."` / `"View membership →"`

### DEV ANNOTATION REQUIREMENT
Add `<!-- DEV: <note> -->` (HTML) or `{/* DEV: <note> */}` (JSX) directly above the
relevant element — do not group them at the top of the file.

  1. Above the 3-column grid container:
     "DEV: `grid-template-columns: 190px 1fr 220px`, `max-width: 1080px`, centred. Below
     860px both sidebars are `display: none` and the grid collapses to `1fr` — see
     `apps/connect/app/pulse-layout.css`. Do not hardcode pixel widths in the generated
     component; reuse the existing `.pulse-layout`/`.pulse-sidebar-left`/`.pulse-timeline`/
     `.pulse-sidebar-right` classes."
  2. Above the inline composer:
     "DEV: This is `SubmitPost.tsx` rendered directly in the timeline flow, not a modal or
     FAB. It already exists and supports all 10 post templates — do not redesign its
     internals here, just reserve the layout slot above the category-pill strip."
  3. Above the Event Spotlight Carousel insertion point:
     "DEV: Inserted via array slicing — `visible.slice(0,5)` then the carousel then
     `visible.slice(5)` — not a ref/index check. This is what makes 'once, after the 5th
     item, never re-inserted on infinite-scroll pagination' work without extra state, since
     position 5 in the already-rendered array is stable across re-renders. See
     `PulseFeed.tsx`'s render block. Full scoring/filtering spec already documented in the
     mobile §3B prompt — reuse, don't redefine here."
  4. Above the HouseFellowshipReminderCard:
     "DEV: Logged-in-only, rendered at the exact same array position as the Event
     Spotlight Carousel (`visible.length > 5 && session?.user`). No mobile-catalog
     equivalent yet — this card is new to the web feed only as of this prompt."
  5. Above the ConnectHero block:
     "DEV: `ConnectHero.tsx` checks `useSession()` client-side and renders `null` for
     logged-in users — it is NOT conditionally mounted by the server. Keep this client-side
     check pattern in the generated component rather than gating it in the parent RSC, to
     avoid layout-shift on session hydration (see the comment already in
     `apps/connect/app/feed/page.tsx`)."
  6. Above the "For You" toggle in both the left rail and mobile filter strip:
     "DEV: Only rendered at all when `hasInterests` (i.e. `session.user.interests.length >
     0`); ranking logic is `rankFeed()` from `lib/feed-recommendations.ts` — do not
     reimplement scoring here, this prompt only needs the toggle's two visual states."
  7. Above the right-sidebar trending list:
     "DEV: Text rows with a left ochre border accent (title + reaction count) — this is
     NOT the mobile catalog's image-based 160×80px Trending Strip mini-cards. Different
     visual treatment for the same `getTrending()` data, by design, since the sidebar is
     narrow (220px) and persistent rather than a one-off horizontal scroll."
  8. Above the Directory/Membership teaser sections below the feed:
     "DEV: These are separate `<section>` blocks in `app/feed/page.tsx`, not part of
     `PulseFeed.tsx` itself — they render below the feed for all visitors regardless of
     scroll position, not as feed items."

### PROMPT 4 — Pulse Feed (Desktop 1440px + Mobile Companion 390px)

```
Senior web UX/UI designer — Moveee (Site B, web.themoveee.com/feed). Desktop frame
1440px wide, content column capped at 1080px and centred; mobile-companion frame
390×844px.
Brand: paper bg #FFFFFF, paper-warm #F3ECE0 (hero only), ochre #C5491F, gold #B38238,
ink #14110D, ink-soft #3A342B, mute #7A6F5C, rule #E8E2D8, success #2D6A4F.
DM Sans body, Fraunces display, JetBrains Mono data/timestamps/dates.

FRAME 1 — DESKTOP, LOGGED-OUT (1440px):

CONNECT HERO (full-width, paper-warm #F3ECE0 bg, 64px vertical padding):
  Eyebrow "Moveee" DM Sans 11px bold ochre uppercase.
  Headline "Where culture gathers." Fraunces 40px, "gathers." in italic.
  Lede "Village square for culture loving creatives, entrepreneurs, professionals." DM Sans
    16px ink-soft, max-width 480px.
  CTA row: "Join Moveee →" solid ochre button + "Already a member? Sign in" ghost text link.
  Section nav strip below (white bg, border-top rule): "Pulse Feed" · "People Near Me" ·
    "Membership" — DM Sans 13px bold ink, 24px gap, underline on hover.

3-COLUMN FEED GRID (below hero, 1080px max-width centred, grid-template-columns
190px/1fr/220px):

  LEFT RAIL (190px, white, right border 1px rule, sticky):
    "SECTIONS" DM Sans 9px bold uppercase mute, 0.15em letter-spacing — links below:
      "People Near Me", "Membership" — DM Sans 13px ink-soft, left-border 2px transparent.
    "CONTENT TYPE" same heading style — links: All/Pulse/News/Editorial/Event/Directory/
      Quote — active state: ochre text + 2px ochre left border + 600 weight.
    "CATEGORY" same heading style — links: Music/Film/Art/Fashion/Literature/Food/Tech/
      Sport/Travel/Design/Ideas.
    (Omit "Personalised" group in this logged-out frame — it requires interests.)

  CENTER TIMELINE (fluid, right border 1px rule):
    Category pill strip (white bg, horizontal scroll, pills: All + the 11 categories above,
      32px height, radius-full, active = ochre fill white text, inactive = ghost border
      ink-soft text).
    Feed cards (1–5 visible): same 4 card types already specified for mobile (Editorial,
      Community/Hidden-Gem, Quote, plus a Poll-template card showing the inline
      `PollDisplay` bar-chart-style vote bars) — rendered single-column, 680px max card
      width, 24px vertical gap, no card shadow on Editorial (bottom-border separator style),
      shadow-card on Community/Poll cards, paper-warm fill on Quote card. Same copy/field
      stack as the mobile catalog's Prompt 3 Frame 1, just narrower and desktop-typed.
    EVENT SPOTLIGHT CAROUSEL inserted after card 5 — reuse the exact card design already
      specified in the mobile catalog's Prompt 3B Frame 1 (236px cards, header "📅 Upcoming
      Near You" / "See all →", FEATURED star, 🌱 Community badge) — same component, same
      horizontal scroll, just sitting inside the narrower center column instead of full
      device width.
    2 more feed cards below the carousel.

  RIGHT SIDEBAR (220px, sticky):
    "HOT THIS WEEK 🔥" DM Sans 9px bold uppercase mute — 3 trending rows below: each a
      2px ochre left-border block, title DM Sans 12px bold ink (2 lines max, ellipsis),
      "{N} reactions" DM Sans 10px mute below.
    "About Moveee" card (white, 1px rule border, radius 4px, 14px padding): heading DM Sans
      9px bold uppercase mute, body "The community for Black and diaspora creatives,
      entrepreneurs, and culture lovers. Pulse is where members post, share, and stay in
      the conversation." DM Sans 12px ink-soft.

DIRECTORY TEASER (full-width section below the 3-column grid, paper-deep bg):
  Split layout: left text block ("Find Each Other" eyebrow, "The Directory" Fraunces 28px
    heading, descriptive paragraph), right "Browse the directory →" ochre text CTA.

MEMBERSHIP TEASER (full-width section, paper bg, border-top rule):
  Same split layout: "Membership" eyebrow, "Moveee Citizen & Moveee Pro" Fraunces 28px
    heading, descriptive paragraph, "View membership →" ochre text CTA.

FRAME 2 — DESKTOP, LOGGED-IN + "FOR YOU" ACTIVE (1440px):
Same 3-column grid as Frame 1, but:
  No Connect Hero (logged-in visitors never see it).
  LEFT RAIL gains a "PERSONALISED" group above "Content Type": single "For You" link,
    active state = ochre text + left border (same active styling as Content Type links).
  Inline composer bar sits at the very top of the center timeline (above the category pill
    strip): collapsed state — white card, 1px rule border, radius 4px, placeholder text
    "Share something with the community…" DM Sans 13px mute, small template-picker icon
    row (10 template icons, 16px each, muted) along the bottom edge of the card.
  Below the composer + pill strip: an "Interests" nudge is HIDDEN in this frame (the user
    already has interests since For You is active) — instead show feed cards with a small
    "✦ For You" badge (ochre bg, white DM Sans 9px bold, top-right corner) on any card
    matching the viewer's interests.
  RIGHT SIDEBAR: trending list same as Frame 1; below it, in place of the "Personalised
    feed ready" nudge (hidden because For You is already on), nothing — just the About
    Moveee card directly below trending.
  After feed card 5: Event Spotlight Carousel, THEN a HouseFellowshipReminderCard directly
    beneath it (paper-warm card, ochre left accent, House Fellowship icon + short reminder
    copy + "View →" link — logged-in-only module, no mobile-catalog equivalent).

FRAME 3 — MOBILE COMPANION (390×844px, logged-in, For You off):
Single column, matches the mobile catalog's existing Prompt 3 Frame 1 design exactly
(header, filter row, 4 card types, FAB) — EXCEPT replace the floating pencil FAB with the
web pattern: no FAB at all; instead show the same collapsed inline composer bar from Frame
2, placed at the very top of the scroll (below the mobile filter strip, above the category
pill strip) — this is the one real layout difference between the web mobile-companion view
and the existing native mobile app screen, since web has no FAB pattern anywhere in the
app. Mobile filter strip: horizontal scroll of For You pill (hidden if no interests) +
content-type pills + a sticky-right "⊞ Sections" button (dark ink fill, white text) that
expands a 2-column dropdown panel (People Near Me / Membership) below the strip when
tapped.

Output 3 frames: Frame 1 (Desktop, logged-out), Frame 2 (Desktop, logged-in + For You
active), Frame 3 (Mobile Companion).
```

---

## 5. POST COMPOSER — WEB (Site B, web.themoveee.com/feed)

> Note on scope: web counterpart to the mobile catalog's §4A "Template Picker Sheet" +
> §4B "Post Composer (All 10 Templates)". Read `packages/shared/components/pulse/
> SubmitPost.tsx` in full before drafting this — the real web composer is architecturally
> different from mobile in three load-bearing ways, not just a smaller-screen redraw:
> (1) there is **no separate template-picker bottom sheet at all** — template selection is
> a single always-visible horizontal pill bar at the top of one persistent composer card,
> and switching pills swaps the fields below in place; (2) the composer is **inline in the
> feed timeline**, never a full-screen takeover or modal; (3) **the web composer only has
> 9 templates — there is no Book Review template on web** (mobile-only, per CLAUDE.md
> "Book Review → directory linkage (mobile-only...)" — `TEMPLATES` in `SubmitPost.tsx` has
> no `book-review` entry and no book search UI exists anywhere in `packages/shared`). Do
> not draw a 10th frame for it.

### Brand architecture
Site B (`apps/connect`), Moveee. No "Connect" branding on any composer chrome.

### Why this section exists
`SubmitPost.tsx` renders one of three states depending on session: logged-out (a single
disabled-looking prompt button that dispatches `open-auth-modal`), success (a purple-tinted
confirmation banner, replaces the whole card briefly), or the full composer (template pill
bar + avatar + dynamic field stack + submit). The field stack per template is generally the
same *data* as the mobile catalog's §4B (same labels, same required-ness, same character
limits in `MAX_CHARS`), but laid out as a single-column form inside one card rather than a
full-screen view with a media toolbar pinned above the keyboard — there's no keyboard to pin
above on desktop. Three gating states that exist in real code have no mobile-catalog
equivalent worth copying verbatim and need drawing fresh: the Pro/reputation gates on Poll,
Itinerary, and Event (per CLAUDE.md "Reputation-gated privileges"), and the auto-tag
detection behaviour (typing 20+ characters into the Standard Post body auto-selects a
section tag from keyword matching, shown as a brief tag-bar state change, no toast).

### Marketing copy (final — use verbatim, do not paraphrase)
- Logged-out prompt: `"What's happening in culture? Join the community to share."`
- Template pill labels (note: shorter than the mobile catalog's full names): `Update` 📝 ·
  `Gem` 💎 · `Take` 💬 · `Food` 🍽️ · `Showcase` 🎨 · `Poll` 📊 · `Route` 🗺️ · `Event` 📅 ·
  `Quote` ✦
- Field placeholders (verbatim, per `placeholders` map in `SubmitPost.tsx`):
  - post: `"What's happening in culture?"`
  - quote: `"The quote…"`
  - hidden-gem: `"Tell us about this gem — what makes it special?"`
  - cultural-take: `"Share your take…"`
  - food-review: `"How was the food?"`
  - creative-showcase: `"Caption (optional)"`
  - poll: `"Ask a question…"`
  - itinerary: `"Describe your route…"`
  - event: `"Describe the event — what to expect, why it matters… (optional)"`
- DirectorySearch placeholders: cultural-take → `"What are you writing about?"`,
  food-review → `"Which restaurant or venue?"`, hidden-gem → `"Search or add a location *"`
- Food review dish input: `"Dish or item name *"`
- Event fields: `"Event name *"` / labels `"Start date & time *"` / `"End date & time"`

### DEV ANNOTATION REQUIREMENT
  1. Above the template pill bar:
     "DEV: `composer-template-bar` — exactly 9 pills, always visible, no modal/sheet step.
     Switching pills calls `handleTemplateChange()` which resets the section tag to
     `TEMPLATE_TAGS[t]` (food-review→Food, itinerary→Travel, creative-showcase→Art) or
     clears it for templates with no default. **Do not design a 10th 'Book Review' pill —
     it does not exist on web**, see CLAUDE.md."
  2. Above the avatar element in the form row:
     "DEV: 34px circle, border colour swaps to purple (#7a4da0) only for the Quote
     template, ochre (#c5491f) for every other template — `user.avatarUrl` image if set,
     else initials from `user.name`."
  3. Above the Poll and Itinerary pills:
     "DEV: Both require Taste Maker (2,500 rep) or Moveee Pro — gate enforced server-side
     in `apps/connect/app/api/community/submit/route.ts` (403 on submit), but there is
     currently NO client-side lock/disabled state on these two pills in the real component
     — clicking through and submitting as an ineligible user fails only after pressing
     Post. This prompt should design the missing inline lock affordance (greyed pill + 🔒 +
     tooltip 'Taste Maker or Pro required') as a recommended UI gap-fill, not a
     transcription of existing behaviour."
  4. Above the Event pill:
     "DEV: Requires Culture Contributor (500 rep) or Pro, same client-side gap as #3 above
     — same recommended lock affordance applies."
  5. Above the Standard Post textarea:
     "DEV: `handleTextChange()` auto-detects a section tag from keyword matching once the
     body exceeds 20 characters (`detectTagFromContent()`), unless the user has manually
     picked a tag (`tagLocked`). Show this as a state where the tag bar's active pill
     visibly shifts a beat after the user stops typing — no toast or explicit confirmation
     in the real UI, so don't invent one here."
  6. Above the link-preview behaviour (Standard Post only):
     "DEV: A debounced (800ms) `fetch` to `/api/community/link-preview` fires automatically
     when a URL appears in the body text — renders via `SourcePreviewCard` once resolved.
     Citizens (non-Pro) are blocked from posting links at all by the spam-protection layer
     server-side (see CLAUDE.md 'Community feed spam protection') — the link preview can
     still render client-side before that rejection happens, so design a brief inline
     error state for this case ('Links are a Moveee Pro feature' or similar) since none
     currently exists."
  7. Above the multi-image upload control (post, hidden-gem, food-review, itinerary):
     "DEV: Capped at 4 files via `.slice(0, 4)` in `handleGalleryChange()`, base64 preview
     via `FileReader`, actual upload happens on submit via `/api/community/upload-image`
     (R2-backed) — not per-file on add."
  8. Above the success state:
     "DEV: Replaces the entire composer card with a single purple-tinted banner
     (`#f3eef8` bg, `#e0d4f0` border, `#7a4da0` text, italic Fraunces) — there is no
     separate 'view your post' or 'post again' CTA in this state, it's transient (the
     parent feed already prepends the new item via `onPosted`)."

### PROMPT 5 — Post Composer (Desktop 1440px, inline card)

```
Senior web UX/UI designer — Moveee (Site B, web.themoveee.com/feed). Desktop frame
1440px, composer card constrained to the center-timeline column width (~660px, matching
PulseFeed's center rail).
Brand: white card bg, paper-warm #F3ECE0 (quote avatar accent), ochre #C5491F, purple
#7A4DA0 (quote-only accent), ink #14110D, mute #7A6F5C, success #2D6A4F, ghost #E0D8CE.
DM Sans body, Fraunces display (quote/italic fields), JetBrains Mono char counters.

FRAME 1 — LOGGED-OUT STATE:
White card, 1px ghost border, radius 6px, 1rem vertical / 1.25rem horizontal padding.
Row: 34px grey circle placeholder avatar (no image) + full-width pill button, paper-warm
bg, ghost border, "What's happening in culture? Join the community to share." DM Sans
14px ink-soft, left-aligned, click target = entire button (opens auth modal elsewhere).

FRAME 2 — TEMPLATE BAR + STANDARD POST (default template):
TEMPLATE BAR (top of card, horizontal row, no wrap, ghost bottom border, 0.5rem padding):
  9 pills, each: emoji (14px) + label (DM Sans 12px bold), 0.3rem/0.7rem padding,
  radius-full, ghost border + ink-soft text when inactive; ochre fill + white text when
  active (purple fill + white text specifically for the Quote pill when active).
  Order: 📝 Update (active) · 💎 Gem · 💬 Take · 🍽️ Food · 🎨 Showcase · 📊 Poll ·
  🗺️ Route · 📅 Event · ✦ Quote.

FORM BODY (1rem padding, flex row, 0.75rem gap):
  Avatar (34px circle, ochre border 1.5px, photo or initials).
  Fields column (flex 1):
    Textarea, no border, 15px DM Sans ink, placeholder "What's happening in culture?",
      min-height ~90px, filled with: "The Lagos jazz scene is having a real moment right
      now — three new venues opened this year alone."
    Char counter "118 / 3000" JetBrains Mono 11px mute, bottom-right under textarea.
    Section tag row (horizontal pills, 8px gap): Music (active, ink fill white) · Film ·
      Art · Fashion · Food · Sport · Travel · Ideas · Literature · Design · Tech (ghost,
      scrollable row) — annotate per DEV #5 that "Music" became active automatically once
      the body passed 20 characters, no manual tap.
    Photo row (shared upload pattern, reuse the exact 80×80px ADD-tile + thumbnail design
      already specified in the mobile catalog's §4B shared pattern — same visuals, web
      just shows it inline under the textarea instead of above a keyboard toolbar): 2
      added photo thumbnails + 1 ADD tile, "Up to 4 photos" caption below.
    Bottom row (space-between): left empty, right "Post" button — ochre fill, white DM
      Sans 13px bold, radius 4px, disabled/50%-opacity style variant shown faded beside it
      labelled "disabled until valid".

FRAME 3 — TEMPLATE BAR STATES (component sheet, isolated, 9 pills shown 3 ways):
  Row A: all 9 pills inactive (default ghost style).
  Row B: "Poll" pill in the RECOMMENDED locked-affordance state (greyed fill, 🔒 16px icon
    after the label, reduced opacity ~60%) with a tooltip callout below: "Taste Maker or
    Pro required" DM Sans 11px white on dark ink background, small triangle pointer.
  Row C: "Quote" pill active — purple fill #7A4DA0, white text/emoji (the one template
    whose active colour is not ochre).

FRAME 4 — REMAINING 7 TEMPLATE FIELD STACKS (one stacked column per template, card width
~660px each, arranged as a 2-column × 4-row grid for the canvas, 7 cards total — Hidden
Gem, Cultural Take, Food Review, Creative Showcase, Poll, Route/Itinerary, Event):
  Reuse the exact field labels, required-asterisks, star ratings, chip rows, and copy
  already fully specified per-template in the mobile catalog's §4B Frames 2–8 (Hidden Gem,
  Cultural Take, Food Review, Creative Showcase, Poll, Itinerary, Event) — same data, same
  validation rules (`canSubmit()` per template) — just laid out as a single-column form
  inside one ~660px white card instead of a full-screen view, with the template bar from
  Frame 2 always pinned above the field stack on every card. Quote template field stack:
  reuse mobile §4B Frame 9 exactly, swap the avatar accent to purple per DEV #2.
  Do NOT include a "Book Review" card here — see scope note above.

FRAME 5 — SUCCESS STATE:
Card fully replaced by a single banner: pale purple #F3EEF8 fill, 1px #E0D4F0 border,
radius 6px, 0.85rem/1rem padding, text "Posted! Your update is now live in the feed."
(representative copy — exact string is dynamic per template in the real component) DM
Sans 14px Fraunces italic #7A4DA0, no buttons.
```

Output 5 frames: Frame 1 (logged-out), Frame 2 (template bar + Standard Post), Frame 3
(template bar component states), Frame 4 (remaining 7 template field stacks), Frame 5
(success state).

---

## 6. MAGAZINE / ARTICLE DETAIL — WEB (Site A, themoveee.com/magazine)

### Note on scope

The mobile catalog's §5 covers two screens — "Magazine Home & Browse" (Prompt 5A) and
"Article Detail Full Scroll States" (Prompt 5B) — as a single-column, app-shell scroll
experience with a bottom-sheet TOC overlay. The real web equivalent is architecturally
different in a way that matters for the prompt: the article page is a genuine **3-column
desktop layout** (`article-wrap`: TOC sidebar / prose / right sidebar, defined in
`apps/site/app/magazine.css` and rendered by `apps/site/app/magazine/[slug]/page.tsx`) —
there is no bottom sheet at all on desktop, the TOC is a permanently-visible left column.
A `<details>`-based collapse only matters at mobile width. This section also corrects the
mobile catalog's mid-article gate CTA, which uses the stale phrase "Upgrade to Connect
Pro" — the real component (`packages/shared/components/ContentGate.tsx`) says **"Upgrade
to Moveee Pro"**; per the project's brand-naming convention "Connect" no longer refers to
the platform, so this prompt uses the real, current copy, not the mobile catalog's.

### Brand architecture

Site A — **Moveee Magazine**, themoveee.com. No auth required to browse; the
member/patron gate only applies to individual gated articles. Paper/ink/ochre tokens
throughout (`var(--paper)`, `var(--ink)`, `var(--ochre)`) — no Connect-style dark
community chrome anywhere on this surface.

### Why this section exists

Grounded directly in `apps/site/app/magazine/MagazineArchiveWrapper.tsx` (home/browse),
`apps/site/app/magazine/issues/page.tsx` (issues archive), `apps/site/app/magazine/[slug]/page.tsx`
(article detail — 660 lines, the real 3-column layout + hero + gate + sidebar widgets +
author band + related), `packages/shared/components/ArticleContentGate.tsx` +
`packages/shared/components/ContentGate.tsx` (the real gate UI/copy), `apps/site/components/ArticleActions.tsx`
(share/bookmark/like bar), and `apps/site/components/FinishReading.tsx` (the reward banner
on scroll-completion). Every frame below transcribes real markup, real class names, and
real conditional logic rather than re-skinning the mobile screens.

### Marketing copy (final — use verbatim, do not paraphrase)

**Magazine home header:**
> Moveee *Editorials*
> Long-form essays, interviews, and cultural commentary. The editorial heart of The Moveee.

**Category ticker (loops):** Visual Art ✦ Film ✦ Literature ✦ Music ✦ Fashion ✦ Food ✦

**Section labels (in order down the home page):** Selected → Featured Stories · Visual →
In Focus · (Editorial section, own component) · Digest → Quick Reads · Voices → Opinions &
Essays

**Newsletter CTA band (bottom of magazine home):**
> Weekly Dispatch
> The Moveee *Newsletter*
> Culture, art, heritage, and the stories worth reading — curated from Lagos, London,
> Accra, and beyond. In your inbox every Friday.
> Tags: Film · Art · Fashion · Heritage · Music
> Button: "Browse Issues →" · Note: "Free · Published every Tuesday"

**Issues archive header:** Magazine (eyebrow) → All Issues. Empty state: "No issues
published yet."

**Article hero eyebrow:** `★ {Category Name}` (· {Country} if present)

**Byline bar labels:** "Words by" / "Published" / "Reading time" — values e.g. "8 minutes"

**TOC heading:** "In this piece" — numbered list `01, 02, 03…` per heading.

**TOC metadata labels:** Writer / Location / Section / Series / Industry

**Sidebar — Issue card:** "This piece is from" → "Issue {N}" or issue name → "Read the full
issue →"

**Sidebar — Shop the Edit:** "Shop the Edit" → "Browse all products →"

**Sidebar — newsletter card (always Culture Drop, never GetMeLit, in this slot):**
> ★ Culture Drop
> Culture in your inbox, every Tuesday.
> Film picks, exhibition openings, music worth your time. No noise.
> Button: "Subscribe free →"

**Sidebar — related story cards:** category label → title → excerpt → "Read →"

**Sidebar — dark archive card:**
> From the archive
> Explore the full magazine
> Browse all essays, interviews, and dispatches from The Moveee editorial team.
> "All stories →"

**Content gate copy (real, from `ContentGate.tsx` — three states, use exactly):**

*Member-only, logged out:*
> ★ Moveee Community
> This one's for the community.
> Create a free Moveee account to read this and everything else in the member archive.
> Takes 30 seconds — no card needed, free forever.
> Primary: "Join free — it takes 30 seconds →" · Secondary: "Already have an account? Sign in"
> Footnote: "Free membership · No credit card · Cancel anytime"

*Patron-only, logged out:*
> ★ Moveee Pro
> There's more on the other side.
> This piece goes deeper — reserved for Moveee Pro members. Join a global community of
> culture-forward people, with exclusive editorials, a Pro badge, and long-form content
> worth your time.
> Primary: "Explore Moveee Pro →" · Secondary: "Already a member? Sign in"
> Footnote: "Moveee Pro · {yearly price} · Cancel anytime · Free account always available"

*Patron-only, logged in as Citizen:*
> ★ Moveee Pro
> You're one step away.
> This piece is part of our Moveee Pro archive — extended reads, exclusive member events,
> and long-form content for people who want to go further with The Moveee community.
> Primary: "Upgrade to Moveee Pro →" (links to `/feed`)
> Footnote: "{yearly price} · Cancel anytime"

**Finish Reading banner:** "Article complete!" / "+ {N} Culture Points earned" (or
"Already credited — thanks for reading!" if previously awarded this browser session).

**Author band label:** "Words by" → name (em-italicized surname) → bio. Ghostwriter
variant: name → "as told to **{author}**" → bio. CTA: "More by {FirstName} →"

**Shop the Edit (mobile strip) eyebrow/title:** "Shop the Edit" → "From this story" →
"Browse all products →"

**Related section:** "Keep *reading*" → "All stories →"

### DEV ANNOTATION REQUIREMENT

<!-- DEV: Three-column `article-wrap` grid (TOC / prose / sidebar) is desktop-only —
collapses to a single column with the TOC rendered as a collapsible `<details>` (chevron
toggle, "In this piece" summary) below ~860px. There is no bottom-sheet TOC overlay on
web at any breakpoint, unlike the mobile app — design the mobile companion frame with the
TOC as an inline collapsed accordion above the prose, not a drawer. -->

<!-- DEV: The hero has two variants depending on whether the post has a featured image —
"article-hero" (full-bleed image + vignette + overlaid breadcrumb + hero-text block) vs.
"standard-hero" (plain breadcrumb above a paper-background header, no image). Design both;
do not assume every article has a hero image. -->

<!-- DEV: ArticleContentGate always shows a real preview before the gate — specifically
the first 3 `<p>` tags of the article (`processedContent.match(/<p>...<\/p>/gi).slice(0,3)`),
faded out under a 160px bottom gradient (`linear-gradient(to bottom, transparent, var(--paper))`).
This is a hard rule, not arbitrary placement — never show 0 paragraphs or an arbitrary
mid-paragraph cutoff. -->

<!-- DEV: Use the exact 3-state gate copy in the Marketing Copy section above — the mobile
catalog's "Upgrade to Connect Pro" wording is stale and must not be reused; the real,
current label is "Moveee Pro" in all three gate states. -->

<!-- DEV: The right sidebar stacks conditionally and in this exact order when present:
issue card (only if the post belongs to an issue) → Shop the Edit widget (only if
`featuredProducts.length > 0`) → newsletter card (always present, hardcoded Culture Drop
copy, never GetMeLit in this slot) → up to 2 related-story cards → dark "From the archive"
card (always present, last). Don't reorder or assume all blocks always render. -->

<!-- DEV: "Shop the Edit" renders TWICE when a post has featured products — once as a
compact sidebar widget (desktop, `ste-sidebar-card`, 56px thumbnails) and once as a
full-width 2-col product grid below the author band (`ste-section--mobile`, hidden on
desktop via CSS, not a responsive single component). Design both as genuinely separate
frames, not one frame that reflows — they have different visual treatments. -->

<!-- DEV: FinishReading is a silent client-side mechanic — no progress toast, no visible
nudge while reading. It checks scroll position (≥85% of scrollable height) and a minimum
dwell time (max of 30s or 50% of estimated reading time) every second, fires once per
post per browser (localStorage-gated), and renders the completion banner in-place at the
point in the DOM where `<FinishReading>` sits (just after comments, before the series
context block) — it does not float or pin. Only renders for logged-in users. -->

<!-- DEV: ArticleActions (share/bookmark/like) sits inside the byline bar itself (hero
text block on image variant, header block on standard-hero variant) — it is not a
separate floating action bar. Logged-out tap on bookmark/like dispatches an
`open-auth-modal` custom event rather than navigating to /login. -->

<!-- DEV: The author-band has a real fallback illustrated SVG avatar (face/hair/garment
shapes in ink/ochre/dark-green) when no avatar URL exists — do not design a generic grey
circle placeholder, use the same illustrated-portrait treatment as a real fallback state. -->

### PROMPT 6 — Magazine Home, Issues Archive & Article Detail (Desktop 1440px + Mobile 390px)

```
FRAME 1 — MAGAZINE HOME (Desktop, 1440px, apps/site/app/magazine/MagazineArchiveWrapper.tsx)

Background: var(--paper) throughout.

HEADER (mag-head):
- H1 "Moveee Editorials" (Editorials in italic serif), 44px Fraunces light
- Description paragraph below, 15px, var(--ink-soft), max-width 480px
- Below: CategoryNav tab strip ("All Stories" + WP categories, active tab = ochre
  underline) + secondary filter dropdowns (Industry/Country/Series) right-aligned

CATEGORY TICKER: full-width thin marquee strip, looping mono-caps text "Visual Art ✦
Film ✦ Literature ✦ Music ✦ Fashion ✦ Food ✦", var(--ochre) separators, scrolling
left continuously, ink background

HERO FEATURE (hf-main + hf-sidebar, 2-col):
- Left (hf-main, ~65% width): eyebrow (category name, ochre mono caps) → tall 16:9 hero
  image (var(--ink) bg if missing) → serif headline 36px → standfirst paragraph →
  meta row: date (left) + "Read Extended Edit ↗" (right, ochre underline)
- Vertical divider (hf-divider)
- Right (hf-sidebar, ~35%): 3 stacked compact story cards — each: kicker label, small
  thumbnail, serif title 18px, date — no excerpt at this size

SECTION BAND "Featured Stories" (sec-label "Selected" above sec-header "Featured
*Stories*" + "View all →" right-aligned):
- 3-col grid, each card: portrait image, kicker, serif title, 2-line excerpt, date

PORTRAIT SCROLL "In Focus" (sec-label "Visual"):
- Horizontal scroll row of 5 portrait-aspect cards (image fills, kicker below, serif
  title, date) — peek-next-card overflow

EDITORIAL SECTION: separate component (EditorialSection) — render as a generic
feature-band placeholder matching the site's card visual language (not detailed here,
component is out of scope)

DIGEST "Quick Reads" (sec-label "Digest"): 4-col compact grid — small square image,
kicker, title, date, no excerpt

OPINIONS "Opinions & Essays" (sec-label "Voices"), paper-deep background section:
- 2-col grid of pull-quote-style cards: large italic serif quote (the post title used
  as a quote), author name below, truncated excerpt, kicker

CTA BAND (cta-band, ink background, full-bleed, 3-col):
- Left: "Weekly Dispatch" eyebrow, "The Moveee *Newsletter*" serif
- Mid: paragraph copy + tag pills (Film/Art/Fashion/Heritage/Music)
- Right: "Browse Issues →" button (paper/white pill on ink) + "Free · Published every
  Tuesday" note

FRAME 2 — ISSUES ARCHIVE (Desktop, 1440px, apps/site/app/magazine/issues/page.tsx)

- Header: "Magazine" eyebrow (ochre mono caps) → "All Issues" serif H1, centred or
  left-aligned column, generous top padding
- Grid (mag-issues-grid): 4-col, each card (mag-issue-card):
  - Cover image, 3:4 aspect, var(--paper-deep) placeholder block if no cover URL
  - Issue number label below ("Issue {N}" or fallback to issue name), mono caps
  - Optional subtitle line, italic serif, smaller
- Empty state (no issues): centred italic serif "No issues published yet."

FRAME 3 — ARTICLE DETAIL TOP (Desktop, 1440px, apps/site/app/magazine/[slug]/page.tsx)

ProgressBar: thin 2px ochre bar fixed to top of viewport, fills as user scrolls (0–100%)

HERO (image variant — article-hero):
- Full-bleed 60vh image, dark vignette gradient bottom-up
- Breadcrumb overlaid top-left on the image: "Home / Editorials / {Category} /
  {Article Title}" — mono caps, white/translucent, ochre "/" separators
- hero-text block bottom-left over the vignette:
  - Eyebrow: "★ {Category}" (· {Country} if present), ochre
  - H1 serif 48px, white, tight leading
  - Standfirst paragraph, 18px, white/85% opacity
  - Byline bar (horizontal row): "Words by" / author name — "Published" / date —
    "Reading time" / "{N} minutes" — then ArticleActions icon trio (share/bookmark/
    heart-with-count) right-aligned, small circular outline buttons on dark glass bg

HERO (no-image variant — standard-hero): same breadcrumb (not overlaid, plain ink-on-
paper above the header), then a paper-background header block with the same eyebrow →
H1 → standfirst → byline-bar stack, just without the photographic backdrop.

3-COLUMN BODY (article-wrap, max-width ~1080px centred):
- LEFT (toc, ~200px): "In this piece" heading, numbered link list (01/02/03…, ochre
  number, ink text, hover ochre), divider, then toc-meta block: Writer / Location /
  Section / Series / Industry label-value pairs, mono-caps labels
- CENTER (prose, ~600px): body copy begins — show first 2 paragraphs at full opacity,
  third paragraph fading into a 160px bottom gradient (transparent → paper), then the
  ContentGate card directly beneath (see Frame 4)
- RIGHT (sidebar, ~260px): stacked cards in fixed order — issue card (ochre left
  border accent) → Shop the Edit widget (if present) → Culture Drop newsletter card →
  up to 2 related story cards → dark "From the archive" card

FRAME 4 — CONTENT GATE STATES (Desktop, component close-up, 700px wide)

Render 3 side-by-side gate card variants (each ~220px tall, top border rule, generous
padding):
1. Member-only / logged out — key-lock SVG icon (ochre) → "★ Moveee Community" label →
   "This one's for the community." H3 → body copy → two buttons (filled ink "Join
   free…", outline "Already have an account?") → mono footnote
2. Patron-only / logged out — same layout, "★ Moveee Pro" label, "There's more on the
   other side." H3, body copy, "Explore Moveee Pro →" / "Already a member? Sign in",
   footnote with price
3. Patron-only / logged in as Citizen — same layout, single button only ("Upgrade to
   Moveee Pro →"), no secondary button, shorter footnote (price + cancel line only)

FRAME 5 — ARTICLE END MODULES (Desktop, 1440px, stacked sections below the 3-col body)

- FinishReading banner (only render in this frame as "earned" state): tinted
  ochre-8%-opacity card, checkmark icon left, "Article complete!" italic serif +
  "+ 15 Culture Points earned" small mute text right of icon
- Series context strip (paper-deep background, centred narrow column): "Part of the
  series" label → series name link (ochre underline) → description paragraph
- Author band (author-band, horizontal row): 120×120 circular avatar (real photo or
  the illustrated SVG fallback) → "Words by" label + name (serif, surname italic) +
  bio paragraph → "More by {FirstName} →" CTA pill, right-aligned
- Shop the Edit mobile-strip section (render here even on desktop frame to document
  it — note via dashed outline that it's CSS-hidden ≥ desktop breakpoint): eyebrow +
  "From this story" H2 → 4-card horizontal-scroll grid → "Browse all products →"
  footer link
- Related "Keep reading" section: header row (H3 "Keep *reading*" + "All stories →")
  → 3-col grid of related story cards (image, category kicker, title, date)

FRAME 6 — MOBILE COMPANION (390px, single column)

- Hero: full-bleed image (16:9) with overlaid eyebrow/title/standfirst, byline bar
  wraps to 2 lines, ArticleActions icons inline below byline
- TOC: collapsed accordion directly below hero — "In this piece ▾" summary row,
  tapping expands the numbered list + toc-meta inline (not a sheet/drawer)
- Prose: full-width single column, same 3-paragraph-preview + gradient + gate pattern
- Sidebar cards (issue/Shop the Edit/newsletter/related/archive) stack in the same
  fixed order directly beneath the gate, full-width, before the author band
- Author band: avatar + name + bio stack vertically (not the desktop horizontal row)
- Shop the Edit mobile strip: this is the ONE place it actually shows on mobile —
  horizontal-scroll product cards
- Related: vertical stack of 3 cards instead of a grid
```

Output 6 frames: Frame 1 (Magazine Home, Desktop), Frame 2 (Issues Archive, Desktop),
Frame 3 (Article Detail Top, Desktop), Frame 4 (Content Gate 3 states, component
close-up), Frame 5 (Article End Modules, Desktop), Frame 6 (Mobile Companion, full
scroll).

---

