import { useState } from "react";

const dummy = [
  { id: 1, name: "Admin", email: "admin@example.com", role: "admin" },
  { id: 2, name: "Khách A", email: "a@example.com", role: "customer" },
];

export default function Users() {
  const [users, setUsers] = useState(dummy);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Users</h1>

      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">ID</th>
              <th className="px-4 py-3 text-left font-semibold">Tên</th>
              <th className="px-4 py-3 text-left font-semibold">Email</th>
              <th className="px-4 py-3 text-left font-semibold">Vai trò</th>
              <th className="px-4 py-3 text-center font-semibold">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{u.id}</td>
                <td className="px-4 py-3">{u.name}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3 capitalize">{u.role}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button className="rounded-md border px-3 py-1.5 text-xs hover:bg-gray-50">Sửa</button>
                    <button
                      onClick={() => setUsers(users.filter((x) => x.id !== u.id))}
                      className="rounded-md bg-amber-600 px-3 py-1.5 text-xs text-white hover:bg-amber-700"
                    >
                      Khoá
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
