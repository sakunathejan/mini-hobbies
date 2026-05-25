import { Heart, ShoppingCart, Tag } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import Seo from "../components/Seo.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import PageLoader from "../components/ui/PageLoader.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";
import useFetch from "../hooks/useFetch.js";
import { getProductBySlug } from "../services/productService.js";
import { formatCurrency } from "../utils/formatters.js";
import { placeholderImage } from "../utils/constants.js";

const ProductDetailsPage = () => {
  const { slug } = useParams();
  const { addItem } = useCart();
  const { toggle } = useWishlist();
  const { data: product, loading, error } = useFetch(() => getProductBySlug(slug), [slug]);
  const [selected, setSelected] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);

  if (loading) return <PageLoader />;
  if (error || !product) return <EmptyState title="Product not found" message="This product may have been moved or sold." />;

  const images = product.images?.length ? product.images : [{ url: placeholderImage, alt: product.name }];
  const variants = product.variants || [];
  const activeVariant = selectedVariant ? variants.find((v) => v._id === selectedVariant) : null;
  const activePrice = activeVariant?.price || product.discountPrice || product.price;
  const activeStock = activeVariant?.stock ?? product.stock;
  const stockStatus = activeStock <= 0 ? "out_of_stock" : activeStock <= (product.lowStockThreshold || 3) ? "low_stock" : "in_stock";

  const handleAddToCart = () => {
    if (activeStock < 1) return;
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
          <img src={images[selected].url} alt={images[selected].alt || product.name} className="aspect-square w-full rounded-lg bg-white object-cover shadow-soft" />
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
          <p className="text-sm font-bold uppercase tracking-wide text-ember">{product.category?.name}</p>
          <h1 className="mt-3 text-2xl font-black text-gray-950 sm:text-5xl">{product.name}</h1>
          <p className="mt-4 text-lg font-black">{formatCurrency(activePrice)}</p>
          {product.discountPrice && <p className="text-sm text-gray-500 line-through">{formatCurrency(product.price)}</p>}
          <p className="mt-6 leading-8 text-gray-700">{product.description}</p>

          {product.hasVariants && variants.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-semibold text-gray-700">Variant</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {variants.map((v) => {
                  const outOfStock = v.stock < 1;
                  return (
                    <button
                      key={v._id}
                      disabled={outOfStock}
                      onClick={() => setSelectedVariant(v._id)}
                      className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                        selectedVariant === v._id
                          ? "border-ember bg-ember/10 text-ember"
                          : outOfStock
                          ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "border-gray-300 hover:border-ember"
                      }`}
                    >
                      {v.name}
                      {v.price > 0 && <span className="ml-1 text-xs opacity-70">({formatCurrency(v.price)})</span>}
                      {outOfStock && <span className="ml-1 text-xs">- Sold out</span>}
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
              <dt className="text-gray-500">Stock</dt>
              <dd className={`font-bold ${
                stockStatus === "out_of_stock" ? "text-red-600" :
                stockStatus === "low_stock" ? "text-amber-600" : "text-emerald-600"
              }`}>
                {stockStatus === "out_of_stock" ? "Sold out" :
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

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button disabled={activeStock < 1} onClick={handleAddToCart} className="btn-primary w-full sm:flex-1 min-h-[48px] disabled:bg-gray-300">
              <ShoppingCart className="h-4 w-4" /> {activeStock < 1 ? "Sold out" : "Add to cart"}
            </button>
            <button onClick={() => toggle(product)} className="btn-secondary w-full sm:w-auto min-h-[48px]">
              <Heart className="h-4 w-4" /> Wishlist
            </button>
          </div>
        </article>
      </section>
    </>
  );
};

export default ProductDetailsPage;