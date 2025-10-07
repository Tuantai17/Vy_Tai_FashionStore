// import { useEffect, useMemo, useState } from "react";
// import { useNavigate } from "react-router-dom";

// const API_BASE = "http://127.0.0.1:8000/api"; // ✅ nếu BE dùng prefix /api

// export default function Products() {
//   const [items, setItems] = useState([]);
//   const [q, setQ] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [err, setErr] = useState("");
//   const navigate = useNavigate();

//   // ==== load list ====
//   useEffect(() => {
//     const ac = new AbortController();
//     (async () => {
//       try {
//         setLoading(true);
//         setErr("");
//         const res = await fetch(`${API_BASE}/admin/products`, { signal: ac.signal });
//         if (!res.ok) throw new Error(`HTTP ${res.status}`);
//         const data = await res.json();
//         const list = Array.isArray(data) ? data : data.data ?? [];
//         setItems(list);
//       } catch (e) {
//         if (e.name !== "AbortError") setErr("Không tải được danh sách sản phẩm.");
//       } finally {
//         setLoading(false);
//       }
//     })();
//     return () => ac.abort();
//   }, []);

//   // ==== delete (persist to DB) ====
//   const handleDelete = async (id) => {
//     if (!window.confirm(`Xoá sản phẩm #${id}?`)) return;

//     const token = localStorage.getItem("authToken") || localStorage.getItem("token") || "";

//     try {
//       // Dùng POST + _method=DELETE để an toàn với multipart/proxy
//       const fd = new FormData();
//       fd.append("_method", "DELETE");

//       const res = await fetch(`${API_BASE}/admin/products/${id}`, {
//         method: "POST", // hoặc "DELETE" nếu server cho phép
//         headers: {
//           Accept: "application/json",
//           ...(token ? { Authorization: `Bearer ${token}` } : {}),
//         },
//         body: fd,
//       });

//       if (!res.ok) {
//         const ct = res.headers.get("content-type") || "";
//         const payload = ct.includes("application/json") ? await res.json() : { message: await res.text() };
//         if (res.status === 401) throw new Error("Bạn chưa đăng nhập hoặc token hết hạn.");
//         if (res.status === 404) throw new Error("Sản phẩm không tồn tại.");
//         throw new Error(payload.message || `Xoá thất bại (HTTP ${res.status}).`);
//       }

//       // Cập nhật UI (optimistic)
//       setItems((list) => list.filter((x) => x.id !== id));
//       alert("✅ Đã xoá sản phẩm");
//     } catch (e) {
//       alert("❌ " + (e.message || "Không xoá được"));
//     }
//   };

//   // ==== filter ====
//   const filtered = useMemo(() => {
//     const s = q.trim().toLowerCase();
//     if (!s) return items;
//     return items.filter(
//       (x) => x.name.toLowerCase().includes(s) || x.slug?.toLowerCase().includes(s)
//     );
//   }, [q, items]);

//   const APP_BASE = API_BASE.replace(/\/api$/, ""); // để hiển thị ảnh /storage/...

//   return (
//     <section style={{ padding: 20 }}>
//       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
//         <h1 style={{ fontSize: 24 }}>Quản lý sản phẩm</h1>
//         <div style={{ display: "flex", gap: 8 }}>
//           <input
//             value={q}
//             onChange={(e) => setQ(e.target.value)}
//             placeholder="Tìm tên/slug…"
//             style={{ height: 36, padding: "0 10px", border: "1px solid #ddd", borderRadius: 8 }}
//           />
//           <button
//             onClick={() => navigate("/admin/products/new")}
//             style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #0f62fe", background: "#0f62fe", color: "#fff", cursor: "pointer" }}
//           >
//             + Add
//           </button>
//         </div>
//       </div>

//       {loading && <p>Đang tải dữ liệu…</p>}
//       {err && <p style={{ color: "red" }}>{err}</p>}

