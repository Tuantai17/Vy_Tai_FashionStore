// src/pages/Customers/Products.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import ProductCard from "../../components/ProductCard";

const API_BASE = "http://127.0.0.1:8000";
const API = {
  // thêm ?per_page=-1 để lấy full
  categories: `${API_BASE}/api/categories?per_page=-1`,
  products: `${API_BASE}/api/products?per_page=-1`,
  catProducts: (id) => `${API_BASE}/api/categories/${id}/products?per_page=-1`,
};
export default function Products({ addToCart }) {
  const location = useLocation();
  const defaultCate = location.state?.categoryId ?? "";

  const [items, setItems] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [categories, setCategories] = useState([]);

  const [category, setCategory] = useState(defaultCate === "" ? "" : Number(defaultCate));
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const catCache = useRef({});

  const normalizeList = (data) => (Array.isArray(data) ? data : data?.data ?? []);
  const priceOf = (p) =>
    Number(p?.price ?? p?.price_sale ?? p?.sale_price ?? p?.regular_price ?? p?.amount ?? 0);

  // ====== Tải FULL danh mục + FULL sản phẩm (không phân trang) ======
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
        setFiltered(all);
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

  // ====== Lấy tất cả id con của 1 danh mục (nếu có cấu trúc cây) ======
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

  // ====== Lấy FULL sản phẩm của 1 danh mục (dùng cache để tiết kiệm request) ======
  const fetchProductsOfCategory = async (cateId) => {
    const key = Number(cateId);
    if (catCache.current[key]) return catCache.current[key];
    const res = await fetch(API.catProducts(key));
    if (!res.ok) throw new Error(`CatProducts HTTP ${res.status}`);
    const list = normalizeList(await res.json());
    catCache.current[key] = list;
    return list;
  };

  // ====== Áp filter danh mục + khoảng giá (client-side) ======
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
        if (category === "" || category === null || isNaN(Number(category))) {
          if (!cancelled) setFiltered(applyPrice(items));
          return;
        }

        const descendants = getDescendantIds(Number(category));
        const targetIds = [...new Set([Number(category), ...descendants])];

        const chunks = await Promise.all(targetIds.map((id) => fetchProductsOfCategory(id)));

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

    if (categories.length) run();
    return () => {
      cancelled = true;
    };
  }, [category, minPrice, maxPrice, categories, items]);

  const options = useMemo(() => {
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
    <div 
      style={{ 
        padding: "20px 16px",
        maxWidth: 1400,
        margin: "0 auto"
      }}
    >
      <h2 style={{ marginBottom: 16, color: "#388e3c", textAlign: "center" }}>
        🌿 Tất cả sản phẩm
      </h2>

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
            🔄
          </button>
        </div>
      </div>

      {/* Danh sách sản phẩm */}
      <style>
        {`
          .products-grid{
            display:grid;
            grid-template-columns: repeat(5, minmax(0, 1fr));
            gap: 24px;
          }
          @media (max-width: 1024px){
            .products-grid{ grid-template-columns: repeat(3, minmax(0,1fr)); }
          }
          @media (max-width: 768px){
            .products-grid{ grid-template-columns: repeat(2, minmax(0,1fr)); }
          }
          @media (max-width: 480px){
            .products-grid{ grid-template-columns: repeat(1, minmax(0,1fr)); }
          }
          .pcell{
            display:flex;
            flex-direction:column;
          }
          .pcell .add-btn{
            margin-top:10px;
            background:#388e3c;
            color:#fff;
            border:0;
            padding:8px 12px;
            border-radius:8px;
            cursor:pointer;
            align-self:flex-end;
          }
        `}
      </style>

      <div className="products-grid">
        {filtered.length > 0 ? (
          filtered.map((p) => (
            <div key={p.id} className="pcell">
              <ProductCard p={p} />
            </div>
          ))
        ) : (
          <p style={{ textAlign: "center", color: "#666", gridColumn: "1 / -1" }}>
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
