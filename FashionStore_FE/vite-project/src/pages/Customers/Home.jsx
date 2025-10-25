import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "../../components/ProductCard";
import CouponShowcase from "../../components/CouponShowcase";
import ChatWidget from "../../components/ChatWidget";

const API_BASE = "http://127.0.0.1:8000";
const API = {
  categories: `${API_BASE}/api/categories`,
  products: `${API_BASE}/api/products`,
};
const PLACEHOLDER = "https://placehold.co/300x200?text=No+Image";

// ✅ Bỏ dấu tiếng Việt
const removeVietnameseTones = (str = "") =>
  str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();

// ✅ Lấy URL ảnh an toàn
const pickImage = (obj, fallback = PLACEHOLDER) =>
  obj?.image_url || obj?.thumbnail_url || obj?.thumbnail || obj?.image || fallback;

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);     // ✅ nguồn dữ liệu cho tìm kiếm/gợi ý
  const [newItems, setNewItems] = useState([]);
  const [saleItems, setSaleItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Tìm kiếm
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const navigate = useNavigate();

  // ====== FETCH DATA ======
  useEffect(() => {
    const ac = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setError("");

        // Categories
        const resCats = await fetch(API.categories, { signal: ac.signal });
        if (!resCats.ok) throw new Error(`Categories HTTP ${resCats.status}`);
        const catsJson = await resCats.json();
        const cats = Array.isArray(catsJson) ? catsJson : catsJson?.data ?? [];
        setCategories(cats);

        // Products
        const resProds = await fetch(API.products, { signal: ac.signal });
        if (!resProds.ok) throw new Error(`Products HTTP ${resProds.status}`);
        const prodsJson = await resProds.json();
        const products = Array.isArray(prodsJson) ? prodsJson : prodsJson?.data ?? [];

        setAllProducts(products);
        // Tuỳ ý cắt 2 block hiển thị
        setNewItems(products.slice(0, 8));
        setSaleItems(products.slice(-8));
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error(err);
          setError("Không tải được dữ liệu từ API.");
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, []);

  // ====== FILTER & SUGGEST ======
  const filteredProducts = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    const qLower = q.toLowerCase();
    const qNoTone = removeVietnameseTones(q);

    return allProducts.filter((p) => {
      const name = String(p.name ?? "").toLowerCase();
      const nameNoTone = removeVietnameseTones(p.name ?? "");
      return (
        name.includes(qLower) ||
        name.includes(qNoTone) ||
        nameNoTone.includes(qLower) ||
        nameNoTone.includes(qNoTone)
      );
    });
  }, [query, allProducts]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setSearching(true);
      setSuggestions([]);
    }
  };

  const goHome = () => {
    setQuery("");
    setSearching(false);
    setSuggestions([]);
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);

    if (!val.trim()) {
      setSearching(false);
      setSuggestions([]);
      return;
    }

    const valNoTone = removeVietnameseTones(val);
    const sug = allProducts
      .filter((p) => removeVietnameseTones(p.name ?? "").includes(valNoTone))
      .slice(0, 5);
    setSuggestions(sug);
  };

  const handleSelectSuggestion = (name) => {
    setQuery(name);
    setSuggestions([]);
    setSearching(true);
  };

  return (
    <div
      style={{
        fontFamily: "Montserrat, Arial, sans-serif",
        background: "#fafafa",
        minHeight: "100vh",
      }}
    >
      {/* ====== SEARCH BOX ====== */}
      <section style={{ margin: "20px auto", maxWidth: 700, position: "relative"}}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            value={query}
            onChange={handleChange}
            placeholder="Tìm kiếm"
            onFocus={(e) => { e.target.placeholder = ""; }}        
            onBlur={(e) => { e.target.placeholder = "Tìm kiếm"; }}
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: 9999,
              border: "1px solid #ccc",
              fontSize: 16,
              outline: "none",
              background: "#fff",
            }}
          />
          <button
            type="submit"
            aria-label="Tìm kiếm"
            title="Tìm kiếm"
            style={{
                width: 33,
                height: 33,
                borderRadius: "50%",
                border: "1px solid #d1d5db",
                display: "inline-block",
                backgroundImage: "url('http://127.0.0.1:8000/assets/images/search.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                marginRight: 10,
            }}
          />

          {searching && (
            <button
              type="button"
              onClick={goHome}
              style={{
                  width: 33,
                  height: 33,
                  borderRadius: "50%",
                  border: "1px solid #d1d5db",
                  display: "inline-block",
                  backgroundImage: "url('http://127.0.0.1:8000/assets/images/home.png')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  marginRight: 10,
              }}
            >
            </button>
          )}
        </form>

        {/* Gợi ý */}
        {suggestions.length > 0 && !searching && (
          <ul
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "#fff",
              border: "1px solid #ccc",
              borderRadius: 8,
              marginTop: 4,
              zIndex: 50,
              listStyle: "none",
              padding: 0,
            }}
          >
            {suggestions.map((s) => (
              <li
                key={s.id}
                onClick={() => handleSelectSuggestion(s.name)}
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  borderBottom: "1px solid #eee",
                }}
              >
                {s.name}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ====== SEARCH RESULT ====== */}
      {searching && query && !loading && !error && (
        <section style={{ margin: "20px auto", maxWidth: 1100 }}>
          <h2
            style={{
              fontSize: 24,
              fontWeight: 600,
              marginBottom: 18,
              color: "#1976d2",
              textAlign: "center",
            }}
          >
            Kết quả tìm kiếm
          </h2>
          <div
            style={{
              display: "flex",
              gap: 24,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {filteredProducts.length > 0 ? (
              filteredProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  p={{ ...p, image: pickImage(p) }}
                />
              ))
            ) : (
              <p style={{ color: "#666" }}>Không tìm thấy sản phẩm nào.</p>
            )}
          </div>
        </section>
      )}

      {/* ====== NORMAL HOMEPAGE ====== */}
      {!searching && (
        <>
          {/* Hero (1 lần duy nhất) */}
          <section
            style={{
              position: "relative",
              textAlign: "center",
              color: "#fff",
              height: 800,
              overflow: "hidden",
            }}
          >
            <img
              src={`${API_BASE}/assets/images/banner1.jpg`}
              alt="Fashion Banner"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.35)",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            >
              <h1
                style={{
                  fontSize: 46,
                  fontWeight: 700,
                  marginBottom: 12,
                  textShadow: "0 2px 8px rgba(0,0,0,0.4)",
                }}
              >
                FashionStore
              </h1>
              <p style={{ fontSize: 20, fontWeight: 400, textShadow: "0 2px 6px rgba(0,0,0,0.5)" }}>
                Nơi khẳng định phong cách và cá tính của bạn
              </p>
            </div>
          </section>

          {/* Danh mục */}
          <section style={{ margin: "60px auto", maxWidth: 1200 }}>
            <h2
              style={{
                fontSize: 28,
                fontWeight: 600,
                marginBottom: 28,
                textAlign: "center",
                color: "#111",
              }}
            >
              Bộ sưu tập nổi bật
            </h2>

            {categories.length === 0 ? (
              <p style={{ textAlign: "center", color: "#666" }}>Chưa có danh mục.</p>
            ) : (
              <>
                {/* Cha */}
                <h3 style={{ fontSize: 22, fontWeight: 600, margin: "20px 0", color: "#e91e63" }}>
                  Danh mục chính
                </h3>
                <div
                  style={{
                    display: "flex",
                    gap: 24,
                    justifyContent: "center",
                    flexWrap: "wrap",
                    marginBottom: 40,
                  }}
                >
                  {categories
                    .filter((c) => !c.parent_id)
                    .map((c) => (
                      <div
                        key={c.id}
                        onClick={() => navigate(`/category/${c.id}`)}
                        style={{
                          cursor: "pointer",
                          borderRadius: 12,
                          overflow: "hidden",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                          background: "#fff",
                          transition: "transform 0.2s ease",
                          minWidth: 200,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                      >
                        <img
                          src={pickImage(c)}
                          alt={c.name}
                          style={{ width: "100%", height: 160, objectFit: "cover" }}
                          onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
                        />
                        <div style={{ padding: "12px", textAlign: "center" }}>
                          <span style={{ fontWeight: 600, fontSize: 16, color: "#333" }}>
                            {c.name}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Con */}
                {/* <h3 style={{ fontSize: 22, fontWeight: 600, margin: "20px 0", color: "#9c27b0" }}>
                  Danh mục phụ
                </h3> */}
                <div
                  style={{
                    display: "flex",
                    gap: 24,
                    justifyContent: "center",
                    flexWrap: "wrap",
                  }}
                >
                  {categories
                    .filter((c) => c.parent_id)
                    .map((c) => (
                      <div
                        key={c.id}
                        onClick={() => navigate(`/category/${c.id}`)}
                        style={{
                          cursor: "pointer",
                          borderRadius: 12,
                          overflow: "hidden",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                          background: "#fff",
                          transition: "transform 0.2s ease",
                          minWidth: 160,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                      >
                        <img
                          src={pickImage(c)}
                          alt={c.name}
                          style={{ width: "100%", height: 120, objectFit: "cover" }}
                          onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
                        />
                        <div style={{ padding: "8px", textAlign: "center" }}>
                          <span style={{ fontWeight: 500, fontSize: 14, color: "#555" }}>
                            {c.name}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </>
            )}
          </section>

          <CouponShowcase />

          {/* Trạng thái */}
          {loading && <p style={{ textAlign: "center", color: "#e91e63" }}>Đang tải dữ liệu...</p>}
          {error && <p style={{ textAlign: "center", color: "#d32f2f" }}>{error}</p>}

          {/* Sản phẩm */}
          {!loading && !error && (
            <>
              <section style={{ margin: "60px auto", maxWidth: 1200 }}>
                <h2
                  style={{
                    fontSize: 28,
                    fontWeight: 600,
                    marginBottom: 28,
                    textAlign: "center",
                    color: "#111",
                  }}
                >
                  Bộ sưu tập mới
                </h2>
                <div
                  style={{
                    display: "flex",
                    gap: 24,
                    flexWrap: "wrap",
                    justifyContent: "center",
                  }}
                >
                  {newItems.map((p) => (
                    <ProductCard key={p.id} p={{ ...p, image: pickImage(p) }} />
                  ))}
                </div>
              </section>

              <section style={{ margin: "60px auto", maxWidth: 1200 }}>
                <h2
                  style={{
                    fontSize: 28,
                    fontWeight: 600,
                    marginBottom: 28,
                    textAlign: "center",
                    color: "#d81b60",
                  }}
                >
                  Ưu đãi hot
                </h2>
                <div
                  style={{
                    display: "flex",
                    gap: 24,
                    flexWrap: "wrap",
                    justifyContent: "center",
                  }}
                >
                  {saleItems.map((p) => (
                    <ProductCard key={p.id} p={{ ...p, image: pickImage(p) }} />
                  ))}
                </div>
              </section>
            </>
          )}

{/* About Section */}
<section className="py-16 px-4 bg-gradient-to-b from-gray-50 to-white dark:from-neutral-950 dark:to-neutral-900">
  <div
    className="
      relative max-w-4xl mx-auto text-center 
      rounded-2xl bg-white/80 dark:bg-neutral-900/80
      shadow-[0_8px_35px_rgba(0,0,0,0.08)]
      ring-1 ring-gray-100 dark:ring-neutral-800
      px-8 py-12
      backdrop-blur-sm
    "
  >
    {/* Thanh gradient nhỏ trang trí trên đầu */}
    <div className="absolute inset-x-10 -top-2 h-1 rounded-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-indigo-500"></div>

    {/* Tiêu đề */}
    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
      Về{" "}
      <span className="bg-gradient-to-r from-pink-500 to-indigo-500 bg-clip-text text-transparent">
        Fashion Store
      </span>
    </h2>

    {/* Nội dung */}
    <p className="text-lg leading-8 text-gray-600 dark:text-neutral-300">
      <strong className="text-gray-900 dark:text-white">Fashion Store</strong> là điểm đến lý tưởng cho
      những ai yêu thích phong cách và sự khác biệt. Chúng tôi mang đến các bộ sưu tập thời trang
      từ thường ngày đến cao cấp, giúp bạn tự tin thể hiện cá tính riêng.
    </p>
    <p className="mt-4 text-lg leading-8 text-gray-600 dark:text-neutral-300">
      Với chất lượng sản phẩm cao cấp, dịch vụ chuyên nghiệp và xu hướng cập nhật liên tục, Fashion
      Store cam kết mang lại trải nghiệm mua sắm sang trọng và đẳng cấp.
    </p>

    {/* Dòng tag nhỏ phía dưới */}
    <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm font-medium">
      <span className="px-4 py-1.5 rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300">
        Bộ sưu tập mới mỗi tuần
      </span>
      <span className="px-4 py-1.5 rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300">
        Đổi trả 7 ngày
      </span>
      <span className="px-4 py-1.5 rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300">
        Hỗ trợ 24/7
      </span>
    </div>
  </div>
</section>

        </>
      )}
      {/* Fixed chat button + mini panel (Home only) */}
      <HomeChatButton />
    </div>
  );
}

function HomeChatButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-[60] h-14 w-14 rounded-full shadow-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center"
        title="Mở trợ lý mini"
      >
        {open ? "×" : "💬"}
      </button>
      <ChatWidget open={open} onOpenChange={setOpen} hideButton={true} />
    </>
  );
}
