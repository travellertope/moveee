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
    <div className="sec-filter-container">
      {/* Industry Dropdown */}
      <div className="sec-filter-item">
        <span className="sec-filter-label">Industry:</span>
        <select 
          className="sec-filter-select"
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
      <div className="sec-filter-item">
        <span className="sec-filter-label">Location:</span>
        <select 
          className="sec-filter-select"
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
      <div className="sec-filter-item">
        <span className="sec-filter-label">Series:</span>
        <select 
          className="sec-filter-select"
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
