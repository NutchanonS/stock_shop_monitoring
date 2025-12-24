import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function Inventory() {
  const [rows, setRows] = useState([]);

  async function load() {
    setRows(await api.searchProducts({}));
  }

  useEffect(() => { load(); }, []);

  async function save(no, field, value) {
    await api.updateProduct(no, { [field]: value });
    load();
  }

  return (
    <div>
      <h3>Inventory</h3>
      <table width="100%" cellPadding="8">
        <thead>
          <tr>
            <th>No</th>
            <th>Name</th>
            <th>Stock</th>
            <th>Price(avg)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.No_}>
              <td>{r.No_}</td>
              <td>{r.name}</td>
              <td>
                <input
                  type="number"
                  defaultValue={r.number}
                  onBlur={e => save(r.No_, "number", Number(e.target.value))}
                  style={{ width: 80 }}
                />
              </td>
              <td>
                <input
                  type="number"
                  defaultValue={r.sell_price_avg}
                  onBlur={e => save(r.No_, "sell_price_avg", Number(e.target.value))}
                  style={{ width: 100 }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
