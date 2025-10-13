import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const APP_BASE = "http://127.0.0.1:8000";
const API_BASE = `${APP_BASE}/api`;
const VND = new Intl.NumberFormat("vi-VN");

export default function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("authToken") || localStorage.getItem("token") || "";

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [totalProducts, setTotalProducts] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [lowStock, setLowStock] = useState([]);

  // ---- helpers ------------------------------------------------------------
  const authHeaders = token
    ? { Accept: "application/json", Authorization: `Bearer ${token}` }
    : { Accept: "application/json" };

  const getJson = async (url) => {
    try {
      const r = await fetch(url, { headers: authHeaders });
      if (!r.ok) return null;
      return await r.json();
    } catch {
      return null;
    }
  };

  // Lấy tổng count an toàn từ nhiều kiểu response
  const extractTotal = (j) => {
    if (!j) return null;
    if (typeof j.total === "number") return j.total;
    if (j?.meta?.total) return Number(j.meta.total);
    if (j?.meta?.pagination?.total) return Number(j.meta.pagination.total);
    if (Array.isArray(j)) return j.length;
    if (Array.isArray(j?.data)) return j.data.length; // all=1
    return null;
  };

  // Lấy mảng items an toàn
  const extractArray = (j) => {
    if (!j) return [];
    if (Array.isArray(j)) return j;
    if (Array.isArray(j.data)) return j.data;
    if (Array.isArray(j.items)) return j.items;
    return [];
  };

  // ---- load metrics -------------------------------------------------------
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr("");

        // ----- PRODUCTS -----
        // thử nhiều endpoint: admin trước, public sau
        let p =
          (await getJson(`${API_BASE}/admin/products?per_page=1`)) ||
          (await getJson(`${API_BASE}/products?per_page=1`)) ||
          (await getJson(`${API_BASE}/admin/products?all=1`)) ||
          (await getJson(`${API_BASE}/products?all=1`));

        // tổng sản phẩm
        let pTotal = extractTotal(p);
        if (pTotal == null) pTotal = extractArray(p).length;
        setTotalProducts(pTotal || 0);

        // tồn kho thấp (qty <= 10)
        // nếu BE không có filter → lấy all rồi lọc
        let pAll =
          (await getJson(`${API_BASE}/admin/products?all=1`)) ||
          (await getJson(`${API_BASE}/products?all=1`)) ||
          p;
        const arrProducts = extractArray(pAll);
        const low = arrProducts
          .filter((x) => Number(x.qty ?? x.stock ?? 0) <= 10)
          .sort((a, b) => (Number(a.qty ?? 0) - Number(b.qty ?? 0)))
          .slice(0, 8);
        setLowStock(low);

        // ----- ORDERS + REVENUE -----
        // tổng đơn hàng
        let o =
          (await getJson(`${API_BASE}/admin/orders?per_page=1`)) ||
          (await getJson(`${API_BASE}/orders?per_page=1`)) ||
          (await getJson(`${API_BASE}/admin/orders?all=1`)) ||
          (await getJson(`${API_BASE}/orders?all=1`));
        let oTotal = extractTotal(o);
        if (oTotal == null) oTotal = extractArray(o).length;
        setTotalOrders(oTotal || 0);

        // doanh thu = sum( grand_total | total | amount ) của đơn "delivered"
        // tuỳ BE: status=delivered | delivered=1 | is_delivered=1 …
        let delivered =
          (await getJson(`${API_BASE}/admin/orders?status=delivered&all=1`)) ||
          (await getJson(`${API_BASE}/orders?status=delivered&all=1`)) ||
          o; // fallback: tự lọc trong o
        const ordersArr = extractArray(delivered);
        const deliveredArr =
          ordersArr.length && delivered !== o
            ? ordersArr
            : extractArray(o).filter((ord) => {
                const s = (ord.status || ord.state || ord.order_status || "").toString().toLowerCase();
                return ["delivered", "completed", "done", "giao thành công"].some((k) => s.includes(k));
              });

        const revenue = deliveredArr.reduce((sum, it) => {
          const v = Number(
            it.grand_total ?? it.total ?? it.amount ?? it.subtotal ?? 0
          );
          return sum + (isFinite(v) ? v : 0);
        }, 0);
        setTotalRevenue(revenue);

        // ----- USERS -----
        let u =
          (await getJson(`${API_BASE}/admin/users?per_page=1`)) ||
          (await getJson(`${API_BASE}/users?per_page=1`)) ||
          (await getJson(`${API_BASE}/admin/users?all=1`)) ||
          (await getJson(`${API_BASE}/users?all=1`));
        let uTotal = extractTotal(u);
        if (uTotal == null) uTotal = extractArray(u).length;
        setTotalUsers(uTotal || 0);
      } catch (e) {
        setErr("Không tải được dữ liệu dashboard.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cards = useMemo(
    () => [
      {
        key: "products",
        label: "Tất cả sản phẩm",
        value: totalProducts.toString(),
        accent: "#3b82f6",
        onClick: () => navigate("/admin/products"),
      },
      {
        key: "orders",
        label: "Tổng đơn hàng",
        value: totalOrders.toString(),
        accent: "#f59e0b",
        onClick: () => navigate("/admin/orders"),
      },
      {
        key: "revenue",
        label: "Tổng doanh thu (đã giao)",
        value: "₫" + VND.format(totalRevenue),
        accent: "#16a34a",
        onClick: () => navigate("/admin/orders?status=delivered"),
      },
      {
        key: "users",
        label: "Tổng người dùng đã đăng ký",
        value: totalUsers.toString(),
        accent: "#8b5cf6",
        onClick: () => navigate("/admin/users"),
      },
    ],
    [totalProducts, totalOrders, totalRevenue, totalUsers, navigate]
  );

  const cardShell = {
    background: "linear-gradient(180deg, rgba(255,255,255,.92), rgba(255,255,255,.86))",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    border: "1px solid rgba(0,0,0,.06)",
    borderRadius: 14,
    boxShadow: "0 8px 18px rgba(3,10,27,.1), inset 0 1px 0 rgba(255,255,255,.5)",
  };

  if (loading) return <div style={{ padding: 16 }}>Đang tải dashboard…</div>;
  if (err) return <div style={{ padding: 16, color: "red" }}>{err}</div>;

  return (
    <section style={{ ...cardShell, padding: 18 }}>
      <h1 style={{ fontSize: 28, marginBottom: 14, fontWeight: 800, color: "#1f2937" }}>
        Dashboard
      </h1>

      {/* TOP CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(220px,1fr))",
          gap: 14,
          marginBottom: 16,
        }}
      >
        {cards.map((c) => (
          <button
            key={c.key}
            onClick={c.onClick}
            style={{
              ...cardShell,
              padding: 16,
              textAlign: "left",
              transition: "transform .15s ease, box-shadow .15s ease",
              cursor: "pointer",
              border: "none",
              background: "white",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 12px 24px rgba(3,10,27,.16)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = cardShell.boxShadow;
            }}
          >
            <div style={{ color: "#6b7280", marginBottom: 8, fontWeight: 600 }}>
              {c.label}
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: c.accent }}>{c.value}</div>
            <div
              style={{
                height: 4,
                marginTop: 10,
                borderRadius: 999,
                background: `linear-gradient(90deg, ${c.accent}, transparent)`,
                opacity: 0.35,
              }}
            />
            <div style={{ marginTop: 10, fontSize: 12, color: "#6b7280" }}>
              Xem chi tiết →
            </div>
          </button>
        ))}
      </div>

      {/* LOW STOCK */}
      <div style={{ ...cardShell, padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <strong style={{ fontSize: 16, color: "#111827" }}>
            Sản phẩm tồn kho thấp (≤ 10)
          </strong>
          <button
            onClick={() => navigate("/admin/products?low=1")}
            style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer" }}
          >
            Xem tất cả sản phẩm
          </button>
        </div>

        {lowStock.length === 0 ? (
          <div style={{ color: "#6b7280", marginTop: 8 }}>Không có sản phẩm nào dưới ngưỡng.</div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 10,
              marginTop: 10,
            }}
          >
            {lowStock.map((p) => (
              <div key={p.id} style={{ ...cardShell, padding: 12 }}>
                <div style={{ fontWeight: 700, color: "#111827", marginBottom: 4 }}>
                  {p.name || p.title || `#${p.id}`}
                </div>
                <div style={{ fontSize: 13, color: "#6b7280" }}>
                  Mã: {p.id} • SL: <b>{p.qty ?? p.stock ?? 0}</b>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
