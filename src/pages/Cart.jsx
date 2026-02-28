import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import { useCart } from "../context/CartContext";
import { createOrder } from "../lib/createOrder";

function money(n) {
  return `All ${Number(n).toFixed(2)}`;
}

export default function Cart() {
  const {
    items,
    subtotal,
    increment,
    decrement,
    setQty,
    removeItem,
    clearCart,
  } = useCart();

  const [checkingOut, setCheckingOut] = useState(false);
  const [message, setMessage] = useState(null);

  // ✅ Customer fields
  const [customer, setCustomer] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
  });

  const updateCustomer = (key, value) => {
    setCustomer((prev) => ({ ...prev, [key]: value }));
  };

  const validation = useMemo(() => {
    const errors = {};

    if (!customer.firstName.trim()) errors.firstName = "First name is required";
    if (!customer.lastName.trim()) errors.lastName = "Last name is required";
    if (!customer.address.trim()) errors.address = "Address is required";

    const phone = customer.phone.trim();
    if (!phone) errors.phone = "Phone number is required";
    // simple phone check (you can adjust)
    else if (!/^[0-9+\s()-]{6,20}$/.test(phone)) errors.phone = "Invalid phone";

    return {
      ok: Object.keys(errors).length === 0,
      errors,
    };
  }, [customer]);

  const onCheckout = async () => {
    if (items.length === 0) return;

    // ✅ Block checkout if customer data missing
    if (!validation.ok) {
      setMessage({
        type: "err",
        text: "Please fill in your customer details before checkout.",
      });
      return;
    }

    setCheckingOut(true);
    setMessage(null);

    try {
      // ✅ Pass customer info into order creation
      const order = await createOrder(items, subtotal, customer);

      clearCart();
      window.location.href = `/order/${order.id}`;
    } catch (e) {
      console.error(e);
      setMessage({
        type: "err",
        text: "Checkout failed. Please try again.",
      });
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <>
      <Header />

      <main className="page cartPage">
        <div className="cartTop">
          {items.length > 0 && (
            <button
              className="cartClear"
              onClick={clearCart}
              disabled={checkingOut}
            >
              Clear cart
            </button>
          )}
        </div>

        {message && (
          <div
            style={{
              margin: "10px 0 18px",
              padding: "12px 14px",
              borderRadius: 14,
              border: "1px solid rgba(0,0,0,0.10)",
              background:
                message.type === "ok"
                  ? "rgba(255,255,255,0.75)"
                  : "rgba(255,255,255,0.65)",
              opacity: 0.95,
            }}
          >
            {message.text}
          </div>
        )}

        {items.length === 0 ? (
          <div className="cartEmptyWrap">
            <div className="cartEmptyCard">
              <div className="cartEmptyIcon" aria-hidden="true">
                🛍️
              </div>

              <h2 className="cartEmptyTitle">Your cart is empty</h2>
              <p className="cartEmptyText">
                Looks like you haven’t added anything yet. Let’s find something
                you love.
              </p>

              <div className="cartEmptyActions">
                <Link className="cartEmptyBtn primary" to="/shop">
                  Browse products
                </Link>
                <Link className="cartEmptyBtn" to="/">
                  Back to home
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="cartLayout">
            <div className="cartList">
              {items.map((it) => (
                <div className="cartItem" key={it.id}>
                  <img className="cartImg" src={it.image} alt={it.name} />

                  <div className="cartInfo">
                    <div className="cartName">{it.name}</div>
                    <div className="cartPrice">{money(it.price)}</div>

                    <div className="cartControls">
                      <button
                        className="qtyBtn"
                        onClick={() => decrement(it.id)}
                        disabled={checkingOut}
                      >
                        -
                      </button>

                      <input
                        className="qtyInput"
                        value={it.qty}
                        onChange={(e) => setQty(it.id, e.target.value)}
                        inputMode="numeric"
                        disabled={checkingOut}
                      />

                      <button
                        className="qtyBtn"
                        onClick={() => increment(it.id)}
                        disabled={checkingOut}
                      >
                        +
                      </button>

                      <button
                        className="removeBtn"
                        onClick={() => removeItem(it.id)}
                        disabled={checkingOut}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="cartLineTotal">{money(it.price * it.qty)}</div>
                </div>
              ))}
            </div>

            <aside className="cartSummary">
              <div className="summaryCard">
                {/* ✅ Customer details form */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, marginBottom: 10 }}>
                    Customer details
                  </div>

                  <div style={{ display: "grid", gap: 10 }}>
                    <div>
                      <input
                        className="qtyInput"
                        style={{ width: "100%" }}
                        placeholder="First name"
                        value={customer.firstName}
                        onChange={(e) => updateCustomer("firstName", e.target.value)}
                        disabled={checkingOut}
                      />
                      {validation.errors.firstName && (
                        <div style={{ fontSize: 12, opacity: 0.8 }}>
                          {validation.errors.firstName}
                        </div>
                      )}
                    </div>

                    <div>
                      <input
                        className="qtyInput"
                        style={{ width: "100%" }}
                        placeholder="Last name"
                        value={customer.lastName}
                        onChange={(e) => updateCustomer("lastName", e.target.value)}
                        disabled={checkingOut}
                      />
                      {validation.errors.lastName && (
                        <div style={{ fontSize: 12, opacity: 0.8 }}>
                          {validation.errors.lastName}
                        </div>
                      )}
                    </div>

                    <div>
                      <input
                        className="qtyInput"
                        style={{ width: "100%" }}
                        placeholder="Phone number"
                        value={customer.phone}
                        onChange={(e) => updateCustomer("phone", e.target.value)}
                        disabled={checkingOut}
                      />
                      {validation.errors.phone && (
                        <div style={{ fontSize: 12, opacity: 0.8 }}>
                          {validation.errors.phone}
                        </div>
                      )}
                    </div>

                    <div>
                      <input
                        className="qtyInput"
                        style={{ width: "100%" }}
                        placeholder="Address"
                        value={customer.address}
                        onChange={(e) => updateCustomer("address", e.target.value)}
                        disabled={checkingOut}
                      />
                      {validation.errors.address && (
                        <div style={{ fontSize: 12, opacity: 0.8 }}>
                          {validation.errors.address}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="summaryRow">
                  <span>Subtotal</span>
                  <span>{money(subtotal)}</span>
                </div>

                <div className="summaryRow muted">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>

                <div className="summaryRow total">
                  <span>Total</span>
                  <span>{money(subtotal)}</span>
                </div>

                <button
                  className="checkoutBtn"
                  onClick={onCheckout}
                  disabled={checkingOut || !validation.ok}
                  title={!validation.ok ? "Fill customer details to checkout" : ""}
                >
                  {checkingOut ? "Processing..." : "Checkout"}
                </button>

                <Link className="continueLink" to="/shop">
                  Continue shopping →
                </Link>
              </div>
            </aside>
          </div>
        )}
      </main>
    </>
  );
}