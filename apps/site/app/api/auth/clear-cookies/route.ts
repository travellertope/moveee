import { NextResponse } from "next/server";

/**
 * NextAuth's signOut() only clears the cookie matching the exact name/Domain
 * attributes configured in authOptions (domain-scoped, __Secure- prefixed in
 * prod). Any legacy host-only cookie set before the `.themoveee.com` domain
 * config existed is a browser-distinct cookie and survives signOut untouched,
 * leaving the session looking authenticated. These are httpOnly, so they can
 * only be cleared via a server response — expire every plausible permutation.
 */
const COOKIE_NAMES = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.csrf-token",
  "__Host-next-auth.csrf-token",
  "next-auth.callback-url",
  "__Secure-next-auth.callback-url",
];

export async function POST() {
  const res = NextResponse.json({ ok: true });

  for (const name of COOKIE_NAMES) {
    // Host-only (no Domain attribute)
    res.cookies.set(name, "", { path: "/", maxAge: 0, expires: new Date(0) });
    // Domain-scoped variant
    res.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      domain: ".themoveee.com",
    });
  }

  return res;
}
