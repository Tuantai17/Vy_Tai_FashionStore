// src/pages/Admin/Inventory.jsx
import { useEffect, useMemo, useState } from "react";

const API = "http://127.0.0.1:8000/api";
const APP_BASE = "http://127.0.0.1:8000";
const PLACEHOLDER = "https://placehold.co/80x60?text=No+Img";

// safe image URL builder
const resolveImg = (p) => {
  const raw = p.thumbnail_url || p.image_url || p.thumbnail || p.product_image || "";
  if (!raw) return PLACEHOLDER;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${APP_BASE}/storage/${String(raw).replace(/^\/+/, "")}`;
};

export default function Inventory() {
  const [list, setList] = useState([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const [moves, setMoves] = useState([]);
  const [moveFor, setMoveFor] = useState(null);
  const token = localStorage.getItem("token") || "";

  const fetchList = async (p = 1, keyword = "") => {
    const res = await fetch(
      `${API}/admin/inventory?per_page=20&page=${p}&q=${encodeURIComponent(keyword)}`,
      {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      }
    );
    const data = await res.json();
    setList(data.data || []);
    setMeta(data);
  };

  const openMoves = async (pid) => {
    setMoveFor(pid);
    const res = await fetch(`${API}/admin/inventory/${pid}/moves?per_page=50`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setMoves(data.data || []);
  };

  const adjust = async (p) => {
    const change = parseInt(
      prompt(`Enter adjustment quantity for "${p.name}" (positive: inbound, negative: deduct):`),
      10
    );
    if (Number.isNaN(change) || change === 0) return;

    const note = prompt("Note (optional):") || "";

    try {
      const res = await fetch(`${API}/admin/inventory/adjust`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ product_id: p.id, change, note }),
      });

      let data = null;
      try { data = await res.clone().json(); } catch (_) {}

      if (!res.ok) {
        console.error("Adjust error:", { status: res.status, data });
        const msg =
          data?.driver_msg ||
          data?.message ||
          data?.errors?.change?.[0] ||
          data?.errors?.product_id?.[0] ||
          `HTTP ${res.status}`;
        alert(msg);
        return;
      }

      alert(data?.message || "Inventory updated!");
      await fetchList(page, q);
      if (moveFor === p.id) openMoves(p.id);
    } catch (err) {
      alert(err.message || "Could not update.");
    }
  };

  // live search (debounced)
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      fetchList(1, q);
    }, 400);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => {
    fetchList(page, q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // ===== PAGINATION =====
  const gotoPage = (p) => {
    const last = Number(meta?.last_page || 1);
    if (p < 1 || p > last || p === page) return;
    setPage(p);
  };

  const pageNumbers = useMemo(() => {
    const last = Number(meta?.last_page || 1);
    const current = Number(meta?.current_page || page);
    const maxButtons = 7;
    const pages = [];
    if (last <= maxButtons) {
      for (let i = 1; i <= last; i++) pages.push(i);
    } else {
      let start = Math.max(1, current - 3);
      let end = Math.min(last, current + 3);
      if (current <= 4) {
        start = 1;
        end = 7;
      } else if (current >= last - 3) {
        start = last - 6;
        end = last;
      }
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  }, [meta, page]);

  const colors = {
    text: "#ffffff",
    border: "#ffffff",
    bg: "rgba(255,255,255,0.1)",
    bgDisabled: "rgba(255,255,255,0.2)",
    primary: "#00bcd4",
  };

  const btnBase = (disabled) => ({
    padding: "6px 10px",
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    background: disabled ? colors.bgDisabled : colors.bg,
    color: colors.text,
    cursor: disabled ? "not-allowed" : "pointer",
  });

  const btnNumber = (active) => ({
    padding: "6px 10px",
    borderRadius: 8,
    border: `1px solid ${active ? colors.primary : colors.border}`,
    background: active ? colors.primary : colors.bg,
    color: active ? "#000" : colors.text,
    fontWeight: active ? 800 : 600,
    textDecoration: active ? "underline" : "none",
    cursor: "pointer",
  });

  return (
    <div
      style={{
        maxWidth: 1400,
        width: "min(96vw, 1400px)",
        margin: "24px auto",
        padding: 20,
        color: "#fff",
      }}
    >
      <h2 style={{ marginBottom: 12 }}>Inventory Management</h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name / slug / ID (auto filter)"
          style={{
            flex: 1,
            padding: 8,
            borderRadius: 8,
            border: "1px solid #ccc",
            background: "rgba(255,255,255,0.1)",
            color: "#fff",
          }}
        />
      </div>

      {/* TABLE + FIXED PAGINATION */}
      <div
        style={{
          position: "relative",
          minHeight: "70vh",
          border: "1px solid #fff",
          borderRadius: 8,
          overflow: "hidden",
          paddingBottom: "60px",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            color: "#fff",
          }}
        >
          <thead style={{ background: "rgba(255,255,255,0.1)" }}>
            <tr>
              <th style={{ padding: 8, textAlign: "left", borderBottom: "1px solid #fff" }}>ID</th>
              <th style={{ padding: 8, textAlign: "left", borderBottom: "1px solid #fff" }}>Product</th>
              <th style={{ padding: 8, borderBottom: "1px solid #fff" }}>Stock</th>
              <th style={{ padding: 8, borderBottom: "1px solid #fff" }}>Price</th>
              <th style={{ padding: 8, borderBottom: "1px solid #fff" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} style={{ borderTop: "1px solid #fff" }}>
                <td style={{ padding: 8 }}>{p.id}</td>
                <td style={{ padding: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <img
                      src={resolveImg(p)}
                      alt={p.name}
                      style={{
                        width: 60,
                        height: 40,
                        objectFit: "cover",
                        borderRadius: 6,
                        boxShadow: "0 0 4px rgba(255,255,255,.4)",
                      }}
                      onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
                    />
                    <div>
                      <div style={{ fontWeight: 700 }}>{p.name}</div>
                      <div style={{ color: "#ccc", fontSize: 12 }}>{p.slug}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: 8, textAlign: "center", fontWeight: 700 }}>{p.qty}</td>
                <td style={{ padding: 8, textAlign: "right" }}>
                  {Number(p.price_sale || 0).toLocaleString("vi-VN")} đ
                </td>
                <td style={{ padding: 8, textAlign: "center" }}>
                  <button
                    onClick={() => adjust(p)}
                    style={{
                      marginRight: 8,
                      background: "#00bcd4",
                      border: "none",
                      color: "#000",
                      padding: "6px 10px",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    Adjust
                  </button>
                  <button
                    onClick={() => openMoves(p.id)}
                    style={{
                      background: "transparent",
                      border: "1px solid #fff",
                      color: "#fff",
                      padding: "6px 10px",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    History
                  </button>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan="5" style={{ padding: 16, textAlign: "center", color: "#ccc" }}>
                  No data
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* FIXED PAGINATION (bottom-right) */}
        {meta?.last_page > 1 && (
          <div
            style={{
              position: "absolute",
              bottom: 10,
              right: 10,
              display: "flex",
              gap: 8,
              alignItems: "center",
              background: "rgba(0,0,0,0.6)",
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid #fff",
            }}
          >
            <button
              style={btnBase((meta?.current_page || page) <= 1)}
              disabled={(meta?.current_page || page) <= 1}
              onClick={() => gotoPage(1)}
            >
              « First
            </button>
            <button
              style={btnBase((meta?.current_page || page) <= 1)}
              disabled={(meta?.current_page || page) <= 1}
              onClick={() => gotoPage((meta?.current_page || page) - 1)}
            >
              ‹ Previous
            </button>

            {pageNumbers.map((n) => (
              <button
                key={n}
                style={btnNumber(n === (meta?.current_page || page))}
                onClick={() => gotoPage(n)}
              >
                {n}
              </button>
            ))}

            <button
              style={btnBase((meta?.current_page || page) >= (meta?.last_page || 1))}
              disabled={(meta?.current_page || page) >= (meta?.last_page || 1)}
              onClick={() => gotoPage((meta?.current_page || page) + 1)}
            >
              Next ›
            </button>
            <button
              style={btnBase((meta?.current_page || page) >= (meta?.last_page || 1))}
              disabled={(meta?.current_page || page) >= (meta?.last_page || 1)}
              onClick={() => gotoPage(meta?.last_page || 1)}
            >
              Last »
            </button>

            <div style={{ color: "#fff", fontSize: 14 }}>
              Page <b>{meta?.current_page || page}</b>/<b>{meta?.last_page}</b> — Total:{" "}
              <b>{meta?.total ?? list.length}</b>
            </div>
          </div>
        )}
      </div>

      {/* INVENTORY HISTORY */}
      {moveFor && (
        <div style={{ marginTop: 30 }}>
          <h3 style={{ color: "#00bcd4" }}>🕓 Inventory History (Product #{moveFor})</h3>
          <div
            style={{
              border: "1px dashed #fff",
              borderRadius: 8,
              padding: 8,
              marginTop: 10,
              background: "rgba(255,255,255,0.05)",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", color: "#fff" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #fff" }}>
                  <th style={{ padding: 6 }}>Time</th>
                  <th style={{ padding: 6 }}>Change</th>
                  <th style={{ padding: 6 }}>Before → After</th>
                  <th style={{ padding: 6 }}>Type</th>
                  <th style={{ padding: 6 }}>Note</th>
                  <th style={{ padding: 6 }}>Operator</th>
                </tr>
              </thead>
              <tbody>
                {moves.map((m) => (
                  <tr key={m.id} style={{ borderTop: "1px solid #fff" }}>
                    <td style={{ padding: 6 }}>{new Date(m.created_at).toLocaleString("en-US")}</td>
                    <td
                      style={{
                        padding: 6,
                        fontWeight: 700,
                        color: m.change >= 0 ? "#16a34a" : "#dc2626",
                      }}
                    >
                      {m.change >= 0 ? `+${m.change}` : m.change}
                    </td>
                    <td style={{ padding: 6 }}>
                      {m.qty_before} → {m.qty_after}
                    </td>
                    <td style={{ padding: 6 }}>{m.type || "—"}</td>
                    <td style={{ padding: 6 }}>{m.note || "—"}</td>
                    <td style={{ padding: 6 }}>{m.user?.name || "—"}</td>
                  </tr>
                ))}
                {moves.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ padding: 8, textAlign: "center", color: "#ccc" }}>
                      No history yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
