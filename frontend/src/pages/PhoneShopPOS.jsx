import { useState } from "react";
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';

// ── SVG Icons ────────────────────────────────────────────────────────────────
const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6b7a99" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);
const IconRefresh = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.75"/>
  </svg>
);
const IconCart = () => (
  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#4a5568" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);
const IconCreditCard = ({ color = "#fff" }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);
const IconReceipt = ({ color = "#d1d9e6" }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const IconTag = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8b9ab0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);

// ── Product Images (Sample placeholder images - replace with actual product images later) ──────────────
const products = [
  {
    id: 1, name: "iPhone 15 Pro Max", price: 1199, category: "iPhone", color: "#ff8040",
    img: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=200&h=200&fit=crop",
  },
  {
    id: 2, name: "iPhone 15 Pro", price: 999, category: "iPhone", color: "#a78bfa",
    img: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=200&h=200&fit=crop",
  },
  {
    id: 3, name: "iPhone 15", price: 799, category: "iPhone", color: "#22d3ee",
    img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200&h=200&fit=crop",
  },
  {
    id: 4, name: "iPhone 14", price: 699, category: "iPhone", color: "#22c55e",
    img: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=200&h=200&fit=crop",
  },
  {
    id: 5, name: "AirPods Pro 2", price: 249, category: "AirPods", color: "#ff8040",
    img: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=200&h=200&fit=crop",
  },
  {
    id: 6, name: "AirPods 3rd Gen", price: 179, category: "AirPods", color: "#a78bfa",
    img: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=200&h=200&fit=crop",
  },
  {
    id: 7, name: "AirPods Max", price: 549, category: "AirPods", color: "#22d3ee",
    img: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=200&h=200&fit=crop",
  },
  {
    id: 8, name: "Apple Watch Ultra 2", price: 799, category: "Watch", color: "#eab308",
    img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop",
  },
  {
    id: 9, name: "Apple Watch S9", price: 399, category: "Watch", color: "#22c55e",
    img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop",
  },
  {
    id: 10, name: 'iPad Pro 12.9"', price: 1099, category: "iPad", color: "#ff8040",
    img: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=200&h=200&fit=crop",
  },
  {
    id: 11, name: "iPad Air", price: 599, category: "iPad", color: "#22d3ee",
    img: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=200&h=200&fit=crop",
  },
  {
    id: 12, name: "MacBook Air M3", price: 1299, category: "Mac", color: "#a78bfa",
    img: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=200&h=200&fit=crop",
  },
];

const categories = ["All", "iPhone", "AirPods", "Watch", "iPad", "Mac"];

const SYS_FONT = `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif`;

export default function PhoneShopPOS() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role != null ? String(user.role).toLowerCase() : '';
  
  // Only allow Manager, Staff, and Cashier - redirect admin
  if (role === 'admin') {
    navigate('/dashboard');
    return null;
  }

  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState("");
  const [tab, setTab] = useState("Walk-In");
  const [hoverCard, setHoverCard] = useState(null);
  const [imgErrors, setImgErrors] = useState({});

  const filtered = products.filter(
    (p) =>
      (category === "All" || p.category === category) &&
      p.name.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product) => {
    setCart((prev) => {
      const ex = prev.find((i) => i.id === product.id);
      if (ex) return prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev.map((i) => (i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i)).filter((i) => i.qty > 0)
    );
  };

  const removeItem = (id) => setCart((prev) => prev.filter((i) => i.id !== id));

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const discountAmt = parseFloat(discount) || 0;
  const tax = (subtotal - discountAmt) * 0.12;
  const total = subtotal - discountAmt + tax;

  // Fallback colored box if image fails
  const handleImgError = (id) => setImgErrors((prev) => ({ ...prev, [id]: true }));

  return (
    <>
      <Helmet>
        <title>Phone Shop POS - iphone center.lk</title>
        <meta name="description" content="Point of Sale system for phone shop" />
      </Helmet>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0c0e14; font-family: ${SYS_FONT}; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #444; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
      `}</style>

      <div style={{ fontFamily: SYS_FONT, background: "#0c0e14", color: "#fff", height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* ── Main layout ── */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* ── LEFT: Product panel ── */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: "16px 18px", gap: 12 }}>

            {/* Search */}
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", display: "flex" }}>
                <IconSearch />
              </span>
              <input
                style={{ background: "#1e2433", border: "1px solid #2a3347", borderRadius: 10, padding: "9px 14px 9px 36px", color: "#d1d9e6", fontSize: 13, width: "100%", outline: "none", fontFamily: SYS_FONT }}
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Category pills */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  style={{
                    padding: "6px 14px", borderRadius: 20, cursor: "pointer", fontFamily: SYS_FONT, fontSize: 12, fontWeight: category === c ? 700 : 400, transition: "all 0.15s",
                    border: category === c ? "none" : "1px solid #303338",
                    background: category === c ? "linear-gradient(135deg, #ff8040 0%, #c03800 100%)" : "#1c1e24",
                    color: category === c ? "#fff" : "#8b9ab0",
                  }}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Product grid — fixed 3 columns */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, overflowY: "auto", paddingBottom: 8, alignContent: "start" }}>
              {filtered.map((p) => (
                <div
                  key={p.id}
                  onMouseEnter={() => setHoverCard(p.id)}
                  onMouseLeave={() => setHoverCard(null)}
                  style={{
                    background: "#13161e",
                    border: hoverCard === p.id ? `1px solid ${p.color}` : "1px solid #1e2433",
                    borderRadius: 14, padding: "14px 12px 12px", cursor: "pointer", position: "relative", overflow: "hidden",
                    display: "flex", flexDirection: "column", gap: 8, alignItems: "center",
                    transform: hoverCard === p.id ? "translateY(-2px)" : "none",
                    boxShadow: hoverCard === p.id ? `0 4px 20px ${p.color}25` : "none",
                    transition: "all 0.18s",
                  }}
                >
                  {/* Top accent bar */}
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: p.color, borderRadius: "14px 14px 0 0" }} />

                  {/* Product image */}
                  <div style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", height: 90, background: "#0f1117", borderRadius: 10, overflow: "hidden" }}>
                    <img
                      src={p.img}
                      alt={p.name}
                      onError={(e) => {
                        // Fallback to a generic placeholder image if the main image fails
                        e.target.src = `https://via.placeholder.com/200x200/1e2433/${p.color.replace('#', '')}?text=${encodeURIComponent(p.name)}`;
                        handleImgError(p.id);
                      }}
                      style={{ width: "100%", height: "100%", objectFit: "contain", padding: 8 }}
                    />
                  </div>

                  {/* Info */}
                  <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#d1d9e6", lineHeight: 1.3, textAlign: "center" }}>{p.name}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: p.color, textAlign: "center" }}>${p.price.toLocaleString()}</div>
                  </div>

                  {/* Add button */}
                  <button
                    onClick={() => addToCart(p)}
                    style={{
                      width: "100%", border: hoverCard === p.id ? "none" : "1px solid #303338", borderRadius: 8,
                      fontSize: 16, fontWeight: 700, cursor: "pointer", padding: "5px 0", fontFamily: SYS_FONT, transition: "all 0.15s",
                      background: hoverCard === p.id ? p.color : "#1c1e24",
                      color: hoverCard === p.id ? "#fff" : p.color,
                    }}
                  >+</button>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Order panel ── */}
          <div style={{ width: 318, background: "#13161e", borderLeft: "1px solid #1e2433", display: "flex", flexDirection: "column", overflow: "hidden" }}>

            {/* Order header */}
            <div style={{ background: "#0f1117", borderBottom: "1px solid #1e2433", padding: "13px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: 0.2 }}>Order Details</div>
                <div style={{ color: "#8b9ab0", fontSize: 11, marginTop: 2 }}>{cart.reduce((s, i) => s + i.qty, 0)} items in cart</div>
              </div>
              <button
                onClick={() => setCart([])}
                style={{ background: "transparent", border: "1px solid #303338", borderRadius: 8, color: "#ef4444", padding: "5px 10px", fontSize: 11, cursor: "pointer", fontFamily: SYS_FONT, display: "flex", alignItems: "center", gap: 5 }}
              >
                <IconRefresh /> Reset
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid #1e2433" }}>
              {["Walk-In", "Pick Up", "Delivery"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    flex: 1, padding: "10px 16px", textAlign: "center", fontSize: 11, fontWeight: tab === t ? 700 : 400,
                    color: tab === t ? "#ff8040" : "#6b7a99",
                    borderBottom: tab === t ? "2px solid #ff8040" : "2px solid transparent",
                    cursor: "pointer", background: "transparent", border: "none", fontFamily: SYS_FONT, transition: "all 0.15s",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Cart items */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: "center", padding: "50px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><IconCart /></div>
                  <div style={{ color: "#6b7a99", fontSize: 13 }}>No items added yet</div>
                  <div style={{ marginTop: 6, fontSize: 12, color: "#4a5568" }}>Tap + to add products</div>
                </div>
              ) : cart.map((item) => (
                <div key={item.id} style={{ display: "flex", alignItems: "center", padding: "10px 14px", gap: 10, borderBottom: "1px solid #1e2433" }}>
                  {/* Thumbnail */}
                  <div style={{ width: 38, height: 38, borderRadius: 8, background: "#0f1117", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img 
                      src={item.img} 
                      alt={item.name} 
                      onError={(e) => {
                        e.target.src = `https://via.placeholder.com/38x38/1e2433/${item.color.replace('#', '')}?text=${encodeURIComponent(item.name.charAt(0))}`;
                      }}
                      style={{ width: "100%", height: "100%", objectFit: "contain", padding: 3 }} 
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#d1d9e6", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: item.color, fontWeight: 700, marginTop: 2 }}>${(item.price * item.qty).toLocaleString()}</div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <button onClick={() => updateQty(item.id, -1)} style={{ background: "#1c1e24", border: "1px solid #303338", color: "#d1d9e6", borderRadius: 6, width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: SYS_FONT }}>−</button>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", minWidth: 16, textAlign: "center" }}>{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} style={{ background: "#1c1e24", border: "1px solid #303338", color: "#d1d9e6", borderRadius: 6, width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: SYS_FONT }}>+</button>
                  </div>

                  <button onClick={() => removeItem(item.id)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 2, display: "flex", alignItems: "center" }}>
                    <IconTrash />
                  </button>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div style={{ borderTop: "1px solid #1e2433", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#8b9ab0" }}>
                <span>Sub Total</span>
                <span style={{ color: "#d1d9e6" }}>${subtotal.toFixed(2)}</span>
              </div>

              <input
                style={{ background: "#1e2433", border: "1px solid #2a3347", borderRadius: 8, padding: "7px 12px", color: "#d1d9e6", fontSize: 13, width: "100%", outline: "none", fontFamily: SYS_FONT }}
                placeholder="Discount amount ($)"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                type="number"
                min="0"
              />

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#8b9ab0" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}><IconTag />Discount</span>
                <span style={{ color: "#ef4444" }}>-${discountAmt.toFixed(2)}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#8b9ab0" }}>
                <span>Tax 12%</span>
                <span style={{ color: "#d1d9e6" }}>${tax.toFixed(2)}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800, color: "#fff", borderTop: "1px solid #1e2433", paddingTop: 10, marginTop: 2 }}>
                <span>Total Payment</span>
                <span style={{ color: "#ff8040" }}>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 8, padding: "0 16px 16px" }}>
              <button
                disabled={cart.length === 0}
                style={{
                  flex: 2, border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, padding: "13px 0",
                  cursor: cart.length === 0 ? "not-allowed" : "pointer", fontFamily: SYS_FONT,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  background: cart.length === 0 ? "#1c1e24" : "linear-gradient(135deg, #ff8040 0%, #e05010 54%, #c03800 100%)",
                  color: cart.length === 0 ? "#4a5568" : "#fff",
                }}
              >
                <IconCreditCard color={cart.length === 0 ? "#4a5568" : "#fff"} /> Pay Now
              </button>
              <button
                disabled={cart.length === 0}
                style={{
                  flex: 1, background: "#1c1e24", border: "1px solid #303338", borderRadius: 10,
                  color: cart.length === 0 ? "#4a5568" : "#d1d9e6", fontWeight: 600, fontSize: 12, padding: "13px 0",
                  cursor: cart.length === 0 ? "not-allowed" : "pointer", fontFamily: SYS_FONT,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                <IconReceipt color={cart.length === 0 ? "#4a5568" : "#d1d9e6"} /> Open Bill
              </button>
            </div>
          </div>
        </div>

        {/* ── Status bar ── */}
        <div style={{ background: "#0f1117", borderTop: "1px solid #1e2433", padding: "7px 20px", display: "flex", alignItems: "center", gap: 20, fontSize: 11, color: "#6b7a99", flexShrink: 0 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="8" height="8"><circle cx="4" cy="4" r="4" fill="#22c55e"/></svg>
            System Online
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="8" height="8"><circle cx="4" cy="4" r="4" fill="#22d3ee"/></svg>
            Printer Ready
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="8" height="8"><circle cx="4" cy="4" r="4" fill="#ff8040"/></svg>
            POS v2.4.1
          </span>
          <span style={{ marginLeft: "auto" }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </span>
        </div>
      </div>
    </>
  );
}
