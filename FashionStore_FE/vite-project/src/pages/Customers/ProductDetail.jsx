import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";

const APP_BASE = "http://127.0.0.1:8000";
const API_BASE = `${APP_BASE}/api`;
const PLACEHOLDER = "https://placehold.co/400x300?text=No+Image";
const CART_IMG = `${APP_BASE}/assets/images/addcart.png`;
const VND = new Intl.NumberFormat("vi-VN");

export default function ProductDetail({ addToCart }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");

  // Reviews (view-only)
  const [reviews, setReviews] = useState([]);

  // NEW: brand & category names
  const [brandName, setBrandName] = useState("");
  const [categoryName, setCategoryName] = useState("");

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
            `${API_BASE}/categories/${data.category_id}/products`,
            `${APP_BASE}/categories/${data.category_id}/products`,
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

  // styles for +/- buttons
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

          {/* NEW: category + brand */}
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
                style={{
                  width: 60,
                  height: 36,
                  textAlign: "center",
                  border: "1px solid #ddd",
                  borderRadius: 6,
                  fontSize: 16
                }}
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
        </div>

        {activeTab === "description" && (
          <div
            className="product-rich"
            dangerouslySetInnerHTML={{ __html: safeDesc || "<em>Chưa có mô tả.</em>" }}
          />
        )}

        {activeTab === "reviews" && (
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: "#000" }}>
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

      {/* related */}
      {!!related.length && (
        <div
          style={{
            marginTop: 64,
            padding: "24px 0",
            background: "#f5f5f5",
            marginLeft: -20,
            marginRight: -20,
            paddingLeft: 20,
            paddingRight: 20,
          }}
        >
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: "#2e7d32" }}>
            Sản phẩm liên quan
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20 }}>
            {related.map((p) => {
              const rImg = p.thumbnail_url
                ? p.thumbnail_url
                : p.thumbnail
                ? `${APP_BASE}/storage/${p.thumbnail}`
                : PLACEHOLDER;
              const rPrice = Number(p.price ?? 0);
              return (
                <Link key={p.id} to={`/products/${p.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div style={{ background: "#fff", borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                    <div style={{ aspectRatio: "3/4", background: "#fafafa" }}>
                      <img
                        src={rImg}
                        alt={p.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
                        loading="lazy"
                      />
                    </div>
                    <div style={{ padding: 12 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 14,
                          marginBottom: 6,
                          color: "#000",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
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
