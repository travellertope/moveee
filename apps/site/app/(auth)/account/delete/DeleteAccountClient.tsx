"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";

export default function DeleteAccountClient({ email }: { email: string }) {
  const [status, setStatus] = useState<"idle" | "confirming" | "loading" | "sent" | "error">("idle");

  async function handleConfirm() {
    setStatus("loading");
    try {
      const res = await fetch("/api/account/delete-request", { method: "POST" });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      setStatus("sent");
      // Clear the session — nothing more to do in this app until the emailed
      // link is confirmed, and staying signed in while a deletion is pending
      // would be confusing.
      signOut({ redirect: false });
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <>
        <p className="auth-sub">
          Check <strong>{email}</strong> for a confirmation link. Your account won&rsquo;t be
          deleted until you click it — the link expires in 24 hours.
        </p>
        <Link href="/" className="auth-link">Back to Moveee</Link>
      </>
    );
  }

  if (status === "confirming") {
    return (
      <>
        <div className="auth-error" style={{ marginBottom: 20 }}>
          This will permanently delete your Moveee account — your profile, posts, wallet balance,
          and everything tied to it. This cannot be undone.
        </div>
        <button
          type="button"
          className="auth-btn-primary"
          onClick={handleConfirm}
          disabled={(status as string) === "loading"}
        >
          {(status as string) === "loading" ? "Sending…" : "Yes, send me a confirmation link"}
        </button>
        <div className="auth-footer">
          <button type="button" className="auth-footer-btn" onClick={() => setStatus("idle")}>
            Cancel
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <p className="auth-sub">
        Deleting your account removes your profile, posts, and account data from Moveee. We&rsquo;ll
        email a confirmation link to <strong>{email}</strong> — nothing is deleted until you click it.
      </p>
      {status === "error" && (
        <div className="auth-error" style={{ marginBottom: 16 }}>
          Something went wrong. Please try again, or email{" "}
          <a href="mailto:privacy@themoveee.com">privacy@themoveee.com</a>.
        </div>
      )}
      <button type="button" className="auth-btn-primary" onClick={() => setStatus("confirming")}>
        Delete my account
      </button>
      <div className="auth-footer">
        <p>
          Changed your mind? <Link href="/member" className="auth-link">Back to your account</Link>
        </p>
      </div>
    </>
  );
}
