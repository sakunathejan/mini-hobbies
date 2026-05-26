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
  const variantImage = product.variants?.find((v) => v.image?.url)?.image?.url;
  const image = product.images?.[0]?.url || variantImage || placeholderImage;
  const lowestVariantPrice = product.hasVariants && product.variants?.length
    ? Math.min(...product.variants.map((v) => v.price).filter(Boolean)) : null;

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
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-ember">{product.brand}</p>
            <Link
              to={`/products/${product.slug}`}
              className="mt-1 block min-h-[2.5rem] sm:min-h-[2.75rem] line-clamp-2 text-sm font-bold leading-snug text-gray-950 hover:text-ember sm:text-base"
            >
              {product.name}
            </Link>
          </div>
          <button
            aria-label="Save to wishlist"
            onClick={() => toggle(product)}
            className="shrink-0 rounded-md p-1.5 hover:bg-gray-100 sm:p-2"
          >
            <Heart className={`h-5 w-5 ${saved ? "fill-ember text-ember" : "text-gray-500"}`} />
          </button>
        </div>
        <div className="mt-2 sm:mt-3 flex items-center justify-between gap-2">
          <div className="min-h-[2.5rem]">
            {lowestVariantPrice ? (
              <p className="text-sm font-black text-gray-950 sm:text-base">From {formatCurrency(lowestVariantPrice)}</p>
            ) : (
              <p className="text-sm font-black text-gray-950 sm:text-base">{formatCurrency(product.discountPrice || product.price)}</p>
            )}
            {product.discountPrice && !product.hasVariants ? (
              <p className="text-xs text-gray-500 line-through">{formatCurrency(product.price)}</p>
            ) : null}
          </div>
          <span
            className={`shrink-0 rounded-full px-2 sm:px-3 py-1 text-xs font-semibold ${product.stock > 0 ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}
          >
            {product.stock > 0 ? "In stock" : "Sold out"}
          </span>
        </div>
        <button
          disabled={product.stock < 1}
          onClick={() => addItem(product)}
          className="btn-primary mt-auto w-full disabled:cursor-not-allowed disabled:bg-gray-300 min-h-[44px]"
        >
          <ShoppingCart className="h-4 w-4" /> Add to cart
        </button>
      </div>
    </article>
  );
};

export default ProductCard;
