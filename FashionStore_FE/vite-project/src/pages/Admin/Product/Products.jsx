import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000/api"; // ✅ nếu BE dùng prefix /api

export default function Products() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  // ==== load list ====
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

  // ==== delete (persist to DB) ====
  const handleDelete = async (id) => {
    if (!window.confirm(`Xoá sản phẩm #${id}?`)) return;

    const token = localStorage.getItem("authToken") || localStorage.getItem("token") || "";

    try {
      // Dùng POST + _method=DELETE để an toàn với multipart/proxy
      const fd = new FormData();
      fd.append("_method", "DELETE");

      const res = await fetch(`${API_BASE}/admin/products/${id}`, {
        method: "POST", // hoặc "DELETE" nếu server cho phép
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: fd,
      });

      if (!res.ok) {
        const ct = res.headers.get("content-type") || "";
        const payload = ct.includes("application/json") ? await res.json() : { message: await res.text() };
        if (res.status === 401) throw new Error("Bạn chưa đăng nhập hoặc token hết hạn.");
        if (res.status === 404) throw new Error("Sản phẩm không tồn tại.");
        throw new Error(payload.message || `Xoá thất bại (HTTP ${res.status}).`);
      }

      // Cập nhật UI (optimistic)
      setItems((list) => list.filter((x) => x.id !== id));
      alert("✅ Đã xoá sản phẩm");
    } catch (e) {
      alert("❌ " + (e.message || "Không xoá được"));
    }
  };

  // ==== filter ====
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter(
      (x) => x.name.toLowerCase().includes(s) || x.slug?.toLowerCase().includes(s)
    );
  }, [q, items]);

  const APP_BASE = API_BASE.replace(/\/api$/, ""); // để hiển thị ảnh /storage/...

  return (
    <section style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <h1 style={{ fontSize: 24 }}>Quản lý sản phẩm</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm tên/slug…"
            style={{ height: 36, padding: "0 10px", border: "1px solid #ddd", borderRadius: 8 }}
          />
          <button
            onClick={() => navigate("/admin/products/new")}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #0f62fe", background: "#0f62fe", color: "#fff", cursor: "pointer" }}
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
                  <td align="right">₫{(p.price_root || 0).toLocaleString("vi-VN")}</td>
                  <td align="right">₫{(p.price_sale || 0).toLocaleString("vi-VN")}</td>
                  <td align="right">{p.qty}</td>
                  <td align="center">
                    <img
                      src={p.thumbnail_url || `${APP_BASE}/storage/${p.thumbnail}`}
                      alt={p.name}
                      style={{ width: 60, height: 40, objectFit: "cover", borderRadius: 4 }}
                    />
                  </td>
                  <td align="center">
                    <button
                      onClick={() => navigate(`/admin/products/${p.id}/edit`)}
                      style={{ padding: "4px 10px", marginRight: 4, background: "#2e7d32", color: "#fff", border: 0, borderRadius: 6, cursor: "pointer" }}
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}   // ✅ gọi API xoá
                      style={{ padding: "4px 10px", background: "#c62828", color: "#fff", border: 0, borderRadius: 6, cursor: "pointer" }}
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
