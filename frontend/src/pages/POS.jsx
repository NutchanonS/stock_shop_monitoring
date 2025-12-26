import { useState, useEffect, useRef } from "react";
import { api } from "../api.js";

export default function POS() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);

  // keyboard highlight index
  const [highlight, setHighlight] = useState(-1);

  const suggestRef = useRef(null);

  const [carts, setCarts] = useState({ "walkin-1": [] });
  const [activeCart, setActiveCart] = useState("walkin-1");
  const [newCartName, setNewCartName] = useState("");

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
      setHighlight(0); // default first row
    }, 160);

    return () => clearTimeout(t);
  }, [q]);

  /* ---------------- CLICK OUTSIDE TO CLOSE ---------------- */
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

  /* ---------------- MANUAL SEARCH BUTTON ---------------- */
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

  function updateQty(cartId, productNo, qty) {
    setCarts(prev => ({
      ...prev,
      [cartId]: prev[cartId].map(i =>
        i.product_no === productNo
          ? { ...i, qty: Math.min(Math.max(1, qty), i.stock) }
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
      items: items.map(({ product_no, qty, unit_price }) => ({
        product_no,
        qty,
        unit_price
      }))
    });

    setCarts(prev => ({ ...prev, [cartId]: [] }));
  }

  const activeItems = carts[activeCart] ?? [];
  const total = activeItems.reduce((s, i) => s + i.qty * i.unit_price, 0);

  /* ---------------- KEYBOARD HANDLING ---------------- */
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

      // Enter still performs full search
      search();
    }
  }

  /* ========================= UI ========================= */

  return (
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

          {/* ---------- AUTOCOMPLETE DROPDOWN ---------- */}
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
                      cursor: stock > 0 ? "pointer" : "not-allowed",
                      opacity: stock > 0 ? 1 : 0.5,
                      background: isActive
                        ? "rgba(59,130,246,0.15)"
                        : "transparent"
                    }}
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => {
                      if (stock <= 0) return;
                      addToCart(activeCart, p);
                      setShowSuggest(false);
                      setHighlight(-1);
                    }}
                  >
                    <b>{p.name}</b>

                    <div style={{ fontSize: 12, color: "var(--muted)" }}>
                      Stock: {stock} • In cart: {inCart}
                    </div>

                    <div style={{ fontSize: 12 }}>
                      Price: {p.sell_price_avg} • Type: {p.type}
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

              <button
                disabled={stock <= 0 || cartQty >= stock}
                onClick={() => addToCart(activeCart, p)}
              >
                {stock <= 0 ? "Out of stock" : "Add"}
              </button>
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

            <div>
              Qty:
              <input
                value={i.qty}
                onChange={e =>
                  updateQty(
                    activeCart,
                    i.product_no,
                    Number(e.target.value)
                  )
                }
                style={{ width: 60, marginLeft: 6 }}
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
  );
}
