import { PackageSearch } from "lucide-react";

const EmptyState = ({ title = "Nothing here yet", message = "Try changing filters or check back soon." }) => (
  <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
    <PackageSearch className="mx-auto h-10 w-10 text-gray-400" />
    <h3 className="mt-4 text-lg font-semibold text-gray-950">{title}</h3>
    <p className="mt-2 text-sm text-gray-600">{message}</p>
  </div>
);

export default EmptyState;
