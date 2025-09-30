import { useState } from "react";

const API_BASE = "http://127.0.0.1:8000/api"; // Nếu bạn có API nhận liên hệ

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ phone: "", email: "" });
  const [notice, setNotice] = useState("");
  const [sending, setSending] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const validate = () => {
    const next = { phone: "", email: "" };
    // Bắt đầu bằng 0 và đúng 10 số
    if (!/^0\d{9}$/.test(form.phone.trim())) {
      next.phone = "Số điện thoại phải bắt đầu bằng 0 và có 10 số.";
    }
    // Email chuẩn
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = "Email không hợp lệ.";
    }
    setErrors(next);
    return !next.phone && !next.email;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setNotice("");
    if (!validate()) return;

    setSending(true);
    try {
      // Nếu CHƯA có API /contact thì có thể thay bằng setTimeout giả lập
      const res = await fetch(`${API_BASE}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setNotice("✅ Gửi thông tin thành công! Chúng tôi sẽ phản hồi sớm.");
      setForm({ name: "", phone: "", email: "", address: "", password: "" });
      setErrors({ phone: "", email: "" });
    } catch (err) {
      console.error(err);
      setNotice("❌ Không gửi được thông tin. Vui lòng thử lại.");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="bg-[rgb(249,228,228)]">
      <div className="max-w-4xl mx-auto py-10 text-center">
        <h2 className="text-3xl font-semibold">Thông Tin Liên Hệ Store</h2>
        <p className="text-gray-600 mt-2">
          Chúng tôi vinh hạnh vì đã có cơ hội đồng hành với hơn 10.000 khách hàng trên khắp thế giới.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-white p-6 rounded-lg shadow transition-transform transform hover:scale-105">
            <div className="text-red-500 text-3xl">📍</div>
            <h3 className="font-semibold mt-2">Địa chỉ</h3>
            <p className="text-gray-600">
              182, Lã Xuân Oai, Tăng Nhơn Phú A, TP Thủ Đức, TPHCM
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow transition-transform transform hover:scale-105">
            <div className="text-red-500 text-3xl">✉️</div>
            <h3 className="font-semibold mt-2">Email</h3>
            <p className="text-gray-600">nvstore@gmail.com</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow transition-transform transform hover:scale-105">
            <div className="text-red-500 text-3xl">📞</div>
            <h3 className="font-semibold mt-2">Hotline</h3>
            <p className="text-gray-600">1900 6750</p>
          </div>
        </div>

        {/* Google Maps */}
        <div className="flex-1 mt-6">
          <iframe
            title="Store Location"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.6289456283475!2d106.79075997467041!3d10.839681789313012!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752717e84fda57%3A0xefd79da9620eb9dd!2zMTgyIEzDoyBYdcOibiBPYWksIFTEg25nIE5oxqFuIFBow7ogQSwgVGjhu6cgxJDhu6ljLCBI4buTIENow60gTWluaCA3MDAwMDAsIFZp4buHdCBOYW0!5e0!3m2!1svi!2s!4v1745570436413!5m2!1svi!2s"
            width="100%"
            height="350"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        {/* Form liên hệ */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow transition-transform transform hover:scale-105">
          <h3 className="text-xl font-semibold">Vui Lòng Nhập Thông Tin Khách Hàng</h3>

          {notice && (
            <p className="mt-3 text-sm">
              {notice}
            </p>
          )}

          <form className="mt-4 grid grid-cols-1 gap-4" onSubmit={onSubmit} noValidate>
            <input
              type="text"
              name="name"
              placeholder="Họ và tên *"
              required
              value={form.name}
              onChange={onChange}
              className="p-3 border rounded w-full transition-transform transform hover:scale-105"
            />

            <div>
              <input
                type="tel"
                name="phone"
                placeholder="Số điện thoại *"
                required
                value={form.phone}
                onChange={onChange}
                className="p-3 border rounded w-full transition-transform transform hover:scale-105"
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
              )}
            </div>

            <div>
              <input
                type="email"
                name="email"
                placeholder="Email *"
                required
                value={form.email}
                onChange={onChange}
                className="p-3 border rounded w-full transition-transform transform hover:scale-105"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <input
              type="text"
              name="address"
              placeholder="Địa chỉ"
              value={form.address}
              onChange={onChange}
              className="p-3 border rounded w-full transition-transform transform hover:scale-105"
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Mật khẩu"
                value={form.password}
                onChange={onChange}
                className="p-3 border rounded w-full transition-transform transform hover:scale-105"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>

            <button
              type="submit"
              disabled={sending}
              className="bg-[rgb(244,184,198)] text-[rgb(246,81,119)] py-2 rounded text-lg font-semibold transition-transform transform hover:scale-110 hover:bg-[rgb(246,81,119)] hover:text-white disabled:opacity-60"
            >
              {sending ? "Đang gửi..." : "Gửi thông tin"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
