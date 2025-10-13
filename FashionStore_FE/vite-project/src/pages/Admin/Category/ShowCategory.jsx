import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000/api";
const APP_BASE = API_BASE.replace(/\/api$/, "");
const PLACEHOLDER = `${APP_BASE}/assets/images/no-image.png`;

// helpers
const pick = (...xs) => xs.find((x) => x !== undefined && x !== null && x !== "") ?? undefined;
const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

function normalizeCategory(c) {
  if (!c) return null;
  return {
    id: c.id,
    name: pick(c.name, c.title, ""),
    slug: pick(c.slug, c.Slug, ""),
    image_url: c.image_url,
    image: c.image,
    parent_id: num(c.parent_id, null),
    sort_order: num(c.sort_order, null),
    status: num(c.status, 1),
    description: pick(c.description, c.desc, ""),
    created_at: c.created_at,
    updated_at: c.updated_at,
    product_count: num(c.product_count, 0),
  };
}

function normalizeProduct(p) {
  if (!p) return null;
  return {
    id: p.id,
    name: pick(p.name, p.title, `#${p.id}`),
    slug: pick(p.slug, ""),
    price_root: num(p.price_root ?? p.regular_price ?? p.root_price, 0),
    price_sale: num(p.price_sale ?? p.price ?? p.sale_price, 0),
    qty: num(p.qty ?? p.stock ?? 0, 0),
    image:
      p.thumbnail_url ||
      (p.thumbnail ? `${APP_BASE}/storage/${p.thumbnail}` : p.image_url || p.image) ||
      PLACEHOLDER,
  };
}

export default function ShowCategory() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [cat, setCat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // state cho danh sách SP của danh mục
  const [showProducts, setShowProducts] = useState(false);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [errProducts, setErrProducts] = useState("");

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErr("");

        const res = await fetch(`${API_BASE}/categories/${id}`, {
          signal: ac.signal,
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setCat(normalizeCategory(data));
      } catch (e) {
        if (e.name !== "AbortError") setErr("Không tải được chi tiết danh mục.");
      } finally {
        setLoading(false);
      }
    })();

    // reset state khi đổi id
    setShowProducts(false);
    setProducts([]);
    setErrProducts("");

    return () => ac.abort();
  }, [id]);

  const fetchCategoryProducts = async () => {
    setLoadingProducts(true);
    setErrProducts("");
    try {
      const res = await fetch(`${API_BASE}/categories/${id}/products?per_page=-1`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.json();
      const list = (Array.isArray(raw) ? raw : raw?.data ?? []).map(normalizeProduct);
      setProducts(list);
    } catch (e) {
      setErrProducts("Không tải được sản phẩm của danh mục.");
    } finally {
      setLoadingProducts(false);
    }
  };

  const toggleProducts = async () => {
    const next = !showProducts;
    setShowProducts(next);
    if (next && products.length === 0) {
      await fetchCategoryProducts();
    }
  };

  if (loading) return <div style={{ padding: 20 }}>Đang tải…</div>;
  if (err) return <div style={{ padding: 20, color: "red" }}>{err}</div>;
  if (!cat) return <div style={{ padding: 20 }}>Không tìm thấy danh mục.</div>;

  const imgSrc =
    cat.image_url ||
    (cat.image ? `${APP_BASE}/storage/${cat.image}` : PLACEHOLDER);

  return (
    <section
      style={{
        padding: 20,
        background: "rgba(255,255,255,0.92)",
        borderRadius: 16,
        boxShadow: "0 8px 20px rgba(3,10,27,.15)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#111827" }}>
          Chi tiết danh mục #{cat.id}
        </h1>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: "8px 12px",
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              color: "#fff",
              background: "linear-gradient(90deg,#16a34a,#22c55e)",
            }}
          >
            ← Quay lại
          </button>
         
        </div>
      </div>

      {/* Grid 2 cột: ảnh + thông tin */}
      <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 24 }}>
        <div>
          <img
            src={imgSrc}
            alt={cat.name}
            onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
            style={{
              width: "100%",
              aspectRatio: "4/3",
              objectFit: "cover",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
            }}
          />

          {/* NÚT: Sản phẩm của danh mục */}
          <button
            onClick={toggleProducts}
            style={{
              marginTop: 12,
              width: "100%",
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #d1fae5",
              background: showProducts
                ? "linear-gradient(90deg,#16a34a,#22c55e)"
                : "#f0fdf4",
              color: showProducts ? "#fff" : "#065f46",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {showProducts ? "Ẩn" : "Hiện"} sản phẩm của danh mục
            {"  "}
            <span style={{ opacity: 0.9 }}>
              ({cat.product_count ?? products.length})
            </span>
          </button>
        </div>

        <div style={{ display: "grid", gap: 8, color: "#111827" }}>
          <Row label="Tên">{cat.name}</Row>
          <Row label="Slug">{cat.slug || "-"}</Row>
          <Row label="Parent ID">{cat.parent_id ?? "-"}</Row>
          <Row label="Thứ tự">{cat.sort_order ?? "-"}</Row>
          <Row label="Trạng thái">{Number(cat.status) === 1 ? "Hoạt động" : "Ẩn"}</Row>
          <Row label="Mô tả">
            <div style={{ whiteSpace: "pre-line", color: "#374151" }}>
              {cat.description || "Chưa có mô tả."}
            </div>
          </Row>
        </div>
      </div>

      {/* Danh sách sản phẩm (table-like) */}
      {showProducts && (
        <div style={{ marginTop: 24 }}>
          {loadingProducts ? (
            <div style={{ padding: 12 }}>Đang tải sản phẩm…</div>
          ) : errProducts ? (
            <div style={{ padding: 12, color: "#d32f2f" }}>{errProducts}</div>
          ) : products.length === 0 ? (
            <div style={{ padding: 12, color: "#6b7280" }}>Danh mục chưa có sản phẩm.</div>
          ) : (
            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "80px 1fr 1fr 120px 120px 90px 90px",
                  padding: "12px 16px",
                  fontWeight: 700,
                  background: "#f9fafb",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <div>ID</div>
                <div>Tên</div>
                <div>Slug</div>
                <div>Giá gốc</div>
                <div>Giá sale</div>
                <div>Tồn kho</div>
                <div>Ảnh</div>
              </div>

              {products.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "80px 1fr 1fr 120px 120px 90px 90px",
                    padding: "12px 16px",
                    alignItems: "center",
                    borderBottom: "1px solid #f3f4f6",
                  }}
                >
                  <div>{p.id}</div>
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.name}
                  </div>
                  <div style={{ color: "#6b7280" }}>{p.slug || "-"}</div>
                  <div>₫{p.price_root.toLocaleString("vi-VN")}</div>
                  <div>₫{p.price_sale.toLocaleString("vi-VN")}</div>
                  <div>{p.qty}</div>
                  <div>
                    <img
                      src={p.image || PLACEHOLDER}
                      onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
                      alt={p.name}
                      style={{
                        width: 64,
                        height: 48,
                        objectFit: "cover",
                        borderRadius: 6,
                        border: "1px solid #e5e7eb",
                      }}
                    />
                  </div>
                 
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function Row({ label, children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 12 }}>
      <div style={{ color: "#6b7280", fontWeight: 700 }}>{label}</div>
      <div>{children}</div>
    </div>
  );
}
