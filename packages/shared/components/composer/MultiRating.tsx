"use client";

import StarRating from "./StarRating";

interface Props {
  ratings: { label: string; value: number; key?: string }[];
  onChange: (key: string, value: number) => void;
}

export default function MultiRating({ ratings, onChange }: Props) {
  return (
    <div className="composer-multi-rating">
      {ratings.map(({ label, value, key }) => {
        const resolvedKey = key ?? label.toLowerCase();
        return <StarRating key={label} label={label} value={value} onChange={(v) => onChange(resolvedKey, v)} />;
      })}
    </div>
  );
}
