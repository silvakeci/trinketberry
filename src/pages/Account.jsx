import { useEffect, useState } from "react";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { Link, useNavigate } from "react-router-dom";

function money(n) {
  return `All ${Number(n || 0).toFixed(2)}`;
}

export default function Account() {
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    async function loadOrders() {
      setLoadingOrders(true);

      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          created_at,
          total,
          status,
          order_items (
            id,
            name,
            price,
            quantity,
            image_url
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("loadOrders error:", error);
        setOrders([]);
      } else {
        setOrders(data || []);
      }

      setLoadingOrders(false);
    }

    loadOrders();
  }, [user, nav]);

  const deleteAccount = async () => {
    setMsg("");

    const ok = window.confirm("Delete your account permanently?");
    if (!ok) return;

    setDeleting(true);
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;

      const token = data?.session?.access_token;
      if (!token) throw new Error("Session token missing. Please sign in again.");

      const { data: res, error: fnErr } = await supabase.functions.invoke("delete-user", {
        headers: { Authorization: `Bearer ${token}` },
        body: { confirm: true },
      });

      if (fnErr) throw fnErr;
      if (!res?.ok) throw new Error(res?.error || "Delete failed.");

      await signOut();
      nav("/auth");
    } catch (e) {
      console.error(e);
      setMsg(e.message || "Delete failed.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Header />

      <main className="page accountCenter">
        <div className="accountCard">
          <div className="accountHeaderRow">
            <div>
              <div className="accountTitle">Account</div>
              <div className="accountMuted">Signed in as</div>
              <div className="accountEmail">{user?.email}</div>
            </div>

            <button className="orderBtn secondary" onClick={signOut}>
              Sign out
            </button>
          </div>

          {msg && (
            <div className="authError" style={{ marginTop: 14 }}>
              {msg}
            </div>
          )}

          <div className="orderDivider" />

          <div className="section-title">Your orders</div>

          {loadingOrders ? (
            <p style={{ opacity: 0.6 }}>Loading…</p>
          ) : orders.length === 0 ? (
            <p style={{ opacity: 0.7 }}>
              No orders yet. <Link to="/shop">Shop now →</Link>
            </p>
          ) : (
            <div className="accountOrders">
              {orders.map((o) => {
                const items = o.order_items || [];

                return (
                  <div className="orderCard" key={o.id}>
                    <div className="orderHeader">
                      <div>
                        <div className="orderDate">
                          {new Date(o.created_at).toLocaleString()}
                        </div>
                        <div className="orderMeta">
                          <span className="orderTotal">{money(o.total)}</span>
                        </div>
                      </div>

                      <div className="orderCount">
                        {items.reduce((sum, it) => sum + Number(it.quantity || 0), 0)} items
                      </div>
                    </div>

                    <div className="orderItemsPreview">
                      {items.slice(0, 4).map((it) => (
                        <div className="orderItemRow" key={it.id}>
                          <img
                            className="orderThumb"
                            src={it.image_url || "/images/placeholder.jpg"}
                            alt=""
                          />

                          <div className="orderItemInfo">
                            <div className="orderItemName">{it.name}</div>
                            <div className="orderItemSub">
                              Qty {it.quantity} · {money(it.price)}
                            </div>
                          </div>

                          <div className="orderItemLineTotal">
                            {money(Number(it.price) * Number(it.quantity))}
                          </div>
                        </div>
                      ))}

                      {items.length > 4 && (
                        <div className="orderMore">+ {items.length - 4} more…</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="orderDivider" />

          <div className="dangerZone">
            <div className="dangerTitle">Danger zone</div>
            <div className="dangerText">Deleting your account is permanent.</div>

            <button className="dangerBtn" onClick={deleteAccount} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete my account"}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}