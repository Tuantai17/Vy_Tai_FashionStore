import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";

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

      const token = localStorage.getItem("authToken") || localStorage.getItem("token") || "";
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
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {children} {req && <span className="text-red-500">*</span>}
    </label>
  );
  const Help = ({ children }) => <p className="mt-1 text-xs text-gray-500">{children}</p>;
  const Err = ({ name }) =>
    fieldErrors?.[name] ? <p className="mt-1 text-sm text-red-600">{fieldErrors[name][0]}</p> : null;

  if (loading) return <div className="p-6">Đang tải…</div>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6">
        <nav className="text-sm text-gray-500 mb-1">
          <Link to="/admin" className="hover:text-gray-700">Admin</Link>
          <span className="mx-1">/</span>
          <Link to="/admin/products" className="hover:text-gray-700">Sản phẩm</Link>
          <span className="mx-1">/</span>
          <span className="text-gray-900 font-medium">Chỉnh sửa #{id}</span>
        </nav>
        <h1 className="text-2xl font-bold tracking-tight">✏️ Chỉnh sửa sản phẩm</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* cột chính */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Thông tin cơ bản</h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <Label req>Tên sản phẩm</Label>
                <input
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  required
                  className="w-full rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-2.5"
                />
                <Help>Slug: <span className="font-mono">{form.slug || makeSlug(form.name) || "—"}</span></Help>
                <Err name="name" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Giá gốc</Label>
                  <input
                    name="price_root"
                    type="text"
                    inputMode="numeric"
                    value={form.price_root}
                    onChange={onPriceChange}
                    placeholder="VD: 120000"
                    className="w-full rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-2.5"
                  />
                  <Help>Gõ số, có thể nhập 123.000/123,000; hệ thống tự lọc ký tự.</Help>
                  <Err name="price_root" />
                </div>
                <div>
                  <Label>Giá bán</Label>
                  <input
                    name="price_sale"
                    type="text"
                    inputMode="numeric"
                    value={form.price_sale}
                    onChange={onPriceChange}
                    placeholder="0"
                    className="w-full rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-2.5"
                  />
                  <Help>Để 0 nếu không giảm.</Help>
                  <Err name="price_sale" />
                </div>
                <div>
                  <Label>Số lượng</Label>
                  <input
                    name="qty"
                    type="number"
                    min="0"
                    step="1"
                    value={form.qty}
                    onChange={onChange}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="w-full rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-2.5"
                  />
                  <Err name="qty" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Danh mục</Label>
                  <select
                    name="category_id"
                    value={form.category_id ?? ""}
                    onChange={onChange}
                    className="w-full rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-2.5 bg-white"
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.cate_name || c.name}</option>
                    ))}
                  </select>
                  <Err name="category_id" />
                </div>
                <div>
                  <Label req>Thương hiệu</Label>
                  <select
                    name="brand_id"
                    value={form.brand_id ?? ""}
                    onChange={onChange}
                    required
                    className="w-full rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-2.5 bg-white"
                  >
                    <option value="">-- Chọn thương hiệu --</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                  <Err name="brand_id" />
                </div>
              </div>

              <div>
                <Label>Trạng thái</Label>
                <select
                  name="status"
                  value={form.status}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-2.5 bg-white"
                >
                  <option value="1">Hiển thị</option>
                  <option value="0">Ẩn</option>
                </select>
              </div>

              <div>
                <Label>Mô tả</Label>
                <textarea
                  name="description"
                  rows={5}
                  value={form.description}
                  onChange={onChange}
                  className="w-full rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-2.5"
                />
                <Err name="description" />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Ảnh sản phẩm</h2>
            </div>
            <div className="p-5">
              <div className="flex items-start gap-4 flex-col md:flex-row">
                <div className="w-40 h-40 rounded-lg border border-dashed border-gray-300 overflow-hidden bg-gray-50 flex items-center justify-center">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400 text-sm">Không có ảnh</span>
                  )}
                </div>
                <div className="flex-1">
                  <Label>Đổi ảnh (tuỳ chọn)</Label>
                  <input
                    type="file"
                    name="thumbnail"
                    accept="image/*"
                    onChange={onChange}
                    className="block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <Help>Nếu không chọn, hệ thống giữ ảnh cũ.</Help>
                  <Err name="thumbnail" />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* sidebar hành động */}
        <div className="space-y-6">
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Hành động</h2>
            </div>
            <div className="p-5 space-y-3">
              <button
                type="submit"
                disabled={saving}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-white font-medium hover:bg-blue-700 disabled:bg-gray-400"
              >
                {saving ? "Đang lưu…" : "Lưu thay đổi"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/admin/products")}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
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
