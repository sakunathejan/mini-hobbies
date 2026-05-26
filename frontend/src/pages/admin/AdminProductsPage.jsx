import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import AdminProductGrid from "../../components/products/AdminProductGrid.jsx";
import ProductListView from "../../components/products/ProductListView.jsx";
import ViewToggle from "../../components/ui/ViewToggle.jsx";
import Pagination from "../../components/ui/Pagination.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import useFetch from "../../hooks/useFetch.js";
import { deleteProduct, getProducts } from "../../services/productService.js";

const PER_PAGE = 16;

const AdminProductsPage = () => {
  const { data, loading, setData } = useFetch(() => getProducts({ limit: 48 }), []);
  const [view, setView] = useState(() => localStorage.getItem("admin_products_view") || "grid");
  const [page, setPage] = useState(1);

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
