// vite-project/src/pages/Register.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  const API_BASE = "http://127.0.0.1:8000";
  const REGISTER_URL = `${API_BASE}/api/register`;

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    phone: "", // <-- THÊM
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

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
      // optional: trim nhẹ trước khi gửi
      const payload = {
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      };

      const res = await fetch(REGISTER_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      let data = {};
      try { data = await res.json(); } catch {}


      // chuyen qua login
     if (res.ok) {
  navigate("/login"); // ✅ chuyển thẳng sang trang login
  return;
}

      if (res.status === 422 && data?.errors) {
        setErrors(data.errors);
      } else {
        setServerError(data?.message || `Có lỗi xảy ra (HTTP ${res.status}).`);
      }
    } catch (err) {
      console.error("Register failed:", err);
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
    <div style={{ maxWidth: 460, margin: "40px auto", padding: 16 }}>
      <h2 style={{ marginBottom: 16 }}>Đăng ký</h2>
      {serverError && <div style={{ color: "#c00", marginBottom: 12 }}>{serverError}</div>}

      <form onSubmit={submit} noValidate>
        <div style={{ marginBottom: 12 }}>
          <label>Họ tên</label>
          <input
            name="name"
            value={form.name}
            onChange={onChange}
            required
            style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #ccc" }}
          />
          <Err name="name" />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            required
            style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #ccc" }}
          />
          <Err name="email" />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Số điện thoại</label>
          <input
            type="text"
            name="phone"
            value={form.phone}
            onChange={onChange}
            required
            style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #ccc" }}
          />
          <Err name="phone" />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Mật khẩu (≥ 6 ký tự)</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            required
            style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #ccc" }}
          />
          <Err name="password" />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label>Nhập lại mật khẩu</label>
          <input
            type="password"
            name="password_confirmation"
            value={form.password_confirmation}
            onChange={onChange}
            required
            style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #ccc" }}
          />
          <Err name="password_confirmation" />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ padding: "10px 14px", borderRadius: 10, border: 0, cursor: "pointer" }}
        >
          {loading ? "Đang xử lý..." : "Đăng ký"}
        </button>
      </form>
    </div>
  );
}
