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

  if (loading) return <div className="p-6">Đang tải…</div>;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Sửa danh mục #{id}</h1>

      {error && <p className="text-red-600 mb-3">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="name"
          placeholder="Tên danh mục"
          value={form.name}
          onChange={handleChange}
          required
          className="border p-2 w-full rounded"
        />

        <input
          type="text"
          name="slug"
          placeholder="Slug (tùy chọn)"
          value={form.slug}
          onChange={handleChange}
          className="border p-2 w-full rounded"
        />

        <textarea
          name="description"
          placeholder="Mô tả"
          value={form.description}
          onChange={handleChange}
          className="border p-2 w-full rounded"
        />

        <input
          type="number"
          name="sort_order"
          placeholder="Thứ tự hiển thị"
          value={form.sort_order}
          onChange={handleChange}
          className="border p-2 w-full rounded"
        />

        <input
          type="number"
          name="parent_id"
          placeholder="Parent ID (nếu có)"
          value={form.parent_id}
          onChange={handleChange}
          className="border p-2 w-full rounded"
        />

        <input
          type="text"
          name="image"
          placeholder="Tên file ảnh (nếu có)"
          value={form.image}
          onChange={handleChange}
          className="border p-2 w-full rounded"
        />

        <div>
          <label className="block mb-1 font-medium">Trạng thái</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="border p-2 rounded"
          >
            <option value={1}>Hoạt động</option>
            <option value={0}>Tạm ẩn</option>
          </select>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
          >
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/categories")}
            className="px-4 py-2 border rounded"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}
