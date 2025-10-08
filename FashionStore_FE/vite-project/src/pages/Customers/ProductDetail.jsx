import { useEffect, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000";
const PLACEHOLDER = "https://placehold.co/400x300?text=No+Image";
const CART_IMG = `${API_BASE}/assets/images/addcart.png`;
const VND = new Intl.NumberFormat("vi-VN");

export default function ProductDetail({ addToCart }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");

  const [reviews, setReviews] = useState([]);
  const [canReview, setCanReview] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [rev, setRev] = useState({ rating: 5, comment: "" });

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErr("");

        const res = await fetch(`${API_BASE}/products/${id}`, { signal: ac.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setProduct(data);

        if (data?.category_id) {
          const r = await fetch(`${API_BASE}/categories/${data.category_id}/products`, { signal: ac.signal });
          if (r.ok) {
            const all = await r.json();
            const list = (Array.isArray(all) ? all : all?.data ?? [])
              .filter((x) => x.id !== Number(id))
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

  useEffect(() => {
    const ac = new AbortController();
    const getJson = async (url, opts = {}) => {
      try {
        const r = await fetch(url, { signal: ac.signal, ...opts });
        if (r.ok) return await r.json();
      } catch {}
      return null;
    };

    (async () => {
      const endpoints = [
        `${API_BASE}/api/products/${id}/reviews`,
        `${API_BASE}/products/${id}/reviews`,
      ];
      for (const url of endpoints) {
        const d = await getJson(url);
        if (d) { setReviews(Array.isArray(d) ? d : d.data ?? []); break; }
      }
    })();

    const token = localStorage.getItem("token");
    if (token) {
      (async () => {
        const endpoints = [
          `${API_BASE}/api/products/${id}/can-review`,
          `${API_BASE}/products/${id}/can-review`,
        ];
        for (const url of endpoints) {
          const d = await getJson(url, { headers: { Authorization: `Bearer ${token}` } });
          if (d != null) { setCanReview(!!(d.can || d.allowed || d === true || d.canReview)); break; }
        }
      })();
    } else setCanReview(false);

    if (new URLSearchParams(location.search).get("review")) setShowForm(true);
    return () => ac.abort();
  }, [id, location.search]);

  const submitReview = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Vui lòng đăng nhập để đánh giá.");
      navigate("/login", { state: { from: `/products/${id}` } });
      return;
    }

    const body = JSON.stringify({
      rating: Number(rev.rating),
      comment: rev.comment.trim(),
    });

    let ok = false;
    const postEndpoints = [
      `${API_BASE}/api/products/${id}/reviews`,
      `${API_BASE}/products/${id}/reviews`,
    ];
    for (const url of postEndpoints) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body,
        });
        if (res.ok) { ok = true; break; }
      } catch {}
    }

    if (!ok) { alert("Gửi đánh giá thất bại."); return; }

    const listEndpoints = [
      `${API_BASE}/api/products/${id}/reviews`,
      `${API_BASE}/products/${id}/reviews`,
    ];
    for (const url of listEndpoints) {
      try {
        const r = await fetch(url);
        if (r.ok) { const d = await r.json(); setReviews(Array.isArray(d) ? d : d.data ?? []); break; }
      } catch {}
    }
    setShowForm(false);
    setRev({ rating: 5, comment: "" });
    alert("Đã gửi đánh giá. Cảm ơn bạn!");
  };

  if (loading) return <p style={{ padding: 20 }}>Đang tải...</p>;
  if (err) return <p style={{ padding: 20, color: "red" }}>{err}</p>;
  if (!product) return <p style={{ padding: 20 }}>Sản phẩm không tồn tại.</p>;

  const price = Number(product.price ?? 0);
  const imgSrc = product.thumbnail_url || product.thumbnail || PLACEHOLDER;

  const flyToCart = (startEl) => {
    const cartAnchor = document.getElementById("cart-target");
    if (!startEl || !cartAnchor) return;

    const s = startEl.getBoundingClientRect();
    const c = cartAnchor.getBoundingClientRect();

    const img = document.createElement("img");
    img.src = CART_IMG;
    img.alt = "cart";
    img.style.position = "fixed";
    img.style.left = s.left + s.width / 2 - 18 + "px";
    img.style.top = s.top + s.height / 2 - 18 + "px";
    img.style.width = "36px";
    img.style.height = "36px";
    img.style.borderRadius = "50%";
    img.style.zIndex = 9999;
    img.style.transition = "transform .8s cubic-bezier(.65,.05,.36,1), opacity .8s, width .8s, height .8s";
    document.body.appendChild(img);

    const dx = c.left + c.width / 2 - (s.left + s.width / 2);
    const dy = c.top + c.height / 2 - (s.top + s.height / 2);

    requestAnimationFrame(() => {
      img.style.transform = `translate(${dx}px, ${dy}px) scale(.4) rotate(20deg)`;
      img.style.opacity = "0.4";
      img.style.width = "28px";
      img.style.height = "28px";
    });

    const cleanup = () => {
      img.remove();
      cartAnchor.classList.add("cart-pulse");
      setTimeout(() => cartAnchor.classList.remove("cart-pulse"), 600);
    };
    img.addEventListener("transitionend", cleanup, { once: true });
  };

  const handleAddToCart = (e) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("⚠️ Bạn cần đăng nhập trước khi thêm sản phẩm!");
      navigate("/login", { state: { from: `/products/${id}` } });
      return;
    }
    if (typeof addToCart === "function") {
      addToCart(product, { silent: true });
      flyToCart(e.currentTarget);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px" }}>
      <Link to="/products" style={{ color: "#666", textDecoration: "none", fontSize: 14 }}>← Quay lại danh sách</Link>

      {/* Layout 2 cột: ảnh bên trái, thông tin bên phải */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, marginTop: 24 }}>
        
        {/* Cột trái: Ảnh sản phẩm */}
        <div>
          <img
            src={imgSrc}
            alt={product.name}
            style={{ 
              width: "100%", 
              maxWidth: 500,
              aspectRatio: "4/3",
              objectFit: "cover",
              borderRadius: 8,
              border: "1px solid #f0f0f0"
            }}
            onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
          />
        </div>

        {/* Cột phải: Thông tin sản phẩm */}
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 12, color: "#000", lineHeight: 1.3 }}>
            {product.name}
          </h1>

          <div style={{ fontSize: 32, fontWeight: 700, color: "#000", marginBottom: 24 }}>
            {price > 0 ? `${VND.format(price)}đ` : "Liên hệ"}
          </div>

          {/* Hiển thị số lượng tồn kho */}
          <div style={{ 
  fontSize: 14, 
  color: "#666", 
  marginBottom: 16,
  padding: "8px 12px",
  background: "#f5f5f5",
  borderRadius: 4,
  display: "inline-block"
}}>
  <span style={{ fontWeight: 500 }}>Tồn kho:</span> {product.qty ?? 0} sản phẩm
