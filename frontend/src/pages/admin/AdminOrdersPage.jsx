import { ExternalLink, Eye, EyeOff, MessageCircle, Package, RefreshCw, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import OrderStatusBadge from "../../components/orders/OrderStatusBadge.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import useFetch from "../../hooks/useFetch.js";
import { deleteOrder, getOrders, retryWhatsApp, updateOrderStatus } from "../../services/orderService.js";
import { formatCurrency } from "../../utils/formatters.js";

const statuses = [
  "Pending Advance Payment",
  "Pending Payment Verification",
  "Advance Payment Submitted",
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

  const orders = Array.isArray(data) ? data : [];

  const filteredOrders = useMemo(() => {
    if (showDelivered) {
      return orders.filter((order) => order.status === "Delivered");
    }
    if (statusFilter !== "All") {
      return orders.filter((order) => order.status === statusFilter);
    }
    return orders.filter((order) => order.status !== "Delivered");
  }, [orders, statusFilter, showDelivered]);

  const changeStatus = async (orderId, status) => {
    setUpdatingId(orderId);
    try {
      const payload = { status, note: `Updated by admin to ${status}` };
      if (trackingInputs[orderId]) {
        payload.trackingNumber = trackingInputs[orderId];
      }
      const updated = await updateOrderStatus(orderId, payload);
      setData(orders.map((order) => (order._id === orderId ? updated : order)));
      toast.success(`Order marked as ${status}.`);
      if (updated.emailSent) {
        toast.success("Email notification sent to customer.");
      } else if (updated.emailError) {
        toast((t) => (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Email notification failed.</span>
            <span className="text-xs text-gray-600">{updated.emailError}</span>
          </div>
        ), { duration: 6000 });
      }
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

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteOrder(deleteTarget._id);
      setData(orders.filter((o) => o._id !== deleteTarget._id));
      toast.success(`Order ${deleteTarget.orderNumber} deleted.`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete order.");
    } finally {
      setDeleteTarget(null);
    }
  }, [deleteTarget, orders, setData]);

  const openWhatsApp = (order) => {
    const customer = order.customer || {};
    const items = Array.isArray(order.items) ? order.items : [];
    const phone = customer.phone || "";
    const p = (n) => "LKR " + Number(n || 0).toLocaleString("en-LK");
    if (!phone) {
      toast.error("Customer did not provide a phone number.");
      return;
    }
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
          <button type="button" onClick={() => setShowDelivered(!showDelivered)} className={`btn-secondary text-xs min-h-[44px] ${showDelivered ? "bg-ember text-white" : ""}`}>
            {showDelivered ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showDelivered ? "Active orders" : "Delivered only"}
          </button>
          <select className="input w-full sm:w-56 text-base" value={showDelivered ? "Delivered" : statusFilter} disabled={showDelivered} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && <p className="mt-6 text-sm text-gray-600">Loading orders...</p>}
      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

      <div className="mt-6 grid gap-4">
        {!loading && !error && !filteredOrders.length && (
          <p className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-600">
            No orders yet. New checkout orders will appear here.
          </p>
        )}

        {filteredOrders.map((order) => {
          const customer = order.customer || {};
          const items = Array.isArray(order.items) ? order.items : [];

          return (
            <article key={order._id} className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-600">
                    {order.createdAt ? new Date(order.createdAt).toLocaleString("en-LK") : "—"}
                  </p>
                  <h2 className="text-xl font-black">{order.orderNumber}</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    {customer.name || "—"} · {customer.phone || "—"} · {customer.email || "—"}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">{customer.address || "—"}</p>
                  {customer.district && (
                    <p className="text-xs text-gray-500">District: {customer.district}</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <OrderStatusBadge status={order.status} />
                  <strong className="text-lg">{formatCurrency(order.total || 0)}</strong>
                  {order.paymentMethod && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                      {order.paymentMethod === "bank_transfer" ? "Bank" : order.paymentMethod === "cod" ? "COD" : "Advance"}
                    </span>
                  )}
                </div>
              </div>

              <ul className="mt-4 divide-y rounded-md border border-gray-100">
                {items.map((item) => (
                  <li key={`${order._id}-${item.name}-${item.price}`} className="flex justify-between gap-4 px-4 py-2 text-sm">
                    <span>{item.name} x{item.quantity}</span>
                    <span>{formatCurrency((item.price || 0) * item.quantity)}</span>
                  </li>
                ))}
              </ul>

              {order.discount > 0 && (
                <p className="mt-2 text-sm text-emerald-600">Discount: -{formatCurrency(order.discount)}</p>
              )}
              {order.paymentMethod === "advance" && (
                <p className="mt-1 text-sm text-purple-600">
                  Advance: {formatCurrency(order.advanceAmount || 0)} |
                  Remaining: {formatCurrency(order.remainingBalance || 0)}
                  {order.fullyPaidAt && ` | Fully paid: ${new Date(order.fullyPaidAt).toLocaleDateString("en-LK")}`}
                </p>
              )}
              {order.notes && <p className="mt-1 text-sm text-gray-600">Notes: {order.notes}</p>}
              {order.emailSentAt && (
                <p className="mt-1 text-xs text-emerald-600">
                  Email sent {new Date(order.emailSentAt).toLocaleString("en-LK")}
                </p>
              )}
              {order.payment?.bankTransfer?.slipUrl && (
                <a href={order.payment.bankTransfer.slipUrl} target="_blank" rel="noreferrer" className="btn-secondary mt-2 inline-flex text-sm">
                  <ExternalLink className="h-4 w-4" /> View payment slip
                </a>
              )}
              {order.trackingNumber && (
                <p className="mt-1 text-sm text-blue-600">Tracking: {order.trackingNumber}</p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <label className="w-full text-sm font-semibold text-gray-700 sm:w-auto">Update status</label>
                <select
                  className="input w-full sm:w-auto sm:max-w-xs text-base"
                  value={order.status}
                  disabled={updatingId === order._id}
                  onChange={(e) => changeStatus(order._id, e.target.value)}
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                {(order.status === "Fully Paid" || order.status === "Preparing Order" || order.status === "Shipped") && (
                  <input
                    className="input w-full sm:w-auto sm:max-w-[200px] text-base"
                    placeholder="Tracking number"
                    value={trackingInputs[order._id] || order.trackingNumber || ""}
                    onChange={(e) => setTrackingInputs({ ...trackingInputs, [order._id]: e.target.value })}
                  />
                )}
                <button type="button" onClick={() => openWhatsApp(order)} className="btn-secondary min-h-[44px]">
                  <MessageCircle className="h-4 w-4" /> Send Receipt
                </button>
                <button type="button" onClick={() => handleRetryWhatsApp(order._id)} className="btn-secondary text-xs min-h-[44px]" disabled={retryingWhatsApp === order._id}>
                  <RefreshCw className={`h-4 w-4 ${retryingWhatsApp === order._id ? "animate-spin" : ""}`} />
                  {retryingWhatsApp === order._id ? "Opening..." : "Status Update"}
                </button>
                <button type="button" onClick={() => setDeleteTarget(order)} className="btn-danger min-h-[44px]">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </article>
          );
        })}
      </div>

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