//       {!loading && (
//         <div style={{ overflowX: "auto", marginTop: 12 }}>
//           <table width="100%" cellPadding={8} style={{ borderCollapse: "collapse", background: "#fff" }}>
//             <thead>
//               <tr style={{ background: "#fafafa" }}>
//                 <th align="left">ID</th>
//                 <th align="left">Tên</th>
//                 <th align="left">Slug</th>
//                 <th align="right">Giá gốc</th>
//                 <th align="right">Giá sale</th>
//                 <th align="right">Tồn kho</th>
//                 <th align="center">Ảnh</th>
//                 <th align="center">Hành động</th>
//               </tr>
//             </thead>
//             <tbody>
//               {filtered.map((p) => (
//                 <tr key={p.id} style={{ borderTop: "1px solid #eee" }}>
//                   <td>{p.id}</td>
//                   <td>{p.name}</td>
//                   <td>{p.slug}</td>
//                   <td align="right">₫{(p.price_root || 0).toLocaleString("vi-VN")}</td>
//                   <td align="right">₫{(p.price_sale || 0).toLocaleString("vi-VN")}</td>
//                   <td align="right">{p.qty}</td>
//                   <td align="center">
//                     <img
//                       src={p.thumbnail_url || `${APP_BASE}/storage/${p.thumbnail}`}
//                       alt={p.name}
//                       style={{ width: 60, height: 40, objectFit: "cover", borderRadius: 4 }}
//                     />
//                   </td>
//                   <td align="center">
//                     <button
//                       onClick={() => navigate(`/admin/products/${p.id}/edit`)}
//                       style={{ padding: "4px 10px", marginRight: 4, background: "#2e7d32", color: "#fff", border: 0, borderRadius: 6, cursor: "pointer" }}
//                     >
//                       Sửa
//                     </button>
//                     <button
//                       onClick={() => handleDelete(p.id)}   // ✅ gọi API xoá
//                       style={{ padding: "4px 10px", background: "#c62828", color: "#fff", border: 0, borderRadius: 6, cursor: "pointer" }}
//                     >
//                       Xóa
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//               {!filtered.length && (
//                 <tr>
//                   <td colSpan={8} align="center" style={{ padding: 18, color: "#777" }}>
//                     Không có dữ liệu
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </section>
//   );
// }




// import { useEffect, useMemo, useState } from "react";
// import { useNavigate } from "react-router-dom";

// const API_BASE = "http://127.0.0.1:8000/api";

// export default function Products() {
//   const [items, setItems] = useState([]);
//   const [q, setQ] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [err, setErr] = useState("");
//   const navigate = useNavigate();

//   useEffect(() => {
//     const ac = new AbortController();
//     (async () => {
//       try {
//         setLoading(true);
//         setErr("");
//         const res = await fetch(`${API_BASE}/admin/products`, { signal: ac.signal });
//         if (!res.ok) throw new Error(`HTTP ${res.status}`);
//         const data = await res.json();
//         const list = Array.isArray(data) ? data : data.data ?? [];
//         setItems(list);
//       } catch (e) {
//         if (e.name !== "AbortError") setErr("Không tải được danh sách sản phẩm.");
//       } finally {
//         setLoading(false);
//       }
//     })();
//     return () => ac.abort();
//   }, []);

//   const handleDelete = async (id) => {
//     if (!window.confirm(`Xoá sản phẩm #${id}?`)) return;
//     const token = localStorage.getItem("authToken") || localStorage.getItem("token") || "";
//     try {
//       const fd = new FormData();
//       fd.append("_method", "DELETE");
//       const res = await fetch(`${API_BASE}/admin/products/${id}`, {
//         method: "POST",
//         headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
//         body: fd,
//       });
//       if (!res.ok) throw new Error("Xoá thất bại");
//       setItems((list) => list.filter((x) => x.id !== id));
//       alert("✅ Đã xoá sản phẩm");
//     } catch (e) {
//       alert("❌ " + (e.message || "Không xoá được"));
//     }
//   };

//   const filtered = useMemo(() => {
//     const s = q.trim().toLowerCase();
//     if (!s) return items;
//     return items.filter(
//       (x) => x.name.toLowerCase().includes(s) || x.slug?.toLowerCase().includes(s)
//     );
//   }, [q, items]);

//   const APP_BASE = API_BASE.replace(/\/api$/, "");

