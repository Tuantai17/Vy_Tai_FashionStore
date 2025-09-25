// vite-project/src/pages/Login.jsx
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const API_BASE = "http://127.0.0.1:8000";
  const LOGIN_URL = `${API_BASE}/api/login`;

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ nhận message từ trang đăng ký (nếu có)
  const successMsg = location.state?.success;

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setErrors({});
    setServerError("");
    setLoading(true);

    try {
      const payload = {
        email: form.email.trim(),
        password: form.password,
      };

      const res = await fetch(LOGIN_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      let data = {};
      try {
        data = await res.json();
      } catch {}

      if (res.ok) {
        // ✅ Lưu token + user vào localStorage
        if (data.token) {
          localStorage.setItem("token", data.token);
        }
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }

        // ✅ Thông báo
        alert(data.message || "Đăng nhập thành công!");

        // ✅ Quay về trang chủ
        navigate("/");
        return;
      }

      // Xử lý lỗi validation
      if (res.status === 422 && data?.errors) {
        setErrors(data.errors);
      } else {
        setServerError(data?.message || `Có lỗi xảy ra (HTTP ${res.status}).`);
      }
    } catch (err) {
      console.error("Login failed:", err);
      setServerError("Không thể kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  const Err = ({ name }) =>
    errors[name] ? (
      <div style={{ color: "#c00", fontSize: 13, marginTop: 4 }}>
        {Array.isArray(errors[name]) ? errors[name].join(", ") : String(errors[name])}
      </div>
    ) : null;

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h2 style={{ marginBottom: 16 }}>Đăng nhập</h2>

      {successMsg && (
        <div style={{ color: "green", marginBottom: 12 }}>{successMsg}</div>
      )}
      {serverError && (
        <div style={{ color: "#c00", marginBottom: 12 }}>{serverError}</div>
      )}

      <form onSubmit={submit} noValidate>
        <div style={{ marginBottom: 12 }}>
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            required
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 8,
              border: "1px solid #ccc",
            }}
          />
          <Err name="email" />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label>Mật khẩu</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            required
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 8,
              border: "1px solid #ccc",
            }}
          />
          <Err name="password" />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: 0,
            cursor: "pointer",
            background: "#388e3c",
            color: "#fff",
            fontWeight: 600,
          }}
        >
          {loading ? "Đang xử lý..." : "Đăng nhập"}
        </button>
      </form>
    </div>
  );
}
