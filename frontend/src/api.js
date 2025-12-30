const BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

async function handle(res) {
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  get: (path) =>
    fetch(`${BASE}${path}`).then(handle),

  deleteProducts: (ids) =>
    fetch(`${BASE}/inventory/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ids)
    }).then(handle),


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

  async createProduct(body) {
    const res = await fetch(`${BASE}/inventory`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    return handle(res);
  },

  async addStock(productNo, qty) {
    const res = await fetch(
      `${BASE}/inventory/${productNo}/add-stock?qty=${qty}`,
      { method: "POST" }
    );
    return handle(res);
  },
  returnBrokenStock: (productNo, qty) =>
    fetch(`${BASE}/inventory/${productNo}/return-broken?qty=${qty}`, {
      method: "POST"
    }).then(handle),

};
