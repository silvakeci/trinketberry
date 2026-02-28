import { useEffect, useMemo, useRef, useState } from "react";
import { CursorImageTrail } from "../components/CursorImageTrail";
import Header from "../components/Header";
import ProductCard from "../components/ProductCard";
import { supabase } from "../lib/supabase";
import MobileHeroSlideshow from "../components/MobileHeroSlideshow";

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

// ✅ Always show these categories even if DB has none
// Make sure these keys match what you store in products.category (case-insensitive is ok)
const FIXED_CATEGORIES = [
  { key: "earrings", label: "EARRINGS", image: "/images/categories/earrings.jpg" },
  { key: "necklaces", label: "NECKLACES", image: "/images/categories/necklaces.jpg" },
  { key: "rings", label: "RINGS", image: "/images/categories/rings.jpg" },
  { key: "bracelets", label: "BRACELETS", image: "/images/categories/bracelets.jpg" },
  { key: "sets", label: "SETS", image: "/images/categories/sets.jpg" },
];

/** Mobile breakpoint hook */
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const onChange = () => setIsMobile(mq.matches);

    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, [breakpoint]);

  return isMobile;
}

export default function Home() {
  const productsRef = useRef(null);
  const isMobile = useIsMobile(768);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showProducts, setShowProducts] = useState(false);

  // ✅ Optional: click category to scroll to products (and filter)
  const [selectedCategory, setSelectedCategory] = useState(null);

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

  useEffect(() => {
    const el = productsRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShowProducts(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // ✅ Build category tiles:
  // - Always show FIXED_CATEGORIES
  // - For each one, if products exist in that category, use the first product image as tile image
  // - Otherwise use the fixed category image
  const categories = useMemo(() => {
    const byCat = new Map();

    for (const p of products) {
      const cat = (p.category || "").trim().toLowerCase();
      if (!cat) continue;
      if (!byCat.has(cat)) byCat.set(cat, []);
      byCat.get(cat).push(p);
    }

    return FIXED_CATEGORIES.map((c) => {
      const list = byCat.get(c.key.toLowerCase()) || [];
      let tileImg = c.image;

      if (list.length > 0) {
        const first = list[0];
        const sortedImgs = [...(first.product_images || [])].sort(
          (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
        );
        tileImg = sortedImgs?.[0]?.image_url || c.image;
      }

      return {
        ...c,
        image: tileImg,
        count: list.length,
      };
    });
  }, [products]);

  // ✅ Products shown under categories:
  // - If no category selected => show ALL products
  // - If selected => show only that category
  const shownProducts = useMemo(() => {
    if (!selectedCategory) return products;
    return products.filter(
      (p) =>
        (p.category || "").trim().toLowerCase() === selectedCategory.trim().toLowerCase()
    );
  }, [products, selectedCategory]);

  const onClickCategory = (catKey) => {
    setSelectedCategory((prev) => (prev?.toLowerCase() === catKey.toLowerCase() ? null : catKey));
    // scroll down to products
    setTimeout(() => {
      productsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  return (
    <div>
      <Header />

      {isMobile ? (
        <MobileHeroSlideshow images={images} holdMs={2000} slideMs={700}>
          <div className="hero">
            <div className="title__mobile">TrinketBerry</div>
            <div className="line"></div>
          </div>
        </MobileHeroSlideshow>
      ) : (
        <CursorImageTrail
          images={images}
          imageSize={200}
          rotationRange={15}
          throttleMs={120}
          lifetime={1200}
          maxTrails={12}
          style={{ width: "100vw", height: "100vh" }}
        >
          <div className="hero">
            <div className="subtitle">MOVE YOUR CURSOR TO EXPLORE</div>
            <div className="title">TrinketBerry</div>
            <div className="line"></div>
          </div>
        </CursorImageTrail>
      )}

      {/* ✅ CATEGORIES FIRST (always visible) */}
      <section className="home-products">
        <h2 className="section-title">Shop by Category</h2>

        <div className="category-grid">
          {categories.map((c) => (
            <button
              key={c.key}
              className={`category-tile ${
                selectedCategory?.toLowerCase() === c.key.toLowerCase() ? "active" : ""
              }`}
              type="button"
              onClick={() => onClickCategory(c.key)}
            >
              <div className="category-imgWrap">
                <img src={c.image} alt={c.label} className="category-img" />
              </div>
              <div className="category-label">{c.label}</div>
              {/* optional count */}
              {/* <div className="category-count">{c.count} items</div> */}
            </button>
          ))}
        </div>
        <section className="quote-section">
  <div className="quote-inner">
    <div className="quote-line"></div>

    <p className="quote-text">
      “Jewelry has the power to be this one little thing that can make you feel unique.”
    </p>

    <div className="quote-line"></div>
  </div>
</section>
      </section>

      {/* ✅ ALL PRODUCTS UNDER CATEGORIES */}
      <section ref={productsRef} className="home-products">
        <div className="section-head">
          <h2 className="section-title">
            {selectedCategory ? selectedCategory.toUpperCase() : "All Products"}
          </h2>

          {selectedCategory && (
            <button
              type="button"
              className="category-back"
              onClick={() => setSelectedCategory(null)}
            >
              Show all
            </button>
          )}
        </div>

        {loading ? (
          <p style={{ opacity: 0.6 }}>Loading products...</p>
        ) : (
          <div className={`grid ${showProducts ? "grid-show" : ""}`}>
            {shownProducts.map((p, idx) => (
              <div
                key={p.id}
                className="reveal"
                style={{ transitionDelay: `${idx * 70}ms` }}
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

            {shownProducts.length === 0 && (
              <p style={{ opacity: 0.7 }}>No products found.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}