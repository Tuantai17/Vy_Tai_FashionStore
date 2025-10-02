import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000/api";
const VND = new Intl.NumberFormat("vi-VN");

const badgeTone = (status) => {
  const code = String(status).toLowerCase();
  if (code.includes("complete") || code === "1") {
    return "admin-pill admin-pill--success";
  }
  if (code.includes("cancel") || code === "2") {
    return "admin-pill admin-pill--danger";
  }
  return "admin-pill admin-pill--warning";
};

const humanStatus = (s) => {
  if (typeof s === "string") return s;
  switch (Number(s)) {
    case 0:
      return "Pending";
    case 1:
      return "Completed";
    case 2:
      return "Cancelled";
    default:
      return "Unknown";
  }
};

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await fetch(`${API_BASE}/orders/${id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!ignore) setOrder(data);
      } catch (e) {
        console.error(e);
        if (!ignore) setErr("Khong tai duoc chi tiet don hang.");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [id]);

  if (loading) return <div className="admin-form-card">Dang tai...</div>;
  if (err) return <p className="admin-form-error">{err}</p>;
  if (!order) return <p className="admin-form-error">Khong tim thay don hang.</p>;

  const items = order.items || [];
  const total = Number(order.total ?? items.reduce((s, i) => s + Number(i.price || 0) * Number(i.qty || 0), 0));

  return (
    <section className="admin-form-card admin-form-card--wide">
      <div className="admin-form-heading">
        <div className="admin-form-icon admin-form-icon--folder">📦</div>
        <div>
          <h1 className="admin-form-title">Don hang #{order.id}</h1>
          <p className="admin-form-subtitle">Chi tiet giao dich va danh sach san pham.</p>
        </div>
        <Link to="/admin/orders" className="admin-link-button">
          ← Quay lai
        </Link>
      </div>

      <div className="admin-order-panels">
        <article className="admin-section-card">
          <header className="admin-section-card__header">
            <h2 className="admin-section-card__title">Thong tin khach hang</h2>
          </header>
          <div className="admin-section-card__body admin-order-info">
            <div>
              <span className="admin-order-info__label">Ten</span>
              <span className="admin-order-info__value">{order.name}</span>
            </div>
            <div>
              <span className="admin-order-info__label">Email</span>
              <span className="admin-order-info__value">{order.email || "--"}</span>
            </div>
            <div>
              <span className="admin-order-info__label">SDT</span>
              <span className="admin-order-info__value">{order.phone || "--"}</span>
            </div>
            <div>
              <span className="admin-order-info__label">Dia chi</span>
              <span className="admin-order-info__value">{order.address || "--"}</span>
            </div>
            {order.note && (
              <div>
                <span className="admin-order-info__label">Ghi chu</span>
                <span className="admin-order-info__value">{order.note}</span>
              </div>
            )}
          </div>
        </article>

        <article className="admin-section-card">
          <header className="admin-section-card__header">
            <h2 className="admin-section-card__title">Trang thai</h2>
          </header>
          <div className="admin-section-card__body admin-order-status">
            <span className={badgeTone(order.status)}>{humanStatus(order.status)}</span>
            <div>
              <span className="admin-order-info__label">Tao luc</span>
              <span className="admin-order-info__value">
                {order.created_at ? new Date(order.created_at).toLocaleString() : "--"}
              </span>
            </div>
            {order.updated_at && (
              <div>
                <span className="admin-order-info__label">Cap nhat</span>
                <span className="admin-order-info__value">
                  {new Date(order.updated_at).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </article>
      </div>

      <section className="admin-section-card">
        <header className="admin-section-card__header">
          <h2 className="admin-section-card__title">San pham</h2>
        </header>
        <div className="admin-section-card__body">
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>San pham</th>
                  <th>Anh</th>
                  <th className="text-right">Gia</th>
                  <th className="text-right">SL</th>
                  <th className="text-right">Tam tinh</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => {
                  const price = Number(it.price ?? 0);
                  const qty = Number(it.qty ?? 0);
                  const subtotal = Number(it.subtotal ?? price * qty);
                  const name = it.product_name || it.name || "San pham";
                  const img = it.product_image;

                  return (
                    <tr key={it.id || `${idx}-${name}`}>
                      <td>{idx + 1}</td>
                      <td>
                        <div className="admin-table-product">
                          <span className="admin-table-product__name">{name}</span>
                          {it.variant && <span className="admin-table-product__meta">{it.variant}</span>}
                        </div>
                      </td>
                      <td>
                        {img ? (
                          <img
                            src={img}
                            alt={name}
                            className="admin-table-thumb"
                            onError={(e) => (e.currentTarget.src = "https://placehold.co/64")}
                          />
                        ) : (
                          <span className="admin-table-thumb admin-table-thumb--empty">--</span>
                        )}
                      </td>
                      <td className="text-right">₫{VND.format(price)}</td>
                      <td className="text-right">{qty}</td>
                      <td className="text-right">₫{VND.format(subtotal)}</td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-muted">Khong co san pham trong don hang.</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4}></td>
                  <td className="text-right">Tong cong</td>
                  <td className="text-right">₫{VND.format(total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </section>
    </section>
  );
}
