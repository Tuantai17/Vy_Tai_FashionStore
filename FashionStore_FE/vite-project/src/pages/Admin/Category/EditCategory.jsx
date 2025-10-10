import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000/api";
const APP_BASE = API_BASE.replace(/\/api$/, "");

export default function EditCategory() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    sort_order: "",
    parent_id: "",
    status: "1",
    image_file: null,     // file mới
    image_url: "",        // đường dẫn public (API trả về)
    image_path: "",       // đường dẫn lưu trong storage
  });

  // --- Xử lý preview ảnh ---
  const previewUrl = useMemo(() => {
    if (form.image_file) return URL.createObjectURL(form.image_file);
    if (form.image_url) return form.image_url;
    if (form.image_path) return `${APP_BASE}/storage/${form.image_path}`;
    return "";
  }, [form.image_file, form.image_url, form.image_path]);

  // --- Nạp dữ liệu ---
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API_BASE}/categories/${id}`, {
          signal: ac.signal,
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        setForm((s) => ({
          ...s,
          name: data.name ?? "",
          slug: data.slug ?? "",
          description: data.description ?? "",
          sort_order: String(data.sort_order ?? ""),
          parent_id: data.parent_id ? String(data.parent_id) : "",
          status: String(data.status ?? "1"),
          image_url: data.image_url ?? "",
          image_path: data.image ?? "",
        }));
      } catch (e) {
        if (e.name !== "AbortError")
          setError(e.message || "Không tải được danh mục.");
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [id]);

  // --- Handle input ---
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files && files.length) {
      setForm((s) => ({ ...s, image_file: files[0] }));
    } else {
      setForm((s) => ({ ...s, [name]: value }));
    }
  };

  // --- Gửi dữ liệu ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setFieldErrors({});

    try {
      const fd = new FormData();
      fd.append("_method", "PUT");
      fd.append("name", form.name);
      if (form.slug) fd.append("slug", form.slug);
      if (form.description) fd.append("description", form.description);
      if (form.sort_order) fd.append("sort_order", form.sort_order);
      if (form.parent_id) fd.append("parent_id", form.parent_id);
      fd.append("status", form.status);
      if (form.image_file) fd.append("image", form.image_file); // chỉ gửi nếu có file mới

      const token = localStorage.getItem("authToken") || localStorage.getItem("token") || "";
      const res = await fetch(`${API_BASE}/admin/categories/${id}`, {
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
        throw new Error(payload.message || `Lỗi HTTP ${res.status}`);
      }

      alert("✅ Cập nhật danh mục thành công");
      navigate("/admin/categories");
    } catch (e) {
      setError("❌ " + (e.message || "Lỗi không xác định"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="admin-form-card">Đang tải...</div>;

  return (
    <div className="admin-form-card admin-form-card--wide">
      <ul className="admin-breadcrumb">
        <li><Link to="/admin">Admin</Link></li>
        <li className="admin-breadcrumb-sep">/</li>
        <li><Link to="/admin/categories">Danh mục</Link></li>
        <li className="admin-breadcrumb-sep">/</li>
        <li>Sửa #{id}</li>
      </ul>

      <div className="admin-form-heading">
        <div className="admin-form-icon admin-form-icon--folder">📁</div>
        <div>
          <h1 className="admin-form-title">Sửa danh mục #{id}</h1>
          <p className="admin-form-subtitle">Điều chỉnh thông tin danh mục hiện có.</p>
        </div>
      </div>

      {error && <p className="admin-form-error">{error}</p>}

      <form onSubmit={handleSubmit} className="admin-form-layout">
        <div className="admin-form-main">
          <section className="admin-section-card">
            <h2 className="admin-section-card__title">Thông tin cơ bản</h2>

            <div className="admin-form-field">
              <label className="admin-form-label">Tên danh mục *</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="admin-form-control"
              />
            </div>

            <div className="admin-form-grid admin-form-grid--2">
              <div className="admin-form-field">
                <label className="admin-form-label">Slug (tuỳ chọn)</label>
                <input
                  type="text"
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  className="admin-form-control"
                />
              </div>
              <div className="admin-form-field">
                <label className="admin-form-label">Thứ tự hiển thị</label>
                <input
                  type="number"
                  name="sort_order"
                  value={form.sort_order}
                  onChange={handleChange}
                  className="admin-form-control"
                />
              </div>
            </div>

            <div className="admin-form-field">
              <label className="admin-form-label">Mô tả</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="admin-form-control admin-form-textarea"
                rows={4}
              />
            </div>

            <div className="admin-form-field">
              <label className="admin-form-label">Trạng thái</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="admin-form-control admin-form-select"
              >
                <option value="1">Hoạt động</option>
                <option value="0">Tạm dừng</option>
              </select>
            </div>
          </section>

          <section className="admin-section-card">
            <h2 className="admin-section-card__title">Ảnh danh mục</h2>
            <div className="admin-section-card__body">
              <div className="admin-upload-preview">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="admin-upload-image" />
                ) : (
                  <div className="admin-upload-placeholder">Chưa có ảnh</div>
                )}
                <div className="admin-upload-actions">
                  <label className="admin-form-label">Đổi ảnh (tuỳ chọn)</label>
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleChange}
                    className="admin-form-control admin-form-file"
                  />
                  <p className="admin-upload-note">Nếu không chọn, hệ thống giữ ảnh cũ.</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="admin-form-side">
          <section className="admin-section-card">
            <h2 className="admin-section-card__title">Hành động</h2>
            <p className="admin-form-meta">ID danh mục: #{id}</p>
            <div className="admin-form-actions admin-form-actions--column">
              <button type="submit" disabled={saving} className="admin-btn admin-btn--primary">
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/admin/categories")}
                className="admin-btn admin-btn--ghost"
              >
                Hủy
              </button>
            </div>
          </section>
        </div>
      </form>
    </div>
  );
}
