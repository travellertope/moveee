import { NextResponse } from "next/server";

// Legacy start_url redirect — /pwa-launch was used before the domain merge.
// Now start_url is /feed directly; this stays for any installed PWAs that
// haven't updated their manifest yet.
export async function GET() {
  return NextResponse.redirect(new URL("/feed", "https://themoveee.com"), {
    status: 301,
  });
}
