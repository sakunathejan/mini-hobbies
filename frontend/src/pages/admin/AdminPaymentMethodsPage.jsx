import { Plus, Settings, Trash2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import Seo from "../../components/Seo.jsx";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import useFetch from "../../hooks/useFetch.js";
import { createPaymentMethod, deletePaymentMethod, getAllPaymentMethods, updatePaymentMethod } from "../../services/paymentMethodService.js";

const AdminPaymentMethodsPage = () => {
  const { data: _methods, setData, loading, error } = useFetch(getAllPaymentMethods, []);
  const methods = _methods || [];
  const [processing, setProcessing] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ name: "", code: "", requiresSlipUpload: false, supportsPartialPayment: false, isOnlineGateway: false });

  const handleToggle = async (method) => {
    setProcessing(method._id);
    try {
      const updated = await updatePaymentMethod(method._id, { enabled: !method.enabled });
      setData(methods.map((m) => (m._id === method._id ? updated : m)));
      toast.success(`${method.name} ${updated.enabled ? "enabled" : "disabled"}.`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update.");
    } finally {
      setProcessing("");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) {
      toast.error("Name and code are required.");
      return;
    }
    setProcessing("new");
    try {
      const method = await createPaymentMethod(form);
      setData([...methods, method]);
      setShowForm(false);
      setForm({ name: "", code: "", requiresSlipUpload: false, supportsPartialPayment: false, isOnlineGateway: false });
      toast.success("Payment method created.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not create payment method.");
    } finally {
      setProcessing("");
    }
  };

  const handleDelete = async () => {
    const id = deleteTarget;
    setDeleteTarget(null);
    setProcessing(id);
    try {
      await deletePaymentMethod(id);
      setData(methods.filter((m) => m._id !== id));
      toast.success("Payment method deleted.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete.");
    } finally {
      setProcessing("");
    }
  };

  return (
    <div>
      <Seo title="Payment Methods" description="Manage payment methods" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Payment Methods</h1>
          <p className="mt-1 text-sm text-gray-600">Enable, disable, or add new payment methods. Changes take effect immediately.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary min-h-[44px]">
          <Plus className="h-4 w-4" /> {showForm ? "Cancel" : "Add Method"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-bold">New Payment Method</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Name <span className="text-red-500">*</span></label>
              <input className="input mt-1 text-base" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Bank Transfer" />
            </div>
            <div>
              <label className="text-sm font-medium">Code <span className="text-red-500">*</span></label>
              <input className="input mt-1 text-base" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="bank_transfer" />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="h-4 w-4 accent-gray-900" checked={form.requiresSlipUpload} onChange={(e) => setForm({ ...form, requiresSlipUpload: e.target.checked })} />
              <span className="text-sm">Requires slip upload</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="h-4 w-4 accent-gray-900" checked={form.supportsPartialPayment} onChange={(e) => setForm({ ...form, supportsPartialPayment: e.target.checked })} />
              <span className="text-sm">Supports partial payment</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="h-4 w-4 accent-gray-900" checked={form.isOnlineGateway} onChange={(e) => setForm({ ...form, isOnlineGateway: e.target.checked })} />
              <span className="text-sm">Online gateway</span>
            </label>
          </div>
          <button disabled={processing === "new"} className="btn-primary mt-4 min-h-[44px]">
            {processing === "new" ? "Creating..." : "Create Payment Method"}
          </button>
        </form>
      )}

      {loading && <p className="mt-6 text-sm text-gray-600">Loading payment methods...</p>}
      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

      {!loading && !error && methods.length === 0 && (
        <p className="mt-6 rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-600">
          No payment methods configured yet. Click "Add Method" to create one.
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {methods.map((method) => (
          <div key={method._id} className={`rounded-lg border bg-white p-5 ${method.enabled ? "border-gray-200" : "border-gray-200 opacity-60"}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-lg font-black ${method.enabled ? "" : "text-gray-400"}`}>{method.name}</p>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${method.enabled ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
                    {method.enabled ? "Active" : "Disabled"}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-gray-500">Code: <code className="rounded bg-gray-100 px-1">{method.code}</code></p>
              </div>
              <button
                disabled={processing === method._id}
                onClick={() => setDeleteTarget(method._id)}
                className="rounded-md p-2 text-red-600 hover:bg-red-50 shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-500">
              {method.requiresSlipUpload && <span className="rounded bg-blue-50 px-2 py-1 text-blue-700">Slip upload</span>}
              {method.supportsPartialPayment && <span className="rounded bg-purple-50 px-2 py-1 text-purple-700">Partial payment</span>}
              {method.isOnlineGateway && <span className="rounded bg-cyan-50 px-2 py-1 text-cyan-700">Online gateway</span>}
              {method.type !== "custom" && <span className="rounded bg-gray-50 px-2 py-1 text-gray-600">{method.type}</span>}
            </div>

            <p className="mt-3 text-xs text-gray-400">
              Created {new Date(method.createdAt).toLocaleDateString("en-LK")}
            </p>

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => handleToggle(method)}
                disabled={processing === method._id}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${method.enabled ? "bg-emerald-500" : "bg-gray-300"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${method.enabled ? "translate-x-6" : "translate-x-1"}`} />
              </button>
              <span className="text-xs text-gray-500">{method.enabled ? "Click to disable" : "Click to enable"}</span>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Payment Method?"
        message="This will permanently remove this payment method. Existing orders using this method will not be affected."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default AdminPaymentMethodsPage;
