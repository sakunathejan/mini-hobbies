import { memo } from "react";
import EmptyState from "../ui/EmptyState.jsx";
import SkeletonCard from "../ui/SkeletonCard.jsx";
import ProductCard from "./ProductCard.jsx";

const ProductGrid = memo(({ products, loading, compact, max }) => {
  const items = products || [];
  const displayProducts = max ? items.slice(0, max) : items;

  if (loading) {
    return (
      <div className="grid auto-rows-fr gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: max || 8 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }

  if (!displayProducts.length) {
    return null;
  }

  return (
    <div className="grid auto-rows-fr gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {displayProducts.map((product) => (
        <ProductCard key={product._id} product={product} compact={compact} />
      ))}
    </div>
  );
});

export default ProductGrid;
