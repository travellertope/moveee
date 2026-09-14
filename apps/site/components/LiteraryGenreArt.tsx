// Per-genre "book cover" illustration for the Browse by Section shelf
// (/literary homepage) — replaces the flat gradient tiles. No real stock
// photography was sourced here (this sandbox has no network access to any
// image host to find and verify one, and this codebase's own convention
// requires confirming an image URL actually resolves before hardcoding it),
// so this is a fuller, more deliberately-composed vector illustration per
// section instead of a bare line icon: a gradient ground unique per genre, a
// faint radial vignette + fine diagonal grain for texture, a thin inset
// frame (the "book cover" cue), and a richer, multi-element motif specific
// to that section.
const GRADIENTS: Record<string, [string, string]> = {
  fiction: ["#3a1410", "#7a241c"],
  poetry: ["#4a2016", "#8b4d2e"],
  essays: ["#2a1a12", "#6b2b21"],
  conversations: ["#3d1a14", "#5c1b15"],
  translation: ["#331812", "#8b4d2e"],
  notes: ["#2e1712", "#6b2b21"],
};

const IVORY = "#F5EFE4";
const GOLD = "#B88942";

function Icon({ slug }: { slug: string }) {
  switch (slug) {
    case "fiction":
      // An open book, ridged page-edges either side, a spine flourish,
      // a hanging ribbon bookmark, and a soft contact shadow beneath.
      return (
        <g>
          <ellipse cx="100" cy="196" rx="52" ry="6" fill="#000" opacity="0.18" />
          <g fill="none" stroke={IVORY} strokeWidth="1.1" opacity="0.5" strokeLinecap="round">
            <path d="M56 95c-4 30-4 55 0 82" />
            <path d="M50 92c-4 32-4 58 0 86" />
            <path d="M144 95c4 30 4 55 0 82" />
            <path d="M150 92c4 32 4 58 0 86" />
          </g>
          <g fill="none" stroke={IVORY} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M100 100v78" />
            <path d="M100 100c-14-9-32-13-46-11-4 .5-6 3-6 6v66c0 3.5 3 6 6.5 5.5 14-2 30 2 45.5 11" />
            <path d="M100 100c14-9 32-13 46-11 4 .5 6 3 6 6v66c0 3.5-3 6-6.5 5.5-14-2-30 2-45.5 11" />
            <path d="M69 106c9-2 19-1 27 3" opacity="0.55" />
            <path d="M69 122c9-2 19-1 27 3" opacity="0.4" />
            <path d="M131 106c-9-2-19-1-27 3" opacity="0.55" />
            <path d="M131 122c-9-2-19-1-27 3" opacity="0.4" />
          </g>
          <path d="M62 78v24l6-5 6 5V78z" fill={GOLD} />
          <path d="M96 96c2-6 8-6 8 0" fill="none" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" />
        </g>
      );
    case "poetry":
      // A barbed quill feather, an inkwell at its base with droplets, and a
      // longer double-curve calligraphic line trailing to a small spatter.
      return (
        <g fill="none" stroke={IVORY} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M124 70c12 24 4 50-21 68-10 7.5-20 11-28 11 3.5-16 11-33 22-46 15-18 22-27 27-33z" />
          <path d="M118 76 82 118" strokeWidth="1.6" />
          <path d="M112 84 98 100" strokeWidth="1.4" opacity="0.85" />
          <path d="M120 92 108 106" strokeWidth="1.4" opacity="0.85" />
          <path d="M105 78 90 94" strokeWidth="1.4" opacity="0.7" />
          <path d="M112 68 100 82" strokeWidth="1.4" opacity="0.7" />
          <path d="M75 149c-9 12-14 24-13 34" />
          <ellipse cx="62" cy="192" rx="16" ry="7" opacity="0.9" />
          <path d="M62 185v-6" opacity="0.9" />
          <circle cx="46" cy="196" r="1.6" fill={GOLD} stroke="none" />
          <circle cx="80" cy="200" r="1.2" fill={GOLD} stroke="none" />
          <circle cx="60" cy="207" r="2" fill={GOLD} stroke="none" />
        </g>
      );
    case "essays":
      // A pen nib with a ferrule ring, a paperclip, and manuscript lines of
      // varying length with a paragraph indent and left margin rule.
      return (
        <g>
          <path d="M52 84v112" stroke={IVORY} strokeWidth="1" opacity="0.35" />
          <g fill="none" stroke={IVORY} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M100 66 86 102l14 16 14-16z" />
            <path d="M100 82v20" strokeWidth="1.3" />
            <circle cx="100" cy="72" r="5.5" strokeWidth="1.4" />
            <path d="M126 62c6 0 10 4 10 10v20c0 4-2 7-6 8" strokeWidth="1.6" opacity="0.8" />
          </g>
          <g fill="none" stroke={IVORY} strokeWidth="2.2" strokeLinecap="round">
            <path d="M64 132h68" />
            <path d="M64 148h50" />
            <path d="M78 164h54" />
            <path d="M64 180h40" stroke={GOLD} />
          </g>
        </g>
      );
    case "conversations":
      // Two overlapping speech bubbles, each with an ellipsis, plus a
      // fainter third bubble behind for depth and a small connecting arc.
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M92 84h30a7 7 0 0 1 7 7v14a7 7 0 0 1-7 7H98l-8 9v-9h-6a7 7 0 0 1-7-7V91a7 7 0 0 1 7-7z"
            stroke={IVORY}
            strokeWidth="1.6"
            opacity="0.35"
          />
          <path
            d="M50 100h38a9 9 0 0 1 9 9v24a9 9 0 0 1-9 9H74l-11 13v-13h-13a9 9 0 0 1-9-9v-24a9 9 0 0 1 9-9z"
            stroke={IVORY}
            strokeWidth="2.4"
          />
          <g fill={IVORY} stroke="none">
            <circle cx="60" cy="122" r="2" />
            <circle cx="69" cy="122" r="2" />
            <circle cx="78" cy="122" r="2" />
          </g>
          <path
            d="M112 152h34a8 8 0 0 1 8 8v22a8 8 0 0 1-8 8h-8v12l-10-12h-16a8 8 0 0 1-8-8v-22a8 8 0 0 1 8-8z"
            stroke={GOLD}
            strokeWidth="2.4"
          />
          <g fill={GOLD} stroke="none">
            <circle cx="122" cy="172" r="2" />
            <circle cx="131" cy="172" r="2" />
            <circle cx="140" cy="172" r="2" />
          </g>
          <path d="M84 146c8 3 15 3 22 0" stroke={IVORY} strokeWidth="1.2" opacity="0.5" strokeDasharray="1 5" />
        </g>
      );
    case "translation":
      // Two mirrored abstract brush-strokes (not any real script, deliberately),
      // bridged by an exchange arrow inside a compass ring with tick marks.
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <g stroke={IVORY} strokeWidth="2.6">
            <path d="M58 84c-10 8-14 20-10 34 3 11 12 20 12 34 0 8-3 14-8 18" />
            <path d="M58 100c6 4 10 10 10 18" opacity="0.7" />
          </g>
          <g stroke={GOLD} strokeWidth="2.6">
            <path d="M142 84c10 8 14 20 10 34-3 11-12 20-12 34 0 8 3 14 8 18" />
            <path d="M142 100c-6 4-10 10-10 18" opacity="0.7" />
          </g>
          <circle cx="100" cy="150" r="19" stroke={IVORY} strokeWidth="1.3" opacity="0.55" />
          <g stroke={IVORY} strokeWidth="1" opacity="0.55">
            <path d="M100 128v6" />
            <path d="M100 166v6" />
            <path d="M78 150h6" />
            <path d="M116 150h6" />
          </g>
          <g stroke={IVORY} strokeWidth="2.2">
            <path d="M90 144h13M90 156h13" />
            <path d="M97 138l7 6-7 6" />
            <path d="M113 144h-13M113 156h-13" />
            <path d="M106 162l-7-6 7-6" />
          </g>
        </g>
      );
    case "notes":
    default:
      // A spiral-bound notepad, a paperclip, ruled lines of varying length,
      // and a pencil crossing the corner with a visible tip and eraser.
      return (
        <g>
          <g fill="none" stroke={IVORY} strokeWidth="1.6">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <circle key={i} cx={70 + i * 12} cy="82" r="3.2" opacity="0.7" />
            ))}
          </g>
          <path d="M64 90h72v104H64z" fill="none" stroke={IVORY} strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M46 108c-2-8 2-14 10-16l6-2" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" />
          <g fill="none" stroke={IVORY} strokeWidth="2" strokeLinecap="round">
            <path d="M76 118h48" />
            <path d="M76 132h48" />
            <path d="M76 146h32" />
            <path d="M76 160h40" stroke={GOLD} />
          </g>
          <g strokeLinecap="round" strokeLinejoin="round">
            <path d="M106 190l34-34 8 8-34 34z" fill="none" stroke={IVORY} strokeWidth="2.2" />
            <path d="M140 156l8 8" stroke={GOLD} strokeWidth="2.2" />
            <path d="M106 190l-6 10 10-6z" fill={GOLD} stroke="none" />
          </g>
        </g>
      );
  }
}

export default function LiteraryGenreArt({ slug, className }: { slug: string; className?: string }) {
  const [from, to] = GRADIENTS[slug] || GRADIENTS.fiction;
  const gradId = `lit-genre-art-grad-${slug}`;
  const vigId = `lit-genre-art-vig-${slug}`;
  const grainId = `lit-genre-art-grain-${slug}`;
  return (
    <svg
      className={className}
      viewBox="0 0 200 300"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
        <radialGradient id={vigId} cx="50%" cy="42%" r="75%">
          <stop offset="55%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.38" />
        </radialGradient>
        <pattern id={grainId} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <line x1="0" y1="0" x2="0" y2="7" stroke="#fff" strokeOpacity="0.04" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="200" height="300" fill={`url(#${gradId})`} />
      <rect width="200" height="300" fill={`url(#${grainId})`} />
      <Icon slug={slug} />
      <rect width="200" height="300" fill={`url(#${vigId})`} />
      <rect x="8" y="8" width="184" height="284" fill="none" stroke={IVORY} strokeOpacity="0.28" strokeWidth="1" />
    </svg>
  );
}
