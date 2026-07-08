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
  `StoopReminderCard` is inserted at the same position for logged-in viewers
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
- Right sidebar About card: `"About Moveee"` — `"The community for Black creatives,
  entrepreneurs, and culture lovers. Pulse is where members post, share, and
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
  4. Above the StoopReminderCard:
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
      9px bold uppercase mute, body "The community for Black creatives,
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
  After feed card 5: Event Spotlight Carousel, THEN a StoopReminderCard directly
    beneath it (paper-warm card, ochre left accent, Stoop icon + short reminder
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

## 7. EVENTS / HAPPENINGS — WEB (Site B, web.themoveee.com/events)

### Note on scope

The mobile catalog's §6 covers Prompt 6 (Events List + Event Detail + RSVP Success,
app-shell style) and Prompt 6B — a from-scratch redesign introducing a Timeline View,
a Calendar View, and a bottom Filter Sheet. **The real web app has no calendar grid
and no filter sheet at all.** Filtering on web happens through dedicated, separately
routed archive pages (`/events/{citySlug}` and `/events/{categorySlug}`, both served
by the same `[slug]/page.tsx` dynamic route via lookup tables), not a modal/sheet
overlay on the list page. This prompt is grounded entirely in the real editorial-style
Happenings architecture: `apps/connect/app/events/page.tsx` (list/home),
`apps/connect/app/events/components/EventTimeline.tsx` (the month/day-grouped list +
sidebar), `apps/connect/app/events/[slug]/page.tsx` (Luma-inspired detail page), and
`apps/connect/app/events/components/RSVPForm.tsx` (the real RSVP/ticketing form).
Mobile's calendar-view and filter-sheet concepts are intentionally **not** reproduced
here — see DEV ANNOTATION 1 below for why, and what to build instead if a filter UI
is ever wanted on web.

The AI-discovered-event variant (`event.isAiGenerated` → a separate
`DiscoveredEventPage` component with its own related-events rail) exists in the real
codebase but was not read in depth for this prompt and is out of scope for this pass
— flag it as a follow-on prompt candidate, not as a frame here.

### Brand architecture

Site B (`apps/connect`), brand name **Moveee** (never "Moveee Connect"). Path:
`/events`. This is the community/auth surface — "Happenings" is the in-product label
for the events feature, used in headings; "Moveee Happenings" appears as the literal
hero title. The closing CTA band sells **Moveee Pro** (never "Connect Pro").

### Why this section exists

Real code shows Events is not a generic list-and-detail utility screen — it's built
as a full editorial section with the same visual register as the Magazine: a stats
hero, a marquee ticker, curated grids (Featured, By City), a conditional
membership-perk carousel (Literati Connect), a real chronological timeline with a
sidebar, and a closing membership pitch. The detail page borrows the "Luma-inspired"
compact hero pattern (image left, structured info right) rather than mobile's
full-bleed-image-then-card-overlap pattern, and the RSVP mechanism is materially
richer than mobile's 2-field form — it has to support both free RSVP and paid
ticketing with an external payment-gateway redirect and async webhook confirmation
states, none of which mobile's PROMPT 6 models.

### Marketing copy (final — use verbatim, do not paraphrase)

**Hero (`EventHero`):**
> Moveee *Happenings*

(standfirst, paraphrase-free placeholder — pull live from `event-hero` props if
regenerating against current data; do not invent a different hero title)

3 stat labels: "Happenings this year", "Cities covered", "Categories"

**Category ticker (loops, ★ separators):**
> Visual Art ★ Film ★ Literature ★ Music ★ Fashion ★ Food ★ Design ★ Community

**Section labels:**
> Featured
> By City

**Connect CTA band:**
> Moveee
>
> Members go first.
>
> 1. Early RSVP — 48 hours before public
> 2. Private views & members-only dinners
> 3. Priority for Origins journeys & supper tables
> 4. 15% off Lifestyle shop
>
> Become a Member →
>
> from $9 / month

**Luma-style detail hero registration box (two states):**
> {admission} · {location}
> Find Out More →

> Secure your place below.
> RSVP Now →

**RSVP form (free flow):**
- Field labels: "Full name", "Email address", "How did you hear about this?" (optional)
- Capacity bar label row: "Capacity" / "{spotsRemaining} spot(s) remaining"
- Submit button: "Confirm RSVP →" (idle/default) → "Processing…" (loading)
- Success card: "You're on the list." / "Confirmation sent by email · See you there."
- Error copy: "You are already registered for this event." (already_registered) /
  "Sorry — this event is now fully booked." (sold_out) / generic fallback otherwise

**RSVP form (paid flow):**
- Submit button: "Pay {price} →" (idle/default) → "Redirecting to payment…" (loading)
- `ticket_confirmed` return state: "Ticket confirmed." (green-tinted card, ref code)
- `ticket_pending` return state: "Payment received." (blue-tinted card, ref code —
  this is the async Stripe-webhook-confirmation state, distinct from the synchronous
  Paystack confirmation)

### DEV ANNOTATION REQUIREMENT

When generating, insert these as `<!-- DEV: ... -->` comments at the indicated frame:

1. <!-- DEV: There is no calendar-grid view and no bottom filter sheet on the real
   web app — do not build mobile's PROMPT 6B Frame 2/3 concepts here. Filtering is
   handled by dedicated archive routes instead: `/events/{citySlug}` and
   `/events/{categorySlug}`, both served by the same `app/events/[slug]/page.tsx`
   dynamic route via `CITY_SLUGS`/`CATEGORY_SLUGS` lookup tables (6 cities, 20
   category slugs — mixing short legacy slugs like "music" with canonical
   `culture_interest` taxonomy slugs like "live-music"). If a filter UI is wanted on
   web later, the natural shape is a query-param-driven filter bar on the list page
   that deep-links into these existing archive routes, not a new sheet/modal. -->
2. <!-- DEV: EventTimeline groups chronologically by month then by day
   (`groupByMonth`/`groupByDay`, keyed off `eventDate || date`) — this is real
   grouping logic, not a flat list with date labels. Each row's category icon comes
   from a fixed CAT_ICONS glyph map (music ♪, film ◉, visual-arts ◈, fashion ✦,
   food ◆, literature ▬, design ◻, performance ★, community ◇, tech ○) layered over
   a category-color gradient placeholder when there's no real image — reuse this map
   exactly, don't invent new icons per category. -->
3. <!-- DEV: The Literati Connect carousel only renders conditionally
   (`literatiEvents.length > 0`), filters to `isLiterati` events, prefers the
   session user's city with a fallback to all cities, and caps at 10 items via
   `EventsCarousel`. Show it in the frame as present, but annotate it as
   conditional — it should not always appear in the generated prototype's default
   state. -->
4. <!-- DEV: The detail-page hero is the "Luma-inspired" 2-column layout
   (`event-hero-luma`) — portrait image left, structured info column right (category
   pill + live status dot computed from now vs event date/endDate, title, optional
   tagline, date chip with month/day icon block + opening hours, venue chip,
   registration box). This is NOT mobile's full-bleed-image-then-overlapping-white-
   card pattern — don't reuse that layout here. -->
5. <!-- DEV: RSVPForm branches on whether the selected ticket type has
   `ticketAmount > 0`. Paid tickets POST to `/api/events/ticket` and redirect to an
   external `payment_url` (Paystack or Stripe); free RSVPs POST to
   `/api/events/rsvp` directly with no redirect. Both paths share the same form UI
   up to the submit button — model this as one component with a price-dependent
   submit label and behaviour, not two separate forms. -->
6. <!-- DEV: On mount, RSVPForm reads `ticket_confirmed`/`ticket_pending`/
   `ticket_failed`/`ticket_cancelled` URL params — these are payment-gateway return
   states, not form-submission states. `ticket_pending` specifically represents an
   async Stripe webhook that hasn't confirmed yet at redirect time; it must look
   visually distinct (blue-tinted) from the synchronous `ticket_confirmed` success
   (green-tinted), not just a duplicate of it. -->
7. <!-- DEV: The capacity bar only renders when BOTH `capacity` and
   `spotsRemaining` are present on the event — many free community events have
   neither and should show no bar at all, not an empty/zero-width one. Ticket-type
   rows (name/info/price) only render above the form when `tickets.length > 1`; a
   single default "General Admission" ticket type renders no selector at all. -->
8. <!-- DEV: Sidebar info-cards on the detail page stack in a fixed conditional
   order: RSVP card (always) → "Organised by" card (only if organiser resolves,
   purple #3c3489 left border, links to /directory/{slug}) → associated-journey card
   (only if `associatedJourney` present, dark bg, links to /origins/{slug}) →
   "Press & Media" card (always present, generic fallback copy if no custom contact
   set). Preserve this order and conditionality exactly — don't always show all four. -->
9. <!-- DEV: AI-discovered events (`event.isAiGenerated`) route to a wholly separate
   `DiscoveredEventPage` component with its own related-events logic and are
   explicitly out of scope for this prompt — do not attempt to merge that flow into
   the frames below. -->

### PROMPT 7 — Events List, Event Detail, RSVP Form (Desktop 1440px + Mobile 390px)

```
TASK: Design the Happenings (Events) list page, an individual event detail page, and
the RSVP form component for Moveee's web community app (web.themoveee.com/events).

CONTEXT: This is Site B — Moveee's community + auth surface, editorial-magazine
visual register (paper background, ink text, ochre accents, serif display type +
mono-caps labels), matching the rest of the Connect app. Events here are called
"Happenings" in headings. The closing CTA pitches Moveee Pro membership perks.

ELEMENTS:

FRAME 1 — EVENTS LIST / HOME (Desktop, 1440px, full scroll)

- Hero (`EventHero`): "Moveee *Happenings*" serif display title (Happenings
  italicised), standfirst paragraph, 3 stat chips below (Happenings this year /
  Cities covered / Categories), generous top/bottom padding, paper background
- Category ticker: full-width dark marquee strip, looping text row repeating
  "Visual Art ★ Film ★ Literature ★ Music ★ Fashion ★ Food ★ Design ★ Community",
  duplicated content for seamless CSS scroll loop
- "Featured" section: sec-label "Featured" + H3 header, 4-card grid — each card a
  large image, category kicker, title, date — prioritising events flagged
  `isFeatured`, falling back to events with images, then plain cards
- "By City" section: sec-label + H3 "By *City*" header, 6-card grid (Lagos/Nigeria,
  London/UK, Accra/Ghana, Nairobi/Kenya, New York/USA, Paris/France) — each card
  shows city name, country, and a live happening count, links to /events/{citySlug}
- <!-- DEV 3 --> Literati Connect carousel: horizontal-scroll rail of event cards,
  rendered only when qualifying events exist, header noting "Literati Connect" theme
- EventTimeline section (id="timeline"): see Frame 1B below for its internal layout
- Connect CTA band: full-width dark ink section, 2-column — LEFT: "Moveee" mono
  eyebrow + "Members go first." serif H3 + body paragraph; RIGHT: numbered list of
  4 perks (Early RSVP 48hrs / private views & dinners / Origins priority / 15% off
  shop) + filled "Become a Member →" button (links to /feed) + "from $9 / month"
  mono fine-print

FRAME 1B — EVENT TIMELINE COMPONENT (Desktop, close-up, 1100px wide, 2-col)

- LEFT (timeline column, ~780px): month section headings (dot + month label) →
  day-group headings ("13 Jun" short date + "Friday" weekday) → EventRow list per
  day: small thumbnail (real image OR category-gradient placeholder with a glyph
  icon overlay per <!-- DEV 2 -->), title, meta row ("◍ {place} · {category}"),
  right-aligned date-range text + admission price if present, trailing "→" arrow
- RIGHT (sidebar, ~280px): "Cities" block — city name + count rows, "All cities →"
  link at bottom; "Categories" block — icon + name rows, no counts

FRAME 2 — EVENT DETAIL PAGE TOP (Desktop, 1440px, "Luma-inspired" hero)

- `event-hero-luma`, 2-column, generous padding on paper background:
  - LEFT (~560px): portrait event image (or ink-bg/ochre-circle SVG placeholder if
    none), optional "↗ Featured in {city}" chip top-left over the image
  - RIGHT (~600px): "← Happenings" back link → category pill + status dot (Upcoming
    / Current / Past, computed live) → serif display title → optional italic
    tagline → date chip (month/day icon block + weekday/date string + opening
    hours) → venue chip (pin icon + venue name + optional address) → registration
    box: EITHER "{admission} · {location}" + "Find Out More →" external link (when
    `ticketingUrl` set) OR "Secure your place below." + "RSVP Now →" anchor to the
    RSVP card
- Ticker strip directly below hero: dark marquee repeating event title, host title,
  location, formatted date, "{N} Spots"/"Limited Capacity" text, "★ Members: early
  access" note, admission or "Free Admission" — looped twice for seamless scroll

FRAME 3 — EVENT DETAIL PAGE BODY (Desktop, 1440px, 2-col below the ticker)

- LEFT column (~760px): "About the event" section label + sanitized rich-text body
  copy; optional pull-quote block (tagline as large italic blockquote + host
  attribution citation, ochre left border); optional "Selected works" grid
  (numbered "N°0{i+1}" cards: image, title, media+dimensions+year meta line);
  optional "Programme" schedule list (time + title + description rows, each with an
  access tag pill styled differently for "members" vs "open")
- RIGHT sidebar (~340px), stacked per <!-- DEV 8 -->: RSVP card (id="rsvp-section",
  see Frame 4) → "Organised by" info-card (purple #3c3489 left border, organiser
  name + link to /directory/{slug}, only if resolved) → associated-journey
  info-card (dark bg, "View Journey →" to /origins/{slug}, only if present) →
  "Press & Media" info-card (always present — heading "Press enquiries" + contact
  copy + optional mailto link)
- Artist strip (only if a featured host exists), full-width below the 2-col body:
  circular host photo, "The artist" label, host name (first name plain, rest
  italic), italic excerpt, "Read the full portrait →" link to /directory/{slug}

FRAME 4 — RSVP FORM COMPONENT STATES (Desktop, close-up, 420px wide card, show 5
states side by side or stacked with state labels)

1. Idle / free event: ticket-type row (if >1 type) → capacity bar (if both capacity
   + spotsRemaining present, label "Capacity" / "{N} spot(s) remaining", filled
   track) → Full name field → Email address field → optional ticket-type select →
   optional "How did you hear about this?" field → "Confirm RSVP →" button
2. Idle / paid event: same field stack, ticket rows show name/info/price per type,
   button reads "Pay {price} →"
3. Loading: button shows "Processing…" (free) or "Redirecting to payment…" (paid),
   disabled state styling
4. Free success: green-tinted card, "You're on the list." + "Confirmation sent by
   email · See you there."
5. Error: red-tinted inline message above the form — show both copy variants
   stacked as labelled sub-states: "You are already registered for this event."
   and "Sorry — this event is now fully booked."

Also show, as two additional small labelled cards beside the main 5: the
`ticket_confirmed` payment-return state (green-tinted, "Ticket confirmed." + ref
code) and the `ticket_pending` payment-return state (blue-tinted, "Payment
received." + ref code) per <!-- DEV 6 -->.

FRAME 5 — MOBILE COMPANION (390px, single column)

- Hero: stacked title/standfirst/stats, full-width ticker marquee unchanged
- Featured + By City sections collapse to single-column card stacks
- EventTimeline: single column, sidebar (Cities/Categories) moves below the
  timeline list rather than beside it
- Connect CTA band: stacks to single column, perks list before the button
- Detail page: Luma hero collapses to stacked (image full-width on top, info column
  below, registration box full-width)
- RSVP card: full-width, same field stack and state set as Frame 4

BEHAVIOUR:
- Ticker marquees auto-scroll continuously, pause on hover
- EventTimeline groups are chronological, real grouping logic — not flat date labels
- Detail-page status dot (Upcoming/Current/Past) is computed against the current
  time, not a static value
- RSVP form behaviour branches on ticket price per <!-- DEV 5 -->; payment-return
  states are read from URL params on mount, not from form interaction

CONSTRAINTS:
- Paper/ink/ochre palette throughout list and detail pages; only the CTA band and
  ticker strips use dark ink backgrounds
- No calendar grid, no bottom filter sheet anywhere in this prompt — see DEV 1
- Tier copy must say "Moveee Pro" — never "Connect Pro"
```

Output 5 frames: Frame 1 (Events List/Home, Desktop, includes Frame 1B Timeline
close-up), Frame 2 (Event Detail Hero, Desktop), Frame 3 (Event Detail Body,
Desktop), Frame 4 (RSVP Form States, component close-up), Frame 5 (Mobile
Companion, full scroll).

---

## 8. CULTURE GAMES — WEB (Site B, web.themoveee.com/games)

### Note on scope

The mobile catalog's §7 models only 2 playable games (Daily Trivia, Who Said It)
plus 2 dimmed "Coming soon" cards (Crossword, Sudoku) — and shows a server-tracked
countdown timer ("Next game available in 14:32:07") on the already-played state.
**On the real web app, all four games are fully built and playable**
(`apps/connect/app/games/{trivia,who-said-it,sudoku,crossword}/page.tsx`, each
rendering a shared component from `packages/shared/components/games/`) — there is
no "coming soon" state for any of them, and "already played today" is detected via
a `localStorage` key per game/date, not a live countdown. This prompt covers the
real Games Hub, the four real gameplay components, and the shared
`GameDoneScreen` result screen, with the differences from mobile flagged explicitly.

### Brand architecture

Site B (`apps/connect`), brand **Moveee**. Path: `/games`. Shared component logic
lives in `packages/shared/components/games/` and is consumed by thin Site B route
wrappers; this is consistent with the monorepo's general shared-code convention.

### Why this section exists

Real code shows Games as a complete 4-title hub, not a 2-built/2-placeholder set.
The hub page (`app/games/page.tsx`) renders a `GAMES` array of 4 entries through a
single `GameCard` component (icon, badge, accent colour, tagline, difficulty,
rounds, "Play now →"), with no disabled/dimmed state anywhere in the array or the
card component. Each individual game (`TriviaGame.tsx`, `WhoSaidItGame.tsx`,
`SudokuGame.tsx`, `CrosswordGame.tsx`) is a self-contained client component with
its own loading/playing/answered/complete/error phase machine, and all four funnel
into the same shared `GameDoneScreen` for their completion state — a single,
reusable score/share/subscribe screen rather than four bespoke ones.

### Marketing copy (final — use verbatim, do not paraphrase)

**Games Hub header:**
> Culture Games
>
> Play. Learn. Connect.
>
> Test your knowledge of Black culture — music, film, literature,
> history, and everything in between.

**Game cards (name / tagline / badge / difficulty / rounds):**
1. Who Said It? — "A quote appears — you guess who said it. 10 rounds drawn live
   from our verified quote archive." · Quotes · Mixed difficulty · 10 rounds
2. Culture Trivia — "10 daily questions spanning Afrobeats, Nollywood, literature,
   history, and art. Fresh questions every day." · Daily · Easy to Hard ·
   10 questions
3. Daily Sudoku — "One 9×9 grid a day — same puzzle for every player worldwide. No
   luck, pure logic." · Puzzle · Medium · 1 daily grid
4. Daily Crossword — "A new culture mini-crossword every day. Test your knowledge
   of people, places, and traditions." · Culture · Mixed · 1 daily puzzle

**Trivia in-game copy:**
- Header: "Culture Trivia" eyebrow + "Today's quiz · {date}"
- "Question {n} of {total} · {Category}"
- Explanation box label: "Did you know?"
- Next button: "Next Question →" / "See Results →" (final question)

**GameDoneScreen (shared, all 4 games) — result badges by score band (quiz games):**
> 🏆 PERFECT — "Flawless. Every answer right."
> 🔥 SHARP — "Culture is in your blood."
> 🧠 VERSED — "Well versed. Keep going."
> 📖 LEARNING — "The archive awaits you."
> 🌱 STARTER — "Every great knows starts here."

**GameDoneScreen — puzzle games (Sudoku/Crossword):**
> 🏅 COMPLETE — "Puzzle solved."

**GameDoneScreen shared chrome:**
- Header bar: "THE MOVEEE" wordmark + "{icon} {Game Name}" tag
- Share button: "Share your score →" → "✓ Copied to clipboard" (clipboard fallback)
- Email capture: "Get daily game reminders" + email input + "Notify me" button →
  "✓ You're on the list — we'll ping you daily."
- Nav actions: "Try {Other Game} →" (primary) / "All Games" (ghost)
- Already-played tag: "Already played today"

### DEV ANNOTATION REQUIREMENT

When generating, insert these as `<!-- DEV: ... -->` comments at the indicated frame:

1. <!-- DEV: All four games are fully built and playable on web — do not render any
   game card as dimmed/"Coming soon" the way mobile's PROMPT 7 Frame 1 does for
   Crossword/Sudoku. The real `GAMES` array in `app/games/page.tsx` has no
   disabled/locked entries, and `GameCard.tsx` has no disabled visual variant. -->
2. <!-- DEV: "Already played today" is detected client-side via a `localStorage`
   key per game per date (`moveee_trivia_{date}`, `moveee_wsi_{date}`,
   `moveee_sudoku_{date}`, `moveee_crossword_{date}`) — there is no server-tracked
   countdown timer like mobile's "14:32:07" display. Do not include a live
   countdown in this frame; the real already-played state just re-renders
   `GameDoneScreen` with `alreadyDone` set, showing the same score the player
   already earned that day. -->
3. <!-- DEV: All four games funnel into the SAME shared `GameDoneScreen` component
   for their result screen, not four separate bespoke result screens — quiz games
   (Trivia, Who Said It) show a score fraction + percentage + tiered badge/tagline;
   puzzle games (Sudoku, Crossword) show only a "COMPLETE" badge with no score
   fraction (`isPuzzle` branch hides the score block entirely). Model this as one
   component with a puzzle-vs-quiz prop, not duplicated screens. -->
4. <!-- DEV: GameDoneScreen includes two mechanics absent from mobile's PROMPT 7
   Frame 4 score screen entirely: a native Web Share API share button (falling
   back to clipboard-copy with a 3-second "✓ Copied" confirmation), and an inline
   email-capture form ("Get daily game reminders") that POSTs to
   `/api/games/subscribe`. Both must be included in this frame. -->
5. <!-- DEV: Who Said It's answer options are author-name text buttons sourced
   from `question.options` (variable count/length strings), not mobile's fixed
   4-letter-chip ABCD layout — size the option buttons to wrap real names, don't
   force a uniform short-chip width. -->
6. <!-- DEV: CrosswordGame includes a Moveee-Pro-gated "regenerate random puzzle"
   action (`isPatron` check against `session.user.tier`, calls
   `/api/games/crossword/daily?random=true`) with its own loading/celebrating
   states — this has no equivalent anywhere in the mobile catalog (which marks
   Crossword as not-yet-built) and should be shown as a secondary control near the
   puzzle, gated behind the same Pro-only visual treatment used elsewhere in this
   app (e.g. the ContentGate lock affordance), not as a freely available button. -->
7. <!-- DEV: SudokuGame includes a live running timer (mm:ss, ticks only while
   `phase === "playing"`) and a mistake counter — neither appears in the mobile
   catalog since mobile never built Sudoku. Render both in the puzzle header. -->

### PROMPT 8 — Games Hub, Trivia Gameplay, Shared Result Screen (Desktop 1440px +
Mobile 390px)

```
TASK: Design the Culture Games hub, the Culture Trivia gameplay flow, and the
shared GameDoneScreen result screen for Moveee's web community app
(web.themoveee.com/games).

CONTEXT: Site B — Moveee's community + auth surface. Paper-warm background, white
cards, ochre/gold/ink palette, DM Sans + Fraunces + JetBrains Mono. All four games
(Who Said It, Culture Trivia, Daily Sudoku, Daily Crossword) are real and fully
playable — none are placeholders.

ELEMENTS:

FRAME 1 — GAMES HUB (Desktop, 1440px)

- Header band: "Culture Games" mono eyebrow, "Play. *Learn.* Connect." serif H1
  (Learn italicised), subtitle paragraph, generous padding, paper-warm background
- 4-card grid (2×2 on desktop, single column on mobile per Frame 5): each
  `GameCard` — top accent-colour bar matching the game's brand colour (Who Said It
  rust/ochre #c5491f, Trivia olive #3d4a2a, Sudoku navy #1a3a5c, Crossword brown
  #5c3a1a), small coloured badge pill (Quotes/Daily/Puzzle/Culture), large emoji
  icon, game name, tagline, meta row (difficulty · rounds), "Play now →" link at
  card bottom. <!-- DEV 1 --> No card is dimmed or locked.

FRAME 2 — TRIVIA: QUESTION IN PROGRESS (Desktop, 1440px, centred ~640px column)

- Slim nav bar above the game: "← Games" back link · "/" separator · "Culture
  Trivia" title
- Game header: "Culture Trivia" eyebrow + "Today's quiz · {date}"
- Progress pips row: one dot per question (10 total), filled/done state for
  answered questions, active-ring state for the current one — not a single
  progress bar
- "Question {n} of {total} · {Category}" caption line
- Question text, serif, large, centred, allow up to 3 lines
- 4 answer option buttons, full width, left letter chip (A/B/C/D) + option text,
  unselected state: white fill, thin border

FRAME 3 — TRIVIA: ANSWER REVEALED + EXPLANATION (Desktop, same column width)

- Same question card, now with option states: correct option green border + tint
  + checkmark; selected-wrong option red border + tint + ×; other two options
  unchanged
- Explanation box below options: paper-deep background, "Did you know?" label +
  explanation paragraph
- "Next Question →" button now active (ochre fill) — reads "See Results →" only
  on the final question

FRAME 4 — SHARED GAME DONE SCREEN (Desktop, component close-up, ~480px card,
show both a quiz-game state and a puzzle-game state side by side)

- Card header bar: "THE MOVEEE" wordmark left, "{icon} {Game Name}" tag right
- Result zone: tier badge (PERFECT/SHARP/VERSED/LEARNING/STARTER for quiz games,
  COMPLETE for puzzle games per <!-- DEV 3 -->), large emoji, score fraction +
  percentage (quiz games only — omit entirely for the puzzle-game state), italic
  tagline
- Meta row: formatted date + "Already played today" tag when applicable
- "Share your score →" button (full width, secondary style)
- Email capture zone: "Get daily game reminders" label + email input + "Notify
  me" button, OR the success state "✓ You're on the list — we'll ping you daily."
- Footer actions: "Try {Other Game} →" primary button + "All Games" ghost link

FRAME 5 — MOBILE COMPANION (390px, single column)

- Games hub: 1-column card stack instead of 2×2 grid, same card content
- Trivia question/answer frames: full-width single column, same pip row and
  option button stack
- GameDoneScreen: full-width card, same internal stacking order

BEHAVIOUR:
- "Already played today" renders the GameDoneScreen result for that day's
  already-recorded score, no countdown timer anywhere per <!-- DEV 2 -->
- Progress pips advance only on answer submission, not on view
- Share button uses native share sheet where available, clipboard-copy fallback
  with a transient "✓ Copied to clipboard" confirmation

CONSTRAINTS:
- No disabled/"Coming soon" game cards — all four titles are live
- GameDoneScreen must be modelled as one shared component varying by a
  quiz-vs-puzzle flag, not as separate per-game result screens
```

Output 5 frames: Frame 1 (Games Hub, Desktop), Frame 2 (Trivia In Progress,
Desktop), Frame 3 (Trivia Answer Revealed, Desktop), Frame 4 (Shared Game Done
Screen, component close-up — quiz + puzzle states), Frame 5 (Mobile Companion,
full scroll).

---

## 9. MEMBER DASHBOARD — WEB (Site B, web.themoveee.com/member)

### Note on scope

Mobile's §8 models a single scrollable card stack (hero → passkey banner → 4-stat
bar → upgrade banner [Citizen only] → earned-badges chip row → referral row →
8-item quick-links list → collapsible "How to Earn" table) and uses the stale
"Connect Pro"/"Connect Citizen" wording throughout. The real web dashboard
(`apps/connect/app/member/page.tsx`) is a genuine 2-column desktop layout (main
column + side column, not one long stack), uses correct "Moveee Pro"/"Moveee
Citizen" copy, has **5** stats (not 4 — Membership is its own stat alongside
Credits/Points/Badges/Referrals), shows the **full 18-badge grid with locked
states** rather than only-earned chips, and a much longer "How to Earn" table
(12 rows, both Credits AND Points columns) and quick-links list (14 entries,
including a Stoop link that's conditional on cluster membership) than
mobile's. This prompt is grounded in the real page, `MemberDashboard.tsx`
(stats), `MemberBadges.tsx` (badge grid), and `PasskeyBanner.tsx`.

### Brand architecture

Site B (`apps/connect`), brand **Moveee**. Path: `/member`. Tier labels are
"Moveee Pro" / "Moveee Citizen" — never "Connect Pro"/"Connect Citizen" (the
mobile catalog's wording here is stale per the project's tier rename).

### Why this section exists

The real dashboard is desktop-native: a full-width hero strip, then a 2-column
body (`mem-grid`) where the main column carries the badge grid and earn-table,
and the side column carries the conditional upgrade card, referral card, and a
flat quick-links list — this is a meaningfully different information hierarchy
from mobile's single vertical card stack, where everything (including badges,
quick links, and the earn table) competes for the same scroll position. The
stats component (`MemberDashboard.tsx`) also has live click-to-toggle info
tooltips on Credits and Points explaining the underlying mechanic in plain
language — a feature with no mobile equivalent.

### Marketing copy (final — use verbatim, do not paraphrase)

**Hero:**
> The Moveee — Culture Community
> {Display Name}
> Moveee Pro / Moveee Citizen · {city}

**Stats labels:** Moveee Credits · Points · Badges Earned · Referrals · Membership

**Credits tooltip:**
> Moveee Credits are your spendable currency. Earn them by posting, engaging, and
> participating in the community. Redeem them for partner perks or cash out
> (Moveee Pro only, 40% fee). Daily cap: 50 credits.

**Points tooltip:**
> Points is your permanent standing in the community — it never decreases. It
> unlocks status tiers: Culture Contributor (100), Taste Maker (500), Culture
> Authority (1,500). Unlike credits, points cannot be spent.

**Passkey banner (no escrowed credits):**
> Set up a Passkey to unlock Credits
> Passkeys are required to spend credits and redeem partner perks. Takes 30
> seconds.
> Set up Passkey → / Dismiss

**Passkey banner (with escrowed credits):**
> You have {N} credits waiting — they'll be released once you add a passkey.

**Upgrade card (Citizen only):**
> Upgrade to Moveee Pro
> Unlock the full experience.
> - Moveee Pro badge on your Pulse posts
> - Exclusive gated content & editorials
> - 10% Moveee Shop discount
> - Early access to new features
> Become a Moveee Pro →

**Referral card:**
> Invite a Friend
> Share your link. Earn +30 reputation and +5 credits for every member who joins.
> {N} successful referral(s) — View details →

**Achievements section header:** "Achievements" + "{N} of 18 earned"

**How to Earn table rows (Action / Credits / Points):**
1. Post validated (5 reactions or 3 comments) — +10 cr / +5
2. Hidden Gem or Food Review validated — +15 cr / +10
3. Event RSVP — +1 cr / +5
4. Event check-in — +2 cr / +15
5. Refer a member — +3 cr / +25
6. Newsletter comment — +1 cr / +10
7. Share a quote — +1 cr / +10
8. Quote liked by others — — / +1
9. Read a magazine article — +1 cr / +5
10. Share a magazine article — +1 cr / +5
11. Directory entry submitted — +2 cr / +15
12. Game completed — +1 cr / +5

Caption: "Credits are spendable (capped at 50/day). Points are permanent and
unlock status."

**Quick links (side column, flat list, no icons in real code — text links):**
My Wallet · My Coupons · Notifications · My Analytics · My Events (Pro only) ·
My Stoop (if clustered) / Find your Stoop (if not) · Refer
a Friend · Browse Perks · My Collection · Account Settings · Newsletters ·
Upcoming Events · Magazine · Discover · Quotes Archive · Sign out

### DEV ANNOTATION REQUIREMENT

When generating, insert these as `<!-- DEV: ... -->` comments at the indicated frame:

1. <!-- DEV: This is a real 2-column desktop layout (`mem-grid`: main column +
   side column), not a single vertical card stack like mobile's PROMPT 8. Badges
   and the How to Earn table live in the main column; the upgrade card, referral
   card, and quick-links list live in the side column — preserve this split, don't
   flatten it into one column on desktop. -->
2. <!-- DEV: There are 5 stats, not 4 — Credits, Points, Badges Earned,
   Referrals, AND Membership (tier name shown as its own stat value) are all
   rendered by `MemberDashboard.tsx`'s `mem-stats` row. Credits and Points each
   have a clickable ⓘ info icon opening an inline tooltip with the exact mechanic
   copy above — include both tooltip states in this frame, not just the static
   numbers. -->
3. <!-- DEV: The badge section shows the FULL catalog of 18 badges in a grid,
   with explicit locked (○ icon, dimmed) vs earned (★ icon, full colour) states
   and each badge's name + one-line description always visible — this is not a
   chip row of only the badges already earned like mobile's Card 5. Earned badges
   sort first via `sortedBadges`. -->
4. <!-- DEV: Tier copy must read "Moveee Pro" / "Moveee Citizen" throughout —
   mobile's "CONNECT PRO"/"CONNECT CITIZEN" wording is stale per the 2026-06-21
   tier rename and must not be reused anywhere in this frame. -->
5. <!-- DEV: PasskeyBanner has two distinct copy states depending on
   `creditsEscrowed` — a generic "takes 30 seconds" pitch when 0, or a specific
   "you have {N} credits waiting" message when credits are actually held in
   escrow pending passkey setup. Show both states as labelled variants, not just
   the generic one mobile shows. -->
6. <!-- DEV: The quick-links list is 14-15 entries (vs. mobile's 8) and includes
   one CONDITIONAL row — "My Stoop" (links to `/cluster/{id}`) if the
   member already belongs to an active, non-archived cluster, or "Find your Stoop" (links to `/connect/people`) if not. "My Events" is itself
   conditional on Moveee Pro tier. Render the list with these conditions annotated,
   not as a fixed always-identical 8-item menu. -->
7. <!-- DEV: The How to Earn table has 12 rows (not mobile's 5) and a leading
   explanatory caption distinguishing credits (spendable, daily-capped) from
   points (permanent, status-unlocking) — both columns must be populated for
   every row except "Quote liked by others," which has no credit value (shown as
   an em dash, not a zero). -->

### PROMPT 9 — Member Dashboard, Pro & Citizen Variants (Desktop 1440px + Mobile
390px)

```
TASK: Design the Member Dashboard page for Moveee's web community app
(web.themoveee.com/member), in both Moveee Pro and Moveee Citizen variants.

CONTEXT: Site B — Moveee's community + auth surface. Paper-warm background, white
cards, ochre/gold/ink palette, generous 2-column desktop grid (not a single
scrolling stack). Tier copy is "Moveee Pro" / "Moveee Citizen" — never "Connect".

ELEMENTS:

FRAME 1 — DASHBOARD, MOVEEE PRO (Desktop, 1440px, full scroll)

- Full-width hero strip: circular avatar (gold ring if Pro) left, "The Moveee —
  Culture Community" eyebrow + display name (serif H1) + tier badge pill (gold,
  "Moveee Pro") + city, right
