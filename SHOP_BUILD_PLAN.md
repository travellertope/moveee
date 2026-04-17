# Shop Pages Build Plan — WooCommerce + Multivendor Integration

## What This Is
Building out the Moveee Lifestyle shop — a headless WooCommerce frontend matching the HTML design prototypes in `/designs/shop_index.html` and `/designs/shop_product.html`.

---

## Architecture

**Stack:**
- Next.js 14 App Router (server components + client components)
- WordPress CMS at `cms.themoveee.com` via WPGraphQL
- WooCommerce products exposed via WPGraphQL for WooCommerce plugin
- Custom `moveee-graphql-bridge.zip` plugin bridges extra fields

**Shop routes (already exist):**
- `/shop` → `app/shop/page.tsx` → `ShopArchiveWrapper`
- `/shop/[slug]` → `app/shop/[slug]/page.tsx`
- `/shop/category/[slug]` → `ShopArchiveWrapper` with `category` prop
- `/shop/brand/[slug]` → `ShopArchiveWrapper` with `brand` prop
- `/shop/tag/[slug]` → `ShopArchiveWrapper` with `tag` prop

---

## ✅ Done

### 1. Extended GraphQL Product Fragment (`lib/wp.ts`)

Added to `PRODUCT_FIELDS_FRAGMENT`:
- `productCategories { nodes { name slug } }` — for category display and filter routing
- `productTags { nodes { name slug } }` — for "New" badge detection
- `metaData { key value }` — catch-all for vendor name, city, description, ACF fields
- `stockStatus`, `stockQuantity`, `onSale` on `SimpleProduct`
- `stockStatus`, `onSale` on `VariableProduct`
- `variations(first: 12) { nodes { price stockStatus attributes { nodes { name value } } } }` on `VariableProduct`

Added new query `GET_PRODUCT_CATEGORIES`:
```graphql
query GetProductCategories {
  productCategories(first: 20, where: { hideEmpty: true }) {
    nodes { name slug count image { sourceUrl altText } }
  }
}
```

---

## ❌ Still To Do

### 2. `app/shop/shop.css` *(next step)*

New CSS file covering all shop-specific styles from both prototypes. Key sections:

**Shop Archive styles:**
- `.shop-head` — large h1 ("Things worth *living with.*"), vetting pledge dark card, ghost watermark "014"
- `.shop-filter-bar` — sticky filter bar with category tabs + sort select + view toggle + count
- `.shop-ticker` — dark scrolling marquee band
- `.shop-featured` — 2-col editorial picks (1 large 4/5 card + 3 stacked 16/9 cards)
- `.shop-ed-bridge` — dark editorial bridge band (3-col: label | title | CTA)
- `.shop-product-grid` — 3-col product card grid
- `.pcard` — product card with: image 4/5 aspect, vetted pip, new pip, sold-out overlay, vendor tag (mono ochre), name (serif), price, hover-reveal add-to-cart button
- `.shop-cat-grid` — 6-col category portrait tiles with gradient overlay
- `.shop-vendor-cards` — 4-col vendor card grid (image, vetted label, name, location, desc, count)
- `.shop-member-band` — 2-col membership pitch with 4 perks grid
- `.shop-origins-bridge` — dark 2-col origins crosslink

**Product Detail styles:**
- `.sp-breadcrumb` — breadcrumb row with prev/next nav
- `.sp-product-hero` — 2-col layout (1.15fr gallery / 0.85fr info)
- `.sp-gallery-wrap` / `.sp-main-image` / `.sp-thumbnails` / `.sp-thumb` — sticky gallery + 4 thumbnails
- `.sp-vendor-link` — ochre mono with leading rule pseudo-element
- `.sp-product-name` — large Fraunces serif, italic em in ochre
- `.sp-price-row` / `.sp-price` / `.sp-price-sub` / `.sp-price-member`
- `.sp-selector-group` / `.sp-swatches` / `.sp-swatch` / `.sp-sizes` / `.sp-size-btn`
- `.sp-cta-row` / `.sp-btn-add` / `.sp-btn-save` / `.sp-delivery-note`
- `.sp-accordions` / `.sp-acc` / `.sp-acc-header` / `.sp-acc-body`
- `.sp-seen-in` — dark "As Seen In" editorial bridge
- `.sp-story` — maker story section (2-col: image + editorial text with drop-cap)
- `.sp-process` — 4-step process grid on paper-deep bg
- `.sp-vendor-profile` — vendor 2-col with stats grid
- `.sp-more-from` — 4-col related products grid

**Responsive breakpoints:** 1200px, 900px, 640px

---

