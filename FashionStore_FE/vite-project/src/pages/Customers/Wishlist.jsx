import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { wishlistList, wishlistRemove, wishlistToggle } from "../../lib/wishlist";
import { FaTrash, FaHeart } from "react-icons/fa";

const PLACEHOLDER = "https://placehold.co/300x200?text=No+Image";

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const normalizeWishlistItem = (raw) => {
    if (!raw) return null;
    const id = raw.id ?? raw.product_id ?? raw.product?.id ?? null;
    if (!id) return null;

    const priceValue =
      raw.price ??
      raw.price_sale ??
      raw.product?.price ??
      raw.product?.price_sale ??
      raw.product?.price_root ??
      0;

    return {
      wishlist_id: raw.wishlist_id ?? null,
      id,
      name: raw.name ?? raw.product?.name ?? "",
      price: Number(priceValue) || 0,
      image:
        raw.image ??
        raw.thumbnail_url ??
        raw.thumbnail ??
        raw.product?.image ??
        raw.product?.thumbnail_url ??
        raw.product?.thumbnail ??
        PLACEHOLDER,
      category_name:
        raw.category_name ??
        raw.category?.name ??
        raw.product?.category_name ??
        raw.product?.category?.name ??
        "",
      brand_name:
        raw.brand_name ??
        raw.brand?.name ??
        raw.product?.brand_name ??
        raw.product?.brand?.name ??
        "",
      is_liked: true,
    };
  };

  const removeItemLocally = (pid) => {
    const target = String(pid);
    setItems((prev) => prev.filter((x) => String(x.id) !== target));
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    let isMounted = true;

    (async () => {
      try {
        setError("");
        const data = await wishlistList({ timeout: 60000 });
        if (!isMounted) return;
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("wishlistList error:", e);
        const message =
          e?.name === "AbortError"
            ? "Khong the ket noi den wishlist. Vui long thu lai."
            : "Khong the tai danh sach yeu thich. Vui long thu lai.";
        if (isMounted) setError(message);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [token, navigate]);

  useEffect(() => {
    const onWishlistUpdated = async (event) => {
      if (!token) return;
      const detail = event?.detail || {};
      const { productId, liked, item } = detail;
      if (!productId || typeof liked !== "boolean") return;

      if (liked && item) {
        const normalized = normalizeWishlistItem(item);
        if (!normalized) return;
        setItems((prev) => {
          const idx = prev.findIndex((x) => String(x.id) === String(normalized.id));
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = { ...next[idx], ...normalized };
            return next;
          }
          return [normalized, ...prev];
        });
        setError("");
        return;
      }

      if (!liked) {
        removeItemLocally(productId);
        setError("");
        return;
      }

      try {
        const data = await wishlistList({ timeout: 60000 });
        setItems(Array.isArray(data) ? data : []);
        setError("");
      } catch (e) {
        console.error("wishlist refresh error:", e);
        const message =
          e?.name === "AbortError"
            ? "Khong the ket noi den wishlist. Vui long thu lai."
            : "Khong the tai danh sach yeu thich. Vui long thu lai.";
        setError(message);
      }
    };

    window.addEventListener("wishlist:updated", onWishlistUpdated);
    return () => window.removeEventListener("wishlist:updated", onWishlistUpdated);
  }, [token]);

  const handleRemove = async (pid) => {
    try {
      const res = await wishlistRemove(pid);
      const targetId = res?.product_id ?? pid;
      removeItemLocally(targetId);
      window.dispatchEvent(
        new CustomEvent("wishlist:updated", {
          detail: { productId: targetId, liked: false },
        })
      );
    } catch (e) {
      console.error("wishlistRemove error:", e);
    }
  };

  const handleToggle = async (pid) => {
    try {
      const res = await wishlistToggle(pid);
      if (res?.liked) {
        const normalized = normalizeWishlistItem(res.item);
        if (normalized) {
          setItems((prev) => {
            const idx = prev.findIndex((x) => String(x.id) === String(normalized.id));
            if (idx !== -1) {
              const next = [...prev];
              next[idx] = { ...next[idx], ...normalized };
              return next;
            }
            return [normalized, ...prev];
          });
          setError("");
          return;
        }
      }

      const targetId = res?.product_id ?? pid;
      removeItemLocally(targetId);
      window.dispatchEvent(
        new CustomEvent("wishlist:updated", {
          detail: { productId: targetId, liked: false },
        })
      );
    } catch (e) {
      console.error("wishlistToggle error:", e);
    }
  };

  if (loading) {
    return <div style={{ padding: 16 }}>Dang tai danh sach yeu thich...</div>;
  }

  if (!items.length) {
    return (
      <div style={{ padding: 16 }}>
        <h2>Yeu thich</h2>
        <p>{error || "Ban chua co san pham nao trong danh sach."}</p>
        <Link to="/products">Tiep tuc mua sam</Link>
      </div>
    );
  }

  const styles = `
    .product-card{background:#fff;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,.08);
      overflow:hidden;display:flex;flex-direction:column;transition:transform .15s, box-shadow .15s;}
    .product-card:hover{ transform:translateY(-2px); box-shadow:0 6px 18px rgba(0,0,0,.12); }
    .product-card__link{ display:flex;flex-direction:column;text-decoration:none;color:inherit;height:100%; }
    .product-image{ position:relative;width:100%;aspect-ratio:1/1;overflow:hidden;background:#f6f7f9; }
    .product-image__img{ position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .25s; }
    .product-card:hover .product-image__img{ transform:scale(1.04); }
    .wishlist-btn{ position:absolute;top:8px;right:8px;background:rgba(255,255,255,0.9);
      border-radius:50%;padding:6px;display:flex;align-items:center;justify-content:center;cursor:pointer; }
    .wishlist-icon{ font-size:20px; color:#e53935; }
    .product-info{ display:flex;flex-direction:column;gap:6px;padding:12px;flex:1;min-height:0; }
    .name{ font-size:15px;font-weight:600;color:#111;line-height:1.4;display:-webkit-box;-webkit-box-orient: vertical;-webkit-line-clamp: 2;overflow:hidden;height:2.8em; }
    .category-chip{ display:inline-block;font-size:12px;padding:2px 8px;border-radius:999px;background:#eef6ee;color:#2e7d32;border:1px solid #e3f0e3; }
    .brand{ font-size:13px;color:#6b7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
    .price{ margin-top:auto;font-weight:700;font-size:15px;color:#2e7d32; }
  `;

  return (
    <div style={{ padding: 16 }}>
      <style>{styles}</style>
      <h2 style={{ marginBottom: 12 }}>Yeu thich ({items.length})</h2>
      {error && (
        <div style={{ marginBottom: 12, color: "#c0392b", fontSize: 14 }}>{error}</div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))",
          gap: 16,
        }}
      >
        {items.map((p) => (
          <div key={p.id} className="product-card">
            <Link to={`/products/${p.id}`} className="product-card__link">
              <div className="product-image">
                <img
                  src={p.image || p.thumbnail_url || p.thumbnail || PLACEHOLDER}
                  alt={p.name}
                  className="product-image__img"
                  onError={(event) => {
                    event.currentTarget.src = PLACEHOLDER;
                  }}
                />
                <div
                  className="wishlist-btn"
                  onClick={(event) => {
                    event.preventDefault();
                    handleToggle(p.id);
                  }}
                  title="Bo yeu thich"
                >
                  <FaHeart className="wishlist-icon" />
                </div>
              </div>

              <div className="product-info">
                <div className="name">{p.name}</div>
                {p.category_name && <span className="category-chip">{p.category_name}</span>}
                <div className="brand">{p.brand_name || "Farm Local"}</div>
                <div className="price">VND {Number(p.price || 0).toLocaleString("vi-VN")}</div>
              </div>
            </Link>

            <div style={{ display: "flex", gap: 8, padding: "0 12px 12px" }}>
              <button
                onClick={() => handleRemove(p.id)}
                style={{
                  border: "1px solid #eee",
                  padding: "6px 10px",
                  borderRadius: 8,
                  background: "#fff",
                  cursor: "pointer",
                }}
                title="Xoa khoi danh sach"
              >
                <FaTrash style={{ verticalAlign: "middle" }} /> Xoa
              </button>
              <Link
                to={`/products/${p.id}`}
                style={{
                  border: "1px solid #2e7d32",
                  padding: "6px 10px",
                  borderRadius: 8,
                  background: "#2e7d32",
                  color: "#fff",
                  textDecoration: "none",
                }}
              >
                Xem san pham
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
