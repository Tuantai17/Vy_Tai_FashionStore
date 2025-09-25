import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import AdminHeader from "../components/AdminHeader";

const layoutStyle = {
  display: "grid",
  gridTemplateColumns: "260px 1fr",
  gridTemplateRows: "60px 1fr",
  height: "100vh",
  background: "#f7f8fa",
};

export default function AdminLayout() {
  return (
    <div style={layoutStyle}>
      <aside style={{ gridRow: "1 / span 2", borderRight: "1px solid #eee", background: "#fff" }}>
        <AdminSidebar />
      </aside>

      <header style={{ gridColumn: 2, background: "#fff", borderBottom: "1px solid #eee" }}>
        <AdminHeader />
      </header>

      <main style={{ padding: 16, overflow: "auto" }}>
        <Outlet />
      </main>
    </div>
  );
}
