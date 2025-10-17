// src/pages/Customers/MyOrders.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000/api";

/* ================= Helpers ================= */
function getCustomerToken() {
  return (
    localStorage.getItem("mbs.customer.token") ||
    localStorage.getItem("mbs.customerToken") ||
    localStorage.getItem("token") ||
    ""
  );
}

function formatVND(n) {
  const v = Number(n ?? 0);
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v);
}

const STATUS_META = {
  pending:   { label: "Chờ xác nhận",  bg: "#fff7ed", color: "#9a3412", border: "#fed7aa" },
  confirmed: { label: "Đã xác nhận",   bg: "#eef2ff", color: "#3730a3", border: "#c7d2fe" },
  ready:     { label: "Chuẩn bị giao", bg: "#f0f9ff", color: "#075985", border: "#bae6fd" },
  shipping:  { label: "Đang giao",     bg: "#ecfeff", color: "#155e75", border: "#a5f3fc" },
  delivered: { label: "Đã giao",       bg: "#ecfdf5", color: "#065f46", border: "#a7f3d0" },
  canceled:  { label: "Đã hủy",        bg: "#fef2f2", color: "#991b1b", border: "#fecaca" },
  default:   { label: "Đang xử lý",    bg: "#f3f4f6", color: "#374151", border: "#d1d5db" },
};

const STATUS_LOOKUP = (() => {
  const map = new Map();
  const entries = {
    pending:   ["pending","pending confirmation","awaiting confirmation","chờ xác nhận","cho xac nhan","chờ duyệt","cho duyet"],
    confirmed: ["confirmed","đã xác nhận","da xac nhan","xac nhan","paid","payment confirmed"],
    ready:     ["ready","ready to ship","processing","chuẩn bị giao","chuan bi giao","chờ giao hàng","cho giao hang","đóng gói","dong goi","packed","san sang"],
    shipping:  ["shipping","đang giao","dang giao","vận chuyển","van chuyen","in transit"],
    delivered: ["delivered","đã giao","da giao","completed","hoàn tất","hoan tat","done"],
    canceled:  ["canceled","cancelled","cancel","hủy","huy","void","refunded"],
  };
  Object.entries(entries).forEach(([k, arr]) => arr.forEach(t => map.set(t.toLowerCase(), k)));
  return map;
})();

const STEP_CODE_TO_KEY = ["pending","confirmed","ready","shipping","delivered"];

function toDateTimeString(s) {
  if (!s) return "-";
  return s.toString().slice(0, 19).replace("T", " ");
}

function normalizeStatusKeyFromString(value) {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim().toLowerCase();
  if (!raw) return null;
  if (/^\d+$/.test(raw)) return null;
  const normalized = raw.replace(/[_-]+/g, " ");
  return STATUS_LOOKUP.get(normalized) ?? STATUS_LOOKUP.get(raw) ?? null;
}

function deriveStatusKey(order) {
  const strCandidates = [
    order?.status_label, order?.statusLabel,
    order?.status_step,  order?.statusStep,
    order?.status_key,   order?.statusKey,
    order?.workflow_status, order?.workflowStatus,
  ];
  for (const val of strCandidates) {
    const key = normalizeStatusKeyFromString(val);
    if (key) return key;
  }
  const stepCodes = [order?.step_code, order?.stepCode];
  for (const code of stepCodes) {
    const num = Number(code);
    if (Number.isInteger(num) && num >= 0) {
      const key = STEP_CODE_TO_KEY[num];
      if (key) return key;
    }
  }
  const statusCodes = [order?.status_code, order?.statusCode, order?.status];
  for (const code of statusCodes) {
    const num = Number(code);
    if (!Number.isNaN(num)) {
      if (num === 2 || num === 5) return "canceled";
      if (num === 4) return "delivered";
      if (num === 3) return "shipping";
      if (num === 1) return "confirmed";
      if (num === 0) return "pending";
    }
  }
  if (order?.canceled_at || order?.canceledAt) return "canceled";
  return "pending";
}

function statusBadgeStyle(key) {
  const meta = STATUS_META[key] ?? STATUS_META.default;
  return {
    background: meta.bg,
    color: meta.color,
    padding: "4px 10px",
    borderRadius: "999px",
    fontWeight: 700,
    border: `1px solid ${meta.border}`,
    fontSize: 12,
    whiteSpace: "nowrap",
  };
}

function statusLabelFromKey(key) {
  return (STATUS_META[key] ?? STATUS_META.default).label;
}

