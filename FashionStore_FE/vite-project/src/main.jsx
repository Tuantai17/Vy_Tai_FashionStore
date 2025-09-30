// src/main.jsx
import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, NavLink, Navigate } from "react-router-dom";
import "./index.css";

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
import ProductAdd from "./pages/Admin/Product/AddProduct";
import EditProduct from "./pages/Admin/Product/EditProduct";

// categories
import AdminCategories from "./pages/Admin/Category/Categories";
import AddCategory from "./pages/Admin/Category/AddCategories";
import AdminOrders from "./pages/Admin/Order/Orders";
import AdminUsers from "./pages/Admin/User/Users";

//Orders
import Orders from "./pages/Admin/Order/Orders";
import OrderDetail from "./pages/Admin/Order/OrderDetail";


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
          Authorization: `Bearer ${token}`, // ✅ fix backtick
        },
      });
      await res.json().catch(() => ({}));
    }
  } catch (err) {
    console.error("Logout failed:", err);
  } finally {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  }
};

// ---- Layout cho phần khách hàng ----
function Layout({ children }) {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-4 py-3 border-b flex items-center justify-between">
        <div className="font-semibold">🍃 FashionStore</div>
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
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.id === product.id);
      return exists
        ? prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i))
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

        {/* ====== Admin routes ====== */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/new" element={<ProductAdd />} />
          <Route path="products/:id/edit" element={<EditProduct />} />

          {/* Categories */}
          <Route path="categories" element={<AdminCategories />} />
          <Route path="categories/new" element={<AddCategory />} />
          {/* ✅ Alias để hỗ trợ đường cũ /admin/category/add */}
          <Route path="category/add" element={<Navigate to="/admin/categories/new" replace />} />


          {/* Orders */}
          <Route path="orders/:id" element={<OrderDetail />} />




          <Route path="orders" element={<AdminOrders />} />
          <Route path="users" element={<AdminUsers />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Layout><div>Không tìm thấy trang</div></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
