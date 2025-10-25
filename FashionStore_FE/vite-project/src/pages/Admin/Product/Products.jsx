// src/pages/Admin/Product/Products.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminToken } from "../../../utils/authStorage";

/* ==== BASE URL (ưu tiên .env) ==== */
const API_BASE = (import.meta.env?.VITE_API_BASE || "http://127.0.0.1:8000") + "/api";
const APP_BASE = API_BASE.replace(/\/api$/, ""); // http://127.0.0.1:8000

/* ==== Build URL ảnh an toàn (ưu tiên thumbnail_url từ BE) ==== */
const buildImageUrl = (p) => {
  if (!p) return "";

  // 1) BE accessor đã chuẩn -> dùng ngay
  if (p.thumbnail_url && typeof p.thumbnail_url === "string") {
    return p.thumbnail_url.trim();
  }

  // 2) Fallback theo thumbnail thô trong DB
  let th = (p.thumbnail || "").toString().trim();
  if (!th) return "";

  // a) Đã là URL tuyệt đối
  if (/^https?:\/\//i.test(th)) return th;

  // b) Xử lý các trường hợp để trong public/
  th = th.replace(/^\/+/, ""); // bỏ slash đầu
  if (th.startsWith("public/")) th = th.slice(7); // public/images/.. -> images/..

  if (th.startsWith("assets/") || th.startsWith("images/")) {
    // file nằm ngay trong public
    return `${APP_BASE}/${th}`;
  }

  // c) Mặc định: file đã lưu qua disk 'public' => storage/app/public/...
  return `${APP_BASE}/storage/${th}`;
};

export default function Products() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [view, setView] = useState("active"); // "active" | "trash"

  // ===== filters =====
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [catProductIds, setCatProductIds] = useState(null);

  // ===== paging =====
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 10;

  const navigate = useNavigate();
  const authHeaders = (extra = {}) => {
    const token = getAdminToken();
    const headers = {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extra,
    };
    Object.keys(headers).forEach((k) => headers[k] == null && delete headers[k]);
    return headers;
  };

  // ===== THEME =====
  const colors = {
    text: "#ffffff",
    border: "#ffffff",
    bg: "rgba(255,255,255,0.1)",
    bgDisabled: "rgba(255,255,255,0.2)",
    primary: "#00bcd4",
    danger: "#dc2626",
    success: "#16a34a",
    info: "#0ea5e9",
  };
  const btnBase = (disabled) => ({
    padding: "8px 12px",
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    background: disabled ? colors.bgDisabled : colors.bg,
    color: colors.text,
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 700,
  });
  const btnSolid = (bg, disabled = false) => ({
    padding: "8px 12px",
    borderRadius: 8,
    border: "none",
    background: disabled ? colors.bgDisabled : bg,
    color: disabled ? "#eee" : "#000",
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 700,
  });
  const btnNumber = (active) => ({
    padding: "6px 10px",
    borderRadius: 8,
    border: `1px solid ${active ? colors.primary : colors.border}`,
    background: active ? colors.primary : colors.bg,
    color: active ? "#000" : colors.text,
    fontWeight: active ? 800 : 600,
    textDecoration: active ? "underline" : "none",
    cursor: "pointer",
  });

  /* ==== Load categories ==== */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/categories?per_page=-1`);
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : data.data || []);
      } catch (e) {
        console.error("Failed to load categories:", e);
      }
    })();
  }, []);

  /* ==== Fetch list by view + page ==== */
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

        const res = await fetch(endpoint, { signal: ac.signal, headers: authHeaders() });
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

  useEffect(() => setPage(1), [view]);
  useEffect(() => setPage(1), [q, category, minPrice, maxPrice]);

  /* ==== Load IDs sản phẩm của danh mục đang chọn (để lọc client) ==== */
  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!category) {
        setCatProductIds(null);
        return;
      }
      try {
        const res = await fetch(`${APP_BASE}/api/categories/${category}/products?per_page=-1`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.data ?? [];
        if (!ignore) setCatProductIds(new Set(list.map((p) => p.id)));
      } catch (e) {
        console.error("Load category products failed:", e);
        if (!ignore) setCatProductIds(new Set());
      }
    })();
    return () => {
      ignore = true;
    };
  }, [category]);

  /* ==== Actions giữ nguyên ==== */
  const handleSoftDelete = async (id) => {
    if (!window.confirm(`Xoá tạm sản phẩm #${id}?`)) return;
    try {
      const fd = new FormData();
      fd.append("_method", "DELETE");
      const res = await fetch(`${API_BASE}/admin/products/${id}`, {
        method: "POST",
        headers: authHeaders(),
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

  const handleRestore = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/admin/products/${id}/restore`, {
        method: "POST",
        headers: authHeaders(),
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

  const handleForceDelete = async (id) => {
    if (!window.confirm(`Xóa vĩnh viễn sản phẩm #${id}? Hành động không thể hoàn tác!`)) return;
    try {
      const res = await fetch(`${API_BASE}/admin/products/${id}/force-delete`, {
        method: "POST",
        headers: authHeaders(),
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

  const handleBulkAction = async (action) => {
    if (selectedIds.size === 0) return;
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
              headers: authHeaders(),
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
              headers: authHeaders(),
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
              headers: authHeaders(),
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

  const handleShowSelected = () => {
    if (selectedIds.size !== 1) return;
    const id = Array.from(selectedIds)[0];
    navigate(`/admin/products/${id}`);
  };

  const handleEditSelected = () => {
    if (selectedIds.size !== 1) return;
    const id = Array.from(selectedIds)[0];
    navigate(`/admin/products/${id}/edit`);
  };

  const priceOf = (p) => Number(p.price_sale ?? p.sale_price ?? p.price_root ?? p.price ?? 0);

  const filtered = useMemo(() => {
    let list = items;

    // keyword
    const s = q.trim().toLowerCase();
    if (s) {
      list = list.filter(
        (x) =>
          x.name?.toLowerCase().includes(s) ||
          x.slug?.toLowerCase().includes(s) ||
          String(x.id || "").includes(s)
      );
    }

    // category filter
    if (category) {
      if (catProductIds == null) return [];
      list = list.filter((p) => catProductIds.has(p.id));
    }

    // price range
    const min = minPrice === "" ? null : Number(minPrice);
    const max = maxPrice === "" ? null : Number(maxPrice);
    if (min != null && !Number.isNaN(min)) list = list.filter((p) => priceOf(p) >= min);
    if (max != null && !Number.isNaN(max)) list = list.filter((p) => priceOf(p) <= max);

    return list;
  }, [items, q, category, catProductIds, minPrice, maxPrice]);

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
    <div
      style={{
        maxWidth: 1400,
        width: "min(96vw, 1400px)",
        margin: "24px auto",
        padding: 20,
        color: "#fff",
      }}
    >
      <h2 style={{ marginBottom: 12 }}>
        Product Management {view === "trash" ? "— Trash" : ""}
      </h2>

      {/* Top bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search Name / Slug"
          style={{
            flex: 1,
            minWidth: 260,
            padding: 8,
            borderRadius: 8,
            border: "1px solid #ccc",
            background: colors.bg,
            color: colors.text,
          }}
        />

        {/* Import/Export chỉ ở view ACTIVE */}
        {view === "active" && (
          <>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              id="excel-file"
              style={{ display: "none" }}
              onChange={async (e) => {
                if (!e.target.files?.length) return;
                const file = e.target.files[0];
                const fd = new FormData();
                fd.append("file", file);

                try {
                  const res = await fetch(`${API_BASE}/admin/products/import`, {
                    method: "POST",
                    headers: authHeaders(),
                    body: fd,
                  });
                  const j = await res.json();
                  if (!res.ok) throw new Error(j.message || "Import lỗi");
                  alert("✅ " + (j.message || "Import thành công"));
                  setPage(1);
                } catch (err) {
                  alert("❌ " + err.message);
                } finally {
                  e.target.value = "";
                }
              }}
            />
            <button
              onClick={() => document.getElementById("excel-file").click()}
              style={btnBase(false)}
              title="Import Excel (.xlsx, .csv)"
            >
              📤 Import
            </button>

            <button
              onClick={async () => {
                try {
                  const res = await fetch(`${API_BASE}/admin/products/export`, {
                    headers: authHeaders({ Accept: undefined }),
                  });
                  if (!res.ok) throw new Error("Export lỗi");
                  const blob = await res.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "products_export.xlsx";
                  a.click();
                  window.URL.revokeObjectURL(url);
                } catch (e) {
                  alert("❌ " + (e.message || "Không thể export"));
                }
              }}
              style={btnBase(false)}
            >
              📥 Export
            </button>
          </>
        )}

        {view === "active" ? (
          <>
            <button
              onClick={handleShowSelected}
              disabled={selectedIds.size !== 1}
              style={btnBase(selectedIds.size !== 1)}
              title={selectedIds.size === 1 ? "Xem chi tiết" : "Chọn đúng 1 sản phẩm để xem"}
            >
              Show
            </button>

            <button
              onClick={() => navigate("/admin/products/new")}
              style={btnBase(false)}
              title="Thêm sản phẩm mới"
            >
              Add
            </button>

            <button
              onClick={handleEditSelected}
              disabled={selectedIds.size !== 1}
              style={btnBase(selectedIds.size !== 1)}
              title={selectedIds.size === 1 ? "Sửa sản phẩm đã chọn" : "Chọn đúng 1 sản phẩm để sửa"}
            >
              Edit
            </button>

            <button
              onClick={() => handleBulkAction("soft-delete")}
              disabled={selectedIds.size === 0}
              style={{ ...btnSolid(colors.danger, selectedIds.size === 0), color: "#fff", border: `1px solid ${colors.border}` }}
              title="Chuyển các sản phẩm chọn vào Thùng rác"
            >
              Move to Trash{selectedIds.size ? ` (${selectedIds.size})` : ""}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => handleBulkAction("restore")}
              disabled={selectedIds.size === 0}
              style={{ ...btnSolid(colors.info, selectedIds.size === 0), color: "#fff" }}
            >
              Restore{selectedIds.size ? ` (${selectedIds.size})` : ""}
            </button>
            <button
              onClick={() => handleBulkAction("force-delete")}
              disabled={selectedIds.size === 0}
              style={{ ...btnSolid("#b91c1c", selectedIds.size === 0), color: "#fff" }}
            >
              Delete Forever{selectedIds.size ? ` (${selectedIds.size})` : ""}
            </button>
          </>
        )}

        <button onClick={() => setView((v) => (v === "active" ? "trash" : "active"))} style={btnBase(false)}>
          {view === "trash" ? "← Product List" : "Trash"}
        </button>
      </div>

      {/* FILTER BAR */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 20,
          background: "rgba(255,255,255,0.05)",
          padding: 16,
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.2)",
        }}
      >
        <div>
          <label style={{ fontSize: 14, fontWeight: 600, display: "block", marginBottom: 4 }}>
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid #ccc",
              background: "rgba(255,255,255,0.1)",
              color: "#fff",
              minWidth: 180,
              colorScheme: "dark",
              WebkitAppearance: "none",
              MozAppearance: "none",
              outline: "none",
            }}
          >
            <option value="" style={{ background: "#0b1220", color: "#fff" }}>
              -- All --
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id} style={{ background: "#0b1220", color: "#fff" }}>
                {c.name ?? c.title ?? c.slug ?? `#${c.id}`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 14, fontWeight: 600, display: "block", marginBottom: 4 }}>
            Price from
          </label>
          <input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid #ccc",
              background: "rgba(255,255,255,0.1)",
              color: "#fff",
              width: 120,
            }}
            placeholder="0"
          />
        </div>

        <div>
          <label style={{ fontSize: 14, fontWeight: 600, display: "block", marginBottom: 4 }}>
            To
          </label>
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid #ccc",
              background: "rgba(255,255,255,0.1)",
              color: "#fff",
              width: 120,
            }}
            placeholder="1000000"
          />
        </div>

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
              background: "rgba(255,255,255,0.2)",
              cursor: "pointer",
              color: "#fff",
            }}
          >
            🔄 Reset
          </button>
        </div>
      </div>

      {loading && <p style={{ color: "#ddd" }}>Đang tải dữ liệu…</p>}
      {err && <p style={{ color: "salmon" }}>{err}</p>}

      {!loading && (
        <div
          style={{
            position: "relative",
            minHeight: "70vh",
            border: `1px solid ${colors.border}`,
            borderRadius: 8,
            overflow: "hidden",
            paddingBottom: "60px",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", color: colors.text }}>
            <thead style={{ background: colors.bg }}>
              <tr>
                <th style={{ padding: 8, textAlign: "center", borderBottom: `1px solid ${colors.border}` }}>
                  <input
                    type="checkbox"
                    checked={isAllVisibleChecked}
                    onChange={toggleAllVisible}
                    title="Chọn/Bỏ chọn tất cả"
                  />
                </th>
                <th style={{ padding: 8, textAlign: "left", borderBottom: `1px solid ${colors.border}` }}>ID</th>
                <th style={{ padding: 8, textAlign: "left", borderBottom: `1px solid ${colors.border}` }}>Name</th>
                <th style={{ padding: 8, textAlign: "left", borderBottom: `1px solid ${colors.border}` }}>Slug</th>
                <th style={{ padding: 8, textAlign: "right", borderBottom: `1px solid ${colors.border}` }}>Price root</th>
                <th style={{ padding: 8, textAlign: "right", borderBottom: `1px solid ${colors.border}` }}>Price sale</th>
                <th style={{ padding: 8, textAlign: "right", borderBottom: `1px solid ${colors.border}` }}>Inventory</th>
                <th style={{ padding: 8, textAlign: "center", borderBottom: `1px solid ${colors.border}` }}>Image</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} style={{ borderTop: `1px solid ${colors.border}` }}>
                  <td style={{ padding: 8, textAlign: "center" }}>
                    <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleOne(p.id)} />
                  </td>
                  <td style={{ padding: 8 }}>{p.id}</td>
                  <td style={{ padding: 8, fontWeight: 700 }}>{p.name}</td>
                  <td style={{ padding: 8, color: "#cbd5e1" }}>{p.slug}</td>
                  <td style={{ padding: 8, textAlign: "right" }}>
                    ₫{(p.price_root || 0).toLocaleString("vi-VN")}
                  </td>
                  <td style={{ padding: 8, textAlign: "right" }}>
                    ₫{(p.price_sale || 0).toLocaleString("vi-VN")}
                  </td>
                  <td style={{ padding: 8, textAlign: "right", fontWeight: 700 }}>{p.qty}</td>
                  <td style={{ padding: 8, textAlign: "center" }}>
                    <img
                      src={buildImageUrl(p) || "https://placehold.co/120x80?text=No+Img"}
                      alt={p.name}
                      style={{
                        width: 60,
                        height: 40,
                        objectFit: "cover",
                        borderRadius: 6,
                        boxShadow: "0 0 4px rgba(255,255,255,.4)",
                      }}
                      onError={(e) => (e.currentTarget.src = "https://placehold.co/120x80?text=No+Img")}
                    />
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={8} style={{ padding: 16, textAlign: "center", color: "#ccc" }}>
                    Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {lastPage > 1 && (
            <div
              style={{
                position: "absolute",
                bottom: 10,
                right: 10,
                display: "flex",
                gap: 8,
                alignItems: "center",
                background: "rgba(0,0,0,0.6)",
                padding: "8px 14px",
                borderRadius: 8,
                border: `1px solid ${colors.border}`,
              }}
            >
              <button style={btnBase(page <= 1)} disabled={page <= 1} onClick={() => gotoPage(1)}>
                « First
              </button>
              <button style={btnBase(page <= 1)} disabled={page <= 1} onClick={() => gotoPage(page - 1)}>
                ‹ Previous
              </button>

              {pageNumbers.map((n) => (
                <button key={n} style={btnNumber(n === page)} onClick={() => gotoPage(n)}>
                  {n}
                </button>
              ))}

              <button style={btnBase(page >= lastPage)} disabled={page >= lastPage} onClick={() => gotoPage(page + 1)}>
                Next ›
              </button>
              <button style={btnBase(page >= lastPage)} disabled={page >= lastPage} onClick={() => gotoPage(lastPage)}>
                Last »
              </button>

              <div style={{ color: colors.text, fontSize: 14 }}>
                Pages <b>{page}</b>/<b>{lastPage}</b> — Total: <b>{total}</b>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
