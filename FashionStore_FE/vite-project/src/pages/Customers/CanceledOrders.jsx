// src/pages/Customers/CanceledOrders.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000/api";
const PLACEHOLDER = "https://placehold.co/64x48?text=No+Img";
const ORDER_TRACK_PATH = "/track";

export default function CanceledOrders() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  })();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");

  // ===== Helpers (GIỮ NGUYÊN LOGIC) =====
  const fmt = (v) => (v == null ? 0 : Number(v)).toLocaleString("vi-VN");
  const fmtTime = (t) => { if (!t) return ""; const d = new Date(t); return isNaN(d) ? String(t) : d.toLocaleString("vi-VN"); };
  const calcTotal = (o) => {
    const items = o.items || o.order_items || [];
    const subtotal = o.subtotal != null
      ? Number(o.subtotal)
      : items.reduce((s, it) => s + (Number(it.price ?? 0) * Number(it.qty ?? it.quantity ?? 0)), 0);
    const shipping = Number(o.shipping_fee ?? 0);
    const discount = Number(o.discount ?? 0);
    return o.total != null ? Number(o.total) : subtotal + shipping - discount;
  };
  const isCanceled = (o) => {
    const s = o?.status; if (s == 5 || s === "5") return true;
    const k = String(o?.status_step || o?.status_key || o?.step || "").toLowerCase();
    return k.includes("cancel");
  };

  const fetchBaseList = async (signal) => {
    const headers = { Accept: "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    if (token) {
      try {
        const r = await fetch(`${API_BASE}/orders/mine`, { signal, headers });
        if (r.ok) { const data = await r.json(); if (Array.isArray(data.data)) return data.data; }
      } catch {}
    }
    try {
      const r = await fetch(`${API_BASE}/orders?status=5`, { signal, headers });
      if (r.ok) { const data = await r.json(); if (Array.isArray(data)) return data; if (Array.isArray(data?.data)) return data.data; }
    } catch {}
    return [];
  };

  const hydrateOrders = async (list, signal) => {
    const headers = { Accept: "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    const jobs = list.map(async (o) => {
      const id = o.id || o.code; if (!id) return o;
      try {
        const r = await fetch(`${API_BASE}/orders/${encodeURIComponent(id)}`, { signal, headers });
        if (r.ok) { const d = await r.json(); return { ...o, ...d, items: d.items || o.items || [] }; }
      } catch {}
      return o;
    });
    const concurrency = 6, out = [];
    for (let i = 0; i < jobs.length; i += concurrency) out.push(...await Promise.all(jobs.slice(i, i + concurrency)));
    return out;
  };

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      setLoading(true); setErr("");
      try {
        const base = await fetchBaseList(ac.signal);
        const canceledOnly = base.filter(isCanceled);
        if (!canceledOnly.length) { setOrders([]); setLoading(false); return; }
        const hydrated = await hydrateOrders(canceledOnly, ac.signal);
        setOrders(hydrated);
      } catch (e) { console.error(e); setErr("Không tải được danh sách đơn đã hủy."); }
      finally { setLoading(false); }
    })();
    return () => ac.abort();
  }, [token]);

  const visibleOrders = useMemo(() => {
    const list = (orders || [])
      .filter(isCanceled)
      .sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0));
    if (!q.trim()) return list;
    const k = q.trim().toLowerCase();
    return list.filter((o) => String(o.code || o.id).toLowerCase().includes(k));
  }, [orders, q]);

  const reorder = (order) => {
    const src = order.items || order.order_items || [];
    if (!src.length) { alert("❗ Đơn này chưa có danh sách sản phẩm chi tiết."); return; }
    const load = () => { try { return JSON.parse(localStorage.getItem("cart") || "[]"); } catch { return []; } };
    const save = (v) => localStorage.setItem("cart", JSON.stringify(v));
    const current = load(); const merged = [...current];
    for (const it of src) {
      const id = it.product_id || it.product?.id || it.id; if (!id) continue;
      const name = it.name || it.product_name || it.product?.name || `#${id}`;
      const qty = it.qty ?? it.quantity ?? 1;
      const price = Number(it.price ?? it.product?.price_sale ?? it.product?.price_root ?? it.product?.price ?? 0);
      const thumb = it.thumbnail_url || it.product_image || it.image_url || it.thumbnail || PLACEHOLDER;
      const idx = merged.findIndex((x) => x.id === id);
      if (idx >= 0) merged[idx].qty += qty; else merged.push({ id, name, price, qty, thumbnail_url: thumb });
    }
    save(merged); alert("🛒 Đã thêm lại sản phẩm vào giỏ!"); navigate("/cart");
  };

  return (
    <div className="cxl-page">
      {/* Header hero */}
      <div className="hero">
        <div className="hero-left">
          <div className="hero-title">Đơn đã hủy</div>
          <div className="hero-sub">Xem lại các đơn hàng đã huỷ và mua lại khi cần.</div>
        </div>
        <button className="btn back" onClick={() => navigate("/")}>Trang chủ</button>
      </div>

      <div className="card">
        <div className="toolbar">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔎 Tìm theo mã đơn…" className="search" />
          <div className="who">{user?.name ? <>👤 <b>{user.name}</b></> : "—"}</div>
        </div>

        {loading && (
          <div className="skeleton-list">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton-row" />)}
          </div>
        )}

        {err && !loading && <p className="error">❌ {err}</p>}

        {!loading && !err && visibleOrders.length === 0 && (
          <div className="empty">
            <img src="https://illustrations.popsy.co/teal/paper-trash.svg" alt="" />
            <div>Không có đơn nào đã hủy.</div>
          </div>
        )}

        {/* ====== LIST ONE-ROW (Shopee-like) ====== */}
        <div className="list">
          {visibleOrders.map((o) => {
            const items = o.items || o.order_items || [];
            const total = calcTotal(o);
            const thumbs = items.slice(0, 6);
            const more = items.length - thumbs.length;
            return (
              <div key={o.id || o.code} className="row">
                {/* Left: code + time + badge */}
                <div className="col left">
                  <div className="code">#{o.code || o.id}</div>
                  <div className="time">{fmtTime(o.updated_at || o.created_at)}</div>
                  <span className="badge badge-canceled">ĐÃ HỦY</span>
                </div>

                {/* Middle: thumbnails horizontal */}
                <div className="col mid">
                  <div className="thumbs">
                    {thumbs.map((it, i) => (
                      <img
                        key={i}
                        className="thumb"
                        src={it.thumbnail_url || it.product_image || it.image_url || it.thumbnail || PLACEHOLDER}
                        onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
                        alt={it.name || it.product_name || `#${it.product_id || it.id}`}
                        title={(it.name || it.product_name || "") + ` × ${it.qty ?? it.quantity ?? 0}`}
                      />
                    ))}
                    {more > 0 && <div className="thumb more">+{more}</div>}
                  </div>
                </div>

                {/* Right: total + actions */}
                <div className="col right">
                  <div className="total">Tổng: <b>₫{fmt(total)}</b></div>
                  <div className="actions">
                    <button
                      className="btn ghost"
                      onClick={() => navigate(`${ORDER_TRACK_PATH}?code=${encodeURIComponent(o.code || o.id)}`)}
                      title="Xem chi tiết"
                    >
                      Xem chi tiết
                    </button>
                    <button className="btn primary" onClick={() => reorder(o)} title="Mua lại">
                      Mua lại
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Style />
    </div>
  );
}

/** 🎨 UI only – giữ logic */
function Style() {
  return (
    <style>{`
      :root { --e:cubic-bezier(.2,.8,.2,1); }

      .cxl-page{
        max-width:1160px; margin:0 auto; padding:28px 18px 60px;
        background:#f6f7fb; min-height:100vh;
      }

      .hero{
        display:flex; align-items:center; justify-content:space-between;
        background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:14px 16px;
        box-shadow:0 8px 20px rgba(15,23,42,.06); margin-bottom:14px;
      }
      .hero-left{display:flex; flex-direction:column; gap:4px}
      .hero-title{font-size:20px; font-weight:900; color:#0f172a}
      .hero-sub{color:#64748b; font-weight:500}

      .card{
        background:#fff; border:1px solid #e5e7eb; border-radius:12px;
        box-shadow:0 12px 30px rgba(15,23,42,.05); padding:14px;
      }

      .toolbar{display:flex; gap:10px; align-items:center; margin-bottom:8px}
      .search{flex:1; height:40px; padding:0 12px; border-radius:10px; border:1px solid #cbd5e1;}
      .search:focus{outline:none; border-color:#22c55e; box-shadow:0 0 0 3px rgba(34,197,94,.2)}
      .who{color:#334155; font-weight:600}

      /* Skeleton rows */
      .skeleton-list{display:grid; gap:10px}
      .skeleton-row{
        height:78px; border-radius:10px; border:1px solid #e5e7eb;
        background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 37%,#f1f5f9 63%);
        background-size:400% 100%; animation:shimmer 1.1s infinite;
      }
      @keyframes shimmer{0%{background-position:100% 0}100%{background-position:-100% 0}}

      .empty{display:grid; place-items:center; gap:8px; padding:24px; color:#64748b}
      .empty img{width:110px; opacity:.9}

      /* ===== Shopee-like list: mỗi đơn = một hàng ===== */
      .list{display:flex; flex-direction:column; gap:10px; margin-top:6px}

      .row{
        display:flex; align-items:center; gap:14px;
        border:1px solid #e5e7eb; background:#fff; border-radius:10px;
        padding:12px; transition:transform .15s var(--e), box-shadow .15s var(--e);
      }
      .row:hover{ transform:translateY(-1px); box-shadow:0 10px 22px rgba(15,23,42,.06); }

      .col.left{min-width:210px; display:flex; flex-direction:column; gap:6px}
      .code{font-weight:900; color:#0f172a}
      .time{color:#64748b; font-size:12px}
      .badge{ display:inline-flex; align-items:center; padding:4px 10px; border-radius:999px; font-weight:800; font-size:12px; border:1px solid transparent;}
      .badge-canceled{ background:#fee2e2; color:#991b1b; border-color:#fecaca; width:max-content; }

      .col.mid{ flex:1; overflow:hidden }
      .thumbs{ display:flex; align-items:center; gap:10px; overflow-x:auto; padding-bottom:4px }
      .thumb{
        width:56px; height:56px; object-fit:cover; border-radius:8px; flex:0 0 auto;
        border:1px solid #e5e7eb; box-shadow:0 2px 8px rgba(2,6,23,.06);
      }
      .thumb.more{
        display:flex; align-items:center; justify-content:center;
        background:#f1f5f9; color:#0f172a; font-weight:900; border:1px dashed #cbd5e1;
      }

      .col.right{ min-width:260px; display:flex; align-items:center; justify-content:flex-end; gap:14px }
      .total{ color:#0f172a; font-weight:800 }

      .actions{ display:flex; gap:8px }
      .btn{
        padding:9px 12px; border-radius:10px; font-weight:800; cursor:pointer;
        transition:transform .15s var(--e), box-shadow .15s var(--e), background .15s var(--e);
        border:1px solid transparent; user-select:none;
      }
      .btn.primary{ background:#22c55e; color:#fff; border-color:#16a34a; }
      .btn.primary:hover{ transform:translateY(-1px); box-shadow:0 8px 18px rgba(34,197,94,.35); }
      .btn.ghost{ background:#fff; color:#0f172a; border-color:#e5e7eb; }
      .btn.ghost:hover{ background:#f8fafc; }

      /* Responsive: trên mobile, vẫn 1 hàng nhưng co giãn dọc nếu thiếu chỗ */
      @media (max-width: 720px){
        .row{ flex-wrap:wrap; gap:10px }
        .col.left{ min-width:180px }
        .col.right{ width:100%; justify-content:space-between; }
      }

      .error{color:#dc2626; font-weight:600; margin-top:8px}
    `}</style>
  );
}
