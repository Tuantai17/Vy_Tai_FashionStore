import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000/api";
const VND = new Intl.NumberFormat("vi-VN");

// ===== 5 trạng thái (không đổi)
export const STEPS = [
  { key: "pending",   label: "Chờ xác nhận" },
  { key: "confirmed", label: "Đã xác nhận" },
  { key: "ready",     label: "Chờ vận chuyển" },
  { key: "shipping",  label: "Đang giao" },
  { key: "delivered", label: "Giao thành công" },
];

// ===== Chuẩn hoá status; thêm 'canceled' nhưng KHÔNG đổi UI
const normalizeStatusKey = (s) => {
  if (s == null) return "pending";
  const str = String(s).toLowerCase();

  const map = {
    "0": "pending",
    "1": "confirmed",
    "2": "canceled",
    "3": "shipping",
    "4": "delivered",

    pending: "pending",
    paid: "confirmed",
    confirmed: "confirmed",
    processing: "ready",
    ready: "ready",
    shipping: "shipping",
    shipped: "shipping",
    delivered: "delivered",
    completed: "delivered",
    done: "delivered",

    canceled: "canceled",
    cancelled: "canceled",
  };
  return map[str] || "pending";
};

const stepIndex = (key) => Math.max(0, STEPS.findIndex((s) => s.key === key));

