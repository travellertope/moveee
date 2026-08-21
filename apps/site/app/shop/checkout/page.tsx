"use client";

import { Suspense, useState } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { CountrySelect } from "@/components/LocationSelect";
import "./checkout.css";

interface TotalsResponse {
  quoteToken: string;
  shippingAvailable: boolean;
  display: {
    currency: string;
    currencySymbol: string;
    subtotal: string;
    discount: string;
    shipping: string;
    tax: string;
    total: string;
  };
}

interface PayResponse {
  url: string;
  reference: string;
  gateway: "paystack" | "stripe";
}

type Step = "address" | "review";

function CheckoutContent() {
  const { data: session, status } = useSession();
  const user = session?.user as any;
  const { items, totals: cartTotals } = useCart();
  const searchParams = useSearchParams();
  const wasCancelled = searchParams.get("checkout_cancelled") === "1";

  const [step, setStep] = useState<Step>("address");
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("");
  const [address1, setAddress1] = useState("");
  const [city, setCity] = useState(user?.city ?? "");
  const [region, setRegion] = useState("");
  const [postcode, setPostcode] = useState("");
  const [country, setCountry] = useState("");

  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState("");
  const [totals, setTotals] = useState<TotalsResponse | null>(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");

  const canSubmitAddress =
    !!(address1.trim() && city.trim() && country.trim() && name.trim() && email.trim());

  const currentUrl =
    typeof window !== "undefined"
      ? window.location.origin + window.location.pathname
      : "https://themoveee.com/shop/checkout";

  const handleGetTotals = async () => {
    if (!canSubmitAddress || items.length === 0) return;
    setQuoting(true);
    setQuoteError("");
    try {
      const res = await fetch("/api/checkout/totals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cart_items: items.map((i) => ({ id: i.id, qty: i.quantity })),
          country,
          state: region,
          city,
          postcode,
          address_1: address1,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setQuoteError(data.error || "Could not calculate totals — please check your address.");
        return;
      }
      setTotals(data);
      setStep("review");
    } catch {
      setQuoteError("Could not calculate totals — please check your address.");
    } finally {
      setQuoting(false);
    }
  };

  const handlePay = async () => {
    if (!totals) return;
    setPaying(true);
    setPayError("");
    try {
      const res = await fetch("/api/checkout/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quote_token: totals.quoteToken,
          name,
          email,
          phone,
          country,
        }),
      });
      const data: PayResponse & { error?: string } = await res.json();
      if (!res.ok || !data.url) {
        setPayError(data.error || "Payment failed to start. Please try again.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setPayError("Payment failed to start. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  const fmt = (amount: string) =>
    totals ? `${totals.display.currencySymbol}${amount}` : amount;

  if (status === "loading") {
    return <div className="chk-wrap" />;
  }

  if (!user) {
    return (
      <div className="chk-wrap">
        <div className="chk-login-gate">
          <p>Sign in to your Moveee account to check out.</p>
          <a
            href={`https://web.themoveee.com/login?callbackUrl=${encodeURIComponent(currentUrl)}`}
          >
            Sign In →
          </a>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="chk-wrap">
        <div className="chk-empty">
          <p>Your cart is empty.</p>
          <Link href="/shop">Browse the Shop →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="chk-wrap">
      <Link
        href="/shop"
        className="chk-back-link"
        onClick={(e) => {
          if (step === "review") {
            e.preventDefault();
            setStep("address");
          }
        }}
      >
        {step === "review" ? "← Back to address" : "← Back to Shop"}
      </Link>

      <div className="chk-head">
        <div className="chk-eyebrow">Shop · Checkout</div>
        <h1 className="chk-title">Checkout</h1>
        <div className="chk-steps">
          <span className={`chk-step${step === "address" ? " chk-step--active" : ""}`}>1. Address</span>
          <span>→</span>
          <span className={`chk-step${step === "review" ? " chk-step--active" : ""}`}>2. Review &amp; Pay</span>
        </div>
      </div>

      {wasCancelled && step === "address" && (
        <p className="chk-error">Payment was cancelled — your cart is unchanged, you can try again below.</p>
      )}

      {step === "address" ? (
        <>
          <div className="chk-section-title">Contact</div>
          <div className="chk-field-row">
            <input className="chk-input" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="chk-input" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="chk-field-row chk-field-row--single">
            <input className="chk-input" placeholder="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div className="chk-section-title">Delivery address</div>
          <div className="chk-field-row chk-field-row--single">
            <input className="chk-input" placeholder="Address" value={address1} onChange={(e) => setAddress1(e.target.value)} />
          </div>
          <div className="chk-field-row">
            <input className="chk-input" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
            <input className="chk-input" placeholder="State / Region (optional)" value={region} onChange={(e) => setRegion(e.target.value)} />
          </div>
          <div className="chk-field-row">
            <input className="chk-input" placeholder="Postcode (optional)" value={postcode} onChange={(e) => setPostcode(e.target.value)} />
            <CountrySelect value={country} onChange={setCountry} placeholder="Country" inputClassName="chk-input" />
          </div>

          {quoteError && <p className="chk-error">{quoteError}</p>}

          <button className="chk-primary-btn" disabled={!canSubmitAddress || quoting} onClick={handleGetTotals}>
            {quoting ? "Calculating…" : "Continue to review"}
          </button>
        </>
      ) : (
        <>
          <div className="chk-section-title">Deliver to</div>
          <div className="chk-address-card">
            <div className="chk-address-line">{name}</div>
            <div className="chk-address-line">{address1}</div>
            <div className="chk-address-line">{[city, region, postcode].filter(Boolean).join(", ")}</div>
            <div className="chk-address-line">{country}</div>
          </div>

          <div className="chk-section-title">Order summary</div>
          <div className="chk-summary-card">
            {items.map((item) => {
              const unitPrice = Number(item.prices.price) / Math.pow(10, item.prices.currency_minor_unit);
              const lineTotal = (unitPrice * item.quantity).toFixed(item.prices.currency_minor_unit);
              const symbol = cartTotals?.currency_symbol ?? item.prices.currency_symbol;
              return (
                <div key={item.key} className="chk-summary-row">
                  <span className="chk-summary-label">
                    {item.quantity} × {item.name}
                  </span>
                  <span className="chk-summary-value">{symbol}{lineTotal}</span>
                </div>
              );
            })}
            <div className="chk-summary-divider" />
            <div className="chk-summary-row">
              <span className="chk-summary-label">Subtotal</span>
              <span className="chk-summary-value">{totals && fmt(totals.display.subtotal)}</span>
            </div>
            {totals && parseFloat(totals.display.discount) > 0 && (
              <div className="chk-summary-row">
                <span className="chk-summary-label">Discount</span>
                <span className="chk-summary-value">-{fmt(totals.display.discount)}</span>
              </div>
            )}
            <div className="chk-summary-row">
              <span className="chk-summary-label">Shipping</span>
              <span className="chk-summary-value">
                {totals?.shippingAvailable ? fmt(totals.display.shipping) : "Not available to this address"}
              </span>
            </div>
            {totals && parseFloat(totals.display.tax) > 0 && (
              <div className="chk-summary-row">
                <span className="chk-summary-label">Tax</span>
                <span className="chk-summary-value">{fmt(totals.display.tax)}</span>
              </div>
            )}
            <div className="chk-summary-divider" />
            <div className="chk-summary-row">
              <span className="chk-total-label">Total</span>
              <span className="chk-total-value">{totals && fmt(totals.display.total)}</span>
            </div>
          </div>

          {totals && !totals.shippingAvailable && (
            <p className="chk-error">
              We can&apos;t currently ship to this address. Please check the details or try a different address.
            </p>
          )}
          {payError && <p className="chk-error">{payError}</p>}

          <button
            className="chk-primary-btn"
            disabled={!totals?.shippingAvailable || paying}
            onClick={handlePay}
          >
            {paying ? "Starting payment…" : `Pay ${totals ? fmt(totals.display.total) : ""}`}
          </button>
          <p className="chk-secure-note">🔒 Secure payment · Paystack / Stripe</p>
        </>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutContent />
    </Suspense>
  );
}
