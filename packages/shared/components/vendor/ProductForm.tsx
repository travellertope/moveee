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
    <form ref={formRef} onSubmit={handleSubmit} className="vd-form">
      {error && <div className="vd-form-error">{error}</div>}
      {success && <div className="vd-form-success">Product saved successfully.</div>}

      <div className="vd-form-section">
        <div className="vd-form-group">
          <label className="vd-form-label" htmlFor="pf-name">Product name *</label>
          <input
            id="pf-name"
            className="vd-form-input"
            required
            value={values.name}
            onChange={set("name")}
            placeholder="e.g. Handcrafted tote bag"
          />
        </div>

        <div className="vd-form-row">
          <div className="vd-form-group">
            <label className="vd-form-label" htmlFor="pf-price">Price *</label>
            <input
              id="pf-price"
              className="vd-form-input"
              required
              type="number"
              min="0"
              step="0.01"
              value={values.price}
              onChange={set("price")}
              placeholder="0.00"
            />
          </div>
          <div className="vd-form-group">
            <label className="vd-form-label" htmlFor="pf-sale-price">Sale price</label>
            <input
              id="pf-sale-price"
              className="vd-form-input"
              type="number"
              min="0"
              step="0.01"
              value={values.sale_price}
              onChange={set("sale_price")}
              placeholder="0.00"
            />
          </div>
          <div className="vd-form-group">
            <label className="vd-form-label" htmlFor="pf-stock">Stock quantity</label>
            <input
              id="pf-stock"
              className="vd-form-input"
              type="number"
              min="0"
              step="1"
              value={values.stock}
              onChange={set("stock")}
              placeholder="Leave blank for unlimited"
            />
          </div>
        </div>

        <div className="vd-form-group">
          <label className="vd-form-label" htmlFor="pf-short-desc">Short description</label>
          <textarea
            id="pf-short-desc"
            className="vd-form-textarea"
            rows={2}
            value={values.short_description}
            onChange={set("short_description")}
            placeholder="Brief summary shown in product listings"
          />
        </div>

        <div className="vd-form-group">
          <label className="vd-form-label" htmlFor="pf-desc">Full description</label>
          <textarea
            id="pf-desc"
            className="vd-form-textarea"
            rows={6}
            value={values.description}
            onChange={set("description")}
            placeholder="Full product details"
          />
        </div>

        <div className="vd-form-row">
          <div className="vd-form-group">
            <label className="vd-form-label" htmlFor="pf-cats">Categories</label>
            <input
              id="pf-cats"
              className="vd-form-input"
              value={values.categories}
              onChange={set("categories")}
              placeholder="Comma-separated, e.g. Bags, Accessories"
            />
          </div>
          <div className="vd-form-group">
            <label className="vd-form-label" htmlFor="pf-tags">Tags</label>
            <input
              id="pf-tags"
              className="vd-form-input"
              value={values.tags}
              onChange={set("tags")}
              placeholder="Comma-separated tags"
            />
          </div>
        </div>

        <div className="vd-form-group">
          <label className="vd-form-label" htmlFor="pf-status">Status</label>
          <select id="pf-status" className="vd-form-select" value={values.status} onChange={set("status")}>
            <option value="draft">Draft</option>
            <option value="publish">Published</option>
          </select>
        </div>
      </div>

      <div className="vd-form-actions">
        <button type="submit" className="vd-btn-primary" disabled={saving}>
          {saving ? "Saving…" : productId ? "Save changes" : "Add product"}
        </button>
      </div>
    </form>
  );
}
