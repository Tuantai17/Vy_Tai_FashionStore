import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000";
const PLACEHOLDER = "https://placehold.co/400x300?text=No+Image";
const VND = new Intl.NumberFormat("vi-VN");

export default function ProductDetail({ addToCart }) {
  const { id } = useParams();
  const navigate = useNavigate(); // ✅ hook phải ở trong component

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErr("");

        // 1) Chi tiết sản phẩm
        const res = await fetch(`${API_BASE}/products/${id}`, { signal: ac.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setProduct(data);

        // 2) Sản phẩm liên quan
        if (data?.category_id) {
          const r = await fetch(`${API_BASE}/categories/${data.category_id}/products`, { signal: ac.signal });
          if (r.ok) {
            const all = await r.json();
            const list = (Array.isArray(all) ? all : all?.data ?? [])
              .filter(x => x.id !== Number(id))
              .slice(0, 8);
            setRelated(list);
          }
        }
      } catch (e) {
        if (e.name !== "AbortError") setErr("Không tải được sản phẩm.");
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [id]);

  if (loading) return <p style={{ padding: 20 }}>Đang tải...</p>;
  if (err) return <p style={{ padding: 20, color: "red" }}>{err}</p>;
  if (!product) return <p style={{ padding: 20 }}>Sản phẩm không tồn tại.</p>;

  const price = Number(product.price ?? 0);
  const imgSrc = product.thumbnail_url || product.thumbnail || PLACEHOLDER;

  const handleAddToCart = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("⚠️ Bạn cần đăng nhập trước khi thêm sản phẩm!");
      // chuyển tới login và nhớ đường dẫn hiện tại (tuỳ chọn)
      navigate("/login", { state: { from: `/products/${id}` } });
      return;
    }
    if (typeof addToCart === "function") {
      addToCart(product);
      alert("🎉 Sản phẩm đã được thêm vào giỏ hàng!");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <Link to="/products" style={{ color: "#2e7d32" }}>← Quay lại danh sách</Link>

      <div style={{ display: "flex", gap: 24, marginTop: 20, flexWrap: "wrap" }}>
        {/* Ảnh */}
        <div style={{ flex: "1 1 300px" }}>
          <img
            src={imgSrc}
            alt={product.name}
            style={{ width: 400, maxWidth: "100%", borderRadius: 12, objectFit: "cover" }}
            onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
          />
        </div>

        {/* Thông tin */}
        <div style={{ flex: "2 1 400px" }}>
          <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 12, color: "#388e3c" }}>{product.name}</h2>
          <p style={{ fontSize: 16, marginBottom: 8, color: "#666" }}>
            {product.brand_name ?? "Chưa cập nhật"}
          </p>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#d32f2f", marginBottom: 16 }}>
            {price > 0 ? `${VND.format(price)} đ` : "Liên hệ"}
          </div>

          <button
            onClick={handleAddToCart}
            style={{
              background: "#388e3c",
              color: "#fff",
              border: 0,
              padding: "10px 16px",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 16
            }}
          >
            🛒 Thêm vào giỏ
          </button>
        </div>
      </div>

      {/* Mô tả chi tiết */}
      <div style={{ marginTop: 30 }}>
        <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 10 }}>Chi tiết sản phẩm</h3>
        <p style={{ whiteSpace: "pre-line", color: "#444" }}>
          {product.description || "Chưa có mô tả."}
        </p>
      </div>

      {/* Sản phẩm liên quan */}
      {!!related.length && (
        <div style={{ marginTop: 40 }}>
          <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: "#388e3c" }}>
            Sản phẩm liên quan
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 20
            }}
          >
            {related.map((p) => {
              const rImg = p.thumbnail_url || p.thumbnail || PLACEHOLDER;
              const rPrice = Number(p.price ?? 0);
              return (
                <Link key={p.id} to={`/products/${p.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px #e0f2f1", padding: 12 }}>
                    <div style={{ height: 130, borderRadius: 8, overflow: "hidden", background: "#f1f8e9", marginBottom: 8 }}>
                      <img
                        src={rImg}
                        alt={p.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
                        loading="lazy"
                      />
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{p.name}</div>
                    <div style={{ color: "#388e3c", fontWeight: 700 }}>
                      {rPrice > 0 ? `${VND.format(rPrice)} đ` : "Liên hệ"}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
