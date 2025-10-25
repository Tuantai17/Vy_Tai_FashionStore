import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../lib/api";
import { COUPON_STORAGE_KEY, isCouponExpired } from "../constants/coupons";

const formatVND = (value) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" })
    .format(Number(value || 0));

export default function CouponShowcase() {
  // ===== state =====
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedCode, setCopiedCode] = useState("");
  const [flashMessage, setFlashMessage] = useState("");

  const filterActive = (list) =>
    (Array.isArray(list) ? list : []).filter((i) => !isCouponExpired(i.expires_at));

  const [savedCoupons, setSavedCoupons] = useState(() => {
    try {
      const raw = localStorage.getItem(COUPON_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return filterActive(parsed);
    } catch {
      return [];
    }
  });

  // ===== effects =====
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
      } catch (e) {
        if (!ignore) {
          console.error(e);
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
      const filtered = filterActive(savedCoupons);
      if (filtered.length !== savedCoupons.length) {
        setSavedCoupons(filtered);
        return;
      }
      localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.warn("Cannot persist saved coupons", e);
    }
  }, [savedCoupons]);

  // ===== memo =====
  const sortedCoupons = useMemo(
    () => [...coupons].sort((a, b) => Number(b.value || 0) - Number(a.value || 0)),
    [coupons]
  );
  const savedDisplay = useMemo(() => filterActive(savedCoupons), [savedCoupons]);

  // ===== ref & handlers (ĐẶT TRƯỚC MOI RETURN) =====
  const rowRef = useRef(null);
  const scrollBy = (dir) => {
    const el = rowRef.current;
    if (!el) return;
    const delta = Math.round(el.clientWidth * 0.9) * dir; // cuộn ~90% chiều rộng khung
    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  // ===== actions =====
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
      setSavedCoupons((prev) => filterActive([entry, ...prev]).slice(0, 30));
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

  // ===== flags =====
  const showList = !loading && !error && sortedCoupons.length > 0;

  /* ===================== STYLES (UI only) ===================== */
  const wrap = { margin: "28px auto", maxWidth: 1200, padding: "0 16px" };
  const header = { textAlign: "center", marginBottom: 18 };
  const title = {
    fontSize: 22, fontWeight: 900, color: "#9a3412",
    textTransform: "uppercase", letterSpacing: .6, margin: 0
  };
  const subtitle = { marginTop: 6, fontSize: 13, color: "#7c2d12", opacity: .9 };

  // card
  const ticketBase = {
    position: "relative",
    border: "2px solid #f97316",
    borderRadius: 14,
    background: "linear-gradient(180deg,#fff 0%,#fffaf5 60%,#fff6ed 100%)",
    display: "grid",
    gridTemplateColumns: "1fr auto",
    alignItems: "center",
    padding: "12px 14px",
    minHeight: 120,
    boxShadow: "0 8px 20px rgba(249,115,22,.08)",
    transition: "transform .12s ease, box-shadow .12s ease",
  };
  const hover = (e, on) => {
    e.currentTarget.style.transform = on ? "translateY(-2px)" : "translateY(0)";
    e.currentTarget.style.boxShadow = on
      ? "0 12px 28px rgba(249,115,22,.16)" : "0 8px 20px rgba(249,115,22,.08)";
  };
  const notch = (side) => ({
    content: '""', position: "absolute", top: "50%", [side]: -8,
    width: 16, height: 16, background: "#fff", border: "2px solid #f97316",
    borderRadius: "50%", transform: "translateY(-50%)", boxShadow: "inset 0 0 0 2px #fff",
  });
  const left = { display: "grid", gap: 8, paddingRight: 12 };
  const codeRow = { display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#9a3412", fontWeight: 900 };
  const tagSaved = {
    fontSize: 11, color: "#16a34a", background: "rgba(34,197,94,.12)",
    border: "1px solid rgba(34,197,94,.25)", borderRadius: 999, padding: "2px 8px", fontWeight: 900,
  };
  const bigBox = {
    border: "2px dashed #fb923c", borderRadius: 12, padding: "10px 14px",
    textAlign: "center", background: "linear-gradient(180deg,#fff7ed 0%,#ffedd5 100%)",
    fontWeight: 900, color: "#ea580c", fontSize: 22, lineHeight: 1, minWidth: 104,
    boxShadow: "inset 0 -2px 0 #fde68a",
  };
  const sub = { fontSize: 12.5, color: "#7c2d12" };
  const meta = { fontSize: 12, color: "#9a3412", display: "flex", gap: 8, flexWrap: "wrap", marginTop: 2 };
  const btn = (saved) => ({
    background: saved ? "#16a34a" : "#f97316", color: "#fff", border: 0,
    padding: "8px 12px", borderRadius: 20, fontWeight: 900, cursor: "pointer", fontSize: 12.5,
    boxShadow: saved ? "none" : "0 8px 16px rgba(249,115,22,.25)",
    transition: "transform .1s ease, filter .15s ease",
  });

  // row (carousel)
  const rowWrap = { position: "relative", marginTop: 6 };
  const row = {
    display: "flex",
    gap: 16,
    overflowX: "auto",
    scrollBehavior: "smooth",
    padding: "2px 8px",
  };
  const extraCss = `
    .coupon-row::-webkit-scrollbar { height: 0; }
    @media (max-width: 1024px) { .coupon-card { flex: 0 0 320px; max-width: 320px; } }
    @media (max-width: 640px)  { .coupon-card { flex: 0 0 280px; max-width: 280px; } }
  `;
  const cardBox = { ...ticketBase, flex: "0 0 360px", maxWidth: 360 };

  const arrow = (side) => ({
    position: "absolute",
    top: "50%",
    [side]: -6,
    transform: "translateY(-50%)",
    zIndex: 5,
    border: "1px solid rgba(148,163,184,.35)",
    background: "#fff",
    width: 40,
    height: 40,
    borderRadius: "50%",
    boxShadow: "0 6px 18px rgba(2,6,23,.12)",
    cursor: "pointer",
    fontWeight: 900,
  });

  // wallet
  const walletBox = {
    marginTop: 22, padding: 16, borderRadius: 12,
    border: "1px solid rgba(37,99,235,.25)",
    background: "linear-gradient(180deg, rgba(59,130,246,.06), rgba(59,130,246,.03))",
  };

  return (
    <section style={wrap}>
      <style>{extraCss}</style>

      <div style={header}>
        <h2 style={title}>Ưu đãi dành riêng cho bạn</h2>
        <div style={subtitle}>Săn voucher nhanh – lưu vào ví để dùng sau</div>
      </div>

      {loading && <p style={{ textAlign: "center", color: "#d97706" }}>Đang tải mã giảm giá…</p>}
      {error && <p style={{ textAlign: "center", color: "#dc2626", fontWeight: 700 }}>{error}</p>}

      {flashMessage && (
        <div
          style={{
            maxWidth: 480, margin: "0 auto 14px",
            background: "linear-gradient(90deg, rgba(254,215,170,.5), rgba(254,240,138,.5))",
            border: "1px solid rgba(251,191,36,.6)", color: "#92400e",
            padding: "10px 14px", borderRadius: 12, textAlign: "center", fontWeight: 900, fontSize: 13,
            boxShadow: "0 10px 22px rgba(251,191,36,.18)",
          }}
        >
          {flashMessage}
        </div>
      )}

      {/* Hàng ngang + mũi tên hai bên */}
      {showList && (
        <div style={rowWrap}>
          <button aria-label="Prev" style={arrow("left")} onClick={() => scrollBy(-1)}>‹</button>

          <div className="coupon-row" style={row} ref={rowRef}>
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
                <div
                  key={coupon.id || coupon.code}
                  className="coupon-card"
                  style={cardBox}
                  onMouseEnter={(e) => hover(e, true)}
                  onMouseLeave={(e) => hover(e, false)}
                >
                  <i style={{ ...notch("left") }} />
                  <i style={{ ...notch("right") }} />

                  <div style={left}>
                    <div style={codeRow}>
                      <span>Mã:</span>
                      <span>{coupon.code}</span>
                      {saved && <span style={tagSaved}>Đã lưu</span>}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={bigBox}>{valueText}</div>
                      <div>
                        <div style={sub}>{minOrderText}</div>
                        <div style={meta}>HSD: {expires} {remaining}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ paddingLeft: 8 }}>
                    <button
                      onClick={() => handleClaim(coupon)}
                      style={btn(saved)}
                      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(.98)")}
                      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                      onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.05)")}
                      onMouseLeave={(e) => (e.currentTarget.style.filter = "brightness(1)")}
                    >
                      {saved ? "Đã lưu" : "Lưu mã"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button aria-label="Next" style={arrow("right")} onClick={() => scrollBy(1)}>›</button>
        </div>
      )}

      {/* Ví voucher */}
      {savedDisplay.length > 0 && (
        <div style={walletBox}>
          <h3 style={{ fontSize: 14, fontWeight: 900, color: "#1d4ed8", marginBottom: 8 }}>
            Ví voucher của bạn
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {savedDisplay.map((c) => (
              <div
                key={`${c.code}-${c.claimed_at}`}
                style={{
                  padding: "6px 12px", borderRadius: 999, background: "#fff",
                  border: "1px solid rgba(59,130,246,.35)", color: "#1e3a8a",
                  fontWeight: 800, fontSize: 12.5, display: "flex", alignItems: "center", gap: 10,
                  boxShadow: "0 4px 10px rgba(2,6,23,.05)",
                }}
                title={`HSD: ${c.expires_at ? new Date(c.expires_at).toLocaleDateString("vi-VN") : "Không HSD"}`}
              >
                <span aria-hidden style={{ width: 8, height: 8, borderRadius: "50%", background: "#3b82f6", opacity: .75 }} />
                <span>{c.code}</span>
                <span style={{ fontSize: 11.5, color: "#334155" }}>
                  {c.expires_at ? new Date(c.expires_at).toLocaleDateString("vi-VN") : "Không HSD"}
                </span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, textAlign: "right" }}>
            <Link
              to="/vouchers"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: 999,
                border: "1px solid rgba(37,99,235,.35)", color: "#1d4ed8",
                fontWeight: 800, fontSize: 13, background: "#fff",
                boxShadow: "0 6px 14px rgba(37,99,235,.12)",
              }}
            >
              Xem tất cả voucher <span aria-hidden style={{ fontSize: 12 }}>→</span>
            </Link>
          </div>
        </div>
      )}

      {copiedCode && (
        <p
          style={{
            marginTop: 12,
            textAlign: "center",
            fontSize: 12,
            color: "#2563eb",
            fontWeight: 700,
          }}
        >
          Đã sao chép mã {copiedCode} vào clipboard.
        </p>
      )}
    </section>
  );
}
