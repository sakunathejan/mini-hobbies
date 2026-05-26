import { Pencil, Trash2 } from "lucide-react";
import { memo } from "react";
import { Link } from "react-router-dom";
import { formatCurrency } from "../../utils/formatters.js";

const ProductListView = memo(({ products = [], onDelete }) => (
  <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
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
              <button aria-label="Delete product" onClick={() => onDelete(product._id)} className="rounded-md p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
));

export default ProductListView;