- Passkey banner (only if no passkey set) — <!-- DEV 5 --> show the generic copy
  variant here
- 5-stat row, full width, ghost dividers between each: Moveee Credits (with ⓘ
  tooltip), Points (with ⓘ tooltip + tier label sublabel e.g. "Taste Maker"),
  Badges Earned ("{n}/18"), Referrals, Membership ("Moveee Pro")
- 2-column body below:
  - MAIN column (left, ~65% width): Achievements section (full 18-badge grid,
    earned badges shown first, sorted, each with name + description, locked
    badges dimmed with ○ icon) → "How to Earn" table (12 rows, Action/Credits/
    Points columns, caption above explaining credits vs points)
  - SIDE column (right, ~35% width): Referral card (copyable link + referral
    count + "View details →") → Quick Links list (flat text-link list, 14-15
    entries per <!-- DEV 6 -->, including "My Events" since this is the Pro
    variant) — no upgrade card in this variant

FRAME 2 — DASHBOARD, MOVEEE CITIZEN (Desktop, 1440px, full scroll)

- Same hero/stats/2-column structure as Frame 1, but: ghost (non-gold) avatar
  ring, "Moveee Citizen" tier badge (ghost style, not gold fill), Membership stat
  shows "Moveee Citizen"
- SIDE column gains an "Upgrade to Moveee Pro" dark card ABOVE the referral card
  — "Unlock the full experience." heading, 4-item perk list, "Become a Moveee
  Pro →" button
- Quick Links list omits "My Events" (Pro-only) for this variant
- Achievements grid and How to Earn table identical structure, just reflecting
  this user's (likely lower) earned-badge count

FRAME 3 — STAT TOOLTIPS + PASSKEY BANNER STATES (Desktop, component close-up)

- Credits stat with ⓘ tooltip open: full tooltip copy bubble shown anchored
  below the stat
- Points stat with ⓘ tooltip open: full tooltip copy bubble shown
- Passkey banner, two side-by-side labelled variants: "No escrowed credits"
  (generic pitch) and "With escrowed credits" (specific "{N} credits waiting"
  copy) per <!-- DEV 5 -->

FRAME 4 — MOBILE COMPANION (390px, single column, Pro variant shown)

- Hero, stats row (wraps to 2 rows of stats on narrow width), passkey banner,
  then the MAIN-column content (Achievements, How to Earn) directly above the
  SIDE-column content (Referral, Quick Links) — single column stacking order
  follows the desktop main-then-side order, not an interleaved mix

BEHAVIOUR:
- Tooltip open/close is click-toggled, closes on outside click
- Badge grid sorts earned-first but always shows all 18 entries, never hides
  locked ones
- "My Stoop" vs "Find your Stoop" in Quick Links is
  conditional on cluster membership — annotate this branching in the frame

CONSTRAINTS:
- Never use "Connect Pro"/"Connect Citizen" — always "Moveee Pro"/"Moveee Citizen"
- 5 stats, not 4; 18-badge full grid, not an earned-only chip row
```

Output 4 frames: Frame 1 (Dashboard, Moveee Pro, Desktop), Frame 2 (Dashboard,
Moveee Citizen, Desktop), Frame 3 (Stat Tooltips + Passkey Banner states,
component close-up), Frame 4 (Mobile Companion, Pro variant, full scroll).

---


## 10. MEMBER SETTINGS — WEB (Site B, web.themoveee.com/member/settings)

### Note on scope
Mobile's Member Settings is a single screen (`MemberSettingsScreen.tsx`) with 5
client-side tabs (Profile/Directory/Interests/Newsletters/Security) and one
full-form-with-bottom-"Save changes"-button pattern per tab. The web version is
**structurally different, not just restyled**: it is 6 separate routed pages
(`/member/settings/profile`, `/directory`, `/interests`, `/newsletters`,
`/notifications`, `/security`) navigated via real `<Link>`s in `SettingsTabs.tsx`
(active state from `usePathname()`, not local state), and almost every field
saves itself independently the moment it's edited — there is no single "Save
changes" button anywhere in this section. A 6th tab, **Notifications**, exists
on web with no equivalent anywhere in the mobile catalog at all.

### Brand architecture
Site B (`apps/connect`, web.themoveee.com — Community + Auth). Tier copy is
"Moveee Pro" / "Moveee Citizen" — never "Connect Pro"/"Connect Citizen".

### Why this section exists
Grounded in the real route files: `SettingsTabs.tsx` (6-tab nav), `ProfileEditor.tsx`
(per-field inline-edit pattern), `DirectoryProfile.tsx` (directory opt-in +
live card preview), `apps/connect/app/member/settings/interests/page.tsx` +
`packages/shared/components/InterestEditor.tsx` (interest picker, canonical
18-slug taxonomy from `lib/interest-mappings.ts`), `NewsletterPreferences.tsx`,
`NotificationPreferences.tsx`, `security/page.tsx` + `PasskeyManager.tsx`.

### Marketing copy (final — use verbatim where shown)

**Profile tab** — field labels: Display Name, Email *(read-only, note: "Contact
support to change your email")*, Username *(read-only, note: "Usernames cannot
be changed")*, Phone, WhatsApp, Gender *(select: Prefer not to say / Male /
Female / Non-binary / Other)*, Date of Birth, Nationality, Country of
Residence, City, Occupation.

**Directory tab** — toggle row: "Show me in the directory". Live preview note:
"Name, role, and location come from your Profile section above." Disciplines
(toggle chips, no cap): Creative, Entrepreneur, Artist, Filmmaker, Writer,
Designer, Musician, Photographer, Tech, Legal, Finance, Academic. Bio field —
160 characters max. Link fields: Instagram, LinkedIn, Website, Twitter / X.

**Interests tab** — header "Your Interests", copy "Your interests shape your
personalised feed. Select at least 3." Helper line: "{N} selected{N<3 ? ' — X
more needed' : ' ✓'}". Button: "Save interests".

**Newsletters tab** — three cards: "Culture Drop" ("Weekly — the deep dive into
global culture. Essays, music, events. Every Tuesday."), "GetMeLit" ("Weekly —
stories, poems, book recommendations, and opportunities for writers and
readers."), "Events & Experiences" ("As needed — first access to new events
and exclusive member invites."). Each toggle button reads "Subscribed" or
"Subscribe".

**Notifications tab** — 14 toggle rows, each "On"/"Off": Credits Earned, Badge
Unlocked, Perk Expiring Soon, Perk Redeemed, Cash Out Approved, Cash Out
Rejected, Credits Released, New Comment, Post Reached Threshold, Friend
Joined, You Were Mentioned, New Follower, New Post From Someone You Follow,
Event RSVP.

**Security tab** — Password row: "Change your password via email reset" /
"Change →". Passkeys section: "Passkeys use your device's biometrics
(fingerprint, Face ID) for fast, secure sign-in. Required to redeem credits
and cash out." Empty state: "No passkeys registered. Add one below." Each row
shows device name + "Added {time ago}" (+ "· Used {time ago}" if different
from created). Delete button: "Remove" / "Removing…". Add control: "Device
name" input + "Add Passkey" / "Working…" button (hidden once 5 passkeys
exist).

<!-- DEV 1: Per-field inline-edit-with-autosave pattern (ProfileEditor.tsx,
DirectoryProfile.tsx's BioField/LinkField, both NewsletterPreferences.tsx and
NotificationPreferences.tsx's toggle rows) — every field/row has its own
view↔edit or on↔off state and its own transient "Saved ✓"/"Error" feedback
(~2s, then clears). There is NO page-level "Save changes" button anywhere in
this section on web, unlike mobile's single bottom-Save-button full form. -->

<!-- DEV 2: Email and Username fields render as permanently read-only rows
(no Edit button at all) with an inline note below the value — "Contact
support to change your email" / "Usernames cannot be changed". Mobile's
Profile tab has no equivalent read-only-field treatment; annotate these as
visually distinct (greyed value, no Edit affordance) from editable rows. -->

<!-- DEV 3: Directory tab has a live "How your card looks" preview block
(avatar initial, name, occupation, city/country, up to 3 discipline tags,
bio) rendered only when the opt-in toggle is on, sourced from BOTH the
Profile tab's fields (name/occupation/location) and this tab's own fields
(disciplines/bio) — no equivalent exists on mobile. Caption directly under
it: "Name, role, and location come from your Profile section above." -->

<!-- DEV 4: Directory disciplines vocabulary (Creative, Entrepreneur, Artist,
Filmmaker, Writer, Designer, Musician, Photographer, Tech, Legal, Finance,
Academic) differs from mobile's discipline list and has NO "select up to 5"
cap — toggles freely. Bio cap is 160 characters here vs mobile's 280. A 4th
link field, Twitter/X, exists here with no mobile equivalent (mobile has 3:
Instagram/LinkedIn/Website). -->

<!-- DEV 5: Interests tab reads/writes the canonical 18-slug taxonomy from
`lib/interest-mappings.ts` (fashion-streetwear, food-drink, street-food,
nightlife, live-music, music-production, independent-film, visual-art,
architecture, photography, literature, visual-design, tech-culture,
sport-wellness, travel, ideas — the last two slugs, event-performance and
event-community, are excluded from this picker, used only as event
categories). This is a DIFFERENT, smaller, differently-worded list than
whatever appears in the mobile catalog's interest screen — use the real slugs
and emoji/labels from `interest-mappings.ts`, not the mobile copy. Minimum
3 selections enforced client-side before the Save button enables. -->

<!-- DEV 6: Notifications tab has NO mobile-catalog precedent at all — it is a
genuinely new 6th tab. All 14 rows default to "On" when unset (`prefs[id] ??
true`) and the "system" notification type is deliberately excluded entirely
(always-on, not user-configurable, not shown in this list). -->

<!-- DEV 7: Security tab's password row is a single link to
`/forgot-password?email=...` (email reset flow) — there is no in-page
change-password form with current/new/confirm fields on web. Passkey
management (PasskeyManager.tsx) uses `@simplewebauthn/browser`'s
`startRegistration()` (WebAuthn browser API), is capped at 5 passkeys per
account, and a delete action requires a native `confirm()` dialog before
calling the delete endpoint. -->

<!-- DEV 8: Newsletter list on web (Culture Drop, GetMeLit, Events &
Experiences) is a DIFFERENT set/order than the canonical PHP newsletter
system documented elsewhere in this repo (which is list-ID driven and
currently has culture-drop/getmelit registered as the two real sendable
lists) — "Events & Experiences" here is a third, settings-only preference
category, not a `_culture_nl_list` value. Flag this as worth reconciling but
do not invent backend wiring for it in the prompt. -->

### PROMPT 10 — Member Settings (Desktop 1440px + Mobile 390px)

```
FRAME 1 — SETTINGS SHELL + PROFILE TAB (Desktop, 1440px)

- Top: 6-tab horizontal nav (Profile / Directory / Interests / Newsletters /
  Notifications / Security), active tab underlined/bolded, each a real link
  — annotate per <!-- DEV 1 --> that switching tabs is a full route change
- Below nav: avatar upload control (current avatar or initial, "Change
  photo" affordance) inside a .mem-card
- Field list, one row per field, each row in one of two states:
  - VIEW state: label (small caps mono) + value (or "—" if empty) + "Edit"
    button at row end
  - EDIT state (shown for one row at a time): label + input/select +
    "Save"/"Cancel" buttons, transient "Saved ✓" or "Error" badge after Save
  - Read-only rows (Email, Username) per <!-- DEV 2 -->: value rendered
    greyed, small italic note below, NO Edit button
  - Country/City fields use searchable select components, City filtered by
    selected Country

FRAME 2 — DIRECTORY TAB (Desktop, 1440px)

- Toggle row "Show me in the directory" (custom pill toggle, not a checkbox)
- When ON: live preview card per <!-- DEV 3 --> (avatar initial, name,
  occupation, city/country line, up to 3 discipline tags, bio snippet) with
  caption below it
- 12-chip discipline grid (3-col), freely toggleable, no selection cap, per
  <!-- DEV 4 -->
- Bio field: inline-edit textarea, 160-char counter
- 4 link fields (Instagram/LinkedIn/Website/Twitter-X), each independent
  inline-edit row

FRAME 3 — INTERESTS + NEWSLETTERS TABS (Desktop, 1440px, split view for
reference — built as two separate routes)

- Interests: header + helper copy, grid of interest chips (emoji + label,
  auto-fill columns ~130px min), selected chips shown bold/bordered/shadowed,
  live "{N} selected" counter (green once ≥3), "Save interests" button
  disabled until 3+ selected — use the real 16-interest taxonomy subset per
  <!-- DEV 5 -->
- Newsletters: 3 stacked rows (Culture Drop / GetMeLit / Events &
  Experiences), each label + muted description + toggle button reading
  "Subscribed"/"Subscribe"

FRAME 4 — NOTIFICATIONS + SECURITY TABS (Desktop, 1440px, split view for
reference)

- Notifications: 14 stacked rows, label only (no description), each with an
  "On"/"Off" toggle button per <!-- DEV 6 -->
- Security: Password row (label + muted description + "Change →" link per
  <!-- DEV 7 -->), then Passkeys card: explanatory paragraph, list of
  existing passkey rows (device name, "Added Xd ago" / "· Used Xh ago",
  "Remove" button), device-name input + "Add Passkey" button (hidden at 5
  passkeys), inline success/error message box below

FRAME 5 — MOBILE COMPANION (390px, Profile tab shown, single column)

- 6-tab nav becomes a horizontally-scrollable pill row
- Avatar upload full-width, field list stacks identically (view↔edit per
  row), same Edit/Save/Cancel pattern — no condensed mobile-only variant of
  the inline-edit interaction

CONSTRAINTS:
- Never use "Connect Pro"/"Connect Citizen" — always "Moveee Pro"/"Moveee Citizen"
- No page-level Save button anywhere — every field/toggle is self-saving
- 6 tabs, not 5 — Notifications is real and must be included
```

Output 5 frames: Frame 1 (Settings Shell + Profile, Desktop), Frame 2
(Directory, Desktop), Frame 3 (Interests + Newsletters, Desktop), Frame 4
(Notifications + Security, Desktop), Frame 5 (Mobile Companion, Profile tab).

---

## 11. WALLET, PERKS & COUPONS — WEB (Site B, web.themoveee.com/member/wallet, /connect/perks, /member/coupons)

### Note on scope
Three separate routes, not three tabs/screens in one flow: `/member/wallet`
(`WalletClient.tsx`), `/connect/perks` (`PerksClient.tsx`), `/member/coupons`
(`CouponsClient.tsx`). The real cash-out flow is materially different from
mobile's: it's gated behind Moveee Pro, requires a WebAuthn passkey
**step-up** challenge (a fresh biometric prompt, separate from login) before
either redeeming a perk or submitting a cash-out request, and supports three
full currencies (GBP/USD/NGN) with distinct bank-detail fields per currency
rather than one GBP-only slider screen.

### Brand architecture
Site B (`apps/connect`). Tier copy "Moveee Pro" / "Moveee Citizen".

### Why this section exists
Grounded in `WalletClient.tsx` (history + cash-out tabs, step-up auth,
multi-currency bank forms), `PerksClient.tsx` (perk grid, confirm modal,
step-up auth, redemption success state), `CouponsClient.tsx` (Active/Used/
Expired sections, QR via `api.qrserver.com`).

### Marketing copy (final — use verbatim where shown)

**Wallet — Cash Out tab (non-Pro):** "Cash out your credits" / "Convert your
earned credits to real money — a Moveee Pro exclusive. Upgrade to start
cashing out." / "Upgrade to Moveee Pro →"

**Wallet — Cash Out tab (Pro):** "Minimum 100 credits. A flat 40% fee
applies. Partner perks are fee-free — browse perks instead." / "🔑 Passkey
verification required at checkout." Submit button: "Request Cash Out" /
"Submitting…". Success message: "Cash out request submitted. You'll receive
{symbol}{amount} after admin approval (48 hr hold)."

**Perks:** Step-up prompt: "Passkey required to redeem perks. Set up a
passkey in settings →". Working state: "⬡ Waiting for your device
biometrics…". Confirm modal: "Confirm redemption" / "Spend {N} credits for
"{title}"?" / "Your coupon will expire in {N} days. Your balance after: {N}
credits." Buttons: "Confirm"/"Processing…", "Cancel". Success: "Perk
redeemed!" / "Show this QR code at the partner venue." / "Expires: {date}" /
"New balance: {N} credits". Buttons: "Browse more perks", "My Coupons →".
Card button states: "Redeem — {N} credits", "Sign in to redeem", "Sold out",
"Not enough credits". Empty state: "No perks available yet" / "Partner perks
are coming soon. Keep earning credits in the meantime!"

**Coupons:** Section headers "Active Coupons ({N})", "Used ({N})", "Expired
({N})". Empty: "No active coupons. Browse perks to redeem one." Per-coupon:
"{N} credits · Redeemed {date}", "Expires in {N} days" / "Expires today".

<!-- DEV 1: There is a real discrepancy in WalletClient.tsx worth flagging
rather than silently "fixing" in the prompt — the displayed fee-calculation
constant (`feePercent = 30`, used for the "Fee: 30%" hint and the
You-receive-amount math shown live as the user types) does NOT match the
visible paragraph copy directly above it, which reads "A flat 40% fee
applies" (matching `Culture_Perks::cashout_fee_percent()` / CLAUDE.md's
documented flat-40%-fee rule). Render the UI exactly as the code does
(30% in the live calculator, 40% in the static paragraph) and flag this
inconsistency as a DEV note for engineering follow-up — do not silently pick
one number when annotating the frame. -->

<!-- DEV 2: Both perk redemption AND cash-out require a WebAuthn "step-up"
challenge (`startAuthentication()` via `/api/auth/passkey/step-up` +
`step-up-verify`) — a SEPARATE biometric prompt from login, fired at the
moment of the sensitive action, not at sign-in. If the user has no passkey
registered, the step-up silently fails and surfaces a "Passkey required ...
Set up a passkey in settings →" banner instead of an error. This has no
equivalent UI in the mobile catalog and must be shown as a distinct frame
state (the "⬡ Waiting for your device biometrics…" banner). -->

<!-- DEV 3: Cash-out supports 3 currencies (GBP/USD/NGN) with DIFFERENT
required bank fields per currency — GBP: Sort Code + Account Number; USD:
Bank Name + Routing/ABA Number + Account Number; NGN: Bank Name (a 23-entry
select of real Nigerian banks) + 10-digit NUBAN Account Number. There is no
generic "enter your bank details" single form — annotate per-currency field
swapping, not a slider (mobile shows a slider; web uses a plain number
input). -->

<!-- DEV 4: Cash-out is hard-gated to Moveee Pro — non-Pro visitors to the
Cash Out tab see an upsell card instead of the form entirely (no disabled
slider/greyed form, a fully separate upgrade-prompt layout). -->

<!-- DEV 5: Perks grid cards are plain text-forward cards (cost line, title,
description, meta row with min-spend/validity, action button) — there is no
partner-logo placeholder area as in the mobile catalog. A confirmation modal
(perk title, cost, expiry days, resulting balance) sits between tapping
"Redeem" and the actual API call, which mobile's catalog does not show as a
separate step. -->

<!-- DEV 6: Coupons page groups redemptions into three sections — Active,
Used, Expired — rather than mobile's single scrollable list of coupon cards.
Only Active coupons get the full QR-code treatment; Used/Expired render as
compact muted one-line rows (title + date), not full QR cards with
greyscale/watermark treatment. -->

### PROMPT 11 — Wallet, Perks & Coupons (Desktop 1440px + Mobile 390px)

```
FRAME 1 — WALLET: TRANSACTION HISTORY TAB (Desktop, 1440px)

- Tab switcher: "Transaction History" (active, underlined) · "Cash Out"
- Card: "Recent Transactions" label, ledger rows (source label + date left,
  signed amount right — green for positive, ochre/red for negative), sourced
  from a real label map (Referral bonus, Post published, Perk redeemed,
  Perk refund, Cash out, Cash out refund, Profile completed, Email verified,
  Directory opt-in, Newsletter signup, Poll vote)
- Empty state: "No transactions yet." italic muted

FRAME 2 — WALLET: CASH OUT TAB, two states side by side (Desktop, 1440px)

- LEFT (non-Pro): ochre-bordered upsell card, "Moveee Pro" pill, "Cash out
  your credits" / "Convert your earned credits to real money — a Moveee Pro
  exclusive. Upgrade to start cashing out." / "Upgrade to Moveee Pro →" button
- RIGHT (Pro): explanatory paragraph per <!-- DEV 1 --> showing both the 30%
  live-calculator number and the 40% static-copy number as written in code,
  passkey note, form: Credits-to-cash-out number input with live fee/receive
  hint, Currency select (GBP/USD/NGN), Account holder name, then
  currency-conditional fields per <!-- DEV 3 -->, "Request Cash Out" button

FRAME 3 — PERKS BROWSE + STEP-UP STATES (Desktop, 1440px)

- Step-up banners: "Passkey required..." warning banner, "⬡ Waiting for your
  device biometrics…" working banner (both shown stacked for reference, not
  simultaneously in real use) per <!-- DEV 2 -->
- Perk grid (responsive columns), cards per <!-- DEV 5 -->: cost line,
  title, description, meta row (min spend / validity days), button state
  variants (Redeem—N credits / Sign in to redeem / Sold out / Not enough
  credits)
- Confirm redemption modal (overlay): title, cost+name sentence, expiry +
  resulting balance sentence, Confirm/Cancel buttons
- Success state: "Perk redeemed!" headline, QR image, expiry date, new
  balance, "Browse more perks" + "My Coupons →" actions

FRAME 4 — COUPONS PAGE (Desktop, 1440px)

- "Active Coupons (N)" section: full QR card per redemption (QR image,
  title, "N credits · Redeemed {date}", colour-coded expiry countdown)
- "Used (N)" and "Expired (N)" sections per <!-- DEV 6 -->: compact
  60%/40%-opacity one-line rows, no QR
- Empty state: "No active coupons. Browse perks to redeem one."

FRAME 5 — MOBILE COMPANION (390px, single column)

- Wallet history list, Cash Out form (fields stack full-width, currency
  select still swaps field sets), Perks grid collapses to 1 column, Coupons
  sections stack — same component logic as desktop, no separate mobile-only
  layout branch

CONSTRAINTS:
- Never use "Connect Pro"/"Connect Citizen" — always "Moveee Pro"/"Moveee Citizen"
- Show the 30%/40% fee-copy discrepancy exactly as it exists in code, not
  reconciled
- Cash-out form fields change per selected currency — do not show all bank
  fields at once
```

Output 5 frames: Frame 1 (Wallet History, Desktop), Frame 2 (Wallet Cash Out
— Non-Pro & Pro, Desktop), Frame 3 (Perks Browse + Step-Up + Confirm +
Success, Desktop), Frame 4 (Coupons, Desktop), Frame 5 (Mobile Companion,
full scroll).

---

## 12. MEMBER DIRECTORY & PUBLIC PROFILES — WEB (Site B, web.themoveee.com/connect/people, /connect/[username])

### Note on scope
Mobile's "Member Directory" is a generic global directory with name/discipline/
location search and explicit filter chips showing a member count. The real
web page (`/connect/people`, `MemberDirectory.tsx`) is branded **"People Near
Me"** and is deliberately location-scoped to the viewer — it queries the
viewer's own city first, falling back to their country, with no way to browse
globally and no visible "N members" count. It also renders a `Stoop`
module above the directory grid for logged-in visitors, which has no mobile
equivalent in this catalog section at all.

### Brand architecture
Site B (`apps/connect`). "Moveee Pro" / "Moveee Citizen" — the mobile
catalog's "CONNECT PRO badge" wording must be corrected.

### Why this section exists
Grounded in `apps/connect/app/connect/people/page.tsx`, `MemberDirectory.tsx`
(`packages/shared/components/connect/`), `apps/connect/app/connect/[username]/
page.tsx`, `BadgeShelf.tsx`, `ProfileTabs.tsx`, `CommunityTab.tsx`,
`PortfolioTab.tsx`.

### Marketing copy (final — use verbatim where shown)

**People page hero:** eyebrow "Moveee · People Near Me", headline "Find each
*other.*", lede "Members of the Moveee community near you — who they are,
what they do. Filter by industry to find your people." CTA (logged in):
"Update your profile →"; (logged out): "Join & get listed →". Section nav:
"Pulse Feed" · "People Near Me" (active) · "Membership".

**Directory empty state:** "No one near you yet." / "Members who have opted
into the directory will appear here once someone near you joins. Join Moveee
and opt in from your profile settings to be listed." / "Join & get listed →"

**Public profile — Portfolio gate (below Taste Maker):** "Portfolio coming
soon" / "The portfolio tab unlocks at Taste Maker status (500 points). This
member is currently at {tier} tier."

**Profile actions:** Follow/Following toggle, Share button, "← Directory"
link.

<!-- DEV 1: The directory filter is a single "industry" select (All
industries + the 12 DirectoryProfile.tsx disciplines: Creative,
Entrepreneur, Artist, Filmmaker, Writer, Designer, Musician, Photographer,
Tech, Legal, Finance, Academic) plus a free-text search box — there is no
separate "All Locations" filter chip and no live member-count caption,
because location is implicit (the viewer's own city/country) rather than a
user-chosen filter. -->

<!-- DEV 2: Member cards always render an initial-letter avatar circle —
there is no real-photo avatar image anywhere in `MemberDirectory.tsx`'s
`MemberCard`, unlike the public profile page itself which does show a real
avatar image when set. Cards show up to 3 discipline tags as plain text
chips (not emoji-prefixed), a one-line bio if set, and clickable link
buttons (text labels "Instagram"/"LinkedIn"/"Website"/"Twitter", not icon
circles) — only rendered when the member has filled them in. -->

<!-- DEV 3: A `Stoop` module renders above the directory grid for
logged-in visitors only — this is the Stoop / Literati Connect
feature (see project docs), entirely unrelated to and absent from this
mobile catalog section. Include it as a placeholder band, not a fully
detailed component, since it belongs to a different feature area. -->

<!-- DEV 4: Public profile's badge shelf (`BadgeShelf.tsx`) renders emoji-only
circular buttons (no name label visible by default) — tapping/clicking one
toggles a small tooltip showing its name. This is a click-to-reveal
interaction, not the always-visible "🎨 Taste Maker · 💎 Gem Hunter ..." text
chip row shown in the mobile catalog. Reputation tier badge (e.g. "Taste
Maker") only renders at all when the tier is above "Member" — Member-tier
profiles show no tier badge. -->

<!-- DEV 5: Portfolio tab is hard-gated at Taste Maker (500 reputation) for
EVERY visitor, including the profile owner — there is no owner-only "+ Add
work" tile shown here (portfolio editing happens on a separate
`/member/portfolio` settings page, out of scope for this view). Below the
gate, unlocked portfolios show a flat grid mixing real portfolio items
(lookbook/writing/video/audio/design/link types, click opens a detail
modal — not a masonry grid with year captions) with the member's pinned
community posts inline in the same grid. -->

<!-- DEV 6: Community tab has its own template filter strip (All, Gems,
Takes, Food, Showcases, Polls) absent from the mobile catalog's plain
3-post list — and paginates via "Load more" with a real `hasMore` flag
rather than a static 3-item preview. -->

### PROMPT 12 — Member Directory & Public Profiles (Desktop 1440px + Mobile 390px)

```
FRAME 1 — PEOPLE NEAR ME (Desktop, 1440px)

- Hero band: eyebrow, headline ("Find each *other.*"), lede, CTA button
  (context-dependent), ghost "← Back to Feed" link, section-nav row (Pulse
  Feed / People Near Me active / Membership)
- Stoop band placeholder (logged-in only) per <!-- DEV 3 -->
- Directory controls: search input + single industry select (no location
  chip) per <!-- DEV 1 -->
- Member grid (responsive columns): cards per <!-- DEV 2 --> — initial-avatar
  circle, name + inline Pro badge, occupation, location, up to 3 discipline
  text chips, optional bio line, optional link buttons row
- Empty state block (centred): "No one near you yet." copy + "Join & get
  listed →"

FRAME 2 — PUBLIC PROFILE: COMMUNITY TAB (Desktop, 1440px)

- Optional cover photo banner (full-bleed, only if set)
- Identity block: avatar (real image or initial, gold ring if Pro), name +
  inline Pro badge, "@handle · City, Country · Occupation" line, conditional
  rep-tier badge pill (hidden at Member tier), BadgeShelf row of emoji
  circles per <!-- DEV 4 --> (show one in its active/tooltip-open state),
  bio paragraph, stats row ("{N} pts · {N} posts · Joined {Month Year}"),
  actions row (Follow/Following, Share, ← Directory)
- Tabs: Community (active) · Portfolio
- Community tab: template filter strip (All/Gems/Takes/Food/Showcases/Polls)
  per <!-- DEV 6 -->, post list (template emoji + relative date, 2-line
  text, reaction counts), "Load more" link

FRAME 3 — PUBLIC PROFILE: PORTFOLIO TAB, two states (Desktop, 1440px)

- LEFT — gated state per <!-- DEV 5 -->: "Portfolio coming soon" /
  "...unlocks at Taste Maker status (500 points). This member is currently
  at {tier} tier."
- RIGHT — unlocked state: flat grid mixing pinned-post cards (📌 placeholder
  if no image, tag/template label, post text snippet) and portfolio item
  cards (type emoji or thumbnail, type label, title, description) — click
  opens a detail modal with full image/title/description/"View project →"
  link

FRAME 4 — MOBILE COMPANION (390px, single column)

- People Near Me: hero stacks, directory controls stack, member grid
  collapses to 1 column
- Public profile: identity block, tabs, and grids stack full-width — same
  component logic as desktop

CONSTRAINTS:
- Never use "Connect Pro"/"Connect Citizen" — always "Moveee Pro"/"Moveee Citizen"
- Directory is location-scoped to the viewer, not a global browse — do not
  add a location filter chip
