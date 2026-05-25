import { SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Seo from "../components/Seo.jsx";
import ProductFilters from "../components/products/ProductFilters.jsx";
import ProductGrid from "../components/products/ProductGrid.jsx";
import useFetch from "../hooks/useFetch.js";
import { getCategories } from "../services/categoryService.js";
import { getProducts } from "../services/productService.js";

const ProductListPage = () => {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    minPrice: "",
    maxPrice: "",
    page: 1
  });
  const [products, setProducts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const categories = useFetch(getCategories, []);

  useEffect(() => {
    const categoryId = searchParams.get("category");
    if (categoryId) {
      setFilters((current) => ({ ...current, category: categoryId, page: 1 }));
      return;
    }

    const categoryName = searchParams.get("categoryName");
    if (!categoryName || !categories.data?.length) return;

    const matched = categories.data.find(
      (category) => category.name.toLowerCase() === categoryName.toLowerCase()
    );

    if (matched) {
      setFilters((current) => ({ ...current, category: matched._id, page: 1 }));
    }
  }, [categories.data, searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      getProducts(filters)
        .then(setProducts)
        .finally(() => setLoading(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [filters]);

  return (
    <>
      <Seo
        title="Shop Products"
        description="Browse Mini Hobbies products including die cast cars, Hot Wheels, scale models, anime figures, RC toys, and collectible toys."
        canonical="/products"
      />
      <section className="container-page py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-ember">Catalog</p>
            <h1 className="section-title mt-2">Shop collectible toys and models</h1>
          </div>
          <button onClick={() => setShowMobileFilters(true)} className="btn-secondary lg:hidden min-h-[44px]">
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </button>
        </div>
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className={`${showMobileFilters ? "fixed inset-0 z-50 overflow-y-auto bg-white p-4 lg:static lg:z-auto lg:overflow-visible lg:bg-transparent lg:p-0" : "hidden lg:block"}`}>
            {showMobileFilters && (
              <div className="mb-4 flex items-center justify-between lg:hidden">
                <h2 className="font-bold">Filters</h2>
                <button onClick={() => setShowMobileFilters(false)} className="rounded-md p-2 hover:bg-gray-100">
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
            <ProductFilters categories={categories.data || []} filters={filters} setFilters={setFilters} />
            {showMobileFilters && (
              <button onClick={() => setShowMobileFilters(false)} className="btn-primary mt-4 w-full min-h-[48px] lg:hidden">
                Apply Filters
              </button>
            )}
          </div>
          <div>
            <ProductGrid products={products?.products || []} loading={loading} />
            {products?.pages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                {Array.from({ length: products.pages }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setFilters({ ...filters, page: index + 1 })}
                    className={`flex h-10 w-10 items-center justify-center rounded-md text-sm font-bold min-h-[44px] min-w-[44px] ${filters.page === index + 1 ? "bg-graphite text-white" : "bg-white border border-gray-200"}`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default ProductListPage;
