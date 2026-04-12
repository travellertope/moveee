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
      <div className="refine-group">
        <button className="tab border-r-0 flex items-center gap-1 cursor-pointer">
          Refine ▾
        </button>
        
        <div className="refine-dropdown">
          {/* Industry Dropdown */}
          <div className="refine-item">
            <span className="refine-label">Industry:</span>
            <select 
              className="refine-select"
              value={searchParams.get('industry') || ""}
              onChange={(e) => handleSelect('industry', e.target.value)}
            >
              <option value="">All Industries</option>
              {filters?.industries?.nodes?.map((t: any) => (
                <option key={t.slug} value={t.slug}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Location Dropdown */}
          <div className="refine-item">
            <span className="refine-label">Location:</span>
            <select 
              className="refine-select"
              value={searchParams.get('country') || ""}
              onChange={(e) => handleSelect('country', e.target.value)}
            >
              <option value="">All Locations</option>
              {filters?.countries?.nodes?.map((t: any) => (
                <option key={t.slug} value={t.slug}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Series Dropdown */}
          <div className="refine-item">
            <span className="refine-label">Series:</span>
            <select 
              className="refine-select"
              value={searchParams.get('series') || ""}
              onChange={(e) => handleSelect('series', e.target.value)}
            >
              <option value="">All Series</option>
              {filters?.series?.nodes?.map((t: any) => (
                <option key={t.slug} value={t.slug}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