const authHeaders = () => {
  const h = { Accept: "application/json", "Content-Type": "application/json" };
  const token = localStorage.getItem("token");
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

  // load list
  useEffect(() => {
    let ignore = false;

    (async () => {
      try {
        setLoading(true);
        setErr("");

        const url = `${API_BASE}/orders?per_page=100${
          search ? `&search=${encodeURIComponent(search)}` : ""
        }`;

        const res = await fetch(url, { headers: authHeaders() });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.data || [];

        if (ignore) return;

        setOrders(
          list.map((o) => ({
            ...o,
            statusKey: normalizeStatusKey(o.status_step ?? o.status_key ?? o.status),
          }))
        );
      } catch (e) {
        if (!ignore) setErr("Không tải được danh sách đơn hàng.");
        console.error(e);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [search]);

  // cập nhật step (khóa nếu canceled)
  const updateStatus = async (order, newKey) => {
    if (order.statusKey === "canceled") return;
    const oldKey = order.statusKey;
    if (oldKey === newKey) return;

    // optimistic
    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, statusKey: newKey } : o))
    );
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
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, statusKey: oldKey } : o))
      );
      alert(`Cập nhật trạng thái thất bại. Vui lòng thử lại.\n(last=${lastStatus} ${lastText || ""})`);
    }
  };

  const badgeStyle = (key) => {
    const i = stepIndex(key);
    const palette = [
      { bg: "#fff7ed", fg: "#9a3412", br: "#fed7aa" }, // pending
      { bg: "#eef2ff", fg: "#3730a3", br: "#c7d2fe" }, // confirmed
      { bg: "#f0f9ff", fg: "#075985", br: "#bae6fd" }, // ready
      { bg: "#ecfeff", fg: "#155e75", br: "#a5f3fc" }, // shipping
      { bg: "#ecfdf5", fg: "#065f46", br: "#a7f3d0" }, // delivered
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

  return (
    <section
      style={{
        padding: 20,
        background: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        borderRadius: 16,
        boxShadow: "0 8px 20px rgba(3,10,27,.25)",
      }}
    >
      {/* ===== HEADER ===== */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: "#fff",
            letterSpacing: 0.3,
            textShadow: "0 1px 2px rgba(0,0,0,.4)",
          }}
        >
          Quản lý đơn hàng
        </h1>
      </div>

      {/* ===== SEARCH ===== */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 14,
          alignItems: "center",
        }}
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo mã đơn / tên / email / sđt"
          style={{
            flex: 1,
            height: 38,
            padding: "0 12px",
            border: "1px solid rgba(255,255,255,.25)",
            borderRadius: 10,
            background: "rgba(255,255,255,0.2)",
            color: "#fff",
            backdropFilter: "blur(6px)",
            outline: "none",
          }}
        />
        {!!search && (
          <button
            onClick={() => setSearch("")}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(90deg,#64748b,#94a3b8)",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 600,
              boxShadow: "0 3px 8px rgba(100,116,139,.35)",
            }}
          >
            Xóa tìm
          </button>
        )}
      </div>

      {/* ===== STATE ===== */}
      {loading && <p style={{ color: "#ddd" }}>Đang tải dữ liệu…</p>}
      {err && <p style={{ color: "#ef4444", fontWeight: 600 }}>{err}</p>}

      {/* ===== TABLE ===== */}
      {!loading && !err && (
        <div
          style={{
            overflowX: "auto",
            borderRadius: 12,
            background: "rgba(255,255,255,0.92)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          }}
        >
          <table
            width="100%"
            cellPadding={10}
            style={{
              borderCollapse: "collapse",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <thead>
              <tr
                style={{
                  background:
                    "linear-gradient(90deg, rgba(255,255,255,1), rgba(248,250,252,0.95))",
                  color: "#1f2937",
                  fontWeight: 700,
                  borderBottom: "2px solid #e5e7eb",
                }}
              >
                <th>Order #</th>
                <th>Khách hàng</th>
                <th>Email</th>
                <th>SĐT</th>
                <th style={{ textAlign: "right" }}>Tổng tiền</th>
                <th style={{ minWidth: 360 }}>Trạng thái</th>
                <th style={{ textAlign: "center" }}>Chi tiết</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((o, i) => {
                const canceled = o.statusKey === "canceled";
                const idx = canceled ? -1 : stepIndex(o.statusKey);

                return (
                  <tr
                    key={o.id}
                    style={{
                      background:
                        i % 2 === 0
                          ? "rgba(255,255,255,0.98)"
                          : "rgba(248,250,252,0.95)",
                      borderTop: "1px solid #eee",
                      transition: "background .2s ease",
                      verticalAlign: "middle",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#f1f5f9")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background =
                        i % 2 === 0
                          ? "rgba(255,255,255,0.98)"
                          : "rgba(248,250,252,0.95)")
                    }
                  >
                    <td>{o.id}</td>
                    <td style={{ fontWeight: 600 }}>{o.name}</td>
                    <td style={{ color: "#475569" }}>{o.email}</td>
                    <td>{o.phone}</td>
                    <td align="right">₫{VND.format(Number(o.total ?? 0))}</td>

                    <td>
                      {/* thanh bước */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: `repeat(${STEPS.length}, 1fr)`,
                          gap: 6,
                        }}
                      >
                        {STEPS.map((s, ii) => {
                          const done = !canceled && ii <= idx;
                          return (
                            <div
                              key={s.key}
                              onClick={() =>
                                (!canceled && !savingId) &&
                                updateStatus(o, s.key)
                              }
                              title={canceled ? "Đã hủy" : s.label}
                              style={{
                                height: 8,
                                borderRadius: 999,
                                background: canceled
                                  ? "#e5e7eb"
                                  : done
                                  ? "#10b981"
                                  : "#e5e7eb",
                                cursor:
                                  canceled || savingId
                                    ? "not-allowed"
                                    : "pointer",
                                transition: "all .15s ease",
                              }}
                            />
                          );
                        })}
                      </div>

                      {/* nhãn trạng thái */}
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
                          {canceled
                            ? "Đã hủy"
                            : STEPS[idx]?.label || "Trạng thái"}
                          {savingId === o.id && !canceled && " • đang lưu..."}
                        </span>
                      </div>
                    </td>

                    <td align="center">
                      <button
                        onClick={() => navigate(`/admin/orders/${o.id}`)}
                        style={{
                          padding: "6px 14px",
                          background: "#16a34a",
                          color: "#fff",
                          border: 0,
                          borderRadius: 8,
                          cursor: "pointer",
                          fontWeight: 600,
                          transition: "transform .15s ease",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.transform = "scale(1.05)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.transform = "scale(1.0)")
                        }
                      >
                        Xem
                      </button>
                    </td>
                  </tr>
                );
              })}

              {orders.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    align="center"
                    style={{ padding: 20, color: "#6b7280" }}
                  >
                    Không có đơn hàng.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
