"use client";

import { useState, useEffect, FormEvent, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CountrySelect, CitySelect } from "@/components/LocationSelect";
import { INTERESTS } from "@/lib/interest-mappings";
import "../../auth.css";

type Step = "verify" | "about" | "interests" | "membership" | "done";

function CompleteProfileForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const searchParams = useSearchParams();

  const uid = searchParams.get("uid") || "";
  const token = searchParams.get("token") || "";
  const nextUrl = searchParams.get("next") || "";
  const isUpgrade = searchParams.get("upgrade") === "patron";

  const [step, setStep] = useState<Step>(isUpgrade ? "membership" : "verify");
  const [interests, setInterests] = useState<string[]>([]);
  const [verifyError, setVerifyError] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");

  // About You
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [countryOfResidence, setCountryOfResidence] = useState("");
  const [city, setCity] = useState("");
  const [occupation, setOccupation] = useState("");

  // Membership
  const [tier, setTier] = useState<"citizen" | "patron">("citizen");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [currency, setCurrency] = useState<"NGN" | "USD">("NGN");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-detect currency from country
  useEffect(() => {
    if (countryOfResidence) {
      const isNigeria = countryOfResidence.toLowerCase().includes("nigeria") || countryOfResidence === "NG";
      setCurrency(isNigeria ? "NGN" : "USD");
    }
  }, [countryOfResidence]);

  // Validate the token on mount (skip for upgrade flow)
  useEffect(() => {
    if (isUpgrade) return;
    if (!uid || !token) {
      setVerifyError("Invalid verification link. Please register again.");
      setStep("verify");
      return;
    }

    fetch("/api/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, token }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setDisplayName(data.display_name || data.username || "");
          setUsername(data.username || "");
          setStep("about");
        } else {
          setVerifyError(data.message || "Verification link is invalid or has expired.");
        }
      })
      .catch(() => {
        setVerifyError("Could not verify link. Please check your connection and try again.");
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleUpgrade() {
    if (!session) {
      router.push("/login?callbackUrl=/register/complete?upgrade=patron");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/membership/upgrade-init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_key: `${billingCycle}_${currency.toLowerCase()}` }),
      });
      const data = await res.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        setError(data.message || "Upgrade failed to initialize.");
        setLoading(false);
      }
    } catch {
      setError("Service temporarily unavailable.");
      setLoading(false);
    }
  }

  async function handleAboutSubmit(e: FormEvent) {
    e.preventDefault();
    if (!dateOfBirth) { setError("Date of birth is required."); return; }
    if (!countryOfResidence.trim()) { setError("Country of residence is required."); return; }
    if (!city.trim()) { setError("City is required."); return; }
    setError("");
    setStep("interests");
  }

  function toggleInterest(slug: string) {
    setInterests(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
  }

  function handleInterestsSubmit(e: FormEvent) {
    e.preventDefault();
    if (interests.length < 3) { setError("Please select at least 3 interests."); return; }
    setError("");
    setStep("membership");
  }

  async function handleMembershipSubmit(e: FormEvent) {
    e.preventDefault();
    if (isUpgrade) { handleUpgrade(); return; }
    if (loading) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid,
          token,
          date_of_birth: dateOfBirth,
          country_of_residence: countryOfResidence.trim(),
          city: city.trim(),
          occupation: occupation.trim(),
          interests,
          tier,
          plan_key: tier === "patron" ? `${billingCycle}_${currency.toLowerCase()}` : undefined,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message || "Could not save your profile. Please try again.");
        setLoading(false);
        return;
      }

      if (data.requires_payment && data.checkout_url) {
        window.location.href = data.checkout_url;
        return;
      }

      // Redirect to login — we don't hold the password here, so the user
      // signs in once to access their new account.
      const destination = nextUrl || "/member";
      router.push(`/login?registered=1&callbackUrl=${encodeURIComponent(destination)}`);
    } catch {
      setError("Service temporarily unavailable. Please try again.");
      setLoading(false);
    }
  }

  // ── Verifying screen ──────────────────────────────────────────────────────
  if (step === "verify") {
    return (
      <div className="auth-page">
        <div className="auth-card auth-card--center">
          {verifyError ? (
            <>
              <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
              <h1 className="auth-heading auth-heading--sm" style={{ marginBottom: 12 }}>Link problem</h1>
              <p className="auth-sub" style={{ marginBottom: 24 }}>{verifyError}</p>
              <Link href="/register" className="auth-btn-primary" style={{ display: "inline-flex" }}>
                Back to register
              </Link>
            </>
          ) : (
            <>
              <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
              <p className="auth-sub" style={{ marginBottom: 0 }}>Verifying your email…</p>
            </>
          )}
        </div>
      </div>
    );
  }

  const stepLabels = ["About You", "Your Interests", "Membership"] as const;
  const currentStepIdx = step === "about" ? 0 : step === "interests" ? 1 : 2;
  const progressPercent = (currentStepIdx / 2) * 100;

  // ── About You (Step 2) ────────────────────────────────────────────────────
  if (step === "about") {
    return (
      <div className="auth-page">
        <div className="auth-card auth-card--wide">
          <h1 className="auth-heading">Welcome, {displayName || username}!</h1>

          <ProgressBar labels={stepLabels} currentIdx={currentStepIdx} percent={progressPercent} />

          <form onSubmit={handleAboutSubmit} noValidate>
            <h2 className="auth-step-heading">A little about you</h2>

            <div className="auth-row">
              <div className="auth-field">
                <label className="auth-label" htmlFor="dob">
                  Date of Birth <span className="auth-label-required">*</span>
                </label>
                <input
                  id="dob"
                  type="date"
                  required
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="auth-input"
                />
              </div>
              <div className="auth-field">
                <label className="auth-label" htmlFor="country">
                  Country of Residence <span className="auth-label-required">*</span>
                </label>
                <CountrySelect
                  id="country"
                  value={countryOfResidence}
                  onChange={setCountryOfResidence}
                  inputClassName="auth-input"
                  placeholder="Search countries…"
                />
              </div>
            </div>

            <div className="auth-row">
              <div className="auth-field">
                <label className="auth-label" htmlFor="city">
                  City <span className="auth-label-required">*</span>
                </label>
                <CitySelect
                  id="city"
                  country={countryOfResidence}
                  value={city}
                  onChange={setCity}
                  inputClassName="auth-input"
                />
              </div>
              <div className="auth-field">
                <label className="auth-label" htmlFor="occupation">
                  Occupation <span className="auth-label-optional">(optional)</span>
                </label>
                <input
                  id="occupation"
                  type="text"
                  placeholder="e.g. Filmmaker, Designer"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="auth-input"
                />
              </div>
            </div>

            <p className="auth-hint" style={{ marginTop: 4 }}>
              You can add your bio, disciplines, and social links from profile settings after joining.
            </p>

            {error && <p className="auth-error">{error}</p>}

            <div className="auth-nav">
              <span />
              <button type="submit" className="auth-btn-primary" style={{ width: "auto" }}>
                Continue →
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ── Interests (Step 2) ───────────────────────────────────────────────────
  if (step === "interests") {
    return (
      <div className="auth-page">
        <div className="auth-card auth-card--wide">
          <h1 className="auth-heading">What moves you?</h1>

          <ProgressBar labels={stepLabels} currentIdx={currentStepIdx} percent={progressPercent} />

          <form onSubmit={handleInterestsSubmit} noValidate>
            <h2 className="auth-step-heading">Pick your interests</h2>
            <p className="auth-sub" style={{ marginTop: -12, marginBottom: 20 }}>
              Select at least 3. This shapes your feed and connects you with the right community.
            </p>

            <div className="auth-chip-grid">
              {INTERESTS.map(({ slug, label, emoji }) => {
                const active = interests.includes(slug);
                return (
                  <button
                    key={slug}
                    type="button"
                    onClick={() => toggleInterest(slug)}
                    className={`auth-chip${active ? " auth-chip--active" : ""}`}
                  >
                    <span className="auth-chip-emoji">{emoji}</span>
                    <span className="auth-chip-label">{label}</span>
                  </button>
                );
              })}
            </div>

            <p className={`auth-chip-count${interests.length >= 3 ? " auth-chip-count--ok" : ""}`}>
              {interests.length} selected {interests.length < 3 ? `— ${3 - interests.length} more needed` : "✓"}
            </p>

            {error && <p className="auth-error">{error}</p>}

            <div className="auth-nav">
              <button type="button" onClick={() => setStep("about")} className="auth-btn-secondary auth-btn-secondary--nav">
                ← Back
              </button>
              <button
                type="submit"
                className="auth-btn-primary"
                style={{ width: "auto" }}
                disabled={interests.length < 3}
              >
                Continue →
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ── Membership (Step 3) ───────────────────────────────────────────────────
  return (
    <div className="auth-page">
      <div className="auth-card auth-card--wide">
        <h1 className="auth-heading">{isUpgrade ? "Upgrade to Moveee Pro" : "Choose your membership"}</h1>

        {!isUpgrade && (
          <ProgressBar labels={stepLabels} currentIdx={2} percent={100} />
        )}

        <form onSubmit={handleMembershipSubmit} noValidate>
          <h2 className="auth-step-heading">Your membership tier</h2>

          <div className="auth-billing-toggle" style={{ opacity: tier === "patron" ? 1 : 0.5 }}>
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`auth-cycle-btn${billingCycle === "monthly" ? " auth-cycle-btn--active" : ""}`}
              disabled={tier !== "patron"}
            >Monthly</button>
            <button
              type="button"
              onClick={() => setBillingCycle("yearly")}
              className={`auth-cycle-btn${billingCycle === "yearly" ? " auth-cycle-btn--active" : ""}`}
              disabled={tier !== "patron"}
            >Annually</button>
            <div className="auth-savings-tag">{currency === "NGN" ? "Save ₦9,000" : "Save $8"}</div>
          </div>

          <div className="auth-tier-grid">
            {(
              [
                {
                  value: "citizen" as const,
                  label: "Citizen",
                  price: "Free",
                  perks: ["Access to free member articles", "Access to online events", "GetMeLit & Culture Drop newsletters", "Community forum & Pulse"],
                },
                {
                  value: "patron" as const,
                  label: "Moveee Pro",
                  price: currency === "NGN" ? (billingCycle === "monthly" ? "₦4,500" : "₦45,000") : (billingCycle === "monthly" ? "$4" : "$40"),
                  period: billingCycle === "monthly" ? "/ mo" : "/ yr",
                  perks: ["Everything in Citizen", "All patron-only articles", "10% shop discount + early access", "Cash out credits · 100 credits/day · Pro badge"],
                },
              ]
            ).map(({ value, label, price, perks, ...rest }) => (
              <label
                key={value}
                className={`auth-tier-card${tier === value ? " auth-tier-card--active" : ""}`}
              >
                <input
                  type="radio"
                  name="tier"
                  value={value}
                  checked={tier === value}
                  onChange={() => setTier(value)}
                  className="auth-tier-radio-input"
                />
                <h3 className="auth-tier-label">{label}</h3>
                <div className="auth-tier-price-row">
                  <span className="auth-tier-price">{price}</span>
                  {"period" in rest && <span className="auth-tier-period">{rest.period}</span>}
                </div>
                <ul className="auth-tier-perks">{perks.map((p) => <li key={p}>{p}</li>)}</ul>
              </label>
            ))}
          </div>

          <div className="auth-currency-notice">
            Pricing based on residence: <strong>{currency}</strong>.
            <button type="button" onClick={() => setCurrency(c => c === "NGN" ? "USD" : "NGN")} className="auth-currency-switch">Switch</button>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <div className="auth-nav">
            {!isUpgrade && (
              <button type="button" onClick={() => setStep("interests")} className="auth-btn-secondary auth-btn-secondary--nav">
                ← Back
              </button>
            )}
            {isUpgrade && <span />}
            <button type="submit" className="auth-btn-primary" style={{ width: "auto" }} disabled={loading}>
              {loading ? "Please wait…" : tier === "patron" ? "Continue to payment →" : "Complete registration →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProgressBar({ labels, currentIdx, percent }: { labels: readonly string[]; currentIdx: number; percent: number }) {
  return (
    <div className="auth-steps">
      {labels.map((label, i) => (
        <div key={label} className="auth-step">
          <div className={`auth-step-circle${currentIdx > i ? " auth-step-circle--done" : currentIdx === i ? " auth-step-circle--active" : ""}`}>
            {currentIdx > i ? "✓" : i + 1}
          </div>
          <span className={`auth-step-label${currentIdx === i ? " auth-step-label--current" : ""}`}>
            {label}
          </span>
        </div>
      ))}
      <div className="auth-steps-track">
        <div className="auth-steps-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export default function CompleteProfilePage() {
  return (
    <Suspense>
      <CompleteProfileForm />
    </Suspense>
  );
}
