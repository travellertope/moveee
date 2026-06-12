"use client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import ProductSelectors from "./ProductSelectors";

interface Props {
  productId: number;
  price: string;
  regularPrice?: string;
  variations: any[];
  memberPrice: string;
  isEarlyAccessActive: boolean;
  earlyAccessUntil: string;
}

export default function ShopSessionSection({
  productId, price, regularPrice, variations, memberPrice,
  isEarlyAccessActive, earlyAccessUntil,
}: Props) {
  const { data: session } = useSession();
  const user = session?.user as any;
  const isPro = user?.tier === "patron";
  const isLoggedIn = !!user;
  const isGated = isEarlyAccessActive && !isPro;

  return (
    <>
      {isEarlyAccessActive && (
        <div className={`sp-early-access-banner${isPro ? " sp-early-access-banner--open" : ""}`}>
          <span className="sp-ea-badge">★ Pro Early Access</span>
          {isPro ? (
            <span className="sp-ea-msg">You have early access to this drop as a Connect Pro member.</span>
          ) : (
            <>
              <span className="sp-ea-msg">
                This drop is available to Connect Pro members first.
                {earlyAccessUntil && (
                  <> Opens publicly on {new Date(earlyAccessUntil).toLocaleDateString("en-GB", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}.</>
                )}
              </span>
              <Link href="/connect/membership" className="sp-ea-upgrade">
                {isLoggedIn ? "Upgrade to Pro →" : "Join Connect Pro →"}
              </Link>
            </>
          )}
        </div>
      )}
      <ProductSelectors
        productId={productId}
        price={price}
        regularPrice={regularPrice}
        variations={variations}
        memberPrice={memberPrice}
        isPro={isPro}
        isLoggedIn={isLoggedIn}
        isGated={isGated}
      />
    </>
  );
}
