import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setAdminSession } from "../../utils/authStorage";

const API_BASE = "http://127.0.0.1:8000";
const LOGIN_URL = `${API_BASE}/api/login`;

export default function LoginAdmin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Đăng nhập thất bại");
        return;
      }

      if (data.user.roles !== "admin") {
        setError("Bạn không có quyền truy cập admin");
        return;
      }

      setAdminSession({ token: data.token, user: data.user });
      navigate("/admin");
    } catch (err) {
      console.error(err);
      setError("Có lỗi kết nối server");
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        background:
          "linear-gradient(to bottom right, #1a2238, #0d1324, #09101e)", // màu nền kiểu dashboard
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <form
        onSubmit={submit}
        style={{
          width: "360px",
          background: "rgba(255, 255, 255, 0.08)",
          padding: "40px 40px 50px",
          borderRadius: "16px",
          boxShadow: "0 6px 25px rgba(0, 0, 0, 0.45)",
          color: "white",
          backdropFilter: "blur(10px)",
          position: "relative",
        }}
      >
        {/* Avatar */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              border: "2.5px solid rgba(255,255,255,0.7)",
              borderRadius: "50%",
              width: "90px",
              height: "90px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              background: "rgba(255,255,255,0.05)",
              boxShadow: "0 0 15px rgba(255,255,255,0.15)",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ width: "50px", height: "50px" }}
            >
              <path d="M20 21a8 8 0 0 0-16 0" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
        </div>

        <h2
          style={{
            textAlign: "center",
            marginBottom: "10px",
            fontWeight: "600",
            fontSize: "20px",
            letterSpacing: "1px",
          }}
        >
          Admin Login
        </h2>

        {error && (
          <p
            style={{
              color: "#ffb3b3",
              fontSize: "14px",
              textAlign: "center",
              marginBottom: "10px",
            }}
          >
            {error}
          </p>
        )}

        {/* Email */}
        <div style={{ position: "relative", marginBottom: "25px" }}>
          <span
            style={{
              position: "absolute",
              left: "0",
              top: "8px",
            }}
          >
            <svg
              style={{ width: "18px", height: "18px", color: "white" }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
            >
              <path d="M4 4h16v16H4z" opacity=".2" />
              <path d="M4 7l8 5 8-5" />
            </svg>
          </span>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            placeholder="Email ID"
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              borderBottom: "1px solid rgba(255,255,255,0.5)",
              padding: "8px 8px 8px 28px",
              color: "white",
              fontSize: "15px",
              outline: "none",
              transition: "border-color 0.3s",
            }}
            onFocus={(e) =>
              (e.target.style.borderBottom = "1px solid #00bfff")
            }
            onBlur={(e) =>
              (e.target.style.borderBottom =
                "1px solid rgba(255,255,255,0.5)")
            }
          />
        </div>

        {/* Password */}
        <div style={{ position: "relative", marginBottom: "25px" }}>
          <span
            style={{
              position: "absolute",
              left: "0",
              top: "8px",
            }}
          >
            <svg
              style={{ width: "18px", height: "18px", color: "white" }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
            >
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            placeholder="Password"
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              borderBottom: "1px solid rgba(255,255,255,0.5)",
              padding: "8px 8px 8px 28px",
              color: "white",
              fontSize: "15px",
              outline: "none",
              transition: "border-color 0.3s",
            }}
            onFocus={(e) =>
              (e.target.style.borderBottom = "1px solid #00bfff")
            }
            onBlur={(e) =>
              (e.target.style.borderBottom =
                "1px solid rgba(255,255,255,0.5)")
            }
          />
        </div>

        {/* Remember me */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "35px",
            fontSize: "13px",
          }}
        >
          <label style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <input type="checkbox" style={{ accentColor: "#00bfff" }} />
            <span style={{ color: "rgba(255,255,255,0.9)" }}>Remember me</span>
          </label>
        </div>

        {/* Button */}
        <button
          type="submit"
          style={{
            width: "100%",
            background: "#00bfff",
            color: "white",
            padding: "12px 0",
            fontWeight: "600",
            letterSpacing: "2px",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0,191,255,0.3)",
            transition: "all 0.3s",
          }}
          onMouseOver={(e) => {
            e.target.style.background = "#33ccff";
            e.target.style.boxShadow = "0 6px 14px rgba(0,191,255,0.45)";
          }}
          onMouseOut={(e) => {
            e.target.style.background = "#00bfff";
            e.target.style.boxShadow = "0 4px 12px rgba(0,191,255,0.3)";
          }}
        >
          LOGIN
        </button>
      </form>
    </div>
  );
}
