import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useEffect, useRef, useState } from "react";

export default function ProductCard({ product }) {
  console.log("product", product);
  const { addItem } = useCart();

  const img =
    (product.image || [])
      .slice()
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]
      ?.image_url || "/images/placeholder.jpg";

  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => window.clearTimeout(timerRef.current);
  }, []);

  const onAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product) return;

    addItem(
      {
        id: product.id,
        name: product.name,
        price: Number(product.price),
        image_url: product.image?.[0]?.image_url || img, // ✅ safer fallback
        category: product.category || "",
      },
      qty // ✅ use qty (was 1)
    );

    setAdded(true);
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setAdded(false), 650);
  };

  const isAvailable = product.available !== false;

  const decQty = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setQty((q) => Math.max(1, q - 1));
  };

  const incQty = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setQty((q) => Math.min(99, q + 1));
  };

  const content = (
    <>
      <div className="card-img-wrapper">
        <img
          className={`card-img ${!isAvailable ? "card-img-disabled" : ""}`}
          src={img}
          alt={product.name}
        />

        {!isAvailable && <div className="card-overlay">Out of stock</div>}

        {/* ✅ NEW: hover-only small cart + qty */}
        {isAvailable && (
          <div className="card-hover-controls">
            <div
              className="qty"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <button type="button" className="qty-btn" onClick={decQty} aria-label="Decrease">
                −
              </button>
              <div className="qty-num">{qty}</div>
              <button type="button" className="qty-btn" onClick={incQty} aria-label="Increase">
                +
              </button>
            </div>

            <button
              type="button"
              className={`cart-fab ${added ? "added" : ""}`}
              onClick={onAdd}
              aria-label="Add to cart"
              title="Add to cart"
            >
              {added ? "✓" : "🛒"}
            </button>
          </div>
        )}
      </div>

      <div className="card-body">
        <div className="card-name">{product.name}</div>
        <div className="card-price">All {Number(product.price).toFixed(2)}</div>
      </div>
    </>
  );

  // If not available → disable link
  if (!isAvailable) {
    return <div className="card card-disabled">{content}</div>;
  }

  return (
    <Link to={`/product/${product.id}`} className="card card-hover">
      {content}
    </Link>
  );
}