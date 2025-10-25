import { useEffect, useMemo, useState } from "react";
import { apiDelete, apiGet, apiPost, apiPut } from "../../../lib/api";

const blankForm = {
  id: null,
  code: "",
  type: "fixed",
  value: "",
  min_order_total: "",
  max_uses: "",
  expires_at: "",
  is_active: true,
};

const formatCurrency = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(n || 0));

const formatDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${d.toLocaleDateString("vi-VN")} ${d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);

  const isEditing = useMemo(() => Boolean(form.id), [form.id]);

  useEffect(() => {
    loadCoupons(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const loadCoupons = async (targetPage = 1) => {
    try {
      setLoading(true);
      setError("");
      const res = await apiGet("/admin/coupons", { auth: true, authRole: "admin", query: { page: targetPage } });

      const data = Array.isArray(res) ? res : res?.data ?? [];
      const meta = res?.meta ?? res;

      setCoupons(data);
      setLastPage(Number(meta?.last_page ?? 1));
      setTotal(Number(meta?.total ?? data.length));
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách mã giảm giá.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(blankForm);
    setSaving(false);
  };

  const onChange = (field, value) => {
    if (field === "code") value = value.toUpperCase();
    if (field === "is_active") value = Boolean(value);
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const populateForm = (coupon) => {
    setForm({
      id: coupon.id,
      code: coupon.code ?? "",
      type: coupon.type ?? "fixed",
      value: coupon.value ?? "",
      min_order_total: coupon.min_order_total ?? "",
      max_uses: coupon.max_uses ?? "",
      expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 16) : "",
      is_active: Boolean(coupon.is_active),
    });
    setMessage("");
    setError("");
  };

  const normalizePayload = () => {
    const payload = {
      code: form.code.trim(),
      type: form.type,
      value: Number(form.value || 0),
      min_order_total:
        form.min_order_total === "" ? null : Number(form.min_order_total),
      max_uses: form.max_uses === "" ? null : Number(form.max_uses),
      expires_at: form.expires_at || null,
      is_active: Boolean(form.is_active),
    };
    if (!payload.code) {
      throw new Error("Vui lòng nhập mã giảm giá.");
    }
    if (payload.value <= 0) {
      throw new Error("Giá trị giảm phải lớn hơn 0.");
    }
    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      setMessage("");
      const payload = normalizePayload();

      if (isEditing) {
        await apiPut(`/admin/coupons/${form.id}`, payload, { auth: true, authRole: "admin" });
        setMessage("Đã cập nhật mã giảm giá.");
      } else {
        await apiPost("/admin/coupons", payload, { auth: true, authRole: "admin" });
        setMessage("Đã tạo mã giảm giá mới.");
      }

      resetForm();
      await loadCoupons(page);
    } catch (err) {
      console.error(err);
      setError(err.message || "Không thể lưu mã giảm giá.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (coupon) => {
    if (!window.confirm(`Xoá mã ${coupon.code}?`)) return;
    try {
      await apiDelete(`/admin/coupons/${coupon.id}`, { auth: true, authRole: "admin" });
      setMessage(`Đã xoá mã ${coupon.code}.`);
      if (coupons.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        loadCoupons(page);
      }
    } catch (err) {
      console.error(err);
      setError("Không thể xoá mã giảm giá.");
    }
  };

  const remainingUses = (coupon) => {
    if (coupon.max_uses == null) return "∞";
    return Math.max(0, Number(coupon.max_uses) - Number(coupon.used_count || 0));
  };

  return (
    <div style={{ position: "relative", zIndex: 1 }}>
      <header
        style={{
          marginBottom: 18,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#fff" }}>Coupon Manager</h1>
          <p style={{ margin: "6px 0 0", color: "rgba(255,255,255,.75)" }}>
            Tạo, chỉnh sửa và theo dõi hiệu lực mã giảm giá.
          </p>
        </div>
      </header>

      {(error || message) && (
        <div
          style={{
            marginBottom: 16,
            padding: "12px 16px",
            borderRadius: 12,
            background: error ? "rgba(239,68,68,.15)" : "rgba(16,185,129,.15)",
            border: `1px solid ${error ? "rgba(239,68,68,.4)" : "rgba(16,185,129,.35)"}`,
            color: error ? "#fee2e2" : "#dcfce7",
            fontWeight: 500,
          }}
        >
          {error || message}
        </div>
      )}

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{
            background: "rgba(15,23,42,.85)",
            borderRadius: 18,
            padding: 20,
            border: "1px solid rgba(255,255,255,.05)",
            boxShadow: "0 18px 40px rgba(8,18,44,.35)",
          }}
        >
          <h2 style={{ margin: 0, marginBottom: 16, color: "#fff" }}>
            {isEditing ? `Chỉnh sửa mã #${form.code}` : "Tạo mã giảm giá"}
          </h2>

          <div style={{ display: "grid", gap: 14 }}>
            <label style={{ color: "#cbd5f5", fontSize: 13 }}>
              Mã giảm giá *
              <input
                value={form.code}
                onChange={(e) => onChange("code", e.target.value)}
                style={inputStyle}
                required
              />
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label style={{ color: "#cbd5f5", fontSize: 13 }}>
                Loại mã
                <select
                  value={form.type}
                  onChange={(e) => onChange("type", e.target.value)}
                  style={{ ...inputStyle, height: 40 }}
                >
                  <option value="fixed">Giảm cố định</option>
                  <option value="percent">Giảm theo %</option>
                </select>
              </label>

              <label style={{ color: "#cbd5f5", fontSize: 13 }}>
                Giá trị *
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.value}
                  onChange={(e) => onChange("value", e.target.value)}
                  style={inputStyle}
                  required
                />
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label style={{ color: "#cbd5f5", fontSize: 13 }}>
                Đơn tối thiểu
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.min_order_total}
                  onChange={(e) => onChange("min_order_total", e.target.value)}
                  style={inputStyle}
                  placeholder="0"
                />
              </label>

              <label style={{ color: "#cbd5f5", fontSize: 13 }}>
                Lượt dùng tối đa
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.max_uses}
                  onChange={(e) => onChange("max_uses", e.target.value)}
                  style={inputStyle}
                  placeholder="Không giới hạn"
                />
              </label>
            </div>

            <label style={{ color: "#cbd5f5", fontSize: 13 }}>
              Hạn sử dụng
              <input
                type="datetime-local"
                value={form.expires_at}
                onChange={(e) => onChange("expires_at", e.target.value)}
                style={inputStyle}
              />
            </label>

            <label style={{ color: "#cbd5f5", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => onChange("is_active", e.target.checked)}
              />
              Đang kích hoạt
            </label>
          </div>

          <div style={{ marginTop: 18, display: "flex", gap: 12 }}>
            <button
              type="submit"
              disabled={saving}
              style={primaryBtn}
            >
              {saving ? "Đang lưu..." : isEditing ? "Cập nhật" : "Tạo mã"}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                style={secondaryBtn}
              >
                Hủy
              </button>
            )}
          </div>
        </form>

        <div
          style={{
            background: "rgba(15,23,42,.75)",
            borderRadius: 18,
            padding: 0,
            border: "1px solid rgba(255,255,255,.05)",
            boxShadow: "0 18px 40px rgba(8,18,44,.35)",
            overflow: "hidden",
            minHeight: 420,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
            <h2 style={{ margin: 0, color: "#fff", fontSize: 20 }}>Danh sách mã</h2>
            <p style={{ margin: "6px 0 0", color: "rgba(226,232,240,.8)", fontSize: 13 }}>
              Tổng cộng {total} mã. Bấm vào mã để chỉnh sửa nhanh.
            </p>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(15,23,42,.9)", color: "#cbd5f5" }}>
                  <th style={thStyle}>Mã</th>
                  <th style={thStyle}>Loại</th>
                  <th style={thStyle}>Giá trị</th>
                  <th style={thStyle}>Đơn tối thiểu</th>
                  <th style={thStyle}>Sử dụng</th>
                  <th style={thStyle}>Hết hạn</th>
                  <th style={thStyle}>Trạng thái</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} style={tdEmptyStyle}>
                      Đang tải...
                    </td>
                  </tr>
                ) : coupons.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={tdEmptyStyle}>
                      Chưa có mã giảm giá nào.
                    </td>
                  </tr>
                ) : (
                  coupons.map((coupon) => {
                    const expires = coupon.expires_at ? new Date(coupon.expires_at) : null;
                    const expired = expires && expires.getTime() < Date.now();
                    const badge = expired
                      ? { text: "Hết hạn", bg: "rgba(239,68,68,.15)", color: "#fecaca", border: "rgba(239,68,68,.35)" }
                      : coupon.is_active
                      ? { text: "Đang chạy", bg: "rgba(16,185,129,.1)", color: "#bbf7d0", border: "rgba(16,185,129,.3)" }
                      : { text: "Tạm tắt", bg: "rgba(148,163,184,.1)", color: "#cbd5f5", border: "rgba(148,163,184,.3)" };

                    return (
                      <tr key={coupon.id} style={{ borderBottom: "1px solid rgba(255,255,255,.04)" }}>
                        <td
                          style={tdStyle}
                          onClick={() => populateForm(coupon)}
                        >
                          <span style={{ fontWeight: 700, color: "#fff", cursor: "pointer" }}>
                            {coupon.code}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          {coupon.type === "percent" ? "Giảm %" : "Giảm tiền"}
                        </td>
                        <td style={tdStyle}>
                          {coupon.type === "percent"
                            ? `${coupon.value}%`
                            : formatCurrency(coupon.value)}
                        </td>
                        <td style={tdStyle}>{formatCurrency(coupon.min_order_total)}</td>
                        <td style={tdStyle}>
                          {coupon.used_count || 0}/{coupon.max_uses ?? "∞"} (
                          còn {remainingUses(coupon)})
                        </td>
                        <td style={tdStyle}>{formatDateTime(coupon.expires_at)}</td>
                        <td style={tdStyle}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "2px 10px",
                              borderRadius: 999,
                              fontSize: 12,
                              background: badge.bg,
                              color: badge.color,
                              border: `1px solid ${badge.border}`,
                              fontWeight: 600,
                            }}
                          >
                            {badge.text}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: "right" }}>
                          <button
                            type="button"
                            onClick={() => populateForm(coupon)}
                            style={rowBtn}
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(coupon)}
                            style={{ ...rowBtn, background: "rgba(239,68,68,.15)", color: "#fecaca" }}
                          >
                            Xoá
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {lastPage > 1 && (
            <div
              style={{
                padding: "12px 20px",
                borderTop: "1px solid rgba(255,255,255,.04)",
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
              }}
            >
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={pagerBtn}
              >
                Trước
              </button>
              <span style={{ color: "#cbd5f5", padding: "6px 10px" }}>
                Trang {page}/{lastPage}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                disabled={page >= lastPage}
                style={pagerBtn}
              >
                Sau
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

const inputStyle = {
  marginTop: 6,
  width: "100%",
  height: 38,
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,.1)",
  padding: "8px 12px",
  background: "rgba(15,23,42,.65)",
  color: "#fff",
  outline: "none",
};

const primaryBtn = {
  padding: "10px 18px",
  borderRadius: 10,
  border: "none",
  background: "linear-gradient(135deg,#22d3ee,#6366f1)",
  color: "#0f172a",
  fontWeight: 700,
  cursor: "pointer",
  minWidth: 120,
};

const secondaryBtn = {
  padding: "10px 18px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,.25)",
  background: "transparent",
  color: "#e2e8f0",
  fontWeight: 600,
  cursor: "pointer",
};

const thStyle = {
  textAlign: "left",
  padding: "12px 18px",
  fontSize: 13,
  textTransform: "uppercase",
  letterSpacing: 0.6,
};

const tdStyle = {
  padding: "14px 18px",
  color: "#e2e8f0",
  fontSize: 14,
  verticalAlign: "middle",
};

const tdEmptyStyle = {
  padding: "24px 18px",
  textAlign: "center",
  color: "rgba(226,232,240,.7)",
};

const rowBtn = {
  border: "none",
  padding: "6px 12px",
  borderRadius: 8,
  marginLeft: 6,
  background: "rgba(59,130,246,.18)",
  color: "#bfdbfe",
  cursor: "pointer",
};

const pagerBtn = {
  padding: "6px 12px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,.18)",
  background: "transparent",
  color: "#e2e8f0",
  cursor: "pointer",
  minWidth: 68,
};
