import { useEffect, useState } from "react";
import { api } from "../api";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar
} from "recharts";

export default function Dashboard() {
  const [timePeriod, setTimePeriod] = useState("day");
  const [timeSeries, setTimeSeries] = useState([]);

  const [barPeriod, setBarPeriod] = useState("month");
  const [topProducts, setTopProducts] = useState([]);

  /* -------- Load time series -------- */
  useEffect(() => {
    api.get(`/analytics/timeseries?period=${timePeriod}`)
      .then(setTimeSeries);
  }, [timePeriod]);

  /* -------- Load top products -------- */
  useEffect(() => {
    api.get(`/analytics/top-products?period=${barPeriod}`)
      .then(setTopProducts);
  }, [barPeriod]);

  return (
    <div style={{ display: "grid", gap: 32 }}>
      {/* ================= TIME SERIES ================= */}
      <section>
        <h3>📈 Sales Time Series</h3>

        <select
          value={timePeriod}
          onChange={e => setTimePeriod(e.target.value)}
        >
          <option value="day">Daily</option>
          <option value="month">Monthly</option>
        </select>

        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={timeSeries}>
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line dataKey="revenue" stroke="#4CAF50" name="Revenue" />
            <Line dataKey="cost" stroke="#F44336" name="Cost" />
            <Line dataKey="profit" stroke="#2196F3" name="Profit" />
          </LineChart>
        </ResponsiveContainer>
      </section>

      {/* ================= TOP PRODUCTS ================= */}
      <section>
        <h3>📊 Top 5 Products</h3>

        <select
          value={barPeriod}
          onChange={e => setBarPeriod(e.target.value)}
        >
          <option value="week">Weekly</option>
          <option value="month">Monthly</option>
        </select>

        <div style={{ height: 320, overflowY: "auto" }}>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={topProducts}
              layout="vertical"
              margin={{ left: 120 }}
            >
              <XAxis type="number" />
              <YAxis
                type="category"
                dataKey="product_name"
                width={200}
              />
              <Tooltip />
              <Legend />
              <Bar dataKey="units" fill="#FF9800" name="Units Sold" />
              <Bar dataKey="revenue" fill="#3F51B5" name="Total Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
