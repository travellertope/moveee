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
> Test your knowledge of African and diaspora culture — music, film, literature,
> history, and everything in between.

**Game cards (name / tagline / badge / difficulty / rounds):**
1. Who Said It? — "A quote appears — you guess who said it. 10 rounds drawn live
   from our verified quote archive." · Quotes · Mixed difficulty · 10 rounds
2. Culture Trivia — "10 daily questions spanning Afrobeats, Nollywood, literature,
   history, and African art. Fresh questions every day." · Daily · Easy to Hard ·
   10 questions
3. Daily Sudoku — "One 9×9 grid a day — same puzzle for every player worldwide. No
   luck, pure logic." · Puzzle · Medium · 1 daily grid
4. Daily Crossword — "A new African culture mini-crossword every day. Test your
   knowledge of people, places, and traditions." · Culture · Mixed · 1 daily puzzle

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
including a House Fellowship link that's conditional on cluster membership) than
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
My House Fellowship (if clustered) / Find your House Fellowship (if not) · Refer
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
   one CONDITIONAL row — "My House Fellowship" (links to `/cluster/{id}`) if the
   member already belongs to an active, non-archived cluster, or "Find your House
   Fellowship" (links to `/connect/people`) if not. "My Events" is itself
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
- "My House Fellowship" vs "Find your House Fellowship" in Quick Links is
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
globally and no visible "N members" count. It also renders a `HouseFellowship`
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

<!-- DEV 3: A `HouseFellowship` module renders above the directory grid for
logged-in visitors only — this is the House Fellowship / Literati Connect
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
- HouseFellowship band placeholder (logged-in only) per <!-- DEV 3 -->
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
   House Fellowship feature and have no mobile-catalog precedent in PROMPT
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
