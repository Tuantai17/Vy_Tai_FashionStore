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
    status: 1, // ✅ mặc định là 1
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
        let message = "Thêm thất bại";
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
      alert(data.message || "Thêm danh mục thành công!");
      navigate("/admin/categories"); // ✅ quay về danh sách
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Thêm danh mục</h1>

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

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {loading ? "Đang lưu..." : "Lưu"}
        </button>
      </form>
    </div>
  );
}
