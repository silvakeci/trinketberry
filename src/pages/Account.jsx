import { useEffect, useState } from "react";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { Link, useNavigate } from "react-router-dom";

function money(n) {
  return `$${Number(n).toFixed(2)}`;
}

export default function Account() {
  const { user, signOut } = useAuth();
  const nav = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState(""); // success/error message

  useEffect(() => {
    if (!user) {
      nav("/auth");
      return;
    }

    async function loadOrders() {
      setLoadingOrders(true);
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error) setOrders(data || []);
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
const { data , error} = await supabase.auth.getSession();
    if (error) throw error;

    const token = data?.session?.access_token;
    if (!token) throw new Error("Session token missing. Please sign in again.");
console.log("token length:", token?.length);

    const { data: res, error: fnErr } = await supabase.functions.invoke("delete-user", {
      headers: { Authorization: `Bearer ${token}` },
      body: { confirm: true },
    });

    if (fnErr) throw fnErr;
    if (!res?.ok) throw new Error(res?.error || "Delete failed.");

    await signOut();
    nav("/");
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

          {msg && <div className="authError" style={{ marginTop: 14 }}>{msg}</div>}

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
              {orders.map((o) => (
                <Link key={o.id} className="accountOrderCard" to={`/order/${o.id}`}>
                  <div>
                    <div className="accountOrderId">{o.id}</div>
                    <div className="accountOrderDate">
                      {new Date(o.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="accountOrderTotal">{money(o.total)}</div>
                </Link>
              ))}
            </div>
          )}

          <div className="orderDivider" />

          <div className="dangerZone">
            <div className="dangerTitle">Danger zone</div>
            <div className="dangerText">
              Deleting your account is permanent.
            </div>

            <button
              className="dangerBtn"
              onClick={deleteAccount}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete my account"}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
