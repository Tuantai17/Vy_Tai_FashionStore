import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

const API_BASE = "http://127.0.0.1:8000/api";

export default function ReviewSection({ productId }) {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Cho phép dùng cả 2 cách: prop hoặc lấy từ URL
  const pid = productId ?? params.id;

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [error, setError] = useState("");
  const [canReview, setCanReview] = useState(false);

  const token = localStorage.getItem("token");
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();

  // Tính điểm trung bình từ reviews (fallback nếu BE không trả)
  const avgRating = useMemo(() => {
    if (!reviews?.length) return null;
    const sum = reviews.reduce((s, r) => s + Number(r.rating || 0), 0);
    return Math.round((sum / reviews.length) * 10) / 10; // 1 chữ số thập phân
  }, [reviews]);

  // Nếu không có pid thì báo lỗi (VD: route sai)
  useEffect(() => {
    if (!pid) {
      setError("Thiếu productId.");
    }
  }, [pid]);

  // Load thông tin sản phẩm (public)
  useEffect(() => {
    if (!pid) return;
    const ac = new AbortController();
    (async () => {
      try {
        const tryUrls = [
          `${API_BASE}/products/${pid}`,
          `${API_BASE}/product/${pid}`,
          `${API_BASE}/items/${pid}`,
        ];
        for (const url of tryUrls) {
          try {
            const res = await fetch(url, {
              signal: ac.signal,
              headers: { Accept: "application/json" },
            });
            if (res.ok) {
              const data = await res.json();
              const p = data?.data || data?.product || data;
              if (p && (p.id || p.name)) {
                setProduct(p);
                break;
              }
            }
          } catch {}
        }
      } catch {}
    })();
    return () => ac.abort();
  }, [pid]);

  // Load list review (public)
  useEffect(() => {
    if (!pid) return;
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/products/${pid}/reviews`, {
          signal: ac.signal,
          headers: { Accept: "application/json" },
        });
        if (!res.ok) {
          setError("Không tải được đánh giá.");
          setReviews([]);
          return;
        }
        const data = await res.json();
        setReviews(Array.isArray(data) ? data : (data.data ?? []));
        setError("");
      } catch {
        setError("Không tải được đánh giá.");
} finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [pid]);

  // Hỏi quyền review (đã mua & đơn hoàn tất?)
  useEffect(() => {
    if (!pid) return;
    if (!token) {
      setCanReview(false);
      return;
    }
    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/products/${pid}/can-review`, {
          signal: ac.signal,
          headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          setCanReview(false);
          return;
        }
        if (!res.ok) {
          setCanReview(false);
          return;
        }

        const data = await res.json();
        setCanReview(!!data?.canReview);
      } catch {
        setCanReview(false);
      }
    })();
    return () => ac.abort();
  }, [pid, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      // nếu là trang riêng, điều hướng sang login rồi quay lại
      if (!productId) {
        navigate("/login", { state: { redirectTo: location.pathname } });
      }
      toast.info("Vui lòng đăng nhập để đánh giá sản phẩm!");
      return;
    }
    if (!canReview) {
      toast.warn("Bạn chỉ có thể đánh giá sau khi mua hàng thành công.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/products/${pid}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newReview),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 403) {
        toast.warn(data?.error || "Bạn chưa mua sản phẩm này hoặc đơn chưa hoàn tất.");
        return;
      }
      if (!res.ok) {
        toast.error(data?.error || "Không thêm được review");
        return;
      }

      // Nếu BE chưa trả kèm user, gán tạm để hiển thị ngay
      if (!data.user && user) {
        data.user = { id: user.id, name: user.name };
      }
      if (data.user_id == null && user?.id != null) {
        data.user_id = user.id;
      }

      // upsert tại FE: nếu user đã có review, thay thế
      setReviews((cur) => {
        const idx = cur.findIndex((x) => x.user_id === user?.id);
        if (idx >= 0) {
          const clone = [...cur];
          clone[idx] = data;
          return clone;
        }
        return [data, ...cur];
      });

      setNewReview({ rating: 5, comment: "" });
      toast.success("Đã gửi đánh giá, cảm ơn bạn!");
    } catch {
      toast.error("Không kết nối được server");
    }
  };

  const handleDelete = async (id) => {
    if (!token) {
      if (!productId) {
        navigate("/login", { state: { redirectTo: location.pathname } });
      }
      toast.info("Cần đăng nhập");
return;
    }
    if (!confirm("Xóa review này?")) return;
    try {
      const res = await fetch(`${API_BASE}/reviews/${id}`, {
        method: "DELETE",
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setReviews((rs) => rs.filter((r) => r.id !== id));
        toast.success("Đã xóa review");
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error(d?.error || "Xóa thất bại");
      }
    } catch {
      toast.error("Không kết nối được server");
    }
  };

  const formatVND = (n) =>
    typeof n === "number"
      ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n)
      : n ?? "-";

  // Lấy giá hiển thị từ nhiều trường phổ biến
  const productPrice = useMemo(() => {
    if (!product) return null;
    const p =
      product.price_sale ??
      product.sale_price ??
      product.price_root ??
      product.price ??
      null;
    return typeof p === "number" ? p : Number(p ?? 0) || null;
  }, [product]);

  const productThumb =
    product?.thumbnail_url || product?.image_url || product?.thumbnail || "";

  return (
    <div style={{ marginTop: 40 }}>
      {/* ===== Thông tin sản phẩm ở đầu ===== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "80px 1fr auto",
          gap: 12,
          padding: 12,
          border: "1px solid #e8f0ec",
          borderRadius: 12,
          background: "#ffffff",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <img
          src={productThumb || "https://placehold.co/80x80?text=No+Img"}
          width={80}
          height={80}
          alt={product?.name || "product"}
          style={{ borderRadius: 10, objectFit: "cover", boxShadow: "0 2px 6px rgba(0,0,0,.06)" }}
          onError={(e) => (e.currentTarget.src = "https://placehold.co/80x80?text=No+Img")}
        />
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4, color: "#14532d" }}>
            {product?.name || `Sản phẩm #${pid}`}
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {/* Điểm trung bình */}
            <span style={{ color: "#d97706", fontWeight: 700 }}>
              {avgRating != null
                ? `⭐ ${avgRating} / 5`
                : product?.rating_avg != null
                ? `⭐ ${product.rating_avg} / 5`
                : "Chưa có điểm"}
            </span>
            <span style={{ color: "#64748b" }}>
              ({reviews.length} đánh giá)
            </span>
          </div>
        </div>
        <div style={{ textAlign: "right", fontWeight: 900, color: "#065f46" }}>
          {productPrice != null ? formatVND(productPrice) : ""}
        </div>
      </div>
<h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: "#388e3c" }}>
        ⭐ Đánh giá sản phẩm
      </h3>

      {loading && <p>Đang tải review...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* ===== Hiển thị “đang đăng nhập bằng” ===== */}
      {user ? (
        <div
          style={{
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            color: "#065f46",
            padding: 10,
            borderRadius: 8,
            marginBottom: 12,
            fontWeight: 600,
          }}
        >
          Đang đăng nhập: {user.name}
          {user.email ? <span style={{ color: "#166534" }}> &lt;{user.email}&gt;</span> : null}
        </div>
      ) : (
        <div
          style={{
            background: "#fff7ed",
            border: "1px solid #fed7aa",
            color: "#9a3412",
            padding: 10,
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          Bạn chưa đăng nhập. <b>Đăng nhập để viết đánh giá</b>.
        </div>
      )}

      {user && !canReview && (
        <div
          style={{
            background: "#FFF8E1",
            border: "1px solid #FFE082",
            padding: 10,
            borderRadius: 8,
            marginBottom: 12,
            color: "#8D6E63",
          }}
        >
          Bạn chỉ có thể viết đánh giá sau khi <b>mua hàng thành công</b> sản phẩm này.
        </div>
      )}

      {/* ===== Form viết đánh giá ===== */}
      {user && (
        <form onSubmit={handleSubmit} style={{ marginBottom: 20, opacity: canReview ? 1 : 0.6 }}>
          <div style={{ marginBottom: 8 }}>
            <label>Chấm điểm: </label>
            <select
              value={newReview.rating}
              onChange={(e) => setNewReview((s) => ({ ...s, rating: Number(e.target.value) }))}
              disabled={!canReview}
            >
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>
                  {r} ⭐
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={newReview.comment}
            onChange={(e) => setNewReview((s) => ({ ...s, comment: e.target.value }))}
            placeholder="Viết đánh giá của bạn..."
            rows={3}
            disabled={!canReview}
            style={{ width: "100%", padding: 8, borderRadius: 6 }}
          />
          <button
            type="submit"
            disabled={!canReview}
            style={{
              marginTop: 8,
              background: "#388e3c",
              color: "#fff",
              padding: "8px 14px",
              borderRadius: 6,
              border: 0,
              cursor: canReview ? "pointer" : "not-allowed",
              fontWeight: 700,
            }}
          >
            Gửi đánh giá
          </button>
        </form>
      )}
{/* ===== Danh sách đánh giá ===== */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {reviews.length === 0 && <p>Chưa có đánh giá nào.</p>}
        {reviews.map((r) => (
          <div
            key={r.id}
            style={{ background: "#fff", border: "1px solid #eee", borderRadius: 8, padding: 12 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
              <b>{r.user?.name || "Ẩn danh"}</b>
              <span>
                {"⭐".repeat(Number(r.rating || 0))}
                {"☆".repeat(Math.max(0, 5 - Number(r.rating || 0)))}
              </span>
            </div>
            <p style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{r.comment}</p>

            {user && user.id === r.user_id && (
              <button
                onClick={() => handleDelete(r.id)}
                style={{ marginTop: 6, background: "transparent", color: "red", border: "none", cursor: "pointer" }}
                title="Xóa đánh giá của bạn"
              >
                ❌ Xóa
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}