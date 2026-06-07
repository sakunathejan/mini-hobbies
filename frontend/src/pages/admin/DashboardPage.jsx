import { AlertTriangle, CircleDollarSign, Clock, CreditCard, Package, Plus, ShoppingBag, Tags, Truck, Users, XCircle, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import useFetch from "../../hooks/useFetch.js";
import { getDashboardStats } from "../../services/authService.js";
import { getLowStockProducts, getPreOrderAnalytics } from "../../services/productService.js";

import { formatCurrency } from "../../utils/formatters.js";

const DashboardPage = () => {
  const { data } = useFetch(getDashboardStats, []);
  const { data: lowStock } = useFetch(getLowStockProducts, []);
  const { data: preOrderLifecycle } = useFetch(getPreOrderAnalytics, []);
  const lowStockItems = Array.isArray(lowStock) ? lowStock : [];

  const cards = [
    { label: "Products", value: data?.products || 0, icon: Package },
    { label: "Categories", value: data?.categories || 0, icon: Tags },
    { label: "Orders", value: data?.orders || 0, icon: ShoppingBag },
    { label: "Revenue", value: formatCurrency(data?.revenue || 0), icon: CircleDollarSign }
  ];

  const preOrderCards = [
    { label: "Total Pre-Orders", value: data?.preOrders || 0, icon: Clock },
    { label: "Pending Deposits", value: data?.pendingDeposits || 0, icon: CreditCard },
    { label: "Awaiting Arrival", value: data?.awaitingArrival || 0, icon: Package },
    { label: "Ready to Ship", value: data?.readyToShip || 0, icon: Truck }
  ];

  return (
    <div>
      <h1 className="text-3xl font-black">Dashboard</h1>

      {lowStockItems.length > 0 && (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="h-5 w-5" />
            <h2 className="font-bold">Low Stock Alert ({lowStockItems.length})</h2>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {lowStockItems.map((p) => (
              <Link key={p._id} to={`/admin/products/${p._id}/edit`} className="flex items-center justify-between rounded-lg border border-amber-200 bg-white p-3 text-sm transition hover:border-amber-400">
                <span className="font-medium">{p.name}</span>
                <span className="ml-2 shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">{p.stock} left</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.label} className="rounded-lg border border-gray-200 bg-white p-5">
              <Icon className="h-6 w-6 text-ember" />
              <p className="mt-4 text-sm text-gray-600">{card.label}</p>
              <p className="mt-1 text-2xl font-black">{card.value}</p>
            </article>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {preOrderCards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.label} className="rounded-lg border border-amber-200 bg-amber-50 p-5">
              <Icon className="h-6 w-6 text-amber-600" />
              <p className="mt-4 text-sm text-amber-700">{card.label}</p>
              <p className="mt-1 text-2xl font-black text-amber-900">{card.value}</p>
            </article>
          );
        })}
      </div>

      {preOrderLifecycle && (
        <div className="mt-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-800">
            <BarChart3 className="h-5 w-5" /> Pre-Order Lifecycle
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
            <article className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-semibold text-amber-700">Active</p>
              <p className="mt-1 text-xl font-black text-amber-900">{preOrderLifecycle.active || 0}</p>
            </article>
            <article className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold text-gray-600">Closed (Awaiting)</p>
              <p className="mt-1 text-xl font-black text-gray-800">{preOrderLifecycle.closed || 0}</p>
            </article>
            <article className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-semibold text-amber-700">Delayed</p>
              <p className="mt-1 text-xl font-black text-amber-900">{preOrderLifecycle.delayed || 0}</p>
            </article>
            <article className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-semibold text-emerald-700">Arrived</p>
              <p className="mt-1 text-xl font-black text-emerald-900">{preOrderLifecycle.arrived || 0}</p>
            </article>
            <article className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-xs font-semibold text-red-700">Cancelled</p>
              <p className="mt-1 text-xl font-black text-red-900">{preOrderLifecycle.cancelled || 0}</p>
            </article>
            <article className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-semibold text-emerald-700">Converted</p>
              <p className="mt-1 text-xl font-black text-emerald-900">{preOrderLifecycle.converted || 0}</p>
            </article>
          </div>
          {preOrderLifecycle.conversionRate > 0 && (
            <p className="mt-2 text-xs text-gray-500">Conversion rate: {preOrderLifecycle.conversionRate}%</p>
          )}
        </div>
      )}

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          to="/admin/orders"
          className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-5 transition hover:border-ember"
        >
          <ShoppingBag className="h-6 w-6 text-ember" />
          <div>
            <h2 className="font-black">View orders</h2>
            <p className="mt-1 text-sm text-gray-600">Track checkouts and update customer order status.</p>
          </div>
        </Link>
        <Link
          to="/admin/categories"
          className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-5 transition hover:border-ember"
        >
          <Tags className="h-6 w-6 text-ember" />
          <div>
            <h2 className="font-black">Manage categories</h2>
            <p className="mt-1 text-sm text-gray-600">Add or remove shop categories anytime.</p>
          </div>
        </Link>
        <Link
          to="/admin/products/new"
          className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-5 transition hover:border-ember"
        >
          <Plus className="h-6 w-6 text-ember" />
          <div>
            <h2 className="font-black">Add product</h2>
            <p className="mt-1 text-sm text-gray-600">Create a listing and assign it to a category.</p>
          </div>
        </Link>
        <Link
          to="/admin/users"
          className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-5 transition hover:border-ember"
        >
          <Users className="h-6 w-6 text-ember" />
          <div>
            <h2 className="font-black">User management</h2>
            <p className="mt-1 text-sm text-gray-600">Manage accounts and moderation.</p>
          </div>
        </Link>
      </section>
    </div>
  );
};

export default DashboardPage;