import { BarChart3, Building2, CreditCard, LogOut, MapPin, Package, Percent, PlusCircle, ShoppingBag, Tags } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const AdminLayout = () => {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-gray-200 bg-white p-5 md:block">
        <h1 className="text-xl font-black">Mini Hobbies Admin</h1>
        <nav className="mt-8 grid gap-2">
          <NavLink to="/admin" end className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold hover:bg-gray-100">
            <BarChart3 className="h-4 w-4" /> Dashboard
          </NavLink>
          <NavLink to="/admin/products" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold hover:bg-gray-100">
            <Package className="h-4 w-4" /> Products
          </NavLink>
          <NavLink to="/admin/products/new" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold hover:bg-gray-100">
            <PlusCircle className="h-4 w-4" /> Add Product
          </NavLink>
          <NavLink to="/admin/categories" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold hover:bg-gray-100">
            <Tags className="h-4 w-4" /> Categories
          </NavLink>
          <NavLink to="/admin/orders" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold hover:bg-gray-100">
            <ShoppingBag className="h-4 w-4" /> Orders
          </NavLink>
          <NavLink to="/admin/payments" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold hover:bg-gray-100">
            <CreditCard className="h-4 w-4" /> Payments
          </NavLink>
          <NavLink to="/admin/coupons" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold hover:bg-gray-100">
            <Percent className="h-4 w-4" /> Coupons
          </NavLink>
          <NavLink to="/admin/delivery-zones" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold hover:bg-gray-100">
            <MapPin className="h-4 w-4" /> Delivery Zones
          </NavLink>
          <NavLink to="/admin/bank-details" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold hover:bg-gray-100">
            <Building2 className="h-4 w-4" /> Bank Details
          </NavLink>
        </nav>
        <button onClick={logout} className="absolute bottom-5 flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-red-600">
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </aside>
      <header className="border-b border-gray-200 bg-white p-4 md:hidden">
        <p className="text-sm font-black">Mini Hobbies Admin</p>
        <nav className="mt-3 flex flex-wrap gap-2 text-sm font-semibold">
          <NavLink to="/admin" end className="rounded-md px-3 py-2 hover:bg-gray-100">
            Dashboard
          </NavLink>
          <NavLink to="/admin/products" className="rounded-md px-3 py-2 hover:bg-gray-100">
            Products
          </NavLink>
          <NavLink to="/admin/categories" className="rounded-md px-3 py-2 hover:bg-gray-100">
            Categories
          </NavLink>
          <NavLink to="/admin/orders" className="rounded-md px-3 py-2 hover:bg-gray-100">
            Orders
          </NavLink>
          <NavLink to="/admin/payments" className="rounded-md px-3 py-2 hover:bg-gray-100">
            Payments
          </NavLink>
          <NavLink to="/admin/coupons" className="rounded-md px-3 py-2 hover:bg-gray-100">
            Coupons
          </NavLink>
          <NavLink to="/admin/delivery-zones" className="rounded-md px-3 py-2 hover:bg-gray-100">
            Zones
          </NavLink>
          <NavLink to="/admin/bank-details" className="rounded-md px-3 py-2 hover:bg-gray-100">
            Bank
          </NavLink>
        </nav>
      </header>
      <main className="md:pl-64">
        <div className="container-page py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
