// Per-section "book cover" illustration for The Moveee Literary — used on the
// homepage's "Browse by Section" shelf (one per genre) and the Submissions
// spotlight card. Replaces the old flat gradient + 3-letter abbreviation
// (FIC/POE/ESS/…) with a real illustrated cover: a genre-specific colour
// gradient (each section gets its own hue, not one shared oxblood tone), a
// vignette + fine diagonal grain for paper texture, an inset frame, and a
// detailed multi-element motif that includes real colour accents (not just
// single-tone line art) so each cover reads as illustrated, not decorative.
//
// No stock photography here — this sandbox has no network access to source
// or verify a real image URL, and this codebase's own convention requires
// confirming an image actually resolves before hardcoding it. Vector
// illustration is the deliberate substitute.

const PALETTES: Record<string, { from: string; to: string; accent: string; accent2: string }> = {
  fiction: { from: "#3a0f14", to: "#7a1f2e", accent: "#e2b84f", accent2: "#d3542f" },
  poetry: { from: "#241338", to: "#4a2470", accent: "#e2b84f", accent2: "#7fd4c1" },
  essays: { from: "#0f2b26", to: "#1f5c4d", accent: "#e2b84f", accent2: "#f3ece0" },
  conversations: { from: "#3d2408", to: "#8a5a1e", accent: "#f5efe4", accent2: "#d3542f" },
  translation: { from: "#0f2440", to: "#1c5c73", accent: "#e2b84f", accent2: "#d99a4e" },
  notes: { from: "#2c1330", to: "#5c2a5c", accent: "#e2b84f", accent2: "#f3ece0" },
  submissions: { from: "#3a1408", to: "#8b3a1e", accent: "#f0c869", accent2: "#f3ece0" },
};

const IVORY = "#F5EFE4";

