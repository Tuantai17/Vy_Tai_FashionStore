import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000/api";

export default function Products() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [view, setView] = useState("active"); // "active" | "trash"

  // ===== phân trang =====
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 10;

  const navigate = useNavigate();
  const APP_BASE = API_BASE.replace(/\/api$/, "");

  // ===== fetch theo view + page =====
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErr("");

        const endpoint =
          view === "trash"
            ? `${API_BASE}/admin/products/trash?per_page=${perPage}&page=${page}`
            : `${API_BASE}/admin/products?per_page=${perPage}&page=${page}`;

        const res = await fetch(endpoint, { signal: ac.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (Array.isArray(data)) {
          setItems(data);
          setLastPage(1);
          setTotal(data.length);
        } else {
          const list = data.data ?? [];
          setItems(list);
          setLastPage(Number(data.last_page ?? 1));
          setTotal(Number(data.total ?? list.length));
        }

        setSelectedIds(new Set());
      } catch (e) {
        if (e.name !== "AbortError") setErr("Không tải được danh sách sản phẩm.");
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [view, page]);

  useEffect(() => {
    setPage(1);
  }, [view]);

  // ===== soft delete 1 (xóa tạm) =====
  const handleSoftDelete = async (id) => {
    if (!window.confirm(`Xoá tạm sản phẩm #${id}?`)) return;
    const token = localStorage.getItem("authToken") || localStorage.getItem("token") || "";
    try {
      const fd = new FormData();
      fd.append("_method", "DELETE");
      const res = await fetch(`${API_BASE}/admin/products/${id}`, {
        method: "POST",
        headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: fd,
      });
      if (!res.ok) throw new Error("Xoá tạm thất bại");

      setItems((list) => list.filter((x) => x.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      alert("✅ Đã chuyển vào Thùng rác");

      if (items.length === 1 && page > 1) setPage((p) => p - 1);
    } catch (e) {
      alert("❌ " + (e.message || "Không xoá tạm được"));
    }
  };

  // ===== khôi phục 1 =====
  const handleRestore = async (id) => {
    const token = localStorage.getItem("authToken") || localStorage.getItem("token") || "";
    try {
      const res = await fetch(`${API_BASE}/admin/products/${id}/restore`, {
        method: "POST",
        headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) throw new Error("Khôi phục thất bại");
      setItems((list) => list.filter((x) => x.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      alert("✅ Đã khôi phục");

      if (items.length === 1 && page > 1) setPage((p) => p - 1);
    } catch (e) {
      alert("❌ " + (e.message || "Không khôi phục được"));
    }
  };

  // ===== xóa vĩnh viễn 1 =====
  const handleForceDelete = async (id) => {
    if (!window.confirm(`Xóa vĩnh viễn sản phẩm #${id}? Hành động không thể hoàn tác!`)) return;
    const token = localStorage.getItem("authToken") || localStorage.getItem("token") || "";
    try {
      const res = await fetch(`${API_BASE}/admin/products/${id}/force-delete`, {
        method: "POST",
        headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) throw new Error("Xóa vĩnh viễn thất bại");
      setItems((list) => list.filter((x) => x.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      alert("🗑️ Đã xóa vĩnh viễn");

      if (items.length === 1 && page > 1) setPage((p) => p - 1);
    } catch (e) {
      alert("❌ " + (e.message || "Không xóa vĩnh viễn được"));
    }
  };

  // ===== bulk theo view =====
  const handleBulkAction = async (action) => {
    if (selectedIds.size === 0) return;

    const token = localStorage.getItem("authToken") || localStorage.getItem("token") || "";
    const ids = Array.from(selectedIds);

    if (action === "soft-delete") {
      if (!window.confirm(`Chuyển ${selectedIds.size} sản phẩm vào Thùng rác?`)) return;
      let ok = 0, fail = 0;
      await Promise.all(
        ids.map(async (id) => {
          try {
            const fd = new FormData();
            fd.append("_method", "DELETE");
            const res = await fetch(`${API_BASE}/admin/products/${id}`, {
              method: "POST",
              headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
              body: fd,
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
      alert(`Hoàn tất: đưa vào thùng rác ${ok} • lỗi ${fail}`);
      if (items.length === ok && page > 1) setPage((p) => p - 1);
      return;
    }

    if (action === "restore") {
      let ok = 0, fail = 0;
      await Promise.all(
        ids.map(async (id) => {
          try {
            const res = await fetch(`${API_BASE}/admin/products/${id}/restore`, {
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
      alert(`Khôi phục xong: thành công ${ok} • lỗi ${fail}`);
      if (items.length === ok && page > 1) setPage((p) => p - 1);
      return;
    }

    if (action === "force-delete") {
      if (!window.confirm(`Xóa vĩnh viễn ${selectedIds.size} sản phẩm? Không thể hoàn tác!`)) return;
      let ok = 0, fail = 0;
      await Promise.all(
        ids.map(async (id) => {
          try {
            const res = await fetch(`${API_BASE}/admin/products/${id}/force-delete`, {
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
      alert(`Đã xóa vĩnh viễn: thành công ${ok} • lỗi ${fail}`);
      if (items.length === ok && page > 1) setPage((p) => p - 1);
      return;
    }
  };

  // ===== SHOW: mở trang chi tiết sản phẩm (có cả đánh giá) =====
  // const handleShowSelected = () => {
  //   if (selectedIds.size !== 1) return;
  //   const id = Array.from(selectedIds)[0];
  //   // Mở trang khách hàng /products/:id (hiển thị đầy đủ thông tin + reviews)
  //   window.open(`/products/${id}`, "_blank"); // mở tab mới; dùng navigate(`/products/${id}`) nếu muốn trong SPA
  // };

  const handleShowSelected = () => {
   if (selectedIds.size !== 1) return;
   const id = Array.from(selectedIds)[0];
   // sang trang show ở admin
   navigate(`/admin/products/${id}`);
 };

  // ===== filter client =====
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter(
      (x) => x.name?.toLowerCase().includes(s) || x.slug?.toLowerCase().includes(s)
    );
  }, [q, items]);

  // ===== chọn/bỏ chọn =====
  const toggleOne = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const allVisibleIds = filtered.map((x) => x.id);
  const isAllVisibleChecked =
    allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedIds.has(id));
  const toggleAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (isAllVisibleChecked) {
        allVisibleIds.forEach((id) => next.delete(id));
      } else {
        allVisibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  // ===== điều khiển trang =====
  const gotoPage = (p) => {
    if (p < 1 || p > lastPage || p === page) return;
    setPage(p);
  };

  // ===== mảng số trang =====
  const pageNumbers = useMemo(() => {
    const maxButtons = 7;
    const pages = [];
    if (lastPage <= maxButtons) {
      for (let i = 1; i <= lastPage; i++) pages.push(i);
    } else {
      let start = Math.max(1, page - 3);
      let end = Math.min(lastPage, page + 3);
      if (page <= 4) {
        start = 1; end = 7;
      } else if (page >= lastPage - 3) {
        start = lastPage - 6; end = lastPage;
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
          Quản lý sản phẩm {view === "trash" ? "— Thùng rác" : ""}
        </h1>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
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
              width: 200,
            }}
          />

          {view === "active" ? (
            <>
              {/* Nút Xem (SHOW) — bật khi chọn đúng 1 sản phẩm */}
              <button
                onClick={handleShowSelected}
                disabled={selectedIds.size !== 1}
                title={
                  selectedIds.size === 1
                    ? "Xem chi tiết sản phẩm (mở tab mới)"
                    : "Chọn đúng 1 sản phẩm để xem"
                }
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1px solid #2563eb",
                  background: selectedIds.size === 1 ? "#fff" : "#f1f5f9",
                  color: selectedIds.size === 1 ? "#1d4ed8" : "#94a3b8",
                  cursor: selectedIds.size === 1 ? "pointer" : "not-allowed",
                  fontWeight: 700,
                }}
              >
                Xem
              </button>

              <button
                onClick={() => handleBulkAction("soft-delete")}
                disabled={selectedIds.size === 0}
                title={selectedIds.size ? `Đưa ${selectedIds.size} vào Thùng rác` : "Chọn mục để xoá tạm"}
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "none",
                  background: selectedIds.size ? "#dc2626" : "rgba(220,38,38,.5)",
                  color: "#fff",
                  cursor: selectedIds.size ? "pointer" : "not-allowed",
                  fontWeight: 700,
                  boxShadow: selectedIds.size ? "0 3px 8px rgba(220,38,38,.35)" : "none",
                }}
              >
                Xóa tạm (đã chọn){selectedIds.size ? ` (${selectedIds.size})` : ""}
              </button>

              <button
                onClick={() => navigate("/admin/products/new")}
                style={{
                  padding: "8px 14px",
                  borderRadius: 10,
                  border: "none",
                  background: "linear-gradient(90deg,#2563eb,#0ea5e9)",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: 600,
                  boxShadow: "0 3px 8px rgba(37,99,235,.35)",
                }}
              >
                + Add
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleBulkAction("restore")}
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
                onClick={() => handleBulkAction("force-delete")}
                disabled={selectedIds.size === 0}
                title={selectedIds.size ? `Xóa vĩnh viễn ${selectedIds.size} mục` : "Chọn mục để xóa vĩnh viễn"}
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
                Xóa vĩnh viễn (đã chọn){selectedIds.size ? ` (${selectedIds.size})` : ""}
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
              background: "rgba(255,255,255,0.9)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            }}
          >
            <table
              width="100%"
              cellPadding={10}
              style={{
                borderCollapse: "collapse",
                borderRadius: 12,
                overflow: "hidden",
              }}
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
                  <th style={{ textAlign: "right" }}>Giá gốc</th>
                  <th style={{ textAlign: "right" }}>Giá sale</th>
                  <th style={{ textAlign: "right" }}>Tồn kho</th>
                  <th style={{ textAlign: "center" }}>Ảnh</th>
                  <th style={{ textAlign: "center" }}>Hành động</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((p, i) => (
                  <tr
                    key={p.id}
                    style={{
                      background:
                        i % 2 === 0 ? "rgba(255,255,255,0.9)" : "rgba(248,250,252,0.95)",
                      borderTop: "1px solid #eee",
                      transition: "background .2s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background =
                        i % 2 === 0 ? "rgba(255,255,255,0.9)" : "rgba(248,250,252,0.95)")
                    }
                  >
                    <td align="center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(p.id)}
                        onChange={() => toggleOne(p.id)}
                      />
                    </td>

                    <td>{p.id}</td>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td style={{ color: "#475569" }}>{p.slug}</td>
                    <td align="right">₫{(p.price_root || 0).toLocaleString("vi-VN")}</td>
                    <td align="right">₫{(p.price_sale || 0).toLocaleString("vi-VN")}</td>
                    <td align="right" style={{ fontWeight: 600 }}>
                      {p.qty}
                    </td>
                    <td align="center">
                      <img
                        src={p.thumbnail_url || `${APP_BASE}/storage/${p.thumbnail}`}
                        alt={p.name}
                        style={{
                          width: 60,
                          height: 40,
                          objectFit: "cover",
                          borderRadius: 6,
                          boxShadow: "0 0 4px rgba(0,0,0,.15)",
                        }}
                      />
                    </td>
                    <td align="center">
                      {view === "active" ? (
                        <>
                          <button
                            onClick={() => navigate(`/admin/products/${p.id}/edit`)}
                            style={{
                              padding: "4px 12px",
                              marginRight: 6,
                              background: "#16a34a",
                              color: "#fff",
                              border: 0,
                              borderRadius: 8,
                              cursor: "pointer",
                              fontWeight: 600,
                            }}
                          >
                            Sửa
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleRestore(p.id)}
                            style={{
                              padding: "4px 12px",
                              marginRight: 6,
                              background: "#0ea5e9",
                              color: "#fff",
                              border: 0,
                              borderRadius: 8,
                              cursor: "pointer",
                              fontWeight: 600,
                            }}
                          >
                            Khôi phục
                          </button>
                          <button
                            onClick={() => handleForceDelete(p.id)}
                            style={{
                              padding: "4px 12px",
                              background: "#b91c1c",
                              color: "#fff",
                              border: 0,
                              borderRadius: 8,
                              cursor: "pointer",
                              fontWeight: 600,
                            }}
                          >
                            Xóa vĩnh viễn
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr>
                    <td colSpan={9} align="center" style={{ padding: 20, color: "#6b7280" }}>
                      Không có dữ liệu
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ====== PHÂN TRANG ====== */}
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
            <div style={{ fontSize: 14, color: "#111827" }}>
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
                  color: "#111827",
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
                  color: "#111827",
                }}
              >
                ‹ Trước
              </button>

              {pageNumbers.map((n) => {
                const isActive = n === page;
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
                      fontWeight: isActive ? 800 : 600,
                      textDecoration: isActive ? "underline" : "none",
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
                  color: "#111827",
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
                  color: "#111827",
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
