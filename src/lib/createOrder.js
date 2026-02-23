import { supabase } from "./supabase";

export async function createOrder(cartItems, total) {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id;

  if (!userId) throw new Error("You must be signed in to checkout.");

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert([{ total, user_id: userId, status: "pending" }])
    .select()
    .single();

  if (orderError) throw orderError;

  const items = cartItems.map((item) => ({
    order_id: order.id,
    product_id: item.id,
    name: item.name,
    price: item.price,
    quantity: item.qty,
    image_url: item.image_url || item.image || "",
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(items);
  if (itemsError) throw itemsError;

  return order;
}