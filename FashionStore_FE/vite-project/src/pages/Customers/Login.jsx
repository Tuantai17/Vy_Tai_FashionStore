import { useEffect, useMemo, useState } from "react";
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
  const [mounted, setMounted] = useState(false);
  const [focusedField, setFocusedField] = useState("");

  const successMsg = location.state?.success;

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

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
        if (data.token) {
          localStorage.setItem("token", data.token);
        }
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }

        alert(data.message || "Dang nhap thanh cong!");
        navigate("/");
        return;
      }

      if (res.status === 422 && data?.errors) {
        setErrors(data.errors);
      } else {
        setServerError(data?.message || `Co loi xay ra (HTTP ${res.status}).`);
      }
    } catch (err) {
      console.error("Login failed:", err);
      setServerError("Khong the ket noi may chu.");
    } finally {
      setLoading(false);
    }
  };

  const Err = ({ name }) =>
    errors[name] ? (
      <div style={{ color: "#d34040", fontSize: 13, marginTop: 6 }}>
        {Array.isArray(errors[name]) ? errors[name].join(", ") : String(errors[name])}
      </div>
    ) : null;

  const palette = useMemo(
    () => ({
      primary: "#5b6bff",
      primaryDark: "#4652d8",
      accent: "#7f8dff",
      surface: "#ffffff",
      subtle: "#8d96c6",
      text: "#2a3256",
    }),
    []
  );

  const styles = useMemo(
    () => ({
      page: {
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "48px 16px",
        background: "linear-gradient(135deg,#eef2ff,#dbe4ff)",
        overflow: "hidden",
      },
      glow: {
        position: "absolute",
        width: 520,
        height: 520,
        borderRadius: "50%",
        background: "radial-gradient(circle at 70% 30%, rgba(91,107,255,0.45), transparent 65%)",
        filter: "blur(0px)",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(60px)",
        transition: "opacity 1s ease, transform 1s ease",
      },
      glowSecondary: {
        position: "absolute",
        width: 420,
        height: 420,
        borderRadius: "50%",
        background: "radial-gradient(circle at 30% 70%, rgba(133,145,255,0.42), transparent 65%)",
        filter: "blur(0px)",
        opacity: mounted ? 0.8 : 0,
        transform: mounted ? "translateY(0)" : "translateY(-80px)",
        transition: "opacity 1.2s ease, transform 1.2s ease",
      },
      shell: {
        position: "relative",
        width: "min(960px, 96vw)",
        minHeight: 540,
        background: palette.surface,
        borderRadius: 32,
        boxShadow: "0 40px 80px rgba(45,63,136,0.18)",
        display: "flex",
        overflow: "hidden",
      },
      overlay: {
        position: "absolute",
        top: 0,
        left: 0,
        width: "45%",
        height: "100%",
        background: `linear-gradient(135deg, ${palette.primary}, ${palette.primaryDark})`,
        borderRadius: "0 200px 200px 0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "0 48px",
        color: "#fff",
        transform: mounted ? "translateX(0)" : "translateX(-50%)",
        transition: "transform .7s cubic-bezier(.19,1,.22,1)",
      },
      overlayHeading: {
        fontSize: 30,
        fontWeight: 700,
        marginBottom: 14,
        letterSpacing: 0.6,
      },
      overlayText: {
        lineHeight: 1.6,
        opacity: 0.88,
        maxWidth: 260,
      },
      overlayBtn: {
        marginTop: 26,
        padding: "12px 32px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.85)",
        background: "transparent",
        color: "#fff",
        fontWeight: 600,
        cursor: "pointer",
        letterSpacing: 0.4,
        transition: "background .3s ease, color .3s ease, transform .3s ease",
      },
      formBox: {
        width: "58%",
        marginLeft: "42%",
        padding: "72px 64px 64px",
        display: "flex",
        flexDirection: "column",
        gap: 22,
        justifyContent: "center",
        transform: mounted ? "translateX(0)" : "translateX(40px)",
        opacity: mounted ? 1 : 0,
        transition: "transform .65s cubic-bezier(.23,1,.32,1), opacity .65s ease",
      },
      heading: {
        fontSize: 40,
        margin: 0,
        color: palette.text,
        letterSpacing: 0.4,
      },
      subHeading: {
        color: palette.subtle,
        marginTop: 12,
        lineHeight: 1.6,
        maxWidth: 360,
      },
      alertSuccess: {
        background: "#e8f7ec",
        border: "1px solid #a3dfb7",
        color: "#2a8f4c",
        borderRadius: 14,
        padding: "12px 16px",
        fontSize: 14,
      },
      serverError: {
        background: "#ffe9e9",
        border: "1px solid #ffb4b4",
        color: "#c23b3b",
        borderRadius: 14,
        padding: "12px 16px",
        fontSize: 14,
      },
      fieldColumn: {
        display: "flex",
        flexDirection: "column",
      },
      label: {
        fontWeight: 600,
        color: palette.text,
        marginBottom: 6,
        letterSpacing: 0.2,
      },
      input: {
        width: "100%",
        padding: "14px 18px",
        borderRadius: 14,
        border: "1px solid #dbe0ff",
        background: "#f4f6ff",
        color: palette.text,
        outline: "none",
        transition: "border-color .3s ease, box-shadow .3s ease, background .3s ease",
      },
      inputFocus: {
        borderColor: palette.primary,
        background: "#ffffff",
        boxShadow: "0 12px 35px rgba(91,107,255,0.18)",
      },
      forgot: {
        textAlign: "right",
        fontSize: 13,
        color: palette.subtle,
      },
      submit: {
        padding: "15px 18px",
        borderRadius: 16,
        border: "none",
        cursor: "pointer",
        background: `linear-gradient(90deg, ${palette.primary}, ${palette.accent})`,
        color: "#fff",
        fontWeight: 600,
        letterSpacing: 0.5,
        boxShadow: "0 18px 36px rgba(91,107,255,0.34)",
        transition: "transform .25s ease, box-shadow .25s ease",
      },
      smallHint: {
        textAlign: "center",
        color: palette.subtle,
        fontSize: 14,
        letterSpacing: 0.2,
      },
      socialRow: {
        display: "flex",
        gap: 14,
        justifyContent: "center",
      },
      socialBtn: {
        width: 48,
        height: 48,
        borderRadius: "50%",
        border: "1px solid rgba(91,107,255,0.18)",
        display: "grid",
        placeItems: "center",
        color: palette.primary,
        fontWeight: 600,
        cursor: "pointer",
        background: "rgba(244,246,255,0.9)",
        transition: "transform .3s ease, background .3s ease, color .3s ease",
      },
    }),
    [mounted, palette]
  );

  const focusStyle = styles.inputFocus;

  return (
    <div style={styles.page}>
      <div style={{ ...styles.glow, top: -180, left: -120 }} />
      <div style={{ ...styles.glowSecondary, bottom: -160, right: -120 }} />

      <div style={styles.shell}>
        <div style={styles.overlay}>
          <h3 style={styles.overlayHeading}>Hello, Welcome!</h3>
          <p style={styles.overlayText}>
            Chua co tai khoan? Dang ky ngay de nhan uu dai va uu tien trong cac chuong trinh moi.
          </p>
          <button
            type="button"
            onClick={() => navigate("/register")}
            style={styles.overlayBtn}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.color = palette.primary;
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#fff";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Register
          </button>
        </div>

        <div style={styles.formBox}>
          <div>
            <h2 style={styles.heading}>Login</h2>
            <p style={styles.subHeading}>
              Chao mung tro lai! Dang nhap de tiep tuc mua sam va quan ly don hang cua ban.
            </p>
          </div>

          {successMsg && <div style={styles.alertSuccess}>{successMsg}</div>}
          {serverError && <div style={styles.serverError}>{serverError}</div>}

          <form onSubmit={submit} noValidate style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={styles.fieldColumn}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={onChange}
                required
                style={{
                  ...styles.input,
                  ...(focusedField === "email" ? focusStyle : {}),
                }}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField("")}
              />
              <Err name="email" />
            </div>

            <div style={styles.fieldColumn}>
              <label style={styles.label}>Mat khau</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={onChange}
                required
                style={{
                  ...styles.input,
                  ...(focusedField === "password" ? focusStyle : {}),
                }}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField("")}
              />
              <Err name="password" />
            </div>

            <div style={styles.forgot}>Quen mat khau?</div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.submit,
                ...(loading
                  ? { opacity: 0.7, cursor: "not-allowed", transform: "translateY(0)" }
                  : {}),
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {loading ? "Dang xu ly..." : "Login"}
            </button>


          </form>
        </div>
      </div>
    </div>
  );
}
