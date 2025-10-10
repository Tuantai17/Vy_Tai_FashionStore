import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

const APP_BASE = "http://127.0.0.1:8000";
const API_BASE = `${APP_BASE}/api`;

const PLACEHOLDER = "https://placehold.co/300x200?text=No+Image";
const VND = new Intl.NumberFormat("vi-VN");

export default function CategoryProducts({ addToCart }) {
  const { id } = useParams(); // category id từ URL
  const [items, setItems] = useState([]);
  const [cat, setCat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const ac = new AbortController();

    const getJson = async (url) => {
      try {
        const r = await fetch(url, { signal: ac.signal });
        if (r.ok) return await r.json();
      } catch {}
      return null;
    };

    (async () => {
      try {
        setLoading(true);
        setErr("");

        // ✅ Lấy thông tin danh mục: ưu tiên /api, fallback route cũ nếu có
        const catEndpoints = [
          `${API_BASE}/categories/${id}`,
          `${APP_BASE}/categories/${id}`,
        ];
        let catData = null;
        for (const url of catEndpoints) {
          catData = await getJson(url);
          if (catData) break;
        }
        if (!catData) throw new Error("cat-not-found");
        // Hỗ trợ cả dạng {data:{...}}
        setCat(Array.isArray(catData) ? catData[0] : catData.data ?? catData);

        // ✅ Lấy sản phẩm theo danh mục
        const prodEndpoints = [
          // thêm ?all=1 để FE nhận mảng phẳng
          `${API_BASE}/categories/${id}/products?all=1`,
          `${API_BASE}/products/category/${id}?all=1`, // alias
          // fallback nếu backend không hỗ trợ all
          `${API_BASE}/categories/${id}/products`,
          `${API_BASE}/products/category/${id}`,
          `${APP_BASE}/categories/${id}/products`,
        ];

        let data = null;
        for (const url of prodEndpoints) {
          data = await getJson(url);
          if (data) break;
        }
        if (!data) throw new Error("products-not-found");

        const list = Array.isArray(data) ? data : data.data ?? [];
        setItems(list);
      } catch (e) {
        if (e.name !== "AbortError") {
          setErr("Không tải được sản phẩm hoặc danh mục.");
          setItems([]);
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [id]);

  if (loading) return <p style={{ padding: 20 }}>Đang tải...</p>;
  if (err) return <p style={{ padding: 20, color: "#d32f2f" }}>{err}</p>;

  return (
    <div style={{ padding: 20 }}>
      {/* ✅ Tiêu đề danh mục */}
      {cat && (
        <div style={{ marginBottom: 20, textAlign: "center" }}>
          <h2 style={{ marginBottom: 12, color: "#388e3c", fontSize: 26 }}>
            🌿 {cat.name}
          </h2>
        </div>
      )}

      <p style={{ marginBottom: 16 }}>
        <Link to="/products" style={{ color: "#2e7d32" }}>
          ← Xem tất cả sản phẩm
        </Link>
      </p>

      {items.length === 0 ? (
        <p>Không có sản phẩm.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 20,
          }}
        >
          {items.map((p) => {
            const price = Number(p.price ?? p.price_sale ?? 0);
            const thumb =
              p.thumbnail_url
                ? p.thumbnail_url
                : p.thumbnail
                ? `${APP_BASE}/storage/${p.thumbnail}`
                : p.image_url || p.image || PLACEHOLDER;

            return (
              <div
                key={p.id}
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  boxShadow: "0 2px 8px #e0f2f1",
                  padding: 16,
                  textAlign: "center",
                }}
              >
                <Link
                  to={`/products/${p.id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div
                    style={{
                      height: 140,
                      borderRadius: 8,
                      overflow: "hidden",
                      marginBottom: 10,
                      background: "#f1f8e9",
                    }}
                  >
                    <img
                      src={thumb}
                      alt={p.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
                      loading="lazy"
                    />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 600, color: "#2e7d32" }}>
                    {p.name}
                  </h3>
                </Link>

                <div style={{ fontWeight: 700, color: "#388e3c", marginTop: 6 }}>
                  {price > 0 ? `${VND.format(price)} đ` : "Liên hệ"}
                </div>

                {typeof addToCart === "function" && (
                  <button
                    onClick={() => addToCart(p)}
                    style={{
                      marginTop: 10,
                      background: "#388e3c",
                      color: "#fff",
                      border: 0,
                      padding: "8px 12px",
                      borderRadius: 8,
                      cursor: "pointer",
                    }}
                  >
                    + Thêm vào giỏ
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
