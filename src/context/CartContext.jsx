import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase } from "../lib/supabase";
import {
  loadCartItems,
  upsertCartItem,
  setCartQty as dbSetQty,
  removeCartItem as dbRemove,
  clearCartDb,
} from "../lib/cartDb";

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
  const [loadingCart, setLoadingCart] = useState(false);

  // current auth user id (null when logged out)
  const [userId, setUserId] = useState(null);

  // track last user id to detect logout transition
  const prevUserId = useRef(null);

  // Listen auth state changes
  useEffect(() => {
    let alive = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setUserId(data?.session?.user?.id ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => {
      alive = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  // ✅ If user logs out, clear cart + clear localStorage
  useEffect(() => {
    const wasLoggedIn = !!prevUserId.current;
    const isLoggedOutNow = !userId;

    if (wasLoggedIn && isLoggedOutNow) {
      setItems([]);
      localStorage.removeItem(STORAGE_KEY);
    }

    prevUserId.current = userId;
  }, [userId]);

  // When user logs in -> load DB cart into state
  useEffect(() => {
    if (!userId) return;

    (async () => {
      setLoadingCart(true);
      try {
        const dbItems = await loadCartItems();
        setItems(dbItems);
      } catch (e) {
        console.error("loadCartItems failed:", e);
      } finally {
        setLoadingCart(false);
      }
    })();
  }, [userId]);

  // When NOT logged in -> store guest cart locally
  useEffect(() => {
    if (!userId) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, userId]);

  const addItem = async (product, qty = 1) => {
    console.log('contect',product)
    // Guest cart
    if (!userId) {
      setItems((prev) => {
        const existing = prev.find((it) => it.id === product.id);
        if (existing) {
          return prev.map((it) =>
            it.id === product.id ? { ...it, qty: it.qty + qty } : it
          );
        }
        return [...prev, { ...product, qty }];
      });
      return;
    }

    // DB cart
    await upsertCartItem(product, qty);
    const refreshed = await loadCartItems();
    setItems(refreshed);
  };

  const removeItem = async (id) => {
    if (!userId) {
      setItems((prev) => prev.filter((it) => it.id !== id));
      return;
    }

    await dbRemove(id);
    const refreshed = await loadCartItems();
    setItems(refreshed);
  };

  const setQty = async (id, qty) => {
    const safeQty = Math.max(1, Math.min(99, Number(qty) || 1));

    if (!userId) {
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, qty: safeQty } : it))
      );
      return;
    }

    await dbSetQty(id, safeQty);
    const refreshed = await loadCartItems();
    setItems(refreshed);
  };

  const increment = (id) => {
    const current = items.find((i) => i.id === id)?.qty ?? 1;
    return setQty(id, current + 1);
  };

  const decrement = (id) => {
    const current = items.find((i) => i.id === id)?.qty ?? 1;
    return setQty(id, Math.max(1, current - 1));
  };

  const clearCart = async () => {
    if (!userId) {
      setItems([]);
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    await clearCartDb();
    setItems([]);
  };

  const count = useMemo(
    () => items.reduce((sum, it) => sum + it.qty, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + it.price * it.qty, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        count,
        subtotal,
        addItem,
        removeItem,
        setQty,
        increment,
        decrement,
        clearCart,
        loadingCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
