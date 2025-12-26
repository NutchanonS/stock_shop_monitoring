import { useState, useEffect, useRef } from "react";
import { api } from "../api.js";

export default function RegisterStock() {
  /* ====== REGISTER NEW PRODUCT FORM (TOP) ====== */
  const [form, setForm] = useState({
    name: "",
    piece_per_cost: 0,     // ← default 0
    number: 0,             // ← default 0
    cost: 0,               // ← default 0
    sell_price_lower: 0,   // ← default 0
    sell_price_avg: 0,     // ← default 0
    profit: 0,             // ← default 0
    description: "",
    remark: "",
    localtion: "",
    type: ""
  });

  function updateForm(k, v) {
    setForm(prev => {
      const next = { ...prev, [k]: v };

      const cost = Number(next.cost || 0);
      const avg = Number(next.sell_price_avg || 0);
      const lower = Number(next.sell_price_lower || 0);
      const basePrice = avg > 0 ? avg : lower;

      next.profit = basePrice - cost;

      return next;
    });
  }

  async function submitNewProduct() {
    const stock = Number(form.number || 0);

    if (!form.name || stock <= 0) {
      alert("Product name & initial stock are required");
      return;
    }

    await api.createProduct({
      ...form,
      number: stock
    });

    alert("✅ Product registered");

    // reset to blank-ready state (numeric fields back to 0)
    setForm({
      name: "",
      piece_per_cost: 0,
      number: 0,
      cost: 0,
      sell_price_lower: 0,
      sell_price_avg: 0,
      profit: 0,
      description: "",
      remark: "",
      localtion: "",
      type: ""
    });
  }

  /* ====== SEARCH & ADD STOCK (BOTTOM) ====== */

  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [rows, setRows] = useState([]);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [addQty, setAddQty] = useState(1);

  const suggestRef = useRef(null);

  /* ---------- LIVE SEARCH + LIST ALL MATCHES ---------- */
  useEffect(() => {
    if (!q.trim()) {
      setSuggestions([]);
      setRows([]);
      setShowSuggest(false);
      return;
    }

    const t = setTimeout(async () => {
      const res = await api.searchProducts({ q });

      setSuggestions(res.slice(0, 12)); // dropdown
      setShowSuggest(true);

      setRows(res); // full match list
    }, 160);

    return () => clearTimeout(t);
  }, [q]);

  /* ---------- CLOSE SUGGEST WHEN CLICK OUTSIDE ---------- */
  useEffect(() => {
    function handleClick(e) {
      if (suggestRef.current && !suggestRef.current.contains(e.target)) {
        setShowSuggest(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* ---------- MANUAL SEARCH ---------- */
  async function search() {
    const res = await api.searchProducts({ q });
    setRows(res);
    setShowSuggest(false);
  }

  /* ---------- CLICK SUGGEST = JUST SELECT PRODUCT ---------- */
  function chooseProduct(p) {
    setSelectedProduct(p);
    setAddQty(1);
    setShowSuggest(false);
  }

  async function addStock() {
    if (!selectedProduct) return;
    if (addQty <= 0) return;

    console.log(
      "============================",
      `/inventory/${selectedProduct.No_}/add-stock?qty=${addQty}`
    );

    await api.addStock(selectedProduct.No_, addQty);
    alert("✅ Stock updated");

    setSelectedProduct(null);
    setAddQty(1);
    search();
  }

  function handleSearchKey(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      search();
    }
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {/* ================= TOP: REGISTER NEW PRODUCT ================= */}
      <section className="card">
        <div className="section-title">
          <h3>🆕 Register New Product</h3>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "160px 1fr",
            rowGap: 10,
            columnGap: 12,
            alignItems: "center"
          }}
        >
          <div>Name</div>
          <input
            value={form.name}
            onChange={e => updateForm("name", e.target.value)}
          />

          <div>Type</div>
          <input
            value={form.type}
            onChange={e => updateForm("type", e.target.value)}
          />

          <div>Piece / Cost</div>
          <input
            type="number"
            value={form.piece_per_cost}
            onChange={e => {
              const v = e.target.value;
              // allow blank input
              if (v === "") {
                updateForm("piece_per_cost", "");
                return;
              }
              updateForm("piece_per_cost", Number(v));
            }}
          />

          <div>Initial Stock</div>
          <input
            type="number"
            value={form.number}
            onChange={e => {
              const v = e.target.value;

              // allow blank input
              if (v === "") {
                updateForm("number", "");
                return;
              }

              // enforce numeric type
              updateForm("number", Number(v));
            }}
          />

          <div>Cost</div>
          <input
            type="number"
            value={form.cost}
            onChange={e => {
              const v = e.target.value;
              if (v === "") {
                updateForm("cost", "");
                return;
              }
              updateForm("cost", Number(v));
            }}
          />

          <div>Sell (Lower)</div>
          <input
            type="number"
            value={form.sell_price_lower}
            onChange={e => {
              const v = e.target.value;
              if (v === "") {
                updateForm("sell_price_lower", "");
                return;
              }
              updateForm("sell_price_lower", Number(v));
            }}
          />

          <div>Sell (Avg)</div>
          <input
            type="number"
            value={form.sell_price_avg}
            onChange={e => {
              const v = e.target.value;
              if (v === "") {
                updateForm("sell_price_avg", "");
                return;
              }
              updateForm("sell_price_avg", Number(v));
            }}
          />

          <div>Profit</div>
          <input
            type="number"
            value={form.profit}
            readOnly
          />

          <div>Location</div>
          <input
            value={form.localtion}
            onChange={e => updateForm("localtion", e.target.value)}
          />

          <div>Remark</div>
          <input
            value={form.remark}
            onChange={e => updateForm("remark", e.target.value)}
          />

          <div>Description</div>
          <textarea
            value={form.description}
            onChange={e => updateForm("description", e.target.value)}
            rows={3}
          />
        </div>

        <button
          style={{ marginTop: 12, alignSelf: "flex-start" }}
          onClick={submitNewProduct}
        >
          ✅ Register Product
        </button>
      </section>

      {/* ================= BOTTOM: SEARCH & ADD STOCK ================= */}
      <section className="card" ref={suggestRef}>
        <div className="section-title">
          <h3>📦 Search & Add Stock</h3>
        </div>

        <div style={{ position: "relative", marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={handleSearchKey}
              placeholder="Search existing product..."
              style={{ flex: 1 }}
            />
            <button onClick={search}>Search</button>
          </div>

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
              {suggestions.map(p => (
                <div
                  key={p.No_}
                  style={{
                    padding: 10,
                    borderBottom: "1px solid var(--border)",
                    cursor: "pointer"
                  }}
                  onClick={() => chooseProduct(p)}
                >
                  <b>{p.name}</b>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    Stock: {p.number} • Type: {p.type}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedProduct && (
          <div
            className="card"
            style={{ marginBottom: 12, background: "#020617" }}
          >
            <h4>📌 Selected Product</h4>
            <b>{selectedProduct.name}</b>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              Current stock: {selectedProduct.number} • Type: {selectedProduct.type}
            </div>

            <div style={{ marginTop: 8 }}>
              Add quantity:
              <input
                type="number"
                value={addQty}
                onChange={e => {
                  const v = e.target.value;
                  setAddQty(v === "" ? "" : Number(v));
                }}
                style={{ width: 80, marginLeft: 8 }}
              />
            </div>

            <button style={{ marginTop: 8 }} onClick={addStock}>
              ➕ Add Stock
            </button>
          </div>
        )}

        {rows.length > 0 && (
          <div style={{ maxHeight: 260, overflowY: "auto", marginTop: 8 }}>
            {rows.map(p => (
              <div
                key={p.No_}
                style={{
                  padding: 10,
                  borderBottom: "1px solid var(--border)",
                  cursor: "pointer"
                }}
                onClick={() => chooseProduct(p)}
              >
                <b>{p.name}</b>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                  No: {p.No_} • Stock: {p.number} • Type: {p.type}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
