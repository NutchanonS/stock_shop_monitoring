import { useEffect, useState, useMemo } from "react";
import { api } from "../api";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar,
  PieChart, Pie, Cell
} from "recharts";

const PIE_COLORS = ["#3b82f6","#22c55e","#f59e0b",
                    "#ec4899","#8b5cf6","#14b8a6"];

export default function Dashboard() {

  const [timePeriod, setTimePeriod] = useState("day");
  const [timeSeries, setTimeSeries] = useState([]);

  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [topProducts, setTopProducts] = useState([]);

  const [valueMetric, setValueMetric] = useState("revenue");

  /* ---------- Load time series ---------- */
  useEffect(() => {
    api.get(`/analytics/timeseries?period=${timePeriod}`)
      .then(setTimeSeries);
  }, [timePeriod]);

  const limitedTimeSeries = useMemo(
    () => (timeSeries?.length ? timeSeries.slice(-60) : []),
    [timeSeries]
  );

  /* ---------- Load month list ---------- */
  useEffect(() => {
    api.get("/analytics/timeseries?period=month")
      .then(monthData => {
        const m = monthData.map(r => r.period);
        setAvailableMonths(m);

        if (!selectedMonth && m.length) {
          setSelectedMonth(m[m.length - 1]);
        }
      });
  }, []);

  /* ---------- Load top products ---------- */
  useEffect(() => {
    if (!selectedMonth) return;

    api.get(`/analytics/top-products?period=month&month=${selectedMonth}`)
      .then(setTopProducts);

  }, [selectedMonth]);


  /* =====================================================
     AGGREGATE BY PRODUCT TYPE
     ===================================================== */
  const pieTypeData = useMemo(() => {

    const map = {};

    for (const row of topProducts) {

      const type =
        row.product_type ||
        row.type ||
        row.category ||
        "Unknown";

      if (!map[type]) {
        map[type] = {
          type,
          units: 0,
          revenue: 0,
          cost: 0,
          profit: 0
        };
      }

      map[type].units += Number(row.units ?? 0);
      map[type].revenue += Number(row.revenue ?? 0);
      map[type].cost += Number(row.cost_total ?? 0);
      map[type].profit +=
        row.profit ??
        ((row.revenue ?? 0) - (row.cost_total ?? 0));
    }

    return Object.values(map)
      .filter(r => r.units > 0 || r.revenue > 0 || r.cost > 0);

  }, [topProducts]);


  /* ---------- helpers ---------- */
  const formatNumber = v =>
    new Intl.NumberFormat("en-US").format(Math.round(v ?? 0));

  const sumField = (data, field) =>
    data.reduce((s,r)=> s + Number(r[field] ?? 0), 0);


  /* ---------- TOP-5 lists ---------- */
  const top5Units = [...pieTypeData]
    .sort((a,b)=> b.units - a.units)
    .slice(0,5)
    .map(d => d.type);

  const top5Metric = [...pieTypeData]
    .sort((a,b)=> (b[valueMetric] ?? 0) - (a[valueMetric] ?? 0))
    .slice(0,5)
    .map(d => d.type);


  /* =====================================================
     LABEL RENDERER (SMART + SAFE)
     - auto hide when many slices
     - prevent overflow
     - wraps long text
     - adds percentage
     ===================================================== */

  const wrapText = (name, maxLen = 10) => {
    if (name.length <= maxLen) return [name];
    const words = name.split(" ");
    const lines = [];
    let line = "";
    for (const w of words) {
      if ((line + " " + w).trim().length > maxLen) {
        lines.push(line.trim());
        line = w;
      } else {
        line += " " + w;
      }
    }
    if (line) lines.push(line.trim());
    return lines.slice(0, 2); // cap to 2 lines
  };

  const renderTop5Label = (props, field, topList) => {
    const { name, value, cx, cy, midAngle, outerRadius, percent, index } = props;

    // ---------- AUTO-HIDE rules ----------
    const tooManySlices = pieTypeData.length > 8;
    const sliceTooSmall = percent < 0.04; // < 4%
    const notTop = !topList.includes(name);

    if (tooManySlices && notTop) return null;
    if (sliceTooSmall && notTop) return null;

    // ---------- label position ----------
    const RAD = Math.PI / 180;
    const radius = outerRadius + 22;
    const x = cx + radius * Math.cos(-midAngle * RAD);
    const y = cy + radius * Math.sin(-midAngle * RAD);

    const lines = wrapText(name, 12);
    const pct = (percent * 100).toFixed(1);

    return (
      <text
        x={x}
        y={y}
        textAnchor="middle"
        style={{
          fill: "#e5e7eb",
          fontSize: 13,
          fontWeight: 600
        }}
      >
        {lines.map((ln, i)=>(
          <tspan
            key={i}
            x={x}
            dy={i === 0 ? 0 : "1.2em"}
          >{ln}</tspan>
        ))}
        <tspan
          x={x}
          dy="1.2em"
          style={{ fontSize: 12, fontWeight: 400 }}
        >
          {formatNumber(value)}  ({pct}%)
        </tspan>
      </text>
    );
  };


  return (
    <div style={{ display: "grid", gap: 24 }}>

      {/* ---------- SALES TREND ---------- */}
      <section className="card">
        <div className="section-title">
          <h3>📈 Sales Time Series</h3>

          <select value={timePeriod}
                  onChange={e=>setTimePeriod(e.target.value)}>
            <option value="day">Daily</option>
            <option value="month">Monthly</option>
          </select>
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={limitedTimeSeries}>
            <XAxis dataKey="period" angle={45} textAnchor="start" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line dataKey="revenue" stroke="#22c55e" name="Revenue" />
            <Line dataKey="cost" stroke="#ef4444" name="Cost" />
            <Line dataKey="profit" stroke="#3b82f6" name="Profit" />
          </LineChart>
        </ResponsiveContainer>
      </section>


      {/* ---------- TOP PRODUCTS ---------- */}
      <section className="card">

        <div className="section-title">
          <h3>📊 Top Products — {selectedMonth}</h3>

          <div style={{ display:"flex", gap:10 }}>
            <select value={selectedMonth}
                    onChange={e=>setSelectedMonth(e.target.value)}>
              {availableMonths.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            <select value={valueMetric}
                    onChange={e=>setValueMetric(e.target.value)}>
              <option value="revenue">Revenue</option>
              <option value="profit">Profit</option>
              <option value="cost">Cost</option>
            </select>
          </div>
        </div>


        <div
          style={{
            display: "grid",
            gridTemplateColumns: "340px 1fr",
            gap: 20,
            alignItems: "start"
          }}
        >

          {/* ---------- LEFT — PIE CHARTS ---------- */}
          <div style={{ display:"grid", gap:22 }}>

            {/* PIE 1 — UNITS */}
            <div>
              <h4>🛒 Units Sold — by Type</h4>

              <ResponsiveContainer
                width="100%"
                height={210}         // ⬆️ increased height
                style={{ overflow:"visible" }}
              >
                <PieChart>
                  <Pie
                    data={pieTypeData}
                    dataKey="units"
                    nameKey="type"
                    innerRadius={45}
                    outerRadius={70} // ⬆️ larger radius
                    label={p => renderTop5Label(p, "units", top5Units)}
                    labelLine={false}
                  >
                    {pieTypeData.map((e,i)=>(
                      <Cell key={i}
                        fill={PIE_COLORS[i % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* PIE 2 — SELECTED METRIC */}
            <div>
              <h4>
                💰 {valueMetric === "revenue" ? "Revenue"
                   : valueMetric === "profit" ? "Profit"
                   : "Cost"
                } — by Type
              </h4>

              <ResponsiveContainer
                width="100%"
                height={210}
                style={{ overflow:"visible" }}
              >
                <PieChart>
                  <Pie
                    data={pieTypeData}
                    dataKey={valueMetric}
                    nameKey="type"
                    innerRadius={45}
                    outerRadius={70}
                    label={p => renderTop5Label(p, valueMetric, top5Metric)}
                    labelLine={false}
                  >
                    {pieTypeData.map((e,i)=>(
                      <Cell key={i}
                        fill={PIE_COLORS[i % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

          </div>


          {/* ---------- RIGHT — BAR CHART ---------- */}
          <div
            style={{
              display:"grid",
              gap:8,
              alignSelf:"center"
            }}
          >

            <h4 style={{ textAlign:"center", marginBottom:4 }}>
              📦 Units Sold — by Product
            </h4>

            <ResponsiveContainer width="100%" height={380}>
              <BarChart
                data={topProducts}
                layout="vertical"
                margin={{ left: 170, right: 24, top: 4 }}
              >
                <XAxis type="number" xAxisId="revenueAxis" />
                <XAxis type="number" xAxisId="unitsAxis" orientation="top" />

                <YAxis
                  type="category"
                  dataKey="product_name"
                  width={300}
                  interval={0}
                />

                <Tooltip />
                <Legend />

                <Bar
                  dataKey="units"
                  xAxisId="unitsAxis"
                  fill="#f59e0b"
                  name="Units Sold"
                />

                <Bar
                  dataKey="revenue"
                  xAxisId="revenueAxis"
                  fill="#6366f1"
                  name="Revenue (฿)"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>

      </section>
    </div>
  );
}
