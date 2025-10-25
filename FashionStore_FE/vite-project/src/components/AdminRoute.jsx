import { Navigate } from "react-router-dom";
import { getAdminUser, getAdminToken } from "../utils/authStorage";

export default function AdminRoute({ children }) {
  const user = getAdminUser();
  const token = getAdminToken();

  if (!user || !token || user.roles !== "admin") {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
