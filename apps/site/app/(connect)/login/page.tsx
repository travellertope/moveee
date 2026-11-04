"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import SignInPanel from "@/components/SignInPanel";
import "../../auth.css";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/member";
  const isNewMember = searchParams.get("registered") === "1";

  return (
    <div className="auth-page">
      <div className="auth-card">
        <SignInPanel
          callbackUrl={callbackUrl}
          heading={isNewMember ? "You're in!" : "Sign in to continue"}
          codeIntro={
            isNewMember
              ? "Your account is ready. Sign in to pick up where you left off."
              : undefined
          }
        />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
