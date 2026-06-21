"use client";

import React from "react";
import { useCurrency } from "@/context/CurrencyContext";

interface PatronPriceProps {
  variant?: "yearly" | "monthly" | "both";
  className?: string;
  showTierLabel?: boolean;
}

const PatronPrice: React.FC<PatronPriceProps> = ({ 
  variant = "yearly", 
  className = "",
  showTierLabel = false 
}) => {
  const { currency, pricing, isLoading, formatPrice } = useCurrency();

  if (isLoading || !pricing) {
    return <span className={className}>...</span>;
  }

  const patronLabel = pricing.patronLabel || "Moveee Pro";

  const getPriceString = (int: "monthly" | "yearly") => {
    const amount = currency === "NGN" 
      ? (int === "monthly" ? pricing.monthlyNgn : pricing.yearlyNgn)
      : (int === "monthly" ? pricing.monthlyUsd : pricing.yearlyUsd);
    
    const formatted = formatPrice(amount, currency);
    const suffix = int === "monthly" ? "month" : "year";
    return `${formatted} / ${suffix}`;
  };

  if (variant === "both") {
    return (
      <span className={className}>
        {showTierLabel && `${patronLabel} — `}
        {getPriceString("yearly")} · {getPriceString("monthly")}
      </span>
    );
  }

  return (
    <span className={className}>
      {showTierLabel && `${patronLabel} — `}
      {getPriceString(variant)}
    </span>
  );
};

export default PatronPrice;