function Icon({ slug, accent, accent2 }: { slug: string; accent: string; accent2: string }) {
  switch (slug) {
    case "fiction":
      // Open book with coloured end-papers, a gold spine flourish, and a
      // red-wax bookmark ribbon for a real pop of colour against the gold line art.
      return (
        <g>
          <ellipse cx="100" cy="197" rx="54" ry="6" fill="#000" opacity="0.22" />
          <path d="M54 90c-4 34-4 60 0 90l46 12v-96z" fill={accent2} opacity="0.22" />
          <path d="M146 90c4 34 4 60 0 90l-46 12v-96z" fill={accent} opacity="0.16" />
          <g fill="none" stroke={IVORY} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M100 96v96" />
            <path d="M100 96c-14-9-33-13-47-11-4 .5-6 3-6 6v78c0 3.5 3 6 6.5 5.5 14-2 32.5 2 46.5 11.5" />
            <path d="M100 96c14-9 33-13 47-11 4 .5 6 3 6 6v78c0 3.5-3 6-6.5 5.5-14-2-32.5 2-46.5 11.5" />
            <path d="M68 102c9-2 20-1 28 3" opacity="0.6" />
            <path d="M68 120c9-2 20-1 28 3" opacity="0.45" />
            <path d="M68 138c9-2 20-1 28 3" opacity="0.3" />
            <path d="M132 102c-9-2-20-1-28 3" opacity="0.6" />
            <path d="M132 120c-9-2-20-1-28 3" opacity="0.45" />
          </g>
          <path d="M60 74v26l6.5-5.5L73 100V74z" fill={accent2} />
          <circle cx="100" cy="94" r="4" fill={accent} />
        </g>
      );
    case "poetry":
      // Feather quill (two-tone barbs) dipped in a teal inkwell with
      // droplets, trailing a calligraphic line into a small ink spatter.
      return (
        <g>
          <path
            d="M126 66c13 26 4 54-22 73-11 8-21 12-30 12 4-17 12-36 24-49 16-19 23-28 28-36z"
            fill="none"
            stroke={IVORY}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <g stroke={accent} strokeWidth="1.5" strokeLinecap="round" opacity="0.85" fill="none">
            <path d="M120 74 82 120" />
            <path d="M113 82 97 102" />
            <path d="M122 92 108 108" />
          </g>
          <path d="M75 151c-10 13-15 26-14 37" fill="none" stroke={IVORY} strokeWidth="2.2" strokeLinecap="round" />
          <ellipse cx="60" cy="198" rx="18" ry="9" fill={accent2} opacity="0.9" />
          <rect x="52" y="184" width="16" height="14" rx="2" fill="none" stroke={accent2} strokeWidth="2" />
          <circle cx="42" cy="204" r="2" fill={accent} />
          <circle cx="80" cy="208" r="1.6" fill={accent} />
          <circle cx="58" cy="216" r="2.4" fill={accent} />
        </g>
      );
    case "essays":
      // Fountain pen with a gold nib + cream barrel, an accent-colour
      // paperclip, and manuscript rules of varying length + one gold underline.
      return (
        <g>
          <path d="M52 84v116" stroke={IVORY} strokeWidth="1" opacity="0.3" />
          <g strokeLinecap="round" strokeLinejoin="round">
            <path d="M100 64 84 104l16 18 16-18z" fill={accent2} opacity="0.9" stroke={IVORY} strokeWidth="1.6" />
            <path d="M100 82v22" stroke={IVORY} strokeWidth="1.3" />
            <circle cx="100" cy="72" r="6" fill="none" stroke={IVORY} strokeWidth="1.6" />
            <path d="M128 60c7 0 12 5 12 12v24c0 5-3 8-7 9" fill="none" stroke={accent} strokeWidth="2.2" opacity="0.9" />
          </g>
          <g fill="none" stroke={IVORY} strokeWidth="2.2" strokeLinecap="round">
            <path d="M64 136h70" />
            <path d="M64 152h52" />
            <path d="M78 168h56" />
          </g>
          <path d="M64 184h42" stroke={accent} strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case "conversations":
      // Two overlapping speech bubbles in contrasting fills, a fainter
      // third bubble behind, and a small connecting arc between speakers.
      return (
        <g>
          <path
            d="M96 78h34a8 8 0 0 1 8 8v16a8 8 0 0 1-8 8h-6l-9 10v-10h-19a8 8 0 0 1-8-8V86a8 8 0 0 1 8-8z"
            fill={accent2}
            opacity="0.85"
          />
          <path
            d="M70 110h30a7 7 0 0 1 7 7v20a7 7 0 0 1-7 7H84l-8 9v-9h-6a7 7 0 0 1-7-7v-20a7 7 0 0 1 7-7z"
            fill="none"
            stroke={IVORY}
            strokeWidth="2.2"
          />
          <g fill={accent}>
            <circle cx="80" cy="128" r="2.6" />
            <circle cx="89" cy="128" r="2.6" />
            <circle cx="98" cy="128" r="2.6" />
          </g>
          <g fill={IVORY} opacity="0.9">
            <circle cx="105" cy="92" r="2" />
            <circle cx="113" cy="92" r="2" />
            <circle cx="121" cy="92" r="2" />
          </g>
          <path d="M104 152c14 6 26 16 32 30" fill="none" stroke={IVORY} strokeWidth="1.3" strokeDasharray="1 6" strokeLinecap="round" opacity="0.6" />
        </g>
      );
    case "translation":
      // Two speech-glyphs (an "A" and an accented character) bridged by a
      // two-way arrow, with a small tricolour flag-strip accent beneath.
      return (
        <g>
          <text x="66" y="118" fontFamily="Georgia, serif" fontSize="40" fill={IVORY} textAnchor="middle">
            A
          </text>
          <text x="134" y="118" fontFamily="Georgia, serif" fontSize="40" fill={accent} textAnchor="middle">
            文
          </text>
          <g stroke={accent2} strokeWidth="2.2" strokeLinecap="round" fill="none">
            <path d="M84 100h32" />
            <path d="M108 92l8 8-8 8" />
            <path d="M100 108l-8 8 8 8" />
          </g>
          <g transform="translate(76,150)">
            <rect x="0" y="0" width="16" height="24" fill={accent2} />
            <rect x="16" y="0" width="16" height="24" fill={IVORY} />
            <rect x="32" y="0" width="16" height="24" fill={accent} />
          </g>
        </g>
      );
    case "notes":
      // A spiral-bound notepad in cream with a gold pencil laid across it
      // and a short accent-colour underline beneath a written line.
      return (
        <g>
          <rect x="62" y="76" width="76" height="104" rx="4" fill={IVORY} opacity="0.14" />
          <rect x="62" y="76" width="76" height="104" rx="4" fill="none" stroke={IVORY} strokeWidth="2" />
          <g stroke={accent} strokeWidth="1.6">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <circle key={i} cx="62" cy={90 + i * 15} r="3" fill="none" />
            ))}
          </g>
          <g fill="none" stroke={IVORY} strokeWidth="2" strokeLinecap="round">
            <path d="M78 106h44" />
            <path d="M78 122h50" />
          </g>
          <path d="M78 138h30" stroke={accent2} strokeWidth="2.4" strokeLinecap="round" />
          <g transform="translate(96,150) rotate(28)">
            <rect x="0" y="0" width="52" height="8" rx="2" fill={accent} />
            <path d="M52 0l10 4-10 4z" fill={IVORY} />
          </g>
        </g>
      );
    case "submissions":
      // An open envelope with a rising letter and a gold wax seal, plus a
      // small quill leaning against it — the "send us your work" motif.
      return (
        <g>
          <path d="M50 130h100v58a6 6 0 0 1-6 6H56a6 6 0 0 1-6-6z" fill="none" stroke={IVORY} strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M50 130l50 34 50-34" fill="none" stroke={IVORY} strokeWidth="2.2" strokeLinejoin="round" />
          <rect x="66" y="76" width="68" height="88" rx="3" fill={accent2} opacity="0.92" transform="rotate(-3 100 120)" />
          <g transform="rotate(-3 100 120)" fill="none" stroke={IVORY} strokeWidth="1.8" strokeLinecap="round">
            <path d="M78 96h44" />
            <path d="M78 110h44" />
            <path d="M78 124h30" />
          </g>
          <circle cx="100" cy="150" r="12" fill={accent} />
          <path d="M100 144l3 6 6 1-4.5 4.5 1 6.5-5.5-3-5.5 3 1-6.5L91 150l6-1z" fill={PALETTES.submissions.from} />
        </g>
      );
    default:
      return null;
  }
}

