"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function MagazineFilters({ filters }: { filters: any }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSelect = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Clear all filters first so they don't explicitly stack on WP GraphQL right now
    params.delete('category');
    params.delete('industry');
    params.delete('country');
    params.delete('series');

    if (value) {
      params.set(key, value);
    }
    
    router.push(`/magazine?${params.toString()}`);
  };

  return (
    <div className="flex gap-4 items-center pr-6 md:pr-[60px] pb-3 pt-3 md:pt-0 md:pb-0 overflow-x-auto no-scrollbar" style={{ borderLeft: '1px solid var(--rule)' }}>
      {/* Industry Dropdown */}
      <div className="relative flex items-center min-w-max">
        <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-mute mr-2 pl-6">Industry:</span>
        <select 
          className="bg-transparent border-none outline-none font-mono text-[10px] uppercase tracking-[0.15em] text-ink cursor-pointer hover:text-ochre appearance-none pr-4 relative"
          value={searchParams.get('industry') || ""}
          onChange={(e) => handleSelect('industry', e.target.value)}
        >
          <option value="">All</option>
          {filters?.industries?.nodes?.map((t: any) => (
            <option key={t.slug} value={t.slug}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* Location Dropdown */}
      <div className="relative flex items-center min-w-max">
        <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-mute mr-2 pl-4 border-l border-rule/20">Location:</span>
        <select 
          className="bg-transparent border-none outline-none font-mono text-[10px] uppercase tracking-[0.15em] text-ink cursor-pointer hover:text-ochre appearance-none pr-4 relative"
          value={searchParams.get('country') || ""}
          onChange={(e) => handleSelect('country', e.target.value)}
        >
          <option value="">All</option>
          {filters?.countries?.nodes?.map((t: any) => (
            <option key={t.slug} value={t.slug}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* Series Dropdown */}
      <div className="relative flex items-center min-w-max">
        <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-mute mr-2 pl-4 border-l border-rule/20">Series:</span>
        <select 
          className="bg-transparent border-none outline-none font-mono text-[10px] uppercase tracking-[0.15em] text-ink cursor-pointer hover:text-ochre appearance-none pr-4 relative"
          value={searchParams.get('series') || ""}
          onChange={(e) => handleSelect('series', e.target.value)}
        >
          <option value="">All</option>
          {filters?.series?.nodes?.map((t: any) => (
            <option key={t.slug} value={t.slug}>{t.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
