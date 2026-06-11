"use client";

import { useCart, fmtWCPrice } from "@/context/CartContext";
import "./CartDrawer.css";

export default function CartDrawer() {
  const { items, totals, isOpen, isLoading, closeDrawer, removeItem, updateItem } = useCart();

  const fmt = (amount: string) =>
    totals
      ? fmtWCPrice(amount, totals.currency_symbol, totals.currency_minor_unit)
      : amount;

  return (
    <>
      <div
        className={`cart-overlay${isOpen ? " cart-overlay--visible" : ""}`}
        onClick={closeDrawer}
        aria-hidden
      />

      <aside
        className={`cart-drawer${isOpen ? " cart-drawer--open" : ""}`}
        aria-label="Shopping cart"
        aria-modal="true"
        role="dialog"
      >
        {isLoading && <div className="cart-loading-bar" />}

        <div className="cart-drawer-header">
          <span className="cart-drawer-title">Your Cart</span>
          {items.length > 0 && (
            <span className="cart-drawer-count">
              {items.reduce((s, i) => s + i.quantity, 0)}{" "}
              {items.reduce((s, i) => s + i.quantity, 0) === 1 ? "item" : "items"}
            </span>
          )}
          <button className="cart-drawer-close" onClick={closeDrawer} aria-label="Close cart">
            ✕
          </button>
        </div>

        <div className="cart-drawer-body">
          {items.length === 0 ? (
            <div className="cart-empty">
              <p>Your cart is empty.</p>
              <button className="cart-empty-cta" onClick={closeDrawer}>
                Browse the Shop →
              </button>
            </div>
          ) : (
            <ul className="cart-items">
              {items.map((item) => (
                <li key={item.key} className="cart-item">
                  <div className="cart-item-img">
                    {item.images?.[0]?.src && (
                      <img src={item.images[0].src} alt={item.name} loading="lazy" />
                    )}
                  </div>
                  <div className="cart-item-info">
                    <div className="cart-item-name">{item.name}</div>
                    <div className="cart-item-price">{fmt(item.prices.price)}</div>
                    <div className="cart-item-controls">
                      <button
                        className="qty-btn"
                        onClick={() => updateItem(item.key, item.quantity - 1)}
                        disabled={isLoading || item.quantity <= 1}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="qty-val">{item.quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={() => updateItem(item.key, item.quantity + 1)}
                        disabled={isLoading}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <button
                    className="cart-item-remove"
                    onClick={() => removeItem(item.key)}
                    disabled={isLoading}
                    aria-label={`Remove ${item.name}`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && totals && (
          <div className="cart-drawer-footer">
            <div className="cart-subtotal">
              <span>Subtotal</span>
              <span>{fmt(totals.total_price)}</span>
            </div>
            <p className="cart-subtotal-note">Shipping &amp; taxes calculated at checkout</p>
            <a
              href="https://cms.themoveee.com/checkout"
              className="cart-checkout-btn"
            >
              Checkout →
            </a>
            <button className="cart-continue-btn" onClick={closeDrawer}>
              Continue Shopping
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
