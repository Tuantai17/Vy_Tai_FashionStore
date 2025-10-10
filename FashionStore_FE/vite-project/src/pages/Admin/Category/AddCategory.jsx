import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000/api";
const PLACEHOLDER = "https://placehold.co/120x120?text=No+Image";

export default function AddCategory() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    sort_order: "",
    parent_id: "",
    image: null, // 👈 để nhận file thật
    status: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // ====== Slug generator ======
  const makeSlug = (raw) =>
    (raw || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

  // ====== Handle form change ======
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value, // 👈 handle file input
    }));
  };

  // ====== Submit form ======
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({});

    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("slug", form.slug || makeSlug(form.name));
      if (form.description) fd.append("description", form.description);
      if (form.sort_order) fd.append("sort_order", form.sort_order);
      if (form.parent_id) fd.append("parent_id", form.parent_id);
      fd.append("status", form.status);
      if (form.image) fd.append("image", form.image); // 👈 file ảnh thật

      const token = localStorage.getItem("authToken") || localStorage.getItem("token") || "";
      const res = await fetch(`${API_BASE}/admin/categories`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: fd,
      });

      if (!res.ok) {
        const ct = res.headers.get("content-type") || "";
        const payload = ct.includes("application/json") ? await res.json() : { message: await res.text() };
        if (res.status === 422) {
          setFieldErrors(payload.errors || {});
          throw new Error(payload.message || "Dữ liệu chưa hợp lệ.");
        }
        throw new Error(payload.message || "Thêm danh mục thất bại.");
      }

      const data = await res.json();
      alert(data.message || "Đã thêm danh mục thành công!");
      navigate("/admin/categories");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-form-card">
      <div className="admin-form-heading">
        <div className="admin-form-icon">+</div>
        <div>
          <h1 className="admin-form-title">Thêm danh mục</h1>
          <p className="admin-form-subtitle">Nhập thông tin danh mục và chọn ảnh minh hoạ.</p>
        </div>
      </div>

      {error && <p className="admin-form-error">{error}</p>}

      <form onSubmit={handleSubmit} className="admin-form-body">
        <div className="admin-form-field">
          <label className="admin-form-label">Tên danh mục *</label>
          <input
            type="text"
            name="name"
            placeholder="Ví dụ: Áo sơ mi"
            value={form.name}
            onChange={handleChange}
            required
            className="admin-form-control"
          />
        </div>

        <div className="admin-form-grid admin-form-grid--2">
          <div className="admin-form-field">
            <label className="admin-form-label">Slug (tùy chọn)</label>
            <input
              type="text"
              name="slug"
              placeholder="ao-so-mi"
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
              placeholder="0"
              value={form.sort_order}
              onChange={handleChange}
              className="admin-form-control"
            />
          </div>
        </div>

        {/* ẢNH DANH MỤC */}
        <div className="admin-form-field">
          <label className="admin-form-label">Ảnh danh mục</label>
          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={handleChange}
            className="admin-form-control admin-form-file"
          />
          <div className="admin-upload-preview">
            {form.image ? (
              <img
                src={
                  typeof form.image === "string"
                    ? form.image
                    : URL.createObjectURL(form.image)
                }
                alt="Preview"
                className="admin-upload-image"
                onError={(e) => (e.currentTarget.src = PLACEHOLDER)}
                onLoad={(e) => {
                  if (typeof form.image !== "string") URL.revokeObjectURL(e.currentTarget.src);
                }}
              />
            ) : (
              <div className="admin-upload-placeholder">Chưa chọn ảnh</div>
            )}
          </div>
          {fieldErrors.image && (
            <small className="admin-form-error-text">{fieldErrors.image[0]}</small>
          )}
        </div>

        <div className="admin-form-field">
          <label className="admin-form-label">Mô tả</label>
          <textarea
            name="description"
            placeholder="Mô tả ngắn gọn cho danh mục"
            value={form.description}
            onChange={handleChange}
            className="admin-form-control admin-form-textarea"
            rows="4"
          />
        </div>

        <div className="admin-form-grid admin-form-grid--2">
          <div className="admin-form-field">
            <label className="admin-form-label">Parent ID (nếu có)</label>
            <input
              type="number"
              name="parent_id"
              placeholder="ID danh mục cha"
              value={form.parent_id}
              onChange={handleChange}
              className="admin-form-control"
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
              <option value={1}>Hoạt động</option>
              <option value={0}>Tạm dừng</option>
            </select>
          </div>
        </div>

        <div className="admin-form-actions">
          <button
            type="submit"
            disabled={loading}
            className="admin-btn admin-btn--primary"
          >
            {loading ? "Đang lưu..." : "Lưu"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/categories")}
            className="admin-btn admin-btn--ghost"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}
