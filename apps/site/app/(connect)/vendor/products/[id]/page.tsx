"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ProductForm, { type ProductFormValues } from "@/components/vendor/ProductForm";
import "../../vendor.css";

export default function EditProductPage() {
  const { id }  = useParams<{ id: string }>();
  const [product, setProduct] = useState<(ProductFormValues & { name: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/vendor/products/${id}`)
      .then(async (r) => {
        if (r.status === 404 || r.status === 403) { setNotFound(true); return; }
        if (r.ok) setProduct(await r.json());
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="vd-page">
        <div className="vd-loading" style={{ minHeight: 200, position: "static" }}>
          <div className="vd-loading-dot" />
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="vd-page">
        <div className="vd-empty-state">
          <div className="vd-empty-title">Product not found</div>
          <p className="vd-empty-desc">This product doesn&apos;t exist or you don&apos;t have access to it.</p>
          <Link href="/vendor/products" className="vd-btn-outline">
            Back to products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="vd-page">
      <div className="vd-page-header" style={{ marginBottom: 32 }}>
        <div>
          <div className="vd-page-eyebrow">
            <Link href="/vendor/products" style={{ color: "inherit", textDecoration: "none" }}>
              Products
            </Link>
            {" → "}Edit
          </div>
          <h1 className="vd-page-title" style={{ fontSize: "clamp(20px,2.5vw,28px)" }}>
            {product.name}
          </h1>
        </div>
        <Link
          href={`/shop/${(product as any).slug ?? ""}`}
          target="_blank"
          className="vd-btn-outline"
          style={{ fontSize: 11 }}
        >
          View in shop ↗
        </Link>
      </div>

      <ProductForm productId={Number(id)} initial={product} />
    </div>
  );
}
