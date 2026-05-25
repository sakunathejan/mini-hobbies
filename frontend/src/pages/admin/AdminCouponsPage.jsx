import { useState } from "react";
import toast from "react-hot-toast";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import useFetch from "../../hooks/useFetch.js";
import { createCoupon, deleteCoupon, getCoupons } from "../../services/couponService.js";

const AdminCouponsPage = () => {
  const { data, setData, loading } = useFetch(getCoupons, []);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({
    code: "", type: "percentage", value: "", minOrder: "0",
    maxDiscount: "0", usageLimit: "0", expiresAt: ""
  });

  const coupons = Array.isArray(data) ? data : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        code: form.code,
        type: form.type,
        value: Number(form.value),
        minOrder: Number(form.minOrder),
        maxDiscount: Number(form.maxDiscount),
        usageLimit: Number(form.usageLimit),
        expiresAt: form.expiresAt || undefined
      };
      const coupon = await createCoupon(payload);
      setData([coupon, ...coupons]);
      setForm({ code: "", type: "percentage", value: "", minOrder: "0", maxDiscount: "0", usageLimit: "0", expiresAt: "" });
      toast.success("Coupon created.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not create coupon.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCoupon(deleteTarget);
      setData(coupons.filter((c) => c._id !== deleteTarget));
      toast.success("Coupon deleted.");
    } catch (err) {
      toast.error("Could not delete coupon.");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-black">Coupons</h1>
      <p className="mt-1 text-sm text-gray-600">Create and manage discount coupon codes.</p>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-lg font-bold">Add Coupon</h2>
          <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-medium">Code</label>
              <input className="input mt-1 uppercase" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="SAVE10" required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Type</label>
                <select className="input mt-1 text-base" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Value</label>
                <input className="input mt-1 text-base" type="number" min="0" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder={form.type === "percentage" ? "10" : "500"} required />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Min Order</label>
                <input className="input mt-1 text-base" type="number" min="0" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Max Discount (0 = no limit)</label>
                <input className="input mt-1 text-base" type="number" min="0" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Usage Limit (0 = unlimited)</label>
                <input className="input mt-1 text-base" type="number" min="0" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Expires At</label>
                <input className="input mt-1 text-base" type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
              </div>
            </div>
            <button className="btn-primary mt-2 w-full min-h-[48px]" disabled={saving}>{saving ? "Saving..." : "Create Coupon"}</button>
          </form>
        </div>

        <div>
          {loading ? (
            <p className="text-sm text-gray-600">Loading...</p>
          ) : coupons.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-600">No coupons yet.</p>
          ) : (
            <div className="grid gap-3">
              {coupons.map((coupon) => (
                <div key={coupon._id} className="rounded-lg border bg-white p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold uppercase tracking-wide">{coupon.code}</p>
                      <p className="text-sm text-gray-600">
                        {coupon.type === "percentage" ? `${coupon.value}% off` : `${coupon.value} LKR off`}
                        {coupon.minOrder > 0 && ` (min: ${coupon.minOrder})`}
                      </p>
                      <p className="text-xs text-gray-500">
                        Used: {coupon.usedCount}{coupon.usageLimit > 0 ? `/${coupon.usageLimit}` : ""}
                        {coupon.expiresAt && ` · Expires: ${new Date(coupon.expiresAt).toLocaleDateString("en-LK")}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${coupon.isActive ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
                        {coupon.isActive ? "Active" : "Inactive"}
                      </span>
                      <button className="text-sm text-red-600 hover:underline" onClick={() => setDeleteTarget(coupon._id)}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete coupon?"
        message="Are you sure you want to delete this coupon? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default AdminCouponsPage;