</div>

          {/* Chọn số lượng */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 14, color: "#666", marginBottom: 8 }}>
              Số lượng
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                style={{
                  width: 36,
                  height: 36,
                  border: "1px solid #ddd",
                  background: "#fff",
                  cursor: "pointer",
                  fontSize: 18,
                  borderRadius: 4
                }}
              >
                −
              </button>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                style={{
                  width: 60,
                  height: 36,
                  textAlign: "center",
                  border: "1px solid #ddd",
                  borderRadius: 4,
                  fontSize: 16
                }}
              />
              <button
                onClick={() => setQuantity(quantity + 1)}
                style={{
                  width: 36,
                  height: 36,
                  border: "1px solid #ddd",
                  background: "#fff",
                  cursor: "pointer",
                  fontSize: 18,
                  borderRadius: 4
                }}
              >
                +
              </button>
            </div>
          </div>

          {/* Nút thêm giỏ hàng */}
          <button
            onClick={handleAddToCart}
            style={{
              width: "100%",
              padding: "14px 24px",
              background: "#000",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
              marginBottom: 16,
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}
          >
            Thêm vào giỏ hàng
          </button>

          {/* Thông tin thương hiệu */}
          <div style={{ fontSize: 14, color: "#666", marginBottom: 8 }}>
            Thương hiệu: <span style={{ fontWeight: 500 }}>{product.brand_name ?? "Chưa cập nhật"}</span>
          </div>

          {/* Icon tính năng */}
          <div style={{ marginTop: 32, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            <div style={{ textAlign: "center", padding: 16, border: "1px solid #f0f0f0", borderRadius: 8 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🚚</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Free Delivery</div>
              <div style={{ fontSize: 11, color: "#999" }}>Miễn phí giao hàng</div>
            </div>
            <div style={{ textAlign: "center", padding: 16, border: "1px solid #f0f0f0", borderRadius: 8 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔄</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>14 Days Exchange</div>
              <div style={{ fontSize: 11, color: "#999" }}>Đổi trả 14 ngày</div>
            </div>
            <div style={{ textAlign: "center", padding: 16, border: "1px solid #f0f0f0", borderRadius: 8 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>⭐</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>High Quality</div>
              <div style={{ fontSize: 11, color: "#999" }}>Chất lượng cao</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab mô tả và đánh giá */}
      <div style={{ marginTop: 48, borderTop: "1px solid #e5e5e5" }}>
        <div style={{ display: "flex", gap: 32, borderBottom: "1px solid #e5e5e5" }}>
          <button 
            onClick={() => setActiveTab("description")}
            style={{ 
              padding: "16px 0", 
              background: "none", 
              border: "none", 
              borderBottom: activeTab === "description" ? "2px solid #000" : "2px solid transparent",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              color: activeTab === "description" ? "#000" : "#999"
            }}
          >
            Thông tin bổ sung
          </button>
          <button 
            onClick={() => setActiveTab("reviews")}
            style={{ 
              padding: "16px 0", 
              background: "none", 
              border: "none",
              borderBottom: activeTab === "reviews" ? "2px solid #000" : "2px solid transparent",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              color: activeTab === "reviews" ? "#000" : "#999"
            }}
          >
            Đánh giá ({reviews.length})
          </button>
        </div>

        {/* Nội dung tab */}
        <div style={{ padding: "24px 0" }}>
          {activeTab === "description" && (
            <div>
              <p style={{ fontSize: 14, color: "#666", lineHeight: 1.8, whiteSpace: "pre-line" }}>
                {product.description || "Chưa có mô tả."}
              </p>
            </div>
          )}

          {activeTab === "reviews" && (
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: "#000" }}>
                Đánh giá khách hàng
              </h3>

              {canReview && !showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 4,
                    border: "1px solid #000",
                    background: "#fff",
                    color: "#000",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: 14,
                    marginBottom: 20
                  }}
                >
                  Viết đánh giá
                </button>
              )}

              {showForm && (
                <form
                  onSubmit={submitReview}
                  style={{
                    marginBottom: 24,
                    padding: 20,
                    border: "1px solid #e5e5e5",
                    borderRadius: 8,
                    background: "#fafafa",
                  }}
                >
                  <label style={{ fontWeight: 600, display: "block", marginBottom: 8, fontSize: 14 }}>
                    Chấm sao
                  </label>
                  <select
                    value={rev.rating}
                    onChange={(e) => setRev((s) => ({ ...s, rating: e.target.value }))}
                    style={{ padding: "8px 12px", borderRadius: 4, border: "1px solid #ddd", fontSize: 14 }}
                  >
                    <option value={5}>★★★★★ (5)</option>
                    <option value={4}>★★★★☆ (4)</option>
                    <option value={3}>★★★☆☆ (3)</option>
                    <option value={2}>★★☆☆☆ (2)</option>
                    <option value={1}>★☆☆☆☆ (1)</option>
                  </select>

                  <label style={{ fontWeight: 600, display: "block", margin: "16px 0 8px", fontSize: 14 }}>
                    Nội dung
                  </label>
                  <textarea
                    rows={4}
                    value={rev.comment}
                    onChange={(e) => setRev((s) => ({ ...s, comment: e.target.value }))}
                    placeholder="Chia sẻ trải nghiệm của bạn…"
                    style={{ width: "100%", padding: 12, borderRadius: 4, border: "1px solid #ddd", fontSize: 14 }}
                  />

                  <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
                    <button
                      type="submit"
                      style={{
                        padding: "10px 20px",
                        borderRadius: 4,
                        border: "none",
                        background: "#000",
                        color: "#fff",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontSize: 14
                      }}
                    >
                      Gửi đánh giá
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      style={{
                        padding: "10px 20px",
                        borderRadius: 4,
                        border: "1px solid #ddd",
                        background: "#fff",
                        color: "#000",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontSize: 14
                      }}
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              )}

              {reviews.length === 0 ? (
                <div style={{ color: "#999", fontSize: 14 }}>Chưa có đánh giá nào.</div>
              ) : (
                <div style={{ display: "grid", gap: 16 }}>
                  {reviews.map((r, i) => (
                    <div
                      key={r.id || i}
                      style={{
                        background: "#fff",
                        border: "1px solid #f0f0f0",
                        borderRadius: 8,
                        padding: 16,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontWeight: 600, fontSize: 15, marginRight: 12, color: "#000" }}>
                          {r.user?.name || r.author_name || "Ẩn danh"}
                        </span>
                        <span style={{ color: "#ffa500", fontSize: 14 }}>
                          {"★".repeat(r.rating || 0)}
                          {"☆".repeat(Math.max(0, 5 - (r.rating || 0)))}
                        </span>
                      </div>
                      <div style={{ color: "#666", fontSize: 14, lineHeight: 1.6, marginBottom: 6 }}>
                        {r.comment}
                      </div>
                      {r.created_at && (
                        <div style={{ fontSize: 12, color: "#999" }}>
                          {new Date(r.created_at).toLocaleString("vi-VN")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sản phẩm liên quan */}
      {!!related.length && (
        <div style={{ marginTop: 64, padding: "24px 0", background: "#f5f5f5", margin: "64px -20px 0", paddingLeft: 20, paddingRight: 20 }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: "#2e7d32" }}>
            Sản phẩm liên quan
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 20
            }}
          >
            {related.map((p) => {
              const rImg = p.thumbnail_url || p.thumbnail || PLACEHOLDER;
              const rPrice = Number(p.price ?? 0);
              return (
                <Link key={p.id} to={`/products/${p.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div style={{ background: "#fff", borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                    <div style={{ aspectRatio: "3/4", background: "#fafafa", position: "relative" }}>
                      <img
                        src={rImg}
                        alt={p.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
                        loading="lazy"
                      />
                    </div>
                    <div style={{ padding: 12 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, color: "#000", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.name}
                      </div>
                      <div style={{ color: "#2e7d32", fontWeight: 700, fontSize: 16 }}>
                        {rPrice > 0 ? `${VND.format(rPrice)} đ` : "Liên hệ"}
                      </div>
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