import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  getCustomerToken,
  getCustomerUser,
  clearCustomerSession,
  getAdminToken,
  getAdminUser,
  clearAdminSession,
} from "../../utils/authStorage";

/** Giữ nguyên cấu hình gốc */
const API_BASE = "http://127.0.0.1:8000";
const LOGOUT_URL = `${API_BASE}/api/logout`;

export default function AccountOverview() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  // Ưu tiên user thường, nếu không có mới đọc admin (giữ nguyên logic)
  useEffect(() => {
    const stateUser = location?.state?.user;
    if (stateUser) {
      setUser(stateUser);
      return;
    }
    try {
      const normalUser = getCustomerUser();
      const adminUser = getAdminUser();
      const u = normalUser ?? adminUser;
      setUser(u);
    } catch {
      setUser(null);
    }
  }, [location?.state]);

  // Đăng xuất (giữ nguyên logic)
  const handleLogout = async () => {
    const adminToken = getAdminToken();
    const customerToken = getCustomerToken();
    const bearer = adminToken || customerToken;

    try {
      if (bearer) {
        await fetch(LOGOUT_URL, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${bearer}`,
          },
        }).catch(() => {});
      }
    } catch {}

    clearCustomerSession();
    clearAdminSession();

    window.dispatchEvent(new Event("auth-changed"));
    navigate("/", { replace: true });
  };

  const initials = (user?.name || user?.email || "?")
    .toString()
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 24,
        background:
          "linear-gradient(180deg, #f8fafc 0%, #eef2ff 40%, #e0f2fe 100%)",
      }}
    >
      {/* subtle dotted background */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          backgroundImage:
            "radial-gradient(#0000000a 1px, transparent 1px), radial-gradient(#00000006 1px, transparent 1px)",
          backgroundSize: "16px 16px, 24px 24px",
          backgroundPosition: "0 0, 8px 8px",
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: 1060,
          margin: "32px auto",
          position: "relative",
        }}
      >
        {/* Header Card */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: 20,
            borderRadius: 18,
            background: "rgba(255,255,255,.85)",
            border: "1px solid rgba(148,163,184,.25)",
            boxShadow: "0 10px 30px rgba(2,6,23,.08)",
            backdropFilter: "saturate(120%) blur(4px)",
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background:
                "conic-gradient(from 220deg, #a5b4fc, #7dd3fc, #a7f3d0, #fde68a, #a5b4fc)",
              display: "grid",
              placeItems: "center",
              fontWeight: 800,
              color: "#0f172a",
              fontSize: 22,
              border: "2px solid #fff",
              boxShadow: "0 6px 14px rgba(2,6,23,.1)",
            }}
            aria-label="Avatar"
          >
            <span
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "#ffffff",
                display: "grid",
                placeItems: "center",
                border: "1px solid #e2e8f0",
              }}
            >
              {initials}
            </span>
          </div>

          {/* Welcome + email */}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <Pill text={`Xin chào${user?.name ? `, ${user.name}` : ""}`} tone="amber" />
              <Pill text={user?.email || "—"} tone="emerald" />
            </div>
            <div style={{ marginTop: 8, color: "#475569", fontSize: 13 }}>
              Phiên đang hoạt động • Bảo mật tài khoản được ưu tiên
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              border: 0,
              padding: "10px 14px",
              borderRadius: 12,
              background: "#ef4444",
              color: "#fff",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 6px 14px rgba(239,68,68,.35)",
              transition: "transform .08s ease, filter .15s ease",
              filter: "drop-shadow(0 2px 6px rgba(239,68,68,.25))",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.03) drop-shadow(0 4px 10px rgba(239,68,68,.35))")}
            onMouseLeave={(e) => (e.currentTarget.style.filter = "drop-shadow(0 2px 6px rgba(239,68,68,.25))")}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(.98)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            aria-label="Đăng xuất"
            title="Đăng xuất"
          >
            Đăng xuất
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            marginTop: 18,
            display: "grid",
            gridTemplateColumns: "1.2fr .8fr",
            gap: 18,
          }}
        >
          {/* Mobile responsive: 1 cột */}
          <style>{`
            @media (max-width: 860px) {
              .grid-2col { grid-template-columns: 1fr !important; }
            }
          `}</style>
          <div className="grid-2col" style={{ display: "contents" }} />

          {/* Thông tin hồ sơ */}
          <div
            style={{
              padding: 20,
              borderRadius: 18,
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              boxShadow: "0 6px 20px rgba(2,6,23,.05)",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 900,
                color: "#0f172a",
                letterSpacing: "-0.01em",
              }}
            >
              Tổng quan tài khoản
            </h2>
            <p style={{ margin: "6px 0 16px", color: "#334155" }}>
              Thông tin hồ sơ và trạng thái đăng nhập.
            </p>

            <div style={{ display: "grid", gap: 12 }}>
              <Row label="Tên hiển thị" value={user?.name ?? "—"} />
              <Row label="E-mail" value={user?.email ?? "—"} />
              <Row label="ID người dùng" value={user?.id ?? user?._id ?? "—"} />
            </div>
          </div>

          {/* Thống kê nhanh */}
          <div
            style={{
              padding: 20,
              borderRadius: 18,
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              boxShadow: "0 6px 20px rgba(2,6,23,.05)",
            }}
          >
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
              Trạng thái & lối tắt
            </h3>

            <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
              <InsightCard
                title="Đơn hàng của tôi"
                value="—"
                hint={<Link to="/me/orders">Xem chi tiết</Link>}
                color="sky"
                icon="🧾"
              />
              <InsightCard
                title="Đơn đã hủy"
                value="—"
                hint={<Link to="/canceled-orders">Xem chi tiết</Link>}
                color="rose"
                icon="🚫"
              />
              <InsightCard
                title="Sản phẩm yêu thích"
                value="—"
                hint={<Link to="/wishlist">Xem chi tiết</Link>}
                color="emerald"
                icon="❤️"
              />
            </div>
          </div>
        </div>

        {/* Footer nhỏ */}
        <div
          style={{
            marginTop: 20,
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
            color: "#475569",
          }}
        >
          <span>© {new Date().getFullYear()}</span>
          <Link to="/" style={{ color: "#0ea5e9", fontWeight: 700 }}>
            ← Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ===== Sub-components (UI) – chỉ giao diện, không đổi logic ===== */

function Pill({ text, tone = "slate" }) {
  const tones = {
    amber: { bg: "#fef3c7", fg: "#92400e", bd: "#f59e0b33" },
    emerald: { bg: "#d1fae5", fg: "#065f46", bd: "#10b98133" },
    slate: { bg: "#e2e8f0", fg: "#0f172a", bd: "#64748b33" },
  };
  const t = tones[tone] || tones.slate;
  return (
    <span
      style={{
        padding: "6px 12px",
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 700,
        background: t.bg,
        color: t.fg,
        border: `1px solid ${t.bd}`,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: t.fg,
          opacity: 0.6,
        }}
      />
      {text}
    </span>
  );
}

function Row({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        padding: "12px 16px",
        borderRadius: 14,
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
      }}
    >
      <span style={{ fontSize: 13, color: "#475569" }}>{label}</span>
      <span
        style={{
          fontSize: 13,
          fontWeight: 800,
          color: "#0f172a",
          maxWidth: "70%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          textAlign: "right",
        }}
        title={String(value)}
      >
        {String(value)}
      </span>
    </div>
  );
}

function InsightCard({ title, value, hint, color, icon = "•" }) {
  const tones = {
    sky: {
      bg: "#e0f2fe",
      title: "#075985",
      value: "#0284c7",
      hint: "#0369a1",
      bd: "#38bdf833",
    },
    rose: {
      bg: "#ffe4e6",
      title: "#9f1239",
      value: "#e11d48",
      hint: "#be123c",
      bd: "#fb718533",
    },
    emerald: {
      bg: "#d1fae5",
      title: "#065f46",
      value: "#10b981",
      hint: "#047857",
      bd: "#34d39933",
    },
  };
  const t = tones[color] || tones.sky;

  return (
    <div
      style={{
        padding: 14,
        borderRadius: 16,
        background: t.bg,
        border: `1px solid ${t.bd}`,
        boxShadow: "0 6px 18px rgba(2,6,23,.06)",
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        gap: 12,
        alignItems: "center",
      }}
    >
      <div
        aria-hidden
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          background: "#ffffffaa",
          border: "1px solid #e2e8f0",
          display: "grid",
          placeItems: "center",
          fontSize: 18,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 13, color: t.title, fontWeight: 700 }}>{title}</div>
        <div style={{ marginTop: 4, fontSize: 22, fontWeight: 900, color: t.value }}>
          {value}
        </div>
        <div style={{ marginTop: 6, fontSize: 13, color: t.hint }}>{hint}</div>
      </div>
    </div>
  );
}
