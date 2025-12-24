import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function Dashboard() {
  const [inv, setInv] = useState({});
  const [sales, setSales] = useState({});

  useEffect(() => {
    api.inventorySummary().then(setInv);
    api.salesSummary().then(setSales);
  }, []);

  return (
    <div>
      <h3>Dashboard</h3>

      <p>Total SKUs: {inv.total_skus}</p>
      <p>Total Units: {inv.total_units}</p>
      <p>Stock Value: {inv.total_cost_value}</p>

      <h4>Daily Sales</h4>
      {sales.daily?.map(d => (
        <div key={d.date}>{d.date}: {d.amount}</div>
      ))}
    </div>
  );
}
