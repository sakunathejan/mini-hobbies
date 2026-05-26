import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Search, X, ChevronDown, Clock, MapPin, CreditCard, Phone, User, ShoppingBag, Truck, Home, CheckCircle, XCircle, Loader2, AlertCircle, ArrowUpDown, Eye, Download, RefreshCw } from "lucide-react";
import { getMyOrders, getMyOrder } from "../../services/customerOrderService.js";
import OrderStatusBadge from "./OrderStatusBadge.jsx";
import OrderTimeline from "./OrderTimeline.jsx";

const fmt = (n) => "LKR " + Number(n || 0).toLocaleString("en-LK");

const statusFilters = ["All", "Pending Payment Verification", "Payment Confirmed", "Preparing Order", "Shipped", "Delivered", "Cancelled"];
const sortOptions = [
  { value: "-createdAt", label: "Newest first" },
  { value: "createdAt", label: "Oldest first" },
  { value: "-total", label: "Highest value" },
  { value: "total", label: "Lowest value" },
];

const statusStyles = {
  "Pending Advance Payment": "bg-amber-50 text-amber-800 ring-amber-200",
  "Pending Payment Verification": "bg-purple-50 text-purple-800 ring-purple-200",
  "Payment Confirmed": "bg-emerald-50 text-emerald-800 ring-emerald-200",
  "Advance Payment Submitted": "bg-purple-50 text-purple-800 ring-purple-200",
  "Advance Payment Confirmed": "bg-emerald-50 text-emerald-800 ring-emerald-200",
  "Awaiting Final Payment": "bg-indigo-50 text-indigo-800 ring-indigo-200",
  "Fully Paid": "bg-emerald-50 text-emerald-800 ring-emerald-200",
  "Preparing Order": "bg-sky-50 text-sky-800 ring-sky-200",
  "Shipped": "bg-blue-50 text-blue-800 ring-blue-200",
  "Delivered": "bg-emerald-50 text-emerald-800 ring-emerald-200",
  "Cancelled": "bg-red-50 text-red-700 ring-red-200",
  default: "bg-gray-100 text-gray-700 ring-gray-200",
};

const paymentStyles = {
  paid: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  failed: "bg-red-50 text-red-700",
  refunded: "bg-indigo-50 text-indigo-700",
};

const getPaymentBadge = (order) => {
  const s = order.status || "";
  if (s === "Cancelled") return { label: "Cancelled", style: paymentStyles.failed };
  if (["Delivered", "Fully Paid", "Payment Confirmed", "Advance Payment Confirmed"].includes(s)) return { label: "Paid", style: paymentStyles.paid };
  if (["Pending Payment Verification", "Advance Payment Submitted", "Pending Advance Payment"].includes(s)) return { label: "Pending", style: paymentStyles.pending };
  return { label: "Pending", style: paymentStyles.pending };
};

const SkeletonRow = () => (
  <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-lg bg-gray-200 sm:h-14 sm:w-14" />
        <div className="space-y-2">
          <div className="h-4 w-28 rounded bg-gray-200" />
          <div className="h-3 w-20 rounded bg-gray-200" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-6 w-20 rounded-full bg-gray-200" />
        <div className="h-4 w-16 rounded bg-gray-200" />
      </div>
    </div>
  </div>
);

const EmptyState = ({ search }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-gray-200 bg-white p-10 text-center">
    <Package className="mx-auto h-12 w-12 text-gray-300" />
    <h3 className="mt-4 text-lg font-black text-gray-900">{search ? "No matching orders" : "No orders yet"}</h3>
    <p className="mt-1 text-sm text-gray-500">
      {search ? "Try a different search or filter." : "Your order history will appear here after your first purchase."}
    </p>
    {!search && (
      <a href="/products" className="btn-primary mt-5 inline-flex">
        <ShoppingBag className="h-4 w-4" /> Browse products
      </a>
    )}
  </motion.div>
);

