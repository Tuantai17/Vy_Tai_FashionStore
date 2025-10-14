import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { wishlistToggle } from "../lib/wishlist";

const PLACEHOLDER = "https://placehold.co/300x200?text=No+Image";

export default function ProductCard({ p }) {
  const price = Number(p.price) || 0;
  const imgSrc = p.image || p.thumbnail_url || p.thumbnail || PLACEHOLDER;
  const navigate = useNavigate();
  const [liked, setLiked] = useState(Boolean(p.is_liked));
  const token = localStorage.getItem("token");

  const categoryName =
    p.category_name ||
    (p.category && typeof p.category === "object" ? p.category.name : null) ||
    (typeof p.category === "string" ? p.category : null);

  const ensureAuth = () => {
    if (token) return true;
    navigate("/login");
    return false;
  };

  const syncWishlist = async () => {
    const res = await wishlistToggle(p.id);
    const message = typeof res?.message === "string" ? res.message.toLowerCase() : "";
    const isAdded = message.includes("added")
      ? true
      : message.includes("removed")
        ? false
        : !liked;
    setLiked(isAdded);
    window.dispatchEvent(
      new CustomEvent("wishlist:updated", { detail: { productId: p.id, liked: isAdded } }),
    );
    if (isAdded) {
      const el =
        document.getElementById("wishlist-target") ||
        document.querySelector('a[href="/wishlist"]');
      if (el) {
        el.classList.add("wishlist-pulse");
        setTimeout(() => el.classList.remove("wishlist-pulse"), 600);
      }
    }
    return isAdded;
  };

  const handleToggleWishlist = async (event) => {
    event.preventDefault();
    if (!ensureAuth()) return;
    try {
      await syncWishlist();
    } catch (err) {
      console.error("Wishlist toggle failed:", err);
    }
  };

  const handleAddWishlist = async () => {
    if (!ensureAuth()) return;
    if (liked) {
      navigate("/wishlist");
      return;
    }
    try {
      const isAdded = await syncWishlist();
      if (isAdded) {
        navigate("/wishlist");
      }
    } catch (err) {
      console.error("Wishlist add failed:", err);
    }
  };

  return (
    <>
      <style>
        {`
          .product-card{
            background:#fff;
            border-radius:12px;
            box-shadow:0 2px 10px rgba(0,0,0,.08);
            overflow:hidden;
            display:flex;
            flex-direction:column;
            transition:transform .15s ease, box-shadow .15s ease;
          }
          .product-card:hover{ transform:translateY(-2px); box-shadow:0 6px 18px rgba(0,0,0,.12); }
          .product-card__link{ display:flex;flex-direction:column;text-decoration:none;color:inherit;height:100%; }
          .product-image{ position:relative;width:100%;aspect-ratio:1/1;overflow:hidden;background:#f6f7f9; }
          .product-image__img{ position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .25s ease; }
          .product-card:hover .product-image__img{ transform:scale(1.04); }
          .wishlist-btn{
            position:absolute;top:8px;right:8px;
            background:rgba(255,255,255,0.9);
            border-radius:50%;padding:6px;
            display:flex;align-items:center;justify-content:center;
            cursor:pointer;transition:transform .2s;
          }
          .wishlist-btn:hover{ transform:scale(1.1); }
          .wishlist-icon{ font-size:20px; color:#ccc; }
          .wishlist-icon.liked{ color:#e53935; }
          .product-info{ display:flex;flex-direction:column;gap:6px;padding:12px;flex:1;min-height:0; }
          .name{
            font-size:15px;font-weight:600;color:#111;line-height:1.4;
            display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;
            overflow:hidden;height:2.8em;
          }
          .category-chip{
            display:inline-block;
            font-size:12px;
            padding:2px 8px;
            border-radius:999px;
            background:#eef6ee;
            color:#2e7d32;
            border:1px solid #e3f0e3;
            max-width:100%;
            white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
          }
          .brand{
            font-size:13px;color:#6b7280;
            white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
          }
          .price{ margin-top:auto;font-weight:700;font-size:15px;color:#2e7d32; }
          .product-actions{ display:flex;padding:12px;border-top:1px solid #f1f5f9;background:#fff; }
          .wishlist-action{
            flex:1;
            font-size:14px;
            font-weight:600;
            padding:8px 12px;
            border-radius:8px;
            border:1px solid #e5e7eb;
            background:#fff;
            color:#1f2937;
            cursor:pointer;
            transition:background .2s,border-color .2s,color .2s;
          }
          .wishlist-action:hover{ background:#f8fafc; }
          .wishlist-action.is-liked{
            background:#fef2f2;
            border-color:#f87171;
            color:#b91c1c;
          }
        `}
      </style>

      <div className="product-card">
        <Link to={`/products/${p.id}`} className="product-card__link">
          <div className="product-image">
            <img
              src={imgSrc}
              alt={p.name}
              className="product-image__img"
              loading="lazy"
              onError={(event) => {
                event.currentTarget.src = PLACEHOLDER;
              }}
            />
            <div className="wishlist-btn" onClick={handleToggleWishlist}>
              {liked ? (
                <FaHeart className="wishlist-icon liked" />
              ) : (
                <FaRegHeart className="wishlist-icon" />
              )}
            </div>
          </div>

          <div className="product-info">
            <div className="name">{p.name}</div>
            {categoryName && <span className="category-chip">{categoryName}</span>}
            <div className="brand">{p.brand_name ? p.brand_name : "Farm Local"}</div>
            <div className="price">{price.toLocaleString("vi-VN")} VND</div>
          </div>
        </Link>

        <div className="product-actions">
          <button
            type="button"
            className={`wishlist-action${liked ? " is-liked" : ""}`}
            onClick={handleAddWishlist}
          >
            {liked ? "Da yeu thich" : "Them yeu thich"}
          </button>
        </div>
      </div>
    </>
  );
}
