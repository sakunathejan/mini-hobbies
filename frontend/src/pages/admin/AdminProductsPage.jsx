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

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-black">Products</h1>
        <Link to="/admin/products/new" className="btn-primary"><Plus className="h-4 w-4" /> Add product</Link>
      </div>
      <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
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
            {(data?.products || []).map((product) => (
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
      {loading && <div className="mt-6"><ProductGrid loading /></div>}
    </div>
  );
};

export default AdminProductsPage;
