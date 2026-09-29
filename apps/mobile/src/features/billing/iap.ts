// Google Play Billing wrapper for the Moveee Pro upgrade — Android only.
// iOS keeps directing users to the web checkout (see MembershipScreen.tsx);
// wiring up StoreKit is a separate piece of work, not in scope here.
//
// Server-side verification lives in
// culture-community/includes/core/class-culture-google-play-billing.php —
// a purchase is never trusted on the client's say-so alone. See CLAUDE.md
// "Google Play Billing" for the full request/verify/acknowledge flow.
//
// react-native-iap v14 is a rewrite on Nitro modules, not a version bump
// from the v12 this originally targeted. The renames that matter here:
//   getSubscriptions({skus})      -> fetchProducts({skus, type: 'subs'})
//   requestSubscription(...)      -> requestPurchase({type:'subs', request:{android}})
//   Subscription (type)           -> ProductSubscription
//   product.productId             -> product.id
//   product.subscriptionOfferDetails -> product.subscriptionOfferDetailsAndroid
// Billing Library comes in transitively via io.github.hyochan.openiap:
// openiap-google 1.3.28, which pins billing-ktx 8.3.0 — this is what clears
// Google Play's "must use Billing 8" rejection.
import { Platform } from "react-native";
import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
} from "react-native-iap";
import type { ProductSubscription, Purchase, PurchaseError } from "react-native-iap";
import { api, MOBILE_API } from "../../api/client";
import { MOVEEE_PRO_SKUS } from "../../config/iap";

export async function initIAP(): Promise<void> {
  if (Platform.OS !== "android") return;
  await initConnection();
  // v12's flushFailedPurchasesCachedAsPendingAndroid() has no v14 equivalent;
  // the Nitro rewrite reconciles pending purchases internally on connect.
}

export async function endIAP(): Promise<void> {
  if (Platform.OS !== "android") return;
  await endConnection().catch(() => null);
}

export async function getProSubscriptions(): Promise<ProductSubscription[]> {
  if (Platform.OS !== "android") return [];
  const products = await fetchProducts({ skus: MOVEEE_PRO_SKUS, type: "subs" });
  return (products ?? []) as ProductSubscription[];
}

/** Android Billing Library v5+ requires an explicit offerToken per SKU — pulled
 * from the subscription's own offer details rather than hardcoded, so this
 * keeps working if a promotional offer is ever added in Play Console. Takes
 * the first offer (our subscriptions have exactly one base plan, no promos). */
function firstOfferToken(subscription: ProductSubscription): string | null {
  const offers = (subscription as any)?.subscriptionOfferDetailsAndroid;
  return Array.isArray(offers) && offers.length > 0 ? offers[0].offerToken : null;
}

/** Store-formatted price string (e.g. "£3.99") straight from Play, so it always
 * matches what the native purchase sheet will actually charge — never
 * compute/guess this locally. Prefers the first pricing phase of the first
 * offer (what the user is actually charged first), falling back to the
 * product's own displayPrice. */
export function formatSubscriptionPrice(subscription: ProductSubscription): string | null {
  const offers = (subscription as any)?.subscriptionOfferDetailsAndroid;
  const phase = offers?.[0]?.pricingPhases?.pricingPhaseList?.[0];
  return phase?.formattedPrice ?? (subscription as any)?.displayPrice ?? null;
}

/**
 * Starts the native Play Billing purchase sheet for a subscription SKU.
 * Resolves once the purchase has been verified with our backend and Pro has
 * been granted — rejects on cancellation, a purchase error, or failed
 * server-side verification.
 *
 * requestPurchase is event-based, not promise-based: the outcome arrives via
 * the listeners below, so the promise this returns is what bridges the two.
 */
export function purchaseProSubscription(subscription: ProductSubscription): Promise<void> {
  return new Promise((resolve, reject) => {
    const sku = subscription.id;
    let settled = false;
    let updateSub: { remove: () => void } | null = null;
    let errorSub: { remove: () => void } | null = null;

    const settle = (fn: () => void) => {
      if (settled) return;
      settled = true;
      updateSub?.remove();
      errorSub?.remove();
      fn();
    };

    updateSub = purchaseUpdatedListener(async (purchase: Purchase) => {
      // Listener fires for any pending purchase, not just ones from this
      // call — ignore anything that isn't the SKU we just requested.
      if ((purchase as any).productId !== sku) return;

      try {
        const purchaseToken = (purchase as any).purchaseToken;
        if (!purchaseToken) throw new Error("No purchase token returned.");

        await api.post(`${MOBILE_API}/billing/verify-google-play`, {
          product_id: (purchase as any).productId,
          purchase_token: purchaseToken,
        });

        await finishTransaction({ purchase, isConsumable: false });
        settle(resolve);
      } catch (e) {
        settle(() => reject(e));
      }
    });

    errorSub = purchaseErrorListener((error: PurchaseError) => {
      settle(() => reject(error));
    });

    const offerToken = firstOfferToken(subscription);
    if (!offerToken) {
      settle(() => reject(new Error("This subscription has no available offer.")));
      return;
    }

    requestPurchase({
      type: "subs",
      request: {
        android: {
          skus: [sku],
          subscriptionOffers: [{ sku, offerToken }],
        },
      },
    }).catch((e) => settle(() => reject(e)));
  });
}
