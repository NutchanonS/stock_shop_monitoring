import { useState, useEffect } from "react";
import Tabs from "./components/Tabs.jsx";
import POS from "./pages/POS.jsx";
import Inventory from "./pages/Inventory.jsx";
import Dashboard from "./pages/Dashboard.jsx";

export default function App() {
  const [tab, setTab] = useState("POS");

  /* -------- THEME STATE + PERSIST -------- */
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "light"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: 24 }}>
      {/* HEADER ROW */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>📦 Stock Management System</h2>

        <button
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          style={{ minWidth: 130 }}
        >
          {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
        </button>
      </div>

      {/* TABS */}
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "POS", label: "POS / Shopping Cart" },
          { id: "Inventory", label: "Inventory Management" },
          { id: "Dashboard", label: "Analytics Dashboard" }
        ]}
      />

      {/* ACTIVE PAGE */}
      <div style={{ marginTop: 24 }}>
        {tab === "POS" && <POS />}
        {tab === "Inventory" && <Inventory />}
        {tab === "Dashboard" && <Dashboard />}
      </div>
    </div>
  );
}
