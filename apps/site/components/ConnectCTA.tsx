"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import PatronPrice from "@/components/PatronPrice";

export default function ConnectCTA() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  return (
    <div className="connect-cta">
      {isLoggedIn ? (
        <Link href="/member" className="btn-gold">Go to Dashboard <span className="arrow">→</span></Link>
      ) : (
        <>
          <Link href="/connect/membership" className="btn-gold">View Membership <span className="arrow">→</span></Link>
          <div className="connect-price"><PatronPrice variant="yearly" /> (Cancel anytime)</div>
        </>
      )}
    </div>
  );
}
