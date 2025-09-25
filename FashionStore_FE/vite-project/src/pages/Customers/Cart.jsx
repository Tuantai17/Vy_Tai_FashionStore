// src/pages/Customers/Cart.jsx
import { useNavigate } from "react-router-dom";

export default function Cart({ cart, setCart }) {
  const navigate = useNavigate();

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  // ✅ Tăng số lượng
  const increaseQty = (id) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qty: item.qty + 1 } : item
      )
    );
  };

  // ✅ Giảm số lượng (không nhỏ hơn 1)
  const decreaseQty = (id) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id && item.qty > 1
          ? { ...item, qty: item.qty - 1 }
          : item
      )
    );
  };

  // ✅ Xoá 1 sản phẩm
  const removeItem = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  // ✅ Xoá toàn bộ giỏ
  const clearCart = () => {
    if (window.confirm("Bạn có chắc muốn xoá toàn bộ giỏ hàng?")) {
      setCart([]);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>🛒 Giỏ hàng</h2>

      {cart.length === 0 ? (
        <p>Giỏ hàng trống</p>
      ) : (
        <div>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: 16,
            }}
          >
            <thead>
              <tr style={{ borderBottom: "2px solid #ccc" }}>
                <th style={{ textAlign: "left", padding: 8 }}>Sản phẩm</th>
                <th style={{ textAlign: "center", padding: 8 }}>Ảnh</th>
                <th style={{ textAlign: "center", padding: 8 }}>Giá</th>
                <th style={{ textAlign: "center", padding: 8 }}>Số lượng</th>
                <th style={{ textAlign: "center", padding: 8 }}>Thành tiền</th>
                <th style={{ textAlign: "center", padding: 8 }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: 8 }}>{item.name}</td>
                  <td style={{ padding: 8, textAlign: "center" }}>
                    <img
                      src={
                        item.thumbnail_url ||
                        item.thumbnail ||
                        "https://placehold.co/80x60"
                      }
                      alt={item.name}
                      style={{
                        width: 80,
                        height: 60,
                        objectFit: "cover",
                        borderRadius: 6,
                      }}
                      onError={(e) =>
                        (e.currentTarget.src = "https://placehold.co/80x60")
                      }
                    />
                  </td>
                  <td style={{ padding: 8, textAlign: "center" }}>
                    {item.price.toLocaleString()} đ
                  </td>
                  <td style={{ padding: 8, textAlign: "center" }}>
                    <button
                      onClick={() => decreaseQty(item.id)}
                      style={{
                        padding: "4px 8px",
                        marginRight: 6,
                        cursor: "pointer",
                      }}
                    >
                      -
                    </button>
                    {item.qty}
                    <button
                      onClick={() => increaseQty(item.id)}
                      style={{
                        padding: "4px 8px",
                        marginLeft: 6,
                        cursor: "pointer",
                      }}
                    >
                      +
                    </button>
                  </td>
                  <td
                    style={{
                      padding: 8,
                      textAlign: "center",
                      fontWeight: 600,
                      color: "#d32f2f",
                    }}
                  >
                    {(item.price * item.qty).toLocaleString()} đ
                  </td>
                  <td style={{ padding: 8, textAlign: "center" }}>
                    <button
                      onClick={() => removeItem(item.id)}
                      style={{
                        background: "#d32f2f",
                        color: "#fff",
                        border: 0,
                        padding: "6px 10px",
                        borderRadius: 6,
                        cursor: "pointer",
                      }}
                    >
                      Xoá
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Tổng cộng + hành động */}
          <div
            style={{
              marginTop: 20,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <button
              onClick={clearCart}
              style={{
                background: "#999",
                color: "#fff",
                border: 0,
                padding: "8px 12px",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              🗑 Xoá toàn bộ
            </button>

            <h3>
              Tổng cộng:{" "}
              <span style={{ color: "#d32f2f" }}>
                {total.toLocaleString()} đ
              </span>
            </h3>

            {/* ✅ Chuyển qua trang Checkout và truyền cart */}
            <button
              style={{
                background: "green",
                color: "#fff",
                padding: "8px 16px",
                border: 0,
                borderRadius: 8,
                cursor: "pointer",
              }}
              onClick={() => navigate("/checkout", { state: { cart } })}
            >
              Thanh toán
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
