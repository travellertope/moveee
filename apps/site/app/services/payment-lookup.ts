// Server-side price resolver for /services checkout — the single place
// that turns (market, section, item name) into a real, trusted charge
// amount. Used exclusively by app/api/services/payment/initiate/route.ts,
// which never accepts a price from the client: the browser only ever sends
// identifiers (which package, one-time vs. subscription), and this file
// looks the real price up from market-data.ts/partnership-pages.ts — the
// same data the pricing cards themselves render from — before it's ever
// forwarded to WordPress. Do not add a code path that accepts a raw amount
// from request input; that would let a tampered request buy any package at
// any price.
import { getMarket, type RateCard, type Section, type TierPackage } from "./market-data";
import { getPartnershipCategory } from "./partnership-pages";

export type PaymentKind = "one_time" | "subscription";
export type Currency = "GBP" | "USD" | "NGN";

export type ResolvedPrice = {
  amount: number; // major units, e.g. 600 for £600
  currency: Currency;
  label: string;
};

const CURRENCY_BY_SYMBOL: Record<string, Currency> = { "£": "GBP", "$": "USD", "₦": "NGN" };

function detectCurrency(raw: string): Currency | null {
  for (const [symbol, code] of Object.entries(CURRENCY_BY_SYMBOL)) {
    if (raw.includes(symbol)) return code;
  }
  return null;
}

// RateCard/TierPackage prices are free-form display strings ("£600",
// "₦200,000", "80k", "Free", "From £1,000") — only a genuinely fixed price
// is ever payable. "Free" needs no charge; "From X" is a starting price for
// bespoke work that hasn't been scoped/quoted yet, so it stays an email
// enquiry rather than a checkout.
function parseAmount(raw: string): number | null {
  const trimmed = raw.trim();
  if (/^free$/i.test(trimmed)) return null;
  if (/^from\s/i.test(trimmed)) return null;

  const stripped = trimmed.replace(/[^0-9.kK]/g, "");
  if (!stripped) return null;

  const isThousands = /k$/i.test(stripped);
  const numeric = parseFloat(isThousands ? stripped.slice(0, -1) : stripped);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;

  return isThousands ? numeric * 1000 : numeric;
}

// Client-safe payability checks — used by the pricing card components to
// decide whether to render a real "Pay"/"Subscribe" button (query-string
// link into /services/checkout) or fall back to the original mailto
// enquiry link, without duplicating the parsing rules above.
export function isPayableCard(card: RateCard): boolean {
  return detectCurrency(card.price) !== null && parseAmount(card.price) !== null;
}

export function isPayableTier(pkg: TierPackage, kind: PaymentKind): boolean {
  if (kind === "subscription" && !pkg.ctaSecondary) return false;
  return CURRENCY_BY_SYMBOL[pkg.currency] !== undefined && parseAmount(pkg.price) !== null;
}

function findInSection(section: Section, itemName: string, kind: PaymentKind): ResolvedPrice | null {
  if (section.kind === "cards" || section.kind === "mixed") {
    const card: RateCard | undefined = section.cards.find((c) => c.name === itemName);
    if (card) {
      // RateCards (Sponsored Content, Lifestyle tiers, Happenings, etc.)
      // are always one-off project fees — never a recurring plan.
      if (kind === "subscription") return null;
      const currency = detectCurrency(card.price);
      const amount = parseAmount(card.price);
      if (!currency || !amount) return null;
      return { amount, currency, label: card.name };
    }
  }
  if (section.kind === "tiers" || section.kind === "mixed") {
    const pkg = section.service.packages.find((p) => p.name === itemName);
    if (pkg) {
      // Only tiers that actually offer a "Subscribe to Monthly Plan" CTA
      // support the subscription flow — everything else is buy-once only.
      if (kind === "subscription" && !pkg.ctaSecondary) return null;
      const currency = CURRENCY_BY_SYMBOL[pkg.currency];
      const amount = parseAmount(pkg.price);
      if (!currency || !amount) return null;
      return { amount, currency, label: pkg.name };
    }
  }
  return null;
}

export function resolveSectionPayment(
  market: string,
  sectionId: string,
  itemName: string,
  kind: PaymentKind
): ResolvedPrice | null {
  const data = getMarket(market);
  if (!data) return null;
  const section = data.sections.find((s) => s.id === sectionId);
  if (!section) return null;
  return findInSection(section, itemName, kind);
}

export function resolvePartnershipPayment(
  subCategoryId: string,
  itemName: string,
  kind: PaymentKind
): ResolvedPrice | null {
  const cat = getPartnershipCategory(subCategoryId);
  if (!cat) return null;
  const pkg = cat.service.packages.find((p) => p.name === itemName);
  if (!pkg) return null;
  if (kind === "subscription" && !pkg.ctaSecondary) return null;
  const currency = CURRENCY_BY_SYMBOL[pkg.currency];
  const amount = parseAmount(pkg.price);
  if (!currency || !amount) return null;
  return { amount, currency, label: pkg.name };
}
