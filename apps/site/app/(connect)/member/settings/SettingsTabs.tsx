"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Profile",     href: "/member/settings/profile" },
  { label: "Directory",   href: "/member/settings/directory" },
  { label: "Interests",   href: "/member/settings/interests" },
  { label: "Newsletters", href: "/member/settings/newsletters" },
  { label: "Notifications", href: "/member/settings/notifications" },
  { label: "Security",    href: "/member/settings/security" },
];

export default function SettingsTabs() {
  const pathname = usePathname();
  return (
    <div className="mem-settings-tabs">
      {TABS.map(tab => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`prf-tab${pathname === tab.href ? " prf-tab--active" : ""}`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
