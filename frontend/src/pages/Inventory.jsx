import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function Inventory() {
  const [rows, setRows] = useState([]);

  async function load() {
    setRows(await api.searchProducts({}));
  }

  useEffect(() => {
    load();
  }, []);

  async function save(no, field, value) {
    await api.updateProduct(no, { [field]: value });
    load();
  }

  return (
    <div className="card">
      <div className="section-title">
        <h3>📦 Inventory Management</h3>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Name</th>
              <th>Piece / Cost</th>
              <th>Stock</th>
              <th>Cost</th>
              <th>Sell (Lower)</th>
              <th>Sell (Avg)</th>
              <th>Profit</th>
              <th>Description</th>
              <th>Remark</th>
              <th>Location</th>
              <th>Type</th>
            </tr>
          </thead>

          <tbody>
            {rows.map(r => (
              <tr key={r.No_}>
                <td>{r.No_}</td>
                <td>{r.name}</td>

                <td>{r.piece_per_cost}</td>

                {/* Editable Stock */}
                <td
                  style={{
                    color: r.number <= 3 ? "var(--danger)" : "inherit",
                    fontWeight: r.number <= 3 ? "600" : "400"
                  }}
                >
                  <input
                    type="number"
                    defaultValue={r.number}
                    onBlur={e =>
                      save(r.No_, "number", Number(e.target.value))
                    }
                    style={{ width: 80 }}
                  />
                </td>

                <td>{r.cost}</td>

                <td>{r.sell_price_lower}</td>

                {/* Editable Avg Price */}
                <td>
                  <input
                    type="number"
                    defaultValue={r.sell_price_avg}
                    onBlur={e =>
                      save(
                        r.No_,
                        "sell_price_avg",
                        Number(e.target.value)
                      )
                    }
                    style={{ width: 100 }}
                  />
                </td>

                <td>{r.profit}</td>

                <td>{r.description}</td>

                <td>{r.remark}</td>

                <td>{r.localtion}</td>

                <td>
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      background: "var(--card)"
                    }}
                  >
                    {r.type}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
