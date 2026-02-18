import { useEffect, useState } from "react";
import Header from "../components/Header";
import ProductCard from "../components/ProductCard";
import { supabase } from "../lib/supabase";

export default function Shop() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    async function loadProducts() {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error) setProducts(data);
    }

    loadProducts();
  }, []);

  return (
    <>
      <Header />
      <main className="page">
        <h2 className="page-title">Shop</h2>

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
      </main>
    </>
  );
}
