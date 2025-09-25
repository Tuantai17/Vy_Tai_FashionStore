import { useEffect, useState } from "react";

const API_BASE = "http://127.0.0.1:8000/api"; // giữ giống các trang khác
const VND = new Intl.NumberFormat("vi-VN");

const badgeStyle = (status) => {
  const ok = status === 1 || status === "Completed";
  return {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 999,
    background: ok ? "#e7f9ee" : "#fff6e6",
    color: ok ? "#0a7a3f" : "#a35b00",
    fontSize: 12,
  };
};

// map số -> chữ
const humanStatus = (s) => {
  if (typeof s === "string") return s;
  switch (Number(s)) {
    case 0: return "Pending";
    case 1: return "Completed";
    case 2: return "Cancelled";
    default: return "Unknown";
  }
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let ignore = false;

    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await fetch(`${API_BASE}/orders?per_page=100${search ? `&search=${encodeURIComponent(search)}` : ""}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.data ?? [];
        if (!ignore) setOrders(list);
      } catch (e) {
        if (!ignore) setErr("Không tải được danh sách đơn hàng.");
        console.error(e);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => { ignore = true; };
  }, [search]);

  return (
    <section>
      <h1 style={{ fontSize: 24, marginBottom: 12 }}>Orders</h1>

      {/* Tìm kiếm nhanh */}
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
              <th align="left">Trạng thái</th>
              <th align="center">Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} style={{ borderTop: "1px solid #eee" }}>
                <td>{o.id}</td>
                <td>{o.name}</td>
                <td>{o.email}</td>
                <td>{o.phone}</td>
                <td align="right">₫{VND.format(Number(o.total ?? 0))}</td>
                <td><span style={badgeStyle(o.status)}>{humanStatus(o.status)}</span></td>
                <td align="center">
                  <button onClick={() => alert("View " + o.id)}>Xem</button>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={7} align="center" style={{ color: "#666", padding: 16 }}>Không có đơn hàng.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </section>
  );
}