//   return (
//     <section
//       style={{
//         padding: 20,
//         background: "rgba(255,255,255,0.08)",
//         backdropFilter: "blur(8px)",
//         WebkitBackdropFilter: "blur(8px)",
//         borderRadius: 16,
//         boxShadow: "0 8px 20px rgba(3,10,27,.25)",
//       }}
//     >
//       {/* HEADER */}
//       <div
//         style={{
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//           gap: 10,
//           marginBottom: 16,
//         }}
//       >
//         <h1
//           style={{
//             fontSize: 24,
//             fontWeight: 800,
//             color: "#fff",
//             letterSpacing: 0.3,
//             textShadow: "0 1px 2px rgba(0,0,0,.4)",
//           }}
//         >
//           Quản lý sản phẩm
//         </h1>
//         <div style={{ display: "flex", gap: 8 }}>
//           <input
//             value={q}
//             onChange={(e) => setQ(e.target.value)}
//             placeholder="Tìm tên/slug…"
//             style={{
//               height: 38,
//               padding: "0 12px",
//               border: "1px solid rgba(255,255,255,.25)",
//               borderRadius: 10,
//               background: "rgba(255,255,255,0.2)",
//               color: "#fff",
//               backdropFilter: "blur(6px)",
//               outline: "none",
//               width: 180,
//             }}
//           />
//           <button
//             onClick={() => navigate("/admin/products/new")}
//             style={{
//               padding: "8px 14px",
//               borderRadius: 10,
//               border: "none",
//               background: "linear-gradient(90deg,#2563eb,#0ea5e9)",
//               color: "#fff",
//               cursor: "pointer",
//               fontWeight: 600,
//               boxShadow: "0 3px 8px rgba(37,99,235,.35)",
//             }}
//           >
//             + Add
//           </button>
//         </div>
//       </div>

//       {loading && <p style={{ color: "#ddd" }}>Đang tải dữ liệu…</p>}
//       {err && <p style={{ color: "red" }}>{err}</p>}

//       {!loading && (
//         <div
//           style={{
//             overflowX: "auto",
//             marginTop: 12,
//             borderRadius: 12,
//             background: "rgba(255,255,255,0.9)",
//             boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
//           }}
//         >
//           <table
//             width="100%"
//             cellPadding={10}
//             style={{
//               borderCollapse: "collapse",
//               borderRadius: 12,
//               overflow: "hidden",
//             }}
//           >
//             <thead>
//               <tr
//                 style={{
//                   background:
//                     "linear-gradient(90deg, rgba(255,255,255,1), rgba(248,250,252,0.95))",
//                   color: "#1f2937",
//                   fontWeight: 700,
//                   textAlign: "left",
//                   borderBottom: "2px solid #e5e7eb",
//                 }}
//               >
//                 <th>ID</th>
//                 <th>Tên</th>
//                 <th>Slug</th>
//                 <th style={{ textAlign: "right" }}>Giá gốc</th>
//                 <th style={{ textAlign: "right" }}>Giá sale</th>
//                 <th style={{ textAlign: "right" }}>Tồn kho</th>
//                 <th style={{ textAlign: "center" }}>Ảnh</th>
//                 <th style={{ textAlign: "center" }}>Hành động</th>
//               </tr>
//             </thead>

//             <tbody>
//               {filtered.map((p, i) => (
//                 <tr
//                   key={p.id}
//                   style={{
//                     background: i % 2 === 0 ? "rgba(255,255,255,0.9)" : "rgba(248,250,252,0.95)",
//                     borderTop: "1px solid #eee",
//                     transition: "background .2s ease",
//                   }}
//                   onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
//                   onMouseLeave={(e) =>
//                     (e.currentTarget.style.background =
//                       i % 2 === 0 ? "rgba(255,255,255,0.9)" : "rgba(248,250,252,0.95)")
//                   }
//                 >
//                   <td>{p.id}</td>
//                   <td style={{ fontWeight: 600 }}>{p.name}</td>
//                   <td style={{ color: "#475569" }}>{p.slug}</td>
//                   <td align="right">₫{(p.price_root || 0).toLocaleString("vi-VN")}</td>
//                   <td align="right">₫{(p.price_sale || 0).toLocaleString("vi-VN")}</td>
//                   <td align="right" style={{ fontWeight: 600 }}>
//                     {p.qty}
//                   </td>
//                   <td align="center">
//                     <img
//                       src={p.thumbnail_url || `${APP_BASE}/storage/${p.thumbnail}`}
//                       alt={p.name}
//                       style={{
//                         width: 60,
//                         height: 40,
//                         objectFit: "cover",
//                         borderRadius: 6,
//                         boxShadow: "0 0 4px rgba(0,0,0,.15)",
//                       }}
//                     />
//                   </td>
//                   <td align="center">
//                     <button
//                       onClick={() => navigate(`/admin/products/${p.id}/edit`)}
//                       style={{
//                         padding: "4px 12px",
//                         marginRight: 6,
//                         background: "#16a34a",
//                         color: "#fff",
//                         border: 0,
//                         borderRadius: 8,
//                         cursor: "pointer",
//                         fontWeight: 600,
//                       }}
//                     >
//                       Sửa
//                     </button>
//                     <button
//                       onClick={() => handleDelete(p.id)}
//                       style={{
//                         padding: "4px 12px",
//                         background: "#dc2626",
//                         color: "#fff",
//                         border: 0,
//                         borderRadius: 8,
//                         cursor: "pointer",
//                         fontWeight: 600,
//                       }}
//                     >
//                       Xóa
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//               {!filtered.length && (
//                 <tr>
//                   <td colSpan={8} align="center" style={{ padding: 20, color: "#6b7280" }}>
//                     Không có dữ liệu
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </section>
//   );
// }



