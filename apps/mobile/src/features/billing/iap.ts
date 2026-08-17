// Google Play Billing wrapper for the Moveee Pro upgrade — Android only.
// iOS keeps directing users to the web checkout (see MembershipScreen.tsx);
// wiring up StoreKit is a separate piece of work, not in scope here.
//
// Server-side verification lives in
// culture-community/includes/core/class-culture-google-play-billing.php —
// a purchase is never trusted on the client's say-so alone. See CLAUDE.md
// "Google Play Billing" for the full request/verify/acknowledge flow.
import { Platform } from "react-native";
import {
  initConnection,
  endConnection,
  getSubscriptions,
  requestSubscription,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  flushFailedPurchasesCachedAsPendingAndroid,
} from "react-native-iap";
import type { Subscription, SubscriptionPurchase, PurchaseError } from "react-native-iap";
import { api, MOBILE_API } from "../../api/client";
import { MOVEEE_PRO_SKUS } from "../../config/iap";

export async function initIAP(): Promise<void> {
  if (Platform.OS !== "android") return;
  await initConnection();
  // Clears out purchases stuck pending from a previous crashed/killed
  // session before Google auto-refunds them for going unacknowledged.
  await flushFailedPurchasesCachedAsPendingAndroid().catch(() => null);
}

export async function endIAP(): Promise<void> {
  if (Platform.OS !== "android") return;
  await endConnection().catch(() => null);
}

export async function getProSubscriptions(): Promise<Subscription[]> {
  if (Platform.OS !== "android") return [];
  return getSubscriptions({ skus: MOVEEE_PRO_SKUS });
}

/** Android Billing Library v5+ requires an explicit offerToken per SKU — pulled
 * from the subscription's own offer details rather than hardcoded, so this
 * keeps working if a promotional offer is ever added in Play Console. Takes
 * the first offer (our subscriptions have exactly one base plan, no promos). */
function firstOfferToken(subscription: Subscription): string | null {
  const offers = (subscription as any)?.subscriptionOfferDetails;
  return Array.isArray(offers) && offers.length > 0 ? offers[0].offerToken : null;
}

/** Store-formatted price string (e.g. "£3.99") for the subscription's first
 * pricing phase, straight from Play so it always matches what the native
 * purchase sheet will actually charge — never compute/guess this locally. */
export function formatSubscriptionPrice(subscription: Subscription): string | null {
  const offers = (subscription as any)?.subscriptionOfferDetails;
  const phase = offers?.[0]?.pricingPhases?.pricingPhaseList?.[0];
  return phase?.formattedPrice ?? null;
}

/**
 * Starts the native Play Billing purchase sheet for a subscription SKU.
 * Resolves once the purchase has been verified with our backend and Pro has
 * been granted — rejects on cancellation, a purchase error, or failed
 * server-side verification.
 */
export function purchaseProSubscription(subscription: Subscription): Promise<void> {
  return new Promise((resolve, reject) => {
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

    updateSub = purchaseUpdatedListener(async (purchase: SubscriptionPurchase) => {
      // Listener fires for any pending purchase, not just ones from this
      // call — ignore anything that isn't the SKU we just requested.
      if (purchase.productId !== subscription.productId) return;

      try {
        const purchaseToken = (purchase as any).purchaseToken;
        if (!purchaseToken) throw new Error("No purchase token returned.");

        await api.post(`${MOBILE_API}/billing/verify-google-play`, {
          product_id: purchase.productId,
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

    requestSubscription({
      subscriptionOffers: [{ sku: subscription.productId, offerToken }],
    }).catch((e) => settle(() => reject(e)));
  });
}
