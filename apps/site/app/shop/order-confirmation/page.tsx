"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import "../checkout/checkout.css";

interface OrderStatusResponse {
  status?: string;
  id?: number;
  total?: number;
  currency?: string;
  items?: { name: string; quantity: number; total: number }[];
}

type Phase = "polling" | "confirmed" | "timeout" | "error";

const MAX_ATTEMPTS = 40; // ~2 minutes at 3s intervals

function OrderConfirmationContent() {
  const params = useSearchParams();
  const reference = params.get("shop_ref") ?? "";
  const { status: sessionStatus } = useSession();

  const [phase, setPhase] = useState<Phase>("polling");
  const [order, setOrder] = useState<OrderStatusResponse | null>(null);
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (!reference || sessionStatus !== "authenticated") return;

    let cancelled = false;
    const poll = async () => {
      attemptsRef.current += 1;
      try {
        const res = await fetch(`/api/checkout/order-by-reference/${encodeURIComponent(reference)}`, {
          cache: "no-store",
        });
        const data: OrderStatusResponse = await res.json();
        if (cancelled) return;

        if (res.ok && data.status && data.status !== "pending") {
          setOrder(data);
          setPhase("confirmed");
          return;
        }
      } catch {
        // keep polling — order may not exist yet if the webhook is delayed
      }

      if (attemptsRef.current >= MAX_ATTEMPTS) {
        setPhase("timeout");
        return;
      }
      setTimeout(poll, 3000);
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [reference, sessionStatus]);

  // No client-side cart clearing needed here — the cart lives server-side
  // (WooCommerce Store API) and is already emptied by the payment webhook
  // once the order is confirmed. CartContext re-fetches on its own next mount.

  if (!reference) {
    return (
      <div className="chk-confirm-wrap">
        <p className="chk-confirm-sub">No order reference was provided.</p>
        <Link href="/shop">← Back to Shop</Link>
      </div>
    );
  }

  if (sessionStatus === "unauthenticated") {
    return (
      <div className="chk-confirm-wrap">
        <div className="chk-login-gate">
          <p>Sign in to view your order confirmation.</p>
          <a href={`https://web.themoveee.com/login`}>Sign In →</a>
        </div>
      </div>
    );
  }

  if (phase === "polling" || sessionStatus === "loading") {
    return (
      <div className="chk-confirm-wrap">
        <div className="chk-confirm-icon">⏳</div>
        <h1 className="chk-confirm-title">Confirming your payment…</h1>
        <p className="chk-confirm-sub">This usually takes a few seconds. Please don&apos;t close this page.</p>
      </div>
    );
  }

  if (phase === "timeout") {
    return (
      <div className="chk-confirm-wrap">
        <div className="chk-confirm-icon">📬</div>
        <h1 className="chk-confirm-title">Still processing</h1>
        <p className="chk-confirm-sub">
          Your payment is taking longer than expected to confirm. We&apos;ll email you once it&apos;s complete.
        </p>
        <div className="chk-confirm-actions">
          <Link href="/shop" className="chk-secondary-btn" style={{ textDecoration: "none", display: "block", textAlign: "center", lineHeight: "44px" }}>
            ← Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="chk-confirm-wrap">
      <div className="chk-confirm-icon">🎉</div>
      <h1 className="chk-confirm-title">Order confirmed</h1>
      <p className="chk-confirm-sub">
        Thank you — your order is being processed. A confirmation email is on its way.
      </p>

      {order && (
        <div className="chk-confirm-card">
          <div className="chk-summary-row">
            <span className="chk-summary-label">Order</span>
            <span className="chk-summary-value">#{order.id}</span>
          </div>
          <div className="chk-summary-divider" />
          {order.items?.map((item, i) => (
            <div className="chk-summary-row" key={i}>
              <span className="chk-summary-label">
                {item.quantity} × {item.name}
              </span>
              <span className="chk-summary-value">
                {order.currency ?? ""} {item.total.toFixed(2)}
              </span>
            </div>
          ))}
          <div className="chk-summary-divider" />
          <div className="chk-summary-row">
            <span className="chk-total-label">Total</span>
            <span className="chk-total-value">
              {order.currency ?? ""} {order.total?.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      <div className="chk-confirm-actions">
        <Link href="/shop" className="chk-primary-btn" style={{ textDecoration: "none", display: "block", textAlign: "center", lineHeight: "52px", boxSizing: "border-box" }}>
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense>
      <OrderConfirmationContent />
    </Suspense>
  );
}
