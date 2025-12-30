import { useState, useEffect } from "react";
import Tabs from "./components/Tabs.jsx";
import POS from "./pages/POS.jsx";
import Inventory from "./pages/Inventory.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import RegisterStock from "./pages/RegisterStock.jsx";
import BrokenReturn from "./pages/BrokenReturn.jsx";   // 👈 NEW

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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
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
          { id: "Register", label: "Register / Add Stock" },
          { id: "Broken", label: "Broken / Return to Source" }, // 👈 NEW TAB
          { id: "Dashboard", label: "Analytics Dashboard" }
        ]}
      />

      {/* ACTIVE PAGE */}
      <div style={{ marginTop: 20 }}>
        {tab === "POS" && <POS />}
        {tab === "Inventory" && <Inventory />}
        {tab === "Register" && <RegisterStock />}
        {tab === "Broken" && <BrokenReturn />}      {/* 👈 NEW RENDER */}
        {tab === "Dashboard" && <Dashboard />}
      </div>
    </div>
  );
}
