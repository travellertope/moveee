"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Status = "form" | "submitting" | "waiting_payment" | "confirmed" | "failed" | "cancelled";

// A single, market-agnostic checkout page for every /services pricing card
// — reached via a query-string link from the pricing grids
// (?market=uk&section=editorial&item=Cultural+Spotlight+Package&kind=one_time&label=...&price=...
// or, for a Media Partnership tier, &partnership=publishers). The real
// charge amount is never read from these params — they only identify which
// package was picked; /api/services/payment/initiate re-resolves the true
// price server-side (see payment-lookup.ts) before any gateway call.
export default function ServicesCheckoutPage() {
  const [status, setStatus] = useState<Status>("form");
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [item, setItem] = useState({
    market: "", section: "", itemName: "", kind: "one_time", label: "", price: "", partnership: "",
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const confirmed = params.get("service_confirmed");
    const pending = params.get("service_pending");
    const failed = params.get("service_failed");
    const cancelled = params.get("service_cancelled");

    if (confirmed) { setStatus("confirmed"); return; }
    if (failed) { setStatus("failed"); return; }
    if (cancelled) { setStatus("cancelled"); return; }

    if (pending) {
      setStatus("waiting_payment");
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts += 1;
        try {
          const res = await fetch(`/api/services/payment/status?code=${encodeURIComponent(pending)}`, { cache: "no-store" });
          const data = await res.json();
          if (data?.status === "confirmed") {
            clearInterval(poll);
            setStatus("confirmed");
          }
        } catch {
          // keep polling
        }
        if (attempts >= 40) {
          clearInterval(poll);
          setStatus("failed");
        }
      }, 3000);
      return () => clearInterval(poll);
    }

    setItem({
      market: params.get("market") ?? "",
      section: params.get("section") ?? "",
      itemName: params.get("item") ?? "",
      kind: params.get("kind") === "subscription" ? "subscription" : "one_time",
      label: params.get("label") ?? params.get("item") ?? "",
      price: params.get("price") ?? "",
      partnership: params.get("partnership") ?? "",
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!item.itemName) {
      setError("We couldn't tell which package you picked — please go back and try again.");
      return;
    }

    setStatus("submitting");
    try {
      const res = await fetch("/api/services/payment/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          market: item.market,
          sectionId: item.section,
          itemName: item.itemName,
          kind: item.kind,
          partnershipCategory: item.partnership,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.message ?? "Something went wrong. Please try again.");
        setStatus("form");
        return;
      }

      if (data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        setError("Something went wrong. Please try again.");
        setStatus("form");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("form");
    }
  }

  if (status === "confirmed") {
    return (
      <div className="svc-page">
        <div className="svc-wrap svc-checkout-wrap">
          <h1 className="svc-checkout-title">Payment received.</h1>
          <p className="svc-hero-lead">Thank you — we&rsquo;ve got it, and a receipt is on its way to your inbox.</p>
          <p className="svc-detail-tagline">Our team will be in touch shortly to get things moving.</p>
          <Link href="/services" className="svc-btn-primary" style={{ marginTop: 24 }}>Back to Services →</Link>
        </div>
      </div>
    );
  }

  if (status === "waiting_payment") {
    return (
      <div className="svc-page">
        <div className="svc-wrap svc-checkout-wrap">
          <h1 className="svc-checkout-title">Confirming payment&hellip;</h1>
          <p className="svc-hero-lead">This only takes a moment.</p>
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="svc-page">
        <div className="svc-wrap svc-checkout-wrap">
          <h1 className="svc-checkout-title">Payment didn&rsquo;t go through.</h1>
          <p className="svc-hero-lead">Nothing was charged.</p>
          <p className="svc-detail-tagline">
            <Link href="/services">Go back to Services →</Link> or email{" "}
            <a href="mailto:hello@themoveee.com">hello@themoveee.com</a> if this keeps happening.
          </p>
        </div>
      </div>
    );
  }

  if (status === "cancelled") {
    return (
      <div className="svc-page">
        <div className="svc-wrap svc-checkout-wrap">
          <h1 className="svc-checkout-title">Checkout cancelled.</h1>
          <p className="svc-hero-lead">No payment was taken.</p>
          <p className="svc-detail-tagline"><Link href="/services">Back to Services →</Link></p>
        </div>
      </div>
    );
  }

  return (
    <div className="svc-page">
      <div className="svc-wrap svc-checkout-wrap">
        <div className="svc-crumb svc-hero--first" style={{ paddingBottom: 8 }}>
          <Link href="/services">Services</Link>
          <span className="svc-crumb-sep">/</span>
          <span className="svc-crumb-current">Checkout</span>
        </div>

        <h1 className="svc-checkout-title">Complete your order.</h1>

        {item.label && (
          <div className="svc-checkout-summary">
            <div>
              <p className="svc-checkout-summary-label">{item.kind === "subscription" ? "Monthly plan" : "One-time package"}</p>
              <p className="svc-checkout-summary-name">{item.label}</p>
            </div>
            {item.price && <p className="svc-checkout-summary-price">{item.price}</p>}
          </div>
        )}

        <form className="svc-checkout-form" onSubmit={handleSubmit}>
          <div className="svc-checkout-field">
            <label htmlFor="svc-checkout-name">Name</label>
            <input id="svc-checkout-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          </div>
          <div className="svc-checkout-field">
            <label htmlFor="svc-checkout-email">Email</label>
            <input id="svc-checkout-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          {error && <p className="svc-checkout-error">{error}</p>}

          <button type="submit" className="svc-btn-primary svc-checkout-submit" disabled={status === "submitting"}>
            {status === "submitting" ? "Starting checkout…" : "Pay securely →"}
          </button>
          <p className="svc-cta-subtext">
            You&rsquo;ll be taken to {item.price?.includes("₦") ? "Paystack" : "Stripe"} to complete payment securely.
          </p>
        </form>
      </div>
    </div>
  );
}
