"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

function MagicSigninInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"verifying" | "error">("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token    = params.get("token");
    const redirect = params.get("redirect") || "/feed";

    if (!token) {
      setStatus("error");
      setMessage("Invalid link — no token found.");
      return;
    }

    signIn("credentials", {
      magicSigninToken: token,
      redirect: false,
    }).then((result) => {
      if (result?.error) {
        setStatus("error");
        setMessage(
          result.error === "invalid_token" || result.error === "expired_token"
            ? "This link has expired or already been used. Please sign in manually."
            : "Something went wrong. Please try again."
        );
        return;
      }
      router.replace(redirect);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
        fontFamily: "inherit",
      }}
    >
      {status === "verifying" ? (
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 16, color: "var(--ink-soft, #555)", margin: 0 }}>
            Signing you in…
          </p>
        </div>
      ) : (
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <p style={{ fontSize: 16, color: "var(--ochre, #7a241c)", margin: "0 0 16px" }}>
            {message}
          </p>
          <a
            href="/feed"
            style={{
              fontSize: 14,
              color: "var(--ink-soft, #555)",
              textDecoration: "underline",
            }}
          >
            Go to feed
          </a>
        </div>
      )}
    </main>
  );
}

export default function MagicSigninPage() {
  return (
    <Suspense>
      <MagicSigninInner />
    </Suspense>
  );
}
