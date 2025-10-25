import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminToken } from "../../../utils/authStorage";

const API_BASE = "http://127.0.0.1:8000/api";
const VND = new Intl.NumberFormat("vi-VN");

// ===== 5 ORDER STATUS STEPS =====
export const STEPS = [
  { key: "pending",   label: "Pending Confirmation" },
  { key: "confirmed", label: "Confirmed" },
  { key: "ready",     label: "Ready to Ship" },
  { key: "shipping",  label: "Shipping" },
  { key: "delivered", label: "Delivered" },
];

const normalizeStatusKey = (s) => {
  if (s == null) return "pending";
  const str = String(s).toLowerCase();
  const map = {
    "0": "pending","1":"confirmed","2":"canceled","3":"shipping","4":"delivered",
    pending:"pending", paid:"confirmed", confirmed:"confirmed",
    processing:"ready", ready:"ready",
    shipping:"shipping", shipped:"shipping",
    delivered:"delivered", completed:"delivered", done:"delivered",
    canceled:"canceled", cancelled:"canceled",
  };
  return map[str] || "pending";
};

const stepIndex = (key) => Math.max(0, STEPS.findIndex((s) => s.key === key));

const authHeaders = () => {
  const h = { Accept: "application/json", "Content-Type": "application/json" };
  const token = getAdminToken();
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
};