/* ================= Component ================= */
export default function MyOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const token = getCustomerToken();
    if (!token) {
      setErr("⚠️ Vui lòng đăng nhập để xem đơn hàng của bạn.");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await fetch(`${API_BASE}/orders/mine`, {
          headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || "Lỗi khi tải danh sách đơn hàng.");
        }
        const data = await res.json();
        const arr = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        const normalized = arr.map((item) => ({ ...item, statusKey: deriveStatusKey(item) }));
        if (!arr.length) setErr("Chưa có đơn hàng nào.");
        setOrders(normalized);
      } catch (e) {
        console.error(e);
        setErr("Không thể tải danh sách đơn hàng.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toTrack = (o) => navigate(`/track?code=${o.code || o.id}`);

  return (
    <div className="orders-page">
      <div className="orders-shell">
        {/* Header đơn giản kiểu Shopee */}
        <div className="orders-header">
          <div className="title">Đơn hàng của bạn</div>
          <div className="sub">Quản lý và theo dõi trạng thái đơn hàng.</div>
        </div>

        {/* Bảng kiểu Shopee */}
        <div className="table-wrap">
          {loading && <div className="loading">Đang tải danh sách đơn hàng…</div>}
          {!loading && err && <div className="error">{err}</div>}

          {!loading && !err && orders.length > 0 && (
            <table className="order-table">
              <thead>
                <tr>
                  <th style={{width: "18%"}}>Mã đơn</th>
                  <th style={{width: "22%"}}>Ngày đặt</th>
                  <th style={{width: "20%"}}>Tổng tiền</th>
                  <th style={{width: "20%"}}>Trạng thái</th>
                  <th style={{width: "20%", textAlign: "right"}}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const statusKey = o.statusKey ?? deriveStatusKey(o);
                  const label = statusLabelFromKey(statusKey);
                  return (
                    <tr key={o.id || o.code}>
                      <td className="cell-strong">#{o.code || o.id}</td>
                      <td>{toDateTimeString(o.created_at || o.createdAt)}</td>
                      <td className="cell-strong">{formatVND(o.total_price ?? o.total ?? 0)}</td>
                      <td><span style={statusBadgeStyle(statusKey)}>{label}</span></td>
                      <td className="cell-actions">
                        <button className="btn ghost" onClick={() => toTrack(o)}>Xem chi tiết</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {!loading && !err && orders.length === 0 && (
            <div className="empty">
              <img src="https://illustrations.popsy.co/blue/shopping-bag.svg" alt="" />
              <div>Chưa có đơn hàng nào</div>
            </div>
          )}
        </div>
      </div>

      <Style />
    </div>
  );
}

/* ========== CSS — CHỈ GIAO DIỆN, KHÔNG ĐỤNG LOGIC ========== */
function Style() {
  return (
    <style>{`
      /* Trang phẳng, không background ảnh/gradient */
      .orders-page{
        background:#ffffff; /* bỏ background */
        min-height:100vh;
        padding:24px 14px;
      }
      .orders-shell{
        max-width:1100px;
        margin:0 auto;
      }

      /* Header gọn giống Shopee */
      .orders-header{
        background:#fff;
        border:1px solid #e5e7eb;
        border-radius:10px;
        padding:14px 16px;
        margin-bottom:12px;
      }
      .orders-header .title{
        font-size:18px; font-weight:900; color:#0f172a;
      }
      .orders-header .sub{
        color:#64748b; margin-top:2px;
      }

      .table-wrap{
        background:#fff;
        border:1px solid #e5e7eb;
        border-radius:10px;
        padding:8px;
      }

      .order-table{
        width:100%;
        border-collapse:separate;
        border-spacing:0;
      }
      .order-table thead th{
        background:#f8fafc;
        color:#334155;
        text-align:left;
        padding:12px 14px;
        font-weight:800;
        border-bottom:1px solid #e5e7eb;
        position:sticky; top:0; z-index:1;
      }
      .order-table tbody td{
        padding:12px 14px;
        border-bottom:1px solid #f1f5f9;
        vertical-align:middle;
      }
      .order-table tbody tr{
        transition:background .12s ease, transform .12s ease;
      }
      .order-table tbody tr:hover{
        background:#f8fafc;
      }
      .cell-strong{ font-weight:800; color:#111827; }
      .cell-actions{ text-align:right; }

      .btn{
        padding:8px 12px;
        border-radius:10px;
        font-weight:800;
        cursor:pointer;
        border:1px solid #e5e7eb;
        background:#ffffff;
        color:#0f172a;
        transition:transform .12s ease, box-shadow .12s ease, background .12s ease;
      }
      .btn:hover{
        background:#f8fafc;
        transform:translateY(-1px);
        box-shadow:0 8px 16px rgba(15,23,42,.06);
      }
      .btn.ghost{ /* giữ class để sau này mở rộng thêm các loại nút */ }

      .loading{ padding:20px; color:#334155; }
      .error{ padding:16px; color:#dc2626; font-weight:700; }
      .empty{
        display:grid; place-items:center; gap:10px; padding:28px;
        color:#64748b;
      }
      .empty img{ width:110px; opacity:.95 }
    `}</style>
  );
}
