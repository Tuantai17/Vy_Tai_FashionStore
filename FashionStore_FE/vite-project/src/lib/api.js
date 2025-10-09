// src/lib/api.js
export const API_BASE =
  import.meta.env.VITE_API_URL || "https://fashionstore-be.onrender.com/api";

function join(path) {
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function apiGet(path, opts = {}) {
  const res = await fetch(join(path), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
    ...opts,
  });
  if (!res.ok) throw new Error(`API ${res.status} ${res.statusText}`);
  return res.json();
}
