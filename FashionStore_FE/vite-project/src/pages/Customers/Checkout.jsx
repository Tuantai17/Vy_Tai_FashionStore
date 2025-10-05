// import { useState } from "react";
// import { useNavigate, useLocation } from "react-router-dom";

// const API_BASE = "http://127.0.0.1:8000";

// export default function Checkout({ setCart }) {
//   const navigate = useNavigate();
//   const location = useLocation();

//   // ✅ nhận dữ liệu cart từ Cart.jsx
//   const cart = location.state?.cart || [];

//   const [form, setForm] = useState({
//     customer_name: "",
//     phone: "",
//     email: "",       // ✅ thêm email
//     address: "",
//     payment_method: "COD",
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setForm((s) => ({ ...s, [name]: value }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError("");

//     try {
//       const res = await fetch(`${API_BASE}/api/checkout`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Accept: "application/json",
//           Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//         },
//         body: JSON.stringify({
//           ...form,
//           items: cart, // ✅ gửi giỏ hàng nhận được từ Cart.jsx
//         }),
//       });

//       const data = await res.json();

//       if (res.ok) {
//         alert("✅ Đặt hàng thành công! Mã đơn hàng: " + data.order_id);
//         setCart([]); // clear cart trong state cha
//         navigate("/"); // quay về trang chủ
//       } else {
//         setError(data.message || "Có lỗi xảy ra.");
//       }
//     } catch (err) {
//       setError("Không thể kết nối máy chủ.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div style={{ maxWidth: 800, margin: "30px auto", padding: 20 }}>
//       <h2 style={{ marginBottom: 20, color: "#388e3c" }}>🧾 Thanh toán</h2>

//       {/* nếu giỏ hàng trống */}
//       {cart.length === 0 ? (
//         <p>⚠️ Giỏ hàng của bạn đang trống, vui lòng quay lại chọn sản phẩm.</p>
//       ) : (
//         <>
//           {error && (
//             <p
//               style={{
//                 color: "#d32f2f",
//                 background: "#fdecea",
//                 padding: "10px 12px",
//                 borderRadius: 8,
//                 marginBottom: 16,
//               }}
//             >
//               {error}
//             </p>
//           )}

//           <div
//             style={{
//               display: "grid",
//               gridTemplateColumns: "2fr 1fr",
//               gap: 20,
//               alignItems: "flex-start",
//             }}
//           >
//             {/* Form thông tin */}
//             <form
//               onSubmit={handleSubmit}
//               style={{
//                 background: "#fff",
//                 padding: 20,
//                 borderRadius: 12,
//                 boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
//               }}
//             >
//               <h3 style={{ marginBottom: 16 }}>Thông tin khách hàng</h3>

//               <div style={{ marginBottom: 12 }}>
//                 <label>Họ và tên</label>
//                 <input
//                   name="customer_name"
//                   value={form.customer_name}
//                   onChange={handleChange}
//                   required
//                   style={{ width: "100%", padding: 10 }}
//                 />
//               </div>

//               <div style={{ marginBottom: 12 }}>
//                 <label>Số điện thoại</label>
//                 <input
//                   name="phone"
//                   value={form.phone}
//                   onChange={handleChange}
//                   required
//                   style={{ width: "100%", padding: 10 }}
//                 />
//               </div>

//               {/* ✅ Thêm Email */}
//               <div style={{ marginBottom: 12 }}>
//                 <label>Email</label>
//                 <input
//                   type="email"
//                   name="email"
//                   value={form.email}
//                   onChange={handleChange}
//                   required
//                   style={{ width: "100%", padding: 10 }}
//                 />
//               </div>

//               <div style={{ marginBottom: 12 }}>
//                 <label>Địa chỉ giao hàng</label>
//                 <textarea
//                   name="address"
//                   value={form.address}
//                   onChange={handleChange}
//                   required
//                   rows={3}
//                   style={{ width: "100%", padding: 10 }}
//                 />
//               </div>

//               <div style={{ marginBottom: 20 }}>
//                 <label>Phương thức thanh toán</label>
//                 <select
//                   name="payment_method"
//                   value={form.payment_method}
//                   onChange={handleChange}
//                   style={{ width: "100%", padding: 10 }}
//                 >
//                   <option value="COD">Thanh toán khi nhận hàng</option>
//                   <option value="Bank">Chuyển khoản ngân hàng</option>
//                 </select>
//               </div>

//               <button
//                 type="submit"
//                 disabled={loading}
//                 style={{
//                   width: "100%",
//                   padding: "12px 16px",
//                   background: "#388e3c",
//                   color: "#fff",
//                   fontWeight: 600,
//                   fontSize: 16,
//                   border: "none",
//                   borderRadius: 10,
//                   cursor: "pointer",
//                 }}
//               >
//                 {loading ? "⏳ Đang xử lý..." : "✅ Xác nhận đặt hàng"}
//               </button>
//             </form>

//             {/* Thông tin giỏ hàng */}
//             <div
//               style={{
//                 background: "#fff",
//                 padding: 20,
//                 borderRadius: 12,
//                 boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
//               }}
//             >
//               <h3 style={{ marginBottom: 16 }}>Đơn hàng của bạn</h3>
//               <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
//                 {cart.map((item) => (
//                   <li
//                     key={item.id}
//                     style={{
//                       display: "flex",
//                       justifyContent: "space-between",
//                       marginBottom: 10,
//                       borderBottom: "1px dashed #eee",
//                       paddingBottom: 6,
//                     }}
//                   >
//                     <span>
//                       {item.name} x {item.qty}
//                     </span>
//                     <span>{(item.price * item.qty).toLocaleString()} đ</span>
//                   </li>
//                 ))}
//               </ul>

//               <h3
//                 style={{
//                   marginTop: 16,
//                   color: "#d32f2f",
//                   fontWeight: 700,
//                   fontSize: 18,
//                   textAlign: "right",
//                 }}
//               >
//                 Tổng cộng: {total.toLocaleString()} đ
//               </h3>
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }



import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000";

export default function Checkout({ setCart }) {
  const navigate = useNavigate();
  const location = useLocation();

  const cart = location.state?.cart || [];

  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    email: "",
    address: "",
    payment_method: "COD",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [momoType, setMomoType] = useState("captureWallet"); // ✅ Thêm loại momo: captureWallet = ví, payWithATM = ATM

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  // ✅ Thanh toán bằng MoMo
  const handlePayWithMomo = async () => {
    setLoading(true);
    setError("");

    try {
      const amount = Math.max(1000, Math.round(Number(total) || 0));

      // 🔑 Backend route đúng của bạn là /api/momo/create
      const res = await fetch(`${API_BASE}/api/momo/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
       body: JSON.stringify({
  amount: Number(amount), // ✅ đảm bảo kiểu số
  method: momoType === "payWithATM" ? "payWithATM" : "momo_wallet",
}),

      });

      const j = await res.json();

      if (j?.payUrl) {
        window.location.href = j.payUrl; // ✅ Redirect sang trang MoMo
      } else {
        setError(j?.message || "Không khởi tạo được thanh toán MoMo.");
      }
    } catch (e) {
      console.error(e);
      setError("Không thể kết nối MoMo.");
    } finally {
      setLoading(false);
    }
  };

  // Gửi đơn hàng (COD / không qua MoMo)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({
          ...form,
          items: cart,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const orderCode =
          data?.code ||
          data?.order_code ||
          data?.order?.code ||
          data?.order_id ||
          data?.id;

        alert("✅ Đặt hàng thành công!" + (orderCode ? " Mã đơn: " + orderCode : ""));
        if (orderCode) localStorage.setItem("last_order_code", String(orderCode));

        setCart([]);
        if (orderCode) {
          navigate(`/track?code=${encodeURIComponent(orderCode)}`, { replace: true });
        } else {
          navigate("/track", { replace: true });
        }
      } else {
        setError(data.message || "Có lỗi xảy ra.");
      }
    } catch (err) {
      setError("Không thể kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "30px auto", padding: 20 }}>
      <h2 style={{ marginBottom: 20, color: "#388e3c" }}>🧾 Thanh toán</h2>

      {cart.length === 0 ? (
        <p>⚠️ Giỏ hàng của bạn đang trống, vui lòng quay lại chọn sản phẩm.</p>
      ) : (
        <>
          {error && (
            <p
              style={{
                color: "#d32f2f",
                background: "#fdecea",
                padding: "10px 12px",
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              {error}
            </p>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: 20,
              alignItems: "flex-start",
            }}
          >
            {/* Form thông tin */}
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
                  <option value="Bank">Chuyển khoản / Ví điện tử</option>
                </select>
              </div>

              {/* ✅ Khi chọn Bank thì hiển thị lựa chọn MoMo */}
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
                      ? "⏳ Đang chuyển tới MoMo..."
                      : momoType === "captureWallet"
                      ? "Thanh toán bằng Ví MoMo"
                      : "Thanh toán bằng Thẻ ATM (Napas)"}
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
                {loading ? "⏳ Đang xử lý..." : "✅ Xác nhận đặt hàng"}
              </button>
            </form>

            {/* Giỏ hàng */}
            <div
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
                    key={item.id}
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
                    <span>{(item.price * item.qty).toLocaleString()} đ</span>
                  </li>
                ))}
              </ul>

              <h3
                style={{
                  marginTop: 16,
                  color: "#d32f2f",
                  fontWeight: 700,
                  fontSize: 18,
                  textAlign: "right",
                }}
              >
                Tổng cộng: {total.toLocaleString()} đ
              </h3>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
