import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiPost } from "../../lib/api";

const SHIPPING_FEE = 0;

const initialForm = {
  customer_name: "",
  phone: "",
  email: "",
  address: "",
  payment_method: "COD",
};

const currency = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

export default function Checkout({ cart: cartProp = [], setCart }) {
  const navigate = useNavigate();
  const location = useLocation();

  const cart = location.state?.cart ?? cartProp;

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [momoType, setMomoType] = useState("captureWallet");

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [couponAlert, setCouponAlert] = useState(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0),
    [cart]
  );

  const finalTotal = useMemo(
    () => Math.max(0, subtotal + SHIPPING_FEE - discount),
    [subtotal, discount]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const parseApiError = (err, fallback = "Đã xảy ra lỗi, vui lòng thử lại.") => {
    if (!err) return fallback;

    if (err.body) {
      try {
        const body = JSON.parse(err.body);
        if (body?.message) return body.message;
        if (body?.errors) {
          const firstField = Object.values(body.errors)[0];
          if (Array.isArray(firstField) && firstField[0]) return firstField[0];
        }
      } catch {
        /* ignore */
      }
    }

    if (err.message) return err.message;
    return fallback;
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    const code = couponInput.trim();
    if (!code) {
      setCouponAlert({ type: "error", message: "Vui lòng nhập mã giảm giá." });
      return;
    }
    if (subtotal <= 0) {
      setCouponAlert({ type: "error", message: "Giỏ hàng đang trống." });
      return;
    }

    setCheckingCoupon(true);
    setCouponAlert(null);
    try {
      const res = await apiPost(
        "/coupons/apply",
        { code, subtotal },
        { auth: true }
      );
      setAppliedCoupon(res.coupon);
      setDiscount(Number(res.discount || 0));
      setCouponAlert({
        type: "success",
        message: `Đã áp dụng mã ${res.coupon.code}. Giảm ${currency.format(res.discount || 0)}.`,
      });
    } catch (err) {
      console.error(err);
      setAppliedCoupon(null);
      setDiscount(0);
      setCouponAlert({
        type: "error",
        message: parseApiError(err, "Không thể áp dụng mã giảm giá."),
      });
    } finally {
      setCheckingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
    setCouponAlert({ type: "info", message: "Đã bỏ áp dụng mã giảm giá." });
  };

  const handlePayWithMomo = async () => {
    setLoading(true);
    setError("");
    try {
      const amount = Math.max(1000, Math.round(finalTotal) || 0);
      const response = await apiPost(
        "/momo/create",
        {
          amount: Number(amount),
          method: momoType === "payWithATM" ? "payWithATM" : "momo_wallet",
          coupon_code: appliedCoupon?.code,
        },
        { auth: true }
      );

      if (response?.payUrl) {
        window.location.href = response.payUrl;
        return;
      }

      setError(response?.message || "Không khởi tạo được thanh toán MoMo.");
    } catch (err) {
      console.error(err);
      setError(parseApiError(err, "Không thể kết nối tới MoMo."));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        ...form,
        items: cart,
        coupon_code: appliedCoupon?.code ?? null,
        shipping_fee: SHIPPING_FEE,
      };

      const data = await apiPost("/checkout", payload, { auth: true });

      const orderCode =
        data?.code ||
        data?.order_code ||
        data?.order?.code ||
        data?.order_id ||
        data?.id;

      alert(
        "Đặt hàng thành công!" + (orderCode ? ` Mã đơn: ${orderCode}` : "")
      );

      setCart?.([]);
      setAppliedCoupon(null);
      setDiscount(0);
      setCouponInput("");
      setCouponAlert(null);

      if (orderCode) {
        localStorage.setItem("last_order_code", String(orderCode));
        navigate(`/track?code=${encodeURIComponent(orderCode)}`, { replace: true });
      } else {
        navigate("/track", { replace: true });
      }
    } catch (err) {
      console.error(err);
      setError(parseApiError(err, "Không thể tạo đơn hàng."));
    } finally {
      setLoading(false);
    }
  };

  if (!cart?.length) {
    return (
      <div style={{ maxWidth: 800, margin: "40px auto", padding: 20 }}>
        <h2 style={{ marginBottom: 12, color: "#388e3c" }}>Thanh toán</h2>
        <p>Giỏ hàng của bạn đang trống. Vui lòng quay lại chọn sản phẩm.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 980, margin: "30px auto", padding: 20 }}>
      <h2 style={{ marginBottom: 20, color: "#388e3c" }}>Thanh toán</h2>

      {(error || couponAlert) && (
        <div style={{ marginBottom: 16, display: "grid", gap: 8 }}>
          {error && (
            <div
              style={{
                color: "#b91c1c",
                background: "#fee2e2",
                padding: "10px 14px",
                borderRadius: 10,
              }}
            >
              {error}
            </div>
          )}
          {couponAlert && (
            <div
              style={{
                color:
                  couponAlert.type === "success"
                    ? "#047857"
                    : couponAlert.type === "error"
                    ? "#b91c1c"
                    : "#1d4ed8",
                background:
                  couponAlert.type === "success"
                    ? "#d1fae5"
                    : couponAlert.type === "error"
                    ? "#fee2e2"
                    : "#dbeafe",
                padding: "8px 12px",
                borderRadius: 10,
              }}
            >
              {couponAlert.message}
            </div>
          )}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 20,
          alignItems: "flex-start",
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{
            background: "#fff",
            padding: 20,
            borderRadius: 12,
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ marginBottom: 16 }}>Thông tin khách hàng</h3>

          <div style={{ marginBottom: 12 }}>
            <label>Họ và tên</label>
            <input
              name="customer_name"
              value={form.customer_name}
              onChange={handleChange}
              required
              style={{ width: "100%", padding: 10 }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label>Số điện thoại</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              required
              style={{ width: "100%", padding: 10 }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              style={{ width: "100%", padding: 10 }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label>Địa chỉ giao hàng</label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              required
              rows={3}
              style={{ width: "100%", padding: 10 }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label>Phương thức thanh toán</label>
            <select
              name="payment_method"
              value={form.payment_method}
              onChange={handleChange}
              style={{ width: "100%", padding: 10 }}
            >
              <option value="COD">Thanh toán khi nhận hàng</option>
              <option value="Bank">Ví điện tử / Chuyển khoản</option>
            </select>
          </div>

          {form.payment_method === "Bank" && (
            <div
              style={{
                background: "#F6F9FF",
                border: "1px solid #E0E7FF",
                padding: 12,
                borderRadius: 10,
                marginBottom: 14,
              }}
            >
              <div style={{ marginBottom: 8, fontWeight: 600 }}>
                Chọn phương thức MoMo
              </div>

              <div style={{ marginBottom: 10 }}>
                <label style={{ display: "block", marginBottom: 6 }}>
                  <input
                    type="radio"
                    name="momoType"
                    value="captureWallet"
                    checked={momoType === "captureWallet"}
                    onChange={() => setMomoType("captureWallet")}
                  />
                  &nbsp; Ví MoMo (App / QR)
                </label>

                <label style={{ display: "block" }}>
                  <input
                    type="radio"
                    name="momoType"
                    value="payWithATM"
                    checked={momoType === "payWithATM"}
                    onChange={() => setMomoType("payWithATM")}
                  />
                  &nbsp; Thẻ nội địa (ATM Napas)
                </label>
              </div>

              <button
                type="button"
                onClick={handlePayWithMomo}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "none",
                  background: "#A50064",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {loading
                  ? "Đang chuyển tới MoMo..."
                  : momoType === "captureWallet"
                  ? "Thanh toán qua ví MoMo"
                  : "Thanh toán bằng thẻ ATM (Napas)"}
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px 16px",
              background: "#388e3c",
              color: "#fff",
              fontWeight: 600,
              fontSize: 16,
              border: "none",
              borderRadius: 10,
              cursor: "pointer",
            }}
          >
            {loading ? "Đang xử lý..." : "Xác nhận đặt hàng"}
          </button>
        </form>

        <aside
          style={{
            background: "#fff",
            padding: 20,
            borderRadius: 12,
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <h3 style={{ marginBottom: 16 }}>Đơn hàng của bạn</h3>

          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {cart.map((item) => (
              <li
                key={`${item.id}-${item.size ?? ""}-${item.color ?? ""}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 10,
                  borderBottom: "1px dashed #eee",
                  paddingBottom: 6,
                }}
              >
                <span>
                  {item.name} x {item.qty}
                </span>
                <span>{currency.format(Number(item.price) * Number(item.qty))}</span>
              </li>
            ))}
          </ul>

          <form onSubmit={handleApplyCoupon} style={{ marginTop: 16 }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
              Mã giảm giá
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                placeholder="Nhập mã"
                style={{
                  flex: 1,
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid #ccc",
                }}
              />
              <button
                type="submit"
                disabled={checkingCoupon}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: "#2563eb",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {checkingCoupon ? "Đang áp dụng..." : "Áp dụng"}
              </button>
            </div>
            {appliedCoupon && (
              <button
                type="button"
                onClick={handleRemoveCoupon}
                style={{
                  marginTop: 8,
                  background: "transparent",
                  border: "none",
                  color: "#2563eb",
                  cursor: "pointer",
                }}
              >
                Bỏ mã {appliedCoupon.code}
              </button>
            )}
          </form>

          <div style={{ marginTop: 18, borderTop: "1px solid #eee", paddingTop: 12 }}>
            <SummaryRow label="Tạm tính" value={currency.format(subtotal)} />
            <SummaryRow label="Phí vận chuyển" value={currency.format(SHIPPING_FEE)} />
            <SummaryRow
              label="Giảm giá"
              value={`- ${currency.format(discount)}`}
              highlight={Boolean(discount)}
            />
            <SummaryRow
              label="Tổng thanh toán"
              value={currency.format(finalTotal)}
              bold
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, highlight = false, bold = false }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 8,
        color: highlight ? "#b91c1c" : "#111827",
        fontWeight: bold ? 700 : 500,
      }}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
