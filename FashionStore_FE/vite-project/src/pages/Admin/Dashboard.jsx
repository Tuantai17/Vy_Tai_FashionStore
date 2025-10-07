// export default function Dashboard() {
//   const cards = [
//     { label: "Doanh thu hôm nay", value: "₫12,500,000" },
//     { label: "Đơn hàng mới", value: "38" },
//     { label: "Sản phẩm tồn kho thấp", value: "7" },
//     { label: "Người dùng mới", value: "15" },
//   ];

//   return (
//     <section>
//       <h1 style={{ fontSize: 24, marginBottom: 12 }}>Dashboard</h1>

//       <div style={{
//         display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 12
//       }}>
//         {cards.map(c => (
//           <div key={c.label} style={{ background: "#fff", border: "1px solid #eee", borderRadius: 10, padding: 16 }}>
//             <div style={{ color: "#666", marginBottom: 6 }}>{c.label}</div>
//             <div style={{ fontSize: 22, fontWeight: 700 }}>{c.value}</div>
//           </div>
//         ))}
//       </div>
//     </section>
//   );
// }



export default function Dashboard() {
  // ── Top metric cards (giữ cấu trúc cũ) ───────────────────────────────
  const cards = [
    { label: "Doanh thu hôm nay", value: "₫12,500,000", accent: "#ef476f" },
    { label: "Đơn hàng mới", value: "38", accent: "#f77f00" },
    { label: "Sản phẩm tồn kho thấp", value: "7", accent: "#ffd166" },
    { label: "Người dùng mới", value: "15", accent: "#06b6b6" },
  ];

  // ── Reviews / Projects / Orders (demo data) ─────────────────────────
  const reviews = [
    { label: "Positive Reviews", value: 93, color: "#22c55e" },
    { label: "Neutral Reviews", value: 5, color: "#f59e0b" },
    { label: "Negative Reviews", value: 2, color: "#ef4444" },
  ];

  const projects = [
    { name: "Soft UI v2 Version", members: ["🧑‍🎨","👩‍💻","👨‍💻"], budget: "$12,800", progress: 87, color:"#22c55e" },
    { name: "Add Progress Track", members: ["👩‍💻","🧑‍💻"], budget: "$3,200", progress: 52, color:"#3b82f6" },
    { name: "Fix Platform Errors", members: ["🧑‍🎨"], budget: "TBD", progress: 36, color:"#f59e0b" },
    { name: "Launch new Mobile App", members: ["👨‍💻","👩‍💻","🧑‍🎨"], budget: "$21,000", progress: 73, color:"#a855f7" },
    { name: "Redesign Shop (Fashion)", members: ["🧑‍🎨","👩‍💻"], budget: "$8,500", progress: 28, color:"#ef4444" },
  ];

  const orders = [
    { id: "#982430", label: "Order changed (size)", time: "2h", color:"#22c55e" },
    { id: "#982428", label: "New order #982428", time: "3h", color:"#3b82f6" },
    { id: "#982425", label: "Shipped to HN", time: "5h", color:"#f59e0b" },
    { id: "#982419", label: "Payment captured", time: "6h", color:"#06b6b6" },
    { id: "#982409", label: "Refund request opened", time: "1d", color:"#ef4444" },
  ];

  // ── Reusable styles ─────────────────────────────────────────────────
  const cardShell = {
    background: "linear-gradient(180deg, rgba(255,255,255,.92), rgba(255,255,255,.86))",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    border: "1px solid rgba(0,0,0,.06)",
    borderRadius: 14,
    boxShadow: "0 8px 18px rgba(3,10,27,.1), inset 0 1px 0 rgba(255,255,255,.5)",
  };

  const Bar = ({ value, color }) => (
    <div style={{height: 8, background: "rgba(0,0,0,.06)", borderRadius: 999, overflow:"hidden"}}>
      <div style={{width: `${value}%`, height: "100%", background: color, borderRadius: 999, boxShadow:"0 0 10px rgba(0,0,0,.08)"}} />
    </div>
  );

  return (
    <section style={{ ...cardShell, padding: 18 }}>
      {/* Heading */}
      <h1
        style={{
          fontSize: 28,
          marginBottom: 14,
          fontWeight: 800,
          color: "#1f2937",
          letterSpacing: .2,
          textShadow: "0 1px 0 rgba(255,255,255,.6)",
        }}
      >
        Dashboard
      </h1>

      {/* TOP CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(220px,1fr))",
          gap: 14,
          marginBottom: 16,
        }}
      >
        {cards.map((c) => (
          <div
            key={c.label}
            style={{
              ...cardShell,
              padding: 16,
              transition: "transform .15s ease, box-shadow .15s ease",
            }}
            onMouseEnter={(e)=>{e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 12px 24px rgba(3,10,27,.16)";}}
            onMouseLeave={(e)=>{e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow=cardShell.boxShadow;}}
          >
            <div style={{ color: "#6b7280", marginBottom: 8, fontWeight: 600 }}>{c.label}</div>
            <div style={{ fontSize: 30, fontWeight: 900, color: c.accent }}>{c.value}</div>
            <div style={{ height: 4, marginTop: 10, borderRadius: 999, background: `linear-gradient(90deg, ${c.accent}, transparent)` , opacity:.35}} />
          </div>
        ))}
      </div>

      {/* ROW 2 : Reviews */}
      <div style={{ ...cardShell, padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
          <strong style={{ fontSize: 16, color: "#111827" }}>Reviews</strong>
          <span style={{ marginLeft: 8, fontSize: 12, color: "#6b7280" }}>90% this month</span>
        </div>
        {reviews.map((r) => (
          <div key={r.label} style={{ display: "grid", gridTemplateColumns: "180px 1fr 60px", gap: 10, alignItems: "center", marginBottom: 8 }}>
            <span style={{ color: "#374151", fontWeight: 600 }}>{r.label}</span>
            <Bar value={r.value} color={r.color}/>
            <span style={{ textAlign: "right", color: "#374151", fontWeight: 700 }}>{r.value}%</span>
          </div>
        ))}
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>
          Hơn 200,000 khách đã mua sắm tại FashionStore tháng này.
        </div>
      </div>

      {/* ROW 3 : Projects + Orders overview */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr .8fr",
          gap: 16,
        }}
      >
        {/* Projects */}
        <div style={{ ...cardShell, padding: 14 }}>
          <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", marginBottom: 8 }}>
            <strong style={{ fontSize: 16, color: "#111827" }}>Projects</strong>
            <span style={{ fontSize:12, color:"#6b7280" }}>{projects.length} dự án</span>
          </div>

          <div>
            {projects.map((p, i)=>(
              <div key={p.name} style={{ display:"grid", gridTemplateColumns:"1fr 140px 90px 120px", gap:12, alignItems:"center", padding:"10px 6px", borderBottom: i===projects.length-1? "none":"1px dashed rgba(0,0,0,.08)" }}>
                <div style={{ color:"#111827", fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</div>
                <div style={{ fontSize:18 }}>{p.members.join(" ")}</div>
                <div style={{ color:"#374151", fontWeight:700 }}>{p.budget}</div>
                <div>
                  <Bar value={p.progress} color={p.color}/>
                  <div style={{ fontSize:12, color:"#6b7280", marginTop:4 }}>{p.progress}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Orders overview */}
        <div style={{ ...cardShell, padding: 14 }}>
          <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", marginBottom: 8 }}>
            <strong style={{ fontSize: 16, color: "#111827" }}>Orders overview</strong>
            <span style={{ fontSize:12, color:"#6b7280" }}>24h gần đây</span>
          </div>

          <ul style={{ listStyle:"none", padding:0, margin:0 }}>
            {orders.map((o)=>(
              <li key={o.id} style={{ display:"grid", gridTemplateColumns:"16px 1fr 56px", gap:10, alignItems:"center", padding:"10px 6px" }}>
                <span style={{ width:10, height:10, borderRadius:"50%", background:o.color, boxShadow:`0 0 10px ${o.color}` }} />
                <div style={{ color:"#111827" }}>
                  <strong style={{ fontWeight:700, marginRight:6 }}>{o.id}</strong>
                  <span style={{ color:"#374151" }}>{o.label}</span>
                </div>
                <span style={{ textAlign:"right", color:"#6b7280", fontSize:12 }}>{o.time}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
