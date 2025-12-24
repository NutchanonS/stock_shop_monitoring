export default function Tabs({ tabs, value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 10, borderBottom: "1px solid #ddd", paddingBottom: 10 }}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            padding: "8px 14px",
            borderRadius: 10,
            border: value === t.id ? "2px solid #000" : "1px solid #ccc",
            background: value === t.id ? "#f5f5f5" : "#fff",
            cursor: "pointer"
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
