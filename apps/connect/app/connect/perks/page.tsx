import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import PerksClient from "./PerksClient";
import "./perks.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Perks — Moveee",
  description: "Spend your Moveee Credits at partner venues. Browse perks, redeem, and get your QR coupon.",
};

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

interface Perk {
  id: number;
  title: string;
  description: string;
  credit_cost: number;
  min_spend: number;
  min_spend_currency: string;
  expiry_days: number;
  max_per_user: number;
  max_total: number;
  redeemed_count: number;
  status: string;
  partner_directory_id: number;
}

async function fetchPerks(): Promise<Perk[]> {
  try {
    const res = await fetch(`${WP_URL}/wp-json/culture/v1/perks`, { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function fetchBalance(userId: number): Promise<{ credits: number; credit_value_gbp: number; credits_per_gbp: number } | null> {
  try {
    const res = await fetch(`${WP_URL}/wp-json/culture/v1/wallet/balance?user_id=${userId}`, {
      headers: { Authorization: `Bearer ${API_SECRET}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function PerksPage() {
  const session = await getServerSession(authOptions as any) as any;
  const user = session?.user;
  const userId = user?.id ? Number(user.id) : 0;

  const [perks, balance] = await Promise.all([
    fetchPerks(),
    userId ? fetchBalance(userId) : Promise.resolve(null),
  ]);

  return (
    <div className="perks-page">
      <section className="perks-hero">
        <div className="perks-hero-inner">
          <p className="perks-eyebrow">Moveee Credits</p>
          <h1 className="perks-headline">
            Spend your credits at <em>partner venues</em>
          </h1>
          <p className="perks-lede">
            Earn credits by posting, reviewing, and contributing to the community.
            Redeem them for real discounts at local businesses — or cash out.
          </p>

          <div className="perks-hero-row">
            {user ? (
              <div className="perks-balance-chip">
                <span className="perks-balance-label">Your balance</span>
                <span className="perks-balance-value">{balance?.credits ?? 0}</span>
                <span className="perks-balance-unit">credits</span>
                <Link href="/member/wallet" className="perks-balance-link">Wallet →</Link>
              </div>
            ) : (
              <p className="perks-signin-note">
                <Link href="/login?callbackUrl=/connect/perks">Sign in</Link> to see your balance and redeem perks.
              </p>
            )}
          </div>
        </div>
      </section>

      <PerksClient perks={perks} credits={balance?.credits ?? 0} isLoggedIn={!!user} />
    </div>
  );
}
