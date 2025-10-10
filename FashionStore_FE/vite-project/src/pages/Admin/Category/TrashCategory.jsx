// CategoryTrash.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000/api";

export default function CategoryTrash() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());

  // pagination
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);

  const token =
    localStorage.getItem("authToken") || localStorage.getItem("token") || "";

  // ===== load trash with paginator =====
  const fetchTrash = async (signal) => {
    const usp = new URLSearchParams();
    usp.set("page", String(page));
    usp.set("per_page", String(perPage));
    if (q.trim()) usp.set("q", q.trim());

    const res = await fetch(`${API_BASE}/admin/categories/trash?${usp.toString()}`, { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const list = Array.isArray(data) ? data : data.data ?? [];
    setItems(list);
    setTotal(data.total ?? list.length ?? 0);
    setLastPage(data.last_page ?? 1);
    setPage(data.current_page ?? page);
  };

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErr("");
        await fetchTrash(ac.signal);
        setSelectedIds(new Set()); // reset chọn khi refetch
      } catch (e) {
        if (e.name !== "AbortError") setErr("Không tải được thùng rác danh mục.");
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [page, perPage]);

  const handleSearch = async () => {
    setPage(1);
    const ac = new AbortController();
    try {
      setLoading(true);
      await fetchTrash(ac.signal);
      setSelectedIds(new Set());
    } catch (e) {
      if (e.name !== "AbortError") setErr("Không tải được thùng rác danh mục.");
    } finally {
      setLoading(false);
    }
  };

  // ===== one: restore & force-delete =====
  const handleRestore = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/admin/categories/${id}/restore`, {
        method: "POST",
        headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) throw new Error("Khôi phục thất bại");
      setItems((list) => list.filter((x) => x.id !== id));
      setSelectedIds((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
      if (items.length === 1 && page > 1) setPage((p) => p - 1);
      alert("✅ Đã khôi phục");
    } catch (e) {
      alert("❌ " + (e.message || "Không khôi phục được"));
    }
  };

  const handleForceDelete = async (id) => {
    if (!window.confirm(`Xoá vĩnh viễn danh mục #${id}? Không thể hoàn tác!`)) return;
    try {
      const res = await fetch(`${API_BASE}/admin/categories/${id}/force-delete`, {
        method: "POST",
        headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) throw new Error("Xoá vĩnh viễn thất bại");
      setItems((list) => list.filter((x) => x.id !== id));
      setSelectedIds((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
      if (items.length === 1 && page > 1) setPage((p) => p - 1);
      alert("🗑️ Đã xoá vĩnh viễn");
    } catch (e) {
      alert("❌ " + (e.message || "Không xoá vĩnh viễn được"));
    }
  };

  // ===== bulk: restore & force-delete =====
  const bulkRestore = async () => {
    if (selectedIds.size === 0) return;
    let ok = 0, fail = 0;
    await Promise.all(
      Array.from(selectedIds).map(async (id) => {
        try {
          const res = await fetch(`${API_BASE}/admin/categories/${id}/restore`, {
            method: "POST",
            headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          });
          if (!res.ok) throw new Error();
          ok++;
        } catch {
          fail++;
        }
      })
    );
    if (ok) setItems((list) => list.filter((x) => !selectedIds.has(x.id)));
    setSelectedIds(new Set());
    if (items.length === ok && page > 1) setPage((p) => p - 1);
    alert(`Khôi phục xong: thành công ${ok} • lỗi ${fail}`);
  };

  const bulkForceDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Xoá vĩnh viễn ${selectedIds.size} mục? Không thể hoàn tác!`)) return;
    let ok = 0, fail = 0;
    await Promise.all(
      Array.from(selectedIds).map(async (id) => {
        try {
          const res = await fetch(`${API_BASE}/admin/categories/${id}/force-delete`, {
            method: "POST",
            headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          });
          if (!res.ok) throw new Error();
          ok++;
        } catch {
          fail++;
        }
      })
    );
    if (ok) setItems((list) => list.filter((x) => !selectedIds.has(x.id)));
    setSelectedIds(new Set());
    if (items.length === ok && page > 1) setPage((p) => p - 1);
    alert(`Đã xoá vĩnh viễn: thành công ${ok} • lỗi ${fail}`);
  };

  // ===== client filter (nếu đã search server thì trả thẳng items) =====
  const filtered = useMemo(() => items, [items]);

  // ===== chọn / bỏ chọn =====
  const toggleOne = (id) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const allVisibleIds = filtered.map((x) => x.id);
  const isAllVisibleChecked =
    allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedIds.has(id));
  const toggleAllVisible = () =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (isAllVisibleChecked) {
        allVisibleIds.forEach((id) => next.delete(id));
      } else {
        allVisibleIds.forEach((id) => next.add(id));
      }
      return next;
    });

  // ===== pagination UI =====
  const canPrev = page > 1;
  const canNext = page < lastPage;

  return (
    <section
      style={{
        padding: 20,
        background: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        borderRadius: 16,
        boxShadow: "0 8px 20px rgba(3,10,27,.25)",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: "#fff",
            letterSpacing: 0.3,
            textShadow: "0 1px 2px rgba(0,0,0,.4)",
          }}
        >
          Thùng rác danh mục
        </h1>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo tên/slug…"
            style={{
              height: 38,
              padding: "0 12px",
              border: "1px solid rgba(255,255,255,.25)",
              borderRadius: 10,
              background: "rgba(255,255,255,0.2)",
              color: "#fff",
              width: 220,
              outline: "none",
            }}
          />
          <button
            onClick={handleSearch}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "none",
              background: "#0ea5e9",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Tìm
          </button>

          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value));
              setPage(1);
            }}
            style={{
              height: 38,
              borderRadius: 10,
              padding: "0 10px",
              border: "1px solid #e5e7eb",
              background: "#fff",
              fontWeight: 600,
            }}
          >
            {[10, 12, 20, 30, 50].map((n) => (
              <option key={n} value={n}>
                {n}/trang
              </option>
            ))}
          </select>

          {/* bulk buttons */}
          <button
            onClick={bulkRestore}
            disabled={selectedIds.size === 0}
            title={selectedIds.size ? `Khôi phục ${selectedIds.size} mục` : "Chọn mục để khôi phục"}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "none",
              background: selectedIds.size ? "#16a34a" : "rgba(22,163,74,.5)",
              color: "#fff",
              cursor: selectedIds.size ? "pointer" : "not-allowed",
              fontWeight: 700,
            }}
          >
            Khôi phục (đã chọn){selectedIds.size ? ` (${selectedIds.size})` : ""}
          </button>

          <button
            onClick={bulkForceDelete}
            disabled={selectedIds.size === 0}
            title={selectedIds.size ? `Xoá vĩnh viễn ${selectedIds.size} mục` : "Chọn mục để xoá vĩnh viễn"}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "none",
              background: selectedIds.size ? "#b91c1c" : "rgba(185,28,28,.5)",
              color: "#fff",
              cursor: selectedIds.size ? "pointer" : "not-allowed",
              fontWeight: 700,
            }}
          >
            Xoá vĩnh viễn (đã chọn){selectedIds.size ? ` (${selectedIds.size})` : ""}
          </button>

          <Link
            to="/admin/categories"
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              background: "#f8fafc",
              color: "#111827",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            ← Quay lại danh sách
          </Link>
        </div>
      </div>

      {/* TABLE */}
      {loading && <p style={{ color: "#ddd" }}>Đang tải dữ liệu…</p>}
      {err && <p style={{ color: "red" }}>{err}</p>}

      {!loading && (
        <div
          style={{
            overflowX: "auto",
            marginTop: 12,
            borderRadius: 12,
            background: "rgba(255,255,255,0.9)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          }}
        >
          <table
            width="100%"
            cellPadding={10}
            style={{ borderCollapse: "collapse", borderRadius: 12, overflow: "hidden" }}
          >
            <thead>
              <tr
                style={{
                  background: "linear-gradient(90deg,#fff,#f8fafc)",
                  color: "#1f2937",
                  fontWeight: 700,
                  borderBottom: "2px solid #e5e7eb",
                }}
              >
                <th style={{ width: 48, textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={isAllVisibleChecked}
                    onChange={toggleAllVisible}
                    title="Chọn/Bỏ chọn tất cả (đang hiển thị)"
                  />
                </th>
                <th>ID</th>
                <th>Tên</th>
                <th>Slug</th>
                <th style={{ textAlign: "center" }}>Ảnh</th>
                <th>Mô tả</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr
                  key={c.id}
                  style={{
                    background: i % 2 === 0 ? "rgba(255,255,255,0.9)" : "rgba(248,250,252,0.95)",
                    borderTop: "1px solid #eee",
                  }}
                >
                  <td align="center">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(c.id)}
                      onChange={() => toggleOne(c.id)}
                    />
                  </td>
                  <td>{c.id}</td>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td style={{ color: "#475569" }}>{c.slug}</td>
                  <td align="center">
                    {c.image_url ? (
                      <img
                        src={c.image_url}
                        alt={c.name}
                        style={{ width: 60, height: 40, objectFit: "cover", borderRadius: 6 }}
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td style={{ color: "#374151" }}>{c.description}</td>
                  
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={7} align="center" style={{ padding: 18, color: "#777" }}>
                    Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* PAGINATION FOOTER */}
      {!loading && total > 0 && (
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 12,
            color: "#fff",
          }}
        >
          <div>
            Tổng: <b>{total}</b> — Trang <b>{page}</b>/<b>{lastPage}</b>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => page > 1 && setPage((p) => p - 1)}
              disabled={page <= 1}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                background: page > 1 ? "#fff" : "#f3f4f6",
                cursor: page > 1 ? "pointer" : "not-allowed",
                fontWeight: 600,
              }}
            >
              ← Trước
            </button>
            <button
              onClick={() => page < lastPage && setPage((p) => p + 1)}
              disabled={page >= lastPage}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                background: page < lastPage ? "#fff" : "#f3f4f6",
                cursor: page < lastPage ? "pointer" : "not-allowed",
                fontWeight: 600,
              }}
            >
              Sau →
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
