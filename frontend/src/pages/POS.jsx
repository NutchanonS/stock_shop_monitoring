import { useState } from "react";
import { api } from "../api.js";

export default function POS() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);

  const [carts, setCarts] = useState({
    "walkin-1": []
  });
  const [activeCart, setActiveCart] = useState("walkin-1");
  const [newCartName, setNewCartName] = useState("");

  /* ---------------- SEARCH ---------------- */
  async function search() {
    setRows(await api.searchProducts({ q }));
  }

  /* ---------------- CART OPS ---------------- */
  function addToCart(cartId, product) {
    const stock = Number(product.number);
    if (stock <= 0) {
      alert(`❌ "${product.name}" is out of stock`);
      return;
    }

    setCarts(prev => {
      const cur = prev[cartId] ?? [];
      const found = cur.find(i => i.product_no === product.No_);

      const price = Number(
        product.sell_price_avg ?? product.sell_price_lower ?? 0
      );

      if (found && found.qty + 1 > stock) {
        alert(`⚠️ Cannot add more than stock (${stock})`);
        return prev;
      }

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
              stock // keep snapshot
            }
          ];

      return { ...prev, [cartId]: next };
    });
  }


  function removeItem(cartId, productNo) {
    setCarts(prev => ({
      ...prev,
      [cartId]: prev[cartId].filter(i => i.product_no !== productNo)
    }));
  }

  function updateQty(cartId, productNo, qty) {
    setCarts(prev => {
      const cur = prev[cartId] ?? [];

      const next = cur.map(i => {
        if (i.product_no !== productNo) return i;

        const safeQty = Math.min(
          Math.max(1, Number(qty || 1)),
          Number(i.stock ?? i.qty)
        );

        return { ...i, qty: safeQty };
      });

      return { ...prev, [cartId]: next };
    });
  }


  function addNewCart() {
    if (!newCartName || carts[newCartName]) return;
    setCarts(prev => ({ ...prev, [newCartName]: [] }));
    setActiveCart(newCartName);
    setNewCartName("");
  }

  function removeCart(cartId) {
    if (Object.keys(carts).length === 1) return;
    setCarts(prev => {
      const next = { ...prev };
      delete next[cartId];
      return next;
    });
    if (activeCart === cartId) {
      setActiveCart(Object.keys(carts).find(k => k !== cartId));
    }
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

    alert(`Checkout success: ${cartId}`);
    setCarts(prev => ({ ...prev, [cartId]: [] }));
  }

  const activeItems = carts[activeCart] ?? [];
  const total = activeItems.reduce(
    (s, i) => s + i.qty * i.unit_price,
    0
  );

  /* ---------------- UI ---------------- */
  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
      {/* ================= SEARCH ================= */}
      <div>
        <h3>🔍 Search Product</h3>

        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="search name..."
            style={{ flex: 1 }}
          />
          <button onClick={search}>Search</button>
        </div>

        <div style={{ marginBottom: 10 }}>
          <b>Add to cart:</b>{" "}
          <select
            value={activeCart}
            onChange={e => setActiveCart(e.target.value)}
          >
            {Object.keys(carts).map(cid => (
              <option key={cid} value={cid}>
                {cid}
              </option>
            ))}
          </select>
        </div>

        {rows.map(p => {
          const stock = Number(p.number);

          const cartItem = carts[activeCart]?.find(
            i => i.product_no === p.No_
          );
          const cartQty = cartItem?.qty ?? 0;

          const outOfStock = stock <= 0;
          const maxReached = cartQty >= stock;

          return (
            <div
              key={p.No_}
              style={{
                border: "1px solid #eee",
                borderRadius: 8,
                padding: 8,
                marginBottom: 6
              }}
            >
              <b>{p.name}</b>
              <div style={{ fontSize: 12, color: "#666" }}>
                Stock: {stock} | In cart: {cartQty}
              </div>

              Price: {p.sell_price_avg}
              <br />

              <button
                disabled={outOfStock || maxReached}
                onClick={() => addToCart(activeCart, p)}
                style={{
                  opacity: outOfStock || maxReached ? 0.4 : 1,
                  cursor: outOfStock || maxReached ? "not-allowed" : "pointer"
                }}
              >
                {outOfStock
                  ? "❌ Out of stock"
                  : maxReached
                  ? "⚠️ Max stock reached"
                  : `➕ Add to ${activeCart}`}
              </button>
            </div>
          );
        })}

      </div>

      {/* ================= CART ================= */}
      <div>
        <h3>🛒 Cart</h3>

        {/* Cart switcher */}
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          <select
            value={activeCart}
            onChange={e => setActiveCart(e.target.value)}
            style={{ flex: 1 }}
          >
            {Object.keys(carts).map(cid => (
              <option key={cid} value={cid}>
                {cid}
              </option>
            ))}
          </select>
          <button onClick={() => removeCart(activeCart)}>🗑</button>
        </div>

        {/* Add new cart */}
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          <input
            value={newCartName}
            onChange={e => setNewCartName(e.target.value)}
            placeholder="new cart id"
            style={{ flex: 1 }}
          />
          <button onClick={addNewCart}>➕ New</button>
        </div>

        {/* Cart items */}
        {activeItems.map(i => (
          <div key={i.product_no} style={{ marginBottom: 6 }}>
            <b>{i.name}</b>
            <br />
            Qty:
            <input
              value={i.qty}
              onChange={e =>
                updateQty(activeCart, i.product_no, e.target.value)
              }
              style={{ width: 60, marginLeft: 6 }}
            />
            <button onClick={() => removeItem(activeCart, i.product_no)}>
              ❌
            </button>
          </div>
        ))}

        <hr />
        <b>Total: {total}</b>
        <br />
        <button onClick={() => checkout(activeCart)}>
          ✅ Checkout {activeCart}
        </button>
      </div>
    </div>
  );
}
