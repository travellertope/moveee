"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import SignInPanel from "@/components/SignInPanel";
import "../../auth.css";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/member";
  const isNewMember = searchParams.get("registered") === "1";

  return (
    <>
      <div className="auth-card">
        <SignInPanel
          callbackUrl={callbackUrl}
          heading={isNewMember ? "You're in!" : "Sign in to continue"}
          codeIntro={
            isNewMember
              ? "Your account is ready. Sign in to pick up where you left off."
              : undefined
          }
          hideFooter
        />
      </div>
      <div className="auth-crosslink">
        New here? <Link href="/register">Create an account</Link>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
