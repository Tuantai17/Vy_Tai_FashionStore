import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Editor } from '@tinymce/tinymce-react';
import { getAdminToken } from "../../../utils/authStorage";



const API_BASE = "http://127.0.0.1:8000/api"; // BE dùng /api

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    price_root: "",     // lưu dạng chuỗi số (vd "120000")
    price_sale: "",
    qty: "",
    category_id: "",
    brand_id: "",
    description: "",
    status: "1",
    thumbnail: null,      // file mới (nếu đổi)
    thumbnail_url: "",    // url có sẵn (từ API)
    thumbnail_path: "",   // path storage (từ API)
  });

  // --- utils ---
  const makeSlug = (raw) =>
    (raw || "")
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

  const APP_BASE = API_BASE.replace(/\/api$/, "");
  const previewUrl = useMemo(() => {
    if (form.thumbnail) return URL.createObjectURL(form.thumbnail);
    if (form.thumbnail_url) return form.thumbnail_url;
    if (form.thumbnail_path) return `${APP_BASE}/storage/${form.thumbnail_path}`;
    return "";
  }, [form.thumbnail, form.thumbnail_url, form.thumbnail_path, APP_BASE]);

  const onChange = (e) => {
    const { name, value, files } = e.target;
    setForm((s) => ({ ...s, [name]: files ? files[0] : value }));
    if (name === "name") {
      setForm((s) => ({ ...s, slug: makeSlug(value) }));
    }
  };

  // Cho phép gõ 123.000/123,000 và lưu thành "123000"
  const onPriceChange = (e) => {
    const { name, value } = e.target;
    const digits = (value || "").replace(/[^\d]/g, "");
    setForm((s) => ({ ...s, [name]: digits }));
  };

  // --- load data ---
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setError("");

        const [rCats, rBrands, rProd] = await Promise.all([
          fetch(`${API_BASE}/categories`, { signal: ac.signal, headers: { Accept: "application/json" } }),
          fetch(`${API_BASE}/brands`, { signal: ac.signal, headers: { Accept: "application/json" } }),
          fetch(`${API_BASE}/admin/products/${id}`, { signal: ac.signal, headers: { Accept: "application/json" } }),
        ]);

        if (rCats.ok) {
          const j = await rCats.json();
          setCategories(Array.isArray(j) ? j : j.data ?? j.items ?? []);
        }
        if (rBrands.ok) {
          const j = await rBrands.json();
          setBrands(Array.isArray(j) ? j : j.data ?? j.items ?? []);
        }

        if (!rProd.ok) throw new Error(`Không tải được sản phẩm (HTTP ${rProd.status})`);
        const p = await rProd.json();
        const data = Array.isArray(p) ? p[0] : (p.data ?? p);

        setForm((s) => ({
          ...s,
          name: data.name ?? "",
          slug: data.slug ?? "",
          price_root: String(data.price_root ?? 0),
          price_sale: String(data.price_sale ?? 0),
          qty: String(data.qty ?? 0),
          category_id: data.category_id ?? "",
          brand_id: data.brand_id ?? "",
          description: data.description ?? "",
          status: (data.status ?? 1).toString(),
          thumbnail_url: data.thumbnail_url ?? "",
          thumbnail_path: data.thumbnail ?? "",
        }));
      } catch (e) {
        if (e.name !== "AbortError") setError(e.message || "Lỗi tải dữ liệu.");
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [id]);

  // --- submit ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setFieldErrors({});

    try {
      const fd = new FormData();
      fd.append("_method", "PUT");
      fd.append("name", form.name);
      fd.append("slug", form.slug || makeSlug(form.name));
      fd.append("price_root", form.price_root || 0);
      fd.append("price_sale", form.price_sale || 0);
      fd.append("qty", form.qty || 0);
      if (form.category_id) fd.append("category_id", form.category_id);
      if (form.brand_id)    fd.append("brand_id", form.brand_id);
      if (form.description) fd.append("description", form.description);
      fd.append("status", form.status || "1");
      if (form.thumbnail)   fd.append("thumbnail", form.thumbnail);

      const token = getAdminToken();
      const res = await fetch(`${API_BASE}/admin/products/${id}`, {
        method: "POST",
        headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: fd,
      });

      if (!res.ok) {
        const ct = res.headers.get("content-type") || "";
        const payload = ct.includes("application/json") ? await res.json() : { message: await res.text() };
        if (res.status === 422) {
          setFieldErrors(payload.errors || {});
          throw new Error(payload.message || "Dữ liệu chưa hợp lệ.");
        }
        if (res.status === 401) throw new Error("Bạn chưa đăng nhập hoặc token đã hết hạn.");
        if (res.status === 404) throw new Error("Không tìm thấy sản phẩm.");
        throw new Error(payload.message || `Không cập nhật được (HTTP ${res.status}).`);
      }

      alert("✅ Cập nhật sản phẩm thành công");
      navigate("/admin/products");
    } catch (e) {
      setError("❌ " + (e.message || "Lỗi không xác định"));
    } finally {
      setSaving(false);
    }
  };

  // --- small UI helpers ---
  const Label = ({ children, req }) => (
    <label className="admin-form-label">
      {children}
      {req && <span className="admin-form-label-required">{' '}*</span>}
    </label>
  );
  const Help = ({ children }) => <p className="admin-form-hint">{children}</p>;
  const Err = ({ name }) =>
    fieldErrors?.[name] ? <p className="admin-form-error-text">{fieldErrors[name][0]}</p> : null;

  if (loading) return <div className="admin-form-card admin-form-card--wide">Dang tai...</div>;

  return (
    <div className="admin-form-card admin-form-card--wide">
      <ul className="admin-breadcrumb">
        <li><Link to="/admin">Admin</Link></li>
        <li className="admin-breadcrumb-sep">/</li>
        <li><Link to="/admin/products">San pham</Link></li>
        <li className="admin-breadcrumb-sep">/</li>
        <li>Chinh sua #${id}</li>
      </ul>

      <div className="admin-form-heading">
        <div className="admin-form-icon admin-form-icon--pencil">✏️</div>
        <div>
          <h1 className="admin-form-title">Chinh sua san pham</h1>
          <p className="admin-form-subtitle">Cap nhat chi tiet cho san pham #${id}</p>
        </div>
      </div>

      {error && <p className="admin-form-error">{error}</p>}

      <form onSubmit={handleSubmit} className="admin-form-layout">
        <div className="admin-form-main">
          <section className="admin-section-card">
            <div className="admin-section-card__header">
              <h2 className="admin-section-card__title">Thong tin co ban</h2>
              <p className="admin-section-card__subtitle">Cap nhat ten, gia va so luong san pham.</p>
            </div>
            <div className="admin-section-card__body">
              <div className="admin-form-field">
                <Label req>Ten san pham</Label>
                <input
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  required
                  className="admin-form-control"
                />
                <Help>Slug hien tai: <span className="admin-form-meta">{form.slug || makeSlug(form.name) || "--"}</span></Help>
                <Err name="name" />
              </div>

              <div className="admin-section-grid admin-section-grid--3">
                <div className="admin-form-field">
                  <Label>Gia goc</Label>
                  <input
                    name="price_root"
                    type="text"
                    inputMode="numeric"
                    value={form.price_root}
                    onChange={onPriceChange}
                    placeholder="Vi du: 120000"
                    className="admin-form-control"
                  />
                  <Help>Co the nhap 123000, 123.000 hoac 123,000; he thong se tu loc ky tu.</Help>
                  <Err name="price_root" />
                </div>
                <div className="admin-form-field">
                  <Label>Gia ban</Label>
                  <input
                    name="price_sale"
                    type="text"
                    inputMode="numeric"
                    value={form.price_sale}
                    onChange={onPriceChange}
                    placeholder="De 0 neu khong giam"
                    className="admin-form-control"
                  />
                  <Help>De 0 neu khong co gia khuyen mai.</Help>
                  <Err name="price_sale" />
                </div>
                <div className="admin-form-field">
                  <Label>So luong</Label>
                  <input
                    name="qty"
                    type="number"
                    value={form.qty}
                    onChange={onChange}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="admin-form-control"
                  />
                  <Err name="qty" />
                </div>
              </div>

              <div className="admin-section-grid admin-section-grid--2">
                <div className="admin-form-field">
                  <Label>Danh muc</Label>
                  <select
                    name="category_id"
                    value={form.category_id ?? ""}
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
                  <Err name="category_id" />
                </div>
                <div className="admin-form-field">
                  <Label req>Thuong hieu</Label>
                  <select
                    name="brand_id"
                    value={form.brand_id ?? ""}
                    onChange={onChange}
                    required
                    className="admin-form-control admin-form-select"
                  >
                    <option value="">-- Chon thuong hieu --</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <Err name="brand_id" />
                </div>
              </div>

              <div className="admin-form-field">
                <Label>Trang thai</Label>
                <select
                  name="status"
                  value={form.status}
                  onChange={onChange}
                  className="admin-form-control admin-form-select"
                >
                  <option value="1">Hien thi</option>
                  <option value="0">An</option>
                </select>
              </div>

              <div className="admin-form-field">
                <Label>Mô tả</Label>

                <Editor
                  // nếu chuyển giữa các sản phẩm, key giúp Editor remount & nhận đúng value
                  key={id}
                  apiKey="wytgyqmbl6rj0c9rw03s5uep2xrd9iit95fmkka5zqb42det"                 // dùng CDN của Tiny (đủ xài dev). Có key thì thay vào.
                  value={form.description || ""}      // bám state hiện có
                  onEditorChange={(html) =>
                    setForm((s) => ({ ...s, description: html }))
                  }
                  init={{
                    height: 360,
                    menubar: false,
                    plugins: [
                      "advlist autolink lists link image charmap preview anchor",
                      "searchreplace visualblocks code fullscreen",
                      "insertdatetime media table code help wordcount"
                    ],
                    toolbar:
                      "undo redo | formatselect | " +
                      "bold italic underline forecolor backcolor | alignleft aligncenter " +
                      "alignright alignjustify | bullist numlist outdent indent | " +
                      "table link image media | removeformat | code preview",
                    content_style:
                      "body { font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; font-size:14px }",
                  }}
                />

                <Err name="description" />
              </div>

            </div>
          </section>

          <section className="admin-section-card">
            <div className="admin-section-card__header">
              <h2 className="admin-section-card__title">Anh san pham</h2>
              <p className="admin-section-card__subtitle">Quan ly anh hien thi tren cua hang.</p>
            </div>
            <div className="admin-section-card__body">
              <div className="admin-form-field">
                <div className="admin-upload-preview">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="admin-upload-image" />
                  ) : (
                    <div className="admin-upload-placeholder">Chua co anh</div>
                  )}
                  <div className="admin-upload-actions">
                    <label className="admin-form-label">Doi anh (tuy chon)</label>
                    <input
                      type="file"
                      name="thumbnail"
                      accept="image/*"
                      onChange={onChange}
                      className="admin-form-control admin-form-file"
                    />
                    <p className="admin-upload-note">Neu khong chon, he thong giu anh cu.</p>
                    <Err name="thumbnail" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="admin-form-side">
          <section className="admin-section-card">
            <div className="admin-section-card__header">
              <h2 className="admin-section-card__title">Hanh dong</h2>
              <p className="admin-section-card__subtitle">Luu thay doi hoac quay lai danh sach san pham.</p>
            </div>
            <div className="admin-section-card__body">
              <p className="admin-form-meta">ID san pham: #${id}</p>
              <div className="admin-form-actions admin-form-actions--column">
                <button type="submit" disabled={saving} className="admin-btn admin-btn--primary">
                  {saving ? "Dang luu..." : "Luu thay doi"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/admin/products")}
                  className="admin-btn admin-btn--ghost"
                >
                  Huy
                </button>
              </div>
            </div>
          </section>
        </div>
      </form>
    </div>
  );
}
