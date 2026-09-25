"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

interface SubscribeFormProps {
  placeholder?: string;
  buttonLabel?: string;
  buttonClassName?: string;
  inputClassName?: string;
  successMessage?: string;
  list?: string;
  segment?: string;
}

type Step = "email" | "code" | "success";

const smallTextStyle: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: "9px",
  letterSpacing: ".1em",
  color: "var(--mute, #7a6f5c)",
  marginTop: "6px",
};

const errorTextStyle: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: "9px",
  letterSpacing: ".1em",
  color: "var(--ochre)",
  marginTop: "6px",
};

const linkButtonStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  padding: 0,
  font: "inherit",
  color: "var(--ochre)",
  textDecoration: "underline",
  cursor: "pointer",
};

/**
 * Every "enter your email" subscribe widget on the site — homepage, footers,
 * article/piece newsletter breaks, the Shop email band — renders through
 * this one component. It's no longer a plain "add this email to a list"
 * form: subscribing now goes through the magic-code sign-in flow (see
 * class-culture-magic-otp.php) — a code is emailed, entering it both
 * subscribes the address to $list and signs the visitor into Moveee, new
 * account or existing one alike. Same two-step shape as
 * components/LiterarySubscribeForm.tsx (that one is a full-page variant
 * with its own locked copy; this one stays a drop-in input+button pair so
 * every existing call site's surrounding layout is untouched).
 *
 * `segment` is accepted for backward compatibility with existing call
 * sites but currently unused — the magic-OTP request endpoint has no
 * per-region segment concept.
 */
export default function SubscribeForm({
  placeholder = "your@email.com",
  buttonLabel = "Subscribe →",
  buttonClassName = "",
  inputClassName = "",
  successMessage = "You're in. First issue arrives Tuesday.",
  list = "culture-drop",
}: SubscribeFormProps) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<Step>("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleRequestCode(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!email || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/newsletter/magic-otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStep("code");
      } else {
        setError("Couldn't send a code — try again.");
      }
    } catch {
      setError("Couldn't send a code — try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyCode(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!code || busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await signIn("credentials", {
        otpEmail: email,
        otpCode: code,
        otpList: list,
        redirect: false,
      });
      if (!result || result.error) {
        setError("That code didn't work — try again.");
        return;
      }
      setStep("success");
    } catch {
      setError("Couldn't reach the server — try again.");
    } finally {
      setBusy(false);
    }
  }

  if (step === "success") {
    return (
      <p
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "10px",
          letterSpacing: ".12em",
          textTransform: "uppercase",
          color: "var(--ochre)",
        }}
      >
        {successMessage}
      </p>
    );
  }

  if (step === "code") {
    return (
      <>
        <input
          type="text"
          inputMode="numeric"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter your code"
          required
          disabled={busy}
          className={inputClassName}
        />
        <button type="button" onClick={handleVerifyCode} disabled={busy} className={buttonClassName}>
          {busy ? "Confirming…" : "Confirm →"}
        </button>
        <p style={smallTextStyle}>
          Code sent to {email}.{" "}
          <button
            type="button"
            style={linkButtonStyle}
            onClick={() => {
              setStep("email");
              setCode("");
              setError("");
            }}
          >
            Use a different email
          </button>
        </p>
        {error && <p style={errorTextStyle}>{error}</p>}
      </>
    );
  }

  return (
    <>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={placeholder}
        required
        disabled={busy}
        className={inputClassName}
      />
      <button type="button" onClick={handleRequestCode} disabled={busy} className={buttonClassName}>
        {busy ? "Sending…" : buttonLabel}
      </button>
      {error && <p style={errorTextStyle}>{error}</p>}
    </>
  );
}
