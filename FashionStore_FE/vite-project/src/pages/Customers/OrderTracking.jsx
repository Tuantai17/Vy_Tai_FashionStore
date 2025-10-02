// src/pages/Customers/OrderTracking.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000/api";
const PLACEHOLDER = "https://placehold.co/80x60?text=No+Img";

// 5 mốc trạng thái hiển thị cho khách
export const STATUS_STEPS = [
  { key: "pending",   label: "Chờ xác nhận" },
  { key: "confirmed", label: "Đã xác nhận" },
  { key: "ready",     label: "Chờ vận chuyển" },
  { key: "shipping",  label: "Đang giao" },
  { key: "delivered", label: "Giao thành công" },
];

// tự refresh khi đơn đang xử lý / giao
const ACTIVE_POLL = new Set(["confirmed", "ready", "shipping"]);

// Chuẩn hóa mọi giá trị status từ API về 5 key trên
const normalizeStatusKey = (s) => {
  const str = String(s ?? "").toLowerCase().trim();
  const map = {
    "0": "pending",
    "1": "confirmed",
    "2": "ready",
    "3": "shipping",
    "4": "delivered",

    pending: "pending",
    confirmed: "confirmed",
    ready: "ready",
    shipping: "shipping",
    shipped: "shipping",
    delivered: "delivered",
    paid: "confirmed",
    processing: "ready",
    completed: "delivered",
    success: "delivered",
    canceled: "canceled",
    cancelled: "canceled",
  };
  return map[str] || "pending";
};

