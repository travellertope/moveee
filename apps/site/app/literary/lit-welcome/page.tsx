import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import LitWelcomeForm from "@/components/LitWelcomeForm";

export const metadata: Metadata = {
  title: "Welcome to Moveee Lit | The Moveee Literary",
};

/**
 * Landing page after a Moveee Lit checkout succeeds — see
 * LiteraryLitCheckout.tsx (the email → code → straight-to-checkout flow)
 * and Culture_Paystack::build_return_url(). Payment has already gone
 * through by the time anyone lands here; this page only ever collects the
 * optional profile details (DOB, country, city, occupation) that upgrade-
 * init never needed to run the checkout in the first place.
 */
export default async function LitWelcomePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/literary/subscribe");
  }

  return (
    <div className="lit-submit-wrap">
      <div className="lit-welcome-badge">✓ Payment successful</div>
      <h1>Welcome to Moveee Lit.</h1>
      <p className="lit-sub">
        You&rsquo;re all set — full access to The Moveee Literary is unlocked. A few more details
        help us get you the right invites and recommendations.
      </p>
      <LitWelcomeForm />
    </div>
  );
}
