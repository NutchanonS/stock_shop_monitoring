import { useState, useEffect, useRef } from "react";
import { api } from "../api.js";

function loadSavedCarts() {
  try {
    const saved = JSON.parse(localStorage.getItem("pos_carts"));
    return saved && typeof saved === "object"
      ? saved
      : { "walkin-1": [] };
  } catch {
    return { "walkin-1": [] };
  }
}

function loadActiveCart(carts) {
  const saved = localStorage.getItem("pos_active_cart");
  return saved && carts[saved] ? saved : Object.keys(carts)[0];
}

export default function POS() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);

  const [highlight, setHighlight] = useState(-1);
  const suggestRef = useRef(null);

  const [carts, setCarts] = useState(() => loadSavedCarts());
  const [activeCart, setActiveCart] = useState(() =>
    loadActiveCart(loadSavedCarts())
  );

  useEffect(() => {
    localStorage.setItem("pos_carts", JSON.stringify(carts));
  }, [carts]);

  useEffect(() => {
    localStorage.setItem("pos_active_cart", activeCart);
  }, [activeCart]);

  const [newCartName, setNewCartName] = useState("");

  /* ---------- NEW: product detail modal ---------- */
  const [detailProduct, setDetailProduct] = useState(null);

  const openDetail = (p) => setDetailProduct(p);
  const closeDetail = () => setDetailProduct(null);

  /* ---------------- AUTOCOMPLETE SEARCH ---------------- */
  useEffect(() => {
    if (!q.trim()) {
      setSuggestions([]);
      setShowSuggest(false);
      setHighlight(-1);
      return;
    }

    const t = setTimeout(async () => {
      const res = await api.searchProducts({ q });
      setSuggestions(res.slice(0, 10));
      setShowSuggest(true);
      setHighlight(0);
    }, 160);

    return () => clearTimeout(t);
  }, [q]);

  /* ---------------- CLICK OUTSIDE ---------------- */
  useEffect(() => {
    function handleClickOutside(e) {
      if (suggestRef.current && !suggestRef.current.contains(e.target)) {
        setShowSuggest(false);
        setHighlight(-1);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ---------------- MANUAL SEARCH ---------------- */
  async function search() {
    const res = await api.searchProducts({ q });
    setRows(res);
    setShowSuggest(false);
    setHighlight(-1);
  }

  /* ---------------- CART OPS ---------------- */
  function addToCart(cartId, product) {
    const stock = Number(product.number);
    if (stock <= 0) return;

    setCarts(prev => {
      const cur = prev[cartId] ?? [];
      const found = cur.find(i => i.product_no === product.No_);
      const price = Number(product.sell_price_avg ?? 0);

      if (found && found.qty + 1 > stock) return prev;

      const next = found
        ? cur.map(i =>
            i.product_no === product.No_
              ? { ...i, qty: i.qty + 1 }
              : i
          )
        : [
            ...cur,
            {
              product_no: product.No_,
              name: product.name,
              qty: 1,
              unit_price: price,
              stock
            }
          ];

      return { ...prev, [cartId]: next };
    });
  }
  function updatePrice(cartId, productNo, price) {
    setCarts(prev => ({
      ...prev,
      [cartId]: prev[cartId].map(i =>
        i.product_no === productNo
          ? {
              ...i,
              unit_price: price === "" ? "" : Math.max(0, Number(price))
            }
          : i
      )
    }));
  }


  function updateQty(cartId, productNo, qty) {
    setCarts(prev => ({
      ...prev,
      [cartId]: prev[cartId].map(i =>
        i.product_no === productNo
          ? { ...i, qty: qty === "" ? "" : Math.min(Math.max(0, Number(qty)), i.stock) }
          : i
      )
    }));
  }

  function removeItem(cartId, productNo) {
    setCarts(prev => ({
      ...prev,
      [cartId]: prev[cartId].filter(i => i.product_no !== productNo)
    }));
  }

  function addNewCart() {
    if (!newCartName || carts[newCartName]) return;
    setCarts(prev => ({ ...prev, [newCartName]: [] }));
    setActiveCart(newCartName);
    setNewCartName("");
  }

  function removeCart(cartId) {
    if (Object.keys(carts).length === 1) return;
    const next = { ...carts };
    delete next[cartId];
    setCarts(next);
    setActiveCart(Object.keys(next)[0]);
  }

  async function checkout(cartId) {
    const items = carts[cartId];
    if (!items.length) return;

    await api.checkout({
      customer_id: cartId,
      items: items.map(i => ({
        product_no: i.product_no,
        qty: Number(i.qty || 0),
        unit_price: Number(i.unit_price || 0)
      }))

    });

    setCarts(prev => ({ ...prev, [cartId]: [] }));

    await search();
  }

  const activeItems = carts[activeCart] ?? [];
  // const total = activeItems.reduce((s, i) => s + i.qty * i.unit_price, 0);
  const total = activeItems.reduce((s, i) =>
    s +
    (Number(i.qty || 0) * Number(i.unit_price || 0))
  , 0);


  /* ---------------- KEYBOARD ---------------- */
  function handleKey(e) {
    if (!showSuggest || !suggestions.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight(h => (h + 1) % suggestions.length);
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight(h => (h - 1 + suggestions.length) % suggestions.length);
    }

    if (e.key === "Escape") {
      setShowSuggest(false);
      setHighlight(-1);
    }

    if (e.key === "Enter") {
      e.preventDefault();

      if (highlight >= 0 && suggestions[highlight]) {
        const p = suggestions[highlight];
        const stock = Number(p.number);
        if (stock > 0) addToCart(activeCart, p);
      }

      setShowSuggest(false);
      setHighlight(-1);
      search();
    }
  }

  /* ========================= UI ========================= */

  return (
    <>
      {/* ---------- DETAIL MODAL ---------- */}
      {detailProduct && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100
          }}
          onClick={closeDetail}
        >
          <div
            className="card"
            style={{
              width: "520px",
              maxHeight: "80vh",
              overflowY: "auto",
              padding: 16
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <h3>📋 Product Detail</h3>
              <button className="danger" onClick={closeDetail}>
                ✕
              </button>
            </div>

            <b style={{ fontSize: 18 }}>{detailProduct.name}</b>

            <div style={{ marginTop: 10 }}>
              <div>Piece / Cost: {detailProduct.piece_per_cost}</div>
              <div>Stock: {detailProduct.number}</div>
              <div>Cost: {detailProduct.cost}</div>
              <div>Sell (Lower): {detailProduct.sell_price_lower}</div>
              <div>Sell (Avg): {detailProduct.sell_price_avg}</div>
              <div>Profit: {detailProduct.profit}</div>
              <div>Type: {detailProduct.type}</div>
              <div>Location: {detailProduct.localtion}</div>
              <div>Remark: {detailProduct.remark}</div>
              <div>Description:</div>
              <div
                style={{
                  whiteSpace: "pre-wrap",
                  padding: 6,
                  background: "#020617",
                  borderRadius: 6,
                  marginTop: 4
                }}
              >
                {detailProduct.description}
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
        {/* SEARCH */}
        <div className="card">
          <div className="section-title">
            <h3>🔍 Product Search</h3>
          </div>

          <div style={{ position: "relative" }} ref={suggestRef}>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                onKeyDown={handleKey}
                onFocus={() => suggestions.length && setShowSuggest(true)}
                placeholder="Search name / type..."
                style={{ flex: 1 }}
              />
              <button onClick={search}>Search</button>
            </div>

            {/* ---------- AUTOCOMPLETE ---------- */}
            {showSuggest && suggestions.length > 0 && (
              <div
                className="card"
                style={{
                  position: "absolute",
                  top: 44,
                  left: 0,
                  right: 0,
                  maxHeight: 260,
                  overflowY: "auto",
                  zIndex: 30
                }}
              >
                {suggestions.map((p, i) => {
                  const stock = Number(p.number);
                  const inCart =
                    carts[activeCart]?.find(x => x.product_no === p.No_)
                      ?.qty ?? 0;

                  const isActive = i === highlight;

                  return (
                    <div
                      key={p.No_}
                      style={{
                        padding: 10,
                        borderBottom: "1px solid var(--border)",
                        background: isActive
                          ? "rgba(59,130,246,0.15)"
                          : "transparent"
                      }}
                      onMouseEnter={() => setHighlight(i)}
                    >
                      <b>{p.name}</b>

                      <div style={{ fontSize: 12, color: "var(--muted)" }}>
                        Stock: {stock} • In cart: {inCart}
                      </div>

                      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                        <button
                          disabled={stock <= 0}
                          onClick={() => addToCart(activeCart, p)}
                        >
                          Add
                        </button>

                        <button onClick={() => openDetail(p)}>
                          Detail
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ---------- SEARCH RESULTS ---------- */}
          {rows.map(p => {
            const stock = Number(p.number);
            const cartQty =
              carts[activeCart]?.find(i => i.product_no === p.No_)?.qty ?? 0;

            return (
              <div
                key={p.No_}
                style={{ padding: 12, borderBottom: "1px solid var(--border)" }}
              >
                <b>{p.name}</b>

                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                  Stock: {stock} • In cart: {cartQty}
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  <button
                    disabled={stock <= 0 || cartQty >= stock}
                    onClick={() => addToCart(activeCart, p)}
                  >
                    {stock <= 0 ? "Out of stock" : "Add"}
                  </button>

                  <button onClick={() => openDetail(p)}>
                    Detail
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* CART */}
        <div className="card">
          <div className="section-title">
            <h3>🛒 Cart</h3>
          </div>

          <select
            value={activeCart}
            onChange={e => setActiveCart(e.target.value)}
          >
            {Object.keys(carts).map(cid => (
              <option key={cid}>{cid}</option>
            ))}
          </select>

          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <input
              value={newCartName}
              onChange={e => setNewCartName(e.target.value)}
              placeholder="New cart ID"
            />
            <button onClick={addNewCart}>Add</button>
            <button className="danger" onClick={() => removeCart(activeCart)}>
              Delete
            </button>
          </div>

          {activeItems.map(i => (
            <div key={i.product_no} style={{ marginTop: 10 }}>
              <b>{i.name}</b>

                <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                  Qty:
                  <input
                    type="number"
                    value={i.qty}
                    onChange={e =>
                      updateQty(activeCart, i.product_no, e.target.value)
                    }
                    style={{ width: 60, marginLeft: 6 }}
                  />


                  Sold Price:
                  <input
                    type="number"
                    value={i.unit_price}
                    onChange={e =>
                      updatePrice(activeCart, i.product_no, e.target.value)
                    }
                    style={{ width: 80 }}
                  />


                  <button
                    className="danger"
                    onClick={() => removeItem(activeCart, i.product_no)}
                  >
                    X
                  </button>
                </div>

            </div>
          ))}

          <hr />
          <b>Total: {total}</b>

          <button
            onClick={() => checkout(activeCart)}
            style={{ width: "100%", marginTop: 8 }}
          >
            Checkout
          </button>
        </div>
      </div>
    </>
  );
}
