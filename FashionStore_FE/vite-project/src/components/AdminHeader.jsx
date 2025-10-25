import {
  getAdminToken,
  getAdminUser,
  clearAdminSession,
} from "../utils/authStorage";

export default function AdminHeader() {
  const user = getAdminUser();

  const handleLogout = async () => {
    const token = getAdminToken();

    try {
      if (token) {
        await fetch("http://127.0.0.1:8000/api/logout", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }).catch(() => {});
      }
    } catch (err) {
      console.error("Admin logout failed:", err);
    } finally {
      clearAdminSession();
      window.location.href = "/admin/login";
    }
  };

  return (
    <div
      style={{
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        borderBottom: "1px solid #eee",
        background: "#fff",
      }}
    >
      <strong>Admin Panel</strong>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <input
          placeholder="Search…"
          style={{
            height: 34,
            padding: "0 10px",
            border: "1px solid #ddd",
            borderRadius: 6,
            minWidth: 220,
          }}
        />

        {user && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "#0f62fe",
                color: "#fff",
                display: "grid",
                placeItems: "center",
                fontWeight: 700,
              }}
            >
              {user.name ? user.name[0].toUpperCase() : "A"}
            </div>
            <span style={{ fontWeight: 500 }}>{user.name}</span>
          </div>
        )}

        <button
          onClick={handleLogout}
          style={{
            background: "#d32f2f",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "6px 10px",
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          Đăng xuất
        </button>
      </div>
    </div>
  );
}
