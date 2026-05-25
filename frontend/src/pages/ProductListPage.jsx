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
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-wide text-ember">Catalog</p>
          <h1 className="section-title mt-2">Shop collectible toys and models</h1>
        </div>
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <ProductFilters categories={categories.data || []} filters={filters} setFilters={setFilters} />
          <div>
            <ProductGrid products={products?.products || []} loading={loading} />
            {products?.pages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                {Array.from({ length: products.pages }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setFilters({ ...filters, page: index + 1 })}
                    className={`h-10 w-10 rounded-md text-sm font-bold ${filters.page === index + 1 ? "bg-graphite text-white" : "bg-white"}`}
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
