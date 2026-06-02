"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

interface Product {
  id: number;
  name: string;
  slug: string;
  status: string;
  price: string;
  regularPrice: string;
  stockStatus: string;
  stockQty: number | null;
  image: string | null;
  categories: string[];
  type: string;
  dateCreated: string;
}

interface ProductsData {
  items: Product[];
  total: number;
  pages: number;
}

const STATUS_LABELS: Record<string, string> = {
  publish: "Live",
  draft:   "Draft",
  pending: "Pending",
  private: "Private",
  trash:   "Trashed",
};

export default function VendorProductsPage() {
  const { data: session } = useSession();
  const user = session?.user as any;

  const [data,    setData]    = useState<ProductsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [status,  setStatus]  = useState("any");
  const [search,  setSearch]  = useState("");
  const [query,   setQuery]   = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);
  const [confirm,  setConfirm]  = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page:     String(page),
        per_page: "20",
        status,
        ...(query ? { search: query } : {}),
      });
      const res = await fetch(`/api/vendor/products?${params}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [page, status, query]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: number) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/vendor/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        setData((prev) =>
          prev
            ? { ...prev, items: prev.items.filter((p) => p.id !== id), total: prev.total - 1 }
            : null
        );
      }
    } finally {
      setDeleting(null);
      setConfirm(null);
    }
  }

  return (
    <div className="vd-page">
      <div className="vd-page-header">
        <div>
          <div className="vd-page-eyebrow">Your Store</div>
          <h1 className="vd-page-title">Products</h1>
        </div>
        <Link href="/vendor/products/new" className="vd-btn-primary">
          + Add product
        </Link>
      </div>

      {/* ── Filters ── */}
      <div className="vdp-filters">
        <div className="vdp-search-wrap">
          <input
            className="vdp-search"
            type="search"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { setPage(1); setQuery(search); } }}
          />
          {search && (
            <button
              className="vdp-search-clear"
              onClick={() => { setSearch(""); setQuery(""); setPage(1); }}
            >
              ✕
            </button>
          )}
        </div>

        <div className="vdp-status-tabs">
          {["any", "publish", "draft", "pending"].map((s) => (
            <button
              key={s}
              className={`vdp-status-tab${status === s ? " active" : ""}`}
              onClick={() => { setStatus(s); setPage(1); }}
            >
              {s === "any" ? "All" : STATUS_LABELS[s] ?? s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="vd-loading" style={{ minHeight: 200, position: "static" }}>
          <div className="vd-loading-dot" />
        </div>
      ) : !data?.items.length ? (
        <div className="vd-empty-state">
          <div className="vd-empty-title">No products found</div>
          <p className="vd-empty-desc">
            {query ? `No results for "${query}".` : "You haven't listed any products yet."}
          </p>
          {!query && (
            <Link href="/vendor/products/new" className="vd-btn-outline">
              Add your first product →
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="vdp-table-wrap">
            <table className="vd-table vdp-table">
              <thead>
                <tr>
                  <th style={{ width: 56 }}></th>
                  <th>Product</th>
                  <th>Status</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Category</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((p) => (
                  <tr key={p.id} className={confirm === p.id ? "vdp-row--confirm" : ""}>
                    <td>
                      <div className="vdp-thumb">
                        {p.image ? (
                          <Image
                            src={p.image}
                            alt={p.name}
                            fill
                            style={{ objectFit: "cover" }}
                            sizes="48px"
                          />
                        ) : (
                          <div className="vdp-thumb-placeholder" />
                        )}
                      </div>
                    </td>

                    <td>
                      <div className="vdp-product-name">{p.name}</div>
                      <div className="vdp-product-slug">/{p.slug}</div>
                    </td>

                    <td>
                      <span className={`vdp-status-badge vdp-status--${p.status}`}>
                        {STATUS_LABELS[p.status] ?? p.status}
                      </span>
                    </td>

                    <td className="vdp-price">
                      {p.regularPrice
                        ? `£${p.regularPrice}`
                        : p.price
                        ? `£${p.price}`
                        : "—"}
                    </td>

                    <td>
                      <span className={`vdp-stock-badge vdp-stock--${p.stockStatus}`}>
                        {p.stockStatus === "instock"
                          ? p.stockQty != null
                            ? `${p.stockQty} in stock`
                            : "In stock"
                          : p.stockStatus === "outofstock"
                          ? "Out of stock"
                          : "On backorder"}
                      </span>
                    </td>

                    <td className="vdp-cats">
                      {p.categories.slice(0, 2).join(", ") || "—"}
                    </td>

                    <td>
                      {confirm === p.id ? (
                        <div className="vdp-confirm-row">
                          <span className="vdp-confirm-label">Delete?</span>
                          <button
                            className="vdp-action-btn vdp-action-btn--danger"
                            disabled={deleting === p.id}
                            onClick={() => handleDelete(p.id)}
                          >
                            {deleting === p.id ? "…" : "Yes"}
                          </button>
                          <button
                            className="vdp-action-btn"
                            onClick={() => setConfirm(null)}
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <div className="vdp-actions">
                          <Link
                            href={`/vendor/products/${p.id}`}
                            className="vdp-action-btn"
                          >
                            Edit
                          </Link>
                          <Link
                            href={`/shop/${p.slug}`}
                            className="vdp-action-btn"
                            target="_blank"
                          >
                            View ↗
                          </Link>
                          <button
                            className="vdp-action-btn vdp-action-btn--danger"
                            onClick={() => setConfirm(p.id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.pages > 1 && (
            <div className="vdp-pagination">
              <button
                className="vdp-page-btn"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Prev
              </button>
              <span className="vdp-page-info">
                Page {page} of {data.pages} &nbsp;·&nbsp; {data.total} products
              </span>
              <button
                className="vdp-page-btn"
                disabled={page >= data.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
