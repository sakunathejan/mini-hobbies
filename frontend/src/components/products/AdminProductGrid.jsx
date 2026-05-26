import { memo } from "react";
import AdminProductCard from "./AdminProductCard.jsx";

const AdminSkeleton = () => (
  <div className="flex flex-col rounded-lg border border-gray-200 bg-white shadow-sm">
    <div className="aspect-[4/3] animate-pulse rounded-t-lg bg-gray-200" />
    <div className="p-2">
      <div className="h-3 w-2/3 animate-pulse rounded bg-gray-200" />
      <div className="mt-2 h-3 w-full animate-pulse rounded bg-gray-200" />
      <div className="mt-3 h-3 w-1/3 animate-pulse rounded bg-gray-200" />
      <div className="mt-2 flex gap-1.5">
        <div className="h-7 flex-1 animate-pulse rounded-md bg-gray-200" />
        <div className="h-7 flex-1 animate-pulse rounded-md bg-gray-200" />
      </div>
    </div>
  </div>
);

const AdminProductGrid = memo(({ products = [], onDelete, loading }) => {
  if (loading) {
    return (
      <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => <AdminSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {products.map((product) => (
        <AdminProductCard key={product._id} product={product} onDelete={onDelete} />
      ))}
    </div>
  );
});

export default AdminProductGrid;
