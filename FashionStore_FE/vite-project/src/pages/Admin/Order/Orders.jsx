// src/pages/Admin/Order/Orders.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000/api";
const VND = new Intl.NumberFormat("vi-VN");

// ===== 5 trạng thái theo yêu cầu
export const STEPS = [
  { key: "pending",   label: "Chờ xác nhận" },
  { key: "confirmed", label: "Đã xác nhận" },
  { key: "ready",     label: "Chờ vận chuyển" },
  { key: "shipping",  label: "Đang giao" },
  { key: "delivered", label: "Giao thành công" },
];

// ===== chuẩn hoá status bất kể API trả gì
const normalizeStatusKey = (s) => {
  if (s == null) return "pending";
  const str = String(s).toLowerCase();

  // map số và chuỗi sang 5 key trên
  const map = {
    "0": "pending",
    "1": "confirmed",
    "2": "ready",
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
  };
  return map[str] || "pending";
};

const stepIndex = (key) => Math.max(0, STEPS.findIndex((s) => s.key === key));

// ===== headers kèm token (nếu có)
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
  const [savingId, setSavingId] = useState(null); // id đang update

  // ===== load list
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

        // gắn statusKey đã chuẩn hoá cho từng order
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

  // ===== cập nhật trạng thái (đa dạng endpoint để khớp backend)
  // ===== cập nhật trạng thái: CHỈ ghi cột step, không chạm cột status
const updateStatus = async (order, newKey) => {
  const oldKey = order.statusKey;
  if (oldKey === newKey) return;

  // Optimistic UI
  setOrders((prev) =>
    prev.map((o) => (o.id === order.id ? { ...o, statusKey: newKey } : o))
  );
  setSavingId(order.id);

  const idx = stepIndex(newKey);
  const payloadStepOnly = {
    // gửi nhiều tên field phổ biến – backend nhận tên nào có thì dùng tên đó
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
    // endpoint chuyên update status (nếu bạn có)
    { url: `${API_BASE}/orders/${order.id}/status`, method: "POST", body: payloadStepOnly },
    

    // endpoint chung update-status
    { url: `${API_BASE}/orders/update-status`,      method: "POST", body: { id: order.id, ...payloadStepOnly } },

    // fallback: sửa qua /orders/:id nhưng chỉ gửi cột step
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
    // revert nếu thất bại
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
    <section>
      <h1 style={{ fontSize: 24, marginBottom: 12 }}>Orders</h1>

      <div style={{ margin: "8px 0 12px", display: "flex", gap: 8 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo mã đơn / tên / email / sđt"
          style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #ccc", minWidth: 260 }}
        />
        <button
          onClick={() => setSearch("")}
          style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #ccc", background: "#fff" }}
        >
          Xóa tìm
        </button>
      </div>

      {loading && <p>Đang tải...</p>}
      {err && <p style={{ color: "#d32f2f" }}>{err}</p>}

      {!loading && !err && (
        <table width="100%" cellPadding={8} style={{ borderCollapse: "collapse", background: "#fff" }}>
          <thead>
            <tr style={{ background: "#fafafa" }}>
              <th align="left">Order #</th>
              <th align="left">Khách hàng</th>
              <th align="left">Email</th>
              <th align="left">SĐT</th>
              <th align="right">Tổng tiền</th>
              <th align="left" style={{ minWidth: 360 }}>Trạng thái</th>
              <th align="center">Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const idx = stepIndex(o.statusKey);
              return (
                <tr key={o.id} style={{ borderTop: "1px solid #eee", verticalAlign: "middle" }}>
                  <td>{o.id}</td>
                  <td>{o.name}</td>
                  <td>{o.email}</td>
                  <td>{o.phone}</td>
                  <td align="right">₫{VND.format(Number(o.total ?? 0))}</td>
                  <td>
                    {/* thanh bước có thể click */}
                    <div style={{ display: "grid", gridTemplateColumns: `repeat(${STEPS.length}, 1fr)`, gap: 6 }}>
                      {STEPS.map((s, i) => {
                        const done = i <= idx;
                        return (
                          <div
                            key={s.key}
                            onClick={() => !savingId && updateStatus(o, s.key)}
                            title={s.label}
                            style={{
                              height: 8,
                              borderRadius: 999,
                              background: done ? "#10b981" : "#e5e7eb",
                              cursor: savingId ? "not-allowed" : "pointer",
                              transition: "all .15s ease",
                            }}
                          />
                        );
                      })}
                    </div>

                    {/* nhãn trạng thái */}
                    <div style={{ marginTop: 6 }}>
                      <span style={badgeStyle(o.statusKey)}>
                        {STEPS[idx]?.label || "Trạng thái"}
                        {savingId === o.id && " • đang lưu..."}
                      </span>
                    </div>
                  </td>
                  <td align="center">
                    <button onClick={() => navigate(`/admin/orders/${o.id}`)}>Xem</button>
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} align="center" style={{ color: "#666", padding: 16 }}>
                  Không có đơn hàng.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </section>
  );
}
