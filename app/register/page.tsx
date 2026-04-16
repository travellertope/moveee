"use client";

import { useState, useEffect, FormEvent, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CountrySelect, CitySelect } from "@/components/LocationSelect";

interface Chapter {
  id: number;
  name: string;
  slug: string;
}

type Step = 1 | 2 | 3 | 4;

function RegisterForm() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const referralFromUrl = searchParams.get("ref") || "";
  const tierFromUrl = searchParams.get("tier") as "citizen" | "patron" | null;
  const isUpgrade = searchParams.get("upgrade") === "patron";

  // Form state
  const [step, setStep] = useState<Step>(1);
  const [chapters, setChapters] = useState<Chapter[]>([]);

  // If upgrading or Tier pre-selected, handle step routing
  useEffect(() => {
    if (isUpgrade && session) {
      setStep(3); // Skip to Membership
      setTier("patron");
    } else if (tierFromUrl) {
      setTier(tierFromUrl);
    }
  }, [isUpgrade, session, tierFromUrl]);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [diffWhatsapp, setDiffWhatsapp] = useState(false);
  const [whatsapp, setWhatsapp] = useState("");
  // KYC
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [nationality, setNationality] = useState("");
  const [countryOfResidence, setCountryOfResidence] = useState("");
  const [city, setCity] = useState("");
  const [occupation, setOccupation] = useState("");
  const [tier, setTier] = useState<"citizen" | "patron">(tierFromUrl || "citizen");
  const [primaryChapter, setPrimaryChapter] = useState(0);
  const [secondaryChapter, setSecondaryChapter] = useState(0);
  const [referralCode] = useState(referralFromUrl);

  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [currency, setCurrency] = useState<"NGN" | "USD">("NGN");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-detect currency based on country
  useEffect(() => {
    if (countryOfResidence) {
      const isNigeria = countryOfResidence.toLowerCase().includes("nigeria") || countryOfResidence === "NG";
      setCurrency(isNigeria ? "NGN" : "USD");
    }
  }, [countryOfResidence]);

  useEffect(() => {
    fetch("/api/chapters")
      .then((r) => r.json())
      .then((data: Chapter[]) => setChapters(data))
      .catch(() => {});
  }, []);

  function validateStep(s: Step): string {
    if (s === 1) {
      if (!username.trim()) return "Username is required.";
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return "A valid email is required.";
      if (password.length < 8) return "Password must be at least 8 characters.";
      if (!phone.trim()) return "Phone number is required.";
    }
    if (s === 2) {
      if (!dateOfBirth) return "Date of birth is required.";
      if (!nationality.trim()) return "Nationality is required.";
      if (!countryOfResidence.trim()) return "Country of residence is required.";
    }
    if (s === 4) {
      if (!primaryChapter) return "Please select your primary chapter.";
      if (tier === "patron" && secondaryChapter && secondaryChapter === primaryChapter)
        return "Secondary chapter must differ from primary.";
    }
    return "";
  }

  function nextStep() {
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setError("");
    setStep((s) => (s < 4 ? ((s + 1) as Step) : s));
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
        body: JSON.stringify({ 
          plan_key: `${billingCycle}_${currency.toLowerCase()}`,
          primary_chapter: primaryChapter,
          secondary_chapter: secondaryChapter
        })
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
  async function handleSubmit(e?: any) {
    if (e && e.preventDefault) e.preventDefault();

    // Common validation for all flows (including upgrades)
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }

    if (isUpgrade && session) {
      if (step < 4) {
        nextStep();
        return;
      }
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
      phone: phone.trim(),
      gender,
      date_of_birth: dateOfBirth,
      nationality: nationality.trim(),
      country_of_residence: countryOfResidence.trim(),
      city: city.trim(),
      occupation: occupation.trim(),
      tier,
      primary_chapter: primaryChapter,
    };

    if (diffWhatsapp && whatsapp.trim()) body.whatsapp = whatsapp.trim();
    if (tier === "patron") {
      if (secondaryChapter) body.secondary_chapter = secondaryChapter;
      body.plan_key = `${billingCycle}_${currency.toLowerCase()}`;
    }
    if (referralCode) body.referral_code = referralCode;

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

      // Patron tier — redirect to Paystack checkout.
      if (data.requires_payment && data.checkout_url) {
        window.location.href = data.checkout_url;
        return;
      }

      // Auto sign-in after successful registration.
      const result = await signIn("credentials", {
        username: username.trim(),
        password,
        redirect: false,
      });

      setLoading(false);

      if (result?.error) {
        // Registration succeeded but auto-login failed — send to login page.
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

  const progressPercent = ((step - 1) / 3) * 100;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <p style={styles.eyebrow}>The Moveee &mdash; Culture Community</p>
        <h1 style={styles.heading}>{isUpgrade ? "Upgrade to Patron" : "Join the Community"}</h1>

        {/* Progress bar */}
        {!isUpgrade && (
          <div style={styles.progressWrap}>
            {(["Account", "About You", "Membership", "Chapter"] as const).map((label, i) => (
              <div key={label} style={styles.progressStep}>
                <div
                  style={{
                    ...styles.progressDot,
                    background: step > i ? "#14110d" : step === i + 1 ? "#14110d" : "#d4cbbf",
                    color: step >= i + 1 ? "#f5f0e8" : "#7a6f5c",
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
          {/* Step 1: Account */}
          {step === 1 && (
            <div>
              <h2 style={styles.stepHeading}>Create Your Account</h2>

              <div style={styles.row}>
                <div style={{ ...styles.field, flex: 1 }}>
                  <label style={styles.label} htmlFor="username">Username</label>
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={styles.input}
                  />
                </div>
                <div style={{ ...styles.field, flex: 1 }}>
                  <label style={styles.label} htmlFor="display_name">Display Name</label>
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
              </div>

              <div style={styles.field}>
                <label style={styles.label} htmlFor="email">Email</label>
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
                <label style={styles.label} htmlFor="password">Password</label>
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
                <label style={styles.label} htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.checkRow}>
                <input
                  id="diff_wa"
                  type="checkbox"
                  checked={diffWhatsapp}
                  onChange={(e) => setDiffWhatsapp(e.target.checked)}
                  style={styles.checkbox}
                />
                <label htmlFor="diff_wa" style={styles.checkLabel}>
                  My WhatsApp number is different
                </label>
              </div>

              {diffWhatsapp && (
                <div style={styles.field}>
                  <label style={styles.label} htmlFor="whatsapp">WhatsApp Number</label>
                  <input
                    id="whatsapp"
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    style={styles.input}
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 2: About You (KYC) */}
          {step === 2 && (
            <div>
              <h2 style={styles.stepHeading}>About You</h2>

              <div style={styles.row}>
                <div style={{ ...styles.field, flex: 1 }}>
                  <label style={styles.label} htmlFor="gender">Gender</label>
                  <select
                    id="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    style={styles.input}
                  >
                    <option value="">Prefer not to say</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
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
              </div>

              <div style={styles.row}>
                <div style={{ ...styles.field, flex: 1 }}>
                  <label style={styles.label} htmlFor="nationality">Nationality <span style={{ color: "#c5491f" }}>*</span></label>
                  <CountrySelect
                    id="nationality"
                    value={nationality}
                    onChange={setNationality}
                    inputStyle={styles.input}
                    placeholder="Search countries…"
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
                  <label style={styles.label} htmlFor="city">City</label>
                  <CitySelect
                    id="city"
                    country={countryOfResidence}
                    value={city}
                    onChange={setCity}
                    inputStyle={styles.input}
                  />
                </div>
                <div style={{ ...styles.field, flex: 1 }}>
                  <label style={styles.label} htmlFor="occupation">Occupation</label>
                  <input
                    id="occupation"
                    type="text"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    style={styles.input}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Membership tier */}
          {step === 3 && (
            <div>
              <h2 style={styles.stepHeading}>Choose Your Membership</h2>

              {/* Billing Cycle Toggle (only for Patrons) */}
              <div style={{ ...styles.billingToggle, opacity: tier === "patron" ? 1 : 0.5 }}>
                <button
                  type="button"
                  onClick={() => setBillingCycle("monthly")}
                  style={{
                    ...styles.cycleBtn,
                    background: billingCycle === "monthly" ? "#14110d" : "transparent",
                    color: billingCycle === "monthly" ? "#f5f0e8" : "#7a6f5c",
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
                    color: billingCycle === "yearly" ? "#f5f0e8" : "#7a6f5c",
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
                        "One primary chapter",
                        "Access to online events",
                        "The Cultural Digest newsletter",
                        "Community forum",
                      ],
                    },
                    {
                      value: "patron",
                      label: "Patron",
                      price: currency === "NGN" 
                        ? (billingCycle === "monthly" ? "₦4,500" : "₦45,000")
                        : (billingCycle === "monthly" ? "$4" : "$40"),
                      period: billingCycle === "monthly" ? "/ mo" : "/ yr",
                      perks: [
                        "Everything in Citizen",
                        "Dual chapter membership",
                        "Physical event access",
                        "Priority invites & exclusive drops",
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
                    <div>
                      <h3 style={styles.tierLabel}>{label}</h3>
                      <div style={styles.priceContainer}>
                        <span style={styles.tierPrice}>{price}</span>
                        {"period" in rest && <span style={styles.pricePeriod}>{rest.period}</span>}
                      </div>
                      <ul style={styles.tierPerks}>
                        {perks.map((p) => (
                          <li key={p}>{p}</li>
                        ))}
                      </ul>
                    </div>
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

          {/* Step 4: Chapter */}
          {step === 4 && (
            <div>
              <h2 style={styles.stepHeading}>Select Your Chapter</h2>

              <div style={styles.field}>
                <label style={styles.label} htmlFor="primary_chapter">
                  Primary Chapter
                </label>
                <select
                  id="primary_chapter"
                  required
                  value={primaryChapter}
                  onChange={(e) => setPrimaryChapter(Number(e.target.value))}
                  style={styles.select}
                >
                  <option value={0}>— Select your chapter —</option>
                  {chapters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {tier === "patron" && (
                <div style={styles.field}>
                  <label style={styles.label} htmlFor="secondary_chapter">
                    Secondary Chapter{" "}
                    <span style={{ fontWeight: 400, color: "#7a6f5c" }}>(Patron perk)</span>
                  </label>
                  <select
                    id="secondary_chapter"
                    value={secondaryChapter}
                    onChange={(e) => setSecondaryChapter(Number(e.target.value))}
                    style={styles.select}
                  >
                    <option value={0}>— Optional —</option>
                    {chapters
                      .filter((c) => c.id !== primaryChapter)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <p style={{ fontSize: 13, color: "#7a6f5c", lineHeight: 1.6, marginTop: 8 }}>
                Chapters organise the community locally. You&apos;ll get access to events,
                discussions, and members in your chapter.
              </p>
            </div>
          )}

          {error && <p style={styles.error}>{error}</p>}

          {/* Nav buttons */}
          <div style={styles.nav}>
            {step > 1 ? (
              <button type="button" onClick={prevStep} style={styles.btnSecondary}>
                ← Back
              </button>
            ) : (
              <span />
            )}

            {step < 4 ? (
              <button type="button" onClick={nextStep} style={styles.btnPrimary}>
                Continue →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                style={{ ...styles.btnPrimary, opacity: loading ? 0.7 : 1 }}
                disabled={loading}
              >
                {loading
                  ? "Initializing…"
                  : tier === "patron"
                  ? "Continue to payment →"
                  : "Create account →"}
              </button>
            )}
          </div>
        </form>

        <p style={styles.footerText}>
          Already have an account?{" "}
          <Link href="/login" style={styles.link}>
            Sign in
          </Link>
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
    background: "#f5f0e8",
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
  // Progress
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
  // Steps
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
  select: {
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
    appearance: "none",
    WebkitAppearance: "none",
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%237a6f5c' stroke-width='1.5' fill='none'/%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 14px center",
    paddingRight: 36,
  },
  hint: {
    display: "block",
    fontSize: 12,
    color: "#7a6f5c",
    marginTop: 4,
  },
  checkRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  checkbox: {
    width: 16,
    height: 16,
    accentColor: "#14110d",
    cursor: "pointer",
    margin: 0,
  },
  checkLabel: {
    fontSize: 14,
    color: "#14110d",
    cursor: "pointer",
  },
  // Billing cycle
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
  // Tier cards
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
  // Nav
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
    color: "#f5f0e8",
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
