import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000";
const PLACEHOLDER = "https://placehold.co/300x200?text=No+Image";
const VND = new Intl.NumberFormat("vi-VN");

export default function CategoryProducts({ addToCart }) {
  const { id } = useParams(); // category id từ URL
  const [items, setItems] = useState([]);
  const [cat, setCat] = useState(null); // ✅ thông tin danh mục
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const ac = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setErr("");

        // ✅ lấy thông tin danh mục (ảnh + tên)
        const resCat = await fetch(`${API_BASE}/categories/${id}`, {
          signal: ac.signal,
        });
        if (!resCat.ok) throw new Error(`HTTP ${resCat.status}`);
        const catData = await resCat.json();
        setCat(catData);

        // ✅ lấy sản phẩm thuộc danh mục
        const resProds = await fetch(`${API_BASE}/categories/${id}/products`, {
          signal: ac.signal,
        });
        if (!resProds.ok) throw new Error(`HTTP ${resProds.status}`);

        const data = await resProds.json();
        const list = Array.isArray(data) ? data : data?.data ?? [];
        setItems(list);

      } catch (e) {
        if (e.name !== "AbortError") {
          console.error("Lỗi:", e);
          setErr("Không tải được sản phẩm hoặc danh mục.");
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
      {/* ✅ Tiêu đề + ảnh danh mục */}
      {cat && (
        <div style={{ marginBottom: 20, textAlign: "center" }}>
          <h2 style={{ marginBottom: 12, color: "#388e3c", fontSize: 26 }}>
            🌿 {cat.name}
          </h2>
          {/* {cat.image_url && (
            <img
              src={cat.image_url}
              alt={cat.name}
              style={{ maxWidth: 300, borderRadius: 12 }}
              onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
            />
          )} */}
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
            const price = Number(p.price ?? 0);
            const img =
              p.thumbnail_url || p.image_url || p.thumbnail || p.image || PLACEHOLDER;

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
                      src={img}
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
