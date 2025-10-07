// src/pages/Admin/User/Users.jsx
import { useEffect, useState, useMemo } from "react";

const API_BASE = "http://127.0.0.1:8000/api";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const token = localStorage.getItem("token");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setErr("");
      const res = await fetch(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Không tải được danh sách người dùng");
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message || "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Xoá trực tiếp
  const removeUser = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
      }
    } catch (e) {
      console.error("Delete error:", e);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return users;
    return users.filter(
      (u) =>
        String(u.id).includes(kw) ||
        (u.name || "").toLowerCase().includes(kw) ||
        (u.email || "").toLowerCase().includes(kw) ||
        (u.username || "").toLowerCase().includes(kw) ||
        (u.roles || "").toLowerCase().includes(kw)
    );
  }, [q, users]);

  // ===== UI helpers
  const Badge = ({ active }) => (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        background: active ? "#ecfdf5" : "#f3f4f6",
        color: active ? "#065f46" : "#374151",
        border: `1px solid ${active ? "#a7f3d0" : "#e5e7eb"}`,
        whiteSpace: "nowrap",
      }}
    >
      {active ? "Hoạt động" : "Khoá"}
    </span>
  );

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
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: "#fff",
            letterSpacing: 0.3,
            textShadow: "0 1px 2px rgba(0,0,0,.4)",
            margin: 0,
          }}
        >
          Users
        </h1>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo tên, email, role…"
          style={{
            height: 38,
            padding: "0 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,.25)",
            background: "rgba(255,255,255,0.2)",
            color: "#fff",
            minWidth: 240,
            outline: "none",
            backdropFilter: "blur(6px)",
          }}
        />
      </div>

      {/* State */}
      {err && (
        <p style={{ color: "#ef4444", fontWeight: 600, marginTop: 8 }}>{err}</p>
      )}
      {loading && <p style={{ color: "#ddd" }}>Đang tải dữ liệu…</p>}

      {/* Table */}
      {!loading && (
        <div
          style={{
            overflowX: "auto",
            borderRadius: 12,
            background: "rgba(255,255,255,0.92)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              borderRadius: 12,
              overflow: "hidden",
              fontSize: 14,
            }}
          >
            <thead>
              <tr
                style={{
                  background:
                    "linear-gradient(90deg, rgba(255,255,255,1), rgba(248,250,252,0.95))",
                  color: "#1f2937",
                  fontWeight: 700,
                  borderBottom: "2px solid #e5e7eb",
                }}
              >
                <th style={{ textAlign: "left", padding: "10px 12px" }}>ID</th>
                <th style={{ textAlign: "left", padding: "10px 12px" }}>Tên</th>
                <th style={{ textAlign: "left", padding: "10px 12px" }}>Email</th>
                <th style={{ textAlign: "left", padding: "10px 12px" }}>
                  Username
                </th>
                <th style={{ textAlign: "left", padding: "10px 12px" }}>
                  Vai trò
                </th>
                <th style={{ textAlign: "center", padding: "10px 12px" }}>
                  Trạng thái
                </th>
                <th style={{ textAlign: "center", padding: "10px 12px" }}>
                  Hành động
                </th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((u, i) => (
                <tr
                  key={u.id}
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
                  <td style={{ padding: "10px 12px" }}>{u.id}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 600 }}>
                    {u.name}
                  </td>
                  <td style={{ padding: "10px 12px", color: "#475569" }}>
                    {u.email}
                  </td>
                  <td style={{ padding: "10px 12px" }}>{u.username}</td>
                  <td style={{ padding: "10px 12px", textTransform: "capitalize" }}>
                    {u.roles}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "center" }}>
                    <Badge active={u.status === 1} />
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "center" }}>
                    <button
                      onClick={() => removeUser(u.id)}
                      style={{
                        padding: "6px 14px",
                        background: "#dc2626",
                        color: "#fff",
                        border: 0,
                        borderRadius: 8,
                        cursor: "pointer",
                        fontWeight: 600,
                        transition: "transform .15s ease",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.transform = "scale(1.05)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.transform = "scale(1.0)")
                      }
                    >
                      Xoá
                    </button>
                  </td>
                </tr>
              ))}

              {!filtered.length && (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: 20,
                      textAlign: "center",
                      color: "#6b7280",
                    }}
                  >
                    Không có người dùng nào
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
