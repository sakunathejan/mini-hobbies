import { Heart, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext.jsx";
import { useWishlist } from "../../context/WishlistContext.jsx";
import { formatCurrency } from "../../utils/formatters.js";
import { placeholderImage } from "../../utils/constants.js";

const ProductCard = ({ product }) => {
  const { addItem } = useCart();
  const { items, toggle } = useWishlist();
  const saved = items.some((item) => item._id === product._id);
  const image = product.images?.[0]?.url || placeholderImage;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
      <Link to={`/products/${product.slug}`} className="block shrink-0 overflow-hidden bg-gray-100">
        <img
          src={image}
          alt={product.images?.[0]?.alt || product.name}
          loading="lazy"
          className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-ember">{product.brand}</p>
            <Link
              to={`/products/${product.slug}`}
              className="mt-1 block min-h-[2.75rem] line-clamp-2 font-bold leading-snug text-gray-950 hover:text-ember"
            >
              {product.name}
            </Link>
          </div>
          <button
            aria-label="Save to wishlist"
            onClick={() => toggle(product)}
            className="shrink-0 rounded-md p-2 hover:bg-gray-100"
          >
            <Heart className={`h-5 w-5 ${saved ? "fill-ember text-ember" : "text-gray-500"}`} />
          </button>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="min-h-[2.5rem]">
            <p className="font-black text-gray-950">{formatCurrency(product.discountPrice || product.price)}</p>
            {product.discountPrice ? (
              <p className="text-xs text-gray-500 line-through">{formatCurrency(product.price)}</p>
            ) : (
              <p className="text-xs text-transparent select-none" aria-hidden="true">
                —
              </p>
            )}
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${product.stock > 0 ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}
          >
            {product.stock > 0 ? "In stock" : "Sold out"}
          </span>
        </div>
        <button
          disabled={product.stock < 1}
          onClick={() => addItem(product)}
          className="btn-primary mt-auto w-full disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          <ShoppingCart className="h-4 w-4" /> Add to cart
        </button>
      </div>
    </article>
  );
};

export default ProductCard;
