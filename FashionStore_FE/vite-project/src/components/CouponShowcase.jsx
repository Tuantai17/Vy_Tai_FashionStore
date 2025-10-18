import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../lib/api";

const COUPON_STORAGE_KEY = "fashionstore.savedCoupons";
const formatVND = (value) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value || 0));

export default function CouponShowcase() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedCode, setCopiedCode] = useState("");
  const [flashMessage, setFlashMessage] = useState("");
  const [savedCoupons, setSavedCoupons] = useState(() => {
    try {
      const raw = localStorage.getItem(COUPON_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${API_BASE}/coupons?limit=8`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!ignore) setCoupons(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!ignore) {
          console.error(err);
          setError("Không thể tải danh sách mã giảm giá.");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(savedCoupons));
    } catch (err) {
      console.warn("Cannot persist saved coupons", err);
    }
  }, [savedCoupons]);

  const handleClaim = (coupon) => {
    const exists = savedCoupons.some((c) => c.code === coupon.code);
    if (!exists) {
      const entry = {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        min_order_total: coupon.min_order_total,
        expires_at: coupon.expires_at,
        claimed_at: new Date().toISOString(),
      };
      setSavedCoupons((prev) => [entry, ...prev].slice(0, 30));
      setFlashMessage(`Đã lưu mã ${coupon.code} vào ví voucher của bạn.`);
    } else {
      setFlashMessage(`Mã ${coupon.code} đã có trong ví voucher.`);
    }

    navigator.clipboard
      ?.writeText(coupon.code)
      .then(() => setCopiedCode(coupon.code))
      .catch(() => setCopiedCode(""));

    setTimeout(() => setFlashMessage(""), 3000);
  };

  const sortedCoupons = useMemo(() => {
    return [...coupons].sort((a, b) => Number(b.value || 0) - Number(a.value || 0));
  }, [coupons]);

  if (!loading && !error && sortedCoupons.length === 0) return null;

  /* ==== STYLE RÚT GỌN — VOUCHER NHỎ GỌN KIỂU SHOPEE ==== */
  const wrap = { margin: "28px auto", maxWidth: 1200, padding: "0 12px" };
  const title = {
    fontSize: 18, fontWeight: 800, marginBottom: 14, color: "#c2410c",
    textAlign: "center", textTransform: "uppercase", letterSpacing: .5,
  };
  const grid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 12,
  };
  const ticket = {
    position: "relative",
    border: "1.8px solid #f97316",
    borderRadius: 10,
    background: "#fff",
    display: "grid",
    gridTemplateColumns: "1fr auto",
    alignItems: "center",
    padding: "8px 10px",
    minHeight: 88,
  };
  const ticketNotch = (side) => ({
    content: '""',
    position: "absolute",
    top: "50%",
    [side]: -6,
    width: 12,
    height: 12,
    background: "#fff",
    border: "1.8px solid #f97316",
    borderRadius: "50%",
    transform: "translateY(-50%)",
  });
  const left = { display: "grid", gap: 4, paddingRight: 10 };
  const codeRow = { display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#9a3412", fontWeight: 700 };
  const bigBox = {
    border: "1.5px dashed #fb923c",
    borderRadius: 8,
    padding: "8px 10px",
    textAlign: "center",
    background: "#fff7ed",
    fontWeight: 900,
    color: "#ea580c",
    fontSize: 22,
    lineHeight: 1,
    minWidth: 96,
  };
  const sub = { fontSize: 11.5, color: "#7c2d12", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
  const meta = { fontSize: 10.5, color: "#9a3412", display: "flex", gap: 8, flexWrap: "wrap" };
  const btn = (saved) => ({
    background: saved ? "#16a34a" : "#f97316",
    color: "#fff",
    border: 0,
    padding: "6px 10px",
    borderRadius: 18,
    fontWeight: 800,
    cursor: "pointer",
    fontSize: 12,
    boxShadow: saved ? "none" : "0 4px 10px rgba(249,115,22,.25)",
    whiteSpace: "nowrap",
  });

  return (
    <section style={wrap}>
      <h2 style={title}>Ưu đãi dành riêng cho bạn</h2>

      {loading && <p style={{ textAlign: "center", color: "#d97706", marginBottom: 10 }}>Đang tải mã giảm giá...</p>}
      {error && <p style={{ textAlign: "center", color: "#dc2626", marginBottom: 10 }}>{error}</p>}

      {flashMessage && (
        <div
          style={{
            maxWidth: 420, margin: "0 auto 12px", background: "rgba(254,215,170,.35)",
            border: "1px solid rgba(251,191,36,.5)", color: "#b45309",
            padding: "8px 12px", borderRadius: 10, textAlign: "center", fontWeight: 700, fontSize: 12.5,
          }}
        >
          {flashMessage}
        </div>
      )}

      <div style={grid}>
        {sortedCoupons.map((coupon) => {
          const isPercent = coupon.type === "percent";
          const valueText = isPercent
            ? `${Number(coupon.value || 0)}%`
            : formatVND(coupon.value || 0).replace("₫", "").trim();
          const discountText = isPercent ? `${Number(coupon.value || 0)}%` : formatVND(coupon.value || 0);
          const minOrderText =
            coupon.min_order_total && Number(coupon.min_order_total) > 0
              ? `Giảm ${discountText} cho đơn từ ${formatVND(coupon.min_order_total)}`
              : `Giảm ${discountText} cho mọi đơn hàng`;
          const expires = coupon.expires_at
            ? new Date(coupon.expires_at).toLocaleDateString("vi-VN")
            : "Không HSD";
          const remaining =
            coupon.remaining_uses == null ? "" : `• Còn ${coupon.remaining_uses} lượt`;
          const saved = savedCoupons.some((c) => c.code === coupon.code);

          return (
            <div key={coupon.id || coupon.code} style={ticket}>
              {/* 2 “notches” 2 bên giống vé */}
              <i style={{ ...ticketNotch("left") }} />
              <i style={{ ...ticketNotch("right") }} />

              <div style={left}>
                <div style={codeRow}>
                  <span>Mã:</span>
                  <span>{coupon.code}</span>
                  {saved && (
                    <span
                      style={{
                        marginLeft: 4, fontSize: 10, color: "#16a34a",
                        background: "rgba(34,197,94,.12)", borderRadius: 999, padding: "2px 6px", fontWeight: 800,
                      }}
                    >
                      Đã lưu
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={bigBox}>{valueText}</div>
                  <div>
                    <div style={sub}>{minOrderText}</div>
                    <div style={meta}>HSD: {expires} {remaining}</div>
                  </div>
                </div>
              </div>

              <div style={{ paddingLeft: 8 }}>
                <button onClick={() => handleClaim(coupon)} style={btn(saved)}>
                  {saved ? "Đã lưu" : "Lưu mã"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {savedCoupons.length > 0 && (
        <div
          style={{
            marginTop: 18, padding: 12, borderRadius: 10,
            border: "1px solid rgba(59,130,246,.2)", background: "rgba(59,130,246,.06)",
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 800, color: "#1d4ed8", marginBottom: 8 }}>
            Ví voucher của bạn
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {savedCoupons.map((coupon) => (
              <div
                key={`${coupon.code}-${coupon.claimed_at}`}
                style={{
                  padding: "4px 10px", borderRadius: 999, background: "#fff",
                  border: "1px solid rgba(59,130,246,.3)", color: "#1e3a8a",
                  fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", gap: 8,
                }}
              >
                <span>{coupon.code}</span>
                <span style={{ fontSize: 11, color: "#334155" }}>
                  {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString("vi-VN") : "Không HSD"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {copiedCode && (
        <p style={{ marginTop: 10, textAlign: "center", fontSize: 11.5, color: "#2563eb" }}>
          Đã sao chép mã {copiedCode} vào clipboard.
        </p>
      )}
    </section>
  );
}
