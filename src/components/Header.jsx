import { Link, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useAdmin } from "../hooks/useAdmin";
import { useEffect, useState } from "react";

export default function Header() {
  const location = useLocation();
  const { count } = useCart();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();

  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const closeMenu = () => setMenuOpen(false);

  // Close drawer on route change
  useEffect(() => {
    closeMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Lock scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [menuOpen]);

  return (
    <>
      <header className="header">
        {/* Mobile toggle button (LEFT) */}
        <button
          className="menuToggle"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? "✕" : "☰"}
        </button>

        <div className="header-left">
          <div className="header-icon" aria-hidden="true">
            ✓
          </div>

          <div className="header-title">
            <strong>TRINKETBERRY</strong>
            <span>JEWELRY SHOP</span>
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="header-right desktop-nav">
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

        {/* Spacer so title stays centered-ish on mobile */}
        <div className="header-spacer" />
      </header>

      {/* Overlay */}
      <div
        className={`menuOverlay ${menuOpen ? "open" : ""}`}
        onClick={closeMenu}
      />

      {/* LEFT drawer */}
      <aside className={`mobile-drawer ${menuOpen ? "open" : ""}`}>
        <div className="drawerTop">
          {/* ✅ SAME CLASS as big header */}
          <div className="header-title">
            <strong>TRINKETBERRY</strong>
            <span>JEWELRY SHOP</span>
          </div>

          <button className="drawerClose" onClick={closeMenu} aria-label="Close">
            ✕
          </button>
        </div>

        <Link className={isActive("/") ? "active" : ""} to="/">
          HOME
        </Link>

        <Link className={isActive("/shop") ? "active" : ""} to="/shop">
          SHOP
        </Link>

        <Link className={isActive("/cart") ? "active" : ""} to="/cart">
          CART {count > 0 && <span className="cartBadge">{count}</span>}
        </Link>

        {isAdmin && (
          <Link className={isActive("/admin") ? "active" : ""} to="/admin">
            ADMIN
          </Link>
        )}

        <div className="drawerDivider" />

        {user ? (
          <>
            <Link
              className={isActive("/account") ? "active" : ""}
              to="/account"
            >
              ACCOUNT
            </Link>

            <button
              className="drawerBtn"
              onClick={() => {
                signOut();
                closeMenu();
              }}
            >
              SIGN OUT
            </button>
          </>
        ) : (
          <Link className={isActive("/auth") ? "active" : ""} to="/auth">
            SIGN IN
          </Link>
        )}
      </aside>
    </>
  );
}