"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface NavItem {
  label: string;
  href: string;
  muted?: boolean;
}

export default function MemberNavSelect({ items }: { items: NavItem[] }) {
  const router = useRouter();

  return (
    <>
      {/* Desktop: bordered list */}
      <section className="mem-card mem-links-card mem-nav--desktop">
        {items.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`mem-link${item.muted ? " mem-link--muted" : ""}`}
          >
            {item.muted ? item.label : `${item.label} →`}
          </Link>
        ))}
      </section>

      {/* Mobile: select dropdown */}
      <div className="mem-nav--mobile">
        <div className="mem-nav-select-wrap">
          <select
            className="mem-nav-select"
            defaultValue=""
            onChange={e => {
              if (e.target.value) router.push(e.target.value);
            }}
          >
            <option value="" disabled>Navigate…</option>
            {items.map(item => (
              <option key={item.href} value={item.href}>{item.label}</option>
            ))}
          </select>
          <span className="mem-nav-select-arrow">▾</span>
        </div>
      </div>
    </>
  );
}