### 3. `app/shop/components/ShopFilterBar.tsx` (client component)

```tsx
"use client"
// Props: categories[], activeCategory, productCount
// Category tabs → <Link href="/shop"> and <Link href="/shop/category/[slug]">
// Active tab detection via prop (set from URL in server component)
// Client state: viewMode ("grid" | "list"), sort order
// View toggle buttons: ⊞ grid / ☰ list
```

---

### 4. `app/shop/ShopArchiveWrapper.tsx` (rewrite)

Full server component replacing current placeholder. Sections:
1. Shop head masthead
2. `<ShopFilterBar>` with fetched categories
3. Ticker marquee
4. Featured editorial picks (first 3 products)
5. Editorial bridge (static "As Seen In")
6. Main product grid (all products as `.pcard`)
7. Second editorial bridge
8. Category grid (fetched or 6 hardcoded fallbacks)
9. Vendor strip — **TODO: wire to multivendor plugin API** (currently static from design)
10. Connect member band
11. Origins bridge

**Vendor data pattern:**
```ts
const meta = (data: any[], key: string) =>
  data?.find((m: any) => m.key === key)?.value ?? null;
const vendorName = meta(p.metaData, '_vendor_name') || meta(p.metaData, 'vendor_store_name') || '';
```

---

### 5. Client Components for Product Page

**`app/shop/[slug]/ProductGallery.tsx`**
- `"use client"` — state: `activeIdx`
- Props: `images[]`, `productName`
- Main 4/5 image with vetted seal + counter, 4 thumbnails below
- Clicking thumbnail swaps main image

**`app/shop/[slug]/ProductSelectors.tsx`**
- `"use client"` — state: `selectedColor`, `selectedSize`, `saved`
- Props: `productId`, `price`, `variations?`
- Extracts color/size from variation attributes; falls back to 4 static swatches / 3 size buttons
- "Add to Cart" → `https://cms.themoveee.com/?add-to-cart=${productId}`
- Save/wishlist button toggles ♡ ↔ ♥

**`app/shop/[slug]/ProductAccordion.tsx`**
- `"use client"` — state: `openIdx`
- Props: `items: { title, content: ReactNode }[]`
- Smooth max-height transition, + icon rotates on open

---

### 6. `app/shop/[slug]/page.tsx` (rewrite)

Full server component. Fetches product + related products. Renders:
- Breadcrumb
- Product hero (gallery + info with `<ProductGallery>` + `<ProductSelectors>`)
- `<ProductAccordion>` with 4 sections
- "As Seen In" editorial bridge (static for now — TODO: link via ACF `_as_seen_in_post_id`)
- Maker story section
- Process steps (static 4-step — TODO: wire to ACF `process_steps`)
- Vendor profile with stats (TODO: wire to multivendor vendor API)
- "More from Studio" (fetches 5 products same category, filters out current)

---

## WooCommerce / Multivendor Integration Notes

### What works now (via WPGraphQL for WooCommerce):
- Product listing with price, images, categories, tags, stock status
- Category/tag/brand filtering via GraphQL `where` clause
- Product variations with attributes (colors, sizes)

### What needs the `moveee-graphql-bridge.zip` plugin active on CMS:
- Vendor/maker data (name, city, description, vendor number)
- ACF custom fields: `maker_story`, `care_instructions`, `process_steps`, `as_seen_in_post_id`
- Vendor product counts

### Cart integration:
- Currently: "Add to Cart" links to `https://cms.themoveee.com/?add-to-cart={databaseId}`
- Future: Implement WooCommerce Store API (`/wp-json/wc/store/v1/cart/add-item`) with cross-domain session cookie handling

### Multivendor plugin:
- No Dokan/WCFM plugin files in this repo
- Vendor concept is editorial — each maker is a "vetted vendor"
- Vendor data stored in WooCommerce product metaData
- Full marketplace features (vendor dashboards, commissions) are out of scope for this phase

---

## File Checklist

| File | Status |
|------|--------|
| `lib/wp.ts` — extended product fragment + GET_PRODUCT_CATEGORIES | ✅ Done |
| `app/shop/shop.css` | ❌ Todo |
| `app/shop/components/ShopFilterBar.tsx` | ❌ Todo |
| `app/shop/ShopArchiveWrapper.tsx` | ❌ Todo |
| `app/shop/[slug]/ProductGallery.tsx` | ❌ Todo |
| `app/shop/[slug]/ProductSelectors.tsx` | ❌ Todo |
| `app/shop/[slug]/ProductAccordion.tsx` | ❌ Todo |
| `app/shop/[slug]/page.tsx` | ❌ Todo |
