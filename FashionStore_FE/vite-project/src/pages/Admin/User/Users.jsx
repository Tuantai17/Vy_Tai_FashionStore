// src/pages/Admin/User/Users.jsx
import { useEffect, useMemo, useState } from "react";
import { getAdminToken } from "../../../utils/authStorage";

const API_BASE = "http://127.0.0.1:8000/api";
const PER_PAGE = 10;

export default function Users() {
  const [users, setUsers]     = useState([]);
  const [q, setQ]             = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState("");

  // pagination
  const [page, setPage]       = useState(1);
  const [lastPage, setLast]   = useState(1);
  const [total, setTotal]     = useState(0);

  const token = getAdminToken();

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErr("");

        const url =
          `${API_BASE}/admin/users?per_page=${PER_PAGE}&page=${page}` +
          (q ? `&q=${encodeURIComponent(q)}` : "");

        const res  = await fetch(url, {
          signal: ac.signal,
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const list = Array.isArray(data) ? data : (data.data ?? []);
        setUsers(list);
        setLast(Number(data.last_page ?? 1));
        setTotal(Number(data.total ?? list.length));
      } catch (e) {
        if (e.name !== "AbortError") setErr("Failed to load users.");
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [page, q, token]);

  // when keyword changes, go back to page 1
  useEffect(() => { setPage(1); }, [q]);

  // client filter (unchanged)
  const filtered = useMemo(() => users, [users]);

  // ===== PAGINATION (LOGIC UNCHANGED) =====
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
      let end   = Math.min(lastPage, page + 3);
      if (page <= 4) { start = 1; end = 7; }
      else if (page >= lastPage - 3) { start = lastPage - 6; end = lastPage; }
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  }, [page, lastPage]);

  // ===== UI THEME (same as Inventory/Orders) =====
  const colors = {
    text: "#ffffff",
    border: "#ffffff",
    bg: "rgba(255,255,255,0.1)",
    bgDisabled: "rgba(255,255,255,0.2)",
    primary: "#00bcd4",
  };
  const btnBase = (disabled) => ({
    padding: "6px 10px",
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    background: disabled ? colors.bgDisabled : colors.bg,
    color: colors.text,
    cursor: disabled ? "not-allowed" : "pointer",
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

  const Badge = ({ active }) => (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        background: active ? "#ecfdf5" : "#f3f4f6",
        color: active ? "#065f46" : "#374151",
        border: `1px solid ${active ? "#a7f3d0" : "#e5e7eb"}`,
        whiteSpace: "nowrap",
      }}
    >
      {active ? "Active" : "Locked"}
    </span>
  );

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
      {/* HEADER + SEARCH */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>User Management </h2>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, email, role…"
          style={{
            flex: 1,
            maxWidth: 420,
            height: 40,
            padding: "0 14px",
            borderRadius: 10,
            border: "1px solid #ccc",
            background: "rgba(255,255,255,0.1)",
            color: "#fff",
            outline: "none",
          }}
        />
      </div>

      {/* MAIN WRAPPER (dark) + FIXED PAGINATION */}
      <div
        style={{
          position: "relative",
          minHeight: "76vh",
          border: "1px solid #fff",
          borderRadius: 10,
          overflow: "hidden",
          paddingBottom: "80px",
          background: "rgba(255,255,255,0.05)",
        }}
      >
        {err && <p style={{ padding: 12, color: "#ffb4b4" }}>{err}</p>}
        {loading && <p style={{ padding: 12, color: "#ddd" }}>Loading…</p>}

        {!loading && !err && (
          <>
            <table style={{ width: "100%", borderCollapse: "collapse", color: "#fff" }}>
              <thead style={{ background: "rgba(255,255,255,0.1)" }}>
                <tr>
                  <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid #fff" }}>ID</th>
                  <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid #fff" }}>Name</th>
                  <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid #fff" }}>Email</th>
                  <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid #fff" }}>Username</th>
                  <th style={{ padding: 10, textAlign: "left", borderBottom: "1px solid #fff" }}>Role</th>
                  <th style={{ padding: 10, textAlign: "center", borderBottom: "1px solid #fff" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} style={{ borderTop: "1px solid #fff" }}>
                    <td style={{ padding: 10 }}>{u.id}</td>
                    <td style={{ padding: 10, fontWeight: 700 }}>{u.name}</td>
                    <td style={{ padding: 10, color: "#ccc" }}>{u.email}</td>
                    <td style={{ padding: 10 }}>{u.username}</td>
                    <td style={{ padding: 10, textTransform: "capitalize" }}>{u.roles}</td>
                    <td style={{ padding: 10, textAlign: "center" }}>
                      <Badge active={u.status === 1} />
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: 16, textAlign: "center", color: "#ccc" }}>
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* FIXED PAGINATION (bottom-right) */}
            {lastPage > 1 && (
              <div
                style={{
                  position: "absolute",
                  bottom: 16,
                  right: 16,
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  background: "rgba(0,0,0,0.6)",
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "1px solid #fff",
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

                <button
                  style={btnBase(page >= lastPage)}
                  disabled={page >= lastPage}
                  onClick={() => gotoPage(page + 1)}
                >
                  Next ›
                </button>
                <button
                  style={btnBase(page >= lastPage)}
                  disabled={page >= lastPage}
                  onClick={() => gotoPage(lastPage)}
                >
                  Last »
                </button>

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



