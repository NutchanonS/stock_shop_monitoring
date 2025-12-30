import { useEffect, useState, useMemo, useRef } from "react";
import { api } from "../api.js";

const NUMBER_FIELDS = new Set([
  "number","cost","sell_price_lower","sell_price_avg",
  "profit","piece_per_cost"
]);

export default function Inventory() {

  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({});
  const [sort, setSort] = useState({ field:null, dir:null });

  const [openFilter, setOpenFilter] = useState(null);

  /* ---------- selection state ---------- */
  const [selected, setSelected] = useState(new Set());

  async function load() {
    setRows(await api.searchProducts({}));
    setSelected(new Set());   // clear selections on reload
  }

  useEffect(() => { load(); }, []);

  async function save(no, field, value) {
    await api.updateProduct(no, { [field]: value });
    load();
  }

  function toggleSelect(no) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(no) ? next.delete(no) : next.add(no);
      return next;
    });
  }

  async function deleteSelected() {
    if (!selected.size) return;

    if (!confirm(`Delete ${selected.size} product(s)?`)) return;

    // send JSON array body: [1,2,3,...]
    await api.deleteProducts(Array.from(selected));

    setSelected(new Set());
    load();
  }

  function clearFilter(field) {
    setFilters(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function clearAllFilters() {
    setFilters({});
  }

  function updateFilter(field, patch) {
    setFilters(prev => ({
      ...prev,
      [field]: { ...(prev[field] ?? {}), ...patch }
    }));
  }

  /* ================= FILTERED DATA ================= */

  const filteredRows = useMemo(() => {
    let data = [...rows];

    for (const [field,f] of Object.entries(filters)) {
      if (!f) continue;

      if (f.values?.size)
        data = data.filter(r => f.values.has(String(r[field])));

      if (f.textContains)
        data = data.filter(r =>
          String(r[field] ?? "")
            .toLowerCase()
            .includes(f.textContains.toLowerCase())
        );

      if (f.numOp && f.numValue !== "") {
        const v = Number(f.numValue);
        data = data.filter(r => {
          const x = Number(r[field] ?? 0);
          switch (f.numOp) {
            case ">": return x > v;
            case "<": return x < v;
            case ">=": return x >= v;
            case "<=": return x <= v;
            case "=": return x === v;
          }
        });
      }
    }

    if (sort.field) {
      data.sort((a,b) => {
        const A = a[sort.field];
        const B = b[sort.field];

        return NUMBER_FIELDS.has(sort.field)
          ? (sort.dir==="asc" ? A-B : B-A)
          : (sort.dir==="asc"
              ? String(A).localeCompare(String(B))
              : String(B).localeCompare(String(A)));
      });
    }

    return data;

  }, [rows, filters, sort]);

  /* ================= COLUMNS ================= */

  const columns = [
    { key:"No_", label:"No", readonly:true },
    { key:"name", label:"Name" },
    { key:"piece_per_cost", label:"Piece / Cost" },
    { key:"number", label:"Stock" },
    { key:"cost", label:"Cost" },
    { key:"sell_price_lower", label:"Sell (Lower)" },
    { key:"sell_price_avg", label:"Sell (Avg)" },
    { key:"profit", label:"Profit" },
    { key:"description", label:"Description" },
    { key:"remark", label:"Remark" },
    { key:"localtion", label:"Location" },
    { key:"type", label:"Type" }
  ];

  /* ================= FILTER PANEL ================= */

  function FilterPanel({ field, values, anchor }) {
    const col = columns.find(c => c.key === field);
    const fieldLabel = col?.label ?? field;
    const ref = useRef(null);
    const [pos, setPos] = useState({ left: anchor.x, top: anchor.y });

    const active = filters[field] ?? {};

    const [draft, setDraft] = useState({
      values: new Set(active.values ?? []),
      textContains: active.textContains ?? "",
      numOp: active.numOp ?? ">",
      numValue: active.numValue ?? ""
    });

    const uniqueValues = [...new Set(values.map(v => String(v ?? "")))];

    function applyFilter() {
      updateFilter(field, draft);
      setOpenFilter(null);
    }

    function handleEnter(e) {
      if (e.key === "Enter") applyFilter();
    }

    useEffect(() => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const pad = 8;

      let left = anchor.x;
      let top = anchor.y;

      if (rect.right > vw - pad) left = vw - rect.width - pad;
      if (rect.left < pad) left = pad;

      if (rect.bottom > vh - pad) top = vh - rect.height - pad;
      if (rect.top < pad) top = pad;

      setPos({ left, top });
    }, [anchor]);

    return (
      <div
        ref={ref}
        className="card"
        style={{
          position: "fixed",
          left: pos.left,
          top: pos.top,
          minWidth: 300,
          width: "max-content",
          maxWidth: 440,
          maxHeight: 480,
          zIndex: 90,
          display: "flex",
          flexDirection: "column",
          background: "var(--panel-bg, #0f172a)",
          border: "1px solid var(--border)",
          color: "var(--text-primary)",
          boxShadow: "0 20px 40px rgba(0,0,0,.45)",
          borderRadius: 10
        }}
      >
        <div
          style={{
            display:"flex",
            justifyContent:"space-between",
            alignItems:"center",
            padding:"10px 12px 8px 12px",
            borderBottom:"1px solid var(--border)"
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--accent)",
              paddingBottom: 2
            }}
          >
            {fieldLabel}
          </div>

          <div style={{ display:"flex", gap:8 }}>
            <button onClick={() => clearFilter(field)}>Clear</button>
            <button onClick={clearAllFilters}>Clear ALL</button>
          </div>
        </div>

        <div style={{
          padding:10,
          overflowY:"auto",
          flex:1,
          display:"grid",
          gap:12,
          minWidth: 100
        }}>

          <div>
            <div style={{ fontSize:12, opacity:.8 }}>Sort</div>

            <div style={{ display:"flex", gap:6, marginTop:4 }}>
              <button onClick={() => setSort({ field, dir:"asc" })}>↑ Asc</button>
              <button onClick={() => setSort({ field, dir:"desc" })}>↓ Desc</button>
            </div>
          </div>

          <div>
            <div style={{ fontSize:12, opacity:.8 }}>Filter by values</div>

            <div style={{ maxHeight:110, overflowY:"auto", marginTop:4 }}>
              {uniqueValues.map(v => (
                <label key={v} style={{ display:"flex", gap:6 }}>
                  <input
                    type="checkbox"
                    checked={draft.values.has(v)}
                    onChange={e => {
                      const set = new Set(draft.values);
                      e.target.checked ? set.add(v) : set.delete(v);
                      setDraft(d => ({ ...d, values:set }));
                    }}
                    style={{ width: 16, height: 16 }}
                  />
                  {v || "(empty)"}
                </label>
              ))}
            </div>
          </div>

          {!NUMBER_FIELDS.has(field) && (
            <div>
              <div style={{ fontSize:12, opacity:.8 }}>Text contains</div>
              <input
                value={draft.textContains}
                onChange={e =>
                  setDraft(d => ({ ...d, textContains:e.target.value }))
                }
                onKeyDown={handleEnter}
                style={{ width:"100%", boxSizing:"border-box" }}
              />
            </div>
          )}

          {NUMBER_FIELDS.has(field) && (
            <div>
              <div style={{ fontSize:12, opacity:.8 }}>Number condition</div>

              <div
                style={{
                  display:"grid",
                  gridTemplateColumns:"90px 1fr",
                  gap:6,
                  marginTop:4
                }}
              >
                <select
                  value={draft.numOp}
                  onChange={e => setDraft(d=>({ ...d, numOp:e.target.value }))}>
                  <option value=">">&gt;</option>
                  <option value="<">&lt;</option>
                  <option value=">=">&gt;=</option>
                  <option value="<=">&lt;=</option>
                  <option value="=">=</option>
                </select>

                <input
                  type="number"
                  value={draft.numValue}
                  onChange={e =>
                    setDraft(d => ({ ...d, numValue:e.target.value }))
                  }
                  onKeyDown={handleEnter}
                  style={{ width:"100%", boxSizing:"border-box" }}
                />
              </div>
            </div>
          )}

        </div>

        <div style={{
          padding:3,
          borderTop:"1px solid var(--border)",
          background:"var(--card-bg)",
          position:"sticky",
          bottom:0
        }}>
          <button style={{ width:"100%" }} onClick={applyFilter}>
            ✅ Apply Filter
          </button>
        </div>
      </div>
    );
  }

  /* ================= RENDER ================= */

  return (
    <div>

      <div
        style={{
          display:"flex",
          justifyContent:"space-between",
          marginBottom:8
        }}
      >
        <h3>📚 Inventory Management</h3>

        <button
          className="danger"
          disabled={!selected.size}
          onClick={deleteSelected}
        >
          🗑 Delete Selected ({selected.size})
        </button>
      </div>

      <table
        width="100%"
        cellPadding={6}
        style={{ width:"100%", tableLayout:"fixed" }}
      >
        <thead>
          <tr>

            {/* CHECKBOX COLUMN */}
            <th style={{ width:40, textAlign:"center" }}>
              <input
                type="checkbox"
                checked={
                  filteredRows.length > 0 &&
                  filteredRows.every(r => selected.has(r.No_))
                }
                onChange={e => {
                  if (e.target.checked)
                    setSelected(new Set(filteredRows.map(r => r.No_)));
                  else
                    setSelected(new Set());
                }}
                style={{ width: 18, height: 18 }}
              />
            </th>

            {columns.map(col => (
              <th
                key={col.key}
                style={{
                  position:"relative",
                  width:
                    col.key === "name"
                      ? "22%"
                      : col.key === "description"
                      ? "8%"
                      : "8%",
                  textAlign: col.key === "No" ? "center" : "left"
                }}
              >

                <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
                  <span>{col.label}</span>

                  <button
                    onClick={e => {
                      const r = e.currentTarget.getBoundingClientRect();
                      setOpenFilter({
                        field:col.key,
                        anchor:{ x:r.left, y:r.bottom }
                      });
                    }}
                  >
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 4h18l-7 9v5l-4 2v-7L3 4z"/>
                    </svg>
                  </button>
                </div>

                {openFilter?.field === col.key && (
                  <FilterPanel
                    field={col.key}
                    values={rows.map(r => r[col.key])}
                    anchor={openFilter.anchor}
                  />
                )}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {filteredRows.map(r => (
            <tr key={r.No_}>

              {/* ROW CHECKBOX */}
              <td style={{ textAlign:"center" }}>
                <input
                  type="checkbox"
                  checked={selected.has(r.No_)}
                  onChange={() => toggleSelect(r.No_)}
                  style={{ width: 18, height: 18 }}
                />
              </td>

              {columns.map(col => (
                <td key={col.key}>
                  {col.readonly ? r[col.key] : (
                    <input
                      defaultValue={r[col.key]}
                      style={{ width:"100%" }}
                      type={NUMBER_FIELDS.has(col.key) ? "number" : "text"}
                      onBlur={e =>
                        save(
                          r.No_,
                          col.key,
                          NUMBER_FIELDS.has(col.key)
                            ? Number(e.target.value)
                            : e.target.value
                        )
                      }
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
