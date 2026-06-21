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
          background: "#ffffff",
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
          <a href="/feed" style={{ color: "#b38238" }}>
            web.themoveee.com
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
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          <a
            href="/feed"
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
