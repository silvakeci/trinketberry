import { Link } from "react-router-dom";

export default function ProductCard({ product }) {
  return (
   <Link to={`/product/${product.id}`} className="card">
      <img className="card-img" src={product.image} alt={product.name} />
      <div className="card-body">
        <div className="card-name">{product.name}</div>
        <div className="card-price">${product.price.toFixed(2)}</div>
      </div>
    </Link>
  );
}
