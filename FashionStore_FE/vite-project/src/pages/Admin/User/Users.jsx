// src/pages/Admin/User/Users.jsx
import { useEffect, useMemo, useState } from "react";

const API_BASE = "http://127.0.0.1:8000/api";
const PER_PAGE = 10;

export default function Users() {
  const [users, setUsers]     = useState([]);
  const [q, setQ]             = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState("");

  // phân trang
  const [page, setPage]       = useState(1);
  const [lastPage, setLast]   = useState(1);
  const [total, setTotal]     = useState(0);

  const token = localStorage.getItem("token");

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

        // paginator của Laravel
        const list = Array.isArray(data) ? data : (data.data ?? []);
        setUsers(list);
        setLast(Number(data.last_page ?? 1));
        setTotal(Number(data.total ?? list.length));
      } catch (e) {
        if (e.name !== "AbortError") setErr("Không tải được danh sách người dùng.");
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [page, q, token]);

  // khi đổi từ khóa, về trang 1
  useEffect(() => { setPage(1); }, [q]);

  // filter client phụ (tuỳ chọn; có thể bỏ vì đã search ở server)
  const filtered = useMemo(() => users, [users]);

  // UI: nút phân trang giống Product
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

  const Badge = ({ active }) => (
    <span style={{
      display:"inline-block", padding:"2px 8px", borderRadius:999, fontSize:12, fontWeight:700,
      background: active ? "#ecfdf5" : "#f3f4f6",
      color: active ? "#065f46" : "#374151",
      border:`1px solid ${active ? "#a7f3d0" : "#e5e7eb"}`
    }}>{active ? "Hoạt động" : "Khoá"}</span>
  );

  return (
    <section style={{ padding:20, background:"rgba(255,255,255,0.08)", backdropFilter:"blur(8px)", borderRadius:16, boxShadow:"0 8px 20px rgba(3,10,27,.25)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <h1 style={{ fontSize:24, fontWeight:800, color:"#fff", margin:0 }}>Users</h1>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo tên, email, role…"
          style={{ height:38, padding:"0 12px", borderRadius:10, border:"1px solid rgba(255,255,255,.25)", background:"rgba(255,255,255,0.2)", color:"#fff", minWidth:240, outline:"none" }}
        />
      </div>

      {err && <p style={{ color:"#ef4444", fontWeight:600 }}>{err}</p>}
      {loading && <p style={{ color:"#ddd" }}>Đang tải dữ liệu…</p>}

      {!loading && !err && (
        <>
          <div style={{ overflowX:"auto", borderRadius:12, background:"rgba(255,255,255,0.92)", boxShadow:"0 4px 20px rgba(0,0,0,0.15)" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", borderRadius:12, overflow:"hidden", fontSize:14 }}>
              <thead>
                <tr style={{ background:"linear-gradient(90deg,#fff,#f8fafc)", color:"#1f2937", fontWeight:700, borderBottom:"2px solid #e5e7eb" }}>
                  <th style={{ textAlign:"left", padding:"10px 12px" }}>ID</th>
                  <th style={{ textAlign:"left", padding:"10px 12px" }}>Tên</th>
                  <th style={{ textAlign:"left", padding:"10px 12px" }}>Email</th>
                  <th style={{ textAlign:"left", padding:"10px 12px" }}>Username</th>
                  <th style={{ textAlign:"left", padding:"10px 12px" }}>Vai trò</th>
                  <th style={{ textAlign:"center", padding:"10px 12px" }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr key={u.id}
                      style={{
                        background: i%2===0 ? "rgba(255,255,255,0.98)" : "rgba(248,250,252,0.95)",
                        borderTop:"1px solid #eee", transition:"background .2s ease"
                      }}
                      onMouseEnter={(e)=>e.currentTarget.style.background="#f1f5f9"}
                      onMouseLeave={(e)=>e.currentTarget.style.background = i%2===0 ? "rgba(255,255,255,0.98)" : "rgba(248,250,252,0.95)"}
                  >
                    <td style={{ padding:"10px 12px" }}>{u.id}</td>
                    <td style={{ padding:"10px 12px", fontWeight:600 }}>{u.name}</td>
                    <td style={{ padding:"10px 12px", color:"#475569" }}>{u.email}</td>
                    <td style={{ padding:"10px 12px" }}>{u.username}</td>
                    <td style={{ padding:"10px 12px", textTransform:"capitalize" }}>{u.roles}</td>
                    <td style={{ padding:"10px 12px", textAlign:"center" }}>
                      <Badge active={u.status === 1} />
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr><td colSpan={6} style={{ padding:20, textAlign:"center", color:"#6b7280" }}>Không có người dùng nào</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PHÂN TRANG */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, marginTop:14, background:"rgba(255,255,255,0.9)", borderRadius:10, padding:"10px 12px", color:"#111827" }}>
            <div style={{ fontSize:14 }}>Trang <b>{page}</b> / <b>{lastPage}</b> — Tổng: <b>{total}</b></div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              <button onClick={()=>gotoPage(1)}            disabled={page<=1}        style={btn(page<=1)}>« Đầu</button>
              <button onClick={()=>gotoPage(page-1)}       disabled={page<=1}        style={btn(page<=1)}>‹ Trước</button>
              {pageNumbers.map(n => (
                <button key={n} onClick={()=>gotoPage(n)} style={numBtn(n===page)}>{n}</button>
              ))}
              <button onClick={()=>gotoPage(page+1)}       disabled={page>=lastPage} style={btn(page>=lastPage)}>Sau ›</button>
              <button onClick={()=>gotoPage(lastPage)}     disabled={page>=lastPage} style={btn(page>=lastPage)}>Cuối »</button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

const btn = (disabled) => ({
  padding:"6px 10px", borderRadius:8, border:"1px solid #e5e7eb",
  background: disabled ? "#f3f4f6" : "#fff",
  cursor: disabled ? "not-allowed" : "pointer", color:"#111827",
});
const numBtn = (active) => ({
  padding:"6px 10px", borderRadius:8,
  border: active ? "1px solid #111827" : "1px solid #e5e7eb",
  background:"#fff", color:"#111827", fontWeight: active ? 800 : 600,
  textDecoration: active ? "underline" : "none",
});
