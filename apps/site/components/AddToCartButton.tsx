"use client";

import type { ReactNode } from "react";
import { useCart } from "@/context/CartContext";

interface Props {
  productId: number;
  className?: string;
  children?: ReactNode;
}

export default function AddToCartButton({ productId, className = "padd", children }: Props) {
  const { addItem, isLoading } = useCart();

  return (
    <button
      className={className}
      tabIndex={-1}
      disabled={isLoading}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        addItem(productId);
      }}
    >
      {children ?? "Add to Cart →"}
    </button>
  );
}