const DetailModal = ({ order, onClose }) => {
  if (!order) return null;
  const pay = getPaymentBadge(order);
  const baseUrl = import.meta.env.VITE_CLIENT_URL || window.location.origin;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-8 sm:p-8 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }} className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-gray-200 bg-white px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold text-gray-500">Order #{order.orderNumber}</p>
            <p className="text-sm text-gray-400">{new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
          <div className="flex items-center gap-2">
            <a href={`${baseUrl}/track-order?order=${order.orderNumber}&phone=${encodeURIComponent(order.customer?.phone || "")}`} target="_blank" rel="noopener noreferrer" className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
              <Eye className="h-4 w-4" />
            </a>
            <button onClick={onClose} className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          {/* Status badges */}
          <div className="flex flex-wrap gap-2">
            <OrderStatusBadge status={order.status} />
            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${pay.style}`}>
              {pay.label}
            </span>
          </div>

          {/* Timeline */}
          <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 sm:p-5">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">Order progress</h4>
            <OrderTimeline order={order} />
          </div>

          {/* Items */}
          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">Items ({order.items?.length || 0})</h4>
            <div className="divide-y divide-gray-100 rounded-xl border border-gray-200">
              {order.items?.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-16 sm:w-16">
                    {item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-gray-400"><Package className="h-6 w-6" /></div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">{item.name}</p>
                    {item.variantName && <p className="text-xs text-gray-500">{item.variantName}</p>}
                    <p className="mt-0.5 text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="shrink-0 text-sm font-bold text-gray-900">{fmt(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">Payment summary</h4>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{fmt(order.subtotal)}</span></div>
              <div className="flex justify-between text-gray-600"><span>Delivery</span><span>{order.deliveryFee > 0 ? fmt(order.deliveryFee) : "Free"}</span></div>
              {order.discount > 0 && <div className="flex justify-between text-red-600"><span>Discount</span><span>-{fmt(order.discount)}</span></div>}
              {order.advanceAmount > 0 && <div className="flex justify-between text-emerald-600"><span>Advance paid</span><span>-{fmt(order.advanceAmount)}</span></div>}
              {order.remainingBalance > 0 && <div className="flex justify-between text-amber-600"><span>Remaining</span><span>{fmt(order.remainingBalance)}</span></div>}
              <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-black text-gray-900"><span>Total</span><span>{fmt(order.total)}</span></div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <CreditCard className="h-3.5 w-3.5" />
              {order.paymentMethod === "bank_transfer" ? "Bank Transfer" : order.paymentMethod === "cod" ? "Cash on Delivery" : order.paymentMethod === "advance" ? "50% Advance" : order.paymentMethod}
            </div>
          </div>

          {/* Shipping */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">Shipping details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <User className="h-4 w-4 text-gray-400" /> {order.customer?.name}
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Phone className="h-4 w-4 text-gray-400" /> {order.customer?.phone}
              </div>
              <div className="flex items-start gap-2 text-gray-700">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <span>{order.customer?.address}{order.customer?.district ? `, ${order.customer.district}` : ""}</span>
              </div>
              {order.trackingNumber && (
                <div className="flex items-center gap-2 text-blue-700">
                  <Truck className="h-4 w-4" /> Tracking: {order.trackingNumber}
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-bold text-amber-800">Order note</p>
              <p className="mt-1 text-sm text-amber-700">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-between rounded-b-2xl border-t border-gray-200 bg-white px-5 py-4 sm:px-6">
          <a href={`${baseUrl}/track-order?order=${order.orderNumber}&phone=${encodeURIComponent(order.customer?.phone || "")}`} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-ember hover:underline">
            Track full order
          </a>
          <button onClick={onClose} className="btn-secondary text-sm min-h-[40px]">Close</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const MyOrdersSection = () => {
  const [data, setData] = useState({ orders: [], pagination: { page: 1, total: 0, pages: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sort, setSort] = useState("-createdAt");
  const [page, setPage] = useState(1);
  const [detailOrder, setDetailOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit: 10, sort };
      if (statusFilter !== "All") params.status = statusFilter;
      if (search.trim()) params.search = search.trim();
      const result = await getMyOrders(params);
      setData(result);
    } catch {
      setError("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, sort, search]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const openDetail = async (id) => {
    setDetailLoading(true);
    try {
      const order = await getMyOrder(id);
      setDetailOrder(order);
    } catch {
      setError("Failed to load order details.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  return (
    <div>
      {/* Search & filters */}
      <div className="mb-5 space-y-3 sm:flex sm:items-center sm:gap-3 sm:space-y-0">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order # or product..."
            className="input w-full pl-10 pr-10 text-sm"
          />
          {search && <button type="button" onClick={() => { setSearch(""); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>}
        </form>
        <div className="flex gap-2">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input text-sm min-w-[140px]">
            {statusFilters.map((s) => <option key={s} value={s}>{s === "All" ? "All statuses" : s}</option>)}
          </select>
          <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} className="input text-sm min-w-[130px]">
            {sortOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          <button onClick={fetchOrders} className="ml-auto font-semibold underline">Retry</button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && data.orders.length === 0 && <EmptyState search={search} />}

      {/* Orders list */}
      {!loading && data.orders.length > 0 && (
        <div className="space-y-3">
          {data.orders.map((order) => {
            const pay = getPaymentBadge(order);
            return (
              <motion.div key={order._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="group cursor-pointer rounded-xl border border-gray-200 bg-white p-4 transition hover:border-gray-300 hover:shadow-sm sm:p-5" onClick={() => openDetail(order._id)}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-16 sm:w-16">
                      {order.items?.[0]?.image ? (
                        <img src={order.items[0].image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-300"><Package className="h-6 w-6" /></div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-gray-900">#{order.orderNumber}</p>
                      <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-3">
                    <OrderStatusBadge status={order.status} />
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${pay.style}`}>{pay.label}</span>
                    <p className="min-w-[90px] text-right text-sm font-black text-gray-900 sm:text-base">{fmt(order.total)}</p>
                    <ChevronDown className="hidden h-4 w-4 -rotate-90 text-gray-300 transition group-hover:text-gray-500 sm:block" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {data.pagination.pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn-secondary min-h-[40px] px-3 text-sm disabled:opacity-40">Previous</button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(data.pagination.pages, 5) }).map((_, i) => {
              let p;
              if (data.pagination.pages <= 5) {
                p = i + 1;
              } else if (page <= 3) {
                p = i + 1;
              } else if (page >= data.pagination.pages - 2) {
                p = data.pagination.pages - 4 + i;
              } else {
                p = page - 2 + i;
              }
              return (
                <button key={p} onClick={() => setPage(p)} className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold transition ${p === page ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
                  {p}
                </button>
              );
            })}
          </div>
          <button disabled={page >= data.pagination.pages} onClick={() => setPage(page + 1)} className="btn-secondary min-h-[40px] px-3 text-sm disabled:opacity-40">Next</button>
        </div>
      )}

      {/* Detail modal */}
      <AnimatePresence>
        {detailOrder && <DetailModal order={detailOrder} onClose={() => { setDetailOrder(null); setDetailLoading(false); }} />}
      </AnimatePresence>

      {detailLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      )}
    </div>
  );
};

export default MyOrdersSection;
