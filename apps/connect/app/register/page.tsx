"use client";

import { useState, FormEvent, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

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
      <div style={styles.page}>
        <div style={{ ...styles.card, textAlign: "center" }}>
          <div style={styles.checkIcon}>✉</div>
          <p style={styles.eyebrow}>One more step</p>
          <h1 style={{ ...styles.heading, fontSize: 24, marginBottom: 12 }}>Check your inbox</h1>
          <p style={{ fontSize: 15, color: "#3d3d3d", lineHeight: 1.7, margin: "0 0 8px" }}>
            We sent a verification link to
          </p>
          <p style={{ fontSize: 16, fontWeight: 600, color: "#14110d", margin: "0 0 20px" }}>
            {email}
          </p>
          <p style={{ fontSize: 14, color: "#7a6f5c", lineHeight: 1.7, margin: "0 0 28px" }}>
            Click the link in that email to verify your address and continue setting up your profile.
            The link expires in 24 hours.
          </p>
          <p style={{ fontSize: 13, color: "#9e9589" }}>
            Wrong address?{" "}
            <button
              type="button"
              onClick={() => setView("form")}
              style={{ background: "none", border: "none", color: "#14110d", textDecoration: "underline", cursor: "pointer", fontSize: 13, padding: 0 }}
            >
              Go back
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <p style={styles.eyebrow}>The Moveee — Culture Community</p>
        <h1 style={styles.heading}>Join the Community</h1>
        <p style={{ fontSize: 14, color: "#7a6f5c", margin: "-12px 0 28px", lineHeight: 1.6 }}>
          Free to join. Enter a few details and we&apos;ll send you a verification link.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div style={styles.field}>
            <label style={styles.label} htmlFor="email">
              Email <span style={{ color: "#c5491f" }}>*</span>
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="you@example.com"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label} htmlFor="username">
              Username <span style={{ color: "#c5491f" }}>*</span>
            </label>
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

          <div style={styles.field}>
            <label style={styles.label} htmlFor="password">
              Password <span style={{ color: "#c5491f" }}>*</span>
            </label>
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

          {error && <p style={styles.error}>{error}</p>}

          <button
            type="submit"
            style={{ ...styles.btnPrimary, width: "100%", marginTop: 8, opacity: loading ? 0.7 : 1 }}
            disabled={loading}
          >
            {loading ? "Creating account…" : "Create account →"}
          </button>
        </form>

        <p style={{ fontSize: 13, color: "#7a6f5c", marginTop: 20, marginBottom: 0, textAlign: "center" }}>
          Already have an account?{" "}
          <Link href="/login" style={styles.link}>Sign in</Link>
        </p>
        <p style={{ fontSize: 13, color: "#7a6f5c", marginTop: 8, marginBottom: 0, textAlign: "center" }}>
          Want Moveee Pro?{" "}
          <Link
            href={`/register/complete?upgrade=patron${nextUrl ? "&next=" + encodeURIComponent(nextUrl) : ""}`}
            style={styles.link}
          >
            Upgrade after joining
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
    background: "#ffffff",
    padding: "60px 24px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  card: {
    maxWidth: 480,
    width: "100%",
    background: "#fffdf8",
    borderRadius: 4,
    border: "1px solid #e8e0d4",
    padding: "40px 40px 32px",
    color: "#14110d",
  },
  checkIcon: {
    fontSize: 48,
    marginBottom: 16,
    display: "block",
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: "0.2em",
    textTransform: "uppercase" as const,
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
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
  },
  hint: {
    display: "block",
    fontSize: 12,
    color: "#7a6f5c",
    marginTop: 4,
  },
  btnPrimary: {
    padding: "12px 24px",
    background: "#14110d",
    color: "#ffffff",
    border: "none",
    borderRadius: 3,
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
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
  link: {
    color: "#14110d",
    textDecoration: "underline",
  },
};
