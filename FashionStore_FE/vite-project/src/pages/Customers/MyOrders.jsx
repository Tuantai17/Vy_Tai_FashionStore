// src/pages/Customers/MyOrders.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000/api";

/**
 * Lấy danh sách đơn hàng của người dùng đang đăng nhập theo user_id.
 * - Ưu tiên các endpoint có filter theo user_id (my-orders / users/:id/orders / ?user_id=...)
 * - Nếu không có, fallback lấy /orders rồi lọc client theo các trường user_id/created_by/customer_id/account_id.
 * - Bấm "Xem" => /track?code=<order.code || order.id>
 */
export default function MyOrders() {
  const navigate = useNavigate();

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  // Lấy userId từ nhiều khả năng cấu trúc user trong localStorage
  const userId = useMemo(() => {
    const raw =
      user?.id ??
      user?.user_id ??
      user?.user?.id ??
      user?.profile?.id ??
      null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [user]);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!userId) {
      setErr("Không tìm thấy user_id. Vui lòng đăng nhập lại.");
      setLoading(false);
      return;
    }

    const ac = new AbortController();

    (async () => {
      setLoading(true);
      setErr("");

      // Danh sách endpoint ứng viên theo thứ tự ưu tiên
      const candidates = [
        // 1) Dựa vào token: server tự biết user hiện tại
        {
          url: `${API_BASE}/my-orders`,
          opts: () => {
            const token = localStorage.getItem("token");
            return token
              ? {
                  headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  signal: ac.signal,
                }
              : null;
          },
          postFilter: true, // vẫn lọc lại theo user_id đề phòng backend trả dư
        },
        // 2) REST theo user
        {
          url: `${API_BASE}/users/${userId}/orders`,
          opts: () => ({
            headers: { Accept: "application/json" },
            signal: ac.signal,
          }),
          postFilter: false,
        },
        // 3) Query phổ biến
        {
          url: `${API_BASE}/orders?user_id=${userId}`,
          opts: () => ({
            headers: { Accept: "application/json" },
            signal: ac.signal,
          }),
          postFilter: true,
        },
        {
          url: `${API_BASE}/orders?customer_id=${userId}`,
          opts: () => ({
            headers: { Accept: "application/json" },
            signal: ac.signal,
          }),
          postFilter: true,
        },
        {
          url: `${API_BASE}/orders?account_id=${userId}`,
          opts: () => ({
            headers: { Accept: "application/json" },
            signal: ac.signal,
          }),
          postFilter: true,
        },
        {
          url: `${API_BASE}/orders?created_by=${userId}`,
          opts: () => ({
            headers: { Accept: "application/json" },
            signal: ac.signal,
          }),
          postFilter: true,
        },
        // 4) Cuối cùng: lấy tất cả rồi lọc client
        {
          url: `${API_BASE}/orders`,
          opts: () => ({
            headers: { Accept: "application/json" },
            signal: ac.signal,
          }),
          postFilter: true,
        },
      ];

      const matchByUserId = (o) => {
        const ids = [
          o?.user_id,
          o?.customer_id,
          o?.account_id,
          o?.created_by,
          o?.user?.id,
        ]
          .map((v) => (v == null ? null : Number(v)))
          .filter((v) => Number.isFinite(v));

        return ids.includes(userId);
      };

      let finalList = [];
      for (const c of candidates) {
        const opts = c.opts();
        if (!opts) continue; // bỏ qua my-orders nếu không có token

        try {
          const res = await fetch(c.url, opts);
          if (!res.ok) continue;

          const data = await res.json();
          // Chuẩn hóa mảng orders
          let arr =
            Array.isArray(data?.data) ? data.data :
            Array.isArray(data?.orders) ? data.orders :
            Array.isArray(data) ? data : [];

          // Lọc theo user_id nếu cần
          if (c.postFilter) arr = arr.filter(matchByUserId);

          // Nếu đã có kết quả thì dùng và thoát vòng lặp
          if (arr.length > 0) {
            finalList = arr;
            break;
          }

          // Nếu endpoint hợp lệ nhưng rỗng, tiếp tục thử cái sau.
          // Nếu đây là endpoint cuối cùng, vẫn dùng arr (rỗng) -> báo "không có đơn".
          if (c === candidates[candidates.length - 1]) {
            finalList = arr;
          }
        } catch {
          // thử endpoint tiếp theo
        }
      }

      // Sắp xếp mới nhất lên đầu
      finalList.sort((a, b) => {
        const idDiff = (Number(b.id) || 0) - (Number(a.id) || 0);
        if (idDiff) return idDiff;
        const ta = new Date(a.created_at || a.createdAt || 0).getTime();
        const tb = new Date(b.created_at || b.createdAt || 0).getTime();
        return tb - ta;
      });

      setOrders(finalList);
      if (!finalList.length) {
        setErr("Không tìm thấy đơn hàng nào thuộc tài khoản này.");
      }
      setLoading(false);
    })();

    return () => ac.abort();
  }, [userId]);

  const formatVND = (n) =>
    typeof n === "number"
      ? new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(n)
      : n ?? "-";

  const toTrack = (o) => {
    const code = o.code || o.id;
    navigate(`/track?code=${code}`);
  };

  if (!user) {
    return (
      <section className="max-w-5xl mx-auto p-4">
        <h1 className="text-2xl font-semibold">Đơn hàng của tôi</h1>
        <p className="mt-3 text-red-600">Vui lòng đăng nhập để xem đơn hàng.</p>
      </section>
    );
  }

  return (
    <section className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-semibold">
        Đơn hàng của <span className="text-emerald-600">{user.name}</span>
      </h1>
      <div className="text-sm text-gray-500 mt-1">User ID: {userId}</div>

      {loading && <p className="mt-4">Đang tải...</p>}
      {!loading && err && <p className="mt-4 text-red-600">{err}</p>}

      {!loading && !err && orders.length > 0 && (
        <div className="mt-5 overflow-x-auto rounded-lg border">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr className="text-left">
                <th className="px-4 py-3">Order #</th>
                <th className="px-4 py-3">Ngày</th>
                <th className="px-4 py-3">Tổng tiền</th>
                <th className="px-4 py-3 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id || o.code} className="border-t">
                  <td className="px-4 py-3 font-medium">{o.code || o.id}</td>
                  <td className="px-4 py-3">
                    {(o.created_at || o.createdAt || "")
                      .slice(0, 19)
                      .replace("T", " ")}
                  </td>
                  <td className="px-4 py-3">
                    {formatVND(
                      typeof o.total_price === "number"
                        ? o.total_price
                        : typeof o.total === "number"
                        ? o.total
                        : o.total_price ?? o.total ?? 0
                    )}
                  </td>
                  
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toTrack(o)}
                      className="rounded-md bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-700"
                    >
                      Xem
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
