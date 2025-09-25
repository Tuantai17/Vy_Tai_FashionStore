export default function CategoryCard({ id, name, icon, selected, onSelect }) {
  return (
    <div
      onClick={() => onSelect(id)}
      style={{
        background: selected ? "#c8e6c9" : "#fff",
        borderRadius: 12,
        boxShadow: "0 2px 8px #e0f2f1",
        padding: "24px 32px",
        minWidth: 120,
        textAlign: "center",
        fontWeight: 500,
        fontSize: 17,
        color: "#388e3c",
        cursor: "pointer",
        transition: "transform 0.2s",
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
      {name}
    </div>
  )
}
