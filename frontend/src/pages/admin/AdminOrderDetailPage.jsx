import { ArrowLeft, CreditCard, ExternalLink, FileText, MapPin, Package, Printer, Truck, User, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import OrderStatusBadge from "../../components/orders/OrderStatusBadge.jsx";
import OrderTimeline from "../../components/orders/OrderTimeline.jsx";
import { getOrderById, updateOrderStatus } from "../../services/orderService.js";
import { formatCurrency } from "../../utils/formatters.js";

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
  "Shipped",
  "Delivered",
  "Cancelled"
];

const paymentLabels = {
  bank_transfer: "Bank Transfer",
  cod: "Cash on Delivery",
  advance: "50% Advance"
};

const AdminOrderDetailPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [trackingInput, setTrackingInput] = useState("");
  const [slipImgError, setSlipImgError] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getOrderById(orderId);
        setOrder(data);
        setNewStatus(data.status);
        setTrackingInput(data.trackingNumber || "");
      } catch {
        setError("Failed to load order. It may have been deleted.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [orderId]);

  const handleUpdateStatus = async () => {
    if (newStatus === order.status) return;
    setUpdating(true);
    try {
      const payload = { status: newStatus, note: `Updated by admin to ${newStatus}` };
      if (trackingInput) payload.trackingNumber = trackingInput;
      const updated = await updateOrderStatus(orderId, payload);
      setOrder((prev) => ({ ...prev, ...updated }));
      toast.success(`Order updated to ${newStatus}.`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update order.");
    } finally {
      setUpdating(false);
    }
  };

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-ember" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
        <XCircle className="mx-auto h-10 w-10 text-red-400" />
        <p className="mt-3 font-semibold text-red-700">{error}</p>
        <button onClick={() => navigate("/admin/orders")} className="btn-secondary mt-4 text-sm">
          Back to Orders
        </button>
      </div>
    );
  }

  if (!order) return null;

  const customer = order.customer || {};
  const items = order.items || [];
  const payment = order.payment || {};
  const bankTransfer = payment.bankTransfer || {};

  const paymentStatus = payment.status || "";
  const isPaymentPending = paymentStatus === "awaiting_verification";
  const isPaymentVerified = paymentStatus === "verified";

  const paymentStatusLabel = order.paymentType === "cod"
    ? "Cash on Delivery"
    : isPaymentVerified
      ? "Verified"
      : isPaymentPending
        ? "Pending"
        : paymentStatus === "pending"
          ? "Pending"
          : order.status === "Fully Paid" || order.fullyPaidAt
            ? "Paid"
            : paymentStatus || "—";

  return (
    <div>
      <button
        onClick={() => navigate("/admin/orders")}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Orders
      </button>

      <div className="print-section">
        <div className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-gray-200 bg-white p-6">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-black">{order.orderNumber}</h1>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Created {new Date(order.createdAt).toLocaleDateString("en-LK", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <button onClick={handlePrint} className="btn-secondary flex items-center gap-1.5 text-sm">
            <Printer className="h-4 w-4" /> Print
          </button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <section className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-500">
                <Package className="h-4 w-4" /> Items ({items.length})
              </h2>
              <div className="divide-y divide-gray-100">
                {items.map((item, i) => {
                  const displayImage = item.variantImage || item.image;
                  return (
                    <div key={i} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        {displayImage ? (
                          <img src={displayImage} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-gray-300">
                            <Package className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900">{item.name}</p>
                        {item.variantName && (
                          <p className="text-sm text-gray-500">{item.variantName}</p>
                        )}
                        <p className="mt-0.5 text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-bold text-gray-900">{formatCurrency((item.price || 0) * item.quantity)}</p>
                        <p className="text-xs text-gray-400">{formatCurrency(item.price)} each</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 border-t border-gray-200 pt-4 space-y-1 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span>{order.deliveryFee > 0 ? formatCurrency(order.deliveryFee) : "Free"}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-black text-gray-900">
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
                {order.advanceAmount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>Advance paid</span>
                    <span>-{formatCurrency(order.advanceAmount)}</span>
                  </div>
                )}
                {order.remainingBalance > 0 && (
                  <div className="flex justify-between text-sm text-amber-600">
                    <span>Remaining balance</span>
                    <span>{formatCurrency(order.remainingBalance)}</span>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-500">
                <CreditCard className="h-4 w-4" /> Payment
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-400">Method</p>
                  <p className="font-semibold">{paymentLabels[order.paymentMethod] || order.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Type</p>
                  <p className="font-semibold">
                    {order.paymentMethod === "advance"
                      ? "Advance (50%)"
                      : order.paymentMethod === "cod"
                        ? "Cash on Delivery"
                        : "Full Payment"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Status</p>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      isPaymentVerified || paymentStatusLabel === "Paid"
                        ? "bg-emerald-50 text-emerald-700"
                        : isPaymentPending
                          ? "bg-amber-50 text-amber-700"
                          : paymentStatusLabel === "Cash on Delivery"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {isPaymentVerified ? "Verified" : isPaymentPending ? "Pending" : paymentStatusLabel}
                  </span>
                </div>
                {order.paymentMethod === "advance" && order.advanceAmount > 0 && (
                  <div>
                    <p className="text-xs text-gray-400">Advance (50%)</p>
                    <p className="font-semibold">{formatCurrency(order.advanceAmount)}</p>
                  </div>
                )}
                {order.remainingBalance > 0 && (
                  <div>
                    <p className="text-xs text-gray-400">Remaining</p>
                    <p className="font-semibold">{formatCurrency(order.remainingBalance)}</p>
                  </div>
                )}
                {order.paymentMethod === "advance" && order.remainingBalance > 0 && (
                  <div>
                    <p className="text-xs text-gray-400">Total Order</p>
                    <p className="font-semibold">{formatCurrency(order.total)}</p>
                  </div>
                )}
                {order.paymentMethod !== "advance" && order.paymentMethod !== "cod" && (
                  <div>
                    <p className="text-xs text-gray-400">{order.fullyPaidAt ? "Paid" : "Total"}</p>
                    <p className="font-semibold">{formatCurrency(order.total)}</p>
                  </div>
                )}
                {order.fullyPaidAt && (
                  <div>
                    <p className="text-xs text-gray-400">Paid On</p>
                    <p className="font-semibold">{new Date(order.fullyPaidAt).toLocaleDateString("en-LK")}</p>
                  </div>
                )}
              </div>
              {bankTransfer.slipUrl && (
                <div className="mt-4">
                  <p className="mb-1 text-xs text-gray-400">Payment Slip</p>
                  <a
                    href={bankTransfer.slipUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-ember hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" /> View Payment Slip
                  </a>
                  <div className="mt-2 max-w-xs overflow-hidden rounded-lg border border-gray-200">
                    {bankTransfer.slipUrl.match(/\.pdf$/i) ? (
                      <div className="flex h-32 items-center justify-center bg-gray-50 text-gray-400">
                        <FileText className="h-10 w-10" />
                        <span className="ml-2 text-sm font-medium">PDF document</span>
                      </div>
                    ) : slipImgError ? (
                      <div className="flex h-32 items-center justify-center bg-gray-50 text-gray-400">
                        <FileText className="h-10 w-10" />
                        <span className="ml-2 text-sm font-medium">Preview unavailable</span>
                      </div>
                    ) : (
                      <a href={bankTransfer.slipUrl} target="_blank" rel="noreferrer">
                        <img
                          src={bankTransfer.slipUrl}
                          alt="Payment slip"
                          className="h-32 w-full object-cover object-top"
                          onError={() => setSlipImgError(true)}
                        />
                      </a>
                    )}
                  </div>
                </div>
              )}
              {payment?._id && !bankTransfer.slipUrl && (
                <p className="mt-4 text-xs text-gray-400 italic">No payment slip uploaded with this order.</p>
              )}
              {bankTransfer.bankName && (
                <div className="mt-4 grid gap-2 sm:grid-cols-2 text-sm">
                  <div>
                    <p className="text-xs text-gray-400">Bank</p>
                    <p className="font-medium">{bankTransfer.bankName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Account Name</p>
                    <p className="font-medium">{bankTransfer.accountName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Account Number</p>
                    <p className="font-medium">{bankTransfer.accountNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Branch</p>
                    <p className="font-medium">{bankTransfer.branch}</p>
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-500">
                <Truck className="h-4 w-4" /> Delivery
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-400">Address</p>
                  <p className="font-medium">{customer.address}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">District / City</p>
                  <p className="font-medium">{customer.district || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Delivery Fee</p>
                  <p className="font-medium">{order.deliveryFee > 0 ? formatCurrency(order.deliveryFee) : "Free"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Tracking Number</p>
                  <p className="font-medium">{order.trackingNumber || "—"}</p>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-500">
                <MapPin className="h-4 w-4" /> Order Timeline
              </h2>
              <OrderTimeline order={order} />
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-500">
                <User className="h-4 w-4" /> Customer
              </h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400">Name</p>
                  <p className="font-semibold">{customer.name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="font-semibold">{customer.email || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Phone</p>
                  <p className="font-semibold">{customer.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Address</p>
                  <p className="text-gray-700">{customer.address}{customer.district ? `, ${customer.district}` : ""}</p>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500">
                Admin Actions
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-500">Update Status</label>
                  <select
                    className="input w-full text-sm"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleUpdateStatus}
                    disabled={updating || newStatus === order.status}
                    className="btn-primary mt-2 w-full text-sm"
                  >
                    {updating ? "Updating..." : "Update Status"}
                  </button>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-500">Tracking Number</label>
                  <input
                    className="input w-full text-sm"
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    placeholder="Enter tracking number"
                  />
                </div>

                {order.notes && (
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-500">Order Notes</label>
                    <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">{order.notes}</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetailPage;
