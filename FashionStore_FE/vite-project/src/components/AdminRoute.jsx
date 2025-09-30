// src/components/AdminRoute.jsx
import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  // Nếu chưa login hoặc không phải admin => redirect về trang login
  if (!user || user.roles !== "admin") {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}