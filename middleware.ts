import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const country = request.headers.get("x-vercel-ip-country") || "US";
  // Set for one hour; CurrencyProvider reads this client-side
  response.cookies.set("x-country", country, {
    path: "/",
    maxAge: 3600,
    sameSite: "lax",
    httpOnly: false,
  });
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|_next/webpack-hmr|favicon.ico).*)"],
};
