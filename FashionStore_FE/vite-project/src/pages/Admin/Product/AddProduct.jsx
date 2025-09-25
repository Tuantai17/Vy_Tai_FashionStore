import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000/api";

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
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
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
      if (form.brand_id)    fd.append("brand_id", form.brand_id);
      if (form.description) fd.append("description", form.description);
      fd.append("status", "1");
      if (form.thumbnail)   fd.append("thumbnail", form.thumbnail);

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
          throw new Error(payload.message || "Dữ liệu chưa hợp lệ.");
        }
        if (res.status === 401) throw new Error("Bạn chưa đăng nhập hoặc token đã hết hạn.");
        throw new Error(payload.message || `Không thêm được sản phẩm (HTTP ${res.status}).`);
      }

      alert("✅ Thêm sản phẩm thành công");
      navigate("/admin/products");
    } catch (err) {
      setError("❌ " + (err.message || "Lỗi không xác định"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-gradient-to-br from-white via-blue-50 to-pink-50 shadow-xl rounded-2xl border border-blue-100">
      <h1 className="text-3xl font-extrabold mb-6 text-blue-700 flex items-center gap-2">
        <span className="text-2xl">➕</span> Thêm sản phẩm mới
      </h1>
      {error && <p className="text-red-500 mb-3 font-semibold">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block mb-1 font-semibold text-gray-700">Tên sản phẩm *</label>
          <input name="name" value={form.name} onChange={onChange} className="w-full border-2 border-blue-200 focus:border-blue-500 p-2 rounded-lg transition" required />
          {fieldErrors.name && <small className="text-red-600 font-medium">{fieldErrors.name[0]}</small>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block mb-1 font-semibold text-gray-700">Giá gốc</label>
            <input name="price_root" type="number" value={form.price_root} onChange={onChange} className="w-full border-2 border-blue-200 focus:border-blue-500 p-2 rounded-lg transition" />
            {fieldErrors.price_root && <small className="text-red-600 font-medium">{fieldErrors.price_root[0]}</small>}
          </div>
          <div>
            <label className="block mb-1 font-semibold text-gray-700">Giá bán</label>
            <input name="price_sale" type="number" value={form.price_sale} onChange={onChange} className="w-full border-2 border-blue-200 focus:border-blue-500 p-2 rounded-lg transition" />
            {fieldErrors.price_sale && <small className="text-red-600 font-medium">{fieldErrors.price_sale[0]}</small>}
          </div>
          <div>
            <label className="block mb-1 font-semibold text-gray-700">Số lượng</label>
            <input name="qty" type="number" value={form.qty} onChange={onChange} className="w-full border-2 border-blue-200 focus:border-blue-500 p-2 rounded-lg transition" />
            {fieldErrors.qty && <small className="text-red-600 font-medium">{fieldErrors.qty[0]}</small>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-semibold text-gray-700">Danh mục</label>
            <select name="category_id" value={form.category_id} onChange={onChange} className="w-full border-2 border-blue-200 focus:border-blue-500 p-2 rounded-lg transition">
              <option value="">-- Chọn danh mục --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.cate_name || c.name}</option>
              ))}
            </select>
            {fieldErrors.category_id && <small className="text-red-600 font-medium">{fieldErrors.category_id[0]}</small>}
          </div>

          <div>
            <label className="block mb-1 font-semibold text-gray-700">Thương hiệu *</label>
            <select name="brand_id" value={form.brand_id} onChange={onChange} className="w-full border-2 border-blue-200 focus:border-blue-500 p-2 rounded-lg transition" required>
              <option value="">-- Chọn thương hiệu --</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            {fieldErrors.brand_id && <small className="text-red-600 font-medium">{fieldErrors.brand_id[0]}</small>}
          </div>
        </div>

        <div>
          <label className="block mb-1 font-semibold text-gray-700">Ảnh sản phẩm</label>
          <input type="file" name="thumbnail" accept="image/*" onChange={onChange} className="w-full border-2 border-blue-200 focus:border-blue-500 p-2 rounded-lg transition" />
          <div className="mt-3 flex items-center gap-4">
            {form.thumbnail ? (
              <img src={URL.createObjectURL(form.thumbnail)} alt="Preview" className="h-32 w-32 object-cover rounded-lg border-2 border-blue-300 shadow" />
            ) : (
              <div className="h-32 w-32 flex items-center justify-center border-2 border-dashed border-blue-200 rounded-lg text-gray-400 text-sm bg-blue-50">
                Chưa chọn ảnh
              </div>
            )}
          </div>
          {fieldErrors.thumbnail && <small className="text-red-600 font-medium">{fieldErrors.thumbnail[0]}</small>}
        </div>

        <div>
          <label className="block mb-1 font-semibold text-gray-700">Mô tả</label>
          <textarea name="description" value={form.description} onChange={onChange} className="w-full border-2 border-blue-200 focus:border-blue-500 p-2 rounded-lg transition" rows="4" />
          {fieldErrors.description && <small className="text-red-600 font-medium">{fieldErrors.description[0]}</small>}
        </div>

        <div className="flex gap-3 mt-4">
          <button type="submit" disabled={saving} className="bg-gradient-to-r from-blue-500 to-pink-400 text-white px-6 py-2 rounded-lg font-bold shadow hover:from-blue-600 hover:to-pink-500 transition disabled:opacity-60">
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
          <button type="button" onClick={() => navigate("/admin/products")} className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-400 transition">
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}
