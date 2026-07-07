import { NextResponse } from "next/server";

/**
 * NextAuth's signOut() only clears the cookie matching the exact name/Domain
 * attributes configured in authOptions (domain-scoped, __Secure- prefixed in
 * prod). Any legacy host-only cookie set before the `.themoveee.com` domain
 * config existed is a browser-distinct cookie and survives signOut untouched,
 * leaving the session looking authenticated. These are httpOnly, so they can
 * only be cleared via a server response — expire every plausible permutation.
 *
 * Cookie name prefixes carry hard requirements the browser enforces silently
 * (a violating Set-Cookie is just dropped, no error): __Secure- requires the
 * Secure attribute on every Set-Cookie using it, and __Host- additionally
 * forbids a Domain attribute altogether. Getting either wrong means the clear
 * for that specific cookie — often the actual production cookie name — never
 * takes effect, which is what caused this route to not fully sign users out.
 */
const HOST_ONLY_COOKIE_NAMES = ["__Host-next-auth.csrf-token"];

const DOMAIN_SCOPED_COOKIE_NAMES = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.csrf-token",
  "next-auth.callback-url",
  "__Secure-next-auth.callback-url",
];

export async function POST() {
  const res = NextResponse.json({ ok: true });

  for (const name of HOST_ONLY_COOKIE_NAMES) {
    // __Host- forbids a Domain attribute and requires Secure.
    res.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      secure: true,
    });
  }

  for (const name of DOMAIN_SCOPED_COOKIE_NAMES) {
    const secure = name.startsWith("__Secure-");
    // Host-only (no Domain attribute)
    res.cookies.set(name, "", { path: "/", maxAge: 0, expires: new Date(0), secure });
    // Domain-scoped variant
    res.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      domain: ".themoveee.com",
      secure,
    });
  }

  return res;
}
