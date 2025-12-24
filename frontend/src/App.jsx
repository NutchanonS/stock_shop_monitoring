import { useState } from "react";
import Tabs from "./components/Tabs.jsx";
import POS from "./pages/POS.jsx";
import Inventory from "./pages/Inventory.jsx";
import Dashboard from "./pages/Dashboard.jsx";

export default function App() {
  const [tab, setTab] = useState("POS");

  return (
    <div style={{ fontFamily: "system-ui", padding: 20, maxWidth: 1280, margin: "0 auto" }}>
      <h2>📦 Stock Shop – Owner Panel</h2>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "POS", label: "POS / Shopping Cart" },
          { id: "Inventory", label: "Inventory Management" },
          { id: "Dashboard", label: "Analytics Dashboard" }
        ]}
      />

      <div style={{ marginTop: 20 }}>
        {tab === "POS" && <POS />}
        {tab === "Inventory" && <Inventory />}
        {tab === "Dashboard" && <Dashboard />}
      </div>
    </div>
  );
}
