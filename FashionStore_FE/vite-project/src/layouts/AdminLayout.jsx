import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import AdminHeader from "../components/AdminHeader";

/* Nền tĩnh: giữ đúng màu gradient trước đây, không hiệu ứng/ảnh động */
const BG_GRADIENT =
  "linear-gradient(180deg, #081226 0%, #0b1631 40%, #0b1736 60%, #0a1531 100%)";

export default function AdminLayout() {
  return (
    <div className="admin-layout">
      {/* Nền tĩnh (chỉ màu), không animation, không hình ảnh */}
      <div className="admin-bg" aria-hidden />

      <aside className="admin-aside">
        <AdminSidebar />
      </aside>

      <header className="admin-header">
        <AdminHeader />
      </header>

      <main className="admin-main">
        <Outlet />
      </main>

      <Style />
    </div>
  );
}

/* ========== CHỈ UI, KHÔNG ĐỤNG LOGIC ========== */
function Style() {
  return (
    <style>{`
      :root{
        --line:#e9edf3;
        --panel:rgba(255,255,255,0.85);
        --shadow:0 6px 16px rgba(8,18,32,.06);
      }

      .admin-layout{
        display:grid;
        grid-template-columns:260px 1fr;
        grid-template-rows:60px 1fr;
        height:100vh;
        position:relative; /* để lớp nền đặt phía sau */
        color:#0f172a;
      }

      /* Lớp nền tĩnh: CHỈ màu gradient, không hiệu ứng */
      .admin-bg{
        position:fixed;
        inset:0;
        z-index:0;
        pointer-events:none;
        background:${BG_GRADIENT};
      }

      /* Sidebar / Header trong suốt nhẹ như trước để nổi trên nền */
      .admin-aside{
        grid-row:1 / span 2;
        background:var(--panel);
        backdrop-filter:blur(6px);
        border-right:1px solid var(--line);
        box-shadow:var(--shadow);
        z-index:2;
      }

      .admin-header{
        grid-column:2;
        background:var(--panel);
        backdrop-filter:blur(6px);
        border-bottom:1px solid var(--line);
        box-shadow:var(--shadow);
        position:sticky; top:0; z-index:2;
      }

      .admin-main{
        grid-column:2;
        padding:16px;
        overflow:auto;
        position:relative;
        z-index:1; /* trên nền, dưới header */
        background:transparent; /* để thấy màu nền phía sau */
      }

      /* Scrollbar gọn */
      .admin-main::-webkit-scrollbar{height:10px;width:10px}
      .admin-main::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:999px}
      .admin-main::-webkit-scrollbar-track{background:transparent}

      /* Responsive */
      @media (max-width:1100px){ .admin-layout{ grid-template-columns:220px 1fr; } }
      @media (max-width:820px){  .admin-layout{ grid-template-columns:200px 1fr; } }
      @media (max-width:680px){  .admin-layout{ grid-template-columns:170px 1fr; } }
    `}</style>
  );
}
