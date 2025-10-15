import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000/api";
const APP_BASE = API_BASE.replace(/\/api$/, "");
const PLACEHOLDER = "https://placehold.co/80x60?text=No+Img";

export default function Categories() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // view: "active" | "trash"
  const [view, setView] = useState("active");

  // paging
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 10;

  // multi-select
  const [selectedIds, setSelectedIds] = useState(new Set());

  const navigate = useNavigate();

  // ===== helpers auth header
  const authHeaders = () => {
    const token = localStorage.getItem("authToken") || localStorage.getItem("token") || "";
    return { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  };

  // ===== fetch
  const fetchCats = async (signal) => {
    try {
      setLoading(true);
      setErr("");

      if (view === "active") {
        const url = `${API_BASE}/admin/categories?per_page=${perPage}&page=${page}`;
        const res = await fetch(url, { signal, headers: authHeaders() });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (Array.isArray(data)) {
          setRows(data); setLastPage(1); setTotal(data.length);
        } else {
          const list = data.data ?? [];
          setRows(list);
          setLastPage(Number(data.last_page ?? 1));
          setTotal(Number(data.total ?? list.length));
        }
        setSelectedIds(new Set());
        return;
      }

      // trash view – try multiple endpoints
      const candidates = [
        `${API_BASE}/admin/categories/trash?per_page=${perPage}&page=${page}`,
        `${API_BASE}/admin/categories?only_trashed=1&per_page=${perPage}&page=${page}`,
        `${API_BASE}/admin/categories?trashed=1&per_page=${perPage}&page=${page}`,
      ];
      let okData = null, lastStatus = 0;
      for (const url of candidates) {
        const res = await fetch(url, { signal, headers: authHeaders() });
        lastStatus = res.status;
        if (res.ok) { okData = await res.json(); break; }
      }
      if (!okData) throw new Error(`Trash not available (last=${lastStatus})`);

      if (Array.isArray(okData)) {
        setRows(okData); setLastPage(1); setTotal(okData.length);
      } else {
        const list = okData.data ?? [];
        setRows(list);
        setLastPage(Number(okData.last_page ?? 1));
        setTotal(Number(okData.total ?? list.length));
      }
      setSelectedIds(new Set());
    } catch (e) {
      if (e.name !== "AbortError") setErr("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const ac = new AbortController();
    fetchCats(ac.signal);
    return () => ac.abort();
  }, [view, page]); // eslint-disable-line

  useEffect(() => { setPage(1); }, [view]);

  // ===== actions (logic unchanged)
  const token = localStorage.getItem("authToken") || localStorage.getItem("token") || "";

  const softDeleteOne = async (id) => {
    if (!window.confirm(`Move category #${id} to Trash?`)) return;
    try {
      const fd = new FormData(); fd.append("_method", "DELETE");
      const res = await fetch(`${API_BASE}/admin/categories/${id}`, {
        method: "POST", headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: fd,
      });
      if (!res.ok) throw new Error("Soft delete failed");
      setRows((prev) => prev.filter((x) => x.id !== id));
      setSelectedIds((s) => { const n = new Set(s); n.delete(id); return n; });
      alert("✅ Moved to Trash");
      if (rows.length === 1 && page > 1) setPage((p) => p - 1);
    } catch (e) { alert("❌ " + (e.message || "Cannot soft delete")); }
  };

  const restoreOne = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/admin/categories/${id}/restore`, {
        method: "POST", headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) throw new Error("Restore failed");
      setRows((prev) => prev.filter((x) => x.id !== id));
      setSelectedIds((s) => { const n = new Set(s); n.delete(id); return n; });
      alert("✅ Restored");
      if (rows.length === 1 && page > 1) setPage((p) => p - 1);
    } catch (e) { alert("❌ " + (e.message || "Cannot restore")); }
  };

  const forceDeleteOne = async (id) => {
    if (!window.confirm(`Delete category #${id} forever? This cannot be undone!`)) return;
    try {
      const res = await fetch(`${API_BASE}/admin/categories/${id}/force-delete`, {
        method: "POST", headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) throw new Error("Delete forever failed");
      setRows((prev) => prev.filter((x) => x.id !== id));
      setSelectedIds((s) => { const n = new Set(s); n.delete(id); return n; });
      alert(" Deleted forever");
      if (rows.length === 1 && page > 1) setPage((p) => p - 1);
    } catch (e) { alert("❌ " + (e.message || "Cannot delete forever")); }
  };

  const handleBulk = async (action) => {
    if (!selectedIds.size) return;
    const ids = Array.from(selectedIds);
    let ok = 0, fail = 0;

    if (action === "soft-delete") {
      if (!window.confirm(`Move ${ids.length} categories to Trash?`)) return;
      await Promise.all(ids.map(async (id) => {
        try {
          const fd = new FormData(); fd.append("_method", "DELETE");
          const res = await fetch(`${API_BASE}/admin/categories/${id}`, {
            method: "POST", headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: fd,
          });
          if (!res.ok) throw new Error(); ok++;
        } catch { fail++; }
      }));
      if (ok) setRows((list) => list.filter((x) => !selectedIds.has(x.id)));
      setSelectedIds(new Set());
      alert(`Done: moved ${ok} • failed ${fail}`);
      if (rows.length === ok && page > 1) setPage((p) => p - 1);
      return;
    }

    if (action === "restore") {
      await Promise.all(ids.map(async (id) => {
        try {
          const res = await fetch(`${API_BASE}/admin/categories/${id}/restore`, {
            method: "POST", headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          });
          if (!res.ok) throw new Error(); ok++;
        } catch { fail++; }
      }));
      if (ok) setRows((list) => list.filter((x) => !selectedIds.has(x.id)));
      setSelectedIds(new Set());
      alert(`Restore finished: success ${ok} • failed ${fail}`);
      if (rows.length === ok && page > 1) setPage((p) => p - 1);
      return;
    }

    if (action === "force-delete") {
      if (!window.confirm(`Delete ${ids.length} items forever?`)) return;
      await Promise.all(ids.map(async (id) => {
        try {
          const res = await fetch(`${API_BASE}/admin/categories/${id}/force-delete`, {
            method: "POST", headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          });
          if (!res.ok) throw new Error(); ok++;
        } catch { fail++; }
      }));
      if (ok) setRows((list) => list.filter((x) => !selectedIds.has(x.id)));
      setSelectedIds(new Set());
      alert(`Deleted forever: success ${ok} • failed ${fail}`);
      if (rows.length === ok && page > 1) setPage((p) => p - 1);
      return;
    }
  };

  // ===== filter & selection
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((x) => x.name?.toLowerCase().includes(s) || x.slug?.toLowerCase().includes(s));
  }, [q, rows]);

  const toggleOne = (id) =>
    setSelectedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const allVisibleIds = filtered.map((x) => x.id);
  const isAllVisibleChecked = allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedIds.has(id));
  const toggleAllVisible = () =>
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (isAllVisibleChecked) allVisibleIds.forEach((id) => n.delete(id));
      else allVisibleIds.forEach((id) => n.add(id));
      return n;
    });

  // ===== paging
  const gotoPage = (p) => { if (p < 1 || p > lastPage || p === page) return; setPage(p); };
  const pageNumbers = useMemo(() => {
    const maxButtons = 7, pages = [];
    if (lastPage <= maxButtons) { for (let i = 1; i <= lastPage; i++) pages.push(i); }
    else {
      let start = Math.max(1, page - 3), end = Math.min(lastPage, page + 3);
      if (page <= 4) { start = 1; end = 7; }
      else if (page >= lastPage - 3) { start = lastPage - 6; end = lastPage; }
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  }, [page, lastPage]);

  // ===== UI helpers
  const colors = { text: "#ffffff", border: "#ffffff", bg: "rgba(255,255,255,0.1)", bgDisabled: "rgba(255,255,255,0.2)", primary: "#00bcd4" };
  const btnBase = (disabled) => ({
    padding: "8px 12px",
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    background: disabled ? colors.bgDisabled : colors.bg,
    color: colors.text,
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 700,
    whiteSpace: "nowrap",
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

  const showSelected = () => {
    if (selectedIds.size !== 1) return;
    const id = Array.from(selectedIds)[0];
    navigate(`/admin/categories/${id}`);
  };
  const editSelected = () => {
    if (selectedIds.size !== 1) return;
    const id = Array.from(selectedIds)[0];
    navigate(`/admin/categories/edit/${id}`);
  };

  return (
    <div style={{ maxWidth: 1400, width: "min(96vw, 1400px)", margin: "24px auto", padding: 20, color: "#fff" }}>
      {/* TITLE */}
      <h2 style={{ margin: "0 0 10px 0" }}>Category Management {view === "trash" ? "— Trash" : ""}</h2>

      {/* ONE-ROW: search left, buttons right */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        {/* search grows, auto shrinks when buttons take space */}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search Name / Slug"
          style={{
            flex: 1,
            minWidth: 220,
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,.25)",
            background: "rgba(255,255,255,0.12)",
            color: "#fff",
            outline: "none",
          }}
        />

        {/* buttons on the right */}
        {view === "active" ? (
          <>
            <button onClick={showSelected} disabled={selectedIds.size !== 1} style={btnBase(selectedIds.size !== 1)}>
              Show
            </button>
            <button
              onClick={() => navigate("/admin/categories/add")}
              style={{ ...btnBase(false), border: "none", color: "#000",}}
            >
              Add
            </button>
            <button onClick={editSelected} disabled={selectedIds.size !== 1} style={btnBase(selectedIds.size !== 1)}>
              Edit
            </button>
            <button onClick={() => handleBulk("soft-delete")} disabled={selectedIds.size === 0} style={btnBase(selectedIds.size === 0)}>
              Move to Trash{selectedIds.size ? ` (${selectedIds.size})` : ""}
            </button>
            
            <button
              onClick={() => setView("trash")}
              style={{ ...btnBase(false), display: "inline-flex", alignItems: "center", gap: 6 }}
              title="View Trash"
            >
              Trash
            </button>
          </>
        ) : (
          <>
            <button onClick={() => handleBulk("restore")} disabled={selectedIds.size === 0} style={btnBase(selectedIds.size === 0)}>
              Restore{selectedIds.size ? ` (${selectedIds.size})` : ""}
            </button>
            <button onClick={() => handleBulk("force-delete")} disabled={selectedIds.size === 0} style={btnBase(selectedIds.size === 0)}>
              Delete Forever{selectedIds.size ? ` (${selectedIds.size})` : ""}
            </button>
            <button onClick={() => setView("active")} style={btnBase(false)}>
              ← Category List
            </button>
          </>
        )}
      </div>

      {/* TABLE */}
      <div
        style={{
          position: "relative",
          minHeight: "70vh",
          border: "1px solid #fff",
          borderRadius: 8,
          overflow: "hidden",
          paddingBottom: "60px",
          background: "rgba(255,255,255,0.05)",
        }}
      >
        {loading && <p style={{ padding: 12, color: "#ddd" }}>Loading…</p>}
        {err && <p style={{ padding: 12, color: "#ffb4b4" }}>{err}</p>}

        {!loading && (
          <>
            <table style={{ width: "100%", borderCollapse: "collapse", color: "#fff" }}>
              <thead style={{ background: "rgba(255,255,255,0.1)" }}>
                <tr>
                  <th style={{ padding: 8, borderBottom: "1px solid #fff", width: 48, textAlign: "center" }}>
                    <input type="checkbox" checked={isAllVisibleChecked} onChange={toggleAllVisible} title="Select/Deselect all (visible)" />
                  </th>
                  <th style={{ padding: 8, textAlign: "left", borderBottom: "1px solid #fff" }}>ID</th>
                  <th style={{ padding: 8, textAlign: "left", borderBottom: "1px solid #fff" }}>Name</th>
                  <th style={{ padding: 8, textAlign: "left", borderBottom: "1px solid #fff" }}>Slug</th>
                  <th style={{ padding: 8, textAlign: "center", borderBottom: "1px solid #fff" }}>Image</th>
                  <th style={{ padding: 8, textAlign: "left", borderBottom: "1px solid #fff" }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} style={{ borderTop: "1px solid #fff" }}>
                    <td align="center" style={{ padding: 8 }}>
                      <input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => toggleOne(c.id)} />
                    </td>
                    <td style={{ padding: 8 }}>{c.id}</td>
                    <td style={{ padding: 8, fontWeight: 700 }}>{c.name}</td>
                    <td style={{ padding: 8, color: "#ccc" }}>{c.slug}</td>
                    <td align="center" style={{ padding: 8 }}>
                      {c.image || c.image_url ? (
                        <img
                          src={c.image_url || `${APP_BASE}/storage/${c.image}`}
                          alt={c.name}
                          style={{ width: 60, height: 40, objectFit: "cover", borderRadius: 6, boxShadow: "0 0 4px rgba(255,255,255,.4)" }}
                          onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
                        />
                      ) : ("-")}
                    </td>
                    <td style={{ padding: 8, color: "#e5e7eb" }}>{c.description}</td>
                  </tr>
                ))}

                {!filtered.length && (
                  <tr>
                    <td colSpan={6} style={{ padding: 16, textAlign: "center", color: "#ccc" }}>
                      No data
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* pagination fixed bottom-right */}
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
                  border: "1px solid #fff",
                }}
              >
                <button style={btnBase(page <= 1)} disabled={page <= 1} onClick={() => gotoPage(1)}>« First</button>
                <button style={btnBase(page <= 1)} disabled={page <= 1} onClick={() => gotoPage(page - 1)}>‹ Previous</button>

                {pageNumbers.map((n) => (
                  <button key={n} style={btnNumber(n === page)} onClick={() => gotoPage(n)}>{n}</button>
                ))}

                <button style={btnBase(page >= lastPage)} disabled={page >= lastPage} onClick={() => gotoPage(page + 1)}>Next ›</button>
                <button style={btnBase(page >= lastPage)} disabled={page >= lastPage} onClick={() => gotoPage(lastPage)}>Last »</button>

                <div style={{ color: "#fff", fontSize: 14 }}>
                  Pages <b>{page}</b>/<b>{lastPage}</b> — Total: <b>{total}</b>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
