import { useState } from "react";

const API_BASE = "http://127.0.0.1:8000/api";

export default function Contact() {
  const [form, setForm] = useState({
    name: "", phone: "", email: "", address: "", password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ phone: "", email: "" });
  const [notice, setNotice] = useState("");
  const [sending, setSending] = useState(false);

  const onChange = (e) => setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const validate = () => {
    const next = { phone: "", email: "" };
    if (!/^0\d{9}$/.test(form.phone.trim())) next.phone = "Số điện thoại phải bắt đầu bằng 0 và có 10 số.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = "Email không hợp lệ.";
    setErrors(next);
    return !next.phone && !next.email;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setNotice("");
    if (!validate()) return;
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setNotice("✅ Gửi thông tin thành công! Chúng tôi sẽ phản hồi sớm.");
      setForm({ name: "", phone: "", email: "", address: "", password: "" });
      setErrors({ phone: "", email: "" });
    } catch {
      setNotice("❌ Không gửi được thông tin. Vui lòng thử lại.");
    } finally {
      setSending(false);
    }
  };

  // ==== Inline styles (giống demo) ====
  const s = {
    wrap: { maxWidth: 1100, margin: "0 auto", padding: "32px 20px", color: "#111827" },
    title: { fontSize: 28, fontWeight: 800, textTransform: "uppercase", paddingBottom: 8, borderBottom: "1px solid #e5e7eb" },
    grid: { display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 40, alignItems: "start", marginTop: 20 },
    h3: { fontSize: 20, fontWeight: 600, marginBottom: 12 },
    label: { fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 },
    text: { fontSize: 15, lineHeight: "1.7" },
    mapBoxOuter: { display: "flex", justifyContent: "flex-end" },
    mapBox: { width: "100%", maxWidth: 560, border: "1px solid #e5e7eb", borderRadius: 6, overflow: "hidden" },
    mapIframe: { width: "100%", height: 300, border: 0 },
    formWrap: { marginTop: 24 },
    formTitle: { fontSize: 22, fontWeight: 600, marginBottom: 12 },
    row4: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 },
    input: { height: 40, border: "1px solid #9ca3af", borderRadius: 6, padding: "0 12px", fontSize: 15, outline: "none" },
    passwordWrap: { position: "relative", marginTop: 8, maxWidth: 384 },
    eyeBtn: { position: "absolute", right: 0, top: 0, height: 40, padding: "0 12px", background: "#2e7d32", color: "#fff", borderTopRightRadius: 6, borderBottomRightRadius: 6, border: "none", cursor: "pointer" },
    submit: { marginTop: 10, background: "#2e7d32", color: "#fff", padding: "10px 16px", borderRadius: 6, fontWeight: 600, border: "none", cursor: "pointer" },
    error: { color: "#dc2626", fontSize: 13, marginTop: 4 },
  };

  return (
    <main style={{ background: "#fff" }}>
      <div style={s.wrap}>
        {/* ===== HÀNG TRÊN: THÔNG TIN + MAP ===== */}
        <h2 style={s.title}>Liên hệ</h2>

        <div style={s.grid}>
          {/* Trái */}
          <div>
            <h3 style={s.h3}>Thông tin liên hệ</h3>

            <div style={s.text}>
              <div style={{ marginBottom: 16 }}>
                <div style={s.label}>Địa chỉ</div>
                <div>Thôn Tây Lông Nội – Gia Lập – Gia Viễn – Ninh Bình</div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={s.label}>Địa chỉ hiện tại</div>
                <div>451 Nguyễn Văn Cừ – P. Ngọc Thụy – Quận Long Biên – Hà Nội</div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={s.label}>Email</div>
                <a href="mailto:webdemo@gmail.com" style={{ color: "#111827", textDecoration: "underline" }}>
                  webdemo@gmail.com
                </a>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={s.label}>Điện thoại</div>
                <div>035.727.2189 – 098.681.7xxx</div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={s.label}>Zalo</div>
                <div>035.727.2189</div>
              </div>
            </div>
          </div>

          {/* Phải: Map */}
          <div style={s.mapBoxOuter}>
            <div style={s.mapBox}>
              <iframe
                title="Store Map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3723.991016088842!2d105.88847187471784!3d21.033672487698226!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ab22f9e83999%3A0x3d55b63d9a1a5a2f!2zNDUxIE5ndXnhu4VuIFbEg24gQ8awLCBOZ8O0YyBUaHXhu7ksIFF14bqtbiBMb25nIELDrG4sIEjDoCBO4buZaQ!5e0!3m2!1svi!2s!4v1705570470034!5m2!1svi!2s"
                style={s.mapIframe}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>

        {/* ===== FORM DƯỚI ===== */}
        <div style={s.formWrap}>
          <h3 style={s.formTitle}>Vui lòng nhập thông tin khách hàng</h3>

          {notice && <p style={{ fontSize: 14, marginBottom: 8 }}>{notice}</p>}
{/* ==== FORM: mỗi ô 1 dòng, đều & thẳng hàng (INLINE STYLE) ==== */}
<form onSubmit={onSubmit} noValidate style={{maxWidth: 520, width: "100%", marginTop: 12}}>
  {/* styles dùng chung */}
  {(() => null)()}
  <style>{`
    .fs-row{margin-bottom:14px;}
    .fs-label{display:block;font-size:15px;font-weight:600;color:#111827;margin:0 0 6px;}
    .fs-input{display:block;width:100%;height:42px;border:1px solid #9ca3af;border-radius:6px;padding:0 12px;font-size:15px;outline:none}
    .fs-input:focus{border-color:#10b981;box-shadow:0 0 0 3px rgba(16,185,129,0.2)}
    .fs-pw-wrap{position:relative}
    .fs-eye{position:absolute;right:2px;top:2px;height:38px;padding:0 12px;background:#2e7d32;color:#fff;border:none;border-radius:6px;cursor:pointer}
    .fs-btn{display:inline-block;width:100%;height:44px;background:#2e7d32;color:#fff;font-weight:600;border:none;border-radius:6px;cursor:pointer}
    .fs-btn:disabled{opacity:.6;cursor:not-allowed}
    .fs-error{margin-top:6px;color:#dc2626;font-size:13px}
  `}</style>

  {/* Họ và tên */}
  <div className="fs-row">
    <label className="fs-label">Họ và tên <span style={{color:"#ef4444"}}>*</span></label>
    <input
      className="fs-input"
      type="text"
      name="name"
      placeholder="Nguyễn Văn A"
      value={form.name}
      onChange={onChange}
      required
    />
  </div>

  {/* Số điện thoại */}
  <div className="fs-row">
    <label className="fs-label">Số điện thoại <span style={{color:"#ef4444"}}>*</span></label>
    <input
      className="fs-input"
      type="tel"
      name="phone"
      placeholder="0xxxxxxxxx"
      value={form.phone}
      onChange={onChange}
      required
    />
    {errors.phone && <div className="fs-error">{errors.phone}</div>}
  </div>

  {/* Email */}
  <div className="fs-row">
    <label className="fs-label">Email <span style={{color:"#ef4444"}}>*</span></label>
    <input
      className="fs-input"
      type="email"
      name="email"
      placeholder="you@example.com"
      value={form.email}
      onChange={onChange}
      required
    />
    {errors.email && <div className="fs-error">{errors.email}</div>}
  </div>

  {/* Địa chỉ */}
  <div className="fs-row">
    <label className="fs-label">Địa chỉ</label>
    <input
      className="fs-input"
      type="text"
      name="address"
      placeholder="Số nhà, đường, phường/xã, quận/huyện"
      value={form.address}
      onChange={onChange}
    />
  </div>

  {/* Mật khẩu + nút mắt */}
  <div className="fs-row">
    <label className="fs-label">Mật khẩu</label>
    <div className="fs-pw-wrap">
      <input
        className="fs-input"
        type={showPassword ? "text" : "password"}
        name="password"
        placeholder="••••••••"
        value={form.password}
        onChange={onChange}
        style={{paddingRight: 56}}
      />
      <button
        type="button"
        className="fs-eye"
        onClick={() => setShowPassword(v => !v)}
        aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
      >
        {showPassword ? "🙈" : "👁️"}
      </button>
    </div>
  </div>

  {/* Thông báo */}
  {notice && <div style={{fontSize:14, margin:"6px 0 10px"}}>{notice}</div>}

  {/* Nút gửi */}
  <button type="submit" disabled={sending} className="fs-btn">
    {sending ? "Đang gửi..." : "Gửi thông tin"}
  </button>
</form>

        </div>
      </div>
    </main>
  );
}
