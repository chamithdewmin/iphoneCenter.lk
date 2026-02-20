import { useState } from "react";
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';

const SYS_FONT = `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif`;

// ── SVG Icons ─────────────────────────────────────────────────────────────────
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

// ── Product Images (Sample placeholder - replace with actual product images later) ──────────────
const products = [
  { id: 1,  name: "iPhone 15 Pro Max",   price: 1199, category: "iPhone",   color: "#ff8040", img: "https://www.imagineonline.store/cdn/shop/files/iPhone_15_Pink_PDP_Image_Position-1__en-IN.jpg?v=1759733974&width=1445" },
  { id: 2,  name: "iPhone 15 Pro",       price: 999,  category: "iPhone",   color: "#ff8040", img: "https://www.imagineonline.store/cdn/shop/files/iPhone_15_Pink_PDP_Image_Position-1__en-IN.jpg?v=1759733974&width=1445" },
  { id: 3,  name: "iPhone 15",           price: 799,  category: "iPhone",   color: "#ff8040", img: "https://www.imagineonline.store/cdn/shop/files/iPhone_15_Pink_PDP_Image_Position-1__en-IN.jpg?v=1759733974&width=1445" },
  { id: 4,  name: "iPhone 14",           price: 699,  category: "iPhone",   color: "#ff8040", img: "https://www.imagineonline.store/cdn/shop/files/iPhone_15_Pink_PDP_Image_Position-1__en-IN.jpg?v=1759733974&width=1445" },
  { id: 5,  name: "AirPods Pro 2",       price: 249,  category: "AirPods",  color: "#ff8040", img: "https://www.imagineonline.store/cdn/shop/files/iPhone_15_Pink_PDP_Image_Position-1__en-IN.jpg?v=1759733974&width=1445" },
  { id: 6,  name: "AirPods 3rd Gen",     price: 179,  category: "AirPods",  color: "#ff8040", img: "https://www.imagineonline.store/cdn/shop/files/iPhone_15_Pink_PDP_Image_Position-1__en-IN.jpg?v=1759733974&width=1445" },
  { id: 7,  name: "AirPods Max",         price: 549,  category: "AirPods",  color: "#ff8040", img: "https://www.imagineonline.store/cdn/shop/files/iPhone_15_Pink_PDP_Image_Position-1__en-IN.jpg?v=1759733974&width=1445" },
  { id: 8,  name: "Apple Watch Ultra 2", price: 799,  category: "Watch",    color: "#ff8040", img: "https://www.imagineonline.store/cdn/shop/files/iPhone_15_Pink_PDP_Image_Position-1__en-IN.jpg?v=1759733974&width=1445" },
  { id: 9,  name: "Apple Watch S9",      price: 399,  category: "Watch",    color: "#ff8040", img: "https://www.imagineonline.store/cdn/shop/files/iPhone_15_Pink_PDP_Image_Position-1__en-IN.jpg?v=1759733974&width=1445" },
  { id: 10, name: 'iPad Pro 12.9"',      price: 1099, category: "iPad",     color: "#ff8040", img: "https://www.imagineonline.store/cdn/shop/files/iPhone_15_Pink_PDP_Image_Position-1__en-IN.jpg?v=1759733974&width=1445" },
  { id: 11, name: "iPad Air",            price: 599,  category: "iPad",     color: "#ff8040", img: "https://www.imagineonline.store/cdn/shop/files/iPhone_15_Pink_PDP_Image_Position-1__en-IN.jpg?v=1759733974&width=1445" },
  { id: 12, name: "MacBook Air M3",      price: 1299, category: "Mac",      color: "#ff8040", img: "https://www.imagineonline.store/cdn/shop/files/iPhone_15_Pink_PDP_Image_Position-1__en-IN.jpg?v=1759733974&width=1445" },
];

const categories = ["All", "iPhone", "AirPods", "Watch", "iPad", "Mac"];

// ── Product Image Component ───────────────────────────────────────────────────
const ProductImage = ({ product }) => {
  const { img, color } = product;
  return (
    <div style={{
      width: "100%", height: "100%", minHeight: 180,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "#0f1117",
      position: "relative", overflow: "hidden",
    }}>
      <img
        src={img}
        alt={product.name}
        onError={(e) => {
          e.target.src = `https://via.placeholder.com/200x200/1e2433/${color.replace('#', '')}?text=${encodeURIComponent(product.name)}`;
        }}
        style={{
          width: "100%", height: "100%", objectFit: "cover", position: "relative", zIndex: 1,
        }}
      />
    </div>
  );
};

