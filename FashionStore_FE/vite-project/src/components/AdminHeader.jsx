export default function AdminHeader() {
  return (
    <div style={{
      height: 60, display: "flex", alignItems: "center",
      justifyContent: "space-between", padding: "0 16px"
    }}>
      <strong>Admin Panel</strong>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <input
          placeholder="Search…"
          style={{ height: 34, padding: "0 10px", border: "1px solid #ddd", borderRadius: 6, minWidth: 220 }}
        />
        <div style={{
          width: 34, height: 34, borderRadius: "50%", background: "#0f62fe",
          color: "#fff", display: "grid", placeItems: "center", fontWeight: 700
        }}>A</div>
      </div>
    </div>
  );
}
