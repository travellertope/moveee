import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import "../connect.css";
import "./perks.css";

export const metadata: Metadata = {
  title: "Pro Perks — Moveee Connect",
  description: "Connect Pro members get early access to new drops, exclusive member pricing, and priority visibility in the Moveee shop.",
};

const PERKS = [
  {
    icon: "★",
    title: "Early access drops",
    desc: "New products from Moveee makers are unlocked for Pro members 24–72 hours before they go public. Be first, every time.",
  },
  {
    icon: "◎",
    title: "Member pricing",
    desc: "Makers can set a discounted Pro member price on any product. Your Pro badge unlocks it automatically at checkout.",
  },
  {
    icon: "✦",
    title: "The Moveee Edit — first look",
    desc: "Get early access to curated editorial picks before they're published to the full archive.",
  },
  {
    icon: "◈",
    title: "Priority maker access",
    desc: "Commission or contact makers directly with a Pro badge — makers prioritise Pro member enquiries.",
  },
  {
    icon: "⬡",
    title: "No-queue checkout",
    desc: "Limited drops sometimes sell out before going public. Pro members are never in the public queue.",
  },
  {
    icon: "⊕",
    title: "Everything else in Connect Pro",
    desc: "Gated editorial, pro badge, event priority, and community access — all included with your membership.",
  },
];

export default async function ProPerksPage() {
  const session = await getServerSession(authOptions);
  const user    = session?.user as any;
  const isPro   = user?.tier === "patron";

  return (
    <div className="perks-page">
      {/* Hero */}
      <section className="perks-hero">
        <div className="perks-hero-inner">
          <p className="perks-eyebrow">Connect Pro · Shop Perks</p>
          <h1 className="perks-headline">
            Shop better.<br />Shop <em>first.</em>
          </h1>
          <p className="perks-lede">
            Connect Pro turns your membership into a shopping advantage.
            Early drops, member prices, and priority access — across every product in the Moveee shop.
          </p>
          {isPro ? (
            <div className="perks-status-badge">
              <span>★</span> You&apos;re a Connect Pro member — all perks active
            </div>
          ) : (
            <div className="perks-hero-ctas">
              <Link href="/connect/membership" className="perks-btn-primary">
                Upgrade to Connect Pro →
              </Link>
              <Link href="/shop" className="perks-btn-outline">
                Browse the shop
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Perks grid */}
      <section className="perks-grid-section">
        <div className="perks-grid-inner">
          <div className="perks-grid">
            {PERKS.map((p) => (
              <div key={p.title} className="perks-card">
                <div className="perks-card-icon">{p.icon}</div>
                <h3 className="perks-card-title">{p.title}</h3>
                <p className="perks-card-desc">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="perks-how">
        <div className="perks-how-inner">
          <h2 className="perks-how-title">How it works</h2>
          <div className="perks-steps">
            <div className="perks-step">
              <div className="perks-step-num">01</div>
              <div>
                <div className="perks-step-title">Join Connect Pro</div>
                <div className="perks-step-desc">
                  Upgrade your existing Moveee account at <Link href="/connect/membership">/connect/membership</Link>. One payment, instant access.
                </div>
              </div>
            </div>
            <div className="perks-step">
              <div className="perks-step-num">02</div>
              <div>
                <div className="perks-step-title">Browse early drops</div>
                <div className="perks-step-desc">
                  Products tagged for early access show a "★ Pro Early Access" banner on their page. Buy before the public launch date.
                </div>
              </div>
            </div>
            <div className="perks-step">
              <div className="perks-step-num">03</div>
              <div>
                <div className="perks-step-title">Your price applies automatically</div>
                <div className="perks-step-desc">
                  When a maker sets a Pro member price, your discounted price replaces the standard price the moment you&apos;re signed in.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shop CTA strip */}
      <section className="perks-shop-strip">
        <div className="perks-shop-strip-inner">
          <div>
            <div className="perks-strip-label">Ready to shop?</div>
            <div className="perks-strip-title">
              {isPro ? "Your perks are live — start shopping." : "Join Pro and unlock your perks."}
            </div>
          </div>
          <div className="perks-strip-actions">
            <Link href="/shop" className="perks-btn-light">Browse the shop</Link>
            {!isPro && (
              <Link href="/connect/membership" className="perks-btn-primary perks-btn-primary--light">
                Upgrade →
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
