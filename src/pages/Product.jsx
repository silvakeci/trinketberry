import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "../components/Header";
import { useCart } from "../context/CartContext";
import { supabase } from "../lib/supabase";

export default function Product() {
  const { id } = useParams();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const [added, setAdded] = useState(false);
  const toastTimer = useRef(null);
  const [showToast, setShowToast] = useState(false);

  // 🔥 Fetch product from Supabase
  useEffect(() => {
    async function loadProduct() {
      setLoading(true);

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (!error) setProduct(data);

      setLoading(false);
    }

    loadProduct();
  }, [id]);

  // Add to cart animation
  const onAdd = () => {
    if (!product) return;

    addItem({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image: product.image_url,
    }, 1);

    setAdded(true);
    setShowToast(true);
    window.clearTimeout(toastTimer.current);

    toastTimer.current = window.setTimeout(() => {
      setAdded(false);
      setShowToast(false);
    }, 900);
  };

  // Loading state
  if (loading) {
    return (
      <>
        <Header />
        <main className="page detailPage">
          <p>Loading product...</p>
        </main>
      </>
    );
  }

  // Not found
  if (!product) {
    return (
      <>
        <Header />
        <main className="page detailPage">
          <p>Product not found.</p>
          <Link className="detailBack" to="/shop">← Back to shop</Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="page detailPage">
        <Link className="detailBack" to="/shop">← Back to shop</Link>

        <div className="detailWrap">
          {/* IMAGE */}
          <div className="detailMedia">
            <div className="detailImageCard">
              <img
                className="detailImg"
                src={product.image_url}
                alt={product.name}
              />
            </div>
          </div>

          {/* INFO */}
          <div className="detailInfo">
            <h1 className="detailTitle">{product.name}</h1>
            <div className="detailPrice">
              ${Number(product.price).toFixed(2)}
            </div>

            <p className="detailDesc">{product.description}</p>

            <div className="detailActions">
              <button
                className={`detailBtn ${added ? "added" : ""}`}
                onClick={onAdd}
              >
                <span className="btnInner">
                  {added ? "Added" : "Add to cart"}
                  {added && <span className="check">✓</span>}
                </span>
              </button>

              <Link className="detailBtn secondary" to="/cart">
                View cart
              </Link>
            </div>
          </div>
        </div>

        {showToast && <div className="toast">Added to cart ✓</div>}
      </main>
    </>
  );
}
