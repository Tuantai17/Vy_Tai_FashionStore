import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate, useLocation  } from "react-router-dom";
import "./index.css";


{
  /* ... */
}

// ===== Customer pages =====
import Home from "./pages/Customers/Home";
import Products from "./pages/Customers/Products";
import Cart from "./pages/Customers/Cart";
import ProductDetail from "./pages/Customers/ProductDetail";
import CategoryProducts from "./pages/Customers/CategoryProducts";
import Register from "./pages/Customers/Register";
import Login from "./pages/Customers/Login";
import Checkout from "./pages/Customers/Checkout";
import Contact from "./pages/Customers/Contact";
import MyOrders from "./pages/Customers/MyOrders";
import OrderTracking from "./pages/Customers/OrderTracking";



// ===== Admin pages/layout =====
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/Admin/Dashboard";
import AdminProducts from "./pages/Admin/Product/Products";
import AdminCategories from "./pages/Admin/Category/Categories";
import AdminOrders from "./pages/Admin/Order/Orders";
import AdminUsers from "./pages/Admin/User/Users";
import AddProduct from "./pages/Admin/Product/AddProduct";
import EditProduct from "./pages/Admin/Product/EditProduct";
import LoginAdmin from "./pages/Admin/LoginAdmin"; // ✅ thêm login admin
import AdminRoute from "./components/AdminRoute";   // ✅ bảo vệ route admin
import OrderDetail from "./pages/Admin/Order/OrderDetail"; 
import AddCategory from "./pages/Admin/Category/AddCategory";
import EditCategory from "./pages/Admin/Category/EditCategory.jsx";

