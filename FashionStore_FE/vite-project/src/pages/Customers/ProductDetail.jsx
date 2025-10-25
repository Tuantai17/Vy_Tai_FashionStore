// src/pages/Customers/ProductDetail.jsx
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import DOMPurify from "dompurify";
import ProductCard from "../../components/ProductCard";
import { getCustomerToken } from "../../utils/authStorage";

const APP_BASE = "http://127.0.0.1:8000";
const API_BASE = `${APP_BASE}/api`;
const PLACEHOLDER = "https://placehold.co/400x300?text=No+Image";
const CART_IMG = `${APP_BASE}/assets/images/addcart.png`;
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
  const [brandName, setBrandName] = useState("");
  const [categoryName, setCategoryName] = useState("");

  // ---- Review form states
  const [canReview, setCanReview] = useState(null); // true/false/null(unknown)
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Nếu có ?review=1 thì nhảy sang tab "reviews"
  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    if (sp.get("review") === "1") {
      setActiveTab("reviews");
    }
  }, [location.search]);

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
      try {
        setLoading(true);
        setErr("");

        // product (prefer /api)
        const productEndpoints = [
          `${API_BASE}/products/${id}`,
          `${APP_BASE}/products/${id}`,
        ];
        let data = null;
        for (const url of productEndpoints) {
          data = await getJson(url);
          if (data) break;
        }
        if (!data) throw new Error("Không tải được sản phẩm.");
        setProduct(data);

        // ---- Brand name
        if (data.brand_name) setBrandName(data.brand_name);
        else if (data.brand?.name) setBrandName(data.brand.name);
        else if (data.brand_id) {
          const brandEndpoints = [
            `${API_BASE}/brands/${data.brand_id}`,
            `${APP_BASE}/brands/${data.brand_id}`,
          ];
          for (const url of brandEndpoints) {
            const b = await getJson(url);
            if (b?.name) {
              setBrandName(b.name);
              break;
            }
          }
        } else {
          setBrandName("Chưa cập nhật");
        }

        // ---- Category name
        if (data.category_name) setCategoryName(data.category_name);
        else if (data.category?.name) setCategoryName(data.category.name);
        else if (data.category_id) {
          const catEndpoints = [
            `${API_BASE}/categories/${data.category_id}`,
            `${APP_BASE}/categories/${data.category_id}`,
          ];
          for (const url of catEndpoints) {
            const c = await getJson(url);
            const name = c?.name || c?.data?.name;
            if (name) {
              setCategoryName(name);
              break;
            }
          }
        } else {
          setCategoryName("");
        }

        // related
        if (data?.category_id) {
          const relatedEndpoints = [
            `${API_BASE}/categories/${data.category_id}/products?all=1`,
            `${APP_BASE}/categories/${data.category_id}/products?all=1`,
          ];
          let rel = null;
          for (const url of relatedEndpoints) {
            rel = await getJson(url);
            if (rel) break;
          }
          if (rel) {
            const list = (Array.isArray(rel) ? rel : rel?.data ?? [])
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

  // Load reviews
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
      const endpoints = [
        `${API_BASE}/products/${id}/reviews`,
        `${APP_BASE}/products/${id}/reviews`,
      ];
      for (const url of endpoints) {
        const d = await getJson(url);
        if (d) {
          setReviews(Array.isArray(d) ? d : d.data ?? []);
          break;
        }
      }
    })();

    return () => ac.abort();
  }, [id]);

  // Check quyền review (nếu backend có API can-review)
  useEffect(() => {
    const token = getCustomerToken();
    if (!token) {
      setCanReview(false);
      return;
    }
    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/products/${id}/can-review`, {
          method: "GET",
          signal: ac.signal,
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const d = await res.json();
          const val = d.canReview ?? d.can ?? d.allowed;
          // nếu API trả undefined thì coi như cho phép
          setCanReview(typeof val === "boolean" ? val : true);
        } else {
          // nếu API không có/ lỗi → không chặn
          setCanReview(true);
        }
      } catch {
        setCanReview(true);
      }
    })();
    return () => ac.abort();
  }, [id]);

  if (loading) return <p style={{ padding: 20 }}>Đang tải...</p>;
  if (err) return <p style={{ padding: 20, color: "red" }}>{err}</p>;
  if (!product) return <p style={{ padding: 20 }}>Sản phẩm không tồn tại.</p>;

  const price = Number(product.price ?? 0);
  const imgSrc = product.thumbnail_url
    ? product.thumbnail_url
    : product.thumbnail
    ? `${APP_BASE}/storage/${product.thumbnail}`
    : PLACEHOLDER;

  // fly-to-cart
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
    img.style.transition =
      "transform .8s cubic-bezier(.65,.05,.36,1), opacity .8s, width .8s, height .8s";
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
    const token = getCustomerToken();
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

  const qtyBtnStyle = {
    width: 36,
    height: 36,
    border: "1px solid #22c55e",
    background: "#e8f5e9",
    color: "#166534",
    cursor: "pointer",
    fontSize: 18,
    borderRadius: 6,
    fontWeight: 700,
  };

  const safeDesc = DOMPurify.sanitize(product.description || "");

  // ---- submit review
  const submitReview = async (e) => {
    e.preventDefault();
    const token = getCustomerToken();
    if (!token) {
      alert("Vui lòng đăng nhập để đánh giá.");
      navigate("/login", { state: { from: `/products/${id}?review=1` } });
      return;
    }
    if (!rating || !comment.trim()) {
      alert("Vui lòng chọn số sao và nhập nội dung.");
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE}/products/${id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating: Number(rating), comment: comment.trim() }),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || "Không gửi được đánh giá.");
      }
      const d = await res.json().catch(() => ({}));
      const newReview = d.data || d.review || {
        id: Date.now(),
        rating: Number(rating),
        comment: comment.trim(),
        user: { name: "Bạn" },
        created_at: new Date().toISOString(),
      };
      setReviews((prev) => [newReview, ...prev]);
      setComment("");
      setRating(5);
      alert("✅ Cảm ơn bạn đã đánh giá!");
    } catch (e2) {
      alert("❌ " + (e2.message || "Gửi đánh giá thất bại."));
    } finally {
      setSubmitting(false);
    }
  };

  // Có hiển thị form không?
  const searchWantsReview = new URLSearchParams(location.search).get("review") === "1";
  const isLoggedIn = !!getCustomerToken();
  const showReviewForm =
    activeTab === "reviews" &&
    isLoggedIn &&
    (canReview === null ? true : !!canReview) && // nếu backend không rõ → cho hiện
    searchWantsReview;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px" }}>
      <Link to="/products" style={{ color: "#666", textDecoration: "none", fontSize: 14 }}>
        ← Quay lại danh sách
      </Link>

      {/* layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, marginTop: 24 }}>
        {/* image */}
        <div>
          <img
            src={imgSrc}
            alt={product.name}
            style={{ width: "100%", maxWidth: 500, aspectRatio: "4/3", objectFit: "cover", borderRadius: 8, border: "1px solid #f0f0f0" }}
            onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
          />
        </div>

        {/* info */}
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 12, color: "#000", lineHeight: 1.3 }}>
            {product.name}
          </h1>

          <div style={{ fontSize: 32, fontWeight: 700, color: "#000", marginBottom: 8 }}>
            {price > 0 ? `${VND.format(price)}đ` : "Liên hệ"}
          </div>

          {/* category + brand */}
          <div style={{ fontSize: 14, color: "#555", marginBottom: 16 }}>
            <div>Danh mục: <span style={{ fontWeight: 600 }}>{categoryName || "Chưa cập nhật"}</span></div>
            <div>Thương hiệu: <span style={{ fontWeight: 600 }}>{brandName || "Chưa cập nhật"}</span></div>
          </div>

          {/* stock */}
          <div style={{ fontSize: 14, color: "#666", marginBottom: 16, padding: "8px 12px", background: "#f5f5f5", borderRadius: 4, display: "inline-block" }}>
            <span style={{ fontWeight: 500 }}>Tồn kho:</span> {product.qty ?? 0} sản phẩm
          </div>

          {/* quantity */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 14, color: "#666", marginBottom: 8 }}>Số lượng</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={qtyBtnStyle}>−</button>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                style={{ width: 60, height: 36, textAlign: "center", border: "1px solid #ddd", borderRadius: 6, fontSize: 16 }}
              />
              <button onClick={() => setQuantity(quantity + 1)} style={qtyBtnStyle}>+</button>
            </div>
          </div>

          {/* add to cart */}
          <button
            onClick={handleAddToCart}
            style={{
              width: "100%",
              padding: "14px 24px",
              background: "#16a34a",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              marginBottom: 16,
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}
          >
            Thêm vào giỏ hàng
          </button>

          {/* feature icons */}
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

      {/* CSS lưới cho related */}
      <style>{`
        .related-grid{
          display:grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 20px;
        }
        @media (max-width: 1024px){
          .related-grid{ grid-template-columns: repeat(3, minmax(0,1fr)); }
        }
        @media (max-width: 768px){
          .related-grid{ grid-template-columns: repeat(2, minmax(0,1fr)); }
        }
        @media (max-width: 480px){
          .related-grid{ grid-template-columns: repeat(1, minmax(0,1fr)); }
        }
      `}</style>

      {/* Tabs */}
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
              color: activeTab === "description" ? "#000" : "#999",
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
              color: activeTab === "reviews" ? "#000" : "#999",
            }}
          >
            Đánh giá ({reviews.length})
          </button>
          <button
            onClick={() => setActiveTab("related")}
            style={{
              padding: "16px 0",
              background: "none",
              border: "none",
              borderBottom: activeTab === "related" ? "2px solid #000" : "2px solid transparent",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              color: activeTab === "related" ? "#000" : "#999",
            }}
          >
            Sản phẩm liên quan ({related.length})
          </button>
        </div>

        {activeTab === "description" && (
          <div
            className="product-rich"
            dangerouslySetInnerHTML={{ __html: safeDesc || "<em>Chưa có mô tả.</em>" }}
          />
        )}

        {activeTab === "reviews" && (
          <div>
            {/* FORM ĐÁNH GIÁ — hiện khi ?review=1 + đã đăng nhập + (canReview true hoặc null) */}
            {showReviewForm && (
              <form
                onSubmit={submitReview}
                style={{
                  background: "#f8fff9",
                  border: "1px solid #dcfce7",
                  borderRadius: 8,
                  padding: 16,
                  margin: "16px 0",
                }}
              >
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10 }}>
                  <label style={{ fontWeight: 700 }}>Chấm sao:</label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #ccc" }}
                  >
                    {[5,4,3,2,1].map((s) => (
                      <option key={s} value={s}>{s} ★</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontWeight: 700, display: "block", marginBottom: 6 }}>Nhận xét</label>
                  <textarea
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Hãy chia sẻ trải nghiệm của bạn…"
                    style={{ width: "100%", borderRadius: 8, border: "1px solid #ccc", padding: 10 }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: "10px 16px",
                    background: "#16a34a",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {submitting ? "Đang gửi..." : "Gửi đánh giá"}
                </button>
              </form>
            )}

            {/* Gợi ý đăng nhập / không đủ điều kiện */}
            {activeTab === "reviews" && !isLoggedIn && (
              <div style={{ margin: "12px 0", color: "#444" }}>
                Vui lòng <Link to={`/login?next=/products/${id}%3Freview%3D1`} style={{ color: "#16a34a" }}>đăng nhập</Link> để đánh giá sản phẩm.
              </div>
            )}
            {activeTab === "reviews" && isLoggedIn && canReview === false && (
              <div style={{ margin: "12px 0", color: "#666" }}>
                Bạn chưa đủ điều kiện để đánh giá sản phẩm này.
              </div>
            )}

            <h3 style={{ fontSize: 20, fontWeight: 700, margin: "16px 0", color: "#000" }}>
              Đánh giá khách hàng
            </h3>

            {reviews.length === 0 ? (
              <div style={{ color: "#999", fontSize: 14 }}>Chưa có đánh giá nào.</div>
            ) : (
              <div style={{ display: "grid", gap: 16 }}>
                {reviews.map((r, i) => (
                  <div
                    key={r.id || i}
                    style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: 8, padding: 16 }}
                  >
                    <div style={{ display: "flex", alignItems: "center", marginBottom: 8, gap: 12 }}>
                      <span style={{ fontWeight: 600, fontSize: 15, color: "#000" }}>
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

        {activeTab === "related" && (
          <div style={{ paddingTop: 20 }}>
            {related.length === 0 ? (
              <div style={{ color: "#999", fontSize: 14 }}>Không có sản phẩm liên quan.</div>
            ) : (
              <div className="related-grid">
                {related.map((p) => (
                  <ProductCard key={p.id} p={p} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}



