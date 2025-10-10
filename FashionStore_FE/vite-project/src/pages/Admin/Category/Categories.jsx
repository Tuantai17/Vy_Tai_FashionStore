import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000/api";


export default function Categories() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // view: "active" | "trash"
  const [view, setView] = useState("active");

  // phân trang
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 10;

  // chọn nhiều
  const [selectedIds, setSelectedIds] = useState(new Set());

  const navigate = useNavigate();

const fetchCats = async (signal) => {
  try {
    setLoading(true);
    setErr("");

    const base = "http://127.0.0.1:8000";
    const path = view === "trash"
      ? "/api/admin/categories/trash"
      : "/api/admin/categories";

    const url = new URL(path, base);
    url.searchParams.set("per_page", String(perPage));
    url.searchParams.set("page", String(page));

    // console.log(url.toString()); // kiểm tra: phải ra http://127.0.0.1:8000/api/admin/categories?per_page=10&page=1

    const res = await fetch(url.toString(), { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (Array.isArray(data)) {
      setRows(data);
      setLastPage(1);
      setTotal(data.length);
    } else {
      const list = data.data ?? [];
      setRows(list);
      setLastPage(Number(data.last_page ?? 1));
      setTotal(Number(data.total ?? list.length));
    }
    setSelectedIds(new Set());
  } catch (e) {
    if (e.name !== "AbortError") setErr("Không tải được danh mục.");
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    const ac = new AbortController();
    fetchCats(ac.signal);
    return () => ac.abort();
  }, [view, page]);

  // đổi view -> quay lại trang 1
  useEffect(() => {
    setPage(1);
  }, [view]);

  // ===== hành động từng item =====
  const token =
    localStorage.getItem("authToken") || localStorage.getItem("token") || "";

  const softDeleteOne = async (id) => {
    if (!window.confirm(`Chuyển danh mục #${id} vào Thùng rác?`)) return;
    try {
      // dùng method spoof giống Product
      const fd = new FormData();
      fd.append("_method", "DELETE");
      const res = await fetch(`${API_BASE}/admin/categories/${id}`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: fd,
      });
      if (!res.ok) throw new Error("Xoá tạm thất bại");
      setRows((prev) => prev.filter((x) => x.id !== id));
      setSelectedIds((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
      alert("✅ Đã chuyển vào Thùng rác");
      if (rows.length === 1 && page > 1) setPage((p) => p - 1);
    } catch (e) {
      alert("❌ " + (e.message || "Không xoá tạm được"));
    }
  };

  const restoreOne = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/admin/categories/${id}/restore`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error("Khôi phục thất bại");
      setRows((prev) => prev.filter((x) => x.id !== id));
      setSelectedIds((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
      alert("✅ Đã khôi phục");
      if (rows.length === 1 && page > 1) setPage((p) => p - 1);
    } catch (e) {
      alert("❌ " + (e.message || "Không khôi phục được"));
    }
  };

  const forceDeleteOne = async (id) => {
    if (!window.confirm(`Xoá vĩnh viễn danh mục #${id}? Không thể hoàn tác!`))
      return;
    try {
      const res = await fetch(
        `${API_BASE}/admin/categories/${id}/force-delete`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      if (!res.ok) throw new Error("Xoá vĩnh viễn thất bại");
      setRows((prev) => prev.filter((x) => x.id !== id));
      setSelectedIds((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
      alert("🗑️ Đã xoá vĩnh viễn");
      if (rows.length === 1 && page > 1) setPage((p) => p - 1);
    } catch (e) {
      alert("❌ " + (e.message || "Không xoá vĩnh viễn được"));
    }
  };

  // ===== bulk =====
  const handleBulk = async (action) => {
    if (!selectedIds.size) return;
    const ids = Array.from(selectedIds);
    let ok = 0,
      fail = 0;

    if (action === "soft-delete") {
      if (!window.confirm(`Đưa ${ids.length} danh mục vào Thùng rác?`)) return;
      await Promise.all(
        ids.map(async (id) => {
          try {
            const fd = new FormData();
            fd.append("_method", "DELETE");
            const res = await fetch(`${API_BASE}/admin/categories/${id}`, {
              method: "POST",
              headers: {
                Accept: "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: fd,
            });
            if (!res.ok) throw new Error();
            ok++;
          } catch {
            fail++;
          }
        })
      );
      if (ok) setRows((list) => list.filter((x) => !selectedIds.has(x.id)));
      setSelectedIds(new Set());
      alert(`Hoàn tất: đưa vào thùng rác ${ok} • lỗi ${fail}`);
      if (rows.length === ok && page > 1) setPage((p) => p - 1);
      return;
    }

    if (action === "restore") {
      await Promise.all(
        ids.map(async (id) => {
          try {
            const res = await fetch(
              `${API_BASE}/admin/categories/${id}/restore`,
              {
                method: "POST",
                headers: {
                  Accept: "application/json",
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
              }
            );
            if (!res.ok) throw new Error();
            ok++;
          } catch {
            fail++;
          }
        })
      );
      if (ok) setRows((list) => list.filter((x) => !selectedIds.has(x.id)));
      setSelectedIds(new Set());
      alert(`Khôi phục xong: thành công ${ok} • lỗi ${fail}`);
      if (rows.length === ok && page > 1) setPage((p) => p - 1);
      return;
    }

    if (action === "force-delete") {
      if (!window.confirm(`Xoá vĩnh viễn ${ids.length} danh mục?`)) return;
      await Promise.all(
        ids.map(async (id) => {
          try {
            const res = await fetch(
              `${API_BASE}/admin/categories/${id}/force-delete`,
              {
                method: "POST",
                headers: {
                  Accept: "application/json",
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
              }
            );
            if (!res.ok) throw new Error();
            ok++;
          } catch {
            fail++;
          }
        })
      );
      if (ok) setRows((list) => list.filter((x) => !selectedIds.has(x.id)));
      setSelectedIds(new Set());
      alert(`Đã xoá vĩnh viễn: thành công ${ok} • lỗi ${fail}`);
      if (rows.length === ok && page > 1) setPage((p) => p - 1);
      return;
    }
  };

  // ===== filter client (trong trang hiện tại) =====
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(
      (x) =>
        x.name?.toLowerCase().includes(s) || x.slug?.toLowerCase().includes(s)
    );
  }, [q, rows]);

  // tick chọn
  const toggleOne = (id) =>
    setSelectedIds((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const allVisibleIds = filtered.map((x) => x.id);
  const isAllVisibleChecked =
    allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedIds.has(id));
  const toggleAllVisible = () =>
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (isAllVisibleChecked) {
        allVisibleIds.forEach((id) => n.delete(id));
      } else {
        allVisibleIds.forEach((id) => n.add(id));
      }
      return n;
    });

  // phân trang
  const gotoPage = (p) => {
    if (p < 1 || p > lastPage || p === page) return;
    setPage(p);
  };
  const pageNumbers = useMemo(() => {
    const maxButtons = 7;
    const pages = [];
    if (lastPage <= maxButtons) {
      for (let i = 1; i <= lastPage; i++) pages.push(i);
    } else {
      let start = Math.max(1, page - 3);
      let end = Math.min(lastPage, page + 3);
      if (page <= 4) {
        start = 1;
        end = 7;
      } else if (page >= lastPage - 3) {
        start = lastPage - 6;
        end = lastPage;
      }
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  }, [page, lastPage]);

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
          Quản lý danh mục {view === "trash" ? "— Thùng rác" : ""}
        </h1>

        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm tên/slug…"
            style={{
              height: 38,
              padding: "0 12px",
              border: "1px solid rgba(255,255,255,.25)",
              borderRadius: 10,
              background: "rgba(255,255,255,0.2)",
              color: "#fff",
              backdropFilter: "blur(6px)",
              outline: "none",
              width: 220,
            }}
          />

          {view === "active" ? (
            <>
              <button
                onClick={() => handleBulk("soft-delete")}
                disabled={selectedIds.size === 0}
                title={
                  selectedIds.size
                    ? `Đưa ${selectedIds.size} vào Thùng rác`
                    : "Chọn mục để xoá tạm"
                }
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "none",
                  background: selectedIds.size
                    ? "#dc2626"
                    : "rgba(220,38,38,.5)",
                  color: "#fff",
                  cursor: selectedIds.size ? "pointer" : "not-allowed",
                  fontWeight: 700,
                  boxShadow: selectedIds.size
                    ? "0 3px 8px rgba(220,38,38,.35)"
                    : "none",
                }}
              >
                Xoá tạm (đã chọn)
                {selectedIds.size ? ` (${selectedIds.size})` : ""}
              </button>

              <button
                onClick={() => navigate("/admin/categories/add")}
                style={{
                  padding: "8px 14px",
                  borderRadius: 10,
                  border: "none",
                  background: "linear-gradient(90deg,#16a34a,#4ade80)",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: 600,
                  boxShadow: "0 3px 8px rgba(22,163,74,.35)",
                }}
              >
                + Thêm
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleBulk("restore")}
                disabled={selectedIds.size === 0}
                title={
                  selectedIds.size
                    ? `Khôi phục ${selectedIds.size} mục`
                    : "Chọn mục để khôi phục"
                }
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "none",
                  background: selectedIds.size
                    ? "#16a34a"
                    : "rgba(22,163,74,.5)",
                  color: "#fff",
                  cursor: selectedIds.size ? "pointer" : "not-allowed",
                  fontWeight: 700,
                }}
              >
                Khôi phục (đã chọn)
                {selectedIds.size ? ` (${selectedIds.size})` : ""}
              </button>
              <button
                onClick={() => handleBulk("force-delete")}
                disabled={selectedIds.size === 0}
                title={
                  selectedIds.size
                    ? `Xoá vĩnh viễn ${selectedIds.size} mục`
                    : "Chọn mục để xoá vĩnh viễn"
                }
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "none",
                  background: selectedIds.size
                    ? "#b91c1c"
                    : "rgba(185,28,28,.5)",
                  color: "#fff",
                  cursor: selectedIds.size ? "pointer" : "not-allowed",
                  fontWeight: 700,
                }}
              >
                Xoá vĩnh viễn (đã chọn)
                {selectedIds.size ? ` (${selectedIds.size})` : ""}
              </button>
            </>
          )}

          <button
            onClick={() => setView((v) => (v === "active" ? "trash" : "active"))}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              background: view === "trash" ? "#fff" : "#f8fafc",
              color: "#111827",
              fontWeight: 700,
            }}
          >
            {view === "trash" ? "← Quay lại danh sách" : "🗑️ Thùng rác"}
          </button>
        </div>
      </div>

      {loading && <p style={{ color: "#ddd" }}>Đang tải dữ liệu…</p>}
      {err && <p style={{ color: "red" }}>{err}</p>}

      {!loading && (
        <>
          <div
            style={{
              overflowX: "auto",
              marginTop: 12,
              borderRadius: 12,
              background: "rgba(255,255,255,0.92)",
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
                    background:
                      "linear-gradient(90deg, rgba(255,255,255,1), rgba(248,250,252,0.95))",
                    color: "#1f2937",
                    fontWeight: 700,
                    textAlign: "left",
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
                  <th style={{ textAlign: "center" }}>Hành động</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((c, i) => (
                  <tr
                    key={c.id}
                    style={{
                      background:
                        i % 2 === 0 ? "rgba(255,255,255,0.98)" : "rgba(248,250,252,0.95)",
                      borderTop: "1px solid #eee",
                      transition: "background .2s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background =
                        i % 2 === 0 ? "rgba(255,255,255,0.98)" : "rgba(248,250,252,0.95)")
                    }
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
                      {c.image || c.image_url ? (
                        <img
                          src={c.image_url || `${APP_BASE}/storage/${c.image}`}
                          alt={c.name}
                          style={{
                            width: 60,
                            height: 40,
                            objectFit: "cover",
                            borderRadius: 6,
                            boxShadow: "0 0 4px rgba(0,0,0,.15)",
                          }}
                          onError={(e) => (e.currentTarget.src = `${APP_BASE}/assets/images/no-image.png`)}
                        />
                      ) : (
                        "-"
                      )}
                    </td>
                    <td style={{ color: "#374151" }}>{c.description}</td>

                    <td align="center">
                      {view === "active" ? (
                        <>
                          <button
                            onClick={() => navigate(`/admin/categories/edit/${c.id}`)}
                            style={{
                              padding: "6px 14px",
                              background: "#16a34a",
                              color: "#fff",
                              border: 0,
                              borderRadius: 8,
                              cursor: "pointer",
                              fontWeight: 600,
                              marginRight: 6,
                            }}
                          >
                            Sửa
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => restoreOne(c.id)}
                            style={{
                              padding: "6px 14px",
                              background: "#0ea5e9",
                              color: "#fff",
                              border: 0,
                              borderRadius: 8,
                              cursor: "pointer",
                              fontWeight: 600,
                              marginRight: 6,
                            }}
                          >
                            Khôi phục
                          </button>
                          <button
                            onClick={() => forceDeleteOne(c.id)}
                            style={{
                              padding: "6px 14px",
                              background: "#b91c1c",
                              color: "#fff",
                              border: 0,
                              borderRadius: 8,
                              cursor: "pointer",
                              fontWeight: 600,
                            }}
                          >
                            Xoá vĩnh viễn
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}

                {!filtered.length && (
                  <tr>
                    <td colSpan={7} align="center" style={{ padding: 20, color: "#6b7280" }}>
                      Không có dữ liệu
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PHÂN TRANG */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginTop: 14,
              background: "rgba(255,255,255,0.9)",
              borderRadius: 10,
              padding: "10px 12px",
              boxShadow: "0 2px 10px rgba(0,0,0,.08)",
              color: "#111827",
            }}
          >
            <div style={{ fontSize: 14 }}>
              Trang <b>{page}</b> / <b>{lastPage}</b> — Tổng: <b>{total}</b>
            </div>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button
                onClick={() => gotoPage(1)}
                disabled={page <= 1}
                style={{
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  background: page <= 1 ? "#f3f4f6" : "#fff",
                  cursor: page <= 1 ? "not-allowed" : "pointer",
                }}
              >
                « Đầu
              </button>
              <button
                onClick={() => gotoPage(page - 1)}
                disabled={page <= 1}
                style={{
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  background: page <= 1 ? "#f3f4f6" : "#fff",
                  cursor: page <= 1 ? "not-allowed" : "pointer",
                }}
              >
                ‹ Trước
              </button>

              {pageNumbers.map((n) => {
                const active = n === page;
                return (
                  <button
                    key={n}
                    onClick={() => gotoPage(n)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: "1px solid #111827",
                      background: "#fff",
                      color: "#111827",
                      fontWeight: active ? 800 : 600,
                      textDecoration: active ? "underline" : "none",
                    }}
                  >
                    {n}
                  </button>
                );
              })}

              <button
                onClick={() => gotoPage(page + 1)}
                disabled={page >= lastPage}
                style={{
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  background: page >= lastPage ? "#f3f4f6" : "#fff",
                  cursor: page >= lastPage ? "not-allowed" : "pointer",
                }}
              >
                Sau ›
              </button>
              <button
                onClick={() => gotoPage(lastPage)}
                disabled={page >= lastPage}
                style={{
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  background: page >= lastPage ? "#f3f4f6" : "#fff",
                  cursor: page >= lastPage ? "not-allowed" : "pointer",
                }}
              >
                Cuối »
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
