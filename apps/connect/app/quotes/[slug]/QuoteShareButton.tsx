"use client";

import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

const CARD_W = 360;
const CARD_H = 600;
const SCALE = 2; // @2x for retina

function quoteFontSize(len: number): number {
  if (len > 420) return 13;
  if (len > 340) return 15;
  if (len > 260) return 17;
  if (len > 180) return 19;
  if (len > 110) return 21;
  return 24;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? current + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

interface Props {
  quoteText: string;
  quoteAuthor?: string | null;
  quoteSource?: string | null;
  quoteUrl: string;
}

export default function QuoteShareButton({ quoteText, quoteAuthor, quoteSource, quoteUrl }: Props) {
  const qrRef = useRef<HTMLCanvasElement>(null);
  const [busy, setBusy] = useState(false);

  async function generate() {
    if (busy) return;
    setBusy(true);
    try {
      await Promise.allSettled([
        document.fonts.load('italic 24px "Fraunces"'),
        document.fonts.load('bold 64px "Fraunces"'),
      ]);

      const canvas = document.createElement("canvas");
      canvas.width = CARD_W * SCALE;
      canvas.height = CARD_H * SCALE;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(SCALE, SCALE);

      // Dark warm gradient background
      const grad = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
      grad.addColorStop(0, "#1a140d");
      grad.addColorStop(1, "#2a1d10");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CARD_W, CARD_H);

      // White logo
      const logo = new Image();
      logo.src = "/logo-white.png";
      await new Promise<void>((resolve) => { logo.onload = () => resolve(); logo.onerror = () => resolve(); });
      const logoH = 22;
      const logoW = Math.round((717 / 107) * logoH); // natural ratio
      ctx.drawImage(logo, (CARD_W - logoW) / 2, 36, logoW, logoH);

      // Tagline
      ctx.font = '10px "JetBrains Mono", "Courier New", monospace';
      ctx.fillStyle = "#c9a878";
      ctx.textAlign = "center";
      try { (ctx as any).letterSpacing = "1px"; } catch {}
      ctx.fillText("CONNECT TO CULTURE", CARD_W / 2, 75);
      try { (ctx as any).letterSpacing = "0px"; } catch {}

      // Gold divider
      ctx.fillStyle = "#b38238";
      ctx.fillRect((CARD_W - 48) / 2, 88, 48, 2);

      // Opening quote mark
      const frauncesLoaded = document.fonts.check('italic 24px "Fraunces"');
      const serifStack = frauncesLoaded ? '"Fraunces", Georgia, serif' : "Georgia, serif";
      ctx.font = `bold 64px ${serifStack}`;
      ctx.fillStyle = "#b38238";
      ctx.textAlign = "center";
      ctx.fillText("“", CARD_W / 2, 152);

      // Quote text
      const fz = quoteFontSize(quoteText.length);
      const lineH = fz * 1.45;
      ctx.font = `italic ${fz}px ${serifStack}`;
      ctx.fillStyle = "#f3ece0";
      ctx.textAlign = "center";
      const lines = wrapText(ctx, quoteText, 300);
      let y = 166 + fz;
      for (const line of lines) {
        ctx.fillText(line, CARD_W / 2, y);
        y += lineH;
      }

      // Attribution
      y += 16;
      if (quoteAuthor) {
        ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = "#e8ddcb";
        ctx.textAlign = "center";
        ctx.fillText(`— ${quoteAuthor}`, CARD_W / 2, y);
        y += 22;
      }
      if (quoteSource) {
        ctx.font = '11px "JetBrains Mono", "Courier New", monospace';
        ctx.fillStyle = "#9c8a70";
        ctx.fillText(quoteSource, CARD_W / 2, y);
      }

      // QR code — copy from hidden QRCodeCanvas rendered by qrcode.react
      const qrSize = 84;
      const qrPad = 10;
      const boxSize = qrSize + qrPad * 2;
      const labelY = CARD_H - 36;
      const boxY = labelY - 16 - boxSize;
      const boxX = (CARD_W - boxSize) / 2;

      ctx.fillStyle = "#fff";
      drawRoundRect(ctx, boxX, boxY, boxSize, boxSize, 4);
      ctx.fill();

      if (qrRef.current) {
        ctx.drawImage(qrRef.current, boxX + qrPad, boxY + qrPad, qrSize, qrSize);
      }

      ctx.font = '10px "JetBrains Mono", "Courier New", monospace';
      ctx.fillStyle = "#9c8a70";
      ctx.textAlign = "center";
      ctx.fillText("Scan to read on Moveee", CARD_W / 2, labelY);

      canvas.toBlob(async (blob) => {
        if (!blob) { setBusy(false); return; }
        const file = new File([blob], "quote.png", { type: "image/png" });
        if (navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: quoteAuthor ? `Quote by ${quoteAuthor}` : "Quote via Moveee",
            });
          } catch (err: any) {
            if (err?.name !== "AbortError") downloadBlob(blob);
          }
        } else {
          downloadBlob(blob);
        }
        setBusy(false);
      }, "image/png");
    } catch {
      setBusy(false);
    }
  }

  function downloadBlob(blob: Blob) {
    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = "quote.png";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  return (
    <>
      {/* Off-screen QR canvas — rendered by qrcode.react, copied to main canvas on share */}
      <div style={{ position: "fixed", left: -9999, top: -9999, opacity: 0, pointerEvents: "none" }} aria-hidden="true">
        <QRCodeCanvas
          ref={qrRef}
          value={quoteUrl}
          size={84}
          bgColor="#ffffff"
          fgColor="#1a140d"
          level="M"
        />
      </div>
      <button
        type="button"
        onClick={generate}
        disabled={busy}
        style={{
          display: "inline-flex", alignItems: "center", gap: "0.4rem",
          background: "none", border: "1px solid rgba(20,17,13,0.15)",
          borderRadius: "var(--radius-lg, 6px)", cursor: busy ? "default" : "pointer",
          padding: "0.45rem 0.85rem", fontSize: "0.78rem", fontWeight: 600,
          color: busy ? "var(--mute)" : "var(--ink)", transition: "opacity 0.15s",
          opacity: busy ? 0.6 : 1,
        }}
        aria-label="Share as image card"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
          <polyline points="16 6 12 2 8 6"/>
          <line x1="12" y1="2" x2="12" y2="15"/>
        </svg>
        {busy ? "Generating…" : "Share as image"}
      </button>
    </>
  );
}
