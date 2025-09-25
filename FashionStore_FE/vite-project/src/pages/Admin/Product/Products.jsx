import { useEffect, useMemo, useState } from "react";

const API_BASE = "http://127.0.0.1:8000"; // Laravel API

export default function Products() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Lấy sản phẩm từ API (admin)
  useEffect(() => {
    const ac = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setErr("");

        const res = await fetch(`${API_BASE}/admin/products`, { signal: ac.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const list = Array.isArray(data) ? data : data.data ?? [];
        setItems(list);
      } catch (e) {
        if (e.name !== "AbortError") setErr("Không tải được danh sách sản phẩm.");
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, []);

  // Filter theo tên hoặc slug
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter(
      (x) =>
        x.name.toLowerCase().includes(s) ||
        x.slug?.toLowerCase().includes(s)
    );
  }, [q, items]);

  return (
    <section style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <h1 style={{ fontSize: 24 }}>Quản lý sản phẩm</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm tên/slug…"
            style={{
              height: 36,
              padding: "0 10px",
              border: "1px solid #ddd",
              borderRadius: 8,
            }}
          />
          <button
            onClick={() => alert("TODO: mở form tạo sản phẩm")}
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
      </div>

      {loading && <p>Đang tải dữ liệu…</p>}
      {err && <p style={{ color: "red" }}>{err}</p>}

      {!loading && (
        <div style={{ overflowX: "auto", marginTop: 12 }}>
          <table width="100%" cellPadding={8} style={{ borderCollapse: "collapse", background: "#fff" }}>
            <thead>
              <tr style={{ background: "#fafafa" }}>
                <th align="left">ID</th>
                <th align="left">Tên</th>
                <th align="left">Slug</th>
                <th align="right">Giá gốc</th>
                <th align="right">Giá sale</th>
                <th align="right">Tồn kho</th>
                <th align="center">Ảnh</th>
                <th align="center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} style={{ borderTop: "1px solid #eee" }}>
                  <td>{p.id}</td>
                  <td>{p.name}</td>
                  <td>{p.slug}</td>

                  {/* Giá gốc */}
                  <td align="right">₫{(p.price_root || 0).toLocaleString("vi-VN")}</td>

                  {/* Giá sale */}
                  <td align="right">₫{(p.price_sale || 0).toLocaleString("vi-VN")}</td>

                  <td align="right">{p.qty}</td>
                  <td align="center">
                    <img
                      src={p.thumbnail_url || `${API_BASE}/storage/${p.thumbnail}`}
                      alt={p.name}
                      style={{
                        width: 60,
                        height: 40,
                        objectFit: "cover",
                        borderRadius: 4,
                      }}
                    />
                  </td>
                  <td align="center">
                    <button
                      onClick={() => alert("Edit " + p.id)}
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
                      onClick={() => setItems(items.filter((x) => x.id !== p.id))}
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
              {!filtered.length && (
                <tr>
                  <td colSpan={8} align="center" style={{ padding: 18, color: "#777" }}>
                    Không có dữ liệu
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
