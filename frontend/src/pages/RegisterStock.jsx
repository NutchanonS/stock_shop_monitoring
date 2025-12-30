import { useState, useEffect, useRef } from "react";
import { api } from "../api.js";

export default function RegisterStock() {
  /* ====== REGISTER NEW PRODUCT FORM (TOP) ====== */
  const [form, setForm] = useState({
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

    await api.createProduct({ ...form, number: stock });

    alert("✅ Product registered");

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
  const [rows, setRows] = useState([]);

  // NEW — selected multiple products
  const [selected, setSelected] = useState([]);

  // NEW — detail modal
  const [detailProduct, setDetailProduct] = useState(null);

  const suggestRef = useRef(null);

  /* ---------- LIVE SEARCH ---------- */
  useEffect(() => {
    if (!q.trim()) {
      setRows([]);
      return;
    }

    const t = setTimeout(async () => {
      const res = await api.searchProducts({ q });
      setRows(res);
    }, 160);

    return () => clearTimeout(t);
  }, [q]);

  async function search() {
    const res = await api.searchProducts({ q });
    setRows(res);
  }

  function handleSearchKey(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      search();
    }
  }

  /* ---------- SELECT MULTIPLE PRODUCTS ---------- */

  function addProductToSelection(p) {
    setSelected(prev => {
      if (prev.find(x => x.No_ === p.No_)) return prev;
      return [...prev, { ...p, qty: 1 }];
    });
  }

  function removeSelected(no) {
    setSelected(prev => prev.filter(x => x.No_ !== no));
  }

  function changeQty(no, qty) {
    setSelected(prev =>
      prev.map(x =>
        x.No_ === no
          ? { ...x, qty: Math.max(0, qty || 0) }
          : x
      )
    );
  }


  async function addStockBatch() {
    if (!selected.length) return;

    for (const p of selected) {
      await api.addStock(p.No_, p.qty);
    }

    alert("✅ Stock updated");

    setSelected([]);
    await search();
  }

  /* ========================= UI ========================= */

  return (
    <>
      {/* ---------- PRODUCT DETAIL MODAL ---------- */}
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
          onClick={() => setDetailProduct(null)}
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
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <h3>📋 Product Detail</h3>
              <button className="danger" onClick={() => setDetailProduct(null)}>
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

      <div style={{ display: "grid", gap: 24 }}>
        {/* ================= REGISTER NEW PRODUCT ================= */}
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
              onChange={e =>
                updateForm(
                  "piece_per_cost",
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
            />

            <div>Initial Stock</div>
            <input
              type="number"
              value={form.number}
              onChange={e =>
                updateForm(
                  "number",
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
            />

            <div>Cost</div>
            <input
              type="number"
              value={form.cost}
              onChange={e =>
                updateForm(
                  "cost",
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
            />

            <div>Sell (Lower)</div>
            <input
              type="number"
              value={form.sell_price_lower}
              onChange={e =>
                updateForm(
                  "sell_price_lower",
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
            />

            <div>Sell (Avg)</div>
            <input
              type="number"
              value={form.sell_price_avg}
              onChange={e =>
                updateForm(
                  "sell_price_avg",
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
            />

            <div>Profit</div>
            <input type="number" value={form.profit} readOnly />

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

        {/* ================= SEARCH & ADD STOCK ================= */}
        <section className="card">
          <div className="section-title">
            <h3>📦 Search & Add Stock</h3>
          </div>

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

          {/* ---------- SELECTED PRODUCTS ---------- */}
          {selected.length > 0 && (
            <div
              className="card"
              style={{ marginTop: 12, background: "#020617" }}
            >
              <h4>📌 Selected Products</h4>

              {selected.map(p => (
                <div
                  key={p.No_}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "6px 0"
                  }}
                >
                  <div>
                    <b>{p.name}</b>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>
                      Stock: {p.number} • Type: {p.type}
                    </div>
                  </div>

                  <div>
                    Qty:
                      <input
                        type="number"
                        value={p.qty === 0 ? "" : p.qty}
                        onChange={e => {
                          const v = e.target.value;

                          // allow empty temporarily
                          if (v === "") {
                            changeQty(p.No_, 0);
                            return;
                          }

                          changeQty(p.No_, Number(v));
                        }}
                        style={{ width: 70, marginLeft: 6 }}
                      />

                    <button
                      className="danger"
                      onClick={() => removeSelected(p.No_)}
                    >
                      X
                    </button>
                  </div>
                </div>
              ))}

              <button
                style={{ marginTop: 8 }}
                onClick={addStockBatch}
              >
                ➕ Add Stock (Batch)
              </button>
            </div>
          )}

          {/* ---------- SEARCH RESULTS LIST ---------- */}
          {rows.length > 0 && (
            <div style={{ maxHeight: 260, overflowY: "auto", marginTop: 12 }}>
              {rows.map(p => (
                <div
                  key={p.No_}
                  style={{
                    padding: 10,
                    borderBottom: "1px solid var(--border)"
                  }}
                >
                  <b>{p.name}</b>

                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    Stock: {p.number} • Type: {p.type}
                  </div>

                  <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                    <button onClick={() => addProductToSelection(p)}>
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
      </div>
    </>
  );
}
