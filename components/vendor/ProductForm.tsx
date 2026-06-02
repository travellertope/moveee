"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ImageUploader, { type UploadedImage } from "./ImageUploader";

export interface ProductFormValues {
  name:             string;
  status:           string;
  description:      string;
  shortDescription: string;
  regularPrice:     string;
  salePrice:        string;
  manageStock:      boolean;
  stockQty:         string;
  stockStatus:      string;
  categories:       number[];
  images:           UploadedImage[];
  makerStory:       string;
  careInstructions: string;
  deliveryInfo:     string;
}

interface WCCategory { id: number; name: string; parent: number; }

interface ProductFormProps {
  productId?: number;
  initial?:   Partial<ProductFormValues>;
}

const EMPTY: ProductFormValues = {
  name:             "",
  status:           "draft",
  description:      "",
  shortDescription: "",
  regularPrice:     "",
  salePrice:        "",
  manageStock:      false,
  stockQty:         "",
  stockStatus:      "instock",
  categories:       [],
  images:           [] as UploadedImage[],
  makerStory:       "",
  careInstructions: "",
  deliveryInfo:     "",
};

export default function ProductForm({ productId, initial }: ProductFormProps) {
  const router  = useRouter();
  const isEdit  = Boolean(productId);

  // Normalise images: the edit API returns string[], uploader expects UploadedImage[]
  const normImages = (raw: any): UploadedImage[] => {
    if (!raw) return [];
    return (raw as any[]).map((item: any) =>
      typeof item === "string"
        ? { url: item, name: item.split("/").pop() ?? "image" }
        : item
    );
  };

  const [form,       setForm]       = useState<ProductFormValues>({
    ...EMPTY,
    ...initial,
    images: normImages((initial as any)?.images),
  });
  const [categories, setCategories] = useState<WCCategory[]>([]);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");
  const [tab,        setTab]        = useState<"details" | "media" | "story">("details");

  // Load WC categories once
  useEffect(() => {
    fetch("/api/vendor/categories")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setCategories(d); })
      .catch(() => {});
  }, []);

  function set(field: keyof ProductFormValues, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleCategory(id: number) {
    set(
      "categories",
      form.categories.includes(id)
        ? form.categories.filter((c) => c !== id)
        : [...form.categories, id]
    );
  }

  async function handleSubmit(publishNow?: boolean) {
    setError("");
    if (!form.name.trim()) { setError("Product name is required."); return; }

    setSaving(true);
    try {
      const payload = {
        ...form,
        status: publishNow ? "publish" : form.status,
        // Send image URLs as strings — the API routes map them to [{ src }] for WC
        images: form.images.map((img) => img.url),
      };

      const url    = isEdit ? `/api/vendor/products/${productId}` : "/api/vendor/products";
      const method = isEdit ? "PATCH" : "POST";

      const res  = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      router.push("/vendor/products");
    } finally {
      setSaving(false);
    }
  }

  const topCategories = categories.filter((c) => c.parent === 0);

  return (
    <div className="vpf-wrap">
      {error && <div className="vpf-error">{error}</div>}

      {/* ── Tabs ── */}
      <div className="vpf-tabs">
        {(["details", "media", "story"] as const).map((t) => (
          <button
            key={t}
            className={`vpf-tab${tab === t ? " active" : ""}`}
            onClick={() => setTab(t)}
            type="button"
          >
            {t === "details" ? "Details & Pricing"
             : t === "media"  ? "Images"
             : "Maker Story"}
          </button>
        ))}
      </div>

      {/* ══ DETAILS TAB ══ */}
      {tab === "details" && (
        <div className="vpf-section">
          <div className="vpf-field">
            <label className="vpf-label">Product name *</label>
            <input
              className="vpf-input"
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Hand-thrown Stoneware Bowl"
            />
          </div>

          <div className="vpf-field">
            <label className="vpf-label">Short description</label>
            <textarea
              className="vpf-textarea vpf-textarea--sm"
              value={form.shortDescription}
              onChange={(e) => set("shortDescription", e.target.value)}
              placeholder="One-line description shown in listings"
              rows={2}
            />
          </div>

          <div className="vpf-field">
            <label className="vpf-label">Full description</label>
            <textarea
              className="vpf-textarea"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Describe the product — materials, dimensions, origin…"
              rows={5}
            />
          </div>

          <div className="vpf-row">
            <div className="vpf-field">
              <label className="vpf-label">Regular price (£)</label>
              <input
                className="vpf-input"
                type="number"
                min="0"
                step="0.01"
                value={form.regularPrice}
                onChange={(e) => set("regularPrice", e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="vpf-field">
              <label className="vpf-label">Sale price (£) — optional</label>
              <input
                className="vpf-input"
                type="number"
                min="0"
                step="0.01"
                value={form.salePrice}
                onChange={(e) => set("salePrice", e.target.value)}
                placeholder="Leave blank if not on sale"
              />
            </div>
          </div>

          <div className="vpf-row">
            <div className="vpf-field">
              <label className="vpf-label">Stock status</label>
              <select
                className="vpf-select"
                value={form.stockStatus}
                onChange={(e) => set("stockStatus", e.target.value)}
              >
                <option value="instock">In stock</option>
                <option value="outofstock">Out of stock</option>
                <option value="onbackorder">On backorder</option>
              </select>
            </div>

            <div className="vpf-field">
              <label className="vpf-label">
                <input
                  type="checkbox"
                  checked={form.manageStock}
                  onChange={(e) => set("manageStock", e.target.checked)}
                  style={{ marginRight: 8 }}
                />
                Track stock quantity
              </label>
              {form.manageStock && (
                <input
                  className="vpf-input"
                  style={{ marginTop: 8 }}
                  type="number"
                  min="0"
                  value={form.stockQty}
                  onChange={(e) => set("stockQty", e.target.value)}
                  placeholder="Quantity"
                />
              )}
            </div>
          </div>

          {/* Categories */}
          {topCategories.length > 0 && (
            <div className="vpf-field">
              <label className="vpf-label">Categories</label>
              <div className="vpf-cat-grid">
                {topCategories.map((cat) => (
                  <label key={cat.id} className="vpf-cat-item">
                    <input
                      type="checkbox"
                      checked={form.categories.includes(cat.id)}
                      onChange={() => toggleCategory(cat.id)}
                    />
                    <span>{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ MEDIA TAB ══ */}
      {tab === "media" && (
        <div className="vpf-section">
          <div className="vpf-field">
            <label className="vpf-label">Product images</label>
            <p className="vpf-hint">
              Drag and drop or click to upload. First image is the main listing
              photo. Use ← → buttons to reorder. Max 8 images, 8 MB each.
            </p>
            <ImageUploader
              images={form.images}
              onChange={(imgs) => set("images", imgs)}
              max={8}
            />
          </div>
        </div>
      )}

      {/* ══ MAKER STORY TAB ══ */}
      {tab === "story" && (
        <div className="vpf-section">
          <div className="vpf-field">
            <label className="vpf-label">Maker story</label>
            <p className="vpf-hint">
              Tell the story behind this product — your process, your
              materials, what makes this piece worth keeping.
            </p>
            <textarea
              className="vpf-textarea"
              value={form.makerStory}
              onChange={(e) => set("makerStory", e.target.value)}
              rows={6}
              placeholder="Every piece starts with…"
            />
          </div>

          <div className="vpf-field">
            <label className="vpf-label">Materials & Care</label>
            <textarea
              className="vpf-textarea vpf-textarea--sm"
              value={form.careInstructions}
              onChange={(e) => set("careInstructions", e.target.value)}
              rows={3}
              placeholder="e.g. Stoneware fired at 1280°C. Hand wash only."
            />
          </div>

          <div className="vpf-field">
            <label className="vpf-label">Delivery & Returns</label>
            <textarea
              className="vpf-textarea vpf-textarea--sm"
              value={form.deliveryInfo}
              onChange={(e) => set("deliveryInfo", e.target.value)}
              rows={3}
              placeholder="e.g. Ships in 3–5 working days. Returns accepted within 14 days."
            />
          </div>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="vpf-actions">
        <div className="vpf-actions-left">
          <button
            type="button"
            className="vd-btn-outline"
            disabled={saving}
            onClick={() => router.push("/vendor/products")}
          >
            Cancel
          </button>
        </div>
        <div className="vpf-actions-right">
          <button
            type="button"
            className="vd-btn-outline"
            disabled={saving}
            onClick={() => handleSubmit(false)}
          >
            {saving ? "Saving…" : "Save as draft"}
          </button>
          <button
            type="button"
            className="vd-btn-primary"
            disabled={saving}
            onClick={() => handleSubmit(true)}
          >
            {saving ? "Saving…" : isEdit ? "Update & publish" : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}
