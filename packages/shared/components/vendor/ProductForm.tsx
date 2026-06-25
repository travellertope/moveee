"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export interface ProductFormValues {
  name: string;
  price: string;
  sale_price: string;
  stock: string;
  description: string;
  short_description: string;
  categories: string;
  tags: string;
  status: "publish" | "draft";
}

const EMPTY: ProductFormValues = {
  name: "",
  price: "",
  sale_price: "",
  stock: "",
  description: "",
  short_description: "",
  categories: "",
  tags: "",
  status: "draft",
};

interface ProductFormProps {
  productId?: number;
  initial?: Partial<ProductFormValues> & { name?: string };
}

export default function ProductForm({ productId, initial }: ProductFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<ProductFormValues>({ ...EMPTY, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const set = (field: keyof ProductFormValues) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setValues((v) => ({ ...v, [field]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const url = productId ? `/api/vendor/products/${productId}` : "/api/vendor/products";
    const method = productId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to save product. Please try again.");
      } else {
        const data = await res.json();
        setSuccess(true);
        if (!productId && data.id) {
          router.push(`/vendor/products/${data.id}`);
        }
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="vpf-wrap">
      {error && <div className="vpf-error">{error}</div>}
      {success && <div className="vpf-success">Product saved successfully.</div>}

      <div className="vpf-section">
        <div className="vpf-field">
          <label className="vpf-label" htmlFor="pf-name">Product name *</label>
          <input
            id="pf-name"
            className="vpf-input"
            required
            value={values.name}
            onChange={set("name")}
            placeholder="e.g. Handcrafted tote bag"
          />
        </div>

        <div className="vpf-row" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
          <div className="vpf-field">
            <label className="vpf-label" htmlFor="pf-price">Price *</label>
            <input
              id="pf-price"
              className="vpf-input"
              required
              type="number"
              min="0"
              step="0.01"
              value={values.price}
              onChange={set("price")}
              placeholder="0.00"
            />
          </div>
          <div className="vpf-field">
            <label className="vpf-label" htmlFor="pf-sale-price">Sale price</label>
            <input
              id="pf-sale-price"
              className="vpf-input"
              type="number"
              min="0"
              step="0.01"
              value={values.sale_price}
              onChange={set("sale_price")}
              placeholder="0.00"
            />
          </div>
          <div className="vpf-field">
            <label className="vpf-label" htmlFor="pf-stock">Stock quantity</label>
            <input
              id="pf-stock"
              className="vpf-input"
              type="number"
              min="0"
              step="1"
              value={values.stock}
              onChange={set("stock")}
              placeholder="Unlimited"
            />
          </div>
        </div>

        <div className="vpf-field">
          <label className="vpf-label" htmlFor="pf-short-desc">Short description</label>
          <textarea
            id="pf-short-desc"
            className="vpf-textarea vpf-textarea--sm"
            rows={2}
            value={values.short_description}
            onChange={set("short_description")}
            placeholder="Brief summary shown in product listings"
          />
        </div>

        <div className="vpf-field">
          <label className="vpf-label" htmlFor="pf-desc">Full description</label>
          <textarea
            id="pf-desc"
            className="vpf-textarea"
            rows={6}
            value={values.description}
            onChange={set("description")}
            placeholder="Full product details"
          />
        </div>

        <div className="vpf-row">
          <div className="vpf-field">
            <label className="vpf-label" htmlFor="pf-cats">Categories</label>
            <input
              id="pf-cats"
              className="vpf-input"
              value={values.categories}
              onChange={set("categories")}
              placeholder="Comma-separated, e.g. Bags, Accessories"
            />
          </div>
          <div className="vpf-field">
            <label className="vpf-label" htmlFor="pf-tags">Tags</label>
            <input
              id="pf-tags"
              className="vpf-input"
              value={values.tags}
              onChange={set("tags")}
              placeholder="Comma-separated tags"
            />
          </div>
        </div>

        <div className="vpf-field">
          <label className="vpf-label" htmlFor="pf-status">Status</label>
          <select id="pf-status" className="vpf-select" value={values.status} onChange={set("status")}>
            <option value="draft">Draft</option>
            <option value="publish">Published</option>
          </select>
        </div>
      </div>

      <div className="vpf-actions">
        <button type="submit" className="vd-btn-primary" disabled={saving}>
          {saving ? "Saving…" : productId ? "Save changes" : "Add product"}
        </button>
      </div>
    </form>
  );
}
