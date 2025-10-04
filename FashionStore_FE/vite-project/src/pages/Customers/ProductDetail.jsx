import { useEffect, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000";
const PLACEHOLDER = "https://placehold.co/400x300?text=No+Image";
const CART_IMG = `${API_BASE}/assets/images/addcart.png`; // ✅ icon bay
const VND = new Intl.NumberFormat("vi-VN");

export default function ProductDetail({ addToCart }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // ========== ĐÁNH GIÁ ==========
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

  // fetch reviews + quyền
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

  // gửi review
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

  // ✅ hiệu ứng: bay icon addcart từ nút -> #cart-target
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

  // click thêm vào giỏ
  const handleAddToCart = (e) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("⚠️ Bạn cần đăng nhập trước khi thêm sản phẩm!");
      navigate("/login", { state: { from: `/products/${id}` } });
      return;
    }
    if (typeof addToCart === "function") {
      addToCart(product, { silent: true }); // tránh alert
      flyToCart(e.currentTarget);
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

          {/* ✅ truyền event cho hiệu ứng bay */}
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

      {/* ========== ĐÁNH GIÁ (UI) ========== */}
      <section style={{ marginTop: 22 }}>
        <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>Đánh giá</h3>

        {canReview && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid #cfeee3",
              background: "#f6fffb",
              color: "#111827",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Viết đánh giá
          </button>
        )}

        {showForm && (
          <form
            onSubmit={submitReview}
            style={{
              marginTop: 10,
              padding: 12,
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              background: "#fff",
            }}
          >
            <label style={{ fontWeight: 800, display: "block", marginBottom: 6 }}>
              Chấm sao
            </label>
            <select
              value={rev.rating}
              onChange={(e) => setRev((s) => ({ ...s, rating: e.target.value }))}
              style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #cbd5e1" }}
            >
              <option value={5}>★★★★★ (5)</option>
              <option value={4}>★★★★☆ (4)</option>
              <option value={3}>★★★☆☆ (3)</option>
              <option value={2}>★★☆☆☆ (2)</option>
              <option value={1}>★☆☆☆☆ (1)</option>
            </select>

            <label style={{ fontWeight: 800, display: "block", margin: "10px 0 6px" }}>
              Nội dung
            </label>
            <textarea
              rows={4}
              value={rev.comment}
              onChange={(e) => setRev((s) => ({ ...s, comment: e.target.value }))}
              placeholder="Chia sẻ trải nghiệm của bạn…"
              style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #cbd5e1" }}
            />

            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
              <button
                type="submit"
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: 0,
                  background: "#0ea5e9",
                  color: "#fff",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                Gửi đánh giá
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1px solid #e2e8f0",
                  background: "#fff",
                  color: "#111827",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Hủy
              </button>
            </div>
          </form>
        )}

        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          {reviews.length === 0 && (
            <div style={{ color: "#64748b" }}>Chưa có đánh giá.</div>
          )}
          {reviews.map((r, i) => (
            <div
              key={r.id || i}
              style={{
                background: "#fff",
                border: "1px solid #f1f5f9",
                borderRadius: 12,
                padding: 10,
              }}
            >
              <div style={{ fontWeight: 900 }}>
                {r.user?.name || r.author_name || "Ẩn danh"}{" "}
                <span style={{ color: "#f59e0b" }}>
                  {"★".repeat(r.rating || 0)}
                  {"☆".repeat(Math.max(0, 5 - (r.rating || 0)))}
                </span>
              </div>
              <div style={{ color: "#334155", marginTop: 4 }}>
                {r.comment}
              </div>
              {r.created_at && (
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                  {new Date(r.created_at).toLocaleString("vi-VN")}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
