import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import type { Metadata } from "next";
import "../../auth.css";
import DeleteAccountClient from "./DeleteAccountClient";

// Public — deliberately does NOT redirect to /login for a logged-out visitor.
// Google Play's account-deletion policy requires a web page that can be used
// to request/complete deletion without the app installed; a logged-out
// visitor still needs to be able to reach this page and see how to proceed
// (log in, or contact support), not get bounced.
export const metadata: Metadata = {
  title: "Delete your account | Moveee",
  robots: { index: false, follow: false },
};

export default async function DeleteAccountPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-heading auth-heading--sm">Delete your account</h1>
        {user ? (
          <DeleteAccountClient email={user.email ?? ""} />
        ) : (
          <>
            <p className="auth-sub">
              Log in to request deletion of your Moveee account. If you can&rsquo;t log in, email{" "}
              <a href="mailto:privacy@themoveee.com">privacy@themoveee.com</a> from the address on
              your account and we&rsquo;ll process the request manually.
            </p>
            <Link href="/login?callbackUrl=/account/delete" className="auth-btn-primary">
              Log in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
