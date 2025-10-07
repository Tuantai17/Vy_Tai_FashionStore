// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";

// const API_BASE = "http://127.0.0.1:8000/api";

// export default function Categories() {
//   const [rows, setRows] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [err, setErr] = useState("");
//   const navigate = useNavigate();

//   const fetchCats = async () => {
//     try {
//       setLoading(true);
//       setErr("");

//       const res = await fetch(`${API_BASE}/categories`);
//       if (!res.ok) throw new Error(`HTTP ${res.status}`);

//       const data = await res.json();
//       const list = Array.isArray(data) ? data : data.data ?? [];
//       setRows(list);
//     } catch (e) {
//       if (e.name !== "AbortError") setErr("Không tải được danh mục.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ✅ Xóa thẳng, không confirm
//   const deleteCat = async (id) => {
//     try {
//       const res = await fetch(`${API_BASE}/categories/${id}`, {
//         method: "DELETE",
//       });
//       if (!res.ok) throw new Error("Xóa thất bại");
//       // Cập nhật state ngay, khỏi fetch lại toàn bộ
//       setRows((prev) => prev.filter((c) => c.id !== id));
//     } catch (e) {
//       alert(e.message);
//     }
//   };

//   useEffect(() => {
//     fetchCats();
//   }, []);

//   return (
//     <section style={{ padding: 20 }}>
//       <div
//         style={{
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//         }}
//       >
//         <h1 style={{ fontSize: 24 }}>Quản lý danh mục</h1>
//         <button
//           onClick={() => navigate("/admin/categories/add")}
//           className="mb-4 px-4 py-2 bg-blue-600 text-white rounded"
//         >
//           + Thêm danh mục
//         </button>
//       </div>

//       {loading && <p>Đang tải dữ liệu…</p>}
//       {err && <p style={{ color: "red" }}>{err}</p>}

//       {!loading && (
//         <div style={{ overflowX: "auto", marginTop: 12 }}>
//           <table
//             width="100%"
//             cellPadding={8}
//             style={{ borderCollapse: "collapse", background: "#fff" }}
//           >
//             <thead>
//               <tr style={{ background: "#fafafa" }}>
//                 <th align="left">ID</th>
//                 <th align="left">Tên</th>
//                 <th align="left">Slug</th>
//                 <th align="center">Ảnh</th>
//                 <th align="left">Mô tả</th>
//                 <th align="center">Hành động</th>
//               </tr>
//             </thead>
//             <tbody>
//               {rows.map((c) => (
//                 <tr key={c.id} style={{ borderTop: "1px solid #eee" }}>
//                   <td>{c.id}</td>
//                   <td>{c.name}</td>
//                   <td>{c.slug}</td>
//                   <td align="center">
//                     {c.image ? (
//                       <img
//                         src={c.image_url || `${API_BASE}/storage/${c.image}`}
//                         alt={c.name}
//                         style={{
//                           width: 60,
// height: 40,
//                           objectFit: "cover",
//                           borderRadius: 4,
//                         }}
//                       />
//                     ) : (
//                       "-"
//                     )}
//                   </td>
//                   <td>{c.description}</td>
//                   <td align="center">
//                     <button
//                       onClick={() =>
//                         navigate(`/admin/categories/edit/${c.id}`)
//                       }
//                       style={{
//                         padding: "4px 10px",
//                         marginRight: 4,
//                         background: "#2e7d32",
//                         color: "#fff",
//                         border: 0,
//                         borderRadius: 6,
//                         cursor: "pointer",
//                       }}
//                     >
//                       Sửa
//                     </button>
//                     <button
//                       onClick={() => deleteCat(c.id)}
//                       style={{
//                         padding: "4px 10px",
//                         background: "#c62828",
//                         color: "#fff",
//                         border: 0,
//                         borderRadius: 6,
//                         cursor: "pointer",
//                       }}
//                     >
//                       Xóa
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//               {!rows.length && (
//                 <tr>
//                   <td
//                     colSpan={6}
//                     align="center"
//                     style={{ padding: 18, color: "#777" }}
//                   >
//                     Trống
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





import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000/api";

export default function Categories() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  const fetchCats = async () => {
    try {
      setLoading(true);
      setErr("");
      const res = await fetch(`${API_BASE}/categories`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.data ?? [];
      setRows(list);
    } catch (e) {
      if (e.name !== "AbortError") setErr("Không tải được danh mục.");
    } finally {
      setLoading(false);
    }
  };

  const deleteCat = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/categories/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Xóa thất bại");
      setRows((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      alert(e.message);
    }
  };

  useEffect(() => {
    fetchCats();
  }, []);

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
      {/* ===== HEADER ===== */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
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
          Quản lý danh mục
        </h1>
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
          + Thêm danh mục
        </button>
      </div>

      {loading && <p style={{ color: "#ddd" }}>Đang tải dữ liệu…</p>}
      {err && <p style={{ color: "red" }}>{err}</p>}

      {!loading && (
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
                <th>ID</th>
                <th>Tên</th>
                <th>Slug</th>
                <th style={{ textAlign: "center" }}>Ảnh</th>
                <th>Mô tả</th>
                <th style={{ textAlign: "center" }}>Hành động</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((c, i) => (
                <tr
                  key={c.id}
                  style={{
                    background:
                      i % 2 === 0
                        ? "rgba(255,255,255,0.98)"
                        : "rgba(248,250,252,0.95)",
                    borderTop: "1px solid #eee",
                    transition: "background .2s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#f1f5f9")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      i % 2 === 0
                        ? "rgba(255,255,255,0.98)"
                        : "rgba(248,250,252,0.95)")
                  }
                >
                  <td>{c.id}</td>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td style={{ color: "#475569" }}>{c.slug}</td>
                  <td align="center">
                    {c.image ? (
                      <img
                        src={c.image_url || `${API_BASE}/storage/${c.image}`}
                        alt={c.name}
                        style={{
                          width: 60,
                          height: 40,
                          objectFit: "cover",
                          borderRadius: 6,
                          boxShadow: "0 0 4px rgba(0,0,0,.15)",
                        }}
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td style={{ color: "#374151" }}>{c.description}</td>

                  {/* ✅ Hành động căn giữa, ngang hàng, có hiệu ứng hover */}
                  <td align="center">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <button
                        onClick={() =>
                          navigate(`/admin/categories/edit/${c.id}`)
                        }
                        style={{
                          padding: "6px 14px",
                          background: "#16a34a",
                          color: "#fff",
                          border: 0,
                          borderRadius: 8,
                          cursor: "pointer",
                          fontWeight: 600,
                          transition: "transform .15s ease, box-shadow .15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "scale(1.05)";
                          e.currentTarget.style.boxShadow =
                            "0 0 8px rgba(22,163,74,.4)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "scale(1.0)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        Sửa
                      </button>

                      <button
                        onClick={() => deleteCat(c.id)}
                        style={{
                          padding: "6px 14px",
                          background: "#dc2626",
                          color: "#fff",
                          border: 0,
                          borderRadius: 8,
                          cursor: "pointer",
                          fontWeight: 600,
                          transition: "transform .15s ease, box-shadow .15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "scale(1.05)";
                          e.currentTarget.style.boxShadow =
                            "0 0 8px rgba(220,38,38,.4)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "scale(1.0)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!rows.length && (
                <tr>
                  <td
                    colSpan={6}
                    align="center"
                    style={{ padding: 20, color: "#6b7280" }}
                  >
                    Trống
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