export default function Orders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState(null);

  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 10;

  // ===== FETCH ORDERS =====
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        setErr("");

        const url = `${API_BASE}/orders?per_page=${perPage}&page=${page}${
          search ? `&search=${encodeURIComponent(search)}` : ""
        }`;

        const res = await fetch(url, { headers: authHeaders() });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (ignore) return;

        let list, lp = 1, tt = 0;
        if (Array.isArray(data)) {
          list = data;
          lp = 1;
          tt = data.length;
        } else {
          list = data.data ?? [];
          lp = Number(data.last_page ?? 1);
          tt = Number(data.total ?? list.length);
        }

        setOrders(
          list.map((o) => ({
            ...o,
            statusKey: normalizeStatusKey(o.status_step ?? o.status_key ?? o.status),
          }))
        );
        setLastPage(lp);
        setTotal(tt);
      } catch (e) {
        if (!ignore) {
          setErr("Failed to load orders.");
          console.error(e);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [search, page]);

  useEffect(() => { setPage(1); }, [search]);

  // ===== UPDATE ORDER STATUS =====
  const updateStatus = async (order, newKey) => {
    if (order.statusKey === "canceled") return;
    const oldKey = order.statusKey;
    if (oldKey === newKey) return;

    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, statusKey: newKey } : o)));
    setSavingId(order.id);

    const idx = stepIndex(newKey);
    const payloadStepOnly = {
      status_step: newKey,
      status_key: newKey,
      workflow_status: newKey,
      step_code: idx,
      ...(newKey === "confirmed" && { confirmed_at: new Date().toISOString() }),
      ...(newKey === "ready"     && { ready_at: new Date().toISOString() }),
      ...(newKey === "shipping"  && { shipped_at: new Date().toISOString() }),
      ...(newKey === "delivered" && { delivered_at: new Date().toISOString() }),
    };

    const attempts = [
      { url: `${API_BASE}/orders/${order.id}/status`, method: "POST", body: payloadStepOnly },
      { url: `${API_BASE}/orders/update-status`,      method: "POST", body: { id: order.id, ...payloadStepOnly } },
      { url: `${API_BASE}/orders/${order.id}`,        method: "PATCH", body: payloadStepOnly },
      { url: `${API_BASE}/orders/${order.id}`,        method: "POST",  body: { _method: "PUT", ...payloadStepOnly } },
    ];

    let ok = false, lastStatus = 0, lastText = "";
    for (const a of attempts) {
      try {
        const res = await fetch(a.url, {
          method: a.method,
          headers: authHeaders(),
          body: JSON.stringify(a.body),
        });
        lastStatus = res.status;
        if (res.ok) { ok = true; break; }
        try { lastText = await res.text(); } catch {}
      } catch (e) { lastText = String(e); }
    }

    setSavingId(null);
    if (!ok) {
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, statusKey: oldKey } : o)));
      alert(`Failed to update order status.\n(last=${lastStatus} ${lastText || ""})`);
    }
  };

  // ===== STATUS BADGE COLORS =====
  const badgeStyle = (key) => {
    const i = stepIndex(key);
    const palette = [
      { bg: "#fff7ed", fg: "#9a3412", br: "#fed7aa" },
      { bg: "#eef2ff", fg: "#3730a3", br: "#c7d2fe" },
      { bg: "#f0f9ff", fg: "#075985", br: "#bae6fd" },
      { bg: "#ecfeff", fg: "#155e75", br: "#a5f3fc" },
      { bg: "#ecfdf5", fg: "#065f46", br: "#a7f3d0" },
    ][i] || { bg: "#f3f4f6", fg: "#374151", br: "#e5e7eb" };
    return {
      background: palette.bg,
      color: palette.fg,
      border: `1px solid ${palette.br}`,
      padding: "2px 8px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 700,
      display: "inline-block",
      whiteSpace: "nowrap",
    };
  };

  // ===== PAGINATION =====
  const gotoPage = (p) => {
    if (p < 1 || p > lastPage || p === page) return;
    setPage(p);
  };

  const pageNumbers = useMemo(() => {
    const maxButtons = 7;
    const pages = [];
    if (lastPage <= maxButtons) {
      for (let i = 1; i <= lastPage; i++) pages.push(i);
    } else {
      let start = Math.max(1, page - 3);
      let end = Math.min(lastPage, page + 3);
      if (page <= 4) { start = 1; end = 7; }
      else if (page >= lastPage - 3) { start = lastPage - 6; end = lastPage; }
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  }, [page, lastPage]);

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
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Order Management</h2>
      </div>

      {/* SEARCH BAR */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by order ID, name, email, or phone..."
          style={{
            flex: 1,
            padding: 8,
            borderRadius: 8,
            border: "1px solid #ccc",
            background: "rgba(255,255,255,0.1)",
            color: "#fff",
          }}
        />
        {!!search && (
          <button
            onClick={() => setSearch("")}
            style={{
              padding: "8px 12px",
              background: colors.primary,
              color: "#000",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* MAIN TABLE + PAGINATION */}
      <div
        style={{
          position: "relative",
          minHeight: "70vh",
          border: "1px solid #fff",
          borderRadius: 8,
          overflow: "hidden",
          paddingBottom: "60px",
          background: "rgba(255,255,255,0.05)",
        }}
      >
        {loading && <p style={{ padding: 12, color: "#ddd" }}>Loading data…</p>}
        {err && <p style={{ padding: 12, color: "#ffb4b4" }}>{err}</p>}

        {!loading && !err && (
          <>
            <table style={{ width: "100%", borderCollapse: "collapse", color: "#fff" }}>
              <thead style={{ background: "rgba(255,255,255,0.1)" }}>
                <tr>
                  <th style={{ padding: 8, textAlign: "left", borderBottom: "1px solid #fff" }}>Order #</th>
                  <th style={{ padding: 8, textAlign: "left", borderBottom: "1px solid #fff" }}>Customer</th>
                  <th style={{ padding: 8, textAlign: "left", borderBottom: "1px solid #fff" }}>Email</th>
                  <th style={{ padding: 8, textAlign: "left", borderBottom: "1px solid #fff" }}>Phone</th>
                  <th style={{ padding: 8, textAlign: "right", borderBottom: "1px solid #fff" }}>Total</th>
                  <th style={{ padding: 8, minWidth: 360, borderBottom: "1px solid #fff" }}>Status</th>
                  <th style={{ padding: 8, textAlign: "center", borderBottom: "1px solid #fff" }}>Detail</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((o) => {
                  const canceled = o.statusKey === "canceled";
                  const idx = canceled ? -1 : stepIndex(o.statusKey);
                  return (
                    <tr key={o.id} style={{ borderTop: "1px solid #fff" }}>
                      <td style={{ padding: 8 }}>{o.id}</td>
                      <td style={{ padding: 8, fontWeight: 700 }}>{o.name}</td>
                      <td style={{ padding: 8, color: "#ccc" }}>{o.email}</td>
                      <td style={{ padding: 8 }}>{o.phone}</td>
                      <td style={{ padding: 8, textAlign: "right" }}>
                        ₫{VND.format(Number(o.total_due ?? o.total ?? o.items_subtotal ?? 0))}
                      </td>

                      <td style={{ padding: 8 }}>
                        {/* Step bar */}
                        <div style={{ display: "grid", gridTemplateColumns: `repeat(${STEPS.length}, 1fr)`, gap: 6 }}>
                          {STEPS.map((s, ii) => {
                            const done = !canceled && ii <= idx;
                            return (
                              <div
                                key={s.key}
                                onClick={() => (!canceled && !savingId) && updateStatus(o, s.key)}
                                title={canceled ? "Canceled" : s.label}
                                style={{
                                  height: 8,
                                  borderRadius: 999,
                                  background: canceled ? "#e5e7eb" : (done ? "#10b981" : "#e5e7eb"),
                                  cursor: canceled || savingId ? "not-allowed" : "pointer",
                                  transition: "all .15s ease",
                                }}
                              />
                            );
                          })}
                        </div>

                        {/* Status Badge */}
                        <div style={{ marginTop: 6 }}>
                          <span
                            style={
                              canceled
                                ? {
                                    background: "#fef2f2",
                                    color: "#991b1b",
                                    border: "1px solid #fecaca",
                                    padding: "2px 8px",
                                    borderRadius: 999,
                                    fontSize: 12,
                                    fontWeight: 700,
                                  }
                                : badgeStyle(o.statusKey)
                            }
                          >
                            {canceled ? "Canceled" : (STEPS[idx]?.label || "Status")}
                            {savingId === o.id && !canceled && " • saving..."}
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: 8, textAlign: "center" }}>
                        <button
                          onClick={() => navigate(`/admin/orders/${o.id}`)}
                          style={{
                            background: colors.primary,
                            border: "none",
                            color: "#000",
                            padding: "6px 10px",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontWeight: 700,
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {orders.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: 16, textAlign: "center", color: "#ccc" }}>
                      No orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* PAGINATION */}
            {lastPage > 1 && (
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
                <button style={btnBase(page <= 1)} disabled={page <= 1} onClick={() => gotoPage(1)}>« First</button>
                <button style={btnBase(page <= 1)} disabled={page <= 1} onClick={() => gotoPage(page - 1)}>‹ Previous</button>

                {pageNumbers.map((n) => (
                  <button key={n} style={btnNumber(n === page)} onClick={() => gotoPage(n)}>{n}</button>
                ))}

                <button style={btnBase(page >= lastPage)} disabled={page >= lastPage} onClick={() => gotoPage(page + 1)}>Next ›</button>
                <button style={btnBase(page >= lastPage)} disabled={page >= lastPage} onClick={() => gotoPage(lastPage)}>Last »</button>

                <div style={{ color: "#fff", fontSize: 14 }}>
                  Page <b>{page}</b>/<b>{lastPage}</b> — Total: <b>{total}</b>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}