export default function LiteraryGenreArt({ slug, className }: { slug: string; className?: string }) {
  const palette = PALETTES[slug] || PALETTES.fiction;
  const uid = slug;

  return (
    <svg
      viewBox="0 0 200 260"
      className={className}
      style={{ width: "100%", height: "100%", display: "block" }}
      role="img"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`lga-grad-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={palette.from} />
          <stop offset="100%" stopColor={palette.to} />
        </linearGradient>
        <radialGradient id={`lga-vig-${uid}`} cx="50%" cy="38%" r="75%">
          <stop offset="0%" stopColor="#000" stopOpacity="0" />
          <stop offset="70%" stopColor="#000" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.4" />
        </radialGradient>
        <pattern id={`lga-grain-${uid}`} width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="6" stroke="#fff" strokeOpacity="0.035" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="200" height="260" fill={`url(#lga-grad-${uid})`} />
      <rect width="200" height="260" fill={`url(#lga-grain-${uid})`} />
      <rect width="200" height="260" fill={`url(#lga-vig-${uid})`} />
      <rect x="9" y="9" width="182" height="242" fill="none" stroke={palette.accent} strokeOpacity="0.4" strokeWidth="1" />
      <Icon slug={slug} accent={palette.accent} accent2={palette.accent2} />
    </svg>
  );
}
