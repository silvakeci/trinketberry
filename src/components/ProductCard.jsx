import { Link } from "react-router-dom";

export default function ProductCard({ product }) {
    const img =
    (product.image
 || [])
      .slice()
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]
      ?.image_url || "/images/placeholder.jpg";
  return (
   <Link to={`/product/${product.id}`} className="card">
      <img className="card-img" src={img} alt={product.name} />
      <div className="card-body">
        <div className="card-name">{product.name}</div>
        <div className="card-price">All {product.price.toFixed(2)}</div>
      </div>
    </Link>
  );
}