export default function OrderTracking() {
  const navigate = useNavigate();

  const [code, setCode] = useState(() =>
    new URLSearchParams(location.search).get("code") ||
    localStorage.getItem("last_order_code") || ""
  );
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [canceling, setCanceling] = useState(false);
  const pollRef = useRef(null);

  const fmt = (v) => (v == null ? 0 : Number(v)).toLocaleString("vi-VN");
  const fmtTime = (t) => {
    if (!t) return "";
    const d = new Date(t);
    if (isNaN(d)) return String(t);
    return d.toLocaleString("vi-VN");
  };

  // status hiện tại (đã normalize)
  const statusKey = useMemo(() => {
    const raw =
      order?.status_step ??   // 'confirmed'...
      order?.step_code ??     // 0..4
      order?.status_key ??    // tuỳ backend
      order?.status;          // fallback
    return normalizeStatusKey(raw);
  }, [order]);

  const currentStep = useMemo(() => {
    const idx = ["pending","confirmed","ready","shipping","delivered"].indexOf(statusKey);
    return Math.max(0, idx);
  }, [statusKey]);

  // tên khách
  const customerName = useMemo(() => {
    if (!order) return "—";
    const localUser = (() => {
      try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
    })();
    return (
      order.shipping_name ||
      order.customer_name ||
      order.customer?.name ||
      order.user?.name ||
      order.recipient_name ||
      localUser?.name ||
      "—"
    );
  }, [order]);

  // tổng tiền
  const money = useMemo(() => {
    if (!order) return { subtotal: 0, shippingFee: 0, discount: 0, total: 0 };
    const items = (order.items || order.order_items || []).map((it) => ({
      qty: it.qty ?? it.quantity ?? 0,
      price: Number(it.price ?? 0),
    }));
    const subtotalApi = order.subtotal != null ? Number(order.subtotal) : null;
    const subtotalCalc = items.reduce((s, it) => s + it.qty * it.price, 0);
    const subtotal = subtotalApi ?? subtotalCalc;

    const shippingFee = order.shipping_fee != null ? Number(order.shipping_fee) : 0;
    const discount = order.discount != null ? Number(order.discount) : 0;
    const totalApi = order.total != null ? Number(order.total) : null;
    const total = totalApi ?? (subtotal + shippingFee - discount);
    return { subtotal, shippingFee, discount, total };
  }, [order]);

  // thời gian từng mốc (tùy API có/không)
  const timelineTimes = useMemo(() => ({
    pending:    order?.created_at || order?.createdAt || order?.placed_at,
    confirmed:  order?.confirmed_at || order?.paid_at,
    ready:      order?.ready_at || order?.processing_at || order?.packed_at,
    shipping:   order?.shipped_at,
    delivered:  order?.delivered_at,
  }), [order]);

  // vận chuyển
  const carrierName = order?.carrier || order?.shipping_provider || order?.courier;
  const trackingNo  = order?.tracking_no || order?.tracking_number || order?.shipment?.tracking_number;
  const carrierTrackUrl = (() => {
    if (!trackingNo) return "";
    const lower = (carrierName || "").toLowerCase();
    if (lower.includes("ghtk")) return `https://i.ghtk.vn/${trackingNo}`;
    if (lower.includes("ghn"))  return `https://donhang.ghn.vn/?order_code=${trackingNo}`;
    if (lower.includes("viettel")) return `https://viettelpost.com.vn/tra-cuu-don-hang?code=${trackingNo}`;
    if (lower.includes("vnpost")) return `https://www.vnpost.vn/tra-cuu-hanh-trinh/buu-pham?code=${trackingNo}`;
    if (lower.includes("j&t") || lower.includes("jnt")) return `https://jtexpress.vn/vi/tracking?billcode=${trackingNo}`;
    return `https://www.google.com/search?q=${encodeURIComponent(`tra cứu vận đơn ${trackingNo}`)}`;
  })();

  // hydrate sản phẩm nếu thiếu thông tin
  const needsHydrate = (it) => {
    const hasName = !!(it.name || it.product?.name);
    const hasPrice = it.price != null || it.product?.price != null || it.product?.price_sale != null || it.product?.price_root != null;
    const hasThumb = !!(it.thumbnail_url || it.product_image || it.image_url || it.thumbnail || it.product?.thumbnail_url || it.product?.thumbnail);
    return !(hasName && hasPrice && hasThumb);
  };

  const fetchProductById = async (pid, signal) => {
    const endpoints = [
      `${API_BASE}/products/${pid}`,
      `${API_BASE}/product/${pid}`,
      `${API_BASE}/items/${pid}`,
    ];
    for (const url of endpoints) {
      try {
        const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
        if (res.ok) {
          const data = await res.json();
          return data.data || data.product || data;
        }
      } catch {}
    }
    return null;
  };

  const hydrateItems = async (items, signal) => {
    if (!Array.isArray(items) || items.length === 0) return [];
    const prodCache = new Map();
    const getProd = async (pid) => {
      if (prodCache.has(pid)) return prodCache.get(pid);
      const p = await fetchProductById(pid, signal);
      prodCache.set(pid, p);
      return p;
    };

    const out = [];
    for (const it of items) {
      if (!needsHydrate(it)) { out.push(it); continue; }
      const pid = it.product_id || it.productId || it.product?.id;
      const p = pid ? await getProd(pid) : (it.product || null);

      const name = it.name || p?.name || `#${pid || it.id}`;
      const price = it.price ?? p?.price_sale ?? p?.price_root ?? p?.price ?? 0;
      const thumb =
        it.thumbnail_url || it.product_image || it.image_url || it.thumbnail ||
        p?.thumbnail_url || p?.image_url || p?.thumbnail || PLACEHOLDER;

      out.push({ ...it, name, price, thumbnail_url: thumb });
    }
    return out;
  };

  // fetch 1 đơn theo code/id
  const fetchOrder = async (signal) => {
    if (!code.trim()) return;
    setLoading(true);
    setErr("");

    const endpointA = `${API_BASE}/orders/track?code=${encodeURIComponent(code)}${phone ? `&phone=${encodeURIComponent(phone)}` : ""}`;
    const endpointB = `${API_BASE}/orders/${encodeURIComponent(code)}`;

    try {
      let o = null;

      // 1) thử /orders/track
      try {
        const resA = await fetch(endpointA, { signal, headers: { Accept: "application/json" } });
        if (resA.ok) {
          const dataA = await resA.json();
          o = dataA.data || dataA.order || dataA;
        }
      } catch {}

      // 2) nếu chưa có items => fallback /orders/{id}
      if (!o || !Array.isArray(o.items) || o.items.length === 0) {
        try {
          const resB = await fetch(endpointB, { signal, headers: { Accept: "application/json" } });
          if (resB.ok) {
            const dataB = await resB.json();
            const oB = dataB.data || dataB.order || dataB;
            o = { ...(o || {}), ...oB, items: (oB.items || o?.items || []) };
          }
        } catch {}
      }

      if (!o) throw new Error("Order not found");

      setOrder(o);

      // Hydrate items để có name/price/thumb đầy đủ
      const rawItems = o.items || o.order_items || [];
      const hydrated = await hydrateItems(rawItems, signal);
      setOrder((prev) => ({ ...prev, items: hydrated }));
    } catch (e) {
      if (e.name !== "AbortError") {
        console.error(e);
        setErr("Không tìm thấy đơn hàng. Hãy kiểm tra mã đơn/số điện thoại.");
        setOrder(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const onSearch = (e) => {
    e.preventDefault();
    const ac = new AbortController();
    fetchOrder(ac.signal);
    return () => ac.abort();
  };

  // auto refresh theo trạng thái
  useEffect(() => {
    if (!statusKey || !ACTIVE_POLL.has(statusKey)) {
      clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(() => {
      const ac = new AbortController();
      fetchOrder(ac.signal);
    }, 15000);
    return () => clearInterval(pollRef.current);
  }, [statusKey]);

  // tự fetch nếu có ?code
  useEffect(() => {
    if (code) {
      const ac = new AbortController();
      fetchOrder(ac.signal);
      return () => ac.abort();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hủy đơn (cho phép khi pending/confirmed)
  const canCancel = order && ["pending", "confirmed"].includes(statusKey);
  const cancelOrder = async () => {
    if (!order) return;
    if (!confirm("Bạn chắc muốn hủy đơn này?")) return;
    setCanceling(true);
    try {
      const tries = [
        { url: `${API_BASE}/orders/${order.code || order.id}/cancel`, method: "POST", body: null },
        { url: `${API_BASE}/orders/cancel`, method: "POST", body: { code: order.code || order.id } },
        { url: `${API_BASE}/orders/${order.code || order.id}`, method: "PATCH", body: { status: "canceled" } },
      ];
      let ok = false;
      for (const t of tries) {
        try {
          const res = await fetch(t.url, {
            method: t.method,
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: t.body ? JSON.stringify(t.body) : undefined,
          });
          if (res.ok) { ok = true; break; }
        } catch {}
      }
      if (ok) {
        setOrder((prev) => prev ? { ...prev, status: "canceled" } : prev);
        alert("✅ Đã hủy đơn hàng");
      } else {
        alert("❌ Không hủy được đơn. Vui lòng thử lại.");
      }
    } finally {
      setCanceling(false);
    }
  };

  const reorder = () => {
    if (!order) return;
    const src = (order.items || order.order_items || []);
    if (!src.length) return;
    const load = () => {
      try { return JSON.parse(localStorage.getItem("cart") || "[]"); } catch { return []; }
    };
    const save = (v) => localStorage.setItem("cart", JSON.stringify(v));

    const current = load();
    const merged = [...current];
    for (const it of src) {
      const id = it.product_id || it.product?.id || it.id;
      if (!id) continue;
      const name  = it.name || it.product?.name || `#${id}`;
      const qty   = it.qty ?? it.quantity ?? 1;
      const price = Number(it.price ?? it.product?.price_sale ?? it.product?.price_root ?? it.product?.price ?? 0);
      const thumb = it.thumbnail_url || it.product_image || it.image_url || it.thumbnail || PLACEHOLDER;

      const existIdx = merged.findIndex((x) => x.id === id);
      if (existIdx >= 0) merged[existIdx].qty += qty;
      else merged.push({ id, name, price, qty, thumbnail_url: thumb });
    }
    save(merged);
    alert("🛒 Đã thêm lại các sản phẩm vào giỏ!");
    navigate("/cart");
  };

  const reviewFirst = () => {
    const it = (order?.items || order?.order_items || [])[0];
    const pid = it?.product_id || it?.product?.id || it?.id;
    if (pid) navigate(`/products/${pid}`);
  };

  return (
    <div className="track-page">
      <div className="track-card">
        <h2 className="track-title">📦 Theo dõi đơn hàng</h2>

        <form onSubmit={onSearch} className="track-form">
          <input
            className="track-input"
            placeholder="Nhập mã đơn (VD: 23 hoặc SV-2025-0001)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <input
            className="track-input"
            placeholder="Số điện thoại (không bắt buộc)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button className="track-btn" type="submit" disabled={loading}>
            {loading ? "Đang tìm..." : "Tra cứu"}
          </button>
        </form>

        {err && <p className="track-error">❌ {err}</p>}
      </div>

      {order && (
        <div className="track-result">
          {/* Header đơn */}
          <div className="order-head">
            <div className="order-left">
              <div className="order-code">
                Mã đơn: <b>{order.code || order.id}</b>
                <button
                  className="copy-btn"
                  onClick={() => navigator.clipboard.writeText(order.code || order.id)}
                  title="Sao chép"
                >
                  Sao chép
                </button>
              </div>
              <div className="order-meta">
                <span className="meta-chip">👤 {customerName}</span>
                <span className="meta-chip total">Tổng: ₫{fmt(money.total)}</span>
                {order?.updated_at && (
                  <span className="meta-chip muted">Cập nhật: {fmtTime(order.updated_at)}</span>
                )}
              </div>
            </div>

            <div className="order-actions">
              {canCancel && (
                <button className="btn-ghost danger" onClick={cancelOrder} disabled={canceling}>
                  {canceling ? "Đang hủy..." : "Hủy đơn"}
                </button>
              )}
              {statusKey === "delivered" && (
                <>
                  <button className="btn-ghost" onClick={reorder}>Mua lại</button>
                  <button className="btn-ghost" onClick={reviewFirst}>Đánh giá</button>
                </>
              )}
            </div>

            <div className={`status-badge s-${statusKey}`}>
              {STATUS_STEPS.find((s) => s.key === statusKey)?.label ||
                (statusKey === "canceled" ? "Đã hủy" : statusKey)}
            </div>
          </div>

          {/* Vận chuyển */}
          {(carrierName || trackingNo) && (
            <div className="panel">
              <h4>🚚 Vận chuyển</h4>
              <div className="ship-wrap">
                <div><span>Đơn vị:</span> {carrierName || "—"}</div>
                <div className="trackline">
                  <span>Mã vận đơn:</span>
                  <code className="code">{trackingNo || "—"}</code>
                  {trackingNo && (
                    <>
                      <button className="copy-btn" onClick={() => navigator.clipboard.writeText(trackingNo)}>
                        Copy
                      </button>
                      <a className="btn-link" href={carrierTrackUrl} target="_blank" rel="noreferrer">
                        Tra cứu
                      </a>
                    </>
                  )}
                </div>
                {order?.estimated_delivery && (
                  <div><span>Dự kiến giao:</span> {fmtTime(order.estimated_delivery)}</div>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="timeline">
            {STATUS_STEPS.map((s, i) => (
              <div key={s.key} className={`step ${i <= currentStep ? "done" : ""}`}>
                <div className="dot" />
                <div className="label">
                  {s.label}
                  {timelineTimes[s.key] && <div className="ts">{fmtTime(timelineTimes[s.key])}</div>}
                </div>
              </div>
            ))}
          </div>

          {/* Thông tin giao hàng + tiền */}
          <div className="grid-two">
            <div className="panel">
              <h4>📍 Thông tin giao hàng</h4>
              <div className="info">
                <div><span>Khách:</span> {customerName}</div>
                <div><span>Điện thoại:</span> {order?.shipping_phone || order?.phone || "—"}</div>
                <div><span>Địa chỉ:</span> {order?.shipping_address || order?.address || "—"}</div>
                <div><span>Ghi chú:</span> {order?.note || "—"}</div>
              </div>
            </div>

            <div className="panel">
              <h4>💵 Thanh toán</h4>
              <div className="info">
                <div><span>Tổng tiền hàng:</span> ₫{fmt(money.subtotal)}</div>
                <div><span>Phí vận chuyển:</span> ₫{fmt(money.shippingFee)}</div>
                <div><span>Giảm giá:</span> -₫{fmt(money.discount)}</div>
                <div className="total"><span>Phải trả:</span> ₫{fmt(money.total)}</div>
                <div><span>Phương thức:</span> {order?.payment_method || "—"}</div>
              </div>
            </div>
          </div>

          {/* Sản phẩm */}
          <div className="panel">
            <h4>🧺 Sản phẩm</h4>
            <div className="items">
              {(order.items || order.order_items || []).map((it) => (
                <div
                  key={it.id || `${it.product_id}-${it.variant_id || ""}`}
                  className="item"
                >
                  <img
                    src={
                      it.thumbnail_url
                      || it.product_image
                      || it.image_url
                      || it.thumbnail
                      || PLACEHOLDER
                    }
                    alt={it.name}
                    onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
                  />
                  <div className="item-info">
                    <div className="item-name">{it.name}</div>
                    <div className="item-sub">
                      SL: {it.qty ?? it.quantity ?? 0} × ₫{fmt(it.price)}
                    </div>
                  </div>
                  <div className="item-total">
                    ₫{fmt((it.qty || it.quantity || 0) * (it.price || 0))}
                  </div>
                </div>
              ))}
              {(!order.items || (order.items || order.order_items || []).length === 0) && (
                <div className="muted">Không có sản phẩm.</div>
              )}
            </div>
          </div>

          {/* Lịch sử nếu có */}
          {(order.history || order.logs) && (
            <div className="panel">
              <h4>🕑 Lịch sử đơn hàng</h4>
              <div className="history">
                {(order.history || order.logs).map((h, idx) => (
                  <div key={idx} className="hrow">
                    <div className="hwhen">{fmtTime(h.at || h.created_at || h.time)}</div>
                    <div className="hstatus">{h.status || h.event}</div>
                    <div className="hmsg">{h.message || h.note || ""}</div>
                    {h.location && <div className="hloc">📍 {h.location}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CSS inline */}
      <style>{`
        :root { --e: cubic-bezier(.2,.8,.2,1); --green:#10b981; --emerald:#059669; --muted:#6b7280; }
        .track-page { max-width: 1000px; margin: 0 auto; padding: 20px; }
        .track-card {
          background: linear-gradient(180deg,#ffffff 0%, #f4fff7 100%);
          border:1px solid #e6f4ef; border-radius:14px; padding:16px;
          box-shadow:0 8px 20px rgba(0,0,0,.05);
        }
        .track-title {
          margin:0 0 10px; font-size:22px; font-weight:800;
          background: linear-gradient(90deg,#16a34a,#22c55e);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent;
        }
        .track-form { display:flex; gap:10px; flex-wrap:wrap; }
        .track-input {
          flex:1; min-width:220px; height:40px; padding:0 12px; border-radius:10px; border:1px solid #e6f0ea;
          transition: box-shadow .2s var(--e), border-color .2s var(--e);
        }
        .track-input:focus { outline:none; border-color:#cfeee3; box-shadow:0 0 0 4px rgba(207,238,227,.35); }
        .track-btn {
          height:40px; padding:0 16px; border:0; border-radius:10px; cursor:pointer;
          background: linear-gradient(135deg,#34d399,#10b981); color:#fff; font-weight:800;
          box-shadow:0 8px 16px rgba(16,185,129,.25); transition: transform .2s var(--e), filter .2s var(--e);
        }
        .track-btn:hover { transform:translateY(-1px); filter:brightness(1.03); }
        .track-error { color:#dc2626; margin-top:10px; }
        .track-result { margin-top:16px; display:grid; gap:16px; }
        .order-head {
          background:#fff; border:1px solid #eef2f7; border-radius:14px; padding:12px 14px;
          display:grid; grid-template-columns: 1fr auto auto; align-items:center; gap:10px;
          box-shadow:0 6px 18px rgba(0,0,0,.04);
        }
        .order-left { display:flex; flex-direction:column; gap:8px; }
        .order-code { font-weight:800; }
        .order-meta { display:flex; gap:8px; flex-wrap:wrap; }
        .meta-chip {
          padding:6px 10px; border-radius:999px; font-weight:700; font-size:12px;
          background:#f0fdf4; border:1px solid #bbf7d0; color:#065f46;
        }
        .meta-chip.total { background:#eff6ff; border-color:#bfdbfe; color:#1e40af; }
        .meta-chip.muted { background:#f8fafc; border-color:#e2e8f0; color:#334155; }
        .order-actions { display:flex; gap:8px; justify-self:end; }
        .btn-ghost{
          padding:8px 12px; border-radius:10px; border:1px solid #dfe7ec; background:#fff; cursor:pointer; font-weight:700;
          transition: transform .2s var(--e), box-shadow .2s var(--e);
        }
        .btn-ghost:hover{ transform: translateY(-1px); box-shadow:0 8px 18px rgba(0,0,0,.06); }
        .btn-ghost.danger{ border-color:#fecaca; color:#b91c1c; background:#fff5f5; }
        .copy-btn{
          margin-left:10px; font-size:12px; border:1px solid #e6eef6; background:#fff; border-radius:8px; padding:4px 8px; cursor:pointer;
        }
        .btn-link{
          margin-left:8px; font-size:12px; padding:4px 8px; border-radius:8px; background:#f1f5ff; color:#1e3a8a; text-decoration:none;
        }
        .status-badge{
          padding:6px 10px; border-radius:999px; font-weight:800; font-size:12px; color:#065f46; background:#ecfdf5; border:1px solid #a7f3d0;
          justify-self:end;
        }
        .status-badge.s-pending{   background:#fff7ed; border-color:#fed7aa; color:#9a3412; }
        .status-badge.s-confirmed{ background:#eef2ff; border-color:#c7d2fe; color:#3730a3; }
        .status-badge.s-ready{     background:#f0f9ff; border-color:#bae6fd; color:#075985; }
        .status-badge.s-shipping{  background:#ecfeff; border-color:#a5f3fc; color:#155e75; }
        .status-badge.s-delivered{ background:#ecfdf5; border-color:#a7f3d0; color:#065f46; }
        .status-badge.s-canceled{  background:#fef2f2; border-color:#fecaca; color:#991b1b; }
        .timeline{
          background:#fff; border:1px solid #eef2f7; border-radius:14px; padding:18px; display:flex; justify-content:space-between;
          box-shadow:0 6px 18px rgba(0,0,0,.04);
        }
        .step{ text-align:center; width:20%; position:relative; }
        .step .dot{
          width:14px; height:14px; border-radius:999px; margin:0 auto 8px;
          background:#e5e7eb; border:2px solid #e5e7eb; transition:background .2s var(--e), border-color .2s var(--e);
        }
        .step.done .dot{ background:#10b981; border-color:#10b981; box-shadow:0 0 0 4px rgba(16,185,129,.15); }
        .step .label{ font-size:12px; color:#374151; font-weight:700; }
        .step .label .ts{ margin-top:4px; font-weight:600; color:#6b7280; font-size:11px; }
        .grid-two{ display:grid; grid-template-columns: repeat(auto-fit, minmax(260px,1fr)); gap:16px; }
        .panel{
          background:#fff; border:1px solid #eef2f7; border-radius:14px; padding:14px;
          box-shadow:0 6px 18px rgba(0,0,0,.04);
        }
        .panel h4{ margin:0 0 10px; font-size:16px; font-weight:800; }
        .info > div{ margin:6px 0; color:#374151; }
        .info span{ color:#6b7280; margin-right:6px; }
        .info .total{ font-weight:900; color:#059669; }
        .ship-wrap{ display:grid; gap:8px; }
        .trackline{ display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
        .code{ background:#f8fafc; padding:2px 6px; border-radius:6px; }
        .items{ display:flex; flex-direction:column; gap:10px; }
        .item{ display:grid; grid-template-columns: 64px 1fr auto; align-items:center; gap:12px; padding:8px; border-radius:12px; border:1px solid #f1f5f9; }
        .item img{ width:64px; height:48px; object-fit:cover; border-radius:10px; box-shadow:0 2px 6px rgba(0,0,0,.06); }
        .item-name{ font-weight:800; }
        .item-sub{ font-size:13px; color:#6b7280; }
        .item-total{ font-weight:800; color:#111827; }
        .muted{ color:#6b7280; }
        .history{ display:flex; flex-direction:column; gap:10px; }
        .hrow{ display:grid; grid-template-columns: 170px 140px 1fr auto; gap:8px; align-items:start; padding:8px; border:1px dashed #e5e7eb; border-radius:10px; }
        .hwhen{ color:#334155; font-weight:700; }
        .hstatus{ font-weight:700; color:#065f46; }
        .hmsg{ color:#374151; }
        .hloc{ color:#475569; }
      `}</style>
    </div>
  );
}
