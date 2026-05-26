import { memo } from "react";
import EmptyState from "../ui/EmptyState.jsx";
import SkeletonCard from "../ui/SkeletonCard.jsx";
import ProductCard from "./ProductCard.jsx";

const ProductGrid = memo(({ products = [], loading }) => {
  if (loading) {
    return (
      <div className="grid auto-rows-fr gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }

  if (!products.length) {
    return <EmptyState title="No collectibles found" message="Try a different search, category, or price range." />;
  }

  return (
    <div className="grid auto-rows-fr gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
});

export default ProductGrid;
