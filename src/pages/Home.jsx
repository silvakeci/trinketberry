import { useEffect, useRef, useState } from "react";
import { CursorImageTrail } from "../components/CursorImageTrail";
import Header from "../components/Header";
import ProductCard from "../components/ProductCard";
import { supabase } from "../lib/supabase";

const images = [
  "/images/trail-1.jpg",
  "/images/trail-2.jpg",
  "/images/trail-3.jpg",
  "/images/trail-4.jpg",
  "/images/trail-5.jpg",
  "/images/trail-6.jpg",
  "/images/trail-7.jpg",
  "/images/trail-8.jpg",
];

export default function Home() {
  const productsRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ NEW: controls when animation starts
  const [showProducts, setShowProducts] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      const { data, error } = await supabase
        .from("products")
        .select(
          `
            *,
            product_images ( image_url, sort_order )
          `
        )
        .order("created_at", { ascending: false });

      if (!error) setProducts(data || []);
      setLoading(false);
    }

    loadProducts();
  }, []);

  // ✅ NEW: Observe when section is visible
  useEffect(() => {
    const el = productsRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShowProducts(true);
          obs.disconnect(); // animate once
        }
      },
      { threshold: 0.15 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div>
      {/* HERO */}
      <div>
        <CursorImageTrail
          images={images}
          imageSize={200}
          rotationRange={15}
          throttleMs={120}
          lifetime={1200}
          maxTrails={12}
          style={{ width: "100vw", height: "100vh" }}
        >
          <Header />

          <div className="hero">
            <div className="subtitle">MOVE YOUR CURSOR TO EXPLORE</div>
            <div className="title">TrinketBerry</div>
            <div className="line"></div>
          </div>
        </CursorImageTrail>
      </div>

      {/* PRODUCTS SECTION */}
      <section ref={productsRef} className="home-products">
        <h2 className="section-title">Featured Products</h2>

        {loading ? (
          <p style={{ opacity: 0.6 }}>Loading products...</p>
        ) : (
          <div className={`grid ${showProducts ? "grid-show" : ""}`}>
            {products.map((p, idx) => (
              <div
                key={p.id}
                className="reveal"
                style={{ transitionDelay: `${idx * 70}ms` }} // ✅ stagger
              >
                <ProductCard
                  product={{
                    id: p.id,
                    name: p.name,
                    price: Number(p.price),
                    image: p.product_images,
                    description: p.description,
                    available: p.is_available,
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}