"use client";

import { useCurrency } from "@/context/CurrencyContext";

export function PackagePrice({
  priceNGN,
  priceUSD,
  unit,
}: {
  priceNGN: string;
  priceUSD: string;
  unit?: string;
}) {
  const { currency, isLoading } = useCurrency();

  const isNGN = isLoading || currency === "NGN";
  const symbol = isNGN ? "₦" : "$";
  const amount = isNGN ? priceNGN : priceUSD;

  return (
    <div className="rate-card-price">
      <span className="price-currency">{symbol}</span>
      <span className="price-amount">{amount}</span>
      {unit && <span className="price-unit">{unit}</span>}
    </div>
  );
}

export function AddOnPrice({
  priceNGN,
  priceUSD,
}: {
  priceNGN: string;
  priceUSD: string;
}) {
  const { currency, isLoading } = useCurrency();

  const isNGN = isLoading || currency === "NGN";
  const price = isNGN ? priceNGN : priceUSD;

  return <div className="addon-price">{price}</div>;
}

export function ServiceIndexPrice({
  packages,
}: {
  packages: { priceNGN: string; priceUSD: string; currency?: string }[];
}) {
  const { currency, isLoading } = useCurrency();

  const isNGN = isLoading || currency === "NGN";
  const symbol = isNGN ? "₦" : "$";
  const first = isNGN ? packages[0].priceNGN : packages[0].priceUSD;
  const last = isNGN
    ? packages[packages.length - 1].priceNGN
    : packages[packages.length - 1].priceUSD;

  return (
    <span className="service-card-price">
      From {symbol}{first}
      {first !== last && ` — ${symbol}${last}`}
    </span>
  );
}
