import Link from "next/link";
import ProductForm from "@/components/vendor/ProductForm";
import "../../vendor.css";

export const metadata = { title: { absolute: "Add Product | Vendor Dashboard | The Moveee" } };

export default function NewProductPage() {
  return (
    <div className="vd-page">
      <div className="vd-page-header" style={{ marginBottom: 32 }}>
        <div>
          <div className="vd-page-eyebrow">
            <Link href="/vendor/products" style={{ color: "inherit", textDecoration: "none" }}>
              Products
            </Link>
            {" → "}New
          </div>
          <h1 className="vd-page-title">Add a product</h1>
        </div>
      </div>
      <ProductForm />
    </div>
  );
}
