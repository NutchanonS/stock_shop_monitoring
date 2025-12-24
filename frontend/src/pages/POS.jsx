import { useState } from "react";
import { api } from "../api.js";

export default function POS() {
  const [customer, setCustomer] = useState("walkin-1");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);
  const [cart, setCart] = useState({});

  async function search() {
    setRows(await api.searchProducts({ q }));
  }

  function add(p) {
    setCart(c => ({
      ...c,
      [p.No_]: c[p.No_] ? { ...c[p.No_], qty: c[p.No_].qty + 1 } :
        { product_no: p.No_, qty: 1, unit_price: p.sell_price_avg, name: p.name }
    }));
  }

  async function checkout() {
    await api.checkout({
      customer_id: customer,
      items: Object.values(cart)
    });
    alert("Checkout success");
    setCart({});
  }

  const total = Object.values(cart).reduce((s, i) => s + i.qty * i.unit_price, 0);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
      <div>
        <h3>Search Product</h3>
        <input value={q} onChange={e => setQ(e.target.value)} />
        <button onClick={search}>Search</button>

        {rows.map(p => (
          <div key={p.No_}>
            {p.name} ({p.number}) – {p.sell_price_avg}
            <button onClick={() => add(p)}>Add</button>
          </div>
        ))}
      </div>

      <div>
        <h3>Cart – {customer}</h3>
        <input value={customer} onChange={e => setCustomer(e.target.value)} />

        {Object.values(cart).map(i => (
          <div key={i.product_no}>
            {i.name} x {i.qty}
          </div>
        ))}

        <b>Total: {total}</b>
        <br />
        <button onClick={checkout}>Finish</button>
      </div>
    </div>
  );
}
