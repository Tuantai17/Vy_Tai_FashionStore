import { useEffect, useState } from "react";

const API_BASE = "http://127.0.0.1:8000"; // Laravel API

export default function Categories() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const ac = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setErr("");

        const res = await fetch(`${API_BASE}/categories`, { signal: ac.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const list = Array.isArray(data) ? data : data.data ?? [];
        setRows(list);
      } catch (e) {
        if (e.name !== "AbortError") setErr("Không tải được danh mục.");
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, []);

  return (
    <section style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 24 }}>Quản lý danh mục</h1>
        <button
          onClick={() => alert("TODO: tạo danh mục")}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #0f62fe",
            background: "#0f62fe",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          + Add
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
                  </td>
                  <td>{c.description}</td>
                  <td align="center">
                    <button
                      onClick={() => alert("Edit " + c.id)}
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
                      onClick={() => setRows(rows.filter((x) => x.id !== c.id))}
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
