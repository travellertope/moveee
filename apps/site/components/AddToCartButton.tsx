"use client";

import { useCart } from "@/context/CartContext";

interface Props {
  productId: number;
  className?: string;
}

export default function AddToCartButton({ productId, className = "padd" }: Props) {
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
      Add to Cart →
    </button>
  );
}
