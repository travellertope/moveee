"use client";

import { useState } from "react";

interface SubscribeFormProps {
  placeholder?: string;
  buttonLabel?: string;
  buttonClassName?: string;
  inputClassName?: string;
  successMessage?: string;
  list?: string;
  segment?: string;
}

export default function SubscribeForm({
  placeholder = "your@email.com",
  buttonLabel = "Subscribe →",
  buttonClassName = "",
  inputClassName = "",
  successMessage = "You're in. First issue arrives Tuesday.",
  list = "culture-drop",
  segment = "",
}: SubscribeFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, list, segment }),
      });
      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--ochre)" }}>{successMessage}</p>;
  }

  return (
    <>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={placeholder}
        required
        disabled={status === "loading"}
        className={inputClassName}
      />
      <button
        type="submit"
        onClick={handleSubmit}
        disabled={status === "loading"}
        className={buttonClassName}
      >
        {status === "loading" ? "Subscribing..." : buttonLabel}
      </button>
      {status === "error" && (
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", letterSpacing: ".1em", color: "var(--ochre)", marginTop: "6px" }}>
          Something went wrong — try again.
        </p>
      )}
    </>
  );
}
