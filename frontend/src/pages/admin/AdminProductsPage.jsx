import { Pencil, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import ProductGrid from "../../components/products/ProductGrid.jsx";
import useFetch from "../../hooks/useFetch.js";
import { deleteProduct, getProducts } from "../../services/productService.js";
import { formatCurrency } from "../../utils/formatters.js";

const AdminProductsPage = () => {
  const { data, loading, setData } = useFetch(() => getProducts({ limit: 48 }), []);

  const remove = async (id) => {
    await deleteProduct(id);
    setData({ ...data, products: data.products.filter((product) => product._id !== id) });
  };

  const products = data?.products || [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-black">Products</h1>
        <Link to="/admin/products/new" className="btn-primary"><Plus className="h-4 w-4" /> Add product</Link>
      </div>

      <div className="mt-6 hidden overflow-x-auto rounded-lg border border-gray-200 bg-white md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="p-4">Product</th>
              <th className="p-4">Category</th>
              <th className="p-4">Price</th>
              <th className="p-4">Stock</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product._id} className="border-t">
                <td className="p-4 font-semibold">{product.name}</td>
                <td className="p-4">{product.category?.name}</td>
                <td className="p-4">{formatCurrency(product.discountPrice || product.price)}</td>
                <td className="p-4">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${
                    product.stockStatus === "out_of_stock" ? "bg-red-50 text-red-700" :
                    product.stockStatus === "low_stock" ? "bg-amber-50 text-amber-800" :
                    "bg-emerald-50 text-emerald-800"
                  }`}>
                    {product.stockStatus === "out_of_stock" ? "Sold out" :
                     product.stockStatus === "low_stock" ? `${product.stock} left` :
                     product.stock}
                  </span>
                </td>
                <td className="flex gap-2 p-4">
                  <Link aria-label="Edit product" to={`/admin/products/${product._id}/edit`} className="rounded-md p-2 hover:bg-gray-100"><Pencil className="h-4 w-4" /></Link>
                  <button aria-label="Delete product" onClick={() => remove(product._id)} className="rounded-md p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid gap-3 md:hidden">
        {products.map((product) => (
          <div key={product._id} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{product.name}</p>
                <p className="text-sm text-gray-600">{product.category?.name || "—"}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Link aria-label="Edit product" to={`/admin/products/${product._id}/edit`} className="rounded-md p-2 hover:bg-gray-100"><Pencil className="h-4 w-4" /></Link>
                <button aria-label="Delete product" onClick={() => remove(product._id)} className="rounded-md p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="font-bold">{formatCurrency(product.discountPrice || product.price)}</span>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${
                product.stockStatus === "out_of_stock" ? "bg-red-50 text-red-700" :
                product.stockStatus === "low_stock" ? "bg-amber-50 text-amber-800" :
                "bg-emerald-50 text-emerald-800"
              }`}>
                {product.stockStatus === "out_of_stock" ? "Sold out" :
                 product.stockStatus === "low_stock" ? `${product.stock} left` :
                 product.stock}
              </span>
            </div>
          </div>
        ))}
      </div>

      {loading && <div className="mt-6"><ProductGrid loading /></div>}
    </div>
  );
};

export default AdminProductsPage;
