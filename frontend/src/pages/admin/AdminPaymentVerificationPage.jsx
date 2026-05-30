import { Check, ExternalLink, Square, Trash2, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import OrderStatusBadge from "../../components/orders/OrderStatusBadge.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import PromptDialog from "../../components/ui/PromptDialog.jsx";
import ViewToggle from "../../components/ui/ViewToggle.jsx";
import useFetch from "../../hooks/useFetch.js";
import { bulkDeletePayments, deletePayment, getPayments, rejectPayment, verifyPayment } from "../../services/paymentService.js";
import { formatCurrency } from "../../utils/formatters.js";

const AdminPaymentVerificationPage = () => {
  const { data, setData, loading, error } = useFetch(getPayments, []);
  const [processing, setProcessing] = useState("");
  const [rejectTarget, setRejectTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [view, setView] = useState(() => localStorage.getItem("admin_payments_view") || "list");
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleteTarget, setBulkDeleteTarget] = useState(null);

  const payments = Array.isArray(data) ? data : [];

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    setBulkDeleteTarget(null);
    try {
      await bulkDeletePayments(selectedIds);
      setData(payments.filter((p) => !selectedIds.includes(p._id)));
      setSelectedIds([]);
      toast.success(`${selectedIds.length} payment(s) deleted.`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Bulk delete failed.");
    }
  };

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
    if (payment.method === "cod") return "COD";
    if (payment.method === "advance") return "Advance (50%)";
    return "Full Payment";
  };

  const getPaymentAmount = (payment) => {
    const order = payment.order || {};
    if (payment.method === "advance") {
      return formatCurrency(order.advanceAmount || 0);
    }
    return formatCurrency(order.total || 0);
  };

  const pending = payments.filter((p) => (p.method === "bank_transfer" || p.method === "advance") && p.status === "awaiting_verification");
  const history = payments.filter((p) => p.status !== "awaiting_verification");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Payment Verification</h1>
          <p className="mt-1 text-sm text-gray-600">Verify advance and full payment slips submitted by customers.</p>
        </div>
        <ViewToggle view={view} onChange={setView} storageKey="admin_payments_view" />
      </div>

      {selectedIds.length > 0 && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <Square className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">{selectedIds.length} selected</span>
          <button onClick={() => setBulkDeleteTarget(true)}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition">
            <Trash2 className="mr-1 inline-block h-3.5 w-3.5" /> Delete Selected
          </button>
          <button onClick={() => setSelectedIds([])}
            className="ml-auto text-xs text-gray-500 hover:text-gray-700 underline">
            Clear selection
          </button>
        </div>
      )}

      {loading && <p className="mt-6 text-sm text-gray-600">Loading payments...</p>}
      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

      {!loading && !error && pending.length === 0 && history.length === 0 && (
        <p className="mt-6 rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-600">
          No payment records found.
        </p>
      )}

      {view === "list" ? (
        <>
          {pending.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-bold text-orange-700">Pending Verification ({pending.length})</h2>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="w-10 p-4">
                        <input type="checkbox" className="h-4 w-4 accent-gray-900 cursor-pointer"
                          checked={pending.length > 0 && pending.every((p) => selectedIds.includes(p._id))}
                          onChange={() => setSelectedIds(
                            pending.every((p) => selectedIds.includes(p._id))
                              ? selectedIds.filter((id) => !pending.some((p) => p._id === id))
                              : [...selectedIds, ...pending.map((p) => p._id).filter((id) => !selectedIds.includes(id))]
                          )} />
                      </th>
                      <th className="p-4">Order</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Bank</th>
                      <th className="p-4">Slip</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map((payment) => {
                      const order = payment.order || {};
                      const customer = order.customer || {};
                      const bt = payment.bankTransfer || {};
                      return (
                        <tr key={payment._id} className={`border-t ${selectedIds.includes(payment._id) ? "bg-blue-50" : ""}`}>
                          <td className="w-10 p-4">
                            <input type="checkbox" className="h-4 w-4 accent-gray-900 cursor-pointer"
                              checked={selectedIds.includes(payment._id)}
                              onChange={() => setSelectedIds(
                                selectedIds.includes(payment._id)
                                  ? selectedIds.filter((id) => id !== payment._id)
                                  : [...selectedIds, payment._id]
                              )} />
                          </td>
                          <td className="p-4 font-medium">{order.orderNumber || "—"}</td>
                          <td className="p-4">
                            <p className="font-medium">{customer.name || "—"}</p>
                            <p className="text-xs text-gray-500">{customer.phone || ""}</p>
                          </td>
                          <td className="p-4 font-bold">{getPaymentAmount(payment)}</td>
                          <td className="p-4">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${
                              getPaymentType(payment) === "Advance (50%)" ? "bg-purple-50 text-purple-800" : "bg-emerald-50 text-emerald-800"
                            }`}>{getPaymentType(payment)}</span>
                          </td>
                          <td className="p-4 text-sm">{bt.bankName || "—"}</td>
                          <td className="p-4">
                            {bt.slipUrl ? (
                              <a href={bt.slipUrl} target="_blank" rel="noreferrer" className="btn-secondary inline-flex text-xs"><ExternalLink className="h-3 w-3" /> View</a>
                            ) : "—"}
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <button className="btn-primary text-xs min-h-[36px]" disabled={processing === payment._id} onClick={() => handleVerify(payment._id)}>
                                <Check className="h-3 w-3" /> {processing === payment._id ? "..." : "Verify"}
                              </button>
                              <button className="btn-danger text-xs min-h-[36px]" disabled={processing === payment._id} onClick={() => setRejectTarget(payment._id)}>
                                <X className="h-3 w-3" /> Reject
                              </button>
                              <button className="rounded-md p-2 text-red-600 hover:bg-red-50" disabled={processing === payment._id} onClick={() => setDeleteTarget(payment._id)}>
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
            </div>
          )}

          {history.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-bold text-gray-700">Payment History ({history.length})</h2>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="w-10 p-4">
                        <input type="checkbox" className="h-4 w-4 accent-gray-900 cursor-pointer"
                          checked={history.length > 0 && history.every((p) => selectedIds.includes(p._id))}
                          onChange={() => setSelectedIds(
                            history.every((p) => selectedIds.includes(p._id))
                              ? selectedIds.filter((id) => !history.some((p) => p._id === id))
                              : [...selectedIds, ...history.map((p) => p._id).filter((id) => !selectedIds.includes(id))]
                          )} />
                      </th>
                      <th className="p-4">Order</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Slip</th>
                      <th className="p-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((payment) => {
                      const order = payment.order || {};
                      const customer = order.customer || {};
                      return (
                        <tr key={payment._id} className={`border-t last:border-0 ${selectedIds.includes(payment._id) ? "bg-blue-50" : ""}`}>
                          <td className="w-10 p-4">
                            <input type="checkbox" className="h-4 w-4 accent-gray-900 cursor-pointer"
                              checked={selectedIds.includes(payment._id)}
                              onChange={() => setSelectedIds(
                                selectedIds.includes(payment._id)
                                  ? selectedIds.filter((id) => id !== payment._id)
                                  : [...selectedIds, payment._id]
                              )} />
                          </td>
                          <td className="p-4 font-medium">{order.orderNumber || "—"}</td>
                          <td className="p-4">{customer.name || "—"}</td>
                          <td className="p-4">{getPaymentAmount(payment)}</td>
                          <td className="p-4">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${
                              getPaymentType(payment) === "Advance (50%)" ? "bg-purple-50 text-purple-800" : "bg-gray-100 text-gray-700"
                            }`}>{getPaymentType(payment)}</span>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${
                              payment.status === "verified" ? "bg-emerald-50 text-emerald-800" :
                              payment.status === "rejected" || payment.status === "failed" ? "bg-red-50 text-red-700" :
                              "bg-gray-100 text-gray-700"
                            }`}>{payment.status}</span>
                          </td>
                          <td className="p-4 text-gray-600">
                            {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString("en-LK") : "—"}
                          </td>
                          <td className="p-4">
                            {payment.bankTransfer?.slipUrl ? (
                              <a href={payment.bankTransfer.slipUrl} target="_blank" rel="noreferrer" className="btn-secondary inline-flex text-xs"><ExternalLink className="h-3 w-3" /> Slip</a>
                            ) : "—"}
                          </td>
                          <td className="p-4">
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
        </>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-bold text-orange-700">Pending Verification ({pending.length})</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {pending.map((payment) => (
                  <PaymentCard
                    key={payment._id}
                    payment={payment}
                    getPaymentAmount={getPaymentAmount}
                    getPaymentType={getPaymentType}
                    handleVerify={handleVerify}
                    setRejectTarget={setRejectTarget}
                    setDeleteTarget={setDeleteTarget}
                    processing={processing}
                  />
                ))}
              </div>
            </div>
          )}

          {history.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-bold text-gray-700">Payment History ({history.length})</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {history.map((payment) => (
                  <HistoryCard
                    key={payment._id}
                    payment={payment}
                    getPaymentAmount={getPaymentAmount}
                    getPaymentType={getPaymentType}
                    setDeleteTarget={setDeleteTarget}
                    processing={processing}
                  />
                ))}
              </div>
            </div>
          )}
        </>
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

      <ConfirmDialog
        open={!!bulkDeleteTarget}
        title={`Delete ${selectedIds.length} payments?`}
        message={`This will permanently remove ${selectedIds.length} payment records. Related orders will be reverted if applicable. This cannot be undone.`}
        confirmLabel={`Delete ${selectedIds.length} payments`}
        cancelLabel="Cancel"
        destructive
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleteTarget(null)}
      />
    </div>
  );
};

const PaymentCard = ({ payment, getPaymentAmount, getPaymentType, handleVerify, setRejectTarget, setDeleteTarget, processing }) => {
  const order = payment.order || {};
  const customer = order.customer || {};
  const bt = payment.bankTransfer || {};
  const type = getPaymentType(payment);

  return (
    <div className="rounded-lg border border-orange-200 bg-white p-5">
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
            type === "Advance (50%)" ? "bg-purple-50 text-purple-800" : "bg-emerald-50 text-emerald-800"
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
      </div>

      {order.remainingBalance > 0 && type === "Advance (50%)" && (
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

const HistoryCard = ({ payment, getPaymentAmount, getPaymentType, setDeleteTarget, processing }) => {
  const order = payment.order || {};
  const customer = order.customer || {};
  const bt = payment.bankTransfer || {};

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-lg font-bold">{order.orderNumber || "—"}</p>
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${
              payment.status === "verified" ? "bg-emerald-50 text-emerald-800" :
              payment.status === "rejected" || payment.status === "failed" ? "bg-red-50 text-red-700" :
              "bg-gray-100 text-gray-700"
            }`}>{payment.status}</span>
          </div>
          <p className="mt-1 text-sm text-gray-600">{customer.name || "—"} · {customer.phone || "—"}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold">{getPaymentAmount(payment)}</p>
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${
            getPaymentType(payment) === "Advance (50%)" ? "bg-purple-50 text-purple-800" : "bg-gray-100 text-gray-700"
          }`}>{getPaymentType(payment)}</span>
          <p className="mt-1 text-xs text-gray-400">
            {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString("en-LK") : "—"}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          {bt.slipUrl && (
            <a href={bt.slipUrl} target="_blank" rel="noreferrer" className="btn-secondary inline-flex text-sm">
              <ExternalLink className="h-4 w-4" /> View slip
            </a>
          )}
        </div>
        <button className="rounded-md p-2 text-red-600 hover:bg-red-50" disabled={processing === payment._id} onClick={() => setDeleteTarget(payment._id)}>
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default AdminPaymentVerificationPage;
