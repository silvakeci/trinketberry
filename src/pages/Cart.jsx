import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import { useCart } from "../context/CartContext";
import { createOrder } from "../lib/createOrder";

function money(n) {
  return `$${Number(n).toFixed(2)}`;
}

export default function Cart() {
  const { items, subtotal, increment, decrement, setQty, removeItem, clearCart } =
    useCart();

  const [checkingOut, setCheckingOut] = useState(false);
  const [message, setMessage] = useState(null);

  const onCheckout = async () => {
    if (items.length === 0) return;

    setCheckingOut(true);
    setMessage(null);

    try {
      const order = await createOrder(items, subtotal);
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
          <h2 className="page-title">Cart</h2>

          {items.length > 0 && (
            <button className="cartClear" onClick={clearCart} disabled={checkingOut}>
              Clear cart
            </button>
          )}
        </div>

        {/* Message box */}
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
          <div className="cartEmpty">
            <p>Your cart is empty.</p>
            <Link className="cartLink" to="/shop">
              Go to shop →
            </Link>
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
                  disabled={checkingOut}
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
