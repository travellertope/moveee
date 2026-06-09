"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";

type Mode = "register" | "step-up";

interface Props {
  mode: Mode;
  onSuccess?: (token?: string) => void;
  onDismiss?: () => void;
  /** For step-up: called with the step_up_token on success */
  onStepUpToken?: (token: string) => void;
}

export default function PasskeyPrompt({ mode, onSuccess, onDismiss, onStepUpToken }: Props) {
  const { update } = useSession();
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [deviceName, setDeviceName] = useState(() => {
    if (typeof navigator === "undefined") return "My Device";
    const ua = navigator.userAgent;
    if (/iPhone/.test(ua)) return "iPhone";
    if (/iPad/.test(ua)) return "iPad";
    if (/Android/.test(ua)) return "Android";
    if (/Mac/.test(ua)) return "Mac";
    if (/Windows/.test(ua)) return "Windows PC";
    return "My Device";
  });

  async function handleRegister() {
    setStatus("working");
    setMessage("");
    try {
      const optRes = await fetch("/api/auth/passkey/register-options", { method: "POST" });
      if (!optRes.ok) throw new Error((await optRes.json()).error ?? "Failed to get options");
      const options = await optRes.json();

      const attResp = await startRegistration({ optionsJSON: options });
      const verRes = await fetch("/api/auth/passkey/register-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...attResp, device_name: deviceName, transports: attResp.response.transports ?? [] }),
      });
      const verData = await verRes.json();
      if (!verRes.ok) throw new Error(verData.error ?? "Registration failed");

      await update({ hasPasskey: true, passkeyCount: 1 });
      setStatus("done");
      onSuccess?.();
    } catch (err: any) {
      if (err?.name === "NotAllowedError") {
        setStatus("idle");
        setMessage("Cancelled.");
        return;
      }
      setStatus("error");
      setMessage(err.message ?? "Something went wrong.");
    }
  }

  async function handleStepUp() {
    setStatus("working");
    setMessage("");
    try {
      const optRes = await fetch("/api/auth/passkey/step-up", { method: "POST" });
      if (!optRes.ok) {
        const e = await optRes.json();
        throw new Error(e.error ?? "Failed to get options");
      }
      const options = await optRes.json();

      const assResp = await startAuthentication({ optionsJSON: options });
      const verRes = await fetch("/api/auth/passkey/step-up-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assResp),
      });
      const verData = await verRes.json();
      if (!verRes.ok) throw new Error(verData.error ?? "Verification failed");

      setStatus("done");
      onStepUpToken?.(verData.step_up_token);
      onSuccess?.();
    } catch (err: any) {
      if (err?.name === "NotAllowedError") {
        setStatus("idle");
        setMessage("Cancelled.");
        return;
      }
      setStatus("error");
      setMessage(err.message ?? "Something went wrong.");
    }
  }

  const isRegister = mode === "register";

  return (
    <div style={{
      background: "var(--paper)",
      border: "1px solid rgba(42,36,28,.12)",
      borderRadius: 6,
      padding: "20px 24px",
      maxWidth: 440,
    }}>
      <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>
        {isRegister ? "Secure your account with a Passkey" : "Confirm with your Passkey"}
      </div>
      <p style={{ fontSize: "0.82rem", color: "var(--mute)", lineHeight: 1.6, margin: "0 0 16px" }}>
        {isRegister
          ? "Passkeys use your device's biometrics (fingerprint, Face ID) for faster, safer sign-in. Required to earn and spend Moveee Credits."
          : "Touch your fingerprint sensor or use Face ID to confirm this action."}
      </p>

      {isRegister && status === "idle" && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: "0.76rem", color: "var(--mute)", marginBottom: 4 }}>Device name (optional)</div>
          <input
            type="text"
            value={deviceName}
            onChange={e => setDeviceName(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid rgba(42,36,28,.15)",
              borderRadius: 4,
              fontSize: "0.85rem",
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
          />
        </div>
      )}

      {status === "working" && (
        <p style={{ fontSize: "0.82rem", color: "var(--ochre)", margin: "0 0 12px" }}>
          ⬡ Waiting for your device…
        </p>
      )}
      {status === "done" && (
        <p style={{ fontSize: "0.82rem", color: "#2e7d32", margin: "0 0 12px" }}>
          ✓ {isRegister ? "Passkey registered!" : "Confirmed!"}
        </p>
      )}
      {message && status !== "done" && (
        <p style={{ fontSize: "0.82rem", color: "#c5491f", margin: "0 0 12px" }}>{message}</p>
      )}

      {status !== "done" && (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={isRegister ? handleRegister : handleStepUp}
            disabled={status === "working"}
            style={{
              padding: "9px 18px",
              background: "var(--ink)",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              fontSize: "0.8rem",
              fontWeight: 600,
              letterSpacing: ".06em",
              textTransform: "uppercase",
              cursor: status === "working" ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              opacity: status === "working" ? 0.6 : 1,
            }}
          >
            {status === "working" ? "Working…" : isRegister ? "Set up Passkey" : "Use Passkey"}
          </button>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              style={{
                padding: "9px 14px",
                background: "transparent",
                color: "var(--mute)",
                border: "1px solid rgba(42,36,28,.12)",
                borderRadius: 4,
                fontSize: "0.8rem",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {isRegister ? "Maybe later" : "Cancel"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
