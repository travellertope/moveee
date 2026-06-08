"use client";

interface Props {
  value: number;
  onChange: (v: number) => void;
  label?: string;
}

export default function StarRating({ value, onChange, label }: Props) {
  return (
    <div className="composer-star-rating">
      {label && <span className="composer-star-label">{label}</span>}
      <div className="composer-stars">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={`composer-star${n <= value ? " composer-star--active" : ""}`}
            onClick={() => onChange(n)}
          >
            {n <= value ? "★" : "☆"}
          </button>
        ))}
      </div>
    </div>
  );
}
