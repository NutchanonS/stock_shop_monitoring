export default function Tabs({ value, onChange, tabs }) {
  return (
    <div className="tabs-bar">
      {tabs.map(t => (
        <button
          key={t.id}
          className={`tab-btn ${value === t.id ? "active" : ""}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
