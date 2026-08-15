"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export interface AttributeRow {
  name: string;
  values: string; // comma-separated, e.g. "Terracotta, Stoneware"
}

export interface ProcessStepRow {
  title: string;
  desc: string;
  duration: string;
}

export interface ProductFormValues {
  name: string;
  regularPrice: string;
  salePrice: string;
  manageStock: boolean;
  stockQty: string;
  stockStatus: "instock" | "outofstock";
  description: string;
  shortDescription: string;
  categories: string; // comma-separated names — the API resolves/creates matching WC categories
  tags: string;
  status: "publish" | "draft";
  attributes: AttributeRow[];
  makerStory: string;
  careInstructions: string;
  deliveryInfo: string;
  processSteps: ProcessStepRow[];
}

const EMPTY: ProductFormValues = {
  name: "",
  regularPrice: "",
  salePrice: "",
  manageStock: false,
  stockQty: "",
  stockStatus: "instock",
  description: "",
  shortDescription: "",
  categories: "",
  tags: "",
  status: "draft",
  attributes: [],
  makerStory: "",
  careInstructions: "",
  deliveryInfo: "",
  processSteps: [],
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

  function updateAttribute(index: number, field: keyof AttributeRow, value: string) {
    setValues((v) => {
      const attributes = [...v.attributes];
      attributes[index] = { ...attributes[index], [field]: value };
      return { ...v, attributes };
    });
  }
  function addAttribute() {
    setValues((v) => ({ ...v, attributes: [...v.attributes, { name: "", values: "" }] }));
  }
  function removeAttribute(index: number) {
    setValues((v) => ({ ...v, attributes: v.attributes.filter((_, i) => i !== index) }));
  }

  function updateStep(index: number, field: keyof ProcessStepRow, value: string) {
    setValues((v) => {
      const processSteps = [...v.processSteps];
      processSteps[index] = { ...processSteps[index], [field]: value };
      return { ...v, processSteps };
    });
  }
  function addStep() {
    setValues((v) => ({ ...v, processSteps: [...v.processSteps, { title: "", desc: "", duration: "" }] }));
  }
  function removeStep(index: number) {
    setValues((v) => ({ ...v, processSteps: v.processSteps.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const url = productId ? `/api/vendor/products/${productId}` : "/api/vendor/products";
    const method = productId ? "PATCH" : "POST";

    const body = {
      ...values,
      // Drop empty rows before sending — an attribute/step with no name/title
      // isn't worth persisting.
      attributes: values.attributes.filter((a) => a.name.trim() && a.values.trim()),
      processSteps: values.processSteps.filter((s) => s.title.trim() && s.desc.trim()),
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
              value={values.regularPrice}
              onChange={set("regularPrice")}
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
              value={values.salePrice}
              onChange={set("salePrice")}
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
              value={values.stockQty}
              onChange={(e) =>
                setValues((v) => ({ ...v, stockQty: e.target.value, manageStock: e.target.value !== "" }))
              }
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
            value={values.shortDescription}
            onChange={set("shortDescription")}
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

      {/* Attributes — plain/informational, e.g. Material, Dimensions. Shown
          on the product page's Specifications tab. */}
      <div className="vpf-section">
        <div className="vpf-section-head">
          <h3 className="vpf-section-title">Product attributes</h3>
          <p className="vpf-section-desc">E.g. Material: Terracotta, Stoneware — shown on the product page.</p>
        </div>
        {values.attributes.map((attr, i) => (
          <div className="vpf-row" style={{ gridTemplateColumns: "1fr 1fr auto" }} key={i}>
            <div className="vpf-field">
              <input
                className="vpf-input"
                value={attr.name}
                onChange={(e) => updateAttribute(i, "name", e.target.value)}
                placeholder="Attribute name, e.g. Material"
              />
            </div>
            <div className="vpf-field">
              <input
                className="vpf-input"
                value={attr.values}
                onChange={(e) => updateAttribute(i, "values", e.target.value)}
                placeholder="Comma-separated values, e.g. Terracotta, Stoneware"
              />
            </div>
            <button type="button" className="vpf-row-remove" onClick={() => removeAttribute(i)} aria-label="Remove attribute">
              ✕
            </button>
          </div>
        ))}
        <button type="button" className="vpf-add-row" onClick={addAttribute}>+ Add attribute</button>
      </div>

      {/* Maker & care details — optional, shown in their own tabs on the product page */}
      <div className="vpf-section">
        <div className="vpf-section-head">
          <h3 className="vpf-section-title">Maker &amp; care details</h3>
          <p className="vpf-section-desc">Optional — leave blank to use your store profile's usual story.</p>
        </div>
        <div className="vpf-field">
          <label className="vpf-label" htmlFor="pf-maker-story">This piece's story</label>
          <textarea
            id="pf-maker-story"
            className="vpf-textarea"
            rows={4}
            value={values.makerStory}
            onChange={set("makerStory")}
            placeholder="Only fill this in if this specific piece has its own story worth telling separately from your usual maker bio."
          />
        </div>
        <div className="vpf-field">
          <label className="vpf-label" htmlFor="pf-care">Materials &amp; care instructions</label>
          <textarea
            id="pf-care"
            className="vpf-textarea vpf-textarea--sm"
            rows={3}
            value={values.careInstructions}
            onChange={set("careInstructions")}
            placeholder="E.g. Made from 100% organic linen. Hand wash cold."
          />
        </div>
        <div className="vpf-field">
          <label className="vpf-label" htmlFor="pf-delivery">Delivery &amp; returns info</label>
          <textarea
            id="pf-delivery"
            className="vpf-textarea vpf-textarea--sm"
            rows={3}
            value={values.deliveryInfo}
            onChange={set("deliveryInfo")}
            placeholder="Overrides the default delivery/returns text for this product."
          />
        </div>
      </div>

      {/* How it's made — a real ordered production sequence, shown as numbered steps */}
      <div className="vpf-section">
        <div className="vpf-section-head">
          <h3 className="vpf-section-title">How it&rsquo;s made</h3>
          <p className="vpf-section-desc">Optional — add each stage of the making process, in order.</p>
        </div>
        {values.processSteps.map((step, i) => (
          <div className="vpf-step-row" key={i}>
            <div className="vpf-row" style={{ gridTemplateColumns: "1fr 1fr auto" }}>
              <div className="vpf-field">
                <input
                  className="vpf-input"
                  value={step.title}
                  onChange={(e) => updateStep(i, "title", e.target.value)}
                  placeholder={`Step ${i + 1} title`}
                />
              </div>
              <div className="vpf-field">
                <input
                  className="vpf-input"
                  value={step.duration}
                  onChange={(e) => updateStep(i, "duration", e.target.value)}
                  placeholder="Duration (optional), e.g. 2–3 days"
                />
              </div>
              <button type="button" className="vpf-row-remove" onClick={() => removeStep(i)} aria-label="Remove step">
                ✕
              </button>
            </div>
            <textarea
              className="vpf-textarea vpf-textarea--sm"
              rows={2}
              value={step.desc}
              onChange={(e) => updateStep(i, "desc", e.target.value)}
              placeholder="Step description"
            />
          </div>
        ))}
        <button type="button" className="vpf-add-row" onClick={addStep}>+ Add step</button>
      </div>

      <div className="vpf-actions">
        <button type="submit" className="vd-btn-primary" disabled={saving}>
          {saving ? "Saving…" : productId ? "Save changes" : "Add product"}
        </button>
      </div>
    </form>
  );
}
