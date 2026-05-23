"use client";

import { useState, useEffect, FormEvent, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CountrySelect, CitySelect } from "@/components/LocationSelect";

type Step = 1 | 2 | 3;

function RegisterForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const referralFromUrl = searchParams.get("ref") || "";
  const tierFromUrl = searchParams.get("tier") as "citizen" | "patron" | null;
  const isUpgrade = searchParams.get("upgrade") === "patron";

  const [step, setStep] = useState<Step>(1);

  useEffect(() => {
    if (isUpgrade && session) {
      setStep(3);
      setTier("patron");
    } else if (tierFromUrl) {
      setTier(tierFromUrl);
    }
  }, [isUpgrade, session, tierFromUrl]);

  // Account
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");

  // About You
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [countryOfResidence, setCountryOfResidence] = useState("");
  const [city, setCity] = useState("");
  const [occupation, setOccupation] = useState("");

  // Membership
  const [tier, setTier] = useState<"citizen" | "patron">(tierFromUrl || "citizen");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [currency, setCurrency] = useState<"NGN" | "USD">("NGN");

  const [referralCode] = useState(referralFromUrl);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-detect currency from country
  useEffect(() => {
    if (countryOfResidence) {
      const isNigeria = countryOfResidence.toLowerCase().includes("nigeria") || countryOfResidence === "NG";
      setCurrency(isNigeria ? "NGN" : "USD");
    }
  }, [countryOfResidence]);

  function validateStep(s: Step): string {
    if (s === 1) {
      if (!username.trim()) return "Username is required.";
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return "A valid email is required.";
      if (password.length < 8) return "Password must be at least 8 characters.";
    }
    if (s === 2) {
      if (!dateOfBirth) return "Date of birth is required.";
      if (!countryOfResidence.trim()) return "Country of residence is required.";
    }
    return "";
  }

  function nextStep() {
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setError("");
    setStep((s) => (s < 3 ? ((s + 1) as Step) : s));
  }

  function prevStep() {
    setError("");
    setStep((s) => (s > 1 ? ((s - 1) as Step) : s));
  }

  async function handleUpgrade() {
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

  async function handleSubmit(e?: FormEvent) {
    if (e) e.preventDefault();
    const err = validateStep(step);
    if (err) { setError(err); return; }

    if (isUpgrade && session) {
      if (step < 3) { nextStep(); return; }
      if (loading) return;
      handleUpgrade();
      return;
    }

    if (loading) return;
    setError("");
    setLoading(true);

    const body: Record<string, unknown> = {
      username: username.trim(),
      email: email.trim(),
      password,
      display_name: displayName.trim() || username.trim(),
      date_of_birth: dateOfBirth,
      country_of_residence: countryOfResidence.trim(),
      city: city.trim(),
      occupation: occupation.trim(),
      tier,
      directory_opt_in: "1",
    };

    if (phone.trim()) body.phone = phone.trim();
    if (referralCode) body.referral_code = referralCode;
    if (tier === "patron") {
      body.plan_key = `${billingCycle}_${currency.toLowerCase()}`;
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!data.success) {
        setLoading(false);
        setError(data.message ?? "Registration failed. Please try again.");
        return;
      }

      if (data.requires_payment && data.checkout_url) {
        window.location.href = data.checkout_url;
        return;
      }

      const result = await signIn("credentials", {
        username: username.trim(),
        password,
        redirect: false,
      });

      setLoading(false);

      if (result?.error) {
        router.push("/login?registered=1");
      } else {
        router.push("/member");
        router.refresh();
      }
    } catch {
      setLoading(false);
      setError("Service temporarily unavailable. Please try again.");
    }
  }

  const progressPercent = ((step - 1) / 2) * 100;
  const stepLabels = ["Account", "About You", "Membership"] as const;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <p style={styles.eyebrow}>The Moveee &mdash; Culture Community</p>
        <h1 style={styles.heading}>{isUpgrade ? "Upgrade to Connect Pro" : "Join the Community"}</h1>

        {/* Progress */}
        {!isUpgrade && (
          <div style={styles.progressWrap}>
            {stepLabels.map((label, i) => (
              <div key={label} style={styles.progressStep}>
                <div
                  style={{
                    ...styles.progressDot,
                    background: step > i + 1 ? "#14110d" : step === i + 1 ? "#14110d" : "#d4cbbf",
                    color: step >= i + 1 ? "#ffffff" : "#7a6f5c",
                    border: step === i + 1 ? "2px solid #14110d" : "2px solid transparent",
                  }}
                >
                  {step > i + 1 ? "✓" : i + 1}
                </div>
                <span
                  style={{
                    ...styles.progressLabel,
                    color: step >= i + 1 ? "#14110d" : "#7a6f5c",
                    fontWeight: step === i + 1 ? 600 : 400,
                  }}
                >
                  {label}
                </span>
              </div>
            ))}
            <div style={styles.progressBar}>
              <div style={{ ...styles.progressFill, width: `${progressPercent}%` }} />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>

          {/* ── Step 1: Account ── */}
          {step === 1 && (
            <div>
              <h2 style={styles.stepHeading}>Create your account</h2>

              <div style={styles.row}>
                <div style={{ ...styles.field, flex: 1 }}>
                  <label style={styles.label} htmlFor="display_name">Full Name</label>
                  <input
                    id="display_name"
                    type="text"
                    autoComplete="name"
                    placeholder="How others see you"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    style={styles.input}
                  />
                </div>
                <div style={{ ...styles.field, flex: 1 }}>
                  <label style={styles.label} htmlFor="username">Username <span style={{ color: "#c5491f" }}>*</span></label>
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    required
                    placeholder="@handle"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.field}>
                <label style={styles.label} htmlFor="email">Email <span style={{ color: "#c5491f" }}>*</span></label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label} htmlFor="password">Password <span style={{ color: "#c5491f" }}>*</span></label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={styles.input}
                />
                <span style={styles.hint}>At least 8 characters</span>
              </div>

              <div style={styles.field}>
                <label style={styles.label} htmlFor="phone">
                  Phone Number <span style={{ fontWeight: 400, color: "#7a6f5c" }}>(optional)</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>
          )}

          {/* ── Step 2: About You ── */}
          {step === 2 && (
            <div>
              <h2 style={styles.stepHeading}>A little about you</h2>

              <div style={styles.row}>
                <div style={{ ...styles.field, flex: 1 }}>
                  <label style={styles.label} htmlFor="dob">Date of Birth <span style={{ color: "#c5491f" }}>*</span></label>
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
                  <label style={styles.label} htmlFor="country">Country of Residence <span style={{ color: "#c5491f" }}>*</span></label>
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
                    City <span style={{ fontWeight: 400, color: "#7a6f5c" }}>(optional)</span>
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
                You can add your bio, disciplines, and social links from your profile settings after joining.
              </p>
            </div>
          )}

          {/* ── Step 3: Membership ── */}
          {step === 3 && (
            <div>
              <h2 style={styles.stepHeading}>Choose your membership</h2>

              <div style={{ ...styles.billingToggle, opacity: tier === "patron" ? 1 : 0.5 }}>
                <button
                  type="button"
                  onClick={() => setBillingCycle("monthly")}
                  style={{
                    ...styles.cycleBtn,
                    background: billingCycle === "monthly" ? "#14110d" : "transparent",
                    color: billingCycle === "monthly" ? "#ffffff" : "#7a6f5c",
                  }}
                  disabled={tier !== "patron"}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle("yearly")}
                  style={{
                    ...styles.cycleBtn,
                    background: billingCycle === "yearly" ? "#14110d" : "transparent",
                    color: billingCycle === "yearly" ? "#ffffff" : "#7a6f5c",
                  }}
                  disabled={tier !== "patron"}
                >
                  Annually
                </button>
                <div style={styles.savingsTag}>
                  {currency === "NGN" ? "Save ₦9,000" : "Save $8"}
                </div>
              </div>

              <div style={styles.tierGrid}>
                {(
                  [
                    {
                      value: "citizen",
                      label: "Citizen",
                      price: "Free",
                      perks: [
                        "Access to free member articles",
                        "Access to online events",
                        "GetMeLit & Culture Drop newsletters",
                        "Community forum & Pulse",
                      ],
                    },
                    {
                      value: "patron",
                      label: "Connect Pro",
                      price: currency === "NGN"
                        ? (billingCycle === "monthly" ? "₦4,500" : "₦45,000")
                        : (billingCycle === "monthly" ? "$4" : "$40"),
                      period: billingCycle === "monthly" ? "/ mo" : "/ yr",
                      perks: [
                        "Everything in Citizen",
                        "All patron-only articles",
                        "Featured directory listing",
                        "Pro badge · priority RSVP",
                      ],
                    },
                  ] as const
                ).map(({ value, label, price, perks, ...rest }) => (
                  <label
                    key={value}
                    style={{
                      ...styles.tierCard,
                      borderColor: tier === value ? "#14110d" : "#d4cbbf",
                      background: tier === value ? "rgba(20,17,13,.04)" : "#fff",
                      boxShadow: tier === value ? "0 0 0 2px #14110d" : "none",
                    }}
                  >
                    <input
                      type="radio"
                      name="tier"
                      value={value}
                      checked={tier === value}
                      onChange={() => setTier(value)}
                      style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
                    />
                    <h3 style={styles.tierLabel}>{label}</h3>
                    <div style={styles.priceContainer}>
                      <span style={styles.tierPrice}>{price}</span>
                      {"period" in rest && <span style={styles.pricePeriod}>{rest.period}</span>}
                    </div>
                    <ul style={styles.tierPerks}>
                      {perks.map((p) => <li key={p}>{p}</li>)}
                    </ul>
                  </label>
                ))}
              </div>

              <div style={styles.currencyNotice}>
                Pricing based on residence: <strong>{currency}</strong>.
                <button
                  type="button"
                  onClick={() => setCurrency(c => c === "NGN" ? "USD" : "NGN")}
                  style={styles.currencySwitch}
                >
                  Switch
                </button>
              </div>
            </div>
          )}

          {error && <p style={styles.error}>{error}</p>}

          {/* Nav */}
          <div style={styles.nav}>
            {step > 1 ? (
              <button type="button" onClick={prevStep} style={styles.btnSecondary}>
                ← Back
              </button>
            ) : (
              <span />
            )}

            {step < 3 ? (
              <button type="button" onClick={nextStep} style={styles.btnPrimary}>
                Continue →
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit()}
                style={{ ...styles.btnPrimary, opacity: loading ? 0.7 : 1 }}
                disabled={loading}
              >
                {loading
                  ? "Creating account…"
                  : tier === "patron"
                  ? "Continue to payment →"
                  : "Create account →"}
              </button>
            )}
          </div>
        </form>

        <p style={styles.footerText}>
          Already have an account?{" "}
          <Link href="/login" style={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#ffffff",
    padding: "60px 24px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  card: {
    maxWidth: 560,
    width: "100%",
    background: "#fffdf8",
    borderRadius: 4,
    border: "1px solid #e8e0d4",
    padding: "40px 40px 32px",
    color: "#14110d",
    position: "relative",
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: "#7a6f5c",
    margin: "0 0 16px",
  },
  heading: {
    fontSize: 28,
    fontWeight: 300,
    fontFamily: "Georgia, serif",
    margin: "0 0 28px",
    color: "#14110d",
  },
  progressWrap: {
    display: "flex",
    alignItems: "flex-start",
    gap: 0,
    marginBottom: 32,
    paddingBottom: 24,
    borderBottom: "1px solid #e8e0d4",
    position: "relative",
  },
  progressStep: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    flex: 1,
    position: "relative",
    zIndex: 1,
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 700,
    transition: "background 0.2s",
  },
  progressLabel: {
    fontSize: 11,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  progressBar: {
    position: "absolute",
    top: 15,
    left: "16.5%",
    right: "16.5%",
    height: 2,
    background: "#e8e0d4",
    zIndex: 0,
  },
  progressFill: {
    height: "100%",
    background: "#14110d",
    transition: "width 0.3s ease",
  },
  stepHeading: {
    fontSize: 18,
    fontWeight: 600,
    margin: "0 0 20px",
    color: "#14110d",
  },
  row: {
    display: "flex",
    gap: 16,
  },
  field: {
    marginBottom: 18,
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#14110d",
    marginBottom: 6,
    letterSpacing: "0.02em",
  },
  input: {
    display: "block",
    width: "100%",
    padding: "10px 14px",
    border: "1px solid #d4cbbf",
    borderRadius: 3,
    fontSize: 15,
    color: "#14110d",
    background: "#fff",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  hint: {
    display: "block",
    fontSize: 12,
    color: "#7a6f5c",
    marginTop: 4,
  },
  billingToggle: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
    background: "#f0ede6",
    padding: 4,
    borderRadius: 6,
    width: "fit-content",
    transition: "opacity 0.2s",
  },
  cycleBtn: {
    padding: "6px 16px",
    border: "none",
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
    fontFamily: "inherit",
  },
  savingsTag: {
    fontSize: 11,
    fontWeight: 700,
    color: "#c5491f",
    background: "#fdf2f0",
    padding: "2px 8px",
    borderRadius: 10,
    marginLeft: 4,
  },
  tierGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
    marginBottom: 8,
  },
  tierCard: {
    cursor: "pointer",
    padding: "20px 18px",
    border: "2px solid #d4cbbf",
    borderRadius: 4,
    transition: "border-color 0.2s, box-shadow 0.2s",
    display: "block",
    position: "relative",
  },
  tierLabel: {
    margin: "0 0 4px",
    fontSize: 17,
    fontWeight: 600,
    color: "#14110d",
  },
  tierPrice: {
    display: "inline-block",
    fontWeight: 700,
    color: "#8b6f47",
    fontSize: 18,
  },
  priceContainer: {
    display: "flex",
    alignItems: "baseline",
    gap: 4,
    marginBottom: 12,
  },
  pricePeriod: {
    fontSize: 13,
    color: "#7a6f5c",
    fontWeight: 400,
  },
  tierPerks: {
    margin: 0,
    padding: "0 0 0 16px",
    fontSize: 13,
    color: "#7a6f5c",
    lineHeight: 1.7,
  },
  currencyNotice: {
    marginTop: 20,
    fontSize: 12,
    color: "#7a6f5c",
    borderTop: "1px dashed #e8e0d4",
    paddingTop: 12,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  currencySwitch: {
    background: "none",
    border: "none",
    padding: 0,
    color: "#14110d",
    textDecoration: "underline",
    fontSize: 11,
    cursor: "pointer",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    fontWeight: 600,
  },
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
    paddingTop: 20,
    borderTop: "1px solid #e8e0d4",
  },
  btnPrimary: {
    padding: "11px 24px",
    background: "#14110d",
    color: "#ffffff",
    border: "none",
    borderRadius: 3,
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  btnSecondary: {
    padding: "11px 20px",
    background: "transparent",
    color: "#7a6f5c",
    border: "1px solid #d4cbbf",
    borderRadius: 3,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  error: {
    fontSize: 14,
    color: "#c0392b",
    background: "#fef2f2",
    border: "1px solid rgba(192,57,43,.15)",
    borderRadius: 3,
    padding: "10px 14px",
    margin: "12px 0 0",
  },
  footerText: {
    fontSize: 13,
    color: "#7a6f5c",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 0,
  },
  link: {
    color: "#14110d",
    textDecoration: "underline",
  },
};
