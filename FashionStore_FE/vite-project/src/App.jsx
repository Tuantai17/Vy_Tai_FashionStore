import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Customers/Home";
import Login from "./pages/Customers/Login";
import Register from "./pages/Customers/Register";
import Products from "./pages/Customers/Products";
import ProductDetail from "./pages/Customers/ProductDetail";
import Cart from "./pages/Customers/Cart";


import PaymentResult from "./pages/Customers/PaymentResult";


// Global mini ChatWidget is rendered below (persistent floating)
// Mini ChatWidget is used on Home only

function App() {

  return (
    <BrowserRouter>
      <Routes>
        {/* Trang chủ */}
        <Route path="/" element={<Home />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Sản phẩm */}
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />

        {/* Giỏ hàng */}
        <Route path="/cart" element={<Cart />} />


  <Route path="/momo/return" element={<PaymentResult />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
