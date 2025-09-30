import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000/api";

export default function Categories() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  const fetchCats = async () => {
    try {
      setLoading(true);
      setErr("");

      const res = await fetch(`${API_BASE}/categories`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const list = Array.isArray(data) ? data : data.data ?? [];
      setRows(list);
    } catch (e) {
      if (e.name !== "AbortError") setErr("Không tải được danh mục.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Xóa thẳng, không confirm
  const deleteCat = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/categories/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Xóa thất bại");
      // Cập nhật state ngay, khỏi fetch lại toàn bộ
      setRows((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      alert(e.message);
    }
  };

  useEffect(() => {
    fetchCats();
  }, []);

  return (
    <section style={{ padding: 20 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 style={{ fontSize: 24 }}>Quản lý danh mục</h1>
        <button
          onClick={() => navigate("/admin/categories/add")}
          className="mb-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          + Thêm danh mục
        </button>
      </div>

      {loading && <p>Đang tải dữ liệu…</p>}
      {err && <p style={{ color: "red" }}>{err}</p>}

      {!loading && (
        <div style={{ overflowX: "auto", marginTop: 12 }}>
          <table
            width="100%"
            cellPadding={8}
            style={{ borderCollapse: "collapse", background: "#fff" }}
          >
            <thead>
              <tr style={{ background: "#fafafa" }}>
                <th align="left">ID</th>
                <th align="left">Tên</th>
                <th align="left">Slug</th>
                <th align="center">Ảnh</th>
                <th align="left">Mô tả</th>
                <th align="center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} style={{ borderTop: "1px solid #eee" }}>
                  <td>{c.id}</td>
                  <td>{c.name}</td>
                  <td>{c.slug}</td>
                  <td align="center">
                    {c.image ? (
                      <img
                        src={c.image_url || `${API_BASE}/storage/${c.image}`}
                        alt={c.name}
                        style={{
                          width: 60,
height: 40,
                          objectFit: "cover",
                          borderRadius: 4,
                        }}
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>{c.description}</td>
                  <td align="center">
                    <button
                      onClick={() =>
                        navigate(`/admin/categories/edit/${c.id}`)
                      }
                      style={{
                        padding: "4px 10px",
                        marginRight: 4,
                        background: "#2e7d32",
                        color: "#fff",
                        border: 0,
                        borderRadius: 6,
                        cursor: "pointer",
                      }}
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => deleteCat(c.id)}
                      style={{
                        padding: "4px 10px",
                        background: "#c62828",
                        color: "#fff",
                        border: 0,
                        borderRadius: 6,
                        cursor: "pointer",
                      }}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td
                    colSpan={6}
                    align="center"
                    style={{ padding: 18, color: "#777" }}
                  >
                    Trống
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