- Portfolio gate applies to every visitor including the profile owner
```

Output 4 frames: Frame 1 (People Near Me, Desktop), Frame 2 (Public Profile —
Community Tab, Desktop), Frame 3 (Public Profile — Portfolio Tab, gated +
unlocked, Desktop), Frame 4 (Mobile Companion, full scroll).

---

## 13. NOTIFICATIONS & ANALYTICS — WEB (Site B, web.themoveee.com/member/notifications, /member/analytics)

> **Note on scope.** Web notifications exist on **two** surfaces, and the
> dropdown is the one members actually use day to day —
> `packages/shared/components/NotificationBell.tsx` (a header bell + dropdown
> panel, mounted globally, polling every 120s) is the primary surface; the
> full-page `/member/notifications` route (`NotificationsClient.tsx`) is a
> secondary "see everything" list with no Today/Earlier sectioning and no
> per-type colour coding — it is a single flat list, oldest unread first by
> default order from the API. This prompt covers **both**, plus
> `/member/analytics` (`AnalyticsClient.tsx`), which is a single full-page
> SVG chart dashboard with no mobile-catalog precedent for its layout beyond
> the chart types themselves. There is no separate desktop/mobile chart
> implementation difference — the same `<svg viewBox="0 0 600 H">` markup
> scales fluidly (`width: 100%, height: auto`) on both frame sizes.

### Brand architecture

Site B (`web.themoveee.com`), member-only, behind `getServerSession()`
redirect guards on both routes. "Moveee Pro"/"Moveee Citizen" tier badge
shown on the Analytics hero only (`mem-tier-badge`) — Notifications has no
tier-gated content. Internally "credits"/"reputation" — user-facing copy on
this page already (correctly) renders "Credit Balance"/"Points", consistent
with the Cr/Pt rename rule.

### Why this section exists

The dropdown bell (`NotificationBell.tsx`) is what most members see most
often — it ships on every page via the global layout, polls
`/api/notifications/count` every 120s (paused when `document.hidden`), and
renders up to 20 items with a "View all notifications →" link once the list
hits that cap. The 19-entry `TYPE_EMOJI` map is the authoritative emoji set
(per CLAUDE.md's "Notification touchpoint audit" — there is no shared
source of truth across PHP/TS, this map is duplicated verbatim in
`NotificationsClient.tsx` and must stay in sync with
`Culture_Notifications::TYPES`). The full-page list at `/member/notifications`
exists for members who want the complete history beyond the dropdown's
20-item cap, fetching up to 50 server-side with `cache: "no-store"`. Neither
surface does Today/Earlier date-grouping or left-border per-type colour
accents the way the mobile catalog's PROMPT 12A does — both are flat lists
distinguished only by an unread highlight tint + 7px ochre dot, and the
emoji icon itself is the only per-type visual signal.

Analytics (`AnalyticsClient.tsx`) is a client-fetched dashboard
(`GET /api/member/analytics`, no `userId` param needed — server resolves it
from session) rendering 6 summary stat cards, a grouped bar chart (credits
earned/spent, last 30 days), a line chart (reputation/points earned, last 6
months), and a ranked top-posts list (last 90 days) — all hand-rolled SVG,
no charting library, matching the project's existing "plain SVG, no external
charting lib" convention documented in CLAUDE.md's Phase 8c notes.

### Marketing copy (final — use verbatim, do not paraphrase)

> **Notifications dropdown header:** "Notifications" / "Mark all read"
> **Notifications empty state (dropdown):** "No notifications yet."
> **Notifications full page label:** "All Notifications"
> **Notifications full-page empty state:** "No notifications yet."
> **Analytics breadcrumb + heading:** "Dashboard › Analytics" / "My Analytics"
> **Analytics stat labels:** "Credit Balance" (sub: "spendable credits") ·
> "Points" (sub: "all-time points") · "Posts" (sub: "{N} pending" or
> "published") · "Badges" (sub: "earned badges") · "Earned (30d)" (sub:
> "credits earned") · "Spent (30d)" (sub: "credits spent")
> **Chart section labels:** "Credits — Last 30 Days" · "Points Earned — Last
> 6 Months" · "Top Posts — Last 90 Days"
> **Chart empty states:** "No credit activity in the last 30 days." / "No
> points activity yet." / "No published posts yet."
> **Analytics load error:** "Could not load analytics. Please try again later."
> **Analytics loading state:** "Loading analytics…"

### DEV ANNOTATION REQUIREMENT

Add these as `<!-- DEV: ... -->` comments at the exact spots noted:

1. Dropdown bell badge shows `unread > 9 ? "9+" : unread` — cap the count
   display at "9+", never render a 3-digit number in the 14px circle.
2. Full-page list has NO Today/Earlier date sectioning and NO per-type
   left-border colour — unlike the mobile catalog's PROMPT 12A, this is a
   single flat list ordered however the API returns it (createdAt desc,
   server-side) with only an unread tint + dot as the visual unread signal.
3. `TYPE_EMOJI` is a 19-entry map duplicated independently in
   `NotificationBell.tsx` and `NotificationsClient.tsx` — 5 of the 19 types
   (`cluster_activated`, `cluster_forming_expired`, `cluster_new_host`,
   `cluster_election_started`, `cluster_checkin_reminder`) belong to the
   Stoop feature and have no mobile-catalog precedent in PROMPT
   12A's 5-example set — include at least one cluster-type row in the frame
   to demonstrate full coverage.
4. Bar chart's two series use ochre `#b38238` (earned) and rust `#c5491f`
   (spent) — same two-colour convention as the wallet ledger; line chart
   uses a one-off blue `#2a6496` not used anywhere else on the site (not
   ochre/gold like the mobile catalog's PROMPT 12B describes) — render the
   line chart in this blue, not gold.
5. Top Posts rank badge: rank #1 gets a solid ochre filled circle with white
   numeral; ranks 2+ get a flat `var(--paper-deep)` circle with muted
   numeral — only the #1 spot is visually distinguished.
6. Stat grid is `repeat(auto-fill, minmax(140px, 1fr))` — 6 cards, not the
   mobile catalog's 4-card row; do not drop "Earned (30d)"/"Spent (30d)" to
   match mobile's count.
7. Analytics has no chart-type toggle, date-range picker, or tooltip-on-hover
   interaction described in the mobile catalog's PROMPT 12B for the line
   chart's last point — the web line chart renders dots on every point
   uniformly, no hover state implemented.

### PROMPT 13 — Notifications & Analytics (Desktop 1440px + Mobile 390px)

```
FRAME 1 — NOTIFICATION BELL DROPDOWN, two states (Desktop, 1440px)

Header context: small bell-icon button (18×18 outline icon, no fill) sitting
in the global site header, unread badge per <!-- DEV 1 --> top-right of the
icon (#c5491f circle, white numeral, 9px bold)

- LEFT panel (open dropdown, has unread): anchored top-right under the bell,
  width min(340px, 100vw-32px), max-height 440px scrollable, white bg,
  1px rgba(42,36,28,.12) border, 6px radius, sticky header row
  "Notifications (3)" (count in #c5491f) + "Mark all read" link (ochre,
  right-aligned); list of notification rows, each: emoji icon (left,
  1.1rem), title (700 weight if unread / 500 if read, 0.78rem), body
  (0.72rem muted, 2-line clamp), time-ago caption (0.66rem, lightest muted),
  unread rows get a faint ochre-tint background + 6px ochre dot far-right;
  include one cluster-type row per <!-- DEV 3 -->; footer "View all
  notifications →" link only rendered once 20+ items are loaded

- RIGHT panel (open dropdown, empty state): same shell, centered "No
  notifications yet." (0.8rem, muted, ~24px vertical padding)

FRAME 2 — FULL NOTIFICATIONS PAGE (Desktop, 1440px)

- Member hero band (avatar circle, "My Account" eyebrow, "Notifications" h1)
- Below: 2-col grid — main column is a single `mem-card` titled "All
  Notifications · {N} unread" (ochre-coloured count) with "Mark all read"
  top-right; flat list of rows (1px hairline dividers via background-color
  trick, alternating paper bg on read rows / faint ochre tint on unread),
  each row: emoji + title/body/full formatted date ("Mon, 22 Jun 2026") +
  unread dot — no date grouping, no left-border colour per <!-- DEV 2 -->
- Side column: quick-links card (Dashboard →, My Wallet →, My Coupons →,
  Settings →)
- Empty state variant: "No notifications yet." centered, italic, muted

FRAME 3 — ANALYTICS DASHBOARD (Desktop, 1440px, full scroll)

- Member hero band: breadcrumb "Dashboard › Analytics" eyebrow, "My
  Analytics" h1, tier badge pill below (Moveee Pro / Moveee Citizen)
- Stat grid: 6 cards per <!-- DEV 6 -->, each a bordered paper card —
  uppercase 0.68rem label, 1.6rem bold value, 0.72rem muted sub-caption:
  Credit Balance / Points / Posts / Badges / Earned (30d) / Spent (30d)
- "Credits — Last 30 Days" card: grouped bar chart per <!-- DEV 4 -->
  (ochre=earned, rust=spent), y-axis gridlines + ticks, x-axis date labels
  thinned to ~10 visible, 2-entry legend bottom-left (colour swatch + label)
- "Points Earned — Last 6 Months" card: line chart per <!-- DEV 4 --> (blue
  #2a6496 line + 8%-opacity area fill, dots on every point, month labels
  thinned to ~6 visible)
- "Top Posts — Last 90 Days" card: ranked list, rank circle per <!-- DEV 5
  -->, post title (ellipsis-truncated single line) + formatted date, then
  3 stacked mini-stats (reactions / comments / total engagement) right-aligned
- "← Back to Dashboard" link, ochre, below the last card

FRAME 4 — MOBILE COMPANION (390px, single column)

- Bell dropdown: same shell anchored full-width minus 32px margin below the
  header bell, identical row markup stacked
- Full notifications page: hero stacks, quick-links card moves below the
  notification list (no side-by-side grid)
- Analytics: stat grid collapses to 2 columns, both charts remain full-width
  SVG (same `viewBox`, scales down naturally), top-posts list stacks mini-
  stats below the title instead of beside it

CONSTRAINTS:
- TYPE_EMOJI map must be rendered identically on both dropdown and full-page
  surfaces — no surface gets a different icon for the same type
- Never label spendable credits or all-time reputation as anything other
  than "Credit Balance"/"credits" and "Points"/"points" per the Cr/Pt rename
- No tooltip-on-hover, no date-range picker, no chart-type toggle — render
  the charts exactly as the static SVG output described above
```

Output 4 frames: Frame 1 (Notification Bell Dropdown, open + empty, Desktop),
Frame 2 (Full Notifications Page, Desktop), Frame 3 (Analytics Dashboard,
Desktop, full scroll), Frame 4 (Mobile Companion, full scroll).

---

## 14. LIFESTYLE SHOP — WEB (Site A, themoveee.com/shop)

> **Note on scope.** The mobile catalog's §16 covers a 6th bottom-nav tab with a
> hero banner, vendor showcase, "Connect Pro" band, cart drawer, checkout
> handoff screen, maker profile, "The Edit", product search, a filter bottom
> sheet, a gold early-access gate, and an order-confirmation celebration
> screen. The real web shop is architecturally different in several load-
> bearing ways — this section is grounded in the actual `apps/site/app/shop/**`
> tree, not a 1:1 port of the mobile spec:
> - **The shop lives only on Site A** (`themoveee.com`), not Site B
>   (`web.themoveee.com`/`apps/connect`) — there is no shop surface in
>   `apps/connect` at all; Connect's `proxy.ts` doesn't even need a shop
>   redirect because the shop was never built there.
> - **No hero banner on shop home** — `ShopArchiveWrapper.tsx` goes straight
>   from the page head into the filter bar and an animated ticker; there is
>   no full-bleed image/headline block like the mobile hero.
> - **Cart is a drawer only — there is no full-page cart screen, no in-app
>   checkout, and no order-confirmation screen.** `CartDrawer.tsx` is a
>   right-side slide-in panel reachable from any shop page; its "Checkout →"
>   button is a hard redirect to `https://cms.themoveee.com/checkout`
>   (WooCommerce-hosted, native WordPress checkout pages) — there is nothing
>   resembling mobile's animated "Taking you to secure checkout..." handoff
>   screen or its post-purchase celebration screen, because the purchase
>   itself completes entirely outside the Next.js app.
> - **No shop search screen and no filter bottom sheet** — filtering is a
>   sticky horizontal category-tab bar plus a sort dropdown and a grid/list
>   view toggle baked into `ShopArchiveWrapper.tsx`'s filter bar; there is no
>   dedicated search page, no price-range slider, and no in-stock/on-sale
>   toggles anywhere in the web shop.
> - **Pro early-access gating is a simple inline banner, not a gold
>   countdown gate card** — `ShopSessionSection.tsx` shows one line of copy
>   and an upgrade link in place of (not overlaying/dimming) the Add to Cart
>   controls; there is no "Opens in 7d 14h 32m" countdown anywhere in the
>   code.
> - **"The Moveee Edit" exists on web** (`app/shop/edit/page.tsx`) as a
>   magazine-post-driven curation stream, structurally different from the
>   mobile catalog's standalone editorial-grid page — each entry pairs one
>   magazine story card with up to 4 linked products, not a single flat
>   product grid.
> - **Maker pages exist in two parallel places**: `app/makers/[slug]/page.tsx`
>   (the canonical maker/vendor profile, linked from the makers directory at
>   `/makers`) and `app/shop/brand/[slug]/page.tsx` (a near-duplicate sourced
>   from WooCommerce WCFM vendor data instead of the directory). Both are
>   real, live routes — this prompt covers the canonical `/makers/[slug]`
>   page since it's the one linked from the shop's "Meet the Makers" strip.
> - **No multi-currency** — web shop prices are GBP-only; there is no
>   NGN/GBP toggle the way `apps/mobile`'s shop screens have.
> - **No wishlist persistence** — the heart/save icon on the product page
>   renders but has no backing API call; it is purely decorative in the
>   current build.

### Brand architecture

Site A (`apps/site`, themoveee.com) — Editorial + Shop, no auth required to
browse. Per CLAUDE.md's brand table, this surface is branded **Moveee
Magazine** elsewhere on the site, but the shop itself is labelled **"Moveee
Lifestyle"** in its own page head — keep that exact label, do not rename it
to "Moveee Magazine Shop" or similar. Pro-tier gating language on shop pages
should read **"Moveee Pro"**, per the canonical tier-naming table — but see
DEV annotation 1 below: the live ticker and one section heading still say
"Connect Members"/"Connect Member Band", a stale pre-rename leftover from
before the 2026-06-21 Connect→Moveee tier rename swept through. Render the
prompt's copy using the *real* current strings (including the stale ones, so
the design is honest about what ships today) but flag it for a copy fix via
the DEV annotation, exactly as the project's established convention requires
— do not silently "correct" it in the mockup.

### Why this section exists

Moveee Lifestyle is the one commerce surface in an otherwise content/
community-only product. It deliberately reads as an editorial boutique
rather than a generic e-commerce grid — every section ties back to either a
vetted independent maker or a magazine story, and the only purchase
incentive offered to non-members is the Moveee Pro discount + early access,
not coupons or flash sales. The real implementation backs this fully:
GraphQL-sourced product/vendor content, a WooCommerce Store API-backed cart
drawer, and a hard handoff to WordPress's own checkout for payment — there
is intentionally no native Next.js checkout to design around.

### Marketing copy (final — use verbatim, do not paraphrase)

- Shop head: "Moveee Lifestyle" ("Lifestyle" in ochre italic) — description:
  "Every piece chosen for craft, longevity, and the story behind it. Every
  maker on Moveee is personally vetted for craft integrity, fair production,
  and lasting quality."
- Ticker loop: "Vetted Makers · ★ · Ethical Production · ★ · Free Returns ·
  ★ · Connect Members Save 10%"
- Editorial Picks header: "Editorial Picks" ("Picks" in ochre) + "The Moveee
  Edit →"
- Editorial bridge #1: "As Seen In" / "The Moveee Edit" (italic) / "Issue
  014 · Craft & Makers" / "Read the Issue →"
- Category grid: "Shop by Category" + "N pieces" per card
- Vendor strip: "Meet the Makers" + "All makers →" / "★ Vetted Maker" /
  "N products"
- Connect Member Band: "Connect Members" heading, "Join Moveee for early
  access to new makers, exclusive editions, and 10% off every purchase in
  the shop." — four perk cards: "Early Access" / "10% Off" / "Patron
  Stories" / "Maker Events" — "Join Moveee →" — float box: "2,400 Members &
  growing"
- Origins bridge: "Origins Journal" / "The stories behind the objects" /
  "Read Origins →"
- Product badges: "★ Vetted" · "New" · "Sold Out"
- Product CTA: "Add to Cart →"
- Pro banner (Pro member): "You have early access to this drop as a Moveee
  Pro member."
- Pro banner (non-Pro, gated): "This drop is available to Moveee Pro members
  first." + "Upgrade to Pro →" (logged in) / "Join Moveee Pro →" (logged out)
- Pro price label: "★ Your Pro price" / non-Pro teaser: "Pro member price
  available" + "Upgrade →"
- Accordion tab labels: "Description" · "Materials & Care" · "Delivery &
  Returns" · "About the Maker"
- "As Seen In" product block: "As Seen In" + "Read the Feature →"
- Maker story section: "01" / "The maker behind it" — fallback story text:
  "{Vendor} is a vetted Moveee partner — personally reviewed for craft
  integrity, fair production practices, and lasting quality."
- Process section: "How It's Made" / "From raw material to your door" / "A
  N-stage process — each step overseen by the maker themselves."
- Vendor profile card stats: "Years making" / "Products in shop" / "Moveee
  rating" — CTAs: "View maker profile" / "More from {Vendor}"
- Related products: "More from {Category}" ({Category} in ochre) + "View
  all →"
- Cart drawer: "Your Cart" — empty: "Your cart is empty." + "Browse the Shop
  →" — footer: "Subtotal" + "Shipping & taxes calculated at checkout" +
  "Checkout →" + "Continue Shopping"
- The Edit hero: "Moveee Lifestyle · The Edit" eyebrow, "The Moveee Edit"
  headline, "Products picked by our writers and editors — straight from the
  stories we tell. Every item is connected to a piece of culture." + "Browse
  the full shop →"
- The Edit empty state: "✦" / "Curation coming soon" / "Our editors are
  building the first edit. Check back shortly — or browse the full shop." +
  "Browse the shop →"
- The Edit stream: "From this story" label per product block; bottom CTA:
  "Want more?" / "Explore everything in the Moveee shop — vetted makers, all
  culture-connected." + "Browse the shop" / "Meet the makers"
- Makers directory: "Meet the Makers" ("Makers" in ochre italic) +
  "Every maker on Moveee is personally vetted for craft integrity, fair
  production practices, and lasting quality. These are the people behind the
  pieces."
- Maker profile: "Shop all products →" / "View profile" — products section:
  "Work by {Maker Name}" ({Name} in italic) — empty state: "No products
  listed yet. Check back soon."

### DEV ANNOTATION REQUIREMENT

1. <!-- DEV: ticker copy ("Connect Members Save 10%") and the home-page
   "Connect Member Band" section are stale pre-2026-06-21-rename leftovers —
   per CLAUDE.md's tier-naming table this should read "Moveee Members"
   everywhere; the "Patron Stories" perk-card label has the same issue and
   should read "Pro Stories" or similar. Flag for a copy-only fix in
   ShopArchiveWrapper.tsx, do not change tier logic. -->
2. <!-- DEV: there is no native checkout or order-confirmation screen in
   this app — "Checkout →" in the cart drawer is a plain anchor to
   https://cms.themoveee.com/checkout (WooCommerce-hosted). Do not design a
   third "checkout" frame; the drawer's footer button is the entire web
   checkout surface from this app's perspective. -->
3. <!-- DEV: Pro pricing (ShopSessionSection.tsx) is resolved client-side via
   useSession() inside a client component, not in page-level SSR/metadata —
   the server-rendered shell is tier-agnostic and the price/banner swap in
   after hydration. Don't design this as a server-decided split; it's a
   post-load client swap (briefly shows the non-Pro state on first paint). -->
4. <!-- DEV: there are two parallel maker-profile routes (app/makers/[slug]
   sourced from the directory, app/shop/brand/[slug] sourced from WooCommerce
   WCFM vendor data) that render near-identically. This prompt specs
   app/makers/[slug] only, since that's the one linked from the shop's
   "Meet the Makers" strip — do not conflate the two or assume one replaces
   the other. -->
5. <!-- DEV: the save/wishlist heart icon on the product page has no backing
   API call — it is UI-only with no persistence. Render it but do not design
   a "Saved Items" page around it; none exists. -->
6. <!-- DEV: vendor data has a three-tier fallback (GraphQL → custom REST
   /wp-json/moveee/v1/vendors/ → hardcoded FALLBACK_VENDORS array in code) —
   the "Meet the Makers" strip may show placeholder vendors (e.g. "Studio
   Fern") in low-data environments; this is intentional, not a bug to design
   around. -->

### PROMPT 14 — Lifestyle Shop (Desktop 1440px + Mobile 390px)

```
Senior product designer — Moveee Lifestyle shop, web. Desktop-first, 1440px
canvas, paper bg #F3ECE0 (--paper), white card fills, ink #14110D (--ink),
ochre #C5491F (--ochre, primary accent), gold #B38238 (--gold, secondary/Pro
accent), mute #7A6F5C (--mute). Fraunces serif for headlines/product names
(italic accent word in ochre), JetBrains Mono for vendor tags/badges/prices/
labels (uppercase, letter-spacing .13em), DM Sans sparingly for body copy.

FRAME 1 — SHOP HOME (full scroll, 1440px, top section through Origins
bridge):

HEADER (shared site header — logo left, nav centre, cart bag icon + count
badge right. Reuse Site A's existing header, do not redesign it here.)

SHOP HEAD (1100px max-width centred, 64px top padding):
  "Moveee Lifestyle" Fraunces 56px ("Lifestyle" italic ochre)
  Thin horizontal rule below, 24px margin
  Description: "Every piece chosen for craft, longevity, and the story
  behind it. Every maker on Moveee is personally vetted for craft integrity,
  fair production, and lasting quality." DM Sans 16px mute, max 640px

FILTER BAR (sticky on scroll, white bg, 64px height, bottom rule):
  Category tabs (horizontal, scrollable if overflow): All (active, ink fill
  white text) · Ceramics · Textiles · Leather · Jewellery · Objects · Paper
  + more — ghost text mute, mono 12px uppercase, underline on active.
  Right side: "Sort: Featured ▾" mono 12px mute dropdown + grid/list view
  toggle (two icon buttons, active = ink fill) + "N pieces" mono 11px mute
  count.

TICKER (full-bleed, dark ink bg, 40px height, horizontal marquee animation):
  Looping mono 11px uppercase gold text: "Vetted Makers · ★ · Ethical
  Production · ★ · Free Returns · ★ · Connect Members Save 10% · ★" — repeat
  seamlessly. <!-- DEV annotation 1: "Connect Members" is stale copy -->

EDITORIAL PICKS (1100px max-width, 80px top padding):
  Header row: "Editorial Picks" Fraunces 40px ("Picks" italic ochre) left +
  "The Moveee Edit →" mono 13px ochre right.
  2-column layout (60/40 split, 24px gap):
    LEFT: one large featured card, 1:1 image, "★ Vetted" pip top-left (white
    pill, mono 9px), "New" badge top-right (ochre fill, mono 9px white),
    below image: vendor tag mono 9px uppercase ochre, product name Fraunces
    22px italic price, price Fraunces 18px italic.
    RIGHT: 2×2 grid of 4 smaller cards, same field set at smaller scale.

EDITORIAL BRIDGE #1 (full-bleed, ink bg with radial rust-gradient overlay,
220px height, centred content):
  "As Seen In" mono 11px uppercase gold + "The Moveee Edit" Fraunces 32px
  italic white + "Issue 014 · Craft & Makers" mono 12px white/60 + "Read the
  Issue →" mono 13px gold underline.

MAIN PRODUCT GRID (1100px max-width, 4 columns, 24px gap, 80px top padding):
  "All Products" Fraunces 28px label (implicit from filter bar context).
  8 product cards: white fill, 1:1 image (badges: "★ Vetted" top-left, "New"
  ochre top-right OR "Sold Out" full dark overlay), vendor tag mono 9px
  ochre, product name Fraunces 16px, price Fraunces 15px italic, "Add to
  Cart →" mono 12px button revealed on image hover (slides up from bottom).

EDITORIAL BRIDGE #2 (same treatment as bridge #1, links to Origins Journal):
  "Origins Journal" Fraunces 32px italic white + descriptive subtext + "Read
  Origins →"

CATEGORY GRID (1100px max-width, 6 columns, 16px gap):
  6 category cards, each: image bg, dark gradient overlay bottom 40%,
  category name Fraunces 18px white + "N pieces" mono 11px white/70,
  bottom-left aligned.

VENDOR STRIP — "Meet the Makers" (1100px max-width, 80px top padding):
  Header: "Meet the Makers" Fraunces 28px + "All makers →" mono 13px ochre
  right.
  4-column grid of vendor cards: avatar (72px circle), "★ Vetted Maker" mono
  9px pill below avatar, vendor name Fraunces 18px, location mono 11px mute,
  bio excerpt DM Sans 13px mute 2 lines, "N products" mono 10px mute.

CONNECT MEMBER BAND (paper-deep bg, 1440px full-bleed, 2-column 50/50,
120px vertical padding): <!-- DEV annotation 1: stale "Connect" naming -->
  LEFT: "Connect Members" Fraunces 36px + paragraph: "Join Moveee for early
  access to new makers, exclusive editions, and 10% off every purchase in
  the shop." DM Sans 15px mute, max 440px.
  4 perk mini-cards in a row (◈ Early Access · ◇ 10% Off · ○ Patron Stories
  · △ Maker Events) — icon + label, mono 11px.
  "Join Moveee →" ochre filled pill button, 48px height.
  RIGHT: image placeholder + floating box overlapping bottom-left corner:
  "2,400 Members & growing" white card, Fraunces 16px ink, shadow-card.

ORIGINS BRIDGE (1100px max-width, 2-column, image left / text right, 80px
top+bottom padding):
  "Origins Journal" Fraunces 28px + "The stories behind the objects" + body
  copy + "Read Origins →" mono 13px ochre.

---

FRAME 2 — PRODUCT DETAIL PAGE (full scroll, 1440px):

BREADCRUMB (1100px max-width, 24px top padding): "Shop → Ceramics →
Terracotta Ritual Bowl" mono 11px mute + "← Back to Shop" mono 11px ochre
right-aligned.

PRODUCT HERO (1100px max-width, 2-column 55/45 split, 48px gap):
  LEFT — ProductGallery: large square hero image, "★ Vetted Maker" white
  pill seal top-left, expand-icon hint bottom-right (opens lightbox on
  click). Thumbnail strip below (4 small squares, active = ink border ring).
  RIGHT — product info:
    Vendor link: "Studio Fern" mono 11px ochre underline (links to maker
    page)
    "Terracotta Ritual Bowl" Fraunces 32px ink
    Short description DM Sans 15px mute, 2-3 lines
    PRO EARLY ACCESS BANNER (gold-bordered card, 16px padding, only if
    gated): for Pro members — "★ Pro Early Access" gold badge + "You have
    early access to this drop as a Moveee Pro member." DM Sans 13px; for
    non-Pro — same badge + "This drop is available to Moveee Pro members
    first. Opens publicly on [date]." + "Upgrade to Pro →"/"Join Moveee
    Pro →" mono 12px ochre link
    PRICE ROW: regular price Fraunces 24px italic (struck-through if on
    sale) + "GBP" mono 10px mute. Pro member: "★ Your Pro price" gold label
    above a gold Fraunces 24px italic discounted price, struck-through
    regular price shown smaller above it. Non-Pro teaser: "Pro member price
    available" mono 12px mute + "Upgrade →" ochre link.
    COLOUR SELECTOR (if variants): label + swatch row (32px circles, ink
    ring on active)
    SIZE SELECTOR (if variants): label + pill row (ink fill active, ghost
    border inactive)
    CTA ROW: "Add to Cart →" full-width ochre filled button (52px height) —
    OR if early-access-gated and non-Pro: "★ Get early access" gold filled
    button instead (links to /connect/membership, replaces Add to Cart
    entirely, not an overlay) + ♡ save icon button beside it (28px, outline,
    non-functional per DEV annotation 5)
    Delivery info: "Delivery: 3–5 working days" / "Returns: Free within 30
    days" mono 11px mute, stacked

ACCORDION (1100px max-width, below hero, ghost top rule, 24px top margin):
  4 collapsible rows: "Description" (expanded default, Fraunces 16px label +
  chevron) · "Materials & Care" (only if filled) · "Delivery & Returns"
  (only if filled) · "About the Maker" (only if vendor bio exists)
  Expanded content: DM Sans 14px mute, line-height 1.6

AS SEEN IN (1100px max-width, paper-deep card, radius-xl, 24px padding, only
if linked to a magazine post):
  "As Seen In" mono 11px ochre + magazine post title Fraunces 20px italic +
  category meta mono 11px mute + "Read the Feature →" ochre link

MAKER STORY SECTION (1100px max-width, 2-column, image left/text right, only
if vendor exists):
  "01" mono 11px ochre + "The maker behind it" Fraunces 28px + tagline +
  "Origins Journal" mono 10px mute meta
  Story text DM Sans 15px, line-height 1.7 — fallback if no custom copy:
  "Studio Fern is a vetted Moveee partner — personally reviewed for craft
  integrity, fair production practices, and lasting quality."

PROCESS SECTION — "How It's Made" (1100px max-width, only if steps exist):
  "How It's Made" mono 11px ochre + "From raw material to your door"
  Fraunces 28px + "A 3-stage process — each step overseen by the maker
  themselves." DM Sans 14px mute
  3-column grid of step cards: 01/02/03 mono 24px ochre + step title Fraunces
  16px + description DM Sans 13px mute + optional duration mono 10px italic

VENDOR PROFILE CARD (1100px max-width, white card, radius-xl, shadow-card,
2-column, 32px padding, only if vendor exists):
  LEFT: vendor avatar/image (160px square, radius-lg)
  RIGHT: "Vetted Maker · Lagos" mono 11px ochre tag + vendor name Fraunces
  24px + bio DM Sans 14px mute + stats row (3 columns: "Years making" /
  "Products in shop" / "Moveee rating", each a number Fraunces 20px + label
  mono 9px uppercase mute) + 2 CTAs: "View maker profile" (outline) + "More
  from Studio Fern" (ochre filled)

RELATED PRODUCTS (1100px max-width, 80px top padding):
  "More from Ceramics" Fraunces 24px ("Ceramics" italic ochre) + "View
  all →" right
  4-column grid, same product card style as the home grid.

---

FRAME 3 — CART DRAWER (overlay state, shown on top of Frame 1's product
grid, dimmed background ink 45% overlay):
  Drawer: 420px wide, slides from right, white fill, shadow-modal, full
  viewport height.
  HEADER (64px, ghost bottom rule): "Your Cart" Fraunces 20px + "(3)" mono
  12px mute count + × close icon right.
  ITEMS LIST (scrollable): 3 item rows, each: 72px square image left +
  product name Fraunces 14px + price Fraunces 13px italic right + quantity
  stepper (− 2 +, ghost border circles) below name + × remove icon.
  FOOTER (fixed, 24px padding, ghost top rule): "Subtotal" mono 12px + price
  Fraunces 16px italic right; "Shipping & taxes calculated at checkout" mono
  10px mute; "Checkout →" full-width ochre filled button (52px) <!-- DEV
  annotation 2: hard links to cms.themoveee.com/checkout, no in-app step
  after this -->; "Continue Shopping" ghost text button below, closes drawer.
  Empty state variant (small inset): "Your cart is empty." Fraunces 18px +
  "Browse the Shop →" ochre button.

---

FRAME 4 — "THE MOVEEE EDIT" PAGE (1440px, full scroll):
  HERO: "Moveee Lifestyle · The Edit" mono 11px uppercase ochre eyebrow +
  "The Moveee Edit" Fraunces 48px + "Products picked by our writers and
  editors — straight from the stories we tell. Every item is connected to a
  piece of culture." DM Sans 16px mute, max 560px + "Browse the full shop →"
  ochre link.
  STREAM (1100px max-width, repeating 2-column blocks, 64px gap between
  blocks):
    Each block: LEFT — magazine story card (480px image, category tag mono
    10px ochre, post title Fraunces 24px, excerpt DM Sans 14px mute ~140
    chars, date mono 11px mute, "Read the story →" ochre link). RIGHT — "From
    this story" mono 11px uppercase mute label + 2×2 grid of up to 4 linked
    products (image + name + price, smaller scale than main grid).
  EMPTY STATE (centred, if no editorials exist): "✦" 32px ochre + "Curation
  coming soon" Fraunces 22px + "Our editors are building the first edit.
  Check back shortly — or browse the full shop." DM Sans 14px mute + "Browse
  the shop →" ochre button.
  CLOSING BAND: "Want more?" Fraunces 28px + "Explore everything in the
  Moveee shop — vetted makers, all culture-connected." DM Sans 14px mute +
  2 buttons: "Browse the shop" (ochre filled) + "Meet the makers" (outline).

---

FRAME 5 — MAKER PROFILE PAGE (app/makers/[slug], 1440px, full scroll):
  BREADCRUMB: "Shop → Makers → Studio Fern" mono 11px mute.
  HERO (full-bleed banner image, 320px height, dark gradient overlay bottom
  60%): "★ Vetted Maker" mono 10px white pill + "Studio Fern" Fraunces 36px
  white + "Lagos, Nigeria" mono 12px white/70 + bio DM Sans 14px white/85
  max 480px + stats grid (3 cols: Years making / Products in shop / Moveee
  rating, white text) + 2 CTAs: "Shop all products →" (ochre filled) + "View
  profile" (white outline, only if a directory entry exists) + social links
  row (Website ↗ · Instagram ↗ · X ↗, if available).
  PRODUCTS SECTION (1100px max-width, 80px top padding): "Work by Studio
  Fern" Fraunces 28px ("Studio Fern" italic ochre) + count mono 12px mute +
  4-column product grid (same card style as shop home). Empty state if none:
  "No products listed yet. Check back soon." DM Sans 14px mute, centred.

---

FRAME 6 — MOBILE COMPANION (390px width, single scroll, representing Shop
Home + Product Detail collapsed to single column):
  Shop head stacked, filter bar becomes horizontal-scroll chip row with a
  separate sort/view row below it, ticker unchanged (full-bleed), editorial
  picks collapse to single column (large card, then 4 stacked small cards),
  product grid becomes 2-column, vendor strip becomes horizontal scroll,
  Connect Member Band stacks vertically (text block above image), cart
  drawer becomes full-width bottom-anchored sheet rather than a right-side
  panel (320px height, drag handle, same content).

CONSTRAINTS:
- Do not design a native checkout step or order-confirmation screen — the
  cart drawer's "Checkout →" button is the entire web checkout surface.
- Do not design a search page or filter bottom sheet — filtering is the
  sticky category-tab + sort-dropdown + view-toggle bar only.
- Pro early-access gating replaces the Add to Cart button outright; it does
  not render as a dimmed overlay on top of disabled controls.
- Use the real (stale) "Connect Members"/"Connect Member Band" copy where
  shown in code today, annotated via DEV note 1 — do not silently rename it
  to "Moveee Members" in the mockup itself.
```

Output 6 frames: Frame 1 (Shop Home, Desktop, full scroll), Frame 2 (Product
Detail Page, Desktop, full scroll), Frame 3 (Cart Drawer overlay, Desktop),
Frame 4 (The Moveee Edit, Desktop, full scroll), Frame 5 (Maker Profile Page,
Desktop, full scroll), Frame 6 (Mobile Companion, full scroll).

---

## 15. FEED CARD DETAIL DRAWERS — WEB (Site B, web.themoveee.com — `/feed`, `/connect/people`)

> **Note on scope.** Mobile's §17 designs these as bottom sheets (`BottomSheet.tsx`
> peek/full/dismiss states, drag handle, elastic overscroll, keyboard-aware compose
> bar) because that's the native iOS/Android interaction pattern. **Web has no
> bottom-sheet system at all** — the direct equivalent is a family of five
> **right-side slide-in drawer panels**, all sharing one shell (`position: fixed;
> inset: 0; zIndex: 8000`, panel `width: min(520px, 100vw)`, click-outside or
> Escape to close, `document.body.style.overflow = "hidden"` while open). There is
> no drag handle, no peek/full states, no elastic overscroll, and no native share
> sheet — clicking outside or pressing Escape is the only dismiss gesture, and the
> mount/unmount is instant (no slide-in transition or animation property exists in
> the real components). Five sibling components, all lazy-loaded via
> `dynamic(() => import(...), { ssr: false })` from `FeedCard.tsx`:
> `CommunityDetailModal.tsx` (all 10 post templates — the equivalent of mobile's
> PROMPT 17B), `QuoteDetailModal.tsx`, `HappeningDetailModal.tsx`,
> `DirectoryDetailModal.tsx` (these three plus `PulseDetailModal.tsx` are the
> equivalent of mobile's PROMPT 17C "Other Feed Card Detail Sheets"). Mobile's
> PROMPT 17D edge cases (native share sheet stacked on top, keyboard-aware comment
> compose bar, elastic overscroll, wifi-error empty state) have **no web
> equivalent** — web has no native share sheet to stack, no on-screen keyboard to
> accommodate, no overscroll physics, and errored comment fetches render inline
> ("Loading comments…" never resolving) rather than a dedicated error frame. None
> of these are designed here; see DEV note 5.

### Brand architecture

Connect to Culture — Site B (`apps/connect`, web.themoveee.com). These drawers
render wherever the unified feed renders cards: `/feed` (Pulse Feed) and any other
surface using `packages/shared/components/pulse/FeedCard.tsx`.

### Why this section exists

CLAUDE.md already documents "Feed card offcanvas detail modals" as a settled
pattern (`HappeningDetailModal.tsx`, `DirectoryDetailModal.tsx`,
`QuoteDetailModal.tsx`, all `packages/shared/components/pulse/`,
`position: fixed, zIndex: 8000, width: min(520px, 100vw)`) — but that note doesn't
cover `CommunityDetailModal.tsx`, which is the web analog of mobile's biggest
single prompt (17B, all 10 community templates) and has never been speced for
design. This section closes that gap and gives the existing three modals (plus the
previously-undocumented `PulseDetailModal.tsx`) their first visual spec, grounded
directly in the live component code rather than the mobile bottom-sheet mockups.

### Marketing copy (final — use verbatim, do not paraphrase)

- Happening badge: **"Happening"**
- Directory badge: **"Directory"**
- Quote badge: **"Quote"**
- Community badge: **"Community"**
- Literati pill (Happening only, conditional): **"🪶 Literati Connect"**
- Happening CTA: **"View Event Details →"**
- Directory CTA: **"View Full Entry →"**
- Happening header link: **"Full page →"**
- Directory header link: **"Full page →"**
- Quote header link: **"Full page →"**
- Community header link (conditional on slug): **"Open full page →"**
- Happening empty-organiser fallback label: **"Organised by"**
- Community follow toggle: **"Follow"** / **"✓ Following"**
- Community hidden-gem badge: **"Hidden Gem"** + star glyphs
- Community cultural-take badge: **"Take · {locationName}"**
- Community food-review badge: **"Food Review · {foodDishName}"**
- Community creative-showcase badge: **"Creative Showcase"**
- Community itinerary badge: **"Weekend Route"**
- Community event badge: **"Event · {eventCategory}"**
- Community event ticket link: **"Get tickets →"**
- Community report (card-level, not modal): **"Report this post"** → **"Report
  as: …"** → **"Reported — thank you."**
- Reaction bar labels (emoji only, no text labels): ❤️ Love · 🔥 Fire · 👏 Respect
- Comment thread loading state: **"Loading comments…"**

### DEV ANNOTATION REQUIREMENT

The following `<!-- DEV: ... -->` notes MUST appear in the prompt at the indicated
insertion points:

1. `<!-- DEV: All five drawer panels share one shell exactly — position: fixed,
   inset: 0, zIndex: 8000, panel width: min(520px, 100vw), backdrop
   rgba(20,17,13,0.55), boxShadow -4px 0 24px rgba(0,0,0,0.15). There is no CSS
   transition/animation anywhere in these components — render this as an instant
   cut, not a slide-in. -->` — insert at the top of the FRAME 1 shell description.
2. `<!-- DEV: CommunityDetailModal.tsx and FeedCard.tsx each keep their own
   duplicate copies of PollDisplay and RsvpDisplay (not a shared module) — if this
   design ever changes the poll or RSVP UI, both files need the same edit. -->`
   — insert near the Poll/RSVP frame.
3. `<!-- DEV: PulseDetailModal.tsx is a fifth sibling drawer (for item.type ===
   "pulse" cards) that exists in code but has no documented spec anywhere — give
   it the same shell as the other four; its content is an editorial/pulse story
   read view, closest in shape to HappeningDetailModal's body without the RSVP
   CTA. -->` — insert near the Pulse/Editorial frame.
4. `<!-- DEV: Reactions appear TWICE for community posts — once inline on the
   feed card itself, and again inside this same modal via a second independent
   ReactionBar instance (itemType="community", noBorder). Both hydrate
   separately against the same per-user server record; do not assume the modal
   "inherits" the card's reaction state. -->` — insert near the
   CommunityDetailModal reaction bar.
5. `<!-- DEV: Mobile's bottom-sheet edge cases (native share sheet stacked on
   top, keyboard-aware comment compose bar, elastic overscroll, wifi-error empty
   state) have no web equivalent and are out of scope here — web has no native
   share sheet, no on-screen keyboard layout shift, no overscroll physics, and an
   errored comment fetch just leaves "Loading comments…" showing indefinitely
   rather than rendering a dedicated error state. -->` — insert as a closing note
   after the last frame.
6. `<!-- DEV: The ⚑ report control lives only on the feed card footer
   (FeedCard.tsx), never inside the detail modal — clicking it does not open or
   affect this drawer at all. Do not add a report button to the modal mockup. -->`
   — insert near the CommunityDetailModal author row.

### PROMPT 15 — Feed Card Detail Drawers (Desktop 1440px + Mobile 390px)

```
Senior product designer — Moveee (web.themoveee.com) feed card detail drawers.
Brand: paper #F3ECE0, white, ochre #C5491F, gold #B38238, ink #14110D,
Fraunces (serif headings) + DM Sans (body) + JetBrains Mono (labels/dates).

Design 5 right-side slide-in drawer panels that open over the Pulse Feed (`/feed`)
when a card is clicked. All five share one shell:

<!-- DEV: All five drawer panels share one shell exactly — position: fixed,
inset: 0, zIndex: 8000, panel width: min(520px, 100vw), backdrop
rgba(20,17,13,0.55), boxShadow -4px 0 24px rgba(0,0,0,0.15). There is no CSS
transition/animation anywhere in these components — render this as an instant
cut, not a slide-in. -->

SHARED SHELL (all 5 frames):
  Backdrop: full viewport, rgba(20,17,13,.55), behind the panel.
  Panel: right-anchored, width 520px (desktop) / 100vw (mobile companion),
    full viewport height, paper #F3ECE0 fill, scrollable, box-shadow
    -4px 0 24px rgba(0,0,0,.15), no rounded corners (flush right edge).
  Sticky header (20px padding, white-ish paper bg, 1px bottom border #e0dbd1):
    Left: type badge pill(s). Right: "Full page →" link (DM Sans 13px ochre,
    omitted on Directory's header — Directory repeats its badge as plain text
    instead) + ✕ close button (24px ghost icon, ink).
  Content area: 1.25rem padding throughout, ghost rules (1px #e8e2d8) between
  major sections.

════════════════════════════════════════════
FRAME 1 — HAPPENING DRAWER
════════════════════════════════════════════
Header badges: "Happening" pill (bg #eeedfe, text #3c3489, 9px bold, pill
  radius) + conditional "🪶 Literati Connect" pill (ochre-bordered, shown only
  for Literati Connect events) + plain eventCategory text if present.

Content:
  Featured image — contain-fit, max-height 360px, letterboxed on #f9f6f1,
    bordered rounded card.
  Title: Fraunces 22px bold ink ("Afro Nation Lagos 2026" placeholder).
  Event-details strip card (white fill, bordered, rounded, 16px padding):
    📅 long-format date ("Saturday, 28 June 2026"), optional end date,
      optional opening hours.
    📍 location / venue address / city.
    🎟 admission, bold.
  Description: 2 paragraphs, DM Sans 14px ink-soft, 1.6 line-height (sanitized
    HTML body, link color #3c3489).
  "Organised by" eyebrow label + linked pill to /directory/{slug} (ochre text)
    or plain bold text if unlinked.
  CTA button: full-width, solid indigo #3c3489, white 14px bold text,
    "View Event Details →", radius-full, 52px height.

No reaction bar, no comments, no follow toggle on this drawer.

════════════════════════════════════════════
FRAME 2 — DIRECTORY DRAWER
════════════════════════════════════════════
Header badges: "Directory" pill (bg #e8f5ee, text #085041, 9px bold) + plain
  entryType text ("STUDIO").

Content:
  Cover image — cover-fit, max-height 260px, rounded.
  Title: Fraunces 22px bold ink.
  Second, more prominent type badge below title (same green pill style).
  "Added {date}" — muted gray #999, small.
  Excerpt: 2-3 paragraphs, DM Sans 14px ink-soft, decoded HTML entities.
  CTA button: full-width, solid #085041 fill, white text, "View Full Entry →",
    radius-full, 52px height.

No reaction bar, no comments, no follow toggle on this drawer.

════════════════════════════════════════════
FRAME 3 — QUOTE DRAWER
════════════════════════════════════════════
Header badge: "Quote" pill (bg #f3eef8, text #7a4da0, 9px bold).

Content (vertically centred in available space, 2rem 1.5rem padding):
  Decorative " glyph — Fraunces serif, 4rem, color #d8c9b0.
  Quote text — Fraunces 1.35rem italic ink, 1.55 line-height.
  Attribution block (1px top border #e8e2d8): "— {author}" in rust #c5491f,
    then italic source text in muted gray below it.
  Optional sharing-reason callout: "💬 {reason text}" on #ece5d6 background,
    rounded card, only when present.
  Date line — very muted gray #bbb, small, centred.
  ReactionBar (noBorder variant) — ❤️ Love · 🔥 Fire · 👏 Respect icon buttons
    with counts, spacer, then a share icon button (copy-link / native share).

No comment thread, no follow toggle on this drawer.

════════════════════════════════════════════
FRAME 4 — COMMUNITY DRAWER (all 10 templates, composite reference frame)
════════════════════════════════════════════
Header badges: "Community" pill (bg #edf7ed, text #2e7d32, 9px bold) + plain
  communityTag text. Header right: "Open full page →" link (only when the
  post has a slug) + close button.

<!-- DEV: The ⚑ report control lives only on the feed card footer
(FeedCard.tsx), never inside the detail modal — clicking it does not open or
affect this drawer at all. Do not add a report button to the modal mockup. -->

AUTHOR ROW (top of content):
  38px avatar circle (initials fallback or photo) — Moveee Pro authors get a
    gold glow ring: box-shadow 0 0 0 2.5px #b38238, 0 0 16px 4px
    rgba(179,130,56,.6).
  Author name + small gold "PRO" badge chip (13px) if Pro tier.
  Date, muted, small.
  Right-aligned follow toggle pill — "Follow" (plain border, ink text) or
    "✓ Following" (gold border + tinted fill + gold text). Hidden entirely
    when viewing your own post or when logged out.

TEMPLATE BADGE ROW (varies by templateType — show all 10 as labelled chips in
this reference frame, stacked vertically with a divider between each, each
chip annotated with its template name in JetBrains Mono 10px ghost):
  • Standard Post — no badge, plain text + media only.
  • Hidden Gem — ochre badge "Hidden Gem ★★★☆☆" (stars from rating).
  • Cultural Take — purple badge "Take · {locationName}".
  • Food Review — rust badge "Food Review · {dish name}"; below the post
    text, a 3-row rating strip: Taste / Value / Vibe, each a 5-star glyph row
    (filled ★ + empty ☆).
  • Creative Showcase — blue badge "Creative Showcase".
  • Itinerary — green badge "Weekend Route"; numbered stop list below the
    text: circular ochre numbered markers, bold stop name, optional note,
    optional small thumbnail per stop.
  • Community Event — rust badge "Event · {category}"; event-details block
    (📅 date/end date, 📍 location/city, 🎟 admission, "Organised by {link}",
    "Get tickets →" external link;
    <!-- DEV: CommunityDetailModal.tsx and FeedCard.tsx each keep their own
    duplicate copies of PollDisplay and RsvpDisplay (not a shared module) — if
    this design ever changes the poll or RSVP UI, both files need the same
    edit. -->
    when RSVP is enabled, an RSVP block directly below: spots-left count,
    "RSVP" / "Cancel RSVP" toggle button).
  • Poll — vote-option buttons (full width, bordered), turning into
    percentage-bar rows once voted/expired, with a vote-count + expiry caption
    below.
  • Quote (as a community template, distinct from FRAME 3's curated Quote) —
    same decorative-quote treatment as Frame 3 but inline within the
    community post body rather than as the drawer's sole content.
  • Book Review — star rating row + review text; no distinct badge color
    documented beyond the generic post styling.
  📍 location badge ("📍 {locationName}") appears on every template except
    Cultural Take (which folds location into its own badge text).

SHARED CONTENT BLOCKS (below the template-specific block, in this order when
present): post text (with @mention highlighting in gold), gallery strip
(horizontal scroll, 220px tall cover-fit images) OR a single image (only if no
gallery), video embed (YouTube iframe or a plain "Watch video →" link for
non-YouTube), link preview card (only if no image and a source URL exists).

REACTIONS + COMMENTS (bottom of drawer):
<!-- DEV: Reactions appear TWICE for community posts — once inline on the
feed card itself, and again inside this same modal via a second independent
ReactionBar instance (itemType="community", noBorder). Both hydrate
separately against the same per-user server record; do not assume the modal
"inherits" the card's reaction state. -->
  ReactionBar (noBorder) — ❤️ Love · 🔥 Fire · 👏 Respect + share icon.
  1px bottom border separating reactions from comments.
  Comment thread below: avatar + name + comment text rows, composer at the
  very bottom (avatar + text input + "Post" button). Loading state shows
  "Loading comments…" centred, muted.

════════════════════════════════════════════
FRAME 5 — PULSE/EDITORIAL DRAWER
════════════════════════════════════════════
<!-- DEV: PulseDetailModal.tsx is a fifth sibling drawer (for item.type ===
"pulse" cards) that exists in code but has no documented spec anywhere — give
it the same shell as the other four; its content is an editorial/pulse story
read view, closest in shape to HappeningDetailModal's body without the RSVP
CTA. -->
Header badge: "Pulse" or "Editorial" pill (use the same muted-indigo styling
  family as Happening's badge for visual consistency, since no bespoke color
  is documented for this drawer). Header right: "Full page →" link + close.

Content: hero image (contain-fit, letterboxed, same treatment as Happening's
  image), Fraunces title, source/byline line (DM Sans 13px mute), body
  copy in 2-3 paragraphs (DM Sans 14px ink-soft, 1.6 line-height), ghost rule,
  ReactionBar (noBorder) — ❤️ Love · 🔥 Fire · 👏 Respect + share, ghost rule,
  "More in this series" related-items row (2 compact rows: small thumbnail +
  title + date), CTA link "Read full story →" to the source/article page.

<!-- DEV: Mobile's bottom-sheet edge cases (native share sheet stacked on
top, keyboard-aware comment compose bar, elastic overscroll, wifi-error empty
state) have no web equivalent and are out of scope here — web has no native
share sheet, no on-screen keyboard layout shift, no overscroll physics, and an
errored comment fetch just leaves "Loading comments…" showing indefinitely
rather than rendering a dedicated error state. -->

════════════════════════════════════════════
MOBILE COMPANION (390px, all 5 drawers):
Panel becomes full-width (100vw) instead of 520px — otherwise identical
layout, header, and content structure to the desktop frames above. No bottom-
sheet drag handle or peek state — same instant-cut right-side panel, just
edge-to-edge.

CONSTRAINTS:
- Do not design drag handles, peek/full snap states, or elastic overscroll —
  none of that exists in the real components; this is a plain fixed-position
  overlay panel, not a native sheet.
- Do not design a native share-sheet-stacked-on-top frame, a keyboard-aware
  comment compose frame, or a wifi-error empty state frame for these drawers —
  none have a web equivalent (see DEV note 5).
- Do not add a report (⚑) control inside any drawer — it only exists on the
  feed card itself.
- Do not invent a transition/slide-in animation — render the panel as already
  fully open in every frame.
```

Output 5 frames + 1 mobile-companion sheet: Frame 1 (Happening), Frame 2
(Directory), Frame 3 (Quote), Frame 4 (Community — composite of all 10
templates), Frame 5 (Pulse/Editorial), Mobile Companion (full-width variant of
all 5, shown stacked or as a single representative frame with template
callouts).

---

## 16. DESIGN SYSTEM & CORE UI COMPONENTS — WEB (Site A + Site B, shared tokens)

> **Note on scope.** Mobile's §0 (Design System Foundation) and §1 (Core UI
> Components — Buttons/Inputs/Avatars + Feed Cards & Badge System) describe a
> from-scratch React Native token system and a matching set of reusable
> components. **Web has no equivalent component library at all** — there is no
> shared `<Button>`, `<Input>`, or `<Avatar>` React component anywhere in
> `packages/shared`, `apps/connect`, or `apps/site`. Buttons are plain
> `<button>`/`<a>`/`<Link>` elements styled by one of 16+ independently-defined
> className families (`.con-btn-primary`, `.con-btn-ghost`, `.ch-btn-ghost`,
> `.ch-btn-solid`, etc.), and avatars are inlined per-surface with no shared size
> scale — a member-dashboard avatar, a public-profile avatar, a header avatar,
> and a feed-card avatar are four separate hand-styled `<div>`s with four
> different sizes/background colors. This section therefore documents what
> *actually exists* — the real CSS custom-property token set (which **does**
> exist and **is** shared, just via `:root` variables rather than a design-token
> JS object) plus a representative sample of the real button/avatar/badge
> patterns in use — rather than designing a net-new component library mobile
> never needed prompting for either (mobile's own component system was built
> directly into React Native screens, not abstracted into a shared package).
> Site A and Site B's token sets are **not identical** — see DEV note 1.