import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000/api";

export default function Products() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  // ====== NEW: quản lý các id được chọn
  const [selectedIds, setSelectedIds] = useState(new Set());

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

  // ====== Giữ nguyên hàm xóa 1 sản phẩm
  const handleDelete = async (id) => {
    if (!window.confirm(`Xoá sản phẩm #${id}?`)) return;
    const token = localStorage.getItem("authToken") || localStorage.getItem("token") || "";
    try {
      const fd = new FormData();
      fd.append("_method", "DELETE");
      const res = await fetch(`${API_BASE}/admin/products/${id}`, {
        method: "POST",
        headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: fd,
      });
      if (!res.ok) throw new Error("Xoá thất bại");
      setItems((list) => list.filter((x) => x.id !== id));
      // loại khỏi tập selected nếu đang chọn
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      alert("✅ Đã xoá sản phẩm");
    } catch (e) {
      alert("❌ " + (e.message || "Không xoá được"));
    }
  };

  // ====== NEW: Xóa nhiều sản phẩm đã chọn (hỏi 1 lần)
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Xoá ${selectedIds.size} sản phẩm đã chọn?`)) return;

    const token = localStorage.getItem("authToken") || localStorage.getItem("token") || "";
    const ids = Array.from(selectedIds);

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

    if (ok) {
      setItems((list) => list.filter((x) => !selectedIds.has(x.id)));
    }
    setSelectedIds(new Set());

    alert(`🗑️ Hoàn tất: xoá thành công ${ok} • thất bại ${fail}`);
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((x) => x.name.toLowerCase().includes(s) || x.slug?.toLowerCase().includes(s));
  }, [q, items]);

  // ====== NEW: tick chọn / bỏ chọn
  const toggleOne = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ====== NEW: chọn tất cả các hàng đang hiển thị (sau filter)
  const allVisibleIds = filtered.map((x) => x.id);
  const isAllVisibleChecked = allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedIds.has(id));
  const toggleAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (isAllVisibleChecked) {
        // bỏ chọn tất cả đang hiển thị
        allVisibleIds.forEach((id) => next.delete(id));
      } else {
        // chọn tất cả đang hiển thị
        allVisibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const APP_BASE = API_BASE.replace(/\/api$/, "");

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
          Quản lý sản phẩm
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
              width: 180,
            }}
          />
          {/* NEW: Nút xoá nhiều */}
          <button
            onClick={handleBulkDelete}
            disabled={selectedIds.size === 0}
            title={selectedIds.size ? `Xoá ${selectedIds.size} mục đã chọn` : "Chọn mục để xoá"}
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
            Xóa đã chọn {selectedIds.size ? `(${selectedIds.size})` : ""}
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
        </div>
      </div>

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
                {/* NEW: cột tick chọn + checkbox chọn tất cả (theo danh sách đang lọc) */}
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
                    background: i % 2 === 0 ? "rgba(255,255,255,0.9)" : "rgba(248,250,252,0.95)",
                    borderTop: "1px solid #eee",
                    transition: "background .2s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      i % 2 === 0 ? "rgba(255,255,255,0.9)" : "rgba(248,250,252,0.95)")
                  }
                >
                  {/* NEW: checkbox từng hàng */}
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
                    <button
                      onClick={() => handleDelete(p.id)}
                      style={{
                        padding: "4px 12px",
                        background: "#dc2626",
                        color: "#fff",
                        border: 0,
                        borderRadius: 8,
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      Xóa
                    </button>
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
      )}
    </section>
  );
}
