import { Pencil, Trash2 } from "lucide-react";
import { memo } from "react";
import { Link } from "react-router-dom";
import { placeholderImage } from "../../utils/constants.js";
import { formatCurrency } from "../../utils/formatters.js";

const getStockBadge = (product) => {
  const s = product.status || "";
  if (s === "PRE_ORDER_ACTIVE") return { label: "Pre-Order", style: "bg-amber-50 text-amber-800" };
  if (s === "PRE_ORDER_CLOSED") return { label: "Awaiting Arrival", style: "bg-gray-100 text-gray-600" };
  if (s === "PRE_ORDER_DELAYED") return { label: "Delayed", style: "bg-amber-50 text-amber-800" };
  if (s === "PRE_ORDER_CANCELLED") return { label: "Cancelled", style: "bg-red-50 text-red-700" };
  if (product.productType === "OUT_OF_STOCK") return { label: "Out of Stock", style: "bg-red-50 text-red-700" };
  if (product.stockStatus === "out_of_stock") return { label: "Sold out", style: "bg-red-50 text-red-700" };
  if (product.stockStatus === "low_stock") return { label: `${product.stock} left`, style: "bg-amber-50 text-amber-800" };
  return { label: String(product.stock ?? 0), style: "bg-emerald-50 text-emerald-800" };
};

const AdminProductCard = memo(({ product, onDelete }) => {
  const variantImage = product.variants?.find((v) => v.image?.url)?.image?.url;
  const image = product.images?.[0]?.url || variantImage || placeholderImage;
  const badge = getStockBadge(product);

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-soft">
      <Link to={`/admin/products/${product._id}/edit`} className="block shrink-0 overflow-hidden bg-gray-100">
        <img
          src={image}
          alt={product.images?.[0]?.alt || product.name}
          className="aspect-[4/3] w-full object-cover"
          loading="lazy"
        />
      </Link>
      <div className="flex flex-1 flex-col p-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-ember">{product.brand || product.category?.name}</p>
        <Link to={`/admin/products/${product._id}/edit`} className="mt-0.5 line-clamp-2 text-xs font-bold text-gray-950 hover:text-ember">
          {product.name}
        </Link>
        <div className="mt-auto flex items-center justify-between pt-2">
          <p className="text-xs font-black">{formatCurrency(product.discountPrice || product.price)}</p>
          <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-bold ${badge.style}`}>
            {badge.label}
          </span>
        </div>
        <div className="mt-2 flex gap-1.5">
          <Link to={`/admin/products/${product._id}/edit`} className="flex flex-1 items-center justify-center gap-1 rounded-md border border-gray-300 px-2 py-1.5 text-[11px] font-semibold text-gray-900 transition hover:border-gray-900"><Pencil className="h-3 w-3" /> Edit</Link>
          <button onClick={() => onDelete(product._id)} className="flex flex-1 items-center justify-center gap-1 rounded-md border border-red-300 px-2 py-1.5 text-[11px] font-semibold text-red-700 transition hover:border-red-600 hover:bg-red-50"><Trash2 className="h-3 w-3" /> Delete</button>
        </div>
      </div>
    </div>
  );
});

export default AdminProductCard;
