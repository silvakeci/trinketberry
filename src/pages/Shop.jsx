import { useEffect, useState } from "react";
import Header from "../components/Header";
import ProductCard from "../components/ProductCard";
import { supabase } from "../lib/supabase";

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("all");

  useEffect(() => {
    async function loadProducts() {
      const { data, error } = await supabase
        .from("products")
        .select(
          `
    *,
    product_images ( image_url, sort_order )
  `,
        )
        .order("created_at", { ascending: false });

      if (!error) setProducts(data);
    }

    loadProducts();
  }, []);


  const filtered =
    category === "all"
      ? products
      : products.filter((p) => p.category === category);
  return (
    <>
      <Header />
      <main className="page">
        <h2 className="page-title">Shop</h2>
        <div className="shopFilterBar">
          <button
            className={`filterPill ${category === "all" ? "active" : ""}`}
            onClick={() => setCategory("all")}
          >
            All
          </button>
          <button
            className={`filterPill ${category === "earrings" ? "active" : ""}`}
            onClick={() => setCategory("earrings")}
          >
            Earrings
          </button>
          <button
            className={`filterPill ${category === "necklaces" ? "active" : ""}`}
            onClick={() => setCategory("necklaces")}
          >
            Necklaces
          </button>
          <button
            className={`filterPill ${category === "rings" ? "active" : ""}`}
            onClick={() => setCategory("rings")}
          >
            Rings
          </button>
          <button
            className={`filterPill ${category === "bracelets" ? "active" : ""}`}
            onClick={() => setCategory("bracelets")}
          >
            Bracelets
          </button>
          <button
            className={`filterPill ${category === "sets" ? "active" : ""}`}
            onClick={() => setCategory("sets")}
          >
            Sets
          </button>
        </div>
        <div className="grid">
          {filtered.map((p) => (
            <ProductCard
              key={p.id}
             
              product={{
                id: p.id,
                name: p.name,
                price: Number(p.price),
                image: p.product_images,
                description: p.description,
              }}
            />
          ))}
        </div>
      </main>
    </>
  );
}
