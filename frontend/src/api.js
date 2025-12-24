const BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

async function handle(res) {
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  searchProducts: ({ q, type }) => {
    const url = new URL(`${BASE}/inventory/search`);
    if (q) url.searchParams.set("q", q);
    if (type) url.searchParams.set("type", type);
    return fetch(url).then(handle);
  },

  updateProduct: (no, patch) =>
    fetch(`${BASE}/inventory/${no}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    }).then(handle),

  checkout: (payload) =>
    fetch(`${BASE}/cart/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(handle),

  inventorySummary: () =>
    fetch(`${BASE}/analytics/inventory-summary`).then(handle),

  salesSummary: () =>
    fetch(`${BASE}/analytics/sales-summary`).then(handle)
};
