"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface MembershipPricing {
  patronLabel: string;
  citizenLabel: string;
  monthlyNgn: number;
  yearlyNgn: number;
  monthlyUsd: number;
  yearlyUsd: number;
}

interface CurrencyContextType {
  currency: "NGN" | "USD";
  pricing: MembershipPricing | null;
  isLoading: boolean;
  formatPrice: (amount: number, currencyCode: string) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ 
  children: React.ReactNode;
  detectedCountry?: string;
  initialPricing: MembershipPricing | null;
}> = ({ children, detectedCountry, initialPricing }) => {
  const [currency, setCurrency] = useState<"NGN" | "USD">("USD");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let country = detectedCountry;
    if (!country) {
      const match = document.cookie.match(/(?:^|;\s*)x-country=([^;]+)/);
      country = match?.[1] || "US";
    }
    setCurrency(country === "NG" ? "NGN" : "USD");
    setIsLoading(false);
  }, [detectedCountry]);

  const formatPrice = (amount: number, currencyCode: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <CurrencyContext.Provider value={{ currency, pricing: initialPricing, isLoading, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};
