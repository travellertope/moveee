import { redirect } from "next/navigation";

// Vanity referral redirect: /r/{code} → /register?ref={code}
// This lets users share short links like connect.themoveee.com/r/abc12345

export default function ReferralRedirect({ params }: { params: { code: string } }) {
  const code = params.code?.trim();
  if (!code) redirect("/register");
  redirect(`/register?ref=${encodeURIComponent(code)}`);
}
