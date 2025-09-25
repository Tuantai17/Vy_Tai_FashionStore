export default function Dashboard() {
  const cards = [
    { label: "Doanh thu hôm nay", value: "₫12,500,000" },
    { label: "Đơn hàng mới", value: "38" },
    { label: "Sản phẩm tồn kho thấp", value: "7" },
    { label: "Người dùng mới", value: "15" },
  ];

  return (
    <section>
      <h1 style={{ fontSize: 24, marginBottom: 12 }}>Dashboard</h1>

      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 12
      }}>
        {cards.map(c => (
          <div key={c.label} style={{ background: "#fff", border: "1px solid #eee", borderRadius: 10, padding: 16 }}>
            <div style={{ color: "#666", marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{c.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
