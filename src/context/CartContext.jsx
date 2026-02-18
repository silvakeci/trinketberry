import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);

const STORAGE_KEY = "trinketberry_cart_v1";

function readStoredCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => readStoredCart());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (product, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((it) => it.id === product.id);
      if (existing) {
        return prev.map((it) =>
          it.id === product.id ? { ...it, qty: it.qty + qty } : it
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          qty,
        },
      ];
    });
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const setQty = (id, qty) => {
    const safeQty = Math.max(1, Math.min(99, Number(qty) || 1));
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, qty: safeQty } : it)));
  };

  const increment = (id) => setItems((prev) =>
    prev.map((it) => (it.id === id ? { ...it, qty: Math.min(99, it.qty + 1) } : it))
  );

  const decrement = (id) => setItems((prev) =>
    prev.map((it) => {
      if (it.id !== id) return it;
      const nextQty = it.qty - 1;
      return nextQty <= 0 ? it : { ...it, qty: nextQty };
    })
  );

  const clearCart = () => setItems([]);

  const count = useMemo(() => items.reduce((sum, it) => sum + it.qty, 0), [items]);
  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + it.price * it.qty, 0),
    [items]
  );

  const value = {
    items,
    count,
    subtotal,
    addItem,
    removeItem,
    setQty,
    increment,
    decrement,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
