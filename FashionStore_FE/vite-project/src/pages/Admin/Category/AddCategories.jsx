import { useEffect, useMemo, useRef, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const toSlug = (v) =>
  v.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

export default function AddCategory() {
  const [form, setForm] = useState({
    name: "",
    slug: "",
    status: "active",
    description: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [kw, setKw] = useState("");
  const [kwTyping, setKwTyping] = useState("");
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1 });
  const typingTimer = useRef(null);

  // debounce search
  useEffect(() => {
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setKw(kwTyping.trim()), 300);
    return () => clearTimeout(typingTimer.current);
  }, [kwTyping]);

  // fetch list
  useEffect(() => {
    let aborted = false;
    const ac = new AbortController();

    (async () => {
      try {
        setError("");
        const url = new URL(`${API}/api/categories`);
        url.searchParams.set("page", page);
        if (kw) url.searchParams.set("q", kw);

        const res = await fetch(url, { signal: ac.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const list = Array.isArray(data) ? data : data.data ?? [];
        if (!aborted) {
          setRows(list);
          setMeta({
            current_page: (Array.isArray(data) ? 1 : data.current_page) ?? 1,
            last_page: (Array.isArray(data) ? 1 : data.last_page) ?? 1,
          });
        }
      } catch (e) {
        if (!aborted) setError("Không tải được danh mục");
      }
    })();

    return () => {
      aborted = true;
      ac.abort();
    };
  }, [page, kw]);

  // form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => {
      if (name === "name" && (f.slug || "").trim() === "") {
        return { ...f, name: value, slug: toSlug(value) };
      }
      return { ...f, [name]: value };
    });
  };

  const handleSlugBlur = () => {
    if (form.slug) setForm((f) => ({ ...f, slug: toSlug(f.slug) }));
  };

  const clientValidate = () => {
    if (!form.name.trim()) return "Vui lòng nhập tên danh mục.";
    if (form.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug))
      return "Slug chỉ gồm a-z, 0-9 và dấu gạch ngang.";
    return "";
  };

  const parseLaravel422 = async (res) => {
    try {
      const j = await res.json();
      const msg = Object.values(j.errors || {}).flat().join("; ");
      return msg || "Dữ liệu không hợp lệ";
    } catch {
      return "Dữ liệu không hợp lệ";
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setOk("");

    const msg = clientValidate();
    if (msg) return setError(msg);

    setSaving(true);
    try {
      const res = await fetch(`${API}/api/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.status === 422) throw new Error(await parseLaravel422(res));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setOk(data.message || "Đã lưu");
      setForm({ name: "", slug: "", status: "active", description: "" });

      // refresh list
      setPage(1);
      setKwTyping("");
      setKw("");
    } catch (e) {
      setError(e.message || "Lỗi lưu dữ liệu");
    } finally {
      setSaving(false);
    }
  };

  const canPrev = useMemo(() => meta.current_page > 1, [meta]);
  const canNext = useMemo(() => meta.current_page < meta.last_page, [meta]);

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">Thêm danh mục</h1>

      <form onSubmit={submit} className="grid max-w-xl gap-4 rounded-2xl bg-white p-5 shadow">
        {error && <div className="rounded bg-red-100 p-3 text-red-700">{error}</div>}
        {ok && <div className="rounded bg-green-100 p-3 text-green-700">{ok}</div>}

        <div>
          <label className="mb-1 block text-sm font-medium">Tên danh mục</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full rounded-lg border px-3 py-2 outline-none focus:ring"
            placeholder="Ví dụ: Áo sơ mi"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Slug (tùy chọn)</label>
          <input
            name="slug"
            value={form.slug}
            onChange={handleChange}
            onBlur={handleSlugBlur}
            className="w-full rounded-lg border px-3 py-2 outline-none focus:ring"
            placeholder="ao-so-mi"
          />
          <p className="mt-1 text-xs text-gray-500">Để trống sẽ tự sinh từ tên.</p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Trạng thái</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full rounded-lg border px-3 py-2 outline-none focus:ring"
          >
            <option value="active">Kích hoạt</option>
            <option value="inactive">Tạm ẩn</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Mô tả</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            className="w-full rounded-lg border px-3 py-2 outline-none focus:ring"
            placeholder="Mô tả ngắn..."
          />
        </div>

        <div className="flex items-center gap-2">
          <button disabled={saving} className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-50">
            {saving ? "Đang lưu..." : "Lưu danh mục"}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => setForm({ name: "", slug: "", status: "active", description: "" })}
            className="rounded-xl border px-4 py-2"
          >
            Làm mới
          </button>
        </div>
      </form>

      {/* List */}
      <div className="mt-10">
        <div className="mb-3 flex items-center gap-2">
          <input
            value={kwTyping}
            onChange={(e) => { setKwTyping(e.target.value); setPage(1); }}
            className="rounded-lg border px-3 py-2"
            placeholder="Tìm danh mục..."
          />
          <button
            onClick={() => { setKwTyping(""); setKw(""); setPage(1); }}
            className="rounded-lg border px-3 py-2"
          >
            Xóa tìm
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl bg-white shadow">
          <table className="min-w-full border">
            <thead className="bg-gray-50">
              <tr>
                <th className="border p-3 text-left">ID</th>
                <th className="border p-3 text-left">Tên</th>
                <th className="border p-3 text-left">Slug</th>
                <th className="border p-3 text-left">Trạng thái</th>
                <th className="border p-3 text-left">Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="odd:bg-white even:bg-gray-50">
                  <td className="border p-3">{r.id}</td>
                  <td className="border p-3">{r.name}</td>
                  <td className="border p-3">{r.slug}</td>
                  <td className="border p-3">{r.status}</td>
                  <td className="border p-3">{r.created_at ? String(r.created_at).slice(0, 10) : "—"}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="border p-3" colSpan={5}>Không có dữ liệu</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {meta.last_page > 1 && (
          <div className="mt-3 flex items-center gap-2">
            <button
              disabled={!canPrev}
              onClick={() => canPrev && setPage((p) => p - 1)}
              className="rounded-lg border px-3 py-1 disabled:opacity-50"
            >
              ← Trước
            </button>
            <span className="text-sm text-gray-600">
              Trang {meta.current_page}/{meta.last_page}
            </span>
            <button
              disabled={!canNext}
              onClick={() => canNext && setPage((p) => p + 1)}
              className="rounded-lg border px-3 py-1 disabled:opacity-50"
            >
              Sau →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
