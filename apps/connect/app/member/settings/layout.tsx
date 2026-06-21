import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import SettingsTabs from "./SettingsTabs";
import MemberNavSelect from "@/components/MemberNavSelect";
import "../../member.css";

export const metadata = {
  title: { absolute: "Settings | The Moveee" },
};

const NAV_ITEMS = [
  { label: "Dashboard",          href: "/member" },
  { label: "My Wallet",          href: "/member/wallet" },
  { label: "My Coupons",         href: "/member/coupons" },
  { label: "My Collection",      href: "/member/collection" },
  { label: "Creative Portfolio", href: "/member/portfolio" },
  { label: "Newsletters",        href: "https://themoveee.com/newsletter" },
  { label: "Upcoming Events",    href: "/events" },
  { label: "Magazine",           href: "https://themoveee.com/magazine" },
  { label: "Sign out",           href: "/api/auth/signout", muted: true },
];

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/member/settings");

  const user = session.user as any;
  const isPatron = user.tier === "patron";
  const displayName = user.displayName || user.name || user.username || "Member";
  const initial = displayName.charAt(0).toUpperCase();
  const email = user.email as string;

  const navItems = user.username
    ? [
        ...NAV_ITEMS.slice(0, 4),
        { label: "Public Profile", href: `/connect/${user.username}` },
        ...NAV_ITEMS.slice(4),
      ]
    : NAV_ITEMS;

  return (
    <>
      <div className="mem-hero">
        <div className="mem-hero-inner">
          <div className="mem-avatar" style={user.avatarUrl ? { padding: 0, overflow: "hidden" } : undefined}>
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
            ) : initial}
          </div>
          <div className="mem-hero-body">
            <div className="mem-eyebrow">The Moveee &mdash; Account Settings</div>
            <h1 className="mem-name">{displayName}</h1>
            <div className="mem-meta">
              <span className={`mem-tier-badge ${isPatron ? "patron" : "citizen"}`}>
                {isPatron ? "Moveee Pro" : "Moveee Citizen"}
              </span>
              <span className="mem-sep">·</span>
              <span>{email}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mem-body">
        <div className="mem-settings-back">
          <Link href="/member" className="mem-settings-back-link">← Back to Dashboard</Link>
        </div>

        <SettingsTabs />

        <div className="mem-settings-grid">
          <div className="mem-col-main">
            {children}
          </div>

          <div className="mem-col-side">
            <MemberNavSelect items={navItems} />
          </div>
        </div>
      </div>
    </>
  );
}
