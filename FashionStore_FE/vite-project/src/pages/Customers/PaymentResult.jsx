import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000/api";

// Map mã MoMo → trạng thái hiển thị
const parseStatus = (code) => {
  const c = Number(code);
  if (c === 0) return { key: "success", text: "Thanh toán thành công" };
  if (c === 7002) return { key: "pending", text: "Giao dịch đang được ngân hàng xử lý" };
  if (c === 7000) return { key: "canceled", text: "Bạn đã hủy thanh toán" };
  return { key: "failed", text: "Thanh toán thất bại" };
};

export default function PaymentResult() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();

  const momo = useMemo(
    () => ({
      partnerCode: sp.get("partnerCode") || "",
      orderId: sp.get("orderId") || "",
      requestId: sp.get("requestId") || "",
      transId: sp.get("transId") || "",
      resultCode: Number(sp.get("resultCode") || -1),
      message: sp.get("message") || "",
      amount: sp.get("amount") || "",
      payType: sp.get("payType") || "",
    }),
    [sp]
  );

  const [status, setStatus] = useState(parseStatus(momo.resultCode)); // success/pending/failed/...
  const [note, setNote] = useState(momo.message);
  const [checking, setChecking] = useState(false);
  const tries = useRef(0);
  const maxTries = 24; // ~2 phút (mỗi 5s)
  const intervalMs = 5000;

  // Poll trạng thái khi đang pending (7002)
  useEffect(() => {
    if (status.key !== "pending" || !momo.orderId) return;

    const timer = setInterval(async () => {
      if (tries.current++ >= maxTries) {
        clearInterval(timer);
        setNote(
          "Ngân hàng đang xử lý lâu hơn dự kiến. Bạn có thể đợi thêm hoặc xem ở “Đơn hàng của tôi”."
        );
        return;
      }
      setChecking(true);
      try {
        const r = await fetch(
          `${API_BASE}/momo/status?orderId=${encodeURIComponent(momo.orderId)}`,
          { headers: { Accept: "application/json" } }
        );
        if (r.ok) {
          const j = await r.json();
          const s = parseStatus(j.resultCode);
          setStatus(s);
          setNote(j.message || s.text);
          if (s.key !== "pending") clearInterval(timer);
        }
      } catch {
        // bỏ qua lỗi mạng – vẫn hiển thị pending
      } finally {
        setChecking(false);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [status.key, momo.orderId]);

  // ✅ Khi thành công → tự về Home sau 5s (đếm ngược)
  const [countdown, setCountdown] = useState(5);
  useEffect(() => {
    if (status.key !== "success") return;
    setCountdown(5);
    const t = setInterval(() => {
      setCountdown((s) => {
        if (s <= 1) {
          clearInterval(t);
          navigate("/", { replace: true });
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [status.key, navigate]);

  const Color =
    {
      success: "bg-green-50 text-green-700 ring-green-200",
      pending: "bg-amber-50 text-amber-700 ring-amber-200",
      failed: "bg-red-50 text-red-700 ring-red-200",
      canceled: "bg-gray-50 text-gray-700 ring-gray-200",
    }[status.key] || "bg-gray-50 text-gray-800 ring-gray-200";

  const Badge =
    {
      success: "✓",
      pending: "⏳",
      failed: "✕",
      canceled: "⟲",
    }[status.key] || "ℹ︎";

  const amountVND =
    momo.amount && !Number.isNaN(Number(momo.amount))
      ? Number(momo.amount).toLocaleString("vi-VN") + " đ"
      : "—";

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <div className={`rounded-2xl ring-1 ${Color} p-6 md:p-8`}>
          <div className="flex items-start gap-4">
            <div className="text-3xl md:text-4xl">{Badge}</div>
            <div>
              <h1 className="text-xl md:text-2xl font-semibold mb-1">{status.text}</h1>
              <p className="text-sm md:text-base opacity-80">{note}</p>

              <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-white/70 p-4">
                  <dt className="font-medium text-gray-800">Mã đơn MoMo</dt>
                  <dd className="text-gray-600 break-all">{momo.orderId || "—"}</dd>
                </div>
                <div className="rounded-xl bg-white/70 p-4">
                  <dt className="font-medium text-gray-800">Mã giao dịch</dt>
                  <dd className="text-gray-600 break-all">{momo.transId || "—"}</dd>
                </div>
                <div className="rounded-xl bg-white/70 p-4">
                  <dt className="font-medium text-gray-800">Số tiền</dt>
                  <dd className="text-gray-600">{amountVND}</dd>
                </div>
                <div className="rounded-xl bg-white/70 p-4">
                  <dt className="font-medium text-gray-800">Phương thức</dt>
                  <dd className="text-gray-600">{momo.payType || "—"}</dd>
                </div>
              </dl>

              <div className="mt-8 flex flex-wrap gap-3">
                {status.key === "pending" && (
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 rounded-xl bg-white text-gray-800 ring-1 ring-black/10 hover:bg-gray-50 transition"
                    disabled={checking}
                  >
                    {checking ? "Đang kiểm tra..." : "Làm mới"}
                  </button>
                )}

                <Link
                  to="/my-orders"
                  className="px-4 py-2 rounded-xl bg-black text-white hover:bg-gray-900 transition"
                >
                  Đơn hàng của tôi
                </Link>

                <button
                  onClick={() => navigate("/", { replace: true })}
                  className="px-4 py-2 rounded-xl bg-white text-gray-800 ring-1 ring-black/10 hover:bg-gray-50 transition"
                >
                  Về trang chủ
                </button>
              </div>

              {status.key === "success" && (
                <p className="mt-6 text-sm text-green-700">
                  ✅ Thanh toán đã được xác nhận. Tự chuyển về trang chủ sau{" "}
                  <span className="font-semibold">{countdown}s</span>.
                </p>
              )}
              {status.key === "failed" && (
                <p className="mt-6 text-sm text-red-700">
                  ❌ Giao dịch không thành công. Bạn hãy thử lại hoặc chọn phương thức khác.
                </p>
              )}
              {status.key === "canceled" && (
                <p className="mt-6 text-sm text-gray-700">⟲ Bạn đã hủy thanh toán.</p>
              )}
              {status.key === "pending" && (
                <p className="mt-6 text-sm text-amber-700">
                  ⏳ Hệ thống sẽ tự kiểm tra trạng thái trong vài phút. Bạn có thể rời trang—khi
                  ngân hàng xác nhận, đơn sẽ tự cập nhật.
                </p>
              )}
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-gray-500">
          * Nếu bạn đóng trang quá sớm, vẫn có thể kiểm tra trạng thái ở mục “Đơn hàng của tôi”.
        </p>
      </div>
    </div>
  );
}
