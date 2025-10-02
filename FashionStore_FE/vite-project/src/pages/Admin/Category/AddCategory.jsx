import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000/api";

export default function AddCategory() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    sort_order: "",
    parent_id: "",
    image: "",
    status: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        let message = "Them that bai";
        try {
          const errData = await res.json();
          message = errData.message || message;
        } catch {
          const errText = await res.text();
          console.error("Server error:", errText);
        }
        throw new Error(message);
      }

      const data = await res.json();
      alert(data.message || "Da them danh muc thanh cong!");
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
          <h1 className="admin-form-title">Them danh muc</h1>
          <p className="admin-form-subtitle">Nhap thong tin danh muc de sap xep san pham khoa hoc.</p>
        </div>
      </div>

      {error && <p className="admin-form-error">{error}</p>}

      <form onSubmit={handleSubmit} className="admin-form-body">
        <div className="admin-form-field">
          <label className="admin-form-label">Ten danh muc *</label>
          <input
            type="text"
            name="name"
            placeholder="Vi du: Ao so mi"
            value={form.name}
            onChange={handleChange}
            required
            className="admin-form-control"
          />
        </div>

        <div className="admin-form-grid admin-form-grid--2">
          <div className="admin-form-field">
            <label className="admin-form-label">Slug (tuy chon)</label>
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
            <label className="admin-form-label">Thu tu hien thi</label>
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

        <div className="admin-form-field">
          <label className="admin-form-label">Mo ta</label>
          <textarea
            name="description"
            placeholder="Mo ta ngan gon cho danh muc"
            value={form.description}
            onChange={handleChange}
            className="admin-form-control admin-form-textarea"
            rows="4"
          />
        </div>

        <div className="admin-form-grid admin-form-grid--2">
          <div className="admin-form-field">
            <label className="admin-form-label">Parent ID (neu co)</label>
            <input
              type="number"
              name="parent_id"
              placeholder="ID danh muc cha"
              value={form.parent_id}
              onChange={handleChange}
              className="admin-form-control"
            />
          </div>
          <div className="admin-form-field">
            <label className="admin-form-label">Ten file anh (neu co)</label>
            <input
              type="text"
              name="image"
              placeholder="category.png"
              value={form.image}
              onChange={handleChange}
              className="admin-form-control"
            />
          </div>
        </div>

        <div className="admin-form-actions">
          <button type="submit" disabled={loading} className="admin-btn admin-btn--primary">
            {loading ? "Dang luu..." : "Luu"}
          </button>
          <button type="button" onClick={() => navigate("/admin/categories")} className="admin-btn admin-btn--ghost">
            Huy
          </button>
        </div>
      </form>
    </div>
  );
}
