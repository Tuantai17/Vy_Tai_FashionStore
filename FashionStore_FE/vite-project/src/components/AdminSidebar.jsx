// import { NavLink } from "react-router-dom";

// const linkStyle = ({ isActive }) => ({
//   display: "block",
//   padding: "10px 14px",
//   textDecoration: "none",
//   color: isActive ? "#0f62fe" : "#222",
//   background: isActive ? "rgba(15,98,254,.08)" : "transparent",
//   borderRadius: 8,
//   marginBottom: 6,
//   fontWeight: 500,
// });

// export default function AdminSidebar() {
//   return (
//     <div style={{ padding: 16 }}>
//       <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Admin</div>
//       <nav>
//         <NavLink to="/admin" end style={linkStyle}>Dashboard</NavLink>
//         <NavLink to="/admin/products" style={linkStyle}>Products</NavLink>
//         <NavLink to="/admin/categories" style={linkStyle}>Categories</NavLink>
//         <NavLink to="/admin/orders" style={linkStyle}>Orders</NavLink>
//         <NavLink to="/admin/users" style={linkStyle}>Users</NavLink>
//       </nav>
//     </div>
//   );
// }



// src/components/AdminSidebar.jsx
// src/components/AdminSidebar.jsx
import { NavLink } from "react-router-dom";

const linkStyle = ({ isActive }) => ({
  display: "flex",
  alignItems: "center",
  height: 42,
  padding: "0 14px",
  textDecoration: "none",
  borderRadius: 12,
  marginBottom: 8,
  fontWeight: 600,
  letterSpacing: 0.2,
  color: isActive ? "#0f172a" : "rgba(255,255,255,.88)",
  background: isActive ? "#ffffff" : "transparent",
  boxShadow: isActive
    ? "0 10px 24px rgba(255,255,255,.25), 0 2px 6px rgba(0,0,0,.08)"
    : "inset 0 -1px 0 rgba(255,255,255,.04)",
  border: isActive
    ? "1px solid rgba(15,23,42,.06)"
    : "1px solid rgba(255,255,255,.06)",
  transition:
    "transform .05s ease, background .2s ease, color .2s ease, box-shadow .2s ease",
});

export default function AdminSidebar() {
  return (
    <div
      style={{
        padding: 18,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background:
          "linear-gradient(180deg, rgba(11,20,48,.92) 0%, rgba(8,18,44,.92) 100%)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        borderRight: "1px solid rgba(255,255,255,.08)",
        borderTopRightRadius: 20,
        borderBottomRightRadius: 20,
        boxShadow:
          "2px 0 14px rgba(0,0,0,.12), inset -1px 0 0 rgba(255,255,255,.04)",
        color: "#e5e7eb",
      }}
    >
      {/* Title */}
      <div
        style={{
          fontSize: 18,
          fontWeight: 800,
          marginBottom: 14,
          color: "#ffffff",
          textShadow: "0 1px 2px rgba(0,0,0,.25)",
          letterSpacing: 0.3,
        }}
      >
        Admin
      </div>

      {/* Navigation */}
      <nav style={{ paddingTop: 4, flex: 1 }}>
        <NavLink to="/admin" end style={linkStyle}>
          Dashboard
        </NavLink>
        <NavLink to="/admin/products" style={linkStyle}>
          Products
        </NavLink>
        <NavLink to="/admin/categories" style={linkStyle}>
          Categories
        </NavLink>
        <NavLink to="/admin/orders" style={linkStyle}>
          Orders
        </NavLink>
        <NavLink to="/admin/users" style={linkStyle}>
          Users
        </NavLink>

        {/* ⚙ Settings — Sát ngay dưới cùng danh sách, không tách xa */}
        <div style={{ marginTop: 16 }}>
          <NavLink
            to="/admin/settings"
            style={({ isActive }) => ({
              ...linkStyle({ isActive }),
              marginBottom: 0,
              color: isActive ? "#0f172a" : "rgba(255,255,255,.85)",
            })}
          >
            ⚙️ Settings
          </NavLink>
        </div>
      </nav>
    </div>
  );
}









// import { NavLink } from "react-router-dom";
// import { useState } from "react";

// const linkStyle = ({ isActive }) => ({
//   display: "flex",
//   alignItems: "center",
//   gap: 10,
//   padding: "10px 12px",
//   textDecoration: "none",
//   color: isActive ? "#0f172a" : "rgba(255,255,255,.9)",
//   background: isActive ? "#fff" : "transparent",
//   borderRadius: 10,
//   marginBottom: 6,
//   fontWeight: 600,
//   transition: "all 0.25s ease",
//   boxShadow: isActive
//     ? "0 4px 12px rgba(255,255,255,.25), 0 2px 6px rgba(0,0,0,.1)"
//     : "none",
// });

