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

