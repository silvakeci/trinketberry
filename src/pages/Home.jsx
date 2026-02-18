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
];

export default function Home() {
  const heroRef = useRef(null);
  const productsRef = useRef(null);
  const locked = useRef(false);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load products from Supabase
  useEffect(() => {
    async function loadProducts() {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error) setProducts(data);
      setLoading(false);
    }

    loadProducts();
  }, []);

  // Scroll snap logic (hero <-> products)
  useEffect(() => {
    const onWheel = (e) => {
      if (locked.current) return;

      const heroEl = heroRef.current;
      const productsEl = productsRef.current;
      if (!heroEl || !productsEl) return;

      const y = window.scrollY;
      const atHero = y < 10;
      const productsTop = productsEl.getBoundingClientRect().top;
      const atProductsTop = Math.abs(productsTop) < 10;

      if (atHero && e.deltaY > 20) {
        locked.current = true;
        productsEl.scrollIntoView({ behavior: "smooth" });
        setTimeout(() => (locked.current = false), 900);
      }

      if (atProductsTop && e.deltaY < -20) {
        locked.current = true;
        heroEl.scrollIntoView({ behavior: "smooth" });
        setTimeout(() => (locked.current = false), 900);
      }
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    return () => window.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div>
      {/* HERO */}
      <div ref={heroRef}>
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
          <div className="grid">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={{
                  id: p.id,
                  name: p.name,
                  price: Number(p.price),
                  image: p.image_url,
                  description: p.description,
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
