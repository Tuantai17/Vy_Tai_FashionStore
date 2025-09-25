import { useState } from "react";

const dummy = [
  { id: 1001, customer: "Nguyễn An", total: 850000, status: "Pending" },
  { id: 1002, customer: "Trần Bình", total: 1250000, status: "Completed" },
];

const badge = (status) => ({
  display: "inline-block",
  padding: "2px 8px",
  borderRadius: 999,
  background: status === "Completed" ? "#e7f9ee" : "#fff6e6",
  color: status === "Completed" ? "#0a7a3f" : "#a35b00",
  fontSize: 12,
});

export default function Orders() {
  const [orders] = useState(dummy);

  return (
    <section>
      <h1 style={{ fontSize: 24, marginBottom: 12 }}>Orders</h1>
      <table width="100%" cellPadding={8} style={{ borderCollapse: "collapse", background: "#fff" }}>
        <thead>
          <tr style={{ background: "#fafafa" }}>
            <th align="left">Order #</th>
            <th align="left">Khách hàng</th>
            <th align="right">Tổng tiền</th>
            <th align="left">Trạng thái</th>
            <th align="center">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.id} style={{ borderTop: "1px solid #eee" }}>
              <td>{o.id}</td>
              <td>{o.customer}</td>
              <td align="right">₫{o.total.toLocaleString("vi-VN")}</td>
              <td><span style={badge(o.status)}>{o.status}</span></td>
              <td align="center">
                <button onClick={() => alert("View " + o.id)}>Xem</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
