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

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo tên, email, role…"
          className="h-10 rounded-lg border px-3"
        />
      </div>

      {err && <p className="text-red-600">{err}</p>}
      {loading && <p>Đang tải dữ liệu…</p>}

      {!loading && (
        <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">ID</th>
                <th className="px-4 py-3 text-left font-semibold">Tên</th>
                <th className="px-4 py-3 text-left font-semibold">Email</th>
                <th className="px-4 py-3 text-left font-semibold">Username</th>
                <th className="px-4 py-3 text-left font-semibold">Vai trò</th>
<th className="px-4 py-3 text-center font-semibold">Trạng thái</th>
                <th className="px-4 py-3 text-center font-semibold">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{u.id}</td>
                  <td className="px-4 py-3">{u.name}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{u.username}</td>
                  <td className="px-4 py-3 capitalize">{u.roles}</td>
                  <td className="px-4 py-3 text-center">
                    {u.status === 1 ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-700">
                        Hoạt động
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-200 px-2 py-0.5 text-gray-700">
                        Khoá
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => removeUser(u.id)}
                      className="rounded-md bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-700"
                    >
                      Xoá
                    </button>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
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
