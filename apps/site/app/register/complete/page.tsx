"use client";

import { useState, useEffect, FormEvent, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CountrySelect, CitySelect } from "@/components/LocationSelect";
import { INTERESTS } from "@/lib/interest-mappings";

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
      <div style={styles.page}>
        <div style={{ ...styles.card, textAlign: "center" }}>
          {verifyError ? (
            <>
              <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
              <h1 style={{ ...styles.heading, fontSize: 22, marginBottom: 12 }}>Link problem</h1>
              <p style={{ fontSize: 15, color: "#7a6f5c", lineHeight: 1.7, marginBottom: 24 }}>{verifyError}</p>
              <Link href="/register" style={{ ...styles.btnPrimary, display: "inline-block", textDecoration: "none" }}>
                Back to register
              </Link>
            </>
          ) : (
            <>
              <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
              <p style={{ fontSize: 15, color: "#7a6f5c" }}>Verifying your email…</p>
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
      <div style={styles.page}>
        <div style={styles.card}>
          <p style={styles.eyebrow}>The Moveee — Culture Community</p>
          <h1 style={styles.heading}>Welcome, {displayName || username}!</h1>

          <ProgressBar labels={stepLabels} currentIdx={currentStepIdx} percent={progressPercent} />

          <form onSubmit={handleAboutSubmit} noValidate>
            <h2 style={styles.stepHeading}>A little about you</h2>

            <div style={styles.row}>
              <div style={{ ...styles.field, flex: 1 }}>
                <label style={styles.label} htmlFor="dob">
                  Date of Birth <span style={{ color: "#c5491f" }}>*</span>
                </label>
                <input
                  id="dob"
                  type="date"
                  required
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div style={{ ...styles.field, flex: 1 }}>
                <label style={styles.label} htmlFor="country">
                  Country of Residence <span style={{ color: "#c5491f" }}>*</span>
                </label>
                <CountrySelect
                  id="country"
                  value={countryOfResidence}
                  onChange={setCountryOfResidence}
                  inputStyle={styles.input}
                  placeholder="Search countries…"
                />
              </div>
            </div>

            <div style={styles.row}>
              <div style={{ ...styles.field, flex: 1 }}>
                <label style={styles.label} htmlFor="city">
                  City <span style={{ color: "#c5491f" }}>*</span>
                </label>
                <CitySelect
                  id="city"
                  country={countryOfResidence}
                  value={city}
                  onChange={setCity}
                  inputStyle={styles.input}
                />
              </div>
              <div style={{ ...styles.field, flex: 1 }}>
                <label style={styles.label} htmlFor="occupation">
                  Occupation <span style={{ fontWeight: 400, color: "#7a6f5c" }}>(optional)</span>
                </label>
                <input
                  id="occupation"
                  type="text"
                  placeholder="e.g. Filmmaker, Designer"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>

            <p style={{ fontSize: 12, color: "#7a6f5c", lineHeight: 1.6, marginTop: 4 }}>
              You can add your bio, disciplines, and social links from profile settings after joining.
            </p>

            {error && <p style={styles.error}>{error}</p>}

            <div style={styles.nav}>
              <span />
              <button type="submit" style={styles.btnPrimary}>
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
      <div style={styles.page}>
        <div style={styles.card}>
          <p style={styles.eyebrow}>The Moveee — Culture Community</p>
          <h1 style={styles.heading}>What moves you?</h1>

          <ProgressBar labels={stepLabels} currentIdx={currentStepIdx} percent={progressPercent} />

          <form onSubmit={handleInterestsSubmit} noValidate>
            <h2 style={styles.stepHeading}>Pick your interests</h2>
            <p style={{ fontSize: 13, color: "#7a6f5c", marginTop: -12, marginBottom: 20, lineHeight: 1.6 }}>
              Select at least 3. This shapes your feed and connects you with the right community.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 8 }}>
              {INTERESTS.map(({ slug, label, emoji }) => {
                const active = interests.includes(slug);
                return (
                  <button
                    key={slug}
                    type="button"
                    onClick={() => toggleInterest(slug)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                      padding: "14px 8px",
                      border: active ? "2px solid #14110d" : "2px solid #d4cbbf",
                      borderRadius: 4,
                      background: active ? "rgba(20,17,13,.05)" : "#fff",
                      cursor: "pointer",
                      transition: "border-color 0.15s, background 0.15s",
                      fontFamily: "inherit",
                      boxShadow: active ? "0 0 0 2px #14110d" : "none",
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{emoji}</span>
                    <span style={{ fontSize: 11, fontWeight: active ? 700 : 400, color: "#14110d", textAlign: "center", lineHeight: 1.3 }}>{label}</span>
                  </button>
                );
              })}
            </div>

            <p style={{ fontSize: 12, color: interests.length >= 3 ? "#2e7d32" : "#7a6f5c", marginBottom: 4 }}>
              {interests.length} selected {interests.length < 3 ? `— ${3 - interests.length} more needed` : "✓"}
            </p>

            {error && <p style={styles.error}>{error}</p>}

            <div style={styles.nav}>
              <button type="button" onClick={() => setStep("about")} style={styles.btnSecondary}>
                ← Back
              </button>
              <button
                type="submit"
                style={{ ...styles.btnPrimary, opacity: interests.length < 3 ? 0.5 : 1 }}
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
    <div style={styles.page}>
      <div style={styles.card}>
        <p style={styles.eyebrow}>The Moveee — Culture Community</p>
        <h1 style={styles.heading}>{isUpgrade ? "Upgrade to Connect Pro" : "Choose your membership"}</h1>

        {!isUpgrade && (
          <ProgressBar labels={stepLabels} currentIdx={2} percent={100} />
        )}

        <form onSubmit={handleMembershipSubmit} noValidate>
          <h2 style={styles.stepHeading}>Your membership tier</h2>

          <div style={{ ...styles.billingToggle, opacity: tier === "patron" ? 1 : 0.5 }}>
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              style={{ ...styles.cycleBtn, background: billingCycle === "monthly" ? "#14110d" : "transparent", color: billingCycle === "monthly" ? "#fff" : "#7a6f5c" }}
              disabled={tier !== "patron"}
            >Monthly</button>
            <button
              type="button"
              onClick={() => setBillingCycle("yearly")}
              style={{ ...styles.cycleBtn, background: billingCycle === "yearly" ? "#14110d" : "transparent", color: billingCycle === "yearly" ? "#fff" : "#7a6f5c" }}
              disabled={tier !== "patron"}
            >Annually</button>
            <div style={styles.savingsTag}>{currency === "NGN" ? "Save ₦9,000" : "Save $8"}</div>
          </div>

          <div style={styles.tierGrid}>
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
                  label: "Connect Pro",
                  price: currency === "NGN" ? (billingCycle === "monthly" ? "₦4,500" : "₦45,000") : (billingCycle === "monthly" ? "$4" : "$40"),
                  period: billingCycle === "monthly" ? "/ mo" : "/ yr",
                  perks: ["Everything in Citizen", "All patron-only articles", "Featured directory listing", "Pro badge · priority RSVP"],
                },
              ]
            ).map(({ value, label, price, perks, ...rest }) => (
              <label
                key={value}
                style={{ ...styles.tierCard, borderColor: tier === value ? "#14110d" : "#d4cbbf", background: tier === value ? "rgba(20,17,13,.04)" : "#fff", boxShadow: tier === value ? "0 0 0 2px #14110d" : "none" }}
              >
                <input type="radio" name="tier" value={value} checked={tier === value} onChange={() => setTier(value)} style={{ position: "absolute", opacity: 0, pointerEvents: "none" }} />
                <h3 style={styles.tierLabel}>{label}</h3>
                <div style={styles.priceContainer}>
                  <span style={styles.tierPrice}>{price}</span>
                  {"period" in rest && <span style={styles.pricePeriod}>{rest.period}</span>}
                </div>
                <ul style={styles.tierPerks}>{perks.map((p) => <li key={p}>{p}</li>)}</ul>
              </label>
            ))}
          </div>

          <div style={styles.currencyNotice}>
            Pricing based on residence: <strong>{currency}</strong>.
            <button type="button" onClick={() => setCurrency(c => c === "NGN" ? "USD" : "NGN")} style={styles.currencySwitch}>Switch</button>
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <div style={styles.nav}>
            {!isUpgrade && (
              <button type="button" onClick={() => setStep("interests")} style={styles.btnSecondary}>
                ← Back
              </button>
            )}
            {isUpgrade && <span />}
            <button
              type="submit"
              style={{ ...styles.btnPrimary, opacity: loading ? 0.7 : 1 }}
              disabled={loading}
            >
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
    <div style={{ display: "flex", alignItems: "flex-start", gap: 0, marginBottom: 28, paddingBottom: 20, borderBottom: "1px solid #e8e0d4", position: "relative" }}>
      {labels.map((label, i) => (
        <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1, position: "relative", zIndex: 1 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, background: currentIdx > i ? "#14110d" : currentIdx === i ? "#14110d" : "#d4cbbf", color: currentIdx >= i ? "#fff" : "#7a6f5c", border: currentIdx === i ? "2px solid #14110d" : "2px solid transparent" }}>
            {currentIdx > i ? "✓" : i + 1}
          </div>
          <span style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: currentIdx >= i ? "#14110d" : "#7a6f5c", fontWeight: currentIdx === i ? 600 : 400 }}>
            {label}
          </span>
        </div>
      ))}
      <div style={{ position: "absolute", top: 15, left: `${Math.round(50 / labels.length)}%`, right: `${Math.round(50 / labels.length)}%`, height: 2, background: "#e8e0d4", zIndex: 0 }}>
        <div style={{ height: "100%", background: "#14110d", width: `${percent}%`, transition: "width 0.3s ease" }} />
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

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff", padding: "60px 24px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  card: { maxWidth: 580, width: "100%", background: "#fffdf8", borderRadius: 4, border: "1px solid #e8e0d4", padding: "40px 40px 32px", color: "#14110d" },
  eyebrow: { fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase" as const, color: "#7a6f5c", margin: "0 0 16px" },
  heading: { fontSize: 28, fontWeight: 300, fontFamily: "Georgia, serif", margin: "0 0 28px", color: "#14110d" },
  stepHeading: { fontSize: 18, fontWeight: 600, margin: "0 0 20px", color: "#14110d" },
  row: { display: "flex", gap: 16 },
  field: { marginBottom: 18 },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "#14110d", marginBottom: 6, letterSpacing: "0.02em" },
  input: { display: "block", width: "100%", padding: "10px 14px", border: "1px solid #d4cbbf", borderRadius: 3, fontSize: 15, color: "#14110d", background: "#fff", outline: "none", boxSizing: "border-box" as const, fontFamily: "inherit" },
  billingToggle: { display: "flex", alignItems: "center", gap: 8, marginBottom: 20, background: "#f0ede6", padding: 4, borderRadius: 6, width: "fit-content", transition: "opacity 0.2s" },
  cycleBtn: { padding: "6px 16px", border: "none", borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit" },
  savingsTag: { fontSize: 11, fontWeight: 700, color: "#c5491f", background: "#fdf2f0", padding: "2px 8px", borderRadius: 10, marginLeft: 4 },
  tierGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 8 },
  tierCard: { cursor: "pointer", padding: "20px 18px", border: "2px solid #d4cbbf", borderRadius: 4, transition: "border-color 0.2s, box-shadow 0.2s", display: "block", position: "relative" as const },
  tierLabel: { margin: "0 0 4px", fontSize: 17, fontWeight: 600, color: "#14110d" },
  tierPrice: { display: "inline-block", fontWeight: 700, color: "#8b6f47", fontSize: 18 },
  priceContainer: { display: "flex", alignItems: "baseline", gap: 4, marginBottom: 12 },
  pricePeriod: { fontSize: 13, color: "#7a6f5c", fontWeight: 400 },
  tierPerks: { margin: 0, padding: "0 0 0 16px", fontSize: 13, color: "#7a6f5c", lineHeight: 1.7 },
  currencyNotice: { marginTop: 20, fontSize: 12, color: "#7a6f5c", borderTop: "1px dashed #e8e0d4", paddingTop: 12, display: "flex", alignItems: "center", gap: 8 },
  currencySwitch: { background: "none", border: "none", padding: 0, color: "#14110d", textDecoration: "underline", fontSize: 11, cursor: "pointer", textTransform: "uppercase" as const, letterSpacing: "0.05em", fontWeight: 600 },
  nav: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24, paddingTop: 20, borderTop: "1px solid #e8e0d4" },
  btnPrimary: { padding: "11px 24px", background: "#14110d", color: "#ffffff", border: "none", borderRadius: 3, fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, cursor: "pointer", fontFamily: "inherit" },
  btnSecondary: { padding: "11px 20px", background: "transparent", color: "#7a6f5c", border: "1px solid #d4cbbf", borderRadius: 3, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  error: { fontSize: 14, color: "#c0392b", background: "#fef2f2", border: "1px solid rgba(192,57,43,.15)", borderRadius: 3, padding: "10px 14px", margin: "12px 0 0" },
};
