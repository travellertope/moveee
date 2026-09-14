// Per-genre "book cover" line-art, replacing the flat gradient tiles on the
// Browse by Section shelf (/literary homepage) — no external stock photo
// available (this sandbox can't reach any image host to source/verify one),
// so this is a stylized vector illustration per section instead: an oxblood
// gradient ground (unique per genre, so the six tiles read as distinct
// covers rather than one repeated color) with a single restrained ivory/gold
// line-drawn motif, matching the section's own restrained, no-hype voice
// documented for this vertical.
const GRADIENTS: Record<string, [string, string]> = {
  fiction: ["#3a1410", "#7a241c"],
  poetry: ["#4a2016", "#8b4d2e"],
  essays: ["#2a1a12", "#6b2b21"],
  conversations: ["#3d1a14", "#5c1b15"],
  translation: ["#331812", "#8b4d2e"],
  notes: ["#2e1712", "#6b2b21"],
};

function Icon({ slug }: { slug: string }) {
  const stroke = "#F5EFE4";
  const gold = "#B88942";
  switch (slug) {
    case "fiction":
      // An open book — two facing pages with a bookmark ribbon.
      return (
        <g fill="none" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M100 100v78" />
          <path d="M100 100c-14-9-32-13-46-11-4 .5-6 3-6 6v66c0 3.5 3 6 6.5 5.5 14-2 30 2 45.5 11" />
          <path d="M100 100c14-9 32-13 46-11 4 .5 6 3 6 6v66c0 3.5-3 6-6.5 5.5-14-2-30 2-45.5 11" />
          <path d="M62 98v14" stroke={gold} strokeWidth="2.6" />
        </g>
      );
    case "poetry":
      // A quill feather trailing a single curved ink line to a dot.
      return (
        <g fill="none" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M118 78c10 22 2 46-20 62-9 7-18 10-25 10 3-15 10-30 20-42 13-16 20-25 25-30z" />
          <path d="M99 106 82 124" />
          <path d="M107 96 92 112" />
          <path d="M114 87 100 102" />
          <path d="M72 152c-6 10-9 20-8 28" />
          <circle cx="63" cy="184" r="2.6" fill={gold} stroke="none" />
        </g>
      );
    case "essays":
      // A pen nib above three ruled manuscript lines of varying length.
      return (
        <g fill="none" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M100 76 88 108l12 14 12-14z" />
          <path d="M100 90v18" />
          <path d="M70 142h60" />
          <path d="M70 158h44" />
          <path d="M70 174h52" stroke={gold} />
        </g>
      );
    case "conversations":
      // Two facing speech marks — a dialogue between two voices.
      return (
        <g fill="none" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M56 96h34a8 8 0 0 1 8 8v22a8 8 0 0 1-8 8H74l-10 12v-12h-8a8 8 0 0 1-8-8v-22a8 8 0 0 1 8-8z" />
          <path d="M110 140h34a8 8 0 0 1 8 8v22a8 8 0 0 1-8 8h-8v12l-10-12h-16a8 8 0 0 1-8-8v-22a8 8 0 0 1 8-8z" stroke={gold} />
        </g>
      );
    case "translation":
      // Two mirrored letterforms bridged by an exchange arrow.
      return (
        <g fill="none" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M62 168V96l16 30 16-30v72" />
          <path d="M108 96h30M123 96v72" stroke={gold} />
          <path d="M86 130h30" strokeDasharray="1 7" />
          <path d="M96 122l-8 8 8 8" />
          <path d="M108 138l8-8-8-8" />
        </g>
      );
    case "notes":
    default:
      // A dog-eared notepad with a few short lines and a pencil stroke.
      return (
        <g fill="none" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M64 84h58l14 14v98H64z" />
          <path d="M122 84v14h14" />
          <path d="M78 118h44" />
          <path d="M78 134h44" />
          <path d="M78 150h28" stroke={gold} />
          <path d="M112 176l24-24 6 6-24 24-8 2z" stroke={gold} />
        </g>
      );
  }
}

export default function LiteraryGenreArt({ slug, className }: { slug: string; className?: string }) {
  const [from, to] = GRADIENTS[slug] || GRADIENTS.fiction;
  const gradId = `lit-genre-art-${slug}`;
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
      </defs>
      <rect width="200" height="300" fill={`url(#${gradId})`} />
      <Icon slug={slug} />
    </svg>
  );
}
