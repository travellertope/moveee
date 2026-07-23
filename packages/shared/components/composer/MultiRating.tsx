"use client";

import StarRating from "./StarRating";

interface Props {
  ratings: { label: string; value: number; key?: string }[];
  onChange: (key: string, value: number) => void;
  /** Rendered as the box's last row, set off by a divider — the overall
   * rating for the item this breakdown belongs to, folded into the same box
   * instead of sitting in its own field above it. */
  overall?: { label?: string; value: number; onChange: (v: number) => void };
}

export default function MultiRating({ ratings, onChange, overall }: Props) {
  return (
    <div className="composer-multi-rating">
      {ratings.map(({ label, value, key }) => {
        const resolvedKey = key ?? label.toLowerCase();
        return <StarRating key={label} label={label} value={value} onChange={(v) => onChange(resolvedKey, v)} />;
      })}
      {overall && (
        <StarRating
          className="composer-multi-rating-overall"
          label={overall.label ?? "Overall"}
          value={overall.value}
          onChange={overall.onChange}
        />
      )}
    </div>
  );
}
