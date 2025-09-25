import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "../../components/ProductCard";

const API_BASE = "http://127.0.0.1:8000";
const PLACEHOLDER = "https://placehold.co/300x200?text=No+Image";

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [newItems, setNewItems] = useState([]);
  const [saleItems, setSaleItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const ac = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setError("");

        // ✅ Lấy danh mục
        const resCats = await fetch(`${API_BASE}/categories`, { signal: ac.signal });
        if (!resCats.ok) throw new Error(`HTTP ${resCats.status}`);
        const cats = await resCats.json();
        setCategories(Array.isArray(cats) ? cats : cats?.data ?? []);

        // ✅ Lấy sản phẩm
        const resProds = await fetch(`${API_BASE}/products`, { signal: ac.signal });
        if (!resProds.ok) throw new Error(`HTTP ${resProds.status}`);
        const prods = await resProds.json();

        const list = Array.isArray(prods) ? prods : prods?.data ?? [];
        setNewItems(list.slice(0, 4));
        setSaleItems(list.slice(-4));
      } catch (err) {
        if (err.name !== "AbortError") setError("Không tải được dữ liệu");
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, []);

  return (
    <div
      style={{
        fontFamily: "Montserrat, Arial, sans-serif",
        background: "#fafafa", // nền sáng
        minHeight: "100vh",
      }}
    >
      {/* Hero */}
      <section
        style={{
          position: "relative",
          textAlign: "center",
          color: "#fff",
        }}
      >
        <img
  src="http://127.0.0.1:8000/assets/images/banner1.jpg"
  alt="Fashion Banner"
  style={{
    width: "100%",
    height: "100%",
    objectFit: "cover",
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
              color: "#212121",
            }}
          >
            StoreFashion
          </h1>
          <p style={{ fontSize: 20, fontWeight: 400, textShadow: "0 2px 6px rgba(0,0,0,0.5)", color: "#212121" }}>
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
      {/* Danh mục cha */}
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
          .filter((c) => !c.parent_id) // chỉ lấy cha
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
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "scale(1.03)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
            >
              <img
                src={c.image_url || PLACEHOLDER}
                alt={c.name}
                style={{
                  width: "100%",
                  height: 160,
                  objectFit: "cover",
                }}
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

      {/* Danh mục con */}
      <h3 style={{ fontSize: 22, fontWeight: 600, margin: "20px 0", color: "#9c27b0" }}>
        Danh mục phụ
      </h3>
      <div
        style={{
          display: "flex",
          gap: 24,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        {categories
          .filter((c) => c.parent_id) // chỉ lấy con
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
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "scale(1.03)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
            >
              <img
                src={c.image_url || PLACEHOLDER}
                alt={c.name}
                style={{
                  width: "100%",
                  height: 120,
                  objectFit: "cover",
                }}
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


      {/* Trạng thái */}
      {loading && (
        <p style={{ textAlign: "center", color: "#e91e63" }}>Đang tải dữ liệu...</p>
      )}
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
                <ProductCard
                  key={p.id}
                  p={{ ...p, image: p.image_url || PLACEHOLDER }}
                />
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
                <ProductCard
                  key={p.id}
                  p={{ ...p, image: p.image_url || PLACEHOLDER }}
                />
              ))}
            </div>
          </section>
        </>
      )}

      {/* About */}
      <section
        style={{
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          padding: "40px 28px",
          margin: "60px auto",
          maxWidth: 800,
          textAlign: "center",
        }}
      >
        <h2
          style={{ fontSize: 26, fontWeight: 600, marginBottom: 16, color: "#111" }}
        >
          Về Fashion Store
        </h2>
        <p style={{ color: "#444", fontSize: 17, lineHeight: 1.7 }}>
          <strong>Fashion Store</strong> là điểm đến lý tưởng cho những ai yêu thích phong cách
          và sự khác biệt. Chúng tôi mang đến các bộ sưu tập thời trang từ thường
          ngày đến cao cấp, giúp bạn tự tin thể hiện cá tính riêng.  
          <br /><br />
          Với chất lượng sản phẩm cao cấp, dịch vụ chuyên nghiệp và xu hướng cập nhật liên tục,
          Fashion Store cam kết mang lại trải nghiệm mua sắm sang trọng và đẳng cấp.
        </p>
      </section>
    </div>
  );
}
