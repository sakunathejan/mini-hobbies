import { ExternalLink, Eye, EyeOff, MessageCircle, Package, RefreshCw, Trash2, CheckSquare, Square } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import KoombiyoDeliveryPanel from "../../components/orders/KoombiyoDeliveryPanel.jsx";
import OrderStatusBadge from "../../components/orders/OrderStatusBadge.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import ViewToggle from "../../components/ui/ViewToggle.jsx";
import Pagination from "../../components/ui/Pagination.jsx";
import useFetch from "../../hooks/useFetch.js";
import { deleteOrder, deleteOrders, getOrders, retryWhatsApp, updateOrderStatus } from "../../services/orderService.js";
import { formatCurrency } from "../../utils/formatters.js";

const PER_PAGE = 16;

const statuses = [
  "Pending Advance Payment",
  "Pending Payment Verification",
  "Advance Payment Submitted",
  "Fully Paid Pending Verification",
  "Payment Confirmed",
  "Advance Payment Confirmed",
  "Awaiting Final Payment",
  "Fully Paid",
  "Preparing Order",
  "Shipped", "Delivered", "Cancelled"
];

const AdminOrdersPage = () => {
  const { data, setData, loading, error } = useFetch(getOrders, []);
  const [statusFilter, setStatusFilter] = useState("All");
  const [updatingId, setUpdatingId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [trackingInputs, setTrackingInputs] = useState({});
  const [retryingWhatsApp, setRetryingWhatsApp] = useState("");
  const [showDelivered, setShowDelivered] = useState(false);
  const [view, setView] = useState(() => localStorage.getItem("admin_orders_view") || "list");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleteTarget, setBulkDeleteTarget] = useState(null);

  const orders = Array.isArray(data) ? data : [];

  const filteredOrders = useMemo(() => {
    if (showDelivered) return orders.filter((o) => o.status === "Delivered");
    if (statusFilter !== "All") return orders.filter((o) => o.status === statusFilter);
    return orders.filter((o) => o.status !== "Delivered");
  }, [orders, statusFilter, showDelivered]);

  const totalPages = Math.ceil(filteredOrders.length / PER_PAGE);
  const pageOrders = useMemo(
    () => filteredOrders.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    [filteredOrders, page]
  );

  const allSelected = pageOrders.length > 0 && pageOrders.every((o) => selectedIds.includes(o._id));
  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(selectedIds.filter((id) => !pageOrders.some((o) => o._id === id)));
    } else {
      const pageIds = pageOrders.map((o) => o._id);
      setSelectedIds([...new Set([...selectedIds, ...pageIds])]);
    }
  };
  const toggleOne = (id) => {
    setSelectedIds(selectedIds.includes(id) ? selectedIds.filter((i) => i !== id) : [...selectedIds, id]);
  };

  const handleViewChange = (v) => { setView(v); setPage(1); };

  const changeStatus = async (orderId, status) => {
    setUpdatingId(orderId);
    try {
      const payload = { status, note: `Updated by admin to ${status}` };
      if (trackingInputs[orderId]) payload.trackingNumber = trackingInputs[orderId];
      const updated = await updateOrderStatus(orderId, payload);
      setData(orders.map((o) => (o._id === orderId ? updated : o)));
      toast.success(`Order marked as ${status}.`);
      if (updated.emailSent) toast.success("Email notification sent to customer.");
      else if (updated.emailError) toast((t) => (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Email notification failed.</span>
          <span className="text-xs text-gray-600">{updated.emailError}</span>
        </div>
      ), { duration: 6000 });
      if (updated.customerWhatsappUrl) {
        toast((t) => (
          <div className="flex flex-col gap-2">
            <span className="text-sm">Send WhatsApp update to customer?</span>
            <a href={updated.customerWhatsappUrl} target="_blank" rel="noreferrer" className="btn-primary mt-1 inline-flex items-center justify-center gap-1.5 text-xs" onClick={() => toast.dismiss(t.id)}>
              <MessageCircle className="h-3 w-3" /> Send via WhatsApp
            </a>
          </div>
        ), { duration: 10000 });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update order status.");
    } finally {
      setUpdatingId("");
    }
  };

  const handleRetryWhatsApp = async (orderId) => {
    setRetryingWhatsApp(orderId);
    try {
      const result = await retryWhatsApp(orderId);
      if (result.success && result.whatsappUrl) {
        window.open(result.whatsappUrl, "_blank", "noopener,noreferrer");
        toast.success("WhatsApp link opened.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "WhatsApp retry failed.");
    } finally {
      setRetryingWhatsApp("");
    }
  };

  const handleShipmentCreated = (updatedOrder) => {
    setData(orders.map((o) => (o._id === updatedOrder._id ? updatedOrder : o)));
  };

  const handleDelete = useCallback(async () => {
    if (bulkDeleteTarget) {
      const ids = bulkDeleteTarget;
      try {
        const result = await deleteOrders(ids);
        setData(orders.filter((o) => !ids.includes(o._id)));
        setSelectedIds([]);
        if (page > Math.ceil((orders.length - ids.length) / PER_PAGE)) setPage(Math.max(1, page - 1));
        toast.success(result.message);
      } catch (err) {
        toast.error(err.response?.data?.message || "Could not delete orders.");
      } finally {
        setBulkDeleteTarget(null);
      }
      return;
    }
    if (!deleteTarget) return;
    try {
      await deleteOrder(deleteTarget._id);
      const updated = orders.filter((o) => o._id !== deleteTarget._id);
      setData(updated);
      setSelectedIds(selectedIds.filter((id) => id !== deleteTarget._id));
      if (page > Math.ceil(updated.length / PER_PAGE)) setPage(Math.max(1, page - 1));
      toast.success(`Order ${deleteTarget.orderNumber} deleted.`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete order.");
    } finally {
      setDeleteTarget(null);
    }
  }, [deleteTarget, bulkDeleteTarget, orders, setData, page, selectedIds]);

  const openWhatsApp = (order) => {
    const customer = order.customer || {};
    const items = Array.isArray(order.items) ? order.items : [];
    const phone = customer.phone || "";
    const p = (n) => "LKR " + Number(n || 0).toLocaleString("en-LK");
    if (!phone) { toast.error("Customer did not provide a phone number."); return; }
    const sep = "------------------------";
    const itemLines = items.map((item) => "> " + item.name + " x" + item.quantity + " = " + p(item.price * item.quantity)).join("\n");
    const a = [];
    a.push("*RECEIPT - Mini Hobbies*");
    a.push(sep);
    a.push("ID: " + order.orderNumber);
    a.push("Date: " + (order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-LK") : ""));
    a.push("Status: " + order.status);
    a.push("Payment: " + (order.paymentMethod || "N/A"));
    a.push(sep);
    a.push(customer.name || "");
    a.push("Tel: " + (customer.phone || ""));
    a.push(customer.address || "");
    a.push(sep);
    a.push("*Items*");
    a.push(itemLines);
    a.push(sep);
    if (order.discount > 0) a.push("Discount: -" + p(order.discount));
    a.push("Subtotal: " + p(order.subtotal));
    a.push("Delivery: " + p(order.deliveryFee));
    a.push("*Total: " + p(order.total) + "*");
    if (order.notes) a.push("Note: " + order.notes);
    if (order.trackingNumber) a.push("Tracking: " + order.trackingNumber);
    const msg = a.filter(Boolean).join("\n");
    const digits = phone.replace(/\D/g, "");
    const intl = digits.startsWith("94") ? digits : "94" + digits.replace(/^0/, "");
    window.open("https://wa.me/" + intl + "?text=" + encodeURIComponent(msg), "_blank", "noopener,noreferrer");
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Orders</h1>
          <p className="mt-1 text-sm text-gray-600">Track customer orders and update delivery status.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ViewToggle view={view} onChange={handleViewChange} storageKey="admin_orders_view" />
          <button type="button" onClick={() => setShowDelivered(!showDelivered)} className={`btn-secondary text-xs min-h-[44px] ${showDelivered ? "bg-ember text-white" : ""}`}>
            {showDelivered ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showDelivered ? "Active orders" : "Delivered only"}
          </button>
          {selectedIds.length > 0 && (
            <button type="button" onClick={() => setBulkDeleteTarget([...selectedIds])} className="btn-danger text-xs">
              <Trash2 className="mr-1 h-4 w-4" /> Delete ({selectedIds.length})
            </button>
          )}
          <select className="input w-full sm:w-56 text-base" value={showDelivered ? "Delivered" : statusFilter} disabled={showDelivered} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All statuses</option>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {loading && <p className="mt-6 text-sm text-gray-600">Loading orders...</p>}
      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

      {!loading && !error && !filteredOrders.length && (
        <p className="mt-6 rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-600">
          No orders yet. New checkout orders will appear here.
        </p>
      )}

      {view === "list" ? (
        <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="w-10 p-4">
                  <button type="button" onClick={toggleAll} className="flex items-center">
                    {allSelected ? <CheckSquare className="h-4 w-4 text-ember" /> : <Square className="h-4 w-4 text-gray-400" />}
                  </button>
                </th>
                <th className="p-4">Order</th>
                <th className="p-4">Date</th>
                <th className="p-4">Items</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Total</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Delivery</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageOrders.map((order) => {
                const customer = order.customer || {};
                return (
                  <tr key={order._id} className={`border-t ${selectedIds.includes(order._id) ? "bg-amber-50" : ""}`}>
                    <td className="p-4">
                      <button type="button" onClick={() => toggleOne(order._id)} className="flex items-center">
                        {selectedIds.includes(order._id) ? <CheckSquare className="h-4 w-4 text-ember" /> : <Square className="h-4 w-4 text-gray-400" />}
                      </button>
                    </td>
                    <td className="p-4 font-semibold">{order.orderNumber}</td>
                    <td className="p-4 text-gray-600 text-xs">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-LK") : "—"}
                    </td>
                    <td className="p-4">
                      {order.items?.[0] && (
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 shrink-0 overflow-hidden rounded bg-gray-100">
                            {(order.items[0].variantImage || order.items[0].image) ? (
                              <img src={order.items[0].variantImage || order.items[0].image} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-gray-300"><Package className="h-4 w-4" /></div>
                            )}
                          </div>
                          <div className="min-w-0 max-w-[120px]">
                            <p className="truncate text-xs font-medium">{order.items[0].name}</p>
                            {order.items[0].variantName && <p className="truncate text-[10px] text-gray-500">{order.items[0].variantName}</p>}
                            {order.items.length > 1 && <p className="text-[10px] text-gray-400">+{order.items.length - 1}</p>}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <p className="font-medium">{customer.name || "—"}</p>
                      <p className="text-xs text-gray-500">{customer.phone || ""}</p>
                    </td>
                    <td className="p-4 font-bold">{formatCurrency(order.total || 0)}</td>
                    <td className="p-4">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {order.paymentMethod === "bank_transfer" ? "Bank" : order.paymentMethod === "cod" ? "COD" : "Advance"}
                      </span>
                    </td>
                    <td className="p-4">
                      <KoombiyoDeliveryPanel order={order} onShipmentCreated={handleShipmentCreated} compact />
                    </td>
                    <td className="p-4"><OrderStatusBadge status={order.status} /></td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <select
                          className="input w-32 text-xs"
                          value={order.status}
                          disabled={updatingId === order._id}
                          onChange={(e) => changeStatus(order._id, e.target.value)}
                        >
                          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button type="button" onClick={() => setDeleteTarget(order)} className="rounded-md p-2 text-red-600 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {pageOrders.map((order) => {
            const customer = order.customer || {};
            const items = Array.isArray(order.items) ? order.items : [];

            return (
              <article key={order._id} className={`rounded-lg border bg-white p-4 ${selectedIds.includes(order._id) ? "border-ember ring-1 ring-ember" : "border-gray-200"}`}>
                <div className="flex items-start justify-between gap-2">
                  <button type="button" onClick={() => toggleOne(order._id)} className="mt-0.5 shrink-0">
                    {selectedIds.includes(order._id) ? <CheckSquare className="h-4 w-4 text-ember" /> : <Square className="h-4 w-4 text-gray-400" />}
                  </button>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">
                      {order.createdAt ? new Date(order.createdAt).toLocaleString("en-LK") : "—"}
                    </p>
                    <h2 className="text-base font-black truncate">{order.orderNumber}</h2>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>

                <p className="mt-2 text-xs text-gray-600 truncate">
                  {customer.name || "—"} · {customer.phone || "—"}
                </p>

                <div className="mt-2 flex items-center justify-between">
                  <strong className="text-base">{formatCurrency(order.total || 0)}</strong>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                    {order.paymentMethod === "bank_transfer" ? "Bank" : order.paymentMethod === "cod" ? "COD" : "Advance"}
                  </span>
                </div>

                <ul className="mt-2 divide-y rounded-md border border-gray-100">
                  {items.slice(0, 3).map((item) => (
                    <li key={`${order._id}-${item.name}`} className="flex items-center gap-2 px-3 py-1.5 text-xs">
                      <div className="h-7 w-7 shrink-0 overflow-hidden rounded bg-gray-100">
                        {(item.variantImage || item.image) ? (
                          <img src={item.variantImage || item.image} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-gray-300"><Package className="h-3 w-3" /></div>
                        )}
                      </div>
                      <span className="flex-1 truncate">{item.name}{item.variantName ? ` (${item.variantName})` : ""} x{item.quantity}</span>
                      <span className="shrink-0">{formatCurrency((item.price || 0) * item.quantity)}</span>
                    </li>
                  ))}
                  {items.length > 3 && (
                    <li className="px-3 py-1.5 text-xs text-gray-500">+{items.length - 3} more items</li>
                  )}
                </ul>

                {order.discount > 0 && (
                  <p className="mt-1 text-xs text-emerald-600">Discount: -{formatCurrency(order.discount)}</p>
                )}
                {order.notes && <p className="mt-1 text-xs text-gray-500 truncate">Notes: {order.notes}</p>}
                {order.trackingNumber && <p className="mt-1 text-xs text-blue-600">Tracking: {order.trackingNumber}</p>}
                {order.payment?.bankTransfer?.slipUrl && (
                  <a href={order.payment.bankTransfer.slipUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-ember hover:underline">
                    <ExternalLink className="h-3 w-3" /> View slip
                  </a>
                )}

                <div className="mt-2">
                  <KoombiyoDeliveryPanel order={order} onShipmentCreated={handleShipmentCreated} compact />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <select
                    className="input flex-1 min-w-0 text-xs"
                    value={order.status}
                    disabled={updatingId === order._id}
                    onChange={(e) => changeStatus(order._id, e.target.value)}
                  >
                    {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button type="button" onClick={() => openWhatsApp(order)} className="btn-secondary px-2 py-1.5 text-xs" title="Send Receipt">
                    <MessageCircle className="h-3 w-3" />
                  </button>
                  <button type="button" onClick={() => handleRetryWhatsApp(order._id)} className="btn-secondary px-2 py-1.5 text-xs" disabled={retryingWhatsApp === order._id} title="Status Update">
                    <RefreshCw className={`h-3 w-3 ${retryingWhatsApp === order._id ? "animate-spin" : ""}`} />
                  </button>
                  <button type="button" onClick={() => setDeleteTarget(order)} className="rounded-md px-2 py-1.5 text-red-600 hover:bg-red-50 text-xs">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8">
          <Pagination current={page} total={totalPages} onChange={setPage} />
        </div>
      )}

      <ConfirmDialog
        open={!!bulkDeleteTarget}
        title={`Delete ${bulkDeleteTarget?.length || 0} orders?`}
        message={`Are you sure you want to delete ${bulkDeleteTarget?.length || 0} orders? This action cannot be undone.`}
        confirmLabel={`Delete ${bulkDeleteTarget?.length || 0} orders`}
        cancelLabel="Cancel"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setBulkDeleteTarget(null)}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete order?"
        message={`Are you sure you want to delete order ${deleteTarget?.orderNumber}? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default AdminOrdersPage;
