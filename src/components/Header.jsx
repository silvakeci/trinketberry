import { Link, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useAdmin } from "../hooks/useAdmin";

export default function Header() {
  const location = useLocation();
  const { count } = useCart();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="header">
      <div className="header-left">
        <div className="header-icon" aria-hidden="true">
          ✓
        </div>

        <div className="header-title">
          <strong>TRINKETBERRY</strong>
          <span>JEWELRY SHOP</span>
        </div>
      </div>

      <nav className="header-right">
        <Link className={isActive("/") ? "active" : ""} to="/">
          HOME
        </Link>

        <Link className={isActive("/shop") ? "active" : ""} to="/shop">
          SHOP
        </Link>

        <Link
          className={`cartLink ${isActive("/cart") ? "active" : ""}`}
          to="/cart"
        >
          CART {count > 0 && <span className="cartBadge">{count}</span>}
        </Link>

        {/* ✅ Only show ADMIN if user is admin */}
        {isAdmin && (
          <Link className={isActive("/admin") ? "active" : ""} to="/admin">
            ADMIN
          </Link>
        )}

        {user ? (
          <>
            <Link
              className={isActive("/account") ? "active" : ""}
              to="/account"
            >
              ACCOUNT
            </Link>

            <button className="headerSignout" onClick={signOut}>
              SIGN OUT
            </button>
          </>
        ) : (
          <Link className={isActive("/auth") ? "active" : ""} to="/auth">
            SIGN IN
          </Link>
        )}
      </nav>
    </header>
  );
}