### Brand architecture

Spans both Site A (Moveee Magazine, themoveee.com) and Site B (Moveee,
web.themoveee.com) — this is the shared visual foundation both surfaces draw
from, plus where they diverge.

### Why this section exists

Every other web section in this document has referenced "the brand tokens" by
name (paper, ink, ochre, gold, mute) without ever showing them side by side or
confirming their exact values against the real CSS. This section is that
reference sheet — grounded in the actual `:root`/`@theme` blocks in both apps'
`globals.css`, not the mobile catalog's hex list (which mostly matches, but not
entirely — see DEV note 1 for where they diverge).

### Marketing copy (final — use verbatim, do not paraphrase)

This is a component/token reference page, not a marketing surface — no
verbatim marketing copy block applies. Use real UI copy strings only where
shown in the frame specs below (e.g. "Moveee Pro", "Moveee Citizen", nav labels).

### DEV ANNOTATION REQUIREMENT

The following `<!-- DEV: ... -->` notes MUST appear in the prompt at the
indicated insertion points:

1. `<!-- DEV: Site A (apps/site) and Site B (apps/connect) do NOT share an
   identical token set. Site B has `--paper-warm` (#f3ece0),
   `--shadow-card/--shadow-modal/--shadow-fab`, `--glow-gold`, `--rule-dark`,
   and full dark-mode tokens under `[data-theme="dark"]`. Site A has none of
   these — its `--rule` is even a different type (`#2a241c` solid color vs
   Site B's `rgba(20,17,13,0.10)`), and it has no dark mode at all. As of the
   site-wide border-radius rollout (June 2026, see CLAUDE.md "Border-radius
   convention"), BOTH apps now define the identical `--radius-*` scale — this
   is no longer a Site-B-only token. Only `--paper`, `--paper-deep`, `--ink`,
   `--ink-soft`, `--mute`, `--ochre`, `--ochre-deep`, `--moss`, `--gold`, and
   now `--radius-*` are truly shared. -->` — insert at the top
   of the Color Tokens frame.
2. `<!-- DEV: There is no shared web `<Button>`/`<Input>`/`<Avatar>` component
   — every button is a plain element styled by one of 16+ independent
   className families (.con-btn-primary, .con-btn-ghost, .ch-btn-ghost,
   .ch-btn-solid, plus per-page families like .adm-btn-*, .mz-btn-*). Avatars
   are inlined per-surface with four different real-world sizes (header 34px,
   public profile 72px/52px mobile, member dashboard 72px/56px mobile, feed
   card 34px) and three different background colors (--ink, --ochre, #edf7ed)
   — there is no single "avatar size scale" to draw from like mobile's
   XS/SM/MD/LG/XL. Show the real sizes as four distinct named instances, not a
   clean scale. -->` — insert at the top of the Buttons & Avatars frame.
3. `<!-- DEV: `var(--font-jetbrains-mono)` is defined but never actually
   referenced anywhere in either app's CSS — every mono-font usage (button
   labels, meta text, badges) hardcodes the literal string 'JetBrains Mono',
   monospace instead. There's also a dangling `var(--font-newsreader)`
   reference in apps/connect/app/globals.css (.comment-sidebar-header h3) with
   no Newsreader font ever imported — flag both as known CSS debt, do not
   "fix" them in the mockup. -->` — insert near the Typography frame.
4. `<!-- DEV: FeedCard.tsx has no template badge at all for Poll (renders
   straight into PollDisplay with no header label) or Book Review (mobile-only
   feature, never built on web) — do not invent badge colors for these two;
   show them as "no badge" states instead. -->` — insert near the Badge System
   frame.
5. `<!-- DEV: Web has no persistent bottom tab bar — confirmed absent from both
   apps/connect and packages/shared. Site B's mobile nav is a slide-down
   hamburger overlay drawer (position: fixed; top: 60px), not a tab bar; Site A
   has the same hamburger pattern plus a separate cart icon. Do not design a
   bottom tab bar frame — replace it with the real header nav (desktop) +
   hamburger drawer (mobile) shown in the Navigation frame. -->` — insert at
   the top of the Navigation frame.

### PROMPT 16 — Design System & Core UI Components (Desktop 1440px + Mobile 390px)

```
Senior product designer — Moveee web design system reference sheet, covering
both Site A (Moveee Magazine, themoveee.com) and Site B (Moveee,
web.themoveee.com). Desktop frame 1440px wide, scrollable.

<!-- DEV: Site A (apps/site) and Site B (apps/connect) do NOT share an
identical token set. Site B has --paper-warm (#f3ece0),
--shadow-card/--shadow-modal/--shadow-fab, --glow-gold, --rule-dark, and full
dark-mode tokens under [data-theme="dark"]. Site A has none of these — its
--rule is even a different type (#2a241c solid color vs Site B's
rgba(20,17,13,0.10)), and it has no dark mode at all. Both apps now share an
identical --radius-* scale (added site-wide June 2026, see CLAUDE.md
"Border-radius convention") — radius is no longer Site-B-only. Only --paper,
--paper-deep, --ink, --ink-soft, --mute, --ochre, --ochre-deep, --moss, --gold,
and --radius-* are truly shared. -->

════════════════════════════════════════════
FRAME 1 — COLOR TOKENS
════════════════════════════════════════════
Two labelled columns: "Shared (both apps)" and "Site B only (apps/connect)".

SHARED swatches (each a 120×120px square + label below: token name, hex, used-by):
  --paper #ffffff · --paper-deep #f2f2f2 (site: #f2f2f2 / connect: #f5f5f5 —
    label both) · --ink #14110d · --ink-soft #3a342b · --mute #7a6f5c ·
  --ochre #c5491f · --ochre-deep #8a2d10 · --moss #3d4a2a · --gold #b38238.

SITE B ONLY swatches:
  --paper-warm #f3ece0 · --rule rgba(20,17,13,.10) · --rule-dark
    rgba(20,17,13,.15) · --glow-gold (render as a gold-glow ring sample, not a
    flat swatch: box-shadow 0 0 0 2px #b38238, 0 0 10px 2px rgba(179,130,56,.55)).

DARK MODE swatches (Site B only, [data-theme="dark"], second labelled row):
  --paper #242018 · --paper-warm #1a1612 · --paper-deep #2d2820 ·
  --ink #f3ece0 · --ink-soft #d4c9b8 · --mute #9e9288 · --ochre #d4603a ·
  --ochre-deep #a83f20 · --gold #c9963f.

RADIUS SCALE (shared by both apps since June 2026), 6 rounded rectangles
  labelled: sm 2px · md 4px · lg 6px · xl 12px · 2xl 20px · full 9999px (pill).

SHADOWS (Site B only, 3 sample cards):
  shadow-card: 0 1px 3px rgba(20,17,13,.08) · shadow-modal: 0 20px 60px
  rgba(20,17,13,.18) · shadow-fab: 0 4px 12px rgba(197,73,31,.35).

════════════════════════════════════════════
FRAME 2 — TYPOGRAPHY
════════════════════════════════════════════
<!-- DEV: var(--font-jetbrains-mono) is defined but never actually referenced
anywhere in either app's CSS — every mono-font usage (button labels, meta
text, badges) hardcodes the literal string 'JetBrains Mono', monospace
instead. There's also a dangling var(--font-newsreader) reference in
apps/connect/app/globals.css (.comment-sidebar-header h3) with no Newsreader
font ever imported — flag both as known CSS debt, do not "fix" them in the
mockup. -->

Three font families, each loaded via next/font/google in both apps' layout.tsx
(no explicit weight set on either Font call — weights come from CSS):
  Fraunces (serif, display/headings) — sample at 36px/700, 28px/700, 22px/400.
  DM Sans (sans, body/UI) — sample at 17px/400, 15px/400, 13px/400, 15px/700.
  JetBrains Mono (labels/meta/buttons) — sample at 11px/400, 11px/700,
    10px/700 uppercase letter-spacing .1em-.15em (this is the actual button-
    label treatment, e.g. .con-btn-primary).

════════════════════════════════════════════
FRAME 3 — BUTTONS & AVATARS
════════════════════════════════════════════
<!-- DEV: There is no shared web <Button>/<Input>/<Avatar> component — every
button is a plain element styled by one of 16+ independent className families
(.con-btn-primary, .con-btn-ghost, .ch-btn-ghost, .ch-btn-solid, plus
per-page families like .adm-btn-*, .mz-btn-*). Avatars are inlined per-surface
with four different real-world sizes (header 34px, public profile 72px/52px
mobile, member dashboard 72px/56px mobile, feed card 34px) and three different
background colors (--ink, --ochre, #edf7ed) — there is no single "avatar size
scale" to draw from like mobile's XS/SM/MD/LG/XL. Show the real sizes as four
distinct named instances, not a clean scale. -->

BUTTONS — show each real class, labelled with its className:
  .con-btn-primary: ochre fill, white text, JetBrains Mono 10px uppercase
    letter-spacing .15em, 14px/28px padding, no border-radius (square
    corners — this family predates the radius scale).
  .con-btn-ghost: no fill, mute text, JetBrains Mono 10px uppercase,
    1px bottom border only (underline-style, not a pill).
  .ch-btn-ghost (header-only variant): ink text, 1px border
    rgba(42,36,28,.25), radius 6px, DM Sans 14px/500, hover →
    --paper-deep bg.
  .ch-btn-solid (header-only variant): white text on ink fill,
    radius 6px, DM Sans 14px/600, hover → 82% opacity.

AVATARS — show 4 real instances side by side, each labelled with its source
  component/file, NOT as a clean size scale:
  Header avatar — 34px, --ink bg, white initial, DM Sans 0.8rem/700.
  Public profile avatar (.prf-avatar) — 72px desktop / 52px mobile, --ink bg,
    Fraunces 28px/300 (20px mobile) initial.
  Member dashboard avatar (.mem-avatar) — 72px desktop / 56px mobile, --ochre
    bg, Fraunces 28px/400 (22px mobile) initial.
  Feed card avatar (community card) — 34px, #edf7ed bg, 1px solid #c8e6c9
    border, #2e7d32 initial color. Pro-tier variant: add the gold glow ring
    (box-shadow 0 0 0 2.5px #b38238, 0 0 16px 4px rgba(179,130,56,.6)).

TIER BADGE (ProBadge.tsx) — solid gold (#B38238) rounded square, white ribbon/
  medal SVG icon centred, no text inside the badge itself (icon-only, ~size×0.62
  icon inside a size-scaled padded square). Show at size=13 (its real usage
  next to author names in FeedCard) and size=24 (larger reference). Separately
  show the text-label pairing used in the header: "Moveee Pro" / "Moveee
  Citizen" plain text (DM Sans), confirming the badge icon and the tier-name
  text are two independent pieces, not one combined component.

NOTIFICATION BELL — bell outline icon (ink), with the real unread indicator:
  14×14px circle, border-radius 50%, background #c5491f, white count text
  (9px/700, "9+" cap above 9) — NOT a plain dot, it always shows a number.
  Dropdown panel's per-row unread dot: 6×6px circle, same #c5491f.

════════════════════════════════════════════
FRAME 4 — REACTION BAR
════════════════════════════════════════════
Three reaction buttons in this exact order: ❤️ Love · 🔥 Fire · 👏 Respect
  (note: the third one's internal key is "clap" but its display label is
  "Respect", not "Clap" — use "Respect" in the mockup).
  Inactive state: transparent bg, transparent border, color #7a6f5c.
  Active state: bg #f0ece4, border 1px #d8cfc4, color #3a342b, radius 20px.
  Padding 0.2rem/0.55rem, emoji ~0.85rem, count text ~0.8rem, gap 0.3rem
  between emoji and count, 0.25rem gap between the three buttons.
  Share button (right-aligned): outline download-tray icon, #7a6f5c, no text
  — becomes a green (#2e7d32) "Copied ✓" text label for 2 seconds after tap
  (clipboard fallback when the Web Share API isn't available).
  Optional top divider (omitted when used inside a detail drawer that already
  has its own divider): 1px border-top #e8e2d8, 0.5rem padding-top.

════════════════════════════════════════════
FRAME 5 — BADGE SYSTEM (FeedCard.tsx, real values)
════════════════════════════════════════════
<!-- DEV: FeedCard.tsx has no template badge at all for Poll (renders straight
into PollDisplay with no header label) or Book Review (mobile-only feature,
never built on web) — do not invent badge colors for these two; show them as
"no badge" states instead. -->

All badges: fontSize ~0.58-0.6rem, fontWeight 700, letterSpacing 0.1em,
  uppercase, padding ~2px/6px, borderRadius 2px (square-ish pill, not full
  radius — distinct from mobile's radius-full badge treatment).

FEED-ITEM-TYPE badges (6, shown as one row):
  Pulse "Pulse" #b38238 on #fef3e2 · Editorial "Editorial" #c5491f on #fff0eb ·
  Happening "Happening" #3c3489 on #eeedfe · Directory "Directory" #085041 on
  #e8f5ee · Quote "Quote" #7a4da0 on #f3eef8 · Community "Community" #2e7d32
  on #edf7ed.

COMMUNITY TEMPLATE badges (6 real + 2 explicit "no badge" states, second row):
  Hidden Gem "Hidden Gem {★ rating}" #b38238 on rgba(179,130,56,.1) ·
  Cultural Take "Take{· location}" #6b48a8 on rgba(107,72,168,.08) ·
  Food Review "Food Review{· dish}" #c5491f on rgba(197,73,31,.08) ·
  Creative Showcase "Creative Showcase" #1976d2 on rgba(25,118,210,.08) ·
  Itinerary "Weekend Route" #2e7d32 on rgba(46,125,50,.08) · Event
  "Event{· category}" #a8351f on rgba(168,53,31,.08) · Poll — show as a plain
  unbadged card header (just the avatar/author row, no pill at all) · Book
  Review — same explicit "no badge on web" treatment.

Literati Connect pill (happening cards only): "🪶 Literati Connect", color
  #b38238, background #f3ece0, border 1px #b38238.

════════════════════════════════════════════
FRAME 6 — NAVIGATION
════════════════════════════════════════════
<!-- DEV: Web has no persistent bottom tab bar — confirmed absent from both
apps/connect and packages/shared. Site B's mobile nav is a slide-down
hamburger overlay drawer (position: fixed; top: 60px), not a tab bar; Site A
has the same hamburger pattern plus a separate cart icon. Do not design a
bottom tab bar frame — replace it with the real header nav (desktop) +
hamburger drawer (mobile) shown in this frame. -->

Two side-by-side desktop header strips, each full 1440px width, labelled:

SITE B HEADER (apps/connect/components/Header.tsx): logo left; nav links
  "Feed" · "Events" · "Games" (local) + "Magazine ↗" (external, deep-links to
  themoveee.com/magazine) — active link gets background var(--paper-deep),
  color var(--ink); right side: compass icon (→ /discover), sun/moon theme
  toggle, NotificationBell (logged-in only), avatar + dropdown (My Dashboard /
  Wallet / Settings / Vendor Dashboard if vendor / Sign out), or "Sign in" +
  "Join" buttons (.ch-btn-ghost / .ch-btn-solid) when logged out.

SITE A HEADER (apps/site/components/Header.tsx): logo left; nav links "Feed"
  · "Discover" (both external, deep-link to web.themoveee.com) + "Editorials"
  (local, the only in-app link) — active state via data-active="true"
  attribute, not a class; right side: search icon, cart icon with numeric
  badge (.cart-badge), "Sign in" link, "Join →" button. No theme toggle, no
  notification bell, no compass icon (Discover lives on Site B only).

MOBILE COMPANION (390px, both sites): collapsed header bar (logo + hamburger
  + cart icon on Site A only) → tap hamburger → full-width slide-down overlay
  drawer (position: fixed, top: 60px) listing the same nav links as desktop,
  stacked vertically. No bottom tab bar on either site.

CONSTRAINTS:
- Do not invent a shared `<Button>`/`<Input>`/`<Avatar>` component system —
  show the real fragmented className-based reality instead.
- Do not design a bottom tab bar — it does not exist on web.
- Do not give Poll or Book Review community-post badges — they have none on
  web (Book Review has no web composer or feed rendering at all).
- Use the real "Respect" reaction label, not "Clap", even though the internal
  key is `clap`.
```

Output 6 frames: Frame 1 (Color Tokens), Frame 2 (Typography), Frame 3
(Buttons & Avatars), Frame 4 (Reaction Bar), Frame 5 (Badge System), Frame 6
(Navigation, desktop + mobile companion).

---

## 17. AUTHENTICATION FLOW — WEB (Site B, web.themoveee.com)

### Brand architecture
Auth lives entirely on Site B (`apps/connect`) — Site A never shows login/register UI; it
redirects auth paths to web.themoveee.com via `proxy.ts`. Per the brand table, this surface is
just **Moveee** (no "Connect" qualifier) — but note the live copy in code still reads
`"The Moveee — Culture Community"`, not the simpler current brand line; flag this as a DEV note
rather than silently correcting it, since the prompt must match what's actually deployed.

### Why this section exists
Mobile §2 (Splash & Onboarding, Login & Register) is a fully illustrated, paper-warm-background,
pill-button, icon-rich flow. The real web auth flow is the **opposite extreme**: five standalone
page files (`login/page.tsx`, `register/page.tsx`, `register/complete/page.tsx`,
`forgot-password/page.tsx`, `reset-password/page.tsx`), each with **zero shared layout chrome**
(no header/footer — their `layout.tsx` files are bare `robots: noindex` passthroughs), **zero
external stylesheet** (no `auth.css` exists anywhere in the repo), and **all styling as inline
`React.CSSProperties` objects** defined in a local `styles`/`s` const per file — no Tailwind
classes, no CSS Modules, no `className` usage at all in these five files. Every page renders the
same single centered card-on-white pattern. There's also no splash screen or onboarding carousel
on web — those are app-install-time mobile concepts with no web equivalent.

### Marketing copy (final — use verbatim, do not paraphrase)
- Eyebrow (all pages except the reset-password invalid-link state): `The Moveee — Culture Community`
- Login headline: `Sign in` (default) / `You're in!` (after `?registered=1`)
- Login subheadline: `Welcome back. Sign in to access your community and member perks.` /
  `Your account is ready. Sign in to access your dashboard and member perks.`
- Register headline: `Join the Community`
- Register subheadline: `Free to join. Enter a few details and we'll send you a verification link.`
- Check-email headline: `Check your inbox`
- Register/complete welcome: `Welcome, {displayName || username}!`
- Step 2 headline: `What moves you?`
- Step 3 headline: `Choose your membership` / `Upgrade to Moveee Pro`
- Forgot-password headline: `Reset your password`
- Reset-password headline: `Set a new password`

<!-- DEV: All five inline-style "design tokens" repeated nearly verbatim per file (since
there's no shared stylesheet) — treat these literal values as the de facto auth design system:
page bg #ffffff, card bg #fffdf8, card border 1px solid #e8e0d4, card radius 4px, heading
Georgia serif weight 300 26–28px, body font -apple-system/Segoe UI stack, eyebrow 11px
letter-spacing 0.2em uppercase color #7a6f5c, primary button bg #14110d / white text / radius 3
/ uppercase / letter-spacing 0.08–0.1em, secondary/outline button transparent bg + 1px solid
rgba(42,36,28,.25) or #d4cbbf border, input border #d4cbbf / radius 3 / padding 10px 14px,
error block color #c0392b / bg #fef2f2 / border rgba(192,57,43,.15), mute/footer text #7a6f5c,
inline link color #14110d underlined, required-asterisk color #c5491f (register/complete only).
This is a deliberately different (non-brand-token, Georgia-serif, no-Fraunces) visual language
from the rest of the web app — call this out as a real inconsistency, not a design choice to
replicate elsewhere. -->

<!-- DEV: Card maxWidth varies by page — login 440px, register 480px, register/complete 580px
(wider, to fit the 2-column tier grid in Step 3) — use the real widths, do not standardize them. -->

<!-- DEV: A dead duplicate file exists at apps/connect/app/login/login/page.tsx — a stale copy
missing the Google button, only reachable at the literal URL /login/login (nothing links to
it). Do not include it as a frame; it's flagged for cleanup, not part of the live UX. -->

<!-- DEV: Login page form fields are "Username or Email" + "Password" — not split into separate
email/username inputs the way mobile's design implies. Register page email placeholder is
literally "you@example.com", username placeholder "@handle". -->

<!-- DEV: Google Sign-In button on login: literal text "Continue with Google" preceded by a
plain text span containing the letter "G" — there is no Google logo SVG/image. It sits below
the credentials form, below a single "or" divider, below the Passkey button (order:
password form → divider → Passkey → Google) — visually identical outline-button chrome to the
Passkey button (both secondary/outline style; only "Sign in →" is the filled primary CTA).
Triggered via next-auth's `signIn("google", { callbackUrl })` — no client-side Google SDK call
on web (unlike mobile's native `@react-native-google-signin/google-signin` SDK). -->

<!-- DEV: register/complete is internally a 4-state machine (verify/about/interests/membership/
done) but the visible ProgressBar only covers 3 steps — labels exactly
["About You", "Your Interests", "Membership"], rendered as filled-black circular numbered nodes
(✓ when passed) joined by a track line with a black fill bar overlay; percent =
(currentStepIdx / 2) * 100 → 0%/50%/100%. The "verify" step (token validation spinner/error) and
terminal "done" state are NOT part of the visible step indicator — "verify" is skipped entirely
when arriving via ?upgrade=patron. -->

<!-- DEV: Step 2 interest grid renders from the real `INTERESTS` array in
lib/interest-mappings.ts (the 18-slug canonical taxonomy) as a 3-column emoji+label toggle grid
— requires >= 3 selections to continue, with a live counter: "{n} selected — {3-n} more needed"
or "{n} selected ✓". -->

<!-- DEV: Step 3 tier cards must show the real verbatim perk bullets — Citizen: "Access to free
member articles" / "Access to online events" / "GetMeLit & Culture Drop newsletters" /
"Community forum & Pulse". Moveee Pro: "Everything in Citizen" / "All patron-only articles" /
"10% shop discount + early access" / "Cash out credits · 100 credits/day · Pro badge". Pricing
is currency-aware (NGN or USD based on residence) with a "Switch" toggle and a Monthly/Annually
billing toggle showing a savings tag ("Save ₦9,000" or "Save $8"). -->

<!-- DEV: Forgot-password's success state is shown unconditionally regardless of whether the
account actually exists — anti-enumeration by design (verbatim code comment: "always show
success to avoid enumeration"). Copy must read "If an account exists for {email}, you'll
receive a reset link shortly..." not a confirmation that an account was found. -->

<!-- DEV: Reset-password's invalid-link state uses a shorter eyebrow, "The Moveee" — without the
"— Culture Community" suffix used everywhere else. This is a real inconsistency in the code,
not an error in this prompt — replicate it as-is. -->

<!-- DEV: PasskeyPrompt.tsx (packages/shared/components) is NOT mounted anywhere in apps/connect
— grep confirms its only web-package usage is the component file itself; it's actually
mobile-only in current usage (apps/mobile/src/components/ui/Overlays.tsx) despite living in the
shared web package. Do not include a passkey *setup modal* anywhere in this auth-flow frame set.
PasskeyBanner.tsx IS used on web, but only post-login on the /member dashboard (not part of the
auth flow itself) — see Frame 6 below for why it's included anyway, as a "where passkeys
actually appear on web" callout. -->

### PROMPT 17 — Authentication Flow (Desktop 1440px + Mobile 390px)

```
You are a senior web UX/UI designer recreating the REAL, currently-deployed Moveee Connect
(web.themoveee.com, Site B) authentication flow — not a redesign. These pages have no shared
header/footer chrome, no external stylesheet, and no brand-token CSS variables (--ink/--ochre/
--paper etc. are NOT used here) — every value below is a literal inline style pulled directly
from the live code. Recreate this fragmented, Georgia-serif, white-and-cream aesthetic exactly;
do not "fix" it into the Fraunces/DM-Sans brand system used elsewhere in the app.

Shared page chrome (every frame): full-viewport white (#ffffff) background, single centered
card: background #fffdf8, border 1px solid #e8e0d4, border-radius 4px, no shadow. Heading font
Georgia, serif, weight 300. Body font -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif.
No logo image, no illustration anywhere — purely typographic, with an eyebrow line
"The Moveee — Culture Community" (11px, letter-spacing 0.2em, uppercase, color #7a6f5c) standing
in for a wordmark.

FRAME 1 — LOGIN (card maxWidth 440px, padding 40px 40px 32px):
Eyebrow → h1 "Sign in" (Georgia 28px weight 300, color #14110d) → subheading "Welcome back. Sign
in to access your community and member perks." (15px, #7a6f5c) → form: field "Username or Email"
(label 11px #7a6f5c above input, input border 1px #d4cbbf, radius 3, padding 10px 14px) → field
"Password" (same style, type=password) → primary button "Sign in →" full width, bg #14110d,
white text, radius 3, uppercase, letter-spacing 0.08em, 13px → divider row: thin line — "or"
(12px #7a6f5c) — thin line → outline button "🔑 Sign in with Passkey" (transparent bg, 1px solid
rgba(42,36,28,.25) border, radius 3, full width) → outline button, 10px below, literal text span
"G" + "Continue with Google" (same outline chrome as Passkey button) → footer links, centered,
13px #7a6f5c: "Forgot your password?" then "New to the community? Create an account" (both
underlined ochre... actually #14110d per code — link color is #14110d with underline, not ochre).

FRAME 1B — LOGIN ERROR + LOADING (small inset variants on the same frame): error block below the
form, background #fef2f2, border 1px solid rgba(192,57,43,.15), text color #c0392b, copy
"Invalid username or password. Please try again." Loading variant: submit button text changes
to "Signing in…", passkey button to "🔑 Waiting for device…".

FRAME 2 — REGISTER, form view (card maxWidth 480px):
Eyebrow → h1 "Join the Community" → subheading "Free to join. Enter a few details and we'll send
you a verification link." → form: "Email *" (placeholder "you@example.com", asterisk color
#c5491f) → "Username *" (placeholder "@handle") → "Password *" (hint below input, 12px #7a6f5c:
"At least 8 characters") → primary button "Create account →" → footer: "Already have an
account? Sign in" then "Want Moveee Pro? Upgrade after joining".

FRAME 2B — REGISTER, check-email view (same card, content swapped, text-align center): large "✉"
glyph centered → eyebrow "One more step" → h1 "Check your inbox" → "We sent a verification link
to" then bold dynamic "{email}" → body copy "Click the link in that email to verify your address
and continue setting up your profile. The link expires in 24 hours." → text button (not a link)
"Wrong address? Go back" — resets to form view client-side with no navigation.

FRAME 3 — REGISTER/COMPLETE — Step 1 "About You" (card maxWidth 580px):
Eyebrow → h1 dynamic "Welcome, {displayName}!" → ProgressBar component: 3 circular nodes labeled
"About You" / "Your Interests" / "Membership", current/passed nodes filled black (#14110d),
passed nodes show "✓", connected by a track line with a black progress-fill overlay at 0% width
for this step → step heading "A little about you" → 2-col row: "Date of Birth *" (date input) |
"Country of Residence *" (searchable select, placeholder "Search countries…") → 2-col row:
"City *" (searchable select) | "Occupation (optional)" (placeholder "e.g. Filmmaker, Designer")
→ hint text "You can add your bio, disciplines, and social links from profile settings after
joining." → nav row: blank — "Continue →" (no Back button on this first step).

FRAME 4 — REGISTER/COMPLETE — Step 2 "Your Interests": same chrome, ProgressBar at 50% fill →
h1 "What moves you?" → step heading "Pick your interests" → sub-copy "Select at least 3. This
shapes your feed and connects you with the right community." → 3-column grid of toggle buttons,
one per interest (emoji + label, from the real 18-slug interest taxonomy), active state filled
→ dynamic counter "{n} selected — {3-n} more needed" or "{n} selected ✓" → nav row: "← Back" —
"Continue →" (disabled until 3+ selected).

FRAME 5 — REGISTER/COMPLETE — Step 3 "Membership": ProgressBar at 100% fill → h1 "Choose your
membership" → step heading "Your membership tier" → billing toggle: "Monthly" | "Annually" pill
switch with a savings tag ("Save ₦9,000" or "Save $8") → 2-column tier card grid: Citizen card
(label "Citizen", price "Free", 4 verbatim perk bullets) and Moveee Pro card (label "Moveee Pro",
price "₦4,500"/"$4" + "/ mo" or annual equivalent, 4 verbatim perk bullets) → currency notice
"Pricing based on residence: NGN." + "Switch" button → nav row: "← Back" — "Continue to payment
→" (patron) or "Complete registration →" (citizen).

FRAME 6 — FORGOT PASSWORD (card maxWidth 440px): pre-submit — eyebrow → h1 "Reset your password"
→ body "Enter the email address on your account and we'll send you a link to set a new
password." → field "Email address" (placeholder "you@example.com") → primary button "Send reset
link →" → footer "Remember your password? Sign in". Post-submit (always shown regardless of
whether the account exists — anti-enumeration): body "If an account exists for **{email}**,
you'll receive a reset link shortly. Check your spam folder if you don't see it within a few
minutes." → "Back to sign in" link.

FRAME 7 — RESET PASSWORD: main state — eyebrow → h1 "Set a new password" → field "New password"
(hint "At least 8 characters") → field "Confirm password" → primary button "Set new password →".
Success state: green (#27ae60) message replacing the form, auto-redirects to /login after 2.5s.
Invalid-link state (missing query params): shorter eyebrow "The Moveee" (no "— Culture
Community" suffix) → h1 "Invalid link" → body "This password-reset link is missing required
information. Please request a new one." → "Back to home" link.

FRAME 8 — PASSKEY BANNER (post-login context callout, NOT part of the auth flow itself — shown
only on /member for logged-in users without a passkey, included here to clarify where passkeys
actually surface on web): pill banner, background rgba(179,130,56,.08), border
rgba(179,130,56,.25), radius 6px, "🔑" icon → headline "Set up a Passkey to unlock Credits" →
conditional body: "You have {N} credits waiting — they'll be released once you add a passkey."
or "Passkeys are required to spend credits and redeem partner perks. Takes 30 seconds." → CTA
"Set up Passkey →" (ochre #b38238 fill, white text) → "Dismiss" outline button.

MOBILE COMPANION (390px, one per frame above): identical content, card becomes full-width with
24px side margins instead of a fixed maxWidth, all other inline styles unchanged — there is no
separate mobile-specific layout in the real code (these pages are not responsive-redesigned,
just naturally narrow-friendly due to the single-column card).

CONSTRAINTS:
- Do not use Fraunces, DM Sans, ochre #C5491F, or paper-warm #F3ECE0 anywhere in this section —
  this flow runs on a completely different, Georgia-serif, inline-style visual language with no
  shared design tokens. This is a real inconsistency in the codebase, not a mistake to fix.
- Do not add a splash screen or onboarding carousel — there is no web equivalent.
- Do not show a passkey *setup* modal inside the login/register flow — PasskeyPrompt.tsx is not
  mounted anywhere on web today, only on mobile.
- The Google button must read literally "G" + "Continue with Google" — no Google logo asset.
- Forgot-password's success copy must never confirm or deny account existence.
```

Output 8 frames (desktop) + 8 mobile companions: Frame 1 (Login + error/loading states),
Frame 2 (Register form + check-email), Frame 3 (Register/Complete Step 1), Frame 4
(Register/Complete Step 2), Frame 5 (Register/Complete Step 3), Frame 6 (Forgot Password),
Frame 7 (Reset Password), Frame 8 (Passkey Banner callout).

---

## 18. OVERLAYS & MICRO-INTERACTIONS — WEB (Site B, web.themoveee.com)

### Brand architecture
All real components are in `packages/shared/components/pulse/` (FeedCard.tsx) and
`apps/connect/app/connect/perks/` — this is exclusively a Site B (Moveee) surface.

### Why this section exists
Mobile §13 shows 9 distinct, purpose-built overlay primitives — bottom sheets, a confirm
dialog, a toast system with 4 colour-coded variants, a context menu. The real web app has
**no toast system, no context menu, and no confirm-before-signing-out step at all** — most of
mobile's "overlay" patterns collapse on web into inline state swaps local to whatever component
triggered them. Only two of the nine actually get a real overlay treatment on web (the perk
redeem confirm modal, and the image lightbox); the rest are either inline footer-row expansions,
persistent (not first-time-only) sidebar nudge cards, or simply don't exist. This section
documents that real, much flatter reality rather than inventing missing primitives.

### Marketing copy (final — use verbatim, do not paraphrase)
- Report confirm row: `Report as:` / pill labels `spam`, `harassment`, `inappropriate`
- Report sent: `Reported — thank you.`
- Report error: `Couldn't send report.`
- Redeem confirm title: `Confirm redemption`
- Redeem confirm body: `` Spend **{credit_cost} credits** for "{title}"? `` then
  `Your coupon will expire in {expiry_days} days. Your balance after: **{balance} credits**.`
- Redeem success: `Perk redeemed!` / `Show this QR code at the partner venue.` /
  `New balance: {n} credits`
- Passkey step-up required: `Passkey required to redeem perks.`
- Passkey step-up waiting: `⬡ Waiting for your device biometrics…`
- No-interests nudge: `Personalise your feed` / `pick your interests for a For You view.` /
  `Set interests →`
- Has-interests nudge: `Personalised feed ready` / `Switch to For You to see content ranked by
  your interests.` / `For You →`

<!-- DEV: There is no template-picker bottom sheet on web — SubmitPost.tsx's template choice is
a persistent horizontal pill row (`.composer-template-bar`) always visible above the composer
fields, not a separate picker step: 📝 Update · 💎 Gem · 💬 Take · 🍽️ Food · 🎨 Showcase · 📊 Poll
· 🗺️ Route · 📅 Event · ✦ Quote. Clicking a pill swaps the form fields inline in the same card.
Do not draw this as a modal/sheet. -->

<!-- DEV: Report is an inline footer-row state swap on the community card, not a modal — states
are idle (⚑ flag icon, color #c8bfb0) → confirm (text "Report as:" + 3 pill buttons + ✕ cancel,
pill style bg #fef2f2 / border rgba(192,57,43,.2) / text #c0392b) → sent/error (plain text, no
dismiss). No backdrop. -->

<!-- DEV: Confirm-redeem IS a real centered modal — `.perk-modal-backdrop` (rgba(20,17,13,.65),
z-index 1000) → `.perk-modal` (bg var(--paper), maxWidth 480px). Note: perks.css defines a more
elaborate `.perk-modal-confirm-btn`/`.perk-modal-cancel-btn` style that the live JSX does NOT
actually use — the wired buttons are the simpler `.perk-card-btn`/`.perk-card-btn--outline`
classes. Flag this CSS/JSX mismatch in the prompt rather than picking whichever looks nicer. -->

<!-- DEV: Sign-out has NO confirmation step on web — `Header.tsx`'s dropdown "Sign out" button
calls `signOut({ callbackUrl: "/login" })` directly on click, no dialog, no window.confirm(). Do
not draw a sign-out confirm dialog frame as if it exists — show the dropdown item firing
immediately instead. -->

<!-- DEV: PasskeyPrompt.tsx is not mounted anywhere in apps/connect (confirmed via grep) — the
only passkey UI actually live on web is the inline step-up banner inside the perk redeem flow
(item above) and PasskeyManager inside /member/settings/security (separate from this overlay
set). Do not draw a passkey bottom sheet. -->

<!-- DEV: Image lightbox DOES exist and is a real fullscreen overlay — `ImageLightbox` inline in
FeedCard.tsx, `position: fixed; inset: 0; zIndex: 9999; background: rgba(0,0,0,.88)`, Escape key
+ backdrop click both close, body-scroll-locked while open, circular 36×36px ✕ close button
(rgba(255,255,255,.12) bg) top-right. No page-counter ("2 / 5") and no dot-pagination like
mobile — it shows exactly one image at a time, triggered from a gallery thumbnail strip or a
single hero image, never a swipeable multi-image viewer. -->

<!-- DEV: There is NO toast system anywhere in the web codebase (no Toast.tsx, no alert()) —
every success/error message is an inline, persistent element local to the component that
triggered it, not a floating auto-dismissing notification. Composer success swaps the whole
composer card content to a message box (bg #f3eef8, border #e0d4f0, italic Fraunces, color
#7a4da0); composer error renders `.composer-error` text below the action bar with no
auto-dismiss; perk redeem success replaces the whole grid section with a full success block
(QR code, balance, two CTA buttons) rather than a toast; perk redeem error renders inline inside
the still-open confirm modal. Do not draw 4 floating toast variants — draw these 4 real inline
states instead. -->

<!-- DEV: There is no first-time-only "For You" explainer sheet — it's two ALWAYS-conditionally-
shown (not dismiss-once) nudge cards in PulseFeed.tsx: a no-interests banner above the composer
(bg #fdf5e6, border #e8d8b0) and a has-interests-not-yet-toggled sidebar card (bg
rgba(179,130,56,.06), border rgba(179,130,56,.2)). Both reappear on every page load while their
condition holds — there's no localStorage dismiss flag the way mobile's sheet has. -->

<!-- DEV: There is no long-press/right-click context menu on web at all. The four mobile menu
actions (copy link / save / share / report) are split across three always-visible inline
controls instead: a share button inside ReactionBar (navigator.share() or clipboard copy with a
2s "Copied!" title flip — no "Save" action exists anywhere for community posts), a comment-count
button (opens CommunityDetailModal, not a menu), and the report flag described above. Do not
draw a grouped floating menu. -->

### PROMPT 18 — Overlay & Inline-State Patterns (Desktop 1440px)

```
You are a senior web UX/UI designer documenting the REAL overlay and micro-interaction patterns
in the Moveee Connect web app (web.themoveee.com) — not redesigning them. Unlike a typical
design system, this app has no toast primitive, no context menu, and no confirm-before-sign-out
step; most "overlay" moments are inline state swaps inside the triggering component. Show each
pattern as it actually renders today, on a 1440px canvas with the real PulseFeed background
dimmed behind modal frames only (frames 3 and 6 below — every other frame is inline, not an
overlay, so show it in its natural page context, not dimmed).

FRAME 1 — TEMPLATE PILL BAR (inline, not a picker sheet): horizontal row of 9 pill buttons above
the composer textarea — "📝 Update" "💎 Gem" "💬 Take" "🍽️ Food" "🎨 Showcase" "📊 Poll"
"🗺️ Route" "📅 Event" "✦ Quote" — active pill has a filled/bordered state, inactive pills plain
outline. Show the composer fields directly below changing when a different pill is active (two
sub-states side by side: "Update" active vs "Poll" active).

FRAME 2 — REPORT (inline footer-row state swap on a community FeedCard, 3 sub-states in a row):
(a) idle — small "⚑" flag icon, color #c8bfb0, in the card footer action row; (b) confirm — flag
replaced by text "Report as:" (color #7a6f5c) + three pill buttons "spam" / "harassment" /
"inappropriate" (bg #fef2f2, border 1px solid rgba(192,57,43,.2), color #c0392b, radius 3) + a
"✕" cancel; (c) sent — plain text "Reported — thank you." (color #7a6f5c). No backdrop on any
of the three.

FRAME 3 — CONFIRM REDEEM MODAL (real centered overlay): dimmed backdrop rgba(20,17,13,.65) full
viewport → centered card, background var(--paper), maxWidth 480px, padding 36px 32px 28px, "✕"
close top-right → title "Confirm redemption" → body `Spend **150 credits** for "10% off at Bisi
Ceramics"?` → second line "Your coupon will expire in 30 days. Your balance after: **1,090
credits**." → two buttons "Cancel" (outline) / "Confirm" (filled, → "Processing…" loading state).
Include a second small inline variant above the modal trigger: a passkey step-up banner reading
"Passkey required to redeem perks." with link styling, and its waiting state "⬡ Waiting for your
device biometrics…" — these gate the modal from ever opening if no passkey exists.

FRAME 4 — SIGN OUT (dropdown menu, no confirm step): show the Header.tsx avatar dropdown
(`role="menu"`) with rows "My Dashboard", "Wallet", "Settings", divider, "Sign out" (danger red
text) — annotate that clicking "Sign out" fires `signOut()` immediately, no dialog appears.

FRAME 5 — IMAGE LIGHTBOX (real fullscreen overlay): full-viewport black-ish overlay
rgba(0,0,0,.88) → centered image (maxHeight 90vh, objectFit contain, radius 4px, shadow) → small
circular "✕" close button (36×36px, bg rgba(255,255,255,.12)) top-right inset 1rem. No image
counter, no pagination dots — single image only. Show the trigger state too: a 200×200px
thumbnail strip (gallery) with cursor "zoom-in" feeding into this overlay.

FRAME 6 — INLINE SUCCESS/ERROR STATES (4 sub-frames, none are toasts):
(a) Composer success — whole composer card content replaced by a message box, bg #f3eef8,
border 1px solid #e0d4f0, italic Fraunces text, color #7a4da0, e.g. "Quote submitted — it will
appear after review."
(b) Composer error — plain red-toned text below the action bar, no card swap, no auto-dismiss.
(c) Perk redeem success — full content-area swap: title "Perk redeemed!", body "Show this QR
code at the partner venue.", QR code image, expiry date line, "New balance: {n} credits", two
buttons "Browse more perks" / "My Coupons →".
(d) Perk redeem error — small red error text rendered inside the still-open confirm modal from
Frame 3, not a separate overlay.

FRAME 7 — "FOR YOU" NUDGE CARDS (2 sub-states, always-conditional, never first-time-only):
(a) No-interests banner above the composer: bg #fdf5e6, border 1px solid #e8d8b0, copy
"Personalise your feed — pick your interests for a For You view." with link "Set interests →".
(b) Has-interests sidebar card: bg rgba(179,130,56,.06), border 1px solid rgba(179,130,56,.2),
title "Personalised feed ready", body "Switch to For You to see content ranked by your
interests.", ochre-filled button "For You →".

FRAME 8 — SPLIT CONTEXT ACTIONS (no grouped menu exists — show the 3 real always-visible
controls side by side on a card footer instead of a long-press menu): a share icon inside the
reaction bar (tooltip flips to "Copied!" for 2s after click), a comment-count button (opens the
full detail drawer, not a menu), and the report flag from Frame 2. Annotate clearly: "No single
grouped context menu exists — these three controls together cover what mobile's one menu does,
minus a Save action which has no web equivalent."

CONSTRAINTS:
- Do not invent a toast/snackbar component — none exists on web; use the 4 real inline
  success/error patterns in Frame 6 instead.
- Do not invent a long-press context menu — use the 3 split inline controls in Frame 8.
- Do not draw a sign-out confirmation dialog — it doesn't exist; show the dropdown firing
  immediately instead.
- Do not draw a passkey bottom sheet — PasskeyPrompt.tsx is unmounted on web; only the inline
  step-up banner inside the perks flow is real.
- Frame 3 and Frame 5 are the only two patterns that get a real dimmed/fullscreen overlay
  treatment — every other frame must be shown inline, in its natural page context.
```

Output 8 frames, each containing its labeled sub-states as described above.

---

## 19. DARK MODE & LOADING STATES — WEB (Site B, web.themoveee.com)

### Brand architecture
Dark mode is Site B-only — `apps/site/app/globals.css` (Site A) has no `[data-theme="dark"]`
block at all. Site A does have its own `app/loading.tsx`, but no dark-mode tokens to pair with
it, so it's out of scope for the dark-mode half of this section.

### Why this section exists
Mobile §14A documents a fully bespoke, brighter-than-light-mode dark palette applied uniformly
across 8 screens with explicit per-badge dark adjustments. Web's real dark mode is a genuine,
working CSS-variable system (`[data-theme="dark"]` in `apps/connect/app/globals.css`, toggled via
`ThemeContext.tsx`, persisted to `localStorage["moveee-theme"]`) — but it is **not** uniformly
applied: `FeedCard.tsx`, the single highest-traffic component on the site, hardcodes hex colors
for nearly all of its badge/card styling and simply does not adapt when the user switches themes.
Mobile §14B documents 9 polished skeleton-loading frames with a named shimmer animation; web has
**no shared skeleton component at all** — most routes show a plain "Loading…" text fallback via
Next.js's `loading.tsx` convention, and only two routes (`/pulse`, `/community`) have hand-rolled,
copy-pasted shimmer skeletons. This section documents both gaps as real, code-grounded findings
rather than papering over them with an idealized design.

### Marketing copy (final — use verbatim, do not paraphrase)
- Feed loading fallback: `Loading feed…`
- (No other user-facing loading copy exists beyond this single string — the shimmer skeletons on
  `/pulse` and `/community` show no text at all, just animated bars.)

<!-- DEV: Use the REAL dark-mode token table below — do not invent brighter mobile-style values.
Light → Dark: --paper #ffffff → #242018; --paper-warm #f3ece0 → #1a1612; --paper-deep #f2f2f2 →
#2d2820; --ink #14110d → #f3ece0; --ink-soft #3a342b → #d4c9b8; --mute #7a6f5c → #9e9288; --rule
rgba(20,17,13,.10) → rgba(61,53,48,.6); --rule-dark rgba(20,17,13,.15) → #3d3530; --ochre
#c5491f → #d4603a; --ochre-deep #8a2d10 → #a83f20; --gold #b38238 → #c9963f; --moss #3d4a2a
(unchanged); --shadow-card 0 1px 3px rgba(20,17,13,.08) → 0 1px 3px rgba(0,0,0,.4); --shadow-modal
0 20px 60px rgba(20,17,13,.18) → 0 20px 60px rgba(0,0,0,.55); --shadow-fab 0 4px 12px
rgba(197,73,31,.35) → 0 4px 12px rgba(212,96,58,.4); --glow-gold ring color rgba(179,130,56,.55)
→ rgba(201,150,63,.45). Radius tokens are unaffected by theme. -->

<!-- DEV: The toggle is a plain binary light/dark switch — there is no in-app "system" option in
the UI (system preference is only consulted ONCE, via an inline FOUC-prevention boot script in
layout.tsx's <head>, on a visitor's very first visit with no stored localStorage value; every
subsequent visit uses whatever the explicit toggle last set). The toggle button itself lives in
Header.tsx — a plain <button> swapping sun/moon SVG icons, no separate ThemeToggle.tsx
component, no cookie, localStorage key "moveee-theme". -->

<!-- DEV: FeedCard.tsx does NOT adapt to dark mode — its TYPE_BADGE color map and card background
are hardcoded hex (e.g. card bg "#fff", border "#e8e2d8", pulse badge bg "#fef3e2"/color
"#b38238", happening badge bg "#eeedfe"/color "#3c3489", Pro glow boxShadow literal
"#b38238") rather than var(--paper)/var(--ochre) etc. Any dark-mode mockup of a feed card must
show this AS A BUG — i.e. draw the feed card still showing light-mode colors even while the rest
of the page (header, background) is in dark mode — not as a polished, fully-adapted dark card
the way mobile's CARD A–D look. Header.tsx and member/page.tsx, by contrast, do correctly use
var(--ink)/var(--mute) for their own inline styles, so the header chrome and surrounding
dashboard text adapt correctly even while feed cards don't. -->

<!-- DEV: There is no shared Skeleton component anywhere in apps/connect, apps/site, or
packages/shared (mobile has one, web doesn't). Most routes' loading.tsx is plain text, e.g.
feed/loading.tsx renders only `<div className="mco-feed-loading">Loading feed…</div>` inside a
`<section>` — no shimmer, no shaped placeholders at all. Only `/pulse` and `/community` have
real shimmer skeletons, and even those are copy-pasted (each route locally redefines an
identical `shimmer` style object and `@keyframes shimmer` rather than sharing one), use
hardcoded hex (#ffffff, #e8e2d8 — not dark-mode aware either), and differ in content: pulse's
skeleton is a 3-column grid (190px sidebar | 1fr feed | 220px sidebar) of fake bars + 8 fake post
rows with occasional 90×90px thumbnail blocks; community's skeleton is just one fake post (avatar
circle + header/body bars) plus 3 fake comment rows. Do not invent skeleton coverage for routes
that don't have it (dashboard, events, shop, notifications, public profile, games — all either
have no loading.tsx or a plain-text one not covered by this report; draw only what's confirmed). -->

<!-- DEV: There is no root-level or full-app splash/initial-loading screen on Site B at all —
apps/connect/app/loading.tsx does not exist, and apps/connect/app/layout.tsx has no Suspense
fallback or splash UI beyond the dark-mode FOUC-prevention script (which only sets a data
attribute, renders nothing visible). Do not draw a Moveee-branded splash/spinner screen for Site
B — that pattern is mobile-only (Expo's native splash config). Site A does have its own root
app/loading.tsx, but it carries no dark-mode pairing and is out of scope here. -->

### PROMPT 19 — Dark Mode & Loading States (Desktop 1440px)

```
You are a senior web UX/UI designer documenting the REAL dark-mode and loading-state behavior of
Moveee Connect (web.themoveee.com) — including its real gaps, not an idealized fully-polished
version. Canvas: 1440px desktop frames.

═══════════════════════════════════════
DARK MODE TOKEN TABLE (use exact values)
═══════════════════════════════════════
--paper: #ffffff → #242018      --paper-warm: #f3ece0 → #1a1612
--paper-deep: #f2f2f2 → #2d2820 --ink: #14110d → #f3ece0
--ink-soft: #3a342b → #d4c9b8   --mute: #7a6f5c → #9e9288
--rule: rgba(20,17,13,.10) → rgba(61,53,48,.6)
--rule-dark: rgba(20,17,13,.15) → #3d3530
--ochre: #c5491f → #d4603a      --ochre-deep: #8a2d10 → #a83f20
--gold: #b38238 → #c9963f       --moss: #3d4a2a (unchanged)
--shadow-card: 0 1px 3px rgba(20,17,13,.08) → 0 1px 3px rgba(0,0,0,.4)
--shadow-modal: 0 20px 60px rgba(20,17,13,.18) → 0 20px 60px rgba(0,0,0,.55)
--glow-gold ring: rgba(179,130,56,.55) → rgba(201,150,63,.45)

FRAME 1 — THEME TOGGLE (3 sub-states): the Header.tsx sun/moon icon button in its light-mode
state (sun icon, color var(--ink) resolving to #14110d), dark-mode state (moon icon, color
var(--ink) resolving to #f3ece0), and an annotation box explaining the binary-only toggle (no
in-app "system" option) plus the once-only FOUC boot-script behavior described above.

FRAME 2 — CONNECT FEED, DARK MODE (the bug frame): full feed page in dark mode — header bar
correctly dark (bg var(--paper-deep) → #2d2820, text var(--ink) → #f3ece0), page background
correctly dark (var(--paper-warm) → #1a1612), sidebar nudge cards correctly dark — BUT the
community/editorial feed cards themselves remain rendered in their LIGHT-mode hardcoded colors
(white #fff card bg, light badge colors like #fef3e2/#eeedfe) sitting awkwardly inside the dark
page. Add a callout arrow + label: "FeedCard.tsx hardcodes hex colors — does not adapt to dark
mode (real bug, not a design choice)."

FRAME 3 — MEMBER DASHBOARD / HEADER, DARK MODE (the correct frame, for contrast): show
Header.tsx and member/page.tsx rendering correctly in dark mode — these two use var(--ink)/
var(--mute) properly. Label: "Correctly dark-mode-aware, unlike Frame 2."

FRAME 4 — LOADING STATES (4 sub-frames, real coverage only):
(a) Feed loading (`/feed`) — plain text only: a bare line of text "Loading feed…" centered in an
otherwise empty content area, no shapes, no shimmer.
(b) Pulse loading (`/pulse`) — real shimmer skeleton: 3-column layout (190px sidebar bars | 1fr
column of 8 fake post-row bars, some with 90×90px thumbnail blocks | 220px sidebar bars), all
bars using the shimmer gradient `linear-gradient(90deg, #f0ece6 25%, #e8e2da 50%, #f0ece6 75%)`
animating via `background-position` sweep, 1.4s ease-in-out infinite loop, radius 2px.
(c) Community loading (`/community`) — same shimmer technique, much sparser: one fake post (avatar
circle + 2 header bars + 3 body bars) plus 3 fake comment rows below.
(d) Annotation panel: "No shared Skeleton component exists — each route copy-pastes its own
shimmer style object. Hardcoded hex, not dark-mode aware. Most other routes (dashboard, events,
shop, notifications, public profile, games) have either no loading.tsx or a plain-text-only one —
do not assume skeleton coverage beyond pulse and community."

FRAME 5 — NO SPLASH SCREEN (negative-space frame): show a blank/empty browser viewport with a
dashed-border callout box reading "apps/connect has no root loading.tsx and no splash screen —
this pattern does not exist on Site B. (Site A has its own app/loading.tsx, out of scope here.)"

CONSTRAINTS:
- Use the real, less-vivid token values above — do not brighten them to match mobile's
  intentionally-bolder dark palette.
- Frame 2 must show the FeedCard dark-mode bug explicitly, as a flaw to document, not fix.
- Do not draw skeleton coverage for any route beyond /pulse and /feed and /community.
- Do not draw a branded splash/spinner screen for Site B.
```

Output 5 frames: Frame 1 (Theme Toggle), Frame 2 (Feed dark mode — adaptation bug), Frame 3
(Dashboard/Header dark mode — correct), Frame 4 (Loading States, 4 sub-frames), Frame 5 (No
splash screen — negative-space callout).

---

## 20. DIRECTORY ENTRY DETAIL PAGE — WEB (Site B, web.themoveee.com/directory/[slug])

### Brand architecture
Site B (web.themoveee.com). Real route: `apps/connect/app/directory/[slug]/page.tsx`, styled by
`apps/connect/app/directory.css` (shared with the `/directory` listing page and `/directory/submit`).

### Why this section exists
Mobile §11 has **PROMPT 11B — Directory Entry Detail Page (All 11 Entry Types)**: a single-screen
app-card shell (nav header → 220px hero with type badge → entry header card → body card → infobox
card → horizontal "Works" rail → horizontal community-reviews rail → horizontal upcoming-events
rail → horizontal related-entries chips → improve CTA card) reused across all 11 entry types
(person/place/food/book/film/genre/movement/artwork/concept/fashion/tv-series), each just swapping
its per-type infobox fields and badge color. Web's real equivalent at `/directory/[slug]` is an
entirely different page architecture — **not** a stack of cards, but a sticky three-column
Wikipedia-style layout (220px related-entries sidebar | flexible-width article column | 260px
sticky infobox sidebar) with a serif editorial title treatment, no hero image bleed (the photo
lives inside the infobox card instead), and per-type infobox field tables defined directly in the
page component (`INFOBOX_DEFS`) rather than as a generic key–value list. This is distinct from
**web §15**'s `DirectoryDetailModal.tsx`, which is the off-canvas drawer shown when a directory
card is clicked *from inside a feed* — that drawer is a lightweight preview; this page is the full
standalone destination it links to ("View full entry →").

### Marketing copy (final — use verbatim, do not paraphrase)
- Back link: **"← Discover"**
- Sidebar heading pattern: **"Related {TypeLabel}s"** (e.g. "Related Persons", "Related Places")
- Sidebar empty state: **"No related entries yet."**
- Sidebar footer link: **"See all {TypeLabel}s →"**
- Improve panel eyebrow: **"★ Community Wiki"**
- Improve panel body: **"Know more? Help improve this entry."**
- Improve panel CTA: **"Improve →"**
- No-content fallback (gated-off or empty body): **"Full article coming soon. Know this subject? Help us build it."**
- Date line: **"Added to directory {D Month YYYY}"**
- Topics label: **"Topics"**
- Selected works heading: **"Selected Works"**
- Community section heading: **"Community Reviews & Takes"**
- Community post "read more": **"Read full post →"**
- Upcoming events section heading: **"Upcoming Events"**
- Happening pill on linked events: **"Happening"**
- Infobox name-plate, "Type", "Category", "Added" rows: as rendered, verbatim labels
- External link infobox row labels: **"Website"**, **"Instagram"**, **"X / Twitter"**

<!-- DEV 1: Three-column CSS grid (`.dir-wiki-layout`, `grid-template-columns: 220px 1fr 260px`,
gap 36px, max-width 1360px). Both side columns are `position: sticky; top: 80px`. Below 860px the
grid collapses to a single column and CSS `order` re-stacks it as infobox → article → related
(`.dir-wiki-right { order: -1 }`, `.dir-wiki-main { order: 0 }`, `.dir-wiki-left { order: 1 }`) —
i.e. on mobile the infobox card appears FIRST, above the title, not last. -->
<!-- DEV 2: Color tokens are page-local CSS vars, NOT the shared `--ink`/`--paper`/etc. used
elsewhere in apps/connect: `--dir-ink:#14110d`, `--dir-paper:#ffffff`, `--dir-ochre:#b38238`,
`--dir-muted:rgba(20,17,13,.55)`, `--dir-border:rgba(20,17,13,.12)`, `--dir-dark-bg:#14110d`,
`--dir-dark-ink:#f5f0e8`. Sidebar/infobox card fill is a literal `#faf7f2` (not a var), and the
infobox name-plate strip is a literal `#f3ede0`. -->
<!-- DEV 3: There is NO full-bleed hero image and no per-type badge color table on this page —
that treatment exists only in the off-canvas drawer (web §15) and mobile's PROMPT 11B, not here.
The only image is inside the infobox card, 4:3 aspect ratio, at the very top of the sticky right
sidebar, above a centered serif name-plate row repeating the title. -->
<!-- DEV 4: Title is NOT a fixed size — `clamp(28px, 5vw, 48px)` Fraunces weight 300 (`.dir-single-title`)
for the real single-column legacy class, but the wiki layout's actual title class
(`.dir-wiki-title`) clamps `28px–46px` at weight 300 — both are noticeably lighter-weight than
mobile's bold 22px serif title. Eyebrow type label above the title (`.dir-single-type`) is
JetBrains Mono 9px uppercase ochre — there is no colored pill/badge here, just plain mono text. -->
<!-- DEV 5: Per-type infobox fields are a hardcoded `INFOBOX_DEFS` map keyed by the 11 type slugs
— field sets differ meaningfully from mobile's per-type INFOBOX in PROMPT 11B (e.g. web's "person"
fields are Born/Died/Nationality/Occupation/Known For/Origin/Active Years/Labels-Affiliations/
Education/Notable Awards — there is no "Also known as" row on web). Only fields with a non-empty
value in the `infobox` JSON actually render a row — never pad with empty/placeholder rows. A
divider (`.dir-wiki-infobox-divider`, 2px border-top) separates the fixed Type/Category/Added rows
from the per-type fields, and a second one separates per-type fields from the external-links block
(Website/Instagram/X) — both dividers are conditional, only rendered when there's content on both
sides. -->
<!-- DEV 6: Content gating reuses the existing `ContentGate` component (`getAccessLevel`/
`canViewContent` from `lib/access.ts`) — if the entry's access level is member-only or patron-only
and the viewer doesn't qualify, the ENTIRE body — not just a blurred snippet — is replaced by
ContentGate's own upsell UI; everything else on the page (infobox, related sidebar, community
section, events) still renders normally regardless of gating. -->
<!-- DEV 7: The "Selected Works" grid (`.dir-wiki-works-grid`, `repeat(auto-fill, minmax(160px,1fr))`,
4:3 image cards) only renders if `entry.selectedWorks` is non-empty — there is no horizontal-scroll
rail like mobile's "Works" row; it's a wrapping grid. It is also skipped entirely for types with
no portfolio content, same restriction as mobile (Concept/Genre/Movement get no Works section). -->
<!-- DEV 8: "Community Reviews & Takes" is REAL community data, not a mock rail — it's populated by
`getDirectoryPosts(entry.databaseId)`, the same linked-community-post system used by `SubmitPost.tsx`'s
DirectorySearch integration (Hidden Gem / Food Review / Book Review templates link a post to a
directory entry via `linked_directory_id`). It only renders when `communitySummary.total_posts > 0`.
Each card shows avatar, author name, a "Pro" badge only if `author.tier === "patron"`, relative date,
an optional per-post star rating (only for templates that have one, e.g. Food/Book review), full post
content as plain text (NOT truncated to 3 lines like mobile), and reaction emoji counts at the
bottom — there is no "Write a review" CTA button on web (that's mobile-only; web reviews come from
the regular community composer flow, not a dedicated review form on this page). -->
<!-- DEV 9: "Upcoming Events" only shows events with `organiser_directory_id` pointing at this entry
(`getDirectoryEvents(entry.databaseId)`) — a flat vertical list of cards (not mobile's horizontal
date-block rows), each with a 72×72px thumbnail, a literal "Happening" pill (bg #eeedfe, text
#3c3489 — these two hex values are inline JSX styles, not CSS classes, an inconsistency worth
preserving as-is), formatted date range, title, and venue/city/admission line. There is no event
type beyond "Happening" rendered here — this only surfaces editorial/community events that resolved
an organiser link, not a generic "browse more events" CTA. -->
<!-- DEV 10: Related entries (left sidebar) are NOT a simple taxonomy query — they're computed by
fetching up to 200 directory entries and scoring each: +2 for matching type, +1 per shared interest
tag, sorted descending, top 5 kept. Each related-entry row is a 36×36px thumbnail + title, no type
emoji/icon at all (unlike mobile's emoji-prefixed related chips). The sidebar's "See all →" link
points to `/discover?type={slug}`, NOT a `/directory?type=` listing — Discover (per CLAUDE.md) is
the dedicated paginated browse surface, and this page deliberately routes there instead of the
older `/directory` grid. -->
<!-- DEV 11: The "Improve" CTA panel is visually distinct from every other card on the page — it
uses the literal dark `--dir-dark-bg`/`--dir-dark-ink` pair (near-black bg, warm-white text),
making it the one inverted-color block in an otherwise all-light page, and its body copy is
rendered at low opacity (`rgba(245,240,232,.65)`). It links to `/directory/submit?improve={slug}`,
the SAME submission form used to create new entries, just with a query param flag — there is no
separate "edit" form. -->

### PROMPT 20 — Directory Entry Detail Page (Desktop 1440px + Mobile Companion 390px)

```
You are a senior web UX/UI designer documenting the REAL `/directory/[slug]` page on Moveee
Connect (web.themoveee.com) — a sticky three-column Wikipedia-style layout, NOT a card-stack
app shell. Ground every measurement and color in the spec below; do not invent a hero image or
per-type badge colors, neither exists on this page.

═══════════════════════════════════
COLOR TOKENS (page-local, exact hex)
═══════════════════════════════════
--dir-ink: #14110d          --dir-paper: #ffffff
--dir-ochre: #b38238        --dir-muted: rgba(20,17,13,.55)
--dir-border: rgba(20,17,13,.12)
--dir-dark-bg: #14110d      --dir-dark-ink: #f5f0e8
Sidebar/infobox card fill (literal, not a var): #faf7f2
Infobox name-plate strip fill (literal): #f3ede0
Fonts: Fraunces (serif, weight 300 for titles), DM Sans (body — implicit, inherited from
app-wide sans stack), JetBrains Mono (all-caps eyebrow labels, 9–10px, letter-spacing .12–.16em).

FRAME 1 — DESKTOP LAYOUT SHELL (1440px, entry type: "Person" — Fela Kuti example):
Topbar (max-width 1360px, 28px top / 32px side padding): "← Discover" link, JetBrains Mono-ish
plain text link, var(--dir-ink).
Below it, a 3-column grid: 220px | 1fr | 260px, 36px gap, sticky side columns (top: 80px).

LEFT COLUMN — Related sidebar card (bg #faf7f2, 1px border var(--dir-border), 18px/16px padding):
  Heading "Related Persons" — JetBrains Mono 9px uppercase, letter-spacing .16em, color
  var(--dir-ochre), 14px bottom margin, 10px bottom padding, border-bottom var(--dir-border).
  5 related rows, each: 36×36px thumbnail (radius 2px) + title (12px, var(--dir-ink)), divided by
  1px var(--dir-border) borders between rows, no border after the last.
  Footer (12px top padding, border-top var(--dir-border)): "See all Persons →" JetBrains Mono 9px
  uppercase ochre link.
  Below the card, a SEPARATE inverted dark panel (bg var(--dir-dark-bg) #14110d, 16px padding):
  eyebrow "★ Community Wiki" (JetBrains Mono 9px ochre), body "Know more? Help improve this
  entry." (12px, rgba(245,240,232,.65), 12px bottom margin), CTA "Improve →" button.

CENTER COLUMN — Article:
  Eyebrow "PERSON" — JetBrains Mono 9px uppercase letter-spacing .16em ochre, 14px bottom margin.
  Title "Fela Kuti" — Fraunces, clamp(28px,5vw,46px), weight 300, var(--dir-ink), line-height 1.05.
  Lead paragraph (the entry excerpt, plain text, no markup) — 16-17px, line-height 1.7, var(--dir-muted).
  Date line "Added to directory 12 March 2025" — JetBrains Mono 10px, rgba(20,17,13,.3) or .35.
  1px divider, 24px vertical margin.
  Body prose — 16px, line-height 1.75, var(--dir-ink), rendered HTML (h2 sub-headers at Fraunces
  22px weight 400, paragraphs 20px bottom margin, lists with 20px left padding).
  Topics block (28px vertical padding, border-top var(--dir-border)): "Topics" eyebrow label
  (JetBrains Mono 9px uppercase var(--dir-muted)) + wrapping flex row of ghost-border interest tag
  chips, 8px gap.
  "Selected Works" section: Fraunces 20px weight 400 heading with bottom border, 40px top margin —
  then a WRAPPING grid (repeat(auto-fill, minmax(160px,1fr)), 16px gap) of 4:3 image cards with a
  12px title strip below each (not a horizontal rail).
  "Community Reviews & Takes" section: heading + an inline star-rating summary on the same row
  (gold ★★★★½ + bold rating number + muted "(N reviews)"), then a vertical stack of real community
  post cards (avatar 32px, author name bold, optional "Pro" pill, relative date, optional per-post
  star rating right-aligned, full untruncated post text, reaction-emoji-count row + "Read full
  post →" link at the bottom of each card).
  "Upcoming Events" section: heading, then a vertical stack of event rows (72×72px thumbnail, a
  "Happening" pill bg #eeedfe text #3c3489, formatted date range, title, venue/city/admission line)
  — each row links out to the event's own page.

RIGHT COLUMN — Sticky infobox card (bg #faf7f2, 1px border var(--dir-border), overflow hidden):
  4:3 featured image at the very top, no padding.
  Name-plate strip below it (bg #f3ede0, centered, 12px/10px padding, border-bottom): entry title
  repeated, Fraunces 15px weight 500.
  Key–value rows (90px label column + flexible value column, 8px padding, border-bottom between
  rows, baseline-aligned): "Type" → "Person", "Category" → comma-joined interest names, "Added" →
  same date as the article. A 2px divider, then the per-type fields (for Person: Born, Died,
  Nationality, Occupation, Known For, Origin, Active Years, Labels/Affiliations, Education,
  Notable Awards — only populated ones render). A second 2px divider, then external links
  (Website/Instagram/X — ochre link text, the @ links open to instagram.com/x.com).
  All labels: JetBrains Mono 9px uppercase letter-spacing .12em var(--dir-muted). All values:
  12-13px var(--dir-ink), or var(--dir-ochre) for link values.

FRAME 2 — MOBILE COMPANION (390px width): single-column stack, CSS order-reversed from desktop —
infobox card FIRST (image now 16:7 aspect ratio instead of 4:3), then the article column, then the
related-entries sidebar card + dark Improve panel LAST at the very bottom of the page. Side columns
lose their sticky positioning entirely on this breakpoint (`position: static`). Annotate this
reordering explicitly — it's a deliberate `order` swap in CSS, not a simplification/omission.

FRAME 3 — CONTENT-GATED STATE (desktop, entry type: "Book", access level patron-only, logged-in
Citizen viewer): identical shell to Frame 1, but where the body prose would be, render the real
ContentGate upsell block instead (a centered card describing the Pro requirement with an upgrade
CTA) — everything else (infobox, related sidebar, community/events sections) renders unaffected.
Annotate: "ContentGate replaces ONLY the body — not a blur overlay, not a full-page lock."

FRAME 4 — EMPTY-CONTENT STATE (desktop, entry type: "Movement", no body content, no related
entries, no community posts, no events): show the no-content italic fallback line "Full article
coming soon. Know this subject? Help us build it." in place of the body, the sidebar showing
"No related entries yet." in place of the related list, and the Selected Works / Community /
Upcoming Events sections entirely absent (not shown as empty states — those sections render
nothing at all when there's no data, per the real conditional logic).

CONSTRAINTS:
- No hero image bleed and no colored per-type badge pill anywhere on this page — that treatment
  belongs only to the off-canvas drawer (a separate, already-documented component) and to mobile.
- The eyebrow type label is plain mono text in ochre, not a pill/badge.
- Selected Works is a wrapping grid, not a horizontal-scroll rail.
- Community Reviews shows full, untruncated post text — do not truncate to 3 lines.
- Upcoming Events is a vertical list of cards, not horizontal date-block rows.
- Mobile reorders sections (infobox → article → related) — do not simply shrink the desktop
  layout proportionally.
```

Output 4 frames: Frame 1 (Desktop layout shell, Person example), Frame 2 (Mobile companion,
reordered stack), Frame 3 (Content-gated state), Frame 4 (Empty-content state).

---

## 21. MAKER/VENDOR STOREFRONT PAGE — WEB (Site A, themoveee.com/makers/[slug])

### Brand architecture

This is a **Moveee Magazine** (Site A) page — part of the Shop, not the community side. The
brand is always "Moveee Magazine" in any header/kicker copy on this page; never "Connect" or
bare "Moveee" (per the canonical naming table). The vetted-maker badge and "Moveee rating"
metric should read as Moveee Magazine's own editorial endorsement, not a generic marketplace
review score.

### Why this section exists

`apps/site/app/makers/[slug]/page.tsx` already exists and is already structured like a
self-contained "mini website" for the maker — full-bleed hero banner, branded info block,
stats bar, CTA row, social links, then a complete product catalogue underneath. Mobile's
equivalent (PROMPT 16E, "Maker / Brand Profile Page", `docs/figma-make-prompts.md` lines
4237–4294) covers the same idea for `MakerProfileScreen.tsx`. This section documents the real
web layout so it can be rebuilt/iterated on in Figma Make, and flags — rather than silently
fixes or invents around — several real backend gaps uncovered while grounding this prompt in
the actual code:

<!-- DEV: `fetchMaker()`/`fetchVendorProducts()` in page.tsx call `GET {CMS}/wp-json/moveee/v1/vendors/{slug}`
and `.../vendors/{slug}/products` — this REST namespace (`moveee/v1`) is NOT registered anywhere
in culture-community. Today this page always falls through to `notFound()` in production. The
prompt below documents the INTENDED rendered state (as if the data existed) — building the
actual `moveee/v1` vendor endpoints, backed by WCFM vendor accounts (`app/vendor/profile/page.tsx`)
and/or `_maker_*` product postmeta, is a separate, real backend task and is out of scope for this
visual prompt. -->
<!-- DEV: `fetchEditorialCoverage()` is defined in page.tsx but its result is never rendered in the
JSX — dead code. If "Editorial coverage" / "As seen in" is wanted on this page (mobile has no
equivalent section either), it needs new JSX, not just data wiring. Not included as a frame below
since there's no real design for it yet. -->
<!-- DEV: there are three disconnected data sources for "what is a maker": WCFM vendor accounts
(`app/vendor/profile/page.tsx`, store name/bio/banner/avatar), per-product `_maker_name`/`_maker_city`
postmeta (read by the mobile shop endpoints), and whatever shape `moveee/v1/vendors/{slug}` is
eventually built to return. There is no unifying taxonomy/CPT today. This prompt assumes the
eventual endpoint normalizes all three into the field set the page already expects
(storeName, bio, city, country, avatarUrl, bannerUrl, instagram, twitter, website, rating,
yearsActive, directorySlug) — do not treat that normalization as already solved. -->
<!-- DEV: `app/vendor/profile/page.tsx` (the WCFM-backed vendor dashboard) has no logo/banner upload
UI today — a maker has no way to actually set `bannerUrl`/`avatarUrl` from the frontend yet. Frame 1
below should still show a populated banner (design intent), but flag that the upload control is a
prerequisite, not yet built. -->
<!-- DEV: mobile's `MakerProfileScreen.tsx` has the identical problem on its own platform — it calls
`${MOBILE_API}/shop/maker/${makerId}`, which also doesn't exist, and silently falls back to
hardcoded placeholder data with no error state. Both platforms need the same real backend work;
this is not a web-only gap. -->

### Marketing copy (final — use verbatim, do not paraphrase)

- Vetted badge: **"★ Vetted Maker"**
- Stat labels: **"Maker since"** / **"Product"** or **"Products"** / **"Moveee rating"**
- Rating fallback (no reviews yet): **"★ New"**
- Primary CTA: **"Shop all products →"**
- Secondary CTA: **"View profile"**
- Social links: **"Website ↗"** / **"Instagram ↗"** / **"X / Twitter ↗"**
- Products header: **"Work by *{Maker Name}*"** (maker name in italic) + **"{N} piece(s)"** count
- Empty products state: **"No products listed yet. Check back soon."**
- Breadcrumb: **"Shop → Makers → {Maker Name}"**

### DEV ANNOTATION REQUIREMENT

Every frame below must carry inline `<!-- DEV: ... -->` notes wherever the design assumes data
that the current backend cannot actually supply (see the four annotations above) — do not let the
visual polish of the mockup imply the feature is wired end-to-end.

### PROMPT 21 — Maker/Vendor Storefront (Desktop 1440px + Mobile 390px)

```
Real grounding: apps/site/app/makers/[slug]/page.tsx (222 lines) + apps/site/app/makers/makers.css
(lines 128–347). Brand tokens (real, from apps/site/app/globals.css — NOT the CLAUDE.md mobile
values): --ink:#14110d, --paper:#ffffff, --ochre:#c5491f, --rule, --mute. Fonts: var(--font-serif)
"Fraunces", var(--font-sans) "DM Sans", var(--font-mono) "JetBrains Mono". Per the site-wide
border-radius rollout (June 2026, see CLAUDE.md "Border-radius convention"), this page's previous
flush-rectangle look is retired — apply the shared --radius-* scale (sm 2px / md 4px / lg 6px /
xl 12px / 2xl 20px / full 9999px, identical on both web apps and mirroring mobile's radius scale)
throughout: --radius-xl on the hero banner/visual, --radius-full on pill badges, --radius-lg on
CTA buttons and product cards.

FRAME 1 — DESKTOP STOREFRONT (1440px), populated/ideal state, maker "Bisi Ceramics":

1. Breadcrumb (full-width, top): "Shop" / "→" / "Makers" / "→" / "Bisi Ceramics" — JetBrains Mono
   11px, var(--mute), var(--ink) for the current page, "→" separators in var(--mute).

2. Hero — `grid-template-columns: 1fr 1fr`, min-height 520px, 16px gap (gap added so each half
   reads as its own rounded panel rather than a seamless split), divided visually by the gap
   itself rather than a hard rule line:
   - LEFT half: full-bleed banner/studio image (object-fit: cover, border-radius: var(--radius-xl)
     on all 4 corners) — <!-- DEV: bannerUrl, no upload UI exists yet --> — falls back to a
     placeholder block in var(--paper-deep), same var(--radius-xl) corners, with a single giant
     initial letter centered (Fraunces, ~120px, var(--mute)) when no image exists.
   - RIGHT half (vertically centered, ~64px padding): "★ Vetted Maker" badge — pill,
     border-radius: var(--radius-full), var(--ochre) background, var(--paper) text, JetBrains Mono
     10px uppercase letter-spacing .12em. Below it: maker name "Bisi Ceramics" — Fraunces serif,
     ~40px, var(--ink), weight 500. Below that: location "Lagos, Nigeria" — DM Sans 14px,
     var(--mute). Below that: bio paragraph (2–3 lines) — DM Sans 15px, var(--ink), line-height
     1.6, max-width ~440px.
   - Stats row (3 columns inside a single rounded panel, border-radius: var(--radius-lg),
     var(--paper-deep) background, hairline var(--rule) vertical dividers between columns): each
     column = big number (Fraunces, 28px, var(--ink)) over a small label (JetBrains Mono 9px
     uppercase letter-spacing .12em, var(--mute)) — "12" / "Maker since" (only if yearsActive
     present), "24" / "Products", "★ 4.9" / "Moveee rating" (or "★ New" if no rating yet).
   - CTA row: "Shop all products →" — solid var(--ink) background, var(--paper) text,
     border-radius: var(--radius-lg), JetBrains Mono 11px uppercase, padding 16px 28px, hover →
     var(--ochre) background. Beside it (only if `directorySlug` present): "View profile" —
     outline button, same var(--radius-lg) corners, 1px var(--ink) border, transparent background,
     same type treatment, links to `/directory/{directorySlug}`.
   - Social row (only rendered if any of website/instagram/twitter present): "Website ↗" /
     "Instagram ↗" / "X / Twitter ↗" — DM Sans 13px, var(--ochre) link color, each opens in a new
     tab, separated by ~24px gaps, no underline by default, underline on hover.

3. Products section (full-width, below hero, ~64px top padding):
   - Header row: "Work by *Bisi Ceramics*" (maker name in italic) — Fraunces 28px — on the left;
     "24 pieces" count — JetBrains Mono 11px uppercase, var(--mute) — on the right, baseline-aligned.
   - 4-column grid (`repeat(4, 1fr)`, 16px gap, each card border-radius: var(--radius-lg), 1px
     var(--rule) border, overflow hidden so the product image respects the rounded corners): each
     card = product image (aspect ~1:1, object-fit cover, rounded top corners only via the card's
     own overflow:hidden) over a body block (10px padding) with product name (DM Sans 14px,
     var(--ink)) and price (DM Sans 13px, var(--ochre), rendered from raw HTML via the existing
     `sanitizeHtml()` — keep the dangerouslySetInnerHTML pattern, don't redesign price formatting
     away from it). Whole card is a single link to `/shop/{product-slug}`, hover → subtle image
     zoom + shadow-card lift.
   <!-- DEV: real product data here depends on the broken moveee/v1 vendor-products endpoint — this
   frame shows the intended populated state, not the current always-empty reality. -->

FRAME 2 — DESKTOP EMPTY-PRODUCTS STATE: identical hero, but the products section shows only the
header ("Work by *Bisi Ceramics*", no count badge) followed by a single centered panel,
border-radius: var(--radius-lg), in var(--paper-deep): "No products listed yet. Check back soon."
— DM Sans 15px, var(--mute), ~80px vertical padding, no icon/illustration (matches the existing
plain-text empty state, don't add decoration that isn't in the real code).

FRAME 3 — MOBILE COMPANION (390px width): hero collapses to single column (image on top, full
width, ~220px height fixed rather than the desktop's 1fr-1fr ratio; info block below it, same
content order: badge → name → location → bio → stats row [now horizontally scrollable if it
overflows, not wrapped] → CTA row [stacked full-width buttons] → social row [wraps to 2 lines if
needed]). Products grid drops to 2 columns (matches the real `makers.css` responsive breakpoint
behavior — collapse 4→3→2 col as viewport shrinks, confirmed in the stylesheet's media queries).
Breadcrumb truncates to just "← Makers" back-link style on this width rather than the full
three-step trail, to save header space.

CONSTRAINTS:
- Apply the shared --radius-* scale consistently (xl for the hero banner, lg for buttons/cards/
  stat panel, full for pills) — do not leave any of the boxed elements above flush/square-cornered.
- The "mini website" feel comes from the hero's banner+info richness and the full catalogue below
  it, not from any tabs/sub-navigation — there is no internal nav within this page in the real
  code (no "About / Products / Reviews" tab bar); don't invent one without flagging it as new.
- Rating and "Maker since" stat are conditional — omit them from the stats row entirely (don't
  show a placeholder dash) when the source data is absent, mirroring the real conditional JSX.
- Keep all DEV annotations from the section preamble visible in the final deliverable — this page
  is currently non-functional in production and the prompt must not visually imply otherwise.
```

Output 3 frames: Frame 1 (Desktop populated storefront), Frame 2 (Desktop empty-products state),
Frame 3 (Mobile companion).

---

## 22. REDESIGNED COMPACT HEADER — WEB (Site A, themoveee.com)

### Brand architecture

Site A only — this is **Moveee Magazine**'s header, not Connect's. The redesign must keep the
"Moveee Magazine" / "Est. 2022 · Best in Culture" identity intact; it is a chrome-economy
redesign, not a rebrand.

### Why this section exists — and an important framing note

**Unlike every other section in this document (§1–§21), this is not a documentation prompt — it
is an actual redesign proposal.** The current real header (`apps/site/components/Header.tsx` +
`apps/site/app/homepage.css` `.masthead*`/`.mobile-menu*` rules) is two stacked, non-sticky rows:
a JetBrains-Mono ticker/marquee strip (issue number, date, locations, announcement, plus a
black language-toggle block bolted to its right edge) sitting on top of a 3-column masthead grid
(`grid-template-columns: 1fr auto 1fr`, 32px vertical padding, left nav / centered wordmark+kicker
/ right nav+icons+Join button). Neither row is `position: sticky` or `fixed` — the whole header
scrolls away with the page. There's also a chunk of dead CSS this redesign should let go of
cleanly: `--masthead-height` (referenced once, in `.hero`'s `calc(100vh - var(--masthead-height))`,
but the variable itself is never actually defined/set anywhere — likely a stale leftover from an
earlier sticky-header attempt) and a whole `.mobile-menu-member*` rule block (lines 378–410 of
`homepage.css`) that is never referenced by anything `Header.tsx` actually renders.

<!-- DEV: `--masthead-height` is read but never defined — confirm there is no hidden inline style
or other stylesheet setting it before relying on its current (effectively `0px`/invalid) behavior;
this redesign should either define it properly for the new compact height or remove the calc()
that depends on it. -->
<!-- DEV: `.mobile-menu-member*` (homepage.css lines 378–410) has no corresponding JSX in the
current Header.tsx — dead CSS. Safe to delete when implementing this redesign rather than carry
it forward unused. -->

This section proposes a real compact redesign target: a single sticky row at a much smaller
fixed height, taking some structural cues from Connect's own header
(`apps/connect/components/Header.tsx` — a single 60px sticky row, no marquee, no search bar) as a
useful comparison point for chrome economy, while preserving every piece of real Site A nav
content (Feed / Discover / Editorials, Search, Cart-with-badge, Sign in, Join →) and the real
ticker content (issue number, date, locations, announcement) — condensed rather than deleted,
since that content is real editorial signal, not legacy cruft, and removing it outright would be
a content decision beyond the scope of a "make it compact" request.

### Marketing copy (final — use verbatim, do not paraphrase)

- Kicker: **"Est. 2022 · Best in Culture"**
- Nav labels: **"Feed"** / **"Discover"** / **"Editorials"**
- Auth: **"Sign in"** / **"Join →"**
- Mobile menu CTA: **"Join Moveee →"**
- Language toggle: **"EN"** / **"FR"**

### DEV ANNOTATION REQUIREMENT

Frame 1 must annotate the current header's real structure (the baseline). Frame 2 must be clearly
labeled as the proposed redesign, with `<!-- DEV: ... -->` notes on the two dead-CSS items above
and on exactly what changed (sticky behavior added, row count reduced, ticker condensed) so a
reviewer can tell baseline from proposal at a glance.

### PROMPT 22 — Redesigned Compact Header (Desktop 1440px + Mobile 390px)

```
Real grounding: apps/site/components/Header.tsx (180 lines), apps/site/app/homepage.css
masthead/mobile-menu rules (lines 121–412, 1416–1442). Comparison reference (structure only, not
content): apps/connect/components/Header.tsx. Brand tokens (real, apps/site/app/globals.css):
--ink:#14110d, --paper:#ffffff, --ochre:#c5491f, --rule, --mute. Fonts: var(--font-serif)
"Fraunces", var(--font-sans) "DM Sans", var(--font-mono) "JetBrains Mono".

FRAME 1 — CURRENT HEADER BASELINE (Desktop 1440px, annotated, NOT the redesign):
Two stacked rows, `position: relative` (not sticky — scrolls away with page content):
1. Ticker row (~36px tall, var(--ink) background): scrolling/marquee issue+date+locations text on
   the left in JetBrains Mono 10px uppercase letter-spacing .15em white text with a pulsing ochre
   dot, an announcement link on the right, and a separate solid-black EN/FR language toggle block
   abutting the far right edge (border-left hairline white/10%, own 24px horizontal padding) —
   visually a second, disconnected control bolted onto the ticker rather than integrated with it.
2. Masthead row (~96px tall incl. 32px vertical padding, var(--paper) bg, 2px var(--rule) bottom
   border): 3-column grid (`1fr auto 1fr`) — left nav (Feed/Discover/Editorials, DM Sans 13px,
   ochre underline on hover/active) / centered wordmark (9px mono kicker above a 48px-tall logo
   image) / right nav (search icon, cart icon w/ badge, "Sign in" w/ user icon, solid-ink "Join →"
   button).
<!-- DEV: this is the real current structure — annotate the non-sticky behavior, the two-row total
height (~132px), and the disconnected language-toggle block as the specific pain points this
redesign addresses. -->

FRAME 2 — REDESIGNED COMPACT HEADER (Desktop 1440px, THE PROPOSAL):
Single row, `position: sticky; top: 0`, fixed height **64px**, var(--paper) background, 1px
var(--rule) bottom border (down from 2px — lighter chrome), z-index above page content. Layout —
3 zones in one row, vertically centered:
- LEFT zone: compact wordmark — logo image shrunk to 28px height (no separate kicker line at this
  height; the "Est. 2022 · Best in Culture" kicker text moves into a `title` tooltip / is dropped
  from the persistent chrome entirely, since there's no vertical room for a second text line at
  64px) — immediately followed by the nav links (Feed / Discover / Editorials) inline at smaller
  12px DM Sans, separated from the logo by a thin 1px var(--rule) vertical divider, ochre
  underline-on-active retained.
- CENTER zone: the condensed ticker content — issue number + date, JetBrains Mono 10px,
  var(--mute) — now living inline in the header's center rather than as its own separate row above
  it. The announcement link and locations list move into a small "i"-style info affordance (or are
  dropped to a secondary surface like a thin sub-bar that only appears on the homepage, not
  site-wide) <!-- DEV: this is the one real content trade-off in this redesign — decide whether
  announcement/locations earn a still-visible compact treatment or move to a homepage-only
  secondary surface; do not silently drop them without a decision recorded here. -->.
- RIGHT zone: search icon, cart icon w/ badge (badge itself border-radius: var(--radius-full)),
  EN/FR toggle (now small rounded text-pill buttons inline, border-radius: var(--radius-full),
  not a separate black block), "Sign in" (icon-only at this height, label restored on hover via
  tooltip or visible ≥1024px), solid-ink "Join →" button (smaller padding, 10px JetBrains Mono,
  border-radius: var(--radius-full) — per the site-wide border-radius rollout, June 2026, see
  CLAUDE.md "Border-radius convention").
<!-- DEV: total height drops from ~132px (two rows) to 64px (one row) — annotate this delta
explicitly as the headline win of the redesign. Sticky positioning is a new behavior, not present
today — call this out since it changes scroll interaction across every Site A page. -->

FRAME 3 — MOBILE COMPANION (390px, REDESIGNED, compact): single sticky row, 56px height — logo
(24px) + kicker fully dropped (no room), condensed date/issue text hidden entirely below this
breakpoint (matches the real header's existing pattern of hiding `.masthead-left`/`.masthead-right`
on mobile already), search icon + cart icon w/ badge + hamburger on the right. Hamburger opens the
same dropdown content as today (Feed/Discover/Editorials + "Join Moveee →") but the dropdown panel
itself should also gain the lighter 1px rule treatment to match the new compact chrome.

CONSTRAINTS:
- This is a redesign proposal, not documentation — Frame 1 is the only frame describing the
  current real implementation; Frames 2–3 are the new target and must be clearly labeled as such.
- Do not delete the ticker's issue/date/locations/announcement content outright — condense or
  relocate it (see the Frame 2 DEV note) but record the decision rather than silently dropping it.
- Keep real nav content unchanged: Feed / Discover / Editorials, Search, Cart w/ badge, Sign in,
  Join → — this is a chrome-compaction exercise, not a navigation-IA change.
- Sticky positioning is new — flag it as a behavior change, not a pre-existing trait being
  documented.
- Reference Connect's header only for structural economy (single row, sticky, ~60px) — do not pull
  Connect's brand styling (it has none of Site A's ticker/kicker/serif-logo identity) into this
  redesign.
```

Output 3 frames: Frame 1 (Current baseline, annotated), Frame 2 (Redesigned compact desktop),
Frame 3 (Redesigned compact mobile).

---

## 23. DISCOVER (DIRECTORY BROWSE) — WEB (Site B, web.themoveee.com/discover)

### Note on scope

Mobile's catalog (`docs/figma-make-prompts.md` §11C, "PROMPT 11C — 'Discover' Tab + Feed Reference
Chips") frames Discover primarily as an IA change to the feed (removing Directory entries from
the inline timeline) and only sketches the browse screen itself as Frame 2 of that prompt. This
web section documents the real, already-shipped `DiscoverBrowser.tsx` browse surface in full —
its own dedicated prompt rather than a sub-frame of a feed-IA prompt — and it has grown two
features the mobile version doesn't have: a personalized "Picked for You" rail and a
"Trending in Community" rail. There is no mockup HTML for this page yet (unlike most §9–§20
sections, which are visual-fidelity passes against an existing `mockups/web/*.html` file) — this
is a from-scratch design prompt, not a rebuild-to-match-mockup pass.

### Brand architecture

Site B (`apps/connect`). Public route — reachable by both authenticated and unauthenticated
visitors (the underlying `culture_directory` content is public), unlike most of §9–§13 which are
member-only. Entry point is a compass icon in `ConnectHeader.tsx` (`apps/connect/components/
Header.tsx`), linking to `/discover` — sits alongside the existing nav, not a new top-level tab.

### Why this section exists

Grounded in `packages/shared/components/DiscoverBrowser.tsx`, `apps/connect/app/discover/
page.tsx`, `apps/connect/app/discover.css` (`disc-*` namespace), `apps/connect/app/api/directory/
browse/route.ts`. This is the web counterpart to mobile's `DiscoverScreen.tsx` — same backend
(`GET /culture/v1/directory/browse`), same filter/sort vocabulary, but a few real implementation
details diverge from the mobile catalog's framing (see DEV notes below) and have no mockup
reference yet, so this prompt is the first visual design pass for the page.

### Marketing copy (final — use verbatim where shown)

**Header:** "Discover" (Fraunces, bold) + a search toggle icon, no subtitle/lede — this is a
utility browse surface, not a marketing landing page, so it skips the hero-band treatment every
other §9–§13 page gets.

**Empty state (no results for current filters):** "No entries match these filters."

**Filter panel:** "Filter Discover" + "Region" + "Sort by" section labels; footer button label
is dynamic — `"Show entries"` before the debounced count resolves, then `"Show {N} entr{y|ies}"`.

**Load-more / count line:** `"Load more"` button while more pages remain; once exhausted,
`"Showing {N} of {total} entr{y|ies}"`.

**Rail headings (only rendered when that rail has ≥1 result):** "Picked for You" · "Recently
Added" · "Trending in Community". Grid heading (always shown): "Explore More".

<!-- DEV 1 (revised — the original 12-pill always-visible chip row read as cluttered/"chips spread
on the page" and has been replaced with a single compact dropdown trigger): Type filtering is NOT
a separate filter-sheet section like mobile's catalog implies, but it's also no longer 12
always-visible pills — it's a single "Type ▾" dropdown trigger (shows "All Types" or the active
type's emoji+label) directly under the search bar/toggle, which opens a small 2-column popover
menu listing "All Types" + the 11 entry types (each row: emoji + label, active row gets a subtle
filled background, no per-type brand color in the trigger itself — color-coding is reserved for
badges on the cards below, not the filter control). A trailing "⚙ Filters" pill sits next to the
Type trigger and opens the overlay panel for Region + Sort only. Don't put a Type section inside
the Region/Sort filter panel — it's its own adjacent dropdown — and don't revert to the old
always-expanded pill row. -->

<!-- DEV 1b: The Type dropdown closes on selecting an option or clicking outside (a transparent
full-screen backdrop layer behind the popover, in front of the rest of the page) — same dismiss
pattern as the existing Region/Sort filter overlay, just lighter-weight (no modal dimming, no
slide-up animation — it's a small anchored popover, not a sheet). -->

<!-- DEV 2: Three personalization/ranking rails sit above the "Explore More" grid, each
independently fetched and each hidden entirely (no heading, no empty rail) when it has zero
results — "Picked for You" (filtered client-side from a larger recent batch against the viewer's
interest tags, hidden completely for logged-out visitors or anyone with no interests set —
mobile's catalog has no equivalent of this rail at all), "Recently Added" (`sort=recent`), then
"Trending in Community" (`sort=trending`, ranked by community-post reference count, also absent
from the mobile catalog's Frame 2). Render all three as the same compact horizontal-scroll card
style — text-forward, no image, since Directory entries have no consistent photo asset. -->

<!-- DEV 3: The "Explore More" grid defaults to a per-visit random shuffle (`sort=random` with a
client-generated seed, stable across "Load more" pagination within one visit but different next
visit) whenever the visitor hasn't typed a search or chosen an explicit sort — this is invisible
in the UI (the chip group still shows no sort actively selected) but matters for the prompt's
"Explore More" framing: describe it as a fresh, shuffled mix on every page load, not a fixed
"browse all" order. -->

<!-- DEV 4: Card footer differs by context — rail cards (compact, 140px) show an "Added Nd ago" /
"🆕 Added today" age line; grid cards (full size) instead show a star-rating line ("★★★★☆ 4.2",
only when reviews exist) plus a single subtype tag chip — these are two distinct footer layouts
on the same card component (`DiscoverCard`'s `rail` prop), not one universal footer. -->

<!-- DEV 5: There is no live "1,204 entries" caption near the grid the way mobile's catalog
Frame 2 shows one permanently — the count only appears once the grid is fully loaded with no more
pages left ("Showing N of total entries"); while more pages remain, a "Load more" button renders
in that same slot instead. The filter panel's own footer button has a separate, debounced live
count specific to the draft filters being edited — don't conflate the two counts. -->

### PROMPT 23 — Discover (Desktop 1440px + Mobile 390px)

```
FRAME 1 — DISCOVER HOME (Desktop, 1440px)

HEADER (64px, paper-warm bg, ghost bottom border): "Discover" Fraunces 22px bold ink, left + 🔍
  search-toggle icon button, right, 32px circular hit area, border-radius: var(--radius-full).

SEARCH BAR (appears below header on toggle, shown active in this frame, 48px, white bg, ghost
  border, border-radius: var(--radius-lg), max-width 480px): 🔍 icon + "Search people, places,
  books…" DM Sans 14px ghost placeholder.

FILTER ROW (per revised <!-- DEV 1 -->, 12px gap, 20px vertical padding — replaces the old
  always-expanded 12-pill chip row): a "Type ▾" dropdown trigger (ghost-border pill,
  border-radius: var(--radius-full), 6–12px padding, shows "All Types" by default or the active
  type's emoji+label, e.g. "🍽 Food", and an ochre-tinted border + text when a type is active) —
  clicking it opens a 280px, 2-column popover (white fill, border-radius: var(--radius-lg),
  shadow-card, 12px padding, anchored just below the trigger) listing "✦ All Types" + the 11 entry
  types as plain text rows (emoji + label, 12.5px, no per-type brand color — active row gets a
  subtle filled background + bold weight only). Trailing "⚙ Filters" pill, same radius, gains an
  ochre-tinted border when Region or Sort has a non-default value, opens the existing Region/Sort
  overlay panel unchanged.

PICKED FOR YOU RAIL (only if present, logged-in + interests set, per <!-- DEV 2 -->): "Picked for
  You" DM Sans 12px bold mute uppercase, 12px bottom. Horizontal scroll, 12px gap, 4 compact cards
  (180px wide, white fill, border-radius: var(--radius-lg), shadow-card, 14px padding, no image):
  type emoji+label (10px bold uppercase, type color) → title (DM Sans 14px bold ink, 2 lines) →
  city ("📍 Lagos, Nigeria", 11px mute) → age line ("Added 3d ago" / "🆕 Added today" in ochre when
  same-day).

RECENTLY ADDED RAIL — same compact card style as above, heading "Recently Added".

TRENDING IN COMMUNITY RAIL — same compact card style, heading "Trending in Community" (absent
  from the mobile catalog — flag this as web-only per <!-- DEV 2 -->).

EXPLORE MORE GRID (heading "Explore More" DM Sans 13px bold ink, 16px top/bottom margin; 4-column
  grid, 16px gap):
  ENTRY CARD (white fill, border-radius: var(--radius-lg), shadow-card, 16px padding):
    Type emoji + label, 10px bold uppercase, type color.
    Title: DM Sans 15px bold ink, 2 lines.
    Excerpt: DM Sans 12px ink-soft, 2 lines, 6px top (grid cards only — rail cards never show one).
    City: "📍 Accra, Ghana" 11px mute, 8px top.
    Footer row (ghost top border, 8px top padding, 8px top margin) per <!-- DEV 4 -->: star
      rating "★★★★★ 4.8" JetBrains Mono 10px gold (left, only if reviews exist) + subtype chip
      (ghost border, 9px, border-radius: var(--radius-full), right).
  Show 8 cards mixing types: Fela Kuti (Person) · New Afrika Shrine (Place) · Jollof Rice (Food) ·
  Things Fall Apart (Book) · Afrobeat (Genre) · Ankara Print (Fashion) · Half of a Yellow Sun
  (Film) · Ori Olokun (Artwork).

  Below the grid, right-aligned: either a "Load more" ghost-border button
  (border-radius: var(--radius-full)) or, once exhausted, "Showing 8 of 142 entries" JetBrains
  Mono 11px mute — per <!-- DEV 5 -->, never both at once.

EMPTY STATE (replaces the grid when zero results, centred, dashed border card,
  border-radius: var(--radius-xl), padding 48px): greyscale 🔍 glyph, 40px, then "No entries match
  these filters." DM Sans 14px mute.

---

FRAME 2 — FILTER PANEL (overlay, Desktop 1440px)

SCRIM: ink @ 40%, full viewport. PANEL (right-anchored slide-in, 420px wide, white bg,
  border-radius: var(--radius-xl) on the left edge corners only, shadow-card, full height):
  ✕ close button, top-right, 16px inset.
  "Filter Discover" Fraunces 18px bold ink, 24px padding top.

  SECTION — REGION (24px padding, 16px bottom, per <!-- DEV 1 -->, no Type section here — it's
    already in the always-visible chip row): "Region" DM Sans 12px bold mute uppercase, 10px
    bottom. Chip wrap, 8px gap: "All" (selected) · "Nigeria" · "Ghana" · "UK" · "USA" ·
    "Africa" — ghost border inactive, ink fill/white text active,
    border-radius: var(--radius-full).

  SECTION — SORT (24px padding, ghost top border): "Sort by" DM Sans 12px bold mute uppercase,
    10px bottom. 3 radio rows: "Most Relevant" (selected) · "Recently Added" · "Highest Rated" —
    20px circular radio per row, ochre dot fill when active.

  FOOTER (sticky bottom, white bg, shadow-card top, 24px padding): full-width ochre button,
    border-radius: var(--radius-full), 52px height, DM Sans 15px bold white — label is the
    dynamic count copy from the Marketing Copy section above (show the resolved-count state:
    "Show 142 entries").

---

FRAME 3 — MOBILE COMPANION (390px, single column)

- Header + search toggle unchanged, full width.
- Type chip row becomes horizontally scrollable (no wrap), same chip styling.
- Each rail (Picked for You / Recently Added / Trending) keeps its own horizontal scroll, cards
  shrink to 150px wide.
- Explore More grid collapses to 2 columns, 12px gap, card padding reduced to 12px.
- Filter panel becomes a bottom sheet instead of a right-anchored panel — drag handle, 36×4px
  ghost pill centred, border-radius: var(--radius-2xl) top corners only, ~70% screen height,
  otherwise identical section content to Frame 2.

CONSTRAINTS:
- Apply the shared --radius-* scale throughout (see CLAUDE.md "Border-radius convention") — no
  flush/hard-cornered elements anywhere on this page.
- Type filtering lives in the always-visible chip row, never inside the filter panel — see
  <!-- DEV 1 -->.
- Picked for You and Trending in Community are real, already-shipped rails with no mobile-catalog
  equivalent — do not drop them when cross-referencing mobile's §11C.
- Never use "Connect" as the surface name in any heading or copy — this is just "Discover", part
  of Moveee (Site B).
```

Output 3 frames: Frame 1 (Discover Home, Desktop), Frame 2 (Filter Panel overlay, Desktop),
Frame 3 (Mobile Companion, full scroll).

---

## 24. NEWSLETTER PUBLICATION PAGES & ARCHIVE — WEB (Site A, themoveee.com/newsletter/culture-drop · /newsletter/getmelit · /newsletter)

### Note on scope

Covers three overlapping surfaces, all sharing one design language:

1. **`/newsletter/culture-drop`** and **`/newsletter/getmelit`** — the per-publication homepages,
   both rendered by `apps/site/components/NewsletterPublicationPage.tsx` using per-list data from
   `apps/site/lib/newsletter-lists.ts` (`NL_META`). This is the primary target.
2. **The archive section** — the issue-list embedded at the bottom of every pub page (and on
   the hub `/newsletter` page under `#archive`). Same design language, separate detailed frame.
3. **`/newsletter`** — the hub page showing both newsletters. Not a rebuild target in this pass
   (the hub's `newsletter/page.tsx` is more complex — 2-newsletter cards, Coming Soon grid,
   etc.) but its archive tabs should visually match the archive frame here.

**No "Who's Writing?" section.** Dense Discovery's author bio panel is explicitly excluded from
this redesign — neither newsletter has a single named author and the editorial voice is collective.
All other Dense Discovery structural patterns are fair game.

**Design inspiration — Dense Discovery (`densediscovery.com`):**
Clean, editorial, predominantly white/off-white background, serif display headline in the hero,
a 2-column hero with a simulated email preview on the right, a 3-column subscriber testimonial
band, a "What you're in for" section with a 2×4 grid of colored-dot section tiles, a values
strip (4 columns), a recent issues preview, and a bottom subscribe CTA band. The overall register
is **quiet, text-forward, lots of white space** — not the colorful card/band-heavy current design.

### Brand architecture

Site A (`apps/site`). No auth required. Both newsletters are free.
- Culture Drop: `apps/site/app/newsletter/culture-drop/page.tsx` → `NewsletterPublicationPage`
- GetMeLit: `apps/site/app/newsletter/getmelit/page.tsx` → `NewsletterPublicationPage`
- Shared CSS: `apps/site/app/newsletter.css` (`nl-*`, `gml-*`, `digest-*` namespaces)
- Subscribe widget: `GmlCTAForm` (Culture Drop) / `NewsletterSubscribeWidget` (GetMeLit)
- Both have RSS feeds: `/newsletter/{list-id}/feed` — shown as an RSS icon+link in the eyebrow

### Why this section exists

The current layout is a dense arrangement of colored card bands, pillar grids, pull-band strips,
and feature sections that compete with each other for attention. Dense Discovery achieves
subscriber trust and conversion with far less visual noise — the hero does the heavy lifting
(headline + preview + form), testimonials add social proof, and the section grid is the only
real "feature" block. Every other element is editorial breathing room. This prompt asks for that
register applied to Moveee's two newsletters.

The existing CSS constraint from `CLAUDE.md` — "newsletter pages must use paper backgrounds only;
no `var(--ink)` background on any section" — means the new design uses `#fff` (white) and
`var(--paper)` (#f3ece0, the project's warm off-white) as the only two backgrounds, with
`var(--ink)` reserved for text and the subscribe button, not section fills.

### Marketing copy (final — use verbatim where shown)

**Culture Drop:**
- Eyebrow: `★ Culture Drop · Every Tuesday`
- Headline: `The weekly dispatch on contemporary global culture.`
- Standfirst: `One deep essay, curated picks, a music dispatch, and what's happening across Lagos, London, New York, and Accra. Written to make you think, not just scroll.`
- Form CTA: `Drop it in my inbox →`
- Social proof line: `Free · Weekly · Unsubscribe any time`
- Section grid labels: `The Deep Dive` / `The List` / `What's Playing` / `The Calendar`
- Pull quote: `We don't just tell you what's happening — we explore why it matters.`
- Bottom CTA band headline: `One cultural dispatch. Every week.`
- Bottom sub-copy: `No spam. No nonsense. Unsubscribe any time.`

**GetMeLit:**
- Eyebrow: `★ GetMeLit · Mon–Sat`
- Headline: `A new story in your inbox, every day.`
- Standfirst: `A story or poem every weekday — plus a fuller literary dispatch every Saturday, with new books, writing opportunities, and an author in the spotlight.`
- Form CTA: `Subscribe →`
- Social proof line: `Free · Daily · Unsubscribe any time`
- Section grid labels: `Daily Stories` / `Books` / `Opps` / `Spotlight`
- Pull quote: `A new story or poem in your inbox every weekday. And every Saturday, the full literary dispatch — books, opportunities, and a writer worth knowing.`
- Bottom CTA band headline: `One story. Every day.`
- Bottom sub-copy: `No spam. No nonsense. Unsubscribe any time.`

**Subscriber testimonials (shared, 3 across both newsletters):**
- `"The first newsletter I've opened every week for a year. Essential."` — ★★★★★
- `"Culture Drop changed how I think about what I read and what I watch."` — ★★★★★
- `"GetMeLit is the only place I find writing opportunities I actually apply for."` — ★★★★★

**Archive section:**
- Section label: `Full Archive`
- Tab labels: `All` · `Culture Drop` · `GetMeLit` (hub archive only — pub-page archives have no tabs)
- Issue row format: issue number (left-padded `001`) · date · title · `→`

<!-- DEV 1: Both pub pages use the same `NewsletterPublicationPage` component — only the `listId`
prop changes. Design must scale gracefully to either list's copy and section count (both have 4
pillars currently, see `NL_META`). Don't hardcode Culture Drop copy into GetMeLit frames — use
the `NL_META` data keys exactly as documented in `apps/site/lib/newsletter-lists.ts`. -->

<!-- DEV 2: The simulated "email preview" panel in the hero is a UI design element, not a rendered
Next.js component — it's a static illustration of what the newsletter looks like in an inbox,
showing the newsletter name/logo, a headline in the newsletter's own typographic style, and a
short excerpt/preview of a real section. Think: a browser-less "email card" with a subtle drop
shadow and a thin border, sitting on a light paper background. No real email client chrome needed.
This panel is purely decorative/illustrative — implemented as a `<div>` with mocked content,
not an `<iframe>` or embedded email renderer. -->

<!-- DEV 3: The subscribe form is an existing client component — `GmlCTAForm` (Culture Drop,
`apps/site/components/GmlCTAForm.tsx`) and `NewsletterSubscribeWidget` (GetMeLit,
`packages/shared/components/NewsletterSubscribeWidget.tsx`). Both accept `placeholder`,
`buttonLabel`, and `list` props. The design should treat the form as a 2-element inline row
(text input + button at the same height, no wrapping label card around it) — the current design
wraps it in a `.nl-card-form` div with extra padding/border; the new design drops that wrapper
entirely and renders form inline in the hero and in the bottom CTA band. -->

<!-- DEV 4: "Paper backgrounds only" constraint from CLAUDE.md. The two permitted backgrounds:
`#ffffff` (pure white, for the hero and testimonials band) and `var(--paper)` / `#f3ece0`
(warm off-white, for the section-grid, archive, and bottom CTA band). Never use `var(--ink)`
(#14110d) as a section background fill — ink is for text and buttons only on this surface.
The per-newsletter accent colors: Culture Drop → `var(--ochre)` (#c5491f, rust/terracotta) for
section tile indicators and the subscribe button; GetMeLit → `var(--gold)` (#b38238, amber)
for the same elements. These should be used sparingly — colored dots, button fills, one or two
rule lines — not as background fills for whole sections. -->

<!-- DEV 5: The archive issue list (`digest-archive-row`) already uses a row-based layout with
issue number, date, title, badge, and arrow — these CSS classes exist in `newsletter.css`.
The new archive design replaces the current flat-bordered rows with a slightly more editorial
treatment: wider number column, date in monospace, title in the serif font, hover state is a
subtle paper-warm tint rather than a hard border change. No pagination is implemented server-side
(all issues fetched at once with `getNewslettersWithFallback(50, ...)`), so the archive is
client-rendered scroll — don't design a pagination control unless the total is > 50. -->

<!-- DEV 6: No "Who's Writing?" section anywhere in either newsletter page. This is an explicit
product decision (no single named editor), not a gap to be filled later. Do not design a
placeholder or "Coming soon" variant for it — just omit the section entirely. -->

### PROMPT 24 — Newsletter Publication Pages & Archive (Desktop 1440px + Mobile 390px)

```
FRAME 1 — CULTURE DROP PUBLICATION HOMEPAGE (Desktop, 1440px, white bg)

HERO (split 2-column, max-width 1100px centered, 80px vertical padding each side):
  LEFT COLUMN (~52%, vertical stack, justified to center of column):
    EYEBROW: "★ Culture Drop · Every Tuesday" — DM Sans 12px, `var(--mute)` color, letter-spacing
      0.6px, uppercase. RSS icon link (16px, same muted color) to the right of the eyebrow text.
    HEADLINE: "The weekly dispatch on contemporary global culture." — Fraunces 42px, weight 700,
      `var(--ink)`, line-height 1.15, max-width 420px, 16px top margin.
    STANDFIRST: "One deep essay, curated picks, a music dispatch, and what's happening across
      Lagos, London, New York, and Accra. Written to make you think, not just scroll." —
      DM Sans 16px, `var(--ink-soft)`, line-height 1.6, 16px top margin, max-width 400px.
    SUBSCRIBE FORM (24px top margin, no card wrapper per DEV 3):
      Inline row, 8px gap: text input ("your@email.com", DM Sans 14px, `var(--paper)` bg,
      `var(--rule)` border, border-radius: var(--radius-md), 12px padding, flex:1, max-width
      260px) + button ("Drop it in my inbox →", DM Sans 14px bold, `var(--ochre)` bg (#c5491f),
      white text, border-radius: var(--radius-md), 12–20px padding, no border). The button uses
      `var(--ochre)` (rust/terracotta, NOT `var(--gold)`) per Culture Drop's accent — DEV 4.
    SOCIAL PROOF (10px top): "Free · Weekly · Unsubscribe any time" — DM Sans 12px,
      `var(--mute)`, no star icons (these go in the testimonials band, not here).

  RIGHT COLUMN (~48%): NEWSLETTER PREVIEW PANEL (per DEV 2).
    A simulated "email card" illustration: white fill, 1px border (`var(--rule)`), subtle
    drop-shadow (0 4px 24px rgba(0,0,0,0.08)), border-radius: var(--radius-xl) (12px). Inside:
      - Top strip (12px padding, border-bottom): "Culture Drop" in the newsletter's own style —
        DM Sans 11px uppercase bold `var(--ochre)`, and a small date ("Tue, 1 Jul 2026")
        in 10px mono `var(--mute)`.
      - Content block (16px padding, mocked): an issue headline at Fraunces 18px bold ink
        (e.g. "The Deep Dive: On the global afterlife of Afrobeat"), 2 lines of body text in
        DM Sans 12px `var(--ink-soft)` capped at 3 lines with "…", then a muted section divider
        ("──── The List ────" in mono 10px `var(--mute)`), then 4 short one-line picks in DM
        Sans 12px (e.g. "▸ Film — A Tribe Called Judah..."). Total card height ~260px, width
        ~380px, slight 2° clockwise tilt on the card using CSS transform, placed on a
        `var(--paper)` (#f3ece0) tinted bg rectangle that fills the right column.

TESTIMONIALS BAND (full-width, `var(--paper)` bg, 48px vertical padding, 1px border top+bottom
  `var(--rule)`):
  3-column grid (max-width 960px centered, 40px gap), each testimonial:
    ★★★★★ (five solid gold stars, `var(--gold)` #b38238, 14px, 8px bottom).
    Quote text in DM Sans 14px italic `var(--ink)` line-height 1.5, e.g. "The first newsletter
    I've opened every week for a year. Essential."
  No author names, no avatar. Clean, minimal. From the 3 verbatim quotes in the copy block above.

WHAT YOU'RE IN FOR (2-column, max-width 1100px centered, 72px vertical padding, white bg):
  LEFT (~45%):
    Section label: "What you get" — DM Sans 11px uppercase bold `var(--mute)`, letter-spacing 1px.
    Heading: "Four things. Every week." — Fraunces 32px bold `var(--ink)`, 12px top.
    Body: "Every issue of Culture Drop is built around four sections — so you always know what
    you're getting, but never know what you'll find." — DM Sans 15px `var(--ink-soft)`, 16px top.
    CTA row (28px top): "Subscribe →" button (`var(--ochre)` fill, white text, border-radius:
    var(--radius-md)) + "Browse the archive →" ghost button (no fill, `var(--rule)` border,
    `var(--ink)` text, border-radius: var(--radius-md)), 12px gap.
  RIGHT (~55%): 2-column × 2-row grid of section tiles (24px gap):
    Each tile: a 6×20px left border in the tile's accent color (Culture Drop uses a muted terracotta
    #c5491f at 60% opacity for all 4) then title in DM Sans 14px bold `var(--ink)` and 1–2 lines
    desc in DM Sans 13px `var(--ink-soft)`. No card background, no border-radius — tiles are flat
    rows with only the left color bar distinguishing them. 4 tiles:
      "The Deep Dive" / "The List" / "What's Playing" / "The Calendar"
    Use the descriptions from NL_META["culture-drop"].pillars verbatim.

PULL QUOTE (full-width, white bg, 72px padding, centered, max-width 680px):
  A 2px horizontal rule (`var(--ochre)`, 40px wide, centered, 0 auto) above the quote.
  Quote: "We don't just tell you what's happening — we explore why it matters." —
    Fraunces 26px italic `var(--ink)`, centered, line-height 1.45.
  Cite: "— The editorial mission of Culture Drop" — DM Sans 13px `var(--mute)`, centered, 12px top.

RECENT ISSUES (max-width 960px centered, 72px top padding, white bg):
  Section label + "Full archive →" link in the same row (flexbox, space-between).
  "Recent issues" — DM Sans 11px uppercase bold `var(--mute)` + link "Full archive →" DM Sans 13px
    `var(--ochre)` underline-on-hover.
  3-column grid (24px gap) of issue preview cards (white fill, 1px `var(--rule)` border,
    border-radius: var(--radius-lg), 20px padding, no shadow):
    Issue number: "Issue N°{N}" DM Sans 11px mono `var(--mute)` + date right-aligned same row.
    Headline: Fraunces 17px bold `var(--ink)`, 2 lines max, 10px top.
    Excerpt: DM Sans 13px `var(--ink-soft)`, 3 lines max, 8px top.
    CTA: "Read this issue →" DM Sans 12px `var(--ochre)`, 16px top. No arrow icon.

BOTTOM SUBSCRIBE CTA BAND (full-width, `var(--paper)` bg, 80px vertical padding,
  1px border-top `var(--rule)`, text + form centered, max-width 560px):
  "One cultural dispatch. Every week." — Fraunces 32px bold `var(--ink)`, centered.
  Subscribe form (24px top): same inline row as hero (input + "Drop it in my inbox →" button).
  "No spam. No nonsense. Unsubscribe any time." — DM Sans 12px `var(--mute)`, centered, 12px top.

ARCHIVE SECTION (id="archive", full-width, white bg, 64px top padding):
  Section header row: "Full Archive" DM Sans 11px uppercase bold `var(--mute)` left, "{N} issues"
    count DM Sans 11px mono `var(--mute)` right.
  1px border-bottom `var(--rule)`, 16px bottom margin.
  ISSUE ROWS (`.digest-archive-row` — existing class, new visual treatment):
    Each row: full-width, 16px top+bottom padding, border-bottom 1px `var(--rule)`, flex row 16px gap:
      ISSUE NUMBER — "001" — DM Mono 13px `var(--mute)`, flex-shrink 0, width 36px.
      DATE — "1 Jul 2026" — DM Mono 12px `var(--mute)`, flex-shrink 0, width 90px.
      TITLE — Fraunces 15px `var(--ink)`, flex:1.
      → arrow — DM Sans 13px `var(--mute)`, flex-shrink 0.
    On hover: row bg becomes `var(--paper)` (#f3ece0), title becomes `var(--ochre)`, transition 0.1s.
    No badge/tag in archive rows on the pub page (they're single-list, no filtering needed).

CONSTRAINTS:
  - White (#ffffff) and `var(--paper)` (#f3ece0) are the only two section backgrounds — per DEV 4.
  - `var(--ochre)` (#c5491f) is the Culture Drop accent (button fills, left rule bars, pull-quote
    rule, hover color, RSS icon, archive hover title) — never use `var(--gold)` for Culture Drop.
  - No dark (ink) background on any section — this applies to buttons too: only the subscribe
    button uses `var(--ochre)`, not `var(--ink)`.
  - Apply the shared `--radius-*` scale throughout.
  - All copy is from the NL_META["culture-drop"] object and the verbatim copy block above —
    do not paraphrase or invent new copy.

Output 1 frame: Culture Drop publication homepage, full desktop scroll.
```

---

```
FRAME 2 — GETMELIT PUBLICATION HOMEPAGE (Desktop, 1440px, white bg)

IDENTICAL STRUCTURE to Frame 1 (Culture Drop), with these per-newsletter substitutions:

ACCENT COLOR SWAP: `var(--gold)` (#b38238, warm amber) replaces `var(--ochre)` (#c5491f) in
  every instance — subscribe buttons, section tile left bars, pull-quote rule, archive hover
  title color, RSS icon. GetMeLit's identity is the amber/gold family, not rust.

COPY SWAPS (from NL_META["getmelit"] and verbatim copy block):
  - Eyebrow: "★ GetMeLit · Mon–Sat"
  - Headline: "A new story in your inbox, every day."
  - Standfirst: "Stories, poems, essay excerpts, and opportunities for writers and authors from
    around the world — curated to keep you reading, writing, and discovering."
  - Subscribe button label: "Subscribe →"
  - Section grid heading: "Four things. Every week." (same heading — different tiles below)
  - Section tiles (from NL_META["getmelit"].pillars):
      "Stories" / "Books" / "Opps" / "Author Spotlight" — using `var(--gold)` bars at 60% opacity.
  - Pull quote: "A new story or poem in your inbox every weekday. And every Saturday, the full
    literary dispatch — books, opportunities, and a writer worth knowing."
  - Pull cite: "— The editorial mission of GetMeLit"
  - Bottom CTA headline: "One literary letter. Every week."
  - Bottom button label: "Subscribe →"

NEWSLETTER PREVIEW PANEL (right-hero column) — same card structure, but mocked content from
  GetMeLit: top strip label "GetMeLit" in `var(--gold)`, issue headline at Fraunces 18px bold
  ink (e.g. "Stories: The Invisible Woman by Ama Ata Aidoo — an excerpt"), section divider
  "──── Books ────", 4 short picks. Card sits on same `var(--paper)` bg rectangle.

TESTIMONIAL swapped to the GetMeLit-specific quote:
  "GetMeLit is the only newsletter I actually look forward to receiving six days a week." — ★★★★★

ALL OTHER SPACING, TYPOGRAPHY, LAYOUT: identical to Frame 1.

Output 1 frame: GetMeLit publication homepage, full desktop scroll.
```

---

```
FRAME 3 — NEWSLETTER HUB ARCHIVE (Desktop, 1440px — the #archive section on /newsletter)

This frame zooms into the archive section as it appears on the hub `/newsletter` page, where
all issues from both lists are shown with filterable tabs. The hub's archive section has tabs
("All", "Culture Drop", "GetMeLit") absent from the single-list pub pages.

ARCHIVE TAB ROW (border-bottom 1px `var(--rule)`, pb 16px, mb 24px):
  "Full Archive" DM Sans 11px uppercase bold `var(--mute)` left, tabs right:
  Tab group (flex row, 4px gap, inline): "All {N}" · "Culture Drop {N}" · "GetMeLit {N}"
  Each tab: DM Sans 13px `var(--ink)`, no fill, 8px horizontal padding, 4px vertical.
  Active tab: border-bottom 2px `var(--ochre)`, `var(--ink)` text (underline, not fill).
  Inactive: `var(--mute)` text, no border. The count is in a `<span>` at `var(--mute)` 11px.

ISSUE ROWS (same as Frame 1 archive, but with a list badge on the right side):
  Row: number · date · title · LIST BADGE · arrow.
  LIST BADGE ("Culture Drop" or "GetMeLit") — a small rounded pill (border-radius: var(--radius-full),
    6px horizontal padding, 3px vertical):
    Culture Drop: `var(--ochre)` text, rgba(197,73,31,0.08) bg.
    GetMeLit: `var(--gold)` text, rgba(179,130,56,0.08) bg.
  Hover: same as Frame 1 (paper bg + title in respective accent color).

Output 1 frame: archive section with tabs, "All" tab active, ~12 visible rows.
```

---

```
FRAME 4 — MOBILE COMPANION (390px, Culture Drop pub page)

HERO (vertical stack, 24px horizontal padding, 48px top):
  Eyebrow: 11px uppercase `var(--mute)` + RSS icon.
  Headline: Fraunces 32px bold ink, line-height 1.2, 12px top.
  Standfirst: DM Sans 15px `var(--ink-soft)`, line-height 1.55, 12px top.
  Subscribe form (16px top): stacked (not inline) — input full-width (12px padding), then
    button full-width below (same `var(--ochre)` fill, 14px bold, 14px padding), 8px gap.
  Social proof: 11px `var(--mute)`, centered, 10px top.
  NEWSLETTER PREVIEW PANEL: below the form, full-width minus 24px margins, 0° tilt (no tilt on
    mobile — flat card, same inner mock content), height ~220px, 24px top margin.

TESTIMONIALS: single-column stack, 3 cards (same as desktop tiles but stacked), 32px vertical
  padding, `var(--paper)` bg.

WHAT YOU'RE IN FOR: single-column — heading + body + CTAs stacked above; section tiles below
  in 1-column list (left bar + title + desc on same row, 16px gap between tiles).

PULL QUOTE: 28px horizontal inset, same centered treatment, 22px font size.

RECENT ISSUES: single-column stack of issue cards (same card, full-width), 16px gap.

BOTTOM CTA BAND: same centered layout, headline 26px, form stacked (not inline).

ARCHIVE: same rows as desktop, but date is hidden on mobile (space constraint) — just issue
  number + title + arrow per row.

Output 1 frame: mobile Culture Drop pub page, full scroll.
```


---

```
FRAME 5 — NEWSLETTER READING / ARCHIVE PAGE (Split-Pane, Desktop 1440px)
URL: /newsletter/[slug] — the single-issue reading page

This is the most significant structural departure from the current design.
Dense Discovery's archive/reading page is a SPLIT-PANE READER — a persistent left sidebar
shows the full browseable issue list while the right panel displays the current issue's content,
each scrolling independently. Replaces the current full-width hero + right-sidebar card layout.

OVERALL LAYOUT:
  Two-column split, full viewport height. Left sidebar: fixed width 420px, height 100vh, 
  sticky (does not scroll with content). Right content: flex:1, its own scrollable overflow-y.
  1px vertical divider between them (`var(--rule)`).

LEFT SIDEBAR (420px, white bg, height 100vh, overflow-y hidden, flex-column):

  SIDEBAR HEADER (24px padding, flex-column, border-bottom 1px `var(--rule)`):
    Newsletter wordmark/logo: the newsletter name in Fraunces 28px bold `var(--ink)`.
    Caption (16px top): "Browse all {N} issues of Culture Drop — the weekly dispatch on
      contemporary global culture. Written to make you think, not just scroll." —
      DM Sans 14px `var(--ink-soft)`, line-height 1.5.
    SUBSCRIBE BUTTON (16px top): full-width, DM Sans 14px bold, `var(--ink)` bg, white text,
      border-radius: var(--radius-md), 14px padding. Label: "Subscribe free →".

  ARCHIVE PANEL (flex:1, overflow-y auto, flex-column):
    PANEL HEADER (16px padding, flex row, border-bottom 1px `var(--rule)`, sticky top:0,
      white bg, z-index 1):
      "Browse Archive" — DM Sans 13px bold `var(--ink)`, flex:1.
      Sort toggle: two small icon buttons (↓ newest-first active, ↑ oldest-first inactive),
        each 32px square, border 1px `var(--rule)`, border-radius: var(--radius-sm),
        `var(--ink)` icon when active, `var(--mute)` when inactive. 4px gap.

    ISSUE LIST (scrollable, no extra padding):
      Each issue row (full-width, border-bottom 1px `var(--rule)`, 0 horizontal margin):
        Padding: 14px 16px.
        Row top line: "Issue {N}" — DM Sans 13px bold `var(--ink)`.
        Row bottom line: issue title — DM Sans 13px `var(--ink-soft)`, 2px top.
        ACTIVE ROW (currently reading): background fill = `var(--ochre)` (#c5491f) for Culture
          Drop / `var(--gold)` (#b38238) for GetMeLit; both text lines in white (#fff);
          no border override — the colored bg replaces the white bg.
        INACTIVE ROWS: white bg, default text colors. Hover: `var(--paper)` bg tint, 0.1s
          transition.
        Each row is a `<Link href="/newsletter/{slug}">` — clicking loads that issue in the
          right pane (client-side navigation, no full page reload, sidebar stays fixed).

    SIDEBAR FOOTER (border-top 1px `var(--rule)`, 12px 16px padding):
      A `<<` collapse button: DM Sans 12px `var(--mute)`, floated right, no fill, no border.
      Clicking collapses the left sidebar to 0px, the right pane takes full width. A `>>`
      expand button (mirrored) re-opens it. This is a client-side `useState` toggle on the
      split-pane layout wrapper — no URL change.

RIGHT CONTENT PANE (flex:1, overflow-y auto, position relative):

  ISSUE BADGE (position fixed, top 20px, right 20px, z-index 10):
    "Issue N°{N}" pill — DM Sans 13px bold `var(--ink)`, white bg, 1px `var(--rule)` border,
    border-radius: var(--radius-full), 10px 16px padding, box-shadow 0 2px 8px rgba(0,0,0,0.1).
    A small 🔗 share/link icon at the right end of the pill (16px, `var(--mute)` color).

  ISSUE HERO (full-width, height ~480px, colored bg = accent color at 40% opacity mixed with
    white — a very light terracotta wash for Culture Drop, light amber wash for GetMeLit):
    TWO-COLUMN INNER (max-width 960px centered, 48px vertical padding, 40px gap):
      LEFT (~45%): Opening pull quote from the issue — Fraunces 26px italic `var(--ink)`,
        line-height 1.45, max 4 lines. Attribution below: "— [Name]" DM Sans 14px `var(--mute)`.
        (If no pull quote exists: issue title at Fraunces 28px bold `var(--ink)` + excerpt.)
      RIGHT (~55%): Featured image from the issue (`issue.featuredImage`) — `<Image>` component,
        `objectFit: "contain"`, max-height 420px, drop-shadow 0 8px 32px rgba(0,0,0,0.15),
        border-radius: var(--radius-lg). Below image: "Artwork by [credit]" DM Sans 11px
        `var(--mute)` italic (when a credit exists in post meta — optional).
    If no featured image: hero is a simpler centered layout — just the pull quote/title on the
      accent-washed bg, centered, no right column.

  NEWSLETTER WORDMARK (centered, below hero, 40px top, 24px bottom):
    Newsletter name as display logotype — Fraunces 64px bold `var(--ink)`, letter-spacing -1px,
    centered. (Mirrors DD's large "DD" monogram that appears mid-issue — grounds the content in
    the newsletter's identity before the body text begins.)

  ISSUE GREETING / BODY:
    "Hello readers!" or the issue's opening salutation — DM Sans 16px `var(--ink-soft)` bold.
    Then the full `issue.content` HTML rendered in a comfortable reading column:
      max-width 680px, margin 0 auto, padding 0 40px 80px.
      Font: DM Sans 16px `var(--ink)`, line-height 1.7.
      Headings within content: Fraunces 22px bold `var(--ink)`.
      `<a>` links: `var(--ochre)` or `var(--gold)` (per newsletter), underline on hover.
      Images within content: max-width 100%, border-radius: var(--radius-md).
    ArticleContentGate renders inline here — if the issue is gated (Pro-only), content
      truncates after a preview paragraph and shows the ContentGate paywall panel as currently
      implemented (no redesign of that component in this pass — it's a shared cross-surface
      component).

  SUBSCRIBE BAND (below content, full-pane width, `var(--paper)` bg, 64px padding,
    border-top 1px `var(--rule)`, centered):
    "Never miss an issue." — Fraunces 28px bold `var(--ink)`.
    Subscribe form (24px top): inline input + accent-colored button (same pattern as pub page hero).
    Social proof: DM Sans 12px `var(--mute)`, "Free · Weekly · Unsubscribe any time".

MOBILE (390px) — ARCHIVE/READING PAGE:
  No split-pane — single column. Instead:
    TOP BAR: Newsletter wordmark left + "Issue N°{N}" badge right.
    BELOW TOP BAR: a horizontal "Browse Archive" strip (full-width, `var(--paper)` bg,
      border-bottom 1px `var(--rule)`, 12px padding, overflow-x auto):
      A scrollable row of issue pills — each pill is "Issue {N}" DM Sans 12px, ghost border,
      border-radius: var(--radius-full), 6px 10px padding. Active pill: accent-color fill,
      white text. Replaces the left sidebar completely on mobile.
    HERO: collapses to a single-column stack (image full-width, quote below it).
    BODY: full-width, 16px horizontal padding.
    No sidebar collapse button needed (sidebar doesn't exist on mobile).

CONSTRAINTS:
  - The left sidebar is FIXED HEIGHT (100vh) and never scrolls with the right pane — each side
    has its own scroll container. This is a fundamental structural change from the current
    full-page layout of `/newsletter/[slug]/page.tsx`.
  - The sidebar's "Browse Archive" list is navigable without leaving the page — clicking an
    issue row performs client-side navigation (the right pane content changes, the sidebar
    stays). This requires converting the reading page from a Server Component to a Client
    Component (or a hybrid: server outer shell, client inner pane) — flag this in any
    implementation plan. The existing `page.tsx` fetches all sibling issues server-side
    (`allIssues` array) which is exactly what the sidebar list needs — no extra data fetch.
  - ACTIVE ROW accent fill uses the issue's own newsletter's accent: Culture Drop issues → 
    `var(--ochre)`, GetMeLit issues → `var(--gold)`. The sidebar color tells you which 
    newsletter you're in without needing a badge.
  - No `✳` premium-issue marker (DD uses this for Friends-only issues — we have no equivalent).
  - The "Who's writing?" / author section DD shows mid-newsletter is NOT included — per the
    standing product decision documented in §24's DEV 6.
  - ProgressBar (`components/ProgressBar`) remains — it should track scroll position of the
    RIGHT pane's overflow-y, not the window. Will need a ref passed to it.
  - ArticleComments renders below the body content, above the Subscribe Band.

Output 1 frame: split-pane reading page, Culture Drop issue active, sidebar open,
  hero with artwork visible, partial body content below.
```


---

## §25 — Newsletter Hub Page (`/newsletter`)

**Why this section exists:** The `/newsletter` hub is the programme's "front door" — it introduces
both Culture Drop and GetMeLit side by side, previews recent issues from both, shows the coming-soon
pipeline, and terminates in the combined archive with tab filtering. It is architecturally distinct
from the individual publication pages (`/newsletter/culture-drop`, `/newsletter/getmelit`) which
are single-newsletter mastheads built on `NewsletterPublicationPage.tsx` and covered in §24.

The hub currently uses a two-card layout (`nl-card--culturedrop` / `nl-card--getmelit`) that
predates the §24 design language — those cards have dark ink-background sections, wrapped form
cards, and inconsistent accent usage. This prompt replaces the entire hub page with a design that
is consistent with §24's pub-page language while serving the hub's specific job: making both
newsletters feel distinct and inviting within a single shared editorial surface.

**Verbatim marketing copy block (use as-is in all prompts below — do not paraphrase):**

> The Moveee Newsletter Programme. Two letters. One cultural obsession.
> Culture Drop is the weekly dispatch on contemporary global culture — one deep essay, curated
> picks, a music dispatch, and what's happening across Lagos, London, New York, and Accra.
> GetMeLit delivers a new story or poem to your inbox every weekday — and a fuller literary
> dispatch every Saturday, with new books, writing opportunities, and an author in the spotlight.
> Both free. Both essential. Culture Drop arrives every Tuesday; GetMeLit arrives daily, Mon–Sat.

> Culture Drop testimonials (verbatim, ★★★★★):
> "The first newsletter I've opened every week for a year. Essential."
> "Genuinely the most culturally aware newsletter in my inbox."
> "It's like having a brilliant friend brief you on everything that matters."

> GetMeLit testimonials (verbatim, ★★★★★):
> "GetMeLit is the only newsletter I actually look forward to receiving six days a week."
> "I've discovered more good fiction through GetMeLit than any other source."
> "Essential for anyone who wants to stay in the conversation about global literature."

> Coming-soon dispatches (copy verbatim):
> Culture Narratives Digest — Monthly · Starting Q3 2026 — A companion to our quarterly essay
>   publication. One excerpt, one behind-the-scenes note from the editor, and a reading list
>   extending each issue's themes.
> The Vendor Letter — Monthly · Starting Q4 2026 — A newsletter for makers, artisans, and
>   small-batch creators in the Moveee Lifestyle ecosystem. Sourcing, craft, pricing, and the
>   business of culture-led commerce.
> Origins Field Notes — Seasonal · Starting 2027 — Dispatches from resident editors on the
>   ground. The cities, the food, the things you can't Google. Sent before and during each
>   Origins journey season.

<!-- DEV 1: Hub page is `apps/site/app/newsletter/page.tsx`. It fetches via
`getNewslettersWithFallback(50, ...)`, filters out `announcements`, derives counts for the tab
badges (`cdCount`, `gmlCount`, `allCount`), and also derives `recentIssues` (first 3 issues of
Culture Drop only). The coming-soon cards use `GmlWaitlistForm` (takes `label` and `id` props).
No GraphQL query change is needed for this redesign — all data already comes from the same fetch. -->

<!-- DEV 2: The two-newsletter dual-showcase section (Frames 1/2 below) must NOT be two
independent instances of `NewsletterPublicationPage` — that component is designed for the full
single-newsletter pub page. The hub shows both newsletters in a shared layout, so this section
is built inline in `page.tsx` (or a new `NewsletterHubShowcase` server component) using the
`NL_META` data directly (`NL_META["culture-drop"]` and `NL_META["getmelit"]`). -->

<!-- DEV 3: The "email preview mock" panels (same concept as §24's hero panel) are purely
decorative `<div>` elements with static mocked copy — not real rendered email or iframes.
Content inside each mock panel can be hardcoded representative copy since it's illustrative,
not live data. Same visual treatment as §24 Frame 1: white card, 1px `var(--rule)` border,
`0 4px 24px rgba(0,0,0,0.08)` shadow, `border-radius: var(--radius-xl)`. Culture Drop card
has a 2° clockwise tilt; GetMeLit card has a 2° counter-clockwise tilt — mirrored,
so together they look like a fanned pair of letters in an inbox. -->

<!-- DEV 4: Coming-soon waitlist forms use `GmlWaitlistForm` from
`apps/site/components/GmlWaitlistForm.tsx`. This component handles its own form state and
submission — wrap it as-is, don't reimagine it. The only design choice is the visual container
around it (ghost border, `var(--paper)` tint, border-radius: `var(--radius-lg)`). -->

<!-- DEV 5: Archive section — all counts come from the same `newsletters` fetch (filtered by
`nlList`). The filter tab links use Next.js `<Link>` with `scroll={false}`:
- "All" → `/newsletter#archive`
- "Culture Drop" → `/newsletter/culture-drop` (pub page, NOT a filtered tab — clicking it
  navigates away to the pub page, per the existing behavior)
- "GetMeLit" → `/newsletter/getmelit` (same)
The "Culture Drop" and "GetMeLit" tabs are therefore navigation links to pub pages, not
in-page filter tabs. Only "All" stays on `/newsletter`. The archive section currently shows
the filtered `filtered` array from `searchParams?.list` — keep this, but redesign the rows
and tab visual treatment. -->

<!-- DEV 6: "Coming Soon" section — the three future newsletters are NOT registered lists yet
(no `nlList` values, no archive rows). They are purely marketing cards with a waitlist form.
Do not add them to the archive tabs or the filter. -->

### PROMPT 25 — Newsletter Hub Page (`/newsletter`) (Desktop 1440px + Mobile 390px)

```
FRAME 1 — NEWSLETTER HUB: DESKTOP (1440px, white bg)

SECTION 1 — HERO MASTHEAD (full-width, white bg, 80px vertical padding, border-bottom 1px
  `var(--rule)`):

  INNER (max-width 1100px, centered, flex column, align-items center, text-center):
    EYEBROW: "★ The Moveee Newsletter Programme" — DM Sans 11px uppercase bold `var(--mute)`,
      letter-spacing 1px, 0px bottom margin.
    HEADLINE (16px top): "Two newsletters. One cultural obsession." — Fraunces 52px bold
      `var(--ink)`, line-height 1.1, letter-spacing -0.5px. The word "obsession." in italic
      (`<em>obsession.</em>`).
    STANDFIRST (20px top): "Culture Drop for the weekly cultural deep dive. GetMeLit for a
      new story or poem every day. Both free. Both essential." —
      DM Sans 17px `var(--ink-soft)`, line-height 1.6, max-width 600px.
    BADGE ROW (24px top): inline flex, 16px gap, justify-content center:
      Two publication badge pills (border-radius: var(--radius-full), 10px 18px padding,
      border 1px solid):
        Culture Drop pill: `var(--ochre)` text (#c5491f), rgba(197,73,31,0.1) bg,
          `var(--ochre)` border. Label: "★ Culture Drop · Every Tuesday"
        GetMeLit pill: `var(--gold)` text (#b38238), rgba(179,130,56,0.1) bg,
          `var(--gold)` border. Label: "★ GetMeLit · Mon–Sat"
      Both pills are DM Sans 12px, no underline, link to `/newsletter/culture-drop` and
      `/newsletter/getmelit` respectively. On hover: filled bg (ochre or gold fill, white text).

SECTION 2 — DUAL NEWSLETTER SHOWCASE (full-width, `var(--paper)` bg, 80px vertical padding,
  border-bottom 1px `var(--rule)`):

  INNER (max-width 1140px, centered):

  TWO-COLUMN GRID (2 equal columns, 60px gap):

    LEFT COLUMN — CULTURE DROP CARD:
      (white bg, 1px `var(--rule)` border, border-radius: var(--radius-xl), 32px padding,
       position: relative)
      ACCENT BAR: 3px × 40px rect, `var(--ochre)`, at top-left before the heading (or as a
        left border bar on the outer card — not a full left border, just a short decorative bar).
      EYEBROW (above bar): "★ Culture Drop · Every Tuesday" — DM Sans 11px uppercase bold
        `var(--ochre)`, letter-spacing 0.6px.
      HEADLINE (12px top): "The weekly dispatch on contemporary global culture." —
        Fraunces 26px bold `var(--ink)`, line-height 1.2, max-width 320px.
      BODY (12px top): "One deep essay, curated picks, a music dispatch, and what's happening
        across Lagos, London, New York, and Accra. Written to make you think, not just scroll."
        — DM Sans 14px `var(--ink-soft)`, line-height 1.55.
      SUBSCRIBE FORM (20px top): inline row (8px gap): email input (flex:1, 11px 14px padding,
        DM Sans 14px, `var(--rule)` border, border-radius: var(--radius-md), white bg) + button
        ("Drop it in my inbox →", `var(--ochre)` bg, white text, DM Sans 14px bold, 12px 18px
        padding, border-radius: var(--radius-md), no border). Uses `GmlCTAForm` per DEV 2.
      NOTE (8px top): "Free · Weekly · Unsubscribe any time" — DM Sans 11px `var(--mute)`.
      EMAIL PREVIEW MOCK (24px top, 2° clockwise tilt via `transform: rotate(2deg)`):
        White card, 1px `var(--rule)` border, border-radius: var(--radius-lg), 0 4px 24px
        rgba(0,0,0,0.07) shadow. Height ~200px.
        TOP STRIP (10px 14px, border-bottom 1px `var(--rule)`, flex row):
          "CULTURE DROP" — DM Sans 10px uppercase bold `var(--ochre)`.
          Date "Tue, 1 Jul 2026" — DM Mono 10px `var(--mute)` right-aligned.
        CONTENT (14px 14px):
          ISSUE HEADLINE: "The Deep Dive: On the global afterlife of Afrobeat" —
            Fraunces 15px bold `var(--ink)`.
          BODY PREVIEW (6px top): 2 lines of DM Sans 11px `var(--ink-soft)` truncated with "…",
            max-width 100%.
          SECTION DIVIDER (8px top): "──── The List ────" — DM Mono 9px `var(--mute)`, center.
          PICKS (6px top): 3 short one-line picks DM Sans 11px `var(--ink)`, each starting
            with a "▸" glyph: e.g. "▸ Film — Éléonore", "▸ Book — Freshwater", "▸ Music — Fela".

    RIGHT COLUMN — GETMELIT CARD:
      (identical card container, same border-radius, padding, border)
      EYEBROW: "★ GetMeLit · Mon–Sat" — `var(--gold)`.
      HEADLINE: "A new story in your inbox, every day." — same Fraunces 26px.
      BODY: "A story or poem every weekday — plus a fuller literary dispatch every Saturday,
        with new books, writing opportunities, and an author in the spotlight."
        — same DM Sans 14px body style.
      SUBSCRIBE FORM: input + "Subscribe →" button, `var(--gold)` bg fill. Uses
        `NewsletterSubscribeWidget` with `list="getmelit"`.
      NOTE: "Free · Daily · Unsubscribe any time"
      EMAIL PREVIEW MOCK (2° counter-clockwise tilt, `transform: rotate(-2deg)`):
        Top strip: "GETMELIT DAILY" in `var(--gold)`, date "Wed, 8 Jul 2026" right.
        Body: mock daily issue — a short story title "SEA STORIES — Jide Salawu · Lolwe",
        2 lines of body text in DM Sans 11px ("Excerpted from Salawu's debut collection…"),
        then a muted divider "──── Read it here ────", then a full-URL read-link line in
        DM Mono 9px `var(--mute)`. This mimics the Mon–Fri daily format (story + link only).
        Below the mock, a small caption: "Saturday issues include Books, Opps & Spotlight."
        — DM Sans 10px `var(--mute)` italic, centered.

SECTION 3 — TESTIMONIALS BAND (full-width, white bg, 56px vertical padding, 1px border
  top+bottom `var(--rule)`):
  3-column grid (max-width 1000px centered, 40px gap):
  Each testimonial: ★★★★★ (DM Sans 13px, `var(--gold)` #b38238, 8px bottom) then quote text
    in DM Sans 14px italic `var(--ink)` line-height 1.5. No author name/avatar. From copy block:
    Col 1: "The first newsletter I've opened every week for a year. Essential." (Culture Drop)
    Col 2: "GetMeLit is the only newsletter I actually look forward to receiving six days a week." (GML)
    Col 3: "It's like having a brilliant friend brief you on everything that matters." (CD)

SECTION 4 — WHAT'S INSIDE (full-width, `var(--paper)` bg, 72px vertical padding, border-bottom
  1px `var(--rule)`):
  INNER (max-width 1100px, centered):
  SECTION LABEL (centered): "Inside the programme" — DM Sans 11px uppercase bold `var(--mute)`,
    letter-spacing 1px, 0 auto 24px.

  TWO-COLUMN LAYOUT (50%/50%, 60px gap):

    LEFT — CULTURE DROP PILLARS:
      HEADING: "Inside Culture Drop" — DM Sans 13px uppercase bold `var(--mute)`, letter-spacing
        1px.
      SUB (8px top): "Four sections, every issue. You always know what you're getting, but
        never what you'll find." — DM Sans 14px `var(--ink-soft)`, 12px bottom.
      PILLAR ROWS (4 rows, 0px gap, each 14px top+bottom padding, border-bottom 1px `var(--rule)`):
        Each row: 4px wide × full-height left bar in rgba(197,73,31,0.5) + 12px left padding
          then: TITLE — DM Sans 14px bold `var(--ink)` + DESC — DM Sans 13px `var(--ink-soft)`,
          line-height 1.4, 2px top. Rows for "The Deep Dive", "The List", "What's Playing",
          "The Calendar" — use NL_META["culture-drop"].pillars verbatim for name and desc.

    RIGHT — GETMELIT PILLARS:
      HEADING: "Inside GetMeLit" — same style.
      SUB: same copy pattern.
      PILLAR ROWS (4 rows, same structure, left bar rgba(179,130,56,0.5) — gold family).
        Rows: "Daily Stories", "Books", "Opps", "Spotlight" from NL_META["getmelit"].pillars.
        The first row ("Daily Stories") carries a "Daily" label not "Sat" — it is the Mon–Fri
        delivery; the remaining 3 have "Sat" to signal the Saturday issue.

SECTION 5 — RECENT ISSUES (full-width, white bg, 72px vertical padding):
  INNER (max-width 1100px, centered):
  SECTION HEADER (flex row, space-between, border-bottom 1px `var(--rule)`, 0 0 24px):
    "Recent issues" — DM Sans 11px uppercase bold `var(--mute)`.
    "See full archive →" — DM Sans 13px `var(--ochre)`, underline on hover, href="#archive".
  3-COLUMN GRID (24px gap) of issue preview cards (white fill, 1px `var(--rule)` border,
    border-radius: var(--radius-lg), 20px padding):
    LIST BADGE (top, `var(--ochre)` pill or `var(--gold)` pill per issue list — see §24
      Frame 3 for badge style): e.g. "Culture Drop".
    ISSUE NUM ROW (8px top): "Issue N°{N}" DM Mono 11px `var(--mute)` left, date right.
    HEADLINE (10px top): Fraunces 17px bold `var(--ink)`, 2 lines max.
    EXCERPT (8px top): DM Sans 13px `var(--ink-soft)`, 3 lines max.
    CTA (16px top): "Read this issue →" DM Sans 12px `var(--ochre)` (for CD issues) or
      `var(--gold)` (for GML issues).
  Data: the 3 most recent issues from `recentIssues` (Culture Drop only currently — the
    hub page's own `recentIssues` slice already provides these).

SECTION 6 — COMING SOON (full-width, `var(--paper)` bg, 72px vertical padding, border-top
  1px `var(--rule)`):
  INNER (max-width 1100px, centered):
  SECTION LABEL (centered): "The Moveee Newsletter Programme" — DM Sans 11px uppercase bold
    `var(--mute)`, letter-spacing 1px, 0 auto 8px.
  HEADING (centered, 8px top): "More dispatches, coming soon" — Fraunces 32px bold `var(--ink)`,
    centered. "coming soon" in italic.
  SUBHEAD (centered, 12px top, 48px bottom): "Culture Drop and GetMeLit are just the start. We're
    building a family of newsletters for different appetites — each one as considered as the last."
    — DM Sans 15px `var(--ink-soft)`, max-width 560px, centered.
  3-COLUMN GRID (24px gap):
    Each coming-soon card (white bg, 1px `var(--rule)` border, border-radius: var(--radius-lg),
      24px padding):
      CADENCE TAG (top): e.g. "Monthly · Starting Q3 2026" — DM Mono 11px `var(--mute)`.
      TITLE (10px top): Fraunces 22px bold `var(--ink)`. Use exact names from the copy block:
        "Culture Narratives Digest", "The Vendor Letter", "Origins Field Notes".
      DESC (12px top): DM Sans 13px `var(--ink-soft)`, line-height 1.5. Use verbatim copy.
      WAITLIST FORM (20px top): `GmlWaitlistForm` component rendered here (per DEV 4) — it
        renders its own email input + "Join waitlist" button. Wrap in no additional card/div.

SECTION 7 — FULL ARCHIVE (full-width, white bg, 64px top padding, id="archive"):
  ARCHIVE HEADER (max-width 1100px, centered, border-bottom 1px `var(--rule)`, pb 16px, mb 24px):
    FLEX ROW: "Full Archive" DM Sans 11px uppercase bold `var(--mute)` left, TAB GROUP right:
      Three tab links — "All {allCount}" · "Culture Drop {cdCount}" · "GetMeLit {gmlCount}".
      Each tab: DM Sans 13px, 8px 14px padding.
      "All" tab is always the active tab on this page (the other two navigate away to pub pages).
      ACTIVE TAB: border-bottom 2px `var(--ochre)`, `var(--ink)` text.
      INACTIVE TABS: `var(--mute)` text, no border. On hover: `var(--ink)` text.
      Count span: DM Mono 11px `var(--mute)`, 4px left margin.

  ISSUE ROWS (max-width 1100px, centered):
    Each `.digest-archive-row` (per DEV 5 — existing class, new visual treatment):
      Full-width flex row, 16px top+bottom padding, border-bottom 1px `var(--rule)`, 12px gap:
        ISSUE NUMBER: left-padded "001" — DM Mono 13px `var(--mute)`, flex-shrink 0, width 36px.
        DATE: "1 Jul 2026" — DM Mono 12px `var(--mute)`, flex-shrink 0, width 90px.
        TITLE: Fraunces 15px `var(--ink)`, flex:1.
        LIST BADGE: pill (border-radius: var(--radius-full), 6px 10px, DM Sans 11px):
          Culture Drop: `var(--ochre)` text, rgba(197,73,31,0.08) bg.
          GetMeLit: `var(--gold)` text, rgba(179,130,56,0.08) bg.
        TOPIC TAG (optional): existing `.digest-tag` pill for the first `cultureInterests` node.
        ARROW: "→" DM Sans 13px `var(--mute)`, flex-shrink 0.
      HOVER: row bg → `var(--paper)` (#f3ece0), title color → the issue's accent (`var(--ochre)`
        or `var(--gold)` depending on nlList), transition 0.1s ease.

CONSTRAINTS:
  - Only `#ffffff` (white) and `var(--paper)` (#f3ece0) as section backgrounds. No `var(--ink)`.
    Section alternation: Masthead=white, Dual Showcase=paper, Testimonials=white,
    What's Inside=paper, Recent Issues=white, Coming Soon=paper, Archive=white.
  - Accent colors: `var(--ochre)` (#c5491f) exclusively for Culture Drop; `var(--gold)` (#b38238)
    exclusively for GetMeLit. On the hub, both appear side by side — do not mix them.
  - The dual newsletter cards (Section 2) are the primary CTA surface. Section 1's hero has no
    subscribe form — only the publication badge pills. The hero's job is to introduce the programme,
    not capture emails; the dual showcase cards below that are where email capture happens.
  - "Coming Soon" cards do NOT have accent color bars/dots — they are neutral (no newsletter
    identity assigned yet). The `GmlWaitlistForm` button should use `var(--ink)` fill for these
    cards, not ochre or gold.
  - Apply `var(--radius-*)` scale throughout. No hardcoded pixel values for radii.
  - The email preview mock panels use the exact content mock data specified — do not substitute
    or abbreviate. Both panels must be visible on first load without scrolling on desktop.
  - All copy from the verbatim marketing block above — do not paraphrase.

Output 1 frame: hub page desktop, full scroll showing all 7 sections.
```

---

```
FRAME 2 — NEWSLETTER HUB: MOBILE (390px)

SECTION 1 — HERO MASTHEAD (24px horizontal padding, 48px top, 40px bottom, border-bottom
  1px `var(--rule)`):
  EYEBROW: 11px uppercase DM Sans `var(--mute)` + "★ The Moveee Newsletter Programme".
  HEADLINE (12px top): Fraunces 34px bold `var(--ink)`, line-height 1.1. "obsession." italic.
  STANDFIRST (12px top): DM Sans 15px `var(--ink-soft)`, line-height 1.55.
  BADGE ROW (20px top): stacked (flex-col, 8px gap) instead of inline — each badge pill
    full-width, centered text. Same pill style as desktop but block-level.

SECTION 2 — DUAL SHOWCASE (single column, `var(--paper)` bg, 40px vertical padding):
  CARDS: Culture Drop card first, GetMeLit card below, full-width, 20px gap between.
  Each card: 20px padding, same border-radius / border / bg as desktop.
  EMAIL MOCK: below the subscribe form, full-width (no horizontal margins beyond card padding),
    0° tilt on mobile (no rotation — flat). Height ~170px.

SECTION 3 — TESTIMONIALS (single-column, white bg, 40px vertical padding):
  3 testimonial cards stacked (full-width, 16px gap between), each with ★★★★★ + quote text.
  Each has `var(--paper)` bg, 16px padding, border-radius: var(--radius-lg) — light card
  treatment to distinguish from the plain stacked text of the desktop columns.

SECTION 4 — WHAT'S INSIDE (single column, `var(--paper)` bg, 40px vertical padding):
  SECTION LABEL centered.
  CULTURE DROP BLOCK FIRST (full-width): heading + sub + 4 pillar rows.
  16px vertical gap between blocks.
  GETMELIT BLOCK SECOND: same pattern, gold accent bars.

SECTION 5 — RECENT ISSUES (24px horizontal padding, white bg, 40px vertical padding):
  HEADER: section label left + "See all →" right (same flex row, small).
  ISSUE CARDS: single-column stack, full-width, 12px gap. Same card as desktop.

SECTION 6 — COMING SOON (`var(--paper)` bg, 40px vertical padding):
  HEADING centered (28px).
  3 coming-soon cards stacked, full-width, 12px gap.

SECTION 7 — ARCHIVE (24px horizontal padding, white bg, 40px vertical padding):
  TAB ROW: 3 tabs in a scrollable overflow-x row (each tab a compact pill-style chip,
    border-radius: var(--radius-full), 8px 14px, DM Sans 12px — same pattern as the
    mobile filter chips in other pages), flush left, horizontal scroll.
  ISSUE ROWS: same data but date column HIDDEN on mobile — just number + title + badge + arrow.
    Number: 28px wide. Arrow: 16px. Badge inline-block next to title.

Output 1 frame: hub page mobile, full scroll.
```
