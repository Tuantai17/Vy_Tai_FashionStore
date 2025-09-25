// src/components/CategorySection.jsx
import { Link } from "react-router-dom";
import CategoryCard from "./CategoryCard";

const categories = [
  { id: 1, name: "Rau lá", icon: "🥬" },
  { id: 2, name: "Củ quả", icon: "🥕" },
  { id: 3, name: "Trái cây", icon: "🍎" },
  { id: 4, name: "Hữu cơ", icon: "🌱" },
];

export default function CategorySection() {
  return (
    <section style={{ margin: "40px 0" }}>
      <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 18, color: "#388e3c" }}>
        Danh mục nổi bật
      </h2>
      <div style={{ display:"flex", gap:24, justifyContent:"center", flexWrap:"wrap" }}>
        {categories.map(c => (
          <Link key={c.id} to={`/category/${c.id}`} style={{ textDecoration:"none" }}>
            <CategoryCard id={c.id} name={c.name} icon={c.icon} />
          </Link>
        ))}
      </div>
    </section>
  );
}
