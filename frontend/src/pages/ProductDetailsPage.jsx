import { Heart, ShoppingCart, Star, Tag, Clock, Info, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import ReviewSection from "../components/reviews/ReviewSection.jsx";
import StarRating from "../components/reviews/StarRating.jsx";
import Seo from "../components/Seo.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import PageLoader from "../components/ui/PageLoader.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";
import useFetch from "../hooks/useFetch.js";
import { getProductBySlug } from "../services/productService.js";
import { formatCurrency, formatMonthYear } from "../utils/formatters.js";
import { placeholderImage } from "../utils/constants.js";

const ProductDetailsPage = () => {
  const { slug } = useParams();
  const { addItem } = useCart();
  const { toggle } = useWishlist();
  const { data: product, loading, error } = useFetch(() => getProductBySlug(slug), [slug]);
  const [selected, setSelected] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);

  useEffect(() => { setSelected(0); }, [selectedVariant]);

  if (loading) return <PageLoader />;
  if (error || !product) return <EmptyState title="Product not found" message="This product may have been moved or sold." />;

  const variants = product.variants || [];
  const activeVariant = selectedVariant ? variants.find((v) => v._id === selectedVariant) : null;
  const variantImage = activeVariant?.image?.url;
  const firstVariantImage = variants.find((v) => v.image?.url)?.image?.url;
  const hasProductImages = product.images?.length > 0;
  const images = variantImage
    ? [{ url: variantImage, alt: activeVariant.name }]
    : hasProductImages
      ? product.images
      : firstVariantImage
        ? [{ url: firstVariantImage, alt: product.name }]
        : [{ url: placeholderImage, alt: product.name }];
  const lowestVariantPrice = variants.length ? Math.min(...variants.map((v) => v.price).filter(Boolean)) : null;
  const state = product.status || "";
  const isPreOrder = state && state !== "IN_STOCK";
  const activePrice = activeVariant?.price || lowestVariantPrice || product.discountPrice || product.price;
  const activeStock = activeVariant?.stock ?? product.stock;
  const stockStatus = state === "IN_STOCK" ? (activeStock <= 0 ? "out_of_stock" : activeStock <= (product.lowStockThreshold || 3) ? "low_stock" : "in_stock") : "in_stock";

  const preOrderClosed = state === "PRE_ORDER_CLOSED";
  const preOrderDelayed = state === "PRE_ORDER_DELAYED";
  const preOrderCancelled = state === "PRE_ORDER_CANCELLED";
  const preOrderActive = state === "PRE_ORDER_ACTIVE";
  const preOrderArrived = state === "PRE_ORDER_ARRIVED";

  const canPurchase = !isPreOrder || preOrderActive || preOrderArrived;
  const ctaDisabled = (!canPurchase) || (!isPreOrder && activeStock < 1);
  const ctaLabel = preOrderCancelled ? "Pre-Order Cancelled" :
                   preOrderClosed ? "Awaiting Arrival" :
                   preOrderDelayed ? "Delayed" :
                   preOrderArrived ? "Now In Stock — Add to Cart" :
                   preOrderActive ? "Pre-Order Now" :
                   activeStock < 1 ? "Sold out" : "Add to cart";

  const handleAddToCart = () => {
    if (ctaDisabled) return;
    if (product.hasVariants && !selectedVariant) {
      toast.error("Please select a variant first.");
      return;
    }
    addItem(product, 1, selectedVariant);
  };

  return (
    <>
      <Seo
        title={product.name}
        description={`${product.name} from Mini Hobbies. Shop diecast collectibles, scale models, Hot Wheels Sri Lanka finds, and hobby toys.`}
        canonical={`/products/${product.slug}`}
      />
      <section className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <img src={images[selected].url} alt={images[selected].alt || product.name} className="aspect-square w-full rounded-lg bg-white object-cover shadow-soft" loading="lazy" />
          {images.length > 1 && (
            <div className="mt-4 grid grid-cols-5 gap-2 sm:gap-3">
              {images.map((image, index) => (
                <button key={image.url} onClick={() => setSelected(index)} className={`rounded-md border p-1 ${selected === index ? "border-ember" : "border-gray-200"}`}>
                  <img src={image.url} alt={image.alt || product.name} className="aspect-square rounded object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>
        <article>
          <p className="flex flex-wrap items-center gap-2 text-sm font-bold uppercase tracking-wide text-ember">
            {product.category?.name}
            {isPreOrder && (
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                preOrderCancelled ? "bg-red-100 text-red-800" :
                preOrderClosed || preOrderDelayed ? "bg-gray-100 text-gray-700" :
                preOrderArrived ? "bg-emerald-100 text-emerald-800" :
                "bg-amber-100 text-amber-800"
              }`}>
                {preOrderCancelled ? "Cancelled" :
                 preOrderClosed ? "Awaiting Arrival" :
                 preOrderDelayed ? "Delayed" :
                 preOrderArrived ? "Now In Stock" :
                 "Pre-Order"}
              </span>
            )}
          </p>
          <h1 className="mt-3 text-2xl font-black text-gray-950 sm:text-5xl">{product.name}</h1>
          {product.totalReviews > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <StarRating rating={product.averageRating} size="sm" />
              <span className="text-sm text-gray-500">({product.totalReviews})</span>
            </div>
          )}
          <p className="mt-4 text-lg font-black">{formatCurrency(activePrice)}</p>
          {product.discountPrice && <p className="text-sm text-gray-500 line-through">{formatCurrency(product.price)}</p>}
          <p className="mt-6 leading-8 text-gray-700">{product.description}</p>

          {product.hasVariants && variants.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-semibold text-gray-700">Variant</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {variants.map((v) => {
                  const variantUnavailable = (!canPurchase) || (!isPreOrder && v.stock < 1);
                  return (
                    <button
                      key={v._id}
                      disabled={variantUnavailable}
                      onClick={() => setSelectedVariant(v._id)}
                      className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                        selectedVariant === v._id
                          ? "border-ember bg-ember/10 text-ember"
                          : variantUnavailable
                          ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "border-gray-300 hover:border-ember"
                      }`}
                    >
                      {v.name}
                      {v.price > 0 && <span className="ml-1 text-xs opacity-70">({formatCurrency(v.price)})</span>}
                      {variantUnavailable && <span className="ml-1 text-xs">- Sold out</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-white p-3 sm:p-4"><dt className="text-gray-500">Brand</dt><dd className="font-bold">{product.brand}</dd></div>
            <div className="rounded-lg bg-white p-3 sm:p-4"><dt className="text-gray-500">Scale</dt><dd className="font-bold">{product.scale || "N/A"}</dd></div>
            <div className="rounded-lg bg-white p-3 sm:p-4"><dt className="text-gray-500">Material</dt><dd className="font-bold">{product.material || "Mixed"}</dd></div>
            <div className="rounded-lg bg-white p-3 sm:p-4">
              <dt className="text-gray-500">{isPreOrder && !preOrderArrived ? "Expected" : "Stock"}</dt>
              <dd className={`font-bold ${
                preOrderCancelled ? "text-red-600" :
                preOrderClosed ? "text-gray-500" :
                preOrderDelayed ? "text-amber-600" :
                preOrderArrived ? "text-emerald-600" :
                preOrderActive ? "text-amber-600" :
                stockStatus === "out_of_stock" ? "text-red-600" :
                stockStatus === "low_stock" ? "text-amber-600" : "text-emerald-600"
              }`}>
                {preOrderCancelled ? "Cancelled" :
                 preOrderClosed ? "Awaiting Arrival" :
                 preOrderDelayed ? (product.preOrderDelayExpectedDate ? formatMonthYear(product.preOrderDelayExpectedDate) : "Delayed") :
                 preOrderArrived ? (activeStock > 0 ? `${activeStock} available` : "Sold out") :
                 preOrderActive ? (product.preOrderExpectedDate ? formatMonthYear(product.preOrderExpectedDate) : "Pre-Order") :
                 stockStatus === "out_of_stock" ? "Sold out" :
                 stockStatus === "low_stock" ? `Only ${activeStock} left` :
                 `${activeStock} available`}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap gap-2">
            {product.tags?.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-600">
                <Tag className="h-3 w-3" /> {tag}
              </span>
            ))}
          </div>

          {isPreOrder && (
            <div className={`mt-4 space-y-2 rounded-lg border p-4 ${
              preOrderCancelled ? "border-red-200 bg-red-50" :
              preOrderArrived ? "border-emerald-200 bg-emerald-50" :
              preOrderClosed || preOrderDelayed ? "border-gray-200 bg-gray-50" :
              "border-amber-200 bg-amber-50"
            }`}>
              {preOrderCancelled && (
                <p className="flex items-center gap-2 text-sm font-bold text-red-700">
                  <Clock className="h-4 w-4" /> Pre-Order Cancelled
                </p>
              )}
              {preOrderArrived && (
                <p className="flex items-center gap-2 text-sm font-bold text-emerald-800">
                  <Package className="h-4 w-4" /> Now In Stock — Order Now
                </p>
              )}
              {preOrderClosed && (
                <p className="flex items-center gap-2 text-sm font-bold text-gray-700">
                  <Clock className="h-4 w-4" /> Pre-Order Closed — Awaiting Arrival
                </p>
              )}
              {preOrderDelayed && (
                <p className="flex items-center gap-2 text-sm font-bold text-amber-800">
                  <Clock className="h-4 w-4" /> Supplier Delay
                </p>
              )}
              {preOrderActive && (
                <p className="flex items-center gap-2 text-sm font-bold text-amber-800">
                  <Clock className="h-4 w-4" /> Available for Pre-Order
                </p>
              )}
              {preOrderActive && product.preOrderDeadline && (
                <p className="text-sm text-amber-700">Closes: {formatMonthYear(product.preOrderDeadline)}</p>
              )}
              {preOrderDelayed && product.preOrderDelayExpectedDate && (
                <p className="text-sm text-amber-700">New Expected: {formatMonthYear(product.preOrderDelayExpectedDate)}</p>
              )}
              {(preOrderActive || preOrderClosed) && product.preOrderExpectedDate && (
                <p className="text-sm text-amber-700">Expected: {formatMonthYear(product.preOrderExpectedDate)}</p>
              )}
              {preOrderDelayed && product.preOrderDelayNote && (
                <p className="flex items-start gap-2 text-sm text-amber-700">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {product.preOrderDelayNote}
                </p>
              )}
              {preOrderActive && product.preOrderLimit > 0 && (
                <p className="text-sm text-amber-700">{product.preOrderSoldCount || 0} / {product.preOrderLimit} reserved</p>
              )}
              {preOrderActive && product.preOrderDepositRequired && product.preOrderDepositAmount > 0 && (
                <p className="text-sm text-amber-700">Deposit: {formatCurrency(product.preOrderDepositAmount)} required to reserve</p>
              )}
              {preOrderActive && product.preOrderPaymentMode === "FULL_PAYMENT" && (
                <p className="text-sm text-amber-700">Full payment required at time of pre-order</p>
              )}
              {preOrderActive && product.preOrderPaymentMode === "DEPOSIT_PAYMENT" && (
                <p className="text-sm text-amber-700">Deposit payment required, balance due before shipping</p>
              )}
              {preOrderActive && product.preOrderPaymentMode === "NO_PAYMENT" && (
                <p className="text-sm text-amber-700">No upfront payment required</p>
              )}
              {product.preOrderNotes && (
                <p className="flex items-start gap-2 text-sm text-amber-700">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {product.preOrderNotes}
                </p>
              )}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button disabled={ctaDisabled} onClick={handleAddToCart} className={`btn-primary w-full sm:flex-1 disabled:bg-gray-300 ${preOrderArrived ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}>
              <ShoppingCart className="h-4 w-4" /> {ctaLabel}
            </button>
            <button onClick={() => toggle(product)} className="btn-secondary w-full sm:w-auto">
              <Heart className="h-4 w-4" /> Wishlist
            </button>
          </div>
        </article>
      </section>

      <section className="sticky-bottom sm:hidden">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-lg font-black">{formatCurrency(activePrice)}</p>
            {product.discountPrice && <p className="text-xs text-gray-500 line-through">{formatCurrency(product.price)}</p>}
          </div>
          <button
            disabled={ctaDisabled}
            onClick={handleAddToCart}
            className="btn-primary flex-1 disabled:bg-gray-300"
          >
            <ShoppingCart className="h-4 w-4" /> {ctaLabel}
          </button>
        </div>
      </section>
      <section className="container-page py-10">
        <ReviewSection productId={product._id} />
      </section>
    </>
  );
};

export default ProductDetailsPage;