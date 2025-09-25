import { NavLink } from "react-router-dom";

const linkStyle = ({ isActive }) => ({
  display: "block",
  padding: "10px 14px",
  textDecoration: "none",
  color: isActive ? "#0f62fe" : "#222",
  background: isActive ? "rgba(15,98,254,.08)" : "transparent",
  borderRadius: 8,
  marginBottom: 6,
  fontWeight: 500,
});

export default function AdminSidebar() {
  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Admin</div>
      <nav>
        <NavLink to="/admin" end style={linkStyle}>Dashboard</NavLink>
        <NavLink to="/admin/products" style={linkStyle}>Products</NavLink>
        <NavLink to="/admin/categories" style={linkStyle}>Categories</NavLink>
        <NavLink to="/admin/orders" style={linkStyle}>Orders</NavLink>
        <NavLink to="/admin/users" style={linkStyle}>Users</NavLink>
      </nav>
    </div>
  );
}
