import Link from "next/link";
import "../../sections.css";
import "../../legal.css";

export const metadata = {
  title: "Shipping & Returns | The Moveee",
  description: "Shipping rates, delivery timelines, and returns policy for orders from The Moveee shop.",
};

export default function ShippingPage() {
  return (
    <>
      <div className="sec-head">
        <div className="sec-head-inner">
          <div className="sec-head-left">
            <div className="sec-eyebrow">Shop · Policy</div>
            <h1 className="sec-title">Shipping <em>&amp; Returns</em></h1>
          </div>
        </div>
      </div>

      <div className="legal-body">
        <section>
          <h2>Shipping</h2>
          <p>We ship to Nigeria and select international destinations. All orders are processed within 2–3 business days.</p>
          <h3>Domestic (Nigeria)</h3>
          <ul>
            <li>Standard delivery: 3–5 business days</li>
            <li>Express delivery: 1–2 business days (Lagos only)</li>
          </ul>
          <h3>International</h3>
          <ul>
            <li>Standard international: 7–14 business days</li>
            <li>Shipping costs are calculated at checkout based on destination and weight.</li>
          </ul>
        </section>

        <section>
          <h2>Returns</h2>
          <p>
            We accept returns within <strong>14 days</strong> of delivery for items in original, unused condition.
            Sale items and digital goods are final sale and non-returnable.
          </p>
          <p>
            To initiate a return, email{" "}
            <a href="mailto:shop@themoveee.com">shop@themoveee.com</a> with your order number and reason for return.
          </p>
        </section>

        <section>
          <h2>Damaged or Incorrect Items</h2>
          <p>
            If your order arrives damaged or you received the wrong item, contact us within 48 hours of delivery.
            We will arrange a replacement or full refund at no additional cost to you.
          </p>
        </section>

        <div style={{ marginTop: 40 }}>
          <Link href="/shop" className="sec-back">← Back to Shop</Link>
        </div>
      </div>
    </>
  );
}
