// src/pages/Product.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "../components/Header";
import { useCart } from "../context/CartContext";
import { supabase } from "../lib/supabase";

export default function Product() {
  const { id } = useParams();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]); // from product_images
  const [activeImg, setActiveImg] = useState("");
  const [loading, setLoading] = useState(true);

  const [qty, setQty] = useState(1); // ✅ NEW: quantity
  const [added, setAdded] = useState(false);
  const toastTimer = useRef(null);
  const [showToast, setShowToast] = useState(false);

  console.log("product", product);

  useEffect(() => {
    let alive = true;

    async function loadProduct() {
      setLoading(true);

      const { data, error } = await supabase
        .from("products")
        .select(
          `
          id,
          name,
          price,
          description,
          category,
          image_url,
          product_images (
            id,
            image_url,
            sort_order
          )
        `
        )
        .eq("id", id)
        .single();

      if (!alive) return;

      if (error) {
        console.error(error);
        setProduct(null);
        setImages([]);
        setActiveImg("");
        setLoading(false);
        return;
      }

      const imgs = (data?.product_images || [])
        .slice()
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((x) => x.image_url)
        .filter(Boolean);

      // fallback to old single image_url
      const finalImgs = imgs.length ? imgs : data?.image_url ? [data.image_url] : [];

      setProduct(data);
      setImages(finalImgs);
      setActiveImg(finalImgs[0] || "");
      setLoading(false);
    }

    loadProduct();
    return () => {
      alive = false;
      window.clearTimeout(toastTimer.current);
    };
  }, [id]);

  const priceText = useMemo(() => {
    if (!product) return "";
    return `ALL ${Number(product.price || 0).toFixed(2)}`;
  }, [product]);

  // ✅ Add to cart (use active image + qty)
  const onAdd = () => {
    if (!product) return;

    addItem(
      {
        id: product.id,
        name: product.name,
        price: Number(product.price),
        image_url: activeImg || images[0] || product.image_url || "",
        category: product.category || "",
      },
      qty // ✅ NEW
    );

    setAdded(true);
    setShowToast(true);
    window.clearTimeout(toastTimer.current);

    toastTimer.current = window.setTimeout(() => {
      setAdded(false);
      setShowToast(false);
    }, 900);
  };

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

  if (!product) {
    return (
      <>
        <Header />
        <main className="page detailPage">
          <p>Product not found.</p>
          <Link className="detailBack" to="/shop">
            ← Back to shop
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="page detailPage">
        <Link className="detailBack" to="/shop">
          ← Back to shop
        </Link>

        <div className="detailWrap">
          {/* ✅ MEDIA / GALLERY */}
          <div className="detailMedia">
            <div className="detailImageCard">
              <img
                className="detailImg"
                src={activeImg || "/images/placeholder.jpg"}
                alt={product.name}
              />
            </div>

            {/* thumbnails */}
            {images.length > 1 && (
              <div className="detailThumbRow">
                {images.map((url) => (
                  <button
                    key={url}
                    className={`detailThumbBtn ${url === activeImg ? "active" : ""}`}
                    onClick={() => setActiveImg(url)}
                    type="button"
                    aria-label="Select image"
                  >
                    <img src={url} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* INFO */}
          <div className="detailInfo">
            <div className="detailKicker">{(product.category || "").toUpperCase()}</div>

            <h1 className="detailTitle">{product.name}</h1>
            <div className="detailPrice">{priceText}</div>

            {product.description && <p className="detailDesc">{product.description}</p>}

            <div className="detailActions">
              {/* ✅ NEW: Quantity selector */}
              <div className="qty detailQty">
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                >
                  −
                </button>

                <div className="qty-num">{qty}</div>

                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => setQty((q) => Math.min(99, q + 1))}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              <button className={`detailBtn ${added ? "added" : ""}`} onClick={onAdd}>
                <span className="btnInner">
                  {added ? "Added" : `Add to cart (${qty})`}
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