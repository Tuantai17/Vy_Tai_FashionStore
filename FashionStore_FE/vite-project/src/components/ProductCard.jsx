import { Link } from "react-router-dom";

const PLACEHOLDER = "https://placehold.co/300x200?text=No+Image";

export default function ProductCard({ p }) {
  const price = Number(p.price) || 0;
  const imgSrc = p.image || p.thumbnail_url || p.thumbnail || PLACEHOLDER;

  return (
    <>
      <style>
        {`
          .product-card{
            background:#fff;
            border-radius:12px;
            box-shadow:0 2px 10px rgba(0,0,0,.08);
            overflow:hidden;
            display:flex;
            flex-direction:column;
            transition:transform .15s ease, box-shadow .15s ease;
          }
          .product-card:hover{
            transform:translateY(-2px);
            box-shadow:0 6px 18px rgba(0,0,0,.12);
          }
          .product-card__link{
            display:flex;
            flex-direction:column;
            text-decoration:none;
            color:inherit;
            height:100%;
          }
          .product-image{
            position:relative;
            width:100%;
            aspect-ratio:1/1;
            overflow:hidden;
            background:#f6f7f9;
          }
          .product-image__img{
            position:absolute; inset:0;
            width:100%; height:100%;
            object-fit:cover;
            transition:transform .25s ease;
          }
          .product-card:hover .product-image__img{ transform:scale(1.04); }

          .product-info{
            display:flex;
            flex-direction:column;
            gap:6px;
            padding:12px;
            flex:1;
            min-height:0;
          }

          /* ====== tên sản phẩm: luôn 2 dòng ====== */
          .product-info .name{
            font-size:15px;
            font-weight:600;
            color:#111;
            line-height:1.4;
            display:-webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
            overflow: hidden;
            height: 2.8em; /* 2 dòng (1.4 * 2) */
          }

          .product-info .brand{
            font-size:13px;
            color:#6b7280;
            white-space:nowrap;
            overflow:hidden;
            text-overflow:ellipsis;
          }
          .product-info .price{
            margin-top:auto;
            font-weight:700;
            font-size:15px;
            color:#2e7d32;
          }
        `}
      </style>

      <div className="product-card">
        <Link to={`/products/${p.id}`} className="product-card__link">
          <div className="product-image">
            <img
              src={imgSrc}
              alt={p.name}
              className="product-image__img"
              loading="lazy"
              onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
            />
          </div>

          <div className="product-info">
            <div className="name">{p.name}</div>
            <div className="brand">{p.brand_name ? p.brand_name : "Farm Local"}</div>
            <div className="price">{price.toLocaleString()} VND</div>
          </div>
        </Link>
      </div>
    </>
  );
}
