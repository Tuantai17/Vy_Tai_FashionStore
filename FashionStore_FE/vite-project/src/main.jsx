import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, NavLink, Navigate } from "react-router-dom";
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

// ---- Layout cho phần khách hàng ----
function Layout({ children }) {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-4 py-3 border-b flex items-center justify-between">
        <div className="font-semibold">🍃 StoreVegetables</div>
        <nav className="flex gap-4 items-center">
          <NavLink to="/" end>Trang chủ</NavLink>
          <NavLink to="/products">Sản phẩm</NavLink>
          <NavLink to="/cart">Giỏ hàng</NavLink>

          {user ? (
            <>
              <span style={{ color: "green", fontWeight: 600 }}>
                👋 Xin chào, {user.name}
              </span>
              <button
                onClick={handleLogout}
                style={{
                  marginLeft: 12,
                  background: "#d32f2f",
                  color: "#fff",
                  border: 0,
                  borderRadius: 8,
                  padding: "6px 10px",
                  cursor: "pointer",
                }}
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <NavLink to="/register">Đăng ký</NavLink>
              <NavLink to="/login">Đăng nhập</NavLink>
            </>
          )}
        </nav>
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
