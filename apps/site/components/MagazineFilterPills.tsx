"use client";

interface FilterOption {
  name: string;
  slug: string;
}

interface MagazineFilterPillsProps {
  seriesOptions: FilterOption[];
  industryOptions: FilterOption[];
  countryOptions: FilterOption[];
  activeSeries?: string;
  activeIndustry?: string;
  activeCountry?: string;
  isFiltered?: boolean;
}

export default function MagazineFilterPills({
  seriesOptions,
  industryOptions,
  countryOptions,
  activeSeries,
  activeIndustry,
  activeCountry,
  isFiltered,
}: MagazineFilterPillsProps) {
  return (
    <div className="mg-nav-filters">
      {seriesOptions.length > 0 && (
        <div className={`mg-filter-pill${activeSeries ? " mg-filter-pill--active" : ""}`}>
          <span>
            {activeSeries
              ? seriesOptions.find((s) => s.slug === activeSeries)?.name || "Series"
              : "Series"}
          </span>
          <select
            aria-label="Filter by series"
            value={activeSeries ?? ""}
            onChange={(e) => {
              window.location.href = e.target.value
                ? `/magazine/series/${e.target.value}`
                : "/magazine";
            }}
          >
            <option value="">All Series</option>
            {seriesOptions.map((s) => (
              <option key={s.slug} value={s.slug}>{s.name}</option>
            ))}
          </select>
          <span className="mg-filter-caret">▾</span>
        </div>
      )}

      {industryOptions.length > 0 && (
        <div className={`mg-filter-pill${activeIndustry ? " mg-filter-pill--active" : ""}`}>
          <span>
            {activeIndustry
              ? industryOptions.find((i) => i.slug === activeIndustry)?.name || "Industry"
              : "Industry"}
          </span>
          <select
            aria-label="Filter by industry"
            value={activeIndustry ?? ""}
            onChange={(e) => {
              window.location.href = e.target.value
                ? `/magazine/industry/${e.target.value}`
                : "/magazine";
            }}
          >
            <option value="">All Industries</option>
            {industryOptions.map((i) => (
              <option key={i.slug} value={i.slug}>{i.name}</option>
            ))}
          </select>
          <span className="mg-filter-caret">▾</span>
        </div>
      )}

      {countryOptions.length > 0 && (
        <div className={`mg-filter-pill${activeCountry ? " mg-filter-pill--active" : ""}`}>
          <span>
            {activeCountry
              ? countryOptions.find((c) => c.slug === activeCountry)?.name || "Country"
              : "Country"}
          </span>
          <select
            aria-label="Filter by country"
            value={activeCountry ?? ""}
            onChange={(e) => {
              window.location.href = e.target.value
                ? `/magazine/country/${e.target.value}`
                : "/magazine";
            }}
          >
            <option value="">All Countries</option>
            {countryOptions.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
          <span className="mg-filter-caret">▾</span>
        </div>
      )}
    </div>
  );
}
