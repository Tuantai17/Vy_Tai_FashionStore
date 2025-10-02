// src/pages/Admin/Category/EditCategory.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000/api";

export default function EditCategory() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    sort_order: "",
    parent_id: "",
    image: "",
    status: 1,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // nạp dữ liệu hiện có
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${API_BASE}/categories/${id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (!ignore) {
          setForm({
            name: data.name ?? "",
            slug: data.slug ?? "",
            description: data.description ?? "",
            sort_order: data.sort_order ?? "",
            parent_id:
              data.parent_id === null || data.parent_id === 0
                ? ""
                : String(data.parent_id),
            image: (data.image?.replace(/^categories\//, "") ?? data.image) || "",
            status: Number(data.status ?? 1),
          });
        }
      } catch (e) {
        if (!ignore) setError("Không tải được danh mục.");
        console.error(e);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    // chuẩn hoá payload
    const payload = {
      ...form,
      sort_order: form.sort_order === "" ? null : Number(form.sort_order),
      status: Number(form.status),
      parent_id:
        form.parent_id === "" || Number(form.parent_id) === 0
          ? null
          : Number(form.parent_id),
    };

    try {
      const res = await fetch(`${API_BASE}/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let message = "Cập nhật thất bại";
        try {
          const errData = await res.json();
          message = errData.message || message;
        } catch {
          message = await res.text();
        }
        throw new Error(message);
      }

      const data = await res.json();
      alert(data.message || "Cập nhật danh mục thành công!");
      navigate("/admin/categories");
    } catch (err) {
      setError(err.message || "Có lỗi khi cập nhật.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="admin-form-card">Dang tai...</div>;

  return (
    <div className="admin-form-card">
      <div className="admin-form-heading">
        <div className="admin-form-icon admin-form-icon--folder">🗂</div>
        <div>
          <h1 className="admin-form-title">Sua danh muc #${id}</h1>
          <p className="admin-form-subtitle">Dieu chinh thong tin va trang thai danh muc hien co.</p>
        </div>
      </div>

      {error && <p className="admin-form-error">{error}</p>}

      <form onSubmit={handleSubmit} className="admin-form-body">
        <div className="admin-form-field">
          <label className="admin-form-label">Ten danh muc *</label>
          <input
            type="text"
            name="name"
            placeholder="Vi du: Quan ao"
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
              placeholder="quan-ao"
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
              placeholder="category.jpg"
              value={form.image}
              onChange={handleChange}
              className="admin-form-control"
            />
          </div>
        </div>

        <div className="admin-form-field">
          <label className="admin-form-label">Trang thai</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="admin-form-control admin-form-select"
          >
            <option value={1}>Hoat dong</option>
            <option value={0}>Tam dung</option>
          </select>
        </div>

        <div className="admin-form-actions">
          <button type="submit" disabled={saving} className="admin-btn admin-btn--primary">
            {saving ? "Dang luu..." : "Luu thay doi"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/categories")}
            className="admin-btn admin-btn--ghost"
          >
            Huy
          </button>
        </div>
      </form>
    </div>
  );
}
