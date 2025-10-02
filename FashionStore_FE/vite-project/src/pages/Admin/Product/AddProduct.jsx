import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000/api";
const PLACEHOLDER = "https://placehold.co/120x120?text=No+Image";

export default function AddProduct() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [form, setForm] = useState({
    name: "",
    price_root: "",
    price_sale: "",
    qty: "",
    category_id: "",
    brand_id: "",
    description: "",
    thumbnail: null,
  });

  useEffect(() => {
    (async () => {
      try {
        const r1 = await fetch(`${API_BASE}/categories`, { headers: { Accept: "application/json" } });
        if (r1.ok) {
          const j1 = await r1.json();
          setCategories(Array.isArray(j1) ? j1 : (j1.data ?? j1.items ?? []));
        }
        const r2 = await fetch(`${API_BASE}/brands`, { headers: { Accept: "application/json" } });
        if (r2.ok) {
          const j2 = await r2.json();
          setBrands(Array.isArray(j2) ? j2 : (j2.data ?? j2.items ?? []));
        }
      } catch {}
    })();
  }, []);

  const onChange = (e) => {
    const { name, value, files } = e.target;
    setForm((s) => ({ ...s, [name]: files ? files[0] : value }));
  };

  const makeSlug = (raw) =>
    (raw || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setFieldErrors({});

    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("slug", makeSlug(form.name));
      fd.append("price_root", form.price_root || 0);
      fd.append("price_sale", form.price_sale || 0);
      fd.append("qty", form.qty || 0);
      if (form.category_id) fd.append("category_id", form.category_id);
      if (form.brand_id) fd.append("brand_id", form.brand_id);
      if (form.description) fd.append("description", form.description);
      fd.append("status", "1");
      if (form.thumbnail) fd.append("thumbnail", form.thumbnail);

      const token = localStorage.getItem("authToken") || localStorage.getItem("token") || "";
      const res = await fetch(`${API_BASE}/admin/products`, {
        method: "POST",
        headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: fd,
      });

      if (!res.ok) {
        const ct = res.headers.get("content-type") || "";
        const payload = ct.includes("application/json") ? await res.json() : { message: await res.text() };
        if (res.status === 422) {
          setFieldErrors(payload.errors || {});
          throw new Error(payload.message || "Du lieu chua hop le.");
        }
        if (res.status === 401) throw new Error("Ban chua dang nhap hoac token da het han.");
        throw new Error(payload.message || `Khong them duoc san pham (HTTP ${res.status}).`);
      }

      alert("Da them san pham thanh cong");
      navigate("/admin/products");
    } catch (err) {
      setError("Loi: " + (err.message || "Khong xac dinh"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-form-card">
      <div className="admin-form-heading">
        <div className="admin-form-icon">+</div>
        <div>
          <h1 className="admin-form-title">Them san pham moi</h1>
          <p className="admin-form-subtitle">Nhap thong tin chi tiet va danh muc lien quan.</p>
        </div>
      </div>

      {error && <p className="admin-form-error">{error}</p>}

      <form onSubmit={handleSubmit} className="admin-form-body">
        <div className="admin-form-field">
          <label className="admin-form-label">Ten san pham *</label>
          <input
            name="name"
            value={form.name}
            onChange={onChange}
            className="admin-form-control"
            required
          />
          {fieldErrors.name && <small className="admin-form-error-text">{fieldErrors.name[0]}</small>}
        </div>

        <div className="admin-form-grid admin-form-grid--3">
          <div className="admin-form-field">
            <label className="admin-form-label">Gia goc</label>
            <input
              name="price_root"
              type="number"
              value={form.price_root}
              onChange={onChange}
              className="admin-form-control"
            />
            {fieldErrors.price_root && <small className="admin-form-error-text">{fieldErrors.price_root[0]}</small>}
          </div>
          <div className="admin-form-field">
            <label className="admin-form-label">Gia ban</label>
            <input
              name="price_sale"
              type="number"
              value={form.price_sale}
              onChange={onChange}
              className="admin-form-control"
            />
            {fieldErrors.price_sale && <small className="admin-form-error-text">{fieldErrors.price_sale[0]}</small>}
          </div>
          <div className="admin-form-field">
            <label className="admin-form-label">So luong</label>
            <input
              name="qty"
              type="number"
              value={form.qty}
              onChange={onChange}
              className="admin-form-control"
            />
            {fieldErrors.qty && <small className="admin-form-error-text">{fieldErrors.qty[0]}</small>}
          </div>
        </div>

        <div className="admin-form-grid admin-form-grid--2">
          <div className="admin-form-field">
            <label className="admin-form-label">Danh muc</label>
            <select
              name="category_id"
              value={form.category_id}
              onChange={onChange}
              className="admin-form-control admin-form-select"
            >
              <option value="">-- Chon danh muc --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.cate_name || c.name}
                </option>
              ))}
            </select>
            {fieldErrors.category_id && <small className="admin-form-error-text">{fieldErrors.category_id[0]}</small>}
          </div>

          <div className="admin-form-field">
            <label className="admin-form-label">Thuong hieu *</label>
            <select
              name="brand_id"
              value={form.brand_id}
              onChange={onChange}
              className="admin-form-control admin-form-select"
              required
            >
              <option value="">-- Chon thuong hieu --</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            {fieldErrors.brand_id && <small className="admin-form-error-text">{fieldErrors.brand_id[0]}</small>}
          </div>
        </div>

        <div className="admin-form-field">
          <label className="admin-form-label">Anh san pham</label>
          <input
            type="file"
            name="thumbnail"
            accept="image/*"
            onChange={onChange}
            className="admin-form-control admin-form-file"
          />
          <div className="admin-upload-preview">
            {form.thumbnail ? (
              typeof form.thumbnail === "string" ? (
                // Trường hợp sửa sản phẩm và đã có URL ảnh sẵn trong DB
                <img
                  src={form.thumbnail}
                  alt="Preview"
                  className="admin-upload-image"
                  onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
                />
              ) : (
                // Trường hợp vừa chọn file từ <input type="file" />
                <img
                  src={URL.createObjectURL(form.thumbnail)}
                  alt="Preview"
                  className="admin-upload-image"
                  onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)} // giải phóng blob sau khi load
                />
              )
            ) : (
              <div className="admin-upload-placeholder">Chua chon anh</div>
            )}
          </div>

          {fieldErrors.thumbnail && <small className="admin-form-error-text">{fieldErrors.thumbnail[0]}</small>}
        </div>

        <div className="admin-form-field">
          <label className="admin-form-label">Mo ta</label>
          <textarea
            name="description"
            value={form.description}
            onChange={onChange}
            className="admin-form-control admin-form-textarea"
            rows="4"
          />
          {fieldErrors.description && <small className="admin-form-error-text">{fieldErrors.description[0]}</small>}
        </div>

        <div className="admin-form-actions">
          <button
            type="submit"
            disabled={saving}
            className="admin-btn admin-btn--primary"
          >
            {saving ? "Dang luu..." : "Luu"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className="admin-btn admin-btn--ghost"
          >
            Huy
          </button>
        </div>
      </form>
    </div>
  );
}
