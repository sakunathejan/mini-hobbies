import { Search, SlidersHorizontal } from "lucide-react";

const ProductFilters = ({ categories, filters, setFilters }) => (
  <aside className="rounded-lg border border-gray-200 bg-white p-4">
    <div className="flex items-center gap-2 font-bold text-gray-950">
      <SlidersHorizontal className="h-5 w-5" /> Filters
    </div>
    <label className="mt-5 block text-sm font-semibold text-gray-700">Search</label>
    <div className="relative mt-2">
      <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
      <input
        className="input pl-10"
        placeholder="Hot Wheels, Supra, figure..."
        value={filters.search}
        onChange={(event) => setFilters({ ...filters, search: event.target.value, page: 1 })}
      />
    </div>
    <label className="mt-5 block text-sm font-semibold text-gray-700">Category</label>
    <select
      className="input mt-2"
      value={filters.category}
      onChange={(event) => setFilters({ ...filters, category: event.target.value, page: 1 })}
    >
      <option value="">All categories</option>
      {categories.map((category) => (
        <option key={category._id} value={category._id}>
          {category.name}
        </option>
      ))}
    </select>
    <div className="mt-5 grid grid-cols-2 gap-3">
      <div>
        <label className="block text-sm font-semibold text-gray-700">Min</label>
        <input className="input mt-2" type="number" value={filters.minPrice} onChange={(event) => setFilters({ ...filters, minPrice: event.target.value })} />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700">Max</label>
        <input className="input mt-2" type="number" value={filters.maxPrice} onChange={(event) => setFilters({ ...filters, maxPrice: event.target.value })} />
      </div>
    </div>
  </aside>
);

export default ProductFilters;
