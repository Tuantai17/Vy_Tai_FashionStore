import { useEffect, useState } from "react";

const API_BASE = "http://127.0.0.1:8000/api";
const badge = (active) => ({
  display: "inline-block",
  padding: "2px 8px",
  borderRadius: 999,
  background: active ? "#e7f9ee" : "#fff6e6",
  color: active ? "#0a7a3f" : "#a35b00",
  fontSize: 12,
});
const humanStatus = (s) => (Number(s) === 1 ? "Active" : "Locked");

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");

  const token = localStorage.getItem("token"); // đổi key nếu bạn lưu khác
  const authHeaders = {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // Tải danh sách
  useEffect(() => {
    let ignore = false;
    const ac = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setErr("");

        if (!token) {
          setErr("Chưa đăng nhập. Vui lòng đăng nhập để xem danh sách người dùng.");
          setUsers([]);
          return;
        }

        const url = `${API_BASE}/users?per_page=100${
          search ? `&search=${encodeURIComponent(search)}` : ""
        }`;

        const res = await fetch(url, { headers: authHeaders, signal: ac.signal });

        if (res.status === 401) {
          setErr("Phiên đăng nhập hết hạn hoặc token không hợp lệ. Vui lòng đăng nhập lại.");
          setUsers([]);
          return;
        }
        if (res.status === 403) {
          setErr("Bạn không có quyền xem danh sách người dùng (cần quyền admin).");
          setUsers([]);
          return;
        }
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.data ?? []; // paginate
        if (!ignore) setUsers(list);
      } catch (e) {
        if (!ignore) {
          console.error(e);
          setErr("Không tải được danh sách người dùng.");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
      ac.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, token]);

  const toggleLock = async (u) => {
    try {
      if (!token) {
        alert("Bạn cần đăng nhập.");
        return;
      }
      const next = Number(u.status) === 1 ? 0 : 1;
      const res = await fetch(`${API_BASE}/users/${u.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ status: next }),
      });

      if (res.status === 401) return alert("Hết hạn phiên. Đăng nhập lại nhé.");
      if (res.status === 403) return alert("Bạn không có quyền thực hiện thao tác này.");

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, status: next } : x)));
    } catch (e) {
      console.error(e);
      alert("Không cập nhật được trạng thái: " + e.message);
    }
  };

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Users</h1>

      {/* Tìm kiếm */}
      <div className="flex items-center gap-2">
        <input
          className="rounded-md border px-3 py-2 text-sm"
          placeholder="Tìm theo ID / tên / email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          className="rounded-md border bg-white px-3 py-2 text-sm"
          onClick={() => setSearch("")}
        >
          Xóa tìm
        </button>
      </div>

      {loading && <p>Đang tải...</p>}
      {err && <p className="text-red-600">{err}</p>}

      {!loading && !err && (
        <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">ID</th>
                <th className="px-4 py-3 text-left font-semibold">Tên</th>
                <th className="px-4 py-3 text-left font-semibold">Email</th>
                <th className="px-4 py-3 text-left font-semibold">Vai trò</th>
                <th className="px-4 py-3 text-left font-semibold">Trạng thái</th>
                <th className="px-4 py-3 text-center font-semibold">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{u.id}</td>
                  <td className="px-4 py-3">{u.name}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3 capitalize">{u.roles}</td>
                  <td className="px-4 py-3">
                    <span style={badge(Number(u.status) === 1)}>
                      {humanStatus(u.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button className="rounded-md border px-3 py-1.5 text-xs hover:bg-gray-50">
                        Sửa
                      </button>
                      <button
                        onClick={() => toggleLock(u)}
                        className={`rounded-md px-3 py-1.5 text-xs text-white ${
                          Number(u.status) === 1
                            ? "bg-amber-600 hover:bg-amber-700"
                            : "bg-emerald-600 hover:bg-emerald-700"
                        }`}
                      >
                        {Number(u.status) === 1 ? "Khoá" : "Mở khoá"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    Không có người dùng.
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
