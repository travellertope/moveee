"use client";

import StarRating from "./StarRating";

interface Props {
  ratings: { label: string; value: number }[];
  onChange: (label: string, value: number) => void;
}

export default function MultiRating({ ratings, onChange }: Props) {
  return (
    <div className="composer-multi-rating">
      {ratings.map(({ label, value }) => (
        <StarRating key={label} label={label} value={value} onChange={(v) => onChange(label, v)} />
      ))}
    </div>
  );
}