// ---- Hàm logout (gọi API + xoá localStorage) ----
const handleLogout = async () => {
  const token = localStorage.getItem("token");

  try {
    if (token) {
      const res = await fetch("http://127.0.0.1:8000/api/logout", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      await res.json().catch(() => ({})); // ignore lỗi JSON
    }
  } catch (err) {
    console.error("Logout failed:", err);
  } finally {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login"; // chuyển về login customer
  }
};

// === DÁN TRƯỚC KHI ĐỊNH NGHĨA Layout ===
function UserMenu({ user, onLogout }) {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();
  const panelRef = React.useRef(null);
  const btnRef = React.useRef(null);

  // Đóng panel khi bấm ra ngoài hoặc ESC
  React.useEffect(() => {
    const onDocClick = (e) => {
      if (
        open &&
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        btnRef.current &&
        !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const gotoMyOrders = () => {
    setOpen(false);
    navigate("/me/orders");
  };

  // Avatar / Initial
  const avatarUrl = user?.avatar || user?.photoURL;
  const initial = (user?.name || user?.email || "?").toString().trim().charAt(0).toUpperCase();

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {/* Nút avatar + tên bên dưới (click mở panel) */}
      <div
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center" }}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="avatar"
            style={{
              width: 32, height: 32, borderRadius: "50%",
              border: "1px solid #d1d5db", objectFit: "cover"
            }}
          />
        ) : (
          <div
            style={{
              width: 32, height: 32, borderRadius: "50%", background: "#e5e7eb",
              border: "1px solid #d1d5db", display: "grid", placeItems: "center",
              fontWeight: 700, color: "#374151"
            }}
          >
            {initial}
          </div>
        )}
        <div
          style={{
            marginTop: 4, fontSize: 12, fontWeight: 600, maxWidth: 140,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#111827"
          }}
          title={user?.name || user?.email}
        >
          {user?.name || user?.email}
        </div>
      </div>

      {/* Panel giống Edge */}
      {open && (
        <div
          ref={panelRef}
          role="menu"
          style={{
            position: "absolute", right: 0, top: "calc(100% + 8px)",
            width: 320, maxWidth: "90vw", background: "#fff",
            border: "1px solid #e5e7eb", borderRadius: 12,
            boxShadow: "0 12px 30px rgba(0,0,0,.12)", zIndex: 9999
          }}
        >
          {/* Header panel */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 16 }}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="avatar"
                style={{ width: 48, height: 48, borderRadius: "50%", border: "1px solid #d1d5db", objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  width: 48, height: 48, borderRadius: "50%", background: "#e5e7eb",
                  border: "1px solid #d1d5db", display: "grid", placeItems: "center",
                  fontWeight: 700, color: "#374151", fontSize: 18
                }}
              >
                {initial}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, lineHeight: 1.2, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.name || "Tài khoản"}
              </div>
              <div style={{ fontSize: 13, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.email}
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #f1f5f9" }} />

          {/* Mục chức năng */}
          <div style={{ padding: 8 }}>
            <div
              role="button"
              onClick={gotoMyOrders}
              className="um-item"
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 10, cursor: "pointer", color: "#111827"
              }}
            >
              {/* icon túi đơn hàng */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 7h16v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7z" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M9 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <div style={{ lineHeight: 1.1 }}>
                <div style={{ fontWeight: 600 }}>Đơn hàng của tôi</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>Xem toàn bộ đơn đã đặt</div>
              </div>
            </div>

            <div
              role="button"
              onClick={onLogout}
              className="um-item um-danger"
              style={{
                marginTop: 4, display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 10, cursor: "pointer", color: "#b91c1c"
              }}
            >
              {/* icon đăng xuất */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M15 12H3" stroke="currentColor" strokeWidth="1.5" />
                <path d="M11 8l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" />
                <path d="M21 4v16a2 2 0 0 1-2 2h-6" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <span style={{ fontWeight: 600 }}>Đăng xuất</span>
            </div>
          </div>
        </div>
      )}

      {/* CSS nhỏ cho hover (đặt local để không đụng style global) */}
      <style>{`
        .um-item:hover { background: #f3f4f6; }
        .um-danger:hover { background: #fff1f2; }
      `}</style>
    </div>
  );
}



// ---- Layout cho phần khách hàng ----
function Layout({ children }) {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  return (
    <div className="min-h-screen flex flex-col">
<header className="px-4 py-3 border-b flex items-center justify-between">
  {/* Logo bên trái */}
<div className="font-semibold -ml-2">
  <a href="http://localhost:5173/">
    <img
      src="http://127.0.0.1:8000/assets/images/logoVT.png"
      alt="Logo"
      style={{ width: "200px", height: "60px", objectFit: "contain", cursor: "pointer" }}
    />
  </a>
</div>


  {/* Menu ở giữa */}
  <nav className="flex gap-6 items-center mx-auto">
    <NavLink to="/" end>Trang chủ</NavLink>
    <NavLink to="/products">Sản phẩm</NavLink>
    <NavLink to="/cart">Giỏ hàng</NavLink>
    <NavLink to="/contact">Liên hệ</NavLink>
  </nav>

  {/* User / Logout bên phải */}
  {/* === THAY TOÀN BỘ KHỐI USER/LOGOUT TRONG HEADER BẰNG ĐOẠN NÀY === */}
  <div className="flex items-center gap-3">
  {user ? (
    // Khi đã đăng nhập: hiện menu xổ xuống
    <UserMenu user={user} onLogout={handleLogout} />
  ) : (
    // Khi chưa đăng nhập: hiện nút Đăng ký / Đăng nhập
    <>
      <NavLink to="/register" className="hover:underline">
        Đăng ký
      </NavLink>
      <NavLink to="/login" className="hover:underline">
        Đăng nhập
      </NavLink>
    </>
  )}
</div>


</header>


      <main className="flex-1 p-4">{children}</main>

      <footer className="px-4 py-3 border-t text-sm text-gray-600">
        © {new Date().getFullYear()} StoreVegetables
      </footer>
    </div>
  );
}

function App() {
  // ✅ Lấy giỏ hàng từ localStorage khi khởi tạo
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  });

  // ✅ Mỗi lần cart thay đổi thì lưu lại vào localStorage
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // ✅ Hàm thêm sản phẩm
  const addToCart = (product) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.id === product.id);
      return exists
        ? prev.map((i) =>
            i.id === product.id ? { ...i, qty: i.qty + 1 } : i
          )
        : [...prev, { ...product, qty: 1 }];
    });
    alert("🎉 Sản phẩm đã được thêm vào giỏ hàng!");
  };
  return (
    <BrowserRouter>
      <Routes>
        {/* ====== Customer routes ====== */}
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/products" element={<Layout><Products addToCart={addToCart} /></Layout>} />
        <Route path="/category/:id" element={<Layout><CategoryProducts addToCart={addToCart} /></Layout>} />
        <Route path="/categories/:id" element={<Navigate to="/category/:id" replace />} />
        <Route path="/products/:id" element={<Layout><ProductDetail addToCart={addToCart} /></Layout>} />
        <Route path="/checkout" element={<Layout><Checkout cart={cart} setCart={setCart} /></Layout>} />
        <Route path="/cart" element={<Layout><Cart cart={cart} setCart={setCart} /></Layout>} />
        <Route path="/register" element={<Layout><Register /></Layout>} />
        <Route path="/login" element={<Layout><Login /></Layout>} />
        <Route path="/contact" element={<Layout><Contact /></Layout>} />
        <Route path="/track" element={<OrderTracking />} />
        <Route path="/me/orders" element={<Layout><MyOrders /></Layout>} />



        {/* ====== Admin login riêng ====== */}
        <Route path="/admin/login" element={<LoginAdmin />} />
        <Route path="/admin/orders/:id" element={<OrderDetail />} />
        <Route path="/admin/categories/edit/:id" element={<EditCategory />} />




        {/* ====== Admin routes (protected) ====== */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<Dashboard />} />   {/* ✅ /admin = Dashboard */}
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/new" element={<AddProduct />} />
          <Route path="products/:id/edit" element={<EditProduct />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="categories/add" element={<AddCategory />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Layout><div>Không tìm thấy trang</div></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
