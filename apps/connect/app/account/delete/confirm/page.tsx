"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import "../../../auth.css";

// Public — no login required. The uid/token pair from the emailed link IS
// the credential (same trust model as /register/complete's verify step), so
// this works even for a visitor who's signed out or never has this app
// installed, per Google Play's account-deletion policy.
function ConfirmDeletionForm() {
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    uid && token ? "idle" : "error"
  );
  const [errorMessage, setErrorMessage] = useState("");

  async function handleConfirm() {
    if (!uid || !token) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/account/delete-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: Number(uid), token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        setErrorMessage(data?.message ?? "This link is invalid or has expired.");
        setStatus("error");
        return;
      }
      setStatus("done");
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <>
        <p className="auth-sub">
          Your Moveee account has been permanently deleted. We&rsquo;re sorry to see you go.
        </p>
        <Link href="/" className="auth-link">Back to Moveee</Link>
      </>
    );
  }

  if (status === "error") {
    return (
      <>
        <div className="auth-error" style={{ marginBottom: 16 }}>
          {uid && token
            ? errorMessage || "This link is invalid or has expired."
            : "This link is missing its confirmation code."}
        </div>
        <p className="auth-sub">
          If your account still exists, you can request a new link from{" "}
          <Link href="/account/delete" className="auth-link">the deletion page</Link>, or email{" "}
          <a href="mailto:privacy@themoveee.com">privacy@themoveee.com</a>.
        </p>
      </>
    );
  }

  return (
    <>
      <p className="auth-sub">
        This will permanently delete your Moveee account — your profile, posts, wallet balance,
        and everything tied to it. This cannot be undone.
      </p>
      <button
        type="button"
        className="auth-btn-primary"
        onClick={handleConfirm}
        disabled={(status as string) === "loading"}
      >
        {(status as string) === "loading" ? "Deleting…" : "Yes, permanently delete my account"}
      </button>
    </>
  );
}

export default function ConfirmDeletePage() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-heading auth-heading--sm">Confirm account deletion</h1>
        <Suspense>
          <ConfirmDeletionForm />
        </Suspense>
      </div>
    </div>
  );
}
