"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Profile",       href: "/member/settings/profile" },
  { label: "Interests",     href: "/member/settings/interests" },
  { label: "Newsletters",   href: "/member/settings/newsletters" },
  { label: "Notifications", href: "/member/settings/notifications" },
  { label: "Security",      href: "/member/settings/security" },
];

export default function SettingsTabs() {
  const pathname = usePathname();
  return (
    <div className="sett-tabs-bar">
      {TABS.map(tab => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`sett-tab${pathname === tab.href ? " sett-tab--active" : ""}`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
