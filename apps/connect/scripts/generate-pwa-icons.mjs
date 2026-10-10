/**
 * Generates PWA icons from logo-white.png.
 * Run: node scripts/generate-pwa-icons.mjs
 * Requires: sharp (already a project dependency)
 */
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(__dirname, "../public/logo-white.png");
const outDir = path.join(__dirname, "../public/icons");

fs.mkdirSync(outDir, { recursive: true });

const sizes = [
  { name: "icon-192.png",          size: 192, bg: "#14110d", pad: 0.15 },
  { name: "icon-512.png",          size: 512, bg: "#14110d", pad: 0.15 },
  { name: "icon-512-maskable.png", size: 512, bg: "#14110d", pad: 0.25 }, // extra safe-zone padding for maskable
  { name: "apple-touch-icon.png",  size: 180, bg: "#14110d", pad: 0.15 },
];

for (const { name, size, bg, pad } of sizes) {
  const logoSize = Math.round(size * (1 - pad * 2));
  const offset   = Math.round(size * pad);

  await sharp(src)
    .resize(logoSize, logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer()
    .then((logoBuffer) =>
      sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: bg,
        },
      })
        .composite([{ input: logoBuffer, top: offset, left: offset }])
        .png()
        .toFile(path.join(outDir, name))
    );

  console.log(`✓ ${name} (${size}×${size})`);
}

console.log("\nDone — icons written to public/icons/");
