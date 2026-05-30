import { useState, useMemo, useEffect } from "react";
import { AlertCircle, Plus, RefreshCw } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import AdminProductGrid from "../../components/products/AdminProductGrid.jsx";
import ProductListView from "../../components/products/ProductListView.jsx";
import ViewToggle from "../../components/ui/ViewToggle.jsx";
import Pagination from "../../components/ui/Pagination.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { deleteProduct, getProducts } from "../../services/productService.js";

const PER_PAGE = 16;

const AdminProductsPage = () => {
  const location = useLocation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState(() => localStorage.getItem("admin_products_view") || "grid");
  const [page, setPage] = useState(1);

  const fetchProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getProducts({ limit: 48 });
      setData(result);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [location.pathname]);

  const products = data?.products || [];
  const totalPages = Math.ceil(products.length / PER_PAGE);
  const pageProducts = useMemo(
    () => products.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    [products, page]
  );

  const handleViewChange = (v) => {
    setView(v);
    setPage(1);
  };

  const remove = async (id) => {
    await deleteProduct(id);
    const updated = products.filter((p) => p._id !== id);
    setData({ ...data, products: updated });
    if (page > Math.ceil(updated.length / PER_PAGE)) setPage(Math.max(1, page - 1));
  };

  if (loading) return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-black">Products</h1>
        <Link to="/admin/products/new" className="btn-primary"><Plus className="h-4 w-4" /> Add product</Link>
      </div>
      <div className="mt-6"><AdminProductGrid loading /></div>
    </div>
  );

  if (error) return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-black">Products</h1>
        <Link to="/admin/products/new" className="btn-primary"><Plus className="h-4 w-4" /> Add product</Link>
      </div>
      <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
        <button onClick={fetchProducts} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-red-700 hover:underline">
          <RefreshCw className="h-3.5 w-3.5" /> Try again
        </button>
      </div>
    </div>
  );

  if (!products.length) return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-black">Products</h1>
        <Link to="/admin/products/new" className="btn-primary"><Plus className="h-4 w-4" /> Add product</Link>
      </div>
      <div className="mt-6"><EmptyState title="No products yet" message="Add your first product to start selling." /></div>
    </div>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-black">Products</h1>
        <div className="flex items-center gap-3">
          <button onClick={fetchProducts} className="btn-secondary p-2" title="Refresh">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <ViewToggle view={view} onChange={handleViewChange} storageKey="admin_products_view" />
          <Link to="/admin/products/new" className="btn-primary"><Plus className="h-4 w-4" /> Add product</Link>
        </div>
      </div>

      <p className="mt-2 text-sm text-gray-500">{products.length} products total</p>

      <div className="mt-6">
        {view === "list" ? (
          <ProductListView products={pageProducts} onDelete={remove} />
        ) : (
          <AdminProductGrid products={pageProducts} onDelete={remove} />
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-8">
          <Pagination current={page} total={totalPages} onChange={setPage} />
        </div>
      )}
    </div>
  );
};

export default AdminProductsPage;
