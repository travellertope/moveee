"use client";

import { useState, FormEvent, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import "../auth.css";

type ViewState = "form" | "check-email";

function RegisterForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const referralFromUrl = searchParams.get("ref") || "";
  const nextUrl = searchParams.get("next") || "";
  const isUpgrade = searchParams.get("upgrade") === "patron";

  // Upgrade flow: already logged-in member going to Moveee Pro
  if (isUpgrade && session) {
    router.replace(`/register/complete?upgrade=patron${nextUrl ? "&next=" + encodeURIComponent(nextUrl) : ""}`);
    return null;
  }

  const [view, setView] = useState<ViewState>("form");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // Honeypot — a field real users never see or fill, but form-filling bots
  // that blindly populate every input often do. Paired with a minimum
  // time-on-form check server-side (see /api/register/route.ts); neither
  // needs an external CAPTCHA service or API keys.
  const [website, setWebsite] = useState("");
  const [formLoadedAt] = useState(() => Date.now());

  function validate(): string {
    if (!username.trim()) return "Username is required.";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return "A valid email address is required.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    return "";
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const body: Record<string, string> = {
        username: username.trim(),
        email: email.trim(),
        password,
        display_name: username.trim(),
        directory_opt_in: "1",
        website, // honeypot — must stay empty
        form_loaded_at: String(formLoadedAt),
      };
      if (referralFromUrl) body.referral_code = referralFromUrl;
      if (nextUrl) body.next = nextUrl;

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message ?? "Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      setView("check-email");
    } catch {
      setError("Service temporarily unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (view === "check-email") {
    return (
      <div className="auth-page">
        <div className="auth-card auth-card--center">
          <span className="auth-check-icon">✉</span>
          <h1 className="auth-heading auth-heading--sm">Check your inbox</h1>
          <p className="auth-sub" style={{ marginBottom: 8 }}>We sent a verification link to</p>
          <p style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)", margin: "0 0 20px" }}>{email}</p>
          <p className="auth-sub">
            Click the link in that email to verify your address and continue setting up your profile.
            The link expires in 24 hours.
          </p>
          <p style={{ fontSize: 13, color: "var(--mute)" }}>
            Wrong address?{" "}
            <button type="button" onClick={() => setView("form")} className="auth-footer-btn">
              Go back
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-heading">Join the Community</h1>
        <p className="auth-sub auth-sub--tight">
          Free to join. Enter a few details and we&apos;ll send you a verification link.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {/* Honeypot — visually and semantically hidden from real users
              (off-screen, not display:none, since some bots skip that but
              not this), left unlabeled so autofill doesn't touch it. */}
          <div style={{ position: "absolute", left: "-9999px", top: "auto", width: 1, height: 1, overflow: "hidden" }} aria-hidden="true">
            <label htmlFor="website">Website</label>
            <input
              id="website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="email">
              Email <span className="auth-label-required">*</span>
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              placeholder="you@example.com"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="username">
              Username <span className="auth-label-required">*</span>
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              required
              placeholder="@handle"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="auth-input"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="password">
              Password <span className="auth-label-required">*</span>
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
            />
            <span className="auth-hint">At least 8 characters</span>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-btn-primary" disabled={loading}>
            {loading ? "Creating account…" : "Create account →"}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link href="/login" className="auth-link">Sign in</Link></p>
          <p>
            Want Moveee Pro?{" "}
            <Link
              href={`/register/complete?upgrade=patron${nextUrl ? "&next=" + encodeURIComponent(nextUrl) : ""}`}
              className="auth-link"
            >
              Upgrade after joining
            </Link>
          </p>
        </div>
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
