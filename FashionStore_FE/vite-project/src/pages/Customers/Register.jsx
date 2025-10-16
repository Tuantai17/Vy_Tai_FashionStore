import { useEffect, useMemo, useState } from "react";
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
    phone: "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [focusedField, setFocusedField] = useState("");

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

      if (res.ok) {
        navigate("/login", { state: { success: "Dang ky thanh cong!" } });
        return;
      }

      if (res.status === 422 && data?.errors) setErrors(data.errors);
      else setServerError(data?.message || `Co loi xay ra (HTTP ${res.status}).`);
    } catch (err) {
      console.error("Register failed:", err);
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
      primary: "#5565ff",
      primaryDark: "#404fd8",
      accent: "#7ea0ff",
      surface: "#ffffff",
      subtle: "#8894b3",
      text: "#1f2a44",
    }),
    []
  );

const FORM_MAX = 360; // 👈 bề rộng tối đa của form/ô nhập

const styles = useMemo(() => ({
  page: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    padding: "48px 16px",
    background: "linear-gradient(135deg,#eef2ff 0%, #e7ecff 60%, #eaf1ff 100%)",
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    width: 520, height: 520, borderRadius: "50%",
    background: "radial-gradient(circle at 30% 30%, rgba(85,101,255,0.45), transparent 65%)",
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0)" : "translateY(60px)",
    transition: "opacity 1s ease, transform 1s ease",
    zIndex: 0,
  },
  glowSecondary: {
    position: "absolute",
    width: 420, height: 420, borderRadius: "50%",
    background: "radial-gradient(circle at 70% 70%, rgba(126,160,255,0.42), transparent 65%)",
    opacity: mounted ? 0.85 : 0,
    transform: mounted ? "translateY(0)" : "translateY(-80px)",
    transition: "opacity 1.2s ease, transform 1.2s ease",
    zIndex: 0,
  },
  shell: {
    position: "relative",
    width: "min(960px, 96vw)",
    minHeight: 540,
    background: palette.surface,
    borderRadius: 28,
    boxShadow: "0 18px 40px rgba(31,42,68,0.08), 0 50px 100px rgba(31,42,68,0.08)",
    display: "flex",
    overflow: "hidden",
  },




  

  /* Form gọn lại và luôn nằm trên overlay */
  formBox: {
    width: "52%",
    padding: "56px 40px",
    display: "flex",
    flexDirection: "column",
    gap: 18,
    justifyContent: "center",
    position: "relative",
    zIndex: 10,
    transform: mounted ? "translateX(0)" : "translateX(-24px)",
    opacity: mounted ? 1 : 0,
    transition: "transform .6s cubic-bezier(.23,1,.32,1), opacity .6s ease",
  },
  heading: { fontSize: 30, margin: 0, color: palette.text, letterSpacing: 0.2 },
  subHeading: { color: palette.subtle, marginTop: 10, lineHeight: 1.65, maxWidth: 420 },

  serverError: {
    background: "#ffe9e9",
    border: "1px solid #ffb4b4",
    color: "#c23b3b",
    borderRadius: 12,
    padding: "12px 14px",
    fontSize: 14,
    maxWidth: FORM_MAX,
  },
  fieldColumn: { display: "flex", flexDirection: "column", maxWidth: FORM_MAX },
  label: { fontWeight: 600, color: palette.text, marginBottom: 6, letterSpacing: 0.15 },

  /* Ô nhập & nút ngắn lại theo FORM_MAX */
  input: {
    width: "100%",
    padding: "11px 14px",
    borderRadius: 12,
    border: "1px solid #e3e7ff",
    background: "#f8faff",
    color: palette.text,
    outline: "none",
    transition: "border-color .25s ease, box-shadow .25s ease, background .25s ease",
    position: "relative",
    zIndex: 11,
  },
  inputFocus: {
    borderColor: palette.primary,
    background: "#ffffff",
    boxShadow: "0 10px 24px rgba(85,101,255,0.14)",
  },

  dualRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    maxWidth: FORM_MAX,
  },

  submit: {
    width: "100%",                // full trong khung 360px
    maxWidth: FORM_MAX,
    padding: "12px 16px",
    borderRadius: 14,
    border: "none",
    cursor: "pointer",
    background: `linear-gradient(90deg, ${palette.primary}, ${palette.accent})`,
    color: "#fff",
    fontWeight: 700,
    letterSpacing: 0.4,
    boxShadow: "0 16px 34px rgba(85,101,255,0.28)",
    transition: "transform .22s ease, box-shadow .22s ease, opacity .2s ease",
    position: "relative",
    zIndex: 11,
  },

  /* Overlay thu gọn lại để không “tràn” nhiều */
  overlay: {
    position: "absolute",
    top: 0,
    right: "-14px",
    width: "44%",                 // hẹp hơn tí
    height: "100%",
    zIndex: 1,
    background: `linear-gradient(135deg, ${palette.primary}, ${palette.primaryDark})`,
    borderRadius: "260px 0 0 260px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "0 44px",
    color: "#fff",
    transform: mounted ? "translateX(0)" : "translateX(50%)",
    transition: "transform .65s cubic-bezier(.19,1,.22,1)",
    boxShadow: "0 20px 60px rgba(83, 98, 230, 0.22)",
  },
  overlayHeading: { fontSize: 30, fontWeight: 800, marginBottom: 10, letterSpacing: 0.4 },
  overlayText: { lineHeight: 1.55, opacity: 0.95, maxWidth: 280 },

  /* Responsive: màn nhỏ thì form full width, overlay xuống dưới */
  "@media (max-width: 820px)": {},
}), [mounted, palette]);



  const focusStyle = styles.inputFocus;

  return (
    <div style={styles.page}>
      <div style={{ ...styles.glow, top: -180, right: -120 }} />
      <div style={{ ...styles.glowSecondary, bottom: -160, left: -120 }} />

      <div style={styles.shell}>
        <div style={styles.formBox}>
          <div>
            <h2 style={styles.heading}>Registration</h2>
            <p style={styles.subHeading}>
              Tao tai khoan moi va bat dau mua sam voi nhieu uu dai danh rieng cho ban.
            </p>
          </div>

          {serverError && <div style={styles.serverError}>{serverError}</div>}

          {/* 👇 Thu hẹp form nội dung để gọn hơn */}
          <form
            onSubmit={submit}
            noValidate
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
              maxWidth: 200,          // quan trọng: giới hạn bề ngang
              width: "100%",
            }}
          >
            <div style={styles.fieldColumn}>
              <label style={styles.label}>Ho ten</label>
              <input
                name="name"
                value={form.name}
                onChange={onChange}
                required
                style={{ ...styles.input, ...(focusedField === "name" ? focusStyle : {}) }}
                onFocus={() => setFocusedField("name")}
                onBlur={() => setFocusedField("")}
              />
              <Err name="name" />
            </div>

            <div style={styles.fieldColumn}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={onChange}
                required
                style={{ ...styles.input, ...(focusedField === "email" ? focusStyle : {}) }}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField("")}
              />
              <Err name="email" />
            </div>

            <div style={styles.fieldColumn}>
              <label style={styles.label}>So dien thoai</label>
              <input
                name="phone"
                value={form.phone}
                onChange={onChange}
                required
                style={{ ...styles.input, ...(focusedField === "phone" ? focusStyle : {}) }}
                onFocus={() => setFocusedField("phone")}
                onBlur={() => setFocusedField("")}
              />
              <Err name="phone" />
            </div>

            <div style={styles.dualRow}>
              <div style={{ ...styles.fieldColumn, flex: "1 1 220px" }}>
                <label style={styles.label}>Mat khau</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={onChange}
                  required
                  style={{ ...styles.input, ...(focusedField === "password" ? focusStyle : {}) }}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField("")}
                />
                <Err name="password" />
              </div>

              {/* 👇 ép “Nhập lại mật khẩu” xuống dòng và full chiều ngang */}
              <div style={{ ...styles.fieldColumn, flex: "1 1 100%" }}>
                <label style={styles.label}>Nhap lai mat khau</label>
                <input
                  type="password"
                  name="password_confirmation"
                  value={form.password_confirmation}
                  onChange={onChange}
                  required
                  style={{ ...styles.input, ...(focusedField === "password_confirmation" ? focusStyle : {}) }}
                  onFocus={() => setFocusedField("password_confirmation")}
                  onBlur={() => setFocusedField("")}
                />
                <Err name="password_confirmation" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.submit,
                ...(loading ? { opacity: 0.7, cursor: "not-allowed", transform: "translateY(0)" } : {}),
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 20px 38px rgba(85,101,255,0.36)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 16px 34px rgba(85,101,255,0.32)";
              }}
            >
              {loading ? "Dang xu ly..." : "Register"}
            </button>

            {/* (đã bỏ hint + social) */}
          </form>
        </div>

        {/* PANEL xanh đè lên */}
        <div style={styles.overlay}>
          <h3 style={styles.overlayHeading}>Welcome Back!</h3>
          <p style={styles.overlayText}>
            Ban da co tai khoan? Dang nhap de tiep tuc hanh trinh mua sam va nhan thong tin uu dai moi nhat.
          </p>
          <button
            type="button"
            onClick={() => navigate("/login")}
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
            Login
          </button>
        </div>
      </div>
    </div>
  );
}
