import { supabase } from "./supabase";

// Ensure the logged-in user has a cart, return cart_id
export async function ensureCart() {
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;
  if (!userId) throw new Error("Not signed in");

  // try find cart
  const { data: existing } = await supabase
    .from("carts")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (existing?.id) return existing.id;

  // create one
  const { data: created, error } = await supabase
    .from("carts")
    .insert([{ user_id: userId }])
    .select()
    .single();

  if (error) throw error;
  return created.id;
}

export async function loadCartItems() {
  const cartId = await ensureCart();

  const { data, error } = await supabase
    .from("cart_items")
    .select("*")
    .eq("cart_id", cartId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return data.map((it) => ({
    id: it.product_id,
    name: it.name,
    price: Number(it.price),
    image: it.image_url,
    qty: it.quantity,
    _rowId: it.id, // db row id
    _cartId: it.cart_id,
  }));
}

export async function upsertCartItem(product, qty) {
  const cartId = await ensureCart();

  // check if already exists
  const { data: existing } = await supabase
    .from("cart_items")
    .select("*")
    .eq("cart_id", cartId)
    .eq("product_id", product.id)
    .single();

  if (existing?.id) {
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: existing.quantity + qty })
      .eq("id", existing.id);

    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("cart_items").insert([
    {
      cart_id: cartId,
      product_id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      quantity: qty,
    },
  ]);

  if (error) throw error;
}

export async function setCartQty(productId, qty) {
  const cartId = await ensureCart();
  const safeQty = Math.max(1, Math.min(99, Number(qty) || 1));

  const { data: existing } = await supabase
    .from("cart_items")
    .select("*")
    .eq("cart_id", cartId)
    .eq("product_id", productId)
    .single();

  if (!existing?.id) return;

  const { error } = await supabase
    .from("cart_items")
    .update({ quantity: safeQty })
    .eq("id", existing.id);

  if (error) throw error;
}

export async function removeCartItem(productId) {
  const cartId = await ensureCart();
  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("cart_id", cartId)
    .eq("product_id", productId);

  if (error) throw error;
}

export async function clearCartDb() {
  const cartId = await ensureCart();
  const { error } = await supabase.from("cart_items").delete().eq("cart_id", cartId);
  if (error) throw error;
}