// export default function AdminSidebar() {
//   const [expanded, setExpanded] = useState(false);

//   // style text: khi mở thì chạy animation fade-slide, khi đóng thì ẩn nhanh
//   const textFx = (delay = 0) =>
//     expanded
//       ? {
//           animation: "fadeSlideIn .28s ease both",
//           animationDelay: `${delay}s`,
//           whiteSpace: "nowrap",
//         }
//       : { opacity: 0, transform: "translateX(-8px)", whiteSpace: "nowrap" };

//   return (
//     <>
//       <div
//         onMouseEnter={() => setExpanded(true)}
//         onMouseLeave={() => setExpanded(false)}
//         style={{
//           width: expanded ? 200 : 72,
//           transition: "width 0.35s ease",
//           height: "100vh",
//           background:
//             "linear-gradient(180deg, rgba(10,20,48,0.96) 0%, rgba(6,14,32,0.96) 100%)",
//           backdropFilter: "blur(8px)",
//           WebkitBackdropFilter: "blur(8px)",
//           borderRight: "1px solid rgba(255,255,255,0.08)",
//           boxShadow:
//             "2px 0 14px rgba(0,0,0,.12), inset -1px 0 0 rgba(255,255,255,.04)",
//           borderTopRightRadius: 18,
//           borderBottomRightRadius: 18,
//           padding: 14,
//           color: "#fff",
//           display: "flex",
//           flexDirection: "column",
//           justifyContent: "space-between",
//           overflow: "hidden",
//         }}
//       >
//         <div>
//           {/* Logo + tiêu đề */}
//           <div
//             style={{
//               display: "flex",
//               alignItems: "center",
//               gap: 10,
//               marginBottom: 20,
//               padding: "6px 4px",
//             }}
//           >
//             <div
//               style={{
//                 width: 36,
//                 height: 36,
//                 borderRadius: 10,
//                 background: "#0f62fe",
//                 display: "grid",
//                 placeItems: "center",
//                 fontWeight: 700,
//                 color: "#fff",
//                 fontSize: 18,
//                 flexShrink: 0,
//               }}
//             >
//               B
//             </div>
//             {/* Giữ nguyên cấu trúc: chỉ thêm style hiệu ứng */}
//             {expanded && (
//               <span
//                 style={{
//                   fontSize: 16,
//                   fontWeight: 700,
//                   letterSpacing: 0.2,
//                   ...textFx(0.02),
//                 }}
//               >
//                 Admin
//               </span>
//             )}
//           </div>

//           {/* Nav links */}
//           <nav>
//             <NavLink to="/admin" end style={linkStyle}>
//               <i
//                 className="bi bi-speedometer2"
//                 style={{ fontSize: 18, width: 24, textAlign: "center" }}
//               />
//               {expanded && <span style={textFx(0.00)}>Dashboard</span>}
//             </NavLink>

//             <NavLink to="/admin/products" style={linkStyle}>
//               <i
//                 className="bi bi-bag"
//                 style={{ fontSize: 18, width: 24, textAlign: "center" }}
//               />
//               {expanded && <span style={textFx(0.03)}>Products</span>}
//             </NavLink>

//             <NavLink to="/admin/categories" style={linkStyle}>
//               <i
//                 className="bi bi-tags"
//                 style={{ fontSize: 18, width: 24, textAlign: "center" }}
//               />
//               {expanded && <span style={textFx(0.06)}>Categories</span>}
//             </NavLink>

//             <NavLink to="/admin/orders" style={linkStyle}>
//               <i
//                 className="bi bi-receipt"
//                 style={{ fontSize: 18, width: 24, textAlign: "center" }}
//               />
//               {expanded && <span style={textFx(0.09)}>Orders</span>}
//             </NavLink>

//             <NavLink to="/admin/users" style={linkStyle}>
//               <i
//                 className="bi bi-people"
//                 style={{ fontSize: 18, width: 24, textAlign: "center" }}
//               />
//               {expanded && <span style={textFx(0.12)}>Users</span>}
//             </NavLink>
//           </nav>
//         </div>

//         <div
//           style={{
//             textAlign: "center",
//             fontSize: 12,
//             color: "rgba(255,255,255,.5)",
//             ...(expanded ? textFx(0.15) : { opacity: 0 }),
//           }}
//         >
//           {expanded && "© 2025 Admin Panel"}
//         </div>
//       </div>

//       {/* Keyframes cho fade-slide (đặt kèm trong component để khỏi sửa global CSS) */}
//       <style>{`
//         @keyframes fadeSlideIn {
//           0%   { opacity: 0; transform: translateX(-8px); }
//           100% { opacity: 1; transform: translateX(0); }
//         }
//       `}</style>
//     </>
//   );
// }