// ── Mini product thumbnail for cart ──────────────────────────────────────────
const CartThumb = ({ product }) => {
  const { img, color, name } = product;
  return (
    <div style={{ width: 44, height: 44, borderRadius: 8, background: `${color}10`, border: `1px solid ${color}25`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <img
        src={img}
        alt={name}
        onError={(e) => {
          e.target.src = `https://via.placeholder.com/44x44/1e2433/${color.replace('#', '')}?text=${encodeURIComponent(name.charAt(0))}`;
        }}
        style={{ width: "100%", height: "100%", objectFit: "contain", padding: 3 }}
      />
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
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
        .prod-card { transition: all 0.18s ease; }
        .prod-card:hover { transform: translateY(-3px); }
        .add-btn { transition: all 0.15s ease; }
        .add-btn:hover { opacity: 0.9; }
      `}</style>

      <div style={{ fontFamily: SYS_FONT, background: "#0c0e14", color: "#fff", height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* ── LEFT: Products ── */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: "16px 18px", gap: 12 }}>

            {/* Search bar */}
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
                <button key={c} onClick={() => setCategory(c)}
                  style={{
                    padding: "6px 15px", borderRadius: 20, cursor: "pointer", fontFamily: SYS_FONT,
                    fontSize: 12, fontWeight: category === c ? 600 : 400, transition: "all 0.15s",
                    border: category === c ? "none" : "1px solid #303338",
                    background: category === c ? "linear-gradient(135deg, #ff8040 0%, #c03800 100%)" : "#1c1e24",
                    color: category === c ? "#fff" : "#8b9ab0",
                  }}>
                  {c}
                </button>
              ))}
            </div>

            {/* Product grid — 4 columns */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, overflowY: "auto", paddingBottom: 8, alignContent: "start" }}>
              {filtered.map((p) => {
                const isHovered = hoverCard === p.id;
                const inCart = cart.find(i => i.id === p.id);
                return (
                  <div key={p.id} className="prod-card"
                    onMouseEnter={() => setHoverCard(p.id)}
                    onMouseLeave={() => setHoverCard(null)}
                    style={{
                      background: "#13161e",
                      border: isHovered ? `1px solid ${p.color}80` : "1px solid #1e2433",
                      borderRadius: 14, padding: 0, cursor: "pointer",
                      position: "relative", overflow: "hidden",
                      display: "flex", flexDirection: "column", alignItems: "stretch", gap: 0,
                      boxShadow: isHovered ? `0 6px 24px ${p.color}20` : "none",
                    }}>

                    {/* Cart qty badge — top left */}
                    {inCart && (
                      <div style={{
                        position: "absolute", top: 8, left: 8,
                        background: p.color, color: "#fff", borderRadius: "50%",
                        width: 22, height: 22, fontSize: 11, fontWeight: 700,
                        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                      }}>{inCart.qty}</div>
                    )}

                    {/* Product image - full card size */}
                    <div style={{ width: "100%", flex: 1, minHeight: 200 }}>
                      <ProductImage product={p} />
                    </div>

                    {/* Name & price + circle add button row */}
                    <div style={{ width: "100%", padding: "12px 14px", background: "#13161e", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 6 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#d1d9e6", lineHeight: 1.35, marginBottom: 4 }}>{p.name}</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: p.color }}>${p.price.toLocaleString()}</div>
                      </div>

                      {/* Circle + button */}
                      <button
                        onClick={() => addToCart(p)}
                        style={{
                          width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                          border: "none", cursor: "pointer", fontFamily: SYS_FONT,
                          fontSize: 22, fontWeight: 300, lineHeight: 1,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: isHovered ? p.color : `${p.color}20`,
                          color: isHovered ? "#fff" : p.color,
                          boxShadow: isHovered ? `0 0 12px ${p.color}60` : "none",
                          transition: "all 0.15s",
                        }}>+</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── RIGHT: Order panel (wider) ── */}
          <div style={{ width: 480, background: "#13161e", borderLeft: "1px solid #1e2433", display: "flex", flexDirection: "column", overflow: "hidden" }}>

            {/* Header */}
            <div style={{ background: "#0f1117", borderBottom: "1px solid #1e2433", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Order Details</div>
                <div style={{ color: "#8b9ab0", fontSize: 11, marginTop: 2 }}>{cart.reduce((s, i) => s + i.qty, 0)} items · ${subtotal.toFixed(2)}</div>
              </div>
              <button onClick={() => setCart([])}
                style={{ background: "transparent", border: "1px solid #303338", borderRadius: 8, color: "#ef4444", padding: "6px 12px", fontSize: 11, cursor: "pointer", fontFamily: SYS_FONT, display: "flex", alignItems: "center", gap: 5 }}>
                <IconRefresh /> Reset
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid #1e2433" }}>
              {["Walk-In", "Pick Up", "Delivery"].map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  style={{
                    flex: 1, padding: "11px 0", textAlign: "center", fontSize: 11, fontWeight: tab === t ? 700 : 400,
                    color: tab === t ? "#ff8040" : "#6b7a99",
                    borderBottom: tab === t ? "2px solid #ff8040" : "2px solid transparent",
                    cursor: "pointer", background: "transparent", border: "none",
                    fontFamily: SYS_FONT, transition: "all 0.15s",
                  }}>
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
                <div key={item.id} style={{ display: "flex", alignItems: "center", padding: "12px 18px", gap: 12, borderBottom: "1px solid #1e2433" }}>
                  <CartThumb product={item} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#d1d9e6", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: "#8b9ab0", marginTop: 2 }}>${item.price.toLocaleString()} each</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button onClick={() => updateQty(item.id, -1)}
                      style={{ background: "#1c1e24", border: "1px solid #303338", color: "#d1d9e6", borderRadius: 6, width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, fontWeight: 700, fontFamily: SYS_FONT }}>−</button>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", minWidth: 20, textAlign: "center" }}>{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)}
                      style={{ background: "#1c1e24", border: "1px solid #303338", color: "#d1d9e6", borderRadius: 6, width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, fontWeight: 700, fontFamily: SYS_FONT }}>+</button>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: item.color, minWidth: 60, textAlign: "right" }}>
                    ${(item.price * item.qty).toLocaleString()}
                  </div>
                  <button onClick={() => removeItem(item.id)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 2, display: "flex", alignItems: "center" }}>
                    <IconTrash />
                  </button>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div style={{ borderTop: "1px solid #1e2433", padding: "14px 18px", display: "flex", flexDirection: "column", gap: 9 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#8b9ab0" }}>
                <span>Sub Total</span>
                <span style={{ color: "#d1d9e6", fontWeight: 600 }}>${subtotal.toFixed(2)}</span>
              </div>

              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}><IconTag /></span>
                <input
                  style={{ background: "#1e2433", border: "1px solid #2a3347", borderRadius: 8, padding: "8px 12px 8px 30px", color: "#d1d9e6", fontSize: 13, width: "100%", outline: "none", fontFamily: SYS_FONT }}
                  placeholder="Discount amount ($)"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  type="number" min="0"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#8b9ab0" }}>
                <span>Discount</span>
                <span style={{ color: "#ef4444", fontWeight: 600 }}>−${discountAmt.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#8b9ab0" }}>
                <span>Tax 12%</span>
                <span style={{ color: "#d1d9e6" }}>${tax.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 17, fontWeight: 800, color: "#fff", borderTop: "1px solid #1e2433", paddingTop: 11, marginTop: 2 }}>
                <span>Total Payment</span>
                <span style={{ color: "#ff8040" }}>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 8, padding: "0 18px 18px" }}>
              <button disabled={cart.length === 0}
                style={{
                  flex: 2, border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, padding: "14px 0",
                  cursor: cart.length === 0 ? "not-allowed" : "pointer", fontFamily: SYS_FONT,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  background: cart.length === 0 ? "#1c1e24" : "linear-gradient(135deg, #ff8040 0%, #e05010 54%, #c03800 100%)",
                  color: cart.length === 0 ? "#4a5568" : "#fff",
                  transition: "opacity 0.15s",
                }}>
                <IconCreditCard color={cart.length === 0 ? "#4a5568" : "#fff"} /> Pay Now
              </button>
              <button disabled={cart.length === 0}
                style={{
                  flex: 1, background: "#1c1e24", border: "1px solid #303338", borderRadius: 10,
                  color: cart.length === 0 ? "#4a5568" : "#d1d9e6", fontWeight: 600, fontSize: 12, padding: "14px 0",
                  cursor: cart.length === 0 ? "not-allowed" : "pointer", fontFamily: SYS_FONT,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}>
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
