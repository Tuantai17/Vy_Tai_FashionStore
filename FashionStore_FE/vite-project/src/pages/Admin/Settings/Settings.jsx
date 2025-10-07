// src/pages/Admin/Settings/Settings.jsx
import { useEffect, useState } from "react";

export default function AdminSettings() {
  // các state demo (lưu/localStorage để lần sau còn nhớ)
  const [storeName, setStoreName] = useState("");
  const [theme, setTheme] = useState("system");     // system | light | dark
  const [notif, setNotif] = useState(true);
  const [twoFA, setTwoFA] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("admin:settings") || "{}");
      setStoreName(saved.storeName || "");
      setTheme(saved.theme || "system");
      setNotif(saved.notif ?? true);
      setTwoFA(saved.twoFA ?? false);
    } catch {}
  }, []);

  const save = () => {
    const payload = { storeName, theme, notif, twoFA };
    localStorage.setItem("admin:settings", JSON.stringify(payload));
    alert("✅ Đã lưu cài đặt cục bộ (localStorage).");
  };

  const Card = ({ title, children }) => (
    <div
      style={{
        background: "rgba(255,255,255,.92)",
        borderRadius: 16,
        border: "1px solid rgba(15,23,42,.08)",
        boxShadow: "0 8px 20px rgba(3,10,27,.12)",
        padding: 16,
      }}
    >
      <div style={{ fontWeight: 800, color: "#0f172a", marginBottom: 10 }}>
        {title}
      </div>
      {children}
    </div>
  );

  const label = { fontSize: 13, color: "#334155", marginBottom: 6, fontWeight: 600 };
  const input = {
    height: 38,
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    padding: "0 12px",
    outline: "none",
    background: "#fff",
    width: "100%",
  };

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
//       {/* Header */}
//       <div
//         style={{
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "space-between",
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
//           Settings
//         </h1>

//         <button
//           onClick={save}
//           style={{
//             padding: "10px 16px",
//             borderRadius: 12,
//             border: "none",
//             background: "linear-gradient(90deg,#8b5cf6,#06b6d4)",
//             color: "#fff",
//             fontWeight: 700,
//             boxShadow: "0 8px 18px rgba(99,102,241,.35)",
//             cursor: "pointer",
//           }}
//         >
//           Lưu thay đổi
//         </button>
//       </div>

//       {/* Content */}
//       <div
//         style={{
//           display: "grid",
//           gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
//           gap: 14,
//         }}
//       >
//         {/* General */}
//         <Card title="Thông tin chung">
//           <div style={{ display: "grid", gap: 10 }}>
//             <div>
//               <div style={label}>Tên cửa hàng</div>
//               <input
//                 value={storeName}
//                 onChange={(e) => setStoreName(e.target.value)}
//                 placeholder="Fashion Store"
//                 style={input}
//               />
//             </div>

//             <div>
//               <div style={label}>Giao diện</div>
//               <select
//                 value={theme}
//                 onChange={(e) => setTheme(e.target.value)}
//                 style={{ ...input, height: 40 }}
//               >
//                 <option value="system">Theo hệ thống</option>
//                 <option value="light">Sáng</option>
//                 <option value="dark">Tối</option>
//               </select>
//             </div>
//           </div>
//         </Card>

//         {/* Notifications */}
//         <Card title="Thông báo">
//           <div style={{ display: "grid", gap: 12 }}>
//             <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
//               <input
//                 type="checkbox"
//                 checked={notif}
//                 onChange={(e) => setNotif(e.target.checked)}
//               />
//               Bật thông báo đơn hàng / cảnh báo tồn kho
//             </label>
//           </div>
//         </Card>

//         {/* Security */}
//         <Card title="Bảo mật">
//           <div style={{ display: "grid", gap: 12 }}>
//             <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
//               <input
//                 type="checkbox"
//                 checked={twoFA}
//                 onChange={(e) => setTwoFA(e.target.checked)}
//               />
//               Bật xác thực 2 lớp (2FA)
//             </label>
//             <button
//               type="button"
//               onClick={() => alert("Đã gửi link đổi mật khẩu vào email quản trị (demo).")}
//               style={{
//                 height: 38,
//                 borderRadius: 10,
//                 border: "1px solid #e5e7eb",
//                 background: "#fff",
//                 fontWeight: 600,
//                 cursor: "pointer",
//               }}
//             >
//               Đổi mật khẩu quản trị
//             </button>
//           </div>
//         </Card>
//       </div>
//     </section>
//   );
}
