import { Link } from "react-router-dom";

const PLACEHOLDER = "https://placehold.co/300x200?text=No+Image";

export default function ProductCard({ p }) {
  const price = Number(p.price) || 0;
  const imgSrc = p.image || p.thumbnail_url || p.thumbnail || PLACEHOLDER;

  return (
    <div className="product-card">
      <Link to={`/products/${p.id}`} className="product-card__link">
        <div className="product-image">
          <img
            src={imgSrc}
            alt={p.name}
            className="product-image__img"
            onError={(e) => {
              e.currentTarget.src = PLACEHOLDER;
            }}
          />
        </div>

        <div className="product-info">
          <div className="name">{p.name}</div>
          <div className="brand">{p.brand_name ? `${p.brand_name}` : "Farm Local"}</div>

          <div className="price">{price.toLocaleString()} VND</div>
        </div>
      </Link>
    </div>
  );
}
