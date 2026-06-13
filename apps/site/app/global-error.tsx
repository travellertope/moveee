"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  // global-error renders outside the root layout so it must include <html>/<body>
  // and inline its own minimal styles — no access to globals.css here.
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          textAlign: "center",
          padding: "80px 24px",
          background: "#f3ece0",
          fontFamily: "Georgia, serif",
          color: "#14110d",
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#b38238",
            marginBottom: 24,
            fontFamily: "monospace",
          }}
        >
          Something went wrong
        </div>
        <h1
          style={{
            fontSize: "clamp(40px, 6vw, 72px)",
            fontWeight: 300,
            fontStyle: "italic",
            margin: "0 0 24px",
          }}
        >
          A brief interruption
        </h1>
        <p
          style={{
            fontSize: 18,
            fontWeight: 300,
            fontStyle: "italic",
            color: "#7a6e63",
            lineHeight: 1.6,
            maxWidth: 560,
            marginBottom: 48,
          }}
        >
          We hit an unexpected snag. Please try refreshing, or visit{" "}
          <a href="/" style={{ color: "#b38238" }}>
            themoveee.com
          </a>{" "}
          to start over.
        </p>
        <div style={{ display: "flex", gap: 16 }}>
          <button
            onClick={reset}
            style={{
              fontFamily: "monospace",
              fontSize: 10,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              padding: "14px 28px",
              background: "#b38238",
              border: "1px solid #b38238",
              color: "#f3ece0",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          <a
            href="/"
            style={{
              fontFamily: "monospace",
              fontSize: 10,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              padding: "14px 28px",
              border: "1px solid #ccc",
              color: "#14110d",
              textDecoration: "none",
            }}
          >
            Go home
          </a>
        </div>
      </body>
    </html>
  );
}
