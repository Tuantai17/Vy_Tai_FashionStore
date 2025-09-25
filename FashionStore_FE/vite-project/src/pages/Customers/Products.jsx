// src/pages/Customers/Products.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import ProductCard from "../../components/ProductCard";

const API_BASE = "http://127.0.0.1:8000";
const API = {
  categories: `${API_BASE}/api/categories`,
  products: `${API_BASE}/api/products`,
  catProducts: (id) => `${API_BASE}/api/categories/${id}/products`,
};
const PLACEHOLDER = "https://placehold.co/300x200?text=No+Image";

export default function Products({ addToCart }) {
  const location = useLocation();
  const defaultCate = location.state?.categoryId ?? ""; // có thể là string/number

  const [items, setItems] = useState([]);       // tất cả sản phẩm (để hiển thị khi không lọc theo danh mục)
  const [filtered, setFiltered] = useState([]); // kết quả hiển thị sau khi áp bộ lọc
  const [categories, setCategories] = useState([]);

  // filter states
  const [category, setCategory] = useState(defaultCate === "" ? "" : Number(defaultCate));
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // cache: { [cateId:number]: Product[] }
  const catCache = useRef({});

  const normalizeList = (data) => (Array.isArray(data) ? data : data?.data ?? []);
  const priceOf = (p) =>
    Number(p?.price ?? p?.price_sale ?? p?.sale_price ?? p?.regular_price ?? p?.amount ?? 0);

  // ---------- Tải categories + all products ----------
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErr("");

        const resCats = await fetch(API.categories, { signal: ac.signal });
        if (!resCats.ok) throw new Error(`Categories HTTP ${resCats.status}`);
        const cats = normalizeList(await resCats.json());
        setCategories(cats);

        const resAll = await fetch(API.products, { signal: ac.signal });
        if (!resAll.ok) throw new Error(`Products HTTP ${resAll.status}`);
        const all = normalizeList(await resAll.json());
        setItems(all);
        setFiltered(all); // mặc định hiển thị tất cả
      } catch (e) {
        if (e.name !== "AbortError") {
          console.error(e);
          setErr("Không tải được danh sách sản phẩm hoặc danh mục.");
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  // ---------- Lấy toàn bộ id con (duyệt sâu) ----------
  const getDescendantIds = (id) => {
    const want = String(id);
    const out = [];
    const stack = categories.filter((c) => String(c.parent_id) === want).map((c) => c.id);

    while (stack.length) {
      const cur = stack.pop();
      out.push(cur);
      const next = categories.filter((c) => String(c.parent_id) === String(cur)).map((c) => c.id);
      stack.push(...next);
    }
    return out;
  };

  // ---------- API /categories/:id/products (có cache) ----------
  const fetchProductsOfCategory = async (cateId) => {
    const key = Number(cateId);
    if (catCache.current[key]) return catCache.current[key];
    const res = await fetch(API.catProducts(key));
    if (!res.ok) throw new Error(`CatProducts HTTP ${res.status}`);
    const list = normalizeList(await res.json());
    catCache.current[key] = list;
    return list;
  };

  // ---------- Áp bộ lọc: danh mục + giá ----------
  useEffect(() => {
    let cancelled = false;

    const applyPrice = (list) => {
      let out = list;
      if (minPrice !== "") out = out.filter((p) => priceOf(p) >= Number(minPrice));
      if (maxPrice !== "") out = out.filter((p) => priceOf(p) <= Number(maxPrice));
      return out;
    };

    const run = async () => {
      try {
        // Không chọn danh mục -> hiển thị tất cả + áp giá
        if (category === "" || category === null || isNaN(Number(category))) {
          setFiltered(applyPrice(items));
          return;
        }

        // Gom sản phẩm của chính danh mục + tất cả danh mục con (nếu có)
        const descendants = getDescendantIds(Number(category));
        const targetIds = [...new Set([Number(category), ...descendants])];

        // Gọi song song /api/categories/:id/products
        const chunks = await Promise.all(targetIds.map((id) => fetchProductsOfCategory(id)));

        // Gộp & khử trùng lặp theo product.id
        const mergedMap = new Map();
        for (const arr of chunks) {
          for (const p of arr) mergedMap.set(p.id, p);
        }
        const merged = Array.from(mergedMap.values());

        if (!cancelled) setFiltered(applyPrice(merged));
      } catch (e) {
        console.error(e);
        if (!cancelled) setErr("Không lọc được theo danh mục.");
      }
    };

    // chỉ chạy sau khi đã có categories (để tìm con)
    if (categories.length) run();
    return () => {
      cancelled = true;
    };
  }, [category, minPrice, maxPrice, categories, items]);

  // ---------- UI ----------
  const options = useMemo(() => {
    // Sắp xếp để cha hiện trước con (nhẹ nhàng theo parent_id)
    const toNum = (v) => (v == null ? null : Number(v));
    return [...categories].sort((a, b) => (toNum(a.parent_id) ?? -1) - (toNum(b.parent_id) ?? -1));
  }, [categories]);

  if (loading) return <p style={{ padding: 20 }}>Đang tải sản phẩm...</p>;
  if (err) return <p style={{ padding: 20, color: "#d32f2f" }}>{err}</p>;
  if (!items.length) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <p>Chưa có sản phẩm.</p>
        <p style={{ marginTop: 12 }}>
          <Link to="/" style={{ color: "#2e7d32" }}>← Về trang chủ</Link>
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 16, color: "#388e3c" }}>🌿 Tất cả sản phẩm</h2>

      {/* Bộ lọc */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 24,
          background: "#fff",
          padding: 16,
          borderRadius: 8,
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        }}
      >
        {/* Danh mục */}
        <div>
          <label style={{ fontSize: 14, fontWeight: 600 }}>Danh mục</label>
          <select
            value={category === "" ? "" : Number(category)}
            onChange={(e) => {
              const v = e.target.value;
              setCategory(v === "" ? "" : Number(v));
            }}
            style={{
              display: "block",
              marginTop: 4,
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid #ccc",
              minWidth: 180,
            }}
          >
            <option value="">-- Tất cả --</option>
            {options.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name ?? c.title ?? c.category_name ?? c.slug ?? `#${c.id}`}
              </option>
            ))}
          </select>
        </div>

        {/* Giá từ */}
        <div>
          <label style={{ fontSize: 14, fontWeight: 600 }}>Giá từ</label>
          <input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            style={{
              display: "block",
              marginTop: 4,
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid #ccc",
              width: 140,
            }}
            placeholder="0"
          />
        </div>

        {/* Giá đến */}
        <div>
          <label style={{ fontSize: 14, fontWeight: 600 }}>Đến</label>
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            style={{
              display: "block",
              marginTop: 4,
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid #ccc",
              width: 140,
            }}
            placeholder="1000000"
          />
        </div>

        {/* Bỏ lọc */}
        <div style={{ alignSelf: "flex-end" }}>
          <button
            onClick={() => {
              setCategory("");
              setMinPrice("");
              setMaxPrice("");
            }}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #ccc",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            🔄 Bỏ lọc
          </button>
        </div>
      </div>

      {/* Danh sách sản phẩm */}
      <div
        style={{
          display: "flex",
          gap: 24,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {filtered.length > 0 ? (
          filtered.map((p) => (
            <div key={p.id} style={{ position: "relative" }}>
              <ProductCard
                p={{
                  ...p,
                  image:
                    p.image_url || p.thumbnail_url || p.thumbnail || p.image || PLACEHOLDER,
                }}
              />
              {typeof addToCart === "function" && (
                <button
                  onClick={() => addToCart(p)}
                  style={{
                    position: "absolute",
                    right: 10,
                    bottom: 10,
                    background: "#388e3c",
                    color: "#fff",
                    border: 0,
                    padding: "6px 10px",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  + Giỏ
                </button>
              )}
            </div>
          ))
        ) : (
          <p style={{ marginTop: 24, textAlign: "center", color: "#666" }}>
            😢 Không có sản phẩm nào.
          </p>
        )}
      </div>

      <p style={{ marginTop: 24, textAlign: "center" }}>
        <Link to="/" style={{ color: "#2e7d32" }}>← Về trang chủ</Link>
      </p>
    </div>
  );
}
