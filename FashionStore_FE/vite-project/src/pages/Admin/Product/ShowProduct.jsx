// src/pages/Admin/Product/ShowProduct.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";

const API_BASE = "http://127.0.0.1:8000/api";
const APP_BASE = API_BASE.replace(/\/api$/, "");
const PLACEHOLDER = "https://placehold.co/600x400?text=No+Image";
const VND = new Intl.NumberFormat("vi-VN");

// ===== helpers =====
const ADMIN_TOKEN_KEY = "admin_token";
const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const pick = (...xs) => xs.find((x) => x !== undefined && x !== null && x !== "") ?? undefined;

function normalizeProduct(p) {
  if (!p) return null;
  return {
    id: p.id,
    name: pick(p.name, p.title, ""),
    slug: pick(p.slug, p.Slug, ""),
    // ids
    category_id: pick(p.category_id, p.categoryId, p.category?.id),
    brand_id: pick(p.brand_id, p.brandId, p.brand?.id),
    // names (nếu thiếu sẽ gọi thêm API ở dưới)
    category_name: pick(p.category_name, p.categoryName, p.category?.name, ""),
    brand_name: pick(p.brand_name, p.brandName, p.brand?.name, ""),
    // prices
    price_root: num(p.price_root ?? p.root_price ?? p.original_price ?? p.priceRoot),
    price_sale: num(p.price_sale ?? p.sale_price ?? p.price ?? p.salePrice),
    qty: num(p.qty ?? p.quantity ?? p.stock, 0),
    status: p.status ?? (p.is_active ? 1 : 0),
    description: pick(p.description, p.detail, p.details, ""),
    // images
    thumbnail_url: p.thumbnail_url,
    thumbnail: pick(p.thumbnail, p.image, p.image_path, p.thumbnail_path),
    created_at: p.created_at,
    updated_at: p.updated_at,
  };
}

export default function ShowProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [showReviews, setShowReviews] = useState(false);

  const safeDesc = DOMPurify.sanitize(product?.description || "", {
    USE_PROFILES: { html: true },
  });

  useEffect(() => {
    const ac = new AbortController();
    const json = async (url, opts = {}) => {
      try {
        const r = await fetch(url, { signal: ac.signal, ...opts });
        if (r.ok) return await r.json();
      } catch {}
      return null;
    };

    (async () => {
      try {
        setLoading(true);
        setErr("");

        // 1) Lấy chi tiết sản phẩm (admin) — kèm token nếu có
        const token = localStorage.getItem(ADMIN_TOKEN_KEY) || localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const raw = await json(`${API_BASE}/admin/products/${id}`, { headers });
        if (!raw) throw new Error("Không tải được chi tiết sản phẩm.");

        let p = normalizeProduct(raw);

        // 2) Nếu thiếu tên danh mục/brand thì gọi thêm API công khai lấy name
        if (!p.category_name && p.category_id) {
          const c =
            (await json(`${API_BASE}/categories/${p.category_id}`)) ||
            (await json(`${APP_BASE}/categories/${p.category_id}`));
          if (c) p.category_name = c.name || c.title || "";
        }
        if (!p.brand_name && p.brand_id) {
          const b =
            (await json(`${API_BASE}/brands/${p.brand_id}`)) ||
            (await json(`${APP_BASE}/brands/${p.brand_id}`));
          if (b) p.brand_name = b.name || b.title || "";
        }

        setProduct(p);

        // 3) Reviews (view-only)
        const rv =
          (await json(`${API_BASE}/products/${id}/reviews`)) ||
          (await json(`${APP_BASE}/products/${id}/reviews`));
        setReviews(Array.isArray(rv) ? rv : rv?.data ?? []);
      } catch (e) {
        if (e.name !== "AbortError") setErr("Không tải được chi tiết sản phẩm.");
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [id]);

  if (loading) return <div style={{ padding: 20 }}>Đang tải…</div>;
  if (err) return <div style={{ padding: 20, color: "red" }}>{err}</div>;
  if (!product) return <div style={{ padding: 20 }}>Không tìm thấy sản phẩm.</div>;

  const imgSrc =
    product.thumbnail_url ||
    (product.thumbnail ? `${APP_BASE}/storage/${product.thumbnail}` : PLACEHOLDER);

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#111827" }}>
          Chi tiết sản phẩm #{product.id}
        </h1>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 10, color: "#fff", background: "linear-gradient(90deg,#16a34a,#22c55e)" }}
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
            alt={product.name}
            onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
            style={{
              width: "100%",
              aspectRatio: "4/3",
              objectFit: "cover",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
            }}
          />

          {/* Nút dưới ảnh */}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              onClick={() => setShowReviews((s) => !s)}
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                background: showReviews ? "linear-gradient(90deg,#16a34a,#22c55e)" : "#f9fafb",
                color: showReviews ? "#fff" : "#111827",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {showReviews ? "Ẩn đánh giá" : "Đánh giá"} ({reviews.length})
            </button>

            <button
              onClick={() => navigate(`/admin/categories/${product.category_id}`)}
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #d1fae5",
                background: "#f0fdf4",
                color: "#065f46",
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={product.category_name || "Danh mục"}
            >
              Danh mục: {product.category_name || "-"}
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gap: 8, color: "#111827" }}>
          <Row label="Tên">{product.name}</Row>
          <Row label="Slug">{product.slug || "-"}</Row>
          <Row label="Danh mục">{product.category_name || "-"}</Row>
          <Row label="Thương hiệu">{product.brand_name || "-"}</Row>

          <Row label="Giá gốc">{product.price_root ? `${VND.format(product.price_root)} đ` : "0 đ"}</Row>
          <Row label="Giá sale">{product.price_sale ? `${VND.format(product.price_sale)} đ` : "0 đ"}</Row>
          <Row label="Tồn kho">{product.qty ?? 0}</Row>
          <Row label="Trạng thái">{Number(product.status) === 1 ? "Hoạt động" : "Ẩn"}</Row>
          <Row label="Mô tả">
            <div
              className="admin-rich"
              dangerouslySetInnerHTML={{
                __html: safeDesc || "<em>Chưa có mô tả.</em>",
              }}
            />
          </Row>
        </div>
      </div>

      {/* Đánh giá (toggle) */}
      {showReviews && (
        <div style={{ marginTop: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12, color: "#111827" }}>
            Đánh giá của khách ({reviews.length})
          </h2>

          {reviews.length === 0 ? (
            <div style={{ color: "#6b7280" }}>Chưa có đánh giá.</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {reviews.map((r, i) => (
                <div
                  key={r.id || i}
                  style={{
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 10,
                    padding: 12,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ fontWeight: 700 }}>{r.user?.name || r.author_name || "Ẩn danh"}</div>
                    <div style={{ color: "#f59e0b" }}>
                      {"★".repeat(r.rating || 0)}
                      {"☆".repeat(Math.max(0, 5 - (r.rating || 0)))}
                    </div>
                  </div>
                  <div style={{ color: "#374151", lineHeight: 1.6 }}>{r.comment}</div>
                  {r.created_at && (
                    <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>
                      {new Date(r.created_at).toLocaleString("vi-VN")}
                    </div>
                  )}
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
