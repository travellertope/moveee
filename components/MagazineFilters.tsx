"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function MagazineFilters({ filters }: { filters: any }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<string | null>("industry");

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
    // Optionally close sidebar on select
    // setIsSidebarOpen(false);
  };

  const toggleAccordion = (id: string) => {
    setActiveAccordion(activeAccordion === id ? null : id);
  };

  return (
    <div className="sec-filter-container">
      <button 
        className="tab border-r-0 flex items-center gap-2 cursor-pointer"
        onClick={() => setIsSidebarOpen(true)}
      >
        <span>Refine Filters</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
      </button>

      {/* Off-Canvas Sidebar */}
      <div className={`filter-sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={() => setIsSidebarOpen(false)} />
      
      <div className={`filter-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3>Refine <em>Library</em></h3>
          <button className="sidebar-close" onClick={() => setIsSidebarOpen(false)}>✕</button>
        </div>

        <div className="sidebar-content">
          {/* Industry Accordion */}
          <div className={`sidebar-acc-item ${activeAccordion === 'industry' ? 'active' : ''}`}>
            <button className="sidebar-acc-trigger" onClick={() => toggleAccordion('industry')}>
              Industry
              <span className="plus">{activeAccordion === 'industry' ? '−' : '+'}</span>
            </button>
            <div className="sidebar-acc-content">
              <div className="filter-options-grid">
                <button 
                  className={`opt-btn ${!searchParams.get('industry') ? 'active' : ''}`}
                  onClick={() => handleSelect('industry', "")}
                >
                  All Industries
                </button>
                {filters?.industries?.nodes?.map((t: any) => (
                  <button 
                    key={t.slug}
                    className={`opt-btn ${searchParams.get('industry') === t.slug ? 'active' : ''}`}
                    onClick={() => handleSelect('industry', t.slug)}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Location Accordion */}
          <div className={`sidebar-acc-item ${activeAccordion === 'country' ? 'active' : ''}`}>
            <button className="sidebar-acc-trigger" onClick={() => toggleAccordion('country')}>
              Location
              <span className="plus">{activeAccordion === 'country' ? '−' : '+'}</span>
            </button>
            <div className="sidebar-acc-content">
              <div className="filter-options-grid">
                <button 
                  className={`opt-btn ${!searchParams.get('country') ? 'active' : ''}`}
                  onClick={() => handleSelect('country', "")}
                >
                  All Locations
                </button>
                {filters?.countries?.nodes?.map((t: any) => (
                  <button 
                    key={t.slug}
                    className={`opt-btn ${searchParams.get('country') === t.slug ? 'active' : ''}`}
                    onClick={() => handleSelect('country', t.slug)}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Series Accordion */}
          <div className={`sidebar-acc-item ${activeAccordion === 'series' ? 'active' : ''}`}>
            <button className="sidebar-acc-trigger" onClick={() => toggleAccordion('series')}>
              Series
              <span className="plus">{activeAccordion === 'series' ? '−' : '+'}</span>
            </button>
            <div className="sidebar-acc-content">
              <div className="filter-options-grid">
                <button 
                  className={`opt-btn ${!searchParams.get('series') ? 'active' : ''}`}
                  onClick={() => handleSelect('series', "")}
                >
                  All Series
                </button>
                {filters?.series?.nodes?.map((t: any) => (
                  <button 
                    key={t.slug}
                    className={`opt-btn ${searchParams.get('series') === t.slug ? 'active' : ''}`}
                    onClick={() => handleSelect('series', t.slug)}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="sidebar-footer">
          <button 
            className="clear-all-btn"
            onClick={() => {
              router.push('/magazine');
              setIsSidebarOpen(false);
            }}
          >
            Clear All Selections
          </button>
        </div>
      </div>
    </div>
  );
}
