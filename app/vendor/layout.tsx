"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import "./vendor.css";

const NAV = [
  { href: "/vendor/dashboard",  label: "Overview"      },
  { href: "/vendor/products",   label: "Products"      },
  { href: "/vendor/orders",     label: "Orders"        },
  { href: "/vendor/analytics",  label: "Analytics"     },
  { href: "/vendor/profile",    label: "Store Profile" },
];

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router  = useRouter();
  const pathname = usePathname();
  const user    = session?.user as any;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?callbackUrl=/vendor/dashboard");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="vd-loading">
        <div className="vd-loading-dot" />
      </div>
    );
  }

  if (!user) return null;

  // Logged in but not a vendor — show apply prompt
  if (!user.isVendor) {
    return (
      <div className="vd-apply-gate">
        <div className="vd-apply-inner">
          <div className="vd-apply-eyebrow">Moveee Marketplace</div>
          <h1 className="vd-apply-title">
            Become a <em>Maker</em>
          </h1>
          <p className="vd-apply-desc">
            Your Moveee account is set up. To start selling, apply as a
            vendor — we vet every maker for craft integrity, fair production,
            and lasting quality.
          </p>
          <Link href="/lifestyle/become-a-maker" className="vd-apply-cta">
            Apply to sell on Moveee →
          </Link>
          <Link href="/member" className="vd-apply-back">
            Back to my account
          </Link>
        </div>
      </div>
    );
  }

  const initial = (user.name || user.username || "V").charAt(0).toUpperCase();

  return (
    <div className="vd-shell">
      {/* ── Sidebar ── */}
      <aside className="vd-sidebar">
        <div className="vd-sidebar-top">
          <div className="vd-store-avatar">{initial}</div>
          <div className="vd-store-name">{user.name || user.username}</div>
          <div className="vd-store-tag">Moveee Maker</div>
        </div>

        <nav className="vd-nav">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`vd-nav-item${pathname === item.href ? " active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="vd-sidebar-footer">
          <Link href={`/makers/${user.vendorSlug}`} className="vd-sidebar-link" target="_blank">
            View storefront ↗
          </Link>
          <Link href="/member" className="vd-sidebar-link">
            ← My account
          </Link>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="vd-main">
        {children}
      </main>
    </div>
  );
}
