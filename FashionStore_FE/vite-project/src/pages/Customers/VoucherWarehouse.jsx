import { useEffect, useMemo, useState } from "react";
import { apiGet } from "../../lib/api";
import { COUPON_STORAGE_KEY, isCouponExpired } from "../../constants/coupons";

/* ========== Helpers ========== */
const VND = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });
const formatCurrency = (v) => VND.format(Number(v || 0));
const formatDate = (value) => {
  if (!value) return "Không HSD";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString("vi-VN");
};
const buildWalletEntry = (coupon) => ({
  code: coupon.code,
  type: coupon.type,
  value: coupon.value,
  min_order_total: coupon.min_order_total,
  expires_at: coupon.expires_at,
  claimed_at: new Date().toISOString(),
});
const filterActive = (list) =>
  (Array.isArray(list) ? list : []).filter((x) => !isCouponExpired(x.expires_at));

/* ========== Component ========== */
export default function VoucherWarehouse() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [allCoupons, setAllCoupons] = useState([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [flash, setFlash] = useState("");

  const [savedCoupons, setSavedCoupons] = useState(() => {
    try {
      const raw = localStorage.getItem(COUPON_STORAGE_KEY);
      return filterActive(raw ? JSON.parse(raw) : []);
    } catch {
      return [];
    }
  });

  // fetch
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await apiGet("/coupons", { query: { limit: 200, include_expired: true } });
        const list = Array.isArray(res) ? res : res?.data ?? [];
        setAllCoupons(list);
      } catch (e) {
        console.error(e);
        setError("Không thể tải danh sách voucher.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // persist wallet
  useEffect(() => {
    try {
      const filtered = filterActive(savedCoupons);
      localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.warn("Unable to persist voucher wallet", e);
    }
  }, [savedCoupons]);

  // flash auto-hide
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(""), 2200);
    return () => clearTimeout(t);
  }, [flash]);

  const savedDisplay = useMemo(() => filterActive(savedCoupons), [savedCoupons]);
  const counts = useMemo(() => {
    const active = allCoupons.filter((c) => !isCouponExpired(c.expires_at)).length;
    return {
      total: allCoupons.length,
      active,
      expired: allCoupons.length - active,
      mine: savedDisplay.length,
    };
  }, [allCoupons, savedDisplay]);

  const searchTerm = search.trim().toLowerCase();

  const filteredCoupons = useMemo(() => {
    let list = [...allCoupons];
    if (tab === "active") list = list.filter((c) => !isCouponExpired(c.expires_at));
    else if (tab === "expired") list = list.filter((c) => isCouponExpired(c.expires_at));
    else if (tab === "mine") {
      const own = new Set(savedDisplay.map((x) => x.code));
      list = list.filter((c) => own.has(c.code));
    }
    if (searchTerm) {
      list = list.filter((c) => {
        const code = String(c.code || "").toLowerCase();
        const type = String(c.type || "").toLowerCase();
        return code.includes(searchTerm) || type.includes(searchTerm);
      });
    }
    return list;
  }, [allCoupons, savedDisplay, tab, searchTerm]);

  const savedCodes = useMemo(() => new Set(savedCoupons.map((c) => c.code)), [savedCoupons]);

  const toggleSave = (coupon) => {
    const has = savedCodes.has(coupon.code);
    if (has) {
      setSavedCoupons((prev) => prev.filter((x) => x.code !== coupon.code));
      setFlash(`Đã bỏ mã ${coupon.code} khỏi ví voucher.`);
    } else {
      const entry = buildWalletEntry(coupon);
      setSavedCoupons((prev) => filterActive([entry, ...prev]).slice(0, 40));
      setFlash(`Đã lưu mã ${coupon.code} vào ví voucher.`);
    }
  };

  const sections = [
    { key: "all", label: `Tất cả (${counts.total})` },
    { key: "mine", label: `Ví của tôi (${counts.mine})` },
    { key: "active", label: `Đang diễn ra (${counts.active})` },
    { key: "expired", label: `Hết hạn (${counts.expired})` },
  ];

  return (
    <section style={sx.page}>
      <div style={sx.shell}>
        {/* Header */}
        <header style={sx.header}>
          <div>
            <h1 style={sx.title}>Kho Voucher</h1>
            <p style={sx.subtitle}>Lưu và dùng các ưu đãi mới nhất cho đơn hàng của bạn.</p>
          </div>
          <div style={sx.searchBox}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nhập mã hoặc loại voucher…"
              style={sx.searchInput}
            />
            <button type="button" style={sx.searchButton} onClick={() => {}}>
              Tìm kiếm
            </button>
          </div>
        </header>

        {flash && <div style={sx.flash}>{flash}</div>}

        {/* Wallet */}
        <section style={sx.wallet}>
          <div style={sx.walletHeader}>
            <h2 style={sx.walletTitle}>Ví voucher của bạn</h2>
            <span style={sx.walletCount}>{savedDisplay.length}</span>
          </div>
          {savedDisplay.length === 0 ? (
            <p style={sx.walletEmpty}>Chưa có voucher nào được lưu. Hãy lưu mã để dùng nhanh khi thanh toán.</p>
          ) : (
            <div style={sx.walletChips}>
              {savedDisplay.map((c) => (
                <div key={`${c.code}-${c.claimed_at}`} style={sx.walletChip}>
                  <span style={{ fontWeight: 700 }}>{c.code}</span>
                  <span style={{ fontSize: 11, color: "#475569" }}>{formatDate(c.expires_at)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Tabs */}
        <nav style={sx.tabs}>
          {sections.map((sec) => (
            <button
              key={sec.key}
              type="button"
              onClick={() => setTab(sec.key)}
              style={{ ...sx.tabButton, ...(tab === sec.key ? sx.tabButtonActive : {}) }}
            >
              {sec.label}
            </button>
          ))}
        </nav>

        {/* States */}
        {loading && (
          <div style={sx.skeletonWrap}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={sx.skeletonCard} />
            ))}
          </div>
        )}
        {error && !loading && <p style={{ ...sx.info, color: "#dc2626" }}>{error}</p>}

        {!loading && !error && filteredCoupons.length === 0 && (
          <div style={sx.empty}>
            <img
              src="https://illustrations.popsy.co/white/discount.svg"
              alt=""
              style={{ width: 120, opacity: 0.9 }}
            />
            <p>Không tìm thấy voucher phù hợp.</p>
          </div>
        )}

        {/* Grid */}
        <div style={sx.grid}>
          {filteredCoupons.map((coupon) => {
            const percent = coupon.type === "percent";
            const valueLabel = percent ? `${Number(coupon.value || 0)}%` : formatCurrency(coupon.value || 0);
            const minOrder =
              coupon.min_order_total && Number(coupon.min_order_total) > 0
                ? `Đơn tối thiểu ${formatCurrency(coupon.min_order_total)}`
                : "Không giới hạn đơn tối thiểu";
            const expired = isCouponExpired(coupon.expires_at);
            const saved = savedCodes.has(coupon.code);

            const ribbonColor = expired ? "#94a3b8" : "#f97316";
            const btnBg = expired ? "#94a3b8" : saved ? "#16a34a" : "#f97316";
            const btnLabel = expired ? "Hết hạn" : saved ? "Đã lưu" : "Lưu mã";

            return (
              <article
                key={coupon.id || coupon.code}
                style={{ ...sx.card, opacity: expired ? 0.7 : 1 }}
                aria-disabled={expired}
              >
                {/* Dải màu + lỗ vé kiểu Shopee */}
                <div style={{ ...sx.ticketBand, background: ribbonColor }}>
                  <div style={sx.punchTop} />
                  <div style={sx.punchBottom} />
                </div>

                <div style={sx.cardBody}>
                  <div style={{ ...sx.cardValue, borderColor: ribbonColor, color: ribbonColor }}>
                    {valueLabel}
                  </div>
                  <div style={sx.cardInfo}>
                    <div style={sx.cardCode}>
                      Mã <strong style={{ fontSize: 16 }}>{coupon.code}</strong>
                    </div>
                    <div style={sx.cardMeta}>{minOrder}</div>
                    <div style={sx.cardMeta}>
                      HSD: {formatDate(coupon.expires_at)}
                      {coupon.remaining_uses != null && (
                        <span style={{ marginLeft: 6 }}>Còn {coupon.remaining_uses} lượt</span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={sx.cardActions}>
                  <button
                    type="button"
                    onClick={() => !expired && toggleSave(coupon)}
                    disabled={expired}
                    style={{
                      ...sx.cardButton,
                      background: btnBg,
                      cursor: expired ? "not-allowed" : "pointer",
                      opacity: expired ? 0.78 : 1,
                    }}
                  >
                    {btnLabel}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ========== Styles (Shopee-like) ========== */
const sx = {
  page: { background: "#f6f7fb", minHeight: "100vh", padding: "24px 12px" },
  shell: { maxWidth: 1120, margin: "0 auto", display: "grid", gap: 18 },
  header: { display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 16, alignItems: "center" },
  title: { fontSize: 26, fontWeight: 900, color: "#0f172a" },
  subtitle: { color: "#475569", marginTop: 4, fontSize: 14 },
  searchBox: { display: "flex", gap: 10, alignItems: "center" },
  searchInput: {
    width: 280,
    height: 40,
    borderRadius: 12,
    border: "1px solid #d0d7e2",
    padding: "0 12px",
    outline: "none",
    fontSize: 14,
    background: "#fff",
  },
  searchButton: {
    height: 40,
    padding: "0 18px",
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg,#ef4444,#f97316)",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 6px 14px rgba(249,115,22,.25)",
  },
  flash: {
    padding: "10px 14px",
    borderRadius: 10,
    background: "rgba(59,130,246,.12)",
    border: "1px solid rgba(59,130,246,.25)",
    color: "#1d4ed8",
    fontWeight: 600,
    fontSize: 13,
  },
  wallet: {
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    padding: 16,
    boxShadow: "0 10px 30px rgba(15,23,42,.06)",
  },
  walletHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  walletTitle: { fontWeight: 800, color: "#0f172a", fontSize: 16 },
  walletCount: { background: "rgba(249,115,22,.12)", color: "#c2410c", fontWeight: 700, borderRadius: 999, padding: "2px 10px", fontSize: 12 },
  walletEmpty: { color: "#64748b", fontSize: 13 },
  walletChips: { display: "flex", flexWrap: "wrap", gap: 10 },
  walletChip: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 4,
    padding: "8px 12px",
    borderRadius: 12,
    background: "#fff7ed",
    border: "1px dashed #fdba74",
  },
  tabs: { display: "flex", gap: 10, flexWrap: "wrap" },
  tabButton: {
    padding: "8px 14px",
    borderRadius: 999,
    background: "#e2e8f0",
    border: "1px solid rgba(148,163,184,.4)",
    color: "#475569",
    cursor: "pointer",
    fontWeight: 800,
  },
  tabButtonActive: { background: "#ef4444", color: "#fff", borderColor: "#ef4444", boxShadow: "0 6px 14px rgba(239,68,68,.25)" },
  info: { fontSize: 13, color: "#475569" },
  empty: {
    display: "grid",
    gap: 10,
    justifyItems: "center",
    padding: "40px 0",
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    color: "#64748b",
    fontWeight: 600,
  },
  skeletonWrap: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 },
  skeletonCard: {
    height: 160,
    borderRadius: 16,
    background: "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 37%,#f1f5f9 63%)",
    backgroundSize: "400% 100%",
    animation: "s 1.2s ease-in-out infinite",
  },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 },

  // Ticket card
  card: {
    position: "relative",
    background: "#fff",
    borderRadius: 16,
    border: "1px dashed #e5e7eb",
    boxShadow: "0 12px 24px rgba(15,23,42,.06)",
    padding: 16,
    display: "grid",
    gap: 12,
    overflow: "hidden",
  },
  ticketBand: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 8,
    background: "#f97316",
  },
  punchTop: {
    position: "absolute",
    left: -8,
    top: 60,
    width: 16,
    height: 16,
    background: "#fff",
    borderRadius: "50%",
    boxShadow: "inset 0 0 0 1px rgba(0,0,0,.05)",
  },
  punchBottom: {
    position: "absolute",
    left: -8,
    bottom: 60,
    width: 16,
    height: 16,
    background: "#fff",
    borderRadius: "50%",
    boxShadow: "inset 0 0 0 1px rgba(0,0,0,.05)",
  },
  cardBody: { display: "flex", gap: 12, alignItems: "flex-start" },
  cardValue: {
    minWidth: 86,
    height: 86,
    borderRadius: 14,
    border: "2px dashed #f97316",
    background: "#fff7ed",
    display: "grid",
    placeItems: "center",
    fontSize: 22,
    fontWeight: 900,
    color: "#ea580c",
  },
  cardInfo: { display: "grid", gap: 6, fontSize: 13, color: "#475569" },
  cardCode: { fontWeight: 800, color: "#0f172a" },
  cardMeta: { fontSize: 12, color: "#64748b" },
  cardActions: { display: "flex", justifyContent: "flex-end" },
  cardButton: {
    padding: "8px 14px",
    borderRadius: 12,
    border: "none",
    color: "#fff",
    fontWeight: 800,
  },
};

/* Keyframes inline (for skeleton) */
const styleEl = typeof document !== "undefined" ? document.createElement("style") : null;
if (styleEl && !document.getElementById("voucher-anim")) {
  styleEl.id = "voucher-anim";
  styleEl.innerHTML = `
  @keyframes s{0%{background-position:100% 50%}100%{background-position:0% 50%}}
  `;
  document.head.appendChild(styleEl);
}
