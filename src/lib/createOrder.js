import { supabase } from "./supabase";

export async function createOrder(cartItems, total, customer) {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id;

  if (!userId) throw new Error("You must be signed in to checkout.");

  // Basic server-side-ish validation (still validate on UI too)
  const firstName = (customer?.firstName || "").trim();
  const lastName = (customer?.lastName || "").trim();
  const phone = (customer?.phone || "").trim();
  const address = (customer?.address || "").trim();

  if (!firstName || !lastName || !phone || !address) {
    throw new Error("Missing customer details.");
  }

  // ✅ Save customer info on the order row
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert([
      {
        total,
        user_id: userId,
        status: "pending",
        customer_first_name: firstName,
        customer_last_name: lastName,
        customer_phone: phone,
        customer_address: address,
      },
    ])
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