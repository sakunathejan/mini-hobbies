import { Check, ChevronDown, ChevronUp, ExternalLink, Eye, Trash2, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import OrderStatusBadge from "../../components/orders/OrderStatusBadge.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import PromptDialog from "../../components/ui/PromptDialog.jsx";
import useFetch from "../../hooks/useFetch.js";
import { deletePayment, getPayments, rejectPayment, verifyPayment } from "../../services/paymentService.js";
import { formatCurrency } from "../../utils/formatters.js";

const AdminPaymentVerificationPage = () => {
  const { data, setData, loading, error } = useFetch(getPayments, []);
  const [processing, setProcessing] = useState("");
  const [rejectTarget, setRejectTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [expanded, setExpanded] = useState({});

  const payments = Array.isArray(data) ? data : [];

  const handleVerify = async (id) => {
    setProcessing(id);
    try {
      const result = await verifyPayment(id);
      setData(payments.map((p) => (p._id === id ? result.payment : p)));
      toast.success("Payment verified.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed.");
    } finally {
      setProcessing("");
    }
  };

  const handleReject = async (reason) => {
    const id = rejectTarget;
    setRejectTarget(null);
    setProcessing(id);
    try {
      const result = await rejectPayment(id, reason || "Payment rejected");
      setData(payments.map((p) => (p._id === id ? result.payment : p)));
      toast.success("Payment rejected.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Rejection failed.");
    } finally {
      setProcessing("");
    }
  };

  const handleDelete = async () => {
    const id = deleteTarget;
    setDeleteTarget(null);
    setProcessing(id);
    try {
      await deletePayment(id);
      setData(payments.filter((p) => p._id !== id));
      toast.success("Payment deleted.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete payment.");
    } finally {
      setProcessing("");
    }
  };

  const getPaymentType = (payment) => {
    const order = payment.order || {};
    if (payment.advance) return "Advance (50%)";
    if (order.paymentMethod === "advance") return "Advance (50%)";
    return "Full Payment";
  };

  const getPaymentAmount = (payment) => {
    const order = payment.order || {};
    if (payment.advance || order.paymentMethod === "advance") {
      return formatCurrency(order.advanceAmount || Math.round((order.total || 0) / 2));
    }
    return formatCurrency(order.total || 0);
  };

  const pending = payments.filter((p) => (p.method === "bank_transfer" || p.method === "advance") && p.status === "awaiting_verification");
  const history = payments.filter((p) => p.status !== "awaiting_verification");

  const PaymentCard = ({ payment }) => {
    const order = payment.order || {};
    const customer = order.customer || {};
    const bt = payment.bankTransfer || {};
    const type = getPaymentType(payment);
    const isOpen = expanded[payment._id];

    return (
      <div key={payment._id} className="rounded-lg border border-orange-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xl font-black">{order.orderNumber || "—"}</p>
              {!payment.order && <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">Orphaned</span>}
            </div>
            <p className="mt-1 text-sm text-gray-600">
              {customer.name || "—"} · {customer.phone || "—"} · {customer.email || "—"}
            </p>
            <p className="text-xs text-gray-500">
              {customer.address || ""}{customer.address && customer.district ? ", " : ""}{customer.district || ""}
            </p>
          </div>
          <div className="text-right">
            <OrderStatusBadge status={order.status || "—"} />
            <p className="mt-1 text-sm font-bold">{getPaymentAmount(payment)}</p>
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${
              type === "Advance (50%)" ? "bg-purple-50 text-purple-800" :
              "bg-emerald-50 text-emerald-800"
            }`}>{type}</span>
            <p className="mt-1 text-xs text-gray-400">{payment.method === "advance" ? "Advance" : "Bank Transfer"}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 rounded-lg bg-gray-50 p-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Bank</p>
            <p className="text-sm font-medium">{bt.bankName || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Account Name</p>
            <p className="text-sm font-medium">{bt.accountName || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Account Number</p>
            <p className="text-sm font-medium">{bt.accountNumber || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Branch</p>
            <p className="text-sm font-medium">{bt.branch || "—"}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {bt.slipUrl && (
            <a href={bt.slipUrl} target="_blank" rel="noreferrer" className="btn-secondary inline-flex text-sm">
              <ExternalLink className="h-4 w-4" /> View slip
            </a>
          )}
          <button className="btn-secondary text-sm" onClick={() => setExpanded({ ...expanded, [payment._id]: !isOpen })}>
            <Eye className="h-4 w-4" /> {isOpen ? "Hide details" : "View details"}
          </button>
        </div>

        {isOpen && (
          <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
            <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
              <div><span className="font-semibold text-gray-500">Payment #:</span> {payment._id.slice(-8).toUpperCase()}</div>
              <div><span className="font-semibold text-gray-500">Method:</span> {payment.method}</div>
              <div><span className="font-semibold text-gray-500">Status:</span> <span className={`font-bold ${payment.status === "verified" ? "text-emerald-600" : payment.status === "rejected" || payment.status === "failed" ? "text-red-600" : "text-amber-600"}`}>{payment.status}</span></div>
              <div><span className="font-semibold text-gray-500">Submitted:</span> {new Date(payment.createdAt).toLocaleString("en-LK")}</div>
              {payment.verifiedAt && <div><span className="font-semibold text-gray-500">Verified:</span> {new Date(payment.verifiedAt).toLocaleString("en-LK")}</div>}
              {payment.advance && (
                <>
                  <div><span className="font-semibold text-gray-500">Advance %:</span> {payment.advance.percentage}%</div>
                  <div><span className="font-semibold text-gray-500">Advance Amount:</span> {formatCurrency(payment.advance.amount)}</div>
                  {payment.advance.remainingAmount > 0 && <div><span className="font-semibold text-gray-500">Remaining:</span> {formatCurrency(payment.advance.remainingAmount)}</div>}
                </>
              )}
            </div>
            {order._id && (
              <div className="mt-3 border-t border-gray-200 pt-3">
                <p className="font-semibold text-gray-500">Order Details</p>
                <div className="mt-1 grid gap-x-6 gap-y-1 sm:grid-cols-2">
                  <div><span className="text-gray-400">Order #:</span> {order.orderNumber || order._id}</div>
                  <div><span className="text-gray-400">Subtotal:</span> {formatCurrency(order.subtotal)}</div>
                  <div><span className="text-gray-400">Delivery:</span> {formatCurrency(order.deliveryFee)}</div>
                  <div><span className="text-gray-400">Total:</span> {formatCurrency(order.total)}</div>
                  {order.advanceAmount > 0 && <div><span className="text-gray-400">Advance:</span> {formatCurrency(order.advanceAmount)}</div>}
                  {order.remainingBalance > 0 && <div><span className="text-gray-400">Remaining:</span> {formatCurrency(order.remainingBalance)}</div>}
                  {order.notes && <div className="sm:col-span-2"><span className="text-gray-400">Notes:</span> {order.notes}</div>}
                </div>
              </div>
            )}
          </div>
        )}

        {order.remainingBalance > 0 && type !== "Full Payment" && (
          <p className="mt-2 text-sm text-purple-600">
            On verify, order will be marked as "Awaiting Final Payment" ({formatCurrency(order.remainingBalance)} remaining)
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          <button className="btn-primary min-h-[44px]" disabled={processing === payment._id} onClick={() => handleVerify(payment._id)}>
            <Check className="h-4 w-4" /> {processing === payment._id ? "Verifying..." : "Verify Payment"}
          </button>
          <button className="btn-danger min-h-[44px]" disabled={processing === payment._id} onClick={() => setRejectTarget(payment._id)}>
            <X className="h-4 w-4" /> Reject
          </button>
          <button className="btn-secondary ml-auto text-red-600 hover:bg-red-50 min-h-[44px]" disabled={processing === payment._id} onClick={() => setDeleteTarget(payment._id)}>
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div>
        <h1 className="text-3xl font-black">Payment Verification</h1>
        <p className="mt-1 text-sm text-gray-600">Verify advance and full payment slips submitted by customers.</p>
      </div>

      {loading && <p className="mt-6 text-sm text-gray-600">Loading payments...</p>}
      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

      {!loading && !error && pending.length === 0 && history.length === 0 && (
        <p className="mt-6 rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-600">
          No payment records found.
        </p>
      )}

      {pending.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-bold text-orange-700">Pending Verification ({pending.length})</h2>
          <div className="mt-3 grid gap-4">
            {pending.map((payment) => <PaymentCard key={payment._id} payment={payment} />)}
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-gray-700">Payment History ({history.length})</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase text-gray-500">
                  <th className="py-2 pr-4">Order</th>
                  <th className="py-2 pr-4">Customer</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Slip</th>
                  <th className="py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {history.map((payment) => {
                  const order = payment.order || {};
                  const customer = order.customer || {};
                  return (
                    <tr key={payment._id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">{order.orderNumber || "—"}</td>
                      <td className="py-3 pr-4">{customer.name || "—"}</td>
                      <td className="py-3 pr-4">{getPaymentAmount(payment)}</td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${
                          getPaymentType(payment) === "Advance (50%)" ? "bg-purple-50 text-purple-800" : "bg-gray-100 text-gray-700"
                        }`}>{getPaymentType(payment)}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${
                          payment.status === "verified" ? "bg-emerald-50 text-emerald-800" :
                          payment.status === "rejected" || payment.status === "failed" ? "bg-red-50 text-red-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>{payment.status}</span>
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString("en-LK") : "—"}
                      </td>
                      <td className="py-3 pr-4">
                        {payment.bankTransfer?.slipUrl ? (
                          <a href={payment.bankTransfer.slipUrl} target="_blank" rel="noreferrer" className="btn-secondary inline-flex text-xs">
                            <ExternalLink className="h-3 w-3" /> Slip
                          </a>
                        ) : "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <button className="text-red-600 hover:text-red-800" disabled={processing === payment._id} onClick={() => setDeleteTarget(payment._id)}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <PromptDialog
        open={!!rejectTarget}
        title="Reject Payment"
        message="Provide a reason the customer will see in the notification email."
        placeholder="Why is this payment being rejected?..."
        confirmLabel="Reject Payment"
        cancelLabel="Cancel"
        onConfirm={handleReject}
        onCancel={() => setRejectTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Payment?"
        message="This will permanently remove this payment record. If the order is in 'Advance Payment Submitted' status, it will be moved back to the previous step."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default AdminPaymentVerificationPage;