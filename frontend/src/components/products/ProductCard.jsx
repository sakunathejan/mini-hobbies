import { memo } from "react";
import { Heart, ShoppingCart, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext.jsx";
import { useWishlist } from "../../context/WishlistContext.jsx";
import { formatCurrency } from "../../utils/formatters.js";
import { placeholderImage } from "../../utils/constants.js";

const ProductCard = memo(({ product, compact }) => {
  const { addItem } = useCart();
  const { items, toggle } = useWishlist();
  const saved = items.some((item) => item._id === product._id);
  const variantImage = product.variants?.find((v) => v.image?.url)?.image?.url;
  const image = product.images?.[0]?.url || variantImage || placeholderImage;
  const lowestVariantPrice = product.hasVariants && product.variants?.length
    ? Math.min(...product.variants.map((v) => v.price).filter(Boolean)) : null;

  return (
    <article className={`group flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft ${compact ? "" : ""}`}>
      <Link to={`/products/${product.slug}`} className="block shrink-0 overflow-hidden bg-gray-100">
        <img
          src={image}
          alt={product.images?.[0]?.alt || product.name}
          loading="lazy"
          className={`w-full object-cover transition duration-500 group-hover:scale-105 ${compact ? "aspect-[4/3]" : "aspect-square"}`}
        />
      </Link>
      <div className={`flex flex-1 flex-col ${compact ? "p-2" : "p-3 sm:p-4"}`}>
        <div className="flex items-start justify-between gap-1.5">
          <div className="min-w-0 flex-1">
            {product.brand && (
              <p className={`font-semibold uppercase tracking-wide text-ember ${compact ? "text-[10px]" : "text-xs"}`}>{product.brand}</p>
            )}
            <Link
              to={`/products/${product.slug}`}
              className={`mt-0.5 block line-clamp-2 font-bold leading-snug text-gray-950 hover:text-ember ${compact ? "text-xs min-h-[2rem]" : "text-sm sm:text-base min-h-[2.5rem] sm:min-h-[2.75rem]"}`}
            >
              {product.name}
            </Link>
          </div>
          <button
            aria-label="Save to wishlist"
            onClick={() => toggle(product)}
            className={`shrink-0 rounded-md hover:bg-gray-100 ${compact ? "p-1" : "p-1.5 sm:p-2"}`}
          >
            <Heart className={`${compact ? "h-4 w-4" : "h-5 w-5"} ${saved ? "fill-ember text-ember" : "text-gray-500"}`} />
          </button>
        </div>
        <div className={`flex items-center justify-between gap-2 ${compact ? "mt-1.5" : "mt-2 sm:mt-3"}`}>
          <div className={compact ? "" : "min-h-[2.5rem]"}>
            {lowestVariantPrice ? (
              <p className={`font-black text-gray-950 ${compact ? "text-xs" : "text-sm sm:text-base"}`}>From {formatCurrency(lowestVariantPrice)}</p>
            ) : (
              <p className={`font-black text-gray-950 ${compact ? "text-xs" : "text-sm sm:text-base"}`}>{formatCurrency(product.discountPrice || product.price)}</p>
            )}
            {product.discountPrice && !product.hasVariants ? (
              <p className={`text-gray-500 line-through ${compact ? "text-[10px]" : "text-xs"}`}>{formatCurrency(product.price)}</p>
            ) : null}
          </div>
          <span
            className={`shrink-0 rounded-full font-semibold ${
              product.stock > 0 ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
            } ${compact ? "px-2 py-0.5 text-[10px]" : "px-2 sm:px-3 py-1 text-xs"}`}
          >
            {product.stock > 0 ? "In stock" : "Sold out"}
          </span>
        </div>
        {product.hasVariants ? (
          <Link
            to={`/products/${product.slug}`}
            className={`btn-primary mt-auto w-full inline-flex items-center justify-center gap-2 font-semibold ${compact ? "min-h-[36px] text-xs" : "min-h-[44px] text-sm"}`}
          >
            <Eye className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} /> View options
          </Link>
        ) : (
          <button
            disabled={product.stock < 1}
            onClick={() => addItem(product)}
            className={`btn-primary mt-auto w-full disabled:cursor-not-allowed disabled:bg-gray-300 ${compact ? "min-h-[36px] text-xs" : "min-h-[44px] text-sm"}`}
          >
            <ShoppingCart className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} /> Add to cart
          </button>
        )}
      </div>
    </article>
  );
});

export default ProductCard;
