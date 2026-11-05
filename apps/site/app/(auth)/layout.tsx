import Link from "next/link";
import "../connect-globals.css";
import "../auth.css";

// Auth pages (login, register, forgot/reset password, account deletion) are
// deliberately chrome-free — no ConnectHeader rail, no TopBar, no BottomNav —
// the way a conventional social app's own sign-in/sign-up screens are: just
// the brand mark and a centered card, nothing to navigate away with. Keeps
// the .cw-shell wrapper (not its nav) purely so these pages still pick up
// connect-globals.css's pure-white/dark .cw-shell token overrides and the
// body:has(.cw-shell) background reset that auth.css was already built
// against — same tokens as before, just without the chrome around them.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="cw-shell">
      <div className="auth-shell">
        <Link href="/" className="auth-shell-logo" aria-label="Moveee home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://mltvzlykp9yb.i.optimole.com/cb:k_0z.862/w:920/h:144/q:mauto/f:best/https://cms.themoveee.com/wp-content/uploads/2024/04/logo-1-e1713978527703.png"
            alt="Moveee"
            height={28}
            width={178}
          />
        </Link>
        {children}
      </div>
    </div>
  );
}
