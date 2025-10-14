import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { wishlistList, wishlistRemove, wishlistToggle } from "../../lib/api";
import { FaTrash, FaHeart } from "react-icons/fa";

const PLACEHOLDER = "https://placehold.co/300x200?text=No+Image";

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    (async () => {
      try {
        const data = await wishlistList();
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("wishlistList error:", e);
      } finally { setLoading(false); }
    })();
  }, [token, navigate]);

  const handleRemove = async (pid) => {
    try {
      await wishlistRemove(pid);
      setItems((prev) => prev.filter((x) => x.id !== pid));
    } catch (e) { console.error("wishlistRemove error:", e); }
  };

  const handleToggle = async (pid) => {
    try {
      await wishlistToggle(pid);
      setItems((prev) => prev.filter((x) => x.id !== pid));
    } catch (e) { console.error("wishlistToggle error:", e); }
  };

  if (loading) return <div style={{padding:16}}>Đang tải danh sách yêu thích…</div>;

  if (!items.length) {
    return (
      <div style={{padding:16}}>
        <h2>Yêu thích</h2>
        <p>Bạn chưa có sản phẩm nào trong danh sách.</p>
        <Link to="/products">Tiếp tục mua sắm</Link>
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
    <div style={{padding:16}}>
      <style>{styles}</style>
      <h2 style={{marginBottom:12}}>Yêu thích ({items.length})</h2>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px,1fr))", gap:16 }}>
        {items.map((p) => (
          <div key={p.id} className="product-card">
            <Link to={`/products/${p.id}`} className="product-card__link">
              <div className="product-image">
                <img
                  src={p.image || p.thumbnail_url || p.thumbnail || PLACEHOLDER}
                  alt={p.name}
                  className="product-image__img"
                  onError={(e)=>{e.currentTarget.src = PLACEHOLDER;}}
                />
                <div className="wishlist-btn" onClick={(e)=>{ e.preventDefault(); handleToggle(p.id); }} title="Bỏ yêu thích">
                  <FaHeart className="wishlist-icon" />
                </div>
              </div>

              <div className="product-info">
                <div className="name">{p.name}</div>
                {p.category_name && <span className="category-chip">{p.category_name}</span>}
                <div className="brand">{p.brand_name || "Farm Local"}</div>
                <div className="price">₫{Number(p.price||0).toLocaleString("vi-VN")}</div>
              </div>
            </Link>

            <div style={{display:"flex", gap:8, padding:"0 12px 12px"}}>
              <button
                onClick={()=>handleRemove(p.id)}
                style={{ border:"1px solid #eee", padding:"6px 10px", borderRadius:8, background:"#fff", cursor:"pointer" }}
                title="Xoá khỏi yêu thích"
              >
                <FaTrash style={{verticalAlign:"middle"}}/> Xoá
              </button>
              <Link
                to={`/products/${p.id}`}
                style={{ border:"1px solid #2e7d32", padding:"6px 10px", borderRadius:8, background:"#2e7d32", color:"#fff", textDecoration:"none" }}
              >Xem sản phẩm</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
