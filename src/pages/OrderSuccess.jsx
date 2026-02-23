import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "../components/Header";
import { supabase } from "../lib/supabase";

function money(n) {
  return `All ${Number(n).toFixed(2)}`;
}

export default function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      const { data: orderData } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .single();

      const { data: itemsData } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", id)
        .order("id", { ascending: true });

      setOrder(orderData || null);
      setItems(itemsData || []);
      setLoading(false);
    }

    load();
  }, [id]);

  return (
    <>
      <Header />

      <main className="page orderPage">
        {loading ? (
          <div className="orderCard">
            <div className="orderTitle">Loading…</div>
            <div className="orderMuted">Fetching your order details.</div>
          </div>
        ) : !order ? (
          <div className="orderCard">
            <div className="orderTitle">Order not found</div>
            <div className="orderMuted">
              This order ID doesn’t exist (or you don’t have access).
            </div>
            <div className="orderActions">
              <Link className="orderBtn" to="/shop">
                Back to shop
              </Link>
            </div>
          </div>
        ) : (
          <div className="orderCard">
            <div className="orderTop">
              <div className="orderIcon" aria-hidden="true">
                ✓
              </div>
              <div>
                <div className="orderTitle">Thank you for your order</div>
                <div className="orderMuted">
                  Order ID: <span className="orderId">{order.id}</span>
                </div>
              </div>
            </div>

            <div className="orderDivider" />

            <div className="orderList">
              {items.map((it) => (
                <div className="orderRow" key={it.id}>
                  <div className="orderRowLeft">
                    <div className="orderName">{it.name}</div>
                    <div className="orderMutedSmall">
                      Qty {it.quantity} · {money(it.price)}
                    </div>
                  </div>
                  <div className="orderRowRight">
                    {money(Number(it.price) * Number(it.quantity))}
                  </div>
                </div>
              ))}
            </div>

            <div className="orderDivider" />

            <div className="orderTotal">
              <span>Total</span>
              <span>{money(order.total)}</span>
            </div>

            <div className="orderActions">
              <Link className="orderBtn" to="/shop">
                Continue shopping
              </Link>
              <Link className="orderBtn secondary" to="/">
                Home
              </Link>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
