import { useState, useEffect, useRef } from "react";
import { api } from "../api.js";

function loadSavedBrokenCart() {
  try {
    return JSON.parse(localStorage.getItem("broken_cart")) ?? [];
  } catch {
    return [];
  }
}

export default function BrokenReturn() {

  /* ================= SEARCH ================= */

  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);

  const [highlight, setHighlight] = useState(-1);
  const suggestRef = useRef(null);

  const [detailProduct, setDetailProduct] = useState(null);

  /* ================= BROKEN CART ================= */

  const [cart, setCart] = useState(() => loadSavedBrokenCart());

  useEffect(() => {
    localStorage.setItem("broken_cart", JSON.stringify(cart));
  }, [cart]);

  function addToBrokenCart(product) {
    const stock = Number(product.number);
    if (stock <= 0) return;

    setCart(prev => {
      const found = prev.find(i => i.product_no === product.No_);

      if (found) {
        return prev.map(i =>
          i.product_no === product.No_
            ? { ...i, qty: i.qty + 1 }
            : i
        );
      }

      return [
        ...prev,
        {
          product_no: product.No_,
          name: product.name,
          qty: 1,
          stock,
          piece_per_cost: product.piece_per_cost,
          cost: product.cost,
          sell_price_lower: product.sell_price_lower,
          sell_price_avg: product.sell_price_avg,
          profit: product.profit,
          description: product.description,
          remark: product.remark,
          localtion: product.localtion,
          type: product.type
        }
      ];
    });
  }

    function updateQty(productNo, qty) {
    setCart(prev =>
        prev.map(i =>
        i.product_no === productNo
            ? { ...i, qty: Math.max(0, qty || 0) }
            : i
        )
    );
    }


  function removeFromCart(productNo) {
    setCart(prev => prev.filter(i => i.product_no !== productNo));
  }

  /* ================= RETURN (DECREASE STOCK) ================= */

  async function returnBroken() {
    if (!cart.length) return;

    for (const item of cart) {
      await api.returnBrokenStock(item.product_no, item.qty);
    }

    alert("✔ Broken stock returned");
    setCart([]);
    loadResults();
  }

  /* ================= SEARCH ================= */

  async function loadResults() {
    if (!q.trim()) {
      setRows([]);
      setSuggestions([]);
      return;
    }

    const res = await api.searchProducts({ q });
    setRows(res);
    setSuggestions(res.slice(0, 10));
  }

  useEffect(() => {
    const t = setTimeout(loadResults, 160);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    function clickOutside(e) {
      if (suggestRef.current && !suggestRef.current.contains(e.target)) {
        setShowSuggest(false);
        setHighlight(-1);
      }
    }
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

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

    if (e.key === "Enter") {
      e.preventDefault();
      if (highlight >= 0) addToBrokenCart(suggestions[highlight]);
      setShowSuggest(false);
    }
  }

  /* ================= UI ================= */

  return (
    <div style={{ display:"grid", gap:24 }}>

      {/* SEARCH AREA */}
      <section className="card" ref={suggestRef}>
        <div className="section-title">
          <h3>🧰 Broken / Return to Source</h3>
        </div>

        <div style={{ display:"flex", gap:10 }}>
          <input
            value={q}
            onChange={e=>setQ(e.target.value)}
            onFocus={() => suggestions.length && setShowSuggest(true)}
            onKeyDown={handleKey}
            placeholder="Search product..."
            style={{ flex:1 }}
          />
          <button onClick={loadResults}>Search</button>
        </div>

        {showSuggest && suggestions.length > 0 && (
          <div className="card"
            style={{ maxHeight:260, overflowY:"auto", marginTop:8 }}>
            {suggestions.map((p,i) => {
              const stock = Number(p.number);
              const isActive = i === highlight;

              return (
                <div
                  key={p.No_}
                  style={{
                    padding:10,
                    background: isActive ? "#1e293b" : "transparent",
                    opacity: stock > 0 ? 1 : 0.6
                  }}
                  onMouseEnter={() => setHighlight(i)}
                >
                  <b>{p.name}</b>

                  <div style={{ fontSize:12 }}>
                    Stock: {p.number} • Type: {p.type}
                  </div>

                  <div style={{ marginTop:6, display:"flex", gap:6 }}>
                    <button
                      disabled={stock <= 0}
                      onClick={() => addToBrokenCart(p)}
                    >
                      Add
                    </button>

                    <button onClick={() => setDetailProduct(p)}>
                      Detail
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* FULL MATCH LIST */}
        {rows.length > 0 && (
          <div style={{ marginTop:10, maxHeight:260, overflowY:"auto" }}>
            {rows.map(p => (
              <div
                key={p.No_}
                style={{ padding:10, borderBottom:"1px solid var(--border)" }}
              >
                <b>{p.name}</b>

                <div style={{ fontSize:12 }}>
                  Stock: {p.number} • Type: {p.type}
                </div>

                <div style={{ marginTop:6, display:"flex", gap:6 }}>
                  <button onClick={() => addToBrokenCart(p)}>
                    Add
                  </button>

                  <button onClick={() => setDetailProduct(p)}>
                    Detail
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ================= PRODUCT DETAIL MODAL ================= */}

      {detailProduct && (
        <section className="card">
          <h4>📌 Product Detail</h4>

          <b>{detailProduct.name}</b>

          <div>Piece / Cost: {detailProduct.piece_per_cost}</div>
          <div>Stock: {detailProduct.number}</div>
          <div>Cost: {detailProduct.cost}</div>
          <div>Sell (Lower): {detailProduct.sell_price_lower}</div>
          <div>Sell (Avg): {detailProduct.sell_price_avg}</div>
          <div>Profit: {detailProduct.profit}</div>
          <div>Description: {detailProduct.description}</div>
          <div>Remark: {detailProduct.remark}</div>
          <div>Location: {detailProduct.localtion}</div>
          <div>Type: {detailProduct.type}</div>

          <button style={{ marginTop:8 }} onClick={() => setDetailProduct(null)}>
            Close
          </button>
        </section>
      )}

      {/* ================= BROKEN CART TABLE ================= */}

      <section className="card">
        <div className="section-title">
          <h3>🛒 Broken Cart</h3>
        </div>

        {cart.length === 0 && <i>No broken items added</i>}

        {cart.length > 0 && (
          <>
            <table width="100%">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Qty</th>
                  <th>Stock</th>
                  <th>Type</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {cart.map(i => (
                  <tr key={i.product_no}>
                    <td>{i.name}</td>

                    <td>
                        <input
                        type="number"
                        value={i.qty === 0 ? "" : i.qty}
                        onChange={e => {
                            const v = e.target.value;

                            // allow blank temporarily
                            if (v === "") {
                            updateQty(i.product_no, 0);
                            return;
                            }

                            updateQty(i.product_no, Number(v));
                        }}
                        style={{ width: 70 }}
                        />

                    </td>

                    <td>{i.stock}</td>
                    <td>{i.type}</td>

                    <td>
                      <button
                        className="danger"
                        onClick={() => removeFromCart(i.product_no)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button
              style={{ marginTop:10, width:"100%" }}
              className="danger"
              onClick={returnBroken}
            >
              🔻 Return (Decrease Inventory Stock)
            </button>
          </>
        )}
      </section>
    </div>
  );
}
