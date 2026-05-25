const SkeletonCard = () => (
  <div className="flex h-full flex-col rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
    <div className="aspect-square animate-pulse rounded-md bg-gray-200" />
    <div className="mt-4 h-4 w-2/3 animate-pulse rounded bg-gray-200" />
    <div className="mt-3 h-4 w-1/3 animate-pulse rounded bg-gray-200" />
  </div>
);

export default SkeletonCard;
